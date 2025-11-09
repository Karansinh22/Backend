const UsersModel = require('../models/Users');
const messages = require('../message');
const response = require('../config/response');
const CommonConfig = require('../config/common');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { generateOTP } = require('../libs/sendOtp');
const { sendGridMail } = require('../libs/sendMail');

/**
 * Register a new user
 */
const register = async (req, res) => {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('Registration validation errors:', errors.array());
            return res.status(400).json({
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { name, email, mobileNumber, countryCode, password, role } = req.body;
        
        console.log('Registration attempt:', { name, email, mobileNumber, countryCode, role });

        // Prevent Admin role from being set during registration
        if (role === 'Admin' || role === 'SuperAdmin') {
            console.log('Attempt to register with Admin role blocked');
            return res.status(403).send(response.toJson('Admin role cannot be assigned during registration'));
        }

        // Check if user already exists
        const existingUser = await UsersModel.findOne({
            $or: [{ email }, { mobileNumber }],
            isDeleted: false
        });

        if (existingUser) {
            if (existingUser.email === email) {
                console.log('Email already exists:', email);
                return res.status(400).send(response.toJson(messages['en'].user.email_already_exists));
            }
            if (existingUser.mobileNumber === mobileNumber) {
                console.log('Mobile number already exists:', mobileNumber);
                return res.status(400).send(response.toJson(messages['en'].user.number_already_exists));
            }
        }

        // Generate OTP
        const otp = await generateOTP(6);
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        
        console.log('Generated OTP:', otp);

        // Create new user
        const newUser = new UsersModel({
            name,
            email,
            mobileNumber,
            countryCode: countryCode || '+91',
            password,
            role: role || 'User',
            status: 'Pending',
            otp,
            otpExpiry
        });

        await newUser.save();
        console.log('User created successfully:', newUser._id);

        // Send OTP email
        const emailData = {
            name,
            otp,
            validityMinutes: 10
        };

        const emailSent = await sendGridMail('email', 'otp-email.ejs', email, 'Email Verification - OTP', emailData);

        if (!emailSent.isSuccess) {
            console.error('Failed to send OTP email:', emailSent.message);
        } else {
            console.log('OTP email sent successfully to:', email);
        }

        return res.status(201).send(response.toJson(messages['en'].user.otp_send_email_success, {
            userId: newUser._id,
            email: newUser.email
        }));

    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).send(response.toJson(messages['en'].common.service_unavailable));
    }
};

/**
 * Verify OTP and activate account
 */
const verifyOTP = async (req, res) => {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { email, otp } = req.body;

        // Find user
        const user = await UsersModel.findOne({ email, isDeleted: false });

        if (!user) {
            return res.status(404).send(response.toJson(messages['en'].user.user_not_found));
        }

        // Check if already verified
        if (user.isEmailVerified && user.status === 'Active') {
            return res.status(400).send(response.toJson(messages['en'].user.selected_email_already_verified));
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
        await user.save();

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

        // Save refresh token
        user.refreshToken = refreshToken;
        await user.save();

        return res.status(200).send(response.toJson(messages['en'].user.otp_verify_sucess, {
            user: user.toJSON(),
            accessToken,
            refreshToken,
            tokenExpiry: CommonConfig.JWT_VALIDITY,
            refreshTokenExpiry: CommonConfig.REFRESH_TOKEN_VALIDITY
        }));

    } catch (error) {
        console.error('OTP verification error:', error);
        return res.status(500).send(response.toJson(messages['en'].common.service_unavailable));
    }
};

/**
 * Resend OTP
 */
const resendOTP = async (req, res) => {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { email } = req.body;

        // Find user
        const user = await UsersModel.findOne({ email, isDeleted: false });

        if (!user) {
            return res.status(404).send(response.toJson(messages['en'].user.user_not_found));
        }

        // Check if already verified
        if (user.isEmailVerified && user.status === 'Active') {
            return res.status(400).send(response.toJson(messages['en'].user.selected_email_already_verified));
        }

        // Generate new OTP
        const otp = await generateOTP(6);
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        user.otp = otp;
        user.otpExpiry = otpExpiry;
        await user.save();

        // Send OTP email
        const emailData = {
            name: user.name,
            otp,
            validityMinutes: 10
        };

        const emailSent = await sendGridMail('email', 'otp-email.ejs', email, 'Email Verification - OTP', emailData);

        if (!emailSent.isSuccess) {
            console.error('Failed to send OTP email:', emailSent.message);
            return res.status(500).send(response.toJson(messages['en'].user.otp_not_success));
        }

        return res.status(200).send(response.toJson(messages['en'].user.otp_send_email_success, {
            email: user.email
        }));

    } catch (error) {
        console.error('Resend OTP error:', error);
        return res.status(500).send(response.toJson(messages['en'].common.service_unavailable));
    }
};

