import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { prisma } from '../../config/database';

export const pollsRouter = new Hono();

pollsRouter.get('/', (c) => c.json({ success: true, data: [] }));
pollsRouter.post('/', (c) => c.json({ success: true, data: null }));

pollsRouter.get('/me', (c) => c.json({ success: true, data: [] }));

pollsRouter.get('/:id', (c) => c.json({ success: true, data: null }));
pollsRouter.patch('/:id', (c) => c.json({ success: true, data: null }));
pollsRouter.delete('/:id', (c) => c.json({ success: true, data: null }));

pollsRouter.post('/:id/publish', (c) => c.json({ success: true, data: null }));
pollsRouter.post('/:id/close', (c) => c.json({ success: true, data: null }));

pollsRouter.get('/:id/results', (c) => c.json({ success: true, data: null }));
pollsRouter.get('/:id/analytics', (c) => c.json({ success: true, data: null }));

pollsRouter.post('/:id/cover', (c) => c.json({ success: true, data: null }));

// Real-Time Results Stream (Server-Sent Events)
pollsRouter.get('/:id/stream', async (c) => {
  const id = c.req.param('id');
  return streamSSE(c, async (stream) => {
    let active = true;
    stream.onAbort(() => {
      active = false;
    });

    while (active) {
      const poll = await prisma.poll.findFirst({
        where: { id },
        include: {
          questions: {
            include: {
              options: true,
            },
          },
        },
      });

      if (!poll) {
        await stream.writeSSE({
          data: JSON.stringify({ error: 'Poll not found' }),
          event: 'error',
        });
        break;
      }

      await stream.writeSSE({
        data: JSON.stringify(poll),
        event: 'message',
        id: String(Date.now()),
      });

      await stream.sleep(3000);
    }
  });
});
