import { useState, useEffect, useCallback } from 'react'
import api from '../api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Calendar, Users, RefreshCw, Plus, Activity, Loader2, CheckCircle, Shield, AlertTriangle, Trash2, Edit } from 'lucide-react'
import { cn } from '@/lib/utils'


const ATTRIBUTES = [
    { id: 'major', label: 'Major', pii: false },
    { id: 'year', label: 'Year', pii: false },
    { id: 'email', label: 'Email', pii: true },
    { id: 'phone', label: 'Phone', pii: true },
    { id: 'name', label: 'Name', pii: true },
    { id: 'student_id', label: 'Student ID', pii: true },
]

const YEARS = ['1', '2', '3', '4']

export default function ClubDashboard() {
    const [events, setEvents] = useState([])
    const [eventName, setEventName] = useState('')
    const [eventDescription, setEventDescription] = useState('')
    const [selectedEvent, setSelectedEvent] = useState(null)
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(false)
    const [selectedAttrs, setSelectedAttrs] = useState([])
    const [selectedYears, setSelectedYears] = useState([])
    const [riskPreview, setRiskPreview] = useState(null)

    const fetchEvents = useCallback(async () => {
        try {
            const res = await api.get('/club/events')
            setEvents(res.data)
        } catch (err) {
            console.error(err)
        }
    }, [])

    const viewLogs = useCallback(async (eventId) => {
        try {
            const res = await api.get(`/club/events/${eventId}/logs`)
            setLogs(res.data)
            setSelectedEvent(eventId)
        } catch (err) {
            console.error(err)
        }
    }, [])

    useEffect(() => {
        fetchEvents()
    }, [fetchEvents])

    useEffect(() => {
        if (!selectedEvent) return
        const interval = setInterval(() => viewLogs(selectedEvent), 3000)
        return () => clearInterval(interval)
    }, [selectedEvent, viewLogs])

    useEffect(() => {
        // Analyze risk in real-time
        const highRiskAttrs = ['name', 'email', 'phone', 'student_id']
        const hasHighRisk = selectedAttrs.some(attr => highRiskAttrs.includes(attr))
        setRiskPreview(hasHighRisk ? 'HIGH' : 'LOW')
    }, [selectedAttrs])

    async function handleSubmit(e) {
        e.preventDefault()
        setLoading(true)

        try {
            await api.post('/club/events', {
                event_name: eventName,
                event_description: eventDescription,
                requested_attributes: selectedAttrs,
                allowed_years: selectedYears
            })
            setEventName('')
            setEventDescription('')
            setSelectedAttrs([])
            setSelectedYears([])
            fetchEvents()
        } catch (err) {
            alert('Error creating event: ' + (err.response?.data?.detail || err.message))
        } finally {
            setLoading(false)
        }
    }


    async function handleDelete(eventId) {
        if (!confirm('Are you sure you want to delete this event?')) return
        try {
            await api.delete(`/club/events/${eventId}`)
            fetchEvents()
            if (selectedEvent === eventId) setSelectedEvent(null)
        } catch (err) {
            alert('Error deleting event: ' + (err.response?.data?.detail || err.message))
        }
    }

    function toggleAttr(id) {
        setSelectedAttrs(prev =>
            prev.includes(id)
                ? prev.filter(a => a !== id)
                : [...prev, id]
        )
    }

    function toggleYear(year) {
        setSelectedYears(prev =>
            prev.includes(year)
                ? prev.filter(y => y !== year)
                : [...prev, year]
        )
    }

    return (
        <article className="space-y-8">
            <header className="flex items-center gap-4">
                <figure className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10">
                    <Calendar className="h-6 w-6 text-purple-400" aria-hidden="true" />
                </figure>
                <hgroup>
                    <h1 className="text-2xl font-bold text-white">Lead Command Center</h1>
                    <p className="text-slate-400">Create and manage events with privacy-first access</p>
                </hgroup>
            </header>

            <section className="grid gap-8 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Plus className="h-5 w-5 text-green-400" aria-hidden="true" />
                            Create Event
                        </CardTitle>
                        <CardDescription>Configure event access requirements</CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <fieldset className="space-y-2">
                                <Label htmlFor="event-name">Event Name</Label>
                                <Input
                                    id="event-name"
                                    type="text"
                                    value={eventName}
                                    onChange={(e) => setEventName(e.target.value)}
                                    placeholder="e.g. Hackathon Check-in"
                                    required
                                    className="focus:ring-purple-500"
                                />
                            </fieldset>

                            <fieldset className="space-y-2">
                                <Label htmlFor="event-description">Description</Label>
                                <Textarea
                                    id="event-description"
                                    value={eventDescription}
                                    onChange={(e) => setEventDescription(e.target.value)}
                                    placeholder="Describe your event..."
                                    rows={3}
                                    className="focus:ring-purple-500"
                                />
                            </fieldset>

                            <fieldset className="space-y-3">
                                <Label>Allowed Years</Label>
                                <div className="flex gap-2">
                                    {YEARS.map(year => (
                                        <label
                                            key={year}
                                            className={cn(
                                                "flex-1 cursor-pointer rounded-lg border p-3 text-center transition-colors",
                                                selectedYears.includes(year)
                                                    ? "border-purple-500 bg-purple-500/10"
                                                    : "border-slate-700 bg-slate-950/50 hover:bg-slate-800"
                                            )}
                                        >
                                            <Checkbox
                                                checked={selectedYears.includes(year)}
                                                onCheckedChange={() => toggleYear(year)}
                                                className="sr-only"
                                            />
                                            <span className="text-sm font-medium">Year {year}</span>
                                        </label>
                                    ))}
                                </div>
                            </fieldset>

                            <fieldset className="space-y-3">
                                <Label>Required Attributes</Label>
                                <ul className="grid grid-cols-2 gap-2">
                                    {ATTRIBUTES.map(attr => (
                                        <li key={attr.id}>
                                            <label
                                                className={cn(
                                                    "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
                                                    selectedAttrs.includes(attr.id)
                                                        ? "border-purple-500 bg-purple-500/10"
                                                        : "border-slate-700 bg-slate-950/50 hover:bg-slate-800"
                                                )}
                                            >
                                                <Checkbox
                                                    checked={selectedAttrs.includes(attr.id)}
                                                    onCheckedChange={() => toggleAttr(attr.id)}
                                                    className="data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                                                />
                                                <span className="text-sm capitalize text-slate-300">{attr.label}</span>
                                                {attr.pii && <Badge variant="danger" className="ml-auto text-xs">PII</Badge>}
                                            </label>
                                        </li>
                                    ))}
                                </ul>
                            </fieldset>

                            {riskPreview && (
                                <div className={cn(
                                    "rounded-lg p-3 flex items-center gap-2",
                                    riskPreview === 'HIGH' ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"
                                )}>
                                    {riskPreview === 'HIGH' ? (
                                        <>
                                            <AlertTriangle className="h-4 w-4" />
                                            <span className="text-sm font-medium">HIGH RISK - Requires Admin Approval</span>
                                        </>
                                    ) : (
                                        <>
                                            <Shield className="h-4 w-4" />
                                            <span className="text-sm font-medium">LOW RISK - Privacy Safe</span>
                                        </>
                                    )}
                                </div>
                            )}

                            <Button
                                type="submit"
                                variant="purple"
                                className="w-full"
                                disabled={loading || selectedAttrs.length === 0}
                            >
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                                ) : (
                                    'Submit for Approval'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card className="max-h-[600px] overflow-y-auto">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-green-400" aria-hidden="true" />
                            My Events
                        </CardTitle>
                    </CardHeader>

                    <CardContent>
                        <ul className="space-y-3">
                            {events.length === 0 ? (
                                <li className="py-8 text-center text-slate-500">No events yet</li>
                            ) : (
                                events.map(event => (
                                    <li key={event.id}>
                                        <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
                                            <header className="flex items-start justify-between gap-2">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-white">{event.event_name}</h3>
                                                    <div className="flex gap-2 mt-2">
                                                        <Badge variant={event.status === 'APPROVED' ? 'success' : event.status === 'REJECTED' ? 'danger' : 'secondary'}>
                                                            {event.status}
                                                        </Badge>
                                                        <Badge variant={event.risk_level === 'HIGH' ? 'danger' : 'success'}>
                                                            {event.risk_level}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1">
                                                    {event.status === 'APPROVED' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => viewLogs(event.id)}
                                                        >
                                                            <Users className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(event.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-400" />
                                                    </Button>
                                                </div>
                                            </header>
                                            <p className="mt-2 text-xs text-slate-500">
                                                {event.requested_attributes.join(', ')} • Years: {event.allowed_years?.join(', ') || 'All'}
                                            </p>
                                        </div>
                                    </li>
                                ))
                            )}
                        </ul>
                    </CardContent>
                </Card>
            </section>

            {selectedEvent && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-green-400" aria-hidden="true" />
                            Live Attendance Feed
                        </CardTitle>
                        <Button variant="ghost" size="icon" onClick={() => viewLogs(selectedEvent)}>
                            <RefreshCw className="h-4 w-4" aria-hidden="true" />
                            <span className="sr-only">Refresh</span>
                        </Button>
                    </CardHeader>

                    <CardContent>
                        <figure className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-slate-800 text-slate-500">
                                        <th className="px-4 pb-3 font-medium">Status</th>
                                        <th className="px-4 pb-3 font-medium">Identity</th>
                                        <th className="px-4 pb-3 font-medium">Timestamp</th>
                                        <th className="px-4 pb-3 font-medium">Token</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="py-8 text-center text-slate-500">
                                                No attendees yet
                                            </td>
                                        </tr>
                                    ) : (
                                        logs.map(log => (
                                            <tr key={log.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                                                <td className="px-4 py-3">
                                                    <span className="flex items-center gap-2 font-medium text-green-400">
                                                        <CheckCircle className="h-4 w-4" aria-hidden="true" />
                                                        Verified
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-slate-300">Anonymous Student</td>
                                                <td className="px-4 py-3 font-mono text-slate-400">
                                                    {new Date(log.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                                                </td>
                                                <td className="px-4 py-3 font-mono text-xs text-slate-600">
                                                    {log.anonymized_token || 'N/A'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </figure>
                    </CardContent>
                </Card>
            )}
        </article>
    )
}
