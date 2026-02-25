import React, { useState, useEffect } from 'react';
import { Package, Plus, X, Loader2, Search, AlertCircle } from 'lucide-react';
import { getInventoryItems, addInventoryItem, updateInventoryItem, deleteInventoryItem } from '../../api';

const AdminInventory = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({ item_name: '', category: '', quantity: 0, unit_price: '', purchase_date: '', status: 'Good' });
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };
    const load = async () => {
        setLoading(true);
        try { const res = await getInventoryItems({ search }); setItems(res.items); } catch (e) { showToast(e.message, 'error'); }
        setLoading(false);
    };
    useEffect(() => { load(); }, []);

    const handleSave = async (e) => {
        e.preventDefault(); setSaving(true);
        try {
            if (editId) await updateInventoryItem(editId, form);
            else await addInventoryItem(form);
            showToast(editId ? 'Item updated' : 'Item added'); setShowModal(false); setEditId(null); load();
        } catch (e) { showToast(e.message, 'error'); }
        setSaving(false);
    };
    const handleDelete = async (id) => {
        if (!confirm('Delete this item?')) return;
        try { await deleteInventoryItem(id); showToast('Item deleted'); load(); } catch (e) { showToast(e.message, 'error'); }
    };

    const categories = ['Furniture', 'Electronics', 'Sports', 'Lab Equipment', 'Stationery', 'Cleaning', 'Other'];
    const statuses = ['Good', 'Damaged', 'Lost', 'Maintenance'];
    const statusColors = { Good: 'bg-green-50 text-green-700', Damaged: 'bg-red-50 text-red-700', Lost: 'bg-gray-100 text-gray-700', Maintenance: 'bg-amber-50 text-amber-700' };
    const totalItems = items.reduce((s, i) => s + (i.quantity || 0), 0);
    const totalValue = items.reduce((s, i) => s + ((i.quantity || 0) * (parseFloat(i.unit_price) || 0)), 0);

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>;

    return (
        <div className="space-y-6 animate-fade-in-up">
            {toast && <div className={`fixed top-4 right-4 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}><AlertCircle className="w-4 h-4" />{toast.msg}</div>}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div><h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1><p className="text-sm text-gray-500 mt-1">{items.length} items • {totalItems} total quantity • Rs. {totalValue.toLocaleString()} value</p></div>
                <button onClick={() => { setEditId(null); setForm({ item_name: '', category: '', quantity: 0, unit_price: '', purchase_date: '', status: 'Good' }); setShowModal(true); }} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Item</button>
            </div>

            <div className="grid grid-cols-3 gap-4">
                {[{ l: 'Total Items', v: items.length, c: 'bg-primary/10 text-primary' }, { l: 'Total Quantity', v: totalItems, c: 'bg-blue-50 text-blue-600' }, { l: 'Total Value', v: `Rs. ${totalValue.toLocaleString()}`, c: 'bg-emerald-50 text-emerald-600' }].map((s, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-100 p-4"><p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{s.l}</p><p className="text-2xl font-bold text-gray-900 mt-1">{s.v}</p></div>
                ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                    <div className="relative max-w-xs"><Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" /><input type="text" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} placeholder="Search items..." className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" /></div>
                </div>
                <table className="w-full text-sm"><thead><tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><th className="px-4 py-3">Item Name</th><th className="px-4 py-3">Category</th><th className="px-4 py-3 text-center">Qty</th><th className="px-4 py-3">Unit Price</th><th className="px-4 py-3">Purchase Date</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"></th></tr></thead>
                    <tbody className="divide-y divide-gray-100">{items.map(item => (
                        <tr key={item.id} className="hover:bg-gray-50/50">
                            <td className="px-4 py-3 font-semibold text-gray-900">{item.item_name}</td>
                            <td className="px-4 py-3"><span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{item.category || 'General'}</span></td>
                            <td className="px-4 py-3 text-center font-medium">{item.quantity}</td>
                            <td className="px-4 py-3 text-gray-600">{item.unit_price ? `Rs. ${item.unit_price}` : '—'}</td>
                            <td className="px-4 py-3 text-gray-500 text-xs">{item.purchase_date || '—'}</td>
                            <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-bold ${statusColors[item.status] || 'bg-gray-100 text-gray-700'}`}>{item.status}</span></td>
                            <td className="px-4 py-3 text-right">
                                <button onClick={() => { setEditId(item.id); setForm({ item_name: item.item_name, category: item.category || '', quantity: item.quantity, unit_price: item.unit_price || '', purchase_date: item.purchase_date || '', status: item.status || 'Good' }); setShowModal(true); }} className="text-xs text-blue-500 hover:text-blue-700 mr-3">Edit</button>
                                <button onClick={() => handleDelete(item.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                            </td>
                        </tr>
                    ))}{items.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-gray-400">No items</td></tr>}</tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
                        <div className="p-6 border-b border-gray-100 flex justify-between"><h3 className="text-lg font-bold">{editId ? 'Edit Item' : 'Add Item'}</h3><button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button></div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label><input required value={form.item_name} onChange={e => setForm({ ...form, item_name: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Category</label><select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"><option value="">Select</option>{categories.map(c => <option key={c}>{c}</option>)}</select></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label><input type="number" min="0" value={form.quantity} onChange={e => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" /></div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Unit Price</label><input type="number" value={form.unit_price} onChange={e => setForm({ ...form, unit_price: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" /></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label><input type="date" value={form.purchase_date} onChange={e => setForm({ ...form, purchase_date: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" /></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">{statuses.map(s => <option key={s}>{s}</option>)}</select></div>
                            </div>
                            <div className="flex gap-3 pt-2"><button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button><button type="submit" disabled={saving} className="flex-1 btn-primary py-2.5">{saving ? 'Saving...' : editId ? 'Save' : 'Add'}</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminInventory;
