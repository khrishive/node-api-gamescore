import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import competitionsRoutes from "./routes/competitions.js";
import fixturesRoutes from "./routes/fixtures.js";
import teamsRoutes from "./routes/teams.js";
import playersRoutes from "./routes/players.js";
import dbAPIRoutes from "./routes/dbAPIRoutes.js"; // Import database API routes
//import geminiRoutes from './routes/gemini.js';
import { apiKeyAuth } from "./middleware/apiKeyAuth.js";
import fixtureStatsRouter from "./routes/fixtureStats.js";
import fixtureAssistsRouter from "./routes/fixtureAssists.js";
import fixtureEquipmentStateRouter from "./routes/fixtureEquipmentStateRouter.js";
import fixtureEventsRawRouter from "./routes/fixtureEventsRawRouter.js";
import fixtureMapsRouter from "./routes/fixtureMapsRouter.js";
import matchEventRoute from "./routes/matchEventRoute.js";
import mapBreakdownRoute from "./routes/mapBreakdownRoute.js";
import fixturesByComp from "./routes/fixtureByCompetitionRoute.js";
import mapStatsRoute from "./routes/mapStatsRoute.js";
import populateRoutes from "./routes/populateRoutes.js";
import lolMapStats from "./routes/lolStatsRoute.js";
import bracketsRoutes from "./routes/bracketsRoutes.js";

dotenv.config(); // ⚠️ Load environment variables before using them

const app = express();

// Middleware
// 🔹 Configure CORS securely
const corsOptions = {
  origin: "*", // ✅ Replace with the frontend URL
  methods: ["GET", "POST"], // ✅ Allowed methods
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan("dev")); // Log each request to the console

// Protected routes with API Key:
app.use("/api/competitions", apiKeyAuth, competitionsRoutes);
app.use("/api/fixtures", apiKeyAuth, fixturesRoutes);
app.use("/fixtures-by-comp", apiKeyAuth, fixturesByComp);
app.use("/api", apiKeyAuth, mapBreakdownRoute);
app.use("/historic-events", apiKeyAuth, matchEventRoute);
app.use("/fixtures", apiKeyAuth, fixtureStatsRouter);
app.use("/fixtures", apiKeyAuth, fixtureAssistsRouter);
app.use("/fixtures", apiKeyAuth, fixtureEquipmentStateRouter);
app.use("/fixtures", apiKeyAuth, fixtureEventsRawRouter);
app.use("/fixtures", apiKeyAuth, fixtureMapsRouter);
app.use("/fixtures/lol", apiKeyAuth, lolMapStats);
app.use("/api/teams", apiKeyAuth, teamsRoutes);
app.use("/api/players", apiKeyAuth, playersRoutes);
app.use("/db", apiKeyAuth, dbAPIRoutes);
app.use("/db/populate", populateRoutes);
app.use("/map-stats", apiKeyAuth, mapStatsRoute);
app.use("/brackets", apiKeyAuth, bracketsRoutes);

// Global error handling
app.use((err, req, res, next) => {
  console.error("❌ ERROR:", err.message);
  res.status(500).json({ error: "An error occurred on the server" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
