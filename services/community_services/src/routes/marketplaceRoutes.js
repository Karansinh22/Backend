const express = require('express');
const router = express.Router();
const marketplaceController = require('../controllers/marketplaceController');
const { body } = require('express-validator');
const auth = require('../middleware/authMiddleware.js');

// Public routes
router.get('/marketplace/:communityId', marketplaceController.getListingsByCommunity);
router.get('/marketplace/listing/:id', marketplaceController.getListingById);

// Protected routes
router.post(
    '/marketplace/listing/create',
    auth.verifyToken,
    [
        body('communityId').notEmpty().withMessage('Community ID is required'),
        body('type').isIn(['buy', 'sell']).withMessage('Type must be buy or sell'),
        body('title').notEmpty().withMessage('Title is required'),
        body('description').notEmpty().withMessage('Description is required'),
        body('price').isNumeric().withMessage('Price must be a number')
    ],
    marketplaceController.createListing
);

router.post('/marketplace/chat/:listingId', auth.verifyToken, marketplaceController.startChat);

router.post(
    '/marketplace/chat/message/:listingId',
    auth.verifyToken,
    [
        body('text').notEmpty().withMessage('Message text is required')
    ],
    marketplaceController.sendMessage
);

router.get('/marketplace/chat/:listingId', auth.verifyToken, marketplaceController.getChatMessages);

router.get('/marketplace/chats/user', auth.verifyToken, marketplaceController.getUserChats);

router.put(
    '/marketplace/listing/:id/status',
    auth.verifyToken,
    [
        body('status').isIn(['pending', 'approved', 'rejected', 'sold', 'closed']).withMessage('Invalid status')
    ],
    marketplaceController.updateListingStatus
);

router.delete('/marketplace/listing/:id', auth.verifyToken, marketplaceController.deleteListing);

module.exports = router;

