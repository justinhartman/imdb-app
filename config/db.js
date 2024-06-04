/**
 * Mongoose configuration to connect to MongoDB database using Mongoose.
 * @module config/db
 * @description This module exports a function that connects to the MongoDB database using Mongoose.
 */

/** @inheritDoc */
const mongoose = require('mongoose');
const appConfig = require('../config/app');

/**
 * Connects to the MongoDB database using Mongoose.
 * @returns {Promise<void>} A Promise that resolves when the database is connected.
 */
const connectDB = async () => {
  try {
    /**
     * Attempts to connect to the MongoDB database using the provided URI.
     * @param {string} MONGO_DB_URI - The URI for the MongoDB database.
     * @param {array} MONGO_DB_NAME - The name of the MongoDB database.
     */
    await mongoose.connect(appConfig.MONGO_DB_URI, { dbName: appConfig.MONGO_DB_NAME });
    console.log('MongoDB Connected');
  } catch (error) {
    /**
     * Handles any errors that occur during the database connection process.
     * @param {Error} error - The error that occurred during the connection process.
     */
    console.error(error.message);
    process.exit(1);
  }
};

/**
 * Exports the connectDB function for use in other parts of the application.
 */
module.exports = connectDB;
