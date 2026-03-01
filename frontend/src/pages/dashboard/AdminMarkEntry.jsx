import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Save, Search, CheckCircle2, ArrowDown, BarChart3, AlertTriangle, ShieldCheck, ShieldX, UserX, Lock, Loader2, FileText, ClipboardCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getAllClasses, getExams, getSubjectsByClass, getStudentsByClass, getResults, saveMarks, getClasses } from '../../api';

const getGrade = (pct) => {
    if (pct >= 90) return { grade: 'A+', gpa: 4.0, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (pct >= 80) return { grade: 'A', gpa: 3.6, color: 'bg-emerald-50 text-emerald-600 border-emerald-200' };
    if (pct >= 70) return { grade: 'B+', gpa: 3.2, color: 'bg-blue-50 text-blue-700 border-blue-200' };
    if (pct >= 60) return { grade: 'B', gpa: 2.8, color: 'bg-blue-50 text-blue-600 border-blue-200' };
    if (pct >= 50) return { grade: 'C+', gpa: 2.4, color: 'bg-amber-50 text-amber-700 border-amber-200' };
    if (pct >= 40) return { grade: 'C', gpa: 2.0, color: 'bg-amber-50 text-amber-600 border-amber-200' };
    if (pct >= 30) return { grade: 'D', gpa: 1.6, color: 'bg-orange-50 text-orange-700 border-orange-200' };
    if (pct >= 20) return { grade: 'E', gpa: 0.8, color: 'bg-red-50 text-red-600 border-red-200' };
    return { grade: 'F', gpa: 0.0, color: 'bg-red-100 text-red-700 border-red-300' };
};

const EXAM_TYPES = {
    'First Terminal': { color: 'bg-blue-100 text-blue-700 border-blue-200', label: '1st Term' },
    'Second Terminal': { color: 'bg-indigo-100 text-indigo-700 border-indigo-200', label: '2nd Term' },
    'Third Terminal': { color: 'bg-purple-100 text-purple-700 border-purple-200', label: '3rd Term' },
    'Final': { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Final' },
    'Unit Test': { color: 'bg-gray-100 text-gray-700 border-gray-200', label: 'Unit' },
    'Weekly Test': { color: 'bg-cyan-100 text-cyan-700 border-cyan-200', label: 'Weekly' },
    'Mid-term': { color: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Mid' },
    'Pre-board': { color: 'bg-orange-100 text-orange-700 border-orange-200', label: 'Pre-board' },
};

const AdminMarkEntry = () => {
    const { user } = useAuth();
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [examsList, setExamsList] = useState([]);
    const [subjectsList, setSubjectsList] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [selectedExam, setSelectedExam] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [students, setStudents] = useState([]);
    const [search, setSearch] = useState('');
    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);
    const [fillAll, setFillAll] = useState('');
    const [loading, setLoading] = useState(true);
    const [examTypeFilter, setExamTypeFilter] = useState('ALL');
    const [toast, setToast] = useState(null);
    const inputRefs = useRef({});

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    // Load classes and exams
    useEffect(() => {
        const init = async () => {
            try {
                const [clsRes, exRes] = await Promise.all([getClasses(), getExams()]);
                const cls = clsRes.classes || [];
                setClasses(cls);
                setExamsList(exRes.exams || []);
                if (cls.length > 0) {
                    setSelectedClass(cls[0].id);
                    const secs = cls[0].sectionsList || [{ id: 'default', name: 'A' }];
                    setSections(secs);
                    if (secs.length > 0) setSelectedSection(secs[0].id);
                    loadSubjects(cls[0].id);
                }
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        init();
    }, []);

    const loadSubjects = async (classId) => {
        try {
            const res = await getSubjectsByClass(classId);
            const subs = res.subjects || [];
            setSubjectsList(subs);
            if (subs.length > 0) setSelectedSubject(subs[0].id);
        } catch { setSubjectsList([]); }
    };

    const loadStudents = useCallback(async () => {
        if (!selectedClass || !selectedExam || !selectedSubject) return;
        setLoading(true);
        try {
            const [studentsList, existingResults] = await Promise.all([
                getStudentsByClass(selectedClass),
                getResults(selectedExam, selectedSubject),
            ]);
            const resMap = Object.fromEntries(existingResults.map(r => [r.student_id, r]));
            setStudents(studentsList.map(s => {
                const r = resMap[s.id];
                return {
                    ...s,
                    marks: r?.marks_obtained || 0,
                    editedMarks: r?.marks_obtained ?? '',
                    grade: r?.grade || '',
                    remarks: r?.remarks || '',
                    absent: r ? (r.grade === 'AB' || r.remarks === 'Absent') : false,
                };
            }));
        } catch (e) { showToast(e.message || 'Failed to load data', 'error'); }
        finally { setLoading(false); }
    }, [selectedClass, selectedExam, selectedSubject]);

    useEffect(() => { loadStudents(); }, [loadStudents]);

    const handleClassChange = (classId) => {
        setSelectedClass(classId);
        const cls = classes.find(c => c.id === classId);
        const secs = cls?.sectionsList || [{ id: 'default', name: 'A' }];
        setSections(secs);
        if (secs.length > 0) setSelectedSection(secs[0].id);
        loadSubjects(classId);
    };

    const filteredExams = useMemo(() => {
        let exams = examsList;
        if (selectedClass) exams = exams.filter(e => (e.class_ids || []).includes(selectedClass) || e.class_id === selectedClass);
        if (examTypeFilter !== 'ALL') exams = exams.filter(e => e.exam_type === examTypeFilter);
        return exams;
    }, [examsList, selectedClass, examTypeFilter]);

    const examTypes = useMemo(() => [...new Set(examsList.map(e => e.exam_type).filter(Boolean))], [examsList]);

    // Auto-select first exam when filters change
    useEffect(() => {
        if (filteredExams.length > 0 && !filteredExams.find(e => e.id === selectedExam)) {
            setSelectedExam(filteredExams[0].id);
        }
    }, [filteredExams]);

    const currentExam = examsList.find(e => e.id === selectedExam) || { full_marks: 100, pass_marks: 40 };
    const currentSubject = subjectsList.find(s => s.id === selectedSubject);
    const currentClass = classes.find(c => c.id === selectedClass);

    const handleAbsentToggle = (id) => {
        setStudents(curr => curr.map(s => {
            if (s.id !== id) return s;
            const newAbsent = !s.absent;
            if (newAbsent) return { ...s, absent: true, editedMarks: '', grade: 'AB', remarks: 'Absent' };
            return { ...s, absent: false, grade: '', remarks: '' };
        }));
        setSaved(false);
    };

    const handleMarksChange = (id, type, value) => {
        const numVal = value === '' ? '' : Math.max(0, parseFloat(value) || 0);
        setStudents(curr => curr.map(s => {
            if (s.id !== id) return s;
            return { ...s, editedMarks: numVal };
        }));
        setSaved(false);
    };

    const handleFillAll = () => {
        if (fillAll === '') return;
        const val = Math.max(0, parseInt(fillAll) || 0);
        setStudents(curr => curr.map(s => {
            if (s.absent) return s;
            return { ...s, editedMarks: val };
        }));
        setSaved(false);
        setFillAll('');
    };

    const handleSave = async () => {
        setSaving(true);
        const marks = students.filter(s => s.editedMarks !== '' || s.absent).map(s => {
            const pct = s.absent ? 0 : ((s.editedMarks || 0) / (currentExam?.full_marks || 100)) * 100;
            const gradeInfo = s.absent ? { grade: 'AB', gpa: 0 } : getGrade(pct);
            return {
                exam_id: selectedExam, student_id: s.id, subject_id: selectedSubject,
                marks_obtained: s.absent ? 0 : (s.editedMarks || 0),
                full_marks: currentExam?.full_marks || 100,
                grade: gradeInfo.grade, grade_point: gradeInfo.gpa,
                remarks: s.absent ? 'Absent' : (s.remarks || ''),
            };
        });
        try {
            await saveMarks(marks);
            setStudents(curr => curr.map(s => {
                const pct = s.absent ? 0 : ((s.editedMarks || 0) / (currentExam?.full_marks || 100)) * 100;
                const gradeInfo = s.absent ? { grade: 'AB' } : getGrade(pct);
                return { ...s, marks: s.absent ? 0 : (s.editedMarks || 0), grade: gradeInfo.grade };
            }));
            setSaved(true);
            showToast('Marks saved successfully');
            setTimeout(() => setSaved(false), 3000);
        } catch (e) { showToast(e.message || 'Failed to save marks', 'error'); }
        finally { setSaving(false); }
    };

    const handleKeyDown = (e, studentId) => {
        const ids = filteredStudents.map(s => s.id);
        const idx = ids.indexOf(studentId);
        if (e.key === 'ArrowDown' || (e.key === 'Enter' && !e.shiftKey)) {
            e.preventDefault();
            const next = ids[idx + 1];
            if (next && inputRefs.current[next]) inputRefs.current[next].focus();
        } else if (e.key === 'ArrowUp' || (e.key === 'Enter' && e.shiftKey)) {
            e.preventDefault();
            const prev = ids[idx - 1];
            if (prev && inputRefs.current[prev]) inputRefs.current[prev].focus();
        }
    };

    const filteredStudents = students.filter(s =>
        !search || s.name.toLowerCase().includes(search.toLowerCase()) || String(s.roll_number).includes(search)
    );

    const absentCount = useMemo(() => students.filter(s => s.absent).length, [students]);
    const stats = useMemo(() => {
        const validMarks = students.filter(s => s.editedMarks !== '' && !s.absent).map(s => Number(s.editedMarks));
        const fm = currentExam?.full_marks || 100;
        return {
            entered: validMarks.length,
            total: students.length,
            avg: validMarks.length ? Math.round(validMarks.reduce((a, b) => a + b, 0) / validMarks.length) : 0,
            highest: validMarks.length ? Math.max(...validMarks) : 0,
            lowest: validMarks.length ? Math.min(...validMarks) : 0,
            passed: validMarks.filter(m => m >= (currentExam?.pass_marks || 40)).length,
            failed: validMarks.filter(m => m < (currentExam?.pass_marks || 40)).length,
        };
    }, [students, currentExam]);

    if (loading && classes.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                    {toast.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                    {toast.message}
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <ClipboardCheck className="w-7 h-7 text-primary" /> Mark Entry
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {currentClass?.name || 'Select class'} &bull; {currentExam?.name || 'Select exam'} &bull; {currentSubject?.name || 'Select subject'}
                        {currentExam?.full_marks && <span className="text-gray-400"> (Full Marks: {currentExam.full_marks})</span>}
                    </p>
                </div>
                <button onClick={handleSave} disabled={saving || students.length === 0}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all self-start ${saving ? 'bg-gray-400 cursor-wait' : saved ? 'bg-emerald-500' : students.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20'}`}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Marks'}
                </button>
            </div>

            {/* Breadcrumb Path */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center text-xs text-gray-400 gap-1 mb-3">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Home</span><span>&rsaquo;</span><span>Exam</span><span>&rsaquo;</span>
                    <span>Exam Management</span><span>&rsaquo;</span>
                    <span className="text-primary font-semibold">{currentExam?.name || 'Select Exam'}</span><span>&rsaquo;</span>
                    <span className="text-primary font-bold">{currentSubject?.name || 'Select Subject'}</span>
                </div>

                {/* Exam Info Bar */}
                {currentExam?.name && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Subject Exam</p>
                            <p className="text-sm font-bold text-gray-900 mt-0.5">{currentSubject?.name || '—'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Exam Date</p>
                            <p className="text-sm font-bold text-gray-900 mt-0.5">{currentExam?.start_date || '—'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Maximum Marks</p>
                            <p className="text-sm font-bold text-gray-900 mt-0.5">{currentExam?.full_marks} (Pass: {currentExam?.pass_marks})</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Exam Type</p>
                            {currentExam?.exam_type && (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border mt-0.5 ${(EXAM_TYPES[currentExam.exam_type] || { color: 'bg-gray-100 text-gray-700 border-gray-200' }).color}`}>
                                    {currentExam.exam_type}
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap gap-3">
                <select value={selectedClass} onChange={(e) => handleClassChange(e.target.value)}
                    className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white font-medium min-w-[140px]">
                    {classes.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
                </select>
                {sections.length > 1 && (
                    <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)}
                        className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white font-medium">
                        {sections.map(sec => <option key={sec.id} value={sec.id}>{sec.name}</option>)}
                    </select>
                )}
                <select value={examTypeFilter} onChange={(e) => setExamTypeFilter(e.target.value)}
                    className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white font-medium">
                    <option value="ALL">All Exam Types</option>
                    {examTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={selectedExam} onChange={(e) => setSelectedExam(e.target.value)}
                    className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white font-medium min-w-[180px]">
                    {filteredExams.length === 0 && <option value="">No exams found</option>}
                    {filteredExams.map(exam => (
                        <option key={exam.id} value={exam.id}>
                            [{(EXAM_TYPES[exam.exam_type] || { label: 'Exam' }).label}] {exam.name}
                        </option>
                    ))}
                </select>
                <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}
                    className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white font-medium">
                    {subjectsList.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
                </select>
            </div>

            {/* Warning */}
            <p className="text-xs text-amber-600 flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                Submitting marks will lock mark entry for this subject. You will not be able to modify marks after verification.
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {[
                    { label: 'Students', value: `${stats.entered}/${stats.total}`, color: 'text-gray-900' },
                    { label: 'Average', value: stats.avg },
                    { label: 'Highest', value: stats.highest, color: 'text-emerald-600' },
                    { label: 'Lowest', value: stats.lowest, color: 'text-amber-600' },
                    { label: 'Passed', value: stats.passed, color: 'text-emerald-600' },
                    { label: 'Failed', value: stats.failed, color: 'text-red-600' },
                    { label: 'Absent', value: absentCount, color: 'text-orange-600' },
                ].map((s, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-100 p-3 text-center">
                        <p className={`text-xl font-black ${s.color || 'text-gray-900'}`}>{s.value}</p>
                        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Mark Entry Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h3 className="text-sm font-bold text-gray-900">Enter Marks for Students</h3>
                        <span className="text-xs text-gray-400">{filteredStudents.length} students</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="relative">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..."
                                className="w-52 pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                        </div>
                        <div className="flex items-center gap-1">
                            <input type="number" value={fillAll} onChange={e => setFillAll(e.target.value)} placeholder="Fill all"
                                className="w-20 px-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" min="0" max={currentExam?.full_marks || 100} />
                            <button onClick={handleFillAll} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-600 transition-colors flex items-center gap-1">
                                <ArrowDown className="w-3 h-3" /> Fill
                            </button>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                ) : filteredStudents.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="font-medium">No students found</p>
                        <p className="text-xs mt-1">Select a class and exam to start entering marks</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 text-xs font-bold text-blue-900 uppercase tracking-wider">
                                    <th className="py-3.5 px-5 w-12 text-center">No.</th>
                                    <th className="py-3.5 px-5">Student</th>
                                    <th className="py-3.5 px-5 w-16 text-center hidden sm:table-cell">Roll</th>
                                    <th className="py-3.5 px-5 w-16 text-center">Absent</th>
                                    <th className="py-3.5 px-5 w-24 text-center">Marks</th>
                                    <th className="py-3.5 px-5 w-20 text-center">Grade</th>
                                    <th className="py-3.5 px-5 hidden lg:table-cell">Remarks</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredStudents.map((student, idx) => {
                                    const pct = student.absent ? 0 : ((student.editedMarks || 0) / (currentExam?.full_marks || 100)) * 100;
                                    const gradeInfo = student.absent ? { grade: 'AB', color: 'bg-orange-100 text-orange-700 border-orange-200' } : getGrade(pct);
                                    const isFailing = !student.absent && student.editedMarks !== '' && (student.editedMarks || 0) < (currentExam?.pass_marks || 40);
                                    return (
                                        <tr key={student.id} className={`hover:bg-gray-50/50 transition-colors ${student.absent ? 'bg-orange-50/30' : isFailing ? 'bg-red-50/20' : ''}`}>
                                            <td className="py-3 px-5 text-center text-xs font-bold text-gray-300">{idx + 1}</td>
                                            <td className="py-3 px-5">
                                                <span className={`text-sm font-semibold ${student.absent ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{student.name}</span>
                                            </td>
                                            <td className="py-3 px-5 text-center text-sm text-gray-500 font-medium hidden sm:table-cell">{student.roll_number}</td>
                                            <td className="py-3 px-5 text-center">
                                                <label className="inline-flex items-center gap-1 cursor-pointer">
                                                    <input type="checkbox" checked={student.absent} onChange={() => handleAbsentToggle(student.id)}
                                                        className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400 cursor-pointer" />
                                                    {student.absent && <UserX className="w-3.5 h-3.5 text-orange-500" />}
                                                </label>
                                            </td>
                                            <td className="py-3 px-5">
                                                <input
                                                    ref={el => inputRefs.current[student.id] = el}
                                                    type="number" min="0" max={currentExam?.full_marks || 100}
                                                    value={student.absent ? '' : student.editedMarks}
                                                    onChange={(e) => handleMarksChange(student.id, 'marks', e.target.value)}
                                                    onKeyDown={(e) => handleKeyDown(e, student.id)}
                                                    disabled={student.absent}
                                                    className={`w-full px-3 py-2 border rounded-lg text-sm font-medium text-center focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${student.absent ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' : isFailing ? 'border-red-300 bg-red-50/50' : 'border-gray-200 hover:border-gray-300'}`}
                                                    placeholder={student.absent ? 'AB' : '—'}
                                                />
                                            </td>
                                            <td className="py-3 px-5 text-center">
                                                {(student.editedMarks !== '' || student.absent) && (
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${gradeInfo.color}`}>{gradeInfo.grade}</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-5 hidden lg:table-cell">
                                                <input type="text" value={student.remarks} placeholder="Remarks..."
                                                    onChange={(e) => { setStudents(curr => curr.map(s => s.id === student.id ? { ...s, remarks: e.target.value } : s)); setSaved(false); }}
                                                    className="w-full px-3 py-2 border border-transparent hover:border-gray-200 rounded-lg text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 bg-transparent focus:bg-white transition-all"
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Bottom Save Button */}
                {filteredStudents.length > 0 && (
                    <div className="p-4 border-t border-gray-100 flex justify-center">
                        <button onClick={handleSave} disabled={saving}
                            className={`flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold text-white transition-all ${saving ? 'bg-gray-400' : saved ? 'bg-emerald-500' : 'bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20'}`}>
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                            {saving ? 'Saving...' : saved ? 'Saved Successfully!' : '▶ Save'}
                        </button>
                    </div>
                )}
            </div>

            {/* GPA Scale */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">GPA Conversion Scale</h4>
                <div className="flex flex-wrap gap-2">
                    {[
                        { grade: 'A+', range: '90-100', gpa: '4.0', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                        { grade: 'A', range: '80-89', gpa: '3.6', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
                        { grade: 'B+', range: '70-79', gpa: '3.2', color: 'bg-blue-50 text-blue-700 border-blue-200' },
                        { grade: 'B', range: '60-69', gpa: '2.8', color: 'bg-blue-50 text-blue-600 border-blue-200' },
                        { grade: 'C+', range: '50-59', gpa: '2.4', color: 'bg-amber-50 text-amber-700 border-amber-200' },
                        { grade: 'C', range: '40-49', gpa: '2.0', color: 'bg-amber-50 text-amber-600 border-amber-200' },
                        { grade: 'D', range: '30-39', gpa: '1.6', color: 'bg-orange-50 text-orange-700 border-orange-200' },
                        { grade: 'E', range: '20-29', gpa: '0.8', color: 'bg-red-50 text-red-600 border-red-200' },
                        { grade: 'F', range: '<20', gpa: '0.0', color: 'bg-red-100 text-red-700 border-red-300' },
                    ].map(g => (
                        <div key={g.grade} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${g.color}`}>
                            <span className="font-black">{g.grade}</span>
                            <span className="text-[10px] opacity-70">{g.range}</span>
                            <span className="font-black">({g.gpa})</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminMarkEntry;
