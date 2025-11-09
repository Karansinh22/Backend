const express = require('express');
const router = express.Router();
const directoryController = require('../controllers/directoryController');
const { body } = require('express-validator');
const auth = require('../middleware/authMiddleware.js');

// Public routes
router.get('/directory/:communityId', directoryController.getDirectoryEntries);
router.get('/directory/entry/:id', directoryController.getDirectoryEntryById);

// Protected routes (Manager/Admin only)
router.post(
    '/directory/add',
    auth.verifyToken,
    [
        body('communityId').notEmpty().withMessage('Community ID is required'),
        body('name').notEmpty().withMessage('Name is required'),
        body('serviceType').isIn(['plumber', 'electrician', 'security', 'housekeeping', 'carpenter', 'painter', 'gardener', 'mechanic', 'other']).withMessage('Invalid service type'),
        body('contactNumber').notEmpty().withMessage('Contact number is required')
    ],
    directoryController.addDirectoryEntry
);

router.put(
    '/directory/:id',
    auth.verifyToken,
    [
        body('name').optional().notEmpty(),
        body('serviceType').optional().isIn(['plumber', 'electrician', 'security', 'housekeeping', 'carpenter', 'painter', 'gardener', 'mechanic', 'other']),
        body('contactNumber').optional().notEmpty()
    ],
    directoryController.updateDirectoryEntry
);

router.delete('/directory/:id', auth.verifyToken, directoryController.deleteDirectoryEntry);

module.exports = router;