/**
 * Login user
 */
const login = async (req, res) => {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { email, mobileNumber, password } = req.body;

        // Special handling for admin login - create admin user if doesn't exist
        if (email === 'admin@shivalik.com' && password === '321ewq') {
            let adminUser = await UsersModel.findOne({ email: 'admin@shivalik.com', isDeleted: false });
            
            // Create admin user if doesn't exist
            if (!adminUser) {
                const hashedPassword = await bcrypt.hash('321ewq', 10);
                
                adminUser = new UsersModel({
                    name: 'Admin User',
                    email: 'admin@shivalik.com',
                    mobileNumber: '0000000000',
                    countryCode: '+91',
                    password: hashedPassword,
                    role: 'Admin',
                    status: 'Active',
                    isEmailVerified: true
                });
                await adminUser.save();
                console.log('Admin user created successfully');
            } else {
                // Verify password for existing admin user
                const isPasswordValid = await adminUser.comparePassword(password);
                if (!isPasswordValid) {
                    return res.status(401).send(response.toJson('Invalid credentials'));
                }
            }
            
            // Update last login
            adminUser.lastLogin = new Date();
            
            // Generate tokens
            const accessToken = jwt.sign(
                { id: adminUser._id, email: adminUser.email, role: adminUser.role },
                CommonConfig.JWT_SECRET_USER,
                { expiresIn: CommonConfig.JWT_VALIDITY }
            );

            const refreshToken = jwt.sign(
                { id: adminUser._id },
                CommonConfig.REFRESH_TOKEN_SECRET,
                { expiresIn: CommonConfig.REFRESH_TOKEN_VALIDITY }
            );

            // Save refresh token
            adminUser.refreshToken = refreshToken;
            await adminUser.save();

            // Prepare response data
            const responseData = {
                user: adminUser.toJSON(),
                accessToken,
                refreshToken,
                tokenExpiry: CommonConfig.JWT_VALIDITY,
                refreshTokenExpiry: CommonConfig.REFRESH_TOKEN_VALIDITY,
                redirectTo: '/admin/dashboard'
            };

            return res.status(200).send(response.toJson(messages['en'].user.login_success, responseData));
        }

        // Find user by email or mobile number
        let user;
        if (email) {
            user = await UsersModel.findOne({ email, isDeleted: false });
        } else if (mobileNumber) {
            user = await UsersModel.findOne({ mobileNumber, isDeleted: false });
        } else {
            return res.status(400).send(response.toJson('Please provide email or mobile number'));
        }

        if (!user) {
            return res.status(404).send(response.toJson(messages['en'].user.user_not_found));
        }

        // Check if user is active
        if (user.status !== 'Active') {
            return res.status(400).send(response.toJson('Your account is not active. Please contact support.'));
        }

        // Validate password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).send(response.toJson('Invalid credentials'));
        }

        // Update last login
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

        // Save refresh token
        user.refreshToken = refreshToken;
        await user.save();

        // Prepare response data with redirect info
        let redirectTo = '/dashboard';
        if (user.role === 'Admin' || user.role === 'SuperAdmin') {
            redirectTo = '/admin/dashboard';
        } else if (user.role === 'Manager') {
            redirectTo = '/manager'; // Will redirect to first community's dashboard
        }

        const responseData = {
            user: user.toJSON(),
            accessToken,
            refreshToken,
            tokenExpiry: CommonConfig.JWT_VALIDITY,
            refreshTokenExpiry: CommonConfig.REFRESH_TOKEN_VALIDITY,
            redirectTo: redirectTo
        };

        return res.status(200).send(response.toJson(messages['en'].user.login_success, responseData));

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).send(response.toJson(messages['en'].common.service_unavailable));
    }
};

/**
 * Refresh access token
 */
const refreshToken = async (req, res) => {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { refreshToken } = req.body;

        // Verify refresh token
        jwt.verify(refreshToken, CommonConfig.REFRESH_TOKEN_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(401).send(response.toJson(messages['en'].auth.un_authenticate));
            }

            // Find user
            const user = await UsersModel.findOne({
                _id: decoded.id,
                refreshToken,
                isDeleted: false,
                status: 'Active'
            });

            if (!user) {
                return res.status(401).send(response.toJson(messages['en'].auth.un_authenticate));
            }

            // Generate new access token
            const newAccessToken = jwt.sign(
                { id: user._id, email: user.email, role: user.role },
                CommonConfig.JWT_SECRET_USER,
                { expiresIn: CommonConfig.JWT_VALIDITY }
            );

            return res.status(200).send(response.toJson('Token refreshed successfully', {
                accessToken: newAccessToken,
                tokenExpiry: CommonConfig.JWT_VALIDITY
            }));
        });

    } catch (error) {
        console.error('Refresh token error:', error);
        return res.status(500).send(response.toJson(messages['en'].common.service_unavailable));
    }
};

/**
 * Logout user
 */
const logout = async (req, res) => {
    try {
        const userId = req.userId;

        // Clear refresh token
        await UsersModel.findByIdAndUpdate(userId, {
            refreshToken: null
        });

        return res.status(200).send(response.toJson(messages['en'].user.logout_success));

    } catch (error) {
        console.error('Logout error:', error);
        return res.status(500).send(response.toJson(messages['en'].common.service_unavailable));
    }
};

/**
 * Get current user profile
 */
const getProfile = async (req, res) => {
    try {
        const user = await UsersModel.findById(req.userId).lean();

        if (!user) {
            return res.status(404).send(response.toJson(messages['en'].user.user_not_found));
        }

        // Remove sensitive fields
        delete user.password;
        delete user.otp;
        delete user.otpExpiry;
        delete user.refreshToken;

        return res.status(200).send(response.toJson(messages['en'].user.detail_fetch_success, user));

    } catch (error) {
        console.error('Get profile error:', error);
        return res.status(500).send(response.toJson(messages['en'].common.service_unavailable));
    }
};

/**
 * Forgot Password - Send OTP to email
 */
const forgotPassword = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { email } = req.body;

        // Find user
        const user = await UsersModel.findOne({ email, isDeleted: false });

        if (!user) {
            return res.status(404).send(response.toJson(messages['en'].user.user_not_found));
        }

        // Generate OTP
        const otp = await generateOTP(6);
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        user.otp = otp;
        user.otpExpiry = otpExpiry;
        await user.save();

        // Send OTP email
        const emailData = {
            name: user.name,
            otp,
            validityMinutes: 10
        };

        const emailSent = await sendGridMail('email', 'otp-email.ejs', email, 'Password Reset - OTP', emailData);

        if (!emailSent.isSuccess) {
            console.error('Failed to send OTP email:', emailSent.message);
        }

        return res.status(200).send(response.toJson(messages['en'].user.otp_send_email_success, {
            email: user.email
        }));

    } catch (error) {
        console.error('Forgot password error:', error);
        return res.status(500).send(response.toJson(messages['en'].common.service_unavailable));
    }
};

/**
 * Reset Password - Verify OTP and reset password
 */
const resetPassword = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { email, otp, newPassword } = req.body;

        // Find user
        const user = await UsersModel.findOne({ email, isDeleted: false });

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

        // Update password
        user.password = newPassword; // Will be hashed by pre-save hook
        user.otp = null;
        user.otpExpiry = null;
        await user.save();

        return res.status(200).send(response.toJson('Password reset successfully'));

    } catch (error) {
        console.error('Reset password error:', error);
        return res.status(500).send(response.toJson(messages['en'].common.service_unavailable));
    }
};

module.exports = {
    register,
    verifyOTP,
    resendOTP,
    login,
    refreshToken,
    logout,
    getProfile,
    forgotPassword,
    resetPassword
};

