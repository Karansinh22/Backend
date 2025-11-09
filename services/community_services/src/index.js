const express = require('express');
const cors = require("cors");

const dotenv = require("dotenv");
const yargs = require('yargs');

const argv = yargs.argv;
const appEnv = argv.env || process.env.NODE_ENV || 'dev';

// Set NODE_ENV to match the chosen environment
process.env.NODE_ENV = appEnv;

// Load .env file if no environment specified, otherwise use .env.{env}
const envFile = argv.env ? `.env.${appEnv}` : '.env';
console.log("🔹 Loading environment file:", envFile);

dotenv.config({ path: envFile });

console.log(`Loaded environment: ${appEnv}`);
console.log(`MongoDB URL: ${process.env.ENTRYTRACKING_DB_URL}`);
console.log(`Database Name: ${process.env.DB_NAME}`);

const fileUpload = require('express-fileupload');
const app = express();

const bodyParser = require('body-parser');
const path = require("path");
const fs = require('fs');
const db = require("./models/index.js");
// const { swaggerUi, swaggerDocs } = require('./src/config/swagger.js');
const { job } = require("./console/cron");
// const { socketJob } = require("./src/console/socket");
// const{syncLeadData } = require("./src/console/userRoleAssigned.js");
const commonConfig = require("./config/common");
// const { isSocketAuthenticated } = require('./src/middleware/authSocket.js');
const logApiCalls = require('./middleware/loggerMiddleware.js');
const throttleCalls = require('./middleware/throttleMiddleware.js');
const cron = require('node-cron');
const { setupTerritoryRabbitMQ } = require('./libs/rabbitmq.js');

var whitelist = [
    'dev-sample-services.shivalikgroup.com',
    '35.154.180.15',
    '35.154.180.15:3011',
    'localhost:11001',
    'localhost:5173',  // Vite default port
    'localhost:8080',  // Another common development port
    'localhost:8081',  // Current Vite port
    'localhost:3000',  // React default port
];

var corsOption = function (req, callback) {
    var corsOptions;
    // Get the origin header for CORS requests
    const origin = req.header('origin');
    
    // Check if origin is in whitelist or if it's a same-origin request
    if (!origin || whitelist.some(allowedOrigin => origin.includes(allowedOrigin))) {
        corsOptions = { 
            origin: true, 
            credentials: true,
            optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
        };
        callback(null, corsOptions);
    } else {
        corsOptions = { origin: false };
        callback(null, corsOptions);
    }
};

app.use(cors(corsOption));

// Configure fileUpload to parse both files and fields, and handle nested objects
// This must come BEFORE bodyParser to handle multipart/form-data requests
app.use(fileUpload({
    parseNested: true,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    abortOnLimit: true,
    responseOnLimit: 'File size limit has been reached',
    createParentPath: true // Automatically create parent directories for uploaded files
}));

// Body parser for JSON and urlencoded - only processes non-multipart requests
// fileUpload already handles multipart/form-data, so bodyParser will skip those
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

app.use(throttleCalls); // Log all API calls

// Add logging middleware
app.use((req, res, next) => {
  console.log(`=== Incoming Request ===`);
  console.log(`Method: ${req.method}`);
  console.log(`URL: ${req.url}`);
  console.log(`Headers:`, req.headers);
  console.log(`Query:`, req.query);
  console.log(`========================`);
  next();
});

// view engine setup
app.set('views', path.join(__dirname, 'app/views'));
app.set('view engine', 'ejs');
app.set('trust proxy', true);
app.use(logApiCalls); // Log all API calls

// CRONs
const webRegistrationReportCron = job(cron,'30 10 * * *', "webRegistrationReportCron");
// Import versioned router
const v1Routes = require('./routes');

// Use versioned routes
app.use('/api/v1', v1Routes);

// Start RabbitMQ consumer
setupTerritoryRabbitMQ().catch(err => console.error('Failed to start Territory RabbitMQ:', err));

app.get("/", (req, res) => {
    res.json({ message: `Welcome to FIRST application. Hello : ${envFile}` });
});

app.use(express.static(__dirname + '/../uploads/'));

const PORT = process.env.PORT || 11001;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`http://localhost:${PORT}.`);
});