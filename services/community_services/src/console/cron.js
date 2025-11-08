const cron = require('node-cron');

const commonConfig = require("../config/common");
const messages = require("../message");
// const backup = require('mongodb-backup');
const fs = require('fs');
const { exec } = require('child_process');
const archiver = require('archiver');
const { cronLogger } = require('../config/logger');
const moment = require("moment");
const SendMail = require('../libs/sendMail.js')
const axios = require('axios');

// MongoDB Atlas connection string
const mongoURI = process.env.ENTRYTRACKING_DB_URL;
const dbName = process.env.DB_NAME;
const bucketName = process.env.AWS_BUCKET;
const AWS = require('aws-sdk');
const s3 = new AWS.S3({
	accessKeyId: process.env.AWS_ACCESS_KEY,
	secretAccessKey: process.env.AWS_SECRET_KEY,
	region: process.env.AWS_DEFAULT_REGION,
});

// league data store to DB from bet365 data.
const testing = async (req, res) => {
	try {
		console.log("******************************* Cron is working fine.");
	} catch (err) {
		console.log(err);
	}
}


const webRegistrationReportCron = async () => {
  try {
    console.log('R Registration from web : Report Cron started');

    // Logic of Cron Function

    console.log('Lead Task Report Cron finished');
  } catch (err) {
    console.error('Lead Task Report Cron Error:', err);
  }
};

// Defind object to all function.
const obj = {
	testing: testing,
	webRegistrationReportCron: webRegistrationReportCron,
}

const job = (cron, time, fname) => {
	try {
		const cronJob = cron.schedule(time, obj[fname]);
		cronJob.start();
	} catch (err) {
		console.log(err);
	}
}

module.exports = {
  job,
}