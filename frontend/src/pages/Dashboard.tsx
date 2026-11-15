import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useWorkspaceStore } from '../store/workspaceStore';

export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const { workspaces, fetchWorkspaces, createWorkspace, isLoading } = useWorkspaceStore();
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    
    const success = await createWorkspace(newWorkspaceName);
    if (success) {
      setNewWorkspaceName('');
      setIsCreating(false);
    }
  };

  if (!user) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-brand-600">CollabSpace</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Welcome, {user.firstName}</span>
          <button onClick={logout} className="text-sm text-red-600 hover:underline">Log out</button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Your Workspaces</h2>
          <button
            onClick={() => setIsCreating(true)}
            className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-500 transition-colors"
          >
            + New Workspace
          </button>
        </div>

        {/* Create Workspace Form */}
        {isCreating && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
            <h3 className="text-lg font-semibold mb-4">Create a Workspace</h3>
            <form onSubmit={handleCreate} className="flex gap-4">
              <input
                type="text"
                placeholder="e.g., Acme Corp Marketing"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-brand-500 focus:border-brand-500"
                autoFocus
              />
              <button type="submit" disabled={isLoading} className="bg-brand-600 text-white px-4 py-2 rounded-md hover:bg-brand-500 disabled:opacity-50">
                Create
              </button>
              <button type="button" onClick={() => setIsCreating(false)} className="text-gray-500 hover:text-gray-700 px-2">
                Cancel
              </button>
            </form>
          </div>
        )}

        {/* Workspaces Grid */}
        {isLoading && workspaces.length === 0 ? (
          <div className="text-center text-gray-500 py-12">Loading workspaces...</div>
        ) : workspaces.length === 0 ? (
          <div className="text-center bg-white p-12 rounded-xl border border-gray-200 border-dashed">
            <p className="text-gray-500">You don't have any workspaces yet.</p>
            <p className="text-sm text-gray-400 mt-1">Create one to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workspaces.map((ws) => (
              <Link 
                to={`/workspaces/${ws.id}`}
                key={ws.id} 
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{ws.name}</h3>
                  <p className="text-sm text-gray-500">Created {new Date(ws.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-sm text-gray-500">
                  <span>{ws._count?.documents || 0} documents</span>
                  <span className="text-brand-600 font-medium">Open &rarr;</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}