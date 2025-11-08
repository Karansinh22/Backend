const messages = require("../message");
const response = require("../config/response.js");
// const config = require("../config/auth.js");
var jwt = require("jsonwebtoken");
// var bcrypt = require("bcryptjs");

// const uuid = require('uuidv4');
const { validationResult } = require('express-validator');
const sendOtp = require('../libs/sendOtp.js');
const SendMail = require('../libs/sendMail.js');
const CommonConfig = require('../config/common.js');
const CommonFun = require('../libs/common.js');
const axios = require('axios');
const retry = require('async-retry');
const CommonController = require('../controllers/commonController.js')
const TestUsersModel = require('../models/testUsers.js');
const { publishUserUpdate, publishAllUserUpdate } = require('../libs/rabbitmq.js');
const { territoryCache } = require("../utils/territoryCache.js");
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const moment = require('moment'); // For date ranges

const testUserApi = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(response.toJson(errors.errors[0].msg));
    }

    try {
        const createUser = {
            firstName: req.body.firstName,
        }

        await TestUsersModel.create(createUser);

        return res.status(200).send(response.toJson(messages['en'].common.create_success));

    } catch (err) {
        console.log(err);
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
}

module.exports = {
    testUserApi
}