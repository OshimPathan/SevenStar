import { query } from '../db.js';

export const getStudentDashboardStats = async (req, res) => {
    try {
        const userId = req.user.id;
        let studentQuery = 'SELECT * FROM students WHERE user_id = $1';
        if (req.user.role === 'PARENT') {
            studentQuery = 'SELECT * FROM students WHERE parent_user_id = $1';
        }

        const studentResult = await query(studentQuery, [userId]);
        if (studentResult.rows.length === 0) return res.status(404).json({ error: 'Student profile not found' });

        const student = studentResult.rows[0];

        // Get enrollment and class details
        const enrollResult = await query(`
            SELECT e.*, c.name as class_name, sec.name as section_name
            FROM enrollments e
            JOIN classes c ON e.class_id = c.id
            LEFT JOIN sections sec ON e.section_id = sec.id
            JOIN academic_years ay ON e.academic_year_id = ay.id
            WHERE e.student_id = $1 AND ay.is_active = true
            LIMIT 1
        `, [student.id]);
        const enrollment = enrollResult.rows[0];

        const noticesResult = await query(
            'SELECT * FROM notices WHERE is_active = true ORDER BY created_at DESC LIMIT 5'
        );

        // Get fees via enrollment
        let pendingFees = [];
        let paidFees = [];
        if (enrollment) {
            const feesResult = await query("SELECT * FROM student_fees WHERE enrollment_id = $1 AND status != 'Paid' ORDER BY due_date ASC", [enrollment.id]);
            const paidFeesResult = await query("SELECT * FROM student_fees WHERE enrollment_id = $1 AND status = 'Paid' ORDER BY due_date DESC LIMIT 5", [enrollment.id]);
            pendingFees = feesResult.rows;
            paidFees = paidFeesResult.rows;
        }

        // Get attendance summary via enrollment
        let attendanceSummary = [];
        if (enrollment) {
            const attendanceResult = await query(`
                SELECT status, COUNT(*) as count FROM attendance
                WHERE enrollment_id = $1
                GROUP BY status
            `, [enrollment.id]);
            attendanceSummary = attendanceResult.rows;
        }

        const events = await query('SELECT * FROM events ORDER BY start_date ASC LIMIT 5');

        res.json({
            profile: studentResult.rows,
            classDetails: enrollment || null,
            recentNotices: noticesResult.rows,
            pendingFees,
            paidFees,
            attendanceSummary,
            upcomingEvents: events.rows,
        });
    } catch (error) {
        console.error('Error fetching student dashboard stats:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getStudentResults = async (req, res) => {
    try {
        const userId = req.user.id;
        let studentIdQuery = 'SELECT id FROM students WHERE user_id = $1';
        if (req.user.role === 'PARENT') {
            studentIdQuery = 'SELECT id FROM students WHERE parent_user_id = $1';
        }

        const studentResult = await query(studentIdQuery, [userId]);
        if (studentResult.rows.length === 0) return res.status(404).json({ error: 'Student not found' });

        const studentIds = studentResult.rows.map(s => s.id);

        // Get enrollment IDs for these students
        const enrollResult = await query('SELECT id, student_id FROM enrollments WHERE student_id = ANY($1)', [studentIds]);
        const enrollmentIds = enrollResult.rows.map(e => e.id);

        const results = await query(`
            SELECT em.marks_obtained, em.total_marks, em.grade, em.remarks,
                   ex.name as exam_name, ex.start_date,
                   s.name as subject_name
            FROM exam_marks em
            JOIN exams ex ON em.exam_id = ex.id
            JOIN subjects s ON em.subject_id = s.id
            WHERE em.enrollment_id = ANY($1)
            ORDER BY ex.start_date DESC, s.name ASC
        `, [enrollmentIds]);

        res.json({ results: results.rows });
    } catch (error) {
        console.error('Error fetching student results:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getStudentFees = async (req, res) => {
    try {
        const userId = req.user.id;
        let studentIdQuery = 'SELECT id FROM students WHERE user_id = $1';
        if (req.user.role === 'PARENT') {
            studentIdQuery = 'SELECT id FROM students WHERE parent_user_id = $1';
        }

        const studentResult = await query(studentIdQuery, [userId]);
        if (studentResult.rows.length === 0) return res.status(404).json({ error: 'Student not found' });

        const studentId = studentResult.rows[0].id;

        // Get enrollment for this student
        const enrollResult = await query(`
            SELECT e.id FROM enrollments e
            JOIN academic_years ay ON e.academic_year_id = ay.id
            WHERE e.student_id = $1 AND ay.is_active = true LIMIT 1
        `, [studentId]);
        const enrollmentId = enrollResult.rows[0]?.id;

        let pending = { rows: [] };
        let paid = { rows: [] };
        if (enrollmentId) {
            pending = await query("SELECT * FROM student_fees WHERE enrollment_id = $1 AND status != 'Paid' ORDER BY due_date ASC", [enrollmentId]);
            paid = await query("SELECT * FROM student_fees WHERE enrollment_id = $1 AND status = 'Paid' ORDER BY due_date DESC", [enrollmentId]);
        }

        res.json({ pending: pending.rows, history: paid.rows });
    } catch (error) {
        console.error('Error fetching student fees:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getStudentNotices = async (req, res) => {
    try {
        const result = await query(
            'SELECT * FROM notices WHERE is_active = true ORDER BY created_at DESC'
        );
        res.json({ notices: result.rows });
    } catch (error) {
        console.error('Error fetching student notices:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
