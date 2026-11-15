import { Router } from 'express';
import { prisma } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/:id/versions', async (req: AuthRequest, res) => {
  try {
    const versions = await prisma.documentVersion.findMany({
      where: { documentId: req.params.id },
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { firstName: true, lastName: true } } },
    });
    res.json(versions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch versions' });
  }
});

router.post('/:id/restore', async (req: AuthRequest, res) => {
  try {
    const documentId = req.params.id;
    const { versionId } = req.body;
    const userId = req.user!.id;

    const version = await prisma.documentVersion.findUnique({ where: { id: versionId } });
    if (!version || version.documentId !== documentId) {
      return res.status(404).json({ error: 'Version not found' });
    }

    const updatedDoc = await prisma.document.update({
      where: { id: documentId },
      data: { content: version.content, revision: { increment: 1 } },
    });

    await prisma.documentVersion.create({
      data: {
        documentId,
        content: version.content,
        revision: updatedDoc.revision,
        authorId: userId,
      },
    });

    res.json(updatedDoc);
  } catch (error) {
    res.status(500).json({ error: 'Failed to restore version' });
  }
});

export default router;