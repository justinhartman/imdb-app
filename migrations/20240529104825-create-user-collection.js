/**
 * User collection migration.
 * @module migrations/createUsers
 * @description This module contains a migration function that creates a 'users' collection in the database.
 */
module.exports = {
  /**
   * Migrates the database schema by creating a 'users' collection.
   * @param {import('mongodb').Db} db - The MongoDB database instance.
   * @param {import('mongodb').MongoClient} client - The MongoDB client instance.
   * @returns {Promise<void>} A Promise that resolves when the migration is complete.
   * @see https://github.com/seppevs/migrate-mongo/#creating-a-new-migration-script
   * @example await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: true}});
   */
  async up(db, client) {
    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        await db.createCollection('users');
      });
    } finally {
      await session.endSession();
    }
  },

  /**
   * Migrates the database schema by dropping the 'users' collection.
   * @param {import('mongodb').Db} db - The MongoDB database instance.
   * @param {import('mongodb').MongoClient} client - The MongoDB client instance.
   * @returns {Promise<void>} A Promise that resolves when the migration is complete.
   * @example await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
   */
  async down(db, client) {
    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        await db.collection('users').drop();
      });
    } finally {
      await session.endSession();
    }
  }
};
