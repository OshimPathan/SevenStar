import React, { useState, useEffect, useCallback } from 'react';
import { Search, Users, Eye, Edit2, X, GraduationCap, Phone, MapPin, Calendar, User, Download, ChevronRight, Mail } from 'lucide-react';
import { getStudents, getClasses, updateStudent } from '../../api';

const AdminClassBrowser = () => {
    const [classes, setClasses] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedSectionId, setSelectedSectionId] = useState('');
    const [sections, setSections] = useState([]);
    const [search, setSearch] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    useEffect(() => {
        getClasses().then(res => {
            const cls = res.classes || [];
            setClasses(cls);
            if (cls.length > 0) {
                setSelectedClassId(cls[0].id);
                setSections(cls[0].sectionsList || []);
                if (cls[0].sectionsList?.length > 0) setSelectedSectionId(cls[0].sectionsList[0].id);
            }
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const fetchStudents = useCallback(async () => {
        if (!selectedClassId) return;
        setLoading(true);
        try {
            const res = await getStudents({ classId: selectedClassId, sectionId: selectedSectionId });
            setStudents(res.students || []);
        } catch (e) { /* ignore */ }
        setLoading(false);
    }, [selectedClassId, selectedSectionId]);

    useEffect(() => { fetchStudents(); }, [fetchStudents]);

    const handleClassChange = (classId) => {
        setSelectedClassId(classId);
        const cls = classes.find(c => c.id === classId);
        const secs = cls?.sectionsList || [];
        setSections(secs);
        setSelectedSectionId(secs.length > 0 ? secs[0].id : '');
        setSelectedStudent(null);
    };

    const filteredStudents = students.filter(s =>
        !search ||
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.admission_number?.toLowerCase().includes(search.toLowerCase()) ||
        s.father_name?.toLowerCase().includes(search.toLowerCase()) ||
        String(s.roll_number)?.includes(search)
    ).sort((a, b) => (a.roll_number || 0) - (b.roll_number || 0));

    const currentClass = classes.find(c => c.id === selectedClassId);
    const currentSection = sections.find(s => s.id === selectedSectionId);

    const openProfile = (student) => {
        setSelectedStudent(student);
        setEditing(false);
    };

    const openEdit = (student) => {
        setEditForm({
            name: student.name || '',
            email: student.email || '',
            roll_number: student.roll_number || '',
            date_of_birth: student.date_of_birth ? student.date_of_birth.split('T')[0] : '',
            gender: student.gender || '',
            blood_group: student.blood_group || '',
            address: student.address || '',
            parent_name: student.father_name || '',
            parent_phone: student.father_phone || '',
            mother_name: student.mother_name || '',
            mother_phone: student.mother_phone || '',
        });
        setSelectedStudent(student);
        setEditing(true);
    };

    const handleSaveEdit = async () => {
        if (!selectedStudent) return;
        setSaving(true);
        try {
            await updateStudent(selectedStudent.id, editForm);
            showToast('Student updated successfully');
            setEditing(false);
            await fetchStudents();
            // Re-select the updated student
            const updated = (await getStudents({ classId: selectedClassId, sectionId: selectedSectionId })).students?.find(s => s.id === selectedStudent.id);
            if (updated) setSelectedStudent(updated);
        } catch (e) {
            showToast(e.message || 'Update failed', 'error');
        }
        setSaving(false);
    };

    const exportCSV = () => {
        if (filteredStudents.length === 0) return;
        const headers = ['Roll', 'Name', 'Admission No', 'Gender', 'DOB', 'Father Name', 'Father Phone', 'Mother Name', 'Address'];
        const csv = [
            headers.join(','),
            ...filteredStudents.map(s => [
                s.roll_number || '', (s.name || '').replace(/,/g, ' '), s.admission_number || '',
                s.gender || '', s.date_of_birth ? new Date(s.date_of_birth).toISOString().slice(0, 10) : '',
                (s.father_name || '').replace(/,/g, ' '), s.father_phone || '',
                (s.mother_name || '').replace(/,/g, ' '), (s.address || '').replace(/,/g, ' ')
            ].join(','))
        ].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentClass?.name || 'class'}_${currentSection?.name || ''}_students.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const genderStats = {
        male: filteredStudents.filter(s => s.gender?.toLowerCase() === 'male').length,
        female: filteredStudents.filter(s => s.gender?.toLowerCase() === 'female').length,
        other: filteredStudents.filter(s => s.gender && !['male', 'female'].includes(s.gender.toLowerCase())).length,
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            {toast && (
                <div className={`fixed top-4 right-4 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                    {toast.message}
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Class Browser</h1>
                    <p className="text-sm text-gray-500 mt-1">Browse students by class and section</p>
                </div>
                <button onClick={exportCSV} disabled={filteredStudents.length === 0} className="px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium flex items-center gap-2 self-start disabled:opacity-50">
                    <Download className="w-4 h-4" /> Export CSV
                </button>
            </div>

            {/* Class/Section Picker */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex flex-wrap gap-3 items-end">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Class</label>
                        <select value={selectedClassId} onChange={e => handleClassChange(e.target.value)}
                            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white min-w-[180px]">
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}{c.stream_name ? ` (${c.stream_name})` : ''}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Section</label>
                        <div className="flex gap-1">
                            <button onClick={() => setSelectedSectionId('')}
                                className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${!selectedSectionId ? 'bg-primary text-white border-primary' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                                All
                            </button>
                            {sections.map(sec => (
                                <button key={sec.id} onClick={() => setSelectedSectionId(sec.id)}
                                    className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${selectedSectionId === sec.id ? 'bg-primary text-white border-primary' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                                    {sec.name}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, roll, parent..."
                            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: 'Total Students', value: filteredStudents.length, icon: Users, color: 'bg-primary/10 text-primary' },
                    { label: 'Male', value: genderStats.male, icon: User, color: 'bg-blue-50 text-blue-600' },
                    { label: 'Female', value: genderStats.female, icon: User, color: 'bg-pink-50 text-pink-600' },
                    { label: 'Section', value: currentSection?.name || 'All', icon: GraduationCap, color: 'bg-emerald-50 text-emerald-600' },
                ].map((s, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}>
                            <s.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-gray-900">{s.value}</p>
                            <p className="text-xs text-gray-400 font-medium">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Students Table + Profile Panel */}
            <div className="flex gap-4">
                {/* Table */}
                <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex-1 ${selectedStudent ? 'hidden lg:block' : ''}`}>
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50/80 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        <th className="py-3.5 px-5 w-14">Roll</th>
                                        <th className="py-3.5 px-5">Student</th>
                                        <th className="py-3.5 px-5 hidden md:table-cell">Adm. No</th>
                                        <th className="py-3.5 px-5 hidden lg:table-cell">Father</th>
                                        <th className="py-3.5 px-5 hidden lg:table-cell">Phone</th>
                                        <th className="py-3.5 px-5 w-24 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredStudents.map(student => (
                                        <tr key={student.id}
                                            className={`hover:bg-gray-50/50 transition-colors cursor-pointer ${selectedStudent?.id === student.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}
                                            onClick={() => openProfile(student)}>
                                            <td className="py-3.5 px-5 font-bold text-gray-400 text-sm">{student.roll_number}</td>
                                            <td className="py-3.5 px-5">
                                                <div className="flex items-center gap-3">
                                                    {student.photo_url ? (
                                                        <img src={student.photo_url} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                                                    ) : (
                                                        <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                                            {student.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-gray-800 truncate">{student.name}</p>
                                                        <p className="text-xs text-gray-400">{student.gender || '—'} • {student.blood_group || '—'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-5 text-sm font-mono text-gray-500 hidden md:table-cell">{student.admission_number}</td>
                                            <td className="py-3.5 px-5 text-sm text-gray-600 hidden lg:table-cell">{student.father_name || '—'}</td>
                                            <td className="py-3.5 px-5 text-sm text-gray-500 hidden lg:table-cell">{student.father_phone || '—'}</td>
                                            <td className="py-3.5 px-5 text-center" onClick={e => e.stopPropagation()}>
                                                <div className="flex items-center justify-center gap-1">
                                                    <button onClick={() => openProfile(student)} className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg" title="View"><Eye className="w-4 h-4" /></button>
                                                    <button onClick={() => openEdit(student)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg" title="Edit"><Edit2 className="w-4 h-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredStudents.length === 0 && !loading && (
                                        <tr><td colSpan="6" className="py-12 text-center text-gray-400">
                                            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                            <p className="font-medium">No students found</p>
                                            <p className="text-xs mt-1">Try selecting a different class or section</p>
                                        </td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Profile / Edit Panel */}
                {selectedStudent && (
                    <div className="w-full lg:w-[400px] shrink-0 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col max-h-[calc(100vh-280px)]">
                        {/* Panel Header */}
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
                            <h3 className="text-sm font-bold text-gray-900">{editing ? 'Edit Student' : 'Student Profile'}</h3>
                            <button onClick={() => { setSelectedStudent(null); setEditing(false); }} className="text-gray-400 hover:text-gray-600 p-1">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5">
                            {editing ? (
                                /* Edit Form */
                                <div className="space-y-3">
                                    {[
                                        { key: 'name', label: 'Full Name', type: 'text' },
                                        { key: 'email', label: 'Email', type: 'email' },
                                        { key: 'roll_number', label: 'Roll Number', type: 'number' },
                                        { key: 'date_of_birth', label: 'Date of Birth', type: 'date' },
                                        { key: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
                                        { key: 'blood_group', label: 'Blood Group', type: 'select', options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
                                        { key: 'address', label: 'Address', type: 'text' },
                                        { key: 'parent_name', label: 'Father Name', type: 'text' },
                                        { key: 'parent_phone', label: 'Father Phone', type: 'tel' },
                                        { key: 'mother_name', label: 'Mother Name', type: 'text' },
                                        { key: 'mother_phone', label: 'Mother Phone', type: 'tel' },
                                    ].map(f => (
                                        <div key={f.key}>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">{f.label}</label>
                                            {f.type === 'select' ? (
                                                <select value={editForm[f.key]} onChange={e => setEditForm({ ...editForm, [f.key]: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white">
                                                    <option value="">Select</option>
                                                    {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                                                </select>
                                            ) : (
                                                <input type={f.type} value={editForm[f.key] || ''} onChange={e => setEditForm({ ...editForm, [f.key]: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                                            )}
                                        </div>
                                    ))}
                                    <div className="flex gap-2 pt-2">
                                        <button onClick={() => setEditing(false)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
                                        <button onClick={handleSaveEdit} disabled={saving} className="flex-1 btn-primary py-2 text-sm flex items-center justify-center gap-1">
                                            {saving ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* View Profile */
                                <div className="space-y-5">
                                    {/* Avatar + Name */}
                                    <div className="text-center">
                                        {selectedStudent.photo_url ? (
                                            <img src={selectedStudent.photo_url} alt="" className="w-20 h-20 rounded-2xl object-cover mx-auto shadow-sm" />
                                        ) : (
                                            <div className="w-20 h-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl mx-auto">
                                                {selectedStudent.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                            </div>
                                        )}
                                        <h4 className="text-lg font-bold text-gray-900 mt-3">{selectedStudent.name}</h4>
                                        <p className="text-xs text-gray-400 mt-0.5">{selectedStudent.admission_number} • Roll #{selectedStudent.roll_number}</p>
                                        <div className="flex items-center justify-center gap-2 mt-2">
                                            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary/10 text-primary">{currentClass?.name}</span>
                                            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600">Section {selectedStudent.section || currentSection?.name}</span>
                                        </div>
                                    </div>

                                    {/* Details Grid */}
                                    <div className="space-y-3">
                                        <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Personal Info</h5>
                                        {[
                                            { icon: Calendar, label: 'Date of Birth', value: selectedStudent.date_of_birth ? new Date(selectedStudent.date_of_birth).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' },
                                            { icon: User, label: 'Gender', value: selectedStudent.gender || '—' },
                                            { icon: User, label: 'Blood Group', value: selectedStudent.blood_group || '—' },
                                            { icon: Mail, label: 'Email', value: selectedStudent.email || '—' },
                                            { icon: MapPin, label: 'Address', value: selectedStudent.address || '—' },
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-start gap-3">
                                                <item.icon className="w-4 h-4 text-gray-300 mt-0.5 shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{item.label}</p>
                                                    <p className="text-sm text-gray-800 font-medium truncate">{item.value}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-3">
                                        <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Guardian Info</h5>
                                        {[
                                            { icon: User, label: 'Father', value: selectedStudent.father_name || '—' },
                                            { icon: Phone, label: 'Father Phone', value: selectedStudent.father_phone || '—' },
                                            { icon: User, label: 'Mother', value: selectedStudent.mother_name || '—' },
                                            { icon: Phone, label: 'Mother Phone', value: selectedStudent.mother_phone || '—' },
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-start gap-3">
                                                <item.icon className="w-4 h-4 text-gray-300 mt-0.5 shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{item.label}</p>
                                                    <p className="text-sm text-gray-800 font-medium">{item.value}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <button onClick={() => openEdit(selectedStudent)} className="w-full btn-primary py-2.5 flex items-center justify-center gap-2 text-sm">
                                        <Edit2 className="w-4 h-4" /> Edit Student Info
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminClassBrowser;
