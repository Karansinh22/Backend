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
        console.log("Hello");

        return res.status(404).send(response.toJson(messages['en'].user.otp_not_success, otpData.message));

    } catch (err) {
        console.log(err);
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
}

const sendPhoneOtp = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send(response.toJson(errors.errors[0].msg));
    }

    try {
        let existsUser = await UsersModel.findOne({ countryCode: req.body.countryCode, phoneNumber: req.body.phoneNumber });

        let otpCode = await sendOtp.generateOTP(6);
        if (req.body.phoneNumber == '7575007347' && req.body.countryCode == '+91') {
            otpCode = '000000';
        }

        // if(existsUser && existsUser.isProfileSubmit === true){
        //     return res.status(404).send(response.toJson(messages['en'].user.number_already_exists));
        // }

        if (!existsUser) {
            const referCode = await CommonFun.randomStr(6, true);

            const createUser = {
                countryCode: req.body.countryCode,
                phoneNumber: req.body.phoneNumber,
                otp: otpCode,
                otpDatetime: new Date(),
                source: 'Digital',
                subSource: 'App',
                referCode: referCode,
                country: "in",
            }

            existsUser = await UsersModel.create(createUser);
            await publishUserUpdate({ ...existsUser.toJSON(), rabbitAction: 'create', profilePath: CommonConfig.PROFILE_IMAGE_PATH });

            await SyncUsersModel.updateMany(
                {
                    countryCode: req.body.countryCode,
                    phoneNumber: req.body.phoneNumber,
                    userType: { $ne: 'MyContact' }
                },
                {
                    $set: { userType: 'MyContact', originalUserId: existsUser._id }
                }
            );
        } else {
            await UsersModel.updateOne(
                { _id: existsUser._id },
                { $set: { otp: otpCode, otpDatetime: new Date(), isDeleted: false } },
            ).exec();
        }

        const otpData = await sendOtp.sendOTPFromProvider(process.env.OTP_PROVIDER, { countryCode: req.body.countryCode, phoneNumber: req.body.phoneNumber, otpCode: otpCode });

        if (otpData.isSuccess) {
            // await UserRolesModel.findOneAndUpdate(
            // {
            //     userId: existsUser._id,
            //     roleName: "Users",
            // },
            //     { upsert: true, new: true }
            // );

            return res.status(200).send(response.toJson(messages['en'].user.otp_send_success));
        }

        return res.status(404).send(response.toJson(messages['en'].user.otp_not_success, otpData.message));

    } catch (err) {
        console.log(err);
        const statusCode = err.statusCode || 500;
        const errMess = err.message || err;
        return res.status(statusCode).send(response.toJson(errMess));
    }
}

module.exports = {
    testUserApi, sendPhoneOtp,
}