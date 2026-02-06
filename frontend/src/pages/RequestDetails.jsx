import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/api';
import RiskBadge from '@/components/RiskBadge';
import { CheckCircle, ArrowRight, ShieldCheck, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const RequestDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [approving, setApproving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [approvalError, setApprovalError] = useState('');

    const fetchRequest = useCallback(async () => {
        try {
            const res = await api.get(`/student/requests/${id}`);
            setRequest(res.data);
        } catch (err) {
            setError('Request not found');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchRequest();
    }, [fetchRequest]);

    const handleApprove = async () => {
        setApproving(true);
        setApprovalError('');
        try {
            await api.post(`/student/requests/${id}/approve`);
            setTimeout(() => {
                setSuccess(true);
                setApproving(false);
            }, 1000);
        } catch (err) {
            setApprovalError(err.response?.data?.detail || err.message);
            setApproving(false);
        }
    };

    // Loading state
    if (loading) {
        return (
            <article className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="size-8 animate-spin text-muted-foreground" aria-label="Loading" />
            </article>
        );
    }

    // Error state
    if (error) {
        return (
            <article className="flex items-center justify-center min-h-[60vh]">
                <p className="text-destructive text-lg">{error}</p>
            </article>
        );
    }

    // Success state
    if (success) {
        return (
            <article className="flex flex-col items-center justify-center min-h-[60vh] animate-in">
                <figure
                    className="bg-green-500/20 p-8 rounded-full mb-6 ring-2 ring-green-500 ring-offset-4 ring-offset-slate-950"
                    aria-hidden="true"
                >
                    <CheckCircle className="size-20 text-green-500" />
                </figure>
                <hgroup className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Access Granted</h1>
                    <p className="text-muted-foreground">
                        Your eligibility has been verified anonymously.
                    </p>
                </hgroup>
                <Button variant="ghost" onClick={() => navigate('/student')}>
                    Return to Wallet
                </Button>
            </article>
        );
    }

    const isHighRisk = request.risk_level === 'HIGH';
    const isMediumRisk = request.risk_level === 'MEDIUM';

    const getButtonVariant = () => {
        if (isHighRisk) return 'destructive';
        if (isMediumRisk) return 'default';
        return 'green';
    };

    const getButtonText = () => {
        if (isHighRisk) return 'Authorize Disclosure';
        if (isMediumRisk) return 'Consent to Share';
        return 'Grant Access';
    };

    return (
        <article className="max-w-md mx-auto mt-8">
            <Card className="overflow-hidden shadow-2xl">
                <CardHeader className="border-b border-border">
                    <CardDescription className="uppercase tracking-wider">
                        Access Request
                    </CardDescription>
                    <CardTitle className="text-2xl">{request.event_name}</CardTitle>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                    <RiskBadge level={request.risk_level} message={request.risk_message} />

                    <section aria-labelledby="attributes-heading">
                        <h3
                            id="attributes-heading"
                            className="text-sm font-medium text-muted-foreground mb-3"
                        >
                            Attributes Requested:
                        </h3>
                        <ul className="flex flex-wrap gap-2" role="list">
                            {request.requested_attributes.map((attr) => (
                                <li key={attr}>
                                    <Badge variant="default">{attr}</Badge>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <aside className="bg-slate-950 p-4 rounded-lg border border-border text-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <ShieldCheck className="size-4 text-green-500" aria-hidden="true" />
                            <span className="text-muted-foreground">
                                Using: <code className="text-foreground font-mono">University ID</code>
                            </span>
                        </div>
                        <p className="text-muted-foreground text-xs">
                            A Zero-Knowledge Proof will be generated to verify these attributes
                            without revealing your full identity (Simulated).
                        </p>
                    </aside>
                </CardContent>

                <CardFooter className="flex flex-col gap-4 p-6 bg-slate-950/50 border-t border-border">
                    {approvalError && (
                        <div
                            role="alert"
                            className="flex items-center gap-3 w-full p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400"
                        >
                            <XCircle className="size-5 shrink-0" aria-hidden="true" />
                            <p className="text-sm font-medium">{approvalError}</p>
                        </div>
                    )}

                    <Button
                        onClick={handleApprove}
                        disabled={approving}
                        variant={getButtonVariant()}
                        size="lg"
                        className="w-full"
                    >
                        {approving ? (
                            <Loader2 className="size-5 animate-spin" aria-label="Processing" />
                        ) : (
                            <>
                                {getButtonText()}
                                <ArrowRight className="ml-2 size-5" aria-hidden="true" />
                            </>
                        )}
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={() => navigate('/student')}
                    >
                        Cancel
                    </Button>
                </CardFooter>
            </Card>
        </article>
    );
};

export default RequestDetails;
