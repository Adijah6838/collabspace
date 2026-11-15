import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuthStore } from '../store/authStore';

interface Document {
  id: string;
  title: string;
  updatedAt: string;
}

interface Workspace {
  id: string;
  name: string;
  documents: Document[];
}

export default function WorkspaceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isCreating, setIsCreating] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    api.get(`/workspaces/${id}`)
      .then((res) => { setWorkspace(res.data); setLoading(false); })
      .catch((err) => { setError('Failed to load workspace'); setLoading(false); });
  }, [id, user, navigate]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim()) return;
    try {
      const res = await api.post('/documents', { title: newDocTitle, workspaceId: id });
      setWorkspace((prev: any) => ({ ...prev, documents: [res.data, ...prev.documents] }));
      setNewDocTitle('');
      setIsCreating(false);
    } catch (err) { alert('Failed to create document'); }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error || !workspace) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="text-gray-500 hover:text-gray-900 font-medium">&larr; Dashboard</Link>
          <h1 className="text-xl font-bold text-brand-600 ml-4">{workspace.name}</h1>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Documents</h2>
          <button onClick={() => setIsCreating(true)} className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-500 transition-colors">
            + New Document
          </button>
        </div>
        
        {isCreating && (
          <form onSubmit={handleCreate} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-8 flex gap-4">
            <input 
              type="text" 
              placeholder="Document Title" 
              value={newDocTitle} 
              onChange={(e) => setNewDocTitle(e.target.value)} 
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-brand-500 focus:border-brand-500" 
              autoFocus 
            />
            <button type="submit" className="bg-brand-600 text-white px-4 py-2 rounded-md hover:bg-brand-500">Create</button>
            <button type="button" onClick={() => setIsCreating(false)} className="text-gray-500 hover:text-gray-700 px-2">Cancel</button>
          </form>
        )}

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {workspace.documents.length === 0 ? (
            <p className="p-8 text-center text-gray-500">No documents yet. Create one to get started!</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {workspace.documents.map(doc => (
                <li key={doc.id}>
                  {/* THIS IS THE UPDATED LINK WRAPPER */}
                  <Link to={`/documents/${doc.id}`} className="block p-6 hover:bg-gray-50 transition-colors flex justify-between items-center group">
                    <div>
                      <h3 className="text-lg font-medium text-brand-600 group-hover:underline">{doc.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">Updated {new Date(doc.updatedAt).toLocaleString()}</p>
                    </div>
                    <span className="text-gray-400 group-hover:text-brand-600">&rarr;</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}