import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/api';
import { Wallet, Shield, Sparkles, Loader2, AlertTriangle, CheckCircle, ShieldAlert, X, Clock, Activity, Building2, CalendarDays, Users, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
    const [customResponses, setCustomResponses] = useState({}); // { field_id: value }
    const [validationErrors, setValidationErrors] = useState({}); // { field_id: error_msg }
    const [expandedEvent, setExpandedEvent] = useState(null); // track expanded registered event
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
        // Frontend validation for required custom fields
        const errors = {};
        if (selectedEvent?.custom_fields) {
            selectedEvent.custom_fields.forEach(field => {
                if (field.required) {
                    const value = customResponses[field.id];
                    if (value === undefined || value === null || String(value).trim() === '') {
                        errors[field.id] = `${field.label} is required`;
                    }
                }
            });
        }
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }
        setValidationErrors({});

        setConsenting(true);
        try {
            // Prepare Custom Responses
            const responses = Object.entries(customResponses).map(([fieldId, value]) => ({
                field_id: parseInt(fieldId),
                response_value: String(value)
            }));

            const payload = {
                custom_responses: responses
            };

            const response = await api.post(`/student/events/${eventId}/consent`, payload);
            setSelectedEvent(null); // Close consent dialog
            setCustomResponses({}); // Reset responses
            setValidationErrors({});
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
                    <p className="text-muted-foreground">Manage event access</p>
                </hgroup>
            </header>

            {/* Privacy Report Quick Link */}
            <button
                onClick={() => navigate('/student/privacy-report')}
                className="w-full group"
                aria-label="View Privacy Risk Advisor"
            >
                <Card className="border-purple-500/20 bg-gradient-to-r from-purple-500/5 via-transparent to-blue-500/5 hover:border-purple-500/40 transition-all duration-300 cursor-pointer">
                    <CardContent className="py-4 flex items-center gap-4">
                        <figure className="p-2.5 bg-purple-500/10 rounded-xl group-hover:bg-purple-500/20 transition-colors" aria-hidden="true">
                            <Activity className="size-6 text-purple-400" />
                        </figure>
                        <div className="flex-1 text-left">
                            <h3 className="text-sm font-semibold text-white">Privacy Risk Advisor</h3>
                            <p className="text-xs text-slate-400">View your monthly privacy exposure analysis & AI insights</p>
                        </div>

                    </CardContent>
                </Card>
            </button>

            {/* Registered Events Section */}
            {registeredEvents.length > 0 && (
                <section aria-labelledby="registered-heading">
                    <header className="flex items-center gap-2 mb-4">
                        <CheckCircle className="size-5 text-green-400" aria-hidden="true" />
                        <h2 id="registered-heading" className="text-lg font-bold text-white">
                            Attended Events
                        </h2>
                        <Badge variant="success">{registeredEvents.length}</Badge>
                    </header>

                    <ul className="space-y-3 mb-8" role="list">
                        {registeredEvents.map((event) => {
                            const isExpired = event.expiry_date && new Date(event.expiry_date) < new Date();
                            const isExpanded = expandedEvent === event.id;
                            const riskVariant = event.risk_level === 'HIGH' ? 'danger' : event.risk_level === 'MEDIUM' ? 'warning' : 'success';
                            const RiskIcon = event.risk_level === 'HIGH' ? AlertTriangle : event.risk_level === 'MEDIUM' ? ShieldAlert : Shield;

                            return (
                                <li key={event.id}>
                                    <Card className={`transition-all duration-200 ${isExpired ? 'border-slate-700 opacity-70' : 'border-green-500/30 bg-green-500/[0.03]'}`}>
                                        {/* Collapsed row — always visible */}
                                        <button
                                            onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
                                            className="w-full text-left"
                                            aria-expanded={isExpanded}
                                        >
                                            <CardHeader className="pb-0">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <CheckCircle className="h-5 w-5 text-green-400 shrink-0" />
                                                        <div className="min-w-0">
                                                            <CardTitle className="text-base truncate">{event.event_name}</CardTitle>
                                                            {event.club_name && (
                                                                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                                    <Building2 className="h-3 w-3" />
                                                                    {event.club_name}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <Badge variant={riskVariant} className="text-[10px] flex items-center gap-1">
                                                            <RiskIcon className="h-3 w-3" />
                                                            {event.risk_level}
                                                        </Badge>
                                                        {isExpired && <Badge variant="danger" className="text-[10px]">EXPIRED</Badge>}
                                                        {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                                                    </div>
                                                </div>
                                            </CardHeader>
                                        </button>

                                        {/* Expanded details */}
                                        {isExpanded && (
                                            <CardContent className="pt-4 space-y-4 border-t border-slate-800/50 mt-3">
                                                {/* Description */}
                                                {event.event_description && (
                                                    <p className="text-sm text-slate-400 leading-relaxed">{event.event_description}</p>
                                                )}

                                                {/* Risk message */}
                                                <div className={`rounded-lg p-3 text-sm ${event.risk_level === 'HIGH' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                                        event.risk_level === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                            'bg-green-500/10 text-green-400 border border-green-500/20'
                                                    }`}>
                                                    {event.risk_message}
                                                </div>

                                                {/* Shared attributes */}
                                                <div>
                                                    <p className="text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1">
                                                        <Eye className="h-3 w-3" /> Data Shared
                                                    </p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {event.requested_attributes.map((attr, i) => (
                                                            <Badge key={i} variant="outline" className="text-xs">{attr}</Badge>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Custom fields shared */}
                                                {event.custom_fields && event.custom_fields.length > 0 && (
                                                    <div>
                                                        <p className="text-xs font-medium text-slate-500 mb-1.5">Custom Fields</p>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {event.custom_fields.map((cf) => (
                                                                <Badge key={cf.id} variant={cf.risk_level === 'HIGH' ? 'danger' : cf.risk_level === 'MEDIUM' ? 'warning' : 'default'} className="text-xs">
                                                                    {cf.label}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Meta info grid */}
                                                <div className="grid grid-cols-2 gap-3 text-xs">
                                                    {/* Allowed Years */}
                                                    {event.allowed_years && event.allowed_years.length > 0 && (
                                                        <div className="flex items-start gap-1.5">
                                                            <Users className="h-3.5 w-3.5 text-slate-500 mt-0.5 shrink-0" />
                                                            <div>
                                                                <p className="text-slate-500 font-medium">Eligible Years</p>
                                                                <p className="text-slate-300">{event.allowed_years.join(', ')}</p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Created at */}
                                                    <div className="flex items-start gap-1.5">
                                                        <CalendarDays className="h-3.5 w-3.5 text-slate-500 mt-0.5 shrink-0" />
                                                        <div>
                                                            <p className="text-slate-500 font-medium">Created</p>
                                                            <p className="text-slate-300">
                                                                {new Date(event.created_at).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' })}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Expiry date */}
                                                    {event.expiry_date && (
                                                        <div className="flex items-start gap-1.5">
                                                            <Clock className="h-3.5 w-3.5 text-slate-500 mt-0.5 shrink-0" />
                                                            <div>
                                                                <p className="text-slate-500 font-medium">{isExpired ? 'Expired' : 'Expires'}</p>
                                                                <p className={isExpired ? 'text-red-400 font-medium' : 'text-slate-300'}>
                                                                    {new Date(event.expiry_date).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        )}
                                    </Card>
                                </li>
                            );
                        })}
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
                                                <Badge variant="danger" className="flex items-center gap-1">
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
                                        {event.expiry_date && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Clock className="h-4 w-4 text-slate-400" />
                                                <span className="text-slate-400">{new Date(event.expiry_date) < new Date() ? 'Expired:' : 'Expires:'}</span>
                                                <span className={`font-medium ${new Date(event.expiry_date) < new Date() ? 'text-red-400' : 'text-slate-300'}`}>
                                                    {new Date(event.expiry_date).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        )}
                                        {event.expiry_date && new Date(event.expiry_date) < new Date() ? (
                                            <Badge variant="danger" className="w-full justify-center py-2 text-sm">
                                                Event Expired
                                            </Badge>
                                        ) : (
                                            <Button
                                                variant="blue"
                                                className="w-full"
                                                onClick={() => setSelectedEvent(event)}
                                            >
                                                Give Consent
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {/* Consent Modal */}
            <Dialog open={!!selectedEvent && !success} onOpenChange={() => { setSelectedEvent(null); setCustomResponses({}); setValidationErrors({}); }}>
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
                        <div className={`rounded-lg p-4 ${selectedEvent?.risk_level === 'HIGH' ? 'bg-red-500/10' :
                            selectedEvent?.risk_level === 'MEDIUM' ? 'bg-amber-500/10' :
                                'bg-green-500/10'
                            }`}>
                            <p className={`text-sm ${selectedEvent?.risk_level === 'HIGH' ? 'text-red-400' :
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

                        {/* Custom Fields Input Section */}
                        {selectedEvent?.custom_fields && selectedEvent.custom_fields.length > 0 && (
                            <div className="space-y-4 border-t border-slate-800 pt-4">
                                <h4 className="text-sm font-medium text-white">Additional Information Required</h4>
                                <div className="space-y-4">
                                    {selectedEvent.custom_fields.map(field => (
                                        <div key={field.id} className="space-y-2">
                                            <Label htmlFor={`field-${field.id}`} className="text-xs text-slate-400">
                                                {field.label} {field.required && <span className="text-red-400">*</span>}
                                            </Label>

                                            {field.field_type === 'short_text' || field.field_type === 'url' || field.field_type === 'number' ? (
                                                <Input
                                                    id={`field-${field.id}`}
                                                    type={field.field_type === 'number' ? 'number' : 'text'}
                                                    placeholder={field.placeholder || ''}
                                                    value={customResponses[field.id] || ''}
                                                    onChange={(e) => { setCustomResponses({ ...customResponses, [field.id]: e.target.value }); setValidationErrors(prev => { const n = { ...prev }; delete n[field.id]; return n; }); }}
                                                    required={field.required}
                                                    className={`h-9 bg-slate-950/50 border-slate-800 focus:ring-blue-500 ${validationErrors[field.id] ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                                                />
                                            ) : field.field_type === 'long_text' ? (
                                                <textarea
                                                    id={`field-${field.id}`}
                                                    className={`flex min-h-[80px] w-full rounded-md border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${validationErrors[field.id] ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                                                    placeholder={field.placeholder || ''}
                                                    value={customResponses[field.id] || ''}
                                                    onChange={(e) => { setCustomResponses({ ...customResponses, [field.id]: e.target.value }); setValidationErrors(prev => { const n = { ...prev }; delete n[field.id]; return n; }); }}
                                                    required={field.required}
                                                />
                                            ) : field.field_type === 'dropdown' ? (
                                                <select
                                                    id={`field-${field.id}`}
                                                    className={`flex h-9 w-full rounded-md border border-slate-800 bg-slate-950/50 px-3 py-1 text-sm text-slate-300 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 [&>option]:bg-slate-900 [&>option]:text-slate-300 ${validationErrors[field.id] ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                                                    value={customResponses[field.id] || ''}
                                                    onChange={(e) => { setCustomResponses({ ...customResponses, [field.id]: e.target.value }); setValidationErrors(prev => { const n = { ...prev }; delete n[field.id]; return n; }); }}
                                                    required={field.required}
                                                >
                                                    <option value="">Select an option</option>
                                                    {field.options && field.options.map((opt, i) => (
                                                        <option key={i} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            ) : field.field_type === 'checkbox' ? (
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`field-${field.id}`}
                                                        checked={customResponses[field.id] === 'true'}
                                                        onCheckedChange={(checked) => { setCustomResponses({ ...customResponses, [field.id]: checked ? 'true' : 'false' }); setValidationErrors(prev => { const n = { ...prev }; delete n[field.id]; return n; }); }}
                                                    />
                                                    <label
                                                        htmlFor={`field-${field.id}`}
                                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                    >
                                                        {field.options && field.options[0] ? field.options[0] : 'Yes'}
                                                    </label>
                                                </div>
                                            ) : (
                                                <Input
                                                    id={`field-${field.id}`}
                                                    type="text"
                                                    value={customResponses[field.id] || ''}
                                                    onChange={(e) => { setCustomResponses({ ...customResponses, [field.id]: e.target.value }); setValidationErrors(prev => { const n = { ...prev }; delete n[field.id]; return n; }); }}
                                                    className={validationErrors[field.id] ? 'border-red-500 ring-1 ring-red-500' : ''}
                                                />
                                            )}
                                            {validationErrors[field.id] && (
                                                <p className="text-xs text-red-400 mt-1">{validationErrors[field.id]}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedEvent(null)}>
                            Cancel
                        </Button>
                        <Button
                            variant={selectedEvent?.risk_level === 'HIGH' ? 'destructive' : selectedEvent?.risk_level === 'MEDIUM' ? 'default' : 'green'}
                            onClick={() => handleConsent(selectedEvent?.id)}
                            disabled={consenting || Object.keys(validationErrors).length > 0}
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
