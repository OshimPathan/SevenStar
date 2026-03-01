import { createContext, useContext, useState, useEffect } from 'react';
import { loginViaSupabaseAuth as apiLogin } from '../api';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

// Strip sensitive fields before persisting user data
function sanitizeUser(user) {
    if (!user) return null;
    const { password_hash, password, aud, confirmation_sent_at, recovery_sent_at, ...safe } = user;
    return safe;
}

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // Validate session on app load — don't blindly trust localStorage
    useEffect(() => {
        const restoreSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.access_token) {
                    const storedUser = localStorage.getItem('user');
                    if (storedUser) {
                        const parsed = sanitizeUser(JSON.parse(storedUser));
                        setToken(session.access_token);
                        setUser(parsed);
                    } else {
                        // Session exists but no stored user — clear
                        await supabase.auth.signOut();
                    }
                } else {
                    // No valid session — clear stale localStorage
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }
            } catch {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
            setLoading(false);
        };
        restoreSession();
    }, []);

    const login = async (email, password) => {
        try {
            const data = await apiLogin(email, password);
            const safeUser = sanitizeUser(data.user);
            setToken(data.token);
            setUser(safeUser);
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(safeUser));
            return { success: true, user: safeUser };
        } catch (error) {
            return { success: false, error: error.message || 'Invalid email or password' };
        }
    };

    const logout = async () => {
        try { await supabase.auth.signOut(); } catch { /* ignore signout errors */ }
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};

export default AuthContext;
