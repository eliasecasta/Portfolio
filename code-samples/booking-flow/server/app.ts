import express from 'express';
import path from 'node:path';
import { z } from 'zod';
import { BookingError, type BookingStore } from './bookingStore';

const bookingRequest = z.object({
  slotId: z.string().min(1),
  email: z.string().email(),
  requestId: z.string().uuid(),
}).strict();

export function createApp(store: BookingStore, staticDir = process.env.NODE_ENV === 'production' ? path.resolve(process.cwd(), 'dist') : undefined) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '8kb' }));

  app.get('/api/health', (_request, response) => {
    response.json({ status: 'ok' });
  });

  app.get('/api/slots', (_request, response) => {
    response.json({ slots: store.listSlots() });
  });

  app.post('/api/bookings', (request, response) => {
    const parsed = bookingRequest.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Provide a valid slotId, email, and UUID requestId.' },
      });
      return;
    }

    try {
      const result = store.reserve(parsed.data);
      response.status(result.replayed ? 200 : 201).json(result);
    } catch (error) {
      if (!(error instanceof BookingError)) throw error;
      response.status(error.code === 'SLOT_NOT_FOUND' ? 404 : 409).json({
        error: { code: error.code, message: error.message },
      });
    }
  });

  app.post('/api/reset', (_request, response) => {
    store.reset();
    response.json({ status: 'reset' });
  });

  app.use('/api', (_request, response) => {
    response.status(404).json({ error: { code: 'NOT_FOUND', message: 'API endpoint not found.' } });
  });

  if (staticDir) {
    app.use(express.static(staticDir));
    app.get('*', (_request, response) => response.sendFile(path.join(staticDir, 'index.html')));
  }

  return app;
}
