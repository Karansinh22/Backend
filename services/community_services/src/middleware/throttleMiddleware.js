const rateLimit = require('express-rate-limit');

// Throttle Middleware (70 requests per minute)
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // Limit each IP to 60 requests per `windowMs`
  message: { status: 429, error: 'Too many requests, please try again later.' },
  standardHeaders: true, // Return `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // trustProxy: false // Add this line to enforce
  validate: {
    trustProxy: false, // Ensure Express doesn't trust proxy headers
  }
});

module.exports = limiter;