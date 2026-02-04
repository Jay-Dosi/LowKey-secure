import { useState, useEffect, useCallback } from 'react'
import api from '../api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Calendar, Users, RefreshCw, Plus, Activity, Loader2, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const ATTRIBUTES = [
    { id: 'major', label: 'Major', pii: false },
    { id: 'year', label: 'Year', pii: false },
    { id: 'email', label: 'Email', pii: true },
    { id: 'phone', label: 'Phone', pii: true },
    { id: 'dorm', label: 'Dorm', pii: false },
]

export default function ClubDashboard() {
    const [requests, setRequests] = useState([])
    const [eventName, setEventName] = useState('')
    const [selectedRequest, setSelectedRequest] = useState(null)
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(false)
    const [selectedAttrs, setSelectedAttrs] = useState([])

    const fetchRequests = useCallback(async () => {
        try {
            const res = await api.get('/club/requests')
            setRequests(res.data)
        } catch (err) {
            console.error(err)
        }
    }, [])

    const viewLogs = useCallback(async (reqId) => {
        try {
            const res = await api.get(`/club/requests/${reqId}/logs`)
            setLogs(res.data)
            setSelectedRequest(reqId)
        } catch (err) {
            console.error(err)
        }
    }, [])

    useEffect(() => {
        fetchRequests()
        const interval = setInterval(fetchRequests, 5000)
        return () => clearInterval(interval)
    }, [fetchRequests])

    useEffect(() => {
        if (!selectedRequest) return
        const interval = setInterval(() => viewLogs(selectedRequest), 3000)
        return () => clearInterval(interval)
    }, [selectedRequest, viewLogs])

    async function handleSubmit(e) {
        e.preventDefault()
        setLoading(true)

        try {
            await api.post('/club/requests', {
                event_name: eventName,
                requested_attributes: selectedAttrs
            })
            setEventName('')
            setSelectedAttrs([])
            fetchRequests()
        } catch (err) {
            alert('Error creating event')
        } finally {
            setLoading(false)
        }
    }

    function toggleAttr(id) {
        setSelectedAttrs(prev =>
            prev.includes(id)
                ? prev.filter(a => a !== id)
                : [...prev, id]
        )
    }

    return (
        <article className="space-y-8">
            <header className="flex items-center gap-4">
                <figure className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10">
                    <Calendar className="h-6 w-6 text-purple-400" aria-hidden="true" />
                </figure>
                <hgroup>
                    <h1 className="text-2xl font-bold text-white">Club Command Center</h1>
                    <p className="text-slate-400">Manage events and verify attendees anonymously</p>
                </hgroup>
            </header>

            <section className="grid gap-8 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Plus className="h-5 w-5 text-green-400" aria-hidden="true" />
                            Create Check-in Event
                        </CardTitle>
                        <CardDescription>Select attributes you need to verify</CardDescription>
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
                                                {attr.pii && <Badge variant="danger" className="ml-auto">PII</Badge>}
                                            </label>
                                        </li>
                                    ))}
                                </ul>
                            </fieldset>

                            <Button
                                type="submit"
                                variant="purple"
                                className="w-full"
                                disabled={loading || selectedAttrs.length === 0}
                            >
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                                ) : (
                                    'Create Event'
                                )}
                            </Button>
                            {selectedAttrs.length === 0 && (
                                <p className="text-xs text-muted-foreground text-center">
                                    Select at least one attribute to continue
                                </p>
                            )}
                        </form>
                    </CardContent>
                </Card>

                <Card className="max-h-[450px] overflow-y-auto">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-green-400" aria-hidden="true" />
                            Active Events
                        </CardTitle>
                    </CardHeader>

                    <CardContent>
                        <ul className="space-y-3">
                            {requests.length === 0 ? (
                                <li className="py-8 text-center text-slate-500">No events yet</li>
                            ) : (
                                requests.map(req => (
                                    <li key={req.id}>
                                        <button
                                            type="button"
                                            onClick={() => viewLogs(req.id)}
                                            className={cn(
                                                "w-full rounded-lg border p-4 text-left transition-colors",
                                                selectedRequest === req.id
                                                    ? "border-purple-500 bg-purple-900/20"
                                                    : "border-slate-800 bg-slate-950 hover:border-slate-600"
                                            )}
                                        >
                                            <header className="flex items-start justify-between gap-2">
                                                <h3 className="font-semibold text-white">{req.event_name}</h3>
                                                <Badge variant={req.risk_level === 'HIGH' ? 'danger' : 'success'}>
                                                    {req.risk_level}
                                                </Badge>
                                            </header>
                                            <p className="mt-2 text-xs text-slate-500">
                                                ID: {req.id} • {req.requested_attributes.join(', ')}
                                            </p>
                                        </button>
                                    </li>
                                ))
                            )}
                        </ul>
                    </CardContent>
                </Card>
            </section>

            {selectedRequest && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-green-400" aria-hidden="true" />
                            Live Attendance Feed
                        </CardTitle>
                        <Button variant="ghost" size="icon" onClick={() => viewLogs(selectedRequest)}>
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
                                        <th className="px-4 pb-3 font-medium">Reference</th>
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
                                                    {log.proof_signature?.substring(0, 12) || 'N/A'}...
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
