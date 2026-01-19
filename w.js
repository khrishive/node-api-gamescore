// w.js - Debug script para verificar fixtures de una competición específica
import axios from 'axios';
import dotenv from 'dotenv';
import { getDbBySport } from './src/utils/dbUtils.js';

dotenv.config();

const BASE_API_URL = process.env.GAME_SCORE_API;
const AUTH_TOKEN = `Bearer ${process.env.GAME_SCORE_APIKEY}`;
const COMPETITION_ID = 33063; // European Pro League Series 4
const SPORT = 'cs2';

async function debugCompetition() {
  console.log('🔍 DEBUG: Verificando competición 33063\n');

  // 1️⃣ Verificar si la competición está en la DB
  console.log('1️⃣ Verificando competición en la base de datos...');
  const db = getDbBySport(SPORT);
  
  const [competitions] = await db.execute(
    `SELECT id, name, status, fixture_count, sport_alias 
     FROM competitions 
     WHERE id = ?`,
    [COMPETITION_ID]
  );

  if (competitions.length === 0) {
    console.log('❌ La competición NO existe en la base de datos');
    return;
  }

  const comp = competitions[0];
  console.log('✅ Competición encontrada:', comp);

  // 2️⃣ Verificar si cumple las condiciones del script
  console.log('\n2️⃣ Verificando condiciones del script insertOnlyOtherFixtures...');
  const [filtered] = await db.execute(
    `SELECT id, name, status, fixture_count 
     FROM competitions 
     WHERE id = ? 
       AND fixture_count > 0 
       AND status IN ('upcoming', 'started', 'ended')
       AND sport_alias = ?`,
    [COMPETITION_ID, SPORT]
  );

  if (filtered.length === 0) {
    console.log('❌ La competición NO cumple las condiciones:');
    console.log(`   - fixture_count > 0: ${comp.fixture_count > 0 ? '✅' : '❌'}`);
    console.log(`   - status in ('upcoming', 'started', 'ended'): ${['upcoming', 'started', 'ended'].includes(comp.status) ? '✅' : '❌'}`);
    console.log(`   - sport_alias = '${SPORT}': ${comp.sport_alias === SPORT ? '✅' : '❌'}`);
    return;
  }

  console.log('✅ La competición cumple todas las condiciones');

  // 3️⃣ Hacer petición a la API
  console.log('\n3️⃣ Consultando fixtures desde la API...');
  console.log(`URL: ${BASE_API_URL}/competitions/${COMPETITION_ID}/fixtures`);

  try {
    const response = await axios.get(
      `${BASE_API_URL}/competitions/${COMPETITION_ID}/fixtures`,
      {
        headers: { Authorization: AUTH_TOKEN },
        params: { page: 1, pageCount: 50 }
      }
    );

    const fixtures = response.data?.fixtures || [];
    
    console.log(`✅ API respondió exitosamente`);
    console.log(`📊 Fixtures recibidos: ${fixtures.length}`);

    if (fixtures.length === 0) {
      console.log('\n⚠️  La API devuelve 0 fixtures para esta competición');
      console.log('   Posibles causas:');
      console.log('   - Los fixtures aún no están disponibles en la API');
      console.log('   - La competición no tiene fixtures programados aún');
      console.log('   - fixture_count en la DB está desactualizado');
    } else {
      console.log('\n📋 Primeros 3 fixtures:');
      fixtures.slice(0, 3).forEach((f, i) => {
        console.log(`\n  ${i + 1}. ID: ${f.id}`);
        console.log(`     Status: ${f.status}`);
        console.log(`     ${f.participants[0]?.name || 'TBD'} vs ${f.participants[1]?.name || 'TBD'}`);
        console.log(`     Start: ${f.scheduledStartTime ? new Date(f.scheduledStartTime).toISOString() : 'N/A'}`);
      });

      // 4️⃣ Verificar si están en la DB
      console.log('\n4️⃣ Verificando fixtures en la base de datos...');
      const fixtureIds = fixtures.map(f => f.id);
      const placeholders = fixtureIds.map(() => '?').join(',');
      
      const [dbFixtures] = await db.execute(
        `SELECT id FROM fixtures WHERE id IN (${placeholders})`,
        fixtureIds
      );

      console.log(`📦 Fixtures en DB: ${dbFixtures.length}/${fixtures.length}`);
      
      if (dbFixtures.length === 0) {
        console.log('⚠️  NINGÚN fixture está guardado en la base de datos');
      } else if (dbFixtures.length < fixtures.length) {
        console.log('⚠️  Algunos fixtures NO están en la base de datos');
      } else {
        console.log('✅ Todos los fixtures están en la base de datos');
      }
    }

  } catch (error) {
    console.log('❌ Error al consultar la API:');
    console.log(`   Status: ${error.response?.status || 'N/A'}`);
    console.log(`   Message: ${error.message}`);
    console.log(`   Response: ${JSON.stringify(error.response?.data || {}, null, 2)}`);
  }

  console.log('\n✅ Debug completado');
}

debugCompetition().catch(err => {
  console.error('💥 Error fatal:', err);
  process.exit(1);
});
