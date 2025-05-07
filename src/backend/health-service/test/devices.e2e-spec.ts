import { Test, TestingModule } from '@nestjs/testing'; // ^10.3.0
import { INestApplication, HttpStatus } from '@nestjs/common'; // ^10.3.0
import { describe, it, beforeEach, afterEach, expect } from '@jest/globals'; // 29.0.0+
import * as request from 'supertest'; // 6.3.3
import { SuperAgentTest } from 'supertest'; // 6.3.3

// Updated imports using TypeScript path aliases
import { DeviceType, ConnectDeviceDto } from '@austa/interfaces/health/device';
import { DevicesService } from '@app/health/devices/devices.service';
import { DevicesController } from '@app/health/devices/devices.controller';
import { AppModule } from '@app/health/app.module';
import { Configuration } from '@app/health/config/configuration';

// Enhanced error handling and database services
import { AllExceptionsFilter } from '@app/errors/exceptions.filter';
import { PrismaService } from '@app/database/prisma.service';
import { JwtAuthGuard } from '@app/auth/guards/jwt-auth.guard';

/**
 * End-to-end tests for the DevicesController, verifying the correct behavior
 * of device connection and retrieval endpoints. These tests ensure that the API
 * endpoints function as expected and that device data is properly managed.
 */
describe('DevicesController (e2e)', () => {
  let app: INestApplication;
  let devicesService: DevicesService;
  let prismaService: PrismaService;
  let agent: SuperAgentTest;

  const recordId = 'test-record-id';
  const connectDeviceDto: ConnectDeviceDto = {
    deviceId: 'test-device-id',
    deviceType: DeviceType.SMARTWATCH,
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideGuard(JwtAuthGuard)
    .useValue({ canActivate: () => true })
    .compile();

    app = moduleFixture.createNestApplication();
    devicesService = moduleFixture.get<DevicesService>(DevicesService);
    
    // Get the enhanced PrismaService with connection pooling
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    
    // Use the enhanced exception filter with standardized error classification
    app.useGlobalFilters(new AllExceptionsFilter(moduleFixture.get(Configuration)));
    
    await app.init();
    agent = request.agent(app.getHttpServer());
  });

  afterEach(async () => {
    // Ensure proper cleanup of database connections
    await prismaService.cleanupConnections();
    await app.close();
  });

  it('should connect a device', async () => {
    const response = await agent
      .post(`/records/${recordId}/devices`)
      .send(connectDeviceDto)
      .expect(HttpStatus.CREATED);

    expect(response.body).toEqual({
      id: expect.any(String),
      recordId: recordId,
      deviceType: connectDeviceDto.deviceType,
      deviceId: connectDeviceDto.deviceId,
      lastSync: null,
      status: 'connected',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });

  it('should get devices', async () => {
    // First connect a device to ensure there's data to retrieve
    await agent
      .post(`/records/${recordId}/devices`)
      .send(connectDeviceDto)
      .expect(HttpStatus.CREATED);

    const response = await agent
      .get(`/records/${recordId}/devices`)
      .expect(HttpStatus.OK);

    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          recordId: recordId,
          deviceType: connectDeviceDto.deviceType,
          deviceId: connectDeviceDto.deviceId,
        }),
      ]),
    );
  });

  it('should handle device connection errors gracefully', async () => {
    // Test with invalid device data to verify error handling
    const invalidDeviceDto = {
      deviceId: '', // Empty device ID should trigger validation error
      deviceType: 'INVALID_TYPE' as DeviceType,
    };

    const response = await agent
      .post(`/records/${recordId}/devices`)
      .send(invalidDeviceDto)
      .expect(HttpStatus.BAD_REQUEST);

    // Verify the error response format matches our standardized structure
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('type', 'VALIDATION');
    expect(response.body.error).toHaveProperty('message');
  });

  it('should handle device retrieval for non-existent record', async () => {
    const nonExistentRecordId = 'non-existent-id';
    
    const response = await agent
      .get(`/records/${nonExistentRecordId}/devices`)
      .expect(HttpStatus.NOT_FOUND);

    // Verify the error response format matches our standardized structure
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('type', 'BUSINESS');
    expect(response.body.error).toHaveProperty('message');
  });
});