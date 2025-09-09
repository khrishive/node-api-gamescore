import { getAndSaveCompetitions } from "./insertCompetitions.js";
import { processFixtures } from "./insertOnlyFixtures.js";
import { main as insertTeams } from "./insertTeams.js";
import { processTeams as insertTeamsAndPlayers } from "./insertTeamsAndPlayers.js";
import { actualizarParticipantes as updateNumberOfParticipantsInCompetitions } from "./updateNumberOfParticipantsInCompetitions.js";
import { updateTournamentDescriptionsGeneralAI } from "./insertCompetitionDescriptionsGeneralAI.js"; // <-- updated import

// Export runAll so it can be used by your endpoint
export async function runAll(sport = 'cs2') {
    console.log('🚀 Iniciando población completa de DB...');
    await getAndSaveCompetitions(sport);
    await processFixtures(sport);
    await insertTeams(sport);
    await insertTeamsAndPlayers(sport);
    await updateNumberOfParticipantsInCompetitions(sport);
    await updateTournamentDescriptionsGeneralAI(sport); // <-- updated function call
}

// Optional: keep CLI usage for direct script execution
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
    runAll(process.argv[2])
        .then(() => console.log('✅ Todos los procesos completados.'))
        .catch(err => {
            console.error('❌ Error en la ejecución:', err);
            process.exit(1);
        });
}