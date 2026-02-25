import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, X, Trash2, Eye, Edit2, GraduationCap, CheckCircle, AlertCircle, Loader2, Upload, Camera, FileText, User, SlidersHorizontal, Download, DollarSign, FileUp, Mail, Phone, MapPin, Calendar, Hash } from 'lucide-react';
import { getStudents, getClasses, createStudent, updateStudent, deleteStudent, uploadStudentPhoto, uploadStudentCertificate, getStudentPerformance, createBulkFees, bulkCreateStudents } from '../../api';
import CSVImportModal from '../../components/CSVImportModal';
import FormField from '../../components/FormField';

const AdminStudents = () => {
    const [students, setStudents] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [searchDebounced, setSearchDebounced] = useState('');
    const [filterClass, setFilterClass] = useState('');
    const [filterSection, setFilterSection] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [feeModal, setFeeModal] = useState({ open: false, amount: '', due_date: '' });
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [credentials, setCredentials] = useState(null);
    const [activeTab, setActiveTab] = useState('personal');
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [certificateFile, setCertificateFile] = useState(null);
    const [certificatePreview, setCertificatePreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [perfRows, setPerfRows] = useState([]);
    useEffect(() => {
        let active = true;
        if (selectedStudent) {
            getStudentPerformance(selectedStudent.id).then(res => { if (active) setPerfRows(res.rows || []); }).catch(() => setPerfRows([]));
        } else {
            setPerfRows([]);
        }
        return () => { active = false; };
    }, [selectedStudent]);

    const emptyForm = {
        name: '', email: '', password: '', class_id: '', roll_number: '',
        date_of_birth: '', blood_group: '', address: '', gender: '', nationality: 'Nepali', religion: '',
        parent_name: '', parent_phone: '', parent_email: '', mother_name: '', mother_phone: '', emergency_contact: '',
        create_parent_account: true,
        previous_school: '', previous_class: '', previous_marks: '', transfer_certificate: '',
        photo_url: '', certificate_url: '',
    };

    const [form, setForm] = useState(emptyForm);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    // Debounce search input for better DB performance
    useEffect(() => {
        const t = setTimeout(() => setSearchDebounced(search), 350);
        return () => clearTimeout(t);
    }, [search]);

    const fetchStudents = useCallback(async () => {
        try {
            const data = await getStudents({ search: searchDebounced, classId: filterClass, sectionId: filterSection });
            setStudents(data.students || []);
            setSelectedIds(new Set()); // reset selections on fetch
        } catch (err) {
            showToast(err.message || 'Failed to fetch students', 'error');
        }
    }, [searchDebounced, filterClass, filterSection]);

    const fetchClasses = async () => {
        try {
            const data = await getClasses();
            setClasses(data.classes || []);
        } catch (err) {
            console.error('Failed to fetch classes:', err);
        }
    };

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await Promise.all([fetchStudents(), fetchClasses()]);
            setLoading(false);
        };
        init();
    }, []);

    useEffect(() => {
        if (!loading) fetchStudents();
    }, [searchDebounced, filterClass, filterSection]);

    const resetForm = () => {
        setForm(emptyForm);
        setEditingStudent(null);
        setCredentials(null);
        setPhotoFile(null);
        setPhotoPreview(null);
        setCertificateFile(null);
        setCertificatePreview(null);
        setActiveTab('personal');
    };

    const openAddModal = () => { resetForm(); setShowModal(true); };

    const openEditModal = (student) => {
        setEditingStudent(student);
        setForm({
            name: student.name || '', email: student.email || '', password: '',
            class_id: student.class_id || '', roll_number: student.roll_number || '',
            date_of_birth: student.date_of_birth ? student.date_of_birth.split('T')[0] : '',
            blood_group: student.blood_group || '', address: student.address || '',
            gender: student.gender || '', nationality: student.nationality || 'Nepali', religion: student.religion || '',
            parent_name: student.parent_name || '', parent_phone: student.parent_phone || '',
            parent_email: student.parent_email || '', mother_name: student.mother_name || '',
            mother_phone: student.mother_phone || '', emergency_contact: student.emergency_contact || '',
            create_parent_account: false,
            previous_school: student.previous_school || '', previous_class: student.previous_class || '',
            previous_marks: student.previous_marks || '', transfer_certificate: student.transfer_certificate || '',
            photo_url: student.photo_url || '', certificate_url: student.certificate_url || '',
        });
        setPhotoPreview(student.photo_url || null);
        setCertificatePreview(student.certificate_url || null);
        setCredentials(null);
        setActiveTab('personal');
        setShowModal(true);
    };

    const handlePhotoSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { showToast('Photo must be under 2MB', 'error'); return; }
        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
    };

    const handleCertificateSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { showToast('Certificate must be under 5MB', 'error'); return; }
        setCertificateFile(file);
        setCertificatePreview(file.type.startsWith('image/') ? URL.createObjectURL(file) : file.name);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            let photoUrl = form.photo_url;
            let certificateUrl = form.certificate_url;

            if (photoFile) {
                setUploading(true);
                const uploadData = await uploadStudentPhoto(photoFile);
                photoUrl = uploadData.url;
            }
            if (certificateFile) {
                setUploading(true);
                const uploadData = await uploadStudentCertificate(certificateFile);
                certificateUrl = uploadData.url;
            }
            setUploading(false);

            const submitForm = { ...form, photo_url: photoUrl, certificate_url: certificateUrl };

            if (editingStudent) {
                await updateStudent(editingStudent.id, submitForm);
                showToast('Student updated successfully');
                setShowModal(false); resetForm();
            } else {
                const data = await createStudent(submitForm);
                showToast('Student created successfully');
                if (data.credentials) {
                    setCredentials(data.credentials);
                } else {
                    setShowModal(false); resetForm();
                }
            }
            await fetchStudents();
        } catch (err) {
            showToast(err.error || err.message || 'Operation failed', 'error');
        } finally {
            setSaving(false);
            setUploading(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (!confirm(`Delete ${name}? This removes their user account too.`)) return;
        try {
            await deleteStudent(id);
            showToast('Student deleted');
            await fetchStudents();
        } catch (err) {
            showToast(err.message || 'Failed to delete', 'error');
        }
    };

    const inputClass = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[44px]";
    const labelClass = "block text-sm font-medium text-gray-700 mb-1";

    // Quick stats
    const total = students.length;
    const genderStats = students.reduce((acc, s) => {
        const g = (s.gender || '').toLowerCase();
        if (g.startsWith('m')) acc.male += 1;
        else if (g.startsWith('f')) acc.female += 1;
        else acc.other += 1;
        return acc;
    }, { male: 0, female: 0, other: 0 });
    const classCount = new Set(students.map(s => s.class_name)).size;

    // Selection helpers
    const allSelected = students.length > 0 && selectedIds.size === students.length;
    const toggleAll = () => {
        if (allSelected) setSelectedIds(new Set());
        else setSelectedIds(new Set(students.map(s => s.id)));
    };
    const toggleOne = (id) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id); else next.add(id);
        setSelectedIds(next);
    };

    // CSV export
    const exportCSV = (onlySelected = false) => {
        const rows = onlySelected ? students.filter(s => selectedIds.has(s.id)) : students;
        if (rows.length === 0) { showToast('No records to export', 'error'); return; }
        const headers = ['Name', 'Email', 'Admission No', 'Class', 'Section', 'Roll', 'Gender', 'DOB', 'Parent', 'Phone', 'Address'];
        const csv = [
            headers.join(','),
            ...rows.map(s => [
                (s.name || '').replace(/,/g, ' '),
                s.email || '',
                s.admission_number || '',
                s.class_name || '',
                s.section || '',
                s.roll_number || '',
                s.gender || '',
                s.date_of_birth ? new Date(s.date_of_birth).toISOString().slice(0, 10) : '',
                s.parent_name || '',
                s.parent_phone || '',
                (s.address || '').replace(/,/g, ' ')
            ].join(','))
        ].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = onlySelected ? 'students_selected.csv' : 'students_all.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    // Bulk fee create
    const openFeeModal = () => {
        if (selectedIds.size === 0) { showToast('Select at least one student', 'error'); return; }
        setFeeModal({ open: true, amount: '', due_date: '' });
    };
    const submitBulkFee = async () => {
        if (!feeModal.amount) { showToast('Enter amount', 'error'); return; }
        try {
            const ids = Array.from(selectedIds);
            await createBulkFees(ids, { amount: feeModal.amount, due_date: feeModal.due_date });
            showToast('Bulk fees created');
            setFeeModal({ open: false, amount: '', due_date: '' });
        } catch (e) {
            showToast(e.message || 'Failed to create fees', 'error');
        }
    };

    const formTabs = [
        { id: 'personal', label: 'Personal Info', icon: <User className="w-3.5 h-3.5" /> },
        { id: 'guardian', label: 'Guardian', icon: <GraduationCap className="w-3.5 h-3.5" /> },
        { id: 'academic', label: 'Academic History', icon: <FileText className="w-3.5 h-3.5" /> },
        { id: 'documents', label: 'Documents', icon: <Upload className="w-3.5 h-3.5" /> },
    ];

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
                    <h1 className="text-2xl font-bold text-gray-900">Students</h1>
                    <p className="text-sm text-gray-500 mt-1">{students.length} students enrolled</p>
                </div>
                <div className="flex items-center gap-2 self-start">
                    <button onClick={() => exportCSV(selectedIds.size > 0)} className="px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium flex items-center gap-2">
                        <Download className="w-4 h-4" /> {selectedIds.size > 0 ? 'Export Selected' : 'Export All'}
                    </button>
                    <button onClick={() => setImportModalOpen(true)} className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-medium flex items-center gap-2">
                        <FileUp className="w-4 h-4" /> Import CSV
                    </button>
                    <button onClick={openFeeModal} className="px-3 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-xl text-sm font-medium flex items-center gap-2">
                        <DollarSign className="w-4 h-4" /> Bulk Fee
                    </button>
                    <button onClick={openAddModal} className="btn-primary flex items-center gap-2">
                        <Plus className="w-4 h-4" /> New Admission
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 p-4">
                    <p className="text-xs uppercase text-gray-500 font-bold">Total Students</p>
                    <p className="text-2xl font-extrabold text-gray-900 mt-1">{total}</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-4">
                    <p className="text-xs uppercase text-gray-500 font-bold">Boys</p>
                    <p className="text-2xl font-extrabold text-blue-600 mt-1">{genderStats.male}</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-4">
                    <p className="text-xs uppercase text-gray-500 font-bold">Girls</p>
                    <p className="text-2xl font-extrabold text-pink-600 mt-1">{genderStats.female}</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-4">
                    <p className="text-xs uppercase text-gray-500 font-bold">Classes</p>
                    <p className="text-2xl font-extrabold text-emerald-600 mt-1">{classCount}</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name, admission no, or email..."
                            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                    </div>
                    <button onClick={() => setShowFilters(v => !v)} className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white hover:bg-gray-50 flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4" /> Filters
                    </button>
                    <select value={filterClass} onChange={(e) => { setFilterClass(e.target.value); setFilterSection(''); }}
                        className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white">
                        <option value="">All Classes</option>
                        {classes.map((c) => <option key={c.id} value={c.id}>{c.name} {c.section || ''}</option>)}
                    </select>
                    {filterClass && (
                        <select value={filterSection} onChange={(e) => setFilterSection(e.target.value)}
                            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white">
                            <option value="">All Sections</option>
                            {(classes.find(c => c.id === filterClass)?.sectionsList || []).map(sec => (
                                <option key={sec.id} value={sec.id}>{sec.name}</option>
                            ))}
                        </select>
                    )}
                </div>

                {showFilters && (
                    <div className="px-4 pb-3 border-b border-gray-100">
                        <div className="text-xs text-gray-500">Showing {students.length} record(s)</div>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/80 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <th className="py-3.5 px-5 w-10">
                                    <input type="checkbox" checked={allSelected} onChange={toggleAll} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                                </th>
                                <th className="py-3.5 px-5">Student</th>
                                <th className="py-3.5 px-5">Adm. No</th>
                                <th className="py-3.5 px-5">Class</th>
                                <th className="py-3.5 px-5 hidden lg:table-cell">Parent</th>
                                <th className="py-3.5 px-5 hidden md:table-cell">Contact</th>
                                <th className="py-3.5 px-5 text-center w-32">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {students.map((s) => (
                                <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="py-3.5 px-5">
                                        <input type="checkbox" checked={selectedIds.has(s.id)} onChange={() => toggleOne(s.id)} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                                    </td>
                                    <td className="py-3.5 px-5">
                                        <div className="flex items-center gap-3">
                                            {s.photo_url ? (
                                                <img src={s.photo_url} alt={s.name} className="w-9 h-9 rounded-lg object-cover shrink-0" />
                                            ) : (
                                                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                                    {s.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-gray-800 truncate">{s.name}</p>
                                                <p className="text-xs text-gray-400 truncate">{s.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3.5 px-5 text-sm font-mono text-gray-600">{s.admission_number}</td>
                                    <td className="py-3.5 px-5">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700">
                                            {s.class_name} {s.section ? `(${s.section})` : ''}
                                        </span>
                                    </td>
                                    <td className="py-3.5 px-5 text-sm text-gray-600 hidden lg:table-cell">{s.parent_name}</td>
                                    <td className="py-3.5 px-5 text-sm text-gray-500 hidden md:table-cell">{s.parent_phone}</td>
                                    <td className="py-3.5 px-5">
                                        <div className="flex items-center justify-center gap-1">
                                            <button onClick={() => setSelectedStudent(s)} className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg" title="View"><Eye className="w-4 h-4" /></button>
                                            <button onClick={() => openEditModal(s)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg" title="Edit"><Edit2 className="w-4 h-4" /></button>
                                            <button onClick={() => handleDelete(s.id, s.name)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {students.length === 0 && (
                                <tr><td colSpan="6" className="py-12 text-center text-gray-400">
                                    <GraduationCap className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                    <p className="font-medium">No students found</p>
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Bulk Fee Modal */}
            {feeModal.open && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setFeeModal({ open: false, amount: '', due_date: '' })}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900">Create Bulk Fees</h3>
                            <button onClick={() => setFeeModal({ open: false, amount: '', due_date: '' })}><X className="w-5 h-5 text-gray-400" /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className={labelClass}>Amount *</label>
                                <input type="number" value={feeModal.amount} onChange={e => setFeeModal({ ...feeModal, amount: e.target.value })} className={inputClass} placeholder="e.g., 1500" />
                            </div>
                            <div>
                                <label className={labelClass}>Due Date</label>
                                <input type="date" value={feeModal.due_date} onChange={e => setFeeModal({ ...feeModal, due_date: e.target.value })} className={inputClass} />
                            </div>
                            <div className="text-xs text-gray-500">Applying to <span className="font-semibold text-gray-700">{selectedIds.size}</span> selected student(s).</div>
                        </div>
                        <div className="p-5 border-t border-gray-100 flex gap-2">
                            <button onClick={() => setFeeModal({ open: false, amount: '', due_date: '' })} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
                            <button onClick={submitBulkFee} className="flex-1 btn-primary py-2.5">Create Fees</button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Modal */}
            {selectedStudent && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedStudent(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900">Student Details</h3>
                            <button onClick={() => setSelectedStudent(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="flex items-center gap-5 mb-2">
                                {selectedStudent.photo_url ? (
                                    <img src={selectedStudent.photo_url} alt={selectedStudent.name}
                                        className="w-20 h-20 rounded-2xl object-cover shadow-md border-2 border-white" />
                                ) : (
                                    <div className="w-20 h-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl">
                                        {selectedStudent.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                    </div>
                                )}
                                <div>
                                    <h4 className="text-xl font-bold text-gray-900">{selectedStudent.name}</h4>
                                    <p className="text-sm text-gray-500">{selectedStudent.email}</p>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 mt-1">
                                        {selectedStudent.class_name || 'N/A'} {selectedStudent.section ? `(${selectedStudent.section})` : ''}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Personal Information</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                                    {[
                                        ['Admission No', selectedStudent.admission_number],
                                        ['Roll Number', selectedStudent.roll_number || 'N/A'],
                                        ['Gender', selectedStudent.gender || 'N/A'],
                                        ['Date of Birth', selectedStudent.date_of_birth ? new Date(selectedStudent.date_of_birth).toLocaleDateString() : 'N/A'],
                                        ['Blood Group', selectedStudent.blood_group || 'N/A'],
                                        ['Nationality', selectedStudent.nationality || 'N/A'],
                                        ['Religion', selectedStudent.religion || 'N/A'],
                                    ].map(([label, value], i) => (
                                        <div key={i}>
                                            <p className="text-gray-400 font-medium text-xs uppercase tracking-wider">{label}</p>
                                            <p className="text-gray-800 font-semibold mt-0.5">{value}</p>
                                        </div>
                                    ))}
                                </div>
                                {selectedStudent.address && (
                                    <div className="mt-3">
                                        <p className="text-gray-400 font-medium text-xs uppercase tracking-wider">Address</p>
                                        <p className="text-gray-800 font-semibold mt-0.5 text-sm">{selectedStudent.address}</p>
                                    </div>
                                )}
                            </div>
                            <div className="border-t border-gray-100 pt-4">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Guardian Information</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                                    {[
                                        ['Father/Guardian', selectedStudent.parent_name || 'N/A'],
                                        ['Father Phone', selectedStudent.parent_phone || 'N/A'],
                                        ['Father Email', selectedStudent.parent_email || 'N/A'],
                                        ['Mother Name', selectedStudent.mother_name || 'N/A'],
                                        ['Mother Phone', selectedStudent.mother_phone || 'N/A'],
                                        ['Emergency Contact', selectedStudent.emergency_contact || 'N/A'],
                                    ].map(([label, value], i) => (
                                        <div key={i}>
                                            <p className="text-gray-400 font-medium text-xs uppercase tracking-wider">{label}</p>
                                            <p className="text-gray-800 font-semibold mt-0.5">{value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {(selectedStudent.previous_school || selectedStudent.previous_class || selectedStudent.previous_marks || selectedStudent.transfer_certificate) && (
                                <div className="border-t border-gray-100 pt-4">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Previous Academic History</h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        {[
                                            ['Previous School', selectedStudent.previous_school],
                                            ['Previous Class', selectedStudent.previous_class],
                                            ['Previous Marks/GPA', selectedStudent.previous_marks],
                                            ['Transfer Certificate', selectedStudent.transfer_certificate],
                                        ].filter(([, v]) => v).map(([label, value], i) => (
                                            <div key={i}>
                                                <p className="text-gray-400 font-medium text-xs uppercase tracking-wider">{label}</p>
                                                <p className="text-gray-800 font-semibold mt-0.5">{value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="border-t border-gray-100 pt-4">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Performance (Current Year)</h4>
                                {perfRows.length === 0 ? (
                                    <p className="text-sm text-gray-400">No marks recorded</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-gray-50">
                                                    <th className="text-left py-2 px-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Exam</th>
                                                    <th className="text-left py-2 px-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Type</th>
                                                    <th className="text-left py-2 px-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Date</th>
                                                    <th className="text-left py-2 px-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Subject</th>
                                                    <th className="text-right py-2 px-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Marks</th>
                                                    <th className="text-center py-2 px-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Grade</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {perfRows.map((r, idx) => (
                                                    <tr key={idx} className="hover:bg-gray-50">
                                                        <td className="py-2 px-3">{r.exam_name}</td>
                                                        <td className="py-2 px-3 text-gray-500">{r.exam_type || '—'}</td>
                                                        <td className="py-2 px-3 text-gray-500">{r.exam_date ? new Date(r.exam_date).toLocaleDateString() : '—'}</td>
                                                        <td className="py-2 px-3">{r.subject_name}</td>
                                                        <td className="py-2 px-3 text-right font-semibold text-gray-900">{r.marks}/{r.full}</td>
                                                        <td className="py-2 px-3 text-center">
                                                            {r.grade && <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold bg-gray-100 text-gray-700">{r.grade}</span>}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                            {(selectedStudent.photo_url || selectedStudent.certificate_url) && (
                                <div className="border-t border-gray-100 pt-4">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Uploaded Documents</h4>
                                    <div className="flex flex-wrap gap-4">
                                        {selectedStudent.photo_url && (
                                            <div>
                                                <p className="text-xs text-gray-400 mb-1.5">Passport Photo</p>
                                                <img src={selectedStudent.photo_url} alt="Photo" className="w-24 h-28 rounded-xl object-cover border border-gray-200 shadow-sm" />
                                            </div>
                                        )}
                                        {selectedStudent.certificate_url && (
                                            <div>
                                                <p className="text-xs text-gray-400 mb-1.5">Record Certificate</p>
                                                {selectedStudent.certificate_url.match(/\.(jpg|jpeg|png|gif|webp)/i) ? (
                                                    <img src={selectedStudent.certificate_url} alt="Certificate"
                                                        className="w-40 h-28 rounded-xl object-cover border border-gray-200 shadow-sm cursor-pointer"
                                                        onClick={() => window.open(selectedStudent.certificate_url, '_blank')} />
                                                ) : (
                                                    <a href={selectedStudent.certificate_url} target="_blank" rel="noreferrer"
                                                        className="inline-flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-primary hover:bg-gray-100 transition-colors">
                                                        <FileText className="w-5 h-5" /> View Certificate
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            {selectedStudent.parent_user_id && (
                                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" /> Parent has a login account linked
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setShowModal(false); resetForm(); }}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">{editingStudent ? 'Edit Student' : 'New Student Admission'}</h3>
                                <p className="text-sm text-gray-500 mt-0.5">{editingStudent ? 'Update student information' : 'Fill in all details to admit a new student'}</p>
                            </div>
                            <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                        </div>

                        {credentials && (
                            <div className="mx-6 mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                                <h4 className="font-bold text-green-800 mb-2 flex items-center gap-2"><CheckCircle className="w-5 h-5" /> Student Admitted Successfully!</h4>
                                <p className="text-sm text-green-700 mb-3">Login credentials have been created:</p>
                                <div className="space-y-2 text-sm">
                                    <div className="bg-white p-3 rounded-lg border border-green-100">
                                        <p className="text-xs font-bold text-gray-500 uppercase">Student Login</p>
                                        <p>Email: <span className="font-mono font-bold">{credentials.student?.email}</span></p>
                                        <p>Password: <span className="font-mono font-bold">{credentials.student?.password}</span></p>
                                    </div>
                                    {credentials.parent && (
                                        <div className="bg-white p-3 rounded-lg border border-green-100">
                                            <p className="text-xs font-bold text-gray-500 uppercase">Parent Login</p>
                                            <p>Email: <span className="font-mono font-bold">{credentials.parent?.email}</span></p>
                                            <p>Password: <span className="font-mono font-bold">{credentials.parent?.password}</span></p>
                                        </div>
                                    )}
                                </div>
                                <button onClick={() => { setShowModal(false); resetForm(); }} className="mt-3 w-full btn-primary py-2">Done</button>
                            </div>
                        )}

                        {!credentials && (
                            <form onSubmit={handleSubmit}>
                                {/* Tabs */}
                                <div className="flex border-b border-gray-100 px-6 pt-3 gap-1 overflow-x-auto">
                                    {formTabs.map(tab => (
                                        <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
                                            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                                                ? 'border-primary text-primary bg-primary/5'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                                }`}>
                                            {tab.icon} {tab.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="p-6 space-y-5">
                                    {/* Tab: Personal Info */}
                                    {activeTab === 'personal' && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <FormField label="Full Name" name="name" required icon={User}
                                                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                                placeholder="Student's full name as per birth certificate"
                                                helper="Enter the student's legal full name"
                                                className="sm:col-span-2" />
                                            <FormField label="Email" name="email" type="email" required icon={Mail}
                                                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                                                placeholder="student@sevenstar.edu.np"
                                                helper="This will be used for login credentials" />
                                            {!editingStudent && (
                                                <FormField label="Password" name="password"
                                                    value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                                                    placeholder="Default: student123"
                                                    helper="Leave blank to use default password" />
                                            )}
                                            <FormField label="Class" name="class_id" type="select" required
                                                value={form.class_id} onChange={e => setForm({ ...form, class_id: e.target.value })}
                                                helper="Assign the student to a class"
                                                options={[{ value: '', label: 'Select class' }, ...classes.map(c => ({ value: c.id, label: `${c.name} ${c.section || ''}` }))]} />
                                            <FormField label="Roll Number" name="roll_number" type="number" icon={Hash}
                                                value={form.roll_number} onChange={e => setForm({ ...form, roll_number: e.target.value })}
                                                placeholder="1" min="1"
                                                helper="Unique roll number within the class" />
                                            <FormField label="Gender" name="gender" type="select" required
                                                value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}
                                                options={[{ value: '', label: 'Select gender' }, { value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }, { value: 'Other', label: 'Other' }]} />
                                            <FormField label="Date of Birth" name="date_of_birth" type="date" required icon={Calendar}
                                                value={form.date_of_birth} onChange={e => setForm({ ...form, date_of_birth: e.target.value })}
                                                helper="Student must be between 3-20 years old"
                                                max={new Date(new Date().setFullYear(new Date().getFullYear() - 3)).toISOString().split('T')[0]} />
                                            <FormField label="Blood Group" name="blood_group" type="select"
                                                value={form.blood_group} onChange={e => setForm({ ...form, blood_group: e.target.value })}
                                                helper="Important for medical emergencies"
                                                options={[{ value: '', label: 'Select blood group' }, ...['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => ({ value: bg, label: bg }))]} />
                                            <FormField label="Nationality" name="nationality"
                                                value={form.nationality} onChange={e => setForm({ ...form, nationality: e.target.value })}
                                                placeholder="Nepali" />
                                            <FormField label="Religion" name="religion" type="select"
                                                value={form.religion} onChange={e => setForm({ ...form, religion: e.target.value })}
                                                options={[{ value: '', label: 'Select religion' }, ...['Hindu', 'Buddhist', 'Muslim', 'Christian', 'Kirant', 'Other'].map(r => ({ value: r, label: r }))]} />
                                            <FormField label="Address" name="address" required icon={MapPin}
                                                value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                                                placeholder="Ward No., Municipality/VDC, District"
                                                helper="Full permanent address"
                                                className="sm:col-span-2" />
                                        </div>
                                    )}

                                    {/* Tab: Guardian */}
                                    {activeTab === 'guardian' && (
                                        <div className="space-y-5">
                                            <div>
                                                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Father / Guardian</h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <FormField label="Father/Guardian Name" name="parent_name" required icon={User}
                                                        value={form.parent_name} onChange={e => setForm({ ...form, parent_name: e.target.value })}
                                                        placeholder="Father or guardian's full name"
                                                        helper="Legal guardian responsible for the student" />
                                                    <FormField label="Phone" name="parent_phone" type="tel" required icon={Phone}
                                                        value={form.parent_phone} onChange={e => setForm({ ...form, parent_phone: e.target.value })}
                                                        placeholder="98XXXXXXXX"
                                                        helper="10-digit mobile number" />
                                                    <FormField label="Email" name="parent_email" type="email" icon={Mail}
                                                        value={form.parent_email} onChange={e => setForm({ ...form, parent_email: e.target.value })}
                                                        placeholder="father@email.com"
                                                        helper="Required if creating parent login account" />
                                                    {!editingStudent && (
                                                        <div className="flex items-end">
                                                            <label className="flex items-center gap-2 cursor-pointer pb-2.5">
                                                                <input type="checkbox" checked={form.create_parent_account} onChange={e => setForm({ ...form, create_parent_account: e.target.checked })}
                                                                    className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary" />
                                                                <div>
                                                                    <span className="text-sm text-gray-700 font-medium">Create parent login</span>
                                                                    <p className="text-[11px] text-gray-400">Parent can track attendance, fees & results</p>
                                                                </div>
                                                            </label>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="border-t border-gray-100 pt-5">
                                                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Mother</h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <FormField label="Mother's Name" name="mother_name" icon={User}
                                                        value={form.mother_name} onChange={e => setForm({ ...form, mother_name: e.target.value })}
                                                        placeholder="Mother's full name" />
                                                    <FormField label="Mother's Phone" name="mother_phone" type="tel" icon={Phone}
                                                        value={form.mother_phone} onChange={e => setForm({ ...form, mother_phone: e.target.value })}
                                                        placeholder="98XXXXXXXX"
                                                        helper="Optional — 10-digit mobile number" />
                                                </div>
                                            </div>
                                            <div className="border-t border-gray-100 pt-5">
                                                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Emergency</h4>
                                                <FormField label="Emergency Contact Number" name="emergency_contact" type="tel" icon={Phone}
                                                    value={form.emergency_contact} onChange={e => setForm({ ...form, emergency_contact: e.target.value })}
                                                    placeholder="Emergency phone number"
                                                    helper="Alternate contact for emergencies (neighbor, relative)" />
                                            </div>
                                        </div>
                                    )}

                                    {/* Tab: Academic History */}
                                    {activeTab === 'academic' && (
                                        <div className="space-y-4">
                                            <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                                                <p className="text-sm text-blue-600 font-medium">📋 Previous Academic Record</p>
                                                <p className="text-xs text-blue-500 mt-0.5">Fill in details from the student's previous school. All fields are optional.</p>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <FormField label="Previous School Name" name="previous_school"
                                                    value={form.previous_school} onChange={e => setForm({ ...form, previous_school: e.target.value })}
                                                    placeholder="Name of the previous school attended"
                                                    helper="Full name with location"
                                                    className="sm:col-span-2" />
                                                <FormField label="Previous Class / Grade" name="previous_class"
                                                    value={form.previous_class} onChange={e => setForm({ ...form, previous_class: e.target.value })}
                                                    placeholder="e.g. Class 8 / Grade 8"
                                                    helper="Last class/grade completed" />
                                                <FormField label="Marks / GPA Obtained" name="previous_marks"
                                                    value={form.previous_marks} onChange={e => setForm({ ...form, previous_marks: e.target.value })}
                                                    placeholder="e.g. 3.6 GPA or 85%"
                                                    helper="Final result from previous school" />
                                                <FormField label="Transfer Certificate (TC) Number" name="transfer_certificate"
                                                    value={form.transfer_certificate} onChange={e => setForm({ ...form, transfer_certificate: e.target.value })}
                                                    placeholder="TC number from previous school"
                                                    helper="Required for transfer admissions"
                                                    className="sm:col-span-2" />
                                            </div>
                                        </div>
                                    )}

                                    {/* Tab: Documents */}
                                    {activeTab === 'documents' && (
                                        <div className="space-y-6">
                                            <p className="text-sm text-gray-500 -mt-1">Upload the student's passport-size photograph and record/transfer certificate.</p>
                                            <div>
                                                <label className={labelClass}>Passport Size Photo</label>
                                                <p className="text-xs text-gray-400 mb-2">JPG/PNG, max 2MB</p>
                                                <div className="flex items-start gap-4">
                                                    <div className="w-28 h-36 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center overflow-hidden shrink-0">
                                                        {photoPreview ? (
                                                            <img src={photoPreview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                                                        ) : (
                                                            <>
                                                                <Camera className="w-8 h-8 text-gray-300 mb-1" />
                                                                <span className="text-xs text-gray-400">No photo</span>
                                                            </>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary/10 text-primary rounded-xl text-sm font-medium cursor-pointer hover:bg-primary/20 transition-colors">
                                                            <Upload className="w-4 h-4" />
                                                            {photoPreview ? 'Change Photo' : 'Upload Photo'}
                                                            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
                                                        </label>
                                                        {photoFile && <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> {photoFile.name}</p>}
                                                        {!photoFile && form.photo_url && <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Photo already uploaded</p>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <label className={labelClass}>Record / Transfer Certificate</label>
                                                <p className="text-xs text-gray-400 mb-2">JPG/PNG/PDF, max 5MB</p>
                                                <div className="flex items-start gap-4">
                                                    <div className="w-28 h-36 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center overflow-hidden shrink-0">
                                                        {certificatePreview && typeof certificatePreview === 'string' && (certificatePreview.startsWith('http') || certificatePreview.startsWith('blob:')) ? (
                                                            certificatePreview.match(/\.(jpg|jpeg|png|gif|webp)/i) || certificatePreview.startsWith('blob:') ? (
                                                                <img src={certificatePreview} alt="Certificate" className="w-full h-full object-cover rounded-lg" />
                                                            ) : (
                                                                <div className="text-center p-2"><FileText className="w-8 h-8 text-primary mx-auto mb-1" /><span className="text-xs text-gray-500">PDF</span></div>
                                                            )
                                                        ) : certificatePreview ? (
                                                            <div className="text-center p-2"><FileText className="w-8 h-8 text-primary mx-auto mb-1" /><span className="text-xs text-gray-500 truncate block max-w-[96px]">{certificatePreview}</span></div>
                                                        ) : (
                                                            <><FileText className="w-8 h-8 text-gray-300 mb-1" /><span className="text-xs text-gray-400">No file</span></>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-sm font-medium cursor-pointer hover:bg-blue-100 transition-colors">
                                                            <Upload className="w-4 h-4" />
                                                            {form.certificate_url || certificateFile ? 'Change Certificate' : 'Upload Certificate'}
                                                            <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleCertificateSelect} />
                                                        </label>
                                                        {certificateFile && <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> {certificateFile.name}</p>}
                                                        {!certificateFile && form.certificate_url && <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Certificate already uploaded</p>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-3 pt-3 border-t border-gray-100">
                                        <button type="button" onClick={() => { setShowModal(false); resetForm(); }}
                                            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                                        <button type="submit" disabled={saving} className="flex-1 btn-primary py-2.5 flex items-center justify-center gap-2">
                                            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                            {uploading ? 'Uploading files...' : editingStudent ? 'Update Student' : 'Admit Student'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* CSV Import Modal */}
            <CSVImportModal
                open={importModalOpen}
                onClose={() => { setImportModalOpen(false); fetchStudents(); }}
                title="Import Students"
                entityName="students"
                templateHeaders={['Name', 'Email', 'Class', 'Roll', 'Gender', 'DOB', 'Blood Group', 'Address', 'Father Name', 'Father Phone', 'Mother Name', 'Mother Phone']}
                sampleRow={['Aarav Sharma', 'aarav@sevenstar.edu.np', 'Class 10', '1', 'Male', '2010-03-15', 'A+', 'Kathmandu-7', 'Hari Sharma', '9841100001', 'Sita Sharma', '9841100002']}
                requiredFields={['Name', 'Email']}
                onImport={(rows) => bulkCreateStudents(rows, classes)}
            />
        </div>
    );
};

export default AdminStudents;
