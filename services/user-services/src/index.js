const express = require('express');
const cors = require("cors");

const dotenv = require("dotenv");
const yargs = require('yargs');

const argv = yargs.argv;
const appEnv = argv.env || process.env.NODE_ENV || 'dev';

// Set NODE_ENV to match the chosen environment
process.env.NODE_ENV = appEnv;
const envFile = `.env.${appEnv}`;
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
// const { setupTerritoryRabbitMQ } = require('./libs/rabbitmq.js');

var whitelist = [
    'dev-sample-services.shivalikgroup.com','35.154.180.15','35.154.180.15:3011', 'localhost:11001',
  ];

var corsOption = function (req, callback) {
    var corsOptions;
    if (whitelist.indexOf(req.header('host')) !== -1) {
      corsOptions = { origin: true } // reflect (enable) the requested origin in the CORS response
    //   console.log(corsOptions);
      callback(null, corsOptions)
    } else {
        corsOptions = { origin: false } // disable CORS for this request
        // console.log(corsOptions);
        callback(new Error(`Not allowed by CORS : ${req.header('host')}`))

    }
    // console.log(corsOptions);
    // callback(null, corsOptions) // callback expects two parameters: error and options
}

app.use(cors(corsOption));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload());
app.use(throttleCalls); // Log all API calls

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
// setupTerritoryRabbitMQ().catch(err => console.error('Failed to start Territory RabbitMQ:', err));

app.get("/", (req, res) => {
    res.json({ message: `Welcome to FIRST application. Hello : ${envFile}` });
});

app.use(express.static(__dirname + '/uploads/'));

const PORT = process.env.PORT || 11001;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`http://localhost:${PORT}.`);
});
