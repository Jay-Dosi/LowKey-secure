import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // Initialize auth state from localStorage
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            try {
                const decoded = jwtDecode(storedToken);
                // Check if token is expired
                if (decoded.exp * 1000 > Date.now()) {
                    setToken(storedToken);
                    setUser({
                        id: decoded.id,
                        username: decoded.sub,
                        role: decoded.role,
                    });
                } else {
                    // Token expired, clear it
                    localStorage.removeItem('token');
                    localStorage.removeItem('role');
                    localStorage.removeItem('user_id');
                }
            } catch (err) {
                console.error('Invalid token:', err);
                localStorage.clear();
            }
        }
        setLoading(false);
    }, []);

    const login = useCallback((accessToken, role, userId) => {
        localStorage.setItem('token', accessToken);
        localStorage.setItem('role', role);
        localStorage.setItem('user_id', userId);
        // Clear stale dismissed events on fresh login
        localStorage.removeItem('dismissedEvents');

        try {
            const decoded = jwtDecode(accessToken);
            setToken(accessToken);
            setUser({
                id: decoded.id || userId,
                username: decoded.sub,
                role: decoded.role || role,
            });
        } catch (err) {
            console.error('Failed to decode token:', err);
        }
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('user_id');
        setToken(null);
        setUser(null);
    }, []);

    const isAuthenticated = useMemo(() => !!token && !!user, [token, user]);

    const value = useMemo(
        () => ({
            user,
            token,
            loading,
            isAuthenticated,
            login,
            logout,
        }),
        [user, token, loading, isAuthenticated, login, logout]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
