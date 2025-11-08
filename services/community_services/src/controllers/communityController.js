const messages = require("../message");
const response = require("../config/response.js");
const { validationResult } = require('express-validator');
const CommunitiesModel = require('../models/Communities.js');
const AmenitiesModel = require('../models/Amenities.js');
const EventsModel = require('../models/Events.js');
const AnnouncementsModel = require('../models/Announcements.js');
const CommunityJoinRequestsModel = require('../models/CommunityJoinRequests.js');
const PulsesModel = require('../models/Pulses.js');
const MarketplaceListingsModel = require('../models/MarketplaceListings.js');

// Get Featured Communities for Landing Page
const getFeaturedCommunities = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 6;
        
        // First try to find communities explicitly marked as featured
        let communities = await CommunitiesModel.find({
            isFeatured: true,
            status: { $in: ['Active', 'active'] },
            isDeleted: false
        })
        .populate('amenityIds', 'name icon')
        .populate('managerId', 'name email')
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean();

        // If no featured communities found, get the most recent active communities as fallback
        if (communities.length === 0) {
            communities = await CommunitiesModel.find({
                status: { $in: ['Active', 'active'] },
                isDeleted: false
            })
            .populate('amenityIds', 'name icon')
            .populate('managerId', 'name email')
            .limit(limit)
            .sort({ createdAt: -1 })
            .lean();
        }

        return res.status(200).send(response.toJson(
            messages['en'].common.detail_success,
            communities
        ));

    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

// Get All Communities (with pagination and filters)
const getAllCommunities = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';
        const statusParam = req.query.status;

        const filter = {
            isDeleted: false
        };

        // Handle status filter - accept both 'Active' and 'active'
        if (statusParam) {
            filter.status = { $in: [statusParam, statusParam.toLowerCase(), statusParam.charAt(0).toUpperCase() + statusParam.slice(1).toLowerCase()] };
        } else {
            // Default: show active communities (both 'Active' and 'active')
            filter.status = { $in: ['Active', 'active'] };
        }

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { 'location.city': { $regex: search, $options: 'i' } }
            ];
        }

        const communities = await CommunitiesModel.find(filter)
            .populate('amenityIds', 'name icon')
            .populate('managerId', 'name email')
            .skip(skip)
            .limit(limit)
            .sort({ isFeatured: -1, createdAt: -1 })
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

