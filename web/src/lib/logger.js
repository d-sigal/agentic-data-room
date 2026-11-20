import pino from 'pino';
import pretty from 'pino-pretty';

const isDev = process.env.NODE_ENV !== 'production';

export const logger = pino(
  {
    level: process.env.LOG_LEVEL || 'info',
    base: {
      service: 'agentic-data-room',
    },
  },
  isDev
    ? pretty({
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      })
    : undefined,
);
