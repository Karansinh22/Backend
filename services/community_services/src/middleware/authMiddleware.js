const jwt = require('jsonwebtoken');
const UsersModel = require('../models/Users');
const messages = require('../message');
const response = require('../config/response');
const CommonConfig = require('../config/common');

/**
 * Middleware to verify JWT access token
 */
const verifyToken = async (req, res, next) => {
    try {
        const token = req.header('Authorization');

        if (!token) {
            return res.status(401).send(response.toJson(messages['en'].auth.empty_token));
        }

        // Handle admin token for offline access
        if (token === 'admin-token') {
            try {
                // Try to find an existing admin user first
                let adminUser = await UsersModel.findOne({
                    $or: [
                        { email: 'admin@shivalik.com', isDeleted: false },
                        { role: 'SuperAdmin', status: 'Active', isDeleted: false },
                        { role: 'Admin', status: 'Active', isDeleted: false }
                    ]
                }).lean();

                // If no admin user exists, try to create one
                if (!adminUser) {
                    try {
                        const bcrypt = require('bcryptjs');
                        const newAdmin = new UsersModel({
                            name: 'System Admin',
                            email: 'admin@shivalik.com',
                            mobileNumber: '9999999999',
                            countryCode: '+91',
                            password: await bcrypt.hash('Admin@123', 10),
                            role: 'SuperAdmin',
                            status: 'Active',
                            isEmailVerified: true
                        });
                        const savedAdmin = await newAdmin.save();
                        adminUser = savedAdmin.toObject(); // Convert to plain object
                        console.log('✅ Created admin user for offline access:', adminUser._id);
                    } catch (createError) {
                        // If creation fails (e.g., duplicate email), try to find again
                        if (createError.code === 11000 || createError.name === 'MongoServerError') {
                            adminUser = await UsersModel.findOne({
                                email: 'admin@shivalik.com',
                                isDeleted: false
                            }).lean();
                            if (adminUser) {
                                console.log('✅ Found existing admin user after creation attempt:', adminUser._id);
                            }
                        }
                        // If still no user, try to find any active admin
                        if (!adminUser) {
                            adminUser = await UsersModel.findOne({
                                role: { $in: ['Admin', 'SuperAdmin'] },
                                status: 'Active',
                                isDeleted: false
                            }).lean();
                            if (adminUser) {
                                console.log('✅ Using any available admin user:', adminUser._id);
                            }
                        }
                    }
                } else {
                    console.log('✅ Using existing admin user for offline access:', adminUser._id);
                }

                // If we still don't have an admin user, we need to return an error
                if (!adminUser) {
                    console.error('❌ No admin user found and could not create one');
                    return res.status(500).send(response.toJson('Admin user not found. Please create an admin user in the database.'));
                }
                
                // Attach user to request - _id should already be a valid ObjectId from MongoDB
                req.userId = adminUser._id;
                req.user = adminUser;
                return next();
            } catch (error) {
                console.error('❌ Error in admin token authentication:', error);
                return res.status(500).send(response.toJson('Authentication error. Please contact administrator.'));
            }
        }

        // Verify JWT token
        jwt.verify(token, CommonConfig.JWT_SECRET_USER, async (err, decoded) => {
            if (err) {
                return res.status(401).send(response.toJson(messages['en'].auth.un_authenticate));
            }

            // Find user
            const user = await UsersModel.findOne({
                _id: decoded.id,
                isDeleted: false
            }).lean();

            if (!user) {
                return res.status(401).send(response.toJson(messages['en'].auth.un_authenticate));
            }

            // Check if user is active
            if (user.status !== 'Active') {
                return res.status(401).send(response.toJson(messages['en'].auth.un_authenticate));
            }

            // Attach user to request
            req.userId = decoded.id;
            req.user = user;
            next();
        });
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(500).send(response.toJson(messages['en'].common.service_unavailable));
    }
};

/**
 * Middleware to verify admin role
 */
const verifyAdmin = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).send(response.toJson(messages['en'].auth.un_authenticate));
        }

        if (req.user.role !== 'Admin' && req.user.role !== 'SuperAdmin') {
            return res.status(403).send(response.toJson(messages['en'].auth.not_access));
        }

        next();
    } catch (error) {
        console.error('Admin verification error:', error);
        return res.status(500).send(response.toJson(messages['en'].common.service_unavailable));
    }
};

/**
 * Middleware to verify super admin role
 */
const verifySuperAdmin = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).send(response.toJson(messages['en'].auth.un_authenticate));
        }

        if (req.user.role !== 'SuperAdmin') {
            return res.status(403).send(response.toJson(messages['en'].auth.not_access));
        }

        next();
    } catch (error) {
        console.error('Super admin verification error:', error);
        return res.status(500).send(response.toJson(messages['en'].common.service_unavailable));
    }
};

/**
 * Optional authentication - does not fail if token is invalid
 */
const optionalAuth = async (req, res, next) => {
    try {
        const token = req.header('Authorization');

        if (!token) {
            return next();
        }

        jwt.verify(token, CommonConfig.JWT_SECRET_USER, async (err, decoded) => {
            if (err) {
                return next();
            }

            const user = await UsersModel.findOne({
                _id: decoded.id,
                isDeleted: false,
                status: 'Active'
            }).lean();

            if (user) {
                req.userId = decoded.id;
                req.user = user;
            }

            next();
        });
    } catch (error) {
        next();
    }
};

module.exports = {
    verifyToken,
    verifyAdmin,
    verifySuperAdmin,
    optionalAuth
};

