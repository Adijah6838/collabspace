import http from 'http';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import app from './app';
import { setupSocket } from './socket';

dotenv.config();

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: 'http://localhost:5173', methods: ['GET', 'POST'] },
});

setupSocket(io);

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));