import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getDashboardStats, getTeacherDashboardStats, getStudentDashboardStats, getStudents } from '../../api';
import { Users, GraduationCap, BookOpen, FileText, TrendingUp, Calendar, CreditCard, ClipboardCheck, Bell, ArrowUpRight, Clock, Loader2, DollarSign, Search, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

/* ─── Stat Card ─── */
const StatCard = ({ title, value, icon, bgColor, iconColor, loading }) => (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all group">
        <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${bgColor} group-hover:scale-105 transition-transform`}>
                <div className={iconColor}>{icon}</div>
            </div>
            <div className="min-w-0 flex-1 pt-1">
                {loading ? (
                    <div className="h-7 w-16 bg-gray-100 rounded animate-pulse"></div>
                ) : (
                    <p className="text-2xl font-black text-gray-900 leading-tight">{value}</p>
                )}
                <p className="text-xs text-gray-400 font-medium mt-1 truncate">{title}</p>
            </div>
        </div>
    </div>
);

/* ─── Donut Center Label ─── */
const CenterLabel = ({ viewBox, total, label }) => {
    const { cx, cy } = viewBox;
    return (
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
            <tspan x={cx} y={cy - 8} className="text-2xl font-black" fill="#1e293b">{total}</tspan>
            <tspan x={cx} y={cy + 14} className="text-xs" fill="#94a3b8">{label}</tspan>
        </text>
    );
};

const AdminDashboard = () => {
    const { user } = useAuth();
    const role = user?.role || 'ADMIN';
    const [stats, setStats] = useState(null);
    const [teacherStats, setTeacherStats] = useState(null);
    const [studentStats, setStudentStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [recentStudents, setRecentStudents] = useState([]);
    const [studentSearch, setStudentSearch] = useState('');
    const [studentPage, setStudentPage] = useState(1);
    const STUDENTS_PER_PAGE = 8;

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                if (role === 'ADMIN') {
                    const [data, studentsRes] = await Promise.all([
                        getDashboardStats(),
                        getStudents().catch(() => ({ students: [] })),
                    ]);
                    setStats(data);
                    setRecentStudents(studentsRes.students || studentsRes || []);
                } else if (role === 'TEACHER' && user?.teacher_id) {
                    const [adminData, tData] = await Promise.all([
                        getDashboardStats(),
                        getTeacherDashboardStats(user.teacher_id),
                    ]);
                    setStats(adminData);
                    setTeacherStats(tData);
                } else if ((role === 'STUDENT' || role === 'PARENT') && user?.student_id) {
                    const [adminData, sData] = await Promise.all([
                        getDashboardStats(),
                        getStudentDashboardStats(user.student_id),
                    ]);
                    setStats(adminData);
                    setStudentStats(sData);
                } else {
                    const data = await getDashboardStats();
                    setStats(data);
                }
            } catch (e) {
                console.error('Dashboard load error:', e);
            }
            setLoading(false);
        };
        loadData();
    }, [role, user?.teacher_id, user?.student_id]);

    const totalStudents = stats?.totalStudents || 0;
    const totalTeachers = stats?.totalTeachers || 0;
    const pendingFees = stats?.pendingFees || 0;
    const liveNotices = stats?.notices || [];
    const liveEvents = stats?.events || [];
    const weeklyAttendance = stats?.weeklyAttendance || [];
    const todayAttPercent = stats?.todayAttendancePercent || 0;
    const totalIncome = (stats?.paidFees || 0);

    // Student gender data for donut
    const maleCount = Array.isArray(recentStudents) ? recentStudents.filter(s => s.gender === 'Male' || s.gender === 'male').length : 0;
    const femaleCount = Array.isArray(recentStudents) ? recentStudents.filter(s => s.gender === 'Female' || s.gender === 'female').length : 0;
    const studentGenderData = [
        { name: 'Female Students', value: femaleCount || 1, color: '#3b82f6' },
        { name: 'Male Students', value: maleCount || 1, color: '#fbbf24' },
    ];

    // Filtered + paginated students
    const filteredStudents = Array.isArray(recentStudents) ? recentStudents.filter(s => {
        if (!studentSearch) return true;
        const q = studentSearch.toLowerCase();
        return (
            s.first_name?.toLowerCase().includes(q) ||
            s.last_name?.toLowerCase().includes(q) ||
            s.admission_number?.toLowerCase().includes(q) ||
            s.roll_number?.toString().includes(q)
        );
    }) : [];
    const totalPages = Math.max(1, Math.ceil(filteredStudents.length / STUDENTS_PER_PAGE));
    const paginatedStudents = filteredStudents.slice((studentPage - 1) * STUDENTS_PER_PAGE, studentPage * STUDENTS_PER_PAGE);

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* ─── Stats Cards ─── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {role === 'ADMIN' && (
                    <>
                        <StatCard loading={loading} title="Total Students" value={totalStudents}
                            icon={<GraduationCap className="w-7 h-7" />}
                            bgColor="bg-orange-50" iconColor="text-orange-500" />
                        <StatCard loading={loading} title="Total Teachers" value={totalTeachers}
                            icon={<Users className="w-7 h-7" />}
                            bgColor="bg-blue-50" iconColor="text-blue-500" />
                        <StatCard loading={loading} title="Today's Attendance" value={todayAttPercent > 0 ? `${todayAttPercent}%` : 'No data'}
                            icon={<ClipboardCheck className="w-7 h-7" />}
                            bgColor="bg-purple-50" iconColor="text-purple-500" />
                        <StatCard loading={loading} title="Total Income" value={`₨${totalIncome.toLocaleString()}`}
                            icon={<DollarSign className="w-7 h-7" />}
                            bgColor="bg-green-50" iconColor="text-green-500" />
                    </>
                )}
                {role === 'TEACHER' && (
                    <>
                        <StatCard loading={loading} title="My Classes" value={teacherStats?.classCount ?? '—'}
                            icon={<BookOpen className="w-7 h-7" />} bgColor="bg-blue-50" iconColor="text-blue-500" />
                        <StatCard loading={loading} title="My Students" value={teacherStats?.studentCount ?? '—'}
                            icon={<GraduationCap className="w-7 h-7" />} bgColor="bg-green-50" iconColor="text-green-500" />
                        <StatCard loading={loading} title="Today's Attendance" value={teacherStats?.todayAttendancePercent > 0 ? `${teacherStats.todayAttendancePercent}%` : 'No data'}
                            icon={<ClipboardCheck className="w-7 h-7" />} bgColor="bg-purple-50" iconColor="text-purple-500" />
                        <StatCard loading={loading} title="My Subjects" value={teacherStats?.subjectCount ?? '—'}
                            icon={<FileText className="w-7 h-7" />} bgColor="bg-orange-50" iconColor="text-orange-500" />
                    </>
                )}
                {(role === 'STUDENT' || role === 'PARENT') && (
                    <>
                        <StatCard loading={loading} title="Class" value={studentStats?.className ?? '—'}
                            icon={<BookOpen className="w-7 h-7" />} bgColor="bg-blue-50" iconColor="text-blue-500" />
                        <StatCard loading={loading} title="Attendance" value={studentStats?.attendancePercent > 0 ? `${studentStats.attendancePercent}%` : '—'}
                            icon={<ClipboardCheck className="w-7 h-7" />} bgColor="bg-green-50" iconColor="text-green-500" />
                        <StatCard loading={loading} title="Overall GPA" value={studentStats?.gpa ?? '—'}
                            icon={<TrendingUp className="w-7 h-7" />} bgColor="bg-purple-50" iconColor="text-purple-500" />
                        <StatCard loading={loading} title="Pending Fees" value={studentStats?.pendingFees > 0 ? `₨ ${studentStats.pendingFees.toLocaleString()}` : '₨ 0'}
                            icon={<CreditCard className="w-7 h-7" />} bgColor="bg-orange-50" iconColor="text-orange-500" />
                    </>
                )}
            </div>

            {/* ─── Row 2: Charts + Notifications (Admin only) ─── */}
            {role === 'ADMIN' && (
                <div className="grid lg:grid-cols-12 gap-5">
                    {/* Attendance Chart */}
                    <div className="lg:col-span-5 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-gray-900">Weekly Attendance</h3>
                            <span className="text-[11px] text-gray-400">Last 6 days</span>
                        </div>
                        {loading ? (
                            <div className="h-[200px] flex items-center justify-center">
                                <Loader2 className="w-7 h-7 text-gray-300 animate-spin" />
                            </div>
                        ) : weeklyAttendance.length > 0 && weeklyAttendance.some(d => d.present > 0 || d.absent > 0) ? (
                            <ResponsiveContainer width="100%" height={200}>
                                <AreaChart data={weeklyAttendance}>
                                    <defs>
                                        <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: 12 }} />
                                    <Area type="monotone" dataKey="present" stroke="#3b82f6" fill="url(#presentGrad)" strokeWidth={2} name="Present" />
                                    <Area type="monotone" dataKey="absent" stroke="#ef4444" fill="transparent" strokeWidth={2} strokeDasharray="4 3" name="Absent" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">No data</div>
                        )}
                    </div>

                    {/* Student Donut Chart */}
                    <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-bold text-gray-900">Students</h3>
                            <button className="text-gray-300 hover:text-gray-500"><MoreHorizontal className="w-4 h-4" /></button>
                        </div>
                        {loading ? (
                            <div className="h-[180px] flex items-center justify-center">
                                <Loader2 className="w-7 h-7 text-gray-300 animate-spin" />
                            </div>
                        ) : (
                            <>
                                <ResponsiveContainer width="100%" height={160}>
                                    <PieChart>
                                        <Pie
                                            data={studentGenderData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={45}
                                            outerRadius={70}
                                            dataKey="value"
                                            paddingAngle={3}
                                            startAngle={90}
                                            endAngle={-270}
                                        >
                                            {studentGenderData.map((entry, idx) => (
                                                <Cell key={idx} fill={entry.color} strokeWidth={0} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="flex justify-center gap-6 mt-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-sm bg-blue-500"></div>
                                        <div>
                                            <p className="text-[11px] text-gray-400">Female</p>
                                            <p className="text-sm font-bold text-gray-700">{femaleCount.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-sm bg-yellow-400"></div>
                                        <div>
                                            <p className="text-[11px] text-gray-400">Male</p>
                                            <p className="text-sm font-bold text-gray-700">{maleCount.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Notifications Panel */}
                    <div className="lg:col-span-4 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
                            <button className="text-gray-300 hover:text-gray-500"><MoreHorizontal className="w-4 h-4" /></button>
                        </div>
                        <div className="space-y-3 max-h-[240px] overflow-y-auto pr-1">
                            {liveNotices.length > 0 ? liveNotices.map((notice, idx) => (
                                <div key={notice.id || idx} className="pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                                    <span className="inline-block text-[10px] font-bold text-white bg-accent px-2 py-0.5 rounded mb-1.5">
                                        {notice.created_at ? new Date(notice.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}
                                    </span>
                                    <p className="text-sm text-gray-800 leading-snug">{notice.title}</p>
                                    <p className="text-[11px] text-gray-400 mt-1">
                                        {notice.created_by_name || 'Admin'} / {notice.created_at ? new Date(notice.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                    </p>
                                </div>
                            )) : (
                                <div className="text-center py-6 text-gray-400">
                                    <Bell className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                                    <p className="text-sm">No notifications</p>
                                </div>
                            )}
                            {liveEvents.length > 0 && liveEvents.map((event, idx) => (
                                <div key={event.id || `ev-${idx}`} className="pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                                    <span className="inline-block text-[10px] font-bold text-white bg-primary px-2 py-0.5 rounded mb-1.5">
                                        {event.start_date ? new Date(event.start_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Upcoming'}
                                    </span>
                                    <p className="text-sm text-gray-800 leading-snug">{event.title}</p>
                                    <p className="text-[11px] text-gray-400 mt-1">{event.location || ''}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Row 3: My Students Table (Admin only) ─── */}
            {role === 'ADMIN' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="p-5 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-gray-900">My Students</h3>
                            <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{filteredStudents.length}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={studentSearch}
                                    onChange={(e) => { setStudentSearch(e.target.value); setStudentPage(1); }}
                                    placeholder="Search by Name, Roll ..."
                                    className="pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 w-56"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/80 border-t border-gray-100">
                                    <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Roll</th>
                                    <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Photo</th>
                                    <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Gender</th>
                                    <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Class</th>
                                    <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Section</th>
                                    <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Guardian</th>
                                    <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Phone</th>
                                    <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider hidden xl:table-cell">Email</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr><td colSpan={9} className="px-4 py-12 text-center">
                                        <Loader2 className="w-6 h-6 text-gray-300 animate-spin mx-auto" />
                                    </td></tr>
                                ) : paginatedStudents.length > 0 ? paginatedStudents.map((student, idx) => (
                                    <tr key={student.id || idx} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="px-4 py-3 text-xs font-mono text-gray-600">
                                            #{student.roll_number || student.admission_number || '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold overflow-hidden">
                                                {student.photo_url ? (
                                                    <img src={student.photo_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    (student.first_name?.[0] || '') + (student.last_name?.[0] || '')
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-sm font-medium text-gray-800">{student.first_name} {student.last_name}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${student.gender === 'Male' || student.gender === 'male' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'}`}>
                                                {student.gender || '—'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-600">{student.classes?.name || student.class_name || '—'}</td>
                                        <td className="px-4 py-3 text-xs text-gray-600 hidden md:table-cell">{student.sections?.name || student.section_name || 'A'}</td>
                                        <td className="px-4 py-3 text-xs text-gray-600 hidden lg:table-cell">{student.father_name || student.guardian_name || '—'}</td>
                                        <td className="px-4 py-3 text-xs text-gray-600 hidden lg:table-cell">{student.phone || student.emergency_phone || '—'}</td>
                                        <td className="px-4 py-3 text-xs text-gray-500 hidden xl:table-cell truncate max-w-[180px]">{student.email || '—'}</td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={9} className="px-4 py-12 text-center text-sm text-gray-400">No students found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination */}
                    {filteredStudents.length > STUDENTS_PER_PAGE && (
                        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-100">
                            <button
                                onClick={() => setStudentPage(p => Math.max(1, p - 1))}
                                disabled={studentPage === 1}
                                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                Previous
                            </button>
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => setStudentPage(page)}
                                    className={`w-8 h-8 text-xs font-bold rounded-lg transition-colors ${studentPage === page ? 'bg-accent text-gray-900' : 'text-gray-500 hover:bg-gray-100'}`}
                                >
                                    {page}
                                </button>
                            ))}
                            <button
                                onClick={() => setStudentPage(p => Math.min(totalPages, p + 1))}
                                disabled={studentPage === totalPages}
                                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ─── Teacher/Student Bottom Row ─── */}
            {role !== 'ADMIN' && (
                <div className="grid lg:grid-cols-2 gap-5">
                    {/* Notices */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                        <h3 className="text-sm font-bold text-gray-900 mb-4">Recent Notices</h3>
                        <div className="space-y-3">
                            {liveNotices.length > 0 ? liveNotices.map((notice) => (
                                <div key={notice.id} className="pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                                    <span className="inline-block text-[10px] font-bold text-white bg-accent px-2 py-0.5 rounded mb-1.5">
                                        {notice.created_at ? new Date(notice.created_at).toLocaleDateString() : ''}
                                    </span>
                                    <p className="text-sm text-gray-800">{notice.title}</p>
                                </div>
                            )) : (
                                <p className="text-sm text-gray-400 text-center py-4">No notices</p>
                            )}
                        </div>
                    </div>
                    {/* Events */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                        <h3 className="text-sm font-bold text-gray-900 mb-4">Upcoming Events</h3>
                        <div className="space-y-3">
                            {liveEvents.length > 0 ? liveEvents.map((event) => (
                                <div key={event.id} className="flex items-start gap-3 pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                                    <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary shrink-0">
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-gray-800 truncate">{event.title}</p>
                                        <p className="text-xs text-gray-400">{event.start_date ? new Date(event.start_date).toLocaleDateString() : ''}</p>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-sm text-gray-400 text-center py-4">No upcoming events</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
