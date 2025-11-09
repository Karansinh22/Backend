const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { DBConnect } = require('./index.js');

const CommunityManagersSchema = new Schema({
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
    role: {
        type: String,
        enum: ['Manager'],
        default: 'Manager'
    },
    permissions: {
        canApproveJoinRequests: {
            type: Boolean,
            default: true
        },
        canManagePosts: {
            type: Boolean,
            default: true
        },
        canManageUsers: {
            type: Boolean,
            default: true
        },
        canCreateEvents: {
            type: Boolean,
            default: true
        },
        canManageReports: {
            type: Boolean,
            default: true
        }
    },
    assignedBy: {
        type: Schema.Types.ObjectId,
        ref: 'users'
    },
    assignedAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active',
        index: true
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

// Compound index to prevent duplicate manager assignments
CommunityManagersSchema.index({ userId: 1, communityId: 1 }, { unique: true });

const CommunityManagersModel = DBConnect.model('communityManagers', CommunityManagersSchema);

CommunityManagersModel.syncIndexes().then(() => {
    console.log('CommunityManagers Model Indexes Synced');
}).catch((err) => {
    console.log('CommunityManagers Model Indexes Sync Error', err);
});

module.exports = CommunityManagersModel;


