import React, { useState, useMemo, useEffect } from 'react';
import { Save, Search, Check, X as XIcon, Clock, CalendarDays, Users, CheckCircle2, Lock, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getTeacherAttendanceScope, getStudentsByClassSection, getAttendanceByDate, saveAttendance } from '../../api';

const TeacherAttendance = () => {
    const { user } = useAuth();
    const [scope, setScope] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [students, setStudents] = useState([]);
    const [search, setSearch] = useState('');
    const [saved, setSaved] = useState(false);
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
        try {
            const studentsList = await getStudentsByClassSection(classId, sectionId);
            const attendance = await getAttendanceByDate(classId, sectionId, subjectId, date);
            const attMap = Object.fromEntries((attendance || []).map(a => [a.student_id, a.status]));
            setStudents(studentsList.map(s => ({
                ...s,
                status: attMap[s.id] || 'Present',
            })));
        } catch (e) { /* ignore */ }
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

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Mark Attendance</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {scope.find(s => s.class_id === selectedClass && s.section_id === selectedSection && s.subject_id === selectedSubject)?.class_name || ''}
                        {selectedSection ? ` (${scope.find(s => s.class_id === selectedClass && s.section_id === selectedSection && s.subject_id === selectedSubject)?.section_name || ''})` : ''}
                        {selectedSubject ? ` • ${scope.find(s => s.class_id === selectedClass && s.section_id === selectedSection && s.subject_id === selectedSubject)?.subject_name || ''}` : ''}
                        {" "}• {new Date(selectedDate).toLocaleDateString('en-NP', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={markAllPresent} disabled={!isToday} className={`px-4 py-2.5 rounded-xl text-sm font-medium border ${isToday ? 'border-gray-200 text-gray-600 hover:bg-gray-50' : 'border-gray-100 text-gray-300 cursor-not-allowed'}`}>Mark All Present</button>
                    <button onClick={handleSave} disabled={!isToday} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all ${!isToday ? 'bg-gray-300 cursor-not-allowed' : saved ? 'bg-emerald-500' : 'bg-primary hover:bg-primary/90'}`}>
                        {saved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : !isToday ? <><Lock className="w-4 h-4" /> Locked</> : <><Save className="w-4 h-4" /> Save</>}
                    </button>
                </div>
            </div>

            {/* Lock warning for past dates */}
            {!isToday && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
                    <Lock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-amber-800">Attendance Locked</p>
                        <p className="text-xs text-amber-600 mt-0.5">Attendance for past dates is automatically locked. Only admins can modify past attendance. You can only view records for this date.</p>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
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
                <div className="relative">
                    <CalendarDays className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input type="date" value={selectedDate} onChange={(e) => { setSelectedDate(e.target.value); if (selectedClass && selectedSection && selectedSubject) loadStudents(selectedClass, selectedSection, selectedSubject, e.target.value); }} className="pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
            </div>

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
                <div className="p-4 border-b border-gray-100">
                    <div className="relative">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search students..." className="w-full sm:w-72 pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                    </div>
                </div>

                <div className="divide-y divide-gray-50">
                    {filteredStudents.map((student) => (
                        <div key={student.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <span className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center text-sm font-bold">{student.roll_number}</span>
                                <span className="text-sm font-medium text-gray-800">{student.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {[
                                    { status: 'Present', label: 'P', activeClass: 'bg-emerald-500 text-white shadow-lg shadow-emerald-200', inactiveClass: 'bg-gray-100 text-gray-400 hover:bg-emerald-50 hover:text-emerald-500' },
                                    { status: 'Absent', label: 'A', activeClass: 'bg-red-500 text-white shadow-lg shadow-red-200', inactiveClass: 'bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500' },
                                    { status: 'Late', label: 'L', activeClass: 'bg-amber-500 text-white shadow-lg shadow-amber-200', inactiveClass: 'bg-gray-100 text-gray-400 hover:bg-amber-50 hover:text-amber-500' },
                                    { status: 'Half-Day', label: 'H', activeClass: 'bg-blue-500 text-white shadow-lg shadow-blue-200', inactiveClass: 'bg-gray-100 text-gray-400 hover:bg-blue-50 hover:text-blue-500' },
                                ].map(btn => (
                                    <button
                                        key={btn.status}
                                        onClick={() => toggleStatus(student.id, btn.status)}
                                        disabled={!isToday}
                                        className={`w-10 h-10 rounded-xl text-xs font-bold transition-all ${!isToday ? 'opacity-50 cursor-not-allowed ' : ''}${student.status === btn.status ? btn.activeClass : btn.inactiveClass}`}
                                    >
                                        {btn.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TeacherAttendance;
