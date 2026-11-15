import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const workspaceSchema = z.object({
  name: z.string().min(1, 'Workspace name is required'),
});

// Apply auth middleware to all workspace routes
router.use(authenticate);

// POST /api/workspaces - Create a workspace
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { name } = workspaceSchema.parse(req.body);
    const userId = req.user!.id;

    // Create the workspace and automatically add the creator as the OWNER
    const workspace = await prisma.workspace.create({
      data: {
        name,
        members: {
          create: {
            userId,
            role: 'OWNER',
          },
        },
      },
    });

    res.status(201).json(workspace);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/workspaces - List all workspaces the user belongs to
router.get('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    const workspaces = await prisma.workspace.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        _count: {
          select: { documents: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.status(200).json(workspaces);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/workspaces/:id - Get a specific workspace details
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const workspaceId = req.params.id;

    // Check if user is a member of the workspace
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });

    if (!member) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
        documents: {
          orderBy: { updatedAt: 'desc' },
          take: 10,
        },
      },
    });

    res.status(200).json(workspace);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;