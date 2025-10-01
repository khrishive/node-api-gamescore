import { getAndSaveCompetitions } from "./insertCompetitions.js";
import {actualizarParticipantes} from "./updateNumberOfParticipantsInCompetitions.js";
import {processFixtures} from "./insertOnlyFixtures.js";
import { main } from "./insertTeams.js";
import { processTeams } from "./insertTeamsAndPlayers.js";

async function runAll() {
    console.log('🚀 Starting DB population...');
    await getAndSaveCompetitions();
    await actualizarParticipantes();
    await processFixtures();
    await main();
    await processTeams();
}

runAll()
    .then(() => console.log('✅ All processes completed.'))
    .catch(err => {
        console.error('❌ Execution error:', err);
        process.exit(1);
    });