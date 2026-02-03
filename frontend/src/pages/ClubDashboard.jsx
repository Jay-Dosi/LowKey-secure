import React, { useState, useEffect } from 'react';
import api from '../api';
import { Calendar, Users, RefreshCw, Eye, Plus, Activity } from 'lucide-react';

const ClubDashboard = () => {
    const [requests, setRequests] = useState([]);
    const [eventName, setEventName] = useState('');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [logs, setLogs] = useState([]);

    // Attribute Checkboxes
    const [attributes, setAttributes] = useState({
        major: false,
        year: false,
        email: false, // High Risk
        phone: false, // High Risk
        dorm: false
    });

    const fetchRequests = async () => {
        try {
            const res = await api.get('/club/requests');
            setRequests(res.data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        fetchRequests();
        const interval = setInterval(fetchRequests, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        const requested = Object.keys(attributes).filter(k => attributes[k]);
        try {
            await api.post('/club/requests', { event_name: eventName, requested_attributes: requested });
            setEventName('');
            setAttributes({ major: false, year: false, email: false, phone: false, dorm: false });
            fetchRequests();
            alert('Event Created!');
        } catch (err) { alert('Error creating event'); }
    };

    const viewLogs = async (reqId) => {
        try {
            const res = await api.get(`/club/requests/${reqId}/logs`);
            setLogs(res.data);
            setSelectedRequest(reqId);
        } catch (err) { console.error(err); }
    };

    // Poll logs if selected
    useEffect(() => {
        if (!selectedRequest) return;
        const interval = setInterval(() => viewLogs(selectedRequest), 3000);
        return () => clearInterval(interval);
    }, [selectedRequest]);

    return (
        <div className="space-y-8">
            <div className="flex items-center space-x-4">
                <div className="p-3 bg-purple-500/10 rounded-xl">
                    <Calendar className="w-8 h-8 text-purple-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Club Command Center</h1>
                    <p className="text-slate-400">Manage events and verify attendees anonymously</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Create Request */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center">
                        <Plus className="w-5 h-5 mr-2 text-green-400" /> Create Check-in Event
                    </h2>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Event Name</label>
                            <input
                                type="text" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                                value={eventName} onChange={e => setEventName(e.target.value)} placeholder="e.g. Hackathon Check-in"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-2">Required Attributes (What do you need?)</label>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.keys(attributes).map(attr => (
                                    <label key={attr} className="flex items-center space-x-2 text-slate-300 bg-slate-950/50 p-2 rounded cursor-pointer hover:bg-slate-800">
                                        <input
                                            type="checkbox" checked={attributes[attr]}
                                            onChange={() => setAttributes(prev => ({ ...prev, [attr]: !prev[attr] }))}
                                            className="rounded border-slate-700 text-green-500 focus:ring-green-500 bg-slate-900"
                                        />
                                        <span className="capitalize">{attr}</span>
                                        {['email', 'phone'].includes(attr) && <span className="text-xs text-red-500 font-bold ml-1">PII</span>}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-lg">Create Event</button>
                    </form>
                </div>

                {/* Request List */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm h-[400px] overflow-y-auto">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center">
                        <Activity className="w-5 h-5 mr-2 text-green-400" /> Active Events
                    </h2>
                    <div className="space-y-3">
                        {requests.map(req => (
                            <div key={req.id}
                                onClick={() => viewLogs(req.id)}
                                className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedRequest === req.id ? 'bg-purple-900/20 border-purple-500' : 'bg-slate-950 border-slate-800 hover:border-slate-600'}`}>
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-white">{req.event_name}</h3>
                                    <span className={`text-xs px-2 py-1 rounded bg-slate-900 border ${req.risk_level === 'HIGH' ? 'text-red-400 border-red-900' : 'text-green-400 border-green-900'}`}>
                                        {req.risk_level} RISK
                                    </span>
                                </div>
                                <div className="text-xs text-slate-500 mt-2">ID: {req.id} • Attrs: {req.requested_attributes.join(', ')}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Live Feed */}
            {selectedRequest && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-white flex items-center">
                            <Users className="w-5 h-5 mr-2 text-green-400" /> Live Attendance Feed
                        </h2>
                        <button onClick={() => viewLogs(selectedRequest)} className="text-slate-400 hover:text-white"><RefreshCw className="w-4 h-4" /></button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-800 text-slate-500 text-sm">
                                    <th className="pb-3 px-4">Status</th>
                                    <th className="pb-3 px-4">Identity</th>
                                    <th className="pb-3 px-4">Proof Timestamp</th>
                                    <th className="pb-3 px-4">Reference ID</th>
                                </tr>
                            </thead>
                            <tbody className="text-slate-300">
                                {logs.length === 0 ? (
                                    <tr><td colSpan="4" className="text-center py-8 text-slate-500">No attendees yet.</td></tr>
                                ) : (
                                    logs.map(log => (
                                        <tr key={log.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                                            <td className="py-3 px-4 text-green-400 font-bold flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span> Verified</td>
                                            <td className="py-3 px-4">Anonymous Student</td>
                                            <td className="py-3 px-4 font-mono text-sm text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</td>
                                            <td className="py-3 px-4 font-mono text-xs text-slate-600">{log.proof_signature ? log.proof_signature.substring(0, 10) + '...' : 'N/A'}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
export default ClubDashboard;
