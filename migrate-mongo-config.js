/**
 * @description This function imports the application configuration from the 'helpers/appHelper' module.
 * @returns {Object} The application configuration object.
 */
const { appConfig } = require('./config/app');

/**
 * @description This object contains the configuration for the application.
 * @type {Object}
 * @property {string} mongodb.url - The MongoDB URI.
 * @property {string} mongodb.databaseName - The name of the MongoDB database.
 * @property {Object} mongodb.options - The options for the MongoDB connection.
 * @property {string} migrationsDir - The directory where the migrations are stored.
 * @property {string} changelogCollectionName - The name of the MongoDB collection where the applied changes are stored.
 * @property {string} migrationFileExtension - The file extension for the migrations.
 * @property {boolean} useFileHash - Whether to use a checksum of the file contents to determine if the file should be run.
 * @property {string} moduleSystem - The module system to use.
 */
const config = {
  mongodb: {
    url: appConfig.MONGO_DB_URI,
    databaseName: appConfig.MONGO_DB_NAME,
    options: {
      // connectTimeoutMS: 3600000, // increase connection timeout to 1 hour
      // socketTimeoutMS: 3600000, // increase socket timeout to 1 hour
    }
  },
  // The migrations dir, can be relative or absolute path. Only edit this when really necessary.
  migrationsDir: "migrations",
  // The mongodb collection where the applied changes are stored. Only edit this when really necessary.
  changelogCollectionName: "changelog",
  // The file extension to create migrations and search for in migration dir 
  migrationFileExtension: ".js",
  // Enable the algorithm to create a checksum of the file contents and use that in the comparison to determine
  // if the file should be run. Requires that scripts are coded to be run multiple times.
  useFileHash: false,
  // Don't change this, unless you know what you're doing
  moduleSystem: 'commonjs',
};

/**
 * @description This function exports the configuration object.
 * @returns {Object} The configuration object.
 */
module.exports = config;
