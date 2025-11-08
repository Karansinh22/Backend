const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const userValidation = require('../validations/userValidation');

/**
 * @route   POST /api/v1/users/admin/send-phone-otp
 * @desc    Send OTP to phone number for login
 * @access  Public
 */
router.post('/admin/send-phone-otp', userValidation.sendPhoneOTPValidation, userController.sendPhoneOTP);

/**
 * @route   POST /api/v1/users/admin/verify-phone-otp
 * @desc    Verify phone OTP and login
 * @access  Public
 */
router.post('/admin/verify-phone-otp', userValidation.verifyPhoneOTPValidation, userController.verifyPhoneOTP);

module.exports = router;
