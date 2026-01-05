// scripts/test-get-participant.js

import {getParticipantById} from './x.js';

async function run() {
  await getParticipantById({
    id: 218732,
    sport: 'dota2'
  });

  process.exit(0);
}

run();
