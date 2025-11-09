const messages = require("../message");
const response = require("../config/response.js");
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
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
        console.log('=== getAllCommunities START ===');
        console.log('Request query params:', req.query);
        
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';
        const statusParam = req.query.status;

        console.log('Parsed params - page:', page, 'limit:', limit, 'skip:', skip, 'search:', search, 'statusParam:', statusParam);

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
        
        console.log('Query filter:', JSON.stringify(filter, null, 2));

        console.log('About to query CommunitiesModel...');
        const communities = await CommunitiesModel.find(filter)
            .populate('amenityIds', 'name icon')
            .populate('managerId', 'name email')
            .skip(skip)
            .limit(limit)
            .sort({ isFeatured: -1, createdAt: -1 })
            .lean();
            
        console.log('Found communities count:', communities.length);

        console.log('About to count total documents...');
        const total = await CommunitiesModel.countDocuments(filter);
        console.log('Total communities:', total);

        console.log('Sending response...');
        const responsePayload = {
            communities,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
        
        console.log('Response payload prepared');
        console.log('=== getAllCommunities END ===');
        return res.status(200).send(response.toJson(
            messages['en'].common.detail_success,
            responsePayload
        ));

    } catch (err) {
        console.error('=== ERROR in getAllCommunities ===');
        console.error('Error details:', err);
        console.error('Error stack:', err.stack);
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
        
        // Get userId from req.user - auth middleware sets req.user._id
        if (!req.user || !req.user._id) {
            return res.status(401).send(response.toJson('User not authenticated'));
        }
        
        // Ensure userId is a valid ObjectId
        let userId = req.user._id;
        if (typeof userId === 'string' && mongoose.Types.ObjectId.isValid(userId)) {
            userId = new mongoose.Types.ObjectId(userId);
        } else if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).send(response.toJson('Invalid user ID'));
        }

        // Ensure communityId is a valid ObjectId
        let validCommunityId = communityId;
        if (typeof communityId === 'string' && mongoose.Types.ObjectId.isValid(communityId)) {
            validCommunityId = new mongoose.Types.ObjectId(communityId);
        } else if (!mongoose.Types.ObjectId.isValid(communityId)) {
            return res.status(400).send(response.toJson('Invalid community ID'));
        }

        console.log('Creating join request for user:', userId, 'community:', validCommunityId);

        // Check if community exists
        const community = await CommunitiesModel.findOne({
            _id: validCommunityId,
            isDeleted: false
        });

        if (!community) {
            return res.status(404).send(response.toJson(messages['en'].common.not_exists));
        }

        // Check for existing request
        const existingRequest = await CommunityJoinRequestsModel.findOne({
            userId,
            communityId: validCommunityId,
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
            communityId: validCommunityId,
            message: message || '',
            status: 'Pending'
        });

        await joinRequest.save();

        console.log('Join request created successfully:', joinRequest._id);

        return res.status(201).send(response.toJson(
            'Join request submitted successfully',
            joinRequest
        ));

    } catch (err) {
        console.error('Error creating join request:', err);
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

// Get User's Join Requests (Requires Authentication)
const getUserJoinRequests = async (req, res) => {
    try {
        // Get userId from req.user - auth middleware sets req.user._id
        if (!req.user || !req.user._id) {
            return res.status(401).send(response.toJson('User not authenticated'));
        }
        
        // Ensure userId is a valid ObjectId
        let userId = req.user._id;
        if (typeof userId === 'string' && mongoose.Types.ObjectId.isValid(userId)) {
            userId = new mongoose.Types.ObjectId(userId);
        } else if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).send(response.toJson('Invalid user ID'));
        }

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
        console.error('Error getting user join requests:', err);
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

// Check if user is a member of a community (Requires Authentication)
const checkCommunityMembership = async (req, res) => {
    try {
        // Get userId from req.user - auth middleware sets req.user._id
        if (!req.user || !req.user._id) {
            return res.status(401).send(response.toJson('User not authenticated'));
        }
        
        const { communityId } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(communityId)) {
            return res.status(400).send(response.toJson('Invalid community ID'));
        }

        // Ensure userId is a valid ObjectId
        let userId = req.user._id;
        if (typeof userId === 'string' && mongoose.Types.ObjectId.isValid(userId)) {
            userId = new mongoose.Types.ObjectId(userId);
        }

        // Check if community exists
        const community = await CommunitiesModel.findOne({
            _id: communityId,
            isDeleted: false
        }).select('members managerId createdBy');

        if (!community) {
            return res.status(404).send(response.toJson('Community not found'));
        }

        // Check if user is a member
        const isMember = community.members.some(
            memberId => memberId.toString() === userId.toString()
        );

        // Check if user is manager or creator
        const isManager = community.managerId && community.managerId.toString() === userId.toString();
        const isCreator = community.createdBy && community.createdBy.toString() === userId.toString();

        // Check if user has approved join request
        const joinRequest = await CommunityJoinRequestsModel.findOne({
            userId,
            communityId,
            status: 'Approved',
            isDeleted: false
        });

        const hasApprovedRequest = !!joinRequest;

        // User is considered a member if:
        // 1. They are in the members array, OR
        // 2. They are the manager/creator, OR
        // 3. They have an approved join request
        const isCommunityMember = isMember || isManager || isCreator || hasApprovedRequest;

        return res.status(200).send(response.toJson(
            messages['en'].common.detail_success,
            {
                isMember: isCommunityMember,
                isManager,
                isCreator,
                hasApprovedRequest
            }
        ));

    } catch (err) {
        console.error('Error checking community membership:', err);
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
        const limit = parseInt(req.query.limit) || 12;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;
        const type = req.query.type; // 'buy' or 'sell'

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
    checkCommunityMembership,
    getCommunityPulses,
    getCommunityMarketplaceListings,
    getCommunityMembers,
    getCommunityEvents
};








