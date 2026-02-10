import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import AdminDashboard from './pages/AdminDashboard'
import ClubDashboard from './pages/ClubDashboard'
import StudentDashboard from './pages/StudentDashboard'
import RequestDetails from './pages/RequestDetails'
import ProfileDialog from '@/components/ProfileDialog'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { LogOut, Loader2 } from 'lucide-react'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

function PrivateRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Check role if allowedRoles is specified
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redirect to appropriate dashboard based on role
    const redirectPath = user?.role === 'admin' ? '/admin' : user?.role === 'club' ? '/club' : '/student'
    return <Navigate to={redirectPath} replace />
  }

  return children
}

function AppContent() {
  const { isAuthenticated, user, logout } = useAuth()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const handleLogout = () => {
    setShowLogoutConfirm(false)
    logout()
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm">
        <nav className="container mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <img src="/log.png" alt="LowKey Secure" className="h-10 w-12" />
            <span className="text-lg font-bold tracking-tight">
              LOWKEY<span className="text-green-400">SECURE</span>
            </span>
          </Link>

          {isAuthenticated && (
            <div className="flex items-center gap-2">
              <ProfileDialog />
              <Button type="button" variant="ghost" size="sm" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowLogoutConfirm(true); }}>
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          )}
        </nav>
      </header>

      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
            <DialogDescription>
              Are you sure you want to end your secure session?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogoutConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleLogout}>Logout</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <main className="container mx-auto max-w-5xl px-4 py-8">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin" element={<PrivateRoute allowedRoles={['admin']}><AdminDashboard /></PrivateRoute>} />
          <Route path="/club" element={<PrivateRoute allowedRoles={['club']}><ClubDashboard /></PrivateRoute>} />
          <Route path="/student" element={<PrivateRoute allowedRoles={['student']}><StudentDashboard /></PrivateRoute>} />
          <Route path="/student/request/:id" element={<PrivateRoute allowedRoles={['student']}><RequestDetails /></PrivateRoute>} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  )
}

export default App
