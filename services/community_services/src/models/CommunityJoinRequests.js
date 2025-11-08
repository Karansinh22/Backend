const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { DBConnect } = require('./index.js');

const CommunityJoinRequestsSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: true,
        index: true
    },
    communityId: {
        type: Schema.Types.ObjectId,
        ref: 'communities',
        required: true,
        index: true
    },
    message: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending',
        index: true
    },
    reviewedBy: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        default: null
    },
    reviewedAt: {
        type: Date,
        default: null
    },
    reviewNotes: {
        type: String,
        trim: true
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

// Compound index to prevent duplicate join requests
CommunityJoinRequestsSchema.index({ userId: 1, communityId: 1 }, { unique: true });

const CommunityJoinRequestsModel = DBConnect.model('communityJoinRequests', CommunityJoinRequestsSchema);

CommunityJoinRequestsModel.syncIndexes().then(() => {
    console.log('CommunityJoinRequests Model Indexes Synced');
}).catch((err) => {
    console.log('CommunityJoinRequests Model Indexes Sync Error', err);
});

module.exports = CommunityJoinRequestsModel;

