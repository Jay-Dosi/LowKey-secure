import React from 'react';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

const RiskBadge = ({ level, message }) => {
    if (level === 'HIGH') {
        return (
            <div className="flex flex-col items-center justify-center p-6 bg-red-900/20 border border-red-500/50 rounded-xl animate-pulse ring-1 ring-red-500 w-full">
                <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
                <h3 className="text-xl font-bold text-red-500">RISK LEVEL: HIGH</h3>
                <p className="text-red-300 mt-2 text-center text-sm">{message}</p>
            </div>
        );
    }
    return (
        <div className="flex flex-col items-center justify-center p-6 bg-green-900/20 border border-green-500/50 rounded-xl w-full">
            <ShieldCheck className="w-16 h-16 text-green-400 mb-4" />
            <h3 className="text-xl font-bold text-green-400">RISK LEVEL: LOW</h3>
            <p className="text-green-300 mt-2 text-center text-sm">{message}</p>
        </div>
    );
};
export default RiskBadge;
