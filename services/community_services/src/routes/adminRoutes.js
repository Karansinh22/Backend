const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { body } = require('express-validator');
const auth = require('../middleware/authMiddleware.js');
const multer = require('multer');
const response = require('../config/response.js');

// Using the global fileUpload middleware instead of multer to maintain consistency
// File upload is handled via req.files.bannerImage

// Admin dashboard stats
router.get('/dashboard/stats', auth.verifyToken, auth.verifyAdmin, adminController.getDashboardStats);
router.get('/dashboard/activities', auth.verifyToken, auth.verifyAdmin, adminController.getRecentActivities);

// Admin communities
router.get('/communities', auth.verifyToken, auth.verifyAdmin, adminController.getAdminCommunities);

// Create community
router.post('/communities', 
    auth.verifyToken, 
    auth.verifyAdmin,
    [
        body('name').notEmpty().withMessage('Community name is required'),
        body('description').notEmpty().withMessage('Community description is required')
    ],
    adminController.createCommunity
);

// Update community
router.put('/communities/:id', auth.verifyToken, auth.verifyAdmin, adminController.updateCommunity);

// Delete community
router.delete('/communities/:id', auth.verifyToken, auth.verifyAdmin, adminController.deleteCommunity);

// Community users
router.get('/communities/:communityId/users', auth.verifyToken, auth.verifyAdmin, adminController.getCommunityUsers);

// Directly update user role (bypass request system) - MUST come before /users route
router.put('/users/:userId/role', 
    auth.verifyToken, 
    auth.verifyAdmin,
    (req, res, next) => {
        console.log('✅ Route matched: PUT /users/:userId/role', {
            userId: req.params.userId,
            body: req.body,
            method: req.method,
            originalUrl: req.originalUrl,
            path: req.path
        });
        next();
    },
    (req, res, next) => {
        // Manual validation instead of express-validator to avoid issues
        const { role } = req.body;
        const validRoles = ['User', 'Manager', 'Admin', 'SuperAdmin', 'Resident'];
        
        if (!role) {
            return res.status(400).send(response.toJson('Role is required'));
        }
        
        if (!validRoles.includes(role)) {
            return res.status(400).send(response.toJson('Invalid role. Must be one of: ' + validRoles.join(', ')));
        }
        
        next();
    },
    adminController.updateUserRole
);

// All users in admin's communities
router.get('/users', auth.verifyToken, auth.verifyAdmin, adminController.getAllUsers);

// Community events
router.get('/communities/:communityId/events', auth.verifyToken, auth.verifyAdmin, adminController.getCommunityEvents);
router.post('/communities/:communityId/events', auth.verifyToken, auth.verifyAdmin, adminController.createCommunityEvent);

// Reports
router.get('/reports', auth.verifyToken, auth.verifyAdmin, adminController.getReports);

// Role change requests
router.post('/role-change-requests', auth.verifyToken, auth.verifyAdmin, adminController.createRoleChangeRequest);
router.get('/role-change-requests', auth.verifyToken, auth.verifyAdmin, adminController.getRoleChangeRequests);
router.put('/role-change-requests/:requestId/approve', auth.verifyToken, auth.verifyAdmin, adminController.approveRoleChangeRequest);
router.put('/role-change-requests/:requestId/reject', 
    auth.verifyToken, 
    auth.verifyAdmin,
    [
        body('rejectionReason').notEmpty().withMessage('Rejection reason is required')
    ],
    adminController.rejectRoleChangeRequest
);

// Community join requests
router.get('/join-requests', auth.verifyToken, auth.verifyAdmin, adminController.getJoinRequests);
router.put('/join-requests/:requestId/approve', auth.verifyToken, auth.verifyAdmin, adminController.approveJoinRequest);
router.put('/join-requests/:requestId/reject', 
    auth.verifyToken, 
    auth.verifyAdmin,
    [
        body('rejectionReason').notEmpty().withMessage('Rejection reason is required')
    ],
    adminController.rejectJoinRequest
);

// Marketplace product listing approvals
router.get('/marketplace/listings', auth.verifyToken, auth.verifyAdmin, adminController.getMarketplaceListings);
router.put('/marketplace/listings/:listingId/approve', auth.verifyToken, auth.verifyAdmin, adminController.approveMarketplaceListing);
router.put('/marketplace/listings/:listingId/reject', 
    auth.verifyToken, 
    auth.verifyAdmin,
    [
        body('rejectionReason').notEmpty().withMessage('Rejection reason is required')
    ],
    adminController.rejectMarketplaceListing
);

// Pulse approvals
router.get('/pulses', auth.verifyToken, auth.verifyAdmin, adminController.getPulseApprovals);
router.put('/pulses/:pulseId/approve', auth.verifyToken, auth.verifyAdmin, adminController.approvePulse);
router.put('/pulses/:pulseId/reject', 
    auth.verifyToken, 
    auth.verifyAdmin,
    [
        body('rejectionReason').notEmpty().withMessage('Rejection reason is required')
    ],
    adminController.rejectPulse
);

// Community manager management
router.post('/communities/:communityId/managers', 
    auth.verifyToken, 
    auth.verifyAdmin,
    [
        body('userId').notEmpty().withMessage('User ID is required')
    ],
    adminController.assignCommunityManager
);
router.get('/communities/:communityId/managers', auth.verifyToken, auth.verifyAdmin, adminController.getCommunityManagers);
router.delete('/communities/:communityId/managers/:managerId', auth.verifyToken, auth.verifyAdmin, adminController.removeCommunityManager);

// Remove user from community
router.delete('/communities/:communityId/members/:userId', auth.verifyToken, auth.verifyAdmin, adminController.removeUserFromCommunity);

// Debug route to check if routes are being registered
router.use((req, res, next) => {
    if (req.method === 'PUT' && req.path.includes('/users/') && req.path.includes('/role')) {
        console.log('DEBUG: PUT request to users role path detected:', {
            method: req.method,
            path: req.path,
            originalUrl: req.originalUrl,
            baseUrl: req.baseUrl,
            url: req.url
        });
    }
    next();
});

module.exports = router;