import { query } from '../db.js';

export const getTeacherDashboardStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const teacherResult = await query("SELECT id FROM staff WHERE user_id = $1 AND staff_type = 'Teaching'", [userId]);
        if (teacherResult.rows.length === 0) return res.status(404).json({ error: 'Teacher profile not found' });

        const teacherId = teacherResult.rows[0].id;

        // Get active academic year
        const ayResult = await query("SELECT id FROM academic_years WHERE is_active = true LIMIT 1");
        const academicYearId = ayResult.rows[0]?.id;

        const classesResult = await query(`
            SELECT DISTINCT c.id, c.name, sub.name as subject_name, sec.name as section
            FROM subject_assignments sa
            JOIN subjects sub ON sa.subject_id = sub.id
            JOIN classes c ON sa.class_id = c.id
            LEFT JOIN sections sec ON sa.section_id = sec.id
            WHERE sa.teacher_id = $1
        `, [teacherId]);

        const studentCountResult = await query(`
            SELECT COUNT(DISTINCT e.student_id) as count
            FROM enrollments e
            JOIN subject_assignments sa ON e.class_id = sa.class_id
            WHERE sa.teacher_id = $1 ${academicYearId ? "AND e.academic_year_id = '" + academicYearId + "'" : ''}
        `, [teacherId]);

        const recentNotices = await query('SELECT * FROM notices WHERE is_active = true ORDER BY created_at DESC LIMIT 5');
        const events = await query('SELECT * FROM events ORDER BY start_date ASC LIMIT 5');

        // Today's attendance summary
        const todayAttendance = await query(`
            SELECT status, COUNT(*) as count FROM attendance
            WHERE attendance_date = CURRENT_DATE AND marked_by = $1
            GROUP BY status
        `, [teacherId]);

        res.json({
            stats: {
                totalClasses: classesResult.rows.length,
                totalStudents: parseInt(studentCountResult.rows[0].count),
                todayAttendance: todayAttendance.rows,
            },
            assignedClasses: classesResult.rows,
            recentNotices: recentNotices.rows,
            upcomingEvents: events.rows,
        });
    } catch (error) {
        console.error('Error fetching teacher dashboard stats:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getAssignedStudents = async (req, res) => {
    try {
        const userId = req.user.id;
        const teacherResult = await query("SELECT id FROM staff WHERE user_id = $1 AND staff_type = 'Teaching'", [userId]);
        if (teacherResult.rows.length === 0) return res.status(404).json({ error: 'Teacher profile not found' });

        const teacherId = teacherResult.rows[0].id;
        const { classId } = req.query;

        // Get active academic year
        const ayResult = await query("SELECT id FROM academic_years WHERE is_active = true LIMIT 1");
        const academicYearId = ayResult.rows[0]?.id;

        let sql = `
            SELECT DISTINCT e.student_id as id, s.admission_number, e.roll_number,
                   u.name, u.email, c.name as class_name, sec.name as section, c.id as class_id, e.id as enrollment_id
            FROM enrollments e
            JOIN students s ON e.student_id = s.id
            JOIN users u ON s.user_id = u.id
            JOIN classes c ON e.class_id = c.id
            LEFT JOIN sections sec ON e.section_id = sec.id
            JOIN subject_assignments sa ON sa.class_id = e.class_id
            WHERE sa.teacher_id = $1
        `;
        const params = [teacherId];

        if (academicYearId) {
            params.push(academicYearId);
            sql += ` AND e.academic_year_id = $${params.length}`;
        }
        if (classId) {
            params.push(classId);
            sql += ` AND c.id = $${params.length}`;
        }
        sql += ' ORDER BY c.name, e.roll_number';

        const studentsResult = await query(sql, params);
        res.json({ students: studentsResult.rows });
    } catch (error) {
        console.error('Error fetching assigned students:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const markAttendance = async (req, res) => {
    try {
        const { date, attendance } = req.body; // attendance: [{ student_id, class_id, status }]
        const markedBy = req.user.id;

        // Auto-lock: Teachers can only mark attendance for today
        const today = new Date().toISOString().split('T')[0];
        if (date !== today) {
            return res.status(403).json({
                error: 'Attendance locked',
                message: 'Attendance can only be marked for today\'s date. Past dates are automatically locked. Contact an admin to modify past attendance.'
            });
        }

        // Get staff_id for marked_by
        const staffResult = await query('SELECT id FROM staff WHERE user_id = $1', [markedBy]);
        const staffId = staffResult.rows[0]?.id || null;

        // Get active academic year
        const ayResult = await query("SELECT id FROM academic_years WHERE is_active = true LIMIT 1");
        const academicYearId = ayResult.rows[0]?.id;
        if (!academicYearId) return res.status(400).json({ error: 'No active academic year' });

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

        res.json({ message: 'Attendance saved successfully', count: attendance.length });
    } catch (error) {
        console.error('Error marking attendance:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getAttendanceByDate = async (req, res) => {
    try {
        const { date, classId } = req.query;

        // Get active academic year
        const ayResult = await query("SELECT id FROM academic_years WHERE is_active = true LIMIT 1");
        const academicYearId = ayResult.rows[0]?.id;
        if (!academicYearId) return res.json({ attendance: [] });

        const result = await query(`
            SELECT a.*, u.name as student_name, e.roll_number, e.student_id
            FROM attendance a
            JOIN enrollments e ON a.enrollment_id = e.id
            JOIN students s ON e.student_id = s.id
            JOIN users u ON s.user_id = u.id
            WHERE a.attendance_date = $1 AND e.class_id = $2 AND e.academic_year_id = $3
            ORDER BY e.roll_number
        `, [date, classId, academicYearId]);
        res.json({ attendance: result.rows });
    } catch (error) {
        console.error('Error fetching attendance:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const submitMarks = async (req, res) => {
    try {
        const { exam_id, subject_id, marks } = req.body; // marks: [{ student_id, marks_obtained, remarks }]
        const userId = req.user.id;
        const staffResult = await query('SELECT id FROM staff WHERE user_id = $1', [userId]);
        const staffId = staffResult.rows[0]?.id || null;

        // Get active academic year
        const ayResult = await query("SELECT id FROM academic_years WHERE is_active = true LIMIT 1");
        const academicYearId = ayResult.rows[0]?.id;

        for (const record of marks) {
            const grade = record.marks_obtained >= 90 ? 'A+' :
                record.marks_obtained >= 80 ? 'A' :
                    record.marks_obtained >= 70 ? 'B+' :
                        record.marks_obtained >= 60 ? 'B' :
                            record.marks_obtained >= 50 ? 'C+' :
                                record.marks_obtained >= 40 ? 'C' : 'D';

            // Find enrollment_id for this student
            let enrollmentId = record.enrollment_id;
            if (!enrollmentId && record.student_id && academicYearId) {
                const enrResult = await query(
                    'SELECT id FROM enrollments WHERE student_id = $1 AND academic_year_id = $2 LIMIT 1',
                    [record.student_id, academicYearId]
                );
                enrollmentId = enrResult.rows[0]?.id;
            }
            if (!enrollmentId) continue;

            await query(
                `INSERT INTO exam_marks (exam_id, enrollment_id, subject_id, marks_obtained, total_marks, grade, remarks, entered_by)
                 VALUES ($1, $2, $3, $4, 100, $5, $6, $7)
                 ON CONFLICT (exam_id, enrollment_id, subject_id) DO UPDATE SET marks_obtained = $4, grade = $5, remarks = $6, entered_by = $7`,
                [exam_id, enrollmentId, subject_id, record.marks_obtained, grade, record.remarks || null, staffId]
            );
        }

        res.json({ message: 'Marks submitted successfully' });
    } catch (error) {
        console.error('Error submitting marks:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
