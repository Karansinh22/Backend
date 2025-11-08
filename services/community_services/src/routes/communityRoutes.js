const express = require('express');
const router = express.Router();
const communityController = require('../controllers/communityController');
const { body } = require('express-validator');
const auth = require('../middleware/authMiddleware.js');

// Public routes (no authentication required)
router.get('/communities/featured', communityController.getFeaturedCommunities);
router.get('/communities', communityController.getAllCommunities);
router.get('/communities/:id', communityController.getCommunityById);
router.get('/events/recent', communityController.getRecentEvents);
router.get('/announcements/recent', communityController.getRecentAnnouncements);
router.get('/amenities', communityController.getAllAmenities);

// Community-specific public routes
router.get('/communities/:communityId/pulses', communityController.getCommunityPulses);
router.get('/communities/:communityId/marketplace', communityController.getCommunityMarketplaceListings);
router.get('/communities/:communityId/members', communityController.getCommunityMembers);
router.get('/communities/:communityId/events', communityController.getCommunityEvents);

// Protected routes (require authentication)
router.post(
    '/join-requests',
    auth.verifyToken,
    [
        body('communityId').notEmpty().withMessage('Community ID is required'),
        body('message').optional().isString().withMessage('Message must be a string')
    ],
    communityController.createJoinRequest
);

router.get('/join-requests/user', auth.verifyToken, communityController.getUserJoinRequests);

module.exports = router;