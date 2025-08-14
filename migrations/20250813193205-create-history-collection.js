/**
 * History collection migration.
 * @module migrations/createHistory
 * @description Creates the 'histories' collection with a compound index.
 */
module.exports = {
  /**
   * Creates the 'histories' collection and adds an index on userId and imdbId.
   * @param {import('mongodb').Db} db - The MongoDB database instance.
   * @param {import('mongodb').MongoClient} client - The MongoDB client instance.
   * @returns {Promise<void>}
   */
  async up(db, client) {
    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        await db.createCollection('histories');
        await db
          .collection('histories')
          .createIndex({ userId: 1, imdbId: 1 }, { unique: true });
      });
    } finally {
      await session.endSession();
    }
  },

  /**
   * Drops the 'histories' collection.
   * @param {import('mongodb').Db} db - The MongoDB database instance.
   * @param {import('mongodb').MongoClient} client - The MongoDB client instance.
   * @returns {Promise<void>}
   */
  async down(db, client) {
    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        await db.collection('histories').drop();
      });
    } finally {
      await session.endSession();
    }
  },
};
