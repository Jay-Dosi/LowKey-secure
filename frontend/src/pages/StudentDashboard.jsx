import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/api';
import { Wallet, Shield, Sparkles, Loader2, AlertTriangle, CheckCircle, ShieldAlert, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

const StudentDashboard = () => {
    const [events, setEvents] = useState([]);
    const [registeredEvents, setRegisteredEvents] = useState([]);
    const [dismissedEvents, setDismissedEvents] = useState(() => {
        const saved = localStorage.getItem('dismissedEvents');
        return saved ? JSON.parse(saved) : [];
    });
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [consenting, setConsenting] = useState(false);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    // Filter available events: exclude registered and dismissed
    const registeredEventIds = registeredEvents.map(e => e.id);
    const availableEvents = events.filter(
        event => !registeredEventIds.includes(event.id) && !dismissedEvents.includes(event.id)
    );

    const handleDismissEvent = (eventId) => {
        const updated = [...dismissedEvents, eventId];
        setDismissedEvents(updated);
        localStorage.setItem('dismissedEvents', JSON.stringify(updated));
    };

    const fetchEvents = useCallback(async () => {
        try {
            const res = await api.get('/student/events');
            setEvents(res.data);
        } catch (err) {
            console.error('Failed to fetch events:', err);
        }
    }, []);

    const fetchRegisteredEvents = useCallback(async () => {
        try {
            const res = await api.get('/student/registered-events');
            setRegisteredEvents(res.data);
        } catch (err) {
            console.error(err);
        }
    }, []);

    useEffect(() => {
        fetchEvents();
        fetchRegisteredEvents();
    }, [fetchEvents, fetchRegisteredEvents]);

    async function handleConsent(eventId) {
        setConsenting(true);
        try {
            const response = await api.post(`/student/events/${eventId}/consent`);
            setSelectedEvent(null); // Close consent dialog
            setSuccess(true); // Show success animation
            setTimeout(() => setSuccess(false), 3000); // Auto-close after 3s
            fetchEvents(); // Refresh events list
            fetchRegisteredEvents(); // Refresh registered events
        } catch (err) {
            alert(err.response?.data?.detail || 'Consent failed');
        } finally {
            setConsenting(false);
        }
    }

    return (
        <article className="space-y-8 pb-20">
            {/* Header */}
            <header className="flex items-center gap-4">
                <figure className="p-3 bg-green-500/10 rounded-xl" aria-hidden="true">
                    <Wallet className="size-8 text-green-400" />
                </figure>
                <hgroup>
                    <h1 className="text-2xl font-bold text-white">My Data Vault</h1>
                    <p className="text-muted-foreground">Manage your verifiable credentials and event access</p>
                </hgroup>
            </header>

            {/* Registered Events Section */}
            {registeredEvents.length > 0 && (
                <section aria-labelledby="registered-heading">
                    <header className="flex items-center gap-2 mb-4">
                        <CheckCircle className="size-5 text-green-400" aria-hidden="true" />
                        <h2 id="registered-heading" className="text-lg font-bold text-white">
                            Registered Events
                        </h2>
                        <Badge variant="success">{registeredEvents.length}</Badge>
                    </header>

                    <ul className="grid md:grid-cols-2 gap-4 mb-8" role="list">
                        {registeredEvents.map((event) => (
                            <li key={event.id}>
                                <Card className="border-green-500/50 bg-green-500/5 h-full">
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <CheckCircle className="h-5 w-5 text-green-400" />
                                                {event.event_name}
                                            </CardTitle>
                                            <Badge variant="success">REGISTERED</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        {event.event_description && (
                                            <p className="text-sm text-slate-400">{event.event_description}</p>
                                        )}
                                        <div className="flex flex-wrap gap-1">
                                            {event.requested_attributes.map((attr, i) => (
                                                <Badge key={i} variant="outline" className="text-xs">
                                                    {attr}
                                                </Badge>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {/* Available Events */}
            <section aria-labelledby="events-heading">
                <header className="flex items-center gap-2 mb-4">
                    <Sparkles className="size-5 text-blue-400" aria-hidden="true" />
                    <h2 id="events-heading" className="text-lg font-bold text-white">
                        Available Events
                    </h2>
                    {availableEvents.length > 0 && (
                        <Badge variant="info">{availableEvents.length}</Badge>
                    )}
                </header>

                {availableEvents.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <p className="text-muted-foreground">
                                No events available for your year.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <ul className="grid md:grid-cols-2 gap-4" role="list">
                        {availableEvents.map((event) => (
                            <li key={event.id}>
                                <Card className="hover:border-blue-500/50 transition-colors h-full relative">
                                    {/* Dismiss button */}
                                    <button
                                        onClick={() => handleDismissEvent(event.id)}
                                        className="absolute top-2 right-2 p-1 rounded-full hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors z-10"
                                        title="Dismiss event"
                                        aria-label="Dismiss this event"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                    <CardHeader>
                                        <div className="flex justify-between items-start pr-6">
                                            <CardTitle className="text-xl">{event.event_name}</CardTitle>
                                            {event.risk_level === 'HIGH' ? (
                                                <Badge variant="destructive" className="flex items-center gap-1">
                                                    <AlertTriangle className="h-3 w-3" />
                                                    HIGH RISK
                                                </Badge>
                                            ) : event.risk_level === 'MEDIUM' ? (
                                                <Badge variant="warning" className="flex items-center gap-1">
                                                    <ShieldAlert className="h-3 w-3" />
                                                    MEDIUM RISK
                                                </Badge>
                                            ) : (
                                                <Badge variant="success" className="flex items-center gap-1">
                                                    <Shield className="h-3 w-3" />
                                                    LOW RISK
                                                </Badge>
                                            )}
                                        </div>
                                        <CardDescription>{event.risk_message}</CardDescription>
                                    </CardHeader>

                                    <CardContent className="space-y-4">
                                        <div>
                                            <p className="text-sm text-slate-400">Requested Attributes:</p>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {event.requested_attributes.map((attr, i) => (
                                                    <Badge key={i} variant="outline">{attr}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                        <Button
                                            variant="blue"
                                            className="w-full"
                                            onClick={() => setSelectedEvent(event)}
                                        >
                                            Give Consent
                                        </Button>
                                    </CardContent>
                                </Card>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {/* Consent Modal */}
            <Dialog open={!!selectedEvent && !success} onOpenChange={() => setSelectedEvent(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {selectedEvent?.risk_level === 'HIGH' ? (
                                <>
                                    <AlertTriangle className="h-5 w-5 text-red-400 animate-pulse" />
                                    Privacy Warning
                                </>
                            ) : selectedEvent?.risk_level === 'MEDIUM' ? (
                                <>
                                    <ShieldAlert className="h-5 w-5 text-amber-400" />
                                    Privacy Notice
                                </>
                            ) : (
                                <>
                                    <Shield className="h-5 w-5 text-green-400" />
                                    Consent Required
                                </>
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedEvent?.event_name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className={`rounded-lg p-4 ${
                            selectedEvent?.risk_level === 'HIGH' ? 'bg-red-500/10' : 
                            selectedEvent?.risk_level === 'MEDIUM' ? 'bg-amber-500/10' : 
                            'bg-green-500/10'
                        }`}>
                            <p className={`text-sm ${
                                selectedEvent?.risk_level === 'HIGH' ? 'text-red-400' : 
                                selectedEvent?.risk_level === 'MEDIUM' ? 'text-amber-400' : 
                                'text-green-400'
                            }`}>
                                {selectedEvent?.risk_message}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-medium mb-2">This event will access:</p>
                            <div className="flex flex-wrap gap-2">
                                {selectedEvent?.requested_attributes.map((attr, i) => (
                                    <Badge key={i} variant="outline">{attr}</Badge>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedEvent(null)}>
                            Cancel
                        </Button>
                        <Button
                            variant={selectedEvent?.risk_level === 'HIGH' ? 'destructive' : selectedEvent?.risk_level === 'MEDIUM' ? 'default' : 'green'}
                            onClick={() => handleConsent(selectedEvent?.id)}
                            disabled={consenting}
                        >
                            {consenting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <Shield className="h-4 w-4" />
                                    I Consent
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Success Modal */}
            <Dialog open={success} onOpenChange={() => setSuccess(false)}>
                <DialogContent className="sm:max-w-md">
                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                        <div className="rounded-full bg-green-500/10 p-6 animate-pulse">
                            <Shield className="h-16 w-16 text-green-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white">Access Granted!</h3>
                        <p className="text-center text-slate-400">
                            Your attendance has been verified anonymously.
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        </article>
    );
};

export default StudentDashboard;
