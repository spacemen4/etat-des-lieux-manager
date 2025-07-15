-- SOLUTION D'URGENCE : Désactiver complètement RLS sur etat_des_lieux temporairement
-- Cela va permettre de faire fonctionner l'application pendant qu'on trouve une solution définitive

-- Désactiver RLS sur etat_des_lieux
ALTER TABLE etat_des_lieux DISABLE ROW LEVEL SECURITY;

-- Supprimer toutes les politiques
DROP POLICY IF EXISTS "simple_user_access" ON etat_des_lieux;
DROP POLICY IF EXISTS "Enable access to user's own etat_des_lieux" ON etat_des_lieux;
DROP POLICY IF EXISTS "Users can manage their own etat_des_lieux" ON etat_des_lieux;
DROP POLICY IF EXISTS "Users can view their own etat_des_lieux" ON etat_des_lieux;

-- Supprimer le trigger problématique
DROP TRIGGER IF EXISTS trigger_update_rendez_vous_statut ON etat_des_lieux;
DROP TRIGGER IF EXISTS trigger_update_rendez_vous_statut_simple ON etat_des_lieux;

-- Supprimer la fonction qui cause le problème
DROP FUNCTION IF EXISTS update_rendez_vous_statut();
DROP FUNCTION IF EXISTS update_rendez_vous_statut_simple();

-- Vérifier l'état de la table
SELECT COUNT(*) as total_records FROM etat_des_lieux;
SELECT COUNT(*) as user_records FROM etat_des_lieux WHERE user_id = auth.uid();

-- Nettoyer la table en supprimant les enregistrements qui pourraient causer des problèmes
-- (ATTENTION : Ceci supprimera les données, assurez-vous d'avoir une sauvegarde)
-- DELETE FROM etat_des_lieux WHERE user_id IS NULL;

-- Recréer un trigger simple qui ne cause pas de récursion
CREATE OR REPLACE FUNCTION update_rendez_vous_status_safe()
RETURNS TRIGGER AS $$
BEGIN
    -- Mise à jour simple sans récursion
    IF NEW.rendez_vous_id IS NOT NULL THEN
        UPDATE rendez_vous 
        SET statut = 'realise'
        WHERE id = NEW.rendez_vous_id 
          AND statut != 'realise';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER safe_rendez_vous_update
    AFTER INSERT ON etat_des_lieux
    FOR EACH ROW
    EXECUTE FUNCTION update_rendez_vous_status_safe();

-- Analyser la table pour optimiser
ANALYZE etat_des_lieux;