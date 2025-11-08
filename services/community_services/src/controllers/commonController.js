const messages = require("../message");
const response = require("../config/response.js");
// const CmsModel = require('../models/models/cms.js');
const { validationResult } = require('express-validator');
const AWS = require('aws-sdk');
const s3 = new AWS.S3({
	accessKeyId: process.env.AWS_ACCESS_KEY,
	secretAccessKey: process.env.AWS_SECRET_KEY,
	region: process.env.AWS_DEFAULT_REGION,
});
const CommonConfig = require('../config/common.js');
const CommonFun = require('../libs/common.js');
const axios = require('axios');
const SendMail = require('../libs/sendMail.js');

const uploadFIleWithAuth = async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).send(response.toJson(errors.errors[0].msg));
	}

	try {

		if (!req.files || !req.files.upload_file) {
			return res.status(400).send(response.toJson(messages['en'].fileUpload.file_not_exists));
		}

		const root = req.body.root || 'users';
		const isUpload = await commonFileUpload(req.files.upload_file, req.body.type, root);

		if (!isUpload.isSuccess) {
			return res.status(400).send(response.toJson(isUpload.message));
		}
		const data = isUpload.files;

		return res.status(200).send(response.toJson(messages['en'].user.profile_update_success, (data.length == 1) ? data[0] : data));

	} catch (err) {
		const statusCode = err.statusCode || 500;
		const errMess = err.message || err;
		return res.status(statusCode).send(response.toJson(errMess));
	}
}

const uploadProjectFIleWithAuth = async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).send(response.toJson(errors.errors[0].msg));
	}

	try {
		const allowedRoles = ["SuperAdmin"];
		const userHasAccess = req.user.userRoles?.some(role => allowedRoles.includes(role));
		if (!userHasAccess) {
			return res.status(404).send(response.toJson(messages['en'].auth.not_access));
		}

		if (!req.files || !req.files.upload_file) {
			return res.status(400).send(response.toJson(messages['en'].fileUpload.file_not_exists));
		}

		const root = req.body.root;
		const fileType = req.body.type;

		if (!(root === 'projects' && fileType === 'documents')) {
			return res.status(400).send(response.toJson(messages['en'].fileUpload.invalid_root_type));
		}

		const isUpload = await commonLargeFileUpload(req.files.upload_file, fileType, root);

		if (!isUpload.isSuccess) {
			return res.status(400).send(response.toJson(isUpload.message));
		}

		const data = isUpload.files;
		return res.status(200).send(response.toJson(
			messages['en'].user.profile_update_success,
			(data.length === 1) ? data[0] : data
		));

	} catch (err) {
		const statusCode = err.statusCode || 500;
		const errMess = err.message || err;
		return res.status(statusCode).send(response.toJson(errMess));
	}
}

async function commonLargeFileUpload(reqFiles, fileType, root) {
	try {
		const allowedTypes = ['documents'];
		if (!fileType || !allowedTypes.includes(fileType)) {
			return {
				isSuccess: false,
				message: messages['en'].fileUpload.file_type_invalid,
			};
		}

		// console.log(reqFiles);
		const allowedRoots = ['projects'];
		if (!root || !allowedRoots.includes(root)) {
			return {
				isSuccess: false,
				message: messages['en'].fileUpload.root_invalid,
			};
		}

		let allowedMimetypes = [
			'image/jpg', 'image/jpeg', 'image/png', // Images
			'application/pdf', // PDF
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
			'video/mp4', // Video
			'application/json'   // JSON
		];

		if (root == 'projects' && fileType == 'documents') {
			allowedMimetypes = [
				'image/jpg', 'image/jpeg', 'image/png', // Images
				'application/pdf', // PDF
				'image/svg+xml', // SVG
			]
		}

		// Normalize single file to array
		const files = Array.isArray(reqFiles) ? reqFiles : [reqFiles];

		let uploadedFiles = [];

		for (const file of files) {
			if (!allowedMimetypes.includes(file.mimetype)) {
				return {
					isSuccess: false,
					message: `${file.name} has an invalid file type`,
				};
			}

			// Allowed Max 70  MB
			if (file.size > 74246976) {
				return {
					isSuccess: false,
					message: `${file.name} has an invalid file size`,
				};
			}

			// const root = 'users';
			const fileName = `${Date.now()}_${file.name}`;
			const fileKey = `${root}/${fileType}/${fileName}`;

			const params = {
				Bucket: process.env.AWS_BUCKET,
				Key: fileKey,
				Body: file.data,
				ContentType: file.mimetype,
			};

			await s3.upload(params).promise();

			uploadedFiles.push({
				fileName: fileName,
				filePath: `${process.env.AWS_FILE_PATH}${fileKey}`,
			});
		}

		console.log('uploadedFiles.........', uploadedFiles);
		return {
			isSuccess: true,
			message: messages['en'].fileUpload.profile_update_success,
			files: uploadedFiles,
		};

	} catch (error) {
		console.error('commonFileUpload Error:', error);
		return {
			isSuccess: false,
			message: error.message || "File upload failed",
		};
	}
}

const uploadFiles = async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).send(response.toJson(errors.errors[0].msg));
	}

	try {

		if (!req.files || !req.files.upload_file) {
			return res.status(400).send(response.toJson(messages['en'].fileUpload.file_not_exists));
		}

		// const allowedTypes = ['documents'];
		// if (!allowedTypes.includes(req.body.type)) {
		// 	return res.status(404).send(response.toJson(messages['en'].fileUpload.file_type_invalid));
		// }

		const root = req.body.root || 'users';
		// const allowedRoots = ['land'];
		// if (!allowedRoots.includes(root)) {
		// 	return res.status(404).send(response.toJson(messages['en'].fileUpload.root_invalid));
		// }

		const isUpload = await commonFileUpload(req.files.upload_file, req.body.type, root);

		if (!isUpload.isSuccess) {
			return res.status(400).send(response.toJson(isUpload.message));
		}
		const data = isUpload.files;

		return res.status(200).send(response.toJson(messages['en'].user.profile_update_success, (data.length == 1) ? data[0] : data));

	} catch (err) {
		console.log(err);
		return res.status(500).send(response.toJson(err));
	}
}

async function commonFileUpload(reqFiles, fileType, root) {
	try {
		const allowedTypes = ['profile', 'professional', 'group', 'messages', 'documents', 'images', 'resume', 'certificate', 'logo', 'catelogs', 'tasks', 'registrations', 'contacts'];
		if (!fileType || !allowedTypes.includes(fileType)) {
			return {
				isSuccess: false,
				message: messages['en'].fileUpload.file_type_invalid,
			};
		}

		// console.log(reqFiles);
		const allowedRoots = ['users', 'chat', 'land', 'knowledges', 'channelSales', 'jobseeker', 'business', 'tasks', 'vendor', 'campaigns', 'projects', 'events', 'fund', 'employee', 'furniture','website', 'feedback', 'growthpartner'];
		if (!root || !allowedRoots.includes(root)) {
			return {
				isSuccess: false,
				message: messages['en'].fileUpload.root_invalid,
			};
		}

		let allowedMimetypes = [
			'image/jpg', 'image/jpeg', 'image/png', // Images
			'application/pdf', // PDF
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
			'video/mp4', // Video
			'application/json'   // JSON
		];

		if (root == 'users' && fileType == 'profile') {
			allowedMimetypes = [
				'image/jpg', 'image/jpeg', 'image/png', // Images
			]
		}

		if (root == 'users' && fileType == 'contacts') {
			allowedMimetypes = [
				'application/json'   // JSON
			]
		}

		if (root == 'land' && fileType == 'documents') {
			allowedMimetypes = [
				'image/jpg', 'image/jpeg', 'image/png', // Images
				'application/pdf', // PDF
			]
		}

		if (root == 'projects' && fileType == 'documents') {
			allowedMimetypes = [
				'image/jpg', 'image/jpeg', 'image/png', // Images
				'application/pdf', // PDF
				'image/svg+xml', // SVG
			]
		}

		if (root == 'fund' && fileType == 'documents') {
			allowedMimetypes = [
				'image/jpg', 'image/jpeg', 'image/png', // Images
				'application/pdf', // PDF
				'image/svg+xml', // SVG
			]
		}

		if (root == 'events' && fileType == 'images') {
			allowedMimetypes = [
				'image/jpg', 'image/jpeg', 'image/png', // Images
			]
		}

		if (root == 'channelSales' && fileType == 'documents') {
			allowedMimetypes = [
				'image/jpg', 'image/jpeg', 'image/png', // Images
				'application/pdf', // PDF
			]
		}

		if (root == 'campaigns' && fileType == 'documents') {
			allowedMimetypes = [
				'image/jpg', 'image/jpeg', 'image/png', // Images
				'application/pdf', // PDF
				'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
				'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
				'video/mp4', // Video
			]
		}

		if (root == 'knowledges' && fileType == 'images') {
			allowedMimetypes = [
				'image/jpg', 'image/jpeg', 'image/png', // Images
			]
		}

		if (root == 'vendor' && fileType == 'documents') {
			allowedMimetypes = [
				'image/jpg', 'image/jpeg', 'image/png', // Images
				'application/pdf', // PDF
			]
		}

		if (root == 'jobseeker' && fileType == 'documents') {
			allowedMimetypes = [
				'image/jpg', 'image/jpeg', 'image/png', // Images
				'application/pdf', // PDF
			]
		}

		if (root == 'employee' && fileType == 'documents') {
			allowedMimetypes = [
				'image/jpg', 'image/jpeg', 'image/png', // Images
			]
		}

		if (root == 'furniture' && fileType == 'documents') {
			allowedMimetypes = [
				'image/jpg', 'image/jpeg', 'image/png', // Images
				'application/pdf', // PDF
			]
		}

		if (root == 'website' && fileType == 'documents') {
			allowedMimetypes = [
				'image/jpg', 'image/jpeg', 'image/png', // Images
				'application/pdf', // PDF,
				'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
				'application/vnd.openxmlformats-officedocument.presentationml.presentation', //  PPTX
				'application/vnd.ms-powerpoint' // PPT
			]
		}

		if (root == 'tasks' && fileType == 'images') {
			allowedMimetypes = [
				'image/jpg', 'image/jpeg', 'image/png', // Images
			]
		}

		if (root == 'feedback' && fileType == 'documents'){
			allowedMimetypes = [
				'image/jpg', 'image/jpeg', 'image/png', // Images
			]
		}

		if (root == 'growthpartner' && fileType == 'documents') {
			allowedMimetypes = [
				'image/jpg', 'image/jpeg', 'image/png', // Images
				'application/pdf', // PDF,
				'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
				'application/vnd.openxmlformats-officedocument.presentationml.presentation', //  PPTX
				'application/vnd.ms-powerpoint' // PPT
			]
		}

		// Normalize single file to array
		const files = Array.isArray(reqFiles) ? reqFiles : [reqFiles];

		let uploadedFiles = [];

		for (const file of files) {
			if (!allowedMimetypes.includes(file.mimetype)) {
				return {
					isSuccess: false,
					message: `${file.name} has an invalid file type`,
				};
			}

			// Allowed Max 17  MB
			if (file.size > 17825792) {
				return {
					isSuccess: false,
					message: `${file.name} has an invalid file size`,
				};
			}

			// const root = 'users';
			const fileName = `${Date.now()}_${file.name}`;
			const fileKey = `${root}/${fileType}/${fileName}`;

			const params = {
				Bucket: process.env.AWS_BUCKET,
				Key: fileKey,
				Body: file.data,
				ContentType: file.mimetype,
			};

			await s3.upload(params).promise();

			uploadedFiles.push({
				fileName: fileName,
				filePath: `${process.env.AWS_FILE_PATH}${fileKey}`,
			});
		}

		console.log('uploadedFiles.........', uploadedFiles);
		return {
			isSuccess: true,
			message: messages['en'].fileUpload.profile_update_success,
			files: uploadedFiles,
		};

	} catch (error) {
		console.error('commonFileUpload Error:', error);
		return {
			isSuccess: false,
			message: error.message || "File upload failed",
		};
	}
}

async function checkFileExists(root, type, fileName) {
	// const bucket = "your-bucket-name"; // e.g. "my-bucket"
	// const key = "users/contacts/1751879102895_contacts (1).json";
	const key = `${root}/${type}/${fileName}`;
	// const key = 'users/contacts/1751879102895_contacts (1).json';
	try {
		const params = {
			Bucket: process.env.AWS_BUCKET,
			Key: key,
		};
		// await s3.send(new HeadObjectCommand({ Bucket: process.env.AWS_BUCKET, Key: key }));
		await s3.headObject(params).promise();
		return true;
		// console.log("✅ File exists.");
	} catch (err) {
		return false;
	}
}

const getAccessTokenValidate = async (req, res) => {
	try {
		const token = req.body.token;
		const blockList = await TokenBlackListsModel.findOne({ token: token });
		if (blockList) {
			return res.status(404).send(response.toJson(messages['en'].common.not_exists));
		}

		return res.status(200).send(response.toJson(messages['en'].common.detail_success));
	} catch (err) {
		return res.status(404).send(response.toJson(messages['en'].err.message));
	}
}

module.exports = {
	uploadFIleWithAuth, uploadProjectFIleWithAuth, uploadFiles, commonFileUpload, commonLargeFileUpload, checkFileExists, getAccessTokenValidate,
}