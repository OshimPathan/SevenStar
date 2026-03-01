-- Storage RLS policies for Supabase buckets

-- Public read access on all 4 buckets
CREATE POLICY "Public read admissions" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'admissions');
CREATE POLICY "Public read staff" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'staff');
CREATE POLICY "Public read gallery" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'gallery');
CREATE POLICY "Public read assignments" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'assignments');

-- Authenticated upload
CREATE POLICY "Auth upload admissions" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'admissions');
CREATE POLICY "Auth upload staff" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'staff');
CREATE POLICY "Auth upload gallery" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'gallery');
CREATE POLICY "Auth upload assignments" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'assignments');

-- Authenticated update
CREATE POLICY "Auth update admissions" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'admissions');
CREATE POLICY "Auth update staff" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'staff');
CREATE POLICY "Auth update gallery" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'gallery');
CREATE POLICY "Auth update assignments" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'assignments');

-- Authenticated delete
CREATE POLICY "Auth delete admissions" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'admissions');
CREATE POLICY "Auth delete staff" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'staff');
CREATE POLICY "Auth delete gallery" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'gallery');
CREATE POLICY "Auth delete assignments" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'assignments');

-- Anon upload to admissions (public form)
CREATE POLICY "Anon upload admissions" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'admissions');
