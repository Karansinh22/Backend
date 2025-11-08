const { body } = require('express-validator');

// Test User API Validation (dummy for now)
const testUserApi = [];

// Send Phone OTP Validation
const sendPhoneOTPValidation = [
    body('phoneNumber')
        .trim()
        .notEmpty().withMessage('Phone number is required')
        .matches(/^[0-9]{10}$/).withMessage('Phone number must be exactly 10 digits'),
    
    body('countryCode')
        .optional()
        .trim()
        .matches(/^\+[0-9]{1,4}$/).withMessage('Country code must start with + and contain 1-4 digits')
];

// Verify Phone OTP Validation
const verifyPhoneOTPValidation = [
    body('phoneNumber')
        .trim()
        .notEmpty().withMessage('Phone number is required')
        .matches(/^[0-9]{10}$/).withMessage('Phone number must be exactly 10 digits'),
    
    body('otp')
        .trim()
        .notEmpty().withMessage('OTP is required')
        .isLength({ min: 6, max: 6 }).withMessage('OTP must be exactly 6 digits')
        .isNumeric().withMessage('OTP must contain only numbers')
];

module.exports = {
    testUserApi,
    sendPhoneOTPValidation,
    verifyPhoneOTPValidation
};
