
const CommonController = require("../controllers/commonController");
const CommonValidation = require("../validations/commonValidation");
const { isCommonUserAuthenticated } = require("../middleware/authJwt");
const router = require('express').Router()

router.post("/upload-file-auth", [isCommonUserAuthenticated] , CommonController.uploadFIleWithAuth);

router.post("/upload-project-file-auth", [isCommonUserAuthenticated] , CommonController.uploadProjectFIleWithAuth);

router.post("/upload-files", CommonController.uploadFiles);

router.post("/access-token-valid", CommonValidation.validAccessToken, CommonController.getAccessTokenValidate);

module.exports = router;
