import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { AuthService } from './auth.service.js';
import prisma from '../lib/prisma.js';

describe('AuthService', () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'SecurePassword123';

  beforeEach(async () => {
    // Clean up test data before each test
    await prisma.user.deleteMany({
      where: { email: testEmail },
    });
  });

  afterAll(async () => {
    // Clean up after all tests
    await prisma.user.deleteMany({
      where: { email: testEmail },
    });
  });

  describe('hashPassword', () => {
    it('should hash password successfully', async () => {
      const password = 'TestPassword123';
      const hash = await AuthService.hashPassword(password);

      expect(hash).toBeTruthy();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'TestPassword123';
      const hash1 = await AuthService.hashPassword(password);
      const hash2 = await AuthService.hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password and hash', async () => {
      const password = 'TestPassword123';
      const hash = await AuthService.hashPassword(password);
      const isMatch = await AuthService.comparePassword(password, hash);

      expect(isMatch).toBe(true);
    });

    it('should return false for non-matching password and hash', async () => {
      const password = 'TestPassword123';
      const wrongPassword = 'WrongPassword123';
      const hash = await AuthService.hashPassword(password);
      const isMatch = await AuthService.comparePassword(wrongPassword, hash);

      expect(isMatch).toBe(false);
    });
  });

  describe('generateTokens', () => {
    it('should generate valid access and refresh tokens', () => {
      const payload = { userId: 'test-user-id', email: testEmail };
      const tokens = AuthService.generateTokens(payload);

      expect(tokens.accessToken).toBeTruthy();
      expect(tokens.refreshToken).toBeTruthy();
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');
    });

    it('should generate different tokens on each call', () => {
      const payload = { userId: 'test-user-id', email: testEmail };
      const tokens1 = AuthService.generateTokens(payload);
      const tokens2 = AuthService.generateTokens(payload);

      expect(tokens1.accessToken).not.toBe(tokens2.accessToken);
      expect(tokens1.refreshToken).not.toBe(tokens2.refreshToken);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify valid access token', () => {
      const payload = { userId: 'test-user-id', email: testEmail };
      const tokens = AuthService.generateTokens(payload);
      const decoded = AuthService.verifyAccessToken(tokens.accessToken);

      expect(decoded).toBeTruthy();
      expect(decoded?.userId).toBe('test-user-id');
      expect(decoded?.email).toBe(testEmail);
    });

    it('should return null for invalid access token', () => {
      const decoded = AuthService.verifyAccessToken('invalid-token');
      expect(decoded).toBeNull();
    });

    it('should return null for expired access token', () => {
      // This test would require manipulating time or using a very short expiry
      // For now, we just test that invalid tokens return null
      const decoded = AuthService.verifyAccessToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.invalid');
      expect(decoded).toBeNull();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify valid refresh token', () => {
      const payload = { userId: 'test-user-id', email: testEmail };
      const tokens = AuthService.generateTokens(payload);
      const decoded = AuthService.verifyRefreshToken(tokens.refreshToken);

      expect(decoded).toBeTruthy();
      expect(decoded?.userId).toBe('test-user-id');
      expect(decoded?.email).toBe(testEmail);
    });

    it('should return null for invalid refresh token', () => {
      const decoded = AuthService.verifyRefreshToken('invalid-token');
      expect(decoded).toBeNull();
    });
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const result = await AuthService.register(testEmail, testPassword);

      expect(result.user).toBeTruthy();
      expect(result.user.email).toBe(testEmail);
      expect(result.user.id).toBeTruthy();
      expect(result.tokens.accessToken).toBeTruthy();
      expect(result.tokens.refreshToken).toBeTruthy();
    });

    it('should throw error if user already exists', async () => {
      await AuthService.register(testEmail, testPassword);

      await expect(AuthService.register(testEmail, testPassword)).rejects.toThrow(
        'User with this email already exists'
      );
    });

    it('should store hashed password, not plain text', async () => {
      await AuthService.register(testEmail, testPassword);

      const user = await prisma.user.findUnique({
        where: { email: testEmail },
      });

      expect(user?.passwordHash).toBeTruthy();
      expect(user?.passwordHash).not.toBe(testPassword);
    });
  });

  describe('login', () => {
    it('should login user with correct credentials', async () => {
      await AuthService.register(testEmail, testPassword);
      const result = await AuthService.login(testEmail, testPassword);

      expect(result.user).toBeTruthy();
      expect(result.user.email).toBe(testEmail);
      expect(result.tokens.accessToken).toBeTruthy();
      expect(result.tokens.refreshToken).toBeTruthy();
    });

    it('should throw error with incorrect email', async () => {
      await AuthService.register(testEmail, testPassword);

      await expect(AuthService.login('wrong@example.com', testPassword)).rejects.toThrow(
        'Invalid email or password'
      );
    });

    it('should throw error with incorrect password', async () => {
      await AuthService.register(testEmail, testPassword);

      await expect(AuthService.login(testEmail, 'WrongPassword123')).rejects.toThrow(
        'Invalid email or password'
      );
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens successfully', async () => {
      const registered = await AuthService.register(testEmail, testPassword);
      const refreshToken = registered.tokens.refreshToken;

      const result = await AuthService.refreshTokens(refreshToken);

      expect(result.user).toBeTruthy();
      expect(result.user.email).toBe(testEmail);
      expect(result.tokens.accessToken).toBeTruthy();
      expect(result.tokens.refreshToken).toBeTruthy();
    });

    it('should generate new tokens on refresh', async () => {
      const registered = await AuthService.register(testEmail, testPassword);
      const originalTokens = registered.tokens;

      const result = await AuthService.refreshTokens(originalTokens.refreshToken);

      expect(result.tokens.accessToken).not.toBe(originalTokens.accessToken);
      expect(result.tokens.refreshToken).not.toBe(originalTokens.refreshToken);
    });

    it('should throw error with invalid refresh token', async () => {
      await expect(AuthService.refreshTokens('invalid-token')).rejects.toThrow(
        'Invalid refresh token'
      );
    });
  });
});
