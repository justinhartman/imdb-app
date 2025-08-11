import { describe, expect, it, jest, afterEach } from '@jest/globals';

jest.mock('mongoose', () => ({ connect: jest.fn() }));

const mongoose = require('mongoose');
const connectDB = require('./db').default;

describe('connectDB', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('logs success when connection succeeds', async () => {
    (mongoose.connect as any).mockResolvedValue(undefined);
    const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    await connectDB();
    expect(mongoose.connect).toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith('MongoDB Connected');
    log.mockRestore();
  });

  it('logs error and exits on failure', async () => {
    (mongoose.connect as any).mockRejectedValue(new Error('fail'));
    const err = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const exit = jest.spyOn(process, 'exit').mockImplementation((() => undefined) as any);
    await connectDB();
    expect(err).toHaveBeenCalledWith('fail');
    expect(exit).toHaveBeenCalledWith(1);
    err.mockRestore();
    exit.mockRestore();
  });
});
