import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const documentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  workspaceId: z.string().uuid(),
  content: z.string().optional(),
});

router.use(authenticate);

// POST /api/documents - Create a new document
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { title, workspaceId, content } = documentSchema.parse(req.body);
    const userId = req.user!.id;

    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });

    if (!member || member.role === 'VIEWER') {
      return res.status(403).json({ error: 'You do not have permission to create documents' });
    }

    const document = await prisma.document.create({
      data: {
        title,
        workspaceId,
        authorId: userId,
        content: content || '',
      },
    });

    res.status(201).json(document);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/documents/:id - Get a specific document
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const documentId = req.params.id;
    const userId = req.user!.id;

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        workspace: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (document.workspace.members.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.status(200).json(document);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/documents/:id - Update document content
router.patch('/:id', async (req: AuthRequest, res) => {
  try {
    const documentId = req.params.id;
    const userId = req.user!.id;
    const { content, title } = req.body;

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { workspace: { include: { members: { where: { userId } } } } },
    });

    if (!document || document.workspace.members.length === 0) {
      return res.status(404).json({ error: 'Document not found or access denied' });
    }

    const role = document.workspace.members[0].role;
    if (role === 'VIEWER') {
      return res.status(403).json({ error: 'Viewers cannot edit documents' });
    }

    const updated = await prisma.document.update({
      where: { id: documentId },
      data: {
        content: content !== undefined ? content : document.content,
        title: title !== undefined ? title : document.title,
        revision: { increment: 1 },
      },
    });

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;