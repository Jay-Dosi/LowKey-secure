import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import RiskBadge from '../components/RiskBadge';
import { CheckCircle, XCircle, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';

const RequestDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [approving, setApproving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchRequest = async () => {
            try {
                const res = await api.get(`/student/requests/${id}`);
                setRequest(res.data);
            } catch (err) {
                setError('Request not found');
            } finally {
                setLoading(false);
            }
        };
        fetchRequest();
    }, [id]);

    const handleApprove = async () => {
        setApproving(true);
        try {
            await api.post(`/student/requests/${id}/approve`);
            setTimeout(() => {
                setSuccess(true);
                setApproving(false);
            }, 1000); // Fake delay for animation
        } catch (err) {
            alert('Approval Failed: ' + (err.response?.data?.detail || err.message));
            setApproving(false);
        }
    };

    if (loading) return <div className="text-center text-slate-500 mt-20">Loading...</div>;
    if (error) return <div className="text-center text-red-500 mt-20">{error}</div>;
    if (success) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in zoom-in duration-500">
            <div className="bg-green-500/20 p-8 rounded-full mb-6 ring-2 ring-green-500 ring-offset-4 ring-offset-slate-950">
                <CheckCircle className="w-20 h-20 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Access Granted</h1>
            <p className="text-slate-400 mb-8">Your eligibility has been verified anonymously.</p>
            <button onClick={() => navigate('/student')} className="text-green-400 hover:text-green-300 font-bold">Return to Wallet</button>
        </div>
    );

    return (
        <div className="max-w-md mx-auto mt-8">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-slate-800">
                    <h2 className="text-sm text-slate-500 uppercase tracking-wider mb-1">Access Request</h2>
                    <h1 className="text-2xl font-bold text-white">{request.event_name}</h1>
                </div>

                <div className="p-6 space-y-6">
                    <RiskBadge level={request.risk_level} message={request.risk_message} />

                    <div>
                        <h3 className="text-sm font-medium text-slate-400 mb-3">Attributes Requested:</h3>
                        <div className="flex flex-wrap gap-2">
                            {request.requested_attributes.map(attr => (
                                <span key={attr} className="px-3 py-1 bg-slate-800 rounded-full text-slate-300 text-sm border border-slate-700">
                                    {attr}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-sm">
                        <div className="flex items-center mb-2">
                            <ShieldCheck className="w-4 h-4 text-green-500 mr-2" />
                            <span className="text-slate-300">Using: <span className="text-white font-mono">University ID</span></span>
                        </div>
                        <p className="text-slate-500 text-xs">
                            A Zero-Knowledge Proof will be generated to verify these attributes without revealing your full identity (Simulated).
                        </p>
                    </div>
                </div>

                <div className="p-6 bg-slate-950/50 border-t border-slate-800">
                    <button
                        onClick={handleApprove}
                        disabled={approving}
                        className={`w-full font-bold py-4 rounded-xl flex items-center justify-center transition-all ${request.risk_level === 'HIGH'
                                ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20'
                                : 'bg-green-500 hover:bg-green-400 text-slate-950 shadow-lg shadow-green-900/20'
                            }`}
                    >
                        {approving ? <Loader2 className="w-6 h-6 animate-spin" /> :
                            request.risk_level === 'HIGH' ? 'Authorize Disclosure' : 'Slide to Consent'}
                        {!approving && <ArrowRight className="ml-2 w-5 h-5" />}
                    </button>

                    <button onClick={() => navigate('/student')} className="w-full text-center text-slate-500 text-sm mt-4 hover:text-white">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};
export default RequestDetails;
