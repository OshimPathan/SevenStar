import pg from 'pg'
import dotenv from 'dotenv'
dotenv.config()

const { Client } = pg

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('sslmode=require') ? { rejectUnauthorized: false } : false
})

async function widenAnonAccess() {
  try {
    await client.connect()
    console.log('🔓 Granting DEV permissions to anon on all public tables...')
    const sql = `
      GRANT USAGE ON SCHEMA public TO anon;
      GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon;
      NOTIFY pgrst, 'reload schema';
    `
    await client.query(sql)
    console.log('✅ DEV anon permissions applied. Remember to harden before production!')
  } catch (e) {
    console.error('❌ Failed to apply DEV anon permissions:', e.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

widenAnonAccess()

