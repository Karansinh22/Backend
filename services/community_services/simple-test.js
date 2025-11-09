console.log('Current directory:', __dirname);
console.log('Process cwd:', process.cwd());

// Try to load dotenv
try {
  require('dotenv').config();
  console.log('Environment variables loaded');
  console.log('PORT:', process.env.PORT);
} catch (error) {
  console.error('Error loading dotenv:', error.message);
}

// Try to load the main server file
try {
  console.log('Attempting to load index.js...');
  require('./src/index.js');
  console.log('Index.js loaded successfully');
} catch (error) {
  console.error('Error loading index.js:', error.message);
  console.error('Stack:', error.stack);
}