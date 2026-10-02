/**
 * Event Management Routes
 * Handles listing events, creating events (admin), editing (admin),
 * deleting (admin), and viewing registered attendees (admin).
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { requireAdmin } = require('../middleware/auth');

// GET /api/events
// Fetch all events with dynamic registration count, available seats,
// and whether the current logged-in student has already registered.
router.get('/', async (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.id : null;

        // SQL Query retrieves event info, counts registrations, calculates available seats,
        // and checks if current user is already registered for each event
        const sql = `
            SELECT 
                e.id,
                e.name,
                e.description,
                e.event_date,
                e.event_time,
                e.venue,
                e.department,
                e.seats AS total_seats,
                COUNT(r.id) AS registered_count,
                GREATEST(0, e.seats - COUNT(r.id)) AS available_seats,
                MAX(CASE WHEN r.user_id = ? THEN 1 ELSE 0 END) AS is_registered
            FROM events e
            LEFT JOIN registrations r ON e.id = r.event_id
            GROUP BY e.id
            ORDER BY e.event_date ASC, e.event_time ASC
        `;

        const [events] = await pool.query(sql, [userId]);

        // Format is_registered as a boolean
        const formattedEvents = events.map(evt => ({
            ...evt,
            is_registered: Boolean(evt.is_registered),
            is_full: evt.available_seats <= 0
        }));

        return res.json({
            success: true,
            events: formattedEvents
        });
    } catch (error) {
        console.error('Error fetching events:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve events.'
        });
    }
});

// GET /api/events/:id
// Fetch single event details
router.get('/:id', async (req, res) => {
    try {
        const eventId = req.params.id;
        const userId = req.session.user ? req.session.user.id : null;

        const sql = `
            SELECT 
                e.id,
                e.name,
                e.description,
                e.event_date,
                e.event_time,
                e.venue,
                e.department,
                e.seats AS total_seats,
                COUNT(r.id) AS registered_count,
                GREATEST(0, e.seats - COUNT(r.id)) AS available_seats,
                MAX(CASE WHEN r.user_id = ? THEN 1 ELSE 0 END) AS is_registered
            FROM events e
            LEFT JOIN registrations r ON e.id = r.event_id
            WHERE e.id = ?
            GROUP BY e.id
        `;

        const [rows] = await pool.query(sql, [userId, eventId]);
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Event not found.'
            });
        }

        const evt = rows[0];
        evt.is_registered = Boolean(evt.is_registered);
        evt.is_full = evt.available_seats <= 0;

        return res.json({
            success: true,
            event: evt
        });
    } catch (error) {
        console.error('Error fetching single event:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve event details.'
        });
    }
});

// POST /api/events (Admin Only)
// Create a new event
router.post('/', requireAdmin, async (req, res) => {
    try {
        const { name, description, event_date, event_time, venue, department, seats } = req.body;

        // Validation
        if (!name || !description || !event_date || !event_time || !venue || !department || !seats) {
            return res.status(400).json({
                success: false,
                message: 'All fields (name, description, date, time, venue, department, seats) are required.'
            });
        }

        const seatCount = parseInt(seats, 10);
        if (isNaN(seatCount) || seatCount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Seats must be a positive number.'
            });
        }

        const insertSql = `
            INSERT INTO events (name, description, event_date, event_time, venue, department, seats)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await pool.query(insertSql, [
            name.trim(),
            description.trim(),
            event_date,
            event_time,
            venue.trim(),
            department.trim(),
            seatCount
        ]);

        return res.status(201).json({
            success: true,
            message: 'Event created successfully!',
            eventId: result.insertId
        });
    } catch (error) {
        console.error('Error creating event:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create event.'
        });
    }
});

// PUT /api/events/:id (Admin Only)
// Edit an existing event
router.put('/:id', requireAdmin, async (req, res) => {
    try {
        const eventId = req.params.id;
        const { name, description, event_date, event_time, venue, department, seats } = req.body;

        // Validation
        if (!name || !description || !event_date || !event_time || !venue || !department || !seats) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required.'
            });
        }

        const newSeatCount = parseInt(seats, 10);
        if (isNaN(newSeatCount) || newSeatCount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Seats must be a positive number.'
            });
        }

        // Check current registration count so admin does not reduce seats below existing registrations
        const [regCountResult] = await pool.query(
            'SELECT COUNT(*) as count FROM registrations WHERE event_id = ?',
            [eventId]
        );
        const currentRegistrations = regCountResult[0].count;

        if (newSeatCount < currentRegistrations) {
            return res.status(400).json({
                success: false,
                message: `Cannot set seats to ${newSeatCount}. There are already ${currentRegistrations} students registered.`
            });
        }

        const updateSql = `
            UPDATE events 
            SET name = ?, description = ?, event_date = ?, event_time = ?, venue = ?, department = ?, seats = ?
            WHERE id = ?
        `;

        const [result] = await pool.query(updateSql, [
            name.trim(),
            description.trim(),
            event_date,
            event_time,
            venue.trim(),
            department.trim(),
            newSeatCount,
            eventId
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Event not found.'
            });
        }

        return res.json({
            success: true,
            message: 'Event updated successfully!'
        });
    } catch (error) {
        console.error('Error updating event:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update event.'
        });
    }
});

// DELETE /api/events/:id (Admin Only)
// Delete an event and all associated registrations
router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        const eventId = req.params.id;

        const [result] = await pool.query('DELETE FROM events WHERE id = ?', [eventId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Event not found.'
            });
        }

        return res.json({
            success: true,
            message: 'Event deleted successfully!'
        });
    } catch (error) {
        console.error('Error deleting event:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete event.'
        });
    }
});

// GET /api/events/:id/attendees (Admin Only)
// View all students registered for an event
router.get('/:id/attendees', requireAdmin, async (req, res) => {
    try {
        const eventId = req.params.id;

        // Fetch event name first
        const [eventRows] = await pool.query('SELECT name, seats FROM events WHERE id = ?', [eventId]);
        if (eventRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Event not found.'
            });
        }

        // Fetch registered students
        const sql = `
            SELECT 
                u.id AS student_id,
                u.name,
                u.email,
                u.roll_number,
                u.department,
                r.registered_at
            FROM registrations r
            JOIN users u ON r.user_id = u.id
            WHERE r.event_id = ?
            ORDER BY r.registered_at ASC
        `;

        const [attendees] = await pool.query(sql, [eventId]);

        return res.json({
            success: true,
            event: eventRows[0],
            attendees
        });
    } catch (error) {
        console.error('Error fetching event attendees:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve attendees.'
        });
    }
});

module.exports = router;
