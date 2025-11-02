const { check } = require('express-validator');

exports.validAccessToken = [
    check('token').not().isEmpty().withMessage('Token is requied'),
];

exports.preSalesUserList = [
    check('page').not().isEmpty().withMessage('Page number is requied').toInt().withMessage('Page number is allowed Only numbers'),
    check('perPage').optional(),
    check('search').optional(),
];

exports.projectUserList = [
    check('page').not().isEmpty().withMessage('Page number is requied').toInt().withMessage('Page number is allowed Only numbers'),
    check('perPage').optional(),
    check('search').optional(),
    check('projectId').not().isEmpty().withMessage('Project id is required.'),
];


