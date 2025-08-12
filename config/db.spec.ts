import mongoose from 'mongoose';

jest.mock('mongoose', () => ({ connect: jest.fn() }));

jest.mock('./app', () => ({
  MONGO_DB_URI: 'mongodb://example',
  MONGO_DB_NAME: 'db',
}));

import connectDB from './db';

describe('config/db', () => {
  test('connects to mongoose', async () => {
    await connectDB();
    expect(mongoose.connect).toHaveBeenCalledWith('mongodb://example', {
      dbName: 'db',
      family: 4,
    });
  });

  test('handles connection error', async () => {
    (mongoose.connect as jest.Mock).mockRejectedValueOnce({ message: 'fail' });
    const exit = jest.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error('exit ' + code);
    }) as any);
    await expect(connectDB()).rejects.toThrow('exit 1');
    expect(exit).toHaveBeenCalledWith(1);
  });
});
