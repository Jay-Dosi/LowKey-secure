import { useState, useEffect } from 'react'
import api from '../api'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Award, Shield, AlertTriangle, CheckCircle, XCircle, Loader2, Database, Users, FileKey, GraduationCap, Building2, Mail, Phone, User, ShieldAlert, Trash2, Edit } from 'lucide-react'
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

    const students = users.filter(u => u.role === 'student')
    const clubs = users.filter(u => u.role === 'club')

    useEffect(() => {
        if (activeTab === 'approvals') {
            fetchEvents()
        } else if (activeTab === 'students' || activeTab === 'clubs') {
            fetchUsers()
        }
    }, [activeTab])

    async function fetchUsers() {
        setLoading(true)
        try {
            const res = await api.get('/admin/users')
            setUsers(res.data)
        } catch (err) {
            console.error('Failed to fetch users:', err)
        } finally {
            setLoading(false)
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
        setLoading(true)
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

    // User Management
    const [editingUser, setEditingUser] = useState(null)
    const [editForm, setEditForm] = useState({})

    function startEdit(user) {
        setEditingUser(user)
        setEditForm({ ...user })
    }

    async function handleUpdateUser() {
        try {
            const res = await api.put(`/admin/users/${editingUser.id}`, editForm)
            setUsers(users.map(u => u.id === res.data.id ? res.data : u))
            setEditingUser(null)
        } catch (err) {
            alert('Failed to update user: ' + (err.response?.data?.detail || err.message))
        }
    }

    async function handleDeleteUser(userId) {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return
        try {
            await api.delete(`/admin/users/${userId}`)
            setUsers(users.filter(u => u.id !== userId))
        } catch (err) {
            alert('Failed to delete user: ' + (err.response?.data?.detail || err.message))
        }
    }

    return (
        <article className="space-y-8">
            <header className="flex items-center gap-4">
                <figure className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
                    <Shield className="h-6 w-6 text-blue-400" aria-hidden="true" />
                </figure>
                <hgroup>
                    <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                    <p className="text-slate-400">Manage approvals for students and clubs</p>
                </hgroup>
            </header>

            {/* Tabs */}
            <nav className="flex gap-2 border-b border-slate-800 pb-2">
                <Button
                    variant={activeTab === 'approvals' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab('approvals')}
                    className="gap-2"
                >
                    <Shield className="h-4 w-4" />
                    Approvals
                    {events.length > 0 && (
                        <Badge variant="destructive" className="ml-1">{events.length}</Badge>
                    )}
                </Button>
                <Button
                    variant={activeTab === 'students' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab('students')}
                    className="gap-2"
                >
                    <GraduationCap className="h-4 w-4" />
                    Students
                    {students.length > 0 && (
                        <Badge variant="secondary" className="ml-1">{students.length}</Badge>
                    )}
                </Button>
                <Button
                    variant={activeTab === 'clubs' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab('clubs')}
                    className="gap-2"
                >
                    <Users className="h-4 w-4" />
                    Clubs
                    {clubs.length > 0 && (
                        <Badge variant="secondary" className="ml-1">{clubs.length}</Badge>
                    )}
                </Button>
            </nav>

            {/* Approvals Tab */}
            {activeTab === 'approvals' && (
                <>
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
                </>
            )}

            {/* Students Tab */}
            {activeTab === 'students' && (
                <>
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                        </div>
                    ) : students.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center text-slate-400">
                                <GraduationCap className="mx-auto h-12 w-12 mb-4 text-slate-600" />
                                <p>No students registered yet</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {students.map(student => (
                                <Card key={student.id} className="hover:border-green-500/50 transition-colors">
                                    <CardContent className="pt-6">
                                        <div className="flex items-start gap-4">
                                            <div className="size-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center flex-shrink-0">
                                                <span className="text-lg font-bold text-white">
                                                    {(student.name || student.username || '?').charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="font-semibold text-white truncate">
                                                            {student.name || student.username}
                                                        </h3>
                                                        <p className="text-sm text-slate-400">@{student.username}</p>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-400" onClick={() => startEdit(student)}>
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400" onClick={() => handleDeleteUser(student.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="mt-3 space-y-1.5">
                                                    {student.email && (
                                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                                            <Mail className="h-3 w-3" />
                                                            <span className="truncate">{student.email}</span>
                                                        </div>
                                                    )}
                                                    {student.phone && (
                                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                                            <Phone className="h-3 w-3" />
                                                            <span>{student.phone}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex gap-2 mt-2">
                                                        {student.year && (
                                                            <Badge variant="outline" className="text-xs">
                                                                Year {student.year}
                                                            </Badge>
                                                        )}
                                                        {student.branch && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                {student.branch}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Clubs Tab */}
            {activeTab === 'clubs' && (
                <>
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                        </div>
                    ) : clubs.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center text-slate-400">
                                <Users className="mx-auto h-12 w-12 mb-4 text-slate-600" />
                                <p>No club leads registered yet</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {clubs.map(club => (
                                <Card key={club.id} className="hover:border-purple-500/50 transition-colors">
                                    <CardContent className="pt-6">
                                        <div className="flex items-start gap-4">
                                            <div className="size-12 rounded-full bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center flex-shrink-0">
                                                <span className="text-lg font-bold text-white">
                                                    {(club.name || club.username || '?').charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="font-semibold text-white truncate">
                                                            {club.name || club.username}
                                                        </h3>
                                                        <p className="text-sm text-slate-400">@{club.username}</p>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-400" onClick={() => startEdit(club)}>
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400" onClick={() => handleDeleteUser(club.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <Badge variant="secondary" className="mt-1 text-xs">Club Lead</Badge>
                                                <div className="mt-3 space-y-1.5">
                                                    {club.email && (
                                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                                            <Mail className="h-3 w-3" />
                                                            <span className="truncate">{club.email}</span>
                                                        </div>
                                                    )}
                                                    {club.phone && (
                                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                                            <Phone className="h-3 w-3" />
                                                            <span>{club.phone}</span>
                                                        </div>
                                                    )}
                                                    {club.branch && (
                                                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
                                                            <Building2 className="h-3 w-3" />
                                                            <span>{club.branch}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </>
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
            {/* Edit User Dialog */}
            <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDescription>Modify user details. ID: {editingUser?.id}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Name</label>
                            <input className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
                                value={editForm.name || ''}
                                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <input className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
                                value={editForm.email || ''}
                                onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Phone</label>
                            <input className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
                                value={editForm.phone || ''}
                                onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Year</label>
                            <input className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
                                value={editForm.year || ''}
                                onChange={e => setEditForm({ ...editForm, year: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Branch</label>
                            <input className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
                                value={editForm.branch || ''}
                                onChange={e => setEditForm({ ...editForm, branch: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
                        <Button onClick={handleUpdateUser}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </article>
    )
}
