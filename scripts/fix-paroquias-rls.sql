-- =============================================================
-- Fix: Paroquias RLS Policies
-- Execute this in Supabase SQL Editor to enable parish registration
-- =============================================================

-- 1. Ensure RLS is enabled
ALTER TABLE paroquias ENABLE ROW LEVEL SECURITY;

-- 2. Allow anyone to READ approved parishes
CREATE POLICY "Allow public read approved paroquias"
  ON paroquias FOR SELECT
  USING (status = 'aprovada');

-- 3. Allow authenticated users to read their OWN pending parishes
CREATE POLICY "Allow users read own paroquias"
  ON paroquias FOR SELECT
  USING (auth.uid() = criado_por);

-- 4. Allow admins to read ALL parishes (any status)
CREATE POLICY "Allow admin read all paroquias"
  ON paroquias FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 5. Allow authenticated users (padre/diacono/admin) to INSERT new parishes
CREATE POLICY "Allow authorized insert paroquias"
  ON paroquias FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = criado_por
  );

-- 6. Allow admins to UPDATE parishes (approve/reject)
CREATE POLICY "Allow admin update paroquias"
  ON paroquias FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 7. Allow admins to DELETE parishes
CREATE POLICY "Allow admin delete paroquias"
  ON paroquias FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 8. Create storage bucket for parish photos (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('paroquias', 'paroquias', true)
ON CONFLICT (id) DO NOTHING;

-- 9. Allow authenticated users to upload photos
CREATE POLICY "Allow authenticated upload paroquias photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'paroquias'
    AND auth.uid() IS NOT NULL
  );

-- 10. Allow public to read parish photos
CREATE POLICY "Allow public read paroquias photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'paroquias');
