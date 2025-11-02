const { check, param } = require('express-validator');

exports.testUserApi = [
    check('name').not().isEmpty().withMessage('Name is requied'),
];

exports.sendPhoneOtp = [
    check('countryCode').not().isEmpty().withMessage('Country code is requied'),
    check('phoneNumber').not().isEmpty().withMessage('Phone Number is requied'),
];
