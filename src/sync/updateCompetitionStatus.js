import { db } from '../db.js'; // Asegúrate de importar tu conexión a la base de datos

async function updateCompetitionStatus() {
  const today = Date.now(); // fecha actual en milisegundos

  try {
    // upcoming → todavía no inicia
    await db.execute(
      `UPDATE competitions 
       SET status = 'upcoming' 
       WHERE start_date > ?`,
      [today]
    );

    // ended → ya terminó
    await db.execute(
      `UPDATE competitions 
       SET status = 'ended' 
       WHERE end_date <= ?`,
      [today]
    );

    // started → ya inició pero aún no termina
    await db.execute(
      `UPDATE competitions 
       SET status = 'started' 
       WHERE start_date <= ? AND end_date > ?`,
      [today, today]
    );

    console.log("✅ Status actualizado correctamente.");
  } catch (error) {
    console.error("❌ Error al actualizar status:", error.message);
  } finally {
    // importante: cerrar pool al terminar si se corre como script suelto
    await db.end();
  }
}

// Ejecutar
updateCompetitionStatus();