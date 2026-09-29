-- Run once in the Supabase SQL editor for a NEW project.
begin;
create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.admin_users enable row level security;
-- No client can grant itself owner access. Only the SQL editor/service role can manage this table.
revoke all on public.admin_users from anon, authenticated;
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admin_users where user_id = (select auth.uid()));
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 120),
  slug text not null unique check (length(slug) <= 100 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text not null default '' check (length(description) <= 2000),
  cover_url text check (cover_url is null or cover_url ~ '^https://'),
  expected_count integer not null default 0 check (expected_count >= 0),
  sort_order integer not null default 0 check (sort_order between 0 and 9999),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.products (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections(id) on delete restrict,
  name text not null check (length(trim(name)) between 1 and 120),
  price numeric(11,2) not null check (price > 0 and price <= 999999999),
  description text not null default '' check (length(description) <= 2000),
  image_url text not null check (image_url ~ '^https://'),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index products_collection_id_idx on public.products(collection_id);
alter table public.collections enable row level security;
alter table public.products enable row level security;
grant select on public.collections, public.products to anon, authenticated;
grant insert, update, delete on public.collections, public.products to authenticated;
create policy "Published collections" on public.collections for select to anon, authenticated
using (active or (select public.is_admin()));
create policy "Owner manages collections" on public.collections for all to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Published dresses in published collections" on public.products for select to anon, authenticated
using ((active and exists (select 1 from public.collections c where c.id = collection_id and c.active)) or (select public.is_admin()));
create policy "Owner manages dresses" on public.products for all to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('catalog-images', 'catalog-images', true, 5242880, array['image/jpeg','image/png','image/webp']);
create policy "Owner uploads catalogue images" on storage.objects for insert to authenticated
with check (bucket_id = 'catalog-images' and (select public.is_admin()));
create policy "Owner reads image metadata" on storage.objects for select to authenticated
using (bucket_id = 'catalog-images' and (select public.is_admin()));
create policy "Owner deletes catalogue images" on storage.objects for delete to authenticated
using (bucket_id = 'catalog-images' and (select public.is_admin()));
-- Public image delivery is intentional. Unpublishing a dress does not make an already shared image URL private.
insert into public.collections (name, slug, expected_count, sort_order, description) values
('Éclat', 'eclat', 9, 0, 'A refined collection of radiant silhouettes made for unforgettable moments.'),
('Resurgence', 'resurgence', 8, 1, 'A graceful return to confidence, elegance, and timeless femininity.');
-- The two original covers remain bundled assets until the owner uploads replacements.
commit;
