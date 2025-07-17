import {getMapBreakdownByTeam} from './src/middleware/mapBreakdownDataProcess.js';
import { getMatchMapResults } from './src/services/getMatchMapResults.js';

const breakdown = await getMatchMapResults(925931);
//console.table(breakdown);
console.log(breakdown);