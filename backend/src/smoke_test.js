import pg from 'pg'
import dotenv from 'dotenv'
dotenv.config()

const { Client } = pg
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('sslmode=require') ? { rejectUnauthorized: false } : false
})

async function run() {
  const results = { checks: [] }
  const ok = (name) => results.checks.push({ name, status: 'ok' })
  const fail = (name, error) => results.checks.push({ name, status: 'fail', error: String(error) })
  try {
    await client.connect()
    ok('db_connect')

    const tables = ['users','students','staff','classes','sections','subjects','class_subjects','exams','exam_classes','exam_routines','attendance','assignments']
    for (const t of tables) {
      try {
        const { rows } = await client.query(`SELECT COUNT(*)::int AS c FROM ${t}`)
        ok(`count_${t}=${rows[0].c}`)
      } catch (e) { fail(`count_${t}`, e.message) }
    }

    // Insert test notice and delete
    try {
      const title = `Smoke Test ${Date.now()}`
      const ins = await client.query('INSERT INTO notices(title, content, is_active) VALUES($1,$2,true) RETURNING id', [title, 'Automated smoke test'])
      const id = ins.rows[0].id
      ok('insert_notice')
      await client.query('DELETE FROM notices WHERE id=$1', [id])
      ok('delete_notice')
    } catch (e) { fail('insert_delete_notice', e.message) }

    // Upsert attendance for today for first enrollment (if exists)
    try {
      const enrRes = await client.query('SELECT id FROM enrollments LIMIT 1')
      if (enrRes.rows.length) {
        const enrId = enrRes.rows[0].id
        await client.query(`
          INSERT INTO attendance(enrollment_id, attendance_date, status)
          VALUES($1, CURRENT_DATE, 'Present')
          ON CONFLICT (enrollment_id, attendance_date, subject_id)
          DO UPDATE SET status='Present'`, [enrId])
        ok('upsert_attendance')
      } else {
        ok('upsert_attendance_skipped_no_enrollment')
      }
    } catch (e) { fail('upsert_attendance', e.message) }

    // Verify unique index for subject assignments exists
    try {
      const idx = await client.query(`SELECT indexname FROM pg_indexes WHERE schemaname='public' AND indexname='uq_subject_assignment'`)
      if (idx.rows.length) ok('unique_index_subject_assignment_present')
      else fail('unique_index_subject_assignment_missing','not found')
    } catch (e) { fail('unique_index_subject_assignment_check', e.message) }

  } catch (e) {
    fail('db_connect', e.message)
  } finally {
    try { await client.end() } catch {}
    console.log(JSON.stringify(results, null, 2))
  }
}

run()

