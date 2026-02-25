import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Filter, Download, Receipt, Search } from 'lucide-react';
import { getMonthlyCollections, getAttendanceMonthlySummary } from '../../api';

const monthString = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
};

const AdminAccounting = () => {
    const [month, setMonth] = useState(monthString(new Date()));
    const [search, setSearch] = useState('');
    const [collections, setCollections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [attendanceMonth, setAttendanceMonth] = useState(monthString(new Date()));
    const [attendanceSummary, setAttendanceSummary] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [coll] = await Promise.all([
                    getMonthlyCollections(month),
                ]);
                setCollections(coll || []);
            } catch (e) {
                setCollections([]);
            }
            setLoading(false);
        };
        fetchData();
    }, [month]);

    useEffect(() => {
        const fetchAttendance = async () => {
            try {
                const data = await getAttendanceMonthlySummary(attendanceMonth);
                setAttendanceSummary(data || []);
            } catch {
                setAttendanceSummary([]);
            }
        };
        fetchAttendance();
    }, [attendanceMonth]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return collections;
        return collections.filter(r =>
            r.student_name?.toLowerCase().includes(q) ||
            r.class_name?.toLowerCase().includes(q) ||
            r.receipt_no?.toLowerCase().includes(q)
        );
    }, [collections, search]);

    const totals = useMemo(() => {
        const total = filtered.reduce((s, r) => s + (parseFloat(r.amount_paid || r.amount || 0)), 0);
        return { total };
    }, [filtered]);

    const exportCSV = () => {
        const headers = ['Date', 'Receipt', 'Student', 'Class', 'Amount', 'Method', 'Reference'];
        const rows = filtered.map(r => [
            (r.paid_at || r.updated_at || '').split('T')[0],
            r.receipt_no || '',
            r.student_name || '',
            r.class_name || '',
            r.amount_paid || r.amount || 0,
            r.method || '',
            r.reference || '',
        ]);
        const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `collections_${month}.csv`; a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Accounting</h1>
                    <p className="text-sm text-gray-500 mt-1">Monthly collections, receipts, and attendance locks overview</p>
                </div>
                <div className="flex items-center gap-2">
                    <input type="month" value={month} onChange={e => setMonth(e.target.value)}
                           className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm" />
                    <button onClick={exportCSV}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Receipt className="w-5 h-5 text-primary" />
                            <h3 className="font-bold text-gray-900">Monthly Collections</h3>
                        </div>
                        <div className="relative max-w-xs">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                                   placeholder="Search student, class, receipt..."
                                   className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                            <tr className="bg-gray-50/80 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <th className="py-3.5 px-5">Date</th>
                                <th className="py-3.5 px-5">Receipt</th>
                                <th className="py-3.5 px-5">Student</th>
                                <th className="py-3.5 px-5 hidden md:table-cell">Class</th>
                                <th className="py-3.5 px-5 text-right">Amount</th>
                                <th className="py-3.5 px-5 hidden sm:table-cell">Method</th>
                                <th className="py-3.5 px-5 hidden lg:table-cell">Reference</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan="7" className="py-12 text-center text-gray-400">Loading...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="7" className="py-12 text-center text-gray-400">No collections this month</td></tr>
                            ) : filtered.map((r) => (
                                <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="py-3.5 px-5 text-sm text-gray-600">{(r.paid_at || r.updated_at || '').split('T')[0]}</td>
                                    <td className="py-3.5 px-5 text-sm font-mono">{r.receipt_no || '—'}</td>
                                    <td className="py-3.5 px-5">
                                        <p className="text-sm font-medium text-gray-800">{r.student_name}</p>
                                        <p className="text-xs text-gray-400 md:hidden">{r.class_name}</p>
                                    </td>
                                    <td className="py-3.5 px-5 hidden md:table-cell text-sm text-gray-600">{r.class_name}</td>
                                    <td className="py-3.5 px-5 text-right text-sm font-bold text-gray-900">रू {parseFloat(r.amount_paid || r.amount || 0).toLocaleString()}</td>
                                    <td className="py-3.5 px-5 hidden sm:table-cell text-xs text-gray-500">{r.method || '—'}</td>
                                    <td className="py-3.5 px-5 hidden lg:table-cell text-xs text-gray-500">{r.reference || '—'}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm">
                        <span className="text-gray-500">Showing {filtered.length} records</span>
                        <span className="font-bold text-gray-900">Total: रू {totals.total.toLocaleString()}</span>
                    </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-primary" />
                            <h3 className="font-bold text-gray-900">Attendance (Monthly)</h3>
                        </div>
                        <input type="month" value={attendanceMonth} onChange={e => setAttendanceMonth(e.target.value)}
                               className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm" />
                    </div>
                    <div className="p-4">
                        {attendanceSummary.length === 0 ? (
                            <div className="text-center text-gray-400 text-sm py-10">No attendance entries</div>
                        ) : (
                            <div className="space-y-2">
                                {attendanceSummary.map(d => (
                                    <div key={d.date} className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">{d.date}</span>
                                        <span className="text-gray-500">Present: <b className="text-gray-700">{d.present}</b></span>
                                        <span className="text-gray-500">Absent: <b className="text-gray-700">{d.absent}</b></span>
                                        <span className="text-gray-500">Late: <b className="text-gray-700">{d.late}</b></span>
                                        <span className="text-gray-500">Total: <b className="text-gray-700">{d.total}</b></span>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                            Attendance retro-edits are restricted by academic year or time-window locks configured by admin.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminAccounting;

