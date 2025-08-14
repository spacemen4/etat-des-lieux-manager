-- Table pour les profils utilisateurs complets
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    
    -- Informations personnelles étendues
    prenom TEXT,
    nom TEXT,
    date_naissance DATE,
    telephone TEXT,
    telephone_fixe TEXT,
    
    -- Adresse complète
    adresse_ligne_1 TEXT,
    adresse_ligne_2 TEXT,
    code_postal TEXT,
    ville TEXT,
    pays TEXT DEFAULT 'France',
    
    -- Informations professionnelles
    profession TEXT,
    entreprise TEXT,
    siret TEXT,
    tva_intra TEXT,
    
    -- Informations immobilières
    type_activite TEXT CHECK (type_activite IN ('particulier', 'agent_immobilier', 'proprietaire', 'syndic', 'gestionnaire', 'autre')),
    carte_professionnelle TEXT,
    numero_rcp TEXT, -- Responsabilité Civile Professionnelle
    
    -- Photo de profil
    photo_url TEXT,
    
    -- Préférences
    notifications_email BOOLEAN DEFAULT true,
    notifications_sms BOOLEAN DEFAULT false,
    langue TEXT DEFAULT 'fr',
    timezone TEXT DEFAULT 'Europe/Paris',
    
    -- Signature numérique
    signature_url TEXT,
    
    -- Bio et notes
    bio TEXT,
    notes_privees TEXT,
    
    -- Métadonnées
    profil_complet BOOLEAN DEFAULT false,
    derniere_connexion TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_type_activite ON user_profiles (type_activite);
CREATE INDEX IF NOT EXISTS idx_user_profiles_profil_complet ON user_profiles (profil_complet);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    
    -- Calculer automatiquement si le profil est complet
    NEW.profil_complet = (
        NEW.prenom IS NOT NULL AND NEW.prenom != '' AND
        NEW.nom IS NOT NULL AND NEW.nom != '' AND
        NEW.telephone IS NOT NULL AND NEW.telephone != '' AND
        NEW.adresse_ligne_1 IS NOT NULL AND NEW.adresse_ligne_1 != '' AND
        NEW.code_postal IS NOT NULL AND NEW.code_postal != '' AND
        NEW.ville IS NOT NULL AND NEW.ville != '' AND
        NEW.type_activite IS NOT NULL
    );
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour updated_at et profil_complet automatiquement
CREATE TRIGGER update_user_profiles_updated_at_trigger
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_user_profiles_updated_at();

-- RLS (Row Level Security) pour user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Politique RLS : les utilisateurs peuvent voir et modifier seulement leur propre profil
CREATE POLICY user_profiles_policy ON user_profiles
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Fonction pour créer un profil automatiquement lors de l'inscription
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (user_id, prenom, nom)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'prenom', NEW.raw_user_meta_data->>'first_name'),
        COALESCE(NEW.raw_user_meta_data->>'nom', NEW.raw_user_meta_data->>'last_name')
    );
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour créer automatiquement un profil lors de l'inscription
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- Vue pour avoir une vue d'ensemble des utilisateurs
CREATE OR REPLACE VIEW user_profiles_summary AS
SELECT 
    up.user_id,
    au.email,
    up.prenom,
    up.nom,
    up.telephone,
    up.entreprise,
    up.type_activite,
    up.profil_complet,
    up.derniere_connexion,
    up.created_at,
    up.updated_at
FROM user_profiles up
JOIN auth.users au ON up.user_id = au.id;