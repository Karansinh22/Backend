const express = require('express');
const router = express.Router();
const eventsController = require('../controllers/eventsController');
const { body } = require('express-validator');
const auth = require('../middleware/authMiddleware.js');

// Public routes
router.get('/events/:communityId', eventsController.getEventsByCommunity);

// Protected routes
router.post(
    '/events/create',
    auth.verifyToken,
    [
        body('communityId').notEmpty().withMessage('Community ID is required'),
        body('title').notEmpty().withMessage('Title is required'),
        body('description').notEmpty().withMessage('Description is required'),
        body('eventDate').notEmpty().withMessage('Event date is required'),
        body('startTime').notEmpty().withMessage('Start time is required')
    ],
    eventsController.createEvent
);

router.post('/events/register/:eventId', auth.verifyToken, eventsController.registerForEvent);

router.get('/events/registration/:eventId', auth.verifyToken, eventsController.getUserRegistration);

router.post(
    '/events/attendance/mark',
    auth.verifyToken,
    [
        body('qrData').notEmpty().withMessage('QR code data is required')
    ],
    eventsController.markAttendance
);

router.get('/events/attendance/:eventId', auth.verifyToken, eventsController.getEventAttendance);

router.delete('/events/:eventId', auth.verifyToken, eventsController.deleteEvent);

module.exports = router;