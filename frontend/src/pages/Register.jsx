import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '@/api'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UserPlus, ArrowRight, Loader2 } from 'lucide-react'

export default function Register() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [role, setRole] = useState('student')
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [year, setYear] = useState('')
    const [branch, setBranch] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const navigate = useNavigate()
    const { login, isAuthenticated, user } = useAuth()

    // Redirect if already logged in
    useEffect(() => {
        if (isAuthenticated && user) {
            const path = user.role === 'admin' ? '/admin' : user.role === 'club' ? '/club' : '/student'
            navigate(path, { replace: true })
        }
    }, [isAuthenticated, user, navigate])

    async function handleSubmit(e) {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const payload = { username, password, role }

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
                payload.phone = '+91' + phone

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
            // Auto-login after registration
            login(res.data.access_token, res.data.role, res.data.user_id)
            const path = res.data.role === 'admin' ? '/admin' : res.data.role === 'club' ? '/club' : '/student'
            navigate(path, { replace: true })
        } catch (err) {
            setError(err.response?.data?.detail || 'Registration failed')
        } finally {
            setLoading(false)
        }
    }

    return (
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

                        <fieldset className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Choose a unique ID"
                                required
                                autoComplete="username"
                            />
                        </fieldset>

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
    )
}
