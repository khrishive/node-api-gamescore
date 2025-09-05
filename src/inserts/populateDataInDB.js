import { getAndSaveCompetitions } from "./insertCompetitions.js";
import { processFixtures } from "./insertOnlyFixtures.js";
import { main as insertTeams } from "./insertTeams.js";
import { processTeams as insertTeamsAndPlayers } from "./insertTeamsAndPlayers.js";
import { actualizarParticipantes as updateNumberOfParticipantsInCompetitions } from "./updateNumberOfParticipantsInCompetitions.js";
import { updateTournamentDescriptions } from "./insertCompetitionDescriptions.js";

async function runAll() {
    console.log('🚀 Iniciando población completa de DB...');
    await getAndSaveCompetitions();
    await processFixtures();
    await insertTeams();
    await insertTeamsAndPlayers();
    await updateNumberOfParticipantsInCompetitions();
    await updateTournamentDescriptions();
}

runAll()
    .then(() => console.log('✅ Todos los procesos completados.'))
    .catch(err => {
        console.error('❌ Error en la ejecución:', err);
        process.exit(1);
    });