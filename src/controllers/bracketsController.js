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
        fetchFromApi(`competitions/${tournamentId}/fixtures`),
      ]);

    // Log what we received from fixtures endpoint
    console.log(
      `📊 Fixtures endpoint response for tournament ${tournamentId}:`
    );
    console.log(`   - hasData: ${!!fixturesData}`);
    console.log(`   - isArray: ${Array.isArray(fixturesData)}`);
    console.log(`   - type: ${typeof fixturesData}`);
    if (fixturesData && !Array.isArray(fixturesData)) {
      console.log(`   - keys: ${Object.keys(fixturesData).join(", ")}`);
    }
    console.log(`   - fixturesCount: ${fixturesData?.fixtures?.length || 0}`);
    console.log(
      `   - directArrayCount: ${
        Array.isArray(fixturesData) ? fixturesData.length : 0
      }`
    );
    console.log(`   - hasError: ${!!fixturesData?.error}`);
    if (fixturesData?.error) {
      console.error(`   ❌ Error details:`, fixturesData.error);
    }
    if (fixturesData && !Array.isArray(fixturesData) && fixturesData.data) {
      console.log(
        `   - data property exists: ${Array.isArray(fixturesData.data)} (${
          fixturesData.data?.length || 0
        } items)`
      );
    }

    // Estructura de datos similar al plugin
    // Handle different response formats for fixtures
    let competitionFixtures = [];
    if (fixturesData) {
      if (Array.isArray(fixturesData)) {
        // If response is directly an array
        competitionFixtures = fixturesData;
        console.log(
          `   ✅ Using fixtures as direct array (${competitionFixtures.length} items)`
        );
      } else if (
        fixturesData.fixtures &&
        Array.isArray(fixturesData.fixtures)
      ) {
        // If response has fixtures property
        competitionFixtures = fixturesData.fixtures;
        console.log(
          `   ✅ Using fixturesData.fixtures (${competitionFixtures.length} items)`
        );
      } else if (fixturesData.data && Array.isArray(fixturesData.data)) {
        // If response has data property
        competitionFixtures = fixturesData.data;
        console.log(
          `   ✅ Using fixturesData.data (${competitionFixtures.length} items)`
        );
      } else {
        console.log(
          `   ⚠️ Could not extract fixtures from response. Response structure:`,
          JSON.stringify(fixturesData).substring(0, 200)
        );
      }
    } else {
      console.log(`   ⚠️ fixturesData is null or undefined`);
    }

    console.log(
      `   📊 Final competitionFixtures count: ${competitionFixtures.length}`
    );

    // Ensure stages is always a mutable array
    const stagesArray = stagesData?.stages ? [...stagesData.stages] : [];

    const result = {
      competition: competition || null,
      competitionParticipants: participantsData?.participants || [],
      stages: stagesArray,
      competitionFixtures: competitionFixtures,
      allFixturesIndexedById: {},
      participantsDataIndexedById: {},
      stagesData: {},
      stageFixtures: {},
      stageParticipants: {},
      debug: {
        stageErrors: {},
        stageFetchInfo: {},
        fixturesEndpointResponse: {
          hasData: !!fixturesData,
          isArray: Array.isArray(fixturesData),
          type: typeof fixturesData,
          keys:
            fixturesData && !Array.isArray(fixturesData)
              ? Object.keys(fixturesData)
              : [],
          fixturesCount: fixturesData?.fixtures?.length || 0,
          directArrayCount: Array.isArray(fixturesData)
            ? fixturesData.length
            : 0,
          hasError: !!fixturesData?.error,
          errorDetails: fixturesData?.error || null,
          dataPropertyExists:
            fixturesData && !Array.isArray(fixturesData) && fixturesData.data
              ? {
                  isArray: Array.isArray(fixturesData.data),
                  length: fixturesData.data?.length || 0,
                }
              : null,
          processedCount: competitionFixtures.length,
          extractionMethod: Array.isArray(fixturesData)
            ? "direct_array"
            : fixturesData?.fixtures
            ? "fixtures_property"
            : fixturesData?.data
            ? "data_property"
            : "none",
        },
        fixturesIndexing: {
          competitionFixturesType: typeof competitionFixtures,
          competitionFixturesIsArray: Array.isArray(competitionFixtures),
          competitionFixturesLength: competitionFixtures.length || 0,
          indexedCount: 0, // Will be updated after indexing
        },
        hybridSeparationCheck: {
          stagesCount: 0, // Will be updated later
          competitionFixturesCount: 0, // Will be updated later
          allFixturesCount: 0, // Will be updated later
          fixturesForHybridCount: 0, // Will be updated later
        },
      },
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

    // Update debug info with indexing results
    if (result.debug && result.debug.fixturesIndexing) {
      result.debug.fixturesIndexing.indexedCount = allFixtures.length;
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
          console.log(
            `🔍 Fetching data for stage ${stageId} (${stageName})...`
          );

          // Guardar información de debugging
          result.debug.stageFetchInfo[stageId] = {
            stageId,
            stageName,
            fetching: true,
            participantsEndpoint: `competitions/stage/${stageId}/participants`,
            fixturesEndpoint: `competitions/stage/${stageId}/stagefixtures`,
          };

          const [stageParticipantsData, stageFixturesData] = await Promise.all([
            fetchFromApi(`competitions/stage/${stageId}/participants`),
            fetchFromApi(`competitions/stage/${stageId}/stagefixtures`),
          ]);

          // Guardar información sobre las respuestas
          result.debug.stageFetchInfo[stageId].participantsResponse = {
            hasData: !!stageParticipantsData,
            hasError: !!stageParticipantsData?.error,
            keys: stageParticipantsData
              ? Object.keys(stageParticipantsData)
              : [],
            participantsCount: stageParticipantsData?.participants?.length || 0,
          };

          result.debug.stageFetchInfo[stageId].fixturesResponse = {
            hasData: !!stageFixturesData,
            hasError: !!stageFixturesData?.error,
            keys: stageFixturesData ? Object.keys(stageFixturesData) : [],
            stageFixturesCount: stageFixturesData?.stageFixtures?.length || 0,
            rawData: stageFixturesData
              ? JSON.stringify(stageFixturesData).substring(0, 200)
              : "null",
          };

          result.stageParticipants[stageId] =
            stageParticipantsData?.participants || [];

          const stageFixtures = stageFixturesData?.stageFixtures || [];
          result.stageFixtures[stageId] = stageFixtures;

          result.debug.stageFetchInfo[stageId].fetching = false;
          result.debug.stageFetchInfo[stageId].success = true;
          result.debug.stageFetchInfo[stageId].fixturesCount =
            stageFixtures.length;
          result.debug.stageFetchInfo[stageId].participantsCount =
            result.stageParticipants[stageId]?.length || 0;

          console.log(
            `   ✅ Stage ${stageId}: ${stageFixtures.length} fixtures, ${
              result.stageParticipants[stageId]?.length || 0
            } participants`
          );

          if (stageFixtures.length === 0) {
            console.log(
              `   ⚠️ Stage ${stageId} has NO fixtures - stageFixturesData:`,
              stageFixturesData ? Object.keys(stageFixturesData) : "null"
            );
          }

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
          console.error(
            `❌ Error processing stage ${stageId} (${stageName}):`,
            error
          );
          console.error(`   Error message:`, error.message);
          if (error.stack) {
            console.error(`   Stack trace:`, error.stack);
          }

          // Guardar información del error en la respuesta
          result.debug.stageErrors[stageId] = {
            stageId,
            stageName,
            error: error.message,
            stack: error.stack?.substring(0, 500) || "No stack trace",
            timestamp: new Date().toISOString(),
          };

          if (result.debug.stageFetchInfo[stageId]) {
            result.debug.stageFetchInfo[stageId].fetching = false;
            result.debug.stageFetchInfo[stageId].success = false;
            result.debug.stageFetchInfo[stageId].error = error.message;
          }

          // Asegurar que stageFixtures existe incluso si hay error
          if (!result.stageFixtures[stageId]) {
            result.stageFixtures[stageId] = [];
          }

          // Continuar con otros stages - pero al menos tenemos el stage básico creado
          console.log(
            `   ⚠️ Stage ${stageId} will have no processedData due to error`
          );
        }
      }
    }

    // Separar torneo híbrido si es necesario (cuando no hay stages definidos)
    let hybridSeparation = null;
    // Use competitionFixtures if available, otherwise use allFixtures
    const fixturesForHybrid =
      result.competitionFixtures && result.competitionFixtures.length > 0
        ? result.competitionFixtures
        : allFixtures && allFixtures.length > 0
        ? allFixtures
        : [];

    // Update debug info with hybrid separation check
    if (result.debug && result.debug.hybridSeparationCheck) {
      result.debug.hybridSeparationCheck.stagesCount =
        result.stages?.length || 0;
      result.debug.hybridSeparationCheck.competitionFixturesCount =
        result.competitionFixtures?.length || 0;
      result.debug.hybridSeparationCheck.allFixturesCount = allFixtures.length;
      result.debug.hybridSeparationCheck.fixturesForHybridCount =
        fixturesForHybrid ? fixturesForHybrid.length : 0;
    }

    if (
      (!result.stages || result.stages.length === 0) &&
      fixturesForHybrid &&
      fixturesForHybrid.length > 0
    ) {
      console.log(
        `🔍 No stages found, attempting hybrid separation with ${fixturesForHybrid.length} fixtures`
      );
      hybridSeparation = separateHybridTournament(
        fixturesForHybrid,
        result,
        tournamentId
      );

      // Process the separated fixtures
      if (
        hybridSeparation &&
        hybridSeparation.swiss &&
        hybridSeparation.swiss.length > 0
      ) {
        console.log(
          `   ✅ Swiss phase detected: ${hybridSeparation.swiss.length} fixtures`
        );
        const swissDetectedType = detectStageType(
          hybridSeparation.swiss,
          [],
          "Swiss"
        );
        const swissProcessedData = processStageFixtures(
          hybridSeparation.swiss,
          swissDetectedType
        );
        hybridSeparation.swissProcessedData = swissProcessedData;
      }

      if (
        hybridSeparation &&
        hybridSeparation.playoffs &&
        hybridSeparation.playoffs.length > 0
      ) {
        console.log(
          `   ✅ Playoffs phase detected: ${hybridSeparation.playoffs.length} fixtures`
        );
        const playoffsDetectedType = detectStageType(
          hybridSeparation.playoffs,
          [],
          "Playoffs"
        );
        const playoffsProcessedData = processStageFixtures(
          hybridSeparation.playoffs,
          playoffsDetectedType
        );
        hybridSeparation.playoffsProcessedData = playoffsProcessedData;
      }

      console.log(
        `   📊 Hybrid separation complete: Swiss=${
          hybridSeparation?.swissCount || 0
        }, Playoffs=${hybridSeparation?.playoffsCount || 0}`
      );
    } else if (!result.stages || result.stages.length === 0) {
      console.log(
        `   ⚠️ No stages and no fixtures available for hybrid separation`
      );
    }

    // Si tenemos hybridSeparation, crear stages virtuales para que el plugin pueda renderizarlos
    if (
      hybridSeparation &&
      (hybridSeparation.swissCount > 0 || hybridSeparation.playoffsCount > 0)
    ) {
      // Crear stage virtual para Swiss si existe
      if (hybridSeparation.swissCount > 0) {
        const swissStageId = `swiss_${tournamentId}`;
        result.stagesData[swissStageId] = {
          id: swissStageId,
          name: "Group stage",
          type: "Swiss",
          isSwiss: true,
          isPlayoffs: false,
          processedData: hybridSeparation.swissProcessedData,
          detectedType: "Swiss",
          fullFixtures: hybridSeparation.swiss,
        };
        result.stageFixtures[swissStageId] = hybridSeparation.swiss;
        result.stageParticipants[swissStageId] = [];

        // Agregar a stages array para que el plugin lo detecte
        if (!Array.isArray(result.stages)) {
          result.stages = [];
        }
        result.stages.push({
          id: swissStageId,
          name: "Group stage",
          type: "Swiss",
        });

        console.log(`   ✅ Created virtual Swiss stage: ${swissStageId}`);
      }

      // Crear stage virtual para Playoffs si existe
      if (hybridSeparation.playoffsCount > 0) {
        const playoffsStageId = `playoffs_${tournamentId}`;
        result.stagesData[playoffsStageId] = {
          id: playoffsStageId,
          name: "Playoffs",
          type: "Playoffs",
          isSwiss: false,
          isPlayoffs: true,
          processedData: hybridSeparation.playoffsProcessedData,
          detectedType: "Playoffs",
          fullFixtures: hybridSeparation.playoffs,
        };
        result.stageFixtures[playoffsStageId] = hybridSeparation.playoffs;
        result.stageParticipants[playoffsStageId] = [];

        // Agregar a stages array para que el plugin lo detecte
        if (!Array.isArray(result.stages)) {
          result.stages = [];
        }
        result.stages.push({
          id: playoffsStageId,
          name: "Playoffs",
          type: "Playoffs",
        });

        console.log(`   ✅ Created virtual Playoffs stage: ${playoffsStageId}`);
      }
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
      `   - stageFixtures keys: ${Object.keys(result.stageFixtures).length}`
    );
    console.log(
      `   - stageFixtures keys: [${Object.keys(result.stageFixtures).join(
        ", "
      )}]`
    );
    if (Object.keys(result.stageFixtures).length > 0) {
      const firstStageId = Object.keys(result.stageFixtures)[0];
      const firstStageFixtures = result.stageFixtures[firstStageId];
      console.log(
        `   - stageFixtures[${firstStageId}]: ${
          Array.isArray(firstStageFixtures) ? firstStageFixtures.length : 0
        } fixtures`
      );
    } else {
      console.log(
        `   ⚠️ stageFixtures is EMPTY - no fixtures were fetched for any stage`
      );
    }
    console.log(
      `   - competitionFixtures: ${result.competitionFixtures?.length || 0}`
    );
    console.log(
      `   - allFixtures: ${result.processedData?.allFixtures?.length || 0}`
    );
    console.log(`   - Result keys: [${Object.keys(result).join(", ")}]`);
    console.log(`   - debug exists: ${!!result.debug}`);
    console.log(
      `   - debug.stageFetchInfo keys: [${Object.keys(
        result.debug?.stageFetchInfo || {}
      ).join(", ")}]`
    );
    console.log(
      `   - debug.stageErrors keys: [${Object.keys(
        result.debug?.stageErrors || {}
      ).join(", ")}]`
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

