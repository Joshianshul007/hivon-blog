-- =========================================
-- ENUMS
-- =========================================
create type user_role as enum ('author', 'viewer', 'admin');

-- =========================================
-- USERS (mirrors auth.users 1-to-1)
-- =========================================
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text unique not null,
  role user_role not null default 'viewer',
  created_at timestamptz not null default now()
);

-- =========================================
-- POSTS
-- =========================================
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 200),
  body text not null check (char_length(body) >= 20),
  image_url text,
  author_id uuid not null references public.users(id) on delete cascade,
  summary text,                                   -- nullable until generated
  summary_status text default 'pending'           -- 'pending' | 'ready' | 'failed'
    check (summary_status in ('pending','ready','failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index posts_author_idx on public.posts(author_id);
create index posts_created_idx on public.posts(created_at desc);
-- Full-text search index for the search feature
create index posts_search_idx on public.posts
  using gin (to_tsvector('english', title || ' ' || coalesce(body,'')));

-- =========================================
-- COMMENTS
-- =========================================
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  comment_text text not null check (char_length(comment_text) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index comments_post_idx on public.comments(post_id);

-- =========================================
-- updated_at trigger for posts
-- =========================================
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger posts_touch_updated
before update on public.posts
for each row execute function public.touch_updated_at();

-- =========================================
-- Auto-create public.users row when auth.users row appears
-- =========================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'viewer')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
