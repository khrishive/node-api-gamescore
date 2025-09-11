import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';

// Folder for normal logs
const logDir = path.resolve('src/inserts/live-data/logs');
// Folder for error/warn logs
const errorLogDir = path.resolve('src/inserts/live-data/error-logs');

const infoTransport = new winston.transports.DailyRotateFile({
  dirname: logDir,
  filename: 'assists-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  level: 'debug', // <-- Changed to 'debug' to allow debug, info, warn, error logs
  zippedArchive: false,
  maxSize: '20m',
  maxFiles: '14d', // Save 14 days
});

const errorTransport = new winston.transports.DailyRotateFile({
  dirname: errorLogDir,
  filename: 'assists-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  level: 'warn', // Includes warn and error
  zippedArchive: false,
  maxSize: '20m',
  maxFiles: '30d', // Save 30 days of errors
});

const assistsLogger = winston.createLogger({
  level: 'debug', // <-- Changed to 'debug' to accept debug logs
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json() // You can use format.simple() for plain text
  ),
  transports: [
    infoTransport,
    errorTransport
  ]
});

export default assistsLogger;