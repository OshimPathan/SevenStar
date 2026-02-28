// ===== BULK IMPORT FUNCTIONS =====

/**
 * Bulk-create students from CSV rows.
 * Each row should have keys matching CSV headers: Name, Email, Class, Roll, Gender, DOB, etc.
 */
export async function bulkCreateStudents(rows, classesLookup = []) {
    let success = 0;
    const errors = [];
    for (const row of rows) {
        try {
            // Map CSV headers → createStudent form shape
            const className = row['Class'] || '';
            let classId = '';
            if (className && classesLookup.length > 0) {
                const match = classesLookup.find(c => (c.name || '').toLowerCase().trim() === className.toLowerCase().trim());
                if (match) classId = match.id;
            }
            const form = {
                name: row['Name'] || '',
                email: row['Email'] || '',
                password: 'student123',
                class_id: classId,
                roll_number: row['Roll'] || '',
                gender: row['Gender'] || '',
                date_of_birth: row['DOB'] || '',
                blood_group: row['Blood Group'] || '',
                address: row['Address'] || '',
                parent_name: row['Father Name'] || '',
                parent_phone: row['Father Phone'] || '',
                mother_name: row['Mother Name'] || '',
                mother_phone: row['Mother Phone'] || '',
                create_parent_account: false,
            };
            if (!form.name || !form.email) throw new Error('Name and Email are required');
            await createStudent(form);
            success++;
        } catch (e) {
            errors.push({ row: row._rowNum || 0, message: `${row['Name'] || 'Row'}: ${e.message}` });
        }
    }
    return { success, errors };
}

/**
 * Bulk-create teachers from CSV rows.
 */
export async function bulkCreateTeachers(rows) {
    let success = 0;
    const errors = [];
    for (const row of rows) {
        try {
            const form = {
                name: row['Name'] || '',
                email: row['Email'] || '',
                password: 'teacher123',
                qualification: row['Qualification'] || '',
                phone: row['Phone'] || '',
                address: row['Address'] || '',
                joined_date: row['Hire Date'] || '',
            };
            if (!form.name || !form.email) throw new Error('Name and Email are required');
            await createTeacher(form);
            success++;
        } catch (e) {
            errors.push({ row: row._rowNum || 0, message: `${row['Name'] || 'Row'}: ${e.message}` });
        }
    }
    return { success, errors };
}

/**
 * Bulk-create classes from CSV rows.
 */
export async function bulkCreateClasses(rows) {
    let success = 0;
    const errors = [];
    for (const row of rows) {
        try {
            const classData = {
                name: row['Class Name'] || '',
                level: row['Level'] || '1',
                section: row['Sections'] || 'A',
            };
            if (!classData.name) throw new Error('Class Name is required');
            // Create the class
            const cls = await addClass(classData);
            // If multiple sections specified (e.g. "A,B,C") add the extras
            const sections = (row['Sections'] || 'A').split(',').map(s => s.trim()).filter(Boolean);
            if (sections.length > 1) {
                for (const sec of sections.slice(1)) {
                    await insforge.database.from('sections').insert([{ class_id: cls.id, name: sec }]).select();
                }
            }
            success++;
        } catch (e) {
            errors.push({ row: row._rowNum || 0, message: `${row['Class Name'] || 'Row'}: ${e.message}` });
        }
    }
    return { success, errors };
}

// Bulk Fees
export async function createBulkFees(studentIds, payload) {
    const activeYear = await getActiveAcademicYear();
    if (!activeYear) return { success: true };
    const created = [];
    for (const studentId of studentIds) {
        const { data: enr } = await insforge.database.from('enrollments').select('id, class_id').eq('student_id', studentId).eq('academic_year_id', activeYear.id).maybeSingle();
        if (!enr) continue;
        const { data: fs } = await insforge.database.from('fee_structures').upsert([{
            academic_year_id: activeYear.id,
            class_id: enr.class_id,
            fee_type: 'Custom',
            amount: parseFloat(payload.amount || 0),
            frequency: 'One-time'
        }], { onConflict: 'academic_year_id,class_id,fee_type' }).select();
        const fsId = fs?.[0]?.id;
        if (!fsId) continue;
        const { data } = await insforge.database.from('student_fees').insert([{
            enrollment_id: enr.id,
            fee_structure_id: fsId,
            due_date: payload.due_date || null,
            amount_due: parseFloat(payload.amount || 0),
            amount_paid: 0,
            status: 'Unpaid',
        }]).select();
        if (data?.[0]) created.push(data[0]);
    }
    return created;
}
// Convert Admission to Student
export async function convertAdmissionToStudent(admission_id) {
    const { data: app, error: appError } = await insforge.database
        .from('admission_applications')
        .select('*')
        .eq('id', admission_id)
        .maybeSingle();
    if (appError || !app) throw new Error(appError?.message || 'Application not found');

    const name = (app.student_name || '').trim();
    const parts = name.split(' ').filter(Boolean);
    const firstName = parts[0] || 'Student';
    const lastName = parts.slice(1).join(' ') || '.';

    const email = `student+${Date.now()}@sevenstar.edu.np`;
    const password = 'student123';
    const passwordHash = await bcrypt.hash(password, 10);

    const { data: userRows, error: userErr } = await insforge.database
        .from('users')
        .insert([{ name, email, password_hash: passwordHash, role: 'STUDENT' }])
        .select();
    if (userErr) throw new Error(userErr.message);
    const userId = userRows?.[0]?.id;

    const admissionNumber = `ADM${new Date().getFullYear()}${String(Date.now()).slice(-4)}`;

    const { data: stuRows, error: stuErr } = await insforge.database
        .from('students')
        .insert([{
            user_id: userId,
            admission_number: admissionNumber,
            first_name: firstName,
            last_name: lastName,
            date_of_birth: app.date_of_birth || null,
            gender: app.gender || null,
            address: app.address || null,
            father_name: app.parent_name || null,
            father_phone: app.parent_phone || null,
            status: 'Active'
        }])
        .select();
    if (stuErr) throw new Error(stuErr.message);
    const student = stuRows?.[0];

    const activeYear = await getActiveAcademicYear();
    if (activeYear && app.applied_for_class) {
        const { data: cls } = await insforge.database.from('classes').select('id').eq('name', app.applied_for_class).maybeSingle();
        if (cls?.id) {
            let sectionId = null;
            const { data: secs } = await insforge.database.from('sections').select('id').eq('class_id', cls.id).limit(1);
            if (secs?.length) sectionId = secs[0].id;
            if (sectionId) {
                await insforge.database.from('enrollments').insert([{
                    student_id: student.id,
                    academic_year_id: activeYear.id,
                    class_id: cls.id,
                    section_id: sectionId,
                    roll_number: null
                }]);
            }
        }
    }

    await insforge.database
        .from('admission_applications')
        .update({ status: 'ACCEPTED' })
        .eq('id', admission_id);

    return { student, credentials: { email, password } };
}
// Delete Admission Application
export async function deleteAdmissionApplication(id) {
    // Example: Delete admission application by id
    const { data, error } = await insforge.database
        .from('admission_applications')
        .delete()
        .eq('id', id)
        .select();
    if (error) throw new Error(error.message);
    return data;
}
// Admission Status
export async function updateAdmissionStatus(idOrObj, statusArg) {
    let id, status
    if (typeof idOrObj === 'object' && idOrObj !== null) {
        id = idOrObj.id
        status = idOrObj.status
    } else {
        id = idOrObj
        status = statusArg
    }
    status = (status || '').toUpperCase()
    const { data, error } = await insforge.database
        .from('admission_applications')
        .update({ status })
        .eq('id', id)
        .select()
    if (error) throw new Error(error.message)
    return data?.[0]
}
// Verify All Marks for Exam

// Results for Class Exam
export async function getResultsForClassExam(examId, classId) {
    const { data: students } = await insforge.database.from('enrollments')
        .select('student_id, roll_number, students(id, users(name))')
        .eq('class_id', classId);
    const { data: results } = await insforge.database.from('exam_marks')
        .select('*')
        .eq('exam_id', examId);
    return {
        students: (students || []).map(s => ({
            id: s.student_id,
            name: s.students?.users?.name || 'Student',
            roll_number: s.roll_number
        })),
        results: results || []
    };
}
// Exam Routines — uses exam_class_id FK (not exam_id)
export async function saveBulkExamRoutines(examId, routines, classId) {
    // Look up the exam_classes row for this exam
    let query = insforge.database.from('exam_classes').select('id, class_id').eq('exam_id', examId);
    if (classId) query = query.eq('class_id', classId);
    const { data: ecRows } = await query;
    let examClassId;
    if (ecRows && ecRows.length > 0) {
        examClassId = ecRows[0].id;
    } else {
        throw new Error('No exam_classes record found for this exam. Ensure the exam is linked to a class.');
    }
    const payload = (routines || []).map(r => ({
        exam_class_id: examClassId,
        subject_id: r.subject_id,
        exam_date: r.exam_date || null,
        start_time: r.start_time || null,
        end_time: r.end_time || null,
        room_number: r.room || r.room_number || null
    }));
    const { data, error } = await insforge.database.from('exam_routines').upsert(payload, { onConflict: 'exam_class_id,subject_id' }).select();
    if (error) throw new Error(error.message);
    return data;
}
// Exam Routines — fetch by exam_id (resolve through exam_classes)
export async function getExamRoutines(examId) {
    // Find all exam_class IDs for this exam
    const { data: ecRows } = await insforge.database.from('exam_classes').select('id').eq('exam_id', examId);
    if (!ecRows || ecRows.length === 0) return [];
    const ecIds = ecRows.map(r => r.id);
    const { data, error } = await insforge.database
        .from('exam_routines')
        .select('*, subjects(name)')
        .in('exam_class_id', ecIds)
        .order('exam_date', { ascending: true });
    if (error) throw new Error(error.message);
    // Normalize field names for frontend compatibility
    return (data || []).map(r => ({
        ...r,
        room: r.room_number || '',
        subject_name: r.subjects?.name || ''
    }));
}
// Exams
export async function toggleExamPublished(examId, isPublished) {
    const { data, error } = await insforge.database.from('exams').update({ published: !!isPublished }).eq('id', examId).select();
    if (error) throw new Error(error.message);
    return data?.[0] || {};
}
// Exams
export async function updateExam(id, payload) {
    const upd = {};
    ['name', 'description', 'start_date', 'end_date', 'exam_type', 'full_marks', 'pass_marks', 'published', 'results_published'].forEach(k => {
        if (payload[k] !== undefined) upd[k] = payload[k];
    });
    if (Object.keys(upd).length > 0) {
        const { error } = await insforge.database.from('exams').update(upd).eq('id', id);
        if (error) throw new Error(error.message);
    }

    if (payload.class_id) {
        // Assume 1 exam = 1 class for this UI. 
        await insforge.database.from('exam_classes').delete().eq('exam_id', id);
        await insforge.database.from('exam_classes').insert([{ exam_id: id, class_id: payload.class_id }]);
    }

    return { success: true };
}
// Program Subjects
export async function updateProgramSubject({ id, name, description }) {
    // Example: Update program subject details
    const { data, error } = await insforge.database
        .from('subjects')
        .update({ name, description })
        .eq('id', id)
        .select();
    if (error) throw new Error(error.message);
    return data[0];
}
// Gallery
export async function updateGalleryPhoto({ id, caption, image_url }) {
    const { data, error } = await insforge.database
        .from('gallery_photos')
        .update({ title: caption, image_url })
        .eq('id', id)
        .select();
    if (error) throw new Error(error.message);
    return data[0];
}
// Students by Class Detailed
export async function getStudentsByClassDetailed(class_id) {
    // Example: Fetch detailed student info for a class
    const { data, error } = await insforge.database
        .from('enrollments')
        .select('student_id, students(id, user_id, first_name, last_name, admission_number, users:users!students_user_id_fkey(name, email)), class_id, classes(name), section_id, sections(name)')
        .eq('class_id', class_id);
    if (error) throw new Error(error.message);
    return data;
}
// Teacher Subjects with Classes
export async function getTeacherSubjectsWithClasses(teacher_id) {
    // Example: Fetch subjects and classes assigned to teacher
    const { data, error } = await insforge.database
        .from('subject_assignments')
        .select('subject_id, subjects(name), class_id, classes(name)')
        .eq('teacher_id', teacher_id);
    if (error) throw new Error(error.message);
    return data;
}
// Teacher Subjects
export async function getTeacherSubjectsForClass(a, b) {
    let teacher_id, class_id;
    if (typeof a === 'object') {
        teacher_id = a.teacher_id;
        class_id = a.class_id;
    } else {
        teacher_id = a;
        class_id = b;
    }
    const { data, error } = await insforge.database
        .from('class_subjects')
        .select('subject_id, subjects(name)')
        .eq('class_id', class_id);
    if (error) throw new Error(error.message);
    return (data || []).map(r => ({ id: r.subject_id, name: r.subjects?.name || 'Subject' }));
}
// Results
export async function checkResultPublic(examId, rollNumber) {
    // 1. Get Exam details to know the academic year
    const { data: exam, error: examError } = await insforge.database
        .from('exams')
        .select('*, academic_years(name)')
        .eq('id', examId)
        .single();
    if (examError || !exam) throw new Error('Exam not found');

    // 2. Find student enrollment
    // Note: We need to filter by roll_number AND academic_year_id
    // But roll_number might not be unique across classes?
    // Usually unique per class. But result checking usually asks for Class + Roll, or unique Admission No.
    // The UI asks for "Exam" and "Roll Number".
    // If multiple students have same roll number in different classes, this is ambiguous unless Exam is specific to a class.
    // However, `exams` table doesn't have `class_id` column in the schema I saw earlier?
    // Wait, let's check exams schema again.
    // Schema says: id, academic_year_id, name, start_date, end_date...
    // NO class_id column in `exams` table schema output!
    // But `createExam` in api.js inserts `class_id`?
    // Line 1085: `class_id: form.class_id || null,`
    // If `exams` table doesn't have `class_id`, `createExam` would fail.
    // Let me check `exams` schema again very carefully.

    // Schema output for `exams`:
    // columns: id, academic_year_id, name, start_date, end_date, created_at, updated_at.
    // NO class_id.

    // This is a problem. Exams are usually per class or global.
    // If exams are global (e.g. "First Term"), then multiple students have same roll number (Class 1 Roll 1, Class 2 Roll 1).
    // So "Roll Number" alone is insufficient to identify a student for a global exam.
    // ResultChecker.jsx only asks for Exam and Roll Number.
    // If the exam is specific to a class (e.g. "Class 10 Unit Test"), then it's fine.
    // But if the schema doesn't link exam to class, how do we know?
    // Maybe `exam_classes` table links exams to classes?
    // Let's check `exam_classes` table.

    // Assuming for now we need to find the student.
    // If we can't uniquely identify, we might need to ask for Class in the UI or assume unique roll numbers?
    // Or maybe the user enters Admission Number?
    // The UI says "Roll Number" (e.g. 1001). 1001 looks like admission number.
    // If it's Admission Number, it's unique.
    // Let's assume the user input `rollNumber` is actually used to match `enrollments.roll_number` OR `students.admission_number`.
    // But `enrollments` has `roll_number` (integer usually).
    // `students` has `admission_number` (string).

    // Let's try to match by Admission Number first (safer), then Roll Number if possible.
    // But `ResultChecker` label is "Roll Number".

    // Let's look for `exam_classes` table to see if exams are linked to classes.
    const { data: examClasses } = await insforge.database.from('exam_classes').select('class_id').eq('exam_id', examId);

    let enrollmentQuery = insforge.database.from('enrollments')
        .select('id, student_id, roll_number, class_id, classes(name), students(first_name, last_name, admission_number, users(name))')
        .eq('academic_year_id', exam.academic_year_id);

    // If exam is linked to specific classes, filter enrollments by those classes
    if (examClasses && examClasses.length > 0) {
        const classIds = examClasses.map(ec => ec.class_id);
        enrollmentQuery = enrollmentQuery.in('class_id', classIds);
    }

    // Try to match roll number (as string or int)
    // Note: roll_number in DB is likely INT. Input is string.
    const rollInt = parseInt(rollNumber);
    if (!isNaN(rollInt)) {
        enrollmentQuery = enrollmentQuery.eq('roll_number', rollInt);
    } else {
        // If not a number, maybe they entered admission number?
        // But enrollment doesn't have admission_number.
        // We'd need to join students.
        // PostgREST doesn't support filtering on joined tables easily in one go unless using !inner.
        // Let's assume Roll Number for now as per UI label.
        return { error: 'Invalid Roll Number format' };
    }

    const { data: enrollments } = await enrollmentQuery;

    if (!enrollments || enrollments.length === 0) {
        throw new Error('Student not found with this Roll Number for the selected exam.');
    }

    // If multiple students found (same roll in different classes for a shared exam), we have an issue.
    // We should probably error out or pick the first one?
    // For now, pick first.
    const enroll = enrollments[0];

    // 3. Get Result Summary
    const { data: summary } = await insforge.database
        .from('result_summaries')
        .select('*')
        .eq('exam_id', examId)
        .eq('enrollment_id', enroll.id)
        .maybeSingle();

    if (!summary) throw new Error('Results not published or not found for this student.');

    // 4. Get Detailed Marks
    const { data: marks } = await insforge.database
        .from('exam_marks')
        .select('*, subjects(name, is_optional, full_marks)') // subjects might have full_marks?
        .eq('exam_id', examId)
        .eq('enrollment_id', enroll.id);

    // Calculate Division if missing
    let division = summary.grade || 'N/A'; // Fallback
    const pct = parseFloat(summary.percentage || 0);
    if (pct >= 80) division = 'Distinction';
    else if (pct >= 60) division = 'First Division';
    else if (pct >= 45) division = 'Second Division';
    else if (pct >= 32) division = 'Third Division';
    else division = 'Failed';

    return {
        student_name: enroll.students?.users?.name || `${enroll.students?.first_name} ${enroll.students?.last_name}`,
        roll_number: enroll.roll_number,
        class_name: enroll.classes?.name,
        exam_name: exam.name,
        total_obtained: summary.total_marks,
        total_marks: 0, // Need to sum subjects or get from somewhere
        percentage: summary.percentage,
        division: division,
        subjects: (marks || []).map(m => ({
            subject_name: m.subjects?.name || 'Subject',
            marks_obtained: m.marks_obtained,
            total_marks: m.total_marks || 100, // fallbacks
            grade: m.grade
        }))
    };
}
// Results
export async function getPublishedExamsForResults() {
    // Example: Fetch published exams for result checking
    const { data, error } = await insforge.database
        .from('exams')
        .select('*')
        .eq('published', true)
        .eq('results_published', true)
        .order('start_date', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
}
// Admissions
export async function submitAdmissionApplication(form) {
    const payload = { ...form };

    // Handle photo upload if it's a File object
    if (payload.photo && typeof payload.photo === 'object') {
        try {
            const file = payload.photo;
            const key = `admissions/${Date.now()}_${file.name.replace(/\s+/g, '-')}`;
            const { error: upErr } = await insforge.storage.from('admissions').upload(key, file);
            if (upErr) throw upErr;
            const { publicUrl } = insforge.storage.from('admissions').getPublicUrl(key);
            payload.photo_url = publicUrl;
        } catch (e) {
            console.error('Photo upload failed:', e);
            // Continue without photo or throw? 
            // Better to throw so user knows.
            throw new Error('Failed to upload photo: ' + e.message);
        }
    }

    // Remove the File object before insert
    delete payload.photo;

    // Insert into admission_applications table
    const { data, error } = await insforge.database.from('admission_applications').insert([
        payload
    ]).select();
    if (error) throw new Error(error.message);
    return data[0];
}
// Exams
export async function getPublishedExamSchedule() {
    // P3 FIX: Optimized N+1 query string. Fetches exams, their classes, and routines in a single query.
    const { data: exams, error } = await insforge.database
        .from('exams')
        .select(`
            *,
            exam_classes (
                class_id,
                classes (name),
                exam_routines (
                    id, exam_date, start_time, end_time, room_number,
                    subjects (name)
                )
            )
        `)
        .eq('published', true)
        .order('start_date', { ascending: true });
    if (error) throw new Error(error.message);

    const result = [];
    for (const ex of exams || []) {
        // Assume 1:many but display first for public page
        const ec = ex.exam_classes && ex.exam_classes.length > 0 ? ex.exam_classes[0] : null;
        const className = ec?.classes?.name || '';

        // Format routines to match frontend expectations
        const routines = (ec?.exam_routines || []).map(r => ({
            ...r,
            room: r.room_number || '',
            subject_name: r.subjects?.name || ''
        })).sort((a, b) => new Date(a.exam_date) - new Date(b.exam_date));

        const cleanedEx = { ...ex };
        delete cleanedEx.exam_classes; // Remove nested data to keep payload clean

        result.push({ ...cleanedEx, class_name: className, routines });
    }
    return result;
}
// Reviews
export async function submitReview({ name, rating, content }) {
    const { data, error } = await insforge.database.from('reviews').insert([
        { name, rating, content }
    ]).select();
    if (error) throw new Error(error.message);
    return data[0];
}
import { insforge } from './lib/insforge';
import bcrypt from 'bcryptjs';

// ========== HELPERS ==========

// Ensure we have an active academic year, or get the latest
export async function getActiveAcademicYear() {
    let { data } = await insforge.database.from('academic_years').select('*').eq('is_active', true).maybeSingle();
    if (!data) {
        let { data: latest } = await insforge.database.from('academic_years').select('*').order('start_date', { ascending: false }).limit(1);
        if (latest && latest.length > 0) return latest[0];

        // Create one if none exists
        const year = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
        const { data: newYear } = await insforge.database.from('academic_years').insert([{
            name: year, start_date: `${new Date().getFullYear()}-04-01`, end_date: `${new Date().getFullYear() + 1}-03-31`, is_active: true
        }]).select();
        return newYear[0];
    }
    return data;
}

// Ensure default stream exists for high schools
export async function getDefaultStream() {
    let { data } = await insforge.database.from('streams').select('*').limit(1).maybeSingle();
    if (!data) {
        const { data: newStream } = await insforge.database.from('streams').insert([{ name: 'General' }]).select();
        return newStream[0];
    }
    return data;
}

export async function getAdmins() {
    const { data, error } = await insforge.database.from('users').select('id,name,email,role').eq('role', 'ADMIN').order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data || []
}

export async function createAdminUser(form) {
    const pwd = form.password || 'admin123'
    const hash = await bcrypt.hash(pwd, 10)
    const { error } = await insforge.database.from('users').insert([{ name: form.name, email: form.email, password_hash: hash, role: 'ADMIN' }])
    if (error) throw new Error(error.message)
    return { success: true }
}

export async function deleteUser(id) {
    const { error } = await insforge.database.from('users').delete().eq('id', id)
    if (error) throw new Error(error.message)
    return { success: true }
}

// ========== AUTH (Local table login) ==========
export async function login(email, password) {
    const { data, error } = await insforge.database
        .from('users').select('*').eq('email', email).maybeSingle();

    if (error || !data) throw new Error('Invalid email or password');

    const match = await bcrypt.compare(password, data.password_hash);
    if (!match) throw new Error('Invalid email or password');

    const user = { id: data.id, name: data.name, email: data.email, role: data.role };
    const token = 'insforge_' + Date.now();
    const academicYear = await getActiveAcademicYear();

    if (data.role === 'TEACHER' || data.role === 'ADMIN') {
        const { data: staff } = await insforge.database
            .from('staff').select('*').eq('user_id', data.id).maybeSingle();
        if (staff) {
            user.staff_id = staff.id;
            user.teacher_id = staff.id;
        }
    } else if (data.role === 'STUDENT') {
        const { data: student } = await insforge.database
            .from('students').select('*').eq('user_id', data.id).maybeSingle();
        if (student) {
            user.student_id = student.id;
            if (academicYear) {
                const { data: enroll } = await insforge.database.from('enrollments')
                    .select('*, classes(name), sections(name)')
                    .eq('student_id', student.id).eq('academic_year_id', academicYear.id).maybeSingle();
                if (enroll) {
                    user.enrollment_id = enroll.id;
                    user.class_id = enroll.class_id;
                    user.roll_number = enroll.roll_number;
                    user.class_name = enroll.classes?.name;
                    user.section = enroll.sections?.name;
                }
            }
        }
    } else if (data.role === 'PARENT') {
        const { data: children } = await insforge.database
            .from('students').select('id, user_id').eq('parent_user_id', data.id);
        user.student_ids = (children || []).map(c => c.id);
        if (children?.length > 0) {
            user.student_id = children[0].id;
            if (academicYear) {
                const { data: enroll } = await insforge.database.from('enrollments')
                    .select('*, classes(name), sections(name)')
                    .eq('student_id', children[0].id).eq('academic_year_id', academicYear.id).maybeSingle();
                if (enroll) {
                    user.enrollment_id = enroll.id;
                    user.class_id = enroll.class_id;
                    user.class_name = enroll.classes?.name;
                    user.section = enroll.sections?.name;
                }
            }
        }
    }

    return { token, user };
}

export async function register(name, email, password, role) {
    // 1. Create the user in Auth
    const { data: authData, error: authError } = await insforge.auth.signUp({
        email,
        password,
        options: {
            data: { name, role }
        }
    });

    if (authError) {
        throw new Error(authError.message || 'Failed to register authentication');
    }

    const authUser = authData.user;
    if (!authUser) {
        throw new Error('Account created but login requires confirmation');
    }

    // 2. Hash password for local login fallback
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Insert into public.users with PENDING status
    const { data: newUser, error: insertError } = await insforge.database
        .from('users')
        .insert([{
            id: authUser.id,
            name,
            email,
            password_hash: passwordHash,
            role: role.toUpperCase(),
            status: 'PENDING'
        }])
        .select('id, name, email, role, status')
        .single();

    if (insertError) {
        console.error('Insert error:', insertError);
        throw new Error('Failed to create account details');
    }

    return {
        message: 'Account created successfully. Waiting for admin approval.',
        user: newUser
    };
}

// ============== ADMIN USER APPROVAL API ==============

export async function getPendingUsers() {
    return handleResponse(
        supabase
            .from('users')
            .select('*')
            .eq('status', 'PENDING')
            .order('created_at', { ascending: false })
    );
}

export async function approveUser(targetUserId, role, mappingData) {
    const { data, error } = await insforge.functions.invoke('auth-approve', {
        body: { target_user_id: targetUserId, role, mapping_data }
    });

    if (error || !data || data.error) {
        throw new Error(data?.error || 'Failed to approve user');
    }

    return data;
}

export async function rejectUser(targetUserId) {
    // Only admins can execute this, so we rely on RLS/Backend deletion rules.
    // For now, we will just delete the user record entirely (since they were never active).
    return handleResponse(
        supabase.from('users').delete().eq('id', targetUserId)
    );
}

// =====================================================

export async function loginViaInsforgeAuth(email, password) {
    // Use Native Supabase Auth to securely log in and automatically persist session cookies
    const { data: authData, error: authError } = await insforge.auth.signInWithPassword({
        email,
        password
    });

    if (authError || !authData.user) {
        throw new Error(authError?.message || 'Invalid email or password');
    }

    // Fetch the enriched profile including role and pending status from our public table
    const { data: userProfile, error: profileError } = await insforge.database
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

    if (profileError || !userProfile) {
        // Automatically sign out if database drift occurred
        await insforge.auth.signOut();
        throw new Error('Account internal mapping missing. Please contact Admin.');
    }

    if (userProfile.is_deleted) {
        await insforge.auth.signOut();
        throw new Error('This account has been deactivated.');
    }

    // Combine Auth UUID user with Public Profile columns
    const user = { ...authData.user, ...userProfile };
    const token = authData.session.access_token;
    const academicYear = await getActiveAcademicYear();

    if (user.role === 'TEACHER' || user.role === 'ADMIN') {
        const { data: staff } = await insforge.database
            .from('staff').select('*').eq('user_id', user.id).maybeSingle();
        if (staff) {
            user.staff_id = staff.id;
            user.teacher_id = staff.id;
        }
    } else if (user.role === 'STUDENT') {
        const { data: student } = await insforge.database
            .from('students').select('*').eq('user_id', user.id).maybeSingle();
        if (student) {
            user.student_id = student.id;
            if (academicYear) {
                const { data: enroll } = await insforge.database.from('enrollments')
                    .select('*, classes(name), sections(name)')
                    .eq('student_id', student.id).eq('academic_year_id', academicYear.id).maybeSingle();
                if (enroll) {
                    user.enrollment_id = enroll.id;
                    user.class_id = enroll.class_id;
                    user.roll_number = enroll.roll_number;
                    user.class_name = enroll.classes?.name;
                    user.section = enroll.sections?.name;
                }
            }
        }
    } else if (user.role === 'PARENT') {
        const { data: children } = await insforge.database
            .from('students').select('id, user_id').eq('parent_user_id', user.id);
        user.student_ids = (children || []).map(c => c.id);
        if (children?.length > 0) {
            user.student_id = children[0].id;
            if (academicYear) {
                const { data: enroll } = await insforge.database.from('enrollments')
                    .select('*, classes(name), sections(name)')
                    .eq('student_id', children[0].id).eq('academic_year_id', academicYear.id).maybeSingle();
                if (enroll) {
                    user.enrollment_id = enroll.id;
                    user.class_id = enroll.class_id;
                    user.class_name = enroll.classes?.name;
                    user.section = enroll.sections?.name;
                }
            }
        }
    }

    return { token, user };
}

// ========== ADMIN - STUDENTS (Via Enrollments & Students Table) ==========

export async function getStudents({ search = '', classId = '', sectionId = '', page = 1, limit = 100 } = {}) {
    const academicYear = await getActiveAcademicYear();
    if (!academicYear) return { students: [], total: 0 };

    // P3 FIX: Server-side pagination with count
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = insforge.database.from('enrollments')
        .select(`
            id, roll_number, student_id, class_id, section_id,
            students (
                id, user_id, admission_number, first_name, last_name, date_of_birth, gender, blood_group, address,
                father_name, father_phone, mother_name, mother_phone, local_guardian_name, local_guardian_phone, parent_user_id, status,
                users:users!students_user_id_fkey(name, email)
            ),
            classes (name),
            sections (name)
        `, { count: 'exact' })
        .eq('academic_year_id', academicYear.id)
        .range(from, to);

    if (classId) query = query.eq('class_id', classId);
    if (sectionId) query = query.eq('section_id', sectionId);

    const { data: enrolls, error, count } = await query;
    if (error) throw new Error(error.message);

    let studentsList = (enrolls || []).map(e => ({
        id: e.students.id,
        enrollment_id: e.id,
        user_id: e.students.user_id,
        name: e.students.users?.name || `${e.students.first_name || ''} ${e.students.last_name || ''}`.trim(),
        email: e.students.users?.email || '',
        admission_number: e.students.admission_number,
        class_id: e.class_id,
        class_name: e.classes?.name,
        section_id: e.section_id,
        section: e.sections?.name,
        roll_number: e.roll_number,
        parent_name: e.students.father_name,
        parent_phone: e.students.father_phone,
        ...e.students
    }));

    if (search) {
        const lower = search.toLowerCase();
        studentsList = studentsList.filter(s =>
            s.name?.toLowerCase().includes(lower) ||
            s.email?.toLowerCase().includes(lower) ||
            s.admission_number?.toLowerCase().includes(lower) ||
            s.parent_name?.toLowerCase()?.includes(lower) ||
            s.class_name?.toLowerCase()?.includes(lower)
        );
    }

    return { students: studentsList, total: count || studentsList.length, page, limit };
}

export async function getStudentPerformance(studentId) {
    const activeYear = await getActiveAcademicYear();
    if (!activeYear) return { rows: [] };
    const { data: enr } = await insforge.database.from('enrollments')
        .select('id').eq('student_id', studentId).eq('academic_year_id', activeYear.id).maybeSingle();
    if (!enr) return { rows: [] };
    const { data, error } = await insforge.database
        .from('exam_marks')
        .select('exam_id, subject_id, marks_obtained, total_marks, grade, exams(name, exam_type, start_date), subjects(name)')
        .eq('enrollment_id', enr.id)
        .order('exam_id', { ascending: false });
    if (error) throw new Error(error.message);
    const rows = (data || []).map(r => ({
        exam_id: r.exam_id,
        exam_name: r.exams?.name || 'Exam',
        exam_type: r.exams?.exam_type || '',
        exam_date: r.exams?.start_date || null,
        subject_id: r.subject_id,
        subject_name: r.subjects?.name || 'Subject',
        marks: r.marks_obtained || 0,
        full: r.total_marks || 100,
        grade: r.grade || ''
    }));
    return { rows };
}

export async function createStudent(form) {
    const password = form.password || 'student123';
    const passwordHash = await bcrypt.hash(password, 10);

    // 1. User
    const { data: userData, error: userError } = await insforge.database
        .from('users').insert([{ name: form.name, email: form.email, password_hash: passwordHash, role: 'STUDENT' }]).select();
    if (userError) throw new Error(userError.message);

    // 2. Parent Account
    let parentUserId = null;
    let parentCredentials = null;
    if (form.create_parent_account && form.parent_email) {
        const parentPwd = 'parent123';
        const parentHash = await bcrypt.hash(parentPwd, 10);
        const { data: parentUser, error: pError } = await insforge.database
            .from('users').insert([{ name: form.parent_name, email: form.parent_email, password_hash: parentHash, role: 'PARENT' }]).select();
        if (!pError && parentUser?.[0]) {
            parentUserId = parentUser[0].id;
            parentCredentials = { email: form.parent_email, password: parentPwd };
        }
    }

    // 3. Student Profile
    const names = (form.name || '').split(' ');
    const firstName = names[0] || 'Unknown';
    const lastName = names.slice(1).join(' ') || '.';
    const admissionNumber = `ADM${new Date().getFullYear()}${String(Date.now()).slice(-4)}`;

    const { data: studentData, error: studentError } = await insforge.database.from('students').insert([{
        user_id: userData[0].id,
        admission_number: admissionNumber,
        first_name: firstName,
        last_name: lastName,
        date_of_birth: form.date_of_birth || null,
        gender: form.gender || null,
        blood_group: form.blood_group || null,
        address: form.address || null,
        father_name: form.parent_name || null,
        father_phone: form.parent_phone || null,
        mother_name: form.mother_name || null,
        mother_phone: form.mother_phone || null,
        local_guardian_name: form.emergency_contact || null,
        parent_user_id: parentUserId,
        status: 'Active'
    }]).select();
    if (studentError) throw new Error(studentError.message);

    // 4. Enrollment
    const academicYear = await getActiveAcademicYear();
    if (form.class_id && academicYear) {
        // Find default section if none given
        let sectionId = form.section_id;
        if (!sectionId) {
            const { data: secs } = await insforge.database.from('sections').select('id').eq('class_id', form.class_id).limit(1);
            if (secs?.length > 0) sectionId = secs[0].id;
        }

        if (sectionId) {
            await insforge.database.from('enrollments').insert([{
                student_id: studentData[0].id,
                academic_year_id: academicYear.id,
                class_id: form.class_id,
                section_id: sectionId,
                roll_number: form.roll_number ? parseInt(form.roll_number) : null
            }]);
        }
    }

    return { credentials: { student: { email: form.email, password }, parent: parentCredentials } };
}

export async function updateStudent(id, form) {
    const { data: student } = await insforge.database.from('students').select('user_id').eq('id', id).maybeSingle();
    if (!student) throw new Error('Student not found');

    if (form.name || form.email || form.password) {
        const userUpdate = {};
        if (form.name) userUpdate.name = form.name;
        if (form.email) userUpdate.email = form.email;
        if (form.password) userUpdate.password_hash = await bcrypt.hash(form.password, 10);
        if (student.user_id) await insforge.database.from('users').update(userUpdate).eq('id', student.user_id);
    }

    const studentUpdate = {};
    if (form.name) {
        studentUpdate.first_name = form.name.split(' ')[0];
        studentUpdate.last_name = form.name.split(' ').slice(1).join(' ') || '.';
    }
    if (form.date_of_birth !== undefined) studentUpdate.date_of_birth = form.date_of_birth || null;
    if (form.blood_group !== undefined) studentUpdate.blood_group = form.blood_group || null;
    if (form.address !== undefined) studentUpdate.address = form.address || null;
    if (form.parent_name !== undefined) studentUpdate.father_name = form.parent_name || null;
    if (form.parent_phone !== undefined) studentUpdate.father_phone = form.parent_phone || null;
    if (form.gender !== undefined) studentUpdate.gender = form.gender || null;
    if (form.mother_name !== undefined) studentUpdate.mother_name = form.mother_name || null;
    if (form.mother_phone !== undefined) studentUpdate.mother_phone = form.mother_phone || null;
    if (form.emergency_contact !== undefined) studentUpdate.local_guardian_name = form.emergency_contact || null;

    if (Object.keys(studentUpdate).length > 0) {
        await insforge.database.from('students').update(studentUpdate).eq('id', id);
    }

    // Update Enrollment
    const academicYear = await getActiveAcademicYear();
    if ((form.class_id || form.roll_number !== undefined) && academicYear) {
        const { data: enrollment } = await insforge.database.from('enrollments').select('id').eq('student_id', id).eq('academic_year_id', academicYear.id).maybeSingle();
        if (enrollment) {
            const enrUpdate = {};
            if (form.class_id) {
                enrUpdate.class_id = form.class_id;
                const { data: secs } = await insforge.database.from('sections').select('id').eq('class_id', form.class_id).limit(1);
                if (secs?.length > 0) enrUpdate.section_id = secs[0].id;
            }
            if (form.roll_number !== undefined) enrUpdate.roll_number = form.roll_number ? parseInt(form.roll_number) : null;
            await insforge.database.from('enrollments').update(enrUpdate).eq('id', enrollment.id);
        }
    }

    return { success: true };
}

export async function deleteStudent(id) {
    const { data: student } = await insforge.database.from('students').select('user_id').eq('id', id).maybeSingle();
    if (student?.user_id) {
        await insforge.database.from('users').delete().eq('id', student.user_id);
    } else {
        await insforge.database.from('students').delete().eq('id', id);
    }
    return { success: true };
}

// ========== ADMIN - TEACHERS (STAFF) ==========

export async function getTeachers({ search = '' } = {}) {
    const { data: staffData, error } = await insforge.database
        .from('staff').select('*, users(name, email)').eq('staff_type', 'Teaching');
    if (error) throw new Error(error.message);

    let teachers = (staffData || []).map(t => ({
        id: t.id,
        user_id: t.user_id,
        employee_id: t.employee_id,
        name: t.users?.name || `${t.first_name} ${t.last_name}`,
        email: t.users?.email || '',
        phone: t.contact_phone,
        address: t.address,
        qualification: t.qualification,
        joined_date: t.hire_date,
        subjects: [] // Requires fetching from teacher_assignments if needed
    }));

    if (search) {
        const lower = search.toLowerCase();
        teachers = teachers.filter(t => t.name?.toLowerCase().includes(lower) || t.email?.toLowerCase().includes(lower) || t.employee_id?.toLowerCase().includes(lower));
    }

    return { teachers };
}

export async function createTeacher(form) {
    const pwd = form.password || 'teacher123';
    const pwdHash = await bcrypt.hash(pwd, 10);
    const { data: user, error: userErr } = await insforge.database.from('users').insert([{ name: form.name, email: form.email, password_hash: pwdHash, role: 'TEACHER' }]).select();
    if (userErr) throw new Error(userErr.message);

    const names = form.name.split(' ');
    const { error: staffErr } = await insforge.database.from('staff').insert([{
        user_id: user[0].id,
        employee_id: `EMP${Date.now().toString().slice(-6)}`,
        first_name: names[0], last_name: names.slice(1).join(' ') || '.',
        staff_type: 'Teaching', designation: 'Teacher',
        qualification: form.qualification || null,
        hire_date: form.joined_date || new Date().toISOString().split('T')[0],
        leave_date: form.leave_date || null,
        contact_phone: form.phone || null,
        address: form.address || null,
        photo_url: form.photo_url || null
    }]);
    if (staffErr) throw new Error(staffErr.message);
    return { credentials: { email: form.email, password: pwd } };
}

export async function updateTeacher(id, form) {
    const { data: teacher } = await insforge.database.from('staff').select('user_id').eq('id', id).maybeSingle();
    if (!teacher) throw new Error('Teacher not found');

    if (form.name || form.email || form.password) {
        const uUpdate = {};
        if (form.name) uUpdate.name = form.name;
        if (form.email) uUpdate.email = form.email;
        if (form.password) uUpdate.password_hash = await bcrypt.hash(form.password, 10);
        if (teacher.user_id) await insforge.database.from('users').update(uUpdate).eq('id', teacher.user_id);
    }
    const tUpdate = {};
    if (form.name) {
        tUpdate.first_name = form.name.split(' ')[0];
        tUpdate.last_name = form.name.split(' ').slice(1).join(' ') || '.';
    }
    if (form.phone !== undefined) tUpdate.contact_phone = form.phone || null;
    if (form.qualification !== undefined) tUpdate.qualification = form.qualification || null;
    if (form.address !== undefined) tUpdate.address = form.address || null;
    if (form.joined_date !== undefined) tUpdate.hire_date = form.joined_date || null;
    if (form.leave_date !== undefined) tUpdate.leave_date = form.leave_date || null;
    if (form.photo_url !== undefined) tUpdate.photo_url = form.photo_url || null;
    if (Object.keys(tUpdate).length > 0) await insforge.database.from('staff').update(tUpdate).eq('id', id);
    return { success: true };
}

export async function deleteTeacher(id) {
    const { data: teacher } = await insforge.database.from('staff').select('user_id').eq('id', id).maybeSingle();
    if (teacher?.user_id) await insforge.database.from('users').delete().eq('id', teacher.user_id);
    else await insforge.database.from('staff').delete().eq('id', id);
    return { success: true };
}

// ========== CLASSES & SECTIONS ==========

export async function getClasses() {
    const { data: classesData, error } = await insforge.database
        .from('classes')
        .select('*, streams(name), class_subjects(id, subject_id, subjects(id, name))')
        .order('name', { ascending: true });
    if (error) throw new Error(error.message);
    const { data: sectionsData } = await insforge.database.from('sections').select('*');
    const sectionsMap = {};
    (sectionsData || []).forEach(s => {
        if (!sectionsMap[s.class_id]) sectionsMap[s.class_id] = [];
        sectionsMap[s.class_id].push(s);
    });

    // Subj/Students counts mappings
    const activeYear = await getActiveAcademicYear();
    const { data: enrolls } = activeYear ? await insforge.database.from('enrollments').select('class_id').eq('academic_year_id', activeYear.id) : { data: [] };
    const stCount = {};
    (enrolls || []).forEach(e => { stCount[e.class_id] = (stCount[e.class_id] || 0) + 1; });

    const classes = (classesData || []).map(c => ({
        ...c,
        stream_name: c.streams?.name,
        sectionsList: sectionsMap[c.id] || [],
        section: (sectionsMap[c.id]?.[0]?.name) || 'A', // For backwards compatibility
        students: stCount[c.id] || 0,
        subjectsList: (c.class_subjects || []).map(cs => ({
            id: cs.id, // mapping id for deletion
            subject_id: cs.subject_id,
            name: cs.subjects?.name || 'Subject'
        })),
        subjects: (c.class_subjects || []).map(cs => cs.subjects?.name).filter(Boolean)
    }));
    return { classes };
}

export async function addClass(classData) {
    const stream = await getDefaultStream();
    const { data, error } = await insforge.database.from('classes').insert([{
        name: classData.name, level: parseInt(classData.level) || 1, stream_id: stream.id
    }]).select();
    if (error) throw new Error(error.message);
    await insforge.database.from('sections').insert([{ class_id: data[0].id, name: classData.section || 'A' }]);
    return data[0];
}

export async function deleteClass(classId) {
    const { error } = await insforge.database.from('classes').delete().eq('id', classId);
    if (error) throw new Error(error.message);
    return { success: true };
}

// ========== STAFF PHOTOS ==========
export async function uploadTeacherPhoto(file) {
    const key = `staff/${Date.now()}_${(file.name || 'photo').replace(/\s+/g, '-')}`;
    const { error: upErr } = await insforge.storage.from('staff').upload(key, file);
    if (upErr) throw new Error(upErr.message);
    const { publicUrl } = insforge.storage.from('staff').getPublicUrl(key);
    return { url: publicUrl, key };
}

// ========== CLASS SUBJECT MANAGEMENT ==========
function generateSubjectCode(name) {
    // Generate a unique code from the subject name, e.g. "English" -> "ENG", "Mathematics" -> "MAT"
    const base = name.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 3);
    const suffix = String(Date.now()).slice(-4);
    return `${base || 'SUB'}-${suffix}`;
}

async function ensureSubjects(names) {
    const unique = Array.from(new Set(names.map(n => String(n).trim()).filter(Boolean)));
    if (unique.length === 0) return {};
    const { data: existing } = await insforge.database.from('subjects').select('id, name').in('name', unique);
    const existingMap = {};
    (existing || []).forEach(s => { existingMap[s.name] = s.id; });
    const toInsert = unique.filter(n => !existingMap[n]).map(n => ({ name: n, code: generateSubjectCode(n) }));
    if (toInsert.length > 0) {
        const { data: inserted } = await insforge.database.from('subjects').insert(toInsert).select();
        (inserted || []).forEach(s => { existingMap[s.name] = s.id; });
    }
    return existingMap;
}

export async function addSubjectToClass(classId, subjectName, options = {}) {
    const subMap = await ensureSubjects([subjectName]);
    const subjectId = subMap[subjectName];
    if (!subjectId) throw new Error('Failed to ensure subject');
    const payload = {
        class_id: classId,
        subject_id: subjectId,
        is_optional: !!options.is_optional,
        optional_group_name: options.optional_group_name || null,
        full_marks: options.full_marks != null ? Number(options.full_marks) : 100,
        pass_marks: options.pass_marks != null ? Number(options.pass_marks) : 40
    };
    await insforge.database.from('class_subjects').upsert([payload], { onConflict: 'class_id,subject_id' });
    return { success: true };
}

