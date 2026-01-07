/**
 * Servicio para procesar datos de torneos
 * Incluye separación de torneos híbridos, organización de fixtures, etc.
 */

/**
 * Separa fixtures de un torneo híbrido (Swiss + Playoffs) en dos fases
 * Basado en la lógica del plugin de WordPress
 *
 * @param {Array} fixtures - Todas las fixtures del torneo
 * @param {Object} tournamentData - Datos del torneo
 * @param {number} tournamentId - ID del torneo
 * @returns {Object} Objeto con 'swiss' y 'playoffs' arrays
 */
export function separateHybridTournament(
  fixtures,
  tournamentData,
  tournamentId
) {
  if (!fixtures || fixtures.length === 0) {
    return { swiss: [], playoffs: [] };
  }

  // Ordenar fixtures por timestamp
  const fixturesWithTime = fixtures
    .map((fixture) => {
      const participants = fixture.participants || [];
      if (participants.length < 2) {
        return null;
      }

      let timestamp = fixture.scheduledStartTime || fixture.startTime || 0;
      if (timestamp > 1893456000) {
        timestamp = timestamp / 1000; // Convertir de ms a segundos
      }

      return {
        fixture,
        timestamp,
      };
    })
    .filter((item) => item !== null)
    .sort((a, b) => a.timestamp - b.timestamp);

  // Calcular estadísticas por equipo
  const teamMatches = {};
  const teamLosses = {};
  const teamWins = {};
  const allTeamIds = new Set();

  fixturesWithTime.forEach((item) => {
    const participants = item.fixture.participants || [];
    if (participants.length >= 2) {
      const p1Id = participants[0].id || participants[0].participantId;
      const p2Id = participants[1].id || participants[1].participantId;

      if (p1Id) allTeamIds.add(p1Id);
      if (p2Id) allTeamIds.add(p2Id);

      // Inicializar contadores
      [p1Id, p2Id].forEach((id) => {
        if (id) {
          if (!teamMatches[id]) teamMatches[id] = 0;
          if (!teamLosses[id]) teamLosses[id] = 0;
          if (!teamWins[id]) teamWins[id] = 0;
        }
      });

      // Determinar ganador
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
  const expectedPlayoffsMatches = totalTeams > 0 ? totalTeams - 1 : 0;

  // Detectar punto de separación
  let swissFixtures = [];
  let playoffsFixtures = [];
  let separationPoint = null;

  // Calcular estadísticas acumulativas
  const cumulativeStats = [];
  let currentMatches = 0;
  let currentActiveTeams = new Set();

  fixturesWithTime.forEach((item, index) => {
    const participants = item.fixture.participants || [];
    if (participants.length >= 2) {
      const p1Id = participants[0].id || participants[0].participantId;
      const p2Id = participants[1].id || participants[1].participantId;

      currentActiveTeams.add(p1Id);
      currentActiveTeams.add(p2Id);
      currentMatches++;

      // Calcular pérdidas acumulativas
      const p1Losses = teamLosses[p1Id] || 0;
      const p2Losses = teamLosses[p2Id] || 0;

      cumulativeStats.push({
        index,
        matches: currentMatches,
        activeTeams: currentActiveTeams.size,
        maxLosses: Math.max(p1Losses, p2Losses),
        avgMatchesPerTeam: currentMatches / currentActiveTeams.size,
      });
    }
  });

  // Buscar punto de separación
  // Swiss: más partidos, equipos pueden tener múltiples pérdidas
  // Playoffs: menos partidos, eliminación estricta
  for (let i = 0; i < cumulativeStats.length; i++) {
    const stats = cumulativeStats[i];
    const remainingMatches = fixturesWithTime.length - i - 1;

    // Si quedan aproximadamente N-1 partidos y hay pocos equipos activos, probablemente playoffs
    if (
      remainingMatches <= expectedPlayoffsMatches * 1.5 &&
      stats.activeTeams <= totalTeams * 0.5 &&
      stats.maxLosses <= 2
    ) {
      separationPoint = i;
      break;
    }
  }

  // Si no se encontró punto de separación, usar heurística simple
  if (separationPoint === null) {
    // Si hay muchos partidos y equipos pueden tener múltiples pérdidas, todo es Swiss
    const maxLosses = Math.max(...Object.values(teamLosses));
    if (
      maxLosses > 2 &&
      fixturesWithTime.length > expectedPlayoffsMatches * 2
    ) {
      separationPoint = fixturesWithTime.length; // Todo es Swiss
    } else {
      // Todo es Playoffs o no hay separación clara
      separationPoint = 0;
    }
  }

  // Separar fixtures
  swissFixtures = fixturesWithTime
    .slice(0, separationPoint)
    .map((item) => item.fixture);
  playoffsFixtures = fixturesWithTime
    .slice(separationPoint)
    .map((item) => item.fixture);

  return {
    swiss: swissFixtures,
    playoffs: playoffsFixtures,
    separationPoint,
    totalFixtures: fixturesWithTime.length,
    swissCount: swissFixtures.length,
    playoffsCount: playoffsFixtures.length,
  };
}

/**
 * Organiza fixtures por rounds
 */
export function organizeFixturesByRounds(fixtures) {
  const rounds = {};

  fixtures.forEach((fixture) => {
    // Intentar obtener round de varios campos posibles
    let roundName =
      fixture.section ||
      fixture.round_name ||
      fixture.roundName ||
      fixture.round;

    // Si no hay round, agrupar por fecha
    if (!roundName) {
      let timestamp = fixture.scheduledStartTime || fixture.startTime || 0;
      if (timestamp > 1893456000) timestamp = timestamp / 1000;
      roundName =
        timestamp > 0
          ? `Round ${new Date(timestamp * 1000).toISOString().split("T")[0]}`
          : "Round Unknown";
    }

    if (!rounds[roundName]) {
      rounds[roundName] = [];
    }

    rounds[roundName].push(fixture);
  });

  // Ordenar rounds
  const sortedRounds = Object.keys(rounds).sort((a, b) => {
    // Extraer números si existen
    const numA = parseInt(a.match(/\d+/)?.[0] || "0");
    const numB = parseInt(b.match(/\d+/)?.[0] || "0");
    return numA - numB;
  });

  return {
    rounds: sortedRounds.map((name) => ({
      name,
      fixtures: rounds[name],
    })),
    fixturesByRound: rounds,
  };
}
