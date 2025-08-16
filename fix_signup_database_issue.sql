-- Script de correction pour résoudre le problème d'inscription
-- EXÉCUTEZ CES COMMANDES UNE PAR UNE dans le SQL Editor de Supabase

-- ========================================
-- ÉTAPE 1: DIAGNOSTIC ET NETTOYAGE
-- ========================================

-- Désactiver temporairement RLS pour le nettoyage
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Vérifier les triggers existants
SELECT trigger_name, event_manipulation, action_timing, action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'users' AND trigger_schema = 'auth';

-- Supprimer le trigger problématique s'il existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Supprimer l'ancienne fonction trigger qui pourrait être cassée
DROP FUNCTION IF EXISTS create_user_profile();

-- ========================================
-- ÉTAPE 2: NETTOYER LES DONNÉES CORROMPUES
-- ========================================

-- Supprimer les profils orphelins (sans utilisateur auth correspondant)
DELETE FROM user_profiles 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Supprimer les utilisateurs auth sans profil ET qui ne peuvent pas être créés
-- ATTENTION: Ceci supprimera les utilisateurs partiellement créés
DELETE FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM user_profiles WHERE user_id IS NOT NULL)
AND created_at > NOW() - INTERVAL '1 hour'; -- Seulement les récents

-- ========================================
-- ÉTAPE 3: RECRÉER LA FONCTION TRIGGER SIMPLIFIÉE
-- ========================================

CREATE OR REPLACE FUNCTION create_user_profile_safe()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Utiliser un bloc TRY/CATCH pour éviter les erreurs fatales
    BEGIN
        -- Vérifier si le profil existe déjà
        IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_id = NEW.id) THEN
            -- Insérer le profil avec des valeurs par défaut sûres
            INSERT INTO user_profiles (
                user_id, 
                prenom, 
                nom, 
                profil_complet,
                created_at,
                updated_at
            ) VALUES (
                NEW.id,
                COALESCE(NEW.raw_user_meta_data->>'prenom', NEW.raw_user_meta_data->>'first_name', ''),
                COALESCE(NEW.raw_user_meta_data->>'nom', NEW.raw_user_meta_data->>'last_name', ''),
                false,
                NOW(),
                NOW()
            );
        END IF;
    EXCEPTION 
        WHEN unique_violation THEN
            -- Si le profil existe déjà, ne rien faire
            NULL;
        WHEN OTHERS THEN
            -- Pour toute autre erreur, logger mais ne pas échouer
            RAISE WARNING 'Could not create user profile for user %: %', NEW.id, SQLERRM;
    END;
    
    RETURN NEW;
END;
$$;

-- ========================================
-- ÉTAPE 4: RECRÉER LE TRIGGER DE MANIÈRE SÛRE
-- ========================================

CREATE TRIGGER on_auth_user_created_safe
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION create_user_profile_safe();

-- ========================================
-- ÉTAPE 5: RECONFIGURER RLS DE MANIÈRE SIMPLE
-- ========================================

-- Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS user_profiles_policy ON user_profiles;
DROP POLICY IF EXISTS "Users can access their own profiles" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON user_profiles;

-- Réactiver RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Créer une politique simple et efficace
CREATE POLICY "user_profiles_simple_policy" ON user_profiles
    FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ========================================
-- ÉTAPE 6: ACCORDER LES PERMISSIONS NÉCESSAIRES
-- ========================================

-- S'assurer que les permissions sont correctes
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON user_profiles TO service_role;

-- ========================================
-- ÉTAPE 7: TESTER LA CONFIGURATION
-- ========================================

-- Vérifier que la fonction existe
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name = 'create_user_profile_safe';

-- Vérifier que le trigger existe
SELECT trigger_name, event_manipulation, action_timing 
FROM information_schema.triggers 
WHERE event_object_table = 'users' AND trigger_schema = 'auth' AND trigger_name = 'on_auth_user_created_safe';

-- Vérifier les politiques RLS
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'user_profiles';

-- ========================================
-- ÉTAPE 8: NETTOYAGE FINAL
-- ========================================

-- Analyser la table pour optimiser les performances
ANALYZE user_profiles;

-- Message de confirmation
SELECT 'Configuration terminée - vous pouvez maintenant tester l''inscription' as status;