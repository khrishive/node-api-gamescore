import express from "express";
import { getTournamentData } from "../controllers/bracketsController.js";
import { getStageData } from "../controllers/bracketsController.js";
import { getProcessedTournamentData } from "../controllers/bracketsController.js";

const router = express.Router();

/**
 * GET /brackets/tournament/:tournamentId
 *
 * Obtiene todos los datos de un torneo procesados y listos para usar.
 * Reemplaza múltiples llamadas del plugin:
 * - /v1/competitions/{id}
 * - /v1/competitions/{id}/participants
 * - /v1/competitions/{id}/stages
 * - /v1/fixtures?competitionId={id}
 *
 * Retorna datos estructurados con:
 * - competition: Info de la competición
 * - participants: Lista de participantes
 * - stages: Lista de stages con sus fixtures
 * - allFixtures: Todas las fixtures indexadas
 * - processedData: Datos procesados (separación híbrida, detección de tipos)
 */
router.get("/tournament/:tournamentId", async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { sport = "cs2" } = req.query;

    const data = await getProcessedTournamentData(tournamentId, sport);

    if (!data) {
      return res.status(404).json({ error: "Tournament not found" });
    }

    res.json(data);
  } catch (error) {
    console.error("❌ Error in /brackets/tournament:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

/**
 * GET /brackets/tournament/:tournamentId/stage/:stageId
 *
 * Obtiene datos procesados de un stage específico.
 * Reemplaza:
 * - /v1/competitions/stage/{id}/participants
 * - /v1/competitions/stage/{id}/stagefixtures
 * - Múltiples llamadas a /v1/fixtures/{id}
 *
 * Retorna:
 * - stageInfo: Información del stage
 * - participants: Participantes con estadísticas
 * - fixtures: Fixtures del stage con detalles completos
 * - processedData: Datos procesados (rounds, brackets, standings)
 */
router.get("/tournament/:tournamentId/stage/:stageId", async (req, res) => {
  try {
    const { tournamentId, stageId } = req.params;
    const { sport = "cs2" } = req.query;

    const data = await getStageData(tournamentId, stageId, sport);

    if (!data) {
      return res.status(404).json({ error: "Stage not found" });
    }

    res.json(data);
  } catch (error) {
    console.error("❌ Error in /brackets/tournament/stage:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

/**
 * GET /brackets/tournament/:tournamentId/simple
 *
 * Versión simplificada que solo obtiene datos básicos sin procesamiento pesado.
 * Útil para obtener información rápida del torneo.
 */
router.get("/tournament/:tournamentId/simple", async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { sport = "cs2" } = req.query;

    const data = await getTournamentData(tournamentId, sport, false);

    if (!data) {
      return res.status(404).json({ error: "Tournament not found" });
    }

    res.json(data);
  } catch (error) {
    console.error("❌ Error in /brackets/tournament/simple:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

export default router;
