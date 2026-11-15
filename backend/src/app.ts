import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import workspaceRoutes from './routes/workspaces';
import documentRoutes from './routes/documents';
import versionRoutes from './routes/versions';
import commentRoutes from './routes/comments';

const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/documents', versionRoutes);
app.use('/api/documents', commentRoutes);

app.get('/api/health', (req, res) => res.status(200).json({ status: 'ok' }));

export default app;