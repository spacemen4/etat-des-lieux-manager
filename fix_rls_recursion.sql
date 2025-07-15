-- Fix for stack overflow issue in RLS policies
-- The issue is that child table policies are causing recursive queries

-- Temporarily disable RLS to fix the policies
ALTER TABLE releve_compteurs DISABLE ROW LEVEL SECURITY;
ALTER TABLE equipements_energetiques DISABLE ROW LEVEL SECURITY;
ALTER TABLE equipements_chauffage DISABLE ROW LEVEL SECURITY;
ALTER TABLE cles DISABLE ROW LEVEL SECURITY;
ALTER TABLE parties_privatives DISABLE ROW LEVEL SECURITY;
ALTER TABLE autres_equipements DISABLE ROW LEVEL SECURITY;
ALTER TABLE pieces DISABLE ROW LEVEL SECURITY;

-- Drop existing policies that might be causing recursion
DROP POLICY IF EXISTS "Enable access to user's own releve_compteurs" ON releve_compteurs;
DROP POLICY IF EXISTS "Enable access to user's own equipements_energetiques" ON equipements_energetiques;
DROP POLICY IF EXISTS "Enable access to user's own equipements_chauffage" ON equipements_chauffage;
DROP POLICY IF EXISTS "Enable access to user's own cles" ON cles;
DROP POLICY IF EXISTS "Enable access to user's own parties_privatives" ON parties_privatives;
DROP POLICY IF EXISTS "Enable access to user's own autres_equipements" ON autres_equipements;
DROP POLICY IF EXISTS "Enable access to user's own pieces" ON pieces;

-- Add user_id columns to child tables if they don't exist
ALTER TABLE releve_compteurs ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE equipements_energetiques ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE equipements_chauffage ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE cles ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE parties_privatives ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE autres_equipements ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE pieces ADD COLUMN IF NOT EXISTS user_id UUID;

-- Update existing records to set user_id based on parent etat_des_lieux
UPDATE releve_compteurs 
SET user_id = (SELECT user_id FROM etat_des_lieux WHERE etat_des_lieux.id = releve_compteurs.etat_des_lieux_id)
WHERE user_id IS NULL;

UPDATE equipements_energetiques 
SET user_id = (SELECT user_id FROM etat_des_lieux WHERE etat_des_lieux.id = equipements_energetiques.etat_des_lieux_id)
WHERE user_id IS NULL;

UPDATE equipements_chauffage 
SET user_id = (SELECT user_id FROM etat_des_lieux WHERE etat_des_lieux.id = equipements_chauffage.etat_des_lieux_id)
WHERE user_id IS NULL;

UPDATE cles 
SET user_id = (SELECT user_id FROM etat_des_lieux WHERE etat_des_lieux.id = cles.etat_des_lieux_id)
WHERE user_id IS NULL;

UPDATE parties_privatives 
SET user_id = (SELECT user_id FROM etat_des_lieux WHERE etat_des_lieux.id = parties_privatives.etat_des_lieux_id)
WHERE user_id IS NULL;

UPDATE autres_equipements 
SET user_id = (SELECT user_id FROM etat_des_lieux WHERE etat_des_lieux.id = autres_equipements.etat_des_lieux_id)
WHERE user_id IS NULL;

UPDATE pieces 
SET user_id = (SELECT user_id FROM etat_des_lieux WHERE etat_des_lieux.id = pieces.etat_des_lieux_id)
WHERE user_id IS NULL;

-- Create improved triggers to automatically set user_id on child tables
CREATE OR REPLACE FUNCTION public.set_child_user_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Get user_id from parent etat_des_lieux
    SELECT user_id INTO NEW.user_id 
    FROM etat_des_lieux 
    WHERE id = NEW.etat_des_lieux_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS set_releve_compteurs_user_id ON releve_compteurs;
DROP TRIGGER IF EXISTS set_equipements_energetiques_user_id ON equipements_energetiques;
DROP TRIGGER IF EXISTS set_equipements_chauffage_user_id ON equipements_chauffage;
DROP TRIGGER IF EXISTS set_cles_user_id ON cles;
DROP TRIGGER IF EXISTS set_parties_privatives_user_id ON parties_privatives;
DROP TRIGGER IF EXISTS set_autres_equipements_user_id ON autres_equipements;
DROP TRIGGER IF EXISTS set_pieces_user_id ON pieces;

-- Create triggers for all child tables
CREATE TRIGGER set_releve_compteurs_user_id
BEFORE INSERT ON releve_compteurs
FOR EACH ROW
EXECUTE FUNCTION set_child_user_id();

CREATE TRIGGER set_equipements_energetiques_user_id
BEFORE INSERT ON equipements_energetiques
FOR EACH ROW
EXECUTE FUNCTION set_child_user_id();

CREATE TRIGGER set_equipements_chauffage_user_id
BEFORE INSERT ON equipements_chauffage
FOR EACH ROW
EXECUTE FUNCTION set_child_user_id();

CREATE TRIGGER set_cles_user_id
BEFORE INSERT ON cles
FOR EACH ROW
EXECUTE FUNCTION set_child_user_id();

CREATE TRIGGER set_parties_privatives_user_id
BEFORE INSERT ON parties_privatives
FOR EACH ROW
EXECUTE FUNCTION set_child_user_id();

CREATE TRIGGER set_autres_equipements_user_id
BEFORE INSERT ON autres_equipements
FOR EACH ROW
EXECUTE FUNCTION set_child_user_id();

CREATE TRIGGER set_pieces_user_id
BEFORE INSERT ON pieces
FOR EACH ROW
EXECUTE FUNCTION set_child_user_id();

-- Re-enable RLS with simple, non-recursive policies
ALTER TABLE releve_compteurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipements_energetiques ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipements_chauffage ENABLE ROW LEVEL SECURITY;
ALTER TABLE cles ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties_privatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE autres_equipements ENABLE ROW LEVEL SECURITY;
ALTER TABLE pieces ENABLE ROW LEVEL SECURITY;

-- Create simple, direct policies without subqueries
CREATE POLICY "Users can access their own releve_compteurs" ON releve_compteurs
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access their own equipements_energetiques" ON equipements_energetiques
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access their own equipements_chauffage" ON equipements_chauffage
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access their own cles" ON cles
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access their own parties_privatives" ON parties_privatives
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access their own autres_equipements" ON autres_equipements
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access their own pieces" ON pieces
    FOR ALL USING (auth.uid() = user_id);