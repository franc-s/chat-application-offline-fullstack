import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { Container } from './container.js';
import { createUserRoutes } from './routes/userRoutes.js';
import { createGroupRoutes } from './routes/groupRoutes.js';
import { createMessageRoutes } from './routes/messageRoutes.js';
import { createEventRoutes } from './routes/eventRoutes.js';
import { createRateLimit } from './middleware/rateLimit.js';
import { errorMiddleware } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';

dotenv.config();

export function createApp(): express.Application {
  const app = express();
  const container = Container.getInstance();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // Rate limiting (disabled for testing)
  // app.use(createRateLimit(100, 60000));

  // Routes
  app.use('/users', createUserRoutes(container.userController));
  app.use('/groups', createGroupRoutes(container.groupController));
  app.use('/messages', createMessageRoutes(container.messageController));
  app.use('/events', createEventRoutes(container.eventController));

  // Global error handling middleware (must be last)
  app.use(errorMiddleware);

  return app;
}

// Export app instance for testing
export const app = createApp();

export async function startServer(port: number = 3001): Promise<void> {
  const app = createApp();
  
  app.listen(port, () => {
    logger.info(`Server running on port ${port}`);
  });

  // Graceful shutdown
  process.on('beforeExit', async () => {
    const container = Container.getInstance();
    await container.disconnect();
  });

  process.on('SIGINT', async () => {
    logger.info('Received SIGINT, shutting down gracefully');
    const container = Container.getInstance();
    await container.disconnect();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM, shutting down gracefully');
    const container = Container.getInstance();
    await container.disconnect();
    process.exit(0);
  });
}
