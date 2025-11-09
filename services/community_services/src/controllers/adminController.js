const messages = require("../message");
const response = require("../config/response.js");
const { validationResult } = require('express-validator');
const CommunitiesModel = require('../models/Communities.js');
const UsersModel = require('../models/Users.js');
const EventsModel = require('../models/Events.js');
const ReportsModel = require('../models/Reports.js');
const RoleChangeRequestsModel = require('../models/RoleChangeRequests.js');
const CommunityJoinRequestsModel = require('../models/CommunityJoinRequests.js');
const MarketplaceListingsModel = require('../models/MarketplaceListings.js');
const PulsesModel = require('../models/Pulses.js');
const mongoose = require('mongoose');
const path = require('path');

/**
 * Get admin dashboard statistics
 */
const getDashboardStats = async (req, res) => {
    try {
        // Get communities created by current admin
        const communitiesCount = await CommunitiesModel.countDocuments({
            createdBy: req.user._id,
            isDeleted: false
        });

        // Get users in communities created by current admin
        const communities = await CommunitiesModel.find({
            createdBy: req.user._id,
            isDeleted: false
        }).select('_id');

        const communityIds = communities.map(community => community._id);

        // Get all users in these communities (members + managers)
        const usersCount = await UsersModel.countDocuments({
            $or: [
                { communityId: { $in: communityIds } },
                { _id: { $in: communities.map(c => c.managerId) } }
            ],
            isDeleted: false
        });

        // Get events in communities created by current admin
        const eventsCount = await EventsModel.countDocuments({
            communityId: { $in: communityIds },
            isDeleted: false,
            status: { $in: ['Upcoming', 'Ongoing', 'upcoming', 'ongoing'] }
        });

        // Get reports count
        const reportsCount = await ReportsModel.countDocuments({
            communityId: { $in: communityIds },
            isDeleted: false
        });

        const stats = {
            totalUsers: usersCount,
            totalCommunities: communitiesCount,
            activeEvents: eventsCount,
            totalReports: reportsCount
        };

        return res.status(200).send(response.toJson(
            messages['en'].common.detail_success,
            stats
        ));

    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

/**
 * Get communities created by current admin
 */
const getAdminCommunities = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';
        const statusParam = req.query.status;

        const filter = {
            createdBy: req.user._id,
            isDeleted: false
        };

        // Handle status filter
        if (statusParam) {
            filter.status = { $in: [statusParam, statusParam.toLowerCase(), statusParam.charAt(0).toUpperCase() + statusParam.slice(1).toLowerCase()] };
        }

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { 'location.city': { $regex: search, $options: 'i' } }
            ];
        }

        const communities = await CommunitiesModel.find(filter)
            .populate('managerId', 'name email')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })
            .lean();

        const total = await CommunitiesModel.countDocuments(filter);

        return res.status(200).send(response.toJson(
            messages['en'].common.detail_success,
            {
                communities,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            }
        ));

    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

/**
 * Get users in communities created by current admin
 */
const getCommunityUsers = async (req, res) => {
    try {
        const { communityId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';
        const statusParam = req.query.status;

        // Verify community exists and was created by current admin
        const community = await CommunitiesModel.findOne({
            _id: communityId,
            createdBy: req.user._id,
            isDeleted: false
        });

        if (!community) {
            return res.status(404).send(response.toJson(messages['en'].common.not_exists));
        }

        // Build user filter
        const userFilter = {
            $or: [
                { communityId: communityId },
                { _id: community.managerId }
            ],
            isDeleted: false
        };

        // Handle status filter
        if (statusParam) {
            userFilter.status = statusParam;
        }

        if (search) {
            userFilter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await UsersModel.find(userFilter)
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })
            .lean();

        const total = await UsersModel.countDocuments(userFilter);

        return res.status(200).send(response.toJson(
            messages['en'].common.detail_success,
            {
                users,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            }
        ));

    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

/**
 * Get events in communities created by current admin
 */
const getCommunityEvents = async (req, res) => {
    try {
        const { communityId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';
        const statusParam = req.query.status;

        // Verify community exists and was created by current admin
        const community = await CommunitiesModel.findOne({
            _id: communityId,
            createdBy: req.user._id,
            isDeleted: false
        });

        if (!community) {
            return res.status(404).send(response.toJson(messages['en'].common.not_exists));
        }

        // Build event filter
        const eventFilter = {
            communityId: communityId,
            isDeleted: false
        };

        // Handle status filter
        if (statusParam) {
            eventFilter.status = { $in: [statusParam, statusParam.toLowerCase(), statusParam.charAt(0).toUpperCase() + statusParam.slice(1).toLowerCase()] };
        }

        if (search) {
            eventFilter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const events = await EventsModel.find(eventFilter)
            .populate('createdBy', 'name')
            .skip(skip)
            .limit(limit)
            .sort({ eventDate: -1 })
            .lean();

        const total = await EventsModel.countDocuments(eventFilter);

        return res.status(200).send(response.toJson(
            messages['en'].common.detail_success,
            {
                events,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            }
        ));

    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

/**
 * Get all users in communities created by current admin
 */
const getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';
        const statusParam = req.query.status;

        // Get communities created by current admin
        const communities = await CommunitiesModel.find({
            createdBy: req.user._id,
            isDeleted: false
        }).select('_id managerId');

        const communityIds = communities.map(community => community._id);

        // Build user filter
        const userFilter = {
            $or: [
                { communityId: { $in: communityIds } },
                { _id: { $in: communities.map(c => c.managerId) } }
            ],
            isDeleted: false
        };

        // Handle status filter
        if (statusParam) {
            userFilter.status = statusParam;
        }

        if (search) {
            userFilter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await UsersModel.find(userFilter)
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })
            .lean();

        const total = await UsersModel.countDocuments(userFilter);

        return res.status(200).send(response.toJson(
            messages['en'].common.detail_success,
            {
                users,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            }
        ));

    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

/**
 * Get recent activities for admin dashboard
 */
const getRecentActivities = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        
        // Get communities created by current admin
        const communities = await CommunitiesModel.find({
            createdBy: req.user._id,
            isDeleted: false
        }).select('_id');

        const communityIds = communities.map(community => community._id);

        // Get recent user registrations
        const recentUsers = await UsersModel.find({
            $or: [
                { communityId: { $in: communityIds } },
                { _id: { $in: communities.map(c => c.managerId) } }
            ],
            isDeleted: false
        })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

        // Get recent community events
        const recentEvents = await EventsModel.find({
            communityId: { $in: communityIds },
            isDeleted: false
        })
        .populate('communityId', 'name')
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

        // Format activities
        const userActivities = recentUsers.map(user => ({
            type: 'user',
            action: `New user registered: ${user.name}`,
            user: user.name,
            time: new Date(user.createdAt).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }),
            timestamp: user.createdAt
        }));

        const eventActivities = recentEvents.map(event => ({
            type: 'event',
            action: `New event created: ${event.title}`,
            user: event.createdBy?.name || 'Unknown',
            community: event.communityId?.name || 'Unknown Community',
            time: new Date(event.createdAt).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }),
            timestamp: event.createdAt
        }));

        // Combine and sort all activities by timestamp
        const allActivities = [...userActivities, ...eventActivities]
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);

        return res.status(200).send(response.toJson(
            messages['en'].common.detail_success,
            allActivities
        ));

    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

/**
 * Get reports for communities created by current admin
 */
const getReports = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';
        const statusParam = req.query.status;
        const typeParam = req.query.type;

        // Get communities created by current admin
        const communities = await CommunitiesModel.find({
            createdBy: req.user._id,
            isDeleted: false
        }).select('_id');

        const communityIds = communities.map(community => community._id);

        // Build report filter
        const reportFilter = {
            communityId: { $in: communityIds },
            isDeleted: false
        };

        // Handle status filter
        if (statusParam) {
            reportFilter.status = statusParam;
        }

        // Handle type filter
        if (typeParam) {
            reportFilter.type = typeParam;
        }

        if (search) {
            reportFilter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const reports = await ReportsModel.find(reportFilter)
            .populate('createdBy', 'name')
            .populate('communityId', 'name')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })
            .lean();

        const total = await ReportsModel.countDocuments(reportFilter);

        return res.status(200).send(response.toJson(
            messages['en'].common.detail_success,
            {
                reports,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            }
        ));

    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

/**
 * Create a new community
 */
const createCommunity = async (req, res) => {
    try {
        console.log('Create community request body:', req.body);
        console.log('Create community file:', req.file);
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).send(response.toJson(errors.array()[0].msg));
        }

        const {
            name,
            description,
            territory,
            status,
            dynamicFields,
            location
        } = req.body;

        // Parse location data if it's a string (from FormData)
        let parsedLocation = location;
        if (typeof location === 'string') {
            try {
                parsedLocation = JSON.parse(location);
            } catch (e) {
                parsedLocation = {};
            }
        }

        // Extract location fields
        const address = parsedLocation?.address || '';
        const city = parsedLocation?.city || '';
        const state = parsedLocation?.state || '';
        const zipCode = parsedLocation?.zipCode || '';
        const country = parsedLocation?.country || 'India';

        // Handle file upload using fileUpload middleware pattern
        let bannerImage = null;
        if (req.files && req.files.bannerImage) {
            const file = req.files.bannerImage;
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const filename = 'bannerImage-' + uniqueSuffix + '.' + file.name.split('.').pop();
            const uploadPath = path.join(__dirname, '../uploads/', filename);
            
            // Save file
            await file.mv(uploadPath);
            bannerImage = `/uploads/${filename}`;
        }

        // Check if community with this name already exists
        const existingCommunity = await CommunitiesModel.findOne({
            name: name,
            isDeleted: false
        });

        if (existingCommunity) {
            return res.status(400).send(response.toJson('A community with this name already exists'));
        }

        // Create new community
        const newCommunity = new CommunitiesModel({
            name,
            description,
            bannerImage: bannerImage || null,
            territory: territory || null,
            status: status || 'active',
            managerId: req.user._id, // Always set to current admin
            createdBy: req.user._id,
            location: {
                address: address || '',
                city: city || '',
                state: state || '',
                zipCode: zipCode || '',
                country: country || 'India'
            }
        });

        // Parse and add dynamic fields if provided
        let parsedDynamicFields = dynamicFields;
        if (typeof dynamicFields === 'string') {
            try {
                parsedDynamicFields = JSON.parse(dynamicFields);
            } catch (e) {
                parsedDynamicFields = {};
            }
        }
        
        if (parsedDynamicFields) {
            Object.assign(newCommunity, parsedDynamicFields);
        }

        await newCommunity.save();

        // Populate manager details
        await newCommunity.populate('managerId', 'name email');

        return res.status(201).send(response.toJson(
            'Community created successfully',
            newCommunity
        ));

    } catch (err) {
        console.error('Error creating community:', err.message);
        console.error('Error stack:', err.stack);
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

/**
 * Update a community
 */
const updateCommunity = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Verify community exists and was created by current admin
        const community = await CommunitiesModel.findOne({
            _id: id,
            createdBy: req.user._id,
            isDeleted: false
        });

        if (!community) {
            return res.status(404).send(response.toJson(messages['en'].common.not_exists));
        }

        // Update community
        Object.keys(updates).forEach(key => {
            if (key !== '_id' && key !== 'createdBy') {
                community[key] = updates[key];
            }
        });

        await community.save();

        // Populate manager details
        await community.populate('managerId', 'name email');

        return res.status(200).send(response.toJson(
            'Community updated successfully',
            community
        ));

    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

/**
 * Delete a community
 */
const deleteCommunity = async (req, res) => {
    try {
        const { id } = req.params;

        // Verify community exists and was created by current admin
        const community = await CommunitiesModel.findOne({
            _id: id,
            createdBy: req.user._id,
            isDeleted: false
        });

        if (!community) {
            return res.status(404).send(response.toJson(messages['en'].common.not_exists));
        }

        // Mark as deleted
        community.isDeleted = true;
        community.deletedAt = new Date();
        await community.save();

        return res.status(200).send(response.toJson(
            'Community deleted successfully'
        ));

    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

/**
 * Create a role change request
 */
const createRoleChangeRequest = async (req, res) => {
    try {
        const { userId, requestedRole, communityId, reason } = req.body;
        
        // Verify user exists and is in admin's community
        const user = await UsersModel.findOne({
            _id: userId,
            isDeleted: false
        });
        
        if (!user) {
            return res.status(404).send(response.toJson('User not found'));
        }
        
        // Verify community exists and was created by current admin
        const community = await CommunitiesModel.findOne({
            _id: communityId,
            createdBy: req.user._id,
            isDeleted: false
        });
        
        if (!community) {
            return res.status(404).send(response.toJson('Community not found'));
        }
        
        // Check if user is part of this community
        const isUserInCommunity = user.communityId && user.communityId.toString() === communityId;
        if (!isUserInCommunity) {
            return res.status(400).send(response.toJson('User is not part of this community'));
        }
        
        // Check if a pending request already exists
        const existingRequest = await RoleChangeRequestsModel.findOne({
            userId: userId,
            communityId: communityId,
            requestedRole: requestedRole,
            status: 'Pending',
            isDeleted: false
        });
        
        if (existingRequest) {
            return res.status(400).send(response.toJson('A pending request for this role change already exists'));
        }
        
        // Create role change request
        const roleChangeRequest = new RoleChangeRequestsModel({
            userId: userId,
            currentRole: user.role,
            requestedRole: requestedRole,
            communityId: communityId,
            reason: reason
        });
        
        await roleChangeRequest.save();
        
        return res.status(201).send(response.toJson(
            'Role change request created successfully',
            roleChangeRequest
        ));
        
    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

/**
 * Get all role change requests for admin's communities
 */
const getRoleChangeRequests = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';
        const statusParam = req.query.status;
        
        // Get communities created by current admin
        const communities = await CommunitiesModel.find({
            createdBy: req.user._id,
            isDeleted: false
        }).select('_id');
        
        const communityIds = communities.map(community => community._id);
        
        // Build request filter
        const requestFilter = {
            communityId: { $in: communityIds },
            isDeleted: false
        };
        
        // Handle status filter
        if (statusParam) {
            requestFilter.status = statusParam;
        }
        
        if (search) {
            // Search by user name or email
            const users = await UsersModel.find({
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ],
                isDeleted: false
            }).select('_id');
            
            const userIds = users.map(user => user._id);
            requestFilter.userId = { $in: userIds };
        }
        
        const requests = await RoleChangeRequestsModel.find(requestFilter)
            .populate('userId', 'name email role')
            .populate('communityId', 'name')
            .populate('reviewedBy', 'name')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })
            .lean();
        
        const total = await RoleChangeRequestsModel.countDocuments(requestFilter);
        
        return res.status(200).send(response.toJson(
            messages['en'].common.detail_success,
            {
                requests,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            }
        ));
        
    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

/**
 * Approve a role change request
 */
const approveRoleChangeRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        
        // Find the role change request
        const roleChangeRequest = await RoleChangeRequestsModel.findOne({
            _id: requestId,
            isDeleted: false
        }).populate('userId').populate('communityId');
        
        if (!roleChangeRequest) {
            return res.status(404).send(response.toJson('Role change request not found'));
        }
        
        // Verify community was created by current admin
        if (roleChangeRequest.communityId.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).send(response.toJson('Not authorized to approve this request'));
        }
        
        // Check if request is already processed
        if (roleChangeRequest.status !== 'Pending') {
            return res.status(400).send(response.toJson(`Request is already ${roleChangeRequest.status.toLowerCase()}`));
        }
        
        // Update the request
        roleChangeRequest.status = 'Approved';
        roleChangeRequest.reviewedBy = req.user._id;
        roleChangeRequest.reviewedAt = new Date();
        roleChangeRequest.approvedAt = new Date();
        
        await roleChangeRequest.save();
        
        // Update user's role
        await UsersModel.findByIdAndUpdate(roleChangeRequest.userId._id, {
            role: roleChangeRequest.requestedRole
        });
        
        return res.status(200).send(response.toJson(
            'Role change request approved successfully',
            roleChangeRequest
        ));
        
    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

/**
 * Reject a role change request
 */
const rejectRoleChangeRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { rejectionReason } = req.body;
        
        // Find the role change request
        const roleChangeRequest = await RoleChangeRequestsModel.findOne({
            _id: requestId,
            isDeleted: false
        }).populate('userId').populate('communityId');
        
        if (!roleChangeRequest) {
            return res.status(404).send(response.toJson('Role change request not found'));
        }
        
        // Verify community was created by current admin
        if (roleChangeRequest.communityId.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).send(response.toJson('Not authorized to reject this request'));
        }
        
        // Check if request is already processed
        if (roleChangeRequest.status !== 'Pending') {
            return res.status(400).send(response.toJson(`Request is already ${roleChangeRequest.status.toLowerCase()}`));
        }
        
        // Update the request
        roleChangeRequest.status = 'Rejected';
        roleChangeRequest.reviewedBy = req.user._id;
        roleChangeRequest.reviewedAt = new Date();
        roleChangeRequest.rejectionReason = rejectionReason;
        
        await roleChangeRequest.save();
        
        return res.status(200).send(response.toJson(
            'Role change request rejected successfully',
            roleChangeRequest
        ));
        
    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

/**
 * Create a new event for a community
 */
const createCommunityEvent = async (req, res) => {
    try {
        const { communityId } = req.params;
        const {
            title,
            description,
            eventDate,
            startTime,
            endTime,
            location,
            maxParticipants,
            registrationEndDate,
            eventType
        } = req.body;

        // Verify community exists and was created by current admin
        const community = await CommunitiesModel.findOne({
            _id: communityId,
            createdBy: req.user._id,
            isDeleted: false
        });

        if (!community) {
            return res.status(404).send(response.toJson(messages['en'].common.not_exists));
        }

        // Handle file upload using fileUpload middleware pattern
        let images = [];
        if (req.files && req.files.images) {
            const files = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
            
            for (const file of files) {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const filename = 'event-' + uniqueSuffix + '.' + file.name.split('.').pop();
                const uploadPath = path.join(__dirname, '../uploads/', filename);
                
                // Save file
                await file.mv(uploadPath);
                images.push(`/uploads/${filename}`);
            }
        }

        // Create new event
        const newEvent = new EventsModel({
            title,
            description,
            communityId: communityId,
            eventDate: new Date(eventDate),
            startTime,
            endTime,
            location: location || '',
            images: images.length > 0 ? [images[0]] : [], // Only allow one image as per requirements
            maxParticipants: maxParticipants ? parseInt(maxParticipants) : null,
            createdBy: req.user._id,
            eventType: eventType || 'Other',
            status: 'Upcoming'
        });

        await newEvent.save();

        // Populate community and creator details
        await newEvent.populate('communityId', 'name');
        await newEvent.populate('createdBy', 'name');

        return res.status(201).send(response.toJson(
            'Event created successfully',
            newEvent
        ));

    } catch (err) {
        console.error('Error creating event:', err.message);
        console.error('Error stack:', err.stack);
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

/**
 * Get all community join requests for admin's communities
 */
const getJoinRequests = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';
        const statusParam = req.query.status;
        
        // Get communities managed by current admin (managerId or createdBy)
        const communities = await CommunitiesModel.find({
            $or: [
                { managerId: req.user._id },
                { createdBy: req.user._id }
            ],
            isDeleted: false
        }).select('_id');
        
        const communityIds = communities.map(community => community._id);
        
        if (communityIds.length === 0) {
            return res.status(200).send(response.toJson(
                messages['en'].common.detail_success,
                {
                    requests: [],
                    pagination: {
                        total: 0,
                        page: 1,
                        limit: 10,
                        totalPages: 0
                    }
                }
            ));
        }
        
        // Build request filter
        const requestFilter = {
            communityId: { $in: communityIds },
            isDeleted: false
        };
        
        // Handle status filter
        if (statusParam) {
            requestFilter.status = { $in: [statusParam, statusParam.charAt(0).toUpperCase() + statusParam.slice(1).toLowerCase()] };
        }
        
        if (search) {
            // Search by user name or email
            const users = await UsersModel.find({
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ],
                isDeleted: false
            }).select('_id');
            
            const userIds = users.map(user => user._id);
            requestFilter.userId = { $in: userIds };
        }
        
        const requests = await CommunityJoinRequestsModel.find(requestFilter)
            .populate('userId', 'name email role')
            .populate('communityId', 'name logo location')
            .populate('reviewedBy', 'name email')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })
            .lean();
        
        const total = await CommunityJoinRequestsModel.countDocuments(requestFilter);
        
        return res.status(200).send(response.toJson(
            messages['en'].common.detail_success,
            {
                requests,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            }
        ));
        
    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

/**
 * Approve a community join request
 */
const approveJoinRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        
        // Find the join request
        const joinRequest = await CommunityJoinRequestsModel.findOne({
            _id: requestId,
            isDeleted: false
        }).populate('userId').populate('communityId');
        
        if (!joinRequest) {
            return res.status(404).send(response.toJson('Join request not found'));
        }
        
        // Verify admin has permission (is manager or creator of the community)
        const community = await CommunitiesModel.findOne({
            _id: joinRequest.communityId._id,
            $or: [
                { managerId: req.user._id },
                { createdBy: req.user._id }
            ],
            isDeleted: false
        });
        
        if (!community) {
            return res.status(403).send(response.toJson('You do not have permission to approve requests for this community'));
        }
        
        // Check if already processed
        if (joinRequest.status !== 'Pending') {
            return res.status(400).send(response.toJson(`This request has already been ${joinRequest.status.toLowerCase()}`));
        }
        
        // Add user to community members
        const userId = joinRequest.userId._id || joinRequest.userId;
        const communityId = joinRequest.communityId._id || joinRequest.communityId;
        
        // Check if user is already a member
        const isAlreadyMember = community.members.some(
            memberId => memberId.toString() === userId.toString()
        );
        
        if (!isAlreadyMember) {
            // Add user to members array
            community.members.push(userId);
            
            // Remove from pendingRequests if exists
            community.pendingRequests = community.pendingRequests.filter(
                reqId => reqId.toString() !== userId.toString()
            );
            
            await community.save();
        }
        
        // Update user's communityId field (optional - for single community assignment)
        await UsersModel.findByIdAndUpdate(userId, {
            $set: { communityId: communityId }
        });
        
        // Update request status
        joinRequest.status = 'Approved';
        joinRequest.reviewedBy = req.user._id;
        joinRequest.reviewedAt = new Date();
        await joinRequest.save();
        
        await joinRequest.populate('userId', 'name email');
        await joinRequest.populate('communityId', 'name');
        await joinRequest.populate('reviewedBy', 'name email');
        
        return res.status(200).send(response.toJson(
            'Join request approved successfully. User has been added to the community.',
            joinRequest
        ));
        
    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

