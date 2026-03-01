-- RLS policies for public tables to match existing GRANT permissions
-- The app uses anon key with client-side auth (bcrypt), not Supabase Auth

-- Anon: SELECT on all tables
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE format('CREATE POLICY "anon_select_%s" ON public.%I FOR SELECT TO anon USING (true);', t, t);
    END LOOP;
END $$;

-- Anon: INSERT on public-facing tables
CREATE POLICY "anon_insert_contact" ON public.contact_inquiries FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_insert_admissions" ON public.admission_applications FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_insert_reviews" ON public.reviews FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_insert_users" ON public.users FOR INSERT TO anon WITH CHECK (true);

-- Anon: UPDATE and DELETE on users (for password reset, profile updates via the app's own auth)
CREATE POLICY "anon_update_users" ON public.users FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Authenticated: full CRUD on all tables
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE format('CREATE POLICY "auth_all_%s" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true);', t, t);
    END LOOP;
END $$;

-- The app performs all operations with the anon key.
-- For full ERP CRUD operations (admin/teacher dashboards), anon also needs write access.
-- This matches the original Supabase setup. Add per-table anon write policies:
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE format('CREATE POLICY "anon_insert_%s" ON public.%I FOR INSERT TO anon WITH CHECK (true);', t, t);
        EXECUTE format('CREATE POLICY "anon_update_%s" ON public.%I FOR UPDATE TO anon USING (true) WITH CHECK (true);', t, t);
        EXECUTE format('CREATE POLICY "anon_delete_%s" ON public.%I FOR DELETE TO anon USING (true);', t, t);
    END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
