import React, { useState, useEffect } from 'react';
import { Plus, X, Trash2, Eye, FileText, Calendar, Users, Loader2, Search, AlertCircle, CheckCircle, BookOpen, ClipboardCheck, Award, ChevronDown, Download, Clock, MapPin, Save, ToggleLeft, ToggleRight, Globe, Edit3, ShieldCheck, ShieldX, CheckCheck, XCircle, BadgeCheck, Hash } from 'lucide-react';
import { getExams, createExam, deleteExam, publishResults, getAllClasses, getResultsForClassExam, getSubjectsByClass, getExamRoutines, saveBulkExamRoutines, toggleExamPublished, updateExam, verifyStudentMarks, unverifyStudentMarks, verifyAllMarksForExam, getVerificationSummary, createTermExamsForAllClasses } from '../../api';
import { generateReportCard } from '../../utils/generateReportCard';
import { useAuth } from '../../context/AuthContext';
import FormField from '../../components/FormField';

const examTypeConfig = {
    'First Terminal': { color: 'bg-blue-50 text-blue-600 border-blue-200', label: '1st Term' },
    'Second Terminal': { color: 'bg-indigo-50 text-indigo-600 border-indigo-200', label: '2nd Term' },
    'Third Terminal': { color: 'bg-violet-50 text-violet-600 border-violet-200', label: '3rd Term' },
    'Final': { color: 'bg-red-50 text-red-600 border-red-200', label: 'Final' },
    'Weekly Test': { color: 'bg-teal-50 text-teal-600 border-teal-200', label: 'Weekly' },
    'Unit Test': { color: 'bg-cyan-50 text-cyan-600 border-cyan-200', label: 'Unit' },
    'Mid-term': { color: 'bg-amber-50 text-amber-600 border-amber-200', label: 'Mid' },
    'Pre-board': { color: 'bg-orange-50 text-orange-600 border-orange-200', label: 'Pre-board' },
};

