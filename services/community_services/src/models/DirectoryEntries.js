const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { DBConnect } = require('./index.js');

const DirectoryEntriesSchema = new Schema({
    communityId: {
        type: Schema.Types.ObjectId,
        ref: 'communities',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    serviceType: {
        type: String,
        required: true,
        enum: ['plumber', 'electrician', 'security', 'housekeeping', 'carpenter', 'painter', 'gardener', 'mechanic', 'other'],
        index: true
    },
    contactNumber: {
        type: String,
        required: true,
        trim: true
    },
    alternateContact: {
        type: String,
        default: null
    },
    email: {
        type: String,
        default: null
    },
    availabilityHours: {
        type: String,
        default: '9 AM - 6 PM'
    },
    address: {
        type: String,
        default: null
    },
    verified: {
        type: Boolean,
        default: false,
        index: true
    },
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },
    notes: {
        type: String,
        default: null
    },
    addedBy: {
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
        default: false
    }
}, {
    timestamps: true
});

const DirectoryEntriesModel = DBConnect.model('directoryEntries', DirectoryEntriesSchema);

DirectoryEntriesModel.syncIndexes().then(() => {
    console.log('DirectoryEntries Model Indexes Synced');
}).catch((err) => {
    console.log('DirectoryEntries Model Indexes Sync Error', err);
});

module.exports = DirectoryEntriesModel;

