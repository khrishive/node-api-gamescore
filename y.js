import {runAllInsertCompetitions} from './src/scripts/runAllInsertCompetitions.js';
import { runAllOtherFixtures } from './src/scripts/runAllOtherFixtures.js';
import { runAllInsertMissingTeams } from './src/scripts/runAllInsertMissingTeams.js';
import { runAllInsertMissingTeamsAndPlayers } from './src/scripts/runAllInsertMissingTeamsAndPlayers.js';

await runAllInsertCompetitions();
await runAllOtherFixtures();
await runAllInsertMissingTeams();
await runAllInsertMissingTeamsAndPlayers();