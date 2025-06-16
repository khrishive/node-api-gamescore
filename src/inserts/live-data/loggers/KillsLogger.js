import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';

const logDir = path.resolve('src/inserts/live-data/logs');
const errorLogDir = path.resolve('src/inserts/live-data/error-logs');

const infoTransport = new winston.transports.DailyRotateFile({
  dirname: logDir,
  filename: 'Kills-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  level: 'debug',
  zippedArchive: false,
  maxSize: '20m',
  maxFiles: '14d',
});

const errorTransport = new winston.transports.DailyRotateFile({
  dirname: errorLogDir,
  filename: 'Kills-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  level: 'warn',
  zippedArchive: false,
  maxSize: '20m',
  maxFiles: '30d',
});

const KillsLogger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [infoTransport, errorTransport]
});

export default KillsLogger;