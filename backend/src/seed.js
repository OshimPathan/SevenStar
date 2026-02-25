import bcrypt from 'bcrypt';
import { query } from './db.js';
import dotenv from 'dotenv';

dotenv.config();

const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || '10');

async function clearDatabase() {
    console.log('🧹 Clearing existing data...');
    const tables = [
        'audit_logs', 'system_locks', 'sms_email_log', 'inventory_items',
        'student_transport', 'transport_vehicles', 'transport_routes',
        'library_issues', 'library_books', 'salary_payments', 'fee_payments', 'student_fees', 'fee_structures',
        'assignment_submissions', 'assignments', 'result_summaries', 'exam_marks', 'exam_routines', 'exam_classes', 'exams',
        'attendance', 'class_timetables', 'teacher_assignments', 'subject_assignments', 'class_subjects', 'subjects',
        'class_teachers', 'staff', 'promotion_history', 'student_documents', 'student_parents', 'enrollments',
        'admission_applications', 'students', 'parents', 'users', 'sections', 'classes', 'streams', 'academic_years',
        'events', 'notices', 'contact_inquiries', 'reviews', 'gallery_photos', 'site_settings', 'institution_profiles', 'countries'
    ];

    for (const table of tables) {
        await query(`DELETE FROM ${table}`);
    }
}

