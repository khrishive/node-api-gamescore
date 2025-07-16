import {getMapBreakdownByTeam} from './src/middleware/mapBrakDownDataProcess.js';

const breakdown = await getMapBreakdownByTeam(104060);
console.table(breakdown);
