const jwt = require("jsonwebtoken");
// const config = require("../config/auth");
// const db = require("../models");
const messages = require("../message");
const response = require("../config/response.js");
// const UsersModel = require('../models/users.js');
// const UserRolesModel = require("../models/userRoles.js");
const CommonConfig = require('../config/common.js');
// const TokenBlackListsModel = require('../models/tokenBlackLists.js');

exports.adminVerifyToken =  async (req, res, next) => {
    const token = req.header('Authorization')

    if (!token) {
        return res.status(401).send(response.toJson(messages['en'].auth.empty_token));
    }

    // const blockList = await TokenBlackListsModel.findOne({ token : token });
    // if(blockList){
    //     return res.status(401).send(response.toJson(messages['en'].auth.un_authenticate));
    // }

    next();

    // jwt.verify(token, CommonConfig.JWT_SECRET_USER, async (err, decoded) => {
    //     if (err) {
    //         return res.status(401).send(response.toJson(messages['en'].auth.un_authenticate));
    //     }

    //     req.userId = decoded.id;
    //     const existsUser = await UsersModel.findOne({
    //         // $or: [{ role: "SubAdmin" }, { role: "KnowledgeAdmin" }, { role: "LandAdmin" }],
    //         _id : decoded.id, isDeleted : false,
    //     }).lean();

    //     if (!existsUser) {
    //         return res.status(401).send(response.toJson(messages['en'].auth.un_authenticate));
    //     }

    //     req.user = existsUser;
    //     next();
    // });
};

exports.isCommonUserAuthenticated = async (req, res, next) => {
    const token = req.header('Authorization')

    if (!token) {
        return res.status(401).send(response.toJson(messages['en'].auth.empty_token));
    }

    const blockList = await TokenBlackListsModel.findOne({ token: token });
    if (blockList) {
        return res.status(401).send(response.toJson(messages['en'].auth.un_authenticate));
    }

    next();

    // jwt.verify(token, CommonConfig.JWT_SECRET_USER, async (err, decoded) => {
    //     if (err) {
    //         return res.status(401).send(response.toJson(messages['en'].auth.un_authenticate));
    //     }

    //     req.userId = decoded.id;
    //     const existsUser = await UsersModel.findOne({
    //         _id: decoded.id, isDeleted : false
    //     }).lean();

    //     if (!existsUser) {
    //         return res.status(401).send(response.toJson(messages['en'].auth.un_authenticate));
    //     }

    //     const existsUserRoles = await UserRolesModel.find({
    //         userId: decoded.id, isDeleted: false
    //     });

    //     let userRoleTitles = [];
    //     if(existsUserRoles.length > 0){
    //         userRoleTitles = existsUserRoles.map(r => r.roleName).filter(Boolean);
    //     }

    //     req.user = existsUser;
    //     req.user.userRoles = userRoleTitles;

    //     req.user = existsUser;
    //     next();
    // });
};

exports.superAdminVerifyToken = async (req, res, next) => {
    const token = req.header('Authorization')

    if (!token) {
        return res.status(401).send(response.toJson(messages['en'].auth.empty_token));
    }

    // const blockList = await TokenBlackListsModel.findOne({ token: token });
    // if (blockList) {
    //     return res.status(401).send(response.toJson(messages['en'].auth.un_authenticate));
    // }

    next();

    // jwt.verify(token, CommonConfig.JWT_SECRET_USER, async (err, decoded) => {
    //     if (err) {
    //         return res.status(401).send(response.toJson(messages['en'].auth.un_authenticate));
    //     }

    //     req.userId = decoded.id;

    //     const existsUser = await UsersModel.findOne({
    //         _id: decoded.id, isDeleted : false,
    //     }).lean();
    //     if (!existsUser) {
    //         return res.status(401).send(response.toJson(messages['en'].auth.un_authenticate));
    //     }

    //     const existsUserRoles = await UserRolesModel.find({
    //         userId: decoded.id, isDeleted: false
    //     });

    //     if (existsUserRoles.length == 0) {
    //         return res.status(401).send(response.toJson(messages['en'].auth.not_access));
    //     }

    //     const allowedRoles = ["SuperAdmin"];
    //     const userRoleTitles = existsUserRoles.map(r => r.roleName).filter(Boolean);
    //         console.log(userRoleTitles);
    //     const hasValidRole = userRoleTitles.some(title => allowedRoles.includes(title));

    //     if (!hasValidRole) {
    //         return res.status(401).send(response.toJson(messages['en'].auth.not_access));
    //     }

    //     req.user = existsUser;
    //     req.user.userRoles = userRoleTitles;
    //     next();
    // });
};