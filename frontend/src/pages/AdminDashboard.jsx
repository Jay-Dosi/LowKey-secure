import React, { useState } from 'react';
import api from '../api';
import { Award, UserCheck } from 'lucide-react';

const AdminDashboard = () => {
    const [studentUsername, setStudentUsername] = useState('');
    const [name, setName] = useState('');
    const [major, setMajor] = useState('');
    const [year, setYear] = useState('');

    const handleIssue = async (e) => {
        e.preventDefault();
        const attributes = { name, major, year, student_id: studentUsername, role: 'student', university: 'Tech University' };
        try {
            await api.post('/admin/issue-credential', { student_username: studentUsername, attributes });
            alert('Credential Issued Successfully!');
            setStudentUsername('');
            setName('');
            setMajor('');
            setYear('');
        } catch (err) {
            alert('Failed to issue credential: ' + (err.response?.data?.detail || err.message));
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center space-x-4 mb-8">
                <div className="p-3 bg-blue-500/10 rounded-xl">
                    <Award className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">University Admin Console</h1>
                    <p className="text-slate-400">Issue verfiable credentials to students</p>
                </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 backdrop-blur-sm">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                    <UserCheck className="w-5 h-5 mr-2 text-green-400" /> Issue New Credential
                </h2>
                <form onSubmit={handleIssue} className="grid gap-6 md:grid-cols-2">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-400 mb-2">Student Username</label>
                        <input
                            type="text"
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            value={studentUsername}
                            onChange={(e) => setStudentUsername(e.target.value)}
                            placeholder="e.g. john_doe"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Full Name</label>
                        <input
                            type="text"
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="John Doe"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Major</label>
                        <input
                            type="text"
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            value={major}
                            onChange={(e) => setMajor(e.target.value)}
                            placeholder="Computer Science"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-400 mb-2">Year</label>
                        <input
                            type="text"
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            placeholder="Senior"
                        />
                    </div>
                    <div className="md:col-span-2 pt-4">
                        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-all">
                            Sign & Issue Credential
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default AdminDashboard;
