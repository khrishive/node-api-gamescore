import { getDbBySport } from '../utils/dbUtils.js';

export async function updateFixtureFields(game, requestBody) {
  const db = await getDbBySport(game);

  const {
    external_id,
    participants0_id,
    participants0_score,
    participants1_id,
    participants1_score,
    status,
  } = requestBody;

  if (!external_id) {
    throw new Error('El campo external_id es obligatorio');
  }

  // Buscar fixture por external_id
  const [rows] = await db.query(
    `
      SELECT 
        id,
        participants0_id,
        participants1_id,
        sport_alias
      FROM fixtures 
      WHERE external_id = ? 
      LIMIT 1
    `,
    [external_id]
  );

  if (!rows.length) {
    throw new Error('No se encontró un fixture con ese external_id');
  }

  const fixture = rows[0];
  const id = fixture.id;
  const sport_alias = fixture.sport_alias;
  const current_p0_id = fixture.participants0_id?.toString() ?? null;
  const current_p1_id = fixture.participants1_id?.toString() ?? null;

  // Campos a actualizar
  const updates = {};
  
  // ✅ Actualizar scores según coincidencia de IDs
  if (participants0_id === current_p0_id) {
    if (participants0_score !== '') updates.participants0_score = participants0_score;
  } else if (participants0_id === current_p1_id) {
    if (participants0_score !== '') updates.participants1_score = participants0_score;
  }

  if (participants1_id === current_p0_id) {
    if (participants1_score !== '') updates.participants0_score = participants1_score;
  } else if (participants1_id === current_p1_id) {
    if (participants1_score !== '') updates.participants1_score = participants1_score;
  }

  // ✅ Actualizar status si está permitido
  const allowed_status = ['Started', 'Ended'];
  if (status && allowed_status.includes(status)) {
    updates.status = status;
  }

  // 🔄 Si hay algo que actualizar, ejecuta el UPDATE
  if (Object.keys(updates).length > 0) {
    const setClause = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(', ');

    const values = [...Object.values(updates), id];

    await db.query(`UPDATE fixtures SET ${setClause} WHERE id = ?`, values);
  }

  return {
    success: true,
    fixture_id: id,
    message: 'Scores y estado actualizados correctamente (IDs validados)',
    updates,
  };
}
