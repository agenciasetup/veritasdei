-- =============================================================
-- Migration: Add structured address fields to paroquias
-- Execute in the Supabase SQL Editor (Dashboard > SQL Editor)
-- =============================================================

-- New address columns (all nullable to not break existing rows)
ALTER TABLE paroquias ADD COLUMN IF NOT EXISTS rua text;
ALTER TABLE paroquias ADD COLUMN IF NOT EXISTS numero text;
ALTER TABLE paroquias ADD COLUMN IF NOT EXISTS bairro text;
ALTER TABLE paroquias ADD COLUMN IF NOT EXISTS complemento text;
ALTER TABLE paroquias ADD COLUMN IF NOT EXISTS pais text;

-- latitude and longitude already exist in the table.
-- If for some reason they don't, uncomment:
-- ALTER TABLE paroquias ADD COLUMN IF NOT EXISTS latitude double precision;
-- ALTER TABLE paroquias ADD COLUMN IF NOT EXISTS longitude double precision;
