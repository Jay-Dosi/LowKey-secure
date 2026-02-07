import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '@/api'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UserPlus, ArrowRight, Loader2, RefreshCw, CheckCircle } from 'lucide-react'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

export default function Register() {
    // const [username, setUsername] = useState('') // Removed manual username
    const [username, setUsername] = useState('')
    const [usernameMode, setUsernameMode] = useState('auto') // 'auto' | 'custom'
    const [isGenerating, setIsGenerating] = useState(false)
    const [password, setPassword] = useState('')
    const [role, setRole] = useState('student')
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [year, setYear] = useState('')
    const [branch, setBranch] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [successData, setSuccessData] = useState(null) // { username, role, access_token, user_id }
    const navigate = useNavigate()
    const { login, isAuthenticated, user } = useAuth()

    // Redirect if already logged in
    useEffect(() => {
        if (isAuthenticated && user) {
            const path = user.role === 'admin' ? '/admin' : user.role === 'club' ? '/club' : '/student'
            navigate(path, { replace: true })
        }
    }, [isAuthenticated, user, navigate])

    // Auto-generate username when switching to auto mode or role changes (recalling generator)
    const generateUsername = async () => {
        if (role === 'admin') return // Admin does not auto-generate
        setIsGenerating(true)
        try {
            const res = await api.get(`/auth/generate-username?role=${role}`)
            setUsername(res.data.username)
        } catch (err) {
            console.error("Failed to generate username", err)
        } finally {
            setIsGenerating(false)
        }
    }

    useEffect(() => {
        if (role !== 'admin' && usernameMode === 'auto') {
            generateUsername()
        } else if (role === 'admin') {
            setUsername('') // Clear for admin to manual type
            setUsernameMode('custom')
        }
    }, [role, usernameMode])

    async function handleSubmit(e) {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const payload = { password, role }

            // Add username if explicitly set (Admin or Custom)
            if (role === 'admin' || usernameMode === 'custom') {
                if (!username) {
                    setError('Username is required')
                    setLoading(false)
                    return
                }
                payload.username = username
            } else {
                // Auto mode: Send the generated username
                payload.username = username
            }

            // Add PII fields for students and club leads
            if (role === 'student' || role === 'club') {
                if (!name || !email || !phone) {
                    setError('Name, email, and phone are required')
                    setLoading(false)
                    return
                }
                if (phone.length !== 10 || !/^\d{10}$/.test(phone)) {
                    setError('Please enter a valid 10-digit phone number')
                    setLoading(false)
                    return
                }
                payload.name = name
                payload.email = email
                payload.phone = phone // Backend handles +91 or we send raw? Backend validator expects 10 digits.
                // Wait, backend regex strict 10 digits. The existing frontend code added +91.
                // I need to send JUST the 10 digits if backend `validate_phone` expects just 10.
                // Backend: r"^[6-9]\d{9}$"
                // So I should send just `phone`.
                // Existing code: payload.phone = '+91' + phone
                // I will change it to just `phone`.

                if (role === 'student') {
                    if (!year || !branch) {
                        setError('Year and branch are required for students')
                        setLoading(false)
                        return
                    }
                    payload.year = year
                    payload.branch = branch
                }

                if (role === 'club') {
                    if (!branch) {
                        setError('Club/Organization name is required')
                        setLoading(false)
                        return
                    }
                    payload.branch = branch
                }
            }

            const res = await api.post('/auth/register', payload)
            // Don't auto-login immediately. Show modal first.
            setSuccessData(res.data)

        } catch (err) {
            setError(err.response?.data?.detail || 'Registration failed')
        } finally {
            setLoading(false)
        }
    }

    const handleContinue = () => {
        if (successData) {
            login(successData.access_token, successData.role, successData.user_id)
            const path = successData.role === 'admin' ? '/admin' : successData.role === 'club' ? '/club' : '/student'
            navigate(path, { replace: true })
        }
    }

    return (
        <>
            <section className="flex min-h-[80vh] items-center justify-center px-4 py-8" aria-labelledby="register-heading">
                <Card className="w-full max-w-md">
                    <CardHeader className="space-y-4 text-center">
                        <figure className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                            <UserPlus className="h-8 w-8 text-green-400" aria-hidden="true" />
                        </figure>
                        <CardTitle id="register-heading" className="text-2xl">Create Identity</CardTitle>
                        <CardDescription>Initialize your secure digital identity</CardDescription>
                    </CardHeader>

                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            {error && (
                                <p className="rounded-lg bg-red-500/10 p-3 text-center text-sm text-red-400" role="alert">
                                    {error}
                                </p>
                            )}

                            <fieldset className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <Select value={role} onValueChange={setRole}>
                                    <SelectTrigger id="role">
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="student">Student (Participant)</SelectItem>
                                        <SelectItem value="club">Club Lead (Event Creator)</SelectItem>
                                        <SelectItem value="admin">University Admin (Manager)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </fieldset>

                            {/* Username Logic */}
                            {role === 'admin' ? (
                                <fieldset className="space-y-2">
                                    <Label htmlFor="username">Username (Manual Input)</Label>
                                    <Input
                                        id="username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="admin_user"
                                        required
                                        autoComplete="off"
                                    />
                                </fieldset>
                            ) : (
                                <div className="space-y-3 pt-2">
                                    <Label>Username Selection</Label>
                                    <div className="flex bg-slate-800/50 p-1 rounded-lg">
                                        <button
                                            type="button"
                                            onClick={() => setUsernameMode('auto')}
                                            className={`flex-1 text-sm py-1.5 px-3 rounded-md transition-all ${usernameMode === 'auto' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                                        >
                                            Auto-Generate
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setUsernameMode('custom')
                                                setUsername('')
                                            }}
                                            className={`flex-1 text-sm py-1.5 px-3 rounded-md transition-all ${usernameMode === 'custom' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                                        >
                                            Custom
                                        </button>
                                    </div>

                                    {usernameMode === 'auto' ? (
                                        <div className="flex items-center gap-2">
                                            <div className="relative flex-1">
                                                <Input
                                                    value={username}
                                                    readOnly
                                                    className="bg-slate-900/50 border-slate-700 font-mono text-green-400"
                                                />
                                                {isGenerating && (
                                                    <div className="absolute right-3 top-2.5">
                                                        <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                                                    </div>
                                                )}
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={generateUsername}
                                                disabled={isGenerating}
                                                title="Regenerate"
                                            >
                                                <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <Input
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                placeholder="Type your custom username..."
                                                minLength={3}
                                                maxLength={30}
                                                required
                                            />
                                            <p className="text-xs text-slate-500">
                                                3-30 chars, letters, numbers, hyphens only.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <fieldset className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    autoComplete="new-password"
                                />
                            </fieldset>

                            {(role === 'student' || role === 'club') && (
                                <>
                                    <fieldset className="space-y-2">
                                        <Label htmlFor="name">Full Name *</Label>
                                        <Input
                                            id="name"
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="John Doe"
                                            required
                                        />
                                    </fieldset>

                                    <fieldset className="space-y-2">
                                        <Label htmlFor="email">Email *</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="john@university.edu"
                                            required
                                        />
                                    </fieldset>

                                    <fieldset className="space-y-2">
                                        <Label htmlFor="phone">Phone *</Label>
                                        <div className="flex">
                                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-700 bg-slate-800 text-slate-300 text-sm">
                                                +91
                                            </span>
                                            <Input
                                                id="phone"
                                                type="tel"
                                                value={phone}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/\D/g, '').slice(0, 10)
                                                    setPhone(val)
                                                }}
                                                placeholder="1122334455"
                                                required
                                                maxLength={10}
                                                className="rounded-l-none"
                                            />
                                        </div>
                                    </fieldset>
                                </>
                            )}

                            {role === 'student' && (
                                <>
                                    <fieldset className="space-y-2">
                                        <Label htmlFor="year">Year *</Label>
                                        <Select value={year} onValueChange={setYear} required>
                                            <SelectTrigger id="year">
                                                <SelectValue placeholder="Select year" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1">First Year</SelectItem>
                                                <SelectItem value="2">Second Year</SelectItem>
                                                <SelectItem value="3">Third Year</SelectItem>
                                                <SelectItem value="4">Fourth Year</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </fieldset>

                                    <fieldset className="space-y-2">
                                        <Label htmlFor="branch">Branch/Major *</Label>
                                        <Input
                                            id="branch"
                                            type="text"
                                            value={branch}
                                            onChange={(e) => setBranch(e.target.value)}
                                            placeholder="Computer Science"
                                            required
                                        />
                                    </fieldset>
                                </>
                            )}

                            {role === 'club' && (
                                <fieldset className="space-y-2">
                                    <Label htmlFor="club-branch">Club/Organization *</Label>
                                    <Input
                                        id="club-branch"
                                        type="text"
                                        value={branch}
                                        onChange={(e) => setBranch(e.target.value)}
                                        placeholder="Club Name"
                                        required
                                    />
                                </fieldset>
                            )}
                        </CardContent>

                        <CardFooter className="flex-col gap-4">
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                                ) : (
                                    <>
                                        Create Identity
                                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                                    </>
                                )}
                            </Button>

                            <p className="text-sm text-slate-500">
                                Already have an account?{' '}
                                <Link to="/login" className="text-green-400 hover:underline">
                                    Login
                                </Link>
                            </p>
                        </CardFooter>
                    </form>
                </Card>
            </section>

            <Dialog open={!!successData} onOpenChange={() => { }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-center text-2xl text-green-400">Registration Successful!</DialogTitle>
                        <DialogDescription className="text-center text-slate-300">
                            Your secure identity has been created.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col items-center justify-center p-6 space-y-4 bg-slate-900/50 rounded-lg border border-slate-700">
                        <p className="text-sm text-slate-400">Your generated username is:</p>
                        <div className="text-3xl font-mono font-bold text-white tracking-wider">
                            {successData?.username}
                        </div>
                        <p className="text-xs text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full">
                            ⚠️ Save this username! You'll need it to login.
                        </p>
                    </div>
                    <DialogFooter className="sm:justify-center">
                        <Button type="button" size="lg" className="w-full bg-green-500 hover:bg-green-600 text-white" onClick={handleContinue}>
                            Continue to Dashboard
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
