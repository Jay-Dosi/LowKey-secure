import { ShieldCheck, AlertTriangle, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

const RiskBadge = ({ level, message, className }) => {
    const isHigh = level === 'HIGH';
    const isMedium = level === 'MEDIUM';

    const getStyles = () => {
        if (isHigh) return 'bg-red-900/20 border-red-500/50 ring-1 ring-red-500 animate-pulse';
        if (isMedium) return 'bg-amber-900/20 border-amber-500/50 ring-1 ring-amber-500';
        return 'bg-green-900/20 border-green-500/50';
    };

    const getIcon = () => {
        if (isHigh) return <AlertTriangle className="size-16 text-red-500 mb-4" aria-hidden="true" />;
        if (isMedium) return <ShieldAlert className="size-16 text-amber-400 mb-4" aria-hidden="true" />;
        return <ShieldCheck className="size-16 text-green-400 mb-4" aria-hidden="true" />;
    };

    const getTextColor = () => {
        if (isHigh) return 'text-red-500';
        if (isMedium) return 'text-amber-400';
        return 'text-green-400';
    };

    const getMessageColor = () => {
        if (isHigh) return 'text-red-300';
        if (isMedium) return 'text-amber-300';
        return 'text-green-300';
    };

    return (
        <figure
            role="status"
            aria-label={`Risk level: ${level}`}
            className={cn(
                'flex flex-col items-center justify-center p-6 rounded-xl w-full border',
                getStyles(),
                className
            )}
        >
            {getIcon()}

            <figcaption className="text-center">
                <h3 className={cn('text-xl font-bold', getTextColor())}>
                    RISK LEVEL: {level}
                </h3>
                <p className={cn('mt-2 text-sm', getMessageColor())}>
                    {message}
                </p>
            </figcaption>
        </figure>
    );
};

export default RiskBadge;