/**
 * Reject a community join request
 */
const rejectJoinRequest = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).send(response.toJson(errors.array()[0].msg));
        }
        
        const { requestId } = req.params;
        const { rejectionReason } = req.body;
        
        if (!rejectionReason || !rejectionReason.trim()) {
            return res.status(400).send(response.toJson('Rejection reason is required'));
        }
        
        // Find the join request
        const joinRequest = await CommunityJoinRequestsModel.findOne({
            _id: requestId,
            isDeleted: false
        }).populate('userId').populate('communityId');
        
        if (!joinRequest) {
            return res.status(404).send(response.toJson('Join request not found'));
        }
        
        // Verify admin has permission (is manager or creator of the community)
        const community = await CommunitiesModel.findOne({
            _id: joinRequest.communityId._id,
            $or: [
                { managerId: req.user._id },
                { createdBy: req.user._id }
            ],
            isDeleted: false
        });
        
        if (!community) {
            return res.status(403).send(response.toJson('You do not have permission to reject requests for this community'));
        }
        
        // Check if already processed
        if (joinRequest.status !== 'Pending') {
            return res.status(400).send(response.toJson(`This request has already been ${joinRequest.status.toLowerCase()}`));
        }
        
        // Update request status with rejection reason
        joinRequest.status = 'Rejected';
        joinRequest.reviewedBy = req.user._id;
        joinRequest.reviewedAt = new Date();
        joinRequest.reviewNotes = rejectionReason.trim(); // Store rejection message
        await joinRequest.save();
        
        await joinRequest.populate('userId', 'name email');
        await joinRequest.populate('communityId', 'name');
        await joinRequest.populate('reviewedBy', 'name email');
        
        // TODO: Send notification/email to user about rejection with reason
        // You can integrate email service here to notify the user
        
        return res.status(200).send(response.toJson(
            'Join request rejected successfully',
            joinRequest
        ));
        
    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

// Get Marketplace Listings for Approval
const getMarketplaceListings = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';
        const status = req.query.status || 'pending'; // Default to pending

        // Get communities created or managed by current admin
        const communities = await CommunitiesModel.find({
            $or: [
                { createdBy: req.user._id },
                { managerId: req.user._id }
            ],
            isDeleted: false
        }).select('_id');

        const communityIds = communities.map(c => c._id);

        if (communityIds.length === 0) {
            return res.status(200).send(response.toJson(
                messages['en'].common.detail_success,
                {
                    listings: [],
                    pagination: {
                        total: 0,
                        page,
                        limit,
                        totalPages: 0
                    }
                }
            ));
        }

        // Build filter
        const filter = {
            communityId: { $in: communityIds },
            isDeleted: false
        };

        if (status !== 'all') {
            filter.status = status;
        }

        // Search filter
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const listings = await MarketplaceListingsModel.find(filter)
            .populate('userId', 'name email')
            .populate('communityId', 'name')
            .populate('reviewedBy', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await MarketplaceListingsModel.countDocuments(filter);

        return res.status(200).send(response.toJson(
            messages['en'].common.detail_success,
            {
                listings,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            }
        ));
    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

// Approve Marketplace Listing
const approveMarketplaceListing = async (req, res) => {
    try {
        const { listingId } = req.params;

        const listing = await MarketplaceListingsModel.findById(listingId)
            .populate('communityId');

        if (!listing || listing.isDeleted) {
            return res.status(404).send(response.toJson('Product listing not found'));
        }

        // Verify admin has permission for this community
        const community = listing.communityId;
        const isCreator = community.createdBy && community.createdBy.toString() === req.user._id.toString();
        const isManager = community.managerId && community.managerId.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'Admin' || req.user.role === 'SuperAdmin';

        if (!isCreator && !isManager && !isAdmin) {
            return res.status(403).send(response.toJson('You do not have permission to approve listings for this community'));
        }

        listing.status = 'approved';
        listing.reviewedBy = req.user._id;
        listing.reviewedAt = new Date();
        await listing.save();

        return res.status(200).send(response.toJson(
            'Product listing approved successfully',
            listing
        ));
    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

// Reject Marketplace Listing
const rejectMarketplaceListing = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).send(response.toJson(errors.array()[0].msg));
        }

        const { listingId } = req.params;
        const { rejectionReason } = req.body;

        if (!rejectionReason || !rejectionReason.trim()) {
            return res.status(400).send(response.toJson('Rejection reason is required'));
        }

        const listing = await MarketplaceListingsModel.findById(listingId)
            .populate('communityId');

        if (!listing || listing.isDeleted) {
            return res.status(404).send(response.toJson('Product listing not found'));
        }

        // Verify admin has permission for this community
        const community = listing.communityId;
        const isCreator = community.createdBy && community.createdBy.toString() === req.user._id.toString();
        const isManager = community.managerId && community.managerId.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'Admin' || req.user.role === 'SuperAdmin';

        if (!isCreator && !isManager && !isAdmin) {
            return res.status(403).send(response.toJson('You do not have permission to reject listings for this community'));
        }

        listing.status = 'rejected';
        listing.reviewedBy = req.user._id;
        listing.reviewedAt = new Date();
        listing.reviewNotes = rejectionReason.trim();
        await listing.save();

        return res.status(200).send(response.toJson(
            'Product listing rejected successfully',
            listing
        ));
    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

/**
 * Get pending event registrations for admin's communities
 */
const getPendingEventRegistrations = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';

        // Get communities created or managed by current admin
        const communities = await CommunitiesModel.find({
            $or: [
                { createdBy: req.user._id },
                { managerId: req.user._id }
            ],
            isDeleted: false
        }).select('_id');

        const communityIds = communities.map(c => c._id);

        if (communityIds.length === 0) {
            return res.status(200).send(response.toJson(
                messages['en'].common.detail_success,
                {
                    registrations: [],
                    pagination: {
                        total: 0,
                        page,
                        limit,
                        totalPages: 0
                    }
                }
            ));
        }

        // Build filter
        const filter = {
            communityId: { $in: communityIds },
            status: 'pending',
            isDeleted: false
        };

        // Search filter
        if (search) {
            filter.$or = [
                { 'userId.name': { $regex: search, $options: 'i' } },
                { 'eventId.title': { $regex: search, $options: 'i' } }
            ];
        }

        const registrations = await EventRegistrationApprovalsModel.find(filter)
            .populate('userId', 'name email')
            .populate('eventId', 'title eventDate location')
            .populate('communityId', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await EventRegistrationApprovalsModel.countDocuments(filter);

        return res.status(200).send(response.toJson(
            messages['en'].common.detail_success,
            {
                registrations,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            }
        ));
    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        console.error('Error in admin getPendingEventRegistrations:', err); // Add logging for debugging
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

/**
 * Approve event registration
 */
const approveEventRegistration = async (req, res) => {
    try {
        const { approvalId } = req.params;

        // Find the approval request
        const approvalRequest = await EventRegistrationApprovalsModel.findById(approvalId);
        if (!approvalRequest || approvalRequest.isDeleted) {
            return res.status(404).send(response.toJson('Registration request not found'));
        }

        // Verify admin has permission for this community
        const community = await CommunitiesModel.findOne({
            _id: approvalRequest.communityId,
            $or: [
                { createdBy: req.user._id },
                { managerId: req.user._id }
            ],
            isDeleted: false
        });

        if (!community) {
            return res.status(403).send(response.toJson('Not authorized to approve this registration'));
        }

        // Check if request is already processed
        if (approvalRequest.status !== 'pending') {
            return res.status(400).send(response.toJson(`Registration request is already ${approvalRequest.status}`));
        }

        // Generate QR code data
        const qrData = JSON.stringify({
            eventId: approvalRequest.eventId.toString(),
            userId: approvalRequest.userId.toString(),
            approvalId: approvalRequest._id.toString(),
            timestamp: Date.now()
        });

        // Generate QR code image
        const qrCode = await QRCode.toDataURL(qrData);

        // Update approval request
        approvalRequest.status = 'approved';
        approvalRequest.reviewedBy = req.user._id;
        approvalRequest.reviewedAt = new Date();
        approvalRequest.qrCode = qrCode;
        approvalRequest.qrCodeData = qrData;
        await approvalRequest.save();

        // Create actual event registration
        const registration = new EventRegistrationsModel({
            eventId: approvalRequest.eventId,
            userId: approvalRequest.userId,
            status: 'registered',
            qrCode: qrCode,
            qrCodeData: qrData
        });

        await registration.save();

        // Add to event's registered participants
        const event = await EventsModel.findById(approvalRequest.eventId);
        if (event && !event.registeredParticipants.includes(approvalRequest.userId)) {
            event.registeredParticipants.push(approvalRequest.userId);
            await event.save();
        }

        await approvalRequest.populate('userId', 'name email');
        await approvalRequest.populate('eventId', 'title eventDate location');
        await approvalRequest.populate('reviewedBy', 'name email');

        return res.status(200).send(response.toJson(
            'Registration approved successfully',
            approvalRequest
        ));
    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        console.error('Error in admin approveEventRegistration:', err); // Add logging for debugging
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

/**
 * Reject event registration
 */
const rejectEventRegistration = async (req, res) => {
    try {
        const { approvalId } = req.params;
        const { rejectionReason } = req.body;

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).send(response.toJson(errors.array()[0].msg));
        }

        if (!rejectionReason || !rejectionReason.trim()) {
            return res.status(400).send(response.toJson('Rejection reason is required'));
        }

        // Find the approval request
        const approvalRequest = await EventRegistrationApprovalsModel.findById(approvalId);
        if (!approvalRequest || approvalRequest.isDeleted) {
            return res.status(404).send(response.toJson('Registration request not found'));
        }

        // Verify admin has permission for this community
        const community = await CommunitiesModel.findOne({
            _id: approvalRequest.communityId,
            $or: [
                { createdBy: req.user._id },
                { managerId: req.user._id }
            ],
            isDeleted: false
        });

        if (!community) {
            return res.status(403).send(response.toJson('Not authorized to reject this registration'));
        }

        // Check if request is already processed
        if (approvalRequest.status !== 'pending') {
            return res.status(400).send(response.toJson(`Registration request is already ${approvalRequest.status}`));
        }

        // Update approval request
        approvalRequest.status = 'rejected';
        approvalRequest.reviewedBy = req.user._id;
        approvalRequest.reviewedAt = new Date();
        approvalRequest.rejectionReason = rejectionReason.trim();
        await approvalRequest.save();

        await approvalRequest.populate('userId', 'name email');
        await approvalRequest.populate('eventId', 'title eventDate location');
        await approvalRequest.populate('reviewedBy', 'name email');

        return res.status(200).send(response.toJson(
            'Registration rejected successfully',
            approvalRequest
        ));
    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        console.error('Error in admin rejectEventRegistration:', err); // Add logging for debugging
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

/**
 * Get pending pulses for admin approval
 */
const getPulseApprovals = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';
        const status = req.query.status || 'pending';

        // Build filter
        const filter = {
            isDeleted: false
        };

        // Add status filter
        if (status) {
            filter.status = status;
        }

        // Add search filter
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const pulses = await PulsesModel.find(filter)
            .populate('userId', 'name email')
            .populate('communityId', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await PulsesModel.countDocuments(filter);

        return res.status(200).send(response.toJson(
            messages['en'].common.detail_success,
            {
                pulses,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            }
        ));
    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

/**
 * Approve a pulse
 */
const approvePulse = async (req, res) => {
    try {
        const { pulseId } = req.params;

        const pulse = await PulsesModel.findById(pulseId);
        if (!pulse || pulse.isDeleted) {
            return res.status(404).send(response.toJson('Pulse not found'));
        }

        pulse.status = 'approved';
        await pulse.save();

        return res.status(200).send(response.toJson(
            'Pulse approved successfully',
            pulse
        ));
    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

/**
 * Reject a pulse
 */
const rejectPulse = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).send(response.toJson(errors.array()[0].msg));
        }

        const { pulseId } = req.params;
        const { rejectionReason } = req.body;

        const pulse = await PulsesModel.findById(pulseId);
        if (!pulse || pulse.isDeleted) {
            return res.status(404).send(response.toJson('Pulse not found'));
        }

        pulse.status = 'rejected';
        await pulse.save();

        return res.status(200).send(response.toJson(
            'Pulse rejected successfully',
            pulse
        ));
    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

module.exports = {
    getDashboardStats,
    getRecentActivities,
    getAdminCommunities,
    createCommunity,
    updateCommunity,
    deleteCommunity,
    getCommunityUsers,
    getAllUsers,
    getCommunityEvents,
    createCommunityEvent,
    getReports,
    createRoleChangeRequest,
    getRoleChangeRequests,
    approveRoleChangeRequest,
    rejectRoleChangeRequest,
    getJoinRequests,
    approveJoinRequest,
    rejectJoinRequest,
    getMarketplaceListings,
    approveMarketplaceListing,
    rejectMarketplaceListing,
    getPulseApprovals,
    approvePulse,
    rejectPulse
};














