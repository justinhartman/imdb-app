/**
 * Mongoose configuration to connect to MongoDB database using Mongoose.
 * @module config/db
 * @description This module exports a function that connects to the MongoDB database using Mongoose.
 */

import mongoose from 'mongoose';
import appConfig from './app';

/**
 * A function to establish a connection to the MongoDB database.
 * Uses the mongoose library to connect to the database URI and specified database name.
 * In case of a connection failure, it logs the error message and terminates the process.
 *
 * @returns {Promise<void>} A promise that resolves once the connection is successfully established.
 * @throws Will exit the process if the connection fails.
 */
const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(appConfig.MONGO_DB_URI, {
      dbName: appConfig.MONGO_DB_NAME,
      family: 4,
    });
    console.log('MongoDB Connected');
  } catch (error: any) {
    console.error(error.message);
    process.exit(1);
  }
};

export default connectDB;

