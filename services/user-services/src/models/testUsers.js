const mongoose = require('mongoose')
const Schema = mongoose.Schema
const { DBConnect } = require('../models/index.js')
const { commonStatus, userActivity } = require('../config/data.js')

const TestUsersSchema = new Schema({
    firstName: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        index: true,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        required: false,
        default: Date.now
    },
    deletedAt: {
        type: Date,
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
});

TestUsersSchema.methods.toJSON = function () {
    var obj = this.toObject();
    delete obj.hashed_password;
    delete obj.salt;
    return obj;
};

// TestUsersSchema.virtual('userRoles', {
//     ref: 'userroles', // The model to use
//     localField: '_id', // Field in User schema
//     foreignField: 'userId', // Field in Post schema
// });

const TestUsersModel = DBConnect.model('testusers', TestUsersSchema)

TestUsersModel.syncIndexes().then(() => {
    console.log('Test Users Model Indexes Synced')
}).catch((err) => {
    console.log('Test Users Model Indexes Sync Error', err)
})

module.exports = TestUsersModel