import {runAllInsertCompetitions} from './src/scripts/runAllInsertCompetitions.js';
import { runAllOtherFixtures } from './src/scripts/runAllOtherFixtures.js';
import { runAllInsertMissingTeams } from './src/scripts/runAllInsertMissingTeams.js';
import { runAllInsertMissingTeamsAndPlayers } from './src/scripts/runAllInsertMissingTeamsAndPlayers.js';

await runAllInsertCompetitions('cs2');
await runAllOtherFixtures('cs2');
await runAllInsertMissingTeams('cs2');
await runAllInsertMissingTeamsAndPlayers('cs2');