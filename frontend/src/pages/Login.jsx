import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { Lock, ArrowRight } from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/login', { username, password });
            localStorage.setItem('token', res.data.access_token);
            localStorage.setItem('role', res.data.role);
            localStorage.setItem('user_id', res.data.user_id);

            if (res.data.role === 'admin') navigate('/admin');
            else if (res.data.role === 'club') navigate('/club');
            else navigate('/student');
        } catch (err) {
            alert('Login failed: ' + (err.response?.data?.detail || err.message));
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
            <div className="w-full max-w-md bg-slate-900/50 p-8 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-sm">
                <div className="flex justify-center mb-6">
                    <div className="bg-green-500/10 p-4 rounded-full">
                        <Lock className="w-10 h-10 text-green-400" />
                    </div>
                </div>
                <h2 className="text-3xl font-bold text-center mb-8 text-white">Identity Access</h2>
                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Username</label>
                        <input
                            type="text"
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter your ID"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Password</label>
                        <input
                            type="password"
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>
                    <button type="submit" className="w-full bg-green-500 hover:bg-green-400 text-slate-950 font-bold py-3 rounded-lg transition-all transform hover:scale-[1.02] flex items-center justify-center">
                        Authenticate <ArrowRight className="ml-2 w-5 h-5" />
                    </button>
                </form>
                <div className="mt-6 text-center">
                    <Link to="/register" className="text-slate-500 hover:text-green-400 text-sm transition-colors">
                        Initialize New Identity (Register)
                    </Link>
                </div>
            </div>
        </div>
    );
};
export default Login;
