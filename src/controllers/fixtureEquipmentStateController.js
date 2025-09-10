import { getDbBySport } from '../utils/dbUtils.js';

export async function getFixtureEquipmentState(fixtureId, sport = 'cs2') {
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

  // 2. Obtener todo el equipmentState del fixture
  const [equipment] = await db.query(`
  SELECT 
    e.id,
    e.fixture_id,
    e.round_id,
    e.map_id,
    e.timestamp,
    e.player_id,
    p.nickname AS player_nickname,
    e.team_id,
    t.name AS team_name,
    e.primary_weapon,
    e.kevlar,
    e.helmet,
    e.defuse_kit,
    e.money
  FROM equipment_state e
  LEFT JOIN player p ON e.player_id = p.id
  LEFT JOIN participants t ON e.team_id = t.id
  WHERE e.fixture_id = ?
  ORDER BY e.round_id, e.timestamp, e.player_id
`, [fixtureId]);

  // 3. Calcular resumen por equipo y jugador (ejemplo: cantidad de veces cada arma, total de dinero, etc.)
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

  const equipmentStats = teams.map(team => {
    // Filtrar equipment donde el jugador sea de este equipo
    const teamEquipment = equipment.filter(e => e.team_id === team.id);

    // Agrupar por jugador
    const playersMap = {};
    teamEquipment.forEach(e => {
      if (!playersMap[e.player_id]) {
        playersMap[e.player_id] = {
          id: e.player_id,
          nickname: e.player_nickname,
          entries: 0,
          total_money: 0,
          weapons: {}, // conteo de armas
          armor: 0,
          helmets: 0,
          defuse_kits: 0,
          grenades: 0
        };
      }
      playersMap[e.player_id].entries += 1;
      playersMap[e.player_id].total_money += Number(e.money) || 0;
      playersMap[e.player_id].armor += Number(e.armor) || 0;
      if (e.has_helmet) playersMap[e.player_id].helmets += 1;
      if (e.has_defuse_kit) playersMap[e.player_id].defuse_kits += 1;
      playersMap[e.player_id].grenades += Number(e.grenades) || 0;
      // Conteo de armas
      if (e.weapon) {
        if (!playersMap[e.player_id].weapons[e.weapon]) {
          playersMap[e.player_id].weapons[e.weapon] = 0;
        }
        playersMap[e.player_id].weapons[e.weapon]++;
      }
    });

    return {
      ...team,
      players: Object.values(playersMap)
    };
  });

  return {
    fixtureId,
    teams,
    equipmentState: equipment, // lista raw como en assists
    equipmentStats             // resumen por equipo y jugador
  };
}
