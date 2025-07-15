-- Script simple pour résoudre le problème de stack overflow
-- Le problème semble être dans les politiques RLS qui causent des requêtes récursives

-- Désactiver temporairement RLS sur etat_des_lieux
ALTER TABLE etat_des_lieux DISABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes
DROP POLICY IF EXISTS "Enable access to user's own etat_des_lieux" ON etat_des_lieux;
DROP POLICY IF EXISTS "Users can manage their own etat_des_lieux" ON etat_des_lieux;
DROP POLICY IF EXISTS "Users can view their own etat_des_lieux" ON etat_des_lieux;

-- Supprimer les triggers qui pourraient causer des problèmes
DROP TRIGGER IF EXISTS trigger_update_rendez_vous_statut ON etat_des_lieux;

-- Recréer la fonction trigger de manière plus simple
CREATE OR REPLACE FUNCTION update_rendez_vous_statut_simple()
RETURNS TRIGGER AS $$
BEGIN
    -- Éviter la récursion en utilisant une mise à jour conditionnelle
    IF NEW.rendez_vous_id IS NOT NULL THEN
        -- Vérifier si le rendez-vous existe et n'est pas déjà à 'realise'
        UPDATE rendez_vous 
        SET statut = 'realise',
            etat_des_lieux_id = NEW.id
        WHERE id = NEW.rendez_vous_id 
        AND statut != 'realise';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recréer le trigger avec la nouvelle fonction
CREATE TRIGGER trigger_update_rendez_vous_statut_simple
    AFTER INSERT ON etat_des_lieux
    FOR EACH ROW
    EXECUTE FUNCTION update_rendez_vous_statut_simple();

-- Réactiver RLS avec une politique simple
ALTER TABLE etat_des_lieux ENABLE ROW LEVEL SECURITY;

-- Créer une politique simple qui ne cause pas de récursion
CREATE POLICY "simple_user_access" ON etat_des_lieux
    FOR ALL USING (
        user_id = auth.uid()
    );

-- Vérifier que la table rendez_vous a aussi une politique simple
ALTER TABLE rendez_vous DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable access to user's own rendez_vous" ON rendez_vous;
DROP POLICY IF EXISTS "Users can manage their own rendez_vous" ON rendez_vous;
DROP POLICY IF EXISTS "Users can view their own rendez_vous" ON rendez_vous;

ALTER TABLE rendez_vous ENABLE ROW LEVEL SECURITY;

CREATE POLICY "simple_rendez_vous_access" ON rendez_vous
    FOR ALL USING (
        user_id = auth.uid()
    );

-- Analyser les tables pour optimiser les requêtes
ANALYZE etat_des_lieux;
ANALYZE rendez_vous;