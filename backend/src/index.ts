/**
 * index.ts — Fastify server entry point.
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { loadConfig } from '../config/loader';
import { vaultRoutes } from './routes/vault';

async function buildServer() {
  const config = loadConfig();

  const fastify = Fastify({
    logger: {
      level: config.NODE_ENV === 'production' ? 'info' : 'debug',
      transport:
        config.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    },
  });

  // ── Plugins ──────────────────────────────────────────────────────────────────
  await fastify.register(cors, {
    origin: config.NODE_ENV === 'production' ? false : true,
  });

  // ── Routes ───────────────────────────────────────────────────────────────────
  await fastify.register(vaultRoutes);

  // Health check
  fastify.get('/health', async () => ({ status: 'ok' }));

  return { fastify, config };
}

async function start() {
  const { fastify, config } = await buildServer();

  try {
    await fastify.listen({ port: config.PORT, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// Allow importing buildServer in tests without starting the server
export { buildServer };

start();
