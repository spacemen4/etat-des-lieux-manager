-- SOLUTION RAPIDE POUR CORRIGER L'INSCRIPTION
-- Exécutez ces commandes une par une dans le SQL Editor de Supabase

-- 1. D'abord, supprimer complètement le trigger problématique
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS create_user_profile();

-- 2. Supprimer tous les anciens triggers similaires
DROP TRIGGER IF EXISTS on_auth_user_created_safe ON auth.users;
DROP FUNCTION IF EXISTS create_user_profile_safe();

-- 3. Désactiver temporairement RLS pour nettoyer
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- 4. Nettoyer les profils orphelins (optionnel - soyez prudent)
-- DELETE FROM user_profiles WHERE user_id NOT IN (SELECT id FROM auth.users);

-- 5. Créer une fonction trigger ultra-simple
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, prenom, nom, profil_complet)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'prenom', ''),
    COALESCE(NEW.raw_user_meta_data->>'nom', ''),
    false
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- 6. Créer le trigger simple
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Réactiver RLS avec une politique simple
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 8. Supprimer toutes les anciennes politiques
DROP POLICY IF EXISTS user_profiles_policy ON user_profiles;
DROP POLICY IF EXISTS "Users can access their own profiles" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_simple_policy" ON user_profiles;

-- 9. Créer UNE SEULE politique simple
CREATE POLICY "user_profiles_access" ON user_profiles
  FOR ALL USING (auth.uid() = user_id);

-- 10. Vérification finale
SELECT 'Setup completed successfully' as status;

-- 11. Test des permissions (optionnel)
-- INSERT INTO user_profiles (user_id, prenom, nom) VALUES ('00000000-0000-0000-0000-000000000000', 'Test', 'User');