import express from 'express';
import dotenv from 'dotenv'
import cors from 'cors';
import morgan from 'morgan';
import competitionsRoutes from './routes/competitions.js'
import fixturesRoutes from './routes/fixtures.js'
import teamsRoutes from './routes/teams.js'
import playersRoutes from './routes/players.js'
import dbAPIRoutes from './routes/dbAPIRoutes.js'; // Importar las rutas de la API de la base de datos
//import geminiRoutes from './routes/gemini.js';
import { apiKeyAuth } from './middleware/apiKeyAuth.js';
import fixtureStatsRouter from './routes/fixtureStats.js';
import fixtureAssistsRouter from './routes/fixtureAssists.js';
import fixtureEquipmentStateRouter from './routes/fixtureEquipmentStateRouter.js';
import fixtureEventsRawRouter from './routes/fixtureEventsRawRouter.js';
import fixtureMapsRouter from './routes/fixtureMapsRouter.js';
import matchEventRoute from './routes/matchEventRoute.js';
import mapBreakdownRoute from './routes/mapBreakdownRoute.js';
import fixturesByComp from './routes/fixtureByCompetitionRoute.js';
import mapStatsRoute from './routes/mapStatsRoute.js';
import populateRoutes from './routes/populateRoutes.js';

dotenv.config();  // ⚠️ Cargar variables de entorno antes de usarlas

const app = express();

// Middleware
// 🔹 Configurar CORS de manera segura
const corsOptions = {
    origin: '*', // ✅ Reemplaza con la URL del frontend
    methods: ['GET', 'POST'], // ✅ Métodos permitidos
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan('dev')); // Registra cada solicitud en la consola

// Rutas protegidas con API Key:
app.use('/v2/api/competitions', apiKeyAuth, competitionsRoutes);
app.use("/v2/api/fixtures", apiKeyAuth, fixturesRoutes);
app.use("/v2/fixtures-by-comp", apiKeyAuth, fixturesByComp);
app.use("/v2/api", apiKeyAuth, mapBreakdownRoute);
app.use("/v2/historic-events", apiKeyAuth, matchEventRoute);
app.use("/v2/fixtures", apiKeyAuth, fixtureStatsRouter);
app.use("/v2/fixtures", apiKeyAuth, fixtureAssistsRouter);
app.use("/v2/fixtures", apiKeyAuth, fixtureEquipmentStateRouter);
app.use("/v2/fixtures", apiKeyAuth, fixtureEventsRawRouter);
app.use("/v2/fixtures", apiKeyAuth, fixtureMapsRouter);
app.use("/v2/api/teams", apiKeyAuth, teamsRoutes);
app.use("/v2/api/players", apiKeyAuth, playersRoutes);
app.use("/v2/db", apiKeyAuth, dbAPIRoutes);
app.use("/v2/db/populate", populateRoutes);
app.use('/v2/map-stats', apiKeyAuth, mapStatsRoute);
//app.use('/api/gemini', geminiRoutes);



// Manejo de errores global
app.use((err, req, res, next) => {
    console.error('❌ ERROR:', err.message);
    res.status(500).json({ error: 'Ocurrió un error en el servidor' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
