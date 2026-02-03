import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { UserPlus, ArrowRight } from 'lucide-react';

const Register = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('student');
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            await api.post('/auth/register', { username, password, role });
            alert('Registration successful! Please login.');
            navigate('/login');
        } catch (err) {
            alert('Registration failed: ' + (err.response?.data?.detail || err.message));
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
            <div className="w-full max-w-md bg-slate-900/50 p-8 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-sm">
                <div className="flex justify-center mb-6">
                    <div className="bg-green-500/10 p-4 rounded-full">
                        <UserPlus className="w-10 h-10 text-green-400" />
                    </div>
                </div>
                <h2 className="text-3xl font-bold text-center mb-8 text-white">Initialize Identity</h2>
                <form onSubmit={handleRegister} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Username</label>
                        <input
                            type="text"
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Choose an ID"
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
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Role</label>
                        <select
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                        >
                            <option value="student">Student</option>
                            <option value="club">Club Lead (Verifier)</option>
                            <option value="admin">University Admin (Issuer)</option>
                        </select>
                    </div>
                    <button type="submit" className="w-full bg-green-500 hover:bg-green-400 text-slate-950 font-bold py-3 rounded-lg transition-all transform hover:scale-[1.02] flex items-center justify-center">
                        Create Identity <ArrowRight className="ml-2 w-5 h-5" />
                    </button>
                </form>
                <div className="mt-6 text-center">
                    <Link to="/login" className="text-slate-500 hover:text-green-400 text-sm transition-colors">
                        Already have an identity? Login
                    </Link>
                </div>
            </div>
        </div>
    );
};
export default Register;
