// routes/v1/index.js
const express = require('express');
const router = express.Router();

// Import individual route modules
const testUserRoutes = require('./testUserRoutes');
const commonRoutes = require('./commonRoute');

// Mount routes under their respective paths
router.use('/test-users', testUserRoutes);
router.use('/common', commonRoutes);

module.exports = router;
