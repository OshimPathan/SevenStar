import bcrypt from 'bcrypt';
import { query } from '../db.js';
import dotenv from 'dotenv';

dotenv.config();
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || '10');

// Utility: Audit log entry
const logAudit = async ({ userId, action, table, recordId, description, oldData, newData, req }) => {
    try {
        await query(
            `INSERT INTO audit_logs (user_id, action, table_name, record_id, details)
             VALUES ($1, $2, $3, $4, $5)`,
            [
                userId,
                action,
                table,
                recordId,
                JSON.stringify({
                    description: description || null,
                    ip_address: req?.ip || null,
                    user_agent: req?.headers?.['user-agent'] || null,
                    old_data: oldData || null,
                    new_data: newData || null
                })
            ]
        );
    } catch (e) {
        console.error('Audit log error:', e.message);
    }
};
// ── Exam Routine Management ──
export const getExamRoutines = async (req, res) => {
    try {
        const { exam_id } = req.query;
        let sql = `SELECT er.*, s.name as subject_name
            FROM exam_routines er
            JOIN subjects s ON er.subject_id = s.id
            JOIN exam_classes ec ON er.exam_class_id = ec.id`;
        const params = [];
        if (exam_id) {
            params.push(exam_id);
            sql += ' WHERE ec.exam_id = $1';
        }
        sql += ' ORDER BY er.exam_date, er.start_time';
        const result = await query(sql, params);
        res.json({ routines: result.rows });
    } catch (error) {
        console.error('Error fetching exam routines:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const saveExamRoutine = async (req, res) => {
    try {
        const { exam_id, subject_id, exam_date, start_time, end_time, room } = req.body;
        // Find the exam_class record for this exam
        const ecResult = await query('SELECT id FROM exam_classes WHERE exam_id = $1 LIMIT 1', [exam_id]);
        if (ecResult.rows.length === 0) return res.status(400).json({ error: 'No exam_classes record found for this exam' });
        const examClassId = ecResult.rows[0].id;

        // Upsert logic
        const existing = await query('SELECT id FROM exam_routines WHERE exam_class_id = $1 AND subject_id = $2', [examClassId, subject_id]);
        let result;
        if (existing.rows.length > 0) {
            result = await query(
                'UPDATE exam_routines SET exam_date = $1, start_time = $2, end_time = $3, room_number = $4 WHERE id = $5 RETURNING *',
                [exam_date, start_time, end_time, room, existing.rows[0].id]
            );
        } else {
            result = await query(
                'INSERT INTO exam_routines (exam_class_id, subject_id, exam_date, start_time, end_time, room_number) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                [examClassId, subject_id, exam_date, start_time, end_time, room]
            );
        }
        res.status(201).json({ routine: result.rows[0] });
    } catch (error) {
        console.error('Error saving exam routine:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const deleteExamRoutine = async (req, res) => {
    try {
        const { id } = req.params;
        await query('DELETE FROM exam_routines WHERE id = $1', [id]);
        res.json({ message: 'Exam routine deleted' });
    } catch (error) {
        console.error('Error deleting exam routine:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const publishExam = async (req, res) => {
    try {
        const { exam_id, published } = req.body;
        await query('UPDATE exams SET published = $1 WHERE id = $2', [!!published, exam_id]);
        res.json({ message: published ? 'Exam published' : 'Exam unpublished' });
    } catch (error) {
        console.error('Error publishing exam:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const publishResults = async (req, res) => {
    try {
        const { exam_id, published } = req.body;
        await query('UPDATE exams SET results_published = $1 WHERE id = $2', [!!published, exam_id]);
        res.json({ message: published ? 'Results published' : 'Results hidden' });
    } catch (error) {
        console.error('Error publishing results:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// ── Result Verification ──
export const verifyStudentMarks = async (req, res) => {
    try {
        const { result_id } = req.body;
        await query('UPDATE exam_marks SET verified = TRUE, verified_by = $1 WHERE id = $2', [req.user.id, result_id]);
        res.json({ message: 'Result verified' });
    } catch (error) {
        console.error('Error verifying result:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const unverifyStudentMarks = async (req, res) => {
    try {
        const { result_id } = req.body;
        await query('UPDATE exam_marks SET verified = FALSE, verified_by = NULL WHERE id = $1', [result_id]);
        res.json({ message: 'Result unverified' });
    } catch (error) {
        console.error('Error unverifying result:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
// ── Dashboard Stats ──
export const getDashboardStats = async (req, res) => {
    try {
        const studentsCount = await query('SELECT COUNT(*) FROM students WHERE is_deleted IS NOT TRUE');
        const teachersCount = await query("SELECT COUNT(*) FROM staff WHERE staff_type = 'Teaching' AND is_deleted IS NOT TRUE");
        const classesCount = await query('SELECT COUNT(*) FROM classes WHERE is_deleted IS NOT TRUE');
        const parentsCount = await query("SELECT COUNT(*) FROM users WHERE role = 'PARENT' AND is_deleted IS NOT TRUE");
        const pendingFees = await query("SELECT COUNT(*) FROM student_fees WHERE status != 'Paid'");
        const notices = await query('SELECT * FROM notices WHERE is_active = true ORDER BY created_at DESC LIMIT 5');
        const events = await query('SELECT * FROM events ORDER BY start_date ASC LIMIT 5');

        const attendanceStats = await query(`
            SELECT attendance_date as date, 
                   COUNT(*) FILTER (WHERE status = 'Present') as present,
                   COUNT(*) FILTER (WHERE status = 'Absent') as absent,
                   COUNT(*) FILTER (WHERE status = 'Late') as late,
                   COUNT(*) as total
            FROM attendance
            WHERE attendance_date >= CURRENT_DATE - INTERVAL '7 days'
            GROUP BY attendance_date ORDER BY attendance_date ASC
        `);

        const recentStudents = await query(`
            SELECT s.id, s.admission_number, u.name,
                   c.name as class_name
            FROM students s
            JOIN users u ON s.user_id = u.id
            LEFT JOIN enrollments e ON e.student_id = s.id
            LEFT JOIN classes c ON e.class_id = c.id
            WHERE s.is_deleted IS NOT TRUE
            ORDER BY s.created_at DESC LIMIT 5
        `);

        res.json({
            stats: {
                totalStudents: parseInt(studentsCount.rows[0].count),
                totalTeachers: parseInt(teachersCount.rows[0].count),
                totalClasses: parseInt(classesCount.rows[0].count),
                totalParents: parseInt(parentsCount.rows[0].count),
                pendingFees: parseInt(pendingFees.rows[0].count),
            },
            attendanceStats: attendanceStats.rows,
            recentNotices: notices.rows,
            upcomingEvents: events.rows,
            recentStudents: recentStudents.rows,
        });
    } catch (error) {
        console.error('Error fetching admin dashboard stats:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// ── All Users ──
export const getAllUsers = async (req, res) => {
    try {
        const { role, search } = req.query;
        let sql = 'SELECT id, name, email, role, created_at FROM users WHERE is_deleted IS NOT TRUE';
        const params = [];
        const conditions = [];

        if (role) {
            params.push(role);
            conditions.push(`role = $${params.length}`);
        }
        if (search) {
            params.push(`%${search}%`);
            conditions.push(`(name ILIKE $${params.length} OR email ILIKE $${params.length})`);
        }

        if (conditions.length > 0) sql += ' AND ' + conditions.join(' AND ');
        sql += ' ORDER BY created_at DESC';

        const result = await query(sql, params);
        res.json({ users: result.rows });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// ── Students CRUD ──
export const getStudents = async (req, res) => {
    try {
        const { search, classId } = req.query;
        let sql = `
            SELECT s.id, s.admission_number, s.father_name as parent_name, s.father_phone as parent_phone,
                   s.parent_user_id, s.date_of_birth, s.blood_group, s.address,
                   u.id as user_id, u.name, u.email,
                   e.class_id, e.roll_number, e.section_id,
                   c.name as class_name, sec.name as section
            FROM students s
            JOIN users u ON s.user_id = u.id
            LEFT JOIN enrollments e ON e.student_id = s.id
            LEFT JOIN classes c ON e.class_id = c.id
            LEFT JOIN sections sec ON e.section_id = sec.id
            WHERE s.is_deleted IS NOT TRUE
        `;
        const params = [];
        const conditions = [];

        if (search) {
            params.push(`%${search}%`);
            conditions.push(`(u.name ILIKE $${params.length} OR s.admission_number ILIKE $${params.length} OR u.email ILIKE $${params.length})`);
        }
        if (classId) {
            params.push(classId);
            conditions.push(`e.class_id = $${params.length}`);
        }

        if (conditions.length > 0) sql += ' AND ' + conditions.join(' AND ');
        sql += ' ORDER BY c.name, e.roll_number';

        const result = await query(sql, params);
        res.json({ students: result.rows });
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const createStudent = async (req, res) => {
    try {
        const {
            name, email, password, class_id, roll_number, date_of_birth,
            blood_group, address, parent_name, parent_phone, parent_email,
            create_parent_account, gender
        } = req.body;

        const passwordHash = await bcrypt.hash(password || 'student123', SALT_ROUNDS);

        // Create student user account
        const userResult = await query(
            'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id',
            [name, email, passwordHash, 'STUDENT']
        );
        const userId = userResult.rows[0].id;

        // Generate admission number
        const countResult = await query('SELECT COUNT(*) FROM students');
        const admNo = `ADM${new Date().getFullYear()}${String(parseInt(countResult.rows[0].count) + 1).padStart(3, '0')}`;

        // Optionally create parent user account
        let parentUserId = null;
        if (create_parent_account && parent_email) {
            const parentPasswordHash = await bcrypt.hash('parent123', SALT_ROUNDS);
            try {
                const parentResult = await query(
                    'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id',
                    [parent_name, parent_email, parentPasswordHash, 'PARENT']
                );
                parentUserId = parentResult.rows[0].id;
            } catch (e) {
                if (e.code === '23505') {
                    const existing = await query("SELECT id FROM users WHERE email = $1 AND role = 'PARENT'", [parent_email]);
                    if (existing.rows[0]) parentUserId = existing.rows[0].id;
                }
            }
        }

        const studentResult = await query(
            `INSERT INTO students (user_id, admission_number, first_name, last_name, date_of_birth, gender, blood_group, address, father_name, father_phone, parent_user_id, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'Active') RETURNING *`,
            [userId, admNo, (name || 'Unknown').split(' ')[0], (name || '').split(' ').slice(1).join(' ') || '.', date_of_birth || null, gender || null, blood_group || null, address || null, parent_name || null, parent_phone || null, parentUserId]
        );

        // Create enrollment if class_id provided
        if (class_id) {
            const ayResult = await query("SELECT id FROM academic_years WHERE is_active = true LIMIT 1");
            const academicYearId = ayResult.rows[0]?.id;
            if (academicYearId) {
                const secResult = await query('SELECT id FROM sections WHERE class_id = $1 LIMIT 1', [class_id]);
                const sectionId = secResult.rows[0]?.id;
                if (sectionId) {
                    await query(
                        'INSERT INTO enrollments (student_id, academic_year_id, class_id, section_id, roll_number) VALUES ($1, $2, $3, $4, $5)',
                        [studentResult.rows[0].id, academicYearId, class_id, sectionId, roll_number ? parseInt(roll_number) : null]
                    );
                }
            }
        }

        res.status(201).json({
            message: 'Student created successfully',
            student: studentResult.rows[0],
            credentials: {
                student: { email, password: password || 'student123' },
                parent: parentUserId ? { email: parent_email, password: 'parent123' } : null
            }
        });
    } catch (error) {
        console.error('Error creating student:', error);
        if (error.code === '23505') return res.status(400).json({ error: 'Email already exists' });
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
};

export const updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, class_id, roll_number, date_of_birth, blood_group, address, parent_name, parent_phone } = req.body;

        const studentResult = await query('SELECT * FROM students WHERE id = $1', [id]);
        if (studentResult.rows.length === 0) return res.status(404).json({ error: 'Student not found' });
        const oldStudent = studentResult.rows[0];
        const userId = oldStudent.user_id;

        if (name || email) {
            const sets = [];
            const vals = [];
            if (name) { vals.push(name); sets.push(`name = $${vals.length}`); }
            if (email) { vals.push(email); sets.push(`email = $${vals.length}`); }
            vals.push(userId);
            await query(`UPDATE users SET ${sets.join(', ')} WHERE id = $${vals.length}`, vals);
        }

        // Update student profile fields
        const studentUpdate = {};
        if (name) {
            studentUpdate.first_name = name.split(' ')[0];
            studentUpdate.last_name = name.split(' ').slice(1).join(' ') || '.';
        }
        if (date_of_birth !== undefined) studentUpdate.date_of_birth = date_of_birth || null;
        if (blood_group !== undefined) studentUpdate.blood_group = blood_group || null;
        if (address !== undefined) studentUpdate.address = address || null;
        if (parent_name !== undefined) studentUpdate.father_name = parent_name || null;
        if (parent_phone !== undefined) studentUpdate.father_phone = parent_phone || null;

        if (Object.keys(studentUpdate).length > 0) {
            const sets = [];
            const vals = [];
            for (const [key, val] of Object.entries(studentUpdate)) {
                vals.push(val);
                sets.push(`${key} = $${vals.length}`);
            }
            vals.push(id);
            await query(`UPDATE students SET ${sets.join(', ')} WHERE id = $${vals.length}`, vals);
        }

        // Update enrollment if class_id or roll_number changed
        if (class_id || roll_number !== undefined) {
            const ayResult = await query("SELECT id FROM academic_years WHERE is_active = true LIMIT 1");
            const academicYearId = ayResult.rows[0]?.id;
            if (academicYearId) {
                const enrResult = await query('SELECT id FROM enrollments WHERE student_id = $1 AND academic_year_id = $2', [id, academicYearId]);
                if (enrResult.rows.length > 0) {
                    const enrUpdate = {};
                    if (class_id) {
                        enrUpdate.class_id = class_id;
                        const secResult = await query('SELECT id FROM sections WHERE class_id = $1 LIMIT 1', [class_id]);
                        if (secResult.rows[0]) enrUpdate.section_id = secResult.rows[0].id;
                    }
                    if (roll_number !== undefined) enrUpdate.roll_number = roll_number ? parseInt(roll_number) : null;
                    if (Object.keys(enrUpdate).length > 0) {
                        const sets = [];
                        const vals = [];
                        for (const [key, val] of Object.entries(enrUpdate)) {
                            vals.push(val);
                            sets.push(`${key} = $${vals.length}`);
                        }
                        vals.push(enrResult.rows[0].id);
                        await query(`UPDATE enrollments SET ${sets.join(', ')} WHERE id = $${vals.length}`, vals);
                    }
                }
            }
        }

        // Fetch new data for audit
        const newStudentResult = await query('SELECT * FROM students WHERE id = $1', [id]);
        const newStudent = newStudentResult.rows[0];

        await logAudit({
            userId: req.user?.id,
            action: 'UPDATE_STUDENT',
            table: 'students',
            recordId: id,
            description: 'Admin updated student information',
            oldData: oldStudent,
            newData: newStudent,
            req
        });

        res.json({ message: 'Student updated successfully' });
    } catch (error) {
        console.error('Error updating student:', error);
        if (error.code === '23505') return res.status(400).json({ error: 'Email already exists' });
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const studentResult = await query('SELECT user_id FROM students WHERE id = $1', [id]);
        if (studentResult.rows.length === 0) return res.status(404).json({ error: 'Student not found' });

        await query('UPDATE students SET is_deleted = true, deleted_at = NOW() WHERE id = $1', [id]);
        await query('UPDATE users SET is_deleted = true, deleted_at = NOW() WHERE id = $1', [studentResult.rows[0].user_id]);
        res.json({ message: 'Student deleted' });
    } catch (error) {
        console.error('Error deleting student:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// ── Teachers CRUD (staff table) ──
export const getTeachers = async (req, res) => {
    try {
        const { search } = req.query;
        let sql = `
            SELECT t.id, t.employee_id, t.contact_phone as phone, t.qualification,
                   t.hire_date as joined_date, t.address,
                   u.name, u.email
            FROM staff t
            JOIN users u ON t.user_id = u.id
            WHERE t.staff_type = 'Teaching' AND t.is_deleted IS NOT TRUE
        `;
        const params = [];
        if (search) {
            params.push(`%${search}%`);
            sql += ` AND (u.name ILIKE $1 OR t.employee_id ILIKE $1 OR u.email ILIKE $1)`;
        }
        sql += ' ORDER BY u.name';

        const result = await query(sql, params);
        res.json({ teachers: result.rows });
    } catch (error) {
        console.error('Error fetching teachers:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const createTeacher = async (req, res) => {
    try {
        const { name, email, password, phone, qualification, address, joined_date } = req.body;
        const passwordHash = await bcrypt.hash(password || 'teacher123', SALT_ROUNDS);

        const userResult = await query(
            'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id',
            [name, email, passwordHash, 'TEACHER']
        );

        const countResult = await query("SELECT COUNT(*) FROM staff WHERE staff_type = 'Teaching'");
        const empId = `EMP${String(parseInt(countResult.rows[0].count) + 1).padStart(3, '0')}`;
        const nameParts = (name || '').split(' ');
        const firstName = nameParts[0] || 'Unknown';
        const lastName = nameParts.slice(1).join(' ') || '.';

        const teacherResult = await query(
            `INSERT INTO staff (user_id, employee_id, first_name, last_name, staff_type, designation, qualification, hire_date, contact_phone, address)
             VALUES ($1, $2, $3, $4, 'Teaching', 'Teacher', $5, $6, $7, $8) RETURNING *`,
            [userResult.rows[0].id, empId, firstName, lastName, qualification || null, joined_date || new Date().toISOString().split('T')[0], phone || null, address || null]
        );

        res.status(201).json({
            message: 'Teacher created successfully',
            teacher: teacherResult.rows[0],
            credentials: { email, password: password || 'teacher123' }
        });
    } catch (error) {
        console.error('Error creating teacher:', error);
        if (error.code === '23505') return res.status(400).json({ error: 'Email already exists' });
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
};

export const updateTeacher = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, qualification, address, joined_date } = req.body;

        const teacherResult = await query('SELECT user_id FROM staff WHERE id = $1', [id]);
        if (teacherResult.rows.length === 0) return res.status(404).json({ error: 'Teacher not found' });

        const userId = teacherResult.rows[0].user_id;

        if (name || email) {
            const sets = [];
            const vals = [];
            if (name) { vals.push(name); sets.push(`name = $${vals.length}`); }
            if (email) { vals.push(email); sets.push(`email = $${vals.length}`); }
            vals.push(userId);
            await query(`UPDATE users SET ${sets.join(', ')} WHERE id = $${vals.length}`, vals);
        }

        await query(
            `UPDATE staff SET contact_phone = COALESCE($1, contact_phone), qualification = COALESCE($2, qualification),
             address = COALESCE($3, address), hire_date = COALESCE($4, hire_date)
             WHERE id = $5`,
            [phone || null, qualification || null, address || null, joined_date || null, id]
        );

        if (name) {
            const nameParts = name.split(' ');
            await query('UPDATE staff SET first_name = $1, last_name = $2 WHERE id = $3',
                [nameParts[0], nameParts.slice(1).join(' ') || '.', id]);
        }

        res.json({ message: 'Teacher updated successfully' });
    } catch (error) {
        console.error('Error updating teacher:', error);
        if (error.code === '23505') return res.status(400).json({ error: 'Email already exists' });
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const deleteTeacher = async (req, res) => {
    try {
        const { id } = req.params;
        const teacherResult = await query('SELECT user_id FROM staff WHERE id = $1', [id]);
        if (teacherResult.rows.length === 0) return res.status(404).json({ error: 'Teacher not found' });

        // Soft delete
        await query('UPDATE staff SET is_deleted = true, deleted_at = NOW() WHERE id = $1', [id]);
        await query('UPDATE users SET is_deleted = true, deleted_at = NOW() WHERE id = $1', [teacherResult.rows[0].user_id]);
        res.json({ message: 'Teacher deleted' });
    } catch (error) {
        console.error('Error deleting teacher:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// ── Parents CRUD ──
export const getParents = async (req, res) => {
    try {
        const { search } = req.query;
        let sql = `
            SELECT u.id, u.name, u.email, u.created_at,
                   COALESCE(
                       json_agg(
                           json_build_object(
                               'id', s.id,
                               'name', su.name,
                               'class_name', c.name,
                               'admission_number', s.admission_number
                           )
                       ) FILTER (WHERE s.id IS NOT NULL),
                       '[]'
                   ) as children
            FROM users u
            LEFT JOIN students s ON s.parent_user_id = u.id
            LEFT JOIN users su ON s.user_id = su.id
            LEFT JOIN enrollments e ON e.student_id = s.id
            LEFT JOIN classes c ON e.class_id = c.id
            WHERE u.role = 'PARENT' AND u.is_deleted IS NOT TRUE
        `;
        const params = [];
        if (search) {
            params.push(`%${search}%`);
            sql += ` AND (u.name ILIKE $${params.length} OR u.email ILIKE $${params.length})`;
        }
        sql += ' GROUP BY u.id ORDER BY u.name';

        const result = await query(sql, params);
        res.json({ parents: result.rows });
    } catch (error) {
        console.error('Error fetching parents:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const createParent = async (req, res) => {
    try {
        const { name, email, password, phone, student_ids } = req.body;
        const passwordHash = await bcrypt.hash(password || 'parent123', SALT_ROUNDS);

        const userResult = await query(
            'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id',
            [name, email, passwordHash, 'PARENT']
        );
        const parentId = userResult.rows[0].id;

        if (student_ids && student_ids.length > 0) {
            for (const sid of student_ids) {
                await query('UPDATE students SET parent_user_id = $1 WHERE id = $2',
                    [parentId, sid]);
            }
        }

        res.status(201).json({
            message: 'Parent account created successfully',
            parent: { id: parentId, name, email },
            credentials: { email, password: password || 'parent123' }
        });
    } catch (error) {
        console.error('Error creating parent:', error);
        if (error.code === '23505') return res.status(400).json({ error: 'Email already exists' });
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
};

export const deleteParent = async (req, res) => {
    try {
        const { id } = req.params;
        await query('UPDATE students SET parent_user_id = NULL WHERE parent_user_id = $1', [id]);
        await query('UPDATE users SET is_deleted = true, deleted_at = NOW() WHERE id = $1', [id]);
        res.json({ message: 'Parent deleted' });
    } catch (error) {
        console.error('Error deleting parent:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// ── Reset Password (Admin resets any user password) ──
export const resetUserPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { new_password } = req.body;
        const passwordHash = await bcrypt.hash(new_password || 'password123', SALT_ROUNDS);
        await query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, id]);
        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// ── Classes CRUD ──
export const getClasses = async (req, res) => {
    try {
        const result = await query(`
            SELECT c.*,
                   COUNT(DISTINCT e.student_id) as student_count,
                   COUNT(DISTINCT cs.subject_id) as subject_count
            FROM classes c
            LEFT JOIN enrollments e ON e.class_id = c.id
            LEFT JOIN class_subjects cs ON cs.class_id = c.id
            WHERE c.is_deleted IS NOT TRUE
            GROUP BY c.id ORDER BY c.name
        `);
        res.json({ classes: result.rows });
    } catch (error) {
        console.error('Error fetching classes:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const createClass = async (req, res) => {
    try {
        const { name, section, stream } = req.body;
        // Get or create stream
        let streamId = null;
        if (stream) {
            let streamResult = await query('SELECT id FROM streams WHERE name = $1', [stream]);
            if (streamResult.rows.length === 0) {
                streamResult = await query('INSERT INTO streams (name) VALUES ($1) RETURNING id', [stream]);
            }
            streamId = streamResult.rows[0].id;
        }

        const result = await query(
            'INSERT INTO classes (name, level, stream_id) VALUES ($1, $2, $3) RETURNING *',
            [name, 1, streamId]
        );
        const classId = result.rows[0].id;

        // Create default section
        await query('INSERT INTO sections (class_id, name) VALUES ($1, $2)', [classId, section || 'A']);

        res.status(201).json({ message: 'Class created', class: result.rows[0] });
    } catch (error) {
        console.error('Error creating class:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const deleteClass = async (req, res) => {
    try {
        const { id } = req.params;
        await query('UPDATE classes SET is_deleted = true, deleted_at = NOW() WHERE id = $1', [id]);
        res.json({ message: 'Class deleted' });
    } catch (error) {
        console.error('Error deleting class:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// ── Notices CRUD ──
export const getNotices = async (req, res) => {
    try {
        const result = await query('SELECT * FROM notices ORDER BY created_at DESC');
        res.json({ notices: result.rows });
    } catch (error) {
        console.error('Error fetching notices:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const createNotice = async (req, res) => {
    try {
        const { title, content } = req.body;
        const result = await query(
            'INSERT INTO notices (title, content, is_active) VALUES ($1, $2, true) RETURNING *',
            [title, content]
        );
        res.status(201).json({ message: 'Notice created', notice: result.rows[0] });
    } catch (error) {
        console.error('Error creating notice:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const deleteNotice = async (req, res) => {
    try {
        await query('DELETE FROM notices WHERE id = $1', [req.params.id]);
        res.json({ message: 'Notice deleted' });
    } catch (error) {
        console.error('Error deleting notice:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// ── Events ──
export const getEvents = async (req, res) => {
    try {
        const result = await query('SELECT * FROM events ORDER BY start_date ASC');
        res.json({ events: result.rows });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// ── Fees ──
export const getAllFees = async (req, res) => {
    try {
        const result = await query(`
            SELECT sf.id, sf.due_date, sf.amount_due, sf.amount_paid, sf.status,
                   u.name as student_name, c.name as class_name
            FROM student_fees sf
            JOIN enrollments e ON sf.enrollment_id = e.id
            JOIN students s ON e.student_id = s.id
            JOIN users u ON s.user_id = u.id
            LEFT JOIN classes c ON e.class_id = c.id
            ORDER BY sf.due_date DESC
        `);
        res.json({ fees: result.rows });
    } catch (error) {
        console.error('Error fetching fees:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// ── Admin Attendance Management ──
export const getAttendanceForAdmin = async (req, res) => {
    try {
        const { class_id, date } = req.query;
        if (!class_id || !date) return res.status(400).json({ error: 'class_id and date are required' });

        // Get active academic year
        const ayResult = await query("SELECT id FROM academic_years WHERE is_active = true LIMIT 1");
        const academicYearId = ayResult.rows[0]?.id;
        if (!academicYearId) return res.json({ attendance: [], students: [] });

        // Get enrollments for the class
        const enrollResult = await query(`
            SELECT e.id as enrollment_id, e.student_id, e.roll_number,
                   u.name as student_name, s.admission_number
            FROM enrollments e
            JOIN students s ON e.student_id = s.id
            JOIN users u ON s.user_id = u.id
            WHERE e.class_id = $1 AND e.academic_year_id = $2
            ORDER BY e.roll_number
        `, [class_id, academicYearId]);

        const enrollIds = enrollResult.rows.map(e => e.enrollment_id);

        // Get attendance for these enrollments on the date
        let attendance = [];
        if (enrollIds.length > 0) {
            const attResult = await query(`
                SELECT a.id, a.enrollment_id, a.attendance_date, a.status, a.marked_by,
                       st.first_name || ' ' || st.last_name as marked_by_name
                FROM attendance a
                LEFT JOIN staff st ON a.marked_by = st.id
                WHERE a.enrollment_id = ANY($1) AND a.attendance_date = $2
            `, [enrollIds, date]);
            attendance = attResult.rows;
        }

        res.json({ attendance, students: enrollResult.rows });
    } catch (error) {
        console.error('Error fetching admin attendance:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const updateAttendance = async (req, res) => {
    try {
        const { date, attendance } = req.body; // attendance: [{ student_id, class_id, status }]
        const markedBy = req.user.id;

        // Get active academic year
        const ayResult = await query("SELECT id FROM academic_years WHERE is_active = true LIMIT 1");
        const academicYearId = ayResult.rows[0]?.id;
        if (!academicYearId) return res.status(400).json({ error: 'No active academic year' });

        // Get staff_id for marked_by
        const staffResult = await query('SELECT id FROM staff WHERE user_id = $1', [markedBy]);
        const staffId = staffResult.rows[0]?.id || null;

        for (const record of attendance) {
            // Find enrollment_id
            const enrResult = await query(
                'SELECT id FROM enrollments WHERE student_id = $1 AND class_id = $2 AND academic_year_id = $3',
                [record.student_id, record.class_id, academicYearId]
            );
            if (enrResult.rows.length === 0) continue;
            const enrollmentId = enrResult.rows[0].id;

            await query(
                `INSERT INTO attendance (enrollment_id, attendance_date, status, marked_by)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (enrollment_id, attendance_date, subject_id)
                 DO UPDATE SET status = $3, marked_by = $4`,
                [enrollmentId, date, record.status, staffId]
            );
        }

        await logAudit({
            userId: markedBy,
            action: 'ADMIN_UPDATE_ATTENDANCE',
            table: 'attendance',
            recordId: null,
            description: `Admin updated attendance for ${attendance.length} students on ${date}`,
            req
        });

        res.json({ message: 'Attendance updated successfully by admin', count: attendance.length });
    } catch (error) {
        console.error('Error updating admin attendance:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

