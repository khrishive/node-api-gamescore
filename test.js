const today = new Date(1750723200000);
const today2 = new Date(1750809599999);
const today3 = new Date(1695859200000);
const today4 = new Date(1695945599999);

const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, '0'); // Los meses son 0-indexados
const dd = String(today.getDate()).padStart(2, '0');
const currentDate = `${yyyy}-${mm}-${dd}`;

console.log(`La fecha es: ${today}`);
console.log(`La fecha es: ${today2}`);


//🎯 Filtro por rango: { from: 1695859200000, to: 1695945599999 }
//📥 Filtros recibidos: { customRange: { from: 1695859200000, to: 1695945599999 } }