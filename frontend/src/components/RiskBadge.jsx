import { ShieldCheck, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const RiskBadge = ({ level, message, className }) => {
    const isHigh = level === 'HIGH';

    return (
        <figure
            role="status"
            aria-label={`Risk level: ${level}`}
            className={cn(
                'flex flex-col items-center justify-center p-6 rounded-xl w-full border',
                isHigh
                    ? 'bg-red-900/20 border-red-500/50 ring-1 ring-red-500 animate-pulse'
                    : 'bg-green-900/20 border-green-500/50',
                className
            )}
        >
            {isHigh ? (
                <AlertTriangle className="size-16 text-red-500 mb-4" aria-hidden="true" />
            ) : (
                <ShieldCheck className="size-16 text-green-400 mb-4" aria-hidden="true" />
            )}

            <figcaption className="text-center">
                <h3 className={cn(
                    'text-xl font-bold',
                    isHigh ? 'text-red-500' : 'text-green-400'
                )}>
                    RISK LEVEL: {level}
                </h3>
                <p className={cn(
                    'mt-2 text-sm',
                    isHigh ? 'text-red-300' : 'text-green-300'
                )}>
                    {message}
                </p>
            </figcaption>
        </figure>
    );
};

export default RiskBadge;
