import React, { useState, useEffect } from 'react';
import { Users, CheckCircle, XCircle, Search, AlertCircle, Loader2, GraduationCap, Shield, UserCheck, Calendar } from 'lucide-react';
import { getPendingUsers, approveUser, rejectUser } from '../../api';

// Reusing role config from Login for consistency
const ROLE_CONFIG = {
    'STUDENT': { icon: GraduationCap, color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200' },
    'TEACHER': { icon: Users, color: 'text-green-600', bg: 'bg-green-100', border: 'border-green-200' },
    'PARENT': { icon: UserCheck, color: 'text-orange-600', bg: 'bg-orange-100', border: 'border-orange-200' },
    'ADMIN': { icon: Shield, color: 'text-red-600', bg: 'bg-red-100', border: 'border-red-200' },
};

const AdminApprovals = () => {
    const [pendingUsers, setPendingUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Modal State
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [mappingId, setMappingId] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        fetchPendingUsers();
    }, []);

    const fetchPendingUsers = async () => {
        setLoading(true);
        try {
            const data = await getPendingUsers();
            setPendingUsers(data || []);
        } catch (err) {
            console.error('Failed to fetch pending approvals', err);
            setError('Failed to load pending registrations.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenApproveModal = (user) => {
        setSelectedUser(user);
        setMappingId('');
        setError('');
        setIsApproveModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsApproveModalOpen(false);
        setSelectedUser(null);
        setMappingId('');
        setError('');
    };

    const handleApproveSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsProcessing(true);

        try {
            const mappingData = {};
            if (selectedUser.role === 'STUDENT') mappingData.admission_number = mappingId;
            if (selectedUser.role === 'TEACHER') mappingData.employee_id = mappingId;

            const res = await approveUser(selectedUser.id, selectedUser.role, mappingData);

            setSuccessMessage(res.message || 'User approved successfully.');
            setPendingUsers(pendingUsers.filter(u => u.id !== selectedUser.id));
            handleCloseModal();

            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            setError(err.message || 'Failed to approve user.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = async (userId, userName) => {
        if (!window.confirm(`Are you sure you want to permanently reject and delete the registration for ${userName}?`)) return;

        try {
            await rejectUser(userId);
            setSuccessMessage(`${userName}'s registration was rejected.`);
            setPendingUsers(pendingUsers.filter(u => u.id !== userId));
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            setError('Failed to reject registration.');
            setTimeout(() => setError(''), 3000);
        }
    };

    const filteredUsers = pendingUsers.filter(user =>
        (user.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.role?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Pending Approvals</h2>
                    <p className="text-sm text-gray-500 mt-1">Review and approve new user registrations</p>
                </div>
            </div>

            {/* Alerts */}
            {error && !isApproveModalOpen && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 border border-red-100">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}
            {successMessage && !isApproveModalOpen && (
                <div className="bg-green-50 text-green-700 p-4 rounded-xl flex items-center gap-3 border border-green-200">
                    <CheckCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-medium">{successMessage}</p>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, email, or role..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                    />
                </div>
                <div className="text-sm font-medium text-gray-500 bg-gray-50 px-4 py-2 rounded-lg border border-gray-100 w-full sm:w-auto text-center">
                    {filteredUsers.length} Pending
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">User Details</th>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Requested Role</th>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Registered On</th>
                                <th className="text-right py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="py-12 text-center">
                                        <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
                                        <p className="text-gray-500 mt-2 text-sm">Loading pending registrations...</p>
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="py-12 text-center text-gray-500">
                                        <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <CheckCircle className="w-8 h-8 text-green-500" />
                                        </div>
                                        <p className="text-base font-medium text-gray-900">All caught up!</p>
                                        <p className="text-sm mt-1">There are no pending registrations awaiting approval.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => {
                                    const roleInfo = ROLE_CONFIG[user.role] || ROLE_CONFIG['STUDENT'];
                                    const RoleIcon = roleInfo.icon;

                                    return (
                                        <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm bg-gradient-to-br from-gray-700 to-gray-900`}>
                                                        {user.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                                                        <p className="text-xs text-gray-500">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${roleInfo.bg} ${roleInfo.color} ${roleInfo.border}`}>
                                                    <RoleIcon className="w-3.5 h-3.5" />
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                    {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleReject(user.id, user.name)}
                                                        title="Reject & Delete"
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                                    >
                                                        <XCircle className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenApproveModal(user)}
                                                        title="Approve & Link"
                                                        className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg shadow-sm transition-all hover:shadow flex items-center gap-2"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                        Approve
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Approval Modal */}
            {isApproveModalOpen && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scale-up">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                Approve Registration
                            </h3>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleApproveSubmit} className="p-6">
                            {error && (
                                <div className="mb-5 bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-start gap-2 border border-red-100">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <p>{error}</p>
                                </div>
                            )}

                            <div className="mb-6">
                                <p className="text-sm text-gray-600 mb-4">
                                    You are approving <span className="font-semibold text-gray-900">{selectedUser.name}</span> as a <span className="font-semibold text-primary">{selectedUser.role}</span>.
                                </p>

                                {selectedUser.role === 'STUDENT' && (
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Assign Admission Number *</label>
                                        <input
                                            type="text"
                                            required
                                            value={mappingId}
                                            onChange={(e) => setMappingId(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                            placeholder="e.g. ADM-2026-001"
                                        />
                                        <p className="text-xs text-gray-500 mt-2">This will create their official student record in the database.</p>
                                    </div>
                                )}

                                {selectedUser.role === 'TEACHER' && (
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Assign Employee ID *</label>
                                        <input
                                            type="text"
                                            required
                                            value={mappingId}
                                            onChange={(e) => setMappingId(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                            placeholder="e.g. EMP-TCH-045"
                                        />
                                        <p className="text-xs text-gray-500 mt-2">This will create their official staff record in the database.</p>
                                    </div>
                                )}

                                {selectedUser.role === 'PARENT' && (
                                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                                        <p className="text-sm text-blue-800">No additional ID is required. This will instantly create their Parent profile and grant them access.</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isProcessing}
                                    className="px-5 py-2.5 text-sm font-medium text-white bg-green-600 rounded-xl hover:bg-green-700 shadow-sm transition-all flex items-center justify-center min-w-[120px] disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm & Approve'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminApprovals;
