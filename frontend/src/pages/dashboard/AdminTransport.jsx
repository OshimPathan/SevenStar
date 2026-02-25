import React, { useState, useEffect } from 'react';
import { Bus, Plus, X, Loader2, Trash2, MapPin, Users, AlertCircle, CheckCircle, Hash, Phone, DollarSign, User } from 'lucide-react';
import { getTransportRoutes, addTransportRoute, updateTransportRoute, deleteTransportRoute, getTransportVehicles, addTransportVehicle, deleteTransportVehicle, getStudentTransport, removeStudentTransport } from '../../api';
import FormField from '../../components/FormField';

const AdminTransport = () => {
    const [routes, setRoutes] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('routes');
    const [showModal, setShowModal] = useState(null); // 'route' | 'vehicle'
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };
    const load = async () => {
        setLoading(true);
        try {
            const [rRes, vRes, sRes] = await Promise.all([getTransportRoutes(), getTransportVehicles(), getStudentTransport()]);
            setRoutes(rRes.routes); setVehicles(vRes.vehicles); setStudents(sRes.assignments);
        } catch (e) { showToast(e.message, 'error'); }
        setLoading(false);
    };
    useEffect(() => { load(); }, []);

    const handleSaveRoute = async (e) => {
        e.preventDefault(); setSaving(true);
        try { await addTransportRoute(form); showToast('Route added'); setShowModal(null); load(); } catch (e) { showToast(e.message, 'error'); }
        setSaving(false);
    };
    const handleSaveVehicle = async (e) => {
        e.preventDefault(); setSaving(true);
        try { await addTransportVehicle(form); showToast('Vehicle added'); setShowModal(null); load(); } catch (e) { showToast(e.message, 'error'); }
        setSaving(false);
    };
    const handleDeleteRoute = async (id) => {
        if (!confirm('Delete route?')) return;
        try { await deleteTransportRoute(id); showToast('Route deleted'); load(); } catch (e) { showToast(e.message, 'error'); }
    };
    const handleDeleteVehicle = async (id) => {
        if (!confirm('Delete vehicle?')) return;
        try { await deleteTransportVehicle(id); showToast('Vehicle deleted'); load(); } catch (e) { showToast(e.message, 'error'); }
    };
    const handleRemoveStudent = async (id) => {
        if (!confirm('Remove student from transport?')) return;
        try { await removeStudentTransport(id); showToast('Removed'); load(); } catch (e) { showToast(e.message, 'error'); }
    };

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>;

    return (
        <div className="space-y-6 animate-fade-in-up">
            {toast && <div className={`fixed top-4 right-4 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}><AlertCircle className="w-4 h-4" />{toast.msg}</div>}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div><h1 className="text-2xl font-bold text-gray-900">Transport Management</h1><p className="text-sm text-gray-500 mt-1">{routes.length} routes • {vehicles.length} vehicles • {students.length} students assigned</p></div>
                <div className="flex gap-2">
                    <button onClick={() => { setForm({ route_name: '', start_point: '', end_point: '', fee_per_month: '' }); setShowModal('route'); }} className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-medium flex items-center gap-2"><MapPin className="w-4 h-4" /> Add Route</button>
                    <button onClick={() => { setForm({ vehicle_number: '', capacity: 40, driver_name: '', driver_phone: '', route_id: '' }); setShowModal('vehicle'); }} className="btn-primary flex items-center gap-2"><Bus className="w-4 h-4" /> Add Vehicle</button>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                {[{ l: 'Routes', v: routes.length, c: 'bg-primary/10 text-primary' }, { l: 'Vehicles', v: vehicles.length, c: 'bg-blue-50 text-blue-600' }, { l: 'Students', v: students.length, c: 'bg-amber-50 text-amber-600' }].map((s, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-100 p-4"><p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{s.l}</p><p className="text-2xl font-bold text-gray-900 mt-1">{s.v}</p></div>
                ))}
            </div>

            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
                {['routes', 'vehicles', 'students'].map(t => (
                    <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{t === 'routes' ? '🗺️ Routes' : t === 'vehicles' ? '🚌 Vehicles' : '👥 Assigned Students'}</button>
                ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {tab === 'routes' && (
                    <table className="w-full text-sm"><thead><tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><th className="px-4 py-3">Route Name</th><th className="px-4 py-3">Start</th><th className="px-4 py-3">End</th><th className="px-4 py-3">Fee/Month</th><th className="px-4 py-3"></th></tr></thead>
                        <tbody className="divide-y divide-gray-100">{routes.map(r => (
                            <tr key={r.id} className="hover:bg-gray-50/50"><td className="px-4 py-3 font-semibold text-gray-900">{r.route_name}</td><td className="px-4 py-3 text-gray-600">{r.start_point}</td><td className="px-4 py-3 text-gray-600">{r.end_point}</td><td className="px-4 py-3 font-medium">Rs. {r.fee_per_month}</td><td className="px-4 py-3 text-right"><button onClick={() => handleDeleteRoute(r.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button></td></tr>
                        ))}{routes.length === 0 && <tr><td colSpan={5} className="text-center py-12 text-gray-400">No routes</td></tr>}</tbody></table>
                )}
                {tab === 'vehicles' && (
                    <table className="w-full text-sm"><thead><tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><th className="px-4 py-3">Vehicle #</th><th className="px-4 py-3">Capacity</th><th className="px-4 py-3">Driver</th><th className="px-4 py-3">Phone</th><th className="px-4 py-3">Route</th><th className="px-4 py-3"></th></tr></thead>
                        <tbody className="divide-y divide-gray-100">{vehicles.map(v => (
                            <tr key={v.id} className="hover:bg-gray-50/50"><td className="px-4 py-3 font-semibold">{v.vehicle_number}</td><td className="px-4 py-3">{v.capacity}</td><td className="px-4 py-3 text-gray-600">{v.driver_name || '—'}</td><td className="px-4 py-3 text-gray-500">{v.driver_phone || '—'}</td><td className="px-4 py-3 text-xs"><span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded">{v.transport_routes?.route_name || '—'}</span></td><td className="px-4 py-3 text-right"><button onClick={() => handleDeleteVehicle(v.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button></td></tr>
                        ))}{vehicles.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-gray-400">No vehicles</td></tr>}</tbody></table>
                )}
                {tab === 'students' && (
                    <table className="w-full text-sm"><thead><tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><th className="px-4 py-3">Student</th><th className="px-4 py-3">Class</th><th className="px-4 py-3">Route</th><th className="px-4 py-3">Pickup</th><th className="px-4 py-3">Fee</th><th className="px-4 py-3"></th></tr></thead>
                        <tbody className="divide-y divide-gray-100">{students.map(s => (
                            <tr key={s.id} className="hover:bg-gray-50/50"><td className="px-4 py-3 font-semibold text-gray-900">{s.enrollments?.students ? `${s.enrollments.students.first_name} ${s.enrollments.students.last_name}` : '—'}</td><td className="px-4 py-3 text-gray-600">{s.enrollments?.classes?.name || ''} {s.enrollments?.sections?.name || ''}</td><td className="px-4 py-3 text-xs"><span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded">{s.transport_routes?.route_name || '—'}</span></td><td className="px-4 py-3 text-gray-500">{s.pickup_point || '—'}</td><td className="px-4 py-3 font-medium">Rs. {s.transport_routes?.fee_per_month || 0}</td><td className="px-4 py-3 text-right"><button onClick={() => handleRemoveStudent(s.id)} className="text-xs text-red-400 hover:text-red-600">Remove</button></td></tr>
                        ))}{students.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-gray-400">No students assigned</td></tr>}</tbody></table>
                )}
            </div>

            {/* Add Route Modal */}
            {showModal === 'route' && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold">Add Transport Route</h3>
                                <p className="text-sm text-gray-500 mt-0.5">Define a new bus route with pickup points</p>
                            </div>
                            <button onClick={() => setShowModal(null)}><X className="w-5 h-5 text-gray-400" /></button>
                        </div>
                        <form onSubmit={handleSaveRoute} className="p-6 space-y-4">
                            <FormField label="Route Name" name="route_name" required icon={MapPin}
                                value={form.route_name || ''} onChange={e => setForm({ ...form, route_name: e.target.value })}
                                placeholder="e.g. Kathmandu - Bhaktapur Route"
                                helper="A descriptive name for this bus route" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField label="Start Point" name="start_point" required icon={MapPin}
                                    value={form.start_point || ''} onChange={e => setForm({ ...form, start_point: e.target.value })}
                                    placeholder="e.g. Ratnapark"
                                    helper="Where the bus starts" />
                                <FormField label="End Point" name="end_point" required icon={MapPin}
                                    value={form.end_point || ''} onChange={e => setForm({ ...form, end_point: e.target.value })}
                                    placeholder="e.g. School Campus"
                                    helper="Final destination" />
                            </div>
                            <FormField label="Monthly Fee (Rs.)" name="fee_per_month" type="number" icon={DollarSign}
                                value={form.fee_per_month || ''} onChange={e => setForm({ ...form, fee_per_month: e.target.value })}
                                min={0} helper="Transport fee charged per month" />
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
                                <button type="submit" disabled={saving} className="flex-1 btn-primary py-2.5 flex items-center justify-center gap-2">
                                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {saving ? 'Saving...' : 'Add Route'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Add Vehicle Modal */}
            {showModal === 'vehicle' && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold">Add Vehicle</h3>
                                <p className="text-sm text-gray-500 mt-0.5">Register a new school transport vehicle</p>
                            </div>
                            <button onClick={() => setShowModal(null)}><X className="w-5 h-5 text-gray-400" /></button>
                        </div>
                        <form onSubmit={handleSaveVehicle} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField label="Vehicle Number" name="vehicle_number" required icon={Bus}
                                    value={form.vehicle_number || ''} onChange={e => setForm({ ...form, vehicle_number: e.target.value })}
                                    placeholder="e.g. BA 1 KA 1234"
                                    helper="Registration plate number" />
                                <FormField label="Seating Capacity" name="capacity" type="number" icon={Users}
                                    value={form.capacity || ''} onChange={e => setForm({ ...form, capacity: parseInt(e.target.value) || 40 })}
                                    min={1} helper="Max number of passengers" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField label="Driver Name" name="driver_name" icon={User}
                                    value={form.driver_name || ''} onChange={e => setForm({ ...form, driver_name: e.target.value })}
                                    placeholder="Driver's full name"
                                    helper="Assigned driver" />
                                <FormField label="Driver Phone" name="driver_phone" type="tel" icon={Phone}
                                    value={form.driver_phone || ''} onChange={e => setForm({ ...form, driver_phone: e.target.value })}
                                    placeholder="98XXXXXXXX"
                                    helper="Emergency contact for driver" />
                            </div>
                            <FormField label="Assign to Route" name="route_id" type="select"
                                value={form.route_id || ''} onChange={e => setForm({ ...form, route_id: e.target.value })}
                                helper="Which route will this vehicle serve?"
                                options={[{ value: '', label: 'Select route (optional)' }, ...routes.map(r => ({ value: r.id, label: r.route_name }))]} />
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
                                <button type="submit" disabled={saving} className="flex-1 btn-primary py-2.5 flex items-center justify-center gap-2">
                                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {saving ? 'Saving...' : 'Add Vehicle'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminTransport;
