import { dbCS2, dbLOL } from '../db.js';

function getDbBySport(sport = 'cs2') {
  if (sport === 'lol') return dbLOL;
  return dbCS2;
}

export async function getFixtureAssists(fixtureId, sport = 'cs2') {
  const db = getDbBySport(sport);

  // 1. Obtener equipos participantes
  const [fixtureRows] = await db.query(`
    SELECT 
      id,
      participants0_id, participants0_name,
      participants1_id, participants1_name
    FROM fixtures
    WHERE id = ?
  `, [fixtureId]);

  if (fixtureRows.length === 0) return null;
  const fixture = fixtureRows[0];

  // 2. Obtener todos los assists del fixture
  const [assists] = await db.query(`
    SELECT 
      a.id,
      a.fixture_id,
      a.round_id,
      a.map_id,
      a.assister_id,
      p.nickname AS assister_nickname,
      a.assister_team_id,
      a.victim_id,
      pv.nickname AS victim_nickname,
      a.victim_team_id,
      a.kill_id,
      a.type,
      a.timestamp
    FROM assists a
    LEFT JOIN player p ON a.assister_id = p.id
    LEFT JOIN player pv ON a.victim_id = pv.id
    WHERE a.fixture_id = ?
    ORDER BY a.timestamp ASC
  `, [fixtureId]);

  // 3. Calcular assists por equipo y jugador
  const teams = [
    {
      id: fixture.participants0_id,
      name: fixture.participants0_name,
    },
    {
      id: fixture.participants1_id,
      name: fixture.participants1_name,
    }
  ];

  const assistsStats = teams.map(team => {
    // Filtrar assists donde el asistente sea de este equipo
    const teamAssists = assists.filter(a => a.assister_team_id === team.id);

    // Agrupar por jugador asistente
    const playersMap = {};
    teamAssists.forEach(a => {
      if (!playersMap[a.assister_id]) {
        playersMap[a.assister_id] = {
          id: a.assister_id,
          nickname: a.assister_nickname,
          assists: 0,
          flash_assists: 0,
        };
      }
      if (a.type === "flash_assist") {
        playersMap[a.assister_id].flash_assists += 1;
      } else {
        playersMap[a.assister_id].assists += 1;
      }
    });

    return {
      ...team,
      totalAssists: teamAssists.length,
      players: Object.values(playersMap)
    };
  });

  return {
    fixtureId,
    teams,
    assists,         // lista completa como hasta ahora
    assistsStats     // nuevo bloque con resumen por equipo y jugador
  };
}
