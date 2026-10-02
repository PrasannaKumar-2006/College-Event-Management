/**
 * Main Express Application Server
 * College Event Management System
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const cors = require('cors');
const { testConnection } = require('./config/db');

// Import route handlers
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const registrationRoutes = require('./routes/registrations');

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// Middlewares
// ==========================================

// Enable CORS for local testing
app.use(cors());

// Parse incoming JSON and URL-encoded request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session management for user authentication
app.use(
    session({
        secret: process.env.SESSION_SECRET || 'college_event_secret_key_default',
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: false, // Set to true if deploying behind HTTPS
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 // 24 hours
        }
    })
);

// Serve static frontend files (HTML, CSS, JS, Images) from the 'public' directory
app.use(express.static(path.join(__dirname, '../public')));

// ==========================================
// API Routes
// ==========================================

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'College Event Management API is active.' });
});

// Mount application routers
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);

// Catch-all for undefined API routes
app.all('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `API route not found: ${req.method} ${req.url}`
    });
});

// Fallback to index.html for root navigation if not matched
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ==========================================
// Server Initialization
// ==========================================

async function startServer() {
    // Verify database connection on startup
    await testConnection();

    app.listen(PORT, () => {
        console.log('==================================================');
        console.log(`🚀 College Event Management Server is running!`);
        console.log(`🌐 Local URL: http://localhost:${PORT}`);
        console.log(`📚 Public Events: http://localhost:${PORT}/index.html`);
        console.log(`🔑 Login Page:   http://localhost:${PORT}/login.html`);
        console.log(`👤 Student Panel: http://localhost:${PORT}/student-dashboard.html`);
        console.log(`🛠️ Admin Panel:   http://localhost:${PORT}/admin-dashboard.html`);
        console.log('==================================================');
    });
}

startServer();
