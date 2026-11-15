import { Router } from 'express';
import { prisma } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/:id/comments', async (req: AuthRequest, res) => {
  try {
    const comments = await prisma.comment.findMany({
      where: { documentId: req.params.id },
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
        replies: { include: { author: { select: { firstName: true, lastName: true } } } },
      },
    });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

router.post('/:id/comments', async (req: AuthRequest, res) => {
  try {
    const comment = await prisma.comment.create({
      data: {
        documentId: req.params.id,
        authorId: req.user!.id,
        content: req.body.content,
      },
      include: { author: { select: { firstName: true, lastName: true } } },
    });
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to post comment' });
  }
});

export default router;