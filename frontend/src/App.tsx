import { Routes, Route, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import WorkspaceDetail from './pages/WorkspaceDetail';
import DocumentEditor from './pages/DocumentEditor'; // <-- Added

function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg text-center">
        <h1 className="text-3xl font-bold text-brand-600 mb-4">CollabSpace</h1>
        <p className="text-gray-600 mb-8">Real-Time Collaborative Document Platform</p>
        <div className="space-y-4">
          <Link to="/login" className="block w-full bg-brand-600 text-white py-2 rounded-lg">Login</Link>
          <Link to="/register" className="block w-full bg-white text-brand-600 border border-brand-600 py-2 rounded-lg">Register</Link>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  useEffect(() => { checkAuth(); }, [checkAuth]);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/workspaces/:id" element={<WorkspaceDetail />} />
      <Route path="/documents/:id" element={<DocumentEditor />} /> {/* <-- Added */}
    </Routes>
  );
}