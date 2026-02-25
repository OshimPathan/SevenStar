import React, { useState, useEffect } from 'react';
import { Plus, Search, Calendar, FileText, CheckCircle2, X, Trash2, Edit2, Users, Upload, Download, Eye, Save, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getTeacherAssignments, createAssignment, updateAssignment, deleteAssignment, getAssignmentSubmissions, gradeSubmission, getTeacherClasses, getTeacherSubjectsForClass } from '../../api';

const TeacherAssignments = () => {
    const { user } = useAuth();
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [form, setForm] = useState({ title: '', description: '', class_id: '', section_id: '', subject_id: '', due_date: '', total_points: 100 });
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');

    useEffect(() => {
        fetchAssignments();
        fetchClasses();
    }, [user]);

    const fetchAssignments = async () => {
        try {
            const data = await getTeacherAssignments(user.teacher_id);
            setAssignments(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchClasses = async () => {
        try {
            const data = await getTeacherClasses(user.teacher_id);
            setClasses(data.classes || []);
        } catch (error) {
            console.error(error);
        }
    };

    const handleClassChange = async (classId) => {
        setForm({ ...form, class_id: classId, subject_id: '', section_id: '' });
        const selectedClassObj = classes.find(c => c.id === classId);
        const secs = selectedClassObj?.sectionsList || [{ id: 'default', name: 'A' }];
        setSections(secs);
        if (secs.length > 0) setForm(f => ({ ...f, section_id: secs[0].id }));
        try {
            const subs = await getTeacherSubjectsForClass(user.teacher_id, classId);
            setSubjects(subs);
        } catch (error) {
            console.error(error);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const sectionId = form.section_id || sections[0]?.id;
            if (!sectionId) throw new Error('No section found for this class');

            await createAssignment({ ...form, teacher_id: user.teacher_id, section_id: sectionId });
            setToast({ message: 'Assignment created successfully', type: 'success' });
            setShowCreateModal(false);
            fetchAssignments();
            setForm({ title: '', description: '', class_id: '', section_id: '', subject_id: '', due_date: '', total_points: 100 });
        } catch (error) {
            setToast({ message: error.message, type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this assignment?')) return;
        try {
            await deleteAssignment(id);
            setToast({ message: 'Assignment deleted', type: 'success' });
            fetchAssignments();
        } catch (error) {
            setToast({ message: error.message, type: 'error' });
        }
    };

    const openSubmissions = async (assignment) => {
        setSelectedAssignment(assignment);
        setShowSubmissionsModal(true);
        setSubmissions([]); // Clear previous
        try {
            const data = await getAssignmentSubmissions(assignment.id);
            setSubmissions(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleGrade = async (submission, grade, feedback) => {
        try {
            await gradeSubmission(submission.submission_id, submission.enrollment_id, selectedAssignment.id, grade, feedback);
            setSubmissions(prev => prev.map(s => s.enrollment_id === submission.enrollment_id ? { ...s, grade, feedback, status: 'Graded', submission_id: s.submission_id || 'temp' } : s));
        } catch (error) {
            console.error(error);
        }
    };

    const exportGrades = () => {
        if (!submissions.length) return;
        const csvContent = [
            ['Student Name', 'Roll Number', 'Status', 'Submission Date', 'Grade', 'Feedback'],
            ...submissions.map(s => [
                s.name,
                s.roll_number,
                s.status,
                s.submission_date ? new Date(s.submission_date).toLocaleDateString() : '-',
                s.grade || '-',
                s.feedback || '-'
            ])
        ].map(e => e.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedAssignment.title}_grades.csv`;
        a.click();
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            {toast && (
                <div className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                    {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                    {toast.message}
                    <button onClick={() => setToast(null)} className="ml-2"><X className="w-4 h-4" /></button>
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage class assignments and grading</p>
                </div>
                <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Create Assignment
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12">Loading...</div>
            ) : (
                <>
                    {/* Search & Filter */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search assignments..." className="w-full sm:w-72 pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                        </div>
                        <div className="flex gap-2">
                            {['ALL', 'Active', 'Past Due'].map(status => (
                                <button key={status} onClick={() => setFilterStatus(status)} className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${filterStatus === status ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {assignments
                            .filter(a => {
                                const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase());
                                const isPastDue = new Date(a.due_date) < new Date();
                                const matchStatus = filterStatus === 'ALL' || (filterStatus === 'Active' && !isPastDue) || (filterStatus === 'Past Due' && isPastDue);
                                return matchSearch && matchStatus;
                            })
                            .map(assignment => {
                                const isPastDue = new Date(assignment.due_date) < new Date();
                                return (
                                    <div key={assignment.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="font-bold text-gray-900 line-clamp-1">{assignment.title}</h3>
                                                <p className="text-xs text-gray-500 mt-1">{assignment.classes?.name} • {assignment.subjects?.name}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${isPastDue ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                    {isPastDue ? 'Past Due' : 'Active'}
                                                </span>
                                                <button onClick={() => handleDelete(assignment.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-600 line-clamp-2 mb-4 h-10">{assignment.description}</p>
                                        <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-50 pt-3">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5" />
                                                Due: {new Date(assignment.due_date).toLocaleDateString()}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <FileText className="w-3.5 h-3.5" />
                                                {assignment.total_points} pts
                                            </div>
                                        </div>
                                        <button onClick={() => openSubmissions(assignment)} className="w-full mt-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
                                            <Users className="w-4 h-4" /> View Submissions
                                        </button>
                                    </div>
                                );
                            })}
                        {assignments.length === 0 && (
                            <div className="col-span-full text-center py-12 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
                                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p>No assignments created yet</p>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-900">Create Assignment</h3>
                            <button onClick={() => setShowCreateModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input type="text" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                                    <select required value={form.class_id} onChange={e => handleClassChange(e.target.value)} className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
                                        <option value="">Select Class</option>
                                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                                    <select required value={form.section_id} onChange={e => setForm({ ...form, section_id: e.target.value })} className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
                                        {sections.length === 0 && <option value="">Select a class first</option>}
                                        {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                <select required value={form.subject_id} onChange={e => setForm({ ...form, subject_id: e.target.value })} className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
                                    <option value="">Select Subject</option>
                                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea rows="3" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"></textarea>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                                    <input type="date" required value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Points</label>
                                    <input type="number" required value={form.total_points} onChange={e => setForm({ ...form, total_points: e.target.value })} className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                                </div>
                            </div>
                            <button type="submit" disabled={saving} className="w-full btn-primary py-2.5 mt-2">
                                {saving ? 'Creating...' : 'Create Assignment'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Submissions Modal */}
            {showSubmissionsModal && selectedAssignment && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">{selectedAssignment.title}</h3>
                                <p className="text-sm text-gray-500">Submissions & Grading</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={exportGrades} className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2 transition-colors">
                                    <Download className="w-4 h-4" /> Export CSV
                                </button>
                                <button onClick={() => setShowSubmissionsModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                                    <tr>
                                        <th className="px-4 py-3">Student</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">File</th>
                                        <th className="px-4 py-3 w-24">Grade</th>
                                        <th className="px-4 py-3">Feedback</th>
                                        <th className="px-4 py-3 w-10">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {submissions.map(sub => (
                                        <tr key={sub.enrollment_id} className="hover:bg-gray-50/50">
                                            <td className="px-4 py-3">
                                                <p className="text-sm font-medium text-gray-900">{sub.name}</p>
                                                <p className="text-xs text-gray-500">Roll: {sub.roll_number}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`text-xs px-2 py-1 rounded-full font-bold ${sub.status === 'Submitted' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {sub.status}
                                                </span>
                                                {sub.submission_date && <p className="text-[10px] text-gray-400 mt-1">{new Date(sub.submission_date).toLocaleDateString()}</p>}
                                            </td>
                                            <td className="px-4 py-3">
                                                {sub.file_url ? (
                                                    <a href={sub.file_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm flex items-center gap-1">
                                                        <FileText className="w-3.5 h-3.5" /> View
                                                    </a>
                                                ) : <span className="text-xs text-gray-400">-</span>}
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    max={selectedAssignment.total_points}
                                                    defaultValue={sub.grade}
                                                    onBlur={(e) => handleGrade(sub, e.target.value, sub.feedback)}
                                                    className="w-16 px-2 py-1 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="text"
                                                    defaultValue={sub.feedback}
                                                    onBlur={(e) => handleGrade(sub, sub.grade, e.target.value)}
                                                    placeholder="Feedback..."
                                                    className="w-full px-2 py-1 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button className="text-primary hover:bg-primary/10 p-1.5 rounded-lg"><Save className="w-4 h-4" /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherAssignments;
