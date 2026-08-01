import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { globalLimiter } from './middleware/rateLimits.js';
import { providerStatus } from './services/ai/index.js';

import authRoutes from './routes/authRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import youtubeRoutes from './routes/youtubeRoutes.js';

const app = express();

// Rate limiters and request logs need the real client IP when running behind a
// reverse proxy. Trusting one hop only — trusting every hop would let a client
// spoof X-Forwarded-For and evade the limiter entirely.
app.set('trust proxy', 1);

app.use(helmet());

/**
 * CORS from an explicit allowlist.
 *
 * If CLIENT_URL is unset, config/env.js has already exited in production. In
 * development this falls back to localhost:5173 rather than reflecting any
 * origin, which is what `origin: undefined` used to do.
 */
app.use(
  cors({
    origin(origin, callback) {
      // No Origin header: same-origin, curl, or a server-to-server call.
      if (!origin) return callback(null, true);
      if (env.allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
  })
);

// Bounded so a large body cannot be used to exhaust memory before validation.
app.use(express.json({ limit: '256kb' }));

app.use('/api', globalLimiter);

// ─── Health ──────────────────────────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  // Provider status reads the settings table, so a database problem must not
  // take the health endpoint down with it — that is what it exists to report.
  let ai = { provider: 'unknown', configured: false };
  try {
    ai = await providerStatus();
  } catch {
    ai = { provider: 'unknown', configured: false, error: 'unavailable' };
  }

  res.json({ status: 'ok', environment: env.NODE_ENV, ai });
});

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/youtube', youtubeRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

// ─── Start ───────────────────────────────────────────────────────────────────
const start = async () => {
  try {
    await connectDB();
  } catch (error) {
    console.error('Could not connect to the database:', error.message);
    console.error('Check DATABASE_URL in backend/.env and that migrations have been applied.');
    process.exit(1);
  }

  app.listen(env.PORT, async () => {
    console.log(`EDUBUILD API listening on http://localhost:${env.PORT}`);
    console.log(`Environment: ${env.NODE_ENV}`);

    try {
      const ai = await providerStatus();
      if (!ai.configured) {
        console.warn(
          `AI provider "${ai.provider}" has no API key. ` +
            'An admin can add one in Settings, or set the environment variable. ' +
            (env.isProduction ? 'Until then AI routes return 503.' : 'Falling back to the mock provider.')
        );
      } else {
        console.log(`AI provider: ${ai.provider} (key from ${ai.source})`);
      }
    } catch {
      console.warn('Could not determine AI provider status at startup.');
    }
  });
};

start();

export default app;
