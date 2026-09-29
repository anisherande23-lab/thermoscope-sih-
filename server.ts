import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { apiApp, syncNasaFirmsOnServer } from './api/index';

const PORT = 3000;

async function startServer() {
  const app = express();

  // Mount full REST & ML API routes (/api/*)
  app.use(apiApp);

  // Mount Vite Middleware in Development or Static Dist in Production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Perform live NASA FIRMS ingestion on server startup
  await syncNasaFirmsOnServer().catch(() => {});

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`THERMOSCOPE Full-Stack Server & ML Pipeline online at http://0.0.0.0:${PORT}`);
  });
}

startServer();
