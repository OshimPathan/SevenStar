import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Save, Search, Check, X as XIcon, Clock, CalendarDays, Users, CheckCircle2, Lock, AlertTriangle, ChevronLeft, ChevronRight, BarChart3, Printer } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getTeacherAttendanceScope, getStudentsByClassSection, getAttendanceByDate, saveAttendance, getAttendanceForWeek, getAttendanceReport } from '../../api';

const STATUS_CONFIG = {
    Present: { label: 'P', bg: 'bg-emerald-500', text: 'text-white', light: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    Absent: { label: 'A', bg: 'bg-red-500', text: 'text-white', light: 'bg-red-50 text-red-700 border-red-200' },
    Late: { label: 'L', bg: 'bg-amber-500', text: 'text-white', light: 'bg-amber-50 text-amber-700 border-amber-200' },
    'Half-Day': { label: 'H', bg: 'bg-blue-500', text: 'text-white', light: 'bg-blue-50 text-blue-700 border-blue-200' },
};
const STATUS_KEYS = Object.keys(STATUS_CONFIG);

const getWeekDates = (baseDate) => {
    const d = new Date(baseDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday first
    const monday = new Date(d.setDate(diff));
    return Array.from({ length: 7 }, (_, i) => {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        return date.toISOString().split('T')[0];
    });
};

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const TeacherAttendance = () => {
    const { user } = useAuth();
    const [viewMode, setViewMode] = useState('daily'); // 'daily' | 'weekly' | 'report'
    const [scope, setScope] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [students, setStudents] = useState([]);
    const [search, setSearch] = useState('');
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(false);

    // Weekly view state
    const [weekStudents, setWeekStudents] = useState([]);
    const [weekAttendance, setWeekAttendance] = useState({});
    const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);

    // Report state
    const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7));
    const [reportData, setReportData] = useState([]);

    const isToday = selectedDate === new Date().toISOString().slice(0, 10);

    useEffect(() => {
        if (!user?.teacher_id) return;
        getTeacherAttendanceScope(user.teacher_id)
            .then(list => {
                setScope(list);
                if (list.length > 0) {
                    const first = list[0];
                    setSelectedClass(first.class_id);
                    setSelectedSection(first.section_id);
                    setSelectedSubject(first.subject_id);
                    loadStudents(first.class_id, first.section_id, first.subject_id, selectedDate);
                }
            })
            .catch(() => { });
    }, [user?.teacher_id]);

    const loadStudents = async (classId, sectionId, subjectId, date) => {
        setLoading(true);
        try {
            const studentsList = await getStudentsByClassSection(classId, sectionId);
            const attendance = await getAttendanceByDate(classId, sectionId, subjectId, date);
            const attMap = Object.fromEntries((attendance || []).map(a => [a.student_id, a.status]));
            setStudents(studentsList.map(s => ({
                ...s,
                status: attMap[s.id] || 'Present',
            })));
        } catch (e) { /* ignore */ }
        finally { setLoading(false); }
    };

    const loadWeekData = useCallback(async () => {
        if (!selectedClass || !selectedSection) return;
        setLoading(true);
        try {
            const { students: sList, attendance: att } = await getAttendanceForWeek(
                selectedClass, selectedSection, weekDates[0], weekDates[6], selectedSubject || null
            );
            setWeekStudents(sList);
            setWeekAttendance(att);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [selectedClass, selectedSection, selectedSubject, weekDates]);

    const loadReport = useCallback(async () => {
        if (!selectedClass || !selectedSection) return;
        setLoading(true);
        try {
            const { summary } = await getAttendanceReport(selectedClass, selectedSection, reportMonth);
            setReportData(summary);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [selectedClass, selectedSection, reportMonth]);

    useEffect(() => {
        if (viewMode === 'weekly' && selectedClass && selectedSection) loadWeekData();
    }, [viewMode, loadWeekData]);

    useEffect(() => {
        if (viewMode === 'report' && selectedClass && selectedSection) loadReport();
    }, [viewMode, loadReport]);

    const navigateWeek = (dir) => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + dir * 7);
        setSelectedDate(d.toISOString().split('T')[0]);
    };

    const handleClassChange = (classId) => {
        setSelectedClass(classId);
        const first = scope.find(s => s.class_id === classId);
        const secId = first?.section_id || '';
        const subId = first?.subject_id || '';
        setSelectedSection(secId);
        setSelectedSubject(subId);
        if (secId && subId) loadStudents(classId, secId, subId, selectedDate);
        setSaved(false);
    };
    const handleSectionChange = (sectionId) => {
        setSelectedSection(sectionId);
        const first = scope.find(s => s.class_id === selectedClass && s.section_id === sectionId);
        const subId = first?.subject_id || '';
        setSelectedSubject(subId);
        if (subId) loadStudents(selectedClass, sectionId, subId, selectedDate);
        setSaved(false);
    };
    const handleSubjectChange = (subjectId) => {
        setSelectedSubject(subjectId);
        if (selectedClass && selectedSection && subjectId) loadStudents(selectedClass, selectedSection, subjectId, selectedDate);
        setSaved(false);
    };

    const toggleStatus = (id, newStatus) => {
        setStudents(current => current.map(s => s.id === id ? { ...s, status: newStatus } : s));
        setSaved(false);
    };

    const markAllPresent = () => {
        setStudents(current => current.map(s => ({ ...s, status: 'Present' })));
        setSaved(false);
    };

    const handleSave = async () => {
        try {
            await saveAttendance(students.map(s => ({
                student_id: s.id,
                class_id: selectedClass,
                section_id: selectedSection,
                subject_id: selectedSubject,
                date: selectedDate,
                status: s.status,
                marked_by: user?.teacher_id,
            })));
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (e) { alert(e.message || 'Failed to save'); }
    };

    const filteredStudents = students.filter(s =>
        !search || s.name.toLowerCase().includes(search.toLowerCase())
    );

    const stats = useMemo(() => ({
        present: students.filter(s => s.status === 'Present').length,
        absent: students.filter(s => s.status === 'Absent').length,
        late: students.filter(s => s.status === 'Late').length,
        halfDay: students.filter(s => s.status === 'Half-Day').length,
    }), [students]);

    const currentScopeLabel = scope.find(s => s.class_id === selectedClass && s.section_id === selectedSection && s.subject_id === selectedSubject);

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Mark Attendance</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {currentScopeLabel?.class_name || ''}
                        {selectedSection ? ` (${currentScopeLabel?.section_name || ''})` : ''}
                        {selectedSubject ? ` • ${currentScopeLabel?.subject_name || ''}` : ''}
                    </p>
                </div>
                {/* View Mode Tabs */}
                <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-0.5">
                    {[
                        { key: 'daily', label: 'Daily', icon: CalendarDays },
                        { key: 'weekly', label: 'Weekly', icon: BarChart3 },
                        { key: 'report', label: 'Report', icon: Printer },
                    ].map(tab => (
                        <button key={tab.key} onClick={() => setViewMode(tab.key)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${viewMode === tab.key ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                            <tab.icon className="w-3.5 h-3.5" /> {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                <select value={selectedClass} onChange={(e) => handleClassChange(e.target.value)} className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white font-medium">
                    {[...new Map(scope.map(s => [s.class_id, { id: s.class_id, name: s.class_name }])).values()].map(cls => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                </select>
                <select value={selectedSection} onChange={(e) => handleSectionChange(e.target.value)} className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white font-medium">
                    {scope.filter(s => s.class_id === selectedClass).map(s => (
                        <option key={s.section_id} value={s.section_id}>{s.section_name}</option>
                    ))}
                </select>
                <select value={selectedSubject} onChange={(e) => handleSubjectChange(e.target.value)} className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white font-medium">
                    {scope.filter(s => s.class_id === selectedClass && s.section_id === selectedSection).map(s => (
                        <option key={s.subject_id} value={s.subject_id}>{s.subject_name}</option>
                    ))}
                </select>
                {viewMode === 'daily' && (
                    <div className="relative">
                        <CalendarDays className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input type="date" value={selectedDate} onChange={(e) => { setSelectedDate(e.target.value); if (selectedClass && selectedSection && selectedSubject) loadStudents(selectedClass, selectedSection, selectedSubject, e.target.value); }} className="pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                    </div>
                )}
                {viewMode === 'report' && (
                    <input type="month" value={reportMonth} onChange={(e) => { setReportMonth(e.target.value); }}
                        className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white font-medium" />
                )}
            </div>

            {/* ========== DAILY VIEW ========== */}
            {viewMode === 'daily' && (
                <>
                    {/* Lock warning for past dates */}
                    {!isToday && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
                            <Lock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-amber-800">Attendance Locked</p>
                                <p className="text-xs text-amber-600 mt-0.5">Attendance for past dates is automatically locked. Only admins can modify past attendance.</p>
                            </div>
                        </div>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                            { label: 'Present', value: stats.present, color: 'bg-emerald-50 text-emerald-600', icon: Check },
                            { label: 'Absent', value: stats.absent, color: 'bg-red-50 text-red-600', icon: XIcon },
                            { label: 'Late', value: stats.late, color: 'bg-amber-50 text-amber-600', icon: Clock },
                            { label: 'Half Day', value: stats.halfDay, color: 'bg-blue-50 text-blue-600', icon: CalendarDays },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}><stat.icon className="w-5 h-5" /></div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                                    <p className="text-xs text-gray-400 font-medium">{stat.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                            <div className="relative">
                                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search students..." className="w-full sm:w-72 pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                            </div>
                            <div className="flex gap-2">
                                <button onClick={markAllPresent} disabled={!isToday} className={`px-4 py-2.5 rounded-xl text-sm font-medium border ${isToday ? 'border-gray-200 text-gray-600 hover:bg-gray-50' : 'border-gray-100 text-gray-300 cursor-not-allowed'}`}>Mark All Present</button>
                                <button onClick={handleSave} disabled={!isToday} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all ${!isToday ? 'bg-gray-300 cursor-not-allowed' : saved ? 'bg-emerald-500' : 'bg-primary hover:bg-primary/90'}`}>
                                    {saved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : !isToday ? <><Lock className="w-4 h-4" /> Locked</> : <><Save className="w-4 h-4" /> Save</>}
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-gray-50/80 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            <th className="py-3 px-5 w-16">Roll</th>
                                            <th className="py-3 px-5">Student Name</th>
                                            <th className="py-3 px-5 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredStudents.map((student) => (
                                            <tr key={student.id} className={`hover:bg-gray-50/50 transition-colors ${student.status === 'Absent' ? 'bg-red-50/30' : ''}`}>
                                                <td className="py-3 px-5 font-bold text-gray-400 text-sm">{student.roll_number}</td>
                                                <td className="py-3 px-5 text-sm font-medium text-gray-800">{student.name}</td>
                                                <td className="py-3 px-5">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {STATUS_KEYS.map(status => {
                                                            const cfg = STATUS_CONFIG[status];
                                                            const active = student.status === status;
                                                            return (
                                                                <button key={status} onClick={() => toggleStatus(student.id, status)} disabled={!isToday}
                                                                    className={`w-10 h-10 rounded-xl text-xs font-bold transition-all ${!isToday ? 'opacity-50 cursor-not-allowed ' : ''}${active ? `${cfg.bg} ${cfg.text} shadow-lg` : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                                                                    {cfg.label}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* ========== WEEKLY CALENDAR GRID VIEW ========== */}
            {viewMode === 'weekly' && (
                <>
                    <div className="flex items-center justify-between">
                        <button onClick={() => navigateWeek(-1)} className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium bg-white border border-gray-200 hover:bg-gray-50 transition-colors">
                            <ChevronLeft className="w-4 h-4" /> Prev Week
                        </button>
                        <div className="text-center">
                            <p className="text-sm font-bold text-gray-900">
                                {new Date(weekDates[0]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {new Date(weekDates[6]).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                            <p className="text-xs text-gray-400">Weekly Attendance Overview</p>
                        </div>
                        <button onClick={() => navigateWeek(1)} className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium bg-white border border-gray-200 hover:bg-gray-50 transition-colors">
                            Next Week <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        {loading ? (
                            <div className="flex items-center justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
                        ) : weekStudents.length === 0 ? (
                            <div className="text-center py-16 text-gray-400">
                                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p className="font-medium">No students found</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100">
                                            <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 w-12">Roll</th>
                                            <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider sticky left-12 bg-gray-50 z-10 min-w-[140px]">Student</th>
                                            {weekDates.map((date, i) => {
                                                const isCurrentDay = date === new Date().toISOString().split('T')[0];
                                                return (
                                                    <th key={date} className={`py-3 px-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[70px] ${isCurrentDay ? 'bg-primary/10 text-primary' : 'text-gray-500'}`}>
                                                        <div>{DAY_LABELS[i]}</div>
                                                        <div className="text-[10px] font-normal mt-0.5">{new Date(date).getDate()}</div>
                                                    </th>
                                                );
                                            })}
                                            <th className="py-3 px-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">%</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {weekStudents.map(student => {
                                            const att = weekAttendance[student.enrollment_id] || {};
                                            const daysPresent = weekDates.filter(d => att[d] === 'Present' || att[d] === 'Late').length;
                                            const daysMarked = weekDates.filter(d => att[d]).length;
                                            const pct = daysMarked > 0 ? Math.round((daysPresent / daysMarked) * 100) : null;
                                            return (
                                                <tr key={student.enrollment_id} className="hover:bg-gray-50/50">
                                                    <td className="py-3 px-4 font-bold text-gray-400 text-xs sticky left-0 bg-white z-10">{student.roll_number}</td>
                                                    <td className="py-3 px-4 font-medium text-gray-800 text-sm sticky left-12 bg-white z-10 truncate max-w-[160px]">{student.name}</td>
                                                    {weekDates.map(date => {
                                                        const status = att[date];
                                                        const isCurrentDay = date === new Date().toISOString().split('T')[0];
                                                        if (!status) {
                                                            return (
                                                                <td key={date} className={`py-3 px-3 text-center ${isCurrentDay ? 'bg-primary/5' : ''}`}>
                                                                    <span className="text-gray-200 text-xs">—</span>
                                                                </td>
                                                            );
                                                        }
                                                        const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Present;
                                                        return (
                                                            <td key={date} className={`py-3 px-3 text-center ${isCurrentDay ? 'bg-primary/5' : ''}`}>
                                                                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold ${cfg.bg} ${cfg.text}`}>
                                                                    {cfg.label}
                                                                </span>
                                                            </td>
                                                        );
                                                    })}
                                                    <td className="py-3 px-4 text-center">
                                                        {pct !== null ? (
                                                            <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold ${pct >= 80 ? 'bg-emerald-100 text-emerald-700' : pct >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                                                {pct}%
                                                            </span>
                                                        ) : <span className="text-gray-300 text-xs">—</span>}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-4 justify-center">
                        {STATUS_KEYS.map(status => {
                            const cfg = STATUS_CONFIG[status];
                            return (
                                <div key={status} className="flex items-center gap-1.5">
                                    <span className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                                    <span className="text-xs text-gray-500">{status}</span>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* ========== MONTHLY REPORT VIEW ========== */}
            {viewMode === 'report' && (
                <>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-gray-900">
                                Monthly Attendance Report — {new Date(reportMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </h3>
                            <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 transition-colors">
                                <Printer className="w-3.5 h-3.5" /> Print Report
                            </button>
                        </div>
                        {loading ? (
                            <div className="flex items-center justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
                        ) : reportData.length === 0 ? (
                            <div className="text-center py-16 text-gray-400">
                                <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p className="font-medium">No attendance data found</p>
                                <p className="text-xs mt-1">Select a class and month to view report</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            <th className="py-3 px-4 text-left">Roll</th>
                                            <th className="py-3 px-4 text-left">Student Name</th>
                                            <th className="py-3 px-4 text-center">Present</th>
                                            <th className="py-3 px-4 text-center">Absent</th>
                                            <th className="py-3 px-4 text-center">Late</th>
                                            <th className="py-3 px-4 text-center">Half Day</th>
                                            <th className="py-3 px-4 text-center">Total Days</th>
                                            <th className="py-3 px-4 text-center">Attendance %</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {reportData.map(r => (
                                            <tr key={r.enrollment_id} className="hover:bg-gray-50/50">
                                                <td className="py-3 px-4 font-bold text-gray-400">{r.roll_number}</td>
                                                <td className="py-3 px-4 font-medium text-gray-800">{r.name}</td>
                                                <td className="py-3 px-4 text-center"><span className="font-semibold text-emerald-600">{r.present}</span></td>
                                                <td className="py-3 px-4 text-center"><span className="font-semibold text-red-600">{r.absent}</span></td>
                                                <td className="py-3 px-4 text-center"><span className="font-semibold text-amber-600">{r.late}</span></td>
                                                <td className="py-3 px-4 text-center"><span className="font-semibold text-blue-600">{r.halfDay}</span></td>
                                                <td className="py-3 px-4 text-center font-bold text-gray-700">{r.total}</td>
                                                <td className="py-3 px-4 text-center">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${parseFloat(r.percentage) >= 80 ? 'bg-emerald-100 text-emerald-700' : parseFloat(r.percentage) >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                                        {r.percentage}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default TeacherAttendance;
