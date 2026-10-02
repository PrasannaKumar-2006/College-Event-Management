/**
 * Registration Routes
 * Handles event booking with duplicate checks, seat capacity verification,
 * cancellation, and student registration history.
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { requireStudent } = require('../middleware/auth');

// POST /api/registrations/:eventId
// Register logged-in student for an event
router.post('/:eventId', requireStudent, async (req, res) => {
    const studentId = req.session.user.id;
    const eventId = parseInt(req.params.eventId, 10);

    if (isNaN(eventId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid event ID.'
        });
    }

    // Get a dedicated connection from pool for transaction
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Verify that event exists and lock row for seat check
        const [events] = await connection.query(
            'SELECT id, name, seats, event_date FROM events WHERE id = ? FOR UPDATE',
            [eventId]
        );

        if (events.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Event not found.'
            });
        }

        const event = events[0];

        // 2. Prevent duplicate registration check
        const [existing] = await connection.query(
            'SELECT id FROM registrations WHERE user_id = ? AND event_id = ?',
            [studentId, eventId]
        );

        if (existing.length > 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'You are already registered for this event.'
            });
        }

        // 3. Count current registrations for this event
        const [regCountResult] = await connection.query(
            'SELECT COUNT(*) as count FROM registrations WHERE event_id = ?',
            [eventId]
        );
        const currentCount = regCountResult[0].count;

        // 4. Check if seats are full
        if (currentCount >= event.seats) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Registration closed: All seats for this event are fully booked!'
            });
        }

        // 5. Insert registration record
        await connection.query(
            'INSERT INTO registrations (user_id, event_id) VALUES (?, ?)',
            [studentId, eventId]
        );

        await connection.commit();

        return res.status(201).json({
            success: true,
            message: `Successfully registered for "${event.name}"!`,
            remainingSeats: event.seats - (currentCount + 1)
        });
    } catch (error) {
        await connection.rollback();

        // Handle MySQL unique key constraint violation gracefully
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: 'You have already registered for this event.'
            });
        }

        console.error('Registration transaction error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to complete registration due to a server error.'
        });
    } finally {
        connection.release();
    }
});

// DELETE /api/registrations/:eventId
// Cancel student's registration for an event (frees up a seat)
router.delete('/:eventId', requireStudent, async (req, res) => {
    try {
        const studentId = req.session.user.id;
        const eventId = parseInt(req.params.eventId, 10);

        if (isNaN(eventId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid event ID.'
            });
        }

        const [result] = await pool.query(
            'DELETE FROM registrations WHERE user_id = ? AND event_id = ?',
            [studentId, eventId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Registration not found or already cancelled.'
            });
        }

        return res.json({
            success: true,
            message: 'Your registration has been successfully cancelled.'
        });
    } catch (error) {
        console.error('Cancellation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to cancel registration.'
        });
    }
});

// GET /api/registrations/my-events
// Fetch all events that the currently logged-in student has registered for
router.get('/my-events', requireStudent, async (req, res) => {
    try {
        const studentId = req.session.user.id;

        const sql = `
            SELECT 
                r.id AS registration_id,
                r.registered_at,
                e.id AS event_id,
                e.name,
                e.description,
                e.event_date,
                e.event_time,
                e.venue,
                e.department,
                e.seats AS total_seats
            FROM registrations r
            JOIN events e ON r.event_id = e.id
            WHERE r.user_id = ?
            ORDER BY e.event_date ASC, e.event_time ASC
        `;

        const [registeredEvents] = await pool.query(sql, [studentId]);

        return res.json({
            success: true,
            events: registeredEvents
        });
    } catch (error) {
        console.error('Error fetching registered events:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to load your registered events.'
        });
    }
});

module.exports = router;
