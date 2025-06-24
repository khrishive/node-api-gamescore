const today = new Date(1750770887490);
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, '0'); // Los meses son 0-indexados
const dd = String(today.getDate()).padStart(2, '0');
const currentDate = `${yyyy}-${mm}-${dd}`;

console.log(`La fecha es: ${today}`);