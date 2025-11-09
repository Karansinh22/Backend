const messages = require("../message");
const response = require("../config/response.js");
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const QRCode = require('qrcode');
const EventsModel = require('../models/Events.js');
const EventRegistrationsModel = require('../models/EventRegistrations.js');
const CommunitiesModel = require('../models/Communities.js');

// Create Event (Manager only)
const createEvent = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).send(response.toJson(errors.array()[0].msg));
        }

        const {
            communityId,
            title,
            description,
            eventDate,
            startTime,
            endTime,
            location,
            maxParticipants,
            eventType
        } = req.body;
        const userId = req.user.id;

        // Check if community exists
        const community = await CommunitiesModel.findById(communityId);
        if (!community || community.isDeleted) {
            return res.status(404).send(response.toJson('Community not found'));
        }

        // Check if user is manager or admin
        const isManager = community.managerId && community.managerId.toString() === userId;
        const isAdmin = req.user.role === 'Admin' || req.user.role === 'SuperAdmin';
        
        if (!isManager && !isAdmin) {
            return res.status(403).send(response.toJson('Only community managers can create events'));
        }

        // Handle file uploads using Cloudinary
        let images = [];
        if (req.files && req.files.images) {
            const { uploadMultipleToCloudinary } = require('../libs/cloudinary');
            
            try {
                console.log('☁️  Uploading event images to Cloudinary...');
                const files = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
                
                const uploadResults = await uploadMultipleToCloudinary(files, 'communities/events', 'image');
                images = uploadResults.map(result => result.secure_url);
                
                console.log('✅ Event images uploaded to Cloudinary successfully!');
                console.log('   Number of images:', images.length);
            } catch (uploadError) {
                console.error('❌ Error uploading event images to Cloudinary:', uploadError);
                throw new Error('Failed to upload event images: ' + uploadError.message);
            }
        }

        const event = new EventsModel({
            communityId,
            createdBy: userId,
            title,
            description,
            eventDate: new Date(eventDate),
            startTime,
            endTime,
            location,
            maxParticipants: maxParticipants ? parseInt(maxParticipants) : null,
            eventType: eventType || 'Other',
            images,
            status: 'Upcoming'
        });

        await event.save();
        await event.populate('createdBy', 'name email');

        return res.status(201).send(response.toJson(
            messages['en'].common.create_success,
            event
        ));
    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

// Get Events by Community
const getEventsByCommunity = async (req, res) => {
    try {
        const { communityId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const status = req.query.status; // Optional filter by status

        // Check if community exists
        const community = await CommunitiesModel.findById(communityId);
        if (!community || community.isDeleted) {
            return res.status(404).send(response.toJson('Community not found'));
        }

        const filter = {
            communityId,
            isDeleted: false
        };

        if (status) {
            filter.status = { $in: [status, status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()] };
        }

        // Get all events first, then filter out past events
        const events = await EventsModel.find(filter)
            .populate('createdBy', 'name email')
            .populate('registeredParticipants', 'name email')
            .sort({ eventDate: 1, createdAt: -1 })
            .skip(skip)
            .limit(limit * 2) // Get more events to account for filtering
            .lean();

        // Filter out events that have completely ended
        const now = new Date();
        const filteredEvents = events.filter(event => {
            const eventDate = new Date(event.eventDate);
            
            // If event date is in the future, include it
            if (eventDate > now) {
                return true;
            }
            
            // If event date is today or past, check if it has ended
            if (event.endTime) {
                try {
                    const [hours, minutes] = event.endTime.split(':').map(Number);
                    const endDateTime = new Date(eventDate);
                    endDateTime.setHours(hours, minutes);
                    // Only include if event hasn't ended yet
                    return now <= endDateTime;
                } catch (e) {
                    // If parsing fails, exclude if date has passed
                    return false;
                }
            }
            
            // If no end time and date has passed, exclude it
            return false;
        }).slice(0, limit); // Limit to requested number after filtering

        // Get registration counts for each event and populate registered participants
        for (const event of filteredEvents) {
            // Get count from EventRegistrations collection (more accurate)
            const registrationCount = await EventRegistrationsModel.countDocuments({
                eventId: event._id,
                status: { $in: ['registered', 'attended'] },
                isDeleted: false
            });
            
            // Also ensure event.registeredParticipants is populated and synced
            // Get actual registered user IDs from EventRegistrations
            const registeredUserIds = await EventRegistrationsModel.find({
                eventId: event._id,
                status: { $in: ['registered', 'attended'] },
                isDeleted: false
            }).distinct('userId');
            
            // Update event's registeredParticipants array to keep it in sync
            if (registeredUserIds.length > 0) {
                const eventDoc = await EventsModel.findById(event._id);
                if (eventDoc) {
                    // Convert to strings for comparison, but keep as ObjectIds in array
                    const currentIds = (eventDoc.registeredParticipants || []).map(id => id.toString());
                    const newIds = registeredUserIds.map(id => id.toString());
                    const uniqueNewIds = [...new Set(newIds)];
                    
                    // Only update if there's a difference
                    if (currentIds.length !== uniqueNewIds.length || 
                        !uniqueNewIds.every(id => currentIds.includes(id))) {
                        eventDoc.registeredParticipants = registeredUserIds;
                        await eventDoc.save();
                    }
                }
            }
            
            event.registrationCount = registrationCount;
            event.availableSlots = event.maxParticipants 
                ? Math.max(0, event.maxParticipants - registrationCount)
                : null;
            
            // Populate registered participants info for display
            if (event.registeredParticipants && event.registeredParticipants.length > 0) {
                const UsersModel = require('../models/Users');
                const participantIds = event.registeredParticipants.slice(0, 5); // Get first 5 for preview
                const participants = await UsersModel.find({
                    _id: { $in: participantIds },
                    isDeleted: false
                }).select('name email').lean();
                event.registeredParticipantsPreview = participants;
            }
        }

        // Recalculate total after filtering - count only non-past events
        const totalFiltered = await EventsModel.countDocuments({
            communityId,
            isDeleted: false,
            $or: [
                { eventDate: { $gte: new Date() } },
                {
                    eventDate: { $lt: new Date() },
                    endTime: { $exists: true, $ne: null }
                }
            ]
        });

        return res.status(200).send(response.toJson(
            messages['en'].common.detail_success,
            {
                events: filteredEvents,
                pagination: {
                    total: totalFiltered,
                    page,
                    limit,
                    totalPages: Math.ceil(totalFiltered / limit)
                }
            }
        ));
    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

// Register for Event (Direct registration without approval)
const registerForEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        
        // Get userId from req.user._id or req.userId (fallback)
        const userId = req.user?._id || req.userId;
        
        console.log('Registration attempt:', {
            eventId,
            userId: userId?.toString(),
            hasUser: !!req.user,
            userIdFromReq: req.userId
        });
        
        if (!userId) {
            console.error('Registration error: User ID not found in request');
            return res.status(401).send(response.toJson('User authentication required'));
        }

        // Validate eventId
        if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
            console.error('Invalid event ID:', eventId);
            return res.status(400).send(response.toJson('Invalid event ID'));
        }

        const event = await EventsModel.findById(eventId);
        if (!event || event.isDeleted) {
            return res.status(404).send(response.toJson('Event not found'));
        }

        // Check if already registered
        const existingRegistration = await EventRegistrationsModel.findOne({
            eventId,
            userId,
            isDeleted: false
        });

        if (existingRegistration) {
            console.log('User already registered:', { eventId, userId: userId.toString() });
            // Populate registration data before returning
            await existingRegistration.populate('eventId', 'title eventDate location startTime endTime description');
            await existingRegistration.populate('userId', 'name email');
            // Return 200 with the existing registration so frontend can show the ticket
            return res.status(200).send(response.toJson('You are already registered for this event', existingRegistration.toObject()));
        }

        // Check if event is full
        if (event.maxParticipants) {
            const registrationCount = await EventRegistrationsModel.countDocuments({
                eventId,
                status: { $in: ['registered', 'attended'] },
                isDeleted: false
            });
            if (registrationCount >= event.maxParticipants) {
                return res.status(400).send(response.toJson('Event is full'));
            }
        }

        // Generate QR code data
        const qrData = JSON.stringify({
            eventId: event._id.toString(),
            userId: userId,
            registrationId: new mongoose.Types.ObjectId().toString(),
            timestamp: Date.now()
        });

        // Generate QR code image
        const qrCode = await QRCode.toDataURL(qrData);

        // Create registration with status 'registered'
        const registration = new EventRegistrationsModel({
            eventId,
            userId,
            status: 'registered', // Store booking status: 'registered', 'attended', or 'cancelled'
            qrCode: qrCode,
            qrCodeData: qrData,
            registeredAt: new Date()
        });

        await registration.save();

        // Add to event's registeredParticipants array to track registered users
        const userIdString = userId.toString();
        // Ensure registeredParticipants is an array
        if (!Array.isArray(event.registeredParticipants)) {
            event.registeredParticipants = [];
        }
        if (!event.registeredParticipants.some(id => id.toString() === userIdString)) {
            event.registeredParticipants.push(userId);
            await event.save();
        }
        
        console.log('Registration created successfully:', {
            registrationId: registration._id,
            eventId: eventId.toString(),
            userId: userIdString,
            status: registration.status
        });

        await registration.populate('userId', 'name email');
        await registration.populate('eventId', 'title eventDate location startTime endTime description');

        // Return registration with all necessary data including QR code
        const registrationResponse = registration.toObject();
        
        return res.status(201).send(response.toJson(
            'Successfully registered for event',
            registrationResponse
        ));
    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        console.error('Error in registerForEvent:', {
            error: errMess,
            eventId: req.params.eventId,
            userId: req.user?._id || req.userId,
            stack: err.stack
        });
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

// Get User's Registration for Event
const getUserRegistration = async (req, res) => {
    try {
        const { eventId } = req.params;
        const userId = req.user?._id || req.userId;
        
        console.log('getUserRegistration called:', {
            eventId,
            userId: userId?.toString(),
            hasUser: !!req.user,
            userIdFromReq: req.userId
        });
        
        if (!userId) {
            console.error('getUserRegistration: User ID not found');
            return res.status(401).send(response.toJson('User authentication required'));
        }

        // Validate eventId
        if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
            console.error('getUserRegistration: Invalid event ID:', eventId);
            return res.status(400).send(response.toJson('Invalid event ID'));
        }

        // Convert to ObjectId if needed
        const eventObjectId = new mongoose.Types.ObjectId(eventId);
        const userObjectId = new mongoose.Types.ObjectId(userId);

        console.log('Searching for registration:', {
            eventId: eventObjectId.toString(),
            userId: userObjectId.toString()
        });

        const registration = await EventRegistrationsModel.findOne({
            eventId: eventObjectId,
            userId: userObjectId,
            isDeleted: false
        })
        .populate('eventId', 'title eventDate location startTime endTime description')
        .populate('userId', 'name email');

        if (!registration) {
            console.log('Registration not found:', {
                eventId: eventObjectId.toString(),
                userId: userObjectId.toString()
            });
            
            // Check if registration exists but is deleted
            const deletedRegistration = await EventRegistrationsModel.findOne({
                eventId: eventObjectId,
                userId: userObjectId,
                isDeleted: true
            });
            
            if (deletedRegistration) {
                console.log('Registration exists but is deleted');
            }
            
            // Check if event exists
            const event = await EventsModel.findById(eventObjectId);
            if (!event) {
                console.log('Event not found:', eventObjectId.toString());
            }
            
            return res.status(404).send(response.toJson('Registration not found'));
        }

        console.log('Registration found:', {
            registrationId: registration._id.toString(),
            hasQRCode: !!registration.qrCode
        });

        // Return registration with booking status
        return res.status(200).send(response.toJson(
            messages['en'].common.detail_success,
            {
                ...registration.toObject(),
                bookingStatus: registration.status // Explicitly include booking status
            }
        ));
    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        console.error('Error in getUserRegistration:', {
            error: errMess,
            eventId: req.params.eventId,
            userId: req.user?._id || req.userId,
            stack: err.stack
        });
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

// Mark Attendance via QR Scan
const markAttendance = async (req, res) => {
    try {
        const { qrData } = req.body;

        if (!qrData) {
            return res.status(400).send(response.toJson('QR code data is required'));
        }

        let parsedData;
        try {
            parsedData = JSON.parse(qrData);
        } catch (e) {
            return res.status(400).send(response.toJson('Invalid QR code data'));
        }

        const { eventId, userId, registrationId } = parsedData;

        // Verify registration exists
        const registration = await EventRegistrationsModel.findOne({
            _id: registrationId,
            eventId,
            userId,
            isDeleted: false
        });

        if (!registration) {
            return res.status(404).send(response.toJson('Invalid registration'));
        }

        // Check if already marked
        if (registration.status === 'attended') {
            return res.status(400).send(response.toJson('Attendance already marked'));
        }

        // Mark attendance
        registration.status = 'attended';
        registration.attendedAt = new Date();
        await registration.save();

        // Update event attendance
        const event = await EventsModel.findById(eventId);
        if (event) {
            const attendanceExists = event.attendance.some(
                a => a.userId.toString() === userId
            );
            if (!attendanceExists) {
                event.attendance.push({
                    userId,
                    markedAt: new Date(),
                    verified: true
                });
                await event.save();
            }
        }

        await registration.populate('userId', 'name email');
        await registration.populate('eventId', 'title eventDate');

        return res.status(200).send(response.toJson(
            'Attendance marked successfully',
            registration
        ));
    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

// Get Event Attendance List
const getEventAttendance = async (req, res) => {
    try {
        const { eventId } = req.params;
        const userId = req.user.id;

        const event = await EventsModel.findById(eventId);
        if (!event || event.isDeleted) {
            return res.status(404).send(response.toJson('Event not found'));
        }

        // Check if user is manager or admin
        const community = await CommunitiesModel.findById(event.communityId);
        const isManager = community.managerId && community.managerId.toString() === userId;
        const isAdmin = req.user.role === 'Admin' || req.user.role === 'SuperAdmin';
        
        if (!isManager && !isAdmin) {
            return res.status(403).send(response.toJson('Only managers and admins can view attendance'));
        }

        const registrations = await EventRegistrationsModel.find({
            eventId,
            isDeleted: false
        })
        .populate('userId', 'name email')
        .sort({ attendedAt: -1, registeredAt: -1 })
        .lean();

        return res.status(200).send(response.toJson(
            messages['en'].common.detail_success,
            {
                event: {
                    _id: event._id,
                    title: event.title,
                    eventDate: event.eventDate
                },
                registrations,
                totalRegistered: registrations.length,
                totalAttended: registrations.filter(r => r.status === 'attended').length
            }
        ));
    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

// Delete Event
const deleteEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        const userId = req.user.id;

        const event = await EventsModel.findById(eventId);
        if (!event || event.isDeleted) {
            return res.status(404).send(response.toJson('Event not found'));
        }

        // Check if user is creator, manager, or admin
        const isCreator = event.createdBy.toString() === userId;
        const community = await CommunitiesModel.findById(event.communityId);
        const isManager = community.managerId && community.managerId.toString() === userId;
        const isAdmin = req.user.role === 'Admin' || req.user.role === 'SuperAdmin';
        
        if (!isCreator && !isManager && !isAdmin) {
            return res.status(403).send(response.toJson('You do not have permission to delete this event'));
        }

        event.isDeleted = true;
        event.deletedAt = new Date();
        await event.save();

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
    createEvent,
    getEventsByCommunity,
    registerForEvent,
    getUserRegistration,
    markAttendance,
    getEventAttendance,
    deleteEvent
};









