// w.js - Debug script para verificar fixtures de una competición específica
import axios from 'axios';
import dotenv from 'dotenv';
import { getDbBySport } from './src/utils/dbUtils.js';

dotenv.config();

const BASE_API_URL = process.env.GAME_SCORE_API;
const AUTH_TOKEN = `Bearer ${process.env.GAME_SCORE_APIKEY}`;
const COMPETITION_ID = 33063; // European Pro League Series 4
const SPORT = 'cs2';

const safeText = (value) =>
  value && String(value).trim().length > 0
    ? value
    : 'Waiting for information';

async function testInsertFixtures() {
  console.log('🔍 DEBUG: Intentando insertar fixtures de competición 33063\n');

  const db = getDbBySport(SPORT);

  // 1️⃣ Obtener fixtures de la API
  console.log('1️⃣ Obteniendo fixtures de la API...');
  const response = await axios.get(
    `${BASE_API_URL}/competitions/${COMPETITION_ID}/fixtures`,
    {
      headers: { Authorization: AUTH_TOKEN },
      params: { page: 1, pageCount: 50 }
    }
  );

  const fixtures = response.data?.fixtures || [];
  console.log(`✅ ${fixtures.length} fixtures obtenidos\n`);

  // 2️⃣ Intentar insertar el primer fixture con detalles
  console.log('2️⃣ Intentando insertar el primer fixture...');
  const firstFixture = fixtures[0];
  
  console.log('📋 Datos del fixture:');
  console.log(JSON.stringify(firstFixture, null, 2));

  const query = `
    INSERT INTO fixtures (
      id,
      competition_id,
      competition_name,
      end_time,
      scheduled_start_time,
      start_time,
      sport_alias,
      sport_name,
      status,
      tie,
      winner_id,
      participants0_id,
      participants0_name,
      participants0_score,
      participants1_id,
      participants1_name,
      participants1_score,
      hs_description,
      rr_description
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      competition_id = VALUES(competition_id),
      competition_name = VALUES(competition_name),
      end_time = VALUES(end_time),
      scheduled_start_time = VALUES(scheduled_start_time),
      start_time = VALUES(start_time),
      sport_alias = VALUES(sport_alias),
      sport_name = VALUES(sport_name),
      status = VALUES(status),
      tie = VALUES(tie),
      winner_id = VALUES(winner_id),
      participants0_id = VALUES(participants0_id),
      participants0_name = VALUES(participants0_name),
      participants0_score = VALUES(participants0_score),
      participants1_id = VALUES(participants1_id),
      participants1_name = VALUES(participants1_name),
      participants1_score = VALUES(participants1_score),
      hs_description = VALUES(hs_description),
      rr_description = VALUES(rr_description)
  `;

  const values = [
    firstFixture.id,
    firstFixture.competition.id,
    firstFixture.competition.name,
    firstFixture.endTime,
    firstFixture.scheduledStartTime,
    firstFixture.startTime,
    firstFixture.sport.alias,
    firstFixture.sport.name,
    firstFixture.status,
    firstFixture.tie,
    firstFixture.winnerId,
    firstFixture.participants[0]?.id ?? null,
    firstFixture.participants[0]?.name ?? null,
    firstFixture.participants[0]?.score ?? null,
    firstFixture.participants[1]?.id ?? null,
    firstFixture.participants[1]?.name ?? null,
    firstFixture.participants[1]?.score ?? null,
    safeText(firstFixture.hs_description),
    safeText(firstFixture.rr_description)
  ];

  console.log('\n📊 Valores a insertar:');
  console.log(values);

  try {
    const [result] = await db.execute(query, values);
    console.log('\n✅ Fixture insertado exitosamente!');
    console.log('Result:', result);

    // Verificar
    const [check] = await db.execute('SELECT * FROM fixtures WHERE id = ?', [firstFixture.id]);
    console.log('\n📦 Fixture en DB:', check[0]);

  } catch (error) {
    console.log('\n❌ Error al insertar fixture:');
    console.log('Error message:', error.message);
    console.log('Error code:', error.code);
    console.log('SQL State:', error.sqlState);
    console.log('SQL Message:', error.sqlMessage);
  }
}

testInsertFixtures().catch(err => {
  console.error('💥 Error fatal:', err);
  process.exit(1);
});
