import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Clock, LogOut, ShieldAlert } from 'lucide-react';

const PendingApprovalPage = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    // If they aren't pending, they shouldn't be here
    if (!user || user.status !== 'PENDING') {
        navigate('/login', { replace: true });
        return null;
    }

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md animate-fade-in-up">
                <div className="bg-white py-10 px-6 shadow-2xl rounded-3xl border border-gray-100 sm:px-10 text-center relative overflow-hidden">
                    {/* Decorative background element */}
                    <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-amber-50 opacity-50"></div>

                    <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-amber-100 mb-6 relative z-10">
                        <Clock className="h-10 w-10 text-amber-600 animate-pulse" />
                    </div>

                    <h2 className="mt-2 text-2xl font-bold text-gray-900 tracking-tight">Account Pending Approval</h2>
                    <p className="mt-4 text-sm text-gray-500 leading-relaxed">
                        Hi <span className="font-semibold text-gray-700">{user?.name}</span>, your registration was successful!
                        However, because this is a secure School ERP, an Administrator must verify your identity and link your account to your academic records before you can log in.
                    </p>

                    <div className="mt-8 bg-amber-50 rounded-2xl p-4 flex items-start gap-3 border border-amber-100 text-left">
                        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-800">
                            <span className="font-semibold block mb-1">What happens next?</span>
                            The school administration has been notified. Please allow up to 24 hours for account verification.
                        </div>
                    </div>

                    <div className="mt-10">
                        <button
                            onClick={handleLogout}
                            className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm pl-4 pr-6 text-sm font-semibold text-white bg-primary hover:bg-primary-dark transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary gap-2"
                        >
                            <LogOut className="w-4 h-4" />
                            Sign Out & Return Later
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PendingApprovalPage;
