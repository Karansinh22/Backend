module.exports = {
  mongodb: {
    url: process.env.MONGO_URI || 'mongodb://localhost:27017/user-services',
    databaseName: process.env.MONGO_DB_NAME || 'user-services',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  },
  migrationsDir: 'src/migrations',
  changelogCollectionName: 'changelog',
  migrationFileExtension: '.js'
};
