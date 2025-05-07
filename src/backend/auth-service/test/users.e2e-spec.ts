import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';

// Updated imports using TypeScript path aliases
import { AppModule } from '@app/auth/app.module';
import { PrismaService } from '@app/database/prisma.service';

// Import from @austa/interfaces for shared user data models
import { CreateUserDto, UserResponseDto } from '@austa/interfaces/auth';

/**
 * End-to-end tests for the UsersController in the auth-service.
 * Validates all CRUD operations and error handling for user management.
 */
describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let userId: string;
  
  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = app.get<PrismaService>(PrismaService);
    
    // Clean up the test database before each test with enhanced error handling
    try {
      await prismaService.user.deleteMany({
        where: {
          email: {
            contains: 'test-',
          },
        },
      });
    } catch (error) {
      console.error('Database cleanup failed:', error.message);
      // Continue with the test as this is just setup
    }
    
    await app.init();
  });

  afterAll(async () => {
    // Clean up after all tests with enhanced error handling
    try {
      await prismaService.user.deleteMany({
        where: {
          email: {
            contains: 'test-',
          },
        },
      });
    } catch (error) {
      console.error('Final database cleanup failed:', error.message);
    } finally {
      // Ensure connections are properly closed regardless of cleanup success
      await prismaService.$disconnect();
      await app.close();
    }
  });

  it('should create a new user', async () => {
    const createUserDto: CreateUserDto = {
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      password: 'Password123!',
      phone: '123456789',
      cpf: '12345678901',
    };

    const response = await request(app.getHttpServer())
      .post('/users')
      .send(createUserDto)
      .expect(HttpStatus.CREATED);

    expect(response.body).toBeDefined();
    expect(response.body.id).toBeDefined();
    expect(response.body.name).toBe(createUserDto.name);
    expect(response.body.email).toBe(createUserDto.email);
    expect(response.body.password).toBeUndefined(); // Password should not be returned
    
    // Save the user ID for subsequent tests
    userId = response.body.id;
  });

  it('should return validation errors for invalid user data', async () => {
    const invalidUserDto = {
      name: 'Test User',
      email: 'invalid-email', // Invalid email format
      password: 'short', // Too short
    };

    const response = await request(app.getHttpServer())
      .post('/users')
      .send(invalidUserDto)
      .expect(HttpStatus.BAD_REQUEST);

    expect(response.body.error).toBeDefined();
    expect(response.body.error.message).toBeDefined();
    // Enhanced error validation
    expect(response.body.error.code).toBeDefined();
    expect(response.body.error.details).toBeDefined();
  });

  it('should get all users', async () => {
    // First create a user to ensure there's at least one
    const createUserDto: CreateUserDto = {
      name: 'Test User For Get All',
      email: `test-${Date.now()}@example.com`,
      password: 'Password123!',
      phone: '123456789',
      cpf: '12345678901',
    };

    await request(app.getHttpServer())
      .post('/users')
      .send(createUserDto)
      .expect(HttpStatus.CREATED);

    // Then get all users - this requires admin privileges
    // Note: In a real app, you'd need to authenticate as admin first
    // For test purposes, you may need to mock authentication or use a test admin token
    const response = await request(app.getHttpServer())
      .get('/users')
      .expect(HttpStatus.OK);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    
    // Validate response structure against UserResponseDto
    const firstUser = response.body[0];
    expect(firstUser).toHaveProperty('id');
    expect(firstUser).toHaveProperty('name');
    expect(firstUser).toHaveProperty('email');
    expect(firstUser).not.toHaveProperty('password');
  });

  it('should get a user by ID', async () => {
    // First create a user to get its ID
    const createUserDto: CreateUserDto = {
      name: 'Test User For Get By ID',
      email: `test-${Date.now()}@example.com`,
      password: 'Password123!',
      phone: '123456789',
      cpf: '12345678901',
    };

    const createResponse = await request(app.getHttpServer())
      .post('/users')
      .send(createUserDto)
      .expect(HttpStatus.CREATED);

    const userIdToGet = createResponse.body.id;

    // Then get the user by ID
    const response = await request(app.getHttpServer())
      .get(`/users/${userIdToGet}`)
      .expect(HttpStatus.OK);

    expect(response.body).toBeDefined();
    expect(response.body.id).toBe(userIdToGet);
    expect(response.body.name).toBe(createUserDto.name);
    expect(response.body.email).toBe(createUserDto.email);
    expect(response.body.password).toBeUndefined(); // Password should not be returned
  });

  it('should return 404 for non-existent user ID', async () => {
    const nonExistentId = 'non-existent-id';
    
    const response = await request(app.getHttpServer())
      .get(`/users/${nonExistentId}`)
      .expect(HttpStatus.NOT_FOUND);
    
    // Enhanced error validation
    expect(response.body.error).toBeDefined();
    expect(response.body.error.code).toBe('USER_NOT_FOUND');
    expect(response.body.error.message).toContain(nonExistentId);
  });

  it('should update a user', async () => {
    // First create a user to update
    const createUserDto: CreateUserDto = {
      name: 'Test User For Update',
      email: `test-${Date.now()}@example.com`,
      password: 'Password123!',
      phone: '123456789',
      cpf: '12345678901',
    };

    const createResponse = await request(app.getHttpServer())
      .post('/users')
      .send(createUserDto)
      .expect(HttpStatus.CREATED);

    const userIdToUpdate = createResponse.body.id;

    // Then update the user
    const updateData = {
      name: 'Updated Test User',
      phone: '987654321',
    };

    const updateResponse = await request(app.getHttpServer())
      .patch(`/users/${userIdToUpdate}`)
      .send(updateData)
      .expect(HttpStatus.OK);

    expect(updateResponse.body).toBeDefined();
    expect(updateResponse.body.id).toBe(userIdToUpdate);
    expect(updateResponse.body.name).toBe(updateData.name);
    expect(updateResponse.body.phone).toBe(updateData.phone);
    expect(updateResponse.body.email).toBe(createUserDto.email); // Email should remain unchanged
  });

  it('should delete a user', async () => {
    // First create a user to delete
    const createUserDto: CreateUserDto = {
      name: 'Test User For Delete',
      email: `test-${Date.now()}@example.com`,
      password: 'Password123!',
      phone: '123456789',
      cpf: '12345678901',
    };

    const createResponse = await request(app.getHttpServer())
      .post('/users')
      .send(createUserDto)
      .expect(HttpStatus.CREATED);

    const userIdToDelete = createResponse.body.id;

    // Then delete the user
    await request(app.getHttpServer())
      .delete(`/users/${userIdToDelete}`)
      .expect(HttpStatus.NO_CONTENT);

    // Verify the user is deleted
    const getResponse = await request(app.getHttpServer())
      .get(`/users/${userIdToDelete}`)
      .expect(HttpStatus.NOT_FOUND);
    
    // Enhanced error validation
    expect(getResponse.body.error).toBeDefined();
    expect(getResponse.body.error.code).toBe('USER_NOT_FOUND');
  });
  
  // Additional test for database connection error handling
  it('should handle database connection errors gracefully', async () => {
    // Mock a database error by temporarily breaking the connection
    const originalConnect = prismaService.$connect;
    prismaService.$connect = jest.fn().mockRejectedValueOnce(new Error('Simulated database connection error'));
    
    try {
      // Attempt to create a user which should trigger the connection error
      const createUserDto: CreateUserDto = {
        name: 'Test User',
        email: `test-${Date.now()}@example.com`,
        password: 'Password123!',
        phone: '123456789',
        cpf: '12345678901',
      };
      
      const response = await request(app.getHttpServer())
        .post('/users')
        .send(createUserDto)
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);
      
      // Verify the error response format
      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('DATABASE_ERROR');
      expect(response.body.error.message).toBeDefined();
    } finally {
      // Restore the original connection method
      prismaService.$connect = originalConnect;
    }
  });
});