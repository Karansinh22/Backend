const { body, param, query } = require('express-validator');

// Register Validation
const registerValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail(),
    
    body('mobileNumber')
        .trim()
        .notEmpty().withMessage('Mobile number is required')
        .matches(/^[0-9]{10}$/).withMessage('Mobile number must be 10 digits'),
    
    body('countryCode')
        .optional()
        .trim()
        .matches(/^\+[0-9]{1,4}$/).withMessage('Country code must start with + and contain 1-4 digits'),
    
    body('password')
        .trim()
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    
    body('role')
        .optional()
        .isIn(['User', 'Admin', 'SuperAdmin']).withMessage('Invalid role specified')
];

// Login Validation (supports both email and mobile number)
const loginValidation = [
    body('email')
        .optional()
        .trim()
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail(),
    
    body('mobileNumber')
        .optional()
        .trim()
        .matches(/^[0-9]{10}$/).withMessage('Mobile number must be 10 digits'),
    
    body('password')
        .trim()
        .notEmpty().withMessage('Password is required')
];

// Verify OTP Validation
const verifyOTPValidation = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail(),
    
    body('otp')
        .trim()
        .notEmpty().withMessage('OTP is required')
        .isLength({ min: 6, max: 6 }).withMessage('OTP must be exactly 6 digits')
        .isNumeric().withMessage('OTP must contain only numbers')
];

// Resend OTP Validation
const resendOTPValidation = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail()
];

// Refresh Token Validation
const refreshTokenValidation = [
    body('refreshToken')
        .trim()
        .notEmpty().withMessage('Refresh token is required')
];

// Forgot Password Validation
const forgotPasswordValidation = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail()
];

// Reset Password Validation
const resetPasswordValidation = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail(),
    
    body('otp')
        .trim()
        .notEmpty().withMessage('OTP is required')
        .isLength({ min: 6, max: 6 }).withMessage('OTP must be exactly 6 digits')
        .isNumeric().withMessage('OTP must contain only numbers'),
    
    body('newPassword')
        .trim()
        .notEmpty().withMessage('New password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
];

module.exports = {
    registerValidation,
    loginValidation,
    verifyOTPValidation,
    resendOTPValidation,
    refreshTokenValidation,
    forgotPasswordValidation,
    resetPasswordValidation
};
