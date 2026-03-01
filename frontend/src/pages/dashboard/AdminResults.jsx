import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Award, Download, TrendingUp, Trophy, BookOpen, Loader2, Search, Users, BarChart3, Eye, ChevronDown, ChevronRight, Printer, GraduationCap, FileText, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getClasses, getExams, getResultsForClassExam, getSubjectsByClass, getStudentResults } from '../../api';
import { generateReportCard } from '../../utils/generateReportCard';

/* ─── Grade Calculation ─── */
const getGrade = (pct) => {
    if (pct >= 90) return { grade: 'A+', gpa: 4.0, color: 'bg-emerald-100 text-emerald-700 border-emerald-200', ring: 'ring-emerald-400' };
    if (pct >= 80) return { grade: 'A', gpa: 3.6, color: 'bg-emerald-50 text-emerald-600 border-emerald-200', ring: 'ring-emerald-300' };
    if (pct >= 70) return { grade: 'B+', gpa: 3.2, color: 'bg-blue-100 text-blue-700 border-blue-200', ring: 'ring-blue-400' };
    if (pct >= 60) return { grade: 'B', gpa: 2.8, color: 'bg-blue-50 text-blue-600 border-blue-200', ring: 'ring-blue-300' };
    if (pct >= 50) return { grade: 'C+', gpa: 2.4, color: 'bg-amber-100 text-amber-700 border-amber-200', ring: 'ring-amber-400' };
    if (pct >= 40) return { grade: 'C', gpa: 2.0, color: 'bg-amber-50 text-amber-600 border-amber-200', ring: 'ring-amber-300' };
    if (pct >= 30) return { grade: 'D', gpa: 1.6, color: 'bg-orange-100 text-orange-700 border-orange-200', ring: 'ring-orange-400' };
    if (pct >= 20) return { grade: 'E', gpa: 0.8, color: 'bg-red-50 text-red-600 border-red-200', ring: 'ring-red-300' };
    return { grade: 'F', gpa: 0.0, color: 'bg-red-100 text-red-700 border-red-300', ring: 'ring-red-500' };
};

const getDivision = (pct) => {
    if (pct >= 80) return { label: 'Distinction', color: 'text-emerald-600 bg-emerald-50' };
    if (pct >= 60) return { label: 'First Division', color: 'text-blue-600 bg-blue-50' };
    if (pct >= 45) return { label: 'Second Division', color: 'text-amber-600 bg-amber-50' };
    if (pct >= 32) return { label: 'Third Division', color: 'text-orange-600 bg-orange-50' };
    return { label: 'Failed', color: 'text-red-600 bg-red-50' };
};

const EXAM_TYPES = {
    'First Terminal': { color: 'bg-blue-50 text-blue-600 border-blue-200', label: '1st Term' },
    'Second Terminal': { color: 'bg-indigo-50 text-indigo-600 border-indigo-200', label: '2nd Term' },
    'Third Terminal': { color: 'bg-violet-50 text-violet-600 border-violet-200', label: '3rd Term' },
    'Final': { color: 'bg-red-50 text-red-600 border-red-200', label: 'Final' },
    'Weekly Test': { color: 'bg-teal-50 text-teal-600 border-teal-200', label: 'Weekly' },
    'Unit Test': { color: 'bg-cyan-50 text-cyan-600 border-cyan-200', label: 'Unit' },
    'Mid-term': { color: 'bg-amber-50 text-amber-600 border-amber-200', label: 'Mid' },
    'Pre-board': { color: 'bg-orange-50 text-orange-600 border-orange-200', label: 'Pre-board' },
};

/* ─── Circular Progress Ring ─── */
const CircularProgress = ({ value, max = 100, size = 80, strokeWidth = 6, label, sublabel, color = '#b20000' }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const pct = Math.min(100, Math.max(0, (value / max) * 100));
    const offset = circumference - (pct / 100) * circumference;
    return (
        <div className="flex flex-col items-center">
            <svg width={size} height={size} className="-rotate-90">
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
                    strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700 ease-out" />
            </svg>
            <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
                <span className="text-lg font-black text-gray-900">{label}</span>
                {sublabel && <span className="text-[9px] text-gray-400 font-medium">{sublabel}</span>}
            </div>
        </div>
    );
};

const AdminResults = () => {
    const { user } = useAuth();
    const [classes, setClasses] = useState([]);
    const [exams, setExams] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedExam, setSelectedExam] = useState('');
    const [loading, setLoading] = useState(true);
    const [dataLoading, setDataLoading] = useState(false);
    const [viewData, setViewData] = useState(null);
    const [subjects, setSubjects] = useState([]);
    const [search, setSearch] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentDetail, setStudentDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(null);
    const [toast, setToast] = useState(null);
    const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'

    const showToast = (msg, type = 'success') => {
        setToast({ message: msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    useEffect(() => {
        const init = async () => {
            try {
                const [clsRes, exRes] = await Promise.all([getClasses(), getExams()]);
                const cls = clsRes.classes || [];
                const exList = exRes.exams || [];
                setClasses(cls);
                setExams(exList);
                if (cls.length > 0) setSelectedClass(cls[0].id);
                if (exList.length > 0) setSelectedExam(exList[0].id);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        init();
    }, []);

    const filteredExams = useMemo(() => {
        if (!selectedClass) return exams;
        return exams.filter(e => (e.class_ids || []).includes(selectedClass) || e.class_id === selectedClass);
    }, [exams, selectedClass]);

    useEffect(() => {
        if (filteredExams.length > 0 && !filteredExams.find(e => e.id === selectedExam)) {
            setSelectedExam(filteredExams[0].id);
        }
    }, [filteredExams]);

    const loadResults = useCallback(async () => {
        if (!selectedClass || !selectedExam) return;
        setDataLoading(true);
        setSelectedStudent(null);
        setStudentDetail(null);
        try {
            const [resultData, subjectRes] = await Promise.all([
                getResultsForClassExam(selectedExam, selectedClass),
                getSubjectsByClass(selectedClass),
            ]);
            setViewData(resultData);
            setSubjects(subjectRes.subjects || []);
        } catch (e) { showToast(e.message || 'Failed to load results', 'error'); }
        finally { setDataLoading(false); }
    }, [selectedClass, selectedExam]);

    useEffect(() => { loadResults(); }, [loadResults]);

    const currentExam = exams.find(e => e.id === selectedExam);
    const currentClass = classes.find(c => c.id === selectedClass);

    // Process student results
    const studentResults = useMemo(() => {
        if (!viewData) return [];
        const { students = [], results = [] } = viewData;
        const resultsByStudent = {};
        results.forEach(r => {
            if (!resultsByStudent[r.student_id]) resultsByStudent[r.student_id] = [];
            resultsByStudent[r.student_id].push(r);
        });

        return students.map(student => {
            const marks = resultsByStudent[student.id] || [];
            const totalObtained = marks.reduce((s, m) => s + (m.marks_obtained || 0), 0);
            const totalFull = marks.reduce((s, m) => s + (m.full_marks || currentExam?.full_marks || 100), 0);
            const percentage = totalFull > 0 ? (totalObtained / totalFull) * 100 : 0;
            const avgGPA = marks.length > 0 ? marks.reduce((s, m) => s + (m.grade_point || 0), 0) / marks.length : 0;
            const passed = !marks.some(m => (m.marks_obtained || 0) < (m.pass_marks || currentExam?.pass_marks || 40));
            const subjectCount = marks.length;

            return {
                ...student,
                marks,
                totalObtained,
                totalFull,
                percentage: percentage.toFixed(1),
                avgGPA: avgGPA.toFixed(2),
                passed: subjectCount > 0 ? passed : null,
                subjectCount,
                division: getDivision(percentage),
                gradeInfo: getGrade(percentage),
            };
        }).sort((a, b) => parseFloat(b.percentage) - parseFloat(a.percentage));
    }, [viewData, currentExam]);

    const filteredResults = studentResults.filter(s =>
        !search || s.name.toLowerCase().includes(search.toLowerCase()) || String(s.roll_number).includes(search)
    );

    // Class-wide stats
    const classStats = useMemo(() => {
        const withMarks = studentResults.filter(s => s.subjectCount > 0);
        if (withMarks.length === 0) return null;
        const pcts = withMarks.map(s => parseFloat(s.percentage));
        return {
            total: studentResults.length,
            appeared: withMarks.length,
            passed: withMarks.filter(s => s.passed).length,
            failed: withMarks.filter(s => !s.passed).length,
            highest: Math.max(...pcts).toFixed(1),
            lowest: Math.min(...pcts).toFixed(1),
            average: (pcts.reduce((a, b) => a + b, 0) / pcts.length).toFixed(1),
            distinction: withMarks.filter(s => parseFloat(s.percentage) >= 80).length,
            firstDiv: withMarks.filter(s => parseFloat(s.percentage) >= 60 && parseFloat(s.percentage) < 80).length,
            secondDiv: withMarks.filter(s => parseFloat(s.percentage) >= 45 && parseFloat(s.percentage) < 60).length,
        };
    }, [studentResults]);

    // Load individual student detail
    const viewStudentDetail = async (student) => {
        setSelectedStudent(student);
        setDetailLoading(true);
        try {
            const res = await getStudentResults(student.id);
            const examDetail = (res.exams || []).find(e => e.id === selectedExam);
            setStudentDetail(examDetail || null);
        } catch { setStudentDetail(null); }
        finally { setDetailLoading(false); }
    };

    // Download individual report card
    const handleDownloadPDF = async (student) => {
        setPdfLoading(student.id);
        try {
            // Use the marks from our loaded data
            const subjectMarks = student.marks.map(m => {
                const sub = subjects.find(s => s.id === m.subject_id);
                return {
                    name: sub?.name || m.subject_name || 'Unknown',
                    th: m.marks_obtained ?? 0,
                    pr: null,
                    total: m.marks_obtained || 0,
                    full: m.full_marks || currentExam?.full_marks || 100,
                    grade: m.grade || getGrade(((m.marks_obtained || 0) / (m.full_marks || currentExam?.full_marks || 100)) * 100).grade,
                    gpa: m.grade_point || getGrade(((m.marks_obtained || 0) / (m.full_marks || currentExam?.full_marks || 100)) * 100).gpa,
                };
            });
            generateReportCard({
                studentName: student.name,
                className: currentClass?.name || '',
                rollNumber: student.roll_number || '',
                examName: currentExam?.name || '',
                examDate: currentExam?.start_date || '',
                examType: currentExam?.exam_type || '',
                subjects: subjectMarks,
            });
        } catch (err) { showToast('PDF generation failed', 'error'); }
        finally { setPdfLoading(null); }
    };

    // Download all report cards
    const handleDownloadAll = async () => {
        const withMarks = studentResults.filter(s => s.subjectCount > 0);
        for (const student of withMarks) {
            await handleDownloadPDF(student);
            await new Promise(r => setTimeout(r, 500)); // Small delay between downloads
        }
        showToast(`Generated ${withMarks.length} report cards`);
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                    {toast.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    {toast.message}
                </div>
            )}

            {/* School Header Card */}
            <div className="bg-gradient-to-r from-primary via-primary/95 to-primary/80 rounded-2xl p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-20 w-24 h-24 bg-white/5 rounded-full translate-y-1/2" />
                <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
                        <BookOpen className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-xl sm:text-2xl font-black tracking-tight">SEVEN STAR ENGLISH BOARDING SCHOOL</h1>
                        <p className="text-white/70 text-sm mt-0.5">Devdaha, Rupandehi, Nepal &bull; Estd. 2005 &bull; Affiliated to NEB</p>
                        <p className="text-accent font-bold text-sm mt-1">PROGRESS REPORT CARD — Academic Results</p>
                    </div>
                    <div className="flex gap-2 self-start">
                        <button onClick={handleDownloadAll} disabled={!classStats}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white/20 hover:bg-white/30 text-white transition-colors disabled:opacity-50">
                            <Download className="w-3.5 h-3.5" /> Download All PDFs
                        </button>
                        <button onClick={() => window.print()}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white/20 hover:bg-white/30 text-white transition-colors">
                            <Printer className="w-3.5 h-3.5" /> Print
                        </button>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}
                    className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white font-medium min-w-[160px]">
                    {classes.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
                </select>
                <select value={selectedExam} onChange={(e) => setSelectedExam(e.target.value)}
                    className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white font-medium min-w-[200px]">
                    {filteredExams.length === 0 && <option value="">No exams found</option>}
                    {filteredExams.map(exam => (
                        <option key={exam.id} value={exam.id}>
                            [{(EXAM_TYPES[exam.exam_type] || { label: 'Exam' }).label}] {exam.name}
                        </option>
                    ))}
                </select>
                <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-0.5">
                    <button onClick={() => setViewMode('table')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'table' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}>
                        Table
                    </button>
                    <button onClick={() => setViewMode('cards')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'cards' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}>
                        Cards
                    </button>
                </div>
            </div>

            {/* Class-wide Statistics */}
            {classStats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                    {[
                        { label: 'Total', value: classStats.total, icon: Users, color: 'text-gray-600' },
                        { label: 'Appeared', value: classStats.appeared, icon: FileText, color: 'text-blue-600' },
                        { label: 'Passed', value: classStats.passed, icon: CheckCircle, color: 'text-emerald-600' },
                        { label: 'Failed', value: classStats.failed, icon: XCircle, color: 'text-red-600' },
                        { label: 'Highest', value: `${classStats.highest}%`, icon: Trophy, color: 'text-amber-600' },
                        { label: 'Average', value: `${classStats.average}%`, icon: BarChart3, color: 'text-purple-600' },
                        { label: 'Distinction', value: classStats.distinction, icon: Award, color: 'text-emerald-600' },
                        { label: '1st Division', value: classStats.firstDiv, icon: TrendingUp, color: 'text-blue-600' },
                    ].map((s, i) => (
                        <div key={i} className="bg-white rounded-xl border border-gray-100 p-3 text-center group hover:shadow-md transition-all">
                            <s.icon className={`w-5 h-5 mx-auto mb-1.5 ${s.color} group-hover:scale-110 transition-transform`} />
                            <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
                            <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">{s.label}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Student Detail Modal */}
            {selectedStudent && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedStudent(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        {/* School Header */}
                        <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-6 rounded-t-2xl">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                                    <BookOpen className="w-7 h-7" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black">SEVEN STAR ENGLISH BOARDING SCHOOL</h2>
                                    <p className="text-white/70 text-xs">Devdaha, Rupandehi, Nepal &bull; Estd. 2005</p>
                                    <p className="text-accent text-xs font-bold mt-0.5">PROGRESS REPORT CARD</p>
                                </div>
                            </div>
                        </div>

                        {/* Student Info */}
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex flex-col sm:flex-row gap-4 justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                                        <GraduationCap className="w-8 h-8 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">{selectedStudent.name}</h3>
                                        <p className="text-sm text-gray-500">
                                            {currentClass?.name || ''} &bull; Roll #{selectedStudent.roll_number}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    {/* GPA Circle */}
                                    <div className="relative">
                                        <CircularProgress value={parseFloat(selectedStudent.avgGPA)} max={4.0} size={72} strokeWidth={5}
                                            label={selectedStudent.avgGPA} sublabel="GPA"
                                            color={parseFloat(selectedStudent.avgGPA) >= 3.0 ? '#059669' : parseFloat(selectedStudent.avgGPA) >= 2.0 ? '#d97706' : '#dc2626'} />
                                    </div>
                                    {/* Percentage Circle */}
                                    <div className="relative">
                                        <CircularProgress value={parseFloat(selectedStudent.percentage)} max={100} size={72} strokeWidth={5}
                                            label={`${Math.round(parseFloat(selectedStudent.percentage))}%`} sublabel="Marks"
                                            color={parseFloat(selectedStudent.percentage) >= 60 ? '#2563eb' : '#dc2626'} />
                                    </div>
                                </div>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                                <div className="bg-gray-50 rounded-xl p-3">
                                    <p className="text-[10px] text-gray-400 font-semibold uppercase">Exam</p>
                                    <p className="text-sm font-bold text-gray-900 mt-0.5">{currentExam?.name || '—'}</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-3">
                                    <p className="text-[10px] text-gray-400 font-semibold uppercase">Total Marks</p>
                                    <p className="text-sm font-bold text-gray-900 mt-0.5">{selectedStudent.totalObtained}/{selectedStudent.totalFull}</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-3">
                                    <p className="text-[10px] text-gray-400 font-semibold uppercase">Division</p>
                                    <p className={`text-sm font-bold mt-0.5 ${selectedStudent.division.color.split(' ')[0]}`}>{selectedStudent.division.label}</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-3">
                                    <p className="text-[10px] text-gray-400 font-semibold uppercase">Result</p>
                                    <p className={`text-sm font-bold mt-0.5 ${selectedStudent.passed ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {selectedStudent.passed ? 'PASSED' : 'FAILED'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Subject-wise Table */}
                        <div className="p-6">
                            <h4 className="text-sm font-bold text-gray-900 mb-3">Subject-wise Results</h4>
                            {detailLoading ? (
                                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                            ) : (
                                <div className="overflow-x-auto rounded-xl border border-gray-200">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-gradient-to-r from-gray-50 to-gray-100 text-xs font-bold text-gray-600 uppercase tracking-wider">
                                                <th className="py-3 px-4 w-10">S.N.</th>
                                                <th className="py-3 px-4">Subject</th>
                                                <th className="py-3 px-4 text-center w-20">Marks</th>
                                                <th className="py-3 px-4 text-center w-24">Full Marks</th>
                                                <th className="py-3 px-4 text-center w-16">Grade</th>
                                                <th className="py-3 px-4 text-center w-16">GPA</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {selectedStudent.marks.map((m, idx) => {
                                                const sub = subjects.find(s => s.id === m.subject_id);
                                                const mFull = m.full_marks || currentExam?.full_marks || 100;
                                                const pct = ((m.marks_obtained || 0) / mFull) * 100;
                                                const gi = getGrade(pct);
                                                const isFailing = (m.marks_obtained || 0) < (m.pass_marks || currentExam?.pass_marks || 40);
                                                return (
                                                    <tr key={m.subject_id || idx} className={`hover:bg-gray-50/50 transition-colors ${isFailing ? 'bg-red-50/30' : ''}`}>
                                                        <td className="py-3 px-4 text-xs text-gray-400 font-bold">{idx + 1}</td>
                                                        <td className="py-3 px-4 text-sm font-semibold text-gray-800">{sub?.name || m.subject_name || '—'}</td>
                                                        <td className="py-3 px-4 text-center text-sm font-bold text-gray-900">{m.marks_obtained || 0}</td>
                                                        <td className="py-3 px-4 text-center text-sm text-gray-500">{m.full_marks || currentExam?.full_marks || 100}</td>
                                                        <td className="py-3 px-4 text-center">
                                                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-[10px] font-black border ${gi.color}`}>{m.grade || gi.grade}</span>
                                                        </td>
                                                        <td className="py-3 px-4 text-center text-sm font-bold text-gray-700">{(m.grade_point || gi.gpa).toFixed(1)}</td>
                                                    </tr>
                                                );
                                            })}
                                            {/* Total Row */}
                                            <tr className="bg-gray-50 font-bold border-t-2 border-gray-200">
                                                <td className="py-3 px-4" colSpan={2}>TOTAL</td>
                                                <td className="py-3 px-4 text-center text-gray-900">{selectedStudent.totalObtained}</td>
                                                <td className="py-3 px-4 text-center text-gray-700">{selectedStudent.totalFull}</td>
                                                <td className="py-3 px-4 text-center">
                                                    <span className={`inline-flex items-center justify-center px-2 py-1 rounded-lg text-[10px] font-black border ${selectedStudent.gradeInfo.color}`}>{selectedStudent.percentage}%</span>
                                                </td>
                                                <td className="py-3 px-4 text-center font-black text-gray-900">{selectedStudent.avgGPA}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Summary Strip */}
                            <div className="grid grid-cols-4 gap-3 mt-4">
                                {[
                                    { label: 'Total Marks', value: `${selectedStudent.totalObtained} / ${selectedStudent.totalFull}` },
                                    { label: 'Percentage', value: `${selectedStudent.percentage}%` },
                                    { label: 'GPA', value: selectedStudent.avgGPA },
                                    { label: 'Division', value: selectedStudent.division.label },
                                ].map((item, i) => (
                                    <div key={i} className="bg-gray-50 rounded-xl p-3 text-center">
                                        <p className="text-[9px] text-gray-400 font-semibold uppercase">{item.label}</p>
                                        <p className="text-sm font-black text-gray-900 mt-0.5">{item.value}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 mt-4">
                                <button onClick={() => handleDownloadPDF(selectedStudent)}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                                    <Download className="w-4 h-4" /> Download Report Card PDF
                                </button>
                                <button onClick={() => setSelectedStudent(null)}
                                    className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                                    Close
                                </button>
                            </div>
                        </div>

                        {/* GPA Scale */}
                        <div className="px-6 pb-6">
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">GPA Conversion Scale</h4>
                            <div className="flex flex-wrap gap-1.5">
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
                                    <span key={g.grade} className={`px-2 py-1 rounded text-[10px] font-bold border ${g.color}`}>{g.grade} ({g.range}) = {g.gpa}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Search Bar */}
            <div className="relative max-w-md">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search students by name or roll number..."
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>

            {/* Results Table View */}
            {viewMode === 'table' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-900">
                            {currentClass?.name} — {currentExam?.name}
                            {currentExam?.exam_type && (
                                <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold border ${(EXAM_TYPES[currentExam.exam_type] || { color: 'bg-gray-100 text-gray-700 border-gray-200' }).color}`}>
                                    {currentExam.exam_type}
                                </span>
                            )}
                        </h3>
                        <span className="text-xs text-gray-400">{filteredResults.length} students</span>
                    </div>

                    {dataLoading ? (
                        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                    ) : filteredResults.length === 0 ? (
                        <div className="text-center py-20 text-gray-400">
                            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p className="font-medium">No results found</p>
                            <p className="text-xs mt-1">No marks have been entered for this exam yet</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        <th className="py-3.5 px-5 w-12 text-center">Rank</th>
                                        <th className="py-3.5 px-5 w-16">Roll</th>
                                        <th className="py-3.5 px-5">Student Name</th>
                                        <th className="py-3.5 px-5 text-center w-16">Subjects</th>
                                        <th className="py-3.5 px-5 text-center w-28">Marks</th>
                                        <th className="py-3.5 px-5 text-center w-20">%</th>
                                        <th className="py-3.5 px-5 text-center w-16">GPA</th>
                                        <th className="py-3.5 px-5 text-center w-16">Grade</th>
                                        <th className="py-3.5 px-5 text-center w-24">Division</th>
                                        <th className="py-3.5 px-5 text-center w-20">Result</th>
                                        <th className="py-3.5 px-5 text-center w-24">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredResults.map((student, idx) => {
                                        const isTopThree = idx < 3 && student.subjectCount > 0;
                                        return (
                                            <tr key={student.id} className={`hover:bg-gray-50/50 transition-colors ${!student.passed && student.subjectCount > 0 ? 'bg-red-50/20' : ''} ${isTopThree ? 'bg-amber-50/20' : ''}`}>
                                                <td className="py-3.5 px-5 text-center">
                                                    {student.subjectCount > 0 ? (
                                                        isTopThree ? (
                                                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black ${idx === 0 ? 'bg-amber-400 text-white' : idx === 1 ? 'bg-gray-300 text-gray-700' : 'bg-orange-300 text-white'}`}>{idx + 1}</span>
                                                        ) : <span className="text-sm font-bold text-gray-400">{idx + 1}</span>
                                                    ) : <span className="text-gray-300">—</span>}
                                                </td>
                                                <td className="py-3.5 px-5 text-sm font-medium text-gray-500">{student.roll_number}</td>
                                                <td className="py-3.5 px-5 text-sm font-semibold text-gray-800">{student.name}</td>
                                                <td className="py-3.5 px-5 text-center text-sm text-gray-500">{student.subjectCount}</td>
                                                <td className="py-3.5 px-5 text-center">
                                                    <span className="text-sm font-bold text-gray-800">{student.totalObtained}</span>
                                                    <span className="text-xs text-gray-400">/{student.totalFull}</span>
                                                </td>
                                                <td className="py-3.5 px-5 text-center text-sm font-black text-gray-800">{student.percentage}%</td>
                                                <td className="py-3.5 px-5 text-center text-sm font-bold text-gray-700">{student.avgGPA}</td>
                                                <td className="py-3.5 px-5 text-center">
                                                    {student.subjectCount > 0 && (
                                                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-[10px] font-black border ${student.gradeInfo.color}`}>{student.gradeInfo.grade}</span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-5 text-center">
                                                    {student.subjectCount > 0 && (
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold ${student.division.color}`}>{student.division.label}</span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-5 text-center">
                                                    {student.subjectCount > 0 && (
                                                        student.passed ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700"><CheckCircle className="w-3 h-3" /> Pass</span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-700"><XCircle className="w-3 h-3" /> Fail</span>
                                                        )
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-5 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button onClick={() => viewStudentDetail(student)} title="View Details"
                                                            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-primary/10 text-gray-500 hover:text-primary flex items-center justify-center transition-colors">
                                                            <Eye className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button onClick={() => handleDownloadPDF(student)} title="Download PDF" disabled={pdfLoading === student.id || student.subjectCount === 0}
                                                            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-primary/10 text-gray-500 hover:text-primary flex items-center justify-center transition-colors disabled:opacity-50">
                                                            {pdfLoading === student.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Results Card View */}
            {viewMode === 'cards' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dataLoading ? (
                        <div className="col-span-full flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                    ) : filteredResults.length === 0 ? (
                        <div className="col-span-full text-center py-20 text-gray-400">
                            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p className="font-medium">No results found</p>
                        </div>
                    ) : filteredResults.map((student, idx) => (
                        <div key={student.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg transition-all group cursor-pointer" onClick={() => viewStudentDetail(student)}>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center shrink-0">
                                        <GraduationCap className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors">{student.name}</h4>
                                        <p className="text-xs text-gray-400">Roll #{student.roll_number}</p>
                                    </div>
                                </div>
                                {idx < 3 && student.subjectCount > 0 && (
                                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${idx === 0 ? 'bg-amber-400 text-white' : idx === 1 ? 'bg-gray-300 text-gray-700' : 'bg-orange-300 text-white'}`}>{idx + 1}</span>
                                )}
                            </div>

                            {student.subjectCount > 0 ? (
                                <>
                                    <div className="grid grid-cols-3 gap-3 mt-4">
                                        <div className="text-center">
                                            <p className="text-[10px] text-gray-400 font-semibold uppercase">Percentage</p>
                                            <p className="text-lg font-black text-gray-900">{student.percentage}%</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[10px] text-gray-400 font-semibold uppercase">GPA</p>
                                            <p className="text-lg font-black text-gray-900">{student.avgGPA}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[10px] text-gray-400 font-semibold uppercase">Grade</p>
                                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-[10px] font-black border ${student.gradeInfo.color}`}>{student.gradeInfo.grade}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${student.division.color}`}>{student.division.label}</span>
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${student.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                            {student.passed ? 'PASSED' : 'FAILED'}
                                        </span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mt-3">
                                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full transition-all duration-500 ${parseFloat(student.percentage) >= 80 ? 'bg-emerald-500' : parseFloat(student.percentage) >= 60 ? 'bg-blue-500' : parseFloat(student.percentage) >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                style={{ width: `${Math.min(100, parseFloat(student.percentage))}%` }} />
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-1 text-right">{student.totalObtained}/{student.totalFull} marks</p>
                                    </div>
                                </>
                            ) : (
                                <div className="mt-4 text-center py-4">
                                    <p className="text-xs text-gray-400">No marks entered yet</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminResults;
