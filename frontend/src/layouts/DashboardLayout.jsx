import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard, Users, BookOpen, GraduationCap,
    Calendar, FileText, LogOut, Menu, X,
    MessageSquareWarning, ClipboardCheck, CreditCard,
    Award, Bell, ChevronDown, ChevronRight, UserCheck, Megaphone, CalendarPlus,
    ImagePlus, LibraryBig, Star, UserPlus, ClipboardList, Settings, DollarSign, BarChart3,
    Bus, Package, Clock, Banknote, Search
} from 'lucide-react';

/* ─── Sidebar Link ─── */
const SidebarLink = ({ to, icon, label, onClick }) => (
    <NavLink
        to={to}
        end
        onClick={onClick}
        className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 text-sm ${isActive
                ? 'sidebar-link-active text-accent'
                : 'text-white/55 hover:bg-white/[0.06] hover:text-white/90'
            }`
        }
    >
        {icon}
        <span>{label}</span>
    </NavLink>
);

/* ─── Collapsible Group ─── */
const SidebarGroup = ({ label, icon, children, defaultOpen = false }) => {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div>
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center justify-between w-full px-4 py-2.5 rounded-lg text-sm font-medium text-white/55 hover:bg-white/[0.06] hover:text-white/90 transition-all"
            >
                <span className="flex items-center gap-3">
                    {icon}
                    <span>{label}</span>
                </span>
                {open ? <ChevronDown className="w-4 h-4 text-white/30" /> : <ChevronRight className="w-4 h-4 text-white/30" />}
            </button>
            {open && <div className="ml-4 pl-3 border-l border-white/[0.08] mt-1 space-y-0.5">{children}</div>}
        </div>
    );
};

/* ─── Breadcrumb ─── */
const Breadcrumb = () => {
    const location = useLocation();
    const parts = location.pathname.split('/').filter(Boolean);

    const labelMap = {
        dashboard: 'Home',
        students: 'Students',
        teachers: 'Teachers',
        classes: 'Classes & Subjects',
        parents: 'Parents',
        attendance: 'Attendance',
        exams: 'Exams & Marks',
        'manage-notices': 'Notices',
        'manage-events': 'Events',
        'manage-gallery': 'Gallery',
        'manage-programs': 'Programs',
        'manage-exams': 'Manage Exams',
        'manage-fees': 'Fee Management',
        'manage-attendance': 'Manage Attendance',
        'class-analytics': 'Class Analytics',
        'class-browser': 'Class Browser',
        'manage-reviews': 'Reviews',
        admissions: 'Admissions',
        accounting: 'Accounting',
        library: 'Library',
        transport: 'Transport',
        inventory: 'Inventory',
        timetable: 'Timetable',
        salary: 'Salary',
        settings: 'Settings',
        results: 'Results',
        fees: 'Fee Details',
        notices: 'Notices',
        subjects: 'My Subjects',
        routine: 'My Routine',
        assignments: 'Assignments',
        'assignments-manage': 'Assignments',
        'my-students': 'My Students',
    };

    return (
        <div className="flex items-center gap-1.5 text-sm text-gray-400">
            {parts.map((part, idx) => (
                <React.Fragment key={idx}>
                    {idx > 0 && <span className="text-gray-300">›</span>}
                    <span className={idx === parts.length - 1 ? 'text-primary font-semibold' : ''}>
                        {labelMap[part] || part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' ')}
                    </span>
                </React.Fragment>
            ))}
        </div>
    );
};

/* ─── Page Title Map ─── */
const getPageTitle = (pathname, role) => {
    const last = pathname.split('/').filter(Boolean).pop();
    const titles = {
        dashboard: role === 'ADMIN' ? 'Admin Dashboard' : role === 'TEACHER' ? 'Teacher Dashboard' : 'Student Dashboard',
        students: 'Students',
        teachers: 'Teachers',
        classes: 'Classes & Subjects',
        parents: 'Parents',
        attendance: 'Attendance',
        exams: 'Exams & Marks',
        'manage-notices': 'Notices',
        'manage-events': 'Events',
        'manage-exams': 'Manage Exams',
        'manage-fees': 'Fee Management',
        'manage-gallery': 'Gallery',
        'manage-programs': 'Programs & Syllabus',
        'manage-attendance': 'Manage Attendance',
        'class-analytics': 'Class Analytics',
        'class-browser': 'Class Browser',
        library: 'Library',
        transport: 'Transport',
        inventory: 'Inventory',
        timetable: 'Timetable',
        salary: 'Salary',
        settings: 'Settings',
        results: 'Results',
        fees: 'Fee Details',
    };
    return titles[last] || 'Dashboard';
};

/* ─── Main Layout ─── */
const DashboardLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const role = user?.role || 'STUDENT';

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const closeSidebar = () => setSidebarOpen(false);

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const getRoleColor = (r) => {
        switch (r) {
            case 'ADMIN': return 'bg-blue-500/20 text-blue-300 border-blue-400/30';
            case 'TEACHER': return 'bg-green-500/20 text-green-300 border-green-400/30';
            case 'STUDENT': return 'bg-purple-500/20 text-purple-300 border-purple-400/30';
            case 'PARENT': return 'bg-orange-500/20 text-orange-300 border-orange-400/30';
            default: return 'bg-gray-500/20 text-gray-300 border-gray-400/30';
        }
    };

    const sidebarContent = (
        <>
            {/* Logo */}
            <div className="h-[72px] flex items-center px-5 border-b border-white/[0.08] shrink-0">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0 mr-3">
                    <BookOpen className="h-5 w-5 text-sidebar-dark" />
                </div>
                <div className="min-w-0">
                    <h1 className="font-bold text-[15px] leading-tight text-white truncate">Seven Star</h1>
                    <p className="text-[11px] text-accent/80 font-medium">School ERP</p>
                </div>
            </div>

            {/* User Info */}
            <div className="px-4 py-3.5 border-b border-white/[0.08] shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent text-sidebar-dark flex items-center justify-center font-bold text-sm shrink-0">
                        {getInitials(user?.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white truncate">{user?.name || 'User'}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium inline-block mt-0.5 ${getRoleColor(role)}`}>
                            {role}
                        </span>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
                <SidebarLink to="/dashboard" icon={<LayoutDashboard className="w-[18px] h-[18px]" />} label="Dashboard" onClick={closeSidebar} />

                {/* Admin routes */}
                {(role === 'ADMIN' || role === 'ACCOUNTANT') && (
                    <>
                        <div className="sidebar-section-label">Management</div>
                        <SidebarGroup label="Students" icon={<GraduationCap className="w-[18px] h-[18px]" />}>
                            <SidebarLink to="/dashboard/students" icon={<GraduationCap className="w-4 h-4" />} label="All Students" onClick={closeSidebar} />
                            <SidebarLink to="/dashboard/class-browser" icon={<Users className="w-4 h-4" />} label="Class Browser" onClick={closeSidebar} />
                        </SidebarGroup>
                        <SidebarLink to="/dashboard/teachers" icon={<Users className="w-[18px] h-[18px]" />} label="Teachers" onClick={closeSidebar} />
                        <SidebarLink to="/dashboard/parents" icon={<UserCheck className="w-[18px] h-[18px]" />} label="Parents" onClick={closeSidebar} />
                        <SidebarLink to="/dashboard/classes" icon={<BookOpen className="w-[18px] h-[18px]" />} label="Classes & Subjects" onClick={closeSidebar} />
                        <SidebarLink to="/dashboard/class-analytics" icon={<BarChart3 className="w-[18px] h-[18px]" />} label="Class Analytics" onClick={closeSidebar} />

                        <div className="sidebar-section-label">Finance</div>
                        <SidebarLink to="/dashboard/manage-fees" icon={<DollarSign className="w-[18px] h-[18px]" />} label="Fee Management" onClick={closeSidebar} />
                        <SidebarLink to="/dashboard/accounting" icon={<CreditCard className="w-[18px] h-[18px]" />} label="Accounting" onClick={closeSidebar} />
                        <SidebarLink to="/dashboard/salary" icon={<Banknote className="w-[18px] h-[18px]" />} label="Salary" onClick={closeSidebar} />

                        <div className="sidebar-section-label">Operations</div>
                        <SidebarLink to="/dashboard/library" icon={<LibraryBig className="w-[18px] h-[18px]" />} label="Library" onClick={closeSidebar} />
                        <SidebarLink to="/dashboard/transport" icon={<Bus className="w-[18px] h-[18px]" />} label="Transport" onClick={closeSidebar} />
                        <SidebarLink to="/dashboard/inventory" icon={<Package className="w-[18px] h-[18px]" />} label="Inventory" onClick={closeSidebar} />
                        <SidebarLink to="/dashboard/timetable" icon={<Clock className="w-[18px] h-[18px]" />} label="Timetable" onClick={closeSidebar} />
                    </>
                )}

                {/* Admin + Teacher routes */}
                {(role === 'ADMIN' || role === 'TEACHER') && (
                    <>
                        <div className="sidebar-section-label">Academics</div>
                        <SidebarLink to="/dashboard/manage-attendance" icon={<ClipboardCheck className="w-[18px] h-[18px]" />} label="Manage Attendance" onClick={closeSidebar} />
                        <SidebarLink to="/dashboard/attendance" icon={<ClipboardCheck className="w-[18px] h-[18px]" />} label="Attendance" onClick={closeSidebar} />
                        <SidebarLink to="/dashboard/exams" icon={<FileText className="w-[18px] h-[18px]" />} label="Exams & Marks" onClick={closeSidebar} />
                        <SidebarLink to="/dashboard/manage-exams" icon={<ClipboardList className="w-[18px] h-[18px]" />} label="Manage Exams" onClick={closeSidebar} />
                    </>
                )}

                {/* Teacher-only routes */}
                {role === 'TEACHER' && (
                    <>
                        <SidebarLink to="/dashboard/my-students" icon={<GraduationCap className="w-[18px] h-[18px]" />} label="My Students" onClick={closeSidebar} />
                        <SidebarLink to="/dashboard/assignments-manage" icon={<ClipboardList className="w-[18px] h-[18px]" />} label="Assignments" onClick={closeSidebar} />
                    </>
                )}

                {/* Student/Parent routes */}
                {(role === 'STUDENT' || role === 'PARENT') && (
                    <>
                        <div className="sidebar-section-label">Academics</div>
                        <SidebarLink to="/dashboard/results" icon={<Award className="w-[18px] h-[18px]" />} label="Results" onClick={closeSidebar} />
                        <SidebarLink to="/dashboard/fees" icon={<CreditCard className="w-[18px] h-[18px]" />} label="Fee Details" onClick={closeSidebar} />
                        <div className="sidebar-section-label">My</div>
                        <SidebarLink to="/dashboard/subjects" icon={<LibraryBig className="w-[18px] h-[18px]" />} label="My Subjects" onClick={closeSidebar} />
                        <SidebarLink to="/dashboard/routine" icon={<CalendarPlus className="w-[18px] h-[18px]" />} label="My Routine" onClick={closeSidebar} />
                        <SidebarLink to="/dashboard/assignments" icon={<ClipboardList className="w-[18px] h-[18px]" />} label="Assignments" onClick={closeSidebar} />
                    </>
                )}

                {/* Admin Communication */}
                {role === 'ADMIN' && (
                    <>
                        <div className="sidebar-section-label">Communication</div>
                        <SidebarLink to="/dashboard/manage-notices" icon={<Megaphone className="w-[18px] h-[18px]" />} label="Manage Notices" onClick={closeSidebar} />
                        <SidebarLink to="/dashboard/manage-events" icon={<CalendarPlus className="w-[18px] h-[18px]" />} label="Manage Events" onClick={closeSidebar} />
                        <SidebarLink to="/dashboard/notices" icon={<MessageSquareWarning className="w-[18px] h-[18px]" />} label="View Notices" onClick={closeSidebar} />
                    </>
                )}

                {/* Admin Website Content */}
                {role === 'ADMIN' && (
                    <>
                        <div className="sidebar-section-label">Website Content</div>
                        <SidebarLink to="/dashboard/manage-gallery" icon={<ImagePlus className="w-[18px] h-[18px]" />} label="Gallery Photos" onClick={closeSidebar} />
                        <SidebarLink to="/dashboard/manage-programs" icon={<LibraryBig className="w-[18px] h-[18px]" />} label="Programs & Syllabus" onClick={closeSidebar} />
                        <SidebarLink to="/dashboard/manage-reviews" icon={<Star className="w-[18px] h-[18px]" />} label="Reviews" onClick={closeSidebar} />
                        <SidebarLink to="/dashboard/admissions" icon={<UserPlus className="w-[18px] h-[18px]" />} label="Admissions" onClick={closeSidebar} />
                        <SidebarLink to="/dashboard/settings" icon={<Settings className="w-[18px] h-[18px]" />} label="Site Settings" onClick={closeSidebar} />
                    </>
                )}

                {/* Non-Admin Communication */}
                {role !== 'ADMIN' && (
                    <>
                        <div className="sidebar-section-label">Communication</div>
                        <SidebarLink to="/dashboard/notices" icon={<MessageSquareWarning className="w-[18px] h-[18px]" />} label="Notices" onClick={closeSidebar} />
                    </>
                )}
            </nav>

            {/* Logout */}
            <div className="p-3 border-t border-white/[0.08] shrink-0">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium text-red-400/80 hover:bg-red-500/10 hover:text-red-300 w-full transition-colors text-sm"
                >
                    <LogOut className="w-[18px] h-[18px]" />
                    <span>Logout</span>
                </button>
            </div>
        </>
    );

    return (
        <div className="dashboard-layout flex h-screen bg-[#f0f3f8] overflow-hidden font-sans">
            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden" onClick={closeSidebar} />
            )}

            {/* Sidebar - Mobile (Drawer) */}
            <aside className={`
                fixed inset-y-0 left-0 z-40 w-[260px] bg-gradient-to-b from-sidebar to-sidebar-dark flex flex-col
                transform transition-transform duration-300 ease-in-out md:hidden
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <button onClick={closeSidebar} className="absolute top-5 right-3 text-white/40 hover:text-white p-1">
                    <X className="w-5 h-5" />
                </button>
                {sidebarContent}
            </aside>

            {/* Sidebar - Desktop */}
            <aside className="w-[260px] bg-gradient-to-b from-sidebar to-sidebar-dark flex-shrink-0 hidden md:flex flex-col shadow-2xl z-20">
                {sidebarContent}
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Header */}
                <header className="h-16 bg-white border-b border-gray-200/60 flex items-center justify-between px-4 md:px-6 z-10 shrink-0 shadow-sm">
                    <div className="flex items-center gap-4 flex-1">
                        <button onClick={() => setSidebarOpen(true)} className="md:hidden text-gray-500 hover:text-primary p-1">
                            <Menu className="w-6 h-6" />
                        </button>

                        {/* Search Bar */}
                        <div className="hidden sm:flex items-center flex-1 max-w-md">
                            <div className="relative w-full">
                                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Find Something ...."
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        {/* Notifications */}
                        <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
                        </button>
                        {/* User */}
                        <div className="flex items-center gap-2.5 pl-2.5 border-l border-gray-200/60">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-semibold text-gray-800 leading-tight">{user?.name}</p>
                                <p className="text-[11px] text-gray-400">{role}</p>
                            </div>
                            <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shadow-sm">
                                {getInitials(user?.name)}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Breadcrumb */}
                <div className="bg-white border-b border-gray-100 px-4 md:px-6 py-2.5 shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-bold text-gray-800">{getPageTitle(location.pathname, role)}</h2>
                            <Breadcrumb />
                        </div>
                        <p className="text-xs text-gray-400 hidden sm:block">
                            {new Date().toLocaleString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                    </div>
                </div>

                {/* Page Content */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
