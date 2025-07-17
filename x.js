import {getMapBreakdownByTeam} from './src/middleware/mapBreakdownDataProcess.js';
import { getMatchMapResults } from './src/services/getMatchMapResults.js';

const breakdown = await getMatchMapResults(637042);
//console.table(breakdown);
console.log(breakdown);