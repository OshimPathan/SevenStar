import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Client } = pg
const sslOptions = process.env.DATABASE_URL?.includes('insforge') ? { rejectUnauthorized: false } : false
const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: sslOptions })

async function run() {
  try {
    await client.connect()
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_subject_assignment
      ON public.subject_assignments(teacher_id, class_id, section_id, subject_id, academic_year_id);
    `)
    console.log('Unique index ensured: uq_subject_assignment')
  } catch (e) {
    console.error('Hotfix failed:', e.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

run()

