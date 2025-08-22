import { db } from '../db.js'; // Asegúrate de importar tu conexión a la base de datos

async function updateCompetitionStatus() {
  try {
    // Fecha actual en segundos (UNIX timestamp * 1000 porque tus campos están en milisegundos)
    const today = Date.now();

    // 1️⃣ Actualizar upcoming → started
    const [upcomingToStarted] = await db.query(
      `UPDATE competitions 
       SET status = 'started' 
       WHERE status = 'upcoming' 
         AND start_date <= ?`,
      [today]
    );

    console.log(`✅ Competitions actualizadas a started: ${upcomingToStarted.affectedRows}`);

    // 2️⃣ Actualizar started → ended
    const [startedToEnded] = await db.query(
      `UPDATE competitions 
       SET status = 'ended' 
       WHERE status = 'started' 
         AND end_date <= ?`,
      [today]
    );

    console.log(`✅ Competitions actualizadas a ended: ${startedToEnded.affectedRows}`);

  } catch (err) {
    console.error('❌ Error al actualizar competiciones:', err);
  } finally {
    db.end(); // cerrar conexión cuando termine
  }
}

updateCompetitionStatus();
