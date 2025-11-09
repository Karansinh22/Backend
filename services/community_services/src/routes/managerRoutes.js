const express = require('express');
const router = express.Router();
const managerController = require('../controllers/managerController');
const auth = require('../middleware/authMiddleware.js');
const managerMiddleware = require('../middleware/managerMiddleware.js');

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

module.exports = router;