-- ═══════════════════════════════════════════════════════
-- Add user_number (sequential ID), cpf, and falecido to profiles
-- user_number: 1 = Jesus Cristo, 2-300 = Papas, 301+ = users
-- ═══════════════════════════════════════════════════════

-- 1. Add new columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_number INTEGER UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cpf TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS falecido BOOLEAN NOT NULL DEFAULT false;

-- 2. Create a sequence starting at 301 for regular users
-- (IDs 1-300 are reserved for Jesus + Popes)
CREATE SEQUENCE IF NOT EXISTS profiles_user_number_seq START WITH 301;

-- 3. Index on cpf for fast lookups and uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_cpf ON profiles(cpf) WHERE cpf IS NOT NULL;

-- 4. Index on user_number for fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_user_number ON profiles(user_number);

-- 5. Index on falecido for counter queries
CREATE INDEX IF NOT EXISTS idx_profiles_falecido ON profiles(falecido) WHERE falecido = false;

-- 6. Function to auto-assign user_number on new profile creation
CREATE OR REPLACE FUNCTION assign_user_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Only assign if not already set (reserved IDs are pre-set)
  IF NEW.user_number IS NULL THEN
    NEW.user_number := nextval('profiles_user_number_seq');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Trigger to auto-assign user_number
DROP TRIGGER IF EXISTS trg_assign_user_number ON profiles;
CREATE TRIGGER trg_assign_user_number
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION assign_user_number();

-- 8. Assign user_number to existing profiles that don't have one
UPDATE profiles
SET user_number = nextval('profiles_user_number_seq')
WHERE user_number IS NULL;

-- 9. Helper to re-sync the sequence after manual inserts (call after seed)
CREATE OR REPLACE FUNCTION setval_user_number_seq()
RETURNS void AS $$
BEGIN
  PERFORM setval(
    'profiles_user_number_seq',
    GREATEST(301, COALESCE((SELECT MAX(user_number) FROM profiles), 300) + 1),
    false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Allow anonymous users to read profiles (needed for landing page counter)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'profiles_anon_count') THEN
    CREATE POLICY "profiles_anon_count" ON profiles FOR SELECT TO anon USING (true);
  END IF;
END $$;
