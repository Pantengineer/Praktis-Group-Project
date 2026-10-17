// server/config/cors.js
import cors from 'cors';

const defaultAllowed = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://praktis-project.site',
  'https://praktis-project.site',
  'http://www.praktis-project.site',
  'https://www.praktis-project.site'
];

const envOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const allowedOrigins = Array.from(new Set([...defaultAllowed, ...envOrigins]));

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || origin.endsWith('praktis-project.site')) {
            callback(null, true);
        } else {
            callback(new Error(`CORS policy: Origin '${origin}' is not allowed.`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

export default cors(corsOptions);