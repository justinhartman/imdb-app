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
});
