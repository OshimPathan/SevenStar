import pg from 'pg'
import dotenv from 'dotenv'
dotenv.config()

const { Client } = pg
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('sslmode=require') ? { rejectUnauthorized: false } : false
})

const SQL = `
-- 1) Single active academic year
CREATE UNIQUE INDEX IF NOT EXISTS uq_academic_year_active
ON public.academic_years ((CASE WHEN is_active THEN 1 ELSE NULL END));

-- 2) Prevent changing marks when results published
CREATE OR REPLACE FUNCTION prevent_marks_change_when_published()
RETURNS TRIGGER AS $$
DECLARE v_published BOOLEAN;
BEGIN
  IF TG_OP = 'DELETE' THEN
    SELECT results_published INTO v_published FROM exams WHERE id = OLD.exam_id;
    IF v_published THEN
      RAISE EXCEPTION 'Results are published; marks are locked (delete prohibited)';
    END IF;
    RETURN OLD;
  ELSE
    SELECT results_published INTO v_published FROM exams WHERE id = NEW.exam_id;
    IF v_published THEN
      RAISE EXCEPTION 'Results are published; marks are locked (insert/update prohibited)';
    END IF;
    RETURN NEW;
  END IF;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lock_exam_marks_iud ON public.exam_marks;
CREATE TRIGGER trg_lock_exam_marks_iud
BEFORE INSERT OR UPDATE OR DELETE ON public.exam_marks
FOR EACH ROW EXECUTE PROCEDURE prevent_marks_change_when_published();

-- 3) Ensure subject belongs to student's class
CREATE OR REPLACE FUNCTION check_marks_subject()
RETURNS TRIGGER AS $$
DECLARE v_class_id UUID;
BEGIN
  SELECT class_id INTO v_class_id FROM enrollments WHERE id = NEW.enrollment_id;
  IF v_class_id IS NULL THEN
    RAISE EXCEPTION 'Enrollment % not found', NEW.enrollment_id;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM class_subjects WHERE class_id = v_class_id AND subject_id = NEW.subject_id
  ) THEN
    RAISE EXCEPTION 'Subject % not mapped to student''s class', NEW.subject_id;
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_marks_subject ON public.exam_marks;
CREATE TRIGGER trg_check_marks_subject
BEFORE INSERT OR UPDATE ON public.exam_marks
FOR EACH ROW EXECUTE PROCEDURE check_marks_subject();

-- 4) Prevent overpayment on fee_payments
CREATE OR REPLACE FUNCTION prevent_overpayment()
RETURNS TRIGGER AS $$
DECLARE v_total NUMERIC(10,2);
DECLARE v_due NUMERIC(10,2);
BEGIN
  SELECT amount_due INTO v_due FROM student_fees WHERE id = NEW.student_fee_id;
  IF v_due IS NULL THEN
    RAISE EXCEPTION 'Student fee % not found', NEW.student_fee_id;
  END IF;
  SELECT COALESCE(SUM(amount),0) INTO v_total FROM fee_payments WHERE student_fee_id = NEW.student_fee_id;
  IF v_total + NEW.amount > v_due THEN
    RAISE EXCEPTION 'Payment exceeds amount due (current total %, due %, new %)', v_total, v_due, NEW.amount;
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_overpayment ON public.fee_payments;
CREATE TRIGGER trg_prevent_overpayment
BEFORE INSERT ON public.fee_payments
FOR EACH ROW EXECUTE PROCEDURE prevent_overpayment();

-- 5) Add teacher_id to timetable and prevent double-booking a teacher
ALTER TABLE public.class_timetables
  ADD COLUMN IF NOT EXISTS teacher_id UUID;

CREATE UNIQUE INDEX IF NOT EXISTS uq_teacher_slot
ON public.class_timetables(academic_year_id, teacher_id, day_of_week, period)
WHERE teacher_id IS NOT NULL;

-- 6) Helpful indexes for scale
CREATE INDEX IF NOT EXISTS idx_attendance_enrollment_date
ON public.attendance(enrollment_id, attendance_date);

CREATE INDEX IF NOT EXISTS idx_exam_marks_enrollment_exam
ON public.exam_marks(enrollment_id, exam_id);

CREATE INDEX IF NOT EXISTS idx_student_fees_enrollment_status
ON public.student_fees(enrollment_id, status);

CREATE INDEX IF NOT EXISTS idx_result_summaries_enrollment_exam
ON public.result_summaries(enrollment_id, exam_id);
`

async function run() {
  try {
    await client.connect()
    console.log('🔧 Applying security and integrity hardening...')
    await client.query(SQL)
    console.log('✅ Hardening applied successfully')
  } catch (e) {
    console.error('❌ Hardening failed:', e.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

run()

