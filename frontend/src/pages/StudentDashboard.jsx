import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/api';
import { Wallet, QrCode, ArrowRight, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const StudentDashboard = () => {
    const [credentials, setCredentials] = useState([]);
    const [requestId, setRequestId] = useState('');
    const navigate = useNavigate();

    const fetchCredentials = useCallback(async () => {
        try {
            const res = await api.get('/student/credentials');
            setCredentials(res.data);
        } catch (err) {
            console.error(err);
        }
    }, []);

    useEffect(() => {
        fetchCredentials();
    }, [fetchCredentials]);

    const handleScan = (e) => {
        e.preventDefault();
        if (requestId.trim()) {
            navigate(`/student/request/${requestId}`);
        }
    };

    return (
        <article className="space-y-8 pb-20">
            {/* Header */}
            <header className="flex items-center gap-4">
                <figure className="p-3 bg-green-500/10 rounded-xl" aria-hidden="true">
                    <Wallet className="size-8 text-green-400" />
                </figure>
                <hgroup>
                    <h1 className="text-2xl font-bold text-white">My Data Vault</h1>
                    <p className="text-muted-foreground">Manage your verifiable credentials</p>
                </hgroup>
            </header>

            {/* Request Scanner */}
            <Card className="bg-gradient-to-r from-blue-900/40 to-slate-900 border-blue-500/30">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <QrCode className="size-5 text-blue-400" aria-hidden="true" />
                        Scan Access Request
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleScan} className="flex flex-col sm:flex-row gap-4">
                        <fieldset className="flex-1 space-y-2">
                            <Label htmlFor="request-id" className="sr-only">
                                Request ID
                            </Label>
                            <Input
                                id="request-id"
                                type="text"
                                value={requestId}
                                onChange={(e) => setRequestId(e.target.value)}
                                placeholder="Enter Request ID (e.g. 1)"
                            />
                        </fieldset>
                        <Button type="submit" variant="blue">
                            View
                            <ArrowRight className="ml-2 size-4" aria-hidden="true" />
                        </Button>
                    </form>
                    <p className="text-xs text-muted-foreground mt-3">
                        In a real app, you would scan a QR code here.
                    </p>
                </CardContent>
            </Card>

            {/* Credentials Section */}
            <section aria-labelledby="credentials-heading">
                <header className="flex items-center gap-2 mb-4">
                    <Shield className="size-5 text-green-400" aria-hidden="true" />
                    <h2 id="credentials-heading" className="text-lg font-bold text-white">
                        Issued Credentials
                    </h2>
                </header>

                {credentials.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <p className="text-muted-foreground">
                                No credentials yet. Ask your university admin.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <ul className="grid md:grid-cols-2 gap-4" role="list">
                        {credentials.map((cred) => (
                            <li key={cred.id}>
                                <Card className="relative overflow-hidden group hover:border-green-500/50 transition-colors h-full">
                                    <figure
                                        className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"
                                        aria-hidden="true"
                                    >
                                        <Shield className="size-24 text-white" />
                                    </figure>

                                    <CardHeader className="relative z-10">
                                        <div className="flex justify-between items-start">
                                            <CardTitle className="text-xl">University ID</CardTitle>
                                            <Badge variant="success">VERIFIED</Badge>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="relative z-10 space-y-4">
                                        <dl className="space-y-2 text-sm">
                                            {Object.entries(cred.data).map(([key, val]) => (
                                                <div
                                                    key={key}
                                                    className="flex justify-between border-b border-slate-800 pb-1 last:border-0"
                                                >
                                                    <dt className="capitalize text-muted-foreground">{key}</dt>
                                                    <dd className="font-mono text-foreground">{val}</dd>
                                                </div>
                                            ))}
                                        </dl>

                                        <footer className="pt-4 border-t border-slate-800">
                                            <p className="text-xs text-muted-foreground font-mono break-all">
                                                Sig: {cred.signature.substring(0, 32)}...
                                            </p>
                                        </footer>
                                    </CardContent>
                                </Card>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </article>
    );
};

export default StudentDashboard;