const AdminExams = () => {
    const { user } = useAuth();
    const [exams, setExams] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [search, setSearch] = useState('');
    const [filterClass, setFilterClass] = useState('');
    const [filterType, setFilterType] = useState('');
    const [viewExam, setViewExam] = useState(null);
    const [viewData, setViewData] = useState(null);
    const [viewLoading, setViewLoading] = useState(false);
    const [viewSubjects, setViewSubjects] = useState([]);
    const [scheduleExam, setScheduleExam] = useState(null);
    const [scheduleClassId, setScheduleClassId] = useState('');
    const [scheduleSubjects, setScheduleSubjects] = useState([]);
    const [scheduleRoutines, setScheduleRoutines] = useState([]);
    const [scheduleLoading, setScheduleLoading] = useState(false);
    const [scheduleSaving, setScheduleSaving] = useState(false);
    const [editingExam, setEditingExam] = useState(null);
    const [verificationSummaries, setVerificationSummaries] = useState({});
    const [verifyingStudent, setVerifyingStudent] = useState(null);
    const [viewTab, setViewTab] = useState('results');
    const [viewClassId, setViewClassId] = useState('');

    const [form, setForm] = useState({
        name: '', exam_type: 'First Terminal', full_marks: 100, pass_marks: 40, start_date: '', end_date: '', allClasses: true, selectedClassIds: [],
    });

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const fetchData = async () => {
        try {
            const [examRes, classRes] = await Promise.all([getExams(), getAllClasses()]);
            const loadedExams = examRes.exams || [];
            setExams(loadedExams);
            setClasses(classRes.classes || []);
            const summaries = {};
            await Promise.all(loadedExams.map(async (exam) => {
                try {
                    const summary = await getVerificationSummary(exam.id);
                    summaries[exam.id] = summary;
                } catch { /* ignore */ }
            }));
            setVerificationSummaries(summaries);
        } catch (err) {
            showToast(err.message, 'error');
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const classMap = Object.fromEntries(classes.map(c => [c.id, c]));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingExam) {
                await updateExam(editingExam.id, {
                    name: form.name, exam_type: form.exam_type,
                    full_marks: form.full_marks, pass_marks: form.pass_marks,
                    start_date: form.start_date, end_date: form.end_date || null,
                });
                showToast('Exam updated successfully');
            } else {
                const classIds = form.allClasses ? classes.map(c => c.id) : form.selectedClassIds;
                if (classIds.length === 0) { showToast('Select at least one class', 'error'); setSaving(false); return; }
                await createExam({ ...form, classIds });
                showToast('Exam created for ' + classIds.length + ' class(es)');
            }
            setShowModal(false);
            setEditingExam(null);
            setForm({ name: '', exam_type: 'First Terminal', full_marks: 100, pass_marks: 40, start_date: '', end_date: '', allClasses: true, selectedClassIds: [] });
            await fetchData();
        } catch (err) { showToast(err.message, 'error'); }
        finally { setSaving(false); }
    };

    const openEditExam = (exam) => {
        setEditingExam(exam);
        setForm({
            name: exam.name || '', exam_type: exam.exam_type || 'First Terminal',
            full_marks: exam.full_marks || 100, pass_marks: exam.pass_marks || 40,
            start_date: exam.start_date || '', end_date: exam.end_date || '',
            allClasses: true, selectedClassIds: exam.class_ids || [],
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this exam and all its results permanently?')) return;
        try {
            await deleteExam(id);
            showToast('Exam deleted');
            await fetchData();
        } catch (err) { showToast(err.message, 'error'); }
    };

    const handlePublish = async (examId) => {
        try {
            const res = await publishResults(examId, user.id);
            showToast(`Results published for ${res.count} entries. Now visible to students.`);
            await fetchData();
        } catch (err) { showToast(err.message, 'error'); }
    };

    const handleTogglePublished = async (exam) => {
        const newState = !exam.published;
        try {
            await toggleExamPublished(exam.id, newState);
            setExams(prev => prev.map(e => e.id === exam.id ? { ...e, published: newState } : e));
            showToast(newState ? 'Exam published — visible on public schedule' : 'Exam unpublished — hidden from public');
        } catch (err) { showToast(err.message, 'error'); }
    };

    const handleOpenSchedule = async (exam) => {
        setScheduleExam(exam);
        setScheduleClassId('');
        setScheduleSubjects([]);
        setScheduleRoutines([]);
        setScheduleLoading(false);
    };

    const handleScheduleClassChange = async (classId) => {
        setScheduleClassId(classId);
        if (!classId || !scheduleExam) { setScheduleSubjects([]); setScheduleRoutines([]); return; }
        setScheduleLoading(true);
        try {
            const [subRes, routineRes] = await Promise.all([
                getSubjectsByClass(classId), getExamRoutines(scheduleExam.id, classId),
            ]);
            const subjects = subRes.subjects || [];
            setScheduleSubjects(subjects);
            const routineMap = Object.fromEntries((routineRes || []).map(r => [r.subject_id, r]));
            setScheduleRoutines(subjects.map(s => {
                const existing = routineMap[s.id];
                return {
                    subject_id: s.id, subject_name: s.name,
                    exam_date: existing?.exam_date || '', start_time: existing?.start_time?.slice(0, 5) || '',
                    end_time: existing?.end_time?.slice(0, 5) || '', room: existing?.room || '',
                    full_marks: existing?.full_marks || scheduleExam.full_marks || 100,
                    pass_marks: existing?.pass_marks || scheduleExam.pass_marks || 40,
                };
            }));
        } catch (err) { showToast(err.message, 'error'); }
        finally { setScheduleLoading(false); }
    };

    const handleScheduleChange = (idx, field, value) => {
        setScheduleRoutines(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
    };

    const handleSaveSchedule = async () => {
        if (!scheduleExam || !scheduleClassId) { showToast('Please select a class first', 'error'); return; }
        setScheduleSaving(true);
        try {
            const routines = scheduleRoutines.filter(r => r.exam_date).map(r => ({
                subject_id: r.subject_id, exam_date: r.exam_date,
                start_time: r.start_time || null, end_time: r.end_time || null,
                room: r.room || null, full_marks: r.full_marks || null, pass_marks: r.pass_marks || null,
            }));
            if (routines.length === 0) {
                showToast('Please fill in at least one exam date', 'error');
                setScheduleSaving(false);
                return;
            }
            await saveBulkExamRoutines(scheduleExam.id, routines, scheduleClassId);
            showToast(`Schedule saved for ${classMap[scheduleClassId]?.name || 'class'}`);
        } catch (err) { showToast(err.message, 'error'); }
        finally { setScheduleSaving(false); }
    };

    const handleViewResults = async (exam) => {
        setViewExam(exam);
        setViewClassId('');
        setViewData(null);
        setViewSubjects([]);
        setViewLoading(false);
        setViewTab('results');
    };

    const handleViewClassChange = async (classId) => {
        setViewClassId(classId);
        if (!classId || !viewExam) { setViewData(null); setViewSubjects([]); return; }
        setViewLoading(true);
        try {
            const [resultData, subjectRes] = await Promise.all([
                getResultsForClassExam(viewExam.id, classId),
                getSubjectsByClass(classId),
            ]);
            setViewData(resultData);
            setViewSubjects(subjectRes.subjects || []);
        } catch (err) { showToast(err.message, 'error'); }
        finally { setViewLoading(false); }
    };

    // ======= VERIFICATION HANDLERS =======
    const handleVerifyStudent = async (examId, studentId) => {
        setVerifyingStudent(studentId);
        try {
            await verifyStudentMarks(examId, studentId, user?.id);
            showToast('Student marks verified');
            const summary = await getVerificationSummary(examId);
            setVerificationSummaries(prev => ({ ...prev, [examId]: summary }));
        } catch (err) { showToast(err.message, 'error'); }
        finally { setVerifyingStudent(null); }
    };

    const handleUnverifyStudent = async (examId, studentId) => {
        setVerifyingStudent(studentId);
        try {
            await unverifyStudentMarks(examId, studentId);
            showToast('Verification removed');
            const summary = await getVerificationSummary(examId);
            setVerificationSummaries(prev => ({ ...prev, [examId]: summary }));
        } catch (err) { showToast(err.message, 'error'); }
        finally { setVerifyingStudent(null); }
    };

    const handleVerifyAll = async (examId) => {
        if (!confirm('Verify all student marks for this exam?')) return;
        try {
            await verifyAllMarksForExam(examId, user?.id);
            showToast('All marks verified successfully');
            const summary = await getVerificationSummary(examId);
            setVerificationSummaries(prev => ({ ...prev, [examId]: summary }));
        } catch (err) { showToast(err.message, 'error'); }
    };

    const filtered = exams.filter(e => {
        if (filterClass && !(e.class_ids || []).includes(filterClass) && e.class_id !== filterClass) return false;
        if (filterType && e.exam_type !== filterType) return false;
        if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

    const gradeToGPA = (grade) => {
        const map = { 'A+': 4.0, 'A': 3.6, 'B+': 3.2, 'B': 2.8, 'C+': 2.4, 'C': 2.0, 'D': 1.6, 'E': 0.8 };
        return map[grade] || 0;
    };

    const handleDownloadStudentReport = (student) => {
        if (!viewExam || !viewData || !viewSubjects.length) return;
        const studentResults = viewData.results.filter(r => r.student_id === student.id);
        const cls = classMap[viewClassId];
        const className = cls ? `${cls.name} ${cls.section || ''}`.trim() : '';

        const subjects = viewSubjects.map(sub => {
            const r = studentResults.find(r => r.subject_id === sub.id);
            const th = r ? (parseFloat(r.marks_obtained) ?? 0) : 0;
            const pr = null;
            const total = r ? (parseFloat(r.marks_obtained) || 0) : 0;
            const full = r ? (parseFloat(r.full_marks) || 100) : (viewExam.full_marks || 100);
            const grade = r?.grade || '—';
            return { name: sub.name, th, pr, total, full, grade, gpa: gradeToGPA(grade) };
        });

        generateReportCard({
            studentName: student.name, className, rollNumber: student.roll_number || '',
            examName: viewExam.name, examDate: formatDate(viewExam.start_date), examType: viewExam.exam_type || '',
            subjects,
        });
    };

    const handleDownloadAllReports = () => {
        if (!viewExam || !viewData || !viewSubjects.length) return;
        viewData.students.forEach(student => {
            const studentResults = viewData.results.filter(r => r.student_id === student.id);
            if (studentResults.length === 0) return;
            handleDownloadStudentReport(student);
        });
        showToast(`Downloading report cards for ${viewData.students.length} students`);
    };

    const getStudentVerificationStatus = (studentId) => {
        if (!viewData) return { allVerified: true, count: 0, verified: 0 };
        const studentResults = viewData.results.filter(r => r.student_id === studentId);
        // All marks are considered verified (no verified column in DB)
        return {
            allVerified: true,
            count: studentResults.length, verified: studentResults.length,
        };
    };

    const getViewVerificationSummary = () => {
        if (!viewData?.results?.length) return { total: 0, verified: 0, unverified: 0, allVerified: true };
        const total = viewData.results.length;
        // All marks are considered verified (no verified column in DB)
        return { total, verified: total, unverified: 0, allVerified: true };
    };

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6 animate-fade-in-up">
            {toast && (
                <div className={`fixed top-4 right-4 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                    {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    {toast.message}
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 font-serif">Exam Management</h1>
                    <p className="text-sm text-gray-500 mt-1">{exams.length} exam{exams.length !== 1 ? 's' : ''} total — Create terminals, tests & manage results</p>
                </div>
                <button onClick={() => { setEditingExam(null); setForm({ name: '', exam_type: 'First Terminal', full_marks: 100, pass_marks: 40, start_date: '', end_date: '', allClasses: true, selectedClassIds: [] }); setShowModal(true); }} className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm">
                    <Plus className="w-4 h-4" /> Create Exam
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" placeholder="Search exams..." value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                </div>
                <div className="relative">
                    <select value={filterClass} onChange={e => setFilterClass(e.target.value)}
                        className="appearance-none pl-4 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
                        <option value="">All Classes</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.section || ''}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                <div className="relative">
                    <select value={filterType} onChange={e => setFilterType(e.target.value)}
                        className="appearance-none pl-4 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
                        <option value="">All Types</option>
                        {Object.keys(examTypeConfig).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                <button
                    onClick={async () => {
                        try {
                            await createTermExamsForAllClasses();
                            showToast('Created term exams for all classes');
                            await fetchData();
                        } catch (e) { showToast(e.message, 'error'); }
                    }}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                >
                    Create Term Exams (All)
                </button>
            </div>

            {/* Exam Cards */}
            {filtered.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-gray-500 font-medium">No exams found</h3>
                    <p className="text-gray-400 text-sm mt-1">Create your first exam to get started</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filtered.map(exam => {
                        const linkedClasses = (exam.class_ids || []).map(id => classMap[id]).filter(Boolean);
                        const classLabel = linkedClasses.length === classes.length ? 'All Classes' : linkedClasses.length > 3 ? `${linkedClasses.length} Classes` : linkedClasses.map(c => c.name).join(', ');
                        const typeConf = examTypeConfig[exam.exam_type] || examTypeConfig['Unit Test'];
                        const vSummary = verificationSummaries[exam.id];
                        const hasResults = vSummary && vSummary.total > 0;
                        const allVerified = hasResults && vSummary.verified === vSummary.total;

                        return (
                            <div key={exam.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-all group">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                            <ClipboardCheck className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-bold text-gray-900">{exam.name}</h3>
                                                {exam.results_published && (
                                                    <span className="flex items-center gap-1 text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                                                        <BadgeCheck className="w-3 h-3" /> Results Published
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${typeConf?.color || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                                    {exam.exam_type || 'Exam'}
                                                </span>
                                                {classLabel && (
                                                    <span className="flex items-center gap-1 text-xs text-gray-500">
                                                        <BookOpen className="w-3 h-3" /> {classLabel}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1 text-xs text-gray-400">
                                                    <Calendar className="w-3 h-3" /> {formatDate(exam.start_date)}
                                                    {exam.end_date && exam.end_date !== exam.start_date ? ` — ${formatDate(exam.end_date)}` : ''}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                                                {exam.full_marks && <span>Full: <span className="font-semibold text-gray-600">{exam.full_marks}</span></span>}
                                                {exam.pass_marks && <span>Pass: <span className="font-semibold text-gray-600">{exam.pass_marks}</span></span>}
                                                {hasResults && (
                                                    <span className={`flex items-center gap-1 ${allVerified ? 'text-green-600' : 'text-amber-600'}`}>
                                                        {allVerified ? <ShieldCheck className="w-3 h-3" /> : <ShieldX className="w-3 h-3" />}
                                                        {vSummary.verified}/{vSummary.total} verified
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                                        <button onClick={() => openEditExam(exam)}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors">
                                            <Edit3 className="w-3.5 h-3.5" /> Edit
                                        </button>
                                        <button onClick={() => handleOpenSchedule(exam)}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 transition-colors">
                                            <Clock className="w-3.5 h-3.5" /> Routine
                                        </button>
                                        <button onClick={() => handleViewResults(exam)}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors">
                                            <Eye className="w-3.5 h-3.5" /> Results & Verify
                                        </button>
                                        {hasResults && allVerified && !exam.results_published && (
                                            <button onClick={() => handlePublish(exam.id)}
                                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 transition-colors animate-pulse">
                                                <Award className="w-3.5 h-3.5" /> Publish Results
                                            </button>
                                        )}
                                        {hasResults && !allVerified && (
                                            <span className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-amber-600 bg-amber-50 cursor-default">
                                                <ShieldX className="w-3.5 h-3.5" /> Verify First
                                            </span>
                                        )}
                                        <button onClick={() => handleTogglePublished(exam)}
                                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${exam.published ? 'text-amber-600 bg-amber-50 hover:bg-amber-100' : 'text-gray-500 bg-gray-50 hover:bg-gray-100'}`}
                                            title={exam.published ? 'Unpublish from public schedule' : 'Publish to public schedule'}>
                                            {exam.published ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                                            {exam.published ? 'Public' : 'Private'}
                                        </button>
                                        <button onClick={() => handleDelete(exam.id)}
                                            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ====== CREATE / EDIT EXAM MODAL ====== */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in-up">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900 font-serif">{editingExam ? 'Edit Exam' : 'Create New Exam'}</h2>
                            <button onClick={() => { setShowModal(false); setEditingExam(null); }} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <FormField label="Exam Name" name="name" required icon={ClipboardCheck}
                                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                placeholder="e.g. First Terminal Exam 2082"
                                helper="Descriptive name for the exam" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField label="Exam Type" name="exam_type" type="select" required
                                    value={form.exam_type} onChange={e => setForm({ ...form, exam_type: e.target.value })}
                                    helper="Category of this examination"
                                    options={Object.keys(examTypeConfig).map(t => ({ value: t, label: t }))} />
                                <div />
                            </div>
                            {!editingExam && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Classes</label>
                                    <label className="flex items-center gap-2 mb-2 cursor-pointer">
                                        <input type="checkbox" checked={form.allClasses}
                                            onChange={e => setForm({ ...form, allClasses: e.target.checked, selectedClassIds: e.target.checked ? [] : form.selectedClassIds })}
                                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/20" />
                                        <span className="text-sm font-medium text-gray-700">All Classes ({classes.length})</span>
                                    </label>
                                    {!form.allClasses && (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-40 overflow-y-auto border border-gray-200 rounded-xl p-3">
                                            {classes.map(c => (
                                                <label key={c.id} className="flex items-center gap-1.5 text-xs cursor-pointer hover:bg-gray-50 rounded px-1 py-0.5">
                                                    <input type="checkbox" checked={form.selectedClassIds.includes(c.id)}
                                                        onChange={e => {
                                                            const ids = e.target.checked ? [...form.selectedClassIds, c.id] : form.selectedClassIds.filter(id => id !== c.id);
                                                            setForm({ ...form, selectedClassIds: ids });
                                                        }}
                                                        className="w-3.5 h-3.5 rounded border-gray-300 text-primary focus:ring-primary/20" />
                                                    <span className="text-gray-700">{c.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField label="Full Marks" name="full_marks" type="number" icon={Hash}
                                    value={form.full_marks} onChange={e => setForm({ ...form, full_marks: e.target.value })}
                                    min={1} helper="Maximum marks achievable" />
                                <FormField label="Pass Marks" name="pass_marks" type="number" icon={Hash}
                                    value={form.pass_marks} onChange={e => setForm({ ...form, pass_marks: e.target.value })}
                                    min={1} helper="Minimum marks to pass"
                                    error={form.pass_marks && form.full_marks && parseInt(form.pass_marks) > parseInt(form.full_marks) ? 'Must be ≤ full marks' : ''} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField label="Start Date" name="start_date" type="date" required icon={Calendar}
                                    value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })}
                                    helper="First day of the exam" />
                                <FormField label="End Date" name="end_date" type="date" icon={Calendar}
                                    value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })}
                                    helper="Last day (leave blank for single-day)"
                                    min={form.start_date || undefined} />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => { setShowModal(false); setEditingExam(null); }}
                                    className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Cancel</button>
                                <button type="submit" disabled={saving}
                                    className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2">
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    {saving ? 'Saving...' : editingExam ? 'Save Changes' : 'Create Exam'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ====== VIEW RESULTS & VERIFY MODAL ====== */}
            {viewExam && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col animate-fade-in-up">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                            <div className="flex items-center gap-4">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 font-serif">{viewExam.name}</h2>
                                    <p className="text-xs text-gray-500 mt-0.5">{viewExam.exam_type || 'Exam'} &bull; {formatDate(viewExam.start_date)}</p>
                                </div>
                                <select value={viewClassId} onChange={e => handleViewClassChange(e.target.value)}
                                    className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
                                    <option value="">— Select Class —</option>
                                    {(viewExam.class_ids || []).map(cid => {
                                        const c = classMap[cid];
                                        return c ? <option key={cid} value={cid}>{c.name} {c.section || ''}</option> : null;
                                    })}
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                {(() => {
                                    const vs = getViewVerificationSummary();
                                    if (vs.total === 0) return null;
                                    return (
                                        <span className={`text-xs px-3 py-1.5 rounded-full font-bold ${vs.allVerified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {vs.allVerified ? <><CheckCheck className="w-3 h-3 inline mr-1" />All Verified</> : <>{vs.verified}/{vs.total} Verified</>}
                                        </span>
                                    );
                                })()}
                                <button onClick={() => { setViewExam(null); setViewData(null); }} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex items-center border-b border-gray-100 px-6 shrink-0">
                            <button onClick={() => setViewTab('results')}
                                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${viewTab === 'results' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                                <Eye className="w-4 h-4 inline mr-1.5" />Results & Marks
                            </button>
                            <button onClick={() => setViewTab('verify')}
                                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${viewTab === 'verify' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                                <ShieldCheck className="w-4 h-4 inline mr-1.5" />Verify & Publish
                            </button>
                        </div>

                        <div className="flex-1 overflow-auto p-6">
                            {!viewClassId ? (
                                <div className="text-center py-16">
                                    <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500 font-medium">Select a class to view results</p>
                                    <p className="text-gray-400 text-xs mt-1">Choose from the dropdown above</p>
                                </div>
                            ) : viewLoading ? (
                                <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                            ) : !viewData || viewData.students.length === 0 ? (
                                <div className="text-center py-12">
                                    <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                    <p className="text-gray-500 text-sm">No students in this class</p>
                                </div>
                            ) : viewData.results.length === 0 ? (
                                <div className="text-center py-12">
                                    <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                    <p className="text-gray-500 text-sm">No marks entered yet for this exam</p>
                                    <p className="text-gray-400 text-xs mt-1">Teachers can enter marks from Exams & Marks page</p>
                                </div>
                            ) : viewTab === 'results' ? (
                                /* ====== RESULTS TAB ====== */
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-gray-50">
                                                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Student</th>
                                                {viewSubjects.map(sub => (
                                                    <th key={sub.id} className="text-center py-3 px-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">{sub.name}</th>
                                                ))}
                                                <th className="text-center py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Total</th>
                                                <th className="text-center py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">%</th>
                                                <th className="text-center py-3 px-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Status</th>
                                                <th className="text-center py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Report</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {viewData.students.map(student => {
                                                const studentResults = viewData.results.filter(r => r.student_id === student.id);
                                                const totalObtained = studentResults.reduce((sum, r) => sum + (parseFloat(r.marks_obtained) || 0), 0);
                                                const totalFull = studentResults.reduce((sum, r) => sum + (parseFloat(r.full_marks) || 100), 0);
                                                const pct = totalFull > 0 ? ((totalObtained / totalFull) * 100).toFixed(1) : '—';
                                                const vStatus = getStudentVerificationStatus(student.id);
                                                return (
                                                    <tr key={student.id} className="hover:bg-gray-50">
                                                        <td className="py-3 px-4">
                                                            <div className="font-medium text-gray-800">{student.name}</div>
                                                            <div className="text-xs text-gray-400">Roll #{student.roll_number}</div>
                                                        </td>
                                                        {viewSubjects.map(sub => {
                                                            const r = studentResults.find(r => r.subject_id === sub.id);
                                                            return (
                                                                <td key={sub.id} className="text-center py-3 px-3">
                                                                    {r ? (
                                                                        <span className={`font-medium ${parseFloat(r.marks_obtained) < (viewExam.pass_marks || 40) ? 'text-red-600' : 'text-gray-800'}`}>
                                                                            {r.marks_obtained}
                                                                        </span>
                                                                    ) : <span className="text-gray-300">—</span>}
                                                                </td>
                                                            );
                                                        })}
                                                        <td className="text-center py-3 px-4 font-bold text-gray-900">{totalObtained || '—'}</td>
                                                        <td className="text-center py-3 px-4">
                                                            {pct !== '—' ? (
                                                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${parseFloat(pct) >= 80 ? 'bg-green-50 text-green-700' : parseFloat(pct) >= 50 ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'}`}>
                                                                    {pct}%
                                                                </span>
                                                            ) : '—'}
                                                        </td>
                                                        <td className="text-center py-3 px-3">
                                                            {vStatus.count > 0 ? (
                                                                vStatus.allVerified ? (
                                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-700">
                                                                        <ShieldCheck className="w-3 h-3" /> Verified
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                                                                        <ShieldX className="w-3 h-3" /> Pending
                                                                    </span>
                                                                )
                                                            ) : <span className="text-gray-300 text-xs">—</span>}
                                                        </td>
                                                        <td className="text-center py-3 px-4">
                                                            {studentResults.length > 0 && (
                                                                <button onClick={() => handleDownloadStudentReport(student)}
                                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
                                                                    title="Download Report Card">
                                                                    <Download className="w-3.5 h-3.5" /> PDF
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                    <div className="flex justify-end mt-4">
                                        <button onClick={handleDownloadAllReports}
                                            className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-sm font-medium transition-colors">
                                            <Download className="w-4 h-4" /> Download All Report Cards
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* ====== VERIFY & PUBLISH TAB ====== */
                                <div className="space-y-6">
                                    {(() => {
                                        const vs = getViewVerificationSummary();
                                        return (
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                                                    <p className="text-2xl font-bold text-gray-900">{vs.total}</p>
                                                    <p className="text-xs text-gray-400 font-medium mt-1">Total Marks</p>
                                                </div>
                                                <div className="bg-green-50 rounded-xl border border-green-100 p-4 text-center">
                                                    <p className="text-2xl font-bold text-green-700">{vs.verified}</p>
                                                    <p className="text-xs text-green-600 font-medium mt-1">Verified</p>
                                                </div>
                                                <div className="bg-amber-50 rounded-xl border border-amber-100 p-4 text-center">
                                                    <p className="text-2xl font-bold text-amber-700">{vs.unverified}</p>
                                                    <p className="text-xs text-amber-600 font-medium mt-1">Pending</p>
                                                </div>
                                                <div className={`rounded-xl border p-4 text-center ${vs.allVerified ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'}`}>
                                                    <p className={`text-2xl font-bold ${vs.allVerified ? 'text-green-700' : 'text-gray-400'}`}>
                                                        {vs.allVerified ? 'Ready' : 'Not Ready'}
                                                    </p>
                                                    <p className="text-xs text-gray-500 font-medium mt-1">Publish Status</p>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-50 rounded-xl">
                                        <button onClick={() => handleVerifyAll(viewExam.id)}
                                            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold transition-colors">
                                            <CheckCheck className="w-4 h-4" /> Verify All Marks
                                        </button>
                                        {getViewVerificationSummary().allVerified && !viewExam.results_published && (
                                            <button onClick={() => { handlePublish(viewExam.id); setViewExam(null); setViewData(null); }}
                                                className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-bold transition-colors">
                                                <Award className="w-4 h-4" /> Publish Results to Students
                                            </button>
                                        )}
                                        {viewExam.results_published && (
                                            <span className="flex items-center gap-2 px-4 py-2.5 bg-green-100 text-green-700 rounded-xl text-sm font-bold">
                                                <BadgeCheck className="w-4 h-4" /> Results Already Published
                                            </span>
                                        )}
                                        <button onClick={handleDownloadAllReports}
                                            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-medium transition-colors ml-auto">
                                            <Download className="w-4 h-4" /> Download All Reports
                                        </button>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-gray-50">
                                                    <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Student</th>
                                                    <th className="text-center py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Marks</th>
                                                    <th className="text-center py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Total / %</th>
                                                    <th className="text-center py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Status</th>
                                                    <th className="text-center py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {viewData.students.map(student => {
                                                    const studentResults = viewData.results.filter(r => r.student_id === student.id);
                                                    if (studentResults.length === 0) return (
                                                        <tr key={student.id} className="opacity-50">
                                                            <td className="py-3 px-4 font-medium text-gray-800">{student.name} <span className="text-xs text-gray-400">(Roll #{student.roll_number})</span></td>
                                                            <td colSpan={4} className="text-center py-3 text-gray-400 text-xs">No marks entered</td>
                                                        </tr>
                                                    );
                                                    const totalObtained = studentResults.reduce((sum, r) => sum + (parseFloat(r.marks_obtained) || 0), 0);
                                                    const totalFull = studentResults.reduce((sum, r) => sum + (parseFloat(r.full_marks) || 100), 0);
                                                    const pct = totalFull > 0 ? ((totalObtained / totalFull) * 100).toFixed(1) : '0';
                                                    const vStatus = getStudentVerificationStatus(student.id);
                                                    const isVerifying = verifyingStudent === student.id;

                                                    return (
                                                        <tr key={student.id} className={`transition-colors ${vStatus.allVerified ? 'bg-green-50/30' : 'hover:bg-gray-50'}`}>
                                                            <td className="py-3 px-4">
                                                                <div className="font-medium text-gray-800">{student.name}</div>
                                                                <div className="text-xs text-gray-400">Roll #{student.roll_number}</div>
                                                            </td>
                                                            <td className="text-center py-3 px-4">
                                                                <div className="flex flex-wrap gap-1 justify-center">
                                                                    {viewSubjects.map(sub => {
                                                                        const r = studentResults.find(r => r.subject_id === sub.id);
                                                                        if (!r) return null;
                                                                        const isFailing = parseFloat(r.marks_obtained) < (viewExam.pass_marks || 40);
                                                                        return (
                                                                            <span key={sub.id} className={`inline-flex flex-col items-center px-2 py-1 rounded text-[10px] ${isFailing ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-700'}`}
                                                                                title={sub.name}>
                                                                                <span className="font-bold">{r.marks_obtained}</span>
                                                                                <span className="text-[8px] opacity-60 truncate max-w-[40px]">{sub.name.slice(0, 5)}</span>
                                                                            </span>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </td>
                                                            <td className="text-center py-3 px-4">
                                                                <div className="font-bold text-gray-900">{totalObtained}/{totalFull}</div>
                                                                <span className={`text-xs font-semibold ${parseFloat(pct) >= 80 ? 'text-green-600' : parseFloat(pct) >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                                                                    {pct}%
                                                                </span>
                                                            </td>
                                                            <td className="text-center py-3 px-4">
                                                                {vStatus.allVerified ? (
                                                                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                                                        <ShieldCheck className="w-3.5 h-3.5" /> Verified
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                                                                        <ShieldX className="w-3.5 h-3.5" /> Pending
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="text-center py-3 px-4">
                                                                <div className="flex items-center gap-2 justify-center">
                                                                    {!vStatus.allVerified ? (
                                                                        <button onClick={() => handleVerifyStudent(viewExam.id, student.id)}
                                                                            disabled={isVerifying}
                                                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 transition-colors disabled:opacity-50">
                                                                            {isVerifying ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />} Verify
                                                                        </button>
                                                                    ) : (
                                                                        <button onClick={() => handleUnverifyStudent(viewExam.id, student.id)}
                                                                            disabled={isVerifying}
                                                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50">
                                                                            {isVerifying ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />} Unverify
                                                                        </button>
                                                                    )}
                                                                    <button onClick={() => handleDownloadStudentReport(student)}
                                                                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
                                                                        title="Download Report Card">
                                                                        <Download className="w-3 h-3" /> PDF
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-700">
                                        <AlertCircle className="w-4 h-4 inline mr-1.5" />
                                        <strong>Workflow:</strong> Teachers enter marks &rarr; Admin reviews & verifies each student&apos;s marks &rarr; Once all marks are verified, admin can publish results. Published results are visible to students and on the public result checker page.
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ====== SCHEDULE / ROUTINE MODAL ====== */}
            {scheduleExam && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-fade-in-up">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                            <div className="flex items-center gap-4">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 font-serif">Exam Routine</h2>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {scheduleExam.name} &bull; Set subject-wise dates, times & rooms per class
                                    </p>
                                </div>
                                <select value={scheduleClassId} onChange={e => handleScheduleClassChange(e.target.value)}
                                    className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-medium">
                                    <option value="">— Select Class —</option>
                                    {(scheduleExam.class_ids || []).map(cid => {
                                        const c = classMap[cid];
                                        return c ? <option key={cid} value={cid}>{c.name} {c.section || ''}</option> : null;
                                    })}
                                </select>
                            </div>
                            <button onClick={() => setScheduleExam(null)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="flex-1 overflow-auto p-6">
                            {!scheduleClassId ? (
                                <div className="text-center py-16">
                                    <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500 font-medium">Select a class to set exam routine</p>
                                    <p className="text-gray-400 text-xs mt-1">Each class has its own subjects and schedule</p>
                                </div>
                            ) : scheduleLoading ? (
                                <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                            ) : scheduleRoutines.length === 0 ? (
                                <div className="text-center py-12">
                                    <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                    <p className="text-gray-500 text-sm">No subjects found for {classMap[scheduleClassId]?.name}</p>
                                    <p className="text-gray-400 text-xs mt-1">Add subjects to the class first via Class Management</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{classMap[scheduleClassId]?.name} — {scheduleRoutines.length} Subjects</p>
                                        <button type="button" onClick={() => {
                                            const baseDate = scheduleExam.start_date || '';
                                            if (!baseDate) { showToast('Set exam start date first', 'error'); return; }
                                            let d = new Date(baseDate);
                                            setScheduleRoutines(prev => prev.map((r, i) => {
                                                const date = new Date(d);
                                                date.setDate(date.getDate() + i);
                                                // Skip Saturdays (6)
                                                while (date.getDay() === 6) date.setDate(date.getDate() + 1);
                                                return { ...r, exam_date: date.toISOString().split('T')[0], start_time: r.start_time || '10:00', end_time: r.end_time || '13:00' };
                                            }));
                                            showToast('Auto-filled dates starting from exam start date');
                                        }} className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1">
                                            <Calendar className="w-3 h-3" /> Auto-fill dates
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-12 gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-500 px-1 mb-1">
                                        <div className="col-span-3">Subject</div>
                                        <div className="col-span-2">Date</div>
                                        <div className="col-span-2">Start</div>
                                        <div className="col-span-2">End</div>
                                        <div className="col-span-1">Full</div>
                                        <div className="col-span-1">Pass</div>
                                        <div className="col-span-1">Room</div>
                                    </div>
                                    {scheduleRoutines.map((routine, idx) => (
                                        <div key={routine.subject_id} className="grid grid-cols-12 gap-2 items-center bg-gray-50 rounded-xl p-2.5">
                                            <div className="col-span-3">
                                                <span className="text-sm font-semibold text-gray-800">{routine.subject_name}</span>
                                            </div>
                                            <div className="col-span-2">
                                                <input type="date" value={routine.exam_date}
                                                    onChange={e => handleScheduleChange(idx, 'exam_date', e.target.value)}
                                                    className="w-full px-1.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white" />
                                            </div>
                                            <div className="col-span-2">
                                                <input type="time" value={routine.start_time}
                                                    onChange={e => handleScheduleChange(idx, 'start_time', e.target.value)}
                                                    className="w-full px-1.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white" />
                                            </div>
                                            <div className="col-span-2">
                                                <input type="time" value={routine.end_time}
                                                    onChange={e => handleScheduleChange(idx, 'end_time', e.target.value)}
                                                    className="w-full px-1.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white" />
                                            </div>
                                            <div className="col-span-1">
                                                <input type="number" value={routine.full_marks} min={1}
                                                    onChange={e => handleScheduleChange(idx, 'full_marks', parseInt(e.target.value) || 100)}
                                                    className="w-full px-1.5 py-1.5 border border-gray-200 rounded-lg text-xs text-center focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white" />
                                            </div>
                                            <div className="col-span-1">
                                                <input type="number" value={routine.pass_marks} min={1}
                                                    onChange={e => handleScheduleChange(idx, 'pass_marks', parseInt(e.target.value) || 40)}
                                                    className="w-full px-1.5 py-1.5 border border-gray-200 rounded-lg text-xs text-center focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white" />
                                            </div>
                                            <div className="col-span-1">
                                                <input type="text" value={routine.room} placeholder="Hall"
                                                    onChange={e => handleScheduleChange(idx, 'room', e.target.value)}
                                                    className="w-full px-1.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        {scheduleClassId && scheduleRoutines.length > 0 && (
                            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 shrink-0">
                                <p className="text-xs text-gray-400">
                                    <Globe className="w-3 h-3 inline mr-1" />
                                    {scheduleExam.published ? 'Visible on public schedule' : 'Toggle "Public" on the exam to make visible'}
                                </p>
                                <div className="flex items-center gap-3">
                                    <button type="button" onClick={() => setScheduleExam(null)}
                                        className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Cancel</button>
                                    <button onClick={handleSaveSchedule} disabled={scheduleSaving}
                                        className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2">
                                        {scheduleSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        {scheduleSaving ? 'Saving...' : `Save ${classMap[scheduleClassId]?.name} Schedule`}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminExams;
