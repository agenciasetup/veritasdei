-- Bucket santos-imagens — imagens de capa dos santos.
-- Público para leitura (capa do perfil = URL pública), admin-only para write.
-- Convenção: {slug}.webp, max 5MB, WebP/JPEG/PNG/AVIF.

begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'santos-imagens',
  'santos-imagens',
  true,
  5242880, -- 5MB
  array[
    'image/webp',
    'image/jpeg',
    'image/png',
    'image/avif'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "santos-imagens public read" on storage.objects;
create policy "santos-imagens public read"
  on storage.objects for select
  to public
  using (bucket_id = 'santos-imagens');

drop policy if exists "santos-imagens admin write" on storage.objects;
create policy "santos-imagens admin write"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'santos-imagens'
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

drop policy if exists "santos-imagens admin update" on storage.objects;
create policy "santos-imagens admin update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'santos-imagens'
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

drop policy if exists "santos-imagens admin delete" on storage.objects;
create policy "santos-imagens admin delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'santos-imagens'
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

commit;
