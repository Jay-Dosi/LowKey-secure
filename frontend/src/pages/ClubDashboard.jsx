import { useState, useEffect, useCallback } from 'react'
import api from '../api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'

import { Calendar, Users, RefreshCw, Plus, Activity, Loader2, CheckCircle, Shield, AlertTriangle, Trash2, Edit, X, Clock } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { cn } from '@/lib/utils'


const ATTRIBUTES = [
    { id: 'branch', label: 'Branch', pii: false },
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
    const [expiryDate, setExpiryDate] = useState('')
    const [riskPreview, setRiskPreview] = useState(null)
    const [customFields, setCustomFields] = useState([]) // Array of { label, field_type, required, options }

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
        // Fetch logs once when opened? Or poll? Prompt said "Avoid constant polling".
        // viewLogs fetches it once. The poll was for the live feed.
        // I will remove the poll.
        viewLogs(selectedEvent)
    }, [selectedEvent, viewLogs])

    useEffect(() => {
        // Analyze risk in real-time
        const mediumRiskAttrs = ['name', 'email', 'social', 'github', 'linkedin', 'workplace', 'dob']
        const highRiskAttrs = ['phone', 'student_id', 'photo', 'ssn', 'address', 'aadhaar', 'passport', 'bank']

        let hasHighRisk = selectedAttrs.some(attr => highRiskAttrs.includes(attr))
        let hasMediumRisk = selectedAttrs.some(attr => mediumRiskAttrs.includes(attr))

        // Analyze Custom Fields
        customFields.forEach(field => {
            const labelLower = field.label.toLowerCase()
            if (highRiskAttrs.some(k => labelLower.includes(k))) hasHighRisk = true
            else if (mediumRiskAttrs.some(k => labelLower.includes(k))) hasMediumRisk = true
        })

        if (hasHighRisk) {
            setRiskPreview('HIGH')
        } else if (hasMediumRisk) {
            setRiskPreview('MEDIUM')
        } else {
            setRiskPreview('LOW')
        }
    }, [selectedAttrs, customFields])

    async function handleSubmit(e) {
        e.preventDefault()
        setLoading(true)

        try {
            const payload = {
                event_name: eventName,
                event_description: eventDescription,
                requested_attributes: selectedAttrs,
                allowed_years: selectedYears,
                expiry_date: expiryDate,
                custom_fields: customFields
            }
            await api.post('/club/events', payload)
            setEventName('')
            setEventDescription('')
            setSelectedAttrs([])
            setSelectedYears([])
            setExpiryDate('')
            setCustomFields([])
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

    function addCustomField() {
        setCustomFields([...customFields, { label: '', field_type: 'short_text', required: false, options: [] }])
    }

    function updateCustomField(index, key, value) {
        const updated = [...customFields]
        updated[index][key] = value
        setCustomFields(updated)
    }

    function removeCustomField(index) {
        setCustomFields(customFields.filter((_, i) => i !== index))
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

                            <fieldset className="space-y-2">
                                <Label htmlFor="expiry-date">Event Expiry Date <span className="text-red-400">*</span></Label>
                                <div className="relative">
                                    <Input
                                        id="expiry-date"
                                        type="datetime-local"
                                        value={expiryDate}
                                        onChange={(e) => setExpiryDate(e.target.value)}
                                        required
                                        min={(() => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`; })()}
                                        className="focus:ring-purple-500 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-10 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                                    />
                                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-purple-400 pointer-events-none" />
                                </div>
                                <p className="text-xs text-slate-500">Required — Event will be auto-deleted after this date</p>
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

                            <fieldset className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label>Custom Data Requests</Label>
                                    <Button type="button" variant="ghost" size="sm" onClick={addCustomField} className="h-6 text-xs text-purple-400">
                                        <Plus className="mr-1 h-3 w-3" /> Add Field
                                    </Button>
                                </div>
                                {customFields.length > 0 && (
                                    <div className="space-y-3">
                                        {customFields.map((field, index) => (
                                            <div key={index} className="rounded-lg border border-slate-800 bg-slate-950/50 p-3 relative group">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeCustomField(index)}
                                                    className="absolute top-2 right-2 h-6 w-6 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                                <div className="grid gap-3">
                                                    <div>
                                                        <Label htmlFor={`cf-label-${index}`} className="text-xs text-slate-400">Field Label</Label>
                                                        <Input
                                                            id={`cf-label-${index}`}
                                                            value={field.label}
                                                            onChange={(e) => updateCustomField(index, 'label', e.target.value)}
                                                            placeholder="e.g. T-Shirt Size"
                                                            className="h-8 text-sm"
                                                            required
                                                        />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <div className="flex-1">
                                                            <Label htmlFor={`cf-type-${index}`} className="text-xs text-slate-400">Type</Label>
                                                            <select
                                                                id={`cf-type-${index}`}
                                                                value={field.field_type}
                                                                onChange={(e) => updateCustomField(index, 'field_type', e.target.value)}
                                                                className="w-full h-8 rounded-md border border-slate-800 bg-slate-900 px-3 py-1 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-500 [&>option]:bg-slate-900 [&>option]:text-slate-300"
                                                            >
                                                                <option value="short_text">Short Text</option>
                                                                <option value="long_text">Long Text</option>
                                                                <option value="number">Number</option>
                                                                <option value="dropdown">Dropdown</option>
                                                                <option value="checkbox">Checkbox</option>
                                                                <option value="date">Date</option>
                                                                <option value="url">URL</option>
                                                            </select>
                                                        </div>
                                                        <div className="flex items-end pb-1">
                                                            <label className="flex items-center gap-2 cursor-pointer">
                                                                <Checkbox
                                                                    checked={field.required}
                                                                    onCheckedChange={(checked) => updateCustomField(index, 'required', checked)}
                                                                />
                                                                <span className="text-xs text-slate-300">Required</span>
                                                            </label>
                                                        </div>
                                                    </div>
                                                    {(field.field_type === 'dropdown' || field.field_type === 'checkbox') && (
                                                        <div>
                                                            <Label htmlFor={`cf-options-${index}`} className="text-xs text-slate-400">Options (comma separated)</Label>
                                                            <Input
                                                                id={`cf-options-${index}`}
                                                                value={Array.isArray(field.options) ? field.options.join(', ') : ''}
                                                                onChange={(e) => updateCustomField(index, 'options', e.target.value.split(',').map(s => s.trim()))}
                                                                placeholder="Option 1, Option 2"
                                                                className="h-8 text-sm"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </fieldset>

                            {riskPreview && (
                                <div className={cn(
                                    "rounded-lg p-3 flex items-center gap-2",
                                    riskPreview === 'HIGH' ? "bg-red-500/10 text-red-400" :
                                        riskPreview === 'MEDIUM' ? "bg-amber-500/10 text-amber-400" :
                                            "bg-green-500/10 text-green-400"
                                )}>
                                    {riskPreview === 'HIGH' ? (
                                        <>
                                            <AlertTriangle className="h-4 w-4" />
                                            <span className="text-sm font-medium">HIGH RISK - Exposes Sensitive Data</span>
                                        </>
                                    ) : riskPreview === 'MEDIUM' ? (
                                        <>
                                            <AlertTriangle className="h-4 w-4" />
                                            <span className="text-sm font-medium">MEDIUM RISK - Exposes Name/Email</span>
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
                                disabled={loading || selectedAttrs.length === 0 || !expiryDate}
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
                                                            {event.status === 'REJECTED' ? 'Rejected' : event.status}
                                                        </Badge>
                                                        {event.status !== 'REJECTED' && (
                                                            <Badge variant={event.risk_level === 'HIGH' ? 'danger' : event.risk_level === 'MEDIUM' ? 'warning' : 'success'}>
                                                                {event.risk_level}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    {event.status === 'REJECTED' && event.admin_comment && (
                                                        <p className="mt-2 text-sm text-gray-500">
                                                            <b>Reason:</b> {event.admin_comment}
                                                        </p>
                                                    )}
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
                                                Permissions Taken: {event.requested_attributes.join(', ')} <br /> Years: {event.allowed_years?.join(', ') || 'All'}
                                            </p>
                                            <div className="mt-2 flex items-center gap-1.5 text-xs">
                                                <Clock className="h-3.5 w-3.5 text-slate-400" />
                                                <span className={event.expiry_date && new Date(event.expiry_date) < new Date() ? 'text-red-400 font-medium' : 'text-slate-400'}>
                                                    {event.expiry_date
                                                        ? `${new Date(event.expiry_date) < new Date() ? 'Expired' : 'Expires'}: ${new Date(event.expiry_date).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                                                        : 'No expiry set'}
                                                </span>
                                            </div>
                                        </div>
                                    </li>
                                ))
                            )}
                        </ul>
                    </CardContent>
                </Card>
            </section>

            <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-green-400" />
                                Live Attendance Feed
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => viewLogs(selectedEvent)}>
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        </DialogTitle>
                        <DialogDescription>
                            Real-time access logs. PII revealed based on consent.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="rounded-md border border-slate-800">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-900">
                                <tr className="border-b border-slate-800 text-slate-500">
                                    <th className="px-4 py-3 font-medium">Status</th>
                                    <th className="px-4 py-3 font-medium">Identity</th>
                                    <th className="px-4 py-3 font-medium">Timestamp</th>
                                    <th className="px-4 py-3 font-medium">Token</th>
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
                                            <td className="px-4 py-3 text-slate-300">
                                                {log.user ? (
                                                    <div className="space-y-1">
                                                        {log.user.name && <div className="font-semibold text-white">{log.user.name}</div>}
                                                        {log.user.username && <div className="text-xs text-slate-400 font-mono">ID: {log.user.username}</div>}
                                                        {log.user.email && <div className="text-xs text-slate-400">{log.user.email}</div>}
                                                        {log.user.phone && <div className="text-xs text-slate-400">{log.user.phone}</div>}
                                                        {log.user.year && <Badge variant="outline" className="text-[10px] mr-1">Year {log.user.year}</Badge>}
                                                        {log.user.branch && <Badge variant="secondary" className="text-[10px]">{log.user.branch}</Badge>}
                                                    </div>
                                                ) : (
                                                    <span className="italic text-slate-500">Anonymous Student</span>
                                                )}
                                            </td>

                                            <td className="px-4 py-3 font-mono text-slate-400">
                                                {/* 24-hour format with real-time date */}
                                                {new Date(log.timestamp).toLocaleString('en-IN', {
                                                    timeZone: 'Asia/Kolkata',
                                                    day: '2-digit', month: 'short', year: 'numeric',
                                                    hour: '2-digit', minute: '2-digit', hour12: false
                                                })}
                                                {/* Custom Responses */}
                                                {log.custom_responses && log.custom_responses.length > 0 && (
                                                    <div className="mt-2 text-xs border-t border-slate-700 pt-1 space-y-1">
                                                        {log.custom_responses.map((resp, i) => (
                                                            <div key={i} className="flex gap-2">
                                                                <span className="text-slate-500">{resp.field_label}:</span>
                                                                <span className="text-slate-300">{resp.response_value}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs text-slate-600">

                                                {log.anonymized_token || 'N/A'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </DialogContent>
            </Dialog>
        </article >
    )
}
