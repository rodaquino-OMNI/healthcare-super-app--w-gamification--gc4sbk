import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { NotificationsService } from '../src/notifications/notifications.service';
import { PushService } from '../src/channels/push/push.service';
import { EmailService } from '../src/channels/email/email.service';
import { SmsService } from '../src/channels/sms/sms.service';
import { InAppService } from '../src/channels/in-app/in-app.service';
import { RetryService } from '../src/retry/retry.service';
import { DlqService } from '../src/retry/dlq/dlq.service';
import { SendNotificationDto } from '../src/notifications/dto/send-notification.dto';
import { Repository } from 'typeorm';
import { Notification } from '../src/notifications/entities/notification.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

/**
 * End-to-end tests for the notification service's delivery channel fallback logic.
 * 
 * These tests verify that when a primary delivery channel fails, the system automatically
 * falls back to alternative channels based on configured priorities and user preferences.
 * The tests also validate that delivery metrics are recorded correctly for both successful
 * and failed delivery attempts.
 */
describe('Delivery Fallback Logic (e2e)', () => {
  let app: INestApplication;
  let notificationsService: NotificationsService;
  let pushService: PushService;
  let emailService: EmailService;
  let smsService: SmsService;
  let inAppService: InAppService;
  let retryService: RetryService;
  let dlqService: DlqService;
  let notificationRepository: Repository<Notification>;

  // Test user data
  const testUserId = 'test-user-123';
  const testUserEmail = 'test@example.com';
  const testUserPhone = '+5511999999999';
  const testDeviceToken = 'test-device-token-123';

  // Mock user preferences with all channels enabled
  const mockUserPreferences = {
    userId: testUserId,
    pushEnabled: true,
    emailEnabled: true,
    smsEnabled: true,
    email: testUserEmail,
    phoneNumber: testUserPhone,
    deviceTokens: [testDeviceToken],
    channelPriorities: ['push', 'in-app', 'email', 'sms'],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(async () => {
    // Create a testing module with mocked services
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PushService)
      .useValue({
        send: jest.fn(),
      })
      .overrideProvider(EmailService)
      .useValue({
        sendEmail: jest.fn(),
      })
      .overrideProvider(SmsService)
      .useValue({
        sendSms: jest.fn(),
      })
      .overrideProvider(InAppService)
      .useValue({
        send: jest.fn(),
        checkUserConnection: jest.fn(),
        storeNotificationForLaterDelivery: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get service instances
    notificationsService = moduleFixture.get<NotificationsService>(NotificationsService);
    pushService = moduleFixture.get<PushService>(PushService);
    emailService = moduleFixture.get<EmailService>(EmailService);
    smsService = moduleFixture.get<SmsService>(SmsService);
    inAppService = moduleFixture.get<InAppService>(InAppService);
    retryService = moduleFixture.get<RetryService>(RetryService);
    dlqService = moduleFixture.get<DlqService>(DlqService);
    notificationRepository = moduleFixture.get<Repository<Notification>>(getRepositoryToken(Notification));

    // Spy on the notificationsService methods
    jest.spyOn(notificationsService, 'sendNotification');
    jest.spyOn(notificationsService as any, 'determineNotificationChannels');
    jest.spyOn(notificationsService as any, 'sendThroughChannel');
    jest.spyOn(notificationsService as any, 'createNotificationRecord');

    // Mock the PreferencesService to return our test user preferences
    const preferencesService = moduleFixture.get('PreferencesService');
    jest.spyOn(preferencesService, 'findOne').mockResolvedValue(mockUserPreferences);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Default behavior for mocked services
    (pushService.send as jest.Mock).mockResolvedValue(undefined);
    (emailService.sendEmail as jest.Mock).mockResolvedValue(undefined);
    (smsService.sendSms as jest.Mock).mockResolvedValue(undefined);
    (inAppService.send as jest.Mock).mockResolvedValue(true);
    (inAppService.checkUserConnection as jest.Mock).mockResolvedValue(true);
    (inAppService.storeNotificationForLaterDelivery as jest.Mock).mockResolvedValue(true);

    // Mock the notification repository
    (notificationRepository.create as jest.Mock) = jest.fn().mockImplementation((data) => data);
    (notificationRepository.save as jest.Mock) = jest.fn().mockImplementation((data) => {
      return { id: 1, ...data, createdAt: new Date(), updatedAt: new Date() };
    });
    (notificationRepository.find as jest.Mock) = jest.fn().mockResolvedValue([]);
  });

  describe('Channel Fallback Sequence', () => {
    it('should attempt delivery through push notification first', async () => {
      // Create a notification DTO
      const notificationDto: SendNotificationDto = {
        userId: testUserId,
        type: 'test-notification',
        title: 'Test Notification',
        body: 'This is a test notification',
      };

      // Send the notification
      await request(app.getHttpServer())
        .post('/notifications/send')
        .send(notificationDto)
        .expect(201);

      // Verify that push notification was attempted first
      expect(pushService.send).toHaveBeenCalledTimes(1);
      expect(pushService.send).toHaveBeenCalledWith(
        testDeviceToken,
        expect.objectContaining({
          title: notificationDto.title,
          body: notificationDto.body,
        }),
      );

      // Verify that a notification record was created with the correct channel
      expect(notificationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: testUserId,
          type: notificationDto.type,
          title: notificationDto.title,
          body: notificationDto.body,
          channel: 'push',
          status: 'sent',
        }),
      );
    });

    it('should fall back to in-app notification when push notification fails', async () => {
      // Create a notification DTO
      const notificationDto: SendNotificationDto = {
        userId: testUserId,
        type: 'test-notification',
        title: 'Test Notification',
        body: 'This is a test notification',
      };

      // Make push notification fail
      (pushService.send as jest.Mock).mockRejectedValue(new Error('Push notification failed'));

      // Send the notification
      await request(app.getHttpServer())
        .post('/notifications/send')
        .send(notificationDto)
        .expect(201);

      // Verify that push notification was attempted and failed
      expect(pushService.send).toHaveBeenCalledTimes(1);
      expect(pushService.send).toHaveBeenCalledWith(
        testDeviceToken,
        expect.objectContaining({
          title: notificationDto.title,
          body: notificationDto.body,
        }),
      );

      // Verify that in-app notification was attempted as fallback
      expect(inAppService.send).toHaveBeenCalledTimes(1);
      expect(inAppService.send).toHaveBeenCalledWith(
        testUserId,
        expect.objectContaining({
          title: notificationDto.title,
          body: notificationDto.body,
        }),
      );

      // Verify that notification records were created for both attempts
      expect(notificationRepository.save).toHaveBeenCalledTimes(2);
      expect(notificationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: testUserId,
          type: notificationDto.type,
          channel: 'push',
          status: 'failed',
        }),
      );
      expect(notificationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: testUserId,
          type: notificationDto.type,
          channel: 'in-app',
          status: 'sent',
        }),
      );
    });

    it('should fall back to email when push and in-app notifications fail', async () => {
      // Create a notification DTO
      const notificationDto: SendNotificationDto = {
        userId: testUserId,
        type: 'test-notification',
        title: 'Test Notification',
        body: 'This is a test notification',
      };

      // Make push and in-app notifications fail
      (pushService.send as jest.Mock).mockRejectedValue(new Error('Push notification failed'));
      (inAppService.send as jest.Mock).mockRejectedValue(new Error('In-app notification failed'));

      // Send the notification
      await request(app.getHttpServer())
        .post('/notifications/send')
        .send(notificationDto)
        .expect(201);

      // Verify that push notification was attempted and failed
      expect(pushService.send).toHaveBeenCalledTimes(1);
      // Verify that in-app notification was attempted and failed
      expect(inAppService.send).toHaveBeenCalledTimes(1);
      // Verify that email notification was attempted as fallback
      expect(emailService.sendEmail).toHaveBeenCalledTimes(1);
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        testUserEmail,
        notificationDto.title,
        expect.stringContaining(notificationDto.body),
      );

      // Verify that notification records were created for all attempts
      expect(notificationRepository.save).toHaveBeenCalledTimes(3);
      expect(notificationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: testUserId,
          type: notificationDto.type,
          channel: 'push',
          status: 'failed',
        }),
      );
      expect(notificationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: testUserId,
          type: notificationDto.type,
          channel: 'in-app',
          status: 'failed',
        }),
      );
      expect(notificationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: testUserId,
          type: notificationDto.type,
          channel: 'email',
          status: 'sent',
        }),
      );
    });

    it('should fall back to SMS as last resort when all other channels fail', async () => {
      // Create a notification DTO
      const notificationDto: SendNotificationDto = {
        userId: testUserId,
        type: 'emergency', // Use a critical type that allows SMS
        title: 'Emergency Alert',
        body: 'This is an emergency notification',
      };

      // Make all other channels fail
      (pushService.send as jest.Mock).mockRejectedValue(new Error('Push notification failed'));
      (inAppService.send as jest.Mock).mockRejectedValue(new Error('In-app notification failed'));
      (emailService.sendEmail as jest.Mock).mockRejectedValue(new Error('Email notification failed'));

      // Send the notification
      await request(app.getHttpServer())
        .post('/notifications/send')
        .send(notificationDto)
        .expect(201);

      // Verify that all channels were attempted in the correct order
      expect(pushService.send).toHaveBeenCalledTimes(1);
      expect(inAppService.send).toHaveBeenCalledTimes(1);
      expect(emailService.sendEmail).toHaveBeenCalledTimes(1);
      expect(smsService.sendSms).toHaveBeenCalledTimes(1);
      expect(smsService.sendSms).toHaveBeenCalledWith(
        testUserPhone,
        expect.stringContaining(notificationDto.body),
      );

      // Verify that notification records were created for all attempts
      expect(notificationRepository.save).toHaveBeenCalledTimes(4);
      expect(notificationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: testUserId,
          type: notificationDto.type,
          channel: 'sms',
          status: 'sent',
        }),
      );
    });

    it('should move notification to DLQ when all channels fail', async () => {
      // Spy on the DLQ service
      jest.spyOn(dlqService, 'addEntry').mockResolvedValue({ id: 1 } as any);

      // Create a notification DTO
      const notificationDto: SendNotificationDto = {
        userId: testUserId,
        type: 'emergency',
        title: 'Emergency Alert',
        body: 'This is an emergency notification',
      };

      // Make all channels fail
      (pushService.send as jest.Mock).mockRejectedValue(new Error('Push notification failed'));
      (inAppService.send as jest.Mock).mockRejectedValue(new Error('In-app notification failed'));
      (emailService.sendEmail as jest.Mock).mockRejectedValue(new Error('Email notification failed'));
      (smsService.sendSms as jest.Mock).mockRejectedValue(new Error('SMS notification failed'));

      // Send the notification
      await request(app.getHttpServer())
        .post('/notifications/send')
        .send(notificationDto)
        .expect(201);

      // Verify that all channels were attempted
      expect(pushService.send).toHaveBeenCalledTimes(1);
      expect(inAppService.send).toHaveBeenCalledTimes(1);
      expect(emailService.sendEmail).toHaveBeenCalledTimes(1);
      expect(smsService.sendSms).toHaveBeenCalledTimes(1);

      // Verify that the notification was added to the DLQ
      expect(dlqService.addEntry).toHaveBeenCalledTimes(1);
      expect(dlqService.addEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: testUserId,
          notificationType: notificationDto.type,
          payload: expect.objectContaining({
            title: notificationDto.title,
            body: notificationDto.body,
          }),
          errorDetails: expect.any(Object),
          retryHistory: expect.any(Array),
        }),
      );

      // Verify that notification records were created for all failed attempts
      expect(notificationRepository.save).toHaveBeenCalledTimes(4);
      ['push', 'in-app', 'email', 'sms'].forEach(channel => {
        expect(notificationRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: testUserId,
            type: notificationDto.type,
            channel,
            status: 'failed',
          }),
        );
      });
    });
  });

  describe('Channel Prioritization', () => {
    it('should prioritize channels based on user preferences', async () => {
      // Override user preferences to change channel priorities
      const customPreferences = {
        ...mockUserPreferences,
        channelPriorities: ['email', 'push', 'in-app', 'sms'], // Email is now the primary channel
      };
      const preferencesService = app.get('PreferencesService');
      jest.spyOn(preferencesService, 'findOne').mockResolvedValue(customPreferences);

      // Create a notification DTO
      const notificationDto: SendNotificationDto = {
        userId: testUserId,
        type: 'test-notification',
        title: 'Test Notification',
        body: 'This is a test notification',
      };

      // Send the notification
      await request(app.getHttpServer())
        .post('/notifications/send')
        .send(notificationDto)
        .expect(201);

      // Verify that email was attempted first (based on custom preferences)
      expect(emailService.sendEmail).toHaveBeenCalledTimes(1);
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        testUserEmail,
        notificationDto.title,
        expect.stringContaining(notificationDto.body),
      );

      // Verify that other channels were not attempted since email succeeded
      expect(pushService.send).not.toHaveBeenCalled();
      expect(inAppService.send).not.toHaveBeenCalled();
      expect(smsService.sendSms).not.toHaveBeenCalled();

      // Verify that a notification record was created with the correct channel
      expect(notificationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: testUserId,
          type: notificationDto.type,
          channel: 'email',
          status: 'sent',
        }),
      );
    });

    it('should prioritize SMS for emergency notifications regardless of preferences', async () => {
      // Create an emergency notification DTO
      const notificationDto: SendNotificationDto = {
        userId: testUserId,
        type: 'emergency',
        title: 'Emergency Alert',
        body: 'This is an emergency notification',
      };

      // Send the notification
      await request(app.getHttpServer())
        .post('/notifications/send')
        .send(notificationDto)
        .expect(201);

      // Verify that SMS was attempted first for emergency notifications
      expect(smsService.sendSms).toHaveBeenCalledTimes(1);
      expect(smsService.sendSms).toHaveBeenCalledWith(
        testUserPhone,
        expect.stringContaining(notificationDto.body),
      );

      // Verify that a notification record was created with the correct channel
      expect(notificationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: testUserId,
          type: notificationDto.type,
          channel: 'sms',
          status: 'sent',
        }),
      );

      // Verify that other channels were also attempted as backup
      expect(pushService.send).toHaveBeenCalledTimes(1);
      expect(inAppService.send).toHaveBeenCalledTimes(1);
    });

    it('should respect disabled channels in user preferences', async () => {
      // Override user preferences to disable push notifications
      const customPreferences = {
        ...mockUserPreferences,
        pushEnabled: false,
      };
      const preferencesService = app.get('PreferencesService');
      jest.spyOn(preferencesService, 'findOne').mockResolvedValue(customPreferences);

      // Create a notification DTO
      const notificationDto: SendNotificationDto = {
        userId: testUserId,
        type: 'test-notification',
        title: 'Test Notification',
        body: 'This is a test notification',
      };

      // Send the notification
      await request(app.getHttpServer())
        .post('/notifications/send')
        .send(notificationDto)
        .expect(201);

      // Verify that push notification was not attempted (disabled in preferences)
      expect(pushService.send).not.toHaveBeenCalled();

      // Verify that in-app notification was attempted first instead
      expect(inAppService.send).toHaveBeenCalledTimes(1);

      // Verify that a notification record was created with the correct channel
      expect(notificationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: testUserId,
          type: notificationDto.type,
          channel: 'in-app',
          status: 'sent',
        }),
      );
    });
  });

  describe('Journey-Specific Fallback Strategies', () => {
    it('should use health journey fallback strategy for health notifications', async () => {
      // Create a health notification DTO
      const notificationDto: SendNotificationDto = {
        userId: testUserId,
        type: 'health-goal-achieved',
        title: 'Goal Achieved',
        body: 'Congratulations! You reached your daily step goal.',
      };

      // Make push notification fail
      (pushService.send as jest.Mock).mockRejectedValue(new Error('Push notification failed'));

      // Send the notification
      await request(app.getHttpServer())
        .post('/notifications/send')
        .send(notificationDto)
        .expect(201);

      // Verify that the health journey fallback strategy was used
      // For health notifications, the fallback order should be: push -> in-app -> email
      // SMS should not be used for non-critical health notifications
      expect(pushService.send).toHaveBeenCalledTimes(1);
      expect(inAppService.send).toHaveBeenCalledTimes(1);
      expect(emailService.sendEmail).toHaveBeenCalledTimes(1);
      expect(smsService.sendSms).not.toHaveBeenCalled();

      // Verify that notification records were created for the attempts
      expect(notificationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: testUserId,
          type: notificationDto.type,
          channel: 'push',
          status: 'failed',
        }),
      );
      expect(notificationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: testUserId,
          type: notificationDto.type,
          channel: 'in-app',
          status: 'sent',
        }),
      );
    });

    it('should use care journey fallback strategy for appointment notifications', async () => {
      // Create an appointment notification DTO
      const notificationDto: SendNotificationDto = {
        userId: testUserId,
        type: 'appointment-reminder',
        title: 'Appointment Reminder',
        body: 'Your appointment is scheduled for tomorrow at 2:00 PM.',
      };

      // Make push and in-app notifications fail
      (pushService.send as jest.Mock).mockRejectedValue(new Error('Push notification failed'));
      (inAppService.send as jest.Mock).mockRejectedValue(new Error('In-app notification failed'));

      // Send the notification
      await request(app.getHttpServer())
        .post('/notifications/send')
        .send(notificationDto)
        .expect(201);

      // Verify that the care journey fallback strategy was used
      // For appointment reminders, the fallback order should be: push -> in-app -> SMS -> email
      // SMS is prioritized over email for appointment reminders
      expect(pushService.send).toHaveBeenCalledTimes(1);
      expect(inAppService.send).toHaveBeenCalledTimes(1);
      expect(smsService.sendSms).toHaveBeenCalledTimes(1);
      expect(emailService.sendEmail).toHaveBeenCalledTimes(1);

      // Verify that SMS was attempted before email
      const smsCallOrder = (smsService.sendSms as jest.Mock).mock.invocationCallOrder[0];
      const emailCallOrder = (emailService.sendEmail as jest.Mock).mock.invocationCallOrder[0];
      expect(smsCallOrder).toBeLessThan(emailCallOrder);

      // Verify that notification records were created for the attempts
      expect(notificationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: testUserId,
          type: notificationDto.type,
          channel: 'sms',
          status: 'sent',
        }),
      );
    });

    it('should use plan journey fallback strategy for claim notifications', async () => {
      // Create a claim notification DTO
      const notificationDto: SendNotificationDto = {
        userId: testUserId,
        type: 'claim-status-update',
        title: 'Claim Status Update',
        body: 'Your claim #12345 has been approved.',
      };

      // Make push notification fail
      (pushService.send as jest.Mock).mockRejectedValue(new Error('Push notification failed'));

      // Send the notification
      await request(app.getHttpServer())
        .post('/notifications/send')
        .send(notificationDto)
        .expect(201);

      // Verify that the plan journey fallback strategy was used
      // For claim notifications, the fallback order should be: push -> email -> in-app
      // Email is prioritized over in-app for claim notifications
      expect(pushService.send).toHaveBeenCalledTimes(1);
      expect(emailService.sendEmail).toHaveBeenCalledTimes(1);
      expect(inAppService.send).toHaveBeenCalledTimes(1);

      // Verify that email was attempted before in-app
      const emailCallOrder = (emailService.sendEmail as jest.Mock).mock.invocationCallOrder[0];
      const inAppCallOrder = (inAppService.send as jest.Mock).mock.invocationCallOrder[0];
      expect(emailCallOrder).toBeLessThan(inAppCallOrder);

      // Verify that notification records were created for the attempts
      expect(notificationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: testUserId,
          type: notificationDto.type,
          channel: 'email',
          status: 'sent',
        }),
      );
    });
  });

  describe('Delivery Statistics and Metrics', () => {
    it('should record successful delivery metrics', async () => {
      // Mock the metrics service
      const metricsService = app.get('MetricsService');
      jest.spyOn(metricsService, 'recordDeliverySuccess').mockImplementation(() => {});
      jest.spyOn(metricsService, 'recordDeliveryTime').mockImplementation(() => {});

      // Create a notification DTO
      const notificationDto: SendNotificationDto = {
        userId: testUserId,
        type: 'test-notification',
        title: 'Test Notification',
        body: 'This is a test notification',
      };

      // Send the notification
      await request(app.getHttpServer())
        .post('/notifications/send')
        .send(notificationDto)
        .expect(201);

      // Verify that delivery metrics were recorded
      expect(metricsService.recordDeliverySuccess).toHaveBeenCalledTimes(1);
      expect(metricsService.recordDeliverySuccess).toHaveBeenCalledWith(
        'push',
        notificationDto.type,
        true,
      );
      expect(metricsService.recordDeliveryTime).toHaveBeenCalledTimes(1);
      expect(metricsService.recordDeliveryTime).toHaveBeenCalledWith(
        expect.any(Number),
        'push',
        notificationDto.type,
      );
    });

    it('should record fallback metrics when primary channel fails', async () => {
      // Mock the metrics service
      const metricsService = app.get('MetricsService');
      jest.spyOn(metricsService, 'recordDeliverySuccess').mockImplementation(() => {});
      jest.spyOn(metricsService, 'recordDeliveryTime').mockImplementation(() => {});
      jest.spyOn(metricsService, 'recordFallbackAttempt').mockImplementation(() => {});

      // Create a notification DTO
      const notificationDto: SendNotificationDto = {
        userId: testUserId,
        type: 'test-notification',
        title: 'Test Notification',
        body: 'This is a test notification',
      };

      // Make push notification fail
      (pushService.send as jest.Mock).mockRejectedValue(new Error('Push notification failed'));

      // Send the notification
      await request(app.getHttpServer())
        .post('/notifications/send')
        .send(notificationDto)
        .expect(201);

      // Verify that delivery metrics were recorded for both attempts
      expect(metricsService.recordDeliverySuccess).toHaveBeenCalledTimes(2);
      expect(metricsService.recordDeliverySuccess).toHaveBeenCalledWith(
        'push',
        notificationDto.type,
        false,
      );
      expect(metricsService.recordDeliverySuccess).toHaveBeenCalledWith(
        'in-app',
        notificationDto.type,
        true,
      );

      // Verify that fallback metrics were recorded
      expect(metricsService.recordFallbackAttempt).toHaveBeenCalledTimes(1);
      expect(metricsService.recordFallbackAttempt).toHaveBeenCalledWith(
        'push',
        'in-app',
        notificationDto.type,
        true,
      );

      // Verify that delivery time was recorded for the successful channel
      expect(metricsService.recordDeliveryTime).toHaveBeenCalledTimes(1);
      expect(metricsService.recordDeliveryTime).toHaveBeenCalledWith(
        expect.any(Number),
        'in-app',
        notificationDto.type,
      );
    });

    it('should record overall delivery success rate across all channels', async () => {
      // Mock the metrics service
      const metricsService = app.get('MetricsService');
      jest.spyOn(metricsService, 'recordDeliverySuccess').mockImplementation(() => {});
      jest.spyOn(metricsService, 'recordOverallDeliverySuccess').mockImplementation(() => {});

      // Create a notification DTO
      const notificationDto: SendNotificationDto = {
        userId: testUserId,
        type: 'test-notification',
        title: 'Test Notification',
        body: 'This is a test notification',
      };

      // Make all channels fail
      (pushService.send as jest.Mock).mockRejectedValue(new Error('Push notification failed'));
      (inAppService.send as jest.Mock).mockRejectedValue(new Error('In-app notification failed'));
      (emailService.sendEmail as jest.Mock).mockRejectedValue(new Error('Email notification failed'));
      (smsService.sendSms as jest.Mock).mockRejectedValue(new Error('SMS notification failed'));

      // Send the notification
      await request(app.getHttpServer())
        .post('/notifications/send')
        .send(notificationDto)
        .expect(201);

      // Verify that overall delivery success was recorded as false
      expect(metricsService.recordOverallDeliverySuccess).toHaveBeenCalledTimes(1);
      expect(metricsService.recordOverallDeliverySuccess).toHaveBeenCalledWith(
        notificationDto.type,
        false,
        expect.any(Number), // Number of attempts
      );

      // Verify that individual channel metrics were recorded
      expect(metricsService.recordDeliverySuccess).toHaveBeenCalledTimes(4); // One for each channel
      ['push', 'in-app', 'email', 'sms'].forEach(channel => {
        expect(metricsService.recordDeliverySuccess).toHaveBeenCalledWith(
          channel,
          notificationDto.type,
          false,
        );
      });
    });
  });

  describe('Custom Fallback Sequences', () => {
    it('should support custom fallback sequences defined in notification payload', async () => {
      // Create a notification DTO with custom fallback sequence
      const notificationDto: SendNotificationDto = {
        userId: testUserId,
        type: 'test-notification',
        title: 'Test Notification',
        body: 'This is a test notification',
        data: {
          fallbackSequence: ['email', 'push', 'sms', 'in-app'], // Custom sequence
        },
      };

      // Send the notification
      await request(app.getHttpServer())
        .post('/notifications/send')
        .send(notificationDto)
        .expect(201);

      // Verify that email was attempted first (based on custom sequence)
      expect(emailService.sendEmail).toHaveBeenCalledTimes(1);
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        testUserEmail,
        notificationDto.title,
        expect.stringContaining(notificationDto.body),
      );

      // Verify that other channels were not attempted since email succeeded
      expect(pushService.send).not.toHaveBeenCalled();
      expect(smsService.sendSms).not.toHaveBeenCalled();
      expect(inAppService.send).not.toHaveBeenCalled();

      // Verify that a notification record was created with the correct channel
      expect(notificationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: testUserId,
          type: notificationDto.type,
          channel: 'email',
          status: 'sent',
        }),
      );
    });

    it('should follow custom fallback sequence when primary channel fails', async () => {
      // Create a notification DTO with custom fallback sequence
      const notificationDto: SendNotificationDto = {
        userId: testUserId,
        type: 'test-notification',
        title: 'Test Notification',
        body: 'This is a test notification',
        data: {
          fallbackSequence: ['push', 'sms', 'email', 'in-app'], // Custom sequence
        },
      };

      // Make push notification fail
      (pushService.send as jest.Mock).mockRejectedValue(new Error('Push notification failed'));

      // Send the notification
      await request(app.getHttpServer())
        .post('/notifications/send')
        .send(notificationDto)
        .expect(201);

      // Verify that push notification was attempted and failed
      expect(pushService.send).toHaveBeenCalledTimes(1);

      // Verify that SMS was attempted next (based on custom sequence)
      expect(smsService.sendSms).toHaveBeenCalledTimes(1);
      expect(smsService.sendSms).toHaveBeenCalledWith(
        testUserPhone,
        expect.stringContaining(notificationDto.body),
      );

      // Verify that other channels were not attempted since SMS succeeded
      expect(emailService.sendEmail).not.toHaveBeenCalled();
      expect(inAppService.send).not.toHaveBeenCalled();

      // Verify that notification records were created for both attempts
      expect(notificationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: testUserId,
          type: notificationDto.type,
          channel: 'push',
          status: 'failed',
        }),
      );
      expect(notificationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: testUserId,
          type: notificationDto.type,
          channel: 'sms',
          status: 'sent',
        }),
      );
    });
  });
});