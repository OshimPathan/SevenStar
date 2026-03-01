import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Save, Search, Check, X as XIcon, Clock, CalendarDays, Users, CheckCircle2, Shield, AlertTriangle, RefreshCw, ChevronLeft, ChevronRight, BarChart3, Printer, Download, Calendar, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getAllClasses, adminGetAttendance, adminSaveAttendance, getClasses, getAttendanceForWeek, getAttendanceReport } from '../../api';

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
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    return Array.from({ length: 7 }, (_, i) => {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        return date.toISOString().split('T')[0];
    });
};

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/* ─── Mini Calendar Component ─── */
const MiniCalendar = ({ selectedDate, onSelectDate, currentMonthDate, onMonthChange }) => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const today = new Date().toISOString().split('T')[0];

    const weeks = [];
    let day = 1 - (firstDay === 0 ? 6 : firstDay - 1); // Start from Monday
    for (let w = 0; w < 6; w++) {
        const week = [];
        for (let d = 0; d < 7; d++) {
            if (day < 1) {
                week.push({ day: daysInPrevMonth + day, inMonth: false, date: null });
            } else if (day > daysInMonth) {
                week.push({ day: day - daysInMonth, inMonth: false, date: null });
            } else {
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                week.push({ day, inMonth: true, date: dateStr });
            }
            day++;
        }
        weeks.push(week);
        if (day > daysInMonth) break;
    }

    const monthName = currentMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
                <button onClick={() => onMonthChange(-1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-primary/10 text-primary transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">{monthName}</h3>
                <button onClick={() => onMonthChange(1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-primary/10 text-primary transition-colors">
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
            <div className="grid grid-cols-7 gap-px">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                    <div key={d} className="text-[10px] font-bold text-gray-400 text-center py-1.5">{d}</div>
                ))}
                {weeks.flat().map((cell, i) => {
                    const isSelected = cell.date === selectedDate;
                    const isToday = cell.date === today;
                    return (
                        <button key={i} disabled={!cell.inMonth}
                            onClick={() => cell.date && onSelectDate(cell.date)}
                            className={`w-8 h-8 mx-auto text-xs font-medium rounded-lg transition-all flex items-center justify-center
                                ${!cell.inMonth ? 'text-gray-200 cursor-default' : ''}
                                ${cell.inMonth && !isSelected && !isToday ? 'text-gray-700 hover:bg-gray-100' : ''}
                                ${isSelected ? 'bg-primary text-white font-bold shadow-md' : ''}
                                ${isToday && !isSelected ? 'bg-accent/20 text-accent font-bold ring-1 ring-accent/30' : ''}
                            `}>
                            {cell.day}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

const AdminAttendance = () => {
    const { user } = useAuth();
    const [viewMode, setViewMode] = useState('daily');
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [students, setStudents] = useState([]);
    const [search, setSearch] = useState('');
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const isToday = selectedDate === new Date().toISOString().slice(0, 10);

    // Weekly view state
    const [weekStudents, setWeekStudents] = useState([]);
    const [weekAttendance, setWeekAttendance] = useState({});
    const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);

    // Report state
    const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7));
    const [reportData, setReportData] = useState([]);
    const [calendarMonth, setCalendarMonth] = useState(new Date());

    const handleCalendarMonthChange = (dir) => {
        setCalendarMonth(prev => {
            const d = new Date(prev);
            d.setMonth(d.getMonth() + dir);
            return d;
        });
    };

    useEffect(() => { loadClasses(); }, []);

    const loadClasses = async () => {
        try {
            const result = await getClasses();
            const cls = result.classes || [];
            setClasses(cls);
            if (cls.length > 0) {
                const first = cls[0];
                setSelectedClass(first.id);
                const secs = first.sectionsList || [{ id: 'default', name: 'A' }];
                setSections(secs);
                if (secs.length > 0) {
                    setSelectedSection(secs[0].id);
                    loadAttendance(first.id, secs[0].id, selectedDate);
                }
            }
        } catch (e) { console.error('Failed to load classes:', e); }
    };

    const loadAttendance = async (classId, sectionId, date) => {
        if (!classId || !sectionId || !date) return;
        setLoading(true);
        try {
            const { attendance, students: studentList } = await adminGetAttendance(classId, sectionId, date);
            const attMap = {};
            (attendance || []).forEach(a => {
                if (!attMap[a.enrollment_id]) attMap[a.enrollment_id] = {};
                attMap[a.enrollment_id][a.subject_name || 'General'] = a.status;
            });
            setStudents(studentList.map(s => ({
                ...s,
                status: attMap[s.enrollment_id]?.['General'] || Object.values(attMap[s.enrollment_id] || {})[0] || 'Present',
            })));
        } catch (e) { console.error('Failed to load attendance:', e); setStudents([]); }
        finally { setLoading(false); }
    };

    const loadWeekData = useCallback(async () => {
        if (!selectedClass || !selectedSection) return;
        setLoading(true);
        try {
            const { students: sList, attendance: att } = await getAttendanceForWeek(
                selectedClass, selectedSection, weekDates[0], weekDates[6]
            );
            setWeekStudents(sList);
            setWeekAttendance(att);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [selectedClass, selectedSection, weekDates]);

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
        const cls = classes.find(c => c.id === classId);
        const secs = cls?.sectionsList || [{ id: 'default', name: 'A' }];
        setSections(secs);
        if (secs.length > 0) {
            setSelectedSection(secs[0].id);
            if (viewMode === 'daily') loadAttendance(classId, secs[0].id, selectedDate);
        }
        setSaved(false);
    };

    const handleSectionChange = (sectionId) => {
        setSelectedSection(sectionId);
        if (viewMode === 'daily') loadAttendance(selectedClass, sectionId, selectedDate);
        setSaved(false);
    };

    const handleDateChange = (date) => {
        setSelectedDate(date);
        if (viewMode === 'daily') loadAttendance(selectedClass, selectedSection, date);
        setSaved(false);
    };

    const toggleStatus = (id, newStatus) => {
        setStudents(current => current.map(s => s.id === id ? { ...s, status: newStatus } : s));
        setSaved(false);
    };
    const markAllPresent = () => { setStudents(current => current.map(s => ({ ...s, status: 'Present' }))); setSaved(false); };
    const markAllAbsent = () => { setStudents(current => current.map(s => ({ ...s, status: 'Absent' }))); setSaved(false); };

    const handleSave = async () => {
        try {
            await adminSaveAttendance(students.map(s => ({
                student_id: s.id, class_id: selectedClass, section_id: selectedSection,
                subject_id: null, date: selectedDate, status: s.status, marked_by: user?.id,
            })));
            setSaved(true);
            setToast({ message: 'Attendance updated successfully (Admin Override)', type: 'success' });
            setTimeout(() => { setSaved(false); setToast(null); }, 3000);
        } catch (e) {
            setToast({ message: e.message || 'Failed to save attendance', type: 'error' });
            setTimeout(() => setToast(null), 4000);
        }
    };

    const filteredStudents = students.filter(s =>
        !search || s.name.toLowerCase().includes(search.toLowerCase()) || String(s.roll_number).includes(search)
    );

    const stats = useMemo(() => ({
        total: students.length,
        present: students.filter(s => s.status === 'Present').length,
        absent: students.filter(s => s.status === 'Absent').length,
        late: students.filter(s => s.status === 'Late').length,
        halfDay: students.filter(s => s.status === 'Half-Day').length,
    }), [students]);

    const selectedClassName = classes.find(c => c.id === selectedClass)?.name || '';
    const selectedSectionName = sections.find(s => s.id === selectedSection)?.name || '';

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                    {toast.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                    {toast.message}
                    <button onClick={() => setToast(null)} className="ml-2"><XIcon className="w-4 h-4" /></button>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold text-gray-900">Manage Attendance</h1>
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full border border-blue-200 flex items-center gap-1">
                            <Shield className="w-3 h-3" /> Admin
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                        {selectedClassName} {selectedSectionName ? `(${selectedSectionName})` : ''}
                        {viewMode === 'daily' && <> • {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</>}
                        {!isToday && viewMode === 'daily' && <span className="ml-2 text-amber-600 font-semibold">• Override Mode</span>}
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
                    {classes.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
                </select>
                <select value={selectedSection} onChange={(e) => handleSectionChange(e.target.value)} className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white font-medium">
                    {sections.map(sec => <option key={sec.id} value={sec.id}>{sec.name}</option>)}
                </select>
                {viewMode === 'daily' && (
                    <>
                        <div className="relative">
                            <CalendarDays className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input type="date" value={selectedDate} onChange={(e) => handleDateChange(e.target.value)} className="pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                        </div>
                        <button onClick={() => loadAttendance(selectedClass, selectedSection, selectedDate)} className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2">
                            <RefreshCw className="w-4 h-4" /> Refresh
                        </button>
                    </>
                )}
                {viewMode === 'report' && (
                    <input type="month" value={reportMonth} onChange={(e) => setReportMonth(e.target.value)}
                        className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white font-medium" />
                )}
            </div>

            {/* ========== DAILY VIEW ========== */}
            {viewMode === 'daily' && (
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left Sidebar: Calendar + Quick Actions */}
                    <div className="lg:w-64 shrink-0 space-y-4">
                        <MiniCalendar
                            selectedDate={selectedDate}
                            onSelectDate={handleDateChange}
                            currentMonthDate={calendarMonth}
                            onMonthChange={handleCalendarMonthChange}
                        />

                        {/* Quick Action Buttons */}
                        <div className="space-y-2">
                            <button onClick={() => { setViewMode('report'); setReportMonth(selectedDate.slice(0, 7)); }}
                                className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-primary border-2 border-primary/20 hover:bg-primary/5 transition-colors">
                                <BarChart3 className="w-4 h-4" /> Generate Attendance Report
                            </button>
                            <button onClick={() => window.print()}
                                className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-gray-600 border-2 border-gray-200 hover:bg-gray-50 transition-colors">
                                <Printer className="w-4 h-4" /> Print Current View
                            </button>
                            <button onClick={() => setViewMode('weekly')}
                                className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-gray-600 border-2 border-gray-200 hover:bg-gray-50 transition-colors">
                                <Calendar className="w-4 h-4" /> Generate Monthly View
                            </button>
                        </div>

                        {/* Status Legend */}
                        <div className="bg-white rounded-xl border border-gray-100 p-3 space-y-2">
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status Legend</h4>
                            {STATUS_KEYS.map(status => {
                                const cfg = STATUS_CONFIG[status];
                                const count = students.filter(s => s.status === status).length;
                                return (
                                    <div key={status} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-6 h-6 rounded text-[10px] font-bold flex items-center justify-center ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                                            <span className="text-xs text-gray-600">{status}</span>
                                        </div>
                                        <span className="text-xs font-bold text-gray-500">{count}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right: Main Content */}
                    <div className="flex-1 space-y-4">
                        {!isToday && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-semibold text-amber-800">Admin Override Mode</p>
                                    <p className="text-xs text-amber-600 mt-0.5">You are modifying attendance for a past date. This action is logged for audit purposes.</p>
                                </div>
                            </div>
                        )}

                        {/* Stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                            {[
                                { label: 'Total', value: stats.total, color: 'bg-gray-50 text-gray-600', icon: Users },
                                { label: 'Present', value: stats.present, color: 'bg-emerald-50 text-emerald-600', icon: Check },
                                { label: 'Absent', value: stats.absent, color: 'bg-red-50 text-red-600', icon: XIcon },
                                { label: 'Late', value: stats.late, color: 'bg-amber-50 text-amber-600', icon: Clock },
                                { label: 'Half Day', value: stats.halfDay, color: 'bg-blue-50 text-blue-600', icon: CalendarDays },
                            ].map((stat, i) => (
                                <div key={i} className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-xl ${stat.color} flex items-center justify-center`}><stat.icon className="w-4 h-4" /></div>
                                    <div>
                                        <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                                        <p className="text-[10px] text-gray-400 font-semibold uppercase">{stat.label}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                                <div className="relative">
                                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or roll number..." className="w-full sm:w-72 pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={markAllPresent} className="px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50">All Present</button>
                                    <button onClick={markAllAbsent} className="px-4 py-2.5 rounded-xl text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50">All Absent</button>
                                    <button onClick={handleSave} disabled={students.length === 0} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all ${students.length === 0 ? 'bg-gray-300 cursor-not-allowed' : saved ? 'bg-emerald-500' : 'bg-primary hover:bg-primary/90'}`}>
                                        {saved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Override</>}
                                    </button>
                                </div>
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
                            ) : filteredStudents.length === 0 ? (
                                <div className="text-center py-16 text-gray-400">
                                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                    <p className="font-medium">No students found</p>
                                    <p className="text-xs mt-1">Select a class and date to view attendance</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-gradient-to-r from-slate-600 to-slate-700 text-xs font-semibold text-white uppercase tracking-wider">
                                                <th className="py-3 px-5 w-16">Roll</th>
                                                <th className="py-3 px-5">Students</th>
                                                {DAY_LABELS.slice(0, -1).map((day, i) => {
                                                    const wd = getWeekDates(selectedDate);
                                                    const dateStr = wd[i];
                                                    const isSelDate = dateStr === selectedDate;
                                                    return (
                                                        <th key={day} className={`py-3 px-2 text-center w-16 ${isSelDate ? 'bg-primary/30' : ''}`}>
                                                            <div className="text-[10px] font-bold">{day}</div>
                                                            <div className="text-[9px] font-normal opacity-70">{dateStr ? new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</div>
                                                        </th>
                                                    );
                                                })}
                                                <th className="py-3 px-5 text-center">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {filteredStudents.map((student) => (
                                                <tr key={student.id} className={`hover:bg-gray-50/50 transition-colors ${student.status === 'Absent' ? 'bg-red-50/30' : ''}`}>
                                                    <td className="py-3 px-5 font-bold text-gray-400 text-sm">{student.roll_number || '–'}</td>
                                                    <td className="py-3 px-5 text-sm font-medium text-gray-800">{student.name}</td>
                                                    {DAY_LABELS.slice(0, -1).map((_, i) => (
                                                        <td key={i} className="py-3 px-2 text-center">
                                                            <span className="text-[10px] text-gray-300 font-medium">
                                                                {i === (new Date(selectedDate).getDay() === 0 ? 6 : new Date(selectedDate).getDay() - 1)
                                                                    ? <span className={`inline-flex w-7 h-7 items-center justify-center rounded-lg text-[10px] font-bold ${STATUS_CONFIG[student.status]?.bg} ${STATUS_CONFIG[student.status]?.text}`}>{STATUS_CONFIG[student.status]?.label}</span>
                                                                    : '—'}
                                                            </span>
                                                        </td>
                                                    ))}
                                                    <td className="py-3 px-5">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            {STATUS_KEYS.map(status => {
                                                                const cfg = STATUS_CONFIG[status];
                                                                const active = student.status === status;
                                                                return (
                                                                    <button key={status} onClick={() => toggleStatus(student.id, status)}
                                                                        className={`w-9 h-9 rounded-xl text-[10px] font-bold transition-all ${active ? `${cfg.bg} ${cfg.text} shadow-lg scale-105` : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
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
                    </div>
                </div>
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
                                                        if (!status) return (
                                                            <td key={date} className={`py-3 px-3 text-center ${isCurrentDay ? 'bg-primary/5' : ''}`}>
                                                                <span className="text-gray-200 text-xs">—</span>
                                                            </td>
                                                        );
                                                        const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Present;
                                                        return (
                                                            <td key={date} className={`py-3 px-3 text-center ${isCurrentDay ? 'bg-primary/5' : ''}`}>
                                                                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                                                            </td>
                                                        );
                                                    })}
                                                    <td className="py-3 px-4 text-center">
                                                        {pct !== null ? (
                                                            <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold ${pct >= 80 ? 'bg-emerald-100 text-emerald-700' : pct >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{pct}%</span>
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
                                            <tr key={r.enrollment_id} className={`hover:bg-gray-50/50 ${parseFloat(r.percentage) < 50 ? 'bg-red-50/30' : ''}`}>
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
                                    <tfoot>
                                        <tr className="bg-gray-50 font-bold border-t-2 border-gray-200">
                                            <td className="py-3 px-4" colSpan={2}>Class Average</td>
                                            <td className="py-3 px-4 text-center text-emerald-600">{reportData.length > 0 ? Math.round(reportData.reduce((s, r) => s + r.present, 0) / reportData.length) : 0}</td>
                                            <td className="py-3 px-4 text-center text-red-600">{reportData.length > 0 ? Math.round(reportData.reduce((s, r) => s + r.absent, 0) / reportData.length) : 0}</td>
                                            <td className="py-3 px-4 text-center text-amber-600">{reportData.length > 0 ? Math.round(reportData.reduce((s, r) => s + r.late, 0) / reportData.length) : 0}</td>
                                            <td className="py-3 px-4 text-center text-blue-600">{reportData.length > 0 ? Math.round(reportData.reduce((s, r) => s + r.halfDay, 0) / reportData.length) : 0}</td>
                                            <td className="py-3 px-4 text-center">{reportData.length > 0 ? Math.round(reportData.reduce((s, r) => s + r.total, 0) / reportData.length) : 0}</td>
                                            <td className="py-3 px-4 text-center">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
                                                    {reportData.length > 0 ? (reportData.reduce((s, r) => s + parseFloat(r.percentage), 0) / reportData.length).toFixed(1) : '0.0'}%
                                                </span>
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminAttendance;
