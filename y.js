import {runAllInsertCompetitions} from './src/scripts/runAllInsertCompetitions.js';
import { runAllOtherFixtures } from './src/scripts/runAllOtherFixtures.js';
import { runAllInsertMissingTeams } from './src/scripts/runAllInsertMissingTeams.js';
import { runAllInsertMissingTeamsAndPlayers } from './src/scripts/runAllInsertMissingTeamsAndPlayers.js';

await runAllInsertCompetitions('dota2', '2025-01-01', '2026-12-31');
await runAllOtherFixtures('dota2');
await runAllInsertMissingTeams('dota2');
await runAllInsertMissingTeamsAndPlayers('dota2'); // solo dota2