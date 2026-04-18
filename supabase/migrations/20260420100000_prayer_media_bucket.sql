-- Storage bucket for prayer audio/image uploads.
-- Public read (as URLs podem ser compartilhadas), admin-only write.
-- Mime whitelist: audio MP3/M4A/OGG + image JPEG/PNG/WEBP. Cap 20MB.

begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'prayer-media',
  'prayer-media',
  true,
  20971520, -- 20MB
  array[
    'audio/mpeg',
    'audio/mp4',
    'audio/ogg',
    'audio/x-m4a',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Policies
drop policy if exists "prayer-media public read" on storage.objects;
create policy "prayer-media public read"
  on storage.objects for select
  to public
  using (bucket_id = 'prayer-media');

drop policy if exists "prayer-media admin write" on storage.objects;
create policy "prayer-media admin write"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'prayer-media'
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );

drop policy if exists "prayer-media admin update" on storage.objects;
create policy "prayer-media admin update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'prayer-media'
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

drop policy if exists "prayer-media admin delete" on storage.objects;
create policy "prayer-media admin delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'prayer-media'
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

commit;
