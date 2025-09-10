import { createTables } from "./createTables.js"; // <-- newly added import
import { getAndSaveCompetitions } from "./insertCompetitions.js";
import { processFixtures } from "./insertOnlyFixtures.js";
import { main as insertTeams } from "./insertTeams.js";
import { processTeams as insertTeamsAndPlayers } from "./insertTeamsAndPlayers.js";
import { actualizarParticipantes as updateNumberOfParticipantsInCompetitions } from "./updateNumberOfParticipantsInCompetitions.js";
import { updateTournamentDescriptionsGeneralAI } from "./insertCompetitionDescriptionsGeneralAI.js"; // <-- updated import

// Export runAll so it can be used by your endpoint
export async function runAll(sport = 'cs2') {
    console.log('🚀 Iniciando población completa de DB...');
    await createTables(sport); // <-- run table creation first
    await getAndSaveCompetitions(sport);
    await processFixtures(sport);
    await insertTeams(sport);
    await insertTeamsAndPlayers(sport);
    await updateNumberOfParticipantsInCompetitions(sport);
    await updateTournamentDescriptionsGeneralAI(sport); // <-- updated function call
}

// Optional: keep CLI usage for direct script execution
import { parentPort, workerData } from 'worker_threads';

async function main(sport) {
    await runAll(sport);
}

if (parentPort) {
    main(workerData.sport).then(() => {
        parentPort.postMessage('Todos los procesos completados.');
    });
} else {
    main(process.argv[2]).then(() => {
        console.log('Todos los procesos completados.');
    });
}