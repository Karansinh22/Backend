const express = require('express');
const router = express.Router();
const managerController = require('../controllers/managerController');
const auth = require('../middleware/authMiddleware.js');
const managerMiddleware = require('../middleware/managerMiddleware.js');

// Get communities where user is a manager
router.get('/communities', 
    auth.verifyToken, 
    managerMiddleware.verifyManager, 
    managerController.getManagerCommunities
);

// Manager dashboard stats
router.get('/dashboard/stats/:communityId', 
    auth.verifyToken, 
    managerMiddleware.verifyCommunityManager, 
    managerController.getDashboardStats
);

// Community join requests
router.get('/community-join-requests/:communityId', 
    auth.verifyToken, 
    managerMiddleware.verifyCommunityManager, 
    managerController.getCommunityJoinRequests
);

router.put('/community-join-requests/:communityId/:requestId/approve', 
    auth.verifyToken, 
    managerMiddleware.verifyCommunityManager, 
    managerController.approveCommunityJoinRequest
);

router.put('/community-join-requests/:communityId/:requestId/reject', 
    auth.verifyToken, 
    managerMiddleware.verifyCommunityManager, 
    managerController.rejectCommunityJoinRequest
);

// Community join request stats
router.get('/community-join-requests/:communityId/stats', 
    auth.verifyToken, 
    managerMiddleware.verifyCommunityManager, 
    managerController.getCommunityJoinRequestStats
);

// Community members
router.get('/members/:communityId', 
    auth.verifyToken, 
    managerMiddleware.verifyCommunityManager, 
    managerController.getCommunityMembers
);

router.delete('/members/:communityId/:memberId', 
    auth.verifyToken, 
    managerMiddleware.verifyCommunityManager, 
    managerController.removeCommunityMember
);

// Community member stats
router.get('/members/:communityId/stats', 
    auth.verifyToken, 
    managerMiddleware.verifyCommunityManager, 
    managerController.getCommunityMemberStats
);

// Community events
router.get('/events/:communityId', 
    auth.verifyToken, 
    managerMiddleware.verifyCommunityManager, 
    managerController.getCommunityEvents
);

// Community event stats
router.get('/events/:communityId/stats', 
    auth.verifyToken, 
    managerMiddleware.verifyCommunityManager, 
    managerController.getCommunityEventStats
);

// Community posts
router.get('/posts/:communityId', 
    auth.verifyToken, 
    managerMiddleware.verifyCommunityManager, 
    managerController.getCommunityPosts
);

router.put('/posts/:communityId/:postId/approve', 
    auth.verifyToken, 
    managerMiddleware.verifyCommunityManager, 
    managerController.approveCommunityPost
);

router.put('/posts/:communityId/:postId/reject', 
    auth.verifyToken, 
    managerMiddleware.verifyCommunityManager, 
    managerController.rejectCommunityPost
);

router.delete('/posts/:communityId/:postId', 
    auth.verifyToken, 
    managerMiddleware.verifyCommunityManager, 
    managerController.deleteCommunityPost
);

// Community post stats
router.get('/posts/:communityId/stats', 
    auth.verifyToken, 
    managerMiddleware.verifyCommunityManager, 
    managerController.getCommunityPostStats
);

// Community reports
router.get('/reports/:communityId', 
    auth.verifyToken, 
    managerMiddleware.verifyCommunityManager, 
    managerController.getCommunityReports
);

// Marketplace listings
router.get('/marketplace/listings/:communityId', 
    auth.verifyToken, 
    managerMiddleware.verifyCommunityManager, 
    managerController.getMarketplaceListings
);

router.put('/marketplace/listings/:communityId/:listingId/approve', 
    auth.verifyToken, 
    managerMiddleware.verifyCommunityManager, 
    managerController.approveMarketplaceListing
);

router.put('/marketplace/listings/:communityId/:listingId/reject', 
    auth.verifyToken, 
    managerMiddleware.verifyCommunityManager, 
    managerController.rejectMarketplaceListing
);

router.get('/marketplace/listings/:communityId/stats', 
    auth.verifyToken, 
    managerMiddleware.verifyCommunityManager, 
    managerController.getMarketplaceListingStats
);

// Comprehensive moderation dashboard
router.get('/moderation-dashboard/:communityId', 
    auth.verifyToken, 
    managerMiddleware.verifyCommunityManager, 
    managerController.getModerationDashboard
);

// Pulse approvals (Manager)
router.get('/pulses/:communityId', 
    auth.verifyToken, 
    managerMiddleware.verifyCommunityManager, 
    managerController.getPulseApprovals
);

router.put('/pulses/:communityId/:pulseId/approve', 
    auth.verifyToken, 
    managerMiddleware.verifyCommunityManager, 
    managerController.approvePulse
);

router.put('/pulses/:communityId/:pulseId/reject', 
    auth.verifyToken, 
    managerMiddleware.verifyCommunityManager, 
    managerController.rejectPulse
);

// User management (Manager)
router.get('/users/:communityId', 
    auth.verifyToken, 
    managerMiddleware.verifyCommunityManager, 
    managerController.getAllUsers
);

router.post('/users/:communityId/add', 
    auth.verifyToken, 
    managerMiddleware.verifyCommunityManager, 
    managerController.addUserToCommunity
);

module.exports = router;