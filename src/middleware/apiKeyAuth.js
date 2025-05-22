import dotenv from 'dotenv';
dotenv.config();

export function apiKeyAuth(req, res, next) {
  const apiKey = req.header('x-api-key');
  if (apiKey && apiKey === process.env.API_KEY) {
    next();
  } else {
    res.status(401).json({ error: 'No autorizado: API Key inválida' });
  }
}