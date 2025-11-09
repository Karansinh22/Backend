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

        // Handle file uploads
        let images = [];
        if (req.files && req.files.images) {
            const files = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
            for (const file of files) {
                const fileName = `event-${Date.now()}-${file.name}`;
                const uploadPath = `${__dirname}/../uploads/${fileName}`;
                await file.mv(uploadPath);
                images.push(`/uploads/${fileName}`);
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

        const events = await EventsModel.find(filter)
            .populate('createdBy', 'name email')
            .populate('registeredParticipants', 'name email')
            .sort({ eventDate: 1, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        // Get registration counts for each event
        for (const event of events) {
            const registrationCount = await EventRegistrationsModel.countDocuments({
                eventId: event._id,
                status: { $in: ['registered', 'attended'] },
                isDeleted: false
            });
            event.registrationCount = registrationCount;
            event.availableSlots = event.maxParticipants 
                ? event.maxParticipants - registrationCount 
                : null;
        }

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

// Register for Event (Direct registration without approval)
const registerForEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        // Fix: Use req.user._id instead of req.user.id
        const userId = req.user._id;

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
            return res.status(400).send(response.toJson('You are already registered for this event'));
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

        // Create registration
        const registration = new EventRegistrationsModel({
            eventId,
            userId,
            status: 'registered',
            qrCode: qrCode,
            qrCodeData: qrData
        });

        await registration.save();

        // Add to event's registered participants
        if (!event.registeredParticipants.includes(userId)) {
            event.registeredParticipants.push(userId);
            await event.save();
        }

        await registration.populate('userId', 'name email');
        await registration.populate('eventId', 'title eventDate location');

        return res.status(201).send(response.toJson(
            'Successfully registered for event',
            registration
        ));
    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        console.error('Error in registerForEvent:', err); // Add logging for debugging
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

// Get User's Registration for Event
const getUserRegistration = async (req, res) => {
    try {
        const { eventId } = req.params;
        const userId = req.user.id;

        const registration = await EventRegistrationsModel.findOne({
            eventId,
            userId,
            isDeleted: false
        })
        .populate('eventId', 'title eventDate location startTime endTime')
        .populate('userId', 'name email');

        if (!registration) {
            return res.status(404).send(response.toJson('Registration not found'));
        }

        return res.status(200).send(response.toJson(
            messages['en'].common.detail_success,
            registration
        ));
    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
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









