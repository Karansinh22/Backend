const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { DBConnect } = require('./index.js');

const CommunitiesSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    shortDescription: {
        type: String,
        trim: true
    },
    image: {
        type: String,
        default: null
    },
    bannerImage: {
        type: String,
        default: null
    },
    logo: {
        type: String,
        default: null
    },
    managerId: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    members: [{
        type: Schema.Types.ObjectId,
        ref: 'users'
    }],
    pendingRequests: [{
        type: Schema.Types.ObjectId,
        ref: 'users'
    }],
    pulses: [{
        type: Schema.Types.ObjectId,
        ref: 'pulses'
    }],
    marketplaceListings: [{
        type: Schema.Types.ObjectId,
        ref: 'marketplaceListings'
    }],
    events: [{
        type: Schema.Types.ObjectId,
        ref: 'events'
    }],
    territory: {
        type: String,
        default: null
    },
    location: {
        address: { type: String },
        city: { type: String },
        state: { type: String },
        zipCode: { type: String },
        country: { type: String, default: 'India' },
        coordinates: {
            lat: { type: Number },
            lng: { type: Number }
        }
    },
    isFeatured: {
        type: Boolean,
        default: false,
        index: true
    },
    highlights: [{
        type: String
    }],
    amenityIds: [{
        type: Schema.Types.ObjectId,
        ref: 'amenities'
    }],

    establishedYear: {
        type: Number
    },
    contactInfo: {
        email: { type: String },
        phone: { type: String },
        website: { type: String }
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'pending', 'Active', 'Inactive', 'UnderDevelopment'],
        default: 'active',
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

const CommunitiesModel = DBConnect.model('communities', CommunitiesSchema);

CommunitiesModel.syncIndexes().then(() => {
    console.log('Communities Model Indexes Synced');
}).catch((err) => {
    console.log('Communities Model Indexes Sync Error', err);
});

module.exports = CommunitiesModel;

