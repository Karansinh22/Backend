const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authValidation = require('../validations/authValidation');
const { verifyToken } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', authValidation.registerValidation, authController.register);

/**
 * @route   POST /api/v1/auth/verify-otp
 * @desc    Verify OTP and activate account
 * @access  Public
 */
router.post('/verify-otp', authValidation.verifyOTPValidation, authController.verifyOTP);

/**
 * @route   POST /api/v1/auth/resend-otp
 * @desc    Resend OTP to email
 * @access  Public
 */
router.post('/resend-otp', authValidation.resendOTPValidation, authController.resendOTP);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', authValidation.loginValidation, authController.login);

/**
 * @route   POST /api/v1/auth/refresh-token
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh-token', authValidation.refreshTokenValidation, authController.refreshToken);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', verifyToken, authController.logout);

/**
 * @route   GET /api/v1/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', verifyToken, authController.getProfile);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Send OTP to email for password reset
 * @access  Public
 */
router.post('/forgot-password', authValidation.forgotPasswordValidation, authController.forgotPassword);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password with OTP
 * @access  Public
 */
router.post('/reset-password', authValidation.resetPasswordValidation, authController.resetPassword);

module.exports = router;
