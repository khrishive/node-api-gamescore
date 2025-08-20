import { db } from '../db.js';
import { getMapBreakdownByTeam } from './mapBreakdownDataProcess.js';

export async function saveOrUpdateMapBreakdown(teamId, competitionId) {
  try {
    // 1️⃣ Obtener breakdown del equipo
    const mapData = await getMapBreakdownByTeam(teamId, 100, competitionId);
    const { totalFixtures, breakdown } = mapData;

    // 2️⃣ Verificar si ya existe la combinación teamId + competitionId
    const [[existing]] = await db.execute(
      `SELECT id FROM team_stats WHERE team_id = ? AND competition_id = ?`,
      [teamId, competitionId]
    );

    let teamStatsId;

    if (existing) {
      // 🔄 Actualizar
      teamStatsId = existing.id;
      await db.execute(
        `UPDATE team_stats 
         SET total_fixtures = ?, updated_at = NOW() 
         WHERE id = ?`,
        [totalFixtures, teamStatsId]
      );

      // 🔄 Eliminar breakdown viejo para volver a insertar
      await db.execute(
        `DELETE FROM team_stats_breakdown WHERE team_stats_id = ?`,
        [teamStatsId]
      );
    } else {
      // ➕ Insertar nuevo
      const [result] = await db.execute(
        `INSERT INTO team_stats (team_id, competition_id, total_fixtures)
         VALUES (?, ?, ?)`,
        [teamId, competitionId, totalFixtures]
      );
      teamStatsId = result.insertId;
    }

    // 3️⃣ Insertar los breakdowns
    const insertValues = breakdown.map(b => [
      teamStatsId,
      b.map,
      b.played,
      b.w,
      b.l,
      parseFloat(b.win_pct.replace('%', '')) // convertir a número
    ]);

    if (insertValues.length > 0) {
      await db.query(
        `INSERT INTO team_stats_breakdown 
        (team_stats_id, map_name, played, w, l, win_pct) VALUES ?`,
        [insertValues]
      );
    }

    console.log(`✅ Map breakdown guardado o actualizado para team ${teamId}, competition ${competitionId}`);
  } catch (err) {
    console.error('❌ Error guardando/actualizando map breakdown:', err);
  }
}
