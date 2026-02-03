import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import ClubDashboard from './pages/ClubDashboard';
import StudentDashboard from './pages/StudentDashboard';
import RequestDetails from './pages/RequestDetails';
import { ShieldCheck } from 'lucide-react';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" />;
  return children;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-green-500/30">
        <header className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => window.location.href = '/'}>
            <ShieldCheck className="w-8 h-8 text-green-400" />
            <span className="text-xl font-bold tracking-tighter text-white">LOWKEY<span className="text-green-400">SECURE</span></span>
          </div>
          {localStorage.getItem('token') && (
            <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }} className="text-sm text-slate-400 hover:text-white transition-colors">Logout</button>
          )}
        </header>

        <main className="container mx-auto p-4 max-w-4xl">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
            <Route path="/club" element={<PrivateRoute><ClubDashboard /></PrivateRoute>} />
            <Route path="/student" element={<PrivateRoute><StudentDashboard /></PrivateRoute>} />
            <Route path="/student/request/:id" element={<PrivateRoute><RequestDetails /></PrivateRoute>} />
            <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
