import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as jwt from 'jsonwebtoken';

/**
 * Creates an authenticated user for testing and returns the authentication token.
 * 
 * @param app The NestJS application instance
 * @param userData Optional user data to override defaults
 * @returns Object containing the authentication token and user ID
 */
export async function createAuthenticatedUser(
  app: INestApplication,
  userData: Partial<TestUserData> = {}
): Promise<{ token: string; userId: string }> {
  // Default test user data
  const defaultUserData: TestUserData = {
    email: 'test@example.com',
    password: 'Password123!',
    firstName: 'Test',
    lastName: 'User',
  };

  // Merge default data with provided overrides
  const testUser = { ...defaultUserData, ...userData };

  // Register the user if needed
  // This is commented out because in a real test we might want to use a mock
  // or a pre-seeded test database instead of actually registering a user
  /*
  await request(app.getHttpServer())
    .post('/auth/register')
    .send(testUser);
  */

  // For testing purposes, we'll create a JWT token directly
  // In a real test, you might want to actually call the login endpoint
  const userId = '123e4567-e89b-12d3-a456-426614174000'; // Mock user ID
  const token = generateTestToken(userId, testUser.email);

  return { token, userId };
}

/**
 * Generates a test JWT token for authentication.
 * 
 * @param userId The user ID to include in the token
 * @param email The user email to include in the token
 * @returns A signed JWT token
 */
export function generateTestToken(userId: string, email: string): string {
  // In a real test, you would use the same secret as your application
  // For testing purposes, we use a fixed secret
  const secret = 'test-secret';
  
  const payload = {
    sub: userId,
    email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour expiration
  };

  return jwt.sign(payload, secret);
}

/**
 * Test user data interface
 */
export interface TestUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}