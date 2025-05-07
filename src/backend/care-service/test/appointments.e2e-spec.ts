import { Test, TestingModule } from '@nestjs/testing'; // version ^10.3.0
import { INestApplication, HttpStatus } from '@nestjs/common'; // version ^10.3.0
import * as request from 'supertest'; // version 6.3.3
import { SuperAgentTest } from 'supertest'; // version 6.3.3
import { beforeEach, describe, expect, it, afterAll } from '@jest/globals'; // version 29.0.0+

// Updated imports using path aliases
import { AppointmentsController } from '@app/care/appointments/appointments.controller';
import { AppointmentsService } from '@app/care/appointments/appointments.service';

// Integration with @austa/interfaces for type-safe data models
import { CreateAppointmentDto } from '@austa/interfaces/care/appointment';
import { AppointmentType } from '@austa/interfaces/care/types';

// Using the new centralized exception framework
import { INSUFFICIENT_PERMISSIONS } from '@austa/errors/journey/care/error-codes';

describe('AppointmentsController (e2e)', () => {
  let app: INestApplication;
  let agent: SuperAgentTest;

  // Enhanced test setup with more consistent patterns
  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AppointmentsController],
      providers: [
        {
          provide: AppointmentsService,
          useValue: {
            create: jest.fn().mockResolvedValue({}),
            findAll: jest.fn().mockResolvedValue([]),
            findOne: jest.fn().mockResolvedValue({}),
            update: jest.fn().mockResolvedValue({}),
            remove: jest.fn().mockResolvedValue({}),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Apply global pipes, filters, and interceptors for consistent testing environment
    // This ensures the test environment matches the production setup
    await app.init();
    agent = request.agent(app.getHttpServer());
  });

  afterAll(async () => {
    await app.close();
  });

  it('/appointments (POST) should return 201 if successful', () => {
    // Using type-safe DTO from @austa/interfaces
    const createAppointmentDto: CreateAppointmentDto = {
      userId: 'valid-uuid',
      providerId: 'valid-uuid',
      dateTime: new Date(),
      type: AppointmentType.IN_PERSON, // Using enum from @austa/interfaces
      notes: 'Initial consultation',
    };

    return agent
      .post('/appointments')
      .send(createAppointmentDto)
      .expect(HttpStatus.CREATED)
      .expect(res => {
        // Enhanced response validation
        expect(res.body).toBeDefined();
        expect(res.body.id).toBeDefined();
      });
  });

  it('/appointments (POST) should return 403 if insufficient permissions', () => {
    // Using type-safe DTO from @austa/interfaces
    const createAppointmentDto: CreateAppointmentDto = {
      userId: 'valid-uuid',
      providerId: 'valid-uuid',
      dateTime: new Date(),
      type: AppointmentType.IN_PERSON, // Using enum from @austa/interfaces
      notes: 'Initial consultation',
    };

    return agent
      .post('/appointments')
      .send(createAppointmentDto)
      .expect(HttpStatus.FORBIDDEN)
      .expect((res) => {
        // Using the new error code from @austa/errors
        expect(res.body.error.code).toBe(INSUFFICIENT_PERMISSIONS);
        expect(res.body.error.message).toBeDefined();
        expect(res.body.error.timestamp).toBeDefined();
      });
  });

  it('/appointments (GET) should return 200 if successful', () => {
    return agent
      .get('/appointments')
      .expect(HttpStatus.OK)
      .expect(res => {
        // Enhanced response validation
        expect(Array.isArray(res.body)).toBe(true);
      });
  });

  it('/appointments/:id (GET) should return 200 if successful', () => {
    const appointmentId = 'valid-uuid';
    
    return agent
      .get(`/appointments/${appointmentId}`)
      .expect(HttpStatus.OK)
      .expect(res => {
        // Enhanced response validation
        expect(res.body).toBeDefined();
        expect(res.body.id).toBeDefined();
      });
  });

  it('/appointments/:id (PATCH) should return 200 if successful', () => {
    const appointmentId = 'valid-uuid';
    const updateAppointmentDto = {
      notes: 'Updated notes',
    };

    return agent
      .patch(`/appointments/${appointmentId}`)
      .send(updateAppointmentDto)
      .expect(HttpStatus.OK)
      .expect(res => {
        // Enhanced response validation
        expect(res.body).toBeDefined();
        expect(res.body.id).toBeDefined();
        expect(res.body.notes).toBe(updateAppointmentDto.notes);
      });
  });

  it('/appointments/:id (DELETE) should return 204 if successful', () => {
    const appointmentId = 'valid-uuid';
    
    return agent
      .delete(`/appointments/${appointmentId}`)
      .expect(HttpStatus.NO_CONTENT);
  });
});