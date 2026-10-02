/**
 * Database Connection Configuration
 * Uses mysql2/promise connection pool for high-performance and async/await support.
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

// Create the connection pool using credentials from .env
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'college_event_db',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: '+00:00', // ensure consistent date/time parsing
    dateStrings: true   // return DATE and TIME as strings (YYYY-MM-DD, HH:MM:SS)
});

// Helper function to test database connectivity
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Connected to MySQL Database:', process.env.DB_NAME || 'college_event_db');
        connection.release();
        return true;
    } catch (err) {
        console.error('❌ Database connection error:', err.message);
        console.error('👉 Check your database credentials in the .env file.');
        return false;
    }
}

module.exports = {
    pool,
    testConnection
};
