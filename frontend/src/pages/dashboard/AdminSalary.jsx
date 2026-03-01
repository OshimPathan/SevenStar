import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, X, Loader2, Search, AlertCircle, CheckCircle, Users, Calendar, CreditCard } from 'lucide-react';
import { getSalaryPayments, createSalaryPayment, deleteSalaryPayment, getTeachers } from '../../api';
import FormField from '../../components/FormField';

const AdminSalary = () => {
    const [payments, setPayments] = useState([]);
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; });
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ staff_id: '', amount: '', month_year: '', payment_date: '', payment_method: 'Bank Transfer' });
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };
    const load = async () => {
        setLoading(true);
        try {
            const [pRes, sRes] = await Promise.all([getSalaryPayments({ month }), getTeachers()]);
            setPayments(pRes?.payments || []); setStaff(sRes?.teachers || []);
        } catch (e) { showToast(e.message, 'error'); }
        setLoading(false);
    };
    useEffect(() => { load(); }, [month]);

    const handleSave = async (e) => {
        e.preventDefault(); setSaving(true);
        try {
            await createSalaryPayment(form);
            showToast('Payment recorded'); setShowModal(false); load();
        } catch (e) { showToast(e.message, 'error'); }
        setSaving(false);
    };
    const handleDelete = async (id) => {
        if (!confirm('Delete this payment record?')) return;
        try { await deleteSalaryPayment(id); showToast('Payment deleted'); load(); } catch (e) { showToast(e.message, 'error'); }
    };

    const totalPaid = payments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
    const methods = ['Cash', 'Bank Transfer', 'Cheque', 'Online'];

    if (loading && staff.length === 0) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>;

    return (
        <div className="space-y-6 animate-fade-in-up">
            {toast && <div className={`fixed top-4 right-4 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}><AlertCircle className="w-4 h-4" />{toast.msg}</div>}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div><h1 className="text-2xl font-bold text-gray-900">Salary Payments</h1><p className="text-sm text-gray-500 mt-1">{payments.length} payments • Rs. {totalPaid.toLocaleString()} total for {month}</p></div>
                <div className="flex gap-2 items-center">
                    <input type="month" value={month} onChange={e => setMonth(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                    <button onClick={() => { setForm({ staff_id: '', amount: '', month_year: month, payment_date: new Date().toISOString().split('T')[0], payment_method: 'Bank Transfer' }); setShowModal(true); }} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Record Payment</button>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                {[{ l: 'Payments This Month', v: payments.length, c: 'bg-primary/10 text-primary' }, { l: 'Total Paid', v: `Rs. ${totalPaid.toLocaleString()}`, c: 'bg-green-50 text-green-600' }, { l: 'Total Staff', v: staff.length, c: 'bg-blue-50 text-blue-600' }].map((s, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-100 p-4"><p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{s.l}</p><p className="text-2xl font-bold text-gray-900 mt-1">{s.v}</p></div>
                ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm"><thead><tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><th className="px-4 py-3">Employee</th><th className="px-4 py-3">ID</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Method</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"></th></tr></thead>
                    <tbody className="divide-y divide-gray-100">{payments.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50/50">
                            <td className="px-4 py-3 font-semibold text-gray-900">{p.staff?.first_name} {p.staff?.last_name}</td>
                            <td className="px-4 py-3 text-gray-500 text-xs font-mono">{p.staff?.employee_id || '—'}</td>
                            <td className="px-4 py-3 font-bold text-green-700">Rs. {parseFloat(p.amount).toLocaleString()}</td>
                            <td className="px-4 py-3 text-gray-500 text-xs">{p.payment_date}</td>
                            <td className="px-4 py-3"><span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{p.payment_method || '—'}</span></td>
                            <td className="px-4 py-3"><span className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs font-bold">{p.status}</span></td>
                            <td className="px-4 py-3 text-right"><button onClick={() => handleDelete(p.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button></td>
                        </tr>
                    ))}{payments.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-gray-400">No payments for this month</td></tr>}</tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold">Record Salary Payment</h3>
                                <p className="text-sm text-gray-500 mt-0.5">Log a new salary payment for a staff member</p>
                            </div>
                            <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <FormField label="Staff Member" name="staff_id" type="select" required icon={Users}
                                value={form.staff_id} onChange={e => setForm({ ...form, staff_id: e.target.value })}
                                helper="Select the teacher or staff to pay"
                                options={[{ value: '', label: 'Select staff member' }, ...staff.map(s => ({ value: s.id, label: `${s.first_name} ${s.last_name} (${s.employee_id})` }))]} />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField label="Amount (Rs.)" name="amount" type="number" required icon={DollarSign}
                                    value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                                    min={1} helper="Gross salary amount in Nepali Rupees" />
                                <FormField label="Salary Month" name="month_year" type="month" icon={Calendar}
                                    value={form.month_year} onChange={e => setForm({ ...form, month_year: e.target.value })}
                                    helper="Which month is this payment for?" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField label="Payment Date" name="payment_date" type="date" icon={Calendar}
                                    value={form.payment_date} onChange={e => setForm({ ...form, payment_date: e.target.value })}
                                    helper="Date when payment was made" />
                                <FormField label="Payment Method" name="payment_method" type="select" icon={CreditCard}
                                    value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })}
                                    helper="How was the payment made?"
                                    options={methods.map(m => ({ value: m, label: m }))} />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
                                <button type="submit" disabled={saving} className="flex-1 btn-primary py-2.5 flex items-center justify-center gap-2">
                                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {saving ? 'Saving...' : 'Record Payment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSalary;
