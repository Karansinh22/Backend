const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { DBConnect } = require('./index.js');

const AmenitiesSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    description: {
        type: String,
        trim: true
    },
    icon: {
        type: String,
        default: null
    },
    category: {
        type: String,
        enum: ['Sports', 'Recreation', 'Health', 'Safety', 'Convenience', 'Social', 'Other'],
        default: 'Other'
    },
    isActive: {
        type: Boolean,
        default: true,
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

const AmenitiesModel = DBConnect.model('amenities', AmenitiesSchema);

AmenitiesModel.syncIndexes().then(() => {
    console.log('Amenities Model Indexes Synced');
}).catch((err) => {
    console.log('Amenities Model Indexes Sync Error', err);
});

module.exports = AmenitiesModel;

