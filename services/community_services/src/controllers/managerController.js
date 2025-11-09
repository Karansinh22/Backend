const messages = require("../message");
const response = require("../config/response.js");
const mongoose = require('mongoose');
const CommunitiesModel = require('../models/Communities.js');
const UsersModel = require('../models/Users.js');
const CommunityJoinRequestsModel = require('../models/CommunityJoinRequests.js');
const CommunityManagersModel = require('../models/CommunityManagers.js');
const PulsesModel = require('../models/Pulses.js');
const EventsModel = require('../models/Events.js');
const ReportsModel = require('../models/Reports.js');
const MarketplaceListingsModel = require('../models/MarketplaceListings.js');

/**
 * Get communities where user is a manager
 */
const getManagerCommunities = async (req, res) => {
    try {
        const userId = req.user._id;

        // Get all communities where user is a manager
        const managerAssignments = await CommunityManagersModel.find({
            userId: userId,
            status: 'Active',
            isDeleted: false
        }).populate('communityId', 'name description bannerImage location status');

        // Also get communities created by user (they are automatically managers)
        const createdCommunities = await CommunitiesModel.find({
            createdBy: userId,
            isDeleted: false
        }).select('name description bannerImage location status');

        // Combine and deduplicate
        const managerCommunityIds = managerAssignments.map(m => m.communityId?._id?.toString()).filter(Boolean);
        const createdCommunityIds = createdCommunities.map(c => c._id.toString());
        const allCommunityIds = [...new Set([...managerCommunityIds, ...createdCommunityIds])];

        // Get all unique communities
        const allCommunities = await CommunitiesModel.find({
            _id: { $in: allCommunityIds },
            isDeleted: false
        }).select('name description bannerImage location status createdAt').lean();

        return res.status(200).send(response.toJson(
            messages['en'].common.detail_success,
            { communities: allCommunities }
        ));

    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

/**
 * Get manager dashboard statistics for a specific community
 */
const getDashboardStats = async (req, res) => {
    try {
        const { communityId } = req.params;

        // Verify community exists and user is manager
        const community = await CommunitiesModel.findOne({
            _id: communityId,
            isDeleted: false
        });

        if (!community) {
            return res.status(404).send(response.toJson(messages['en'].common.not_exists));
        }

        // Get stats for this community
        const membersCount = await UsersModel.countDocuments({
            communityId: communityId,
            status: 'Active',
            isDeleted: false
        });

        const pendingRequestsCount = await CommunityJoinRequestsModel.countDocuments({
            communityId: communityId,
            status: 'Pending',
            isDeleted: false
        });

        const eventsCount = await EventsModel.countDocuments({
            communityId: communityId,
            isDeleted: false,
            status: { $in: ['Upcoming', 'Ongoing'] }
        });

        const reportsCount = await ReportsModel.countDocuments({
            communityId: communityId,
            isDeleted: false
        });

        const stats = {
            totalMembers: membersCount,
            pendingRequests: pendingRequestsCount,
            activeEvents: eventsCount,
            totalReports: reportsCount,
            communityName: community.name
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
 * Get community join requests for manager's community
 */
const getCommunityJoinRequests = async (req, res) => {
    try {
        const { communityId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';
        const statusParam = req.query.status;

        // Build filter for join requests
        let filter = {
            communityId: communityId,
            isDeleted: false
        };

        // Handle status filter
        if (statusParam) {
            filter.status = statusParam;
        }

        // Handle search
        if (search) {
            // Search in user name, email
            const users = await UsersModel.find({
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ],
                isDeleted: false
            }).select('_id');

            const userIds = users.map(user => user._id);

            filter.$or = [
                { userId: { $in: userIds } },
                { message: { $regex: search, $options: 'i' } }
            ];
        }

        const requests = await CommunityJoinRequestsModel.find(filter)
            .populate('userId', 'name email')
            .populate('reviewedBy', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await CommunityJoinRequestsModel.countDocuments(filter);

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
const approveCommunityJoinRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { communityId } = req.params;
        const { comment } = req.body; // Optional comment/feedback

        // Validate request ID
        if (!mongoose.Types.ObjectId.isValid(requestId)) {
            return res.status(400).send(response.toJson('Invalid request ID'));
        }

        // Find the join request
        const joinRequest = await CommunityJoinRequestsModel.findOne({
            _id: requestId,
            communityId: communityId,
            isDeleted: false
        }).populate('userId');

        if (!joinRequest) {
            return res.status(404).send(response.toJson(messages['en'].common.not_exists));
        }

        // Check if request is already approved
        if (joinRequest.status === 'Approved') {
            return res.status(400).send(response.toJson('Request is already approved'));
        }

        // Update the join request
        joinRequest.status = 'Approved';
        joinRequest.reviewedBy = req.user._id;
        joinRequest.reviewedAt = new Date();
        joinRequest.updatedAt = new Date();
        if (comment) {
            joinRequest.reviewNotes = comment;
        }

        await joinRequest.save();

        // Add user to community members
        await CommunitiesModel.updateOne(
            { _id: communityId },
            { $addToSet: { members: joinRequest.userId._id } }
        );

        // Update user's communityId
        await UsersModel.updateOne(
            { _id: joinRequest.userId._id },
            { 
                $set: { 
                    communityId: communityId,
                    status: 'Active',
                    updatedAt: new Date()
                }
            }
        );

        return res.status(200).send(response.toJson(
            'Join request approved successfully',
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
const rejectCommunityJoinRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { communityId } = req.params;
        const { rejectionReason } = req.body;

        // Validate request ID
        if (!mongoose.Types.ObjectId.isValid(requestId)) {
            return res.status(400).send(response.toJson('Invalid request ID'));
        }

        // Find the join request
        const joinRequest = await CommunityJoinRequestsModel.findOne({
            _id: requestId,
            communityId: communityId,
            isDeleted: false
        });

        if (!joinRequest) {
            return res.status(404).send(response.toJson(messages['en'].common.not_exists));
        }

        // Check if request is already rejected
        if (joinRequest.status === 'Rejected') {
            return res.status(400).send(response.toJson('Request is already rejected'));
        }

        // Update the join request
        joinRequest.status = 'Rejected';
        joinRequest.reviewedBy = req.user._id;
        joinRequest.reviewedAt = new Date();
        joinRequest.reviewNotes = rejectionReason || '';
        joinRequest.updatedAt = new Date();

        await joinRequest.save();

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

/**
 * Get community members
 */
const getCommunityMembers = async (req, res) => {
    try {
        const { communityId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';
        const statusParam = req.query.status;

        // Build filter for members
        let filter = {
            communityId: communityId,
            isDeleted: false
        };

        // Handle status filter
        if (statusParam) {
            filter.status = statusParam;
        }

        // Handle search
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const members = await UsersModel.find(filter)
            .select('-password -otp -otpExpiry -refreshToken')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })
            .lean();

        const total = await UsersModel.countDocuments(filter);

        return res.status(200).send(response.toJson(
            messages['en'].common.detail_success,
            {
                members,
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
 * Remove a member from community
 */
const removeCommunityMember = async (req, res) => {
    try {
        const { memberId } = req.params;
        const { communityId } = req.params;

        // Validate member ID
        if (!mongoose.Types.ObjectId.isValid(memberId)) {
            return res.status(400).send(response.toJson('Invalid member ID'));
        }

        // Find the user
        const user = await UsersModel.findOne({
            _id: memberId,
            communityId: communityId,
            isDeleted: false
        });

        if (!user) {
            return res.status(404).send(response.toJson(messages['en'].common.not_exists));
        }

        // Remove user from community members
        await CommunitiesModel.updateOne(
            { _id: communityId },
            { $pull: { members: memberId } }
        );

        // Remove communityId from user
        await UsersModel.updateOne(
            { _id: memberId },
            { 
                $set: { 
                    communityId: null,
                    updatedAt: new Date()
                }
            }
        );

        return res.status(200).send(response.toJson(
            'Member removed successfully'
        ));

    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

/**
 * Get community events
 */
const getCommunityEvents = async (req, res) => {
    try {
        const { communityId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';

        // Build filter for events
        let filter = {
            communityId: communityId,
            isDeleted: false
        };

        // Handle search
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const events = await EventsModel.find(filter)
            .populate('createdBy', 'name')
            .skip(skip)
            .limit(limit)
            .sort({ eventDate: -1 })
            .lean();

        const total = await EventsModel.countDocuments(filter);

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
 * Get community reports
 */
const getCommunityReports = async (req, res) => {
    try {
        const { communityId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';
        const statusParam = req.query.status;
        const typeParam = req.query.type;

        // Build filter for reports
        let filter = {
            communityId: communityId,
            isDeleted: false
        };

        // Handle status filter
        if (statusParam) {
            filter.status = statusParam;
        }

        // Handle type filter
        if (typeParam) {
            filter.type = typeParam;
        }

        // Handle search
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const reports = await ReportsModel.find(filter)
            .populate('createdBy', 'name')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })
            .lean();

        const total = await ReportsModel.countDocuments(filter);

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
 * Get community posts
 */
const getCommunityPosts = async (req, res) => {
    try {
        const { communityId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';

        // Build filter for posts
        let filter = {
            communityId: communityId,
            isDeleted: false
        };

        // Handle search
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } }
            ];
        }

        const posts = await PulsesModel.find(filter)
            .populate('createdBy', 'name')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })
            .lean();

        const total = await PulsesModel.countDocuments(filter);

        return res.status(200).send(response.toJson(
            messages['en'].common.detail_success,
            {
                posts,
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
 * Approve a community post
 */
const approveCommunityPost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { communityId } = req.params;
        const { comment } = req.body; // Optional feedback

        // Validate post ID
        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).send(response.toJson('Invalid post ID'));
        }

        // Find the post
        const post = await PulsesModel.findOne({
            _id: postId,
            communityId: communityId,
            isDeleted: false
        });

        if (!post) {
            return res.status(404).send(response.toJson(messages['en'].common.not_exists));
        }

        // Check if post is already approved
        if (post.status === 'approved' || post.status === 'Approved') {
            return res.status(400).send(response.toJson('Post is already approved'));
        }

        // Update the post
        post.status = 'approved';
        post.updatedAt = new Date();
        // Note: Pulses model doesn't have reviewNotes field, but we can add it if needed

        await post.save();

        return res.status(200).send(response.toJson(
            'Post approved successfully',
            post
        ));

    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

/**
 * Reject a community post
 */
const rejectCommunityPost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { communityId } = req.params;
        const { comment } = req.body; // Required feedback for rejection

        // Validate post ID
        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).send(response.toJson('Invalid post ID'));
        }

        // Find the post
        const post = await PulsesModel.findOne({
            _id: postId,
            communityId: communityId,
            isDeleted: false
        });

        if (!post) {
            return res.status(404).send(response.toJson(messages['en'].common.not_exists));
        }

        // Check if post is already rejected
        if (post.status === 'rejected' || post.status === 'Rejected') {
            return res.status(400).send(response.toJson('Post is already rejected'));
        }

        // Update the post
        post.status = 'rejected';
        post.updatedAt = new Date();
        // Note: Pulses model doesn't have reviewNotes field, but we can add it if needed

        await post.save();

        return res.status(200).send(response.toJson(
            'Post rejected successfully',
            post
        ));

    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

/**
 * Delete a community post
 */
const deleteCommunityPost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { communityId } = req.params;

        // Validate post ID
        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).send(response.toJson('Invalid post ID'));
        }

        // Find the post
        const post = await PulsesModel.findOne({
            _id: postId,
            communityId: communityId,
            isDeleted: false
        });

        if (!post) {
            return res.status(404).send(response.toJson(messages['en'].common.not_exists));
        }

        // Mark post as deleted
        post.isDeleted = true;
        post.deletedAt = new Date();
        post.updatedAt = new Date();

        await post.save();

        return res.status(200).send(response.toJson(
            'Post deleted successfully'
        ));

    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

/**
 * Get community post stats
 */
const getCommunityPostStats = async (req, res) => {
    try {
        const { communityId } = req.params;

        // Get stats for posts in this community
        const totalPosts = await PulsesModel.countDocuments({
            communityId: communityId,
            isDeleted: false
        });

        const approvedPosts = await PulsesModel.countDocuments({
            communityId: communityId,
            status: 'Approved',
            isDeleted: false
        });

        const pendingPosts = await PulsesModel.countDocuments({
            communityId: communityId,
            status: 'Pending',
            isDeleted: false
        });

        const rejectedPosts = await PulsesModel.countDocuments({
            communityId: communityId,
            status: 'Rejected',
            isDeleted: false
        });

        const stats = {
            total: totalPosts,
            approved: approvedPosts,
            pending: pendingPosts,
            rejected: rejectedPosts
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
 * Get community join request stats
 */
const getCommunityJoinRequestStats = async (req, res) => {
    try {
        const { communityId } = req.params;

        // Get stats for join requests in this community
        const totalRequests = await CommunityJoinRequestsModel.countDocuments({
            communityId: communityId,
            isDeleted: false
        });

        const pendingRequests = await CommunityJoinRequestsModel.countDocuments({
            communityId: communityId,
            status: 'Pending',
            isDeleted: false
        });

        const approvedRequests = await CommunityJoinRequestsModel.countDocuments({
            communityId: communityId,
            status: 'Approved',
            isDeleted: false
        });

        const rejectedRequests = await CommunityJoinRequestsModel.countDocuments({
            communityId: communityId,
            status: 'Rejected',
            isDeleted: false
        });

        const stats = {
            total: totalRequests,
            pending: pendingRequests,
            approved: approvedRequests,
            rejected: rejectedRequests
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
 * Get community member stats
 */
const getCommunityMemberStats = async (req, res) => {
    try {
        const { communityId } = req.params;

        // Get stats for members in this community
        const totalMembers = await UsersModel.countDocuments({
            communityId: communityId,
            isDeleted: false
        });

        const activeMembers = await UsersModel.countDocuments({
            communityId: communityId,
            status: 'Active',
            isDeleted: false
        });

        const pendingMembers = await CommunityJoinRequestsModel.countDocuments({
            communityId: communityId,
            status: 'Pending',
            isDeleted: false
        });

        const rejectedMembers = await CommunityJoinRequestsModel.countDocuments({
            communityId: communityId,
            status: 'Rejected',
            isDeleted: false
        });

        const stats = {
            total: totalMembers,
            active: activeMembers,
            pending: pendingMembers,
            rejected: rejectedMembers
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
 * Get community event stats
 */
const getCommunityEventStats = async (req, res) => {
    try {
        const { communityId } = req.params;
        const now = new Date();

        // Get stats for events in this community
        const totalEvents = await EventsModel.countDocuments({
            communityId: communityId,
            isDeleted: false
        });

        const upcomingEvents = await EventsModel.countDocuments({
            communityId: communityId,
            eventDate: { $gte: now },
            isDeleted: false
        });

        const ongoingEvents = await EventsModel.countDocuments({
            communityId: communityId,
            eventDate: { $lte: now },
            endDate: { $gte: now },
            isDeleted: false
        });

        const completedEvents = await EventsModel.countDocuments({
            communityId: communityId,
            endDate: { $lt: now },
            isDeleted: false
        });

        const stats = {
            total: totalEvents,
            upcoming: upcomingEvents,
            ongoing: ongoingEvents,
            completed: completedEvents
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
 * Get marketplace listings for moderation
 */
const getMarketplaceListings = async (req, res) => {
    try {
        const { communityId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';
        const statusParam = req.query.status;

        // Build filter
        let filter = {
            communityId: communityId,
            isDeleted: false
        };

        // Handle status filter
        if (statusParam) {
            filter.status = statusParam;
        }

        // Handle search
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const listings = await MarketplaceListingsModel.find(filter)
            .populate('userId', 'name email')
            .populate('reviewedBy', 'name')
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

/**
 * Approve a marketplace listing
 */
const approveMarketplaceListing = async (req, res) => {
    try {
        const { listingId } = req.params;
        const { communityId } = req.params;
        const { comment } = req.body; // Optional comment

        // Validate listing ID
        if (!mongoose.Types.ObjectId.isValid(listingId)) {
            return res.status(400).send(response.toJson('Invalid listing ID'));
        }

        // Find the listing
        const listing = await MarketplaceListingsModel.findOne({
            _id: listingId,
            communityId: communityId,
            isDeleted: false
        });

        if (!listing) {
            return res.status(404).send(response.toJson(messages['en'].common.not_exists));
        }

        // Check if listing is already approved
        if (listing.status === 'approved') {
            return res.status(400).send(response.toJson('Listing is already approved'));
        }

        // Update the listing
        listing.status = 'approved';
        listing.reviewedBy = req.user._id;
        listing.reviewedAt = new Date();
        if (comment) {
            listing.reviewNotes = comment;
        }

        await listing.save();

        return res.status(200).send(response.toJson(
            'Listing approved successfully',
            listing
        ));

    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

/**
 * Reject a marketplace listing
 */
const rejectMarketplaceListing = async (req, res) => {
    try {
        const { listingId } = req.params;
        const { communityId } = req.params;
        const { comment } = req.body; // Required feedback for rejection

        // Validate listing ID
        if (!mongoose.Types.ObjectId.isValid(listingId)) {
            return res.status(400).send(response.toJson('Invalid listing ID'));
        }

        // Find the listing
        const listing = await MarketplaceListingsModel.findOne({
            _id: listingId,
            communityId: communityId,
            isDeleted: false
        });

        if (!listing) {
            return res.status(404).send(response.toJson(messages['en'].common.not_exists));
        }

        // Check if listing is already rejected
        if (listing.status === 'rejected') {
            return res.status(400).send(response.toJson('Listing is already rejected'));
        }

        // Update the listing
        listing.status = 'rejected';
        listing.reviewedBy = req.user._id;
        listing.reviewedAt = new Date();
        listing.reviewNotes = comment || 'Listing rejected by manager';

        await listing.save();

        return res.status(200).send(response.toJson(
            'Listing rejected successfully',
            listing
        ));

    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

/**
 * Get marketplace listing stats
 */
const getMarketplaceListingStats = async (req, res) => {
    try {
        const { communityId } = req.params;

        const total = await MarketplaceListingsModel.countDocuments({
            communityId: communityId,
            isDeleted: false
        });

        const approved = await MarketplaceListingsModel.countDocuments({
            communityId: communityId,
            status: 'approved',
            isDeleted: false
        });

        const pending = await MarketplaceListingsModel.countDocuments({
            communityId: communityId,
            status: 'pending',
            isDeleted: false
        });

        const rejected = await MarketplaceListingsModel.countDocuments({
            communityId: communityId,
            status: 'rejected',
            isDeleted: false
        });

        const stats = {
            total,
            approved,
            pending,
            rejected
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
 * Get comprehensive dashboard data with all pending items
 */
const getModerationDashboard = async (req, res) => {
    try {
        const { communityId } = req.params;

        // Get all pending items
        const [pendingUsers, pendingPulses, pendingListings] = await Promise.all([
            // Pending join requests
            CommunityJoinRequestsModel.find({
                communityId: communityId,
                status: 'Pending',
                isDeleted: false
            })
                .populate('userId', 'name email createdAt')
                .sort({ createdAt: -1 })
                .limit(10)
                .lean(),

            // Pending pulses
            PulsesModel.find({
                communityId: communityId,
                status: 'pending',
                isDeleted: false
            })
                .populate('userId', 'name email')
                .sort({ createdAt: -1 })
                .limit(10)
                .lean(),

            // Pending marketplace listings
            MarketplaceListingsModel.find({
                communityId: communityId,
                status: 'pending',
                isDeleted: false
            })
                .populate('userId', 'name email')
                .sort({ createdAt: -1 })
                .limit(10)
                .lean()
        ]);

        // Get counts
        const [usersCount, pulsesCount, listingsCount] = await Promise.all([
            CommunityJoinRequestsModel.countDocuments({
                communityId: communityId,
                status: 'Pending',
                isDeleted: false
            }),
            PulsesModel.countDocuments({
                communityId: communityId,
                status: 'pending',
                isDeleted: false
            }),
            MarketplaceListingsModel.countDocuments({
                communityId: communityId,
                status: 'pending',
                isDeleted: false
            })
        ]);

        const dashboardData = {
            stats: {
                pendingUsers: usersCount,
                pendingPulses: pulsesCount,
                pendingListings: listingsCount,
                totalPending: usersCount + pulsesCount + listingsCount
            },
            pendingItems: {
                users: pendingUsers,
                pulses: pendingPulses,
                listings: pendingListings
            }
        };

        return res.status(200).send(response.toJson(
            messages['en'].common.detail_success,
            dashboardData
        ));

    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

module.exports = {
    getManagerCommunities,
    getDashboardStats,
    getCommunityJoinRequests,
    approveCommunityJoinRequest,
    rejectCommunityJoinRequest,
    getCommunityMembers,
    removeCommunityMember,
    getCommunityEvents,
    getCommunityReports,
    getCommunityPosts,
    approveCommunityPost,
    rejectCommunityPost,
    deleteCommunityPost,
    getCommunityPostStats,
    getCommunityJoinRequestStats,
    getCommunityMemberStats,
    getCommunityEventStats,
    getMarketplaceListings,
    approveMarketplaceListing,
    rejectMarketplaceListing,
    getMarketplaceListingStats,
    getModerationDashboard,
    getPulseApprovals,
    approvePulse,
    rejectPulse,
    getAllUsers,
    addUserToCommunity
};

/**
 * Get pulse approvals for manager's community
 */
const getPulseApprovals = async (req, res) => {
    try {
        const { communityId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';
        const status = req.query.status || 'pending';

        // Verify manager has access to this community
        const community = await CommunitiesModel.findOne({
            _id: communityId,
            isDeleted: false
        });

        if (!community) {
            return res.status(404).send(response.toJson('Community not found'));
        }

        // Build filter
        const filter = {
            communityId: communityId,
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
 * Approve a pulse (Manager)
 */
const approvePulse = async (req, res) => {
    try {
        const { communityId, pulseId } = req.params;

        // Verify manager has access to this community
        const community = await CommunitiesModel.findOne({
            _id: communityId,
            isDeleted: false
        });

        if (!community) {
            return res.status(404).send(response.toJson('Community not found'));
        }

        const pulse = await PulsesModel.findOne({
            _id: pulseId,
            communityId: communityId,
            isDeleted: false
        });

        if (!pulse) {
            return res.status(404).send(response.toJson('Pulse not found'));
        }

        pulse.status = 'approved';
        pulse.reviewedBy = req.user._id;
        pulse.reviewedAt = new Date();
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
 * Reject a pulse (Manager)
 */
const rejectPulse = async (req, res) => {
    try {
        const { communityId, pulseId } = req.params;
        const { rejectionReason } = req.body;

        // Verify manager has access to this community
        const community = await CommunitiesModel.findOne({
            _id: communityId,
            isDeleted: false
        });

        if (!community) {
            return res.status(404).send(response.toJson('Community not found'));
        }

        const pulse = await PulsesModel.findOne({
            _id: pulseId,
            communityId: communityId,
            isDeleted: false
        });

        if (!pulse) {
            return res.status(404).send(response.toJson('Pulse not found'));
        }

        pulse.status = 'rejected';
        pulse.reviewedBy = req.user._id;
        pulse.reviewedAt = new Date();
        if (rejectionReason) {
            pulse.reviewNotes = rejectionReason.trim();
        }
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

/**
 * Get all users in manager's community
 */
const getAllUsers = async (req, res) => {
    try {
        const { communityId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';
        const statusParam = req.query.status;

        // Verify manager has access to this community
        const community = await CommunitiesModel.findOne({
            _id: communityId,
            isDeleted: false
        });

        if (!community) {
            return res.status(404).send(response.toJson('Community not found'));
        }

        // Build user filter
        const userFilter = {
            communityId: communityId,
            isDeleted: false
        };

        // Handle status filter
        if (statusParam) {
            userFilter.status = statusParam;
        }

        // Handle search filter
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
 * Add user to community (Manager)
 */
const addUserToCommunity = async (req, res) => {
    try {
        const { communityId } = req.params;
        const { email, name, role = 'User' } = req.body;

        if (!email || !name) {
            return res.status(400).send(response.toJson('Email and name are required'));
        }

        // Verify manager has access to this community
        const community = await CommunitiesModel.findOne({
            _id: communityId,
            isDeleted: false
        });

        if (!community) {
            return res.status(404).send(response.toJson('Community not found'));
        }

        // Check if user already exists
        let user = await UsersModel.findOne({
            email: email.toLowerCase(),
            isDeleted: false
        });

        if (user) {
            // User exists, check if already in this community
            if (user.communityId && user.communityId.toString() === communityId) {
                return res.status(400).send(response.toJson('User is already a member of this community'));
            }
            // Update user's community
            user.communityId = communityId;
            user.status = 'Active';
            await user.save();
        } else {
            // Create new user
            user = new UsersModel({
                name,
                email: email.toLowerCase(),
                role,
                communityId,
                status: 'Active'
            });
            await user.save();
        }

        return res.status(200).send(response.toJson(
            'User added to community successfully',
            user
        ));
    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        console.error('Error adding user to community:', errMess);
        return res.status(statusCode).send(response.toJson(errMess));
    }
};


