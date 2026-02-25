import React, { useState, useMemo, useEffect } from 'react';
import { Save, Search, Check, X as XIcon, Clock, CalendarDays, Users, CheckCircle2, Shield, AlertTriangle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getAllClasses, adminGetAttendance, adminSaveAttendance, getClasses } from '../../api';

const AdminAttendance = () => {
    const { user } = useAuth();
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

    useEffect(() => {
        loadClasses();
    }, []);

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
        } catch (e) {
            console.error('Failed to load classes:', e);
        }
    };

    const loadAttendance = async (classId, sectionId, date) => {
        if (!classId || !sectionId || !date) return;
        setLoading(true);
        try {
            const { attendance, students: studentList } = await adminGetAttendance(classId, sectionId, date);
            // Build student list with attendance status
            const attMap = {};
            (attendance || []).forEach(a => {
                if (!attMap[a.enrollment_id]) attMap[a.enrollment_id] = {};
                attMap[a.enrollment_id][a.subject_name || 'General'] = a.status;
            });

            setStudents(studentList.map(s => ({
                ...s,
                status: attMap[s.enrollment_id]?.['General'] ||
                    Object.values(attMap[s.enrollment_id] || {})[0] ||
                    'PRESENT',
            })));
        } catch (e) {
            console.error('Failed to load attendance:', e);
            setStudents([]);
        } finally {
            setLoading(false);
        }
    };

    const handleClassChange = (classId) => {
        setSelectedClass(classId);
        const cls = classes.find(c => c.id === classId);
        const secs = cls?.sectionsList || [{ id: 'default', name: 'A' }];
        setSections(secs);
        if (secs.length > 0) {
            setSelectedSection(secs[0].id);
            loadAttendance(classId, secs[0].id, selectedDate);
        }
        setSaved(false);
    };

    const handleSectionChange = (sectionId) => {
        setSelectedSection(sectionId);
        loadAttendance(selectedClass, sectionId, selectedDate);
        setSaved(false);
    };

    const handleDateChange = (date) => {
        setSelectedDate(date);
        loadAttendance(selectedClass, selectedSection, date);
        setSaved(false);
    };

    const toggleStatus = (id, newStatus) => {
        setStudents(current => current.map(s => s.id === id ? { ...s, status: newStatus } : s));
        setSaved(false);
    };

    const markAllPresent = () => {
        setStudents(current => current.map(s => ({ ...s, status: 'PRESENT' })));
        setSaved(false);
    };

    const markAllAbsent = () => {
        setStudents(current => current.map(s => ({ ...s, status: 'ABSENT' })));
        setSaved(false);
    };

    const handleSave = async () => {
        try {
            await adminSaveAttendance(students.map(s => ({
                student_id: s.id,
                class_id: selectedClass,
                section_id: selectedSection,
                subject_id: null,
                date: selectedDate,
                status: s.status,
                marked_by: user?.id,
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
        present: students.filter(s => s.status === 'PRESENT').length,
        absent: students.filter(s => s.status === 'ABSENT').length,
        late: students.filter(s => s.status === 'LATE').length,
        halfDay: students.filter(s => s.status === 'HALF_DAY').length,
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
                        {selectedClassName} {selectedSectionName ? `(${selectedSectionName})` : ''} •{' '}
                        {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        {!isToday && <span className="ml-2 text-amber-600 font-semibold">• Override Mode</span>}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={markAllPresent} className="px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50">Mark All Present</button>
                    <button onClick={markAllAbsent} className="px-4 py-2.5 rounded-xl text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50">Mark All Absent</button>
                    <button onClick={handleSave} disabled={students.length === 0} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all ${students.length === 0 ? 'bg-gray-300 cursor-not-allowed' : saved ? 'bg-emerald-500' : 'bg-primary hover:bg-primary/90'}`}>
                        {saved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Override</>}
                    </button>
                </div>
            </div>

            {/* Admin override notice for past dates */}
            {!isToday && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-amber-800">Admin Override Mode</p>
                        <p className="text-xs text-amber-600 mt-0.5">You are modifying attendance for a past date. This action is logged for audit purposes. Teachers cannot modify attendance for this date.</p>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <select value={selectedClass} onChange={(e) => handleClassChange(e.target.value)} className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white font-medium">
                    {classes.map(cls => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                </select>
                <select value={selectedSection} onChange={(e) => handleSectionChange(e.target.value)} className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white font-medium">
                    {sections.map(sec => (
                        <option key={sec.id} value={sec.id}>{sec.name}</option>
                    ))}
                </select>
                <div className="relative">
                    <CalendarDays className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input type="date" value={selectedDate} onChange={(e) => handleDateChange(e.target.value)} className="pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
                <button onClick={() => loadAttendance(selectedClass, selectedSection, selectedDate)} className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" /> Refresh
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {[
                    { label: 'Total', value: stats.total, color: 'bg-gray-50 text-gray-600', icon: Users },
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

            {/* Student List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                    <div className="relative">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or roll number..." className="w-full sm:w-72 pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : filteredStudents.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="font-medium">No students found</p>
                        <p className="text-xs mt-1">Select a class and date to view attendance</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {filteredStudents.map((student) => (
                            <div key={student.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center text-sm font-bold">{student.roll_number || '–'}</span>
                                    <span className="text-sm font-medium text-gray-800">{student.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {[
                                        { status: 'PRESENT', label: 'P', activeClass: 'bg-emerald-500 text-white shadow-lg shadow-emerald-200', inactiveClass: 'bg-gray-100 text-gray-400 hover:bg-emerald-50 hover:text-emerald-500' },
                                        { status: 'ABSENT', label: 'A', activeClass: 'bg-red-500 text-white shadow-lg shadow-red-200', inactiveClass: 'bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500' },
                                        { status: 'LATE', label: 'L', activeClass: 'bg-amber-500 text-white shadow-lg shadow-amber-200', inactiveClass: 'bg-gray-100 text-gray-400 hover:bg-amber-50 hover:text-amber-500' },
                                        { status: 'HALF_DAY', label: 'H', activeClass: 'bg-blue-500 text-white shadow-lg shadow-blue-200', inactiveClass: 'bg-gray-100 text-gray-400 hover:bg-blue-50 hover:text-blue-500' },
                                    ].map(btn => (
                                        <button
                                            key={btn.status}
                                            onClick={() => toggleStatus(student.id, btn.status)}
                                            className={`w-10 h-10 rounded-xl text-xs font-bold transition-all ${student.status === btn.status ? btn.activeClass : btn.inactiveClass}`}
                                        >
                                            {btn.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminAttendance;
