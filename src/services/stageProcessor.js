/**
 * Servicio para procesar fixtures de stages
 * Organiza rounds, brackets, standings, etc.
 */

/**
 * Procesa fixtures de un stage según su tipo
 *
 * @param {Array} fixtures - Fixtures del stage
 * @param {string} stageType - Tipo de stage (Swiss, Playoffs, GSL, etc.)
 * @returns {Object} Datos procesados del stage
 */
export function processStageFixtures(fixtures, stageType) {
  const processed = {
    stageType,
    rounds: [],
    brackets: null,
    standings: [],
    fixturesByRound: {},
  };

  switch (stageType) {
    case "Swiss":
      processed.rounds = organizeSwissRounds(fixtures);
      processed.standings = calculateSwissStandings(fixtures);
      break;

    case "Playoffs":
      processed.brackets = buildPlayoffsBracket(fixtures);
      processed.rounds = organizePlayoffsRounds(fixtures);
      processed.fixturesByRound = organizePlayoffsFixturesByRound(fixtures);
      processed.playoffsType = detectPlayoffsType(fixtures);
      break;

    case "GSL":
      processed.rounds = organizeGSLRounds(fixtures);
      processed.standings = calculateGSLStandings(fixtures);
      break;

    default:
      processed.rounds = organizeGenericRounds(fixtures);
  }

  return processed;
}

/**
 * Organiza fixtures de Swiss en rounds
 */
function organizeSwissRounds(fixtures) {
  const rounds = {};

  fixtures.forEach((fixture) => {
    // Intentar obtener round de varios campos
    let roundName =
      fixture.section ||
      fixture.round_name ||
      fixture.roundName ||
      fixture.round;

    // Si no hay round, agrupar por fecha
    if (!roundName) {
      const timestamp = fixture.scheduledStartTime || fixture.startTime || 0;
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

  // Ordenar rounds por número
  const sortedRounds = Object.keys(rounds)
    .sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] || "0");
      const numB = parseInt(b.match(/\d+/)?.[0] || "0");
      return numA - numB;
    })
    .map((name) => ({
      name,
      fixtures: rounds[name],
    }));

  return sortedRounds;
}

/**
 * Calcula standings para Swiss system
 */
function calculateSwissStandings(fixtures) {
  const standings = {};

  fixtures.forEach((fixture) => {
    const participants = fixture.participants || [];
    if (participants.length < 2) return;

    const p1 = participants[0];
    const p2 = participants[1];
    const p1Id = p1.id || p1.participantId;
    const p2Id = p2.id || p2.participantId;

    if (!p1Id || !p2Id) return;

    // Inicializar si no existe
    if (!standings[p1Id]) {
      standings[p1Id] = {
        id: p1Id,
        name: p1.name || "",
        wins: 0,
        losses: 0,
        draws: 0,
        roundDifference: 0,
      };
    }

    if (!standings[p2Id]) {
      standings[p2Id] = {
        id: p2Id,
        name: p2.name || "",
        wins: 0,
        losses: 0,
        draws: 0,
        roundDifference: 0,
      };
    }

    const p1Score = p1.score || 0;
    const p2Score = p2.score || 0;

    // Actualizar estadísticas
    if (p1Score > p2Score) {
      standings[p1Id].wins++;
      standings[p2Id].losses++;
      standings[p1Id].roundDifference += p1Score - p2Score;
      standings[p2Id].roundDifference -= p1Score - p2Score;
    } else if (p2Score > p1Score) {
      standings[p2Id].wins++;
      standings[p1Id].losses++;
      standings[p2Id].roundDifference += p2Score - p1Score;
      standings[p1Id].roundDifference -= p2Score - p1Score;
    } else {
      standings[p1Id].draws++;
      standings[p2Id].draws++;
    }
  });

  // Convertir a array y ordenar
  return Object.values(standings)
    .sort((a, b) => {
      // Ordenar por: wins (desc), roundDifference (desc), losses (asc)
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.roundDifference !== a.roundDifference)
        return b.roundDifference - a.roundDifference;
      return a.losses - b.losses;
    })
    .map((team, index) => ({
      ...team,
      rank: index + 1,
    }));
}

/**
 * Construye bracket de Playoffs
 */
function buildPlayoffsBracket(fixtures) {
  // Organizar fixtures por sección/round
  const bracketsByRound = {};

  fixtures.forEach((fixture) => {
    // Try multiple possible fields for round/section name
    const section =
      fixture.section ||
      fixture.round_name ||
      fixture.roundName ||
      fixture.round ||
      fixture._stageInfo?.section ||
      "Unknown";

    // Normalize section name (handle variations)
    let normalizedSection = section;
    const sectionLower = section.toLowerCase();

    if (sectionLower.includes("quarter")) {
      normalizedSection = "Quarter-finals";
    } else if (sectionLower.includes("semi")) {
      normalizedSection = "Semi-finals";
    } else if (
      sectionLower.includes("final") &&
      !sectionLower.includes("grand") &&
      !sectionLower.includes("3rd") &&
      !sectionLower.includes("third")
    ) {
      normalizedSection = "Final";
    } else if (sectionLower.includes("grand")) {
      normalizedSection = "Grand Final";
    } else if (sectionLower.includes("3rd") || sectionLower.includes("third")) {
      normalizedSection = "3rd Place Decider";
    } else if (section === "Unknown" || !section || section.trim() === "") {
      // Try to detect round based on fixture position/structure
      // This is a fallback when section is not provided
      normalizedSection = "Unknown";
    }

    if (!bracketsByRound[normalizedSection]) {
      bracketsByRound[normalizedSection] = [];
    }
    bracketsByRound[normalizedSection].push(fixture);
  });

  // If all fixtures are in "Unknown", try to detect rounds by structure
  if (
    bracketsByRound["Unknown"] &&
    bracketsByRound["Unknown"].length === fixtures.length
  ) {
    console.log(
      `⚠️ All ${fixtures.length} fixtures are in "Unknown" - attempting structure-based detection`
    );
    // Log first few fixtures to see what data we have
    if (fixtures.length > 0) {
      const sampleFixture = fixtures[0];
      console.log(`   Sample fixture keys:`, Object.keys(sampleFixture));
      console.log(`   Sample fixture section:`, sampleFixture.section);
      console.log(`   Sample fixture _stageInfo:`, sampleFixture._stageInfo);
      console.log(`   Sample fixture round_name:`, sampleFixture.round_name);
    }

    // Try to detect rounds based on bracket structure
    const detectedRounds = detectRoundsByStructure(fixtures);
    if (detectedRounds && Object.keys(detectedRounds).length > 1) {
      console.log(
        `   ✅ Detected ${
          Object.keys(detectedRounds).length
        } rounds by structure:`,
        Object.keys(detectedRounds)
      );
      // Use detected rounds instead
      Object.keys(bracketsByRound).forEach(
        (key) => delete bracketsByRound[key]
      );
      Object.assign(bracketsByRound, detectedRounds);
    } else {
      console.log(
        `   ⚠️ Could not detect rounds by structure - keeping "Unknown"`
      );
    }
  }

  // Ordenar rounds de menos significativo a más significativo (izquierda a derecha)
  // Round of 32 -> Round of 16 -> Quarter-Final -> Semi-Final -> Final
  const roundOrder = [
    "Round of 32",
    "Round of 16",
    "Quarter-Final",
    "Quarter-finals",
    "Quarterfinals",
    "Quarter Final",
    "Semi-Final",
    "Semi-finals",
    "Semifinals",
    "Semi Final",
    "Final",
    "Grand Final",
    "Finals",
    "3rd Place Decider",
    "3rd Place",
    "Third Place",
  ];
  const sortedRounds = Object.keys(bracketsByRound).sort((a, b) => {
    const indexA = roundOrder.indexOf(a);
    const indexB = roundOrder.indexOf(b);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    // If not in predefined order, sort alphabetically (less significant first)
    return a.localeCompare(b);
  });

  return sortedRounds.map((round) => ({
    round,
    matches: bracketsByRound[round],
  }));
}

/**
 * Organiza rounds de Playoffs
 */
function organizePlayoffsRounds(fixtures) {
  return buildPlayoffsBracket(fixtures);
}

/**
 * Organiza fixtures de Playoffs por round
 */
function organizePlayoffsFixturesByRound(fixtures) {
  const fixturesByRound = {};

  fixtures.forEach((fixture) => {
    // Try multiple possible fields for round/section name
    const section =
      fixture.section ||
      fixture.round_name ||
      fixture.roundName ||
      fixture.round ||
      fixture._stageInfo?.section ||
      "Unknown";

    // Normalize section name (handle variations)
    let normalizedSection = section;
    const sectionLower = section.toLowerCase();

    if (sectionLower.includes("quarter")) {
      normalizedSection = "Quarter-finals";
    } else if (sectionLower.includes("semi")) {
      normalizedSection = "Semi-finals";
    } else if (
      sectionLower.includes("final") &&
      !sectionLower.includes("grand") &&
      !sectionLower.includes("3rd") &&
      !sectionLower.includes("third")
    ) {
      normalizedSection = "Final";
    } else if (sectionLower.includes("grand")) {
      normalizedSection = "Grand Final";
    } else if (sectionLower.includes("3rd") || sectionLower.includes("third")) {
      normalizedSection = "3rd Place Decider";
    }

    if (!fixturesByRound[normalizedSection]) {
      fixturesByRound[normalizedSection] = [];
    }
    fixturesByRound[normalizedSection].push(fixture);
  });

  return fixturesByRound;
}

/**
 * Detecta el tipo de Playoffs (Single Elimination, Double Elimination, etc.)
 */
function detectPlayoffsType(fixtures) {
  // Por ahora, asumimos Single Elimination por defecto
  // Se puede mejorar detectando si hay upper/lower bracket
  const hasUpperBracket = fixtures.some(
    (f) =>
      f.section &&
      (f.section.toLowerCase().includes("upper") ||
        f.section.toLowerCase().includes("winner"))
  );
  const hasLowerBracket = fixtures.some(
    (f) =>
      f.section &&
      (f.section.toLowerCase().includes("lower") ||
        f.section.toLowerCase().includes("loser"))
  );

  if (hasUpperBracket && hasLowerBracket) {
    return "DOUBLE_ELIMINATION";
  }

  return "SINGLE_ELIMINATION";
}

/**
 * Organiza rounds de GSL
 */
function organizeGSLRounds(fixtures) {
  // Similar a Swiss pero con estructura específica de GSL
  return organizeSwissRounds(fixtures);
}

/**
 * Detecta rounds basándose en la estructura del bracket cuando no hay información de section
 */
function detectRoundsByStructure(fixtures) {
  const rounds = {};
  const totalFixtures = fixtures.length;

  // Ordenar fixtures por timestamp
  const sortedFixtures = [...fixtures].sort((a, b) => {
    const timeA = a.scheduledStartTime || a.startTime || 0;
    const timeB = b.scheduledStartTime || b.startTime || 0;
    return timeA - timeB;
  });

  // Detectar estructura típica de playoffs:
  // - 8 fixtures = Quarter-finals (8 equipos)
  // - 4 fixtures = Semi-finals (4 equipos)
  // - 2 fixtures = Final + 3rd Place (o solo Final)
  // - 1 fixture = Grand Final

  // Intentar detectar por número de fixtures y posición
  if (totalFixtures >= 8) {
    // Probablemente Quarter-finals
    const quarterCount = Math.min(8, Math.floor(totalFixtures * 0.4));
    for (let i = 0; i < quarterCount; i++) {
      if (!rounds["Quarter-finals"]) rounds["Quarter-finals"] = [];
      rounds["Quarter-finals"].push(sortedFixtures[i]);
    }
  }

  if (totalFixtures >= 4) {
    // Probablemente Semi-finals
    const semiStart = Math.floor(totalFixtures * 0.3);
    const semiEnd = Math.floor(totalFixtures * 0.6);
    for (let i = semiStart; i < semiEnd && i < sortedFixtures.length; i++) {
      if (!rounds["Semi-finals"]) rounds["Semi-finals"] = [];
      rounds["Semi-finals"].push(sortedFixtures[i]);
    }
  }

  // Los últimos fixtures probablemente son Final/3rd Place
  const finalStart = Math.floor(totalFixtures * 0.7);
  for (let i = finalStart; i < sortedFixtures.length; i++) {
    const fixture = sortedFixtures[i];
    // Intentar detectar si es 3rd Place o Final basándose en participantes
    // Por ahora, asumimos que los últimos 2 son Final y 3rd Place
    if (i === sortedFixtures.length - 1) {
      if (!rounds["Grand Final"]) rounds["Grand Final"] = [];
      rounds["Grand Final"].push(fixture);
    } else if (i === sortedFixtures.length - 2) {
      if (!rounds["3rd Place Decider"]) rounds["3rd Place Decider"] = [];
      rounds["3rd Place Decider"].push(fixture);
    } else {
      if (!rounds["Final"]) rounds["Final"] = [];
      rounds["Final"].push(fixture);
    }
  }

  return rounds;
}

/**
 * Calcula standings para GSL
 */
function calculateGSLStandings(fixtures) {
  // Similar a Swiss pero con reglas específicas de GSL
  return calculateSwissStandings(fixtures);
}

/**
 * Organiza rounds genéricos
 */
function organizeGenericRounds(fixtures) {
  const rounds = {};

  fixtures.forEach((fixture) => {
    const timestamp = fixture.scheduledStartTime || fixture.startTime || 0;
    const date =
      timestamp > 0
        ? new Date(timestamp > 1893456000 ? timestamp : timestamp * 1000)
            .toISOString()
            .split("T")[0]
        : "Unknown";

    if (!rounds[date]) {
      rounds[date] = [];
    }
    rounds[date].push(fixture);
  });

  return Object.keys(rounds)
    .sort()
    .map((date) => ({
      name: `Round ${date}`,
      fixtures: rounds[date],
    }));
}
