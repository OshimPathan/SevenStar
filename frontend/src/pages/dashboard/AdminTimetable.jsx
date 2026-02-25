import React, { useState, useEffect } from 'react';
import { Calendar, Plus, X, Loader2, Trash2, AlertCircle } from 'lucide-react';
import { getTimetableForClass, saveTimetableSlot, deleteTimetableSlot, getAllClasses, getSubjectsByClass, getActiveAcademicYear } from '../../api';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

const AdminTimetable = () => {
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [slots, setSlots] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ day_of_week: 0, period: 1, start_time: '', end_time: '', class_subject_id: '', room: '' });
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [academicYear, setAcademicYear] = useState(null);

    const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

    useEffect(() => {
        (async () => {
            try {
                const [clsRes, yr] = await Promise.all([getAllClasses(), getActiveAcademicYear()]);
                setClasses(clsRes.classes || []); setAcademicYear(yr);
            } catch (e) { showToast(e.message, 'error'); }
            setLoading(false);
        })();
    }, []);

    const loadSlots = async (classId, sectionId) => {
        if (!classId) return;
        setLoading(true);
        try {
            const [res, subRes] = await Promise.all([getTimetableForClass(classId, sectionId), getSubjectsByClass(classId)]);
            setSlots(res.slots); setSubjects(subRes.subjects || []);
        } catch (e) { showToast(e.message, 'error'); }
        setLoading(false);
    };

    const handleClassChange = (classId) => {
        setSelectedClass(classId); setSelectedSection(''); setSlots([]); setSubjects([]);
        if (classId) loadSlots(classId, '');
    };

    const handleSave = async (e) => {
        e.preventDefault(); setSaving(true);
        try {
            await saveTimetableSlot({ ...form, class_id: selectedClass, section_id: selectedSection || null, academic_year_id: academicYear?.id });
            showToast('Slot saved'); setShowModal(false); loadSlots(selectedClass, selectedSection);
        } catch (e) { showToast(e.message, 'error'); }
        setSaving(false);
    };

    const handleDelete = async (id) => {
        try { await deleteTimetableSlot(id); showToast('Slot removed'); loadSlots(selectedClass, selectedSection); } catch (e) { showToast(e.message, 'error'); }
    };

    const getSlot = (day, period) => slots.find(s => s.day_of_week === day && s.period === period);

    if (loading && classes.length === 0) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>;

    return (
        <div className="space-y-6 animate-fade-in-up">
            {toast && <div className={`fixed top-4 right-4 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}><AlertCircle className="w-4 h-4" />{toast.msg}</div>}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div><h1 className="text-2xl font-bold text-gray-900">Timetable Management</h1><p className="text-sm text-gray-500 mt-1">Create and manage class timetables</p></div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex flex-wrap gap-4 items-end">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                        <select value={selectedClass} onChange={e => handleClassChange(e.target.value)} className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-w-[150px]"><option value="">Select Class</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                    </div>
                    {selectedClass && (
                        <button onClick={() => { setForm({ day_of_week: 0, period: 1, start_time: '', end_time: '', class_subject_id: '', room: '' }); setShowModal(true); }} className="btn-primary flex items-center gap-2 h-fit"><Plus className="w-4 h-4" /> Add Slot</button>
                    )}
                </div>
            </div>

            {selectedClass && (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead><tr className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <th className="px-3 py-3 text-left border-r border-gray-200 w-24">Day / Period</th>
                            {PERIODS.map(p => <th key={p} className="px-3 py-3 text-center border-r border-gray-200 min-w-[120px]">Period {p}</th>)}
                        </tr></thead>
                        <tbody>{DAYS.map((day, dIdx) => (
                            <tr key={dIdx} className="border-t border-gray-100 hover:bg-gray-50/30">
                                <td className="px-3 py-2 font-semibold text-gray-700 border-r border-gray-200 text-xs">{day}</td>
                                {PERIODS.map(p => {
                                    const slot = getSlot(dIdx, p);
                                    return (
                                        <td key={p} className="px-2 py-2 border-r border-gray-100 text-center">
                                            {slot ? (
                                                <div className="bg-primary/5 border border-primary/20 rounded-lg px-2 py-1.5 relative group">
                                                    <p className="text-xs font-semibold text-primary">{slot.class_subjects?.subjects?.name || 'Subject'}</p>
                                                    {slot.room && <p className="text-[10px] text-gray-400 mt-0.5">{slot.room}</p>}
                                                    {slot.start_time && <p className="text-[10px] text-gray-400">{slot.start_time?.slice(0, 5)} - {slot.end_time?.slice(0, 5)}</p>}
                                                    <button onClick={() => handleDelete(slot.id)} className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-400 text-white hidden group-hover:flex items-center justify-center"><X className="w-2.5 h-2.5" /></button>
                                                </div>
                                            ) : (
                                                <span className="text-gray-200">—</span>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
            )}

            {!selectedClass && <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center"><Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500 font-medium">Select a class to view/edit timetable</p></div>}

            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
                        <div className="p-6 border-b border-gray-100 flex justify-between"><h3 className="text-lg font-bold">Add Timetable Slot</h3><button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button></div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Day *</label><select required value={form.day_of_week} onChange={e => setForm({ ...form, day_of_week: parseInt(e.target.value) })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">{DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}</select></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Period *</label><select required value={form.period} onChange={e => setForm({ ...form, period: parseInt(e.target.value) })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">{PERIODS.map(p => <option key={p} value={p}>Period {p}</option>)}</select></div>
                            </div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Subject</label><select value={form.class_subject_id} onChange={e => setForm({ ...form, class_subject_id: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"><option value="">Select</option>{subjects.map(s => <option key={s.id} value={s.class_subject_id || s.id}>{s.name}</option>)}</select></div>
                            <div className="grid grid-cols-3 gap-4">
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label><input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" /></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">End Time</label><input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" /></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Room</label><input type="text" value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="e.g. Room 301" /></div>
                            </div>
                            <div className="flex gap-3 pt-2"><button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button><button type="submit" disabled={saving} className="flex-1 btn-primary py-2.5">{saving ? 'Saving...' : 'Add Slot'}</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminTimetable;
