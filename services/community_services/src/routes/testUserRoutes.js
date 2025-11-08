
const TestUserController = require("../controllers/testUserController");
const UserValidation = require("../validations/userValidation");
const router = require('express').Router();
const { isCommonUserAuthenticated, adminVerifyToken, superAdminVerifyToken } = require("../middleware/authJwt");

// Add just final test deploy
router.post("/test-user-api", UserValidation.testUserApi, TestUserController.testUserApi);

// router.put("/test-user-api/:userId", UserValidation.update, TestUserController.update);

module.exports = router;
