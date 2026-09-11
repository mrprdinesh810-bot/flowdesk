import express from 'express';
import os from 'node:os';
import cors from 'cors';
import { config } from './config.js';
import { getDb } from './db/db.js';
import { runMigrations } from './db/migrations.js';
import { errorHandler } from './middleware/errorHandler.js';

import { brainDumpsRouter } from './routes/brainDumps.js';
import { fixRouter } from './routes/fix.js';
import { tasksRouter } from './routes/tasks.js';
import { timersRouter } from './routes/timers.js';
import { reviewsRouter } from './routes/reviews.js';
import { analyticsRouter } from './routes/analytics.js';
import { settingsRouter } from './routes/settings.js';
import { backupRouter } from './routes/backup.js';
import { appUpdateRouter } from './routes/appUpdate.js';

export function createApp() {
  const db = getDb();
  runMigrations(db);

  const app = express();

  // CORS restricted to configured local frontend origins per §45.J
  app.use(cors({
    origin: (origin, callback) => {
      // allow requests with no origin (e.g. mobile apps, curl, postman) or matching local origins
      if (
        !origin ||
        config.corsOrigins.includes(origin) ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:') ||
        origin.startsWith('http://[::1]:') ||
        origin.startsWith('http://192.168.') ||
        origin.startsWith('http://10.') ||
        origin.startsWith('http://172.')
      ) {
        callback(null, true);
      } else {
        callback(new Error('CORS not allowed for this origin.'));
      }
    },
    credentials: true,
  }));

  app.use(express.json({ limit: '10mb' }));

  // Health check
  app.get('/api/v1/health', (req, res) => {
    res.json({ status: 'ok', app: 'FlowDesk', version: config.appVersion });
  });

  // Network info for mobile pairing
  app.get('/api/v1/network-info', (req, res) => {
    const interfaces = os.networkInterfaces();
    const ranked: Array<{ address: string; name: string; score: number }> = [];

    for (const name of Object.keys(interfaces)) {
      const isVirtual = /vethernet|wsl|virtual|docker|hyper-v|loopback/i.test(name);
      for (const net of interfaces[name] || []) {
        if (net.family === 'IPv4' && !net.internal) {
          let score = 0;
          if (isVirtual) score -= 100;
          if (/wi-fi|wireless|wlan/i.test(name)) score += 50;
          else if (/ethernet/i.test(name) && !/virtual/i.test(name)) score += 30;
          if (net.address.startsWith('192.168.') && !net.address.startsWith('192.168.56.')) score += 20;
          if (net.address.startsWith('10.')) score += 20;
          ranked.push({ address: net.address, name, score });
        }
      }
    }
    ranked.sort((a, b) => b.score - a.score);
    const addresses = ranked.map(r => r.address);

    res.json({
      port: 3000,
      apiPort: config.port,
      addresses,
      primaryAddress: addresses[0] || 'localhost',
    });
  });

  // Mount API resource routers per §69
  app.use('/api/v1/brain-dumps', brainDumpsRouter);
  app.use('/api/v1/fix', fixRouter);
  app.use('/api/v1/tasks', tasksRouter);
  app.use('/api/v1/timers', timersRouter);
  app.use('/api/v1/reviews', reviewsRouter);
  app.use('/api/v1/analytics', analyticsRouter);
  app.use('/api/v1/settings', settingsRouter);
  app.use('/api/v1/backup', backupRouter);
  app.use('/api/v1/app-update', appUpdateRouter);

  // Error handling middleware per §70
  app.use(errorHandler);

  return app;
}

export function startServer() {
  const db = getDb();
  runMigrations(db);

  const app = createApp();
  const server = app.listen(config.port, config.host, () => {
    console.log(`====================================================`);
    console.log(`FlowDesk Backend running at http://${config.host}:${config.port}`);
    console.log(`Database: ${config.dbPath} (WAL enabled)`);
    console.log(`Single-focus timer enforcement: ACTIVE`);
    console.log(`====================================================`);
  });

  return server;
}

// Auto-start when executed directly
if (process.argv[1] && (process.argv[1].endsWith('server.js') || process.argv[1].endsWith('server.ts'))) {
  startServer();
}
