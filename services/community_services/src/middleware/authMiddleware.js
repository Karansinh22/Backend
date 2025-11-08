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

        // Verify token
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

