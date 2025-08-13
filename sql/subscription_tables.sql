-- Table pour stocker les abonnements des utilisateurs
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    plan_id TEXT NOT NULL CHECK (plan_id IN ('free', 'essential', 'pro')),
    status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'incomplete')) DEFAULT 'active',
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '1 month'),
    stripe_subscription_id TEXT,
    stripe_customer_id TEXT,
    stripe_price_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT unique_active_subscription_per_user UNIQUE (user_id, status) DEFERRABLE INITIALLY DEFERRED,
    
    -- Index
    INDEX idx_user_subscriptions_user_id (user_id),
    INDEX idx_user_subscriptions_stripe_subscription_id (stripe_subscription_id),
    INDEX idx_user_subscriptions_stripe_customer_id (stripe_customer_id)
);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER update_user_subscriptions_updated_at 
    BEFORE UPDATE ON user_subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Table pour l'historique des paiements (optionnel)
CREATE TABLE IF NOT EXISTS payment_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    subscription_id UUID REFERENCES user_subscriptions(id),
    stripe_payment_intent_id TEXT,
    amount INTEGER NOT NULL, -- en centimes
    currency TEXT NOT NULL DEFAULT 'eur',
    status TEXT NOT NULL CHECK (status IN ('succeeded', 'failed', 'pending', 'canceled')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Index
    INDEX idx_payment_history_user_id (user_id),
    INDEX idx_payment_history_subscription_id (subscription_id),
    INDEX idx_payment_history_stripe_payment_intent_id (stripe_payment_intent_id)
);

-- Table pour stocker les limites d'usage (cache pour optimiser les performances)
CREATE TABLE IF NOT EXISTS usage_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    biens_count INTEGER DEFAULT 0,
    etats_des_lieux_count_current_month INTEGER DEFAULT 0,
    photos_count_total INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Index
    INDEX idx_usage_tracking_user_id (user_id)
);

-- Fonction pour mettre à jour les statistiques d'usage
CREATE OR REPLACE FUNCTION update_usage_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Mettre à jour le nombre de biens
    INSERT INTO usage_tracking (user_id, biens_count, etats_des_lieux_count_current_month)
    VALUES (
        COALESCE(NEW.user_id, OLD.user_id),
        (SELECT COUNT(DISTINCT adresse_bien) FROM etat_des_lieux WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)),
        (SELECT COUNT(*) FROM etat_des_lieux 
         WHERE user_id = COALESCE(NEW.user_id, OLD.user_id) 
         AND created_at >= date_trunc('month', CURRENT_DATE))
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        biens_count = EXCLUDED.biens_count,
        etats_des_lieux_count_current_month = EXCLUDED.etats_des_lieux_count_current_month,
        last_updated = NOW();
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour automatiquement les statistiques d'usage
CREATE TRIGGER update_usage_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE ON etat_des_lieux
    FOR EACH ROW EXECUTE FUNCTION update_usage_stats();

-- RLS (Row Level Security) pour user_subscriptions
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Politique RLS : les utilisateurs peuvent voir et modifier seulement leurs propres abonnements
CREATE POLICY user_subscriptions_policy ON user_subscriptions
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- RLS pour payment_history
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY payment_history_policy ON payment_history
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- RLS pour usage_tracking
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY usage_tracking_policy ON usage_tracking
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Fonction pour obtenir les limites du plan
CREATE OR REPLACE FUNCTION get_plan_limits(plan_id TEXT)
RETURNS JSON AS $$
BEGIN
    RETURN CASE plan_id
        WHEN 'free' THEN '{
            "maxBiens": 1,
            "maxEtatsDesLieux": 1,
            "maxPhotosPerBien": 10,
            "supportLevel": "community"
        }'::JSON
        WHEN 'essential' THEN '{
            "maxBiens": 5,
            "maxEtatsDesLieux": 5,
            "maxPhotosPerBien": 50,
            "supportLevel": "email"
        }'::JSON
        WHEN 'pro' THEN '{
            "maxBiens": 100,
            "maxEtatsDesLieux": 50,
            "maxPhotosPerBien": 200,
            "supportLevel": "priority",
            "teamManagement": true
        }'::JSON
        ELSE '{
            "maxBiens": 1,
            "maxEtatsDesLieux": 1,
            "maxPhotosPerBien": 10,
            "supportLevel": "community"
        }'::JSON
    END;
END;
$$ language 'plpgsql';

-- Fonction pour vérifier si un utilisateur peut créer un nouveau bien
CREATE OR REPLACE FUNCTION can_create_bien(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_plan TEXT;
    plan_limits JSON;
    current_count INTEGER;
BEGIN
    -- Obtenir le plan actuel de l'utilisateur
    SELECT COALESCE(s.plan_id, 'free')
    INTO current_plan
    FROM user_subscriptions s
    WHERE s.user_id = user_uuid AND s.status = 'active'
    ORDER BY s.created_at DESC
    LIMIT 1;
    
    -- Obtenir les limites du plan
    plan_limits := get_plan_limits(current_plan);
    
    -- Compter les biens actuels
    SELECT COUNT(DISTINCT adresse_bien)
    INTO current_count
    FROM etat_des_lieux
    WHERE user_id = user_uuid;
    
    -- Vérifier si l'utilisateur peut créer un nouveau bien
    RETURN current_count < (plan_limits->>'maxBiens')::INTEGER;
END;
$$ language 'plpgsql';

-- Fonction pour vérifier si un utilisateur peut créer un nouvel état des lieux
CREATE OR REPLACE FUNCTION can_create_etat_des_lieux(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_plan TEXT;
    plan_limits JSON;
    current_count INTEGER;
BEGIN
    -- Obtenir le plan actuel de l'utilisateur
    SELECT COALESCE(s.plan_id, 'free')
    INTO current_plan
    FROM user_subscriptions s
    WHERE s.user_id = user_uuid AND s.status = 'active'
    ORDER BY s.created_at DESC
    LIMIT 1;
    
    -- Obtenir les limites du plan
    plan_limits := get_plan_limits(current_plan);
    
    -- Compter les états des lieux de ce mois
    SELECT COUNT(*)
    INTO current_count
    FROM etat_des_lieux
    WHERE user_id = user_uuid 
    AND created_at >= date_trunc('month', CURRENT_DATE);
    
    -- Vérifier si l'utilisateur peut créer un nouvel état des lieux
    RETURN current_count < (plan_limits->>'maxEtatsDesLieux')::INTEGER;
END;
$$ language 'plpgsql';