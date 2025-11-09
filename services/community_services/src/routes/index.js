// routes/v1/index.js
const express = require('express');
const router = express.Router();

// Import individual route modules
const testUserRoutes = require('./testUserRoutes');
const commonRoutes = require('./commonRoute');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const communityRoutes = require('./communityRoutes');
const adminRoutes = require('./adminRoutes');
const managerRoutes = require('./managerRoutes');

// Mount routes under their respective paths
router.use('/test-users', testUserRoutes);
router.use('/common', commonRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/community', communityRoutes);
router.use('/admin', adminRoutes);
router.use('/manager', managerRoutes);

module.exports = router;