import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SmsService } from '../../src/channels/sms/sms.service';
import { RetryService } from '../../src/retry/retry.service';
import { DlqService } from '../../src/retry/dlq/dlq.service';
import { LoggerService } from '@austa/logging';
import { TracingService } from '@austa/tracing';
import { NotificationChannel } from '@austa/interfaces/notification/types';
import { FailureClassification, ChannelStatus } from '../../src/interfaces/notification-channel.interface';
import { NotificationEntity } from '../../src/notifications/entities/notification.entity';

// Mock Twilio
jest.mock('twilio', () => {
  return {
    Twilio: jest.fn().mockImplementation(() => ({
      messages: {
        create: jest.fn().mockResolvedValue({
          sid: 'mock-message-sid',
          status: 'sent',
          price: '0.10',
          priceUnit: 'USD'
        })
      },
      api: {
        v2010: {
          accounts: {
            list: jest.fn().mockResolvedValue([{ sid: 'mock-account-sid' }])
          }
        }
      }
    }))
  };
});

describe('SmsService', () => {
  let service: SmsService;
  let configService: ConfigService;
  let retryService: RetryService;
  let dlqService: DlqService;
  let loggerService: LoggerService;
  let tracingService: TracingService;
  
  const mockConfigService = {
    get: jest.fn((key, defaultValue) => {
      const config = {
        'notification.sms.accountSid': 'mock-account-sid',
        'notification.sms.authToken': 'mock-auth-token',
        'notification.sms.defaultFrom': '+15551234567',
        'notification.sms.enabled': true,
        'notification.sms.maxRetryAttempts': 3,
        'notification.sms.initialRetryDelay': 1000,
        'notification.sms.maxRetryDelay': 60000,
        'notification.sms.backoffFactor': 2,
        'notification.sms.retryJitter': true,
        'notification.sms.fallbackChannel': NotificationChannel.EMAIL
      };
      return config[key] || defaultValue;
    })
  };
  
  const mockRetryService = {
    scheduleRetry: jest.fn().mockResolvedValue(undefined),
    getRetryStatus: jest.fn().mockResolvedValue('PENDING'),
    getRetryHistory: jest.fn().mockResolvedValue([
      { timestamp: new Date(), attempt: 1, status: 'FAILED' }
    ])
  };
  
  const mockDlqService = {
    addEntry: jest.fn().mockResolvedValue(undefined)
  };
  
  const mockLoggerService = {
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  };
  
  const mockTracingService = {
    createSpan: jest.fn().mockReturnValue({
      end: jest.fn()
    })
  };
  
  const mockNotification = {
    id: 'mock-notification-id',
    userId: 'mock-user-id',
    type: 'care.appointment.reminder',
    title: 'Appointment Reminder',
    content: 'Your appointment is tomorrow at 2:00 PM',
    data: {
      journey: 'care',
      type: 'care.appointment.reminder',
      action: {
        type: 'navigate',
        target: '/appointments/123'
      }
    }
  } as NotificationEntity;
  
  beforeEach(async () => {
    jest.clearAllMocks();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmsService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: RetryService, useValue: mockRetryService },
        { provide: DlqService, useValue: mockDlqService },
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: TracingService, useValue: mockTracingService }
      ],
    }).compile();

    service = module.get<SmsService>(SmsService);
    configService = module.get<ConfigService>(ConfigService);
    retryService = module.get<RetryService>(RetryService);
    dlqService = module.get<DlqService>(DlqService);
    loggerService = module.get<LoggerService>(LoggerService);
    tracingService = module.get<TracingService>(TracingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  
  it('should have the correct channel type', () => {
    expect(service.channelType).toBe(NotificationChannel.SMS);
  });
  
  it('should have the correct capabilities', () => {
    expect(service.capabilities).toBeDefined();
    expect(service.capabilities.supportsRichContent).toBe(false);
    expect(service.capabilities.supportsAttachments).toBe(false);
    expect(service.capabilities.maxMessageLength).toBe(1600);
    expect(service.capabilities.supportedTypes).toContain('care.appointment.reminder');
  });
  
  describe('sendSms', () => {
    it('should successfully send an SMS', async () => {
      const result = await service.sendSms('+15551234567', 'Test message');
      
      expect(result.success).toBe(true);
      expect(result.providerMessageId).toBe('mock-message-sid');
      expect(loggerService.info).toHaveBeenCalled();
    });
    
    it('should handle invalid phone numbers', async () => {
      const result = await service.sendSms('invalid-number', 'Test message');
      
      expect(result.success).toBe(false);
      expect(result.error.classification).toBe(FailureClassification.INVALID_REQUEST);
      expect(loggerService.error).toHaveBeenCalled();
    });
    
    it('should handle Twilio errors', async () => {
      // Mock Twilio error
      const twilioClient = require('twilio').Twilio.mock.results[0].value;
      twilioClient.messages.create.mockRejectedValueOnce({
        code: 21211,
        message: 'Invalid phone number'
      });
      
      const result = await service.sendSms('+15551234567', 'Test message');
      
      expect(result.success).toBe(false);
      expect(result.error.code).toBe(21211);
      expect(result.error.classification).toBe(FailureClassification.INVALID_REQUEST);
      expect(loggerService.error).toHaveBeenCalled();
    });
  });
  
  describe('send', () => {
    it('should successfully send a notification', async () => {
      const result = await service.send('+15551234567', mockNotification);
      
      expect(result.success).toBe(true);
      expect(result.providerMessageId).toBe('mock-message-sid');
    });
    
    it('should schedule a retry for transient errors', async () => {
      // Mock Twilio error
      const twilioClient = require('twilio').Twilio.mock.results[0].value;
      twilioClient.messages.create.mockRejectedValueOnce({
        code: 'ETIMEDOUT',
        message: 'Connection timed out'
      });
      
      const result = await service.send('+15551234567', mockNotification);
      
      expect(result.success).toBe(false);
      expect(result.error.classification).toBe(FailureClassification.TRANSIENT);
      expect(retryService.scheduleRetry).toHaveBeenCalled();
    });
    
    it('should send to DLQ for permanent errors', async () => {
      // Mock Twilio error
      const twilioClient = require('twilio').Twilio.mock.results[0].value;
      twilioClient.messages.create.mockRejectedValueOnce({
        code: 21211,
        message: 'Invalid phone number'
      });
      
      const result = await service.send('+15551234567', mockNotification);
      
      expect(result.success).toBe(false);
      expect(result.error.classification).toBe(FailureClassification.INVALID_REQUEST);
      expect(dlqService.addEntry).toHaveBeenCalled();
    });
  });
  
  describe('classifyError', () => {
    it('should classify authentication errors', () => {
      const error = { code: 20003, message: 'Authentication error' };
      expect(service.classifyError(error)).toBe(FailureClassification.AUTH_ERROR);
    });
    
    it('should classify rate limiting errors', () => {
      const error = { code: 20429, message: 'Too many requests' };
      expect(service.classifyError(error)).toBe(FailureClassification.RATE_LIMITED);
    });
    
    it('should classify invalid request errors', () => {
      const error = { code: 21211, message: 'Invalid phone number' };
      expect(service.classifyError(error)).toBe(FailureClassification.INVALID_REQUEST);
    });
    
    it('should classify service unavailable errors', () => {
      const error = { code: 50001, message: 'Service unavailable' };
      expect(service.classifyError(error)).toBe(FailureClassification.SERVICE_UNAVAILABLE);
    });
    
    it('should classify transient errors', () => {
      const error = { code: 'ETIMEDOUT', message: 'Connection timed out' };
      expect(service.classifyError(error)).toBe(FailureClassification.TRANSIENT);
    });
    
    it('should classify unknown errors', () => {
      const error = { code: 99999, message: 'Unknown error' };
      expect(service.classifyError(error)).toBe(FailureClassification.UNKNOWN);
    });
  });
  
  describe('getStatus', () => {
    it('should return ONLINE when Twilio is accessible', async () => {
      const status = await service.getStatus();
      expect(status).toBe(ChannelStatus.ONLINE);
    });
    
    it('should return DEGRADED when rate limited', async () => {
      // Mock Twilio error
      const twilioClient = require('twilio').Twilio.mock.results[0].value;
      twilioClient.api.v2010.accounts.list.mockRejectedValueOnce({
        status: 429,
        message: 'Too many requests'
      });
      
      const status = await service.getStatus();
      expect(status).toBe(ChannelStatus.DEGRADED);
    });
    
    it('should return OFFLINE when Twilio is inaccessible', async () => {
      // Mock Twilio error
      const twilioClient = require('twilio').Twilio.mock.results[0].value;
      twilioClient.api.v2010.accounts.list.mockRejectedValueOnce({
        status: 500,
        message: 'Internal server error'
      });
      
      const status = await service.getStatus();
      expect(status).toBe(ChannelStatus.OFFLINE);
    });
  });
  
  describe('validateRecipient', () => {
    it('should validate correct phone numbers', () => {
      expect(service.validateRecipient('+15551234567')).toBe(true);
      expect(service.validateRecipient('15551234567')).toBe(true);
    });
    
    it('should reject invalid phone numbers', () => {
      expect(service.validateRecipient('invalid')).toBe(false);
      expect(service.validateRecipient('123')).toBe(false);
      expect(service.validateRecipient('')).toBe(false);
    });
  });
  
  describe('canHandle', () => {
    it('should return true for supported notification types', () => {
      expect(service.canHandle('care.appointment.reminder')).toBe(true);
      expect(service.canHandle('health.goal.achieved')).toBe(true);
    });
    
    it('should return false for unsupported notification types', () => {
      expect(service.canHandle('unsupported.type')).toBe(false);
    });
  });
});