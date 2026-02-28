import React, { useEffect, useState } from 'react'
import { Plus, Trash2, Users as UsersIcon, Shield, Loader2, Database } from 'lucide-react'
import { getAdmins, createAdminUser, deleteUser, createTeacher, createStudent } from '../../api'

const AdminUsers = () => {
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [toast, setToast] = useState(null)

  const showToast = (msg, type='success') => { setToast({ msg, type }); setTimeout(()=>setToast(null), 3500) }

  const load = async () => {
    setLoading(true)
    try { const list = await getAdmins(); setAdmins(list || []) } catch { setAdmins([]) }
    setLoading(false)
  }

  useEffect(()=>{ load() }, [])

  const submit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) return
    setSaving(true)
    try {
      await createAdminUser(form)
      setForm({ name: '', email: '', password: '' })
      showToast('Admin created')
      await load()
    } catch (e) { showToast(e.message || 'Failed', 'error') }
    setSaving(false)
  }

  const remove = async (id) => {
    if (!confirm('Delete this user?')) return
    try { await deleteUser(id); await load(); showToast('User deleted') } catch(e){ showToast(e.message||'Failed','error') }
  }

  const seedDemo = async () => {
    setSaving(true)
    try {
      const teacherPayload = { name: 'Demo Teacher', email: `demo.teacher+${Date.now()}@sevenstar.edu.np`, password: 'teacher123', qualification: 'M.Ed.', phone: '9800000000', address: 'Campus Rd', joined_date: new Date().toISOString().slice(0,10) }
      await createTeacher(teacherPayload)
      const studentPayload = { name: 'Demo Student', email: `demo.student+${Date.now()}@sevenstar.edu.np`, password: 'student123', class_id: null, roll_number: 1 }
      await createStudent(studentPayload)
      showToast('Demo accounts created')
    } catch (e) { showToast(e.message||'Failed to create demo data','error') }
    setSaving(false)
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-xl text-sm font-medium ${toast.type==='error'?'bg-red-50 text-red-700 border border-red-200':'bg-green-50 text-green-700 border border-green-200'}`}>{toast.msg}</div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center"><UsersIcon className="w-5 h-5 text-primary"/></div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={seedDemo} className="px-3 py-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-sm font-medium flex items-center gap-2"><Database className="w-4 h-4"/>Seed Demo Accounts</button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Shield className="w-4 h-4 text-primary"/>Create Admin</h3>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="text-sm text-gray-600">Full Name</label>
              <input className="w-full px-3 py-2.5 border border-gray-200 rounded-xl" value={form.name} onChange={e=>setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="text-sm text-gray-600">Email</label>
              <input type="email" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl" value={form.email} onChange={e=>setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="text-sm text-gray-600">Password</label>
              <input type="text" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl" value={form.password} onChange={e=>setForm({ ...form, password: e.target.value })} required />
            </div>
            <button disabled={saving} className="btn-primary px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin"/>}
              <Plus className="w-4 h-4"/> Create Admin
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><UsersIcon className="w-4 h-4 text-primary"/>Admin Users</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/80 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Name</th>
                  <th className="py-3.5 px-5">Email</th>
                  <th className="py-3.5 px-5 w-28 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan="3" className="py-10 text-center text-gray-400">Loading...</td></tr>
                ) : admins.length === 0 ? (
                  <tr><td colSpan="3" className="py-10 text-center text-gray-400">No admins found</td></tr>
                ) : admins.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50/50">
                    <td className="py-3.5 px-5 font-medium text-gray-800">{a.name}</td>
                    <td className="py-3.5 px-5 text-gray-600">{a.email}</td>
                    <td className="py-3.5 px-5 text-right">
                      <button onClick={() => remove(a.id)} className="px-2.5 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-xs flex items-center gap-1"><Trash2 className="w-3 h-3"/>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminUsers

