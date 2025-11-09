const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { DBConnect } = require('./index.js');

const RoleChangeRequestsSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: true,
        index: true
    },
    currentRole: {
        type: String,
        required: true,
        enum: ['User', 'Manager', 'Admin', 'SuperAdmin']
    },
    requestedRole: {
        type: String,
        required: true,
        enum: ['User', 'Manager', 'Admin', 'SuperAdmin']
    },
    communityId: {
        type: Schema.Types.ObjectId,
        ref: 'communities',
        required: true,
        index: true
    },
    reason: {
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
    rejectionReason: {
        type: String,
        trim: true
    },
    approvedAt: {
        type: Date,
        default: null
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

// Compound index to prevent duplicate role change requests
RoleChangeRequestsSchema.index({ userId: 1, communityId: 1, requestedRole: 1 }, { unique: true });

const RoleChangeRequestsModel = DBConnect.model('roleChangeRequests', RoleChangeRequestsSchema);

RoleChangeRequestsModel.syncIndexes().then(() => {
    console.log('RoleChangeRequests Model Indexes Synced');
}).catch((err) => {
    console.log('RoleChangeRequests Model Indexes Sync Error', err);
});

module.exports = RoleChangeRequestsModel;
