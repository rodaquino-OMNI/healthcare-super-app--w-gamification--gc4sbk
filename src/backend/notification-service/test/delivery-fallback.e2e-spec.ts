import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { SendNotificationDto } from '../src/notifications/dto/send-notification.dto';
import { JwtAuthGuard } from '@nestjs/passport';
import { NotificationsService } from '../src/notifications/notifications.service';
import { PushService } from '../src/channels/push/push.service';
import { EmailService } from '../src/channels/email/email.service';
import { SmsService } from '../src/channels/sms/sms.service';
import { InAppService } from '../src/channels/in-app/in-app.service';
import { PreferencesService } from '../src/preferences/preferences.service';
import { AppModule } from '../src/app.module';
import { Repository } from 'typeorm';
import { Notification } from '../src/notifications/entities/notification.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

/**
 * End-to-end test suite for the notification service's delivery channel fallback logic.
 * Tests the automatic switching between notification channels when primary delivery fails,
 * verifies channel prioritization based on notification type and user preferences,
 * validates the fallback sequence from push to in-app to email to SMS, and confirms
 * successful delivery metrics are recorded correctly.
 */
describe('Notification Delivery Fallback (e2e)', () => {
  let app: INestApplication;
  let notificationsService: NotificationsService;
  let pushService: PushService;
  let emailService: EmailService;
  let smsService: SmsService;
  let inAppService: InAppService;
  let preferencesService: PreferencesService;
  let notificationRepository: Repository<Notification>;

  // Mock implementations for channel services
  const mockPushService = {
    send: jest.fn(),
  };

  const mockEmailService = {
    sendEmail: jest.fn(),
  };

  const mockSmsService = {
    sendSms: jest.fn(),
  };

  const mockInAppService = {
    send: jest.fn(),
  };

  // Mock implementation for preferences service
  const mockPreferencesService = {
    findOne: jest.fn(),
    create: jest.fn(),
  };

  // Test user preferences with all channels enabled
  const testUserPreferences = {
    userId: 'test-user-123',
    pushEnabled: true,
    emailEnabled: true,
    smsEnabled: true,
    emailAddress: 'test@example.com',
    phoneNumber: '+5511999999999',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideProvider(PushService)
      .useValue(mockPushService)
      .overrideProvider(EmailService)
      .useValue(mockEmailService)
      .overrideProvider(SmsService)
      .useValue(mockSmsService)
      .overrideProvider(InAppService)
      .useValue(mockInAppService)
      .overrideProvider(PreferencesService)
      .useValue(mockPreferencesService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get service instances
    notificationsService = moduleFixture.get<NotificationsService>(NotificationsService);
    pushService = moduleFixture.get<PushService>(PushService);
    emailService = moduleFixture.get<EmailService>(EmailService);
    smsService = moduleFixture.get<SmsService>(SmsService);
    inAppService = moduleFixture.get<InAppService>(InAppService);
    preferencesService = moduleFixture.get<PreferencesService>(PreferencesService);
    notificationRepository = moduleFixture.get<Repository<Notification>>(getRepositoryToken(Notification));
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Set up default behavior for preferences service
    mockPreferencesService.findOne.mockResolvedValue(testUserPreferences);
    mockPreferencesService.create.mockResolvedValue(testUserPreferences);

    // Set up default behavior for channel services
    mockPushService.send.mockResolvedValue(undefined);
    mockEmailService.sendEmail.mockResolvedValue(undefined);
    mockSmsService.sendSms.mockResolvedValue(undefined);
    mockInAppService.send.mockResolvedValue(true);
  });

  /**
   * Test suite for basic fallback functionality when primary channel fails
   */
  describe('Basic Channel Fallback', () => {
    it('should fallback to in-app when push notification fails', async () => {
      // Arrange
      const dto: SendNotificationDto = {
        userId: 'test-user-123',
        title: 'Test Notification',
        body: 'This is a test notification',
        type: 'info',
        journey: 'health',
        data: { testKey: 'testValue' },
        channels: ['push', 'in-app']
      };

      // Simulate push notification failure
      mockPushService.send.mockRejectedValueOnce(new Error('Push notification failed'));

      // Act
      await request(app.getHttpServer())
        .post('/notifications/send')
        .send(dto)
        .expect(HttpStatus.OK);

      // Assert
      expect(mockPushService.send).toHaveBeenCalled();
      expect(mockInAppService.send).toHaveBeenCalled();
      
      // Verify notification records were created with correct status
      // This would require spying on the repository's save method
      // or checking the actual database in a real implementation
    });

    it('should fallback to email when push and in-app notifications fail', async () => {
      // Arrange
      const dto: SendNotificationDto = {
        userId: 'test-user-123',
        title: 'Test Notification',
        body: 'This is a test notification',
        type: 'info',
        journey: 'health',
        data: { testKey: 'testValue' },
        channels: ['push', 'in-app', 'email']
      };

      // Simulate push and in-app notification failures
      mockPushService.send.mockRejectedValueOnce(new Error('Push notification failed'));
      mockInAppService.send.mockRejectedValueOnce(new Error('In-app notification failed'));

      // Act
      await request(app.getHttpServer())
        .post('/notifications/send')
        .send(dto)
        .expect(HttpStatus.OK);

      // Assert
      expect(mockPushService.send).toHaveBeenCalled();
      expect(mockInAppService.send).toHaveBeenCalled();
      expect(mockEmailService.sendEmail).toHaveBeenCalled();
    });

    it('should fallback to SMS as last resort when all other channels fail', async () => {
      // Arrange
      const dto: SendNotificationDto = {
        userId: 'test-user-123',
        title: 'Test Notification',
        body: 'This is a test notification',
        type: 'emergency', // Critical notification type that allows SMS
        journey: 'care',
        data: { testKey: 'testValue' },
        channels: ['push', 'in-app', 'email', 'sms']
      };

      // Simulate all other notification channels failing
      mockPushService.send.mockRejectedValueOnce(new Error('Push notification failed'));
      mockInAppService.send.mockRejectedValueOnce(new Error('In-app notification failed'));
      mockEmailService.sendEmail.mockRejectedValueOnce(new Error('Email notification failed'));

      // Act
      await request(app.getHttpServer())
        .post('/notifications/send')
        .send(dto)
        .expect(HttpStatus.OK);

      // Assert
      expect(mockPushService.send).toHaveBeenCalled();
      expect(mockInAppService.send).toHaveBeenCalled();
      expect(mockEmailService.sendEmail).toHaveBeenCalled();
      expect(mockSmsService.sendSms).toHaveBeenCalled();
    });

    it('should return 500 when all notification channels fail', async () => {
      // Arrange
      const dto: SendNotificationDto = {
        userId: 'test-user-123',
        title: 'Test Notification',
        body: 'This is a test notification',
        type: 'emergency',
        journey: 'care',
        data: { testKey: 'testValue' },
        channels: ['push', 'in-app', 'email', 'sms']
      };

      // Simulate all notification channels failing
      mockPushService.send.mockRejectedValueOnce(new Error('Push notification failed'));
      mockInAppService.send.mockRejectedValueOnce(new Error('In-app notification failed'));
      mockEmailService.sendEmail.mockRejectedValueOnce(new Error('Email notification failed'));
      mockSmsService.sendSms.mockRejectedValueOnce(new Error('SMS notification failed'));

      // Act & Assert
      await request(app.getHttpServer())
        .post('/notifications/send')
        .send(dto)
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  /**
   * Test suite for preference-based channel prioritization
   */
  describe('Preference-Based Channel Prioritization', () => {
    it('should respect user preference for primary channel', async () => {
      // Arrange
      const userPrefsEmailFirst = {
        ...testUserPreferences,
        channelPriority: ['email', 'push', 'in-app', 'sms'],
      };
      mockPreferencesService.findOne.mockResolvedValueOnce(userPrefsEmailFirst);

      const dto: SendNotificationDto = {
        userId: 'test-user-123',
        title: 'Test Notification',
        body: 'This is a test notification',
        type: 'info',
        journey: 'health',
        data: { testKey: 'testValue' },
        channels: ['push', 'in-app', 'email']
      };

      // Act
      await request(app.getHttpServer())
        .post('/notifications/send')
        .send(dto)
        .expect(HttpStatus.OK);

      // Assert - email should be tried first based on user preference
      expect(mockEmailService.sendEmail).toHaveBeenCalled();
      // Other channels should not be tried if primary succeeds
      expect(mockPushService.send).not.toHaveBeenCalled();
      expect(mockInAppService.send).not.toHaveBeenCalled();
    });

    it('should fallback according to user preference order', async () => {
      // Arrange
      const userPrefsSmsLast = {
        ...testUserPreferences,
        channelPriority: ['push', 'email', 'in-app', 'sms'],
      };
      mockPreferencesService.findOne.mockResolvedValueOnce(userPrefsSmsLast);

      const dto: SendNotificationDto = {
        userId: 'test-user-123',
        title: 'Test Notification',
        body: 'This is a test notification',
        type: 'emergency',
        journey: 'care',
        data: { testKey: 'testValue' },
        channels: ['push', 'email', 'in-app', 'sms']
      };

      // Simulate push and email failures
      mockPushService.send.mockRejectedValueOnce(new Error('Push notification failed'));
      mockEmailService.sendEmail.mockRejectedValueOnce(new Error('Email notification failed'));

      // Act
      await request(app.getHttpServer())
        .post('/notifications/send')
        .send(dto)
        .expect(HttpStatus.OK);

      // Assert - channels should be tried in user preference order
      expect(mockPushService.send).toHaveBeenCalled();
      expect(mockEmailService.sendEmail).toHaveBeenCalled();
      expect(mockInAppService.send).toHaveBeenCalled();
      expect(mockSmsService.sendSms).not.toHaveBeenCalled(); // SMS should not be tried if in-app succeeds
    });

    it('should use default priority when user has no preference', async () => {
      // Arrange
      mockPreferencesService.findOne.mockResolvedValueOnce(null);

      const dto: SendNotificationDto = {
        userId: 'test-user-123',
        title: 'Test Notification',
        body: 'This is a test notification',
        type: 'info',
        journey: 'health',
        data: { testKey: 'testValue' },
        channels: ['push', 'in-app', 'email']
      };

      // Simulate push failure
      mockPushService.send.mockRejectedValueOnce(new Error('Push notification failed'));

      // Act
      await request(app.getHttpServer())
        .post('/notifications/send')
        .send(dto)
        .expect(HttpStatus.OK);

      // Assert - default priority should be used (push -> in-app -> email -> sms)
      expect(mockPushService.send).toHaveBeenCalled();
      expect(mockInAppService.send).toHaveBeenCalled();
      expect(mockEmailService.sendEmail).not.toHaveBeenCalled(); // Email should not be tried if in-app succeeds
    });
  });

  /**
   * Test suite for journey-specific fallback strategies
   */
  describe('Journey-Specific Fallback Strategies', () => {
    it('should use health journey fallback strategy', async () => {
      // Arrange
      const dto: SendNotificationDto = {
        userId: 'test-user-123',
        title: 'Health Goal Achieved',
        body: 'Congratulations! You reached your daily step goal.',
        type: 'achievement',
        journey: 'health',
        data: { goalId: 'daily-steps', progress: 10000 },
        channels: ['push', 'in-app']
      };

      // Simulate push failure
      mockPushService.send.mockRejectedValueOnce(new Error('Push notification failed'));

      // Act
      await request(app.getHttpServer())
        .post('/notifications/send')
        .send(dto)
        .expect(HttpStatus.OK);

      // Assert - health journey should prioritize in-app after push
      expect(mockPushService.send).toHaveBeenCalled();
      expect(mockInAppService.send).toHaveBeenCalled();
    });

    it('should use care journey fallback strategy', async () => {
      // Arrange
      const dto: SendNotificationDto = {
        userId: 'test-user-123',
        title: 'Appointment Reminder',
        body: 'Your appointment with Dr. Santos is tomorrow at 10:00 AM',
        type: 'appointment-reminder',
        journey: 'care',
        data: { appointmentId: '456', provider: 'Dr. Santos', time: '10:00 AM' },
        channels: ['push', 'email', 'sms']
      };

      // Simulate push failure
      mockPushService.send.mockRejectedValueOnce(new Error('Push notification failed'));

      // Act
      await request(app.getHttpServer())
        .post('/notifications/send')
        .send(dto)
        .expect(HttpStatus.OK);

      // Assert - care journey should prioritize SMS for appointment reminders
      expect(mockPushService.send).toHaveBeenCalled();
      expect(mockSmsService.sendSms).toHaveBeenCalled();
      expect(mockEmailService.sendEmail).not.toHaveBeenCalled(); // Email should be tried after SMS for care journey
    });

    it('should use plan journey fallback strategy', async () => {
      // Arrange
      const dto: SendNotificationDto = {
        userId: 'test-user-123',
        title: 'Claim Approved',
        body: 'Your recent claim has been approved.',
        type: 'claim-status',
        journey: 'plan',
        data: { claimId: '789', status: 'approved', amount: 150.00 },
        channels: ['push', 'email', 'in-app']
      };

      // Simulate push failure
      mockPushService.send.mockRejectedValueOnce(new Error('Push notification failed'));

      // Act
      await request(app.getHttpServer())
        .post('/notifications/send')
        .send(dto)
        .expect(HttpStatus.OK);

      // Assert - plan journey should prioritize email for claim notifications
      expect(mockPushService.send).toHaveBeenCalled();
      expect(mockEmailService.sendEmail).toHaveBeenCalled();
      expect(mockInAppService.send).not.toHaveBeenCalled(); // In-app should be tried after email for plan journey
    });

    it('should use gamification journey fallback strategy', async () => {
      // Arrange
      const dto: SendNotificationDto = {
        userId: 'test-user-123',
        title: 'Achievement Unlocked!',
        body: 'You unlocked the Daily Steps achievement!',
        type: 'achievement',
        journey: 'game',
        data: { achievementId: 'daily-steps', xp: 50 },
        channels: ['push', 'in-app', 'email']
      };

      // Simulate push failure
      mockPushService.send.mockRejectedValueOnce(new Error('Push notification failed'));

      // Act
      await request(app.getHttpServer())
        .post('/notifications/send')
        .send(dto)
        .expect(HttpStatus.OK);

      // Assert - gamification journey should prioritize in-app for achievements
      expect(mockPushService.send).toHaveBeenCalled();
      expect(mockInAppService.send).toHaveBeenCalled();
      expect(mockEmailService.sendEmail).not.toHaveBeenCalled(); // Email should not be tried if in-app succeeds
    });
  });

  /**
   * Test suite for custom fallback sequences
   */
  describe('Custom Fallback Sequences', () => {
    it('should use custom fallback sequence for emergency notifications', async () => {
      // Arrange
      const dto: SendNotificationDto = {
        userId: 'test-user-123',
        title: 'Emergency Alert',
        body: 'Critical health reading detected. Please seek medical attention.',
        type: 'emergency',
        journey: 'health',
        data: { readingType: 'blood-pressure', value: '180/110' },
        channels: ['push', 'sms', 'email', 'in-app'],
        priority: 'high'
      };

      // Simulate push failure
      mockPushService.send.mockRejectedValueOnce(new Error('Push notification failed'));

      // Act
      await request(app.getHttpServer())
        .post('/notifications/send')
        .send(dto)
        .expect(HttpStatus.OK);

      // Assert - emergency notifications should try SMS immediately after push
      expect(mockPushService.send).toHaveBeenCalled();
      expect(mockSmsService.sendSms).toHaveBeenCalled();
      expect(mockEmailService.sendEmail).not.toHaveBeenCalled(); // Email should be tried after SMS for emergencies
      expect(mockInAppService.send).not.toHaveBeenCalled(); // In-app should be tried last for emergencies
    });

    it('should use custom fallback sequence for medication reminders', async () => {
      // Arrange
      const dto: SendNotificationDto = {
        userId: 'test-user-123',
        title: 'Medication Reminder',
        body: 'Time to take your medication.',
        type: 'medication-reminder',
        journey: 'care',
        data: { medicationId: '123', name: 'Aspirin', dosage: '100mg' },
        channels: ['push', 'sms', 'in-app', 'email']
      };

      // Simulate push and SMS failures
      mockPushService.send.mockRejectedValueOnce(new Error('Push notification failed'));
      mockSmsService.sendSms.mockRejectedValueOnce(new Error('SMS notification failed'));

      // Act
      await request(app.getHttpServer())
        .post('/notifications/send')
        .send(dto)
        .expect(HttpStatus.OK);

      // Assert - medication reminders should try SMS after push, then in-app
      expect(mockPushService.send).toHaveBeenCalled();
      expect(mockSmsService.sendSms).toHaveBeenCalled();
      expect(mockInAppService.send).toHaveBeenCalled();
      expect(mockEmailService.sendEmail).not.toHaveBeenCalled(); // Email should be tried last for medication reminders
    });
  });

  /**
   * Test suite for delivery statistics and metrics
   */
  describe('Delivery Statistics and Metrics', () => {
    it('should record successful delivery after fallback', async () => {
      // Arrange
      const dto: SendNotificationDto = {
        userId: 'test-user-123',
        title: 'Test Notification',
        body: 'This is a test notification',
        type: 'info',
        journey: 'health',
        data: { testKey: 'testValue' },
        channels: ['push', 'in-app', 'email']
      };

      // Mock repository save method to capture notification records
      const mockSave = jest.fn().mockImplementation(notification => ({
        ...notification,
        id: Math.floor(Math.random() * 1000),
      }));
      jest.spyOn(notificationRepository, 'create').mockImplementation(entity => entity as any);
      jest.spyOn(notificationRepository, 'save').mockImplementation(mockSave);

      // Simulate push notification failure
      mockPushService.send.mockRejectedValueOnce(new Error('Push notification failed'));

      // Act
      await request(app.getHttpServer())
        .post('/notifications/send')
        .send(dto)
        .expect(HttpStatus.OK);

      // Assert
      expect(mockPushService.send).toHaveBeenCalled();
      expect(mockInAppService.send).toHaveBeenCalled();
      
      // Verify notification records were created with correct status
      expect(mockSave).toHaveBeenCalledTimes(2); // One failed, one successful
      
      // First call should be for the failed push notification
      expect(mockSave.mock.calls[0][0]).toMatchObject({
        userId: 'test-user-123',
        type: 'info',
        title: 'Test Notification',
        body: 'This is a test notification',
        channel: 'push',
        status: 'failed',
      });
      
      // Second call should be for the successful in-app notification
      expect(mockSave.mock.calls[1][0]).toMatchObject({
        userId: 'test-user-123',
        type: 'info',
        title: 'Test Notification',
        body: 'This is a test notification',
        channel: 'in-app',
        status: 'sent',
      });
    });

    it('should record delivery time metrics for successful fallbacks', async () => {
      // Arrange
      const dto: SendNotificationDto = {
        userId: 'test-user-123',
        title: 'Test Notification',
        body: 'This is a test notification',
        type: 'info',
        journey: 'health',
        data: { testKey: 'testValue' },
        channels: ['push', 'in-app', 'email']
      };

      // Mock repository save method to capture notification records with timestamps
      const startTime = new Date();
      const mockSave = jest.fn().mockImplementation(notification => ({
        ...notification,
        id: Math.floor(Math.random() * 1000),
        createdAt: startTime,
        updatedAt: new Date(startTime.getTime() + 500), // 500ms later
      }));
      jest.spyOn(notificationRepository, 'create').mockImplementation(entity => entity as any);
      jest.spyOn(notificationRepository, 'save').mockImplementation(mockSave);

      // Simulate push notification failure
      mockPushService.send.mockRejectedValueOnce(new Error('Push notification failed'));

      // Act
      await request(app.getHttpServer())
        .post('/notifications/send')
        .send(dto)
        .expect(HttpStatus.OK);

      // Assert
      expect(mockPushService.send).toHaveBeenCalled();
      expect(mockInAppService.send).toHaveBeenCalled();
      
      // Verify notification records were created with timestamps
      expect(mockSave).toHaveBeenCalledTimes(2); // One failed, one successful
      
      // Verify the timestamps indicate delivery within SLA (<30s)
      const firstRecord = mockSave.mock.calls[0][0];
      const secondRecord = mockSave.mock.calls[1][0];
      
      expect(firstRecord).toHaveProperty('createdAt');
      expect(secondRecord).toHaveProperty('createdAt');
      expect(secondRecord).toHaveProperty('updatedAt');
      
      // Calculate delivery time (this would be more sophisticated in the actual implementation)
      const deliveryTime = secondRecord.updatedAt.getTime() - firstRecord.createdAt.getTime();
      expect(deliveryTime).toBeLessThan(30000); // Less than 30 seconds (SLA requirement)
    });

    it('should record fallback attempts count for metrics', async () => {
      // Arrange
      const dto: SendNotificationDto = {
        userId: 'test-user-123',
        title: 'Test Notification',
        body: 'This is a test notification',
        type: 'info',
        journey: 'health',
        data: { testKey: 'testValue' },
        channels: ['push', 'in-app', 'email', 'sms']
      };

      // Mock repository save method
      const mockSave = jest.fn().mockImplementation(notification => ({
        ...notification,
        id: Math.floor(Math.random() * 1000),
      }));
      jest.spyOn(notificationRepository, 'create').mockImplementation(entity => entity as any);
      jest.spyOn(notificationRepository, 'save').mockImplementation(mockSave);

      // Simulate multiple channel failures
      mockPushService.send.mockRejectedValueOnce(new Error('Push notification failed'));
      mockInAppService.send.mockRejectedValueOnce(new Error('In-app notification failed'));
      mockEmailService.sendEmail.mockRejectedValueOnce(new Error('Email notification failed'));

      // Act
      await request(app.getHttpServer())
        .post('/notifications/send')
        .send(dto)
        .expect(HttpStatus.OK);

      // Assert
      expect(mockPushService.send).toHaveBeenCalled();
      expect(mockInAppService.send).toHaveBeenCalled();
      expect(mockEmailService.sendEmail).toHaveBeenCalled();
      expect(mockSmsService.sendSms).toHaveBeenCalled();
      
      // Verify notification records were created for each attempt
      expect(mockSave).toHaveBeenCalledTimes(4); // Three failed, one successful
      
      // Verify the fallback count metadata is recorded
      // This would be implementation-specific, but could be stored in the notification record
      // or in a separate metrics repository
      const successfulRecord = mockSave.mock.calls[3][0];
      expect(successfulRecord).toMatchObject({
        userId: 'test-user-123',
        type: 'info',
        channel: 'sms',
        status: 'sent',
      });
      
      // In a real implementation, there might be a fallbackAttempts field or similar
      // expect(successfulRecord.metadata).toHaveProperty('fallbackAttempts', 3);
    });
  });

  /**
   * Test suite for simulating different channel failures
   */
  describe('Channel Failure Simulation', () => {
    it('should handle intermittent push notification service failures', async () => {
      // Arrange
      const dto: SendNotificationDto = {
        userId: 'test-user-123',
        title: 'Test Notification',
        body: 'This is a test notification',
        type: 'info',
        journey: 'health',
        data: { testKey: 'testValue' },
        channels: ['push', 'in-app']
      };

      // Simulate intermittent push service failure
      mockPushService.send.mockRejectedValueOnce(new Error('FCM service unavailable'));

      // Act
      await request(app.getHttpServer())
        .post('/notifications/send')
        .send(dto)
        .expect(HttpStatus.OK);

      // Assert
      expect(mockPushService.send).toHaveBeenCalled();
      expect(mockInAppService.send).toHaveBeenCalled();
    });

    it('should handle network timeout failures', async () => {
      // Arrange
      const dto: SendNotificationDto = {
        userId: 'test-user-123',
        title: 'Test Notification',
        body: 'This is a test notification',
        type: 'info',
        journey: 'health',
        data: { testKey: 'testValue' },
        channels: ['push', 'in-app', 'email']
      };

      // Simulate network timeout for push and in-app
      const timeoutError = new Error('Request timed out');
      timeoutError.name = 'TimeoutError';
      mockPushService.send.mockRejectedValueOnce(timeoutError);
      mockInAppService.send.mockRejectedValueOnce(timeoutError);

      // Act
      await request(app.getHttpServer())
        .post('/notifications/send')
        .send(dto)
        .expect(HttpStatus.OK);

      // Assert
      expect(mockPushService.send).toHaveBeenCalled();
      expect(mockInAppService.send).toHaveBeenCalled();
      expect(mockEmailService.sendEmail).toHaveBeenCalled();
    });

    it('should handle invalid recipient errors', async () => {
      // Arrange
      const dto: SendNotificationDto = {
        userId: 'test-user-123',
        title: 'Test Notification',
        body: 'This is a test notification',
        type: 'info',
        journey: 'health',
        data: { testKey: 'testValue' },
        channels: ['push', 'email', 'in-app']
      };

      // Simulate invalid push token and email address
      const invalidTokenError = new Error('Invalid registration token');
      invalidTokenError.name = 'MessagingRegistrationTokenNotRegistered';
      mockPushService.send.mockRejectedValueOnce(invalidTokenError);
      
      const invalidEmailError = new Error('Invalid recipient');
      invalidEmailError.name = 'RecipientError';
      mockEmailService.sendEmail.mockRejectedValueOnce(invalidEmailError);

      // Act
      await request(app.getHttpServer())
        .post('/notifications/send')
        .send(dto)
        .expect(HttpStatus.OK);

      // Assert
      expect(mockPushService.send).toHaveBeenCalled();
      expect(mockEmailService.sendEmail).toHaveBeenCalled();
      expect(mockInAppService.send).toHaveBeenCalled();
    });

    it('should handle rate limiting errors', async () => {
      // Arrange
      const dto: SendNotificationDto = {
        userId: 'test-user-123',
        title: 'Test Notification',
        body: 'This is a test notification',
        type: 'info',
        journey: 'health',
        data: { testKey: 'testValue' },
        channels: ['push', 'sms', 'email', 'in-app']
      };

      // Simulate rate limiting for push and SMS
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.name = 'RateLimitError';
      mockPushService.send.mockRejectedValueOnce(rateLimitError);
      mockSmsService.sendSms.mockRejectedValueOnce(rateLimitError);

      // Act
      await request(app.getHttpServer())
        .post('/notifications/send')
        .send(dto)
        .expect(HttpStatus.OK);

      // Assert
      expect(mockPushService.send).toHaveBeenCalled();
      expect(mockSmsService.sendSms).toHaveBeenCalled();
      expect(mockEmailService.sendEmail).toHaveBeenCalled(); // Should try email after SMS fails
    });
  });
});