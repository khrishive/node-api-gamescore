import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';

// Carpeta para logs normales
const logDir = path.resolve('src/inserts/live-data/logs');
// Carpeta para logs de error/warn
const errorLogDir = path.resolve('src/inserts/live-data/error-logs');

const infoTransport = new winston.transports.DailyRotateFile({
  dirname: logDir,
  filename: 'assists-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  level: 'debug', // <-- Cambiado a 'debug' para permitir logs debug, info, warn, error
  zippedArchive: false,
  maxSize: '20m',
  maxFiles: '14d', // Guarda 14 días
});

const errorTransport = new winston.transports.DailyRotateFile({
  dirname: errorLogDir,
  filename: 'assists-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  level: 'warn', // Incluye warn y error
  zippedArchive: false,
  maxSize: '20m',
  maxFiles: '30d', // Guarda 30 días de errores
});

const assistsLogger = winston.createLogger({
  level: 'debug', // <-- Cambiado a 'debug' para que acepte logs debug
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json() // Puedes usar format.simple() para texto plano
  ),
  transports: [
    infoTransport,
    errorTransport
  ]
});

export default assistsLogger;