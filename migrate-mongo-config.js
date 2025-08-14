/**
 * Configuration for migrate-mongo package.
 * @module migrate-mongo/config
 * @description This module contains the configuration for the application.
 */

/**
 * Load environment variables from .env file
 */
require('dotenv').config();

/**
 * Environment variables for MongoDB connection
 * @type {Object}
 * @property {string} MONGO_HOST - MongoDB host address
 * @property {string} MONGO_PORT - MongoDB port number
 * @property {string} MONGO_USERNAME - MongoDB username
 * @property {string} MONGO_PASSWORD - MongoDB password
 * @property {string} MONGO_URI - Complete MongoDB URI string (optional)
 * @property {string} MONGO_DATABASE - MongoDB database name
 */
const {
  MONGO_HOST,
  MONGO_PORT,
  MONGO_USERNAME,
  MONGO_PASSWORD,
  MONGO_URI = '',
  MONGO_DATABASE,
} = process.env;

/**
 * Constructs MongoDB connection URI
 * Uses basic authentication if username and password are provided,
 * otherwise uses the MONGO_URI environment variable
 * @type {string}
 */
const mongoUri = (MONGO_USERNAME && MONGO_PASSWORD)
  ? `mongodb://${encodeURIComponent(MONGO_USERNAME)}:${encodeURIComponent(MONGO_PASSWORD)}@${MONGO_HOST}:${MONGO_PORT}`
  : `${MONGO_URI}`;

/**
 * The MongoDB configuration object.
 * @type {Object}
 * @property {Object} mongodb - MongoDB specific configuration
 * @property {string} mongodb.url - MongoDB connection URI
 * @property {string} mongodb.databaseName - Database name to connect to
 * @property {Object} mongodb.options - Additional MongoDB connection options
 * @property {string} migrationsDir - Directory containing migration files
 * @property {string} changelogCollectionName - Collection name for storing migration history
 * @property {string} migrationFileExtension - File extension for migration files
 * @property {boolean} useFileHash - Whether to use file content checksums for migration tracking
 * @property {string} moduleSystem - Module system used for migrations
 */
const config = {
  mongodb: {
    url: mongoUri,
    databaseName: MONGO_DATABASE,
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

module.exports = config;
