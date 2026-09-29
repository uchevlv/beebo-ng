-- Read-only policy checks after schema.sql. Run in the SQL editor.
select tablename, rowsecurity from pg_tables
where schemaname = 'public' and tablename in ('admin_users','products','collections');
select tablename, policyname, roles, cmd, qual, with_check from pg_policies
where (schemaname = 'public' and tablename in ('admin_users','products','collections'))
or (schemaname = 'storage' and policyname like 'Owner%catalogue%');
-- Anonymous access must see active catalogue rows only and have no write policies.
begin;
set local role anon;
select public.is_admin() as must_be_false;
select count(*) as must_be_zero from public.collections where not active;
select count(*) as must_be_zero from public.products where not active;
rollback;