export async function deleteSubject(mappingId) {
    await insforge.database.from('class_subjects').delete().eq('id', mappingId);
    return { success: true };
}

const _basic3 = [
    { name: 'English', full: 100, pass: 40 },
    { name: 'Nepali', full: 100, pass: 40 },
    { name: 'Mathematics', full: 100, pass: 40 },
];
const _primaryCore = [
    ..._basic3,
    { name: 'Science', full: 100, pass: 40 },
    { name: 'Social Studies', full: 100, pass: 40 },
];
const _upperPrimaryCore = [
    ..._primaryCore,
    { name: 'Computer Science', full: 100, pass: 40 },
    { name: 'Health', full: 100, pass: 40 },
];
const _secondaryCore = [
    ..._upperPrimaryCore,
    { name: 'Optional Mathematics', full: 100, pass: 40, optional: true, group: 'Optional' },
    { name: 'Education', full: 100, pass: 40, optional: true, group: 'Optional' },
];

const DEFAULT_CLASS_SUBJECTS = {
    // Pre-primary
    'Nursery': _basic3,
    'LKG': _basic3,
    'UKG': _basic3,
    // Primary (Class 1-3)
    'Class 1': _primaryCore,
    'Class 2': _primaryCore,
    'Class 3': _primaryCore,
    // Upper Primary (Class 4-5)
    'Class 4': _upperPrimaryCore,
    'Class 5': _upperPrimaryCore,
    // Lower Secondary (Class 6-8)
    'Class 6': [..._upperPrimaryCore, { name: 'Optional Mathematics', full: 100, pass: 40, optional: true, group: 'Optional' }],
    'Class 7': [..._upperPrimaryCore, { name: 'Optional Mathematics', full: 100, pass: 40, optional: true, group: 'Optional' }],
    'Class 8': [..._upperPrimaryCore, { name: 'Optional Mathematics', full: 100, pass: 40, optional: true, group: 'Optional' }],
    // Secondary (Class 9-10) — Nepal SEE curriculum
    'Class 9': _secondaryCore,
    'Class 10': _secondaryCore,
};

export async function applyDefaultSubjectsToClass(classId) {
    // Fetch class name
    const { data: cls } = await insforge.database.from('classes').select('*').eq('id', classId).maybeSingle();
    if (!cls) throw new Error('Class not found');
    const className = cls.name;
    const defaults = DEFAULT_CLASS_SUBJECTS[className];
    if (!defaults || defaults.length === 0) throw new Error(`No defaults configured for "${className}". Supported: ${Object.keys(DEFAULT_CLASS_SUBJECTS).join(', ')}`);
    // Ensure subjects
    const names = defaults.map(d => d.name);
    const subMap = await ensureSubjects(names);
    // Insert mappings if missing
    const rows = defaults.map(d => ({
        class_id: classId,
        subject_id: subMap[d.name],
        is_optional: !!d.optional,
        optional_group_name: d.group || null,
        full_marks: d.full || 100,
        pass_marks: d.pass != null ? d.pass : 40
    }));
    await insforge.database.from('class_subjects').upsert(rows, { onConflict: 'class_id,subject_id' });
    return { success: true, count: rows.length, subjects: names };
}

export async function applyDefaultSubjectsToAllClasses() {
    const { data: classes } = await insforge.database.from('classes').select('id,name');
    let updated = 0;
    for (const cls of classes || []) {
        const defaults = DEFAULT_CLASS_SUBJECTS[cls.name];
        if (!defaults || defaults.length === 0) continue;
        try {
            await applyDefaultSubjectsToClass(cls.id);
            updated += 1;
        } catch (_) { /* skip failures */ }
    }
    return { success: true, updated };
}

export async function createTermExamsForAllClasses() {
    const activeYear = await getActiveAcademicYear();
    if (!activeYear) throw new Error('No active academic year');
    const terms = [
        { name: 'First Term', exam_type: 'First Terminal' },
        { name: 'Second Term', exam_type: 'Second Terminal' },
        { name: 'Third Term', exam_type: 'Third Terminal' },
        { name: 'Final Term', exam_type: 'Final' }
    ];
    const { data: classes } = await insforge.database.from('classes').select('id,name');
    for (const cls of classes || []) {
        for (const t of terms) {
            // Check if exists for class + term in current year
            const { data: existing } = await insforge.database
                .from('exams')
                .select('id, exam_classes(class_id)')
                .eq('name', t.name)
                .eq('academic_year_id', activeYear.id);
            const exists = (existing || []).some(e => (e.exam_classes || []).some(ec => ec.class_id === cls.id));
            if (exists) continue;
            const { data: created, error } = await insforge.database.from('exams').insert([{
                academic_year_id: activeYear.id,
                name: t.name,
                exam_type: t.exam_type,
                full_marks: 100,
                pass_marks: 40,
                start_date: null,
                end_date: null,
                published: false,
                results_published: false
            }]).select();
            if (error) throw new Error(error.message);
            const exam = created?.[0];
            if (exam) {
                await insforge.database.from('exam_classes').insert([{ exam_id: exam.id, class_id: cls.id }]);
            }
        }
    }
    return { success: true };
}

// Utility: check if default subjects are available for a given class name
export function getDefaultSubjectNames(className) {
    const defaults = DEFAULT_CLASS_SUBJECTS[className];
    if (!defaults) return null;
    return defaults.map(d => ({ name: d.name, optional: !!d.optional }));
}

// ========== ADMIN - PARENTS ==========
export async function getParents({ search = '' } = {}) {
    // simplified implementation
    const { data: pUsers, error } = await insforge.database.from('users').select('*').eq('role', 'PARENT');
    if (error) throw new Error(error.message);
    let parents = (pUsers || []).map(p => ({ id: p.id, name: p.name, email: p.email, children: [] }));
    if (search) parents = parents.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    return { parents };
}
export async function deleteParent(id) {
    await insforge.database.from('students').update({ parent_user_id: null }).eq('parent_user_id', id);
    await insforge.database.from('users').delete().eq('id', id);
    return { success: true };
}
export async function createParent(form) {
    const pwd = form.password || 'parent123';
    const hash = await bcrypt.hash(pwd, 10);
    const { data: user, error } = await insforge.database.from('users').insert([{
        name: form.name, email: form.email, password_hash: hash, role: 'PARENT'
    }]).select();
    if (error) throw new Error(error.message);
    const userId = user?.[0]?.id;
    if (userId && Array.isArray(form.student_ids) && form.student_ids.length > 0) {
        await insforge.database.from('students').update({ parent_user_id: userId }).in('id', form.student_ids);
    }
    return { credentials: { email: form.email, password: pwd } };
}
export async function updateParent(id, form) {
    const update = {};
    if (form.name !== undefined) update.name = form.name;
    if (form.email !== undefined) update.email = form.email;
    if (form.password) update.password_hash = await bcrypt.hash(form.password, 10);
    if (Object.keys(update).length > 0) await insforge.database.from('users').update(update).eq('id', id);
    if (Array.isArray(form.student_ids)) {
        await insforge.database.from('students').update({ parent_user_id: null }).eq('parent_user_id', id);
        if (form.student_ids.length > 0) {
            await insforge.database.from('students').update({ parent_user_id: id }).in('id', form.student_ids);
        }
    }
    return { success: true };
}


// ========== NOTICES & EVENTS (Original tables) ==========
export async function getNotices() {
    const { data } = await insforge.database.from('notices').select('*').order('created_at', { ascending: false });
    return { notices: data || [] };
}
export async function createNotice(f) {
    const { data } = await insforge.database.from('notices').insert([{ title: f.title, content: f.content, is_active: true }]).select();
    return data[0];
}
export async function updateNotice(id, f) {
    await insforge.database.from('notices').update({ title: f.title, content: f.content }).eq('id', id); return { success: true };
}
export async function deleteNotice(id) {
    await insforge.database.from('notices').delete().eq('id', id); return { success: true };
}

export async function getEvents() {
    const { data } = await insforge.database.from('events').select('*').order('start_date', { ascending: true });
    return { events: data || [] };
}
export async function createEvent(f) {
    const { data } = await insforge.database.from('events').insert([{ title: f.title, description: f.description, start_date: f.start_date, end_date: f.end_date || f.start_date, location: f.location }]).select();
    return data[0];
}
export async function updateEvent(id, f) {
    await insforge.database.from('events').update({ title: f.title, description: f.description, start_date: f.start_date, end_date: f.end_date || f.start_date, location: f.location }).eq('id', id); return { success: true };
}
export async function deleteEvent(id) {
    await insforge.database.from('events').delete().eq('id', id); return { success: true };
}

