const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { DBConnect } = require('./index.js');

const MarketplaceChatsSchema = new Schema({
    listingId: {
        type: Schema.Types.ObjectId,
        ref: 'marketplaceListings',
        required: true,
        index: true
    },
    participants: [{
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: true
    }],
    messages: [{
        senderId: {
            type: Schema.Types.ObjectId,
            ref: 'users',
            required: true
        },
        text: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        read: {
            type: Boolean,
            default: false
        }
    }],
    lastMessageAt: {
        type: Date,
        default: Date.now,
        index: true
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

// Index for finding chats by participants
MarketplaceChatsSchema.index({ participants: 1, listingId: 1 });

const MarketplaceChatsModel = DBConnect.model('marketplaceChats', MarketplaceChatsSchema);

MarketplaceChatsModel.syncIndexes().then(() => {
    console.log('MarketplaceChats Model Indexes Synced');
}).catch((err) => {
    console.log('MarketplaceChats Model Indexes Sync Error', err);
});

module.exports = MarketplaceChatsModel;

