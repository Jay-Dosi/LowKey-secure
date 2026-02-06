import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '@/api'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Lock, ArrowRight, Loader2, UserX } from 'lucide-react'

export default function Login() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [userNotFound, setUserNotFound] = useState(false)
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
            const res = await api.post('/auth/login', { username, password })
            login(res.data.access_token, res.data.role, res.data.user_id)

            const path = res.data.role === 'admin' ? '/admin' : res.data.role === 'club' ? '/club' : '/student'
            navigate(path, { replace: true })
        } catch (err) {
            const status = err.response?.status
            const detail = err.response?.data?.detail || 'Authentication failed'
            setUserNotFound(status === 404)
            setError(detail)
        } finally {
            setLoading(false)
        }
    }

    return (
        <section className="flex min-h-[80vh] items-center justify-center px-4" aria-labelledby="login-heading">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-4 text-center">
                    <figure className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                        <Lock className="h-8 w-8 text-green-400" aria-hidden="true" />
                    </figure>
                    <CardTitle id="login-heading" className="text-2xl">Access Identity</CardTitle>
                    <CardDescription>Enter your credentials to continue</CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="rounded-lg bg-red-500/10 p-3 text-center text-sm text-red-400" role="alert">
                                {userNotFound ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <UserX className="h-5 w-5" />
                                        <p>{error}</p>
                                        {/* <Link to="/register" className="text-green-400 hover:underline font-medium">
                                            Click here to Register →
                                        </Link> */}
                                    </div>
                                ) : (
                                    <p>{error}</p>
                                )}
                            </div>
                        )}

                        <fieldset className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter your ID"
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
                                autoComplete="current-password"
                            />
                        </fieldset>
                    </CardContent>

                    <CardFooter className="flex-col gap-4">
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                            ) : (
                                <>
                                    Authenticate
                                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                                </>
                            )}
                        </Button>

                        <p className="text-sm text-slate-500">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-green-400 hover:underline">
                                Register
                            </Link>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </section>
    )
}