async function seed() {
    console.log('🌱 Seeding database for Seven Star English Boarding School...\n');

    try {
        await clearDatabase();

        const passwordHash = await bcrypt.hash('password123', SALT_ROUNDS);
        const adminHash = await bcrypt.hash('admin123', SALT_ROUNDS);

        // ==========================================
        // 1. INSTITUTION & WEBSITE
        // ==========================================
        console.log('🏫 Seeding Institution Profiles & Site Settings...');
        await query(`
            INSERT INTO institution_profiles (name, principal_name, contact_email, contact_phone, address, established_date)
            VALUES ('Seven Star English Boarding School', 'Rajesh Sharma', 'info@sevenstar.edu.np', '+977-9801234567', 'Devdaha-5, Rupandehi, Nepal', '2005-04-15')
        `);

        await query(`
            INSERT INTO site_settings (key, value) VALUES 
            ('site_name', 'Seven Star English Boarding School'),
            ('academic_year', '2081/2082'),
            ('currency', 'NPR')
        `);

        await query(`
            INSERT INTO notices (title, content, is_active) VALUES
            ('Admission Open for 2082', 'Admissions are now open for Nursery to Class 9. Please visit the school office.', true),
            ('Final Terms Examination Routine', 'The final term exams will commence from Chaitra 15. The routine is available on the portal.', true)
        `);

        await query(`
            INSERT INTO events (title, description, start_date, end_date, location) VALUES
            ('Annual Sports Day', 'Join us for the annual sports meet!', '2026-03-10 09:00:00', '2026-03-12 16:00:00', 'School Ground'),
            ('Science Exhibition', 'Students presenting science projects.', '2026-02-28 10:00:00', '2026-02-28 15:00:00', 'Auditorium')
        `);

        await query(`
            INSERT INTO countries (iso, country_name, phone_code, iso3) VALUES 
            ('NP', 'Nepal', 977, 'NPL')
        `);

        let galleryRes = await query(`INSERT INTO gallery_photos (title, image_url, category) VALUES ('Sports Day 2080', 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', 'Sports') RETURNING id`);
        await query(`INSERT INTO reviews (name, content, rating) VALUES ('Hari Bahadur', 'Excellent school with great facilities', 5)`);
        await query(`INSERT INTO contact_inquiries (first_name, last_name, email, inquiry_type, message) VALUES ('Sita', 'Sharma', 'sita@gmail.com', 'Admission Questions', 'What are the admission fees?')`);


        // ==========================================
        // 2. ACADEMIC STRUCTURE
        // ==========================================
        console.log('📚 Seeding Academic Structure...');
        const academicYearRes = await query(`
            INSERT INTO academic_years (name, start_date, end_date, is_active)
            VALUES ('2081/2082', '2024-04-13', '2025-04-13', true) RETURNING id
        `);
        const academicYearId = academicYearRes.rows[0].id;

        const streamGen = await query(`INSERT INTO streams (name) VALUES ('General') RETURNING id`);
        const streamSci = await query(`INSERT INTO streams (name) VALUES ('Science') RETURNING id`);

        const classesData = ['Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'];
        const classIds = {};
        const sectionIds = {};

        for (let i = 0; i < classesData.length; i++) {
            const clsName = classesData[i];
            const res = await query(`INSERT INTO classes (name, level, stream_id) VALUES ($1, $2, $3) RETURNING id`, [clsName, i, streamGen.rows[0].id]);
            classIds[clsName] = res.rows[0].id;

            const s1 = await query(`INSERT INTO sections (class_id, name, capacity) VALUES ($1, 'A', 40) RETURNING id`, [classIds[clsName]]);
            sectionIds[clsName + '-A'] = s1.rows[0].id;

            if (['Class 8', 'Class 9', 'Class 10'].includes(clsName)) {
                const s2 = await query(`INSERT INTO sections(class_id, name, capacity) VALUES($1, 'B', 40) RETURNING id`, [classIds[clsName]]);
                sectionIds[clsName + '-B'] = s2.rows[0].id;
            }
        }


        // ==========================================
        // 3. SUBJECTS
        // ==========================================
        console.log('📖 Seeding Subjects...');
        const subjectsList = [
            { code: 'ENG', name: 'English' }, { code: 'NEP', name: 'Nepali' }, { code: 'MAT', name: 'Mathematics' },
            { code: 'SCI', name: 'Science' }, { code: 'SOC', name: 'Social Studies' }, { code: 'COM', name: 'Computer Science' },
            { code: 'OPT.MAT', name: 'Optional Mathematics' }, { code: 'ACC', name: 'Accountancy' }
        ];
        const subjectIds = {};
        for (const sub of subjectsList) {
            const res = await query(`INSERT INTO subjects(code, name) VALUES($1, $2) RETURNING id`, [sub.code, sub.name]);
            subjectIds[sub.code] = res.rows[0].id;
        }

        const class10Id = classIds['Class 10'];
        const classSubjectsList = ['ENG', 'NEP', 'MAT', 'SCI', 'SOC', 'COM'];
        const classSubjectIds = {};

        for (const subCode of classSubjectsList) {
            const cs = await query(`INSERT INTO class_subjects(class_id, subject_id, full_marks, pass_marks) VALUES($1, $2, 100, 40) RETURNING id`, [class10Id, subjectIds[subCode]]);
            classSubjectIds[subCode] = cs.rows[0].id;
        }


        // ==========================================
        // 4. USERS & STAFF
        // ==========================================
        console.log('👥 Seeding Users & Staff...');
        const usersCreated = {};
        const createUser = async (name, email, role, hash = passwordHash) => {
            const res = await query(`INSERT INTO users(name, email, password_hash, role) VALUES($1, $2, $3, $4) RETURNING id`, [name, email, hash, role]);
            usersCreated[email] = res.rows[0].id;
            return res.rows[0].id;
        };

        const adminId = await createUser('System Admin', 'admin@sevenstar.edu.np', 'ADMIN', adminHash);

        const teachers = [
            { name: 'Suman Adhikari', email: 'suman.adhikari@sevenstar.edu.np', subj: 'MAT' },
            { name: 'Anita Basnet', email: 'anita.basnet@sevenstar.edu.np', subj: 'ENG' },
            { name: 'Bikram Thapa', email: 'bikram.thapa@sevenstar.edu.np', subj: 'SCI' }
        ];

        const staffIds = {};
        for (let i = 0; i < teachers.length; i++) {
            const t = teachers[i];
            const uid = await createUser(t.name, t.email, 'TEACHER');

            // Note: avoid backticks for string formatting to prevent the parser bug
            const empIdStr = "EMP0" + (i + 1).toString();
            const fName = t.name.split(' ')[0];
            const lName = t.name.split(' ')[1];

            const sRes = await query(`
                INSERT INTO staff(user_id, employee_id, first_name, last_name, staff_type, designation, hire_date, base_salary)
            VALUES($1, $2, $3, $4, 'Teaching', 'Senior Teacher', '2020-04-15', 45000) RETURNING id
            `, [uid, empIdStr, fName, lName]);
            staffIds[t.email] = sRes.rows[0].id;

            // Teacher Assignments
            await query(`INSERT INTO subject_assignments(teacher_id, class_id, section_id, subject_id, academic_year_id) VALUES($1, $2, $3, $4, $5)`,
                [staffIds[t.email], class10Id, sectionIds['Class 10-A'], subjectIds[t.subj], academicYearId]
            );

            await query(`INSERT INTO teacher_assignments(staff_id, academic_year_id, class_subject_id, section_id) VALUES($1, $2, $3, $4)`,
                [staffIds[t.email], academicYearId, classSubjectIds[t.subj], sectionIds['Class 10-A']]
            );
        }

        // Assign Class Teacher
        await query(`INSERT INTO class_teachers(academic_year_id, class_id, section_id, staff_id) VALUES($1, $2, $3, $4)`,
            [academicYearId, class10Id, sectionIds['Class 10-A'], staffIds['suman.adhikari@sevenstar.edu.np']]
        );


        // ==========================================
        // 5. PARENTS & STUDENTS
        // ==========================================
        console.log('👨‍👩‍👦 Seeding Parents & Students...');
        const parent1Id = await createUser('Hari Sharma', 'hari.sharma@gmail.com', 'PARENT');
        const p1Res = await query(`
            INSERT INTO parents(user_id, father_name, father_phone, father_email, address)
            VALUES($1, 'Hari Sharma', '9851234567', 'hari.sharma@gmail.com', 'Devdaha-5') RETURNING id
                `, [parent1Id]);
        const parentRecordId = p1Res.rows[0].id;

        const studentsToSeed = [
            { fname: 'Aarav', lname: 'Sharma', email: 'aarav.sharma@sevenstar.edu.np', gender: 'Male' },
            { fname: 'Priya', lname: 'Thapa', email: 'priya.thapa@sevenstar.edu.np', gender: 'Female' }
        ];

        const enrollmentIds = [];
        for (let i = 0; i < studentsToSeed.length; i++) {
            const s = studentsToSeed[i];
            const fullName = s.fname + " " + s.lname;
            const uid = await createUser(fullName, s.email, 'STUDENT');

            const admNo = "ADM2024" + (i + 1).toString().padStart(3, '0');

            const stuRes = await query(`
                INSERT INTO students(user_id, admission_number, first_name, last_name, gender, parent_user_id, status)
            VALUES($1, $2, $3, $4, $5, $6, 'Active') RETURNING id
            `, [uid, admNo, s.fname, s.lname, s.gender, parent1Id]);
            const stuId = stuRes.rows[0].id;

            await query(`INSERT INTO student_parents(student_id, parent_id) VALUES($1, $2)`, [stuId, parentRecordId]);

            // Enrollment
            const enrRes = await query(`
                INSERT INTO enrollments(student_id, academic_year_id, class_id, section_id, roll_number)
            VALUES($1, $2, $3, $4, $5) RETURNING id
                `, [stuId, academicYearId, class10Id, sectionIds['Class 10-A'], i + 1]);
            enrollmentIds.push({ id: enrRes.rows[0].id, stuId });

            // Attendance
            await query(`
                INSERT INTO attendance(enrollment_id, attendance_date, status, marked_by)
            VALUES($1, CURRENT_DATE, 'Present', $2)
            `, [enrRes.rows[0].id, staffIds['suman.adhikari@sevenstar.edu.np']]);
        }

        await query(`INSERT INTO admission_applications(student_name, applied_for_class, status) VALUES('Rahul Bista', 'Class 5', 'Pending')`);


        // ==========================================
        // 6. EXAMS & RESULTS
        // ==========================================
        console.log('📝 Seeding Exams & Marks...');
        const examRes = await query(`
            INSERT INTO exams(academic_year_id, name, exam_type, start_date, end_date, published, results_published)
            VALUES($1, 'First Term Examination 2081', 'Terminal', '2024-07-15', '2024-07-25', true, true) RETURNING id
        `, [academicYearId]);
        const examId = examRes.rows[0].id;

        const examClassRes = await query(`INSERT INTO exam_classes(exam_id, class_id, is_result_published) VALUES($1, $2, true) RETURNING id`, [examId, class10Id]);
        const examClassId = examClassRes.rows[0].id;

        await query(`INSERT INTO exam_routines(exam_class_id, subject_id, exam_date) VALUES($1, $2, '2024-07-15')`, [examClassId, subjectIds['ENG']]);

        for (const enr of enrollmentIds) {
            let total = 0;
            for (const subCode of classSubjectsList) {
                const marks = Math.floor(Math.random() * (95 - 60 + 1)) + 60;
                total += marks;
                await query(`
                    INSERT INTO exam_marks(exam_id, enrollment_id, subject_id, marks_obtained, theory_marks, practical_marks, total_marks, grade, verified)
            VALUES($1, $2, $3, $4, $5, $6, $7, $8, true)
                `, [examId, enr.id, subjectIds[subCode], marks, marks, 0, marks, marks > 80 ? 'A' : 'B']);
            }
        }


        // ==========================================
        // 7. ASSIGNMENTS
        // ==========================================
        console.log('📋 Seeding Assignments...');
        const assignmentRes = await query(`
            INSERT INTO assignments(academic_year_id, class_id, section_id, subject_id, teacher_id, title, description, due_date, total_points, created_by)
            VALUES($1, $2, $3, $4, $5, 'Algebra Homework', 'Solve exercise 4.1 completely', CURRENT_DATE + INTERVAL '2 days', 10, $6) RETURNING id
                `, [academicYearId, class10Id, sectionIds['Class 10-A'], subjectIds['MAT'], staffIds['suman.adhikari@sevenstar.edu.np'], usersCreated['suman.adhikari@sevenstar.edu.np']]);

        for (const enr of enrollmentIds) {
            await query(`
                INSERT INTO assignment_submissions(assignment_id, enrollment_id, marks, total_marks, graded_by, remarks)
            VALUES($1, $2, 9, 10, $3, 'Good job!')
                `, [assignmentRes.rows[0].id, enr.id, staffIds['suman.adhikari@sevenstar.edu.np']]);
        }


        // ==========================================
        // 8. FEES & FINANCE
        // ==========================================
        console.log('💰 Seeding Fees & Finances...');
        const feeRes = await query(`
            INSERT INTO fee_structures(academic_year_id, class_id, fee_type, amount, frequency)
            VALUES($1, $2, 'Tuition Fee - Shrawan', 3500, 'Monthly') RETURNING id
                `, [academicYearId, class10Id]);
        const feeStructureId = feeRes.rows[0].id;

        for (const enr of enrollmentIds) {
            const studentFeeRes = await query(`
                INSERT INTO student_fees(enrollment_id, fee_structure_id, due_date, amount_due, amount_paid, status)
            VALUES($1, $2, '2024-08-15', 3500, 3500, 'Paid') RETURNING id
                `, [enr.id, feeStructureId]);

            await query(`
                INSERT INTO fee_payments(student_fee_id, receipt_number, amount, payment_method, collected_by)
            VALUES($1, $2, 3500, 'Cash', $3)
            `, [studentFeeRes.rows[0].id, "RCP202400" + enr.id.substring(0, 5), adminId]);
        }

        await query(`INSERT INTO salary_payments(staff_id, amount, payment_date, month_year, status) VALUES($1, 45000, '2024-08-01', 'Shrawan 2081', 'Paid')`, [staffIds['suman.adhikari@sevenstar.edu.np']]);


        // ==========================================
        // 9. LIBRARY, TRANSPORT, INVENTORY & OTHER
        // ==========================================
        console.log('🚌 Seeding Library, Transport & Inventory...');
        const libBookRes = await query(`INSERT INTO library_books(title, author, isbn, category, total_copies, available_copies) VALUES('Physics Grade 10', 'Ram Prasad', 'ISBN-977-1', 'Textbook', 5, 4) RETURNING id`);
        await query(`INSERT INTO library_issues(book_id, user_id, due_date, status) VALUES($1, $2, CURRENT_DATE + INTERVAL '14 days', 'Issued')`, [libBookRes.rows[0].id, usersCreated['aarav.sharma@sevenstar.edu.np']]);

        const routeRes = await query(`INSERT INTO transport_routes(route_name, start_point, end_point, fee_per_month) VALUES('Route 1: Butwal', 'Devdaha', 'Butwal Bus Park', 2000) RETURNING id`);
        await query(`INSERT INTO transport_vehicles(vehicle_number, capacity, driver_name, route_id) VALUES('LU 1 KHA 1122', 40, 'Shyam Kumar', $1)`, [routeRes.rows[0].id]);
        await query(`INSERT INTO student_transport(enrollment_id, route_id, start_date, is_active) VALUES($1, $2, '2024-04-15', true)`, [enrollmentIds[0].id, routeRes.rows[0].id]);

        await query(`INSERT INTO inventory_items(item_name, category, quantity, unit_price, status) VALUES('Whiteboard Markers', 'Stationery', 50, 100, 'Good')`);
        await query(`INSERT INTO system_locks(lock_key, reason, locked_by) VALUES('term_1_results', 'Publishing term 1 results', $1)`, [adminId]);


        console.log('\n✅ Database seeded successfully!');
        console.log('\n📋 Login Credentials:');
        console.log('  Admin:   admin@sevenstar.edu.np / admin123');
        console.log('  Teacher: suman.adhikari@sevenstar.edu.np / password123');
        console.log('  Student: aarav.sharma@sevenstar.edu.np / password123');
        console.log('  Parent:  hari.sharma@gmail.com / password123');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
    process.exit(0);
}

seed();
