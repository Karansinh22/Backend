const messages = require("../message");
const response = require("../config/response.js");
const UsersModel = require('../models/Users.js');
const CommunitiesModel = require('../models/Communities.js');
const CommunityManagersModel = require('../models/CommunityManagers.js');

/**
 * Middleware to verify if user is a manager for a specific community
 */
const verifyManager = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).send(response.toJson(messages['en'].auth.un_authenticate));
        }

        // Check if user has Manager role
        if (req.user.role !== 'Manager') {
            // Also check if user is assigned as manager in CommunityManagers collection
            const managerRecord = await CommunityManagersModel.findOne({
                userId: req.user._id,
                status: 'Active',
                isDeleted: false
            });

            if (!managerRecord) {
                return res.status(403).send(response.toJson(messages['en'].auth.not_access));
            }
        }

        next();
    } catch (error) {
        console.error('Manager verification error:', error);
        return res.status(500).send(response.toJson(messages['en'].common.service_unavailable));
    }
};

/**
 * Middleware to verify if user is a manager for a specific community
 * Requires communityId to be passed in request params or body
 */
const verifyCommunityManager = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).send(response.toJson(messages['en'].auth.un_authenticate));
        }

        // Get communityId from params or body
        const communityId = req.params.communityId || req.body.communityId;

        if (!communityId) {
            return res.status(400).send(response.toJson('Community ID is required'));
        }

        // Check if user is the creator/owner of the community
        const community = await CommunitiesModel.findOne({
            _id: communityId,
            isDeleted: false
        });

        if (!community) {
            return res.status(404).send(response.toJson(messages['en'].common.not_exists));
        }

        // If user is the creator, allow access
        if (community.createdBy.toString() === req.user._id.toString()) {
            req.community = community;
            return next();
        }

        // Check if user has Manager role for this specific community
        const managerRecord = await CommunityManagersModel.findOne({
            userId: req.user._id,
            communityId: communityId,
            status: 'Active',
            isDeleted: false
        }).populate('userId', 'name email role');

        if (!managerRecord) {
            return res.status(403).send(response.toJson(messages['en'].auth.not_access));
        }

        // Attach community and manager record to request
        req.community = community;
        req.managerRecord = managerRecord;

        next();
    } catch (error) {
        console.error('Community manager verification error:', error);
        return res.status(500).send(response.toJson(messages['en'].common.service_unavailable));
    }
};

module.exports = {
    verifyManager,
    verifyCommunityManager
};




