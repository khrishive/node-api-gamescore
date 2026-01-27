import fs from 'fs';
import https from 'https';

async function fetchPage(page) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'esport-data.com',
      path: `/api/competitions/dota2/?page=${page}`,
      method: 'GET',
      headers: {
        'x-api-key': 'Qd3p!z8RW@u6L$t2Vx$G1n^Y7Bs*e5K%f9Mh&j4Sc0Zq!v2TwXo'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (error) {
          reject(new Error(`Error al parsear JSON: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function fetchAllDota2Competitions() {
  try {
    // Obtener primera página para saber cuántas páginas hay
    console.log('Obteniendo primera página...');
    const firstPage = await fetchPage(1);
    
    const totalPages = firstPage.pagination.totalPages;
    const allCompetitions = [...firstPage.data];
    
    console.log(`Total de páginas: ${totalPages}`);
    
    // Obtener las páginas restantes
    for (let page = 2; page <= totalPages; page++) {
      console.log(`Obteniendo página ${page}/${totalPages}...`);
      const pageData = await fetchPage(page);
      allCompetitions.push(...pageData.data);
    }
    
    // Crear objeto con todos los datos
    const result = {
      data: allCompetitions,
      pagination: {
        totalItems: allCompetitions.length,
        totalPages: totalPages,
        itemsPerPage: firstPage.pagination.itemsPerPage
      }
    };
    
    // Guardar en archivo
    fs.writeFileSync('dota2-data.json', JSON.stringify(result, null, 2));
    console.log(`\n✓ Datos guardados en dota2-data.json`);
    console.log(`✓ Total de competiciones: ${allCompetitions.length}`);
    
    return result;
  } catch (error) {
    throw error;
  }
}

async function run() {
  try {
    await fetchAllDota2Competitions();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

run();
