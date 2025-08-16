-- DIAGNOSTIC COMPLET DU PROBLÈME D'INSCRIPTION

-- 1. Vérifier les triggers sur auth.users
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' AND trigger_schema = 'auth';

-- 2. Vérifier si il y a des erreurs dans les logs (si accessible)
SELECT 
    schemaname,
    tablename,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE schemaname = 'auth' AND tablename = 'users';

-- 3. Vérifier la structure de la table user_profiles
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 4. Vérifier les contraintes sur user_profiles
SELECT 
    conname,
    contype,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'public.user_profiles'::regclass;

-- 5. Créer un trigger simple pour remplacer celui qui pose problème
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (
    user_id,
    prenom,
    nom,
    email,
    profil_complet,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'prenom', ''),
    COALESCE(NEW.raw_user_meta_data->>'nom', ''),
    NEW.email,
    false,
    NOW(),
    NOW()
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log l'erreur mais ne pas faire échouer l'inscription
  RAISE WARNING 'Erreur lors de la création du profil pour l''utilisateur %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger avec gestion d'erreur
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Tester que le trigger fonctionne
-- (Vous pourrez tester avec une inscription réelle)

-- 7. Alternative : Désactiver complètement le trigger automatique si le problème persiste
-- et laisser le code frontend créer les profils manuellement
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;