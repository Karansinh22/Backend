const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { DBConnect } = require('./index.js');

const ReportsSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['Financial', 'Maintenance', 'Security', 'Survey', 'Facility', 'Other'],
        default: 'Other'
    },
    communityId: {
        type: Schema.Types.ObjectId,
        ref: 'communities',
        required: true,
        index: true
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    status: {
        type: String,
        enum: ['Draft', 'Pending', 'Approved', 'Rejected'],
        default: 'Draft',
        index: true
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
    },
    fileUrl: {
        type: String,
        default: null
    },
    approvedBy: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        default: null
    },
    approvedAt: {
        type: Date,
        default: null
    },
    rejectedBy: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        default: null
    },
    rejectedAt: {
        type: Date,
        default: null
    },
    rejectedReason: {
        type: String,
        default: null
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

const ReportsModel = DBConnect.model('reports', ReportsSchema);

ReportsModel.syncIndexes().then(() => {
    console.log('Reports Model Indexes Synced');
}).catch((err) => {
    console.log('Reports Model Indexes Sync Error', err);
});

module.exports = ReportsModel;