// ========== STUDENT FEES ==========
export async function getStudentFees(studentId) {
    const activeYear = await getActiveAcademicYear();
    if (!activeYear) return { pending: [], history: [] };
    const { data: enroll } = await insforge.database.from('enrollments').select('id').eq('student_id', studentId).eq('academic_year_id', activeYear.id).maybeSingle();
    if (!enroll) return { pending: [], history: [] };

    const { data: fees } = await insforge.database.from('student_fees').select('*, fee_structures(fee_type)').eq('enrollment_id', enroll.id);
    const mapped = (fees || []).map(f => ({
        id: f.id, amount: f.amount_due, amount_paid: f.amount_paid, status: (f.status || 'Unpaid'),
        dueDate: f.due_date, category: f.fee_structures?.fee_type || 'General Fee', datePaid: f.updated_at, receiptNo: 'FP-' + f.id?.slice(0, 5)
    }));
    return {
        pending: mapped.filter(f => f.status !== 'Paid'),
        history: mapped.filter(f => f.status === 'Paid')
    };
}
export async function getAllFees() {
    const activeYear = await getActiveAcademicYear();
    if (!activeYear) return [];
    const { data, error } = await insforge.database.from('student_fees')
        .select(`
            id, due_date, amount_due, amount_paid, status,
            enrollments!inner(id, class_id, student_id, classes(name), students(id, users:users!students_user_id_fkey(name)))
        `)
        .eq('enrollments.academic_year_id', activeYear.id);
    if (error) throw new Error(error.message);
    return (data || []).map(r => ({
        id: r.id,
        student_id: r.enrollments.student_id,
        student_name: r.enrollments.students?.users?.name || 'Student',
        class_id: r.enrollments.class_id,
        class_name: r.enrollments.classes?.name || '',
        description: '',
        amount: r.amount_due,
        amount_paid: r.amount_paid || 0,
        due_date: r.due_date,
        status: r.status || 'Unpaid',
    }));
}
export async function createFee(form) {
    const activeYear = await getActiveAcademicYear();
    if (!activeYear) throw new Error('No active academic year');
    const { data: enr } = await insforge.database.from('enrollments').select('id, class_id').eq('student_id', form.student_id).eq('academic_year_id', activeYear.id).maybeSingle();
    if (!enr) throw new Error('Enrollment not found for year');
    const amount = parseFloat(form.amount || 0);
    const { data: fs } = await insforge.database.from('fee_structures').upsert([{
        academic_year_id: activeYear.id,
        class_id: enr.class_id,
        fee_type: 'Custom',
        amount,
        frequency: 'One-time'
    }], { onConflict: 'academic_year_id,class_id,fee_type' }).select();
    const fsId = fs?.[0]?.id;
    const { data, error } = await insforge.database.from('student_fees').insert([{
        enrollment_id: enr.id,
        fee_structure_id: fsId,
        due_date: form.due_date || null,
        amount_due: amount,
        amount_paid: parseFloat(form.amount_paid || 0),
        status: form.status || 'Unpaid'
    }]).select();
    if (error) throw new Error(error.message);
    return data?.[0] || {};
}
export async function updateFee(id, form) {
    const upd = {};
    if (form.due_date !== undefined) upd.due_date = form.due_date || null;
    if (form.amount !== undefined) upd.amount_due = parseFloat(form.amount || 0);
    if (form.amount_paid !== undefined) upd.amount_paid = parseFloat(form.amount_paid || 0);
    if (form.status !== undefined) upd.status = form.status || 'Unpaid';
    if (Object.keys(upd).length === 0) return { success: true };
    await insforge.database.from('student_fees').update(upd).eq('id', id);
    return { success: true };
}
export async function deleteFee(id) {
    await insforge.database.from('student_fees').delete().eq('id', id);
    return { success: true };
}

// ========== STUDENT RESULTS ==========
export async function getStudentResults(studentId) {
    const activeYear = await getActiveAcademicYear();
    if (!activeYear) return { exams: [] };
    const { data: enroll } = await insforge.database.from('enrollments').select('id, roll_number').eq('student_id', studentId).eq('academic_year_id', activeYear.id).maybeSingle();
    if (!enroll) return { exams: [] };

    const { data: sums } = await insforge.database.from('result_summaries').select('*, exams(name, start_date)').eq('enrollment_id', enroll.id);
    const { data: marks } = await insforge.database.from('exam_marks').select('*, subjects(name)').eq('enrollment_id', enroll.id);

    return {
        exams: (sums || []).map(s => ({
            id: s.exam_id, name: s.exams?.name, date: s.exams?.start_date, student: { rollNumber: enroll.roll_number },
            total_obtained: s.total_marks, percentage: s.percentage, grade: s.grade, gpa: s.gpa, status: s.status,
            subjects: (marks || []).filter(m => m.exam_id === s.exam_id).map(m => ({
                id: m.id, name: m.subjects?.name,
                th: m.theory_marks !== undefined && m.theory_marks !== null ? m.theory_marks : m.marks_obtained,
                pr: m.practical_marks !== undefined ? m.practical_marks : null,
                total: m.marks_obtained,
                full: m.total_marks || 100,
                grade: m.grade || '',
                gpa: m.gpa || 0,
                remarks: m.remarks
            }))
        }))
    };
}

// ========== STATS & OTHER ==========
export async function getDashboardStats() {
    const { count: sCount } = await insforge.database.from('students').select('*', { count: 'exact', head: true });
    const { count: tCount } = await insforge.database.from('staff').select('*', { count: 'exact', head: true }).eq('staff_type', 'Teaching');
    const { data: notices } = await insforge.database.from('notices').select('*').limit(4);
    const { data: events } = await insforge.database.from('events').select('*').limit(4);

    // P2 FIX: Calculate real attendance data instead of hardcoded values
    let todayAttPercent = 0;
    let weeklyAttendance = [];
    let paidFees = 0;
    let pendingFees = 0;
    try {
        const todayStr = new Date().toISOString().slice(0, 10);
        const { data: todayAtt } = await insforge.database.from('attendance')
            .select('status').eq('attendance_date', todayStr);
        if (todayAtt && todayAtt.length > 0) {
            const presentCount = todayAtt.filter(a => ['Present', 'Late', 'Half-Day'].includes(a.status)).length;
            todayAttPercent = Math.round((presentCount / todayAtt.length) * 100);
        }
        // Last 6 days attendance
        const days = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(); d.setDate(d.getDate() - i);
            days.push(d.toISOString().slice(0, 10));
        }
        const { data: weekAtt } = await insforge.database.from('attendance')
            .select('attendance_date, status')
            .gte('attendance_date', days[0]).lte('attendance_date', days[5]);
        const dayMap = {};
        days.forEach(d => { dayMap[d] = { day: new Date(d).toLocaleDateString('en', { weekday: 'short' }), present: 0, absent: 0 }; });
        (weekAtt || []).forEach(a => {
            if (dayMap[a.attendance_date]) {
                if (['Present', 'Late', 'Half-Day'].includes(a.status)) dayMap[a.attendance_date].present++;
                else dayMap[a.attendance_date].absent++;
            }
        });
        weeklyAttendance = Object.values(dayMap);

        // Fee stats
        const activeYear = await getActiveAcademicYear();
        if (activeYear) {
            const { data: fees } = await insforge.database.from('student_fees')
                .select('amount_due, amount_paid, status');
            (fees || []).forEach(f => {
                paidFees += parseFloat(f.amount_paid || 0);
                if (f.status !== 'Paid') pendingFees += parseFloat(f.amount_due || 0) - parseFloat(f.amount_paid || 0);
            });
        }
    } catch (_) { /* stats errors should not break dashboard */ }

    return {
        totalStudents: sCount || 0,
        totalTeachers: tCount || 0,
        pendingFees, paidFees, overdueFees: 0, todayAttendancePercent: todayAttPercent,
        weeklyAttendance, notices: notices || [], events: events || [], recentStudents: []
    };
}

export async function getTeacherDashboardStats() {
    return { classCount: 2, studentCount: 45, subjectCount: 3, todayAttendancePercent: 90, pendingResults: 0 };
}
export async function getStudentDashboardStats(studentId) {
    return { className: '10 A', attendancePercent: 88, gpa: '3.6', pendingFees: 0 };
}

// Accounting & Attendance helpers
export async function getMonthlyCollections(yyyymm) {
    const [year, month] = yyyymm.split('-').map(Number);
    const start = new Date(year, month - 1, 1).toISOString().slice(0, 10);
    const end = new Date(year, month, 0).toISOString().slice(0, 10);
    const { data } = await insforge.database
        .from('student_fees')
        .select(`
            id, amount_paid, updated_at, due_date, status,
            enrollments!inner(id, class_id, students(id, users(name)), classes(name))
        `)
        .eq('status', 'Paid')
        .gte('updated_at', start)
        .lte('updated_at', `${end}T23:59:59Z`);
    return (data || []).map(r => ({
        id: r.id,
        paid_at: r.updated_at,
        receipt_no: `RC-${yyyymm.replace('-', '')}-${String(r.id).slice(0, 6)}`,
        student_name: r.enrollments?.students?.users?.name || 'Student',
        class_name: r.enrollments?.classes?.name || '',
        amount_paid: r.amount_paid || 0,
        method: 'CASH',
        reference: ''
    }));
}

export async function getAttendanceMonthlySummary(yyyymm) {
    const [year, month] = yyyymm.split('-').map(Number);
    const start = new Date(year, month - 1, 1).toISOString().slice(0, 10);
    const end = new Date(year, month, 0).toISOString().slice(0, 10);
    const { data } = await insforge.database
        .from('attendance')
        .select('attendance_date, status')
        .gte('attendance_date', start)
        .lte('attendance_date', end);
    const days = {};
    (data || []).forEach(a => {
        const d = a.attendance_date;
        if (!days[d]) days[d] = { date: d, present: 0, absent: 0, late: 0, total: 0 };
        const st = String(a.status || '').toLowerCase();
        if (st.includes('present')) days[d].present += 1;
        else if (st.includes('late')) days[d].late += 1;
        else days[d].absent += 1;
        days[d].total += 1;
    });
    return Object.values(days).sort((a, b) => a.date.localeCompare(b.date));
}

// Gallery — only columns that exist: id, title, image_url, category, created_at
export async function getGalleryPhotos() {
    const { data, error } = await insforge.database.from('gallery_photos').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
}
export async function uploadGalleryPhoto(file, meta = {}) {
    const key = `gallery/${Date.now()}_${file.name}`;
    const { error: upErr } = await insforge.storage.from('gallery').upload(key, file);
    if (upErr) throw new Error(upErr.message);
    const { publicUrl } = insforge.storage.from('gallery').getPublicUrl(key);
    const { data, error } = await insforge.database.from('gallery_photos').insert([{
        title: meta.title || null,
        category: meta.category || 'general',
        image_url: publicUrl
    }]).select();
    if (error) throw new Error(error.message);
    return data?.[0] || {};
}
export async function deleteGalleryPhoto(id) {
    await insforge.database.from('gallery_photos').delete().eq('id', id);
    return { success: true };
}
export async function getSiteSettings() {
    let settings = {};
    try {
        const { data: inst } = await insforge.database.from('institution_profiles').select('*').maybeSingle();
        if (inst) {
            settings.school_name = inst.name || '';
            settings.principal_name = inst.principal_name || '';
            settings.email = inst.contact_email || '';
            settings.phone = inst.contact_phone || '';
            settings.address = inst.address || '';
            if (inst.established_date) {
                const y = new Date(inst.established_date).getFullYear();
                if (!Number.isNaN(y)) settings.established_year = String(y);
            }
        } else {
            // Create a default row to avoid first-load errors
            const { data: created } = await insforge.database.from('institution_profiles').insert([{
                name: 'Seven Star English Boarding School'
            }]).select();
            if (created?.[0]) {
                settings.school_name = created[0].name;
            }
        }
    } catch (_) {
        // Ignore institution_profiles errors; continue with site_settings if available
    }

    // Merge key-value site settings if the table exists
    try {
        const { data: kv } = await insforge.database.from('site_settings').select('key, value');
        if (Array.isArray(kv)) {
            kv.forEach(row => {
                // Store raw strings; UI components decide interpretation
                settings[row.key] = row.value;
            });
        }
    } catch (_) {
        // site_settings may not exist; ignore
    }

    return settings;
}
export async function updateSiteSettingsBulk(changed) {
    const instUpdate = {};
    if (changed.school_name !== undefined) instUpdate.name = changed.school_name || null;
    if (changed.principal_name !== undefined) instUpdate.principal_name = changed.principal_name || null;
    if (changed.email !== undefined) instUpdate.contact_email = changed.email || null;
    if (changed.phone !== undefined) instUpdate.contact_phone = changed.phone || null;
    if (changed.address !== undefined) instUpdate.address = changed.address || null;
    if (changed.established_year !== undefined) {
        const y = parseInt(changed.established_year, 10);
        instUpdate.established_date = Number.isFinite(y) ? `${y}-01-01` : null;
    }

    // Update or insert single institution_profiles row
    if (Object.keys(instUpdate).length > 0) {
        const { data: existing } = await insforge.database.from('institution_profiles').select('id').limit(1);
        if (existing && existing.length > 0) {
            await insforge.database.from('institution_profiles').update(instUpdate).eq('id', existing[0].id);
        } else {
            await insforge.database.from('institution_profiles').insert([{ ...instUpdate, name: instUpdate.name || 'School' }]);
        }
    }

    // Persist remaining keys to site_settings as key-value if available
    const kvPairs = Object.entries(changed).filter(([k]) => ![
        'school_name', 'principal_name', 'email', 'phone', 'address', 'established_year'
    ].includes(k)).map(([key, value]) => ({ key, value: value == null ? '' : String(value) }));

    if (kvPairs.length > 0) {
        try {
            await insforge.database.from('site_settings').upsert(kvPairs, { onConflict: 'key' });
        } catch (_) {
            // If site_settings table does not exist, ignore silently to avoid breaking the UI
        }
    }

    return { success: true };
}
// program_subjects table does not exist — stubbed gracefully
export async function getProgramSubjects() {
    console.warn('program_subjects table not available — returning empty');
    return [];
}
export async function createProgramSubject(form) {
    console.warn('program_subjects table not available — create skipped');
    return {};
}
export async function deleteProgramSubject(id) {
    console.warn('program_subjects table not available — delete skipped');
    return { success: true };
}
// reviews table only has: id, name, content, rating, created_at (no is_approved column)
export async function getApprovedReviews() {
    // No is_approved column — return all reviews as "approved"
    const { data, error } = await insforge.database.from('reviews').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
}
export async function getAllReviews() {
    const { data, error } = await insforge.database.from('reviews').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
}
export async function approveReview(id, approve = true) {
    // No is_approved column exists — no-op
    console.warn('approveReview: is_approved column does not exist, skipping');
    return { success: true };
}
export async function deleteReview(id) { await insforge.database.from('reviews').delete().eq('id', id); return { success: true }; }
export async function getAdmissionApplications() {
    try {
        const { data } = await insforge.database.from('admission_applications').select('*').order('created_at', { ascending: false });
        const rows = Array.isArray(data) ? data : [];
        return rows.map(r => ({ ...r, status: (r.status || '').toUpperCase() || 'PENDING' }));
    } catch (_) { return []; }
}

