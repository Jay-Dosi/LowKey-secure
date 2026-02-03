import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Wallet, QrCode, ArrowRight, Shield } from 'lucide-react';

const StudentDashboard = () => {
    const [credentials, setCredentials] = useState([]);
    const [requestId, setRequestId] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCreds = async () => {
            try {
                const res = await api.get('/student/credentials');
                setCredentials(res.data);
            } catch (err) { console.error(err); }
        };
        fetchCreds();
    }, []);

    const handleScan = (e) => {
        e.preventDefault();
        if (requestId) navigate(`/student/request/${requestId}`);
    };

    return (
        <div className="space-y-8 pb-20">
            <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-500/10 rounded-xl">
                    <Wallet className="w-8 h-8 text-green-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">My Data Vault</h1>
                    <p className="text-slate-400">Manage your verifiable credentials</p>
                </div>
            </div>

            {/* Request Scanner Simulation */}
            <div className="bg-gradient-to-r from-blue-900/40 to-slate-900 border border-blue-500/30 p-6 rounded-xl">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center">
                    <QrCode className="w-5 h-5 mr-2 text-blue-400" /> Scan Access Request
                </h2>
                <form onSubmit={handleScan} className="flex gap-4">
                    <input
                        type="text"
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        value={requestId}
                        onChange={(e) => setRequestId(e.target.value)}
                        placeholder="Enter Request ID (e.g. 1)"
                    />
                    <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 rounded-lg transition-all flex items-center">
                        View <ArrowRight className="ml-2 w-4 h-4" />
                    </button>
                </form>
                <p className="text-xs text-slate-500 mt-2">In a real app, you would scan a QR code here.</p>
            </div>

            {/* Credential Cards */}
            <h2 className="text-lg font-bold text-white flex items-center mt-8">
                <Shield className="w-5 h-5 mr-2 text-green-400" /> Issued Credentials
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
                {credentials.length === 0 ? (
                    <p className="text-slate-500 col-span-2 text-center py-8">No credentials yet. Ask your university admin.</p>
                ) : (
                    credentials.map(cred => (
                        <div key={cred.id} className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700 rounded-xl p-6 relative overflow-hidden group hover:border-green-500/50 transition-all">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Shield className="w-24 h-24 text-white" />
                            </div>
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl font-bold text-white">University ID</h3>
                                    <div className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded border border-green-500/30">VERIFIED</div>
                                </div>
                                <div className="space-y-2 text-sm text-slate-300">
                                    {Object.entries(cred.data).map(([key, val]) => (
                                        <div key={key} className="flex justify-between border-b border-slate-800 pb-1 last:border-0">
                                            <span className="capitalize text-slate-500">{key}</span>
                                            <span className="font-mono">{val}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-600 font-mono break-all">
                                    Sig: {cred.signature.substring(0, 32)}...
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
export default StudentDashboard;
