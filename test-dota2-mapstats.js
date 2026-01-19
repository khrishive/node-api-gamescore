import { dota2MapStats } from './src/controllers/controllerMapResultsDota2.js';

async function test() {
  console.log('🧪 Testing dota2MapStats for fixture 979590...\n');
  
  const result = await dota2MapStats(979590);
  
  console.log('\n📊 Resultado:');
  console.log(JSON.stringify(result, null, 2));
  
  // Verificaciones
  if (result && result['1']) {
    const map1Team1Picks = result['1'].teams['194743'].picks;
    const map1Team2Picks = result['1'].teams['244518'].picks;
    
    console.log('\n✅ Verificación Mapa 1:');
    console.log(`  Team 194743 picks: ${map1Team1Picks.length} picks`);
    console.log(`  Team 244518 picks: ${map1Team2Picks.length} picks`);
    console.log(`  Team 194743 kills: ${result['1'].teams['194743'].kills}`);
    console.log(`  Team 194743 gold: ${result['1'].teams['194743'].gold}`);
  }
  
  if (result && result['2']) {
    const map2Team1Picks = result['2'].teams['194743'].picks;
    const map2Team2Picks = result['2'].teams['244518'].picks;
    
    console.log('\n✅ Verificación Mapa 2:');
    console.log(`  Team 194743 picks: ${map2Team1Picks.length} picks`);
    console.log(`  Team 244518 picks: ${map2Team2Picks.length} picks`);
    console.log(`  Team 194743 kills: ${result['2'].teams['194743'].kills}`);
    console.log(`  Team 194743 gold: ${result['2'].teams['194743'].gold}`);
  }
  
  process.exit(0);
}

test().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
