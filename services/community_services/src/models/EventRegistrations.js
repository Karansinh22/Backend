const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { DBConnect } = require('./index.js');

const EventRegistrationsSchema = new Schema({
    eventId: {
        type: Schema.Types.ObjectId,
        ref: 'events',
        required: true,
        index: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ['registered', 'attended', 'cancelled'],
        default: 'registered',
        index: true
    },
    qrCode: {
        type: String,
        required: true,
        unique: true
    },
    qrCodeData: {
        type: String,
        required: true
    },
    registeredAt: {
        type: Date,
        default: Date.now
    },
    attendedAt: {
        type: Date,
        default: null
    },
    deletedAt: {
        type: Date,
        default: null
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Compound index to ensure one registration per user per event
EventRegistrationsSchema.index({ eventId: 1, userId: 1 }, { unique: true });

const EventRegistrationsModel = DBConnect.model('eventRegistrations', EventRegistrationsSchema);

EventRegistrationsModel.syncIndexes().then(() => {
    console.log('EventRegistrations Model Indexes Synced');
}).catch((err) => {
    console.log('EventRegistrations Model Indexes Sync Error', err);
});

module.exports = EventRegistrationsModel;

