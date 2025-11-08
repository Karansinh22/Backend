const mongoose = require('mongoose')

const DBConnect = connection(process.env.ENTRYTRACKING_DB_URL, parseInt(process.env.ENTRYTRACKING_DB_POOLSIZE), process.env.DB_NAME)

function connection(DB_URL, maxPoolSize = 10, DB) {
  try {
    const dbConfig = { readPreference: 'secondaryPreferred', maxPoolSize }

    const conn = mongoose.createConnection(DB_URL, dbConfig)
    conn.on('connected', () => console.log(`Connected to ${DB} database.`))
    return conn
  } catch (error) {
    console.log("Database connection Error : " + error);
    return;
  }
}

module.exports = {
  DBConnect
}
