/**
 * Servicio para detectar el tipo de stage (Swiss, Playoffs, GSL, etc.)
 * Basado en la lógica del plugin de WordPress
 */

/**
 * Detecta el tipo de stage basándose en las fixtures y participantes
 *
 * @param {Array} fixtures - Fixtures del stage
 * @param {Array} participants - Participantes del stage
 * @param {string} apiStageType - Tipo de stage según la API
 * @returns {string} Tipo detectado: 'Swiss', 'Playoffs', 'GSL', 'Groups', 'Unknown'
 */
export function detectStageType(
  fixtures,
  participants = [],
  apiStageType = "Unknown"
) {
  // Si la API ya indica el tipo, confiar en ella (con validación)
  if (
    apiStageType &&
    apiStageType !== "Unknown" &&
    apiStageType !== "Competition"
  ) {
    const lowerType = apiStageType.toLowerCase();

    if (lowerType.includes("swiss")) return "Swiss";
    if (
      lowerType.includes("playoff") ||
      lowerType.includes("knockout") ||
      lowerType.includes("bracket")
    ) {
      return "Playoffs";
    }
    if (lowerType.includes("gsl")) return "GSL";
    if (lowerType.includes("group")) return "Groups";
  }

  if (!fixtures || fixtures.length === 0) {
    return "Unknown";
  }

  // Calcular estadísticas
  const teamMatches = {};
  const teamLosses = {};
  const teamWins = {};
  const allTeamIds = new Set();

  fixtures.forEach((fixture) => {
    const participants = fixture.participants || [];
    if (participants.length >= 2) {
      const p1Id = participants[0].id || participants[0].participantId;
      const p2Id = participants[1].id || participants[1].participantId;

      if (p1Id) allTeamIds.add(p1Id);
      if (p2Id) allTeamIds.add(p2Id);

      [p1Id, p2Id].forEach((id) => {
        if (id) {
          if (!teamMatches[id]) teamMatches[id] = 0;
          if (!teamLosses[id]) teamLosses[id] = 0;
          if (!teamWins[id]) teamWins[id] = 0;
        }
      });

      const p1Score = participants[0].score || 0;
      const p2Score = participants[1].score || 0;

      if (p1Score > p2Score) {
        teamWins[p1Id]++;
        teamLosses[p2Id]++;
      } else if (p2Score > p1Score) {
        teamWins[p2Id]++;
        teamLosses[p1Id]++;
      }

      teamMatches[p1Id]++;
      teamMatches[p2Id]++;
    }
  });

  const totalTeams = allTeamIds.size;
  const totalMatches = fixtures.length;
  const maxLosses = Math.max(...Object.values(teamLosses), 0);
  const avgMatchesPerTeam = totalTeams > 0 ? totalMatches / totalTeams : 0;
  const expectedPlayoffsMatches = totalTeams > 0 ? totalTeams - 1 : 0;

  // Criterios para Swiss:
  // - Muchos partidos (más que N-1)
  // - Equipos pueden tener múltiples pérdidas (>2)
  // - Promedio de partidos por equipo > 2
  const isSwiss =
    totalMatches > expectedPlayoffsMatches * 1.5 &&
    maxLosses > 2 &&
    avgMatchesPerTeam > 2;

  // Criterios para Playoffs:
  // - Pocos partidos (aproximadamente N-1)
  // - Eliminación estricta (máximo 1-2 pérdidas)
  // - Estructura de bracket clara
  const isPlayoffs =
    totalMatches <= expectedPlayoffsMatches * 1.2 &&
    maxLosses <= 2 &&
    avgMatchesPerTeam <= Math.log2(totalTeams) + 1;

  // Criterios para GSL:
  // - Similar a Swiss pero con estructura específica
  // - Grupos de 4 equipos típicamente
  const isGSL =
    totalTeams % 4 === 0 &&
    totalMatches > expectedPlayoffsMatches &&
    maxLosses <= 2;

  if (isSwiss) return "Swiss";
  if (isPlayoffs) return "Playoffs";
  if (isGSL) return "GSL";

  // Si hay grupos definidos
  const hasGroups = participants.some((p) => p.group);
  if (hasGroups) return "Groups";

  return "Unknown";
}

/**
 * Detecta si un stage es Swiss system
 */
export function isSwissStage(
  fixtures,
  participants = [],
  apiStageType = "Unknown"
) {
  return detectStageType(fixtures, participants, apiStageType) === "Swiss";
}

/**
 * Detecta si un stage es Playoffs/Knockout
 */
export function isPlayoffsStage(
  fixtures,
  participants = [],
  apiStageType = "Unknown"
) {
  return detectStageType(fixtures, participants, apiStageType) === "Playoffs";
}
