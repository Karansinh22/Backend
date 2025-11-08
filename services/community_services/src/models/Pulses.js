const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { DBConnect } = require('./index.js');

const PulsesSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    territory: {
        type: String,
        required: true
    },
    communityId: {
        type: Schema.Types.ObjectId,
        ref: 'communities',
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    attachment: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    likes: [{
        type: Schema.Types.ObjectId,
        ref: 'users'
    }],
    comments: [{
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'users'
        },
        text: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
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

const PulsesModel = DBConnect.model('pulses', PulsesSchema);

PulsesModel.syncIndexes().then(() => {
    console.log('Pulses Model Indexes Synced');
}).catch((err) => {
    console.log('Pulses Model Indexes Sync Error', err);
});

module.exports = PulsesModel;

