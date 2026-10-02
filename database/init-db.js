/**
 * Database Initialization Script
 * Automatically connects to MySQL, creates the database, creates tables,
 * and seeds default admin and sample events.
 * 
 * Run with: npm run db:init
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function initDatabase() {
    console.log('----------------------------------------------------');
    console.log('🔄 Initializing College Event Management Database...');
    console.log('----------------------------------------------------');

    const host = process.env.DB_HOST || 'localhost';
    const user = process.env.DB_USER || 'root';
    const password = process.env.DB_PASSWORD || '';
    const port = parseInt(process.env.DB_PORT, 10) || 3306;
    const dbName = process.env.DB_NAME || 'college_event_db';

    let connection;

    try {
        // Step 1: Connect to MySQL server (without selecting a DB first)
        connection = await mysql.createConnection({
            host,
            user,
            password,
            port,
            multipleStatements: true
        });

        console.log(`✅ Connected to MySQL server at ${host}:${port} as "${user}"`);

        // Step 2: Create database if not exists
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
        console.log(`✅ Database "${dbName}" checked/created.`);

        // Step 3: Switch to the database
        await connection.changeUser({ database: dbName });

        // Step 4: Create tables
        console.log('⏳ Creating tables if not existing...');

        // Users table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(150) NOT NULL,
                email VARCHAR(191) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                role ENUM('student', 'admin') NOT NULL DEFAULT 'student',
                roll_number VARCHAR(50) DEFAULT NULL,
                department VARCHAR(100) DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // Events table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS events (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                event_date DATE NOT NULL,
                event_time TIME NOT NULL,
                venue VARCHAR(255) NOT NULL,
                department VARCHAR(100) NOT NULL,
                seats INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // Registrations table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS registrations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                event_id INT NOT NULL,
                registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_student_event (user_id, event_id),
                CONSTRAINT fk_reg_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                CONSTRAINT fk_reg_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        console.log('✅ Tables created: "users", "events", "registrations"');

        // Step 5: Seed Default Admin Account
        const adminEmail = 'admin@college.edu';
        const [adminRows] = await connection.query('SELECT id FROM users WHERE email = ?', [adminEmail]);

        if (adminRows.length === 0) {
            const adminPasswordHash = await bcrypt.hash('admin123', 10);
            await connection.query(
                `INSERT INTO users (name, email, password, role, department) 
                 VALUES (?, ?, ?, 'admin', 'Administration')`,
                ['System Administrator', adminEmail, adminPasswordHash]
            );
            console.log(`✅ Default Admin created -> Email: ${adminEmail} | Password: admin123`);
        } else {
            console.log(`ℹ️ Admin account (${adminEmail}) already exists.`);
        }

        // Step 6: Seed Default Demo Student
        const studentEmail = 'rahul@student.edu';
        const [studentRows] = await connection.query('SELECT id FROM users WHERE email = ?', [studentEmail]);

        if (studentRows.length === 0) {
            const studentPasswordHash = await bcrypt.hash('student123', 10);
            await connection.query(
                `INSERT INTO users (name, email, password, role, roll_number, department) 
                 VALUES (?, ?, ?, 'student', 'CS-2024-042', 'Computer Science')`,
                ['Rahul Sharma', studentEmail, studentPasswordHash]
            );
            console.log(`✅ Demo Student created -> Email: ${studentEmail} | Password: student123`);
        }

        // Step 7: Seed Sample Events if table is empty
        const [eventCountResult] = await connection.query('SELECT COUNT(*) as count FROM events');
        if (eventCountResult[0].count === 0) {
            const sampleEvents = [
                [
                    'National Hackathon 2026',
                    'A 24-hour inter-college coding marathon solving real-world challenges in AI, Web3, and Green Tech. Refreshments and certificates provided.',
                    '2026-10-15',
                    '09:00:00',
                    'Main Auditorium & Computing Lab 3',
                    'Computer Science',
                    50
                ],
                [
                    'Robotics & IoT Workshop',
                    'Hands-on workshop building autonomous obstacle-avoiding robots and smart home sensors using Arduino and Raspberry Pi kits.',
                    '2026-10-22',
                    '10:30:00',
                    'Electronics Lab Block B',
                    'Electronics',
                    35
                ],
                [
                    'Aura 2026: Annual Cultural Fest',
                    'The biggest cultural evening featuring live band performances, dance competitions, photography exhibition, and food stalls.',
                    '2026-11-05',
                    '16:00:00',
                    'Open Air Amphitheatre',
                    'Cultural Affairs',
                    200
                ],
                [
                    'Inter-Department Badminton Championship',
                    'Singles and doubles knockout tournament for all year students. Medals and trophies for winners and runners-up.',
                    '2026-10-18',
                    '08:00:00',
                    'College Indoor Sports Complex',
                    'Physical Education',
                    24
                ]
            ];

            const insertEventSql = `
                INSERT INTO events (name, description, event_date, event_time, venue, department, seats)
                VALUES ?
            `;
            await connection.query(insertEventSql, [sampleEvents]);
            console.log('✅ Seeded 4 sample college events.');
        } else {
            console.log('ℹ️ Events table already has data; skipping sample events insertion.');
        }

        console.log('----------------------------------------------------');
        console.log('🎉 Database initialization completed successfully!');
        console.log('----------------------------------------------------');
    } catch (error) {
        console.error('❌ Database initialization failed:');
        console.error(error.message);
        console.log('\n💡 Troubleshooting Tips:');
        console.log('1. Make sure MySQL Server is running.');
        console.log('2. Check your DB_PASSWORD and DB_USER inside the .env file.');
        console.log('3. Ensure port matches your MySQL installation (default is 3306).');
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

initDatabase();
