alter table public.users    enable row level security;
alter table public.posts    enable row level security;
alter table public.comments enable row level security;

-- Helper: is current user admin?
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  );
$$;

-- USERS policies
create policy "users_self_read" on public.users
  for select using (auth.uid() = id or public.is_admin());

create policy "users_self_update_name" on public.users
  for update using (auth.uid() = id)
  with check (auth.uid() = id and role = (select role from public.users where id = auth.uid()));
  -- prevents self-promotion to admin

-- POSTS policies
create policy "posts_public_read" on public.posts
  for select using (true);

create policy "posts_author_insert" on public.posts
  for insert with check (
    auth.uid() = author_id
    and exists (select 1 from public.users where id = auth.uid() and role in ('author','admin'))
  );

create policy "posts_author_update" on public.posts
  for update using (auth.uid() = author_id or public.is_admin())
  with check (auth.uid() = author_id or public.is_admin());

create policy "posts_author_delete" on public.posts
  for delete using (auth.uid() = author_id or public.is_admin());

-- COMMENTS policies
create policy "comments_public_read" on public.comments
  for select using (true);

create policy "comments_authed_insert" on public.comments
  for insert with check (auth.uid() = user_id);

create policy "comments_owner_or_admin_delete" on public.comments
  for delete using (auth.uid() = user_id or public.is_admin());
