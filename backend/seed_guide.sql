-- ============================================================
--  Seven Star School — DATA SEEDING GUIDE
--  Run these SQL queries in Supabase SQL Editor
--  https://supabase.com/dashboard → SQL Editor
-- ============================================================

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  1. ADD A SINGLE STUDENT                                     ║
-- ╚══════════════════════════════════════════════════════════════╝
-- This creates: user + student + enrollment + parent + fees (all at once!)

-- ✅ Minimum (just name + class):
SELECT * FROM add_student('Aarav', 'Sharma', 'Class 5', 'A');

-- ✅ Full details:
SELECT * FROM add_student(
  'Priya',              -- first_name
  'Thapa',              -- last_name
  'Class 8',            -- class (Nursery/LKG/UKG/Class 1-12)
  'B',                  -- section (A/B/C)
  'Female',             -- gender (Male/Female/Other)
  '2013-05-15',         -- date_of_birth
  'Butwal-7, Rupandehi',-- address
  'Ram Thapa',          -- father_name
  '9857012345',         -- father_phone
  'Sita Thapa',         -- mother_name
  '9857012346',         -- mother_phone
  'B+'                  -- blood_group (A+/A-/B+/B-/AB+/AB-/O+/O-)
);

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  2. ADD MULTIPLE STUDENTS AT ONCE (batch)                    ║
-- ╚══════════════════════════════════════════════════════════════╝

SELECT * FROM add_student('Rohan', 'Poudel', 'Class 3', 'A', 'Male', '2017-03-10', 'Tilottama-3, Rupandehi');
SELECT * FROM add_student('Anita', 'Rai', 'Class 3', 'A', 'Female', '2017-08-22', 'Sainamaina-5, Rupandehi');
SELECT * FROM add_student('Bikash', 'Magar', 'Class 3', 'B', 'Male', '2016-12-01', 'Devdaha-2, Rupandehi');
SELECT * FROM add_student('Kabita', 'KC', 'Class 3', 'B', 'Female', '2017-01-25', 'Butwal-11, Rupandehi');
-- Add as many as you want...


-- ╔══════════════════════════════════════════════════════════════╗
-- ║  3. ADD A TEACHER (with subject + class assignments)         ║
-- ╚══════════════════════════════════════════════════════════════╝

-- ✅ Math teacher for Class 6-8, sections A & B:
SELECT add_teacher(
  'Kiran Bahadur Karki',                        -- name
  ARRAY['Mathematics'],                          -- subjects they teach
  ARRAY['Class 6', 'Class 7', 'Class 8'],       -- classes
  ARRAY['A', 'B']                                -- sections (default: A, B)
);

-- ✅ Science + Math teacher for Class 4-5:
SELECT add_teacher(
  'Sarita Devi Pandey',
  ARRAY['Mathematics', 'Science'],
  ARRAY['Class 4', 'Class 5'],
  ARRAY['A', 'B']
);

-- ✅ Pre-primary teacher (all subjects in one section):
SELECT add_teacher(
  'Pabitra Kumari Yadav',
  ARRAY['English (PP)', 'Nepali (PP)', 'Mathematics (PP)', 'General Knowledge', 'Art & Craft'],
  ARRAY['Nursery'],
  ARRAY['A']
);


-- ╔══════════════════════════════════════════════════════════════╗
-- ║  4. ADD A NEW EXAM (+ auto-generate marks)                   ║
-- ╚══════════════════════════════════════════════════════════════╝

-- ✅ Create exam WITHOUT marks (enter marks manually later):
SELECT add_exam(
  'Mid-Term Test 2026',        -- exam name
  'Unit Test',                  -- type: Terminal / Unit Test / Mock
  '2026-06-15',                -- start date
  '2026-06-22'                 -- end date
);

-- ✅ Create exam WITH auto-generated marks for ALL classes:
SELECT add_exam(
  'Fourth Terminal 2026',
  'Terminal',
  '2026-07-01',
  '2026-07-15',
  NULL,          -- NULL = all classes
  true,          -- generate_marks = true
  true           -- publish = true
);

-- ✅ Create exam only for specific classes:
SELECT add_exam(
  'SEE Mock Exam 2026',
  'Mock',
  '2026-08-01',
  '2026-08-10',
  ARRAY['Class 10'],   -- only Class 10
  true,                 -- generate marks
  false                 -- not published yet
);


-- ╔══════════════════════════════════════════════════════════════╗
-- ║  5. MARK ATTENDANCE (whole class at once)                    ║
-- ╚══════════════════════════════════════════════════════════════╝

-- ✅ Auto-generates realistic attendance (88% Present, 6% Late, etc.)
SELECT add_bulk_attendance('Class 5', 'A', '2026-03-01');
SELECT add_bulk_attendance('Class 5', 'B', '2026-03-01');

-- ✅ For ALL classes on a date:
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT c.name as class_name, s.name as section_name 
           FROM sections s JOIN classes c ON c.id = s.class_id ORDER BY c.level, s.name
  LOOP
    PERFORM add_bulk_attendance(r.class_name, r.section_name, '2026-03-01');
  END LOOP;
END $$;


-- ╔══════════════════════════════════════════════════════════════╗
-- ║  6. ADD NOTICES                                              ║
-- ╚══════════════════════════════════════════════════════════════╝

SELECT add_notice(
  'Holiday Notice - Holi 2026',
  'The school will remain closed on March 14, 2026 on account of Holi festival. Classes resume on March 15.',
  'ALL'     -- target: ALL / STUDENT / TEACHER / PARENT
);

SELECT add_notice(
  'Fee Reminder for April',
  'Parents are requested to clear all pending fees by April 10, 2026. Late fee of NPR 100/week applies.',
  'PARENT'
);

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  7. ADD EVENTS                                               ║
-- ╚══════════════════════════════════════════════════════════════╝

SELECT add_event(
  'Annual Science Fair 2026',
  'Inter-school science exhibition. Theme: AI & Robotics. Students from Class 6-12 participate.',
  '2026-04-15 09:00:00+05:45',   -- start
  '2026-04-15 16:00:00+05:45',   -- end
  'School Auditorium & Science Lab'
);

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  8. ADD MARKS MANUALLY (for specific student)                ║
-- ╚══════════════════════════════════════════════════════════════╝

-- First find IDs:
-- SELECT id, name FROM exams;
-- SELECT id, first_name, last_name FROM students WHERE first_name = 'Aarav';
-- SELECT id, name FROM subjects WHERE name = 'Mathematics';
-- SELECT id, name FROM classes WHERE name = 'Class 5';
-- SELECT id FROM sections WHERE class_id = '<class_id>' AND name = 'A';

INSERT INTO exam_marks (exam_id, student_id, subject_id, class_id, section_id, marks_obtained, full_marks, pass_marks, grade, grade_point)
VALUES (
  '<exam_id>',
  '<student_id>',
  '<subject_id>',
  '<class_id>',
  '<section_id>',
  85,    -- marks obtained
  100,   -- full marks
  40,    -- pass marks
  'A',   -- grade
  3.6    -- GPA
);


-- ╔══════════════════════════════════════════════════════════════╗
-- ║  9. ADD FEE STRUCTURE (new fee type for a class)             ║
-- ╚══════════════════════════════════════════════════════════════╝

INSERT INTO fee_structures (academic_year_id, class_id, fee_type, amount, due_date, description)
SELECT 
  (SELECT id FROM academic_years ORDER BY created_at DESC LIMIT 1),
  c.id,
  'Lab Fee',      -- new fee type
  1500,           -- amount in NPR
  '2026-05-15',   -- due date
  'Lab Fee for ' || c.name
FROM classes c WHERE c.name = 'Class 11';

-- Then auto-assign to all students in that class:
INSERT INTO student_fees (student_id, fee_structure_id, amount_due, amount_paid, discount, status, due_date)
SELECT e.student_id, fs.id, fs.amount, 0, 0, 'UNPAID', fs.due_date
FROM enrollments e
JOIN fee_structures fs ON fs.class_id = e.class_id AND fs.fee_type = 'Lab Fee'
WHERE e.class_id = (SELECT id FROM classes WHERE name = 'Class 11');


-- ╔══════════════════════════════════════════════════════════════╗
-- ║  10. ADD LIBRARY BOOK + ISSUE                                ║
-- ╚══════════════════════════════════════════════════════════════╝

-- Add a book:
INSERT INTO library_books (title, author, isbn, category, total_copies, available_copies, shelf_location)
VALUES ('Advanced Physics', 'HC Verma', '978-81-775-0949-9', 'Textbook', 10, 10, 'B-5');

-- Issue to a student:
INSERT INTO library_issues (book_id, student_id, issue_date, due_date, status, issued_by)
VALUES (
  (SELECT id FROM library_books WHERE title = 'Advanced Physics'),
  (SELECT id FROM students WHERE first_name = 'Aarav' AND last_name = 'Sharma' LIMIT 1),
  CURRENT_DATE,
  CURRENT_DATE + 14,
  'Issued',
  (SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1)
);


-- ╔══════════════════════════════════════════════════════════════╗
-- ║  QUICK REFERENCE: Available Classes                          ║
-- ╚══════════════════════════════════════════════════════════════╝
-- Nursery, LKG, UKG, Class 1, Class 2, Class 3, Class 4, Class 5,
-- Class 6, Class 7, Class 8, Class 9, Class 10, Class 11, Class 12
-- Sections: A, B (some have C)

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  QUICK REFERENCE: Grade Scale                                ║
-- ╚══════════════════════════════════════════════════════════════╝
-- 90-100 → A+ (4.0)    80-89 → A (3.6)     70-79 → B+ (3.2)
-- 60-69  → B  (2.8)    50-59 → C+ (2.4)    40-49 → C  (2.0)
-- 30-39  → D  (1.6)    20-29 → E  (0.8)    0-19  → F  (0.0)

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  QUICK REFERENCE: Fee Statuses                               ║
-- ╚══════════════════════════════════════════════════════════════╝
-- PAID / UNPAID / PARTIAL / OVERDUE

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  USEFUL QUERIES                                              ║
-- ╚══════════════════════════════════════════════════════════════╝

-- Total students per class:
-- SELECT c.name, count(*) FROM enrollments e JOIN classes c ON c.id = e.class_id GROUP BY c.name, c.level ORDER BY c.level;

-- All teachers and their subjects:
-- SELECT u.name as teacher, s.name as subject, c.name as class, sec.name as section 
-- FROM teacher_assignments ta JOIN users u ON u.id = ta.teacher_id JOIN subjects s ON s.id = ta.subject_id JOIN classes c ON c.id = ta.class_id JOIN sections sec ON sec.id = ta.section_id ORDER BY u.name, c.level;

-- Student results for an exam:
-- SELECT s.first_name, s.last_name, rs.percentage, rs.gpa, rs.rank, rs.result FROM result_summaries rs JOIN students s ON s.id = rs.student_id WHERE rs.exam_id = '<exam_id>' ORDER BY rs.rank;

-- Fee collection summary:
-- SELECT status, count(*), sum(amount_paid) as collected, sum(amount_due - amount_paid - discount) as pending FROM student_fees GROUP BY status;
