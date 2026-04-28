-- Bucket for featured images (run via Supabase dashboard OR SQL)
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict do nothing;

-- Authenticated users can upload
create policy "post_images_insert"
on storage.objects for insert
with check (bucket_id = 'post-images' and auth.role() = 'authenticated');

-- Anyone can read
create policy "post_images_read"
on storage.objects for select
using (bucket_id = 'post-images');

-- Owner or admin can delete
create policy "post_images_delete"
on storage.objects for delete
using (
  bucket_id = 'post-images'
  and (auth.uid() = owner or public.is_admin())
);
