import { Server, Socket } from 'socket.io';
import { prisma } from './db';
import { verifyToken } from './utils/jwt';

interface AuthSocket extends Socket {
  user?: { id: string; firstName: string; lastName: string };
}

export const setupSocket = (io: Server) => {
  io.use(async (socket: AuthSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error'));
      const decoded = verifyToken(token);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, firstName: true, lastName: true },
      });
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthSocket) => {
    socket.on('join-document', async ({ documentId }) => {
      const doc = await prisma.document.findUnique({
        where: { id: documentId },
        include: { workspace: { include: { members: { where: { userId: socket.user!.id } } } } },
      });
      if (!doc || doc.workspace.members.length === 0) return socket.emit('error', 'Access denied');
      socket.join(documentId);
      socket.to(documentId).emit('user-joined', socket.user);
      
      const clients = io.sockets.adapter.rooms.get(documentId);
      const activeUsers = Array.from(clients || []).map((clientId) => {
        const clientSocket = io.sockets.sockets.get(clientId) as AuthSocket;
        return clientSocket?.user;
      }).filter(Boolean);
      socket.emit('active-users', activeUsers);
    });

    socket.on('document-update', async ({ documentId, content, baseRevision, clientUpdateId }) => {
      try {
        const doc = await prisma.document.findUnique({ where: { id: documentId } });
        if (!doc) return;

        if (doc.revision !== baseRevision) {
          return socket.emit('document-conflict', { message: 'Document updated by someone else.' });
        }

        const updatedDoc = await prisma.document.update({
          where: { id: documentId },
          data: { content, revision: { increment: 1 } },
        });

        await prisma.documentVersion.create({
          data: { documentId, content: updatedDoc.content, revision: updatedDoc.revision, authorId: socket.user!.id },
        });

        socket.to(documentId).emit('document-updated', {
          content: updatedDoc.content,
          revision: updatedDoc.revision,
          senderId: socket.id,
          clientUpdateId,
        });
      } catch (error) {
        console.error('Update error:', error);
      }
    });

    socket.on('leave-document', ({ documentId }) => {
      socket.leave(documentId);
      socket.to(documentId).emit('user-left', socket.user);
    });
  });
};