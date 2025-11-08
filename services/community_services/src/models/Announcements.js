const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { DBConnect } = require('./index.js');

const AnnouncementsSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    communityId: {
        type: Schema.Types.ObjectId,
        ref: 'communities',
        required: true,
        index: true
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Urgent'],
        default: 'Medium',
        index: true
    },
    category: {
        type: String,
        enum: ['General', 'Maintenance', 'Event', 'Security', 'Emergency', 'Other'],
        default: 'General'
    },
    images: [{
        type: String
    }],
    documents: [{
        type: String
    }],
    publishDate: {
        type: Date,
        default: Date.now,
        index: true
    },
    expiryDate: {
        type: Date,
        default: null
    },
    isPinned: {
        type: Boolean,
        default: false,
        index: true
    },
    status: {
        type: String,
        enum: ['Draft', 'Published', 'Archived'],
        default: 'Published',
        index: true
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    createdAt: {
        type: Date,
        index: true,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
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

const AnnouncementsModel = DBConnect.model('announcements', AnnouncementsSchema);

AnnouncementsModel.syncIndexes().then(() => {
    console.log('Announcements Model Indexes Synced');
}).catch((err) => {
    console.log('Announcements Model Indexes Sync Error', err);
});

module.exports = AnnouncementsModel;

