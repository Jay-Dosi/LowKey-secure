import { useState, useEffect } from 'react'
import api from '../api'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Award, Shield, AlertTriangle, CheckCircle, XCircle, Loader2, Database, Users, FileKey } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('approvals')
    const [events, setEvents] = useState([])
    const [users, setUsers] = useState([])
    const [credentials, setCredentials] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedEvent, setSelectedEvent] = useState(null)
    const [reviewComment, setReviewComment] = useState('')
    const [reviewing, setReviewing] = useState(false)

    useEffect(() => {
        fetchEvents()
        if (activeTab === 'database') {
            fetchUsers()
            fetchCredentials()
        }
    }, [activeTab])

    async function fetchUsers() {
        try {
            const res = await api.get('/admin/users')
            setUsers(res.data)
        } catch (err) {
            console.error('Failed to fetch users:', err)
        }
    }

    async function fetchCredentials() {
        try {
            const res = await api.get('/admin/credentials')
            setCredentials(res.data)
        } catch (err) {
            console.error('Failed to fetch credentials:', err)
        }
    }

    async function fetchEvents() {
        try {
            const res = await api.get('/admin/events?status=PENDING')
            setEvents(res.data)
        } catch (err) {
            console.error('Failed to fetch events:', err)
        } finally {
            setLoading(false)
        }
    }

    async function handleReview(eventId, action) {
        if (action === 'REJECT' && !reviewComment.trim()) {
            alert('Comment is required for rejection')
            return
        }

        const event = events.find(e => e.id === eventId)
        if (action === 'APPROVE' && event?.risk_level === 'HIGH' && !reviewComment.trim()) {
            alert('Comment is required for overriding HIGH risk events')
            return
        }

        setReviewing(true)
        try {
            await api.post(`/admin/events/${eventId}/review`, {
                action,
                comment: reviewComment || null
            })
            setSelectedEvent(null)
            setReviewComment('')
            fetchEvents()
        } catch (err) {
            alert('Failed to review event: ' + (err.response?.data?.detail || err.message))
        } finally {
            setReviewing(false)
        }
    }

    return (
        <article className="space-y-8">
            <header className="flex items-center gap-4">
                <figure className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
                    <Shield className="h-6 w-6 text-blue-400" aria-hidden="true" />
                </figure>
                <hgroup>
                    <h1 className="text-2xl font-bold text-white">Admin Approval Queue</h1>
                    <p className="text-slate-400">Review and approve event access requests</p>
                </hgroup>
            </header>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                </div>
            ) : events.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-slate-400">
                        <CheckCircle className="mx-auto h-12 w-12 mb-4 text-green-400" />
                        <p>No pending events to review</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {events.map(event => (
                        <Card key={event.id} className="hover:border-blue-500/50 transition-colors">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="flex items-center gap-2">
                                            {event.event_name}
                                            {event.risk_level === 'HIGH' ? (
                                                <Badge variant="destructive" className="flex items-center gap-1">
                                                    <AlertTriangle className="h-3 w-3" />
                                                    HIGH RISK
                                                </Badge>
                                            ) : (
                                                <Badge variant="success" className="flex items-center gap-1">
                                                    <Shield className="h-3 w-3" />
                                                    LOW RISK
                                                </Badge>
                                            )}
                                        </CardTitle>
                                        <CardDescription className="mt-2">
                                            {event.risk_message}
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-slate-400">Requested Attributes:</p>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {event.requested_attributes.map((attr, i) => (
                                                <Badge key={i} variant="outline">{attr}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-400">Allowed Years:</p>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {event.allowed_years?.length > 0 ? (
                                                event.allowed_years.map((year, i) => (
                                                    <Badge key={i} variant="secondary">{year}</Badge>
                                                ))
                                            ) : (
                                                <span className="text-sm text-slate-500">All years</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        <Button
                                            variant="green"
                                            size="sm"
                                            onClick={() => setSelectedEvent({ ...event, action: 'APPROVE' })}
                                        >
                                            <CheckCircle className="h-4 w-4" />
                                            Approve
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => setSelectedEvent({ ...event, action: 'REJECT' })}
                                        >
                                            <XCircle className="h-4 w-4" />
                                            Reject
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {selectedEvent?.action === 'APPROVE' ? 'Approve' : 'Reject'} Event
                        </DialogTitle>
                        <DialogDescription>
                            {selectedEvent?.event_name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        {selectedEvent?.risk_level === 'HIGH' && selectedEvent?.action === 'APPROVE' && (
                            <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400 flex items-start gap-2">
                                <AlertTriangle className="h-4 w-4 mt-0.5" />
                                <span>This is a HIGH RISK event. A justification comment is required.</span>
                            </div>
                        )}
                        <div>
                            <label className="text-sm font-medium">
                                Comment {(selectedEvent?.action === 'REJECT' || (selectedEvent?.action === 'APPROVE' && selectedEvent?.risk_level === 'HIGH')) && <span className="text-red-400">*</span>}
                            </label>
                            <Textarea
                                value={reviewComment}
                                onChange={(e) => setReviewComment(e.target.value)}
                                placeholder="Enter your review comment..."
                                className="mt-2"
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedEvent(null)}>
                            Cancel
                        </Button>
                        <Button
                            variant={selectedEvent?.action === 'APPROVE' ? 'green' : 'destructive'}
                            onClick={() => handleReview(selectedEvent?.id, selectedEvent?.action)}
                            disabled={reviewing}
                        >
                            {reviewing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    {selectedEvent?.action === 'APPROVE' ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                    {selectedEvent?.action === 'APPROVE' ? 'Approve' : 'Reject'}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </article>
    )
}
