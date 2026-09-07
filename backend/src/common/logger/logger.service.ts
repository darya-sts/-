import { Injectable, Logger } from '@nestjs/common';
import * as winston from 'winston';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LoggerService {
  private readonly logger: winston.Logger;
  private readonly nest = new Logger('App');

  constructor(private readonly prisma: PrismaService) {
    const errorLog = path.resolve(process.cwd(), 'error.log');
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
        }),
        new winston.transports.File({ filename: errorLog, level: 'error' }),
      ],
    });
  }

  info(message: string, meta?: Record<string, unknown>) {
    this.logger.info(message, meta);
    this.nest.log(message);
  }

  warn(message: string, meta?: Record<string, unknown>) {
    this.logger.warn(message, meta);
    this.nest.warn(message);
  }

  error(message: string, meta?: Record<string, unknown>) {
    this.logger.error(message, meta);
    this.nest.error(message);
  }

  async audit(action: string, entity?: string, entityId?: string, details?: unknown) {
    this.info(`AUDIT ${action}`, { entity, entityId });
    try {
      await this.prisma.auditLog.create({
        data: {
          action,
          entity,
          entityId,
          details: details ? JSON.stringify(details) : null,
        },
      });
    } catch (e: any) {
      this.warn(`Не удалось записать audit: ${e.message}`);
    }
  }
}