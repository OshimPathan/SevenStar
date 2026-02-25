import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('sslmode=require') ? { rejectUnauthorized: false } : false
});

async function applyGrants() {
    try {
        await client.connect();
        console.log('🔐 Applying PostgREST role grants...');

        const grants = `
-- Schema usage
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- anon: read all tables (needed for login lookup via PostgREST)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- anon: write to public-facing forms
GRANT INSERT ON TABLE public.contact_inquiries TO anon;
GRANT INSERT ON TABLE public.admission_applications TO anon;
GRANT INSERT ON TABLE public.reviews TO anon;
GRANT INSERT ON TABLE public.users TO anon;

-- authenticated: full ERP access
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
        `;

        await client.query(grants);
        console.log('✅ Grants applied successfully!');
    } catch (err) {
        console.error('❌ Grant application failed:', err.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

applyGrants();
