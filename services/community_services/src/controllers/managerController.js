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
        if (post.status === 'Approved') {
            return res.status(400).send(response.toJson('Post is already approved'));
        }

        // Update the post
        post.status = 'Approved';
        post.updatedAt = new Date();

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
        if (post.status === 'Rejected') {
            return res.status(400).send(response.toJson('Post is already rejected'));
        }

        // Update the post
        post.status = 'Rejected';
        post.updatedAt = new Date();

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

module.exports = {
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
    getCommunityEventStats
};


