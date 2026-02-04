import { useState } from 'react'
import api from '../api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Award, UserCheck, Loader2, CheckCircle } from 'lucide-react'

export default function AdminDashboard() {
    const [studentUsername, setStudentUsername] = useState('')
    const [name, setName] = useState('')
    const [major, setMajor] = useState('')
    const [year, setYear] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    async function handleSubmit(e) {
        e.preventDefault()
        setLoading(true)

        const attributes = {
            name,
            major,
            year,
            student_id: studentUsername,
            role: 'student',
            university: 'Tech University'
        }

        try {
            await api.post('/admin/issue-credential', { student_username: studentUsername, attributes })
            setSuccess(true)
            setStudentUsername('')
            setName('')
            setMajor('')
            setYear('')
            setTimeout(() => setSuccess(false), 3000)
        } catch (err) {
            alert('Failed to issue credential: ' + (err.response?.data?.detail || err.message))
        } finally {
            setLoading(false)
        }
    }

    return (
        <article className="space-y-8">
            <header className="flex items-center gap-4">
                <figure className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
                    <Award className="h-6 w-6 text-blue-400" aria-hidden="true" />
                </figure>
                <hgroup>
                    <h1 className="text-2xl font-bold text-white">University Admin Console</h1>
                    <p className="text-slate-400">Issue verifiable credentials to students</p>
                </hgroup>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserCheck className="h-5 w-5 text-green-400" aria-hidden="true" />
                        Issue New Credential
                    </CardTitle>
                    <CardDescription>Create cryptographically signed student credentials</CardDescription>
                </CardHeader>

                <CardContent>
                    {success && (
                        <output className="mb-6 flex items-center gap-2 rounded-lg bg-green-500/10 p-4 text-green-400">
                            <CheckCircle className="h-5 w-5" aria-hidden="true" />
                            Credential issued successfully!
                        </output>
                    )}

                    <form onSubmit={handleSubmit} className="grid gap-6 sm:grid-cols-2">
                        <fieldset className="space-y-2 sm:col-span-2">
                            <Label htmlFor="student-username">Student Username</Label>
                            <Input
                                id="student-username"
                                type="text"
                                value={studentUsername}
                                onChange={(e) => setStudentUsername(e.target.value)}
                                placeholder="e.g. john_doe"
                                required
                                className="focus:ring-blue-500"
                            />
                        </fieldset>

                        <fieldset className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="John Doe"
                                required
                                className="focus:ring-blue-500"
                            />
                        </fieldset>

                        <fieldset className="space-y-2">
                            <Label htmlFor="major">Major</Label>
                            <Input
                                id="major"
                                type="text"
                                value={major}
                                onChange={(e) => setMajor(e.target.value)}
                                placeholder="Computer Science"
                                required
                                className="focus:ring-blue-500"
                            />
                        </fieldset>

                        <fieldset className="space-y-2 sm:col-span-2">
                            <Label htmlFor="year">Year</Label>
                            <Select value={year} onValueChange={setYear} required>
                                <SelectTrigger id="year" className="focus:ring-blue-500">
                                    <SelectValue placeholder="Select year" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Freshman">Freshman</SelectItem>
                                    <SelectItem value="Sophomore">Sophomore</SelectItem>
                                    <SelectItem value="Junior">Junior</SelectItem>
                                    <SelectItem value="Senior">Senior</SelectItem>
                                    <SelectItem value="Graduate">Graduate</SelectItem>
                                </SelectContent>
                            </Select>
                        </fieldset>

                        <footer className="pt-4 sm:col-span-2">
                            <Button type="submit" variant="blue" className="w-full" disabled={loading}>
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                                ) : (
                                    <>
                                        <Award className="h-4 w-4" aria-hidden="true" />
                                        Sign & Issue Credential
                                    </>
                                )}
                            </Button>
                        </footer>
                    </form>
                </CardContent>
            </Card>
        </article>
    )
}
