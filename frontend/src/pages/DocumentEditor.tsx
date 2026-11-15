import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import { io, Socket } from 'socket.io-client';
import { api } from '../api';
import { useAuthStore } from '../store/authStore';

export default function DocumentEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  
  const [title, setTitle] = useState('Loading...');
  const [workspaceId, setWorkspaceId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  
  const [activePanel, setActivePanel] = useState<'comments' | 'history' | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [versions, setVersions] = useState<any[]>([]);

  const revisionRef = useRef(1);
  const socketRef = useRef<Socket | null>(null);
  const isRemoteUpdate = useRef(false);

  const editor = useEditor({
    extensions: [StarterKit, LinkExtension.configure({ openOnClick: false })],
    content: '',
    editorProps: { attributes: { class: 'prose max-w-none focus:outline-none min-h-[500px] p-8' } },
    onUpdate: ({ editor }) => {
      if (isRemoteUpdate.current) { isRemoteUpdate.current = false; return; }
      handleSave(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!user || !token) { navigate('/'); return; }

    api.get(`/documents/${id}`).then((res) => {
      setTitle(res.data.title);
      setWorkspaceId(res.data.workspaceId);
      revisionRef.current = res.data.revision;
      if (editor) editor.commands.setContent(res.data.content || '');
      setLoading(false);
    }).catch(() => navigate('/dashboard'));

    const socket = io('http://localhost:8000', { auth: { token } });
    socketRef.current = socket;

    socket.on('connect', () => socket.emit('join-document', { documentId: id }));
    socket.on('active-users', setActiveUsers);
    socket.on('user-joined', (u) => setActiveUsers(p => [...p, u]));
    socket.on('user-left', (u) => setActiveUsers(p => p.filter(x => x.id !== u.id)));
    socket.on('document-updated', ({ content, revision }) => {
      if (editor) {
        isRemoteUpdate.current = true;
        editor.commands.setContent(content);
        revisionRef.current = revision;
      }
    });

    return () => { socket.emit('leave-document', { documentId: id }); socket.disconnect(); };
  }, [id, user, token, navigate, editor]);

  const handleSave = (content: string) => {
    if (!socketRef.current) return;
    setIsSaving(true);
    socketRef.current.emit('document-update', {
      documentId: id,
      content,
      baseRevision: revisionRef.current,
      clientUpdateId: Date.now().toString(),
    });
    revisionRef.current += 1;
    setIsSaving(false);
  };

  const loadComments = async () => {
    const res = await api.get(`/documents/${id}/comments`);
    setComments(res.data);
  };
  const loadVersions = async () => {
    const res = await api.get(`/documents/${id}/versions`);
    setVersions(res.data);
  };

  const postComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const res = await api.post(`/documents/${id}/comments`, { content: newComment });
    setComments([res.data, ...comments]);
    setNewComment('');
  };

  const restoreVersion = async (versionId: string) => {
    if (!confirm('Restore this version? Current content will be overwritten.')) return;
    await api.post(`/documents/${id}/restore`, { versionId });
    window.location.reload();
  };

  if (loading) return <div className="p-8 text-center">Loading editor...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white border-b px-6 py-3 flex justify-between items-center z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <Link to={`/workspaces/${workspaceId}`} className="text-gray-500 hover:text-gray-900 font-medium">&larr; Back</Link>
          <input type="text" value={title} readOnly className="text-xl font-bold bg-transparent outline-none" />
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex -space-x-2 mr-4">
            {activeUsers.map((u, i) => (
              <div key={i} title={u.firstName} className="w-8 h-8 rounded-full bg-brand-500 border-2 border-white flex items-center justify-center text-xs text-white font-bold uppercase">
                {u.firstName[0]}{u.lastName[0]}
              </div>
            ))}
          </div>
          <button onClick={() => { setActivePanel('comments'); loadComments(); }} className={`px-3 py-1 rounded ${activePanel === 'comments' ? 'bg-brand-100 text-brand-700' : 'text-gray-600 hover:bg-gray-100'}`}>Comments</button>
          <button onClick={() => { setActivePanel('history'); loadVersions(); }} className={`px-3 py-1 rounded ${activePanel === 'history' ? 'bg-brand-100 text-brand-700' : 'text-gray-600 hover:bg-gray-100'}`}>History</button>
          <span className="text-sm text-gray-500">{isSaving ? 'Saving...' : 'Synced'}</span>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col">
          <div className="bg-white border-b px-6 py-2 flex gap-2">
            <button onClick={() => editor?.chain().focus().toggleBold().run()} className="px-3 py-1 rounded hover:bg-gray-100 font-bold">B</button>
            <button onClick={() => editor?.chain().focus().toggleItalic().run()} className="px-3 py-1 rounded hover:bg-gray-100 italic">I</button>
            <button onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} className="px-3 py-1 rounded hover:bg-gray-100 font-bold">H1</button>
            <button onClick={() => editor?.chain().focus().toggleBulletList().run()} className="px-3 py-1 rounded hover:bg-gray-100">List</button>
          </div>
          <main className="flex-1 overflow-auto bg-white">
            <EditorContent editor={editor} />
          </main>
        </div>

        {activePanel && (
          <aside className="w-80 bg-white border-l flex flex-col shadow-xl">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold capitalize">{activePanel}</h3>
              <button onClick={() => setActivePanel(null)} className="text-gray-500 hover:text-gray-900">&times;</button>
            </div>

            {activePanel === 'comments' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {comments.map(c => (
                    <div key={c.id} className="p-3 rounded-lg border text-sm bg-white shadow-sm">
                      <div className="font-bold text-gray-900">{c.author.firstName} {c.author.lastName}</div>
                      <p className="text-gray-700 mt-1">{c.content}</p>
                      <p className="text-xs text-gray-400 mt-2">{new Date(c.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
                  {comments.length === 0 && <p className="text-gray-500 text-center text-sm">No comments yet.</p>}
                </div>
                <form onSubmit={postComment} className="p-4 border-t bg-gray-50">
                  <textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Add a comment..." className="w-full p-2 border rounded text-sm resize-none" rows={3} />
                  <button type="submit" className="mt-2 w-full bg-brand-600 text-white py-1.5 rounded text-sm hover:bg-brand-500">Post Comment</button>
                </form>
              </div>
            )}

            {activePanel === 'history' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {versions.map(v => (
                  <div key={v.id} className="p-3 rounded-lg border text-sm bg-white shadow-sm">
                    <div className="font-bold">Revision {v.revision}</div>
                    <div className="text-gray-500 text-xs">By {v.author.firstName} {v.author.lastName}</div>
                    <div className="text-gray-400 text-xs mt-1">{new Date(v.createdAt).toLocaleString()}</div>
                    <button onClick={() => restoreVersion(v.id)} className="mt-3 text-brand-600 hover:underline text-xs font-medium">Restore this version</button>
                  </div>
                ))}
                {versions.length === 0 && <p className="text-gray-500 text-center text-sm">No version history yet.</p>}
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}