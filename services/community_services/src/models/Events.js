const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { DBConnect } = require('./index.js');

const EventsSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    communityId: {
        type: Schema.Types.ObjectId,
        ref: 'communities',
        required: true,
        index: true
    },
    eventDate: {
        type: Date,
        required: true,
        index: true
    },
    startTime: {
        type: String,
        required: true
    },
    endTime: {
        type: String
    },
    location: {
        type: String,
        trim: true
    },
    images: [{
        type: String
    }],
    maxParticipants: {
        type: Number,
        default: null
    },
    registeredParticipants: [{
        type: Schema.Types.ObjectId,
        ref: 'users'
    }],
    participants: [{
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'users'
        },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'rejected'],
            default: 'pending'
        },
        registeredAt: {
            type: Date,
            default: Date.now
        }
    }],
    attendance: [{
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'users'
        },
        markedAt: {
            type: Date,
            default: Date.now
        },
        verified: {
            type: Boolean,
            default: false
        }
    }],
    eventType: {
        type: String,
        enum: ['Cultural', 'Sports', 'Educational', 'Social', 'Festival', 'Meeting', 'Other'],
        default: 'Other'
    },
    status: {
        type: String,
        enum: ['Upcoming', 'Ongoing', 'Completed', 'Cancelled', 'upcoming', 'ongoing', 'completed', 'cancelled'],
        default: 'Upcoming',
        index: true
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    deletedAt: {
        type: Date,
        default: null
    },
    isDeleted: {
        type: Boolean,
        default: false,
        index: true
    }
}, {
    timestamps: true
});

const EventsModel = DBConnect.model('events', EventsSchema);

EventsModel.syncIndexes().then(() => {
    console.log('Events Model Indexes Synced');
}).catch((err) => {
    console.log('Events Model Indexes Sync Error', err);
});

module.exports = EventsModel;

