import React, { useState, useEffect } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, Loader2, ArrowLeft, GraduationCap, Users, UserCheck, Shield, LogIn, UserPlus, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getNotices, register } from '../api';

const ROLES = [
    {
        id: 'STUDENT',
        label: 'Student',
        color: 'border-blue-400',
        bg: 'bg-blue-50',
        text: 'text-blue-600',
        hoverBg: 'hover:bg-blue-100',
        btnBg: 'bg-blue-500 hover:bg-blue-600',
        icon: GraduationCap,
        emoji: '🎓',
        demoEmail: 'aarav.sharma@sevenstar.edu.np',
        demoPass: 'password123',
    },
    {
        id: 'TEACHER',
        label: 'Teacher',
        color: 'border-green-400',
        bg: 'bg-green-50',
        text: 'text-green-600',
        hoverBg: 'hover:bg-green-100',
        btnBg: 'bg-green-500 hover:bg-green-600',
        icon: Users,
        emoji: '👨‍🏫',
        demoEmail: 'suman.adhikari@sevenstar.edu.np',
        demoPass: 'password123',
    },
    {
        id: 'PARENT',
        label: 'Parent',
        color: 'border-orange-400',
        bg: 'bg-orange-50',
        text: 'text-orange-600',
        hoverBg: 'hover:bg-orange-100',
        btnBg: 'bg-orange-500 hover:bg-orange-600',
        icon: UserCheck,
        emoji: '👪',
        demoEmail: 'hari.sharma@gmail.com',
        demoPass: 'password123',
    },
    {
        id: 'ADMIN',
        label: 'Admin',
        color: 'border-red-400',
        bg: 'bg-red-50',
        text: 'text-red-600',
        hoverBg: 'hover:bg-red-100',
        btnBg: 'bg-red-500 hover:bg-red-600',
        icon: Shield,
        emoji: '🛡️',
        demoEmail: 'admin@sevenstar.edu.np',
        demoPass: 'admin123',
    },
];

const Login = () => {
    const navigate = useNavigate();
    const { login, user } = useAuth();

    // UI State
    const [selectedRole, setSelectedRole] = useState(null);
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [showPassword, setShowPassword] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);

    // Transaction State
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Data State
    const [spotlightItems, setSpotlightItems] = useState([]);

    useEffect(() => {
        getNotices().then(res => {
            const notices = (res.notices || []).slice(0, 4).map(n => n.title);
            setSpotlightItems(notices.length > 0 ? notices : [
                'Welcome to Seven Star English Boarding School',
                'Register now for the digital ERP platform.',
            ]);
        }).catch(() => {
            setSpotlightItems(['Welcome to Seven Star English Boarding School']);
        });
    }, []);

    // Automatic Routing based on user status
    if (user) {
        if (user.status === 'PENDING') {
            return <Navigate to="/pending-approval" replace />;
        }
        return <Navigate to="/dashboard" replace />;
    }

    const role = ROLES.find(r => r.id === selectedRole);

    const handleSelectRole = (r) => {
        setSelectedRole(r.id);
        setIsLoginMode(true);
        resetForm();
    };

    const handleBack = () => {
        setSelectedRole(null);
        resetForm();
    };

    const toggleMode = () => {
        setIsLoginMode(!isLoginMode);
        resetForm();
    };

    const resetForm = () => {
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setError('');
        setSuccessMessage('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setIsLoading(true);

        if (isLoginMode) {
            // LOGIN FLOW
            const result = await login(email, password);
            if (result.success) {
                if (result.user.status === 'PENDING') {
                    navigate('/pending-approval');
                } else {
                    navigate('/dashboard');
                }
            } else {
                setError(result.error || 'Invalid email or password');
            }
        } else {
            // SIGNUP FLOW
            if (password !== confirmPassword) {
                setError('Passwords do not match');
                setIsLoading(false);
                return;
            }

            try {
                const res = await register(name, email, password, role.id);
                setSuccessMessage(res.message || 'Account created successfully!');

                // Immediately switch them to login mode to sign in with their new credentials
                setTimeout(() => {
                    setIsLoginMode(true);
                    setSuccessMessage('Registration successful! Please sign in.');
                    setPassword('');
                    setConfirmPassword('');
                }, 2000);
            } catch (err) {
                setError(err.message || 'Registration failed. Please try again.');
            }
        }
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            {/* Top Navbar */}
            <header className="bg-primary shadow-md sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3 group">
                        <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-full object-cover border-2 border-white/30 group-hover:border-white/60 transition-all" />
                        <div className="flex flex-col leading-tight">
                            <span className="font-bold text-lg text-white font-serif">Seven Star</span>
                            <span className="text-[11px] text-white/60 font-medium tracking-wide">English Boarding School</span>
                        </div>
                    </Link>
                    <Link to="/" className="text-white/70 hover:text-white text-sm font-medium transition-colors hidden sm:block">
                        ← Back to Website
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
                {!selectedRole ? (
                    /* ==================== STEP 1: Role Selection ==================== */
                    <div className="w-full max-w-3xl animate-fade-in-up">
                        <div className="text-center mb-10">
                            <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-3">School Management Portal</h1>
                            <p className="text-gray-500 max-w-lg mx-auto">Select your role to Sign In or Create a new Account.</p>
                        </div>

                        {/* Role Cards Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                            {ROLES.map((r) => {
                                const Icon = r.icon;
                                return (
                                    <button
                                        key={r.id}
                                        onClick={() => handleSelectRole(r)}
                                        className={`group bg-white rounded-2xl border-2 ${r.color} p-6 flex flex-col items-center gap-3 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1`}
                                    >
                                        <div className="text-4xl mb-1">{r.emoji}</div>
                                        <span className={`text-lg font-bold ${r.text}`}>{r.label}</span>
                                        <div className={`w-10 h-10 rounded-full ${r.bg} ${r.text} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                            <LogIn className="w-5 h-5" />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Spotlight */}
                        <div className="mt-10 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50/50">
                                <span className="text-sm font-bold text-primary">Live Spotlight</span>
                            </div>
                            <div className="divide-y divide-gray-100 px-5">
                                {spotlightItems.map((item, i) => (
                                    <div key={i} className="py-3 flex items-start gap-2.5">
                                        <span className="text-amber-500 mt-0.5 text-sm">⚡</span>
                                        <span className="text-sm text-gray-700 font-medium leading-snug">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* ==================== STEP 2: Auth Form ==================== */
                    <div className="w-full max-w-md animate-fade-in-up">
                        {/* Back Button */}
                        <button
                            onClick={handleBack}
                            className="flex items-center gap-2 text-gray-500 hover:text-primary mb-6 font-medium text-sm transition-colors group"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                            Back to role selection
                        </button>

                        <div className={`bg-white rounded-3xl shadow-xl border-2 ${role.color} overflow-hidden`}>
                            {/* Role Header */}
                            <div className={`${role.bg} px-8 py-6 flex flex-col gap-4 border-b ${role.color}`}>
                                <div className="flex items-center gap-4">
                                    <div className="text-5xl">{role.emoji}</div>
                                    <div>
                                        <h2 className={`text-2xl font-bold ${role.text}`}>
                                            {isLoginMode ? `${role.label} Login` : `Join as ${role.label}`}
                                        </h2>
                                        <p className="text-sm text-gray-500 mt-0.5">
                                            {isLoginMode ? 'Welcome back to your dashboard' : 'Create an account to track academics'}
                                        </p>
                                    </div>
                                </div>

                                {/* Toggle Switch */}
                                <div className="flex p-1 bg-white/60 rounded-xl border border-black/5">
                                    <button
                                        onClick={() => { if (!isLoginMode) toggleMode(); }}
                                        className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all ${isLoginMode ? 'bg-white shadow border border-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        Sign In
                                    </button>
                                    <button
                                        onClick={() => { if (isLoginMode) toggleMode(); }}
                                        className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all ${!isLoginMode ? 'bg-white shadow border border-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        Create Account
                                    </button>
                                </div>
                            </div>

                            {/* Form */}
                            <div className="p-8">
                                <form className="space-y-4" onSubmit={handleSubmit}>

                                    {/* Alerts */}
                                    {error && (
                                        <div className="bg-red-50 text-red-600 p-3.5 rounded-xl text-sm flex items-start gap-2 border border-red-100 animate-fade-in-up">
                                            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                            <p>{error}</p>
                                        </div>
                                    )}
                                    {successMessage && (
                                        <div className="bg-green-50 text-green-700 p-3.5 rounded-xl text-sm flex items-start gap-2 border border-green-200 animate-fade-in-up">
                                            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-green-600" />
                                            <p className="font-medium">{successMessage}</p>
                                        </div>
                                    )}

                                    {/* Signup Fields */}
                                    {!isLoginMode && (
                                        <div className="animate-fade-in-up">
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                                            <input
                                                type="text"
                                                required
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="block w-full px-4 py-2.5 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-gray-50 focus:bg-white"
                                                placeholder={`e.g. ${role.id === 'STUDENT' ? 'Aarav Sharma' : 'Hari Sharma'}`}
                                            />
                                        </div>
                                    )}

                                    {/* Common Fields */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="block w-full px-4 py-2.5 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-gray-50 focus:bg-white"
                                            placeholder="your.email@example.com"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                required
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="block w-full px-4 py-2.5 pr-12 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-gray-50 focus:bg-white"
                                                placeholder={isLoginMode ? "Enter password" : "Min 8 characters"}
                                                minLength={isLoginMode ? 1 : 8}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Signup Field: Confirm Password */}
                                    {!isLoginMode && (
                                        <div className="animate-fade-in-up">
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm Password</label>
                                            <input
                                                type="password"
                                                required
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="block w-full px-4 py-2.5 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-gray-50 focus:bg-white"
                                                placeholder="Repeat password"
                                                minLength={8}
                                            />
                                        </div>
                                    )}

                                    {/* Remember Me */}
                                    {isLoginMode && (
                                        <div className="flex items-center justify-between pt-1">
                                            <label className="flex items-center">
                                                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" />
                                                <span className="ml-2 text-sm text-gray-600">Remember me</span>
                                            </label>
                                        </div>
                                    )}

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className={`w-full mt-2 ${role.btnBg} text-white py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed`}
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                {isLoginMode ? 'Verifying...' : 'Creating...'}
                                            </>
                                        ) : (
                                            <>
                                                {isLoginMode ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                                                {isLoginMode ? `Sign In as ${role.label}` : 'Create Account'}
                                            </>
                                        )}
                                    </button>
                                </form>

                                {/* Demo Credentials Section */}
                                {isLoginMode && (
                                    <div className="mt-6 pt-5 border-t border-gray-100">
                                        <button
                                            onClick={() => { setEmail(role.demoEmail); setPassword(role.demoPass); }}
                                            className={`w-full py-2.5 rounded-xl text-xs font-semibold ${role.bg} ${role.text} ${role.hoverBg} transition-colors border border-transparent hover:border-current`}
                                        >
                                            ⚡ Use Demo {role.label} Credentials
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Login;
