const express = require('express');
const router = express.Router();
const pulsesController = require('../controllers/pulsesController');
const { body } = require('express-validator');
const auth = require('../middleware/authMiddleware.js');

// Public routes
router.get('/pulses/:communityId', pulsesController.getPulsesByCommunity);

// Protected routes
router.post(
    '/pulses/create',
    auth.verifyToken,
    [
        body('communityId').notEmpty().withMessage('Community ID is required'),
        body('title').notEmpty().withMessage('Title is required'),
        body('description').notEmpty().withMessage('Description is required'),
        body('territory').optional().isString()
    ],
    pulsesController.createPulse
);

router.put(
    '/pulses/approve/:pulseId',
    auth.verifyToken,
    [
        body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected')
    ],
    pulsesController.approvePulse
);

router.delete('/pulses/:pulseId', auth.verifyToken, pulsesController.deletePulse);

router.post('/pulses/:pulseId/like', auth.verifyToken, pulsesController.toggleLikePulse);

router.post(
    '/pulses/:pulseId/comment',
    auth.verifyToken,
    [
        body('text').notEmpty().withMessage('Comment text is required')
    ],
    pulsesController.addComment
);

module.exports = router;

