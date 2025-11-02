require('dotenv').config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

module.exports = {
  mongoUri: process.env.MONGO_URI,
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
};