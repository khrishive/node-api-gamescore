import { getDbBySport } from '../utils/dbUtils.js';

/**
 * Obtiene las estadísticas completas de un fixture, o filtradas por mapa si se pasa mapId.
 * Si mapId es null/undefined, devuelve el global del fixture.
 */
export async function getFixtureStats(fixtureId, mapId = null, sport = 'cs2') {
  const db = getDbBySport(sport);

  // 1. Equipos participantes
  const [fixtureRows] = await db.query(`
    SELECT 
      id,
      participants0_id, participants0_name, participants0_score,
      participants1_id, participants1_name, participants1_score
    FROM fixtures
    WHERE id = ?
  `, [fixtureId]);
  if (fixtureRows.length === 0) return null;
  const fixture = fixtureRows[0];

  const teams = [
    {
      id: fixture.participants0_id,
      name: fixture.participants0_name,
      score: fixture.participants0_score
    },
    {
      id: fixture.participants1_id,
      name: fixture.participants1_name,
      score: fixture.participants1_score
    }
  ];

  // 2. Mapas jugados en el fixture
  let mapsQuery = `
    SELECT id, name, map_number
    FROM maps
    WHERE fixture_id = ?
  `;
  const mapsParams = [fixtureId];
  if (mapId) {
    mapsQuery += ' AND id = ?';
    mapsParams.push(mapId);
  }
  mapsQuery += ' ORDER BY map_number ASC';
  const [maps] = await db.query(mapsQuery, mapsParams);

  // 3. Filtrar rounds y scores SOLO por el mapa si aplica
  let mapScoresQuery = `
    SELECT m.id as map_id, r.winner_team_id as team_id, COUNT(r.id) as rounds_won
    FROM maps m
    JOIN rounds r ON r.map_id = m.id
    WHERE m.fixture_id = ?
  `;
  const mapScoresParams = [fixtureId];
  if (mapId) {
    mapScoresQuery += ' AND m.id = ?';
    mapScoresParams.push(mapId);
  }
  mapScoresQuery += ' GROUP BY m.id, r.winner_team_id ORDER BY m.map_number, r.winner_team_id';
  const [mapScores] = await db.query(mapScoresQuery, mapScoresParams);

  // 4. Obtener IDs de jugadores
  const [participantPlayers] = await db.query(`
    SELECT id, 
      player_id_0, player_id_1, player_id_2, player_id_3, player_id_4
    FROM participants
    WHERE id IN (?, ?)
  `, [fixture.participants0_id, fixture.participants1_id]);
  const playerIds = [];
  participantPlayers.forEach(row => {
    for (let i = 0; i < 5; i++) {
      const pId = row[`player_id_${i}`];
      if (pId) playerIds.push(pId);
    }
  });

  // 5. Stats por jugador (usando subconsultas, SIN JOINs cruzados)
  let playerStats = [];
  if (playerIds.length > 0) {
    const placeholders = playerIds.map(() => '?').join(',');
    // Construir los WHERE para filtrar por fixture/map
    const killsWhere = mapId
      ? 'fixture_id = ? AND map_id = ? AND killer_id = p.id'
      : 'fixture_id = ? AND killer_id = p.id';
    const deathsWhere = mapId
      ? 'fixture_id = ? AND map_id = ? AND victim_id = p.id'
      : 'fixture_id = ? AND victim_id = p.id';
    const assistsWhere = mapId
      ? 'fixture_id = ? AND map_id = ? AND assister_id = p.id'
      : 'fixture_id = ? AND assister_id = p.id';
    const hsWhere = mapId
      ? 'fixture_id = ? AND map_id = ? AND killer_id = p.id AND headshot = 1'
      : 'fixture_id = ? AND killer_id = p.id AND headshot = 1';

    const params = mapId
      ? [fixtureId, mapId, fixtureId, mapId, fixtureId, mapId, fixtureId, mapId, ...playerIds]
      : [fixtureId, fixtureId, fixtureId, fixtureId, ...playerIds];

    const playerStatsQuery = `
      SELECT 
        p.id as player_id,
        p.nickname as player_nickname,
        p.first_name,
        p.last_name,
        p.team_id,
        (SELECT COUNT(*) FROM kills k WHERE ${killsWhere}) as kills,
        (SELECT COUNT(*) FROM kills d WHERE ${deathsWhere}) as deaths,
        (SELECT COUNT(*) FROM assists a WHERE ${assistsWhere}) as assists,
        (SELECT COUNT(*) FROM kills h WHERE ${hsWhere}) as headshots
      FROM player p
      WHERE p.id IN (${placeholders})
      ORDER BY p.team_id, p.id
    `;

    playerStats = (await db.query(playerStatsQuery, params))[0];
  }

  // 6. Stats agregadas por equipo
  const teamStats = teams.map(team => {
    const players = playerStats.filter(p => p.team_id === team.id);
    return {
      ...team,
      players: players.map(p => ({
        id: p.player_id,
        nickname: p.player_nickname,
        first_name: p.first_name,
        last_name: p.last_name,
        kills: Number(p.kills) || 0,
        deaths: Number(p.deaths) || 0,
        assists: Number(p.assists) || 0,
        headshots: Number(p.headshots) || 0,
        plus_minus: (Number(p.kills) || 0) - (Number(p.deaths) || 0)
      })),
      totalKills: players.reduce((sum, p) => sum + (Number(p.kills) || 0), 0),
      totalDeaths: players.reduce((sum, p) => sum + (Number(p.deaths) || 0), 0),
      totalAssists: players.reduce((sum, p) => sum + (Number(p.assists) || 0), 0),
      totalHeadshots: players.reduce((sum, p) => sum + (Number(p.headshots) || 0), 0)
    };
  });

  // 7. Marcador por mapa para cada equipo (solo retorna el mapa filtrado si aplica)
  const mapBreakdown = maps.map(map => {
    const scores = mapScores.filter(ms => ms.map_id === map.id);
    return {
      mapId: map.id,
      mapName: map.name,
      mapNumber: map.map_number,
      scores: teams.map(team => {
        const s = scores.find(sc => String(sc.team_id) === String(team.id));
        return {
          team_id: team.id,
          team_name: team.name,
          rounds_won: s ? s.rounds_won : 0
        };
      })
    };
  });

  return {
    fixtureId,
    mapId: mapId || null,
    teams: teamStats,
    maps: mapBreakdown
  };
}
