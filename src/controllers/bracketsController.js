import { fetchFromApi } from "./apiController.js";
import { separateHybridTournament } from "../services/tournamentProcessor.js";
import { detectStageType } from "../services/stageDetector.js";
import { processStageFixtures } from "../services/stageProcessor.js";

/**
 * Obtiene datos básicos de un torneo sin procesamiento pesado
 */
export const getTournamentData = async (
  tournamentId,
  sport = "cs2",
  includeProcessed = false
) => {
  try {
    // Obtener datos básicos del torneo
    const [competition, participants, stages, fixtures] = await Promise.all([
      fetchFromApi(`competitions/${tournamentId}`),
      fetchFromApi(`competitions/${tournamentId}/participants`),
      fetchFromApi(`competitions/${tournamentId}/stages`),
      fetchFromApi(`fixtures?competitionId=${tournamentId}`),
    ]);

    const result = {
      competition: competition || null,
      participants: participants?.participants || [],
      stages: stages?.stages || [],
      fixtures: fixtures?.fixtures || [],
      allFixturesIndexedById: {},
      participantsDataIndexedById: {},
    };

    // Indexar fixtures por ID
    if (result.fixtures && Array.isArray(result.fixtures)) {
      result.fixtures.forEach((fixture) => {
        const fixtureId = fixture.id || fixture.fixtureId;
        if (fixtureId) {
          result.allFixturesIndexedById[fixtureId] = fixture;
        }
      });
    }

    // Indexar participantes por ID
    if (result.participants && Array.isArray(result.participants)) {
      result.participants.forEach((participant) => {
        const participantId = participant.id || participant.participantId;
        if (participantId) {
          result.participantsDataIndexedById[participantId] = {
            id: participantId,
            name: participant.name || "",
            color: participant.color || "",
            image_url: participant.image_url || participant.logoUrl || "",
          };
        }
      });
    }

    // Si se requiere procesamiento, agregarlo
    if (includeProcessed) {
      result.processedData = await processTournamentData(result, tournamentId);
    }

    return result;
  } catch (error) {
    console.error("❌ Error getting tournament data:", error);
    throw error;
  }
};

/**
 * Obtiene datos completos y procesados de un torneo
 * Incluye separación híbrida, detección de stages, etc.
 */
export const getProcessedTournamentData = async (
  tournamentId,
  sport = "cs2"
) => {
  try {
    // Obtener datos básicos
    const basicData = await getTournamentData(tournamentId, sport, false);

    // Procesar datos pesados
    const processedData = await processTournamentData(basicData, tournamentId);

    return {
      ...basicData,
      processedData,
    };
  } catch (error) {
    console.error("❌ Error getting processed tournament data:", error);
    throw error;
  }
};

/**
 * Obtiene datos de un stage específico con procesamiento
 */
export const getStageData = async (tournamentId, stageId, sport = "cs2") => {
  try {
    // Obtener datos del stage
    const [stageParticipants, stageFixtures] = await Promise.all([
      fetchFromApi(`competitions/stage/${stageId}/participants`),
      fetchFromApi(`competitions/stage/${stageId}/stagefixtures`),
    ]);

    const stageInfo = {
      id: stageId,
      participants: stageParticipants?.participants || [],
      stageFixtures: stageFixtures?.stageFixtures || [],
    };

    // Obtener detalles completos de cada fixture
    const fixtureIds = (stageInfo.stageFixtures || [])
      .map((f) => f.fixtureId || f.id)
      .filter((id) => id);

    const fixtureDetails = await Promise.all(
      fixtureIds.map((id) => fetchFromApi(`fixtures/${id}`))
    );

    // Combinar datos de fixtures
    const allFixtures = stageInfo.stageFixtures.map((stageFixture, index) => {
      const fixtureId = stageFixture.fixtureId || stageFixture.id;
      const details = fixtureDetails[index] || {};

      return {
        ...details,
        ...stageFixture,
        _stageInfo: {
          section: stageFixture.section || null,
          advancement: stageFixture.advancement || null,
        },
      };
    });

    // Detectar tipo de stage
    const stageType = detectStageType(allFixtures, stageInfo.participants);

    // Procesar fixtures del stage (rounds, brackets, etc.)
    const processedStageData = processStageFixtures(allFixtures, stageType);

    return {
      stageInfo: {
        id: stageId,
        name: stageInfo.stageFixtures[0]?.stageName || `Stage ${stageId}`,
        type: stageType,
      },
      participants: stageInfo.participants,
      fixtures: allFixtures,
      processedData: processedStageData,
    };
  } catch (error) {
    console.error("❌ Error getting stage data:", error);
    throw error;
  }
};

/**
 * Procesa datos del torneo (separación híbrida, detección, etc.)
 */
async function processTournamentData(basicData, tournamentId) {
  const processed = {
    hybridSeparation: null,
    stagesData: {},
    detectionResults: {},
  };

  // Separar torneo híbrido si es necesario
  if (basicData.fixtures && basicData.fixtures.length > 0) {
    processed.hybridSeparation = separateHybridTournament(
      basicData.fixtures,
      basicData,
      tournamentId
    );
  }

  // Procesar cada stage
  if (basicData.stages && Array.isArray(basicData.stages)) {
    for (const stage of basicData.stages) {
      const stageId = stage.id;
      const stageType = stage.type || "Unknown";

      processed.stagesData[stageId] = {
        id: stageId,
        name: stage.name || `Stage ${stageId}`,
        type: stageType,
        isSwiss: stageType.toLowerCase().includes("swiss"),
        isPlayoffs:
          stageType.toLowerCase().includes("playoff") ||
          stageType.toLowerCase().includes("knockout"),
      };
    }
  }

  return processed;
}
