import { describe, expect, it, jest } from '@jest/globals';
import bcrypt from 'bcryptjs';
import User from './User';

describe('User model', () => {
  it('compares password correctly', async () => {
    const compare = jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as any);
    const user: any = new User({ username: 'u', password: 'hashed' });
    const result = await user.matchPassword('plain');
    expect(compare).toHaveBeenCalledWith('plain', 'hashed');
    expect(result).toBe(true);
  });

  it('pre-save hook hashes password when modified', async () => {
    const preSave = (User as any).schema.s.hooks._pres.get('save')[3].fn;
    const next = jest.fn();
    const saltSpy = jest.spyOn(bcrypt, 'genSalt').mockResolvedValue('salt' as any);
    const hashSpy = jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed' as any);
    const context: any = {
      password: 'plain',
      isModified: jest.fn().mockReturnValue(true),
    };

    await preSave.call(context, next);

    expect(saltSpy).toHaveBeenCalledWith(12);
    expect(hashSpy).toHaveBeenCalledWith('plain', 'salt');
    expect(context.password).toBe('hashed');
    expect(next).toHaveBeenCalled();
  });

  it('pre-save hook skips hashing when password unchanged', async () => {
    const preSave = (User as any).schema.s.hooks._pres.get('save')[3].fn;
    const next = jest.fn();
    const context: any = {
      password: 'existing',
      isModified: jest.fn().mockReturnValue(false),
    };

    await preSave.call(context, next);

    expect(bcrypt.genSalt).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('pre-save hook forwards errors', async () => {
    const preSave = (User as any).schema.s.hooks._pres.get('save')[3].fn;
    const next = jest.fn();
    jest.spyOn(bcrypt, 'genSalt').mockRejectedValue(new Error('fail'));
    const context: any = {
      password: 'plain',
      isModified: jest.fn().mockReturnValue(true),
    };

    await preSave.call(context, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('username validator validates email correctly', () => {
    const validator = (User as any).schema.path('username').options.validate.validator;
    expect(validator('test@example.com')).toBe(true);
    expect(validator('invalid')).toBe(false);
  });
});
