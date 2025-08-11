/**
 * Test Suite: Passport Configuration
 *
 * This test suite verifies the proper configuration and functionality of Passport.js authentication.
 * It covers:
 * - Local Strategy configuration and verification
 * - User serialization/deserialization
 * - Authentication scenarios (valid/invalid credentials)
 * - User lookup behavior
 *
 * The tests use mocked User model to isolate passport configuration testing.
 */

import passport from 'passport';

/**
 * Mock configuration for the User model. Provides mock implementations for:
 * - findOne: Used in authentication to look up users by username
 * - findById: Used in session deserialization to restore user objects
 */
jest.mock('../models/User', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    findById: jest.fn(),
  },
}));

import User from '../models/User';
import passportMiddleware from './passport';

/**
 * Defines the signature for passport callback functions used in authentication and session management.
 * @param err - Any error that occurred during the operation
 * @param user - The user object if operation was successful
 * @param info - Additional information about the operation result
 * @returns void
 */
type Done = (err: any, user?: any, info?: any) => void;

/**
 * Test suite for passport configuration and authentication functionality.
 * Verifies the proper setup and behavior of Passport.js integration.
 */

describe('config/passport', /**
 * Test suite for verifying Passport.js middleware configuration and behavior, focusing on the registration
 * of a LocalStrategy, serialization, deserialization, and authentication workflows.
 *
 * This suite includes tests to capture the interactions between Passport.js and the application's user model,
 * ensuring the correct setup and handling of various authentication scenarios through spies and mock objects.
 */
() => {
  let useSpy: jest.SpiedFunction<typeof passport.use>;
  let serializeSpy: jest.SpiedFunction<typeof passport.serializeUser>;
  let deserializeSpy: jest.SpiedFunction<typeof passport.deserializeUser>;

  let capturedSerialize: ((user: any, done: (err: any, id?: string | null) => void) => void) | undefined;
  let capturedDeserialize: ((id: string, done: Done) => void) | undefined;

  beforeEach(() => {
    jest.clearAllMocks();

    // Spy and capture strategy/serialize/deserialize registrations
    useSpy = jest.spyOn(passport, 'use').mockImplementation((strategy: any) => {
      // passthrough behavior is not needed; we only want the captured strategy
      return passport;
    });

    serializeSpy = jest
      .spyOn(passport, 'serializeUser')
      .mockImplementation((cb: any) => {
        capturedSerialize = cb;
      });

    deserializeSpy = jest
      .spyOn(passport, 'deserializeUser')
      .mockImplementation((cb: any) => {
        capturedDeserialize = cb;
      });

    // Initialize passport config
    passportMiddleware(passport as any);
  });

  /**
   * Verifies that the LocalStrategy is properly registered with Passport
   */
  test('registers LocalStrategy', () => {
    expect(useSpy).toHaveBeenCalledTimes(1);
    const strategy = useSpy.mock.calls[0][0] as any;
    expect(strategy?.name).toBe('local'); // passport-local strategies expose name = 'local'
  });

  /**
   * Tests the LocalStrategy verify callback when attempting to authenticate a non-existent user
   */
  test('verify callback: user not found → failure', async () => {
    (User.findOne as jest.Mock).mockResolvedValueOnce(null);

    const strategy = useSpy.mock.calls[0][0] as any;
    const verify = strategy._verify as (u: string, p: string, done: Done) => void;

    const result = await new Promise<{ err: any; user: any; info: any }>((resolve) => {
      verify('someone', 'secret', (err, user, info) => resolve({ err, user, info }));
    });

    expect(result.err).toBeNull();
    expect(result.user).toBe(false);
    expect(result.info).toEqual({ message: 'Invalid credentials.' });
    expect(User.findOne).toHaveBeenCalledWith({ username: 'someone' });
  });

  /**
   * Tests the LocalStrategy verify callback when attempting to authenticate with incorrect password
   */
  test('verify callback: bad password → failure', async () => {
    (User.findOne as jest.Mock).mockResolvedValueOnce({
      id: 'user-1',
      matchPassword: jest.fn().mockResolvedValue(false),
    });

    const strategy = useSpy.mock.calls[0][0] as any;
    const verify = strategy._verify as (u: string, p: string, done: Done) => void;

    const result = await new Promise<{ err: any; user: any; info: any }>((resolve) => {
      verify('someone', 'wrong', (err, user, info) => resolve({ err, user, info }));
    });

    expect(result.err).toBeNull();
    expect(result.user).toBe(false);
    expect(result.info).toEqual({ message: 'Invalid credentials.' });
  });

  /**
   * Tests the LocalStrategy verify callback with valid credentials
   */
  test('verify callback: valid credentials → success', async () => {
    const mockUser = {
      id: 'user-1',
      matchPassword: jest.fn().mockResolvedValue(true),
    };
    (User.findOne as jest.Mock).mockResolvedValueOnce(mockUser);

    const strategy = useSpy.mock.calls[0][0] as any;
    const verify = strategy._verify as (u: string, p: string, done: Done) => void;

    const result = await new Promise<{ err: any; user: any; info: any }>((resolve) => {
      verify('someone', 'correct', (err, user, info) => resolve({ err, user, info }));
    });

    expect(result.err).toBeNull();
    expect(result.user).toBe(mockUser);
    expect(result.info).toBeUndefined();
    expect(mockUser.matchPassword).toHaveBeenCalledWith('correct');
  });

  /**
   * Verifies that user serialization correctly stores the user ID
   */
  test('serializeUser stores string id', async () => {
    expect(serializeSpy).toHaveBeenCalledTimes(1);
    expect(typeof capturedSerialize).toBe('function');

    const user = { id: 'user-123' };
    const { err, id } = await new Promise<{ err: any; id?: string | null }>((resolve) => {
      capturedSerialize!(user, (e, i) => resolve({ err: e, id: i }));
    });

    expect(err).toBeNull();
    expect(id).toBe('user-123');
  });

  /**
   * Tests user deserialization when the user exists in the database
   */
  test('deserializeUser: user found → success', async () => {
    const mockUser = { id: 'user-123', username: 'someone' };
    (User.findById as jest.Mock).mockResolvedValueOnce(mockUser);

    expect(deserializeSpy).toHaveBeenCalledTimes(1);
    expect(typeof capturedDeserialize).toBe('function');

    const res = await new Promise<{ err: any; user: any; info: any }>((resolve) => {
      capturedDeserialize!('user-123', (err, user, info) => resolve({ err, user, info }));
    });

    expect(res.err).toBeNull();
    expect(res.user).toBe(mockUser);
    expect(res.info).toBeUndefined();
    expect(User.findById).toHaveBeenCalledWith('user-123');
  });

  /**
   * Tests user deserialization when the user does not exist in the database
   */
  test('deserializeUser: user not found → false', async () => {
    (User.findById as jest.Mock).mockResolvedValueOnce(null);

    const res = await new Promise<{ err: any; user: any; info: any }>((resolve) => {
      capturedDeserialize!('missing', (err, user, info) => resolve({ err, user, info }));
    });

    expect(res.err).toBeNull();
    expect(res.user).toBe(false);
    expect(res.info).toBeUndefined();
  });

  /**
   * Tests error handling in LocalStrategy when User.findOne rejects
   * Verifies that database errors during user lookup are properly propagated
   */
  test('verify callback: User.findOne rejects → done(err)', async () => {
    const boom = new Error('findOne failed');
    (User.findOne as jest.Mock).mockRejectedValueOnce(boom);

    const strategy = useSpy.mock.calls[0][0] as any;
    const verify = strategy._verify as (u: string, p: string, done: Done) => void;

    const result = await new Promise<{ err: any; user: any; info: any }>((resolve) => {
      verify('someone', 'secret', (err, user, info) => resolve({ err, user, info }));
    });

    expect(result.err).toBe(boom);
    expect(result.user).toBeUndefined();
    expect(result.info).toBeUndefined();
  });

  /**
   * Tests error handling in LocalStrategy when password matching fails
   * Verifies that errors during password comparison are properly propagated
   */
  test('verify callback: matchPassword rejects → done(err)', async () => {
    const boom = new Error('match failed');
    (User.findOne as jest.Mock).mockResolvedValueOnce({
      id: 'user-1',
      matchPassword: jest.fn().mockRejectedValue(boom),
    });

    const strategy = useSpy.mock.calls[0][0] as any;
    const verify = strategy._verify as (u: string, p: string, done: Done) => void;

    const result = await new Promise<{ err: any; user: any; info: any }>((resolve) => {
      verify('someone', 'whatever', (err, user, info) => resolve({ err, user, info }));
    });

    expect(result.err).toBe(boom);
    expect(result.user).toBeUndefined();
    expect(result.info).toBeUndefined();
  });

  /**
   * Tests error handling during user serialization
   * Verifies that errors accessing user.id property are properly caught and propagated
   */
  test('serializeUser: accessing user.id throws → done(err)', async () => {
    expect(typeof capturedSerialize).toBe('function');

    const user: any = {};
    Object.defineProperty(user, 'id', {
      get() {
        throw new Error('serialize boom');
      },
    });

    const res = await new Promise<{ err: any; id?: string | null }>((resolve) => {
      capturedSerialize!(user, (err, id) => resolve({ err, id }));
    });

    expect(res.err).toBeInstanceOf(Error);
    expect((res.err as Error).message).toBe('serialize boom');
    expect(res.id).toBeUndefined();
  });

  /**
   * Tests error handling during user deserialization
   * Verifies that database errors during user lookup are properly propagated
   */
  test('deserializeUser: User.findById rejects → done(err)', async () => {
    const boom = new Error('findById failed');
    (User.findById as jest.Mock).mockRejectedValueOnce(boom);

    const res = await new Promise<{ err: any; user: any; info: any }>((resolve) => {
      capturedDeserialize!('user-123', (err, user, info) => resolve({ err, user, info }));
    });

    expect(res.err).toBe(boom);
    expect(res.user).toBeUndefined();
    expect(res.info).toBeUndefined();
  });
});
