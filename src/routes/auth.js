/**
 * Authentication Routes (Register, Login, Logout, Current User)
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

// POST: Student Registration
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, roll_number, department } = req.body;

        // Basic validation
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and password are required.'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long.'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Check if user already exists
        const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'An account with this email address already exists.'
            });
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert new student user
        const [result] = await pool.query(
            `INSERT INTO users (name, email, password, role, roll_number, department)
             VALUES (?, ?, ?, 'student', ?, ?)`,
            [name.trim(), normalizedEmail, hashedPassword, roll_number || null, department || null]
        );

        const newUser = {
            id: result.insertId,
            name: name.trim(),
            email: normalizedEmail,
            role: 'student',
            roll_number: roll_number || null,
            department: department || null
        };

        // Automatically log in newly registered student
        req.session.user = newUser;

        return res.status(201).json({
            success: true,
            message: 'Registration successful! Welcome.',
            user: newUser
        });
    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error during registration. Please try again later.'
        });
    }
});

// POST: Login (Handles both Students and Admins)
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide both email and password.'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Fetch user record
        const [rows] = await pool.query(
            'SELECT id, name, email, password, role, roll_number, department FROM users WHERE email = ?',
            [normalizedEmail]
        );

        if (rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        const user = rows[0];

        // Compare password hash
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        // Exclude password from session
        const sessionUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            roll_number: user.roll_number,
            department: user.department
        };

        req.session.user = sessionUser;

        return res.json({
            success: true,
            message: `Logged in successfully as ${user.role}.`,
            user: sessionUser
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error during login. Please try again later.'
        });
    }
});

// POST: Logout
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({
                success: false,
                message: 'Could not log out. Please try again.'
            });
        }
        res.clearCookie('connect.sid');
        return res.json({
            success: true,
            message: 'Logged out successfully.'
        });
    });
});

// GET: Current Session User Profile
router.get('/me', (req, res) => {
    if (req.session && req.session.user) {
        return res.json({
            success: true,
            user: req.session.user
        });
    }
    return res.json({
        success: true,
        user: null
    });
});

module.exports = router;
