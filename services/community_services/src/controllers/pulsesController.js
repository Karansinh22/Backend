const messages = require("../message");
const response = require("../config/response.js");
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const PulsesModel = require('../models/Pulses.js');
const CommunitiesModel = require('../models/Communities.js');
const CommunityJoinRequestsModel = require('../models/CommunityJoinRequests.js');

// Create Pulse (Members can create, but need approval)
const createPulse = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).send(response.toJson(errors.array()[0].msg));
        }

        const { communityId, title, description, territory } = req.body;
        // Use _id from req.user (set by auth middleware) or fallback to id
        const userId = req.user._id || req.user.id;

        // Check if community exists
        const community = await CommunitiesModel.findById(communityId);
        if (!community || community.isDeleted) {
            return res.status(404).send(response.toJson('Community not found'));
        }

        // Normalize userId to string for comparison
        const userIdStr = userId.toString();
        
        // Check if user is a member of the community
        const isMember = community.members && community.members.some(m => m.toString() === userIdStr);
        const isManager = community.managerId && community.managerId.toString() === userIdStr;
        const isCreator = community.createdBy && community.createdBy.toString() === userIdStr;
        const isAdmin = req.user.role === 'Admin' || req.user.role === 'SuperAdmin';
        
        // Check if user has an approved join request (even if not in members array yet)
        let hasApprovedRequest = false;
        if (!isMember && !isManager && !isCreator && !isAdmin) {
            // Ensure userId is ObjectId for query
            const userIdObj = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;
            const joinRequest = await CommunityJoinRequestsModel.findOne({
                userId: userIdObj,
                communityId,
                status: 'Approved',
                isDeleted: false
            });
            hasApprovedRequest = !!joinRequest;
        }
        
        // Allow members, managers, creators, admins, and users with approved join requests to create pulses
        if (!isMember && !isManager && !isCreator && !isAdmin && !hasApprovedRequest) {
            return res.status(403).send(response.toJson('You must be a member of this community to create pulses'));
        }

        // Handle file upload
        let attachment = null;
        if (req.files && req.files.attachment) {
            const file = req.files.attachment;
            const fileName = `pulse-${Date.now()}-${file.name}`;
            const uploadPath = `${__dirname}/../uploads/${fileName}`;
            await file.mv(uploadPath);
            attachment = `/uploads/${fileName}`;
        }

        // Set status: Admin/Manager posts are auto-approved, members need approval
        const pulseStatus = (isAdmin || isManager) ? 'approved' : 'pending';

        const pulse = new PulsesModel({
            communityId,
            userId,
            title,
            description,
            territory: territory || 'general',
            attachment,
            status: pulseStatus
        });

        await pulse.save();
        await pulse.populate('userId', 'name email');

        // Add pulse to community's pulses array
        await CommunitiesModel.findByIdAndUpdate(communityId, {
            $push: { pulses: pulse._id }
        });

        return res.status(201).send(response.toJson(
            pulseStatus === 'approved' 
                ? messages['en'].common.create_success 
                : 'Pulse submitted successfully! It will be visible after admin approval.',
            pulse
        ));
    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

// Get Pulses by Community
const getPulsesByCommunity = async (req, res) => {
    try {
        const { communityId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Check if community exists
        const community = await CommunitiesModel.findById(communityId);
        if (!community || community.isDeleted) {
            return res.status(404).send(response.toJson('Community not found'));
        }

        const filter = {
            communityId,
            isDeleted: false,
            status: 'approved' // Only show approved pulses
        };

        const pulses = await PulsesModel.find(filter)
            .populate('userId', 'name email')
            .populate('likes', 'name')
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

// Approve/Reject Pulse (Admin/Manager only)
const approvePulse = async (req, res) => {
    try {
        const { pulseId } = req.params;
        const { status } = req.body; // 'approved' or 'rejected'
        const userId = req.user.id;

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).send(response.toJson('Invalid status'));
        }

        const pulse = await PulsesModel.findById(pulseId);
        if (!pulse || pulse.isDeleted) {
            return res.status(404).send(response.toJson('Pulse not found'));
        }

        // Check if user is manager or admin
        const community = await CommunitiesModel.findById(pulse.communityId);
        const isManager = community.managerId && community.managerId.toString() === userId;
        const isAdmin = req.user.role === 'Admin' || req.user.role === 'SuperAdmin';
        
        if (!isManager && !isAdmin) {
            return res.status(403).send(response.toJson('Only managers and admins can approve pulses'));
        }

        pulse.status = status;
        await pulse.save();

        return res.status(200).send(response.toJson(
            `Pulse ${status} successfully`,
            pulse
        ));
    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

// Delete Pulse
const deletePulse = async (req, res) => {
    try {
        const { pulseId } = req.params;
        const userId = req.user.id;

        const pulse = await PulsesModel.findById(pulseId);
        if (!pulse || pulse.isDeleted) {
            return res.status(404).send(response.toJson('Pulse not found'));
        }

        // Check if user is author, manager, or admin
        const isAuthor = pulse.userId.toString() === userId;
        const community = await CommunitiesModel.findById(pulse.communityId);
        const isManager = community.managerId && community.managerId.toString() === userId;
        const isAdmin = req.user.role === 'Admin' || req.user.role === 'SuperAdmin';
        
        if (!isAuthor && !isManager && !isAdmin) {
            return res.status(403).send(response.toJson('You do not have permission to delete this pulse'));
        }

        pulse.isDeleted = true;
        pulse.deletedAt = new Date();
        await pulse.save();

        return res.status(200).send(response.toJson(
            messages['en'].common.delete_success,
            null
        ));
    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

// Like/Unlike Pulse
const toggleLikePulse = async (req, res) => {
    try {
        const { pulseId } = req.params;
        const userId = req.user.id;

        const pulse = await PulsesModel.findById(pulseId);
        if (!pulse || pulse.isDeleted) {
            return res.status(404).send(response.toJson('Pulse not found'));
        }

        const likeIndex = pulse.likes.findIndex(id => id.toString() === userId);
        if (likeIndex > -1) {
            pulse.likes.splice(likeIndex, 1);
        } else {
            pulse.likes.push(userId);
        }

        await pulse.save();

        return res.status(200).send(response.toJson(
            'Like toggled successfully',
            { likes: pulse.likes.length, isLiked: likeIndex === -1 }
        ));
    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

// Add Comment to Pulse
const addComment = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).send(response.toJson(errors.array()[0].msg));
        }

        const { pulseId } = req.params;
        const { text } = req.body;
        const userId = req.user.id;

        const pulse = await PulsesModel.findById(pulseId);
        if (!pulse || pulse.isDeleted) {
            return res.status(404).send(response.toJson('Pulse not found'));
        }

        pulse.comments.push({
            userId,
            text,
            createdAt: new Date()
        });

        await pulse.save();
        await pulse.populate('comments.userId', 'name email');

        return res.status(200).send(response.toJson(
            'Comment added successfully',
            pulse.comments[pulse.comments.length - 1]
        ));
    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

module.exports = {
    createPulse,
    getPulsesByCommunity,
    approvePulse,
    deletePulse,
    toggleLikePulse,
    addComment
};