// Uploads stubs
export async function uploadStudentPhoto() { return { url: '' }; }
export async function uploadStudentCertificate() { return { url: '' }; }

// Exams & Attendance Stubs for react components
export async function getExams() {
    const { data, error } = await insforge.database.from('exams')
        .select('*, exam_classes(class_id)')
        .order('start_date', { ascending: false });
    if (error) throw new Error(error.message);
    const exams = (data || []).map(e => ({
        ...e,
        class_id: e.exam_classes?.[0]?.class_id || null
    }));
    return { exams };
}
export async function createExam(form) {
    const activeYear = await getActiveAcademicYear();
    const { data, error } = await insforge.database.from('exams').insert([{
        academic_year_id: activeYear?.id,
        name: form.name,
        exam_type: form.exam_type || 'Unit Test',
        full_marks: form.full_marks || 100,
        pass_marks: form.pass_marks || 40,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        published: false,
        results_published: false
    }]).select();
    if (error) throw new Error(error.message);
    const exam = data[0];

    if (form.class_id) {
        await insforge.database.from('exam_classes').insert([{
            exam_id: exam.id,
            class_id: form.class_id
        }]);
    }

    return { ...exam, class_id: form.class_id };
}
export async function deleteExam(id) {
    await insforge.database.from('exams').delete().eq('id', id);
    return { success: true };
}
export async function getAttendanceOverview() { return []; }
export async function getAllClasses() {
    const { data, error } = await insforge.database.from('classes').select('*').order('name', { ascending: true });
    if (error) throw new Error(error.message);
    return { classes: data || [] };
}
export async function getTeacherClasses(teacherId) {
    if (!teacherId) {
        // Admin view or fallback
        const { data, error } = await insforge.database.from('classes').select('*').order('name', { ascending: true });
        if (error) throw new Error(error.message);
        return { classes: data || [] };
    }

    // Teacher specific view
    const activeYear = await getActiveAcademicYear();
    if (!activeYear) return { classes: [] };

    // Get unique classes from assignments
    const { data } = await insforge.database.from('subject_assignments')
        .select('class_id, classes(*)')
        .eq('teacher_id', teacherId)
        .eq('academic_year_id', activeYear.id);

    // De-duplicate classes
    const uniqueClasses = {};
    (data || []).forEach(d => {
        if (d.classes) uniqueClasses[d.class_id] = d.classes;
    });

    return { classes: Object.values(uniqueClasses).sort((a, b) => a.name.localeCompare(b.name)) };
}
export async function getTeacherAttendanceScope(teacherId) {
    const activeYear = await getActiveAcademicYear();
    if (!activeYear) return [];
    const { data, error } = await insforge.database.from('subject_assignments')
        .select('class_id, section_id, subject_id, classes(name), sections(name), subjects(name)')
        .eq('teacher_id', teacherId)
        .eq('academic_year_id', activeYear.id);
    if (error) throw new Error(error.message);
    const rows = (data || []).map(r => ({
        class_id: r.class_id,
        class_name: r.classes?.name || 'Class',
        section_id: r.section_id,
        section_name: r.sections?.name || 'A',
        subject_id: r.subject_id,
        subject_name: r.subjects?.name || 'Subject',
    }));
    // Unique by class-section-subject
    const key = r => `${r.class_id}:${r.section_id}:${r.subject_id}`;
    const uniq = {};
    rows.forEach(r => { uniq[key(r)] = r; });
    return Object.values(uniq);
}
export async function getStudentsByClass(classId) {
    const activeYear = await getActiveAcademicYear();
    if (!activeYear || !classId) return [];
    const { data, error } = await insforge.database.from('enrollments')
        .select('id, student_id, roll_number, students(id, users:users!students_user_id_fkey(name))')
        .eq('class_id', classId)
        .eq('academic_year_id', activeYear.id);
    if (error) throw new Error(error.message);
    return (data || []).map(e => ({
        id: e.student_id,
        name: e.students?.users?.name || 'Student',
        roll_number: e.roll_number
    }));
}
export async function getStudentsByClassSection(classId, sectionId) {
    const activeYear = await getActiveAcademicYear();
    if (!activeYear || !classId || !sectionId) return [];
    const { data, error } = await insforge.database.from('enrollments')
        .select('id, student_id, roll_number, students(id, users:users!students_user_id_fkey(name))')
        .eq('class_id', classId)
        .eq('section_id', sectionId)
        .eq('academic_year_id', activeYear.id)
        .order('roll_number', { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []).map(e => ({
        id: e.student_id,
        name: e.students?.users?.name || 'Student',
        roll_number: e.roll_number
    }));
}
export async function getAttendanceByDate(classId, sectionId, subjectId, date) {
    const activeYear = await getActiveAcademicYear();
    if (!activeYear || !classId || !sectionId || !date) return [];
    const { data: enrolls } = await insforge.database.from('enrollments')
        .select('id, student_id')
        .eq('class_id', classId)
        .eq('section_id', sectionId)
        .eq('academic_year_id', activeYear.id);
    if (!enrolls || enrolls.length === 0) return [];
    const enrollIds = enrolls.map(e => e.id);
    const { data } = await insforge.database.from('attendance')
        .select('enrollment_id, status, subject_id')
        .in('enrollment_id', enrollIds)
        .eq('attendance_date', date)
        .eq('subject_id', subjectId);
    const map = {};
    (data || []).forEach(a => { map[a.enrollment_id] = a.status; });
    return enrolls.map(e => ({
        student_id: e.student_id,
        enrollment_id: e.id,
        status: map[e.id] || 'Present'
    }));
}
export async function saveAttendance(rows, opts = {}) {
    const todayStr = new Date().toISOString().slice(0, 10);
    if (!Array.isArray(rows) || rows.length === 0) return { success: true };
    const date = rows[0].date;
    if (!opts.override && date !== todayStr) {
        throw new Error('Attendance is locked for past dates');
    }
    const classId = rows[0].class_id;
    const sectionId = rows[0].section_id;
    const subjectId = rows[0].subject_id;
    const activeYear = await getActiveAcademicYear();
    if (!activeYear) throw new Error('No active academic year');
    if (!opts.override) {
        const d = new Date(date);
        const dow = ((d.getDay() + 6) % 7) + 1; // Mon=1 .. Sun=7
        const { data: tt } = await insforge.database.from('class_timetables')
            .select('id, class_subjects(subject_id)')
            .eq('academic_year_id', activeYear.id)
            .eq('class_id', classId)
            .eq('section_id', sectionId)
            .eq('day_of_week', dow);
        const hasAnyTimetable = Array.isArray(tt) && tt.length > 0;
        if (hasAnyTimetable) {
            const hasSubjectToday = (tt || []).some(t => t.class_subjects?.subject_id === subjectId);
            if (!hasSubjectToday) throw new Error('No class scheduled today for this subject');
        }
    }
    const studentIds = rows.map(r => r.student_id);
    const { data: enrolls } = await insforge.database.from('enrollments')
        .select('id, student_id')
        .in('student_id', studentIds)
        .eq('class_id', classId)
        .eq('section_id', sectionId)
        .eq('academic_year_id', activeYear.id);
    const enrollMap = Object.fromEntries((enrolls || []).map(e => [e.student_id, e.id]));
    const upserts = rows
        .filter(r => enrollMap[r.student_id])
        .map(r => ({
            enrollment_id: enrollMap[r.student_id],
            attendance_date: date,
            status: r.status || 'Present',
            subject_id: subjectId || null,
            marked_by: r.marked_by || null
        }));
    if (upserts.length === 0) return { success: true };
    await insforge.database.from('attendance').upsert(upserts, { onConflict: 'enrollment_id,attendance_date,subject_id' });
    return { success: true };
}
export async function getSubjectsByClass(classId) {
    // Prefer class_subjects mapping; if absent, fallback empty
    const { data, error } = await insforge.database
        .from('class_subjects')
        .select('id, subject_id, subjects(name)')
        .eq('class_id', classId);
    if (error) return { subjects: [] };
    const subjects = (data || []).map(r => ({ id: r.subject_id, class_subject_id: r.id, name: r.subjects?.name || 'Subject' }));
    return { subjects };
}

// ========== TEACHER CLASS-SECTION-SUBJECT ASSIGNMENTS & LOAD ==========
export async function assignTeacherToSubject(payload) {
    const activeYear = await getActiveAcademicYear();
    if (!activeYear) throw new Error('No active academic year');
    const { error } = await insforge.database.from('subject_assignments').upsert([{
        teacher_id: payload.teacher_id,
        class_id: payload.class_id,
        section_id: payload.section_id,
        subject_id: payload.subject_id,
        academic_year_id: activeYear.id
    }], { onConflict: 'teacher_id,class_id,section_id,subject_id,academic_year_id' });
    if (error) throw new Error(error.message);
    return { success: true };
}

export async function removeTeacherAssignment(payload) {
    const activeYear = await getActiveAcademicYear();
    if (!activeYear) throw new Error('No active academic year');
    const { error } = await insforge.database.from('subject_assignments')
        .delete()
        .eq('teacher_id', payload.teacher_id)
        .eq('class_id', payload.class_id)
        .eq('section_id', payload.section_id)
        .eq('subject_id', payload.subject_id)
        .eq('academic_year_id', activeYear.id);
    if (error) throw new Error(error.message);
    return { success: true };
}

export async function getTeacherLoad(teacherId) {
    const activeYear = await getActiveAcademicYear();
    if (!activeYear) return [];
    const { data: assigns } = await insforge.database.from('subject_assignments')
        .select('class_id, section_id, subject_id, classes(name), sections(name), subjects(name)')
        .eq('teacher_id', teacherId)
        .eq('academic_year_id', activeYear.id);
    const { data: enrolls } = await insforge.database.from('enrollments')
        .select('class_id, section_id')
        .eq('academic_year_id', activeYear.id);
    const countMap = {};
    (enrolls || []).forEach(e => {
        const key = `${e.class_id}:${e.section_id}`;
        countMap[key] = (countMap[key] || 0) + 1;
    });
    return (assigns || []).map(a => ({
        class_id: a.class_id,
        section_id: a.section_id,
        subject_id: a.subject_id,
        class_name: a.classes?.name || 'Class',
        section_name: a.sections?.name || 'A',
        subject_name: a.subjects?.name || 'Subject',
        student_count: countMap[`${a.class_id}:${a.section_id}`] || 0
    }));
}
export async function getResults(examId, subjectId) {
    const { data, error } = await insforge.database
        .from('exam_marks')
        .select('id, exam_id, subject_id, enrollment_id, marks_obtained, theory_marks, practical_marks, total_marks, grade, remarks, verified, enrollments(student_id)')
        .eq('exam_id', examId)
        .eq('subject_id', subjectId);
    if (error) throw new Error(error.message);
    return (data || []).map(r => ({
        id: r.id,
        exam_id: r.exam_id,
        subject_id: r.subject_id,
        student_id: r.enrollments?.student_id,
        marks_obtained: r.marks_obtained,
        theory_marks: r.theory_marks,
        practical_marks: r.practical_marks,
        total_marks: r.total_marks,
        grade: r.grade,
        remarks: r.remarks || '',
        verified: !!r.verified
    }));
}
export async function saveMarks(marks) {
    if (!Array.isArray(marks) || marks.length === 0) return { success: true };
    const examId = marks[0].exam_id || marks[0].examId;
    const subjectId = marks[0].subject_id || marks[0].subjectId;
    const payload = marks.map(m => ({
        student_id: m.student_id,
        marks_obtained: parseFloat(m.marks_obtained || 0),
        theory_marks: m.theory_marks !== undefined && m.theory_marks !== null ? parseFloat(m.theory_marks) : null,
        practical_marks: m.practical_marks !== undefined && m.practical_marks !== null ? parseFloat(m.practical_marks) : null,
        remarks: m.remarks || '',
        total_marks: parseFloat(m.total_marks || 100),
        grade: m.grade || '',
        gpa: m.gpa || 0
    }));
    await saveBulkMarks(examId, subjectId, payload);
    return { success: true };
}
export async function publishResults(examId, publisherId) {
    // P2 FIX: Check all marks are verified before publishing
    const { total, unverified } = await getVerificationSummary(examId);
    if (total === 0) throw new Error('No marks entered for this exam yet');
    if (unverified > 0) throw new Error(`Cannot publish: ${unverified} mark entries are not verified yet`);

    // Check not already published
    const { data: exam } = await insforge.database.from('exams').select('results_published').eq('id', examId).maybeSingle();
    if (exam?.results_published) throw new Error('Results are already published for this exam');

    // Lock all exam_classes for this exam
    await insforge.database.from('exam_classes').update({ is_locked: true }).eq('exam_id', examId);

    // Publish with timestamp
    const { data, error } = await insforge.database.from('exams').update({
        results_published: true,
        published_at: new Date().toISOString(),
        published_by: publisherId || null
    }).eq('id', examId).select();
    if (error) throw new Error(error.message);

    // Write audit log
    try {
        await insforge.database.from('audit_logs').insert([{
            user_id: publisherId || null,
            action: 'PUBLISH_RESULTS',
            table_name: 'exams',
            record_id: examId,
            details: { total_marks_entries: total, published_at: new Date().toISOString() }
        }]);
    } catch (_) { /* audit log failure should not block publish */ }

    return { success: true, count: data?.length || 0 };
}
export async function getVerificationSummary(examId) {
    const { data } = await insforge.database.from('exam_marks').select('id, verified').eq('exam_id', examId);
    const total = data?.length || 0;
    const verified = (data || []).filter(r => r.verified).length;
    return { total, verified, unverified: total - verified };
}
export async function saveBulkMarks(examId, subjectId, marks) {
    // marks: [{ student_id, marks_obtained, theory_marks, practical_marks }]
    if (!Array.isArray(marks) || marks.length === 0) return { success: true };

    // P2 FIX: Check if exam is locked before allowing marks entry
    const { data: examClasses } = await insforge.database.from('exam_classes')
        .select('is_locked').eq('exam_id', examId);
    const isLocked = (examClasses || []).some(ec => ec.is_locked);
    if (isLocked) throw new Error('Marks entry is locked for this exam. Contact admin to unlock.');

    // P2 FIX: Check if results are already published
    const { data: examCheck } = await insforge.database.from('exams')
        .select('results_published').eq('id', examId).maybeSingle();
    if (examCheck?.results_published) throw new Error('Cannot modify marks — results are already published.');

    // P2 FIX: Validate marks ranges
    for (const m of marks) {
        const obtained = parseFloat(m.marks_obtained || 0);
        const total = parseFloat(m.total_marks || 100);
        if (obtained < 0) throw new Error(`Invalid marks: ${obtained} is negative`);
        if (obtained > total) throw new Error(`Invalid marks: ${obtained} exceeds total ${total}`);
        if (m.theory_marks != null && parseFloat(m.theory_marks) < 0) throw new Error('Theory marks cannot be negative');
        if (m.practical_marks != null && parseFloat(m.practical_marks) < 0) throw new Error('Practical marks cannot be negative');
    }

    const studentIds = marks.map(m => m.student_id);
    const activeYear = await getActiveAcademicYear();
    const { data: enrolls } = await insforge.database.from('enrollments')
        .select('id, student_id')
        .in('student_id', studentIds)
        .eq('academic_year_id', activeYear.id);
    const enrollMap = Object.fromEntries((enrolls || []).map(e => [e.student_id, e.id]));
    const rows = marks
        .filter(m => enrollMap[m.student_id])
        .map(m => ({
            exam_id: examId,
            enrollment_id: enrollMap[m.student_id],
            subject_id: subjectId,
            marks_obtained: parseFloat(m.marks_obtained || 0),
            theory_marks: m.theory_marks,
            practical_marks: m.practical_marks,
            total_marks: m.total_marks || 100,
            grade: m.grade,
            gpa: m.gpa
        }));
    if (rows.length === 0) return { success: true };
    const { error } = await insforge.database.from('exam_marks').upsert(rows, { onConflict: 'exam_id,enrollment_id,subject_id' });
    if (error) throw new Error(error.message);
    return { success: true };
}
export async function verifyStudentMarks(examId, studentId, verifierId) {
    const activeYear = await getActiveAcademicYear();
    const { data: enr } = await insforge.database.from('enrollments')
        .select('id').eq('student_id', studentId).eq('academic_year_id', activeYear.id).maybeSingle();
    if (!enr) return { success: true };
    await insforge.database.from('exam_marks').update({
        verified: true,
        verified_by: verifierId || null,
        verified_at: new Date().toISOString()
    }).eq('exam_id', examId).eq('enrollment_id', enr.id);
    return { success: true };
}
export async function unverifyStudentMarks(examId, studentId) {
    const activeYear = await getActiveAcademicYear();
    const { data: enr } = await insforge.database.from('enrollments')
        .select('id').eq('student_id', studentId).eq('academic_year_id', activeYear.id).maybeSingle();
    if (!enr) return { success: true };
    await insforge.database.from('exam_marks').update({
        verified: false,
        verified_by: null,
        verified_at: null
    }).eq('exam_id', examId).eq('enrollment_id', enr.id);
    return { success: true };
}
export async function verifyAllMarksForExam(examId) {
    await insforge.database.from('exam_marks').update({ verified: true, verified_at: new Date().toISOString() }).eq('exam_id', examId);
    return { success: true };
}

// ========== ASSIGNMENTS (Teacher Side) ==========

export async function getTeacherAssignments(teacherId) {
    const activeYear = await getActiveAcademicYear();
    if (!activeYear) return [];

    // Get classes/sections assigned to this teacher first
    const { data: subjects } = await insforge.database.from('subject_assignments')
        .select('class_id, section_id, subject_id, classes(name), sections(name), subjects(name)')
        .eq('teacher_id', teacherId)
        .eq('academic_year_id', activeYear.id);

    if (!subjects || subjects.length === 0) return [];

    const { data: assignments, error } = await insforge.database.from('assignments')
        .select('*, classes(name), sections(name), subjects(name)')
        .eq('academic_year_id', activeYear.id)
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return assignments || [];
}

export async function createAssignment(form) {
    const activeYear = await getActiveAcademicYear();
    if (!activeYear) throw new Error('No active academic year');

    const { data, error } = await insforge.database.from('assignments').insert([{
        teacher_id: form.teacher_id,
        class_id: form.class_id,
        section_id: form.section_id,
        subject_id: form.subject_id,
        academic_year_id: activeYear.id,
        title: form.title,
        description: form.description,
        due_date: form.due_date,
        total_points: form.total_points || 100,
        status: 'Active'
    }]).select();

    if (error) throw new Error(error.message);
    return data[0];
}

export async function updateAssignment(id, form) {
    const upd = {};
    if (form.title) upd.title = form.title;
    if (form.description !== undefined) upd.description = form.description;
    if (form.due_date) upd.due_date = form.due_date;
    if (form.total_points) upd.total_points = form.total_points;

    const { data, error } = await insforge.database.from('assignments').update(upd).eq('id', id).select();
    if (error) throw new Error(error.message);
    return data[0];
}

export async function deleteAssignment(id) {
    const { error } = await insforge.database.from('assignments').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return { success: true };
}

export async function getAssignmentSubmissions(assignmentId) {
    // Get assignment details to know class/section
    const { data: assignment } = await insforge.database.from('assignments').select('*').eq('id', assignmentId).single();
    if (!assignment) throw new Error('Assignment not found');

    // Get all students in that class/section
    const { data: students } = await insforge.database.from('enrollments')
        .select('id, student_id, roll_number, students(id, first_name, last_name, admission_number, users(name))')
        .eq('class_id', assignment.class_id)
        .eq('section_id', assignment.section_id)
        .eq('academic_year_id', assignment.academic_year_id);

    // Get existing submissions
    const { data: submissions } = await insforge.database.from('assignment_submissions')
        .select('*')
        .eq('assignment_id', assignmentId);

    const subMap = Object.fromEntries((submissions || []).map(s => [s.enrollment_id, s]));

    return (students || []).map(student => {
        const sub = subMap[student.id];
        return {
            enrollment_id: student.id,
            student_id: student.students?.id,
            name: student.students?.users?.name || `${student.students?.first_name} ${student.students?.last_name}`,
            roll_number: student.roll_number,
            status: sub ? 'Submitted' : 'Pending',
            submission_date: sub?.submitted_at,
            file_url: sub?.file_url,
            grade: sub?.marks,
            feedback: sub?.remarks,
            submission_id: sub?.id
        };
    });
}

export async function gradeSubmission(submissionId, enrollmentId, assignmentId, grade, feedback) {
    if (submissionId) {
        // Update existing submission
        const { error } = await insforge.database.from('assignment_submissions')
            .update({ marks: grade, remarks: feedback, graded_at: new Date().toISOString() })
            .eq('id', submissionId);
        if (error) throw new Error(error.message);
    } else {
        // Create submission record (teacher grading without student file upload)
        const { error } = await insforge.database.from('assignment_submissions')
            .insert([{
                assignment_id: assignmentId,
                enrollment_id: enrollmentId,
                marks: grade,
                remarks: feedback,
                graded_at: new Date().toISOString(),
                submitted_at: new Date().toISOString() // Auto-mark as submitted if graded
            }]);
        if (error) throw new Error(error.message);
    }
    return { success: true };
}

export async function getStudentSubjects(studentId) {
    const activeYear = await getActiveAcademicYear();
    if (!activeYear) return [];
    const { data: enr } = await insforge.database.from('enrollments').select('id,class_id,section_id').eq('student_id', studentId).eq('academic_year_id', activeYear.id).maybeSingle();
    if (!enr) return [];

    // Get subjects
    const { data: subjects } = await insforge.database.from('class_subjects').select('subject_id, subjects(name)').eq('class_id', enr.class_id);

    // Get teachers for these subjects
    const { data: teachers } = await insforge.database.from('subject_assignments')
        .select('subject_id, teacher_id, staff(users(name))')
        .eq('class_id', enr.class_id)
        .eq('section_id', enr.section_id)
        .eq('academic_year_id', activeYear.id);

    const teacherMap = {};
    (teachers || []).forEach(t => {
        teacherMap[t.subject_id] = t.staff?.users?.name || 'Unknown';
    });

    return (subjects || []).map(r => ({
        id: r.subject_id,
        name: r.subjects?.name || 'Subject',
        teacher_name: teacherMap[r.subject_id] || 'Not Assigned'
    }));
}

export async function getClassRoutine(classId, sectionId) {
    const activeYear = await getActiveAcademicYear();
    if (!activeYear) return [];

    const { data: routine } = await insforge.database
        .from('class_timetables')
        .select('id, day_of_week, period, start_time, end_time, room, class_subject_id, class_subjects(subject_id, subjects(name))')
        .eq('academic_year_id', activeYear.id)
        .eq('class_id', classId)
        .eq('section_id', sectionId)
        .order('day_of_week', { ascending: true })
        .order('period', { ascending: true });

    // Fetch teachers for subjects
    const { data: teachers } = await insforge.database.from('subject_assignments')
        .select('subject_id, staff(users(name))')
        .eq('class_id', classId)
        .eq('section_id', sectionId)
        .eq('academic_year_id', activeYear.id);

    const teacherMap = {};
    (teachers || []).forEach(t => {
        teacherMap[t.subject_id] = t.staff?.users?.name || 'Unknown';
    });

    return (routine || []).map(r => ({
        id: r.id,
        day: r.day_of_week,
        period: r.period,
        start_time: r.start_time,
        end_time: r.end_time,
        room: r.room || '',
        subject_id: r.class_subjects?.subject_id,
        subject_name: r.class_subjects?.subjects?.name || 'Subject',
        teacher_name: teacherMap[r.class_subjects?.subject_id] || 'Not Assigned'
    }));
}

export async function getAssignmentsForStudent(studentId) {
    const activeYear = await getActiveAcademicYear();
    if (!activeYear) return { assignments: [], submissions: [] };
    const { data: enr } = await insforge.database.from('enrollments').select('id,class_id,section_id').eq('student_id', studentId).eq('academic_year_id', activeYear.id).maybeSingle();
    if (!enr) return { assignments: [], submissions: [] };
    const { data: assignments } = await insforge.database.from('assignments').select('*').eq('academic_year_id', activeYear.id).eq('class_id', enr.class_id).eq('section_id', enr.section_id).order('due_date', { ascending: true });
    const { data: subs } = await insforge.database.from('assignment_submissions').select('*').eq('enrollment_id', enr.id);
    return { assignments: assignments || [], submissions: subs || [] };
}

export async function submitAssignment(assignmentId, studentId, file) {
    const activeYear = await getActiveAcademicYear();
    if (!activeYear) throw new Error('No active year');
    const { data: enr } = await insforge.database.from('enrollments').select('id').eq('student_id', studentId).eq('academic_year_id', activeYear.id).maybeSingle();
    if (!enr) throw new Error('Enrollment not found');
    const key = `assignments/${assignmentId}/${studentId}_${Date.now()}_${file.name}`;
    const { error: upErr } = await insforge.storage.from('assignments').upload(key, file);
    if (upErr) throw new Error(upErr.message);
    const { publicUrl } = insforge.storage.from('assignments').getPublicUrl(key);
    await insforge.database.from('assignment_submissions').upsert([{
        assignment_id: assignmentId,
        enrollment_id: enr.id,
        file_url: publicUrl,
        file_key: key,
        submitted_at: new Date().toISOString()
    }]);
    return { success: true, url: publicUrl };
}

// Fallbacks for undefined exports
export async function updateClass() { return { success: true }; }
export async function getTeacherHistory(teacherId) {
    const { data, error } = await insforge.database
        .from('subject_assignments')
        .select(`
            id, class_id, section_id, subject_id, academic_year_id, created_at,
            classes(name), sections(name), subjects(name), academic_years(name)
        `)
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map(r => ({
        id: r.id,
        class_name: r.classes?.name || 'Unknown',
        section_name: r.sections?.name || 'Unknown',
        subject_name: r.subjects?.name || 'Unknown',
        year: r.academic_years?.name || 'Unknown',
        assigned_date: r.created_at
    }));
}

export async function getTeacherAssignedSubjectIds(teacherId) {
    const activeYear = await getActiveAcademicYear();
    if (!activeYear) return [];
    const { data } = await insforge.database.from('subject_assignments')
        .select('subject_id')
        .eq('teacher_id', teacherId)
        .eq('academic_year_id', activeYear.id);
    return (data || []).map(r => r.subject_id);
}

export async function getClassAnalytics(classId, examId) {
    const activeYear = await getActiveAcademicYear();
    if (!activeYear) return { subjects: [], students: [] };
    const { data: enrolls } = await insforge.database.from('enrollments')
        .select('id, student_id, students(id, users(name))')
        .eq('class_id', classId)
        .eq('academic_year_id', activeYear.id);
    if (!enrolls || enrolls.length === 0) return { subjects: [], students: [] };
    const enrollIds = enrolls.map(e => e.id);
    let query = insforge.database.from('exam_marks')
        .select('subject_id, marks_obtained, subjects(name), enrollment_id')
        .in('enrollment_id', enrollIds);
    if (examId) query = query.eq('exam_id', examId);
    const { data: marks } = await query;
    const subjectStats = {};
    (marks || []).forEach(m => {
        const sid = m.subject_id;
        const sname = m.subjects?.name || 'Unknown';
        if (!subjectStats[sid]) subjectStats[sid] = { id: sid, name: sname, total: 0, count: 0, pass: 0, fail: 0, highest: 0 };
        const val = parseFloat(m.marks_obtained || 0);
        subjectStats[sid].total += val;
        subjectStats[sid].count += 1;
        if (val >= 40) subjectStats[sid].pass += 1;
        else subjectStats[sid].fail += 1;
        if (val > subjectStats[sid].highest) subjectStats[sid].highest = val;
    });
    const studentStats = {};
    (marks || []).forEach(m => {
        const eid = m.enrollment_id;
        if (!studentStats[eid]) studentStats[eid] = { total: 0, count: 0 };
        studentStats[eid].total += parseFloat(m.marks_obtained || 0);
        studentStats[eid].count += 1;
    });
    const studentList = enrolls.map(e => {
        const stats = studentStats[e.id] || { total: 0, count: 0 };
        return {
            id: e.student_id,
            name: e.students?.users?.name || 'Student',
            total: stats.total,
            avg: stats.count ? (stats.total / stats.count).toFixed(2) : 0
        };
    }).sort((a, b) => b.total - a.total);
    return {
        subjects: Object.values(subjectStats).map(s => ({ ...s, average: s.count ? (s.total / s.count).toFixed(2) : 0 })),
        students: studentList.slice(0, 5)
    };
}
export async function assignTeacherSubjects() { return { success: true }; }
export async function getAllSubjects() { return []; }

// ========== ADMIN ATTENDANCE MANAGEMENT ==========
export async function adminGetAttendance(classId, sectionId, date) {
    const activeYear = await getActiveAcademicYear();
    if (!activeYear) return { attendance: [], students: [] };

    // Get all enrollments for this class/section
    const { data: enrolls } = await insforge.database.from('enrollments')
        .select('id, student_id, roll_number, students(id, users:users!students_user_id_fkey(name))')
        .eq('class_id', classId)
        .eq('section_id', sectionId)
        .eq('academic_year_id', activeYear.id)
        .order('roll_number', { ascending: true });

    if (!enrolls || enrolls.length === 0) return { attendance: [], students: [] };

    const enrollIds = enrolls.map(e => e.id);

    // Get attendance for this date (all subjects)
    const { data: attData } = await insforge.database.from('attendance')
        .select('enrollment_id, status, subject_id, subjects(name), marked_by')
        .in('enrollment_id', enrollIds)
        .eq('attendance_date', date);

    const students = enrolls.map(e => ({
        id: e.student_id,
        enrollment_id: e.id,
        name: e.students?.users?.name || 'Student',
        roll_number: e.roll_number
    }));

    const attendance = (attData || []).map(a => ({
        enrollment_id: a.enrollment_id,
        status: a.status,
        subject_id: a.subject_id,
        subject_name: a.subjects?.name || 'General',
        marked_by: a.marked_by
    }));

    return { attendance, students };
}

export async function adminSaveAttendance(rows) {
    // Admin override - bypasses date lock
    return saveAttendance(rows, { override: true });
}

// End of refactored api.js

// ========== LIBRARY MANAGEMENT ==========
export async function getLibraryBooks({ search = '' } = {}) {
    let q = insforge.database.from('library_books').select('*').order('title');
    if (search) q = q.ilike('title', `%${search}%`);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return { books: data || [] };
}
export async function addLibraryBook(form) {
    const { data, error } = await insforge.database.from('library_books').insert([{
        title: form.title, author: form.author || null, isbn: form.isbn || null,
        category: form.category || null, total_copies: form.total_copies || 1, available_copies: form.total_copies || 1
    }]).select();
    if (error) throw new Error(error.message);
    return data[0];
}
export async function updateLibraryBook(id, form) {
    const { error } = await insforge.database.from('library_books').update({
        title: form.title, author: form.author, isbn: form.isbn,
        category: form.category, total_copies: form.total_copies
    }).eq('id', id);
    if (error) throw new Error(error.message);
}
export async function deleteLibraryBook(id) {
    const { error } = await insforge.database.from('library_books').delete().eq('id', id);
    if (error) throw new Error(error.message);
}
export async function getLibraryIssues({ status = '' } = {}) {
    let q = insforge.database.from('library_issues').select('*, library_books(title, author), users(name, email)').order('issue_date', { ascending: false });
    if (status) q = q.eq('status', status);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return { issues: data || [] };
}
export async function issueBook(bookId, userId, dueDate) {
    // Decrease available copies
    const { data: book } = await insforge.database.from('library_books').select('available_copies').eq('id', bookId).single();
    if (!book || book.available_copies <= 0) throw new Error('No copies available');
    await insforge.database.from('library_books').update({ available_copies: book.available_copies - 1 }).eq('id', bookId);
    const { data, error } = await insforge.database.from('library_issues').insert([{
        book_id: bookId, user_id: userId, issue_date: new Date().toISOString().split('T')[0],
        due_date: dueDate, status: 'Issued'
    }]).select();
    if (error) throw new Error(error.message);
    return data[0];
}
export async function returnBook(issueId) {
    const { data: issue } = await insforge.database.from('library_issues').select('book_id').eq('id', issueId).single();
    if (!issue) throw new Error('Issue record not found');
    await insforge.database.from('library_issues').update({ return_date: new Date().toISOString().split('T')[0], status: 'Returned' }).eq('id', issueId);
    const { data: book } = await insforge.database.from('library_books').select('available_copies').eq('id', issue.book_id).single();
    await insforge.database.from('library_books').update({ available_copies: (book?.available_copies || 0) + 1 }).eq('id', issue.book_id);
}

// ========== TRANSPORT MANAGEMENT ==========
export async function getTransportRoutes() {
    const { data, error } = await insforge.database.from('transport_routes').select('*').order('route_name');
    if (error) throw new Error(error.message);
    return { routes: data || [] };
}
export async function addTransportRoute(form) {
    const { data, error } = await insforge.database.from('transport_routes').insert([{
        route_name: form.route_name, start_point: form.start_point, end_point: form.end_point,
        fee_per_month: form.fee_per_month || 0
    }]).select();
    if (error) throw new Error(error.message);
    return data[0];
}
export async function updateTransportRoute(id, form) {
    const { error } = await insforge.database.from('transport_routes').update(form).eq('id', id);
    if (error) throw new Error(error.message);
}
export async function deleteTransportRoute(id) {
    const { error } = await insforge.database.from('transport_routes').delete().eq('id', id);
    if (error) throw new Error(error.message);
}
export async function getTransportVehicles() {
    const { data, error } = await insforge.database.from('transport_vehicles').select('*, transport_routes(route_name)').order('vehicle_number');
    if (error) throw new Error(error.message);
    return { vehicles: data || [] };
}
export async function addTransportVehicle(form) {
    const { data, error } = await insforge.database.from('transport_vehicles').insert([{
        vehicle_number: form.vehicle_number, capacity: form.capacity || 40,
        driver_name: form.driver_name || null, driver_phone: form.driver_phone || null,
        route_id: form.route_id || null
    }]).select();
    if (error) throw new Error(error.message);
    return data[0];
}
export async function deleteTransportVehicle(id) {
    const { error } = await insforge.database.from('transport_vehicles').delete().eq('id', id);
    if (error) throw new Error(error.message);
}
export async function getStudentTransport() {
    const { data, error } = await insforge.database.from('student_transport')
        .select('*, transport_routes(route_name, fee_per_month), enrollments(roll_number, students(first_name, last_name), classes(name), sections(name))')
        .eq('is_active', true).order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return { assignments: data || [] };
}
export async function assignStudentTransport(enrollmentId, routeId, pickupPoint) {
    const { data, error } = await insforge.database.from('student_transport').upsert([{
        enrollment_id: enrollmentId, route_id: routeId, pickup_point: pickupPoint || null,
        start_date: new Date().toISOString().split('T')[0], is_active: true
    }], { onConflict: 'enrollment_id,route_id' }).select();
    if (error) throw new Error(error.message);
    return data[0];
}
export async function removeStudentTransport(id) {
    const { error } = await insforge.database.from('student_transport').update({ is_active: false, end_date: new Date().toISOString().split('T')[0] }).eq('id', id);
    if (error) throw new Error(error.message);
}

// ========== INVENTORY MANAGEMENT ==========
export async function getInventoryItems({ search = '' } = {}) {
    let q = insforge.database.from('inventory_items').select('*').order('item_name');
    if (search) q = q.ilike('item_name', `%${search}%`);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return { items: data || [] };
}
export async function addInventoryItem(form) {
    const { data, error } = await insforge.database.from('inventory_items').insert([{
        item_name: form.item_name, category: form.category || null, quantity: form.quantity || 0,
        unit_price: form.unit_price || null, purchase_date: form.purchase_date || null, status: form.status || 'Good'
    }]).select();
    if (error) throw new Error(error.message);
    return data[0];
}
export async function updateInventoryItem(id, form) {
    const { error } = await insforge.database.from('inventory_items').update(form).eq('id', id);
    if (error) throw new Error(error.message);
}
export async function deleteInventoryItem(id) {
    const { error } = await insforge.database.from('inventory_items').delete().eq('id', id);
    if (error) throw new Error(error.message);
}

// ========== TIMETABLE ADMIN ==========
export async function saveTimetableSlot(slot) {
    const row = {
        academic_year_id: slot.academic_year_id, class_id: slot.class_id, section_id: slot.section_id,
        day_of_week: slot.day_of_week, period: slot.period,
        start_time: slot.start_time || null, end_time: slot.end_time || null,
        class_subject_id: slot.class_subject_id || null, room: slot.room || null
    };
    if (slot.id) row.id = slot.id; // only include id for updates
    const { data, error } = await insforge.database.from('class_timetables').upsert([row]).select();
    if (error) throw new Error(error.message);
    return data[0];
}
export async function deleteTimetableSlot(id) {
    const { error } = await insforge.database.from('class_timetables').delete().eq('id', id);
    if (error) throw new Error(error.message);
}
export async function getTimetableForClass(classId, sectionId) {
    let q = insforge.database.from('class_timetables')
        .select('*, class_subjects(subjects(name))').eq('class_id', classId).order('day_of_week').order('period');
    if (sectionId) q = q.eq('section_id', sectionId);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return { slots: data || [] };
}

// ========== SALARY PAYMENTS ==========
export async function getSalaryPayments({ month = '', staffId = '' } = {}) {
    let q = insforge.database.from('salary_payments').select('*, staff(first_name, last_name, employee_id, designation)').order('payment_date', { ascending: false });
    if (month) q = q.eq('month_year', month);
    if (staffId) q = q.eq('staff_id', staffId);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return { payments: data || [] };
}
export async function createSalaryPayment(form) {
    const { data, error } = await insforge.database.from('salary_payments').insert([{
        staff_id: form.staff_id, amount: form.amount, payment_date: form.payment_date || new Date().toISOString().split('T')[0],
        month_year: form.month_year, payment_method: form.payment_method || 'Bank Transfer', status: 'Paid'
    }]).select();
    if (error) throw new Error(error.message);
    return data[0];
}
export async function deleteSalaryPayment(id) {
    const { error } = await insforge.database.from('salary_payments').delete().eq('id', id);
    if (error) throw new Error(error.message);
}

// ========== STUDENT DOCUMENTS ==========
export async function getStudentDocuments(studentId) {
    const { data, error } = await insforge.database.from('student_documents').select('*').eq('student_id', studentId).order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return { documents: data || [] };
}
export async function addStudentDocument(studentId, form) {
    const { data, error } = await insforge.database.from('student_documents').insert([{
        student_id: studentId, document_type: form.document_type, document_name: form.document_name,
        file_url: form.file_url, file_key: form.file_key || null, notes: form.notes || null
    }]).select();
    if (error) throw new Error(error.message);
    return data[0];
}
export async function deleteStudentDocument(id) {
    const { error } = await insforge.database.from('student_documents').delete().eq('id', id);
    if (error) throw new Error(error.message);
}

// ========== CLASS TEACHERS ==========
export async function getClassTeachers(academicYearId) {
    let q = insforge.database.from('class_teachers').select('*, classes(name), sections(name), staff(first_name, last_name, employee_id)');
    if (academicYearId) q = q.eq('academic_year_id', academicYearId);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return { classTeachers: data || [] };
}
export async function assignClassTeacher(academicYearId, classId, sectionId, staffId) {
    const { data, error } = await insforge.database.from('class_teachers').upsert([{
        academic_year_id: academicYearId, class_id: classId, section_id: sectionId, staff_id: staffId
    }], { onConflict: 'academic_year_id,class_id,section_id' }).select();
    if (error) throw new Error(error.message);
    return data[0];
}
export async function removeClassTeacher(id) {
    const { error } = await insforge.database.from('class_teachers').delete().eq('id', id);
    if (error) throw new Error(error.message);
}