// Get Community Details by ID
const getCommunityById = async (req, res) => {
    try {
        const { id } = req.params;

        const community = await CommunitiesModel.findOne({
            _id: id,
            isDeleted: false
        })
        .populate('amenityIds', 'name icon category')
        .populate('createdBy', 'name email')
        .lean();

        if (!community) {
            return res.status(404).send(response.toJson(messages['en'].common.not_exists));
        }

        return res.status(200).send(response.toJson(
            messages['en'].common.detail_success,
            community
        ));

    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

// Get Recent Events
const getRecentEvents = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 6;
        const currentDate = new Date();

        const events = await EventsModel.find({
            isDeleted: false,
            status: { $in: ['Upcoming', 'Ongoing'] },
            eventDate: { $gte: currentDate }
        })
        .populate('communityId', 'name logo location')
        .populate('createdBy', 'name')
        .limit(limit)
        .sort({ eventDate: 1 })
        .lean();

        return res.status(200).send(response.toJson(
            messages['en'].common.detail_success,
            events
        ));

    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

// Get Recent Announcements
const getRecentAnnouncements = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 6;
        const currentDate = new Date();

        const announcements = await AnnouncementsModel.find({
            isDeleted: false,
            status: 'Published',
            publishDate: { $lte: currentDate },
            $or: [
                { expiryDate: null },
                { expiryDate: { $gte: currentDate } }
            ]
        })
        .populate('communityId', 'name logo')
        .populate('createdBy', 'name')
        .limit(limit)
        .sort({ isPinned: -1, publishDate: -1 })
        .lean();

        return res.status(200).send(response.toJson(
            messages['en'].common.detail_success,
            announcements
        ));

    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

// Get All Amenities
const getAllAmenities = async (req, res) => {
    try {
        const amenities = await AmenitiesModel.find({
            isDeleted: false,
            isActive: true
        })
        .sort({ category: 1, name: 1 })
        .lean();

        return res.status(200).send(response.toJson(
            messages['en'].common.detail_success,
            amenities
        ));

    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

// Create Community Join Request (Requires Authentication)
const createJoinRequest = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(response.toJson(errors.errors[0].msg));
    }

    try {
        const { communityId, message } = req.body;
        const userId = req.user.id;

        // Check if community exists
        const community = await CommunitiesModel.findOne({
            _id: communityId,
            isDeleted: false
        });

        if (!community) {
            return res.status(404).send(response.toJson(messages['en'].common.not_exists));
        }

        // Check for existing request
        const existingRequest = await CommunityJoinRequestsModel.findOne({
            userId,
            communityId,
            isDeleted: false
        });

        if (existingRequest) {
            return res.status(400).send(response.toJson(
                'You have already requested to join this community'
            ));
        }

        // Create join request
        const joinRequest = new CommunityJoinRequestsModel({
            userId,
            communityId,
            message: message || '',
            status: 'Pending'
        });

        await joinRequest.save();

        return res.status(201).send(response.toJson(
            'Join request submitted successfully',
            joinRequest
        ));

    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

// Get User's Join Requests (Requires Authentication)
const getUserJoinRequests = async (req, res) => {
    try {
        const userId = req.user.id;

        const requests = await CommunityJoinRequestsModel.find({
            userId,
            isDeleted: false
        })
        .populate('communityId', 'name logo location')
        .populate('reviewedBy', 'name')
        .sort({ createdAt: -1 })
        .lean();

        return res.status(200).send(response.toJson(
            messages['en'].common.detail_success,
            requests
        ));

    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

// Get Pulses for a Community
const getCommunityPulses = async (req, res) => {
    try {
        const { communityId } = req.params;
        const limit = parseInt(req.query.limit) || 10;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;

        // Verify community exists
        const community = await CommunitiesModel.findOne({
            _id: communityId,
            isDeleted: false
        });

        if (!community) {
            return res.status(404).send(response.toJson(messages['en'].common.not_exists));
        }

        // Get pulses for this community
        const pulses = await PulsesModel.find({
            communityId: communityId,
            isDeleted: false,
            status: 'approved'
        })
        .populate('userId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

        const total = await PulsesModel.countDocuments({
            communityId: communityId,
            isDeleted: false,
            status: 'approved'
        });

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

// Get Marketplace Listings for a Community
const getCommunityMarketplaceListings = async (req, res) => {
    try {
        const { communityId } = req.params;
        const limit = parseInt(req.query.limit) || 10;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;
        const type = req.query.type; // 'want' or 'offer'

        // Verify community exists
        const community = await CommunitiesModel.findOne({
            _id: communityId,
            isDeleted: false
        });

        if (!community) {
            return res.status(404).send(response.toJson(messages['en'].common.not_exists));
        }

        // Build filter
        const filter = {
            communityId: communityId,
            isDeleted: false,
            status: { $in: ['approved', 'sold'] }
        };

        if (type) {
            filter.type = type;
        }

        // Get marketplace listings for this community
        const listings = await MarketplaceListingsModel.find(filter)
        .populate('userId', 'name')
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

// Get Community Members (simplified version)
const getCommunityMembers = async (req, res) => {
    try {
        const { communityId } = req.params;

        // Verify community exists
        const community = await CommunitiesModel.findOne({
            _id: communityId,
            isDeleted: false
        }).populate('managerId', 'name email');

        if (!community) {
            return res.status(404).send(response.toJson(messages['en'].common.not_exists));
        }

        // For now, return a simplified members list
        // In a real implementation, you might want to fetch actual user details
        const members = [
            {
                _id: community.managerId._id,
                name: community.managerId.name,
                email: community.managerId.email,
                role: 'Manager',
                isManager: true
            }
        ];

        // Add other members if available
        if (community.members && community.members.length > 0) {
            // This would normally fetch actual user details from the users collection
            // For now, we'll just return a simplified structure
            community.members.forEach((memberId, index) => {
                members.push({
                    _id: memberId,
                    name: `Member ${index + 1}`,
                    role: 'Resident',
                    isManager: false
                });
            });
        }

        return res.status(200).send(response.toJson(
            messages['en'].common.detail_success,
            members
        ));

    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

// Get Community Events
const getCommunityEvents = async (req, res) => {
    try {
        const { communityId } = req.params;
        const limit = parseInt(req.query.limit) || 10;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;

        // Verify community exists
        const community = await CommunitiesModel.findOne({
            _id: communityId,
            isDeleted: false
        });

        if (!community) {
            return res.status(404).send(response.toJson(messages['en'].common.not_exists));
        }

        // Get events for this community
        const events = await EventsModel.find({
            communityId: communityId,
            isDeleted: false,
            status: { $in: ['Upcoming', 'Ongoing'] }
        })
        .populate('createdBy', 'name')
        .sort({ eventDate: 1 })
        .skip(skip)
        .limit(limit)
        .lean();

        const total = await EventsModel.countDocuments({
            communityId: communityId,
            isDeleted: false,
            status: { $in: ['Upcoming', 'Ongoing'] }
        });

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

module.exports = {
    getFeaturedCommunities,
    getAllCommunities,
    getCommunityById,
    getRecentEvents,
    getRecentAnnouncements,
    getAllAmenities,
    createJoinRequest,
    getUserJoinRequests,
    getCommunityPulses,
    getCommunityMarketplaceListings,
    getCommunityMembers,
    getCommunityEvents
};
