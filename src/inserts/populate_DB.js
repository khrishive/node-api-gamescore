import { getAndSaveCompetitions } from "./insertCompetitions.js";
import {actualizarParticipantes} from "./insertNoteams.js";
import {processFixtures} from "./insertOnlyFixtures.js";
import { main } from "./insertTeams.js";
import { processTeams } from "./insertTeamsAndPlayers.js";

async function runAll() {
    console.log('🚀 Iniciando población de DB...');
    await getAndSaveCompetitions();
    await actualizarParticipantes();
    await processFixtures();
    await main();
    await processTeams();
}

runAll()
    .then(() => console.log('✅ Todos los procesos completados.'))
    .catch(err => {
        console.error('❌ Error en la ejecución:', err);
        process.exit(1);
    });