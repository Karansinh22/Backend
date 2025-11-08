const UsersModel = require('../models/Users');
const messages = require('../message');
const response = require('../config/response');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const CommonConfig = require('../config/common');
const { generateOTP } = require('../libs/sendOtp');
const { sendGridMail } = require('../libs/sendMail');

/**
 * Send OTP to phone number (for login)
 */
const sendPhoneOTP = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { phoneNumber, countryCode } = req.body;
        const fullPhone = `${countryCode || '+91'}${phoneNumber}`;

        // Find user by phone number
        let user = await UsersModel.findOne({
            mobileNumber: phoneNumber,
            isDeleted: false
        });

        // If user doesn't exist, create a new one
        if (!user) {
            user = new UsersModel({
                name: `User ${phoneNumber}`,
                email: `${phoneNumber}@temp.com`, // Temporary email
                mobileNumber: phoneNumber,
                countryCode: countryCode || '+91',
                password: Math.random().toString(36).slice(-8), // Random password
                status: 'Pending',
                role: 'User'
            });
        }

        // Generate OTP
        const otp = await generateOTP(6);
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        user.otp = otp;
        user.otpExpiry = otpExpiry;
        await user.save();

        // For now, just return success (SMS integration can be added later)
        // In development, you can log the OTP
        console.log(`📱 OTP for ${fullPhone}: ${otp}`);

        return res.status(200).send(response.toJson(messages['en'].user.otp_send_success, {
            phoneNumber,
            // In development, return OTP for testing
            ...(process.env.NODE_ENV === 'dev' && { otp })
        }));

    } catch (error) {
        console.error('Send phone OTP error:', error);
        return res.status(500).send(response.toJson(messages['en'].common.service_unavailable));
    }
};

/**
 * Verify phone OTP and login
 */
const verifyPhoneOTP = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { phoneNumber, otp } = req.body;

        // Find user
        const user = await UsersModel.findOne({
            mobileNumber: phoneNumber,
            isDeleted: false
        });

        if (!user) {
            return res.status(404).send(response.toJson(messages['en'].user.user_not_found));
        }

        // Validate OTP
        if (user.otp !== otp) {
            return res.status(400).send(response.toJson(messages['en'].user.otp_invalid));
        }

        // Check OTP expiry
        if (new Date() > user.otpExpiry) {
            return res.status(400).send(response.toJson(messages['en'].user.otp_expired));
        }

        // Update user status
        user.status = 'Active';
        user.isEmailVerified = true;
        user.otp = null;
        user.otpExpiry = null;
        user.lastLogin = new Date();

        // Generate tokens
        const accessToken = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            CommonConfig.JWT_SECRET_USER,
            { expiresIn: CommonConfig.JWT_VALIDITY }
        );

        const refreshToken = jwt.sign(
            { id: user._id },
            CommonConfig.REFRESH_TOKEN_SECRET,
            { expiresIn: CommonConfig.REFRESH_TOKEN_VALIDITY }
        );

        user.refreshToken = refreshToken;
        await user.save();

        // Format response to match client expectations
        const userResponse = {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.mobileNumber,
            countryCode: user.countryCode,
            userRoles: [user.role],
            avatar: '',
            accessToken,
            refreshToken
        };

        return res.status(200).send(response.toJson(messages['en'].user.login_success, userResponse));

    } catch (error) {
        console.error('Verify phone OTP error:', error);
        return res.status(500).send(response.toJson(messages['en'].common.service_unavailable));
    }
};

module.exports = {
    sendPhoneOTP,
    verifyPhoneOTP
};

