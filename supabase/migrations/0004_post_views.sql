-- =========================================
-- Add Views to Posts
-- =========================================
alter table public.posts
  add column if not exists views integer not null default 0;

-- =========================================
-- Increment Views RPC Function
-- =========================================
create or replace function public.increment_post_views(post_id uuid)
returns void as $$
begin
  update public.posts
  set views = views + 1
  where id = post_id;
end;
$$ language plpgsql security definer;
