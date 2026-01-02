import { fetchFromApi } from "./apiController.js";
import { separateHybridTournament } from "../services/tournamentProcessor.js";
import { detectStageType } from "../services/stageDetector.js";
import { processStageFixtures } from "../services/stageProcessor.js";

/**
 * Obtiene datos completos y procesados de un torneo
 * Este endpoint reemplaza todas las llamadas múltiples del plugin
 */
export const getProcessedTournamentData = async (
  tournamentId,
  sport = "cs2"
) => {
  try {
    console.log(
      `🔍 Starting tournament data collection for ID: ${tournamentId}`
    );

    // Obtener datos básicos del torneo en paralelo
    const [competition, participantsData, stagesData, fixturesData] =
      await Promise.all([
        fetchFromApi(`competitions/${tournamentId}`),
        fetchFromApi(`competitions/${tournamentId}/participants`),
        fetchFromApi(`competitions/${tournamentId}/stages`),
        fetchFromApi(`fixtures?competitionId=${tournamentId}`),
      ]);

    // Estructura de datos similar al plugin
    const result = {
      competition: competition || null,
      competitionParticipants: participantsData?.participants || [],
      stages: stagesData?.stages || [],
      competitionFixtures: fixturesData?.fixtures || [],
      allFixturesIndexedById: {},
      participantsDataIndexedById: {},
      stagesData: {},
      stageFixtures: {},
      stageParticipants: {},
    };

    // Indexar participantes por ID
    if (
      result.competitionParticipants &&
      Array.isArray(result.competitionParticipants)
    ) {
      result.competitionParticipants.forEach((participant) => {
        const participantId = participant.id || participant.participantId;
        if (participantId) {
          result.participantsDataIndexedById[participantId] = {
            id: participantId,
            name: participant.name || "",
            color: participant.color || "",
            image_url: participant.image_url || participant.logoUrl || "",
            logoUrl: participant.logoUrl || participant.image_url || "",
          };
        }
      });
    }

    // Indexar fixtures por ID y almacenar todas
    const allFixtures = [];
    if (
      result.competitionFixtures &&
      Array.isArray(result.competitionFixtures)
    ) {
      result.competitionFixtures.forEach((fixture) => {
        const fixtureId = fixture.id || fixture.fixtureId;
        if (fixtureId) {
          result.allFixturesIndexedById[fixtureId] = fixture;
          allFixtures.push(fixture);
        }
      });
    }

    // Procesar cada stage
    if (result.stages && Array.isArray(result.stages)) {
      console.log(`📊 Processing ${result.stages.length} stages...`);
      for (const stage of result.stages) {
        const stageId = stage.id;
        const stageType = stage.type || "Unknown";
        const stageName = stage.name || `Stage ${stageId}`;

        if (!stageId) {
          console.error(`⚠️ Stage without ID:`, stage);
          continue;
        }

        // Detectar si es Swiss desde el tipo
        const isSwissFromAPI =
          stageType.toLowerCase().includes("swiss") ||
          stageName.toLowerCase().includes("swiss");

        result.stagesData[stageId] = {
          id: stageId,
          name: stageName,
          type: stageType,
          isSwiss: isSwissFromAPI,
          isPlayoffs:
            stageType.toLowerCase().includes("playoff") ||
            stageType.toLowerCase().includes("knockout"),
        };

        console.log(
          `✅ Created stagesData[${stageId}] for stage: ${stageName}`
        );

        // Obtener participantes y fixtures del stage
        try {
          const [stageParticipantsData, stageFixturesData] = await Promise.all([
            fetchFromApi(`competitions/stage/${stageId}/participants`),
            fetchFromApi(`competitions/stage/${stageId}/stagefixtures`),
          ]);

          result.stageParticipants[stageId] =
            stageParticipantsData?.participants || [];

          const stageFixtures = stageFixturesData?.stageFixtures || [];
          result.stageFixtures[stageId] = stageFixtures;

          // Obtener detalles completos de cada fixture del stage
          const fixtureIds = stageFixtures
            .map((f) => f.fixtureId || f.id)
            .filter((id) => id);

          // Obtener detalles de fixtures que no tenemos ya
          const missingFixtureIds = fixtureIds.filter(
            (id) => !result.allFixturesIndexedById[id]
          );

          if (missingFixtureIds.length > 0) {
            const fixtureDetails = await Promise.all(
              missingFixtureIds.map((id) => fetchFromApi(`fixtures/${id}`))
            );

            fixtureDetails.forEach((fixture, index) => {
              if (fixture && !fixture.error) {
                const fixtureId = missingFixtureIds[index];
                result.allFixturesIndexedById[fixtureId] = fixture;
                allFixtures.push(fixture);
              }
            });
          }

          // Combinar datos de stage fixtures con detalles completos
          const fullStageFixtures = stageFixtures.map((stageFixture) => {
            const fixtureId = stageFixture.fixtureId || stageFixture.id;
            const fullFixture =
              result.allFixturesIndexedById[fixtureId] || stageFixture;

            return {
              ...fullFixture,
              ...stageFixture,
              _stageInfo: {
                section: stageFixture.section || null,
                advancement: stageFixture.advancement || null,
              },
            };
          });

          // Indexar participantes del stage
          if (result.stageParticipants[stageId]) {
            result.stageParticipants[stageId].forEach((participant) => {
              const participantId = participant.id || participant.participantId;
              if (
                participantId &&
                !result.participantsDataIndexedById[participantId]
              ) {
                result.participantsDataIndexedById[participantId] = {
                  id: participantId,
                  name: participant.name || "",
                  color: participant.color || "",
                  image_url: participant.image_url || participant.logoUrl || "",
                  logoUrl: participant.logoUrl || participant.image_url || "",
                };
              }
            });
          }

          // Procesar fixtures del stage (detección y procesamiento)
          // Por ahora, usar la detección básica - luego mejoraremos con la lógica completa del plugin
          const detectedStageType = detectStageType(
            fullStageFixtures,
            result.stageParticipants[stageId] || [],
            stageType
          );

          // Procesar fixtures del stage
          const processedStageData = processStageFixtures(
            fullStageFixtures,
            detectedStageType
          );

          // Agregar datos procesados al stage
          result.stagesData[stageId].processedData = processedStageData;
          result.stagesData[stageId].detectedType = detectedStageType;
          result.stagesData[stageId].fullFixtures = fullStageFixtures;
        } catch (error) {
          console.error(`❌ Error processing stage ${stageId}:`, error);
          // Continuar con otros stages
        }
      }
    }

    // Separar torneo híbrido si es necesario (cuando no hay stages definidos)
    let hybridSeparation = null;
    if (
      (!result.stages || result.stages.length === 0) &&
      result.competitionFixtures &&
      result.competitionFixtures.length > 0
    ) {
      hybridSeparation = separateHybridTournament(
        result.competitionFixtures,
        result,
        tournamentId
      );
    }

    // Agregar datos procesados al resultado
    result.processedData = {
      hybridSeparation,
      stagesData: result.stagesData,
      allFixtures,
    };

    console.log(
      `✅ Tournament data collection complete for ID: ${tournamentId}`
    );
    console.log(`📊 Final result summary:`);
    console.log(`   - stages: ${result.stages?.length || 0}`);
    console.log(
      `   - stagesData keys: ${Object.keys(result.stagesData).length}`
    );
    console.log(
      `   - stagesData keys: [${Object.keys(result.stagesData).join(", ")}]`
    );
    console.log(
      `   - competitionFixtures: ${result.competitionFixtures?.length || 0}`
    );
    console.log(
      `   - allFixtures: ${result.processedData?.allFixtures?.length || 0}`
    );
    return result;
  } catch (error) {
    console.error("❌ Error getting processed tournament data:", error);
    throw error;
  }
};

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

    return result;
  } catch (error) {
    console.error("❌ Error getting tournament data:", error);
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
