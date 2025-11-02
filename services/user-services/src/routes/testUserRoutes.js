
const TestUserController = require("../controllers/testUserController");
const UserValidation = require("../validations/userValidation");
const router = require('express').Router();
const { isCommonUserAuthenticated, adminVerifyToken, superAdminVerifyToken } = require("../middleware/authJwt");


router.post("/test-usr-api", UserValidation.testUserApi, TestUserController.testUserApi);

router.post("/send-phone-otp", UserValidation.sendPhoneOtp, TestUserController.sendPhoneOtp);

module.exports = router;
