const messages = require("../message");
const response = require("../config/response.js");
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const MarketplaceListingsModel = require('../models/MarketplaceListings.js');
const MarketplaceChatsModel = require('../models/MarketplaceChats.js');
const CommunitiesModel = require('../models/Communities.js');

// Create Listing
const createListing = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).send(response.toJson(errors.array()[0].msg));
        }

        const { communityId, type, title, description, price } = req.body;
        const userId = req.user._id;

        // Check if community exists
        const community = await CommunitiesModel.findById(communityId);
        if (!community || community.isDeleted) {
            return res.status(404).send(response.toJson('Community not found'));
        }

        // Check user role and membership
        const userIdStr = userId.toString();
        const isManager = community.managerId && community.managerId.toString() === userIdStr;
        const isCreator = community.createdBy && community.createdBy.toString() === userIdStr;
        const isAdmin = req.user.role === 'Admin' || req.user.role === 'SuperAdmin';
        const isMember = community.members && community.members.some(m => m.toString() === userIdStr);
        
        // Check if user has an approved join request
        const CommunityJoinRequestsModel = require('../models/CommunityJoinRequests.js');
        let hasApprovedRequest = false;
        if (!isMember && !isManager && !isCreator && !isAdmin) {
            const userIdObj = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;
            const joinRequest = await CommunityJoinRequestsModel.findOne({
                userId: userIdObj,
                communityId,
                status: 'Approved',
                isDeleted: false
            });
            hasApprovedRequest = !!joinRequest;
        }
        
        // Allow members, managers, creators, admins, and users with approved join requests to create listings
        if (!isMember && !isManager && !isCreator && !isAdmin && !hasApprovedRequest) {
            return res.status(403).send(response.toJson('You must be a member of this community to create listings'));
        }

        // Handle file upload using Cloudinary
        let attachment = null;
        if (req.files && req.files.attachment) {
            const file = req.files.attachment;
            const { uploadToCloudinary } = require('../libs/cloudinary');
            
            try {
                console.log('☁️  Uploading marketplace image to Cloudinary...');
                console.log('   Original name:', file.name);
                console.log('   File size:', file.size, 'bytes');
                
                const uploadResult = await uploadToCloudinary(file, 'communities/marketplace', 'image');
                attachment = uploadResult.secure_url;
                
                console.log('✅ Marketplace image uploaded to Cloudinary successfully!');
                console.log('   Cloudinary URL:', attachment);
            } catch (uploadError) {
                console.error('❌ Error uploading marketplace image to Cloudinary:', uploadError);
                throw new Error('Failed to upload marketplace image: ' + uploadError.message);
            }
        }

        // Set status: Admin/Manager posts are auto-approved, members need approval
        const listingStatus = (isAdmin || isManager) ? 'approved' : 'pending';

        const listing = new MarketplaceListingsModel({
            communityId,
            userId,
            type,
            title,
            description,
            price: parseFloat(price),
            attachment,
            status: listingStatus
        });

        await listing.save();
        await listing.populate('userId', 'name email');

        return res.status(201).send(response.toJson(
            listingStatus === 'approved' 
                ? messages['en'].common.create_success 
                : 'Product listing submitted successfully! It will be visible after admin approval.',
            listing
        ));
    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

// Get Listings by Community
const getListingsByCommunity = async (req, res) => {
    try {
        const { communityId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const type = req.query.type; // Optional filter: 'buy' or 'sell'
        const status = req.query.status || 'approved'; // Default to approved

        // Check if community exists
        const community = await CommunitiesModel.findById(communityId);
        if (!community || community.isDeleted) {
            return res.status(404).send(response.toJson('Community not found'));
        }

        const filter = {
            communityId,
            isDeleted: false,
            status
        };

        if (type) {
            filter.type = type;
        }

        const listings = await MarketplaceListingsModel.find(filter)
            .populate('userId', 'name email')
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

// Get Single Listing
const getListingById = async (req, res) => {
    try {
        const { id } = req.params;

        const listing = await MarketplaceListingsModel.findOne({
            _id: id,
            isDeleted: false
        })
        .populate('userId', 'name email')
        .populate('communityId', 'name');

        if (!listing) {
            return res.status(404).send(response.toJson('Listing not found'));
        }

        return res.status(200).send(response.toJson(
            messages['en'].common.detail_success,
            listing
        ));
    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

// Start Chat for Listing
const startChat = async (req, res) => {
    try {
        const { listingId } = req.params;
        const userId = req.user._id;

        const listing = await MarketplaceListingsModel.findById(listingId);
        if (!listing || listing.isDeleted) {
            return res.status(404).send(response.toJson('Listing not found'));
        }

        // Cannot chat with own listing
        if (listing.userId.toString() === userId) {
            return res.status(400).send(response.toJson('Cannot start chat for your own listing'));
        }

        // Check if chat already exists
        let chat = await MarketplaceChatsModel.findOne({
            listingId,
            participants: { $all: [listing.userId, userId] },
            isDeleted: false
        })
        .populate('participants', 'name email')
        .populate('messages.senderId', 'name email');

        if (!chat) {
            // Create new chat
            chat = new MarketplaceChatsModel({
                listingId,
                participants: [listing.userId, userId],
                messages: [],
                lastMessageAt: new Date()
            });
            await chat.save();
            await chat.populate('participants', 'name email');
        }

        return res.status(200).send(response.toJson(
            'Chat retrieved successfully',
            chat
        ));
    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

// Send Message in Chat
const sendMessage = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).send(response.toJson(errors.array()[0].msg));
        }

        const { listingId } = req.params;
        const { text } = req.body;
        const userId = req.user._id;

        const listing = await MarketplaceListingsModel.findById(listingId);
        if (!listing || listing.isDeleted) {
            return res.status(404).send(response.toJson('Listing not found'));
        }

        // Find or create chat
        let chat = await MarketplaceChatsModel.findOne({
            listingId,
            participants: { $all: [listing.userId, userId] },
            isDeleted: false
        });

        if (!chat) {
            chat = new MarketplaceChatsModel({
                listingId,
                participants: [listing.userId, userId],
                messages: []
            });
        }

        // Add message
        chat.messages.push({
            senderId: userId,
            text,
            timestamp: new Date(),
            read: false
        });

        chat.lastMessageAt = new Date();
        await chat.save();
        await chat.populate('participants', 'name email');
        await chat.populate('messages.senderId', 'name email');

        return res.status(200).send(response.toJson(
            'Message sent successfully',
            chat.messages[chat.messages.length - 1]
        ));
    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

// Get Chat Messages
const getChatMessages = async (req, res) => {
    try {
        const { listingId } = req.params;
        const userId = req.user._id;

        const listing = await MarketplaceListingsModel.findById(listingId);
        if (!listing || listing.isDeleted) {
            return res.status(404).send(response.toJson('Listing not found'));
        }

        const chat = await MarketplaceChatsModel.findOne({
            listingId,
            participants: userId,
            isDeleted: false
        })
        .populate('participants', 'name email')
        .populate('messages.senderId', 'name email')
        .sort({ 'messages.timestamp': 1 });

        if (!chat) {
            return res.status(404).send(response.toJson('Chat not found'));
        }

        return res.status(200).send(response.toJson(
            messages['en'].common.detail_success,
            chat
        ));
    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

// Get User's Chats
const getUserChats = async (req, res) => {
    try {
        const userId = req.user._id;

        const chats = await MarketplaceChatsModel.find({
            participants: userId,
            isDeleted: false
        })
        .populate('listingId', 'title price type attachment')
        .populate('participants', 'name email')
        .sort({ lastMessageAt: -1 })
        .lean();

        // Get last message for each chat
        for (const chat of chats) {
            if (chat.messages && chat.messages.length > 0) {
                const lastMessage = chat.messages[chat.messages.length - 1];
                chat.lastMessage = lastMessage;
            }
        }

        return res.status(200).send(response.toJson(
            messages['en'].common.detail_success,
            chats
        ));
    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

// Update Listing Status (Approve/Reject/Sold/Closed)
const updateListingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user._id;

        if (!['pending', 'approved', 'rejected', 'sold', 'closed'].includes(status)) {
            return res.status(400).send(response.toJson('Invalid status'));
        }

        const listing = await MarketplaceListingsModel.findById(id);
        if (!listing || listing.isDeleted) {
            return res.status(404).send(response.toJson('Listing not found'));
        }

        // Check permissions
        const isOwner = listing.userId.toString() === userId;
        const community = await CommunitiesModel.findById(listing.communityId);
        const isManager = community.managerId && community.managerId.toString() === userId;
        const isAdmin = req.user.role === 'Admin' || req.user.role === 'SuperAdmin';

        // Only owner can mark as sold/closed, only manager/admin can approve/reject
        if (['sold', 'closed'].includes(status) && !isOwner) {
            return res.status(403).send(response.toJson('Only listing owner can update status to sold/closed'));
        }
        if (['approved', 'rejected'].includes(status) && !isManager && !isAdmin) {
            return res.status(403).send(response.toJson('Only managers and admins can approve/reject listings'));
        }

        listing.status = status;
        await listing.save();

        return res.status(200).send(response.toJson(
            'Listing status updated successfully',
            listing
        ));
    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

// Delete Listing
const deleteListing = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const listing = await MarketplaceListingsModel.findById(id);
        if (!listing || listing.isDeleted) {
            return res.status(404).send(response.toJson('Listing not found'));
        }

        // Check permissions
        const isOwner = listing.userId.toString() === userId;
        const community = await CommunitiesModel.findById(listing.communityId);
        const isManager = community.managerId && community.managerId.toString() === userId;
        const isAdmin = req.user.role === 'Admin' || req.user.role === 'SuperAdmin';

        if (!isOwner && !isManager && !isAdmin) {
            return res.status(403).send(response.toJson('You do not have permission to delete this listing'));
        }

        listing.isDeleted = true;
        listing.deletedAt = new Date();
        await listing.save();

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

module.exports = {
    createListing,
    getListingsByCommunity,
    getListingById,
    startChat,
    sendMessage,
    getChatMessages,
    getUserChats,
    updateListingStatus,
    deleteListing
};



