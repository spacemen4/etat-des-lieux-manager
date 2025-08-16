-- Script de diagnostic pour identifier le problème d'inscription
-- Exécutez ces requêtes une par une dans le SQL Editor de Supabase

-- 1. Vérifier l'état des triggers sur auth.users
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing,
    trigger_schema,
    event_object_table as table_name
FROM information_schema.triggers 
WHERE event_object_table = 'users' AND trigger_schema = 'auth';

-- 2. Vérifier l'état de la table user_profiles
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 3. Vérifier les contraintes sur user_profiles
SELECT 
    constraint_name,
    constraint_type,
    table_name,
    column_name
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_schema = 'public' AND tc.table_name = 'user_profiles';

-- 4. Vérifier les politiques RLS sur user_profiles
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'user_profiles';

-- 5. Vérifier si RLS est activé sur user_profiles
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    forcerowsecurity
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'user_profiles';

-- 6. Tester la fonction trigger create_user_profile directement
-- Remplacez 'TEST_USER_ID' par un UUID valide pour tester
-- SELECT create_user_profile();

-- 7. Vérifier s'il y a des enregistrements orphelins
SELECT COUNT(*) as orphaned_profiles
FROM user_profiles up
LEFT JOIN auth.users au ON up.user_id = au.id
WHERE au.id IS NULL;

-- 8. Vérifier les permissions sur la table user_profiles
SELECT 
    table_schema,
    table_name,
    privilege_type,
    grantee
FROM information_schema.table_privileges 
WHERE table_schema = 'public' AND table_name = 'user_profiles'
ORDER BY privilege_type, grantee;

-- 9. Vérifier si la fonction create_user_profile existe et sa définition
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name = 'create_user_profile';

-- 10. Vérifier les erreurs récentes dans les logs (si accessible)
-- Cette requête peut ne pas fonctionner selon les permissions
-- SELECT * FROM pg_stat_statements WHERE query LIKE '%user_profiles%' ORDER BY last_exec_time DESC LIMIT 10;

-- 11. Test de création manuelle d'un profil pour voir l'erreur exacte
-- ATTENTION: Ne lancez ceci que si vous voulez tester manuellement
-- INSERT INTO user_profiles (user_id, prenom, nom) VALUES ('00000000-0000-0000-0000-000000000000', 'Test', 'User');