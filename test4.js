//import fs from 'fs';

//const data = JSON.parse(fs.readFileSync('test3.json', 'utf8'));

//const datos = data

let startDate = '2025-01-01'
let endDate = '2025-12-31'
export function getTournamentsInARangeOfDates(data, startDate, endDate) {
  
  let startHour = '00:00:00'
  let endHour = '23:59:59'
  const startOf2025 = new Date(`${startDate}T${startHour}Z`).getTime();
  const endOf2025 = new Date(`${endDate}T${endHour}Z`).getTime();

  const filtered = data.filter(item => {
    const timestamp = Number(item.startDate);
    return timestamp >= startOf2025 && timestamp <= endOf2025;
  });

  console.log(`Total en 2025: ${filtered.length}`);

  filtered.forEach(item => {
    console.log({
      id: item.id,
      name: item.name,
      startDate: new Date(Number(item.startDate)).toISOString()
    });
  });

  return filtered;
}



//console.log(getTournamentsInARangeOfDates(datos, startDate, endDate));