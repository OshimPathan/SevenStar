-- =============================================================================
-- SEVEN STAR ENGLISH BOARDING SCHOOL — COMPLETE ERP DATABASE SCHEMA
-- 49 Tables — Nursery to Class 12 — Generated 2026-02-25
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1️⃣  INSTITUTION & WEBSITE
-- =============================================================================

CREATE TABLE institution_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
     principal_name VARCHAR(255),
    logo_url TEXT,
    contact_email VARCHAR(255) CHECK (contact_email IS NULL OR contact_email ~* '^[A-Za-z0-9._+%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$'),
    contact_phone VARCHAR(50),
    address TEXT,
    established_date DATE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE gallery_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255),
    image_url TEXT NOT NULL,
    category VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE contact_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT,
    last_name TEXT,
    email VARCHAR(255) CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._+%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$'),
    phone VARCHAR(50),
    inquiry_type TEXT DEFAULT 'General Question',
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'new',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    published_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    location VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 2️⃣  ACADEMIC STRUCTURE
-- =============================================================================

CREATE TABLE academic_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_academic_dates CHECK (end_date > start_date)
);

CREATE TABLE streams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    level INT NOT NULL,
    stream_id UUID REFERENCES streams(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    capacity INT DEFAULT 40,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_class_section UNIQUE(class_id, name)
);

-- =============================================================================
-- 3️⃣  USER & ROLE MANAGEMENT
-- =============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._+%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$'),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 4️⃣  STUDENT MANAGEMENT
-- =============================================================================

CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    admission_number VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(20) CHECK (gender IN ('Male', 'Female', 'Other')),
    blood_group VARCHAR(10),
    address TEXT,
    father_name VARCHAR(150),
    father_phone VARCHAR(50),
    mother_name VARCHAR(150),
    mother_phone VARCHAR(50),
    local_guardian_name VARCHAR(150),
    local_guardian_phone VARCHAR(50),
    parent_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    admission_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Transferred', 'Graduated', 'Suspended')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
    section_id UUID NOT NULL REFERENCES sections(id) ON DELETE RESTRICT,
    roll_number INT,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_student_academic_year UNIQUE(student_id, academic_year_id)
);

CREATE TABLE admission_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_name TEXT NOT NULL,
    date_of_birth DATE,
    gender TEXT,
    blood_group TEXT,
    nationality TEXT,
    religion TEXT,
    mother_tongue TEXT,
    
    father_name TEXT,
    father_occupation TEXT,
    father_phone TEXT,
    
    mother_name TEXT,
    mother_occupation TEXT,
    mother_phone TEXT,
    
    parent_name TEXT, -- Guardian
    parent_phone TEXT,
    parent_email TEXT,
    guardian_relation TEXT,
    emergency_contact TEXT,
    
    address TEXT,
    permanent_address TEXT,
    
    applied_for_class TEXT,
    previous_school TEXT,
    previous_class TEXT,
    previous_marks TEXT,
    previous_gpa TEXT,
    previous_year TEXT,
    tc_number TEXT,
    
    has_disability TEXT,
    remarks TEXT,
    
    photo_url TEXT,
    status TEXT DEFAULT 'Pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Parents (dedicated profiles)
CREATE TABLE parents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    father_name VARCHAR(150),
    father_phone VARCHAR(50),
    father_email VARCHAR(255),
    father_occupation VARCHAR(150),
    mother_name VARCHAR(150),
    mother_phone VARCHAR(50),
    mother_email VARCHAR(255),
    mother_occupation VARCHAR(150),
    guardian_name VARCHAR(150),
    guardian_phone VARCHAR(50),
    guardian_relation VARCHAR(50),
    address TEXT,
    emergency_contact VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE student_parents (
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    PRIMARY KEY (student_id, parent_id)
);

-- Student Documents
CREATE TABLE student_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_key TEXT,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Promotion History
CREATE TABLE promotion_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    from_academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
    to_academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
    from_class_id UUID NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
    to_class_id UUID NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
    from_section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
    to_section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
    promotion_type VARCHAR(20) NOT NULL CHECK (promotion_type IN ('Promoted', 'Retained', 'Transferred', 'Graduated')),
    remarks TEXT,
    promoted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    promoted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 5️⃣  TEACHER & STAFF MANAGEMENT
-- =============================================================================

CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    staff_type VARCHAR(50) NOT NULL CHECK (staff_type IN ('Teaching', 'Non-Teaching')),
    designation VARCHAR(100),
    qualification TEXT,
    hire_date DATE NOT NULL,
    leave_date DATE,
    base_salary NUMERIC(10, 2),
    contact_phone VARCHAR(50),
    address TEXT,
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE class_teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_class_teacher UNIQUE(academic_year_id, class_id, section_id)
);

-- =============================================================================
-- 6️⃣  SUBJECT & CURRICULUM
-- =============================================================================

CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE class_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    is_optional BOOLEAN DEFAULT false,
    optional_group_name VARCHAR(100),
    full_marks NUMERIC(5, 2) NOT NULL DEFAULT 100,
    pass_marks NUMERIC(5, 2) NOT NULL DEFAULT 40,
    credit_hours NUMERIC(4, 2),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_class_subject UNIQUE(class_id, subject_id)
);

CREATE TABLE subject_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE teacher_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    class_subject_id UUID NOT NULL REFERENCES class_subjects(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_teacher_assignment UNIQUE(staff_id, class_subject_id, section_id, academic_year_id)
);

-- =============================================================================
-- 7️⃣  TIMETABLE
-- =============================================================================

CREATE TABLE class_timetables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academic_year_id UUID REFERENCES academic_years(id),
    class_id UUID REFERENCES classes(id),
    section_id UUID REFERENCES sections(id),
    day_of_week INT NOT NULL,
    period INT NOT NULL,
    start_time TIME,
    end_time TIME,
    class_subject_id UUID REFERENCES class_subjects(id),
    room TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 8️⃣  ATTENDANCE
-- =============================================================================

CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL CHECK (attendance_date <= CURRENT_DATE),
    status VARCHAR(20) NOT NULL CHECK (status IN ('Present', 'Absent', 'Late', 'Half-Day')),
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    marked_by UUID REFERENCES staff(id) ON DELETE SET NULL,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_daily_student_attendance UNIQUE NULLS NOT DISTINCT (enrollment_id, attendance_date, subject_id)
);
CREATE INDEX idx_attendance_date ON attendance(attendance_date);

-- =============================================================================
-- 9️⃣  EXAMINATION MODULE
-- =============================================================================

CREATE TABLE exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
    name VARCHAR(100) NOT NULL,
    exam_type VARCHAR(50),
    full_marks NUMERIC(5, 2) DEFAULT 100,
    pass_marks NUMERIC(5, 2) DEFAULT 40,
    start_date DATE,
    end_date DATE,
    published BOOLEAN DEFAULT false,
    results_published BOOLEAN DEFAULT false,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE exam_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    is_result_published BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_exam_class UNIQUE(exam_id, class_id)
);

CREATE TABLE exam_routines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_class_id UUID NOT NULL REFERENCES exam_classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
    exam_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    room_number VARCHAR(50),
    invigilator_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_exam_class_subject UNIQUE(exam_class_id, subject_id)
);

CREATE TABLE exam_marks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
    marks_obtained NUMERIC(5, 2) CHECK (marks_obtained >= 0),
    theory_marks NUMERIC(5, 2) CHECK (theory_marks >= 0),
    practical_marks NUMERIC(5, 2) CHECK (practical_marks >= 0),
    total_marks NUMERIC(5, 2) DEFAULT 100 CHECK (total_marks > 0),
    grade TEXT,
    gpa NUMERIC(3, 2) CHECK (gpa >= 0.0 AND gpa <= 4.0),
    is_absent BOOLEAN DEFAULT false,
    verified BOOLEAN DEFAULT false,
    remarks TEXT,
    entered_by UUID REFERENCES staff(id) ON DELETE SET NULL,
    verified_by UUID REFERENCES staff(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_exam_marks UNIQUE(exam_id, enrollment_id, subject_id),
    CONSTRAINT chk_marks_validity CHECK (marks_obtained <= total_marks) -- theory max logic can be added later if needed
);

-- =============================================================================
-- 🔟  RESULT SUMMARIES
-- =============================================================================

CREATE TABLE result_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    total_marks NUMERIC(7, 2) NOT NULL DEFAULT 0,
    percentage NUMERIC(5, 2),
    grade VARCHAR(5),
    gpa NUMERIC(3, 2),
    status VARCHAR(20) CHECK (status IN ('Pass', 'Fail', 'Withheld')),
    rank INT,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_exam_result_summary UNIQUE(exam_id, enrollment_id)
);

-- =============================================================================
-- 1️⃣1️⃣  ASSIGNMENTS
-- =============================================================================

CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academic_year_id UUID REFERENCES academic_years(id),
    class_id UUID REFERENCES classes(id),
    section_id UUID REFERENCES sections(id),
    subject_id UUID REFERENCES subjects(id),
    teacher_id UUID REFERENCES staff(id),
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    total_points NUMERIC(5, 2),
    status TEXT DEFAULT 'Active',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
    file_url TEXT,
    file_key TEXT,
    submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    marks NUMERIC(5, 2),
    total_marks NUMERIC(5, 2),
    graded_by UUID REFERENCES staff(id),
    graded_at TIMESTAMPTZ,
    remarks TEXT
);

-- =============================================================================
-- 1️⃣2️⃣  FEE & FINANCE
-- =============================================================================

CREATE TABLE fee_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
    fee_type VARCHAR(100) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    frequency VARCHAR(50) DEFAULT 'Monthly' CHECK (frequency IN ('Monthly', 'Termly', 'Yearly', 'One-time')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_fee_structure UNIQUE(academic_year_id, class_id, fee_type)
);

CREATE TABLE student_fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    fee_structure_id UUID NOT NULL REFERENCES fee_structures(id) ON DELETE RESTRICT,
    due_date DATE,
    amount_due NUMERIC(10, 2) NOT NULL CHECK (amount_due >= 0),
    amount_paid NUMERIC(10, 2) DEFAULT 0 CHECK (amount_paid >= 0),
    status VARCHAR(20) DEFAULT 'Unpaid' CHECK (status IN ('Paid', 'Unpaid', 'Partial')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE fee_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_fee_id UUID NOT NULL REFERENCES student_fees(id) ON DELETE CASCADE,
    receipt_number VARCHAR(100) UNIQUE NOT NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    payment_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(50) CHECK (payment_method IN ('Cash', 'Cheque', 'Bank Transfer', 'Online')),
    collected_by UUID REFERENCES users(id) ON DELETE SET NULL,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE salary_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE RESTRICT,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL,
    month_year VARCHAR(20) NOT NULL,
    payment_method VARCHAR(50),
    status VARCHAR(20) DEFAULT 'Paid' CHECK (status IN ('Paid', 'Pending')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 1️⃣3️⃣  LIBRARY
-- =============================================================================

CREATE TABLE library_books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255),
    isbn VARCHAR(50) UNIQUE,
    category VARCHAR(100),
    total_copies INT DEFAULT 1,
    available_copies INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE library_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES library_books(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    return_date DATE,
    fine_amount NUMERIC(8, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'Issued' CHECK (status IN ('Issued', 'Returned', 'Lost')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 1️⃣4️⃣  TRANSPORT
-- =============================================================================

CREATE TABLE transport_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_name VARCHAR(150) NOT NULL,
    start_point VARCHAR(150) NOT NULL,
    end_point VARCHAR(150) NOT NULL,
    fee_per_month NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transport_vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_number VARCHAR(50) UNIQUE NOT NULL,
    capacity INT NOT NULL,
    driver_name VARCHAR(150),
    driver_phone VARCHAR(50),
    route_id UUID REFERENCES transport_routes(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE student_transport (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    route_id UUID NOT NULL REFERENCES transport_routes(id) ON DELETE RESTRICT,
    pickup_point VARCHAR(150),
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_student_transport UNIQUE(enrollment_id, route_id)
);

-- =============================================================================
-- 1️⃣5️⃣  INVENTORY
-- =============================================================================

CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_name VARCHAR(150) NOT NULL,
    category VARCHAR(100),
    quantity INT DEFAULT 0,
    unit_price NUMERIC(10, 2),
    purchase_date DATE,
    status VARCHAR(50) DEFAULT 'Good' CHECK (status IN ('Good', 'Damaged', 'Lost', 'Maintenance')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 1️⃣6️⃣  COMMUNICATION
-- =============================================================================

CREATE TABLE sms_email_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('SMS', 'Email', 'Push')),
    recipient_type VARCHAR(20) CHECK (recipient_type IN ('Student', 'Parent', 'Teacher', 'Staff', 'All')),
    recipient_id UUID,
    recipient_contact VARCHAR(255),
    subject VARCHAR(255),
    body TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Sent', 'Failed', 'Delivered')),
    sent_by UUID REFERENCES users(id) ON DELETE SET NULL,
    sent_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 1️⃣7️⃣  SYSTEM & AUDIT
-- =============================================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE system_locks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lock_key VARCHAR(100) UNIQUE NOT NULL,
    locked_by UUID REFERENCES users(id),
    locked_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    reason TEXT
);

CREATE TABLE countries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    iso VARCHAR(10) NOT NULL,
    country_name VARCHAR(100) NOT NULL,
    phone_code INT NOT NULL,
    iso3 VARCHAR(10) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

CREATE INDEX idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX idx_enrollments_academic_year_id ON enrollments(academic_year_id);
CREATE INDEX idx_exam_marks_exam_id ON exam_marks(exam_id);
CREATE INDEX idx_exam_marks_enrollment_id ON exam_marks(enrollment_id);
CREATE INDEX idx_fee_payments_student_fee ON fee_payments(student_fee_id);
CREATE INDEX idx_result_summaries_exam_id ON result_summaries(exam_id);

-- =============================================================================
-- END OF INITIAL SCHEMA
-- =============================================================================

-- ================================================================
-- SCHOOL ERP PRODUCTION UPGRADE
-- For Real School Deployment
-- Generated 2026-02-25
-- ================================================================

-- ================================================================
-- 1️⃣ SOFT DELETE SUPPORT
-- ================================================================

ALTER TABLE students 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE staff 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE classes 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE subjects 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE enrollments 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE exams 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- ================================================================
-- 2️⃣ ROLL NUMBER UNIQUE PER CLASS/YEAR
-- ================================================================

ALTER TABLE enrollments
ADD CONSTRAINT uq_roll_per_class
UNIQUE (academic_year_id, class_id, section_id, roll_number);

-- ================================================================
-- 3️⃣ TIMETABLE SLOT CONFLICT PROTECTION
-- ================================================================

ALTER TABLE class_timetables
ADD CONSTRAINT uq_timetable_slot
UNIQUE (academic_year_id, class_id, section_id, day_of_week, period);

-- ================================================================
-- 4️⃣ LEAVE MANAGEMENT MODULE
-- ================================================================

CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    leave_type VARCHAR(50) CHECK (leave_type IN ('Sick', 'Casual', 'Official', 'Emergency')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_leave_dates CHECK (end_date >= start_date)
);

-- ================================================================
-- 5️⃣ STUDENT DISCOUNT / SCHOLARSHIP
-- ================================================================

CREATE TABLE IF NOT EXISTS student_discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    discount_type VARCHAR(50) CHECK (discount_type IN ('Percentage', 'Flat')),
    percentage NUMERIC(5,2),
    amount NUMERIC(10,2),
    reason TEXT,
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_discount_valid 
    CHECK (
        (discount_type = 'Percentage' AND percentage IS NOT NULL)
        OR
        (discount_type = 'Flat' AND amount IS NOT NULL)
    )
);

-- ================================================================
-- 6️⃣ DEPARTMENT SYSTEM
-- ================================================================

CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS department_staff (
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    PRIMARY KEY (department_id, staff_id)
);

-- ================================================================
-- 7️⃣ HOSTEL MODULE
-- ================================================================

CREATE TABLE IF NOT EXISTS hostel_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_number VARCHAR(50) UNIQUE NOT NULL,
    capacity INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hostel_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
    room_id UUID REFERENCES hostel_rooms(id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ================================================================
-- 8️⃣ LOGIN SECURITY LOG
-- ================================================================

CREATE TABLE IF NOT EXISTS login_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    login_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT,
    device_info TEXT
);

-- ================================================================
-- 9️⃣ PERFORMANCE INDEXES
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_students_user_id 
ON students(user_id);

CREATE INDEX IF NOT EXISTS idx_enrollments_class_id 
ON enrollments(class_id);

CREATE INDEX IF NOT EXISTS idx_enrollments_section_id 
ON enrollments(section_id);

CREATE INDEX IF NOT EXISTS idx_exam_marks_subject_id 
ON exam_marks(subject_id);

CREATE INDEX IF NOT EXISTS idx_attendance_enrollment_id 
ON attendance(enrollment_id);

CREATE INDEX IF NOT EXISTS idx_leave_requests_user_id 
ON leave_requests(user_id);

-- ================================================================
-- 10️⃣ USER STATUS FOR APPROVAL WORKFLOW
-- ================================================================

ALTER TABLE users
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PENDING', 'SUSPENDED'));

-- ================================================================
-- 11️⃣ EXAM PUBLISHING METADATA
-- ================================================================

ALTER TABLE exams
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS published_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- ================================================================
-- 12️⃣ EXAM MARKS VERIFICATION TIMESTAMP
-- ================================================================

ALTER TABLE exam_marks
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- ================================================================
-- END OF PRODUCTION UPGRADE
-- ================================================================

-- =============================================================================
-- AUTOMATION TRIGGERS
-- =============================================================================

-- 1. Auto-update updated_at column
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_institution_profiles
    BEFORE UPDATE ON institution_profiles
    FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER trigger_update_users
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER trigger_update_students
    BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER trigger_update_enrollments
    BEFORE UPDATE ON enrollments
    FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER trigger_update_staff
    BEFORE UPDATE ON staff
    FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER trigger_update_exam_marks
    BEFORE UPDATE ON exam_marks
    FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER trigger_update_result_summaries
    BEFORE UPDATE ON result_summaries
    FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER trigger_update_student_fees
    BEFORE UPDATE ON student_fees
    FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER trigger_update_salary_payments
    BEFORE UPDATE ON salary_payments
    FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- 2. Auto-calculate result_summaries on exam_marks insert/update
CREATE OR REPLACE FUNCTION calculate_result_summary()
RETURNS TRIGGER AS $$
DECLARE
    v_total NUMERIC(7,2);
    v_count INT;
    v_pass_count INT;
    v_status VARCHAR(20);
BEGIN
    SELECT COALESCE(SUM(marks_obtained), 0), COUNT(id)
    INTO v_total, v_count
    FROM exam_marks
    WHERE exam_id = NEW.exam_id AND enrollment_id = NEW.enrollment_id;

    SELECT COUNT(id) INTO v_pass_count
    FROM exam_marks
    WHERE exam_id = NEW.exam_id 
      AND enrollment_id = NEW.enrollment_id 
      AND marks_obtained >= 40 
      AND (total_marks IS NULL OR marks_obtained >= (total_marks * 0.4));

    IF v_count > 0 AND v_pass_count = v_count THEN
        v_status := 'Pass';
    ELSIF v_count > 0 THEN
        v_status := 'Fail';
    ELSE
        v_status := 'Withheld';
    END IF;

    INSERT INTO result_summaries (exam_id, enrollment_id, total_marks, status, updated_at)
    VALUES (NEW.exam_id, NEW.enrollment_id, v_total, v_status, now())
    ON CONFLICT (exam_id, enrollment_id)
    DO UPDATE SET 
        total_marks = EXCLUDED.total_marks,
        status = EXCLUDED.status,
        updated_at = now();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_exam_mark_insert_update
    AFTER INSERT OR UPDATE ON exam_marks
    FOR EACH ROW EXECUTE PROCEDURE calculate_result_summary();

-- =============================================================================
-- ROLE PERMISSIONS (PostgREST / Supabase Access)
-- These MUST be re-applied after every schema rebuild.
-- =============================================================================

-- Schema usage
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- anon role: read public data (for login lookup, public website)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- anon role: write to public-facing forms
GRANT INSERT ON TABLE public.contact_inquiries TO anon;
GRANT INSERT ON TABLE public.admission_applications TO anon;
GRANT INSERT ON TABLE public.reviews TO anon;
GRANT INSERT ON TABLE public.users TO anon;

-- authenticated role: full access for ERP operations
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Ensure future tables also get these grants
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
