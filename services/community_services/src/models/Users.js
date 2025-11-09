const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Schema = mongoose.Schema;
const { DBConnect } = require('./index.js');

const UsersSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    mobileNumber: {
        type: String,
        required: true,
        trim: true
    },
    countryCode: {
        type: String,
        default: '+91'
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['User', 'Manager', 'Admin', 'SuperAdmin'],
        default: 'User'
    },
    communityId: {
        type: Schema.Types.ObjectId,
        ref: 'communities',
        default: null
    },
    status: {
        type: String,
        enum: ['Pending', 'Active', 'Inactive', 'Blocked'],
        default: 'Pending',
        index: true
    },
    otp: {
        type: String,
        default: null
    },
    otpExpiry: {
        type: Date,
        default: null
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    refreshToken: {
        type: String,
        default: null
    },
    lastLogin: {
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

// Hash password before saving
UsersSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
UsersSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw error;
    }
};

// Remove sensitive data from JSON response
UsersSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    delete obj.otp;
    delete obj.otpExpiry;
    delete obj.refreshToken;
    return obj;
};

const UsersModel = DBConnect.model('users', UsersSchema);

UsersModel.syncIndexes().then(() => {
    console.log('Users Model Indexes Synced');
}).catch((err) => {
    console.log('Users Model Indexes Sync Error', err);
});

module.exports = UsersModel;


