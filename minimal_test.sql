-- TEST MINIMAL POUR IDENTIFIER LE PROBLÈME EXACT

-- 1. Vérifier les triggers existants sur auth.users
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    trigger_schema,
    event_object_table
FROM information_schema.triggers 
WHERE event_object_table = 'users' AND trigger_schema = 'auth';

-- 2. Désactiver TOUS les triggers sur auth.users temporairement
-- ATTENTION: Ceci désactive TOUS les triggers, pas seulement les nôtres
-- ALTER TABLE auth.users DISABLE TRIGGER ALL;

-- 3. Essayer de créer un utilisateur de test directement dans la DB
-- ATTENTION: Ne faites ceci QUE pour tester, puis supprimez l'utilisateur
/*
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated', 
    'test@example.com',
    crypt('testpassword', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"prenom": "Test", "nom": "User"}',
    now(),
    now(),
    encode(gen_random_bytes(32), 'hex'),
    ''
);
*/

-- 4. Vérifier l'état de RLS sur user_profiles
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'user_profiles';

-- 5. Vérifier les politiques RLS existantes
SELECT 
    policyname,
    cmd,
    permissive,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'user_profiles';

-- 6. Tester auth.uid() dans le contexte actuel
SELECT auth.uid() as current_auth_uid;

-- 7. Solution: Créer une politique pour permettre l'insertion lors de l'inscription
DROP POLICY IF EXISTS "user_profiles_policy" ON public.user_profiles;

-- Politique pour la lecture/modification (utilisateur authentifié)
CREATE POLICY "user_profiles_select_update_delete" ON public.user_profiles
FOR ALL TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Politique pour l'insertion (permet l'inscription)
CREATE POLICY "user_profiles_insert" ON public.user_profiles
FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- 8. Réactiver les triggers après le test
-- ALTER TABLE auth.users ENABLE TRIGGER ALL;