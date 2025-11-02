module.exports = {
    socketEventsLimit : 100,
    socket : {},
    // ENTRYTRACKING_DB_URL : "mongodb+srv://shivalik_user:ORQV7NutIp0nBFqJ@shivalik-stag.0kark.mongodb.net/entry-tracking-system-staging",
    // ENTRYTRACKING_DB_URL : "mongodb+srv://shivalik_user:ORQV7NutIp0nBFqJ@shivalik-stag.0kark.mongodb.net/shivalik_sync_dev",
    // ENTRYTRACKING_DB_POOLSIZE : 10,
    JWT_SECRET: process.env.JWT_SECRET || 'aAbBcC@test_123',
    JWT_SECRET_USER: 'aAbBcC@test_123_User', // JWT secret for user
    JWT_VALIDITY: process.env.JWT_VALIDITY || '30d',
    REFRESH_TOKEN_VALIDITY: process.env.REFRESH_TOKEN_VALIDITY || '99d', // Refresh token validity
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || 'aAbBcC@test_123', // Refresh token secret
    JWT_EXPIRED_AT : '10y',
    JWT_ADMIN_EXPIRED_AT : '7d',
    JWT_WEB_EXPIRED_AT : '1d',
    JWT_SUPER_ADMIN_EXPIRED_AT : '7d',

    // Image Path
    PROFILE_IMAGE_PATH : `${process.env.AWS_FILE_PATH}users/profile/`,


    // Per Page Limit Data
    userListLimit : 15,

};