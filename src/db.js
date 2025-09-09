import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

// CS2 DB config
const dbConfigCS2 = {
    host: process.env.DB_CS2_HOST,
    user: process.env.DB_CS2_USER,
    password: process.env.DB_CS2_PASSWORD,
    database: process.env.DB_CS2_NAME,
    port: process.env.DB_CS2_PORT || 3306
};

// LOL DB config
const dbConfigLOL = {
    host: process.env.DB_LOL_HOST,
    user: process.env.DB_LOL_USER,
    password: process.env.DB_LOL_PASSWORD,
    database: process.env.DB_LOL_NAME,
    port: process.env.DB_LOL_PORT || 3306
};

export const dbCS2 = mysql.createPool({
    ...dbConfigCS2,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

export const dbLOL = mysql.createPool({
    ...dbConfigLOL,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});