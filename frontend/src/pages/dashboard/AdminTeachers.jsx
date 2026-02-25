import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Plus, X, Trash2, Eye, Edit2, Users, CheckCircle, AlertCircle, Loader2, Mail, Phone, BookOpen, FileUp, GraduationCap, MapPin, Calendar, Award } from 'lucide-react';
import { getTeachers, createTeacher, updateTeacher, deleteTeacher, getTeacherHistory, bulkCreateTeachers, uploadTeacherPhoto, getClasses, getSubjectsByClass, assignTeacherToSubject, getTeacherLoad, removeTeacherAssignment } from '../../api';
import CSVImportModal from '../../components/CSVImportModal';

const AdminTeachers = () => {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState(null);
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [teacherHistory, setTeacherHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [credentials, setCredentials] = useState(null);
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [showSubjectModal, setShowSubjectModal] = useState(null);
    // Teacher loads cache for showing student counts in table
    const [teacherLoads, setTeacherLoads] = useState({}); // { teacherId: [assignments] }
    const [viewLoad, setViewLoad] = useState([]); // For selected teacher view

    const [form, setForm] = useState({
        name: '', email: '', password: '', phone: '',
        qualification: '', address: '', joined_date: '', leave_date: '', photo_url: ''
    });
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const fetchTeachers = useCallback(async () => {
        try {
            const data = await getTeachers({ search });
            setTeachers(data.teachers || []);
        } catch (err) {
            showToast(err.message || 'Failed to fetch teachers', 'error');
        }
    }, [search]);

    const fetchAllTeacherLoads = async (teacherList) => {
        const loads = {};
        for (const t of teacherList) {
            try {
                const load = await getTeacherLoad(t.id);
                loads[t.id] = load;
            } catch (_) {
                loads[t.id] = [];
            }
        }
        setTeacherLoads(loads);
    };

    const fetchHistory = async (teacherId) => {
        setHistoryLoading(true);
        try {
            const data = await getTeacherHistory(teacherId);
            setTeacherHistory(data);
        } catch (err) {
            showToast('Failed to load history', 'error');
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            const data = await getTeachers({ search: '' });
            const list = data.teachers || [];
            setTeachers(list);
            setLoading(false);
            // Fetch loads in background
            fetchAllTeacherLoads(list);
        };
        init();
    }, []);

    useEffect(() => {
        if (!loading) fetchTeachers();
    }, [search]);

    useEffect(() => {
        if (selectedTeacher && activeTab === 'history') fetchHistory(selectedTeacher.id);
        if (selectedTeacher && activeTab === 'profile') {
            // Load assignments for selected teacher
            getTeacherLoad(selectedTeacher.id).then(setViewLoad).catch(() => setViewLoad([]));
        }
    }, [selectedTeacher, activeTab]);

    const resetForm = () => {
        setForm({ name: '', email: '', password: '', phone: '', qualification: '', address: '', joined_date: '', leave_date: '', photo_url: '' });
        setEditingTeacher(null);
        setCredentials(null);
        setPhotoFile(null);
        setPhotoPreview(null);
    };

    const openAddModal = () => { resetForm(); setShowModal(true); };

    const openEditModal = (t) => {
        setEditingTeacher(t);
        setForm({
            name: t.name || '', email: t.email || '', password: '',
            phone: t.phone || '', qualification: t.qualification || '',
            address: t.address || '',
            joined_date: t.joined_date ? t.joined_date.split('T')[0] : '',
            leave_date: t.leave_date ? t.leave_date.split('T')[0] : '',
            photo_url: t.photo_url || ''
        });
        setCredentials(null);
        setPhotoPreview(t.photo_url || null);
        setShowModal(true);
    };

    const openViewModal = (t) => {
        setSelectedTeacher(t);
        setActiveTab('profile');
        setTeacherHistory([]);
        setViewLoad([]);
    };

    const exportHistoryCSV = () => {
        if (!teacherHistory.length) return;
        const headers = ['Date', 'Class', 'Section', 'Subject', 'Academic Year'];
        const rows = teacherHistory.map(h => [
            new Date(h.assigned_date).toLocaleDateString(),
            h.class_name, h.section_name, h.subject_name, h.year
        ]);
        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${selectedTeacher.name}_history.csv`; a.click();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            let photoUrl = form.photo_url;
            if (photoFile) {
                const up = await uploadTeacherPhoto(photoFile);
                photoUrl = up.url;
            }
            const payload = { ...form, photo_url: photoUrl };
            if (editingTeacher) {
                await updateTeacher(editingTeacher.id, payload);
                showToast('Teacher updated successfully');
                setShowModal(false); resetForm();
            } else {
                const data = await createTeacher(payload);
                showToast('Teacher created successfully');
                if (data.credentials) {
                    setCredentials(data.credentials);
                } else {
                    setShowModal(false); resetForm();
                }
            }
            await fetchTeachers();
        } catch (err) {
            showToast(err.error || err.message || 'Operation failed', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (!confirm(`Delete ${name}? This removes their user account too.`)) return;
        try {
            await deleteTeacher(id);
            showToast('Teacher deleted');
            await fetchTeachers();
        } catch (err) {
            showToast(err.message || 'Failed to delete', 'error');
        }
    };

    const openSubjectModal = (teacher) => setShowSubjectModal(teacher);

    // Helper: get total student count from teacher load
    const getTeacherStudentCount = (teacherId) => {
        const load = teacherLoads[teacherId] || [];
        // Unique class+section combos to avoid double counting
        const seen = new Set();
        let total = 0;
        load.forEach(r => {
            const key = `${r.class_id}:${r.section_id}`;
            if (!seen.has(key)) {
                seen.add(key);
                total += r.student_count || 0;
            }
        });
        return total;
    };

    const getTeacherAssignmentSummary = (teacherId) => {
        const load = teacherLoads[teacherId] || [];
        return load;
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-6 animate-fade-in-up">
            {toast && (
                <div className={`fixed top-4 right-4 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                    {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    {toast.message}
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Teachers</h1>
                    <p className="text-sm text-gray-500 mt-1">{teachers.length} teachers registered</p>
                </div>
                <div className="flex items-center gap-2 self-start">
                    <button onClick={() => setImportModalOpen(true)} className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-medium flex items-center gap-2">
                        <FileUp className="w-4 h-4" /> Import CSV
                    </button>
                    <button onClick={openAddModal} className="btn-primary flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Add Teacher
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                    <div className="relative max-w-md">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name, ID, or email..."
                            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/80 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <th className="py-3.5 px-5">Teacher</th>
                                <th className="py-3.5 px-5">Emp. ID</th>
                                <th className="py-3.5 px-5 hidden md:table-cell">Qualification</th>
                                <th className="py-3.5 px-5 hidden lg:table-cell">Assigned Classes</th>
                                <th className="py-3.5 px-5 hidden md:table-cell text-center">Students</th>
                                <th className="py-3.5 px-5 hidden md:table-cell">Phone</th>
                                <th className="py-3.5 px-5 text-center w-36">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {teachers.map((t) => {
                                const assignments = getTeacherAssignmentSummary(t.id);
                                const totalStudents = getTeacherStudentCount(t.id);
                                return (
                                    <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-3.5 px-5">
                                            <div className="flex items-center gap-3">
                                                {t.photo_url ? (
                                                    <img src={t.photo_url} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                                                ) : (
                                                    <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
                                                        {t.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-gray-800 truncate">{t.name}</p>
                                                    <p className="text-xs text-gray-400 truncate">{t.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-5 text-sm font-mono text-gray-600">{t.employee_id}</td>
                                        <td className="py-3.5 px-5 text-sm text-gray-600 hidden md:table-cell">{t.qualification || '-'}</td>
                                        <td className="py-3.5 px-5 hidden lg:table-cell">
                                            <div className="flex flex-wrap gap-1 max-w-xs">
                                                {assignments.length > 0 ? assignments.slice(0, 3).map((a, i) => (
                                                    <span key={i} className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 text-purple-600 whitespace-nowrap">
                                                        {a.subject_name} • {a.class_name} {a.section_name}
                                                    </span>
                                                )) : <span className="text-xs text-gray-400">Not assigned</span>}
                                                {assignments.length > 3 && (
                                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 text-gray-500">+{assignments.length - 3} more</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-5 hidden md:table-cell text-center">
                                            {totalStudents > 0 ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-600">
                                                    <Users className="w-3 h-3" /> {totalStudents}
                                                </span>
                                            ) : <span className="text-xs text-gray-400">0</span>}
                                        </td>
                                        <td className="py-3.5 px-5 text-sm text-gray-500 hidden md:table-cell">{t.phone || '-'}</td>
                                        <td className="py-3.5 px-5">
                                            <div className="flex items-center justify-center gap-1">
                                                <button onClick={() => openViewModal(t)} className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg" title="View"><Eye className="w-4 h-4" /></button>
                                                <button onClick={() => openSubjectModal(t)} className="p-1.5 text-gray-400 hover:text-purple-500 hover:bg-purple-50 rounded-lg" title="Manage Assignments"><BookOpen className="w-4 h-4" /></button>
                                                <button onClick={() => openEditModal(t)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg" title="Edit"><Edit2 className="w-4 h-4" /></button>
                                                <button onClick={() => handleDelete(t.id, t.name)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {teachers.length === 0 && (
                                <tr><td colSpan="7" className="py-12 text-center text-gray-400">
                                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                    <p className="font-medium">No teachers found</p>
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* View Modal — Enhanced with assignments and workload */}
            {selectedTeacher && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedTeacher(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900">Teacher Details</h3>
                            <button onClick={() => setSelectedTeacher(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                        </div>

                        <div className="flex border-b border-gray-100 px-6">
                            <button onClick={() => setActiveTab('profile')} className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'profile' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Profile & Workload</button>
                            <button onClick={() => setActiveTab('history')} className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'history' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>History</button>
                        </div>

                        <div className="p-6 min-h-[300px]">
                            {activeTab === 'profile' ? (
                                <div className="space-y-6 animate-fade-in">
                                    {/* Profile Header */}
                                    <div className="flex items-start gap-5">
                                        {selectedTeacher.photo_url ? (
                                            <img src={selectedTeacher.photo_url} alt={selectedTeacher.name} className="w-20 h-24 rounded-2xl object-cover border-2 border-gray-100 shadow-sm" />
                                        ) : (
                                            <div className="w-20 h-24 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-2xl border-2 border-emerald-100">
                                                {selectedTeacher.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <h4 className="text-xl font-bold text-gray-900">{selectedTeacher.name}</h4>
                                            <p className="text-sm text-gray-500 mt-0.5">{selectedTeacher.employee_id}</p>
                                            {selectedTeacher.qualification && (
                                                <div className="mt-2 flex items-center gap-1.5 text-sm text-emerald-600">
                                                    <Award className="w-4 h-4" />
                                                    <span className="font-medium">{selectedTeacher.qualification}</span>
                                                </div>
                                            )}
                                            <div className="flex gap-3 mt-3">
                                                <a href={`mailto:${selectedTeacher.email}`} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors"><Mail className="w-3.5 h-3.5" />{selectedTeacher.email}</a>
                                                {selectedTeacher.phone && <a href={`tel:${selectedTeacher.phone}`} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs bg-emerald-50 text-emerald-600 font-medium hover:bg-emerald-100 transition-colors"><Phone className="w-3.5 h-3.5" />{selectedTeacher.phone}</a>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Details Grid */}
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-gray-50/60 rounded-xl p-4">
                                        {[
                                            { icon: Calendar, label: 'Joined', value: selectedTeacher.joined_date ? new Date(selectedTeacher.joined_date).toLocaleDateString() : 'N/A' },
                                            { icon: Calendar, label: 'Leave Date', value: selectedTeacher.leave_date ? new Date(selectedTeacher.leave_date).toLocaleDateString() : 'Active' },
                                            { icon: MapPin, label: 'Address', value: selectedTeacher.address || 'N/A' },
                                        ].map((item, i) => (
                                            <div key={i}>
                                                <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                                                    <item.icon className="w-3 h-3" />
                                                    <span className="text-[10px] font-semibold uppercase tracking-wider">{item.label}</span>
                                                </div>
                                                <p className="text-sm font-medium text-gray-700">{item.value}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Assigned Classes & Student Workload */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                                <GraduationCap className="w-4 h-4" /> Assigned Classes & Student Load
                                            </h5>
                                            <button onClick={() => openSubjectModal(selectedTeacher)} className="text-xs text-primary font-semibold hover:underline">+ Manage Assignments</button>
                                        </div>
                                        {viewLoad.length > 0 ? (
                                            <div className="border border-gray-100 rounded-xl overflow-hidden">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="bg-gray-50/80 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                                            <th className="text-left py-2.5 px-4">Subject</th>
                                                            <th className="text-left py-2.5 px-4">Class</th>
                                                            <th className="text-left py-2.5 px-4">Section</th>
                                                            <th className="text-right py-2.5 px-4">Students</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-50">
                                                        {viewLoad.map((row, idx) => (
                                                            <tr key={idx} className="hover:bg-gray-50/50">
                                                                <td className="py-2.5 px-4">
                                                                    <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-purple-50 text-purple-700">{row.subject_name}</span>
                                                                </td>
                                                                <td className="py-2.5 px-4 font-medium text-gray-700">{row.class_name}</td>
                                                                <td className="py-2.5 px-4 text-gray-500">{row.section_name}</td>
                                                                <td className="py-2.5 px-4 text-right">
                                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-600">
                                                                        <Users className="w-3 h-3" /> {row.student_count}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                    <tfoot>
                                                        <tr className="bg-gray-50 border-t border-gray-200">
                                                            <td colSpan="3" className="py-2.5 px-4 text-xs font-bold text-gray-600 uppercase">Total Students (unique sections)</td>
                                                            <td className="py-2.5 px-4 text-right">
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-primary/10 text-primary">
                                                                    {(() => {
                                                                        const seen = new Set();
                                                                        let total = 0;
                                                                        viewLoad.forEach(r => {
                                                                            const key = `${r.class_id}:${r.section_id}`;
                                                                            if (!seen.has(key)) { seen.add(key); total += r.student_count || 0; }
                                                                        });
                                                                        return total;
                                                                    })()}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    </tfoot>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="text-center py-6 bg-gray-50/60 rounded-xl border border-dashed border-gray-200">
                                                <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                                <p className="text-sm text-gray-400">No assignments yet</p>
                                                <button onClick={() => openSubjectModal(selectedTeacher)} className="mt-2 text-xs text-primary font-semibold hover:underline">Assign classes & subjects</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 animate-fade-in">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="font-bold text-gray-800">Assignment History</h4>
                                        <button onClick={exportHistoryCSV} disabled={!teacherHistory.length} className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50">Export CSV</button>
                                    </div>

                                    {historyLoading ? (
                                        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
                                    ) : teacherHistory.length > 0 ? (
                                        <div className="overflow-y-auto max-h-[300px] border border-gray-100 rounded-xl">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-semibold sticky top-0">
                                                    <tr>
                                                        <th className="px-4 py-2">Date</th>
                                                        <th className="px-4 py-2">Class</th>
                                                        <th className="px-4 py-2">Subject</th>
                                                        <th className="px-4 py-2">Year</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    {teacherHistory.map((h) => (
                                                        <tr key={h.id}>
                                                            <td className="px-4 py-2 text-gray-600">{new Date(h.assigned_date).toLocaleDateString()}</td>
                                                            <td className="px-4 py-2 font-medium text-gray-800">{h.class_name} {h.section_name}</td>
                                                            <td className="px-4 py-2 text-purple-600">{h.subject_name}</td>
                                                            <td className="px-4 py-2 text-gray-500 text-xs">{h.year}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                            <p>No history records found.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Add/Edit Modal — Detailed Form */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setShowModal(false); resetForm(); }}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">{editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}</h3>
                                <p className="text-sm text-gray-500 mt-0.5">{editingTeacher ? 'Update teacher information' : 'Register a new teacher with login credentials'}</p>
                            </div>
                            <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                        </div>

                        {credentials && (
                            <div className="mx-6 mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                                <h4 className="font-bold text-green-800 mb-2 flex items-center gap-2"><CheckCircle className="w-5 h-5" /> Login Credentials Created</h4>
                                <div className="bg-white p-3 rounded-lg border border-green-100 text-sm">
                                    <p>Email: <span className="font-mono font-bold">{credentials.email}</span></p>
                                    <p>Password: <span className="font-mono font-bold">{credentials.password}</span></p>
                                </div>
                                <button onClick={() => { setShowModal(false); resetForm(); }} className="mt-3 w-full btn-primary py-2">Done</button>
                            </div>
                        )}

                        {!credentials && (
                            <form className="p-6 space-y-5" onSubmit={handleSubmit}>
                                {/* Photo Upload Section */}
                                <div className="flex items-start gap-5">
                                    <div className="w-24 h-28 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                                        {photoPreview || form.photo_url ? (
                                            <img src={photoPreview || form.photo_url} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                                        ) : (
                                            <div className="text-center">
                                                <Users className="w-6 h-6 text-gray-300 mx-auto" />
                                                <span className="text-[10px] text-gray-400 mt-1 block">Photo</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary/10 text-primary rounded-xl text-sm font-medium cursor-pointer hover:bg-primary/20 transition-colors">
                                            Upload Photo
                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                                const f = e.target.files?.[0];
                                                if (!f) return;
                                                setPhotoFile(f);
                                                setPhotoPreview(URL.createObjectURL(f));
                                            }} />
                                        </label>
                                        {form.photo_url && !photoFile && <p className="text-xs text-green-600">Existing photo will be kept if not changed.</p>}
                                        <p className="text-[10px] text-gray-400">Recommended: Passport-sized, max 2MB</p>
                                    </div>
                                </div>

                                {/* Basic Info */}
                                <div className="border-t border-gray-100 pt-4">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Basic Information</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                                            <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="Teacher full name" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                            <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="teacher@sevenstar.edu.np" />
                                        </div>
                                    </div>
                                </div>

                                {!editingTeacher && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                        <input type="text" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="Default: teacher123" />
                                    </div>
                                )}

                                {/* Contact & Qualifications */}
                                <div className="border-t border-gray-100 pt-4">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Contact & Qualifications</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                            <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="98XXXXXXXX" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
                                            <input type="text" value={form.qualification} onChange={e => setForm({ ...form, qualification: e.target.value })}
                                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="e.g. M.Sc. Mathematics" />
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                        <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="Full address" />
                                    </div>
                                </div>

                                {/* Dates */}
                                <div className="border-t border-gray-100 pt-4">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Employment Dates</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date</label>
                                            <input type="date" value={form.joined_date} onChange={e => setForm({ ...form, joined_date: e.target.value })}
                                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Leave Date</label>
                                            <input type="date" value={form.leave_date} onChange={e => setForm({ ...form, leave_date: e.target.value })}
                                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                                            <p className="text-[10px] text-gray-400 mt-1">Leave blank if currently active</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2 border-t border-gray-100">
                                    <button type="button" onClick={() => { setShowModal(false); resetForm(); }}
                                        className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                                    <button type="submit" disabled={saving} className="flex-1 btn-primary py-2.5 flex items-center justify-center gap-2">
                                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                        {editingTeacher ? 'Update Teacher' : 'Add Teacher'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Assignment Management Modal */}
            {showSubjectModal && (
                <AssignClassesModal
                    teacher={showSubjectModal}
                    onClose={() => {
                        setShowSubjectModal(null);
                        // Refresh loads after assignment changes
                        fetchTeachers().then(() => {
                            getTeachers({ search }).then(data => fetchAllTeacherLoads(data.teachers || []));
                        });
                        // Also refresh view load if teacher is selected
                        if (selectedTeacher?.id === showSubjectModal?.id) {
                            getTeacherLoad(selectedTeacher.id).then(setViewLoad).catch(() => setViewLoad([]));
                        }
                    }}
                />
            )}
            {/* CSV Import Modal */}
            <CSVImportModal
                open={importModalOpen}
                onClose={() => { setImportModalOpen(false); fetchTeachers(); }}
                title="Import Teachers"
                entityName="teachers"
                templateHeaders={['Name', 'Email', 'Qualification', 'Phone', 'Address', 'Hire Date']}
                sampleRow={['Ram Shrestha', 'ram@sevenstar.edu.np', 'M.Sc. Mathematics', '9841200001', 'Kathmandu-5', '2024-01-15']}
                requiredFields={['Name', 'Email']}
                onImport={(rows) => bulkCreateTeachers(rows)}
            />
        </div>
    );
};

export default AdminTeachers;

const AssignClassesModal = ({ teacher, onClose }) => {
    const [classes, setClasses] = React.useState([]);
    const [selectedClass, setSelectedClass] = React.useState('');
    const [selectedSection, setSelectedSection] = React.useState('');
    const [subjects, setSubjects] = React.useState([]);
    const [selectedSubject, setSelectedSubject] = React.useState('');
    const [loading, setLoading] = React.useState(true);
    const [assigning, setAssigning] = React.useState(false);
    const [load, setLoad] = React.useState([]);

    React.useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                const cls = await getClasses();
                setClasses(cls.classes || []);
                if (cls.classes?.length) {
                    const c = cls.classes[0];
                    setSelectedClass(c.id);
                    const sec = (c.sectionsList || [])[0]?.id || '';
                    setSelectedSection(sec);
                    if (c.id) {
                        const subs = await getSubjectsByClass(c.id);
                        setSubjects(subs.subjects || []);
                        setSelectedSubject(subs.subjects?.[0]?.id || '');
                    }
                }
                const l = await getTeacherLoad(teacher.id);
                setLoad(l);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [teacher.id]);

    const changeClass = async (cid) => {
        setSelectedClass(cid);
        const cls = classes.find(c => c.id === cid);
        const sec = (cls?.sectionsList || [])[0]?.id || '';
        setSelectedSection(sec);
        const subs = await getSubjectsByClass(cid);
        setSubjects(subs.subjects || []);
        setSelectedSubject(subs.subjects?.[0]?.id || '');
    };
    const changeSection = (sid) => setSelectedSection(sid);
    const changeSubject = (sid) => setSelectedSubject(sid);

    const assign = async () => {
        if (!selectedClass || !selectedSection || !selectedSubject) return;
        setAssigning(true);
        try {
            await assignTeacherToSubject({
                teacher_id: teacher.id,
                class_id: selectedClass,
                section_id: selectedSection,
                subject_id: selectedSubject
            });
            const l = await getTeacherLoad(teacher.id);
            setLoad(l);
        } finally {
            setAssigning(false);
        }
    };

    const remove = async (row) => {
        await removeTeacherAssignment({
            teacher_id: teacher.id,
            class_id: row.class_id,
            section_id: row.section_id,
            subject_id: row.subject_id
        });
        const l = await getTeacherLoad(teacher.id);
        setLoad(l);
    };

    // Compute total unique students
    const totalStudents = React.useMemo(() => {
        const seen = new Set();
        let total = 0;
        load.forEach(r => {
            const key = `${r.class_id}:${r.section_id}`;
            if (!seen.has(key)) { seen.add(key); total += r.student_count || 0; }
        });
        return total;
    }, [load]);

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Assign Classes & Subjects</h3>
                        <p className="text-sm text-gray-500">Assign class • section • subject to <span className="font-semibold text-gray-700">{teacher.name}</span></p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-6 space-y-5">
                    {loading ? (
                        <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                    ) : (
                        <>
                            {/* Selector row */}
                            <div className="bg-gray-50/80 rounded-xl p-4 space-y-3">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Add New Assignment</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Class</label>
                                        <select value={selectedClass} onChange={e => changeClass(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20">
                                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Section</label>
                                        <select value={selectedSection} onChange={e => changeSection(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20">
                                            {(classes.find(c => c.id === selectedClass)?.sectionsList || []).map(sec => (
                                                <option key={sec.id} value={sec.id}>{sec.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Subject</label>
                                        <select value={selectedSubject} onChange={e => changeSubject(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20">
                                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <button onClick={assign} disabled={assigning} className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2">
                                        {assigning && <Loader2 className="w-4 h-4 animate-spin" />} Assign
                                    </button>
                                </div>
                            </div>

                            {/* Current Assignments */}
                            <div className="border-t border-gray-100 pt-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Current Assignments & Student Load</h4>
                                    {load.length > 0 && (
                                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
                                            Total: {totalStudents} students
                                        </span>
                                    )}
                                </div>
                                {load.length === 0 ? (
                                    <p className="text-sm text-gray-400 text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">No assignments yet. Use the form above to assign classes.</p>
                                ) : (
                                    <div className="overflow-x-auto border border-gray-100 rounded-xl">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-gray-50/80 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                                    <th className="text-left py-2.5 px-3">Class</th>
                                                    <th className="text-left py-2.5 px-3">Section</th>
                                                    <th className="text-left py-2.5 px-3">Subject</th>
                                                    <th className="text-right py-2.5 px-3">Students</th>
                                                    <th className="text-center py-2.5 px-3">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {load.map((row, idx) => (
                                                    <tr key={idx} className="hover:bg-gray-50">
                                                        <td className="py-2.5 px-3 font-medium">{row.class_name}</td>
                                                        <td className="py-2.5 px-3">{row.section_name}</td>
                                                        <td className="py-2.5 px-3">
                                                            <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-purple-50 text-purple-600">{row.subject_name}</span>
                                                        </td>
                                                        <td className="py-2.5 px-3 text-right">
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-600">
                                                                <Users className="w-3 h-3" /> {row.student_count}
                                                            </span>
                                                        </td>
                                                        <td className="py-2.5 px-3 text-center">
                                                            <button onClick={() => remove(row)} className="px-2.5 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium transition-colors">Remove</button>
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
            </div>
        </div>
    );
};
