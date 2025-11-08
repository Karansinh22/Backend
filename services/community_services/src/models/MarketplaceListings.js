const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { DBConnect } = require('./index.js');

const MarketplaceListingsSchema = new Schema({
    type: {
        type: String,
        enum: ['want', 'offer'],
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    attachment: {
        type: String,
        default: null
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
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'sold', 'closed'],
        default: 'pending'
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

const MarketplaceListingsModel = DBConnect.model('marketplaceListings', MarketplaceListingsSchema);

MarketplaceListingsModel.syncIndexes().then(() => {
    console.log('MarketplaceListings Model Indexes Synced');
}).catch((err) => {
    console.log('MarketplaceListings Model Indexes Sync Error', err);
});

module.exports = MarketplaceListingsModel;

