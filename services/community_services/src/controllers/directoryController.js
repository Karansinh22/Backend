const messages = require("../message");
const response = require("../config/response.js");
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const DirectoryEntriesModel = require('../models/DirectoryEntries.js');
const CommunitiesModel = require('../models/Communities.js');

// Get Directory Entries by Community
const getDirectoryEntries = async (req, res) => {
    try {
        const { communityId } = req.params;
        const serviceType = req.query.serviceType; // Optional filter
        const search = req.query.search; // Optional search by name

        // Check if community exists
        const community = await CommunitiesModel.findById(communityId);
        if (!community || community.isDeleted) {
            return res.status(404).send(response.toJson('Community not found'));
        }

        const filter = {
            communityId,
            isDeleted: false
        };

        if (serviceType) {
            filter.serviceType = serviceType;
        }

        if (search) {
            filter.name = { $regex: search, $options: 'i' };
        }

        const entries = await DirectoryEntriesModel.find(filter)
            .populate('addedBy', 'name email')
            .sort({ verified: -1, name: 1 })
            .lean();

        return res.status(200).send(response.toJson(
            messages['en'].common.detail_success,
            entries
        ));
    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

// Add Directory Entry (Manager only)
const addDirectoryEntry = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).send(response.toJson(errors.array()[0].msg));
        }

        const {
            communityId,
            name,
            serviceType,
            contactNumber,
            alternateContact,
            email,
            availabilityHours,
            address,
            notes
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
            return res.status(403).send(response.toJson('Only community managers can add directory entries'));
        }

        const entry = new DirectoryEntriesModel({
            communityId,
            name,
            serviceType,
            contactNumber,
            alternateContact: alternateContact || null,
            email: email || null,
            availabilityHours: availabilityHours || '9 AM - 6 PM',
            address: address || null,
            notes: notes || null,
            verified: isAdmin, // Auto-verify if added by admin
            addedBy: userId
        });

        await entry.save();
        await entry.populate('addedBy', 'name email');

        return res.status(201).send(response.toJson(
            messages['en'].common.create_success,
            entry
        ));
    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

// Update Directory Entry
const updateDirectoryEntry = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).send(response.toJson(errors.array()[0].msg));
        }

        const { id } = req.params;
        const {
            name,
            serviceType,
            contactNumber,
            alternateContact,
            email,
            availabilityHours,
            address,
            notes,
            verified
        } = req.body;
        const userId = req.user.id;

        const entry = await DirectoryEntriesModel.findById(id);
        if (!entry || entry.isDeleted) {
            return res.status(404).send(response.toJson('Directory entry not found'));
        }

        // Check permissions
        const community = await CommunitiesModel.findById(entry.communityId);
        const isManager = community.managerId && community.managerId.toString() === userId;
        const isAdmin = req.user.role === 'Admin' || req.user.role === 'SuperAdmin';

        if (!isManager && !isAdmin) {
            return res.status(403).send(response.toJson('Only managers and admins can update directory entries'));
        }

        // Update fields
        if (name) entry.name = name;
        if (serviceType) entry.serviceType = serviceType;
        if (contactNumber) entry.contactNumber = contactNumber;
        if (alternateContact !== undefined) entry.alternateContact = alternateContact;
        if (email !== undefined) entry.email = email;
        if (availabilityHours) entry.availabilityHours = availabilityHours;
        if (address !== undefined) entry.address = address;
        if (notes !== undefined) entry.notes = notes;
        if (verified !== undefined && isAdmin) entry.verified = verified;

        await entry.save();
        await entry.populate('addedBy', 'name email');

        return res.status(200).send(response.toJson(
            messages['en'].common.update_success,
            entry
        ));
    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

// Delete Directory Entry
const deleteDirectoryEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const entry = await DirectoryEntriesModel.findById(id);
        if (!entry || entry.isDeleted) {
            return res.status(404).send(response.toJson('Directory entry not found'));
        }

        // Check permissions
        const community = await CommunitiesModel.findById(entry.communityId);
        const isManager = community.managerId && community.managerId.toString() === userId;
        const isAdmin = req.user.role === 'Admin' || req.user.role === 'SuperAdmin';

        if (!isManager && !isAdmin) {
            return res.status(403).send(response.toJson('Only managers and admins can delete directory entries'));
        }

        entry.isDeleted = true;
        entry.deletedAt = new Date();
        await entry.save();

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

// Get Single Directory Entry
const getDirectoryEntryById = async (req, res) => {
    try {
        const { id } = req.params;

        const entry = await DirectoryEntriesModel.findOne({
            _id: id,
            isDeleted: false
        })
        .populate('addedBy', 'name email')
        .populate('communityId', 'name');

        if (!entry) {
            return res.status(404).send(response.toJson('Directory entry not found'));
        }

        return res.status(200).send(response.toJson(
            messages['en'].common.detail_success,
            entry
        ));
    } catch (err) {
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
};

module.exports = {
    getDirectoryEntries,
    addDirectoryEntry,
    updateDirectoryEntry,
    deleteDirectoryEntry,
    getDirectoryEntryById
};

