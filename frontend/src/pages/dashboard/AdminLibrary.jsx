import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, X, Search, Loader2, Trash2, RefreshCw, ArrowRight, AlertCircle, Type, User, Hash, Layers, CheckCircle } from 'lucide-react';
import { getLibraryBooks, addLibraryBook, updateLibraryBook, deleteLibraryBook, getLibraryIssues, issueBook, returnBook } from '../../api';
import FormField from '../../components/FormField';

const AdminLibrary = () => {
    const [books, setBooks] = useState([]);
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [tab, setTab] = useState('books'); // books | issues
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ title: '', author: '', isbn: '', category: '', total_copies: 1 });
    const [editId, setEditId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

    const load = async () => {
        setLoading(true);
        try {
            const [bRes, iRes] = await Promise.all([getLibraryBooks({ search }), getLibraryIssues()]);
            setBooks(bRes?.books || []); setIssues(iRes?.issues || []);
        } catch (e) { showToast(e.message, 'error'); }
        setLoading(false);
    };
    useEffect(() => { load(); }, []);

    const handleSave = async (e) => {
        e.preventDefault(); setSaving(true);
        try {
            if (editId) await updateLibraryBook(editId, form);
            else await addLibraryBook(form);
            showToast(editId ? 'Book updated' : 'Book added');
            setShowModal(false); setForm({ title: '', author: '', isbn: '', category: '', total_copies: 1 }); setEditId(null); load();
        } catch (e) { showToast(e.message, 'error'); }
        setSaving(false);
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this book?')) return;
        try { await deleteLibraryBook(id); showToast('Book deleted'); load(); } catch (e) { showToast(e.message, 'error'); }
    };

    const handleReturn = async (issueId) => {
        try { await returnBook(issueId); showToast('Book returned'); load(); } catch (e) { showToast(e.message, 'error'); }
    };

    const categories = ['Fiction', 'Non-Fiction', 'Science', 'Math', 'Literature', 'History', 'Reference', 'Other'];
    const totalBooks = books.reduce((s, b) => s + (b.total_copies || 0), 0);
    const totalAvailable = books.reduce((s, b) => s + (b.available_copies || 0), 0);
    const issuedCount = issues.filter(i => i.status === 'Issued').length;

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>;

    return (
        <div className="space-y-6 animate-fade-in-up">
            {toast && <div className={`fixed top-4 right-4 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>{toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}{toast.msg}</div>}

            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Library Management</h1>
                    <p className="text-sm text-gray-500 mt-1">{books.length} titles • {totalBooks} copies • {totalAvailable} available • {issuedCount} issued</p>
                </div>
                <button onClick={() => { setEditId(null); setForm({ title: '', author: '', isbn: '', category: '', total_copies: 1 }); setShowModal(true); }} className="btn-primary flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add Book
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Titles', value: books.length, color: 'bg-primary/10 text-primary' },
                    { label: 'Total Copies', value: totalBooks, color: 'bg-blue-50 text-blue-600' },
                    { label: 'Available', value: totalAvailable, color: 'bg-green-50 text-green-600' },
                    { label: 'Currently Issued', value: issuedCount, color: 'bg-amber-50 text-amber-600' },
                ].map((s, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-100 p-4">
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{s.label}</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
                {['books', 'issues'].map(t => (
                    <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                        {t === 'books' ? '📚 Book Catalog' : '📋 Issued Books'}
                    </button>
                ))}
            </div>

            {tab === 'books' ? (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100">
                        <div className="relative max-w-xs">
                            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                            <input type="text" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} placeholder="Search books..." className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead><tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <th className="px-4 py-3">Title</th><th className="px-4 py-3">Author</th><th className="px-4 py-3">ISBN</th><th className="px-4 py-3">Category</th><th className="px-4 py-3 text-center">Total</th><th className="px-4 py-3 text-center">Available</th><th className="px-4 py-3"></th>
                            </tr></thead>
                            <tbody className="divide-y divide-gray-100">
                                {books.map(b => (
                                    <tr key={b.id} className="hover:bg-gray-50/50">
                                        <td className="px-4 py-3 font-semibold text-gray-900">{b.title}</td>
                                        <td className="px-4 py-3 text-gray-600">{b.author || '—'}</td>
                                        <td className="px-4 py-3 text-gray-500 font-mono text-xs">{b.isbn || '—'}</td>
                                        <td className="px-4 py-3"><span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{b.category || 'General'}</span></td>
                                        <td className="px-4 py-3 text-center font-medium">{b.total_copies}</td>
                                        <td className="px-4 py-3 text-center"><span className={`px-2 py-0.5 rounded text-xs font-bold ${b.available_copies > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{b.available_copies}</span></td>
                                        <td className="px-4 py-3 text-right">
                                            <button onClick={() => { setEditId(b.id); setForm({ title: b.title, author: b.author || '', isbn: b.isbn || '', category: b.category || '', total_copies: b.total_copies }); setShowModal(true); }} className="text-xs text-blue-500 hover:text-blue-700 mr-3">Edit</button>
                                            <button onClick={() => handleDelete(b.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                                {books.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-gray-400">No books found</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead><tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <th className="px-4 py-3">Book</th><th className="px-4 py-3">Borrower</th><th className="px-4 py-3">Issued</th><th className="px-4 py-3">Due</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"></th>
                            </tr></thead>
                            <tbody className="divide-y divide-gray-100">
                                {issues.map(i => {
                                    const overdue = i.status === 'Issued' && new Date(i.due_date) < new Date();
                                    return (
                                        <tr key={i.id} className={overdue ? 'bg-red-50/30' : 'hover:bg-gray-50/50'}>
                                            <td className="px-4 py-3 font-semibold text-gray-900">{i.library_books?.title || '—'}</td>
                                            <td className="px-4 py-3 text-gray-600">{i.users?.name || '—'}</td>
                                            <td className="px-4 py-3 text-gray-500 text-xs">{i.issue_date}</td>
                                            <td className="px-4 py-3 text-xs"><span className={overdue ? 'text-red-600 font-bold' : 'text-gray-500'}>{i.due_date}</span></td>
                                            <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-bold ${i.status === 'Issued' ? (overdue ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700') : 'bg-green-100 text-green-700'}`}>{overdue ? 'Overdue' : i.status}</span></td>
                                            <td className="px-4 py-3 text-right">
                                                {i.status === 'Issued' && <button onClick={() => handleReturn(i.id)} className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Return</button>}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {issues.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-gray-400">No issued books</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Add/Edit Book Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold">{editId ? 'Edit Book' : 'Add New Book'}</h3>
                                <p className="text-sm text-gray-500 mt-0.5">{editId ? 'Update book details' : 'Add a new book to the library catalog'}</p>
                            </div>
                            <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <FormField label="Book Title" name="title" required icon={BookOpen}
                                value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                                placeholder="e.g. The Great Gatsby, Physics Vol. 1"
                                helper="Full title of the book" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField label="Author" name="author" icon={User}
                                    value={form.author} onChange={e => setForm({ ...form, author: e.target.value })}
                                    placeholder="e.g. F. Scott Fitzgerald"
                                    helper="Author's full name" />
                                <FormField label="ISBN" name="isbn" icon={Hash}
                                    value={form.isbn} onChange={e => setForm({ ...form, isbn: e.target.value })}
                                    placeholder="e.g. 978-0-06-112008-4"
                                    helper="13-digit International Standard Book Number" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField label="Category" name="category" type="select" icon={Layers}
                                    value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                                    helper="Classify the book for easy discovery"
                                    options={[{ value: '', label: 'Select category' }, ...categories.map(c => ({ value: c, label: c }))]} />
                                <FormField label="Total Copies" name="total_copies" type="number"
                                    value={form.total_copies} onChange={e => setForm({ ...form, total_copies: parseInt(e.target.value) || 1 })}
                                    min={1}
                                    helper="How many copies does the library own?" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
                                <button type="submit" disabled={saving} className="flex-1 btn-primary py-2.5 flex items-center justify-center gap-2">{saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : editId ? 'Save Changes' : 'Add Book'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminLibrary;
