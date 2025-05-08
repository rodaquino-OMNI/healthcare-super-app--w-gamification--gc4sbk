import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { JwtAuthGuard } from '@nestjs/passport';
import { AppModule } from '../src/app.module';
import { DlqService } from '../src/retry/dlq/dlq.service';
import { QueryDlqEntriesDto, DlqEntryResponseDto, ProcessDlqEntryDto, DlqStatisticsResponseDto } from '../src/retry/dlq/dto';
import { v4 as uuidv4 } from 'uuid';

describe('DLQ Controller (e2e)', () => {
  let app: INestApplication;
  let mockDlqService: Partial<DlqService>;
  
  // Mock DLQ entries for testing
  const mockDlqEntries: DlqEntryResponseDto[] = [
    {
      id: uuidv4(),
      notificationId: uuidv4(),
      userId: '123e4567-e89b-12d3-a456-426614174000',
      channel: 'email',
      payload: {
        to: 'user@example.com',
        subject: 'Test Email',
        body: 'This is a test email that failed to send'
      },
      errorDetails: {
        type: 'external',
        message: 'SMTP connection timeout',
        stackTrace: 'Error: SMTP connection timeout\n    at SMTPClient.connect (smtp.js:305)'
      },
      retryHistory: [
        { timestamp: new Date(Date.now() - 3600000).toISOString(), error: 'SMTP connection timeout' },
        { timestamp: new Date(Date.now() - 1800000).toISOString(), error: 'SMTP connection timeout' },
        { timestamp: new Date(Date.now() - 600000).toISOString(), error: 'SMTP connection timeout' }
      ],
      status: 'pending',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 600000).toISOString()
    },
    {
      id: uuidv4(),
      notificationId: uuidv4(),
      userId: '223e4567-e89b-12d3-a456-426614174001',
      channel: 'push',
      payload: {
        token: 'device-token-123',
        title: 'Achievement Unlocked',
        body: 'You earned the Daily Steps badge!'
      },
      errorDetails: {
        type: 'client',
        message: 'Invalid device token',
        stackTrace: 'Error: Invalid device token\n    at FCMClient.send (fcm.js:127)'
      },
      retryHistory: [
        { timestamp: new Date(Date.now() - 7200000).toISOString(), error: 'Invalid device token' },
        { timestamp: new Date(Date.now() - 3600000).toISOString(), error: 'Invalid device token' }
      ],
      status: 'pending',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: uuidv4(),
      notificationId: uuidv4(),
      userId: '323e4567-e89b-12d3-a456-426614174002',
      channel: 'sms',
      payload: {
        to: '+1234567890',
        body: 'Your appointment is tomorrow at 10:00 AM'
      },
      errorDetails: {
        type: 'system',
        message: 'SMS gateway unavailable',
        stackTrace: 'Error: SMS gateway unavailable\n    at SMSClient.send (sms.js:89)'
      },
      retryHistory: [
        { timestamp: new Date(Date.now() - 5400000).toISOString(), error: 'SMS gateway unavailable' },
        { timestamp: new Date(Date.now() - 2700000).toISOString(), error: 'SMS gateway unavailable' },
        { timestamp: new Date(Date.now() - 900000).toISOString(), error: 'SMS gateway unavailable' }
      ],
      status: 'pending',
      createdAt: new Date(Date.now() - 5400000).toISOString(),
      updatedAt: new Date(Date.now() - 900000).toISOString()
    }
  ];

  // Mock DLQ statistics
  const mockDlqStatistics: DlqStatisticsResponseDto = {
    totalEntries: 42,
    entriesByErrorType: {
      client: 12,
      system: 8,
      transient: 15,
      external: 7
    },
    entriesByChannel: {
      email: 18,
      sms: 9,
      push: 11,
      'in-app': 4
    },
    entriesByStatus: {
      pending: 25,
      resolved: 10,
      reprocessed: 7
    },
    entriesByTimePeriod: {
      lastHour: 5,
      last24Hours: 22,
      lastWeek: 42
    },
    averageTimeInQueue: '4h 23m'
  };

  beforeAll(async () => {
    // Create mock DLQ service
    mockDlqService = {
      findAll: jest.fn().mockImplementation((query: QueryDlqEntriesDto) => {
        // Filter mock entries based on query parameters
        let filteredEntries = [...mockDlqEntries];
        
        if (query.userId) {
          filteredEntries = filteredEntries.filter(entry => entry.userId === query.userId);
        }
        
        if (query.channel) {
          filteredEntries = filteredEntries.filter(entry => entry.channel === query.channel);
        }
        
        if (query.errorType) {
          filteredEntries = filteredEntries.filter(entry => entry.errorDetails.type === query.errorType);
        }
        
        if (query.status) {
          filteredEntries = filteredEntries.filter(entry => entry.status === query.status);
        }
        
        // Apply pagination
        const page = query.page || 1;
        const limit = query.limit || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        
        const paginatedEntries = filteredEntries.slice(startIndex, endIndex);
        
        return {
          items: paginatedEntries,
          meta: {
            page,
            limit,
            totalItems: filteredEntries.length,
            totalPages: Math.ceil(filteredEntries.length / limit)
          }
        };
      }),
      
      findOne: jest.fn().mockImplementation((id: string) => {
        const entry = mockDlqEntries.find(entry => entry.id === id);
        if (!entry) {
          return null;
        }
        return entry;
      }),
      
      process: jest.fn().mockImplementation((id: string, processDto: ProcessDlqEntryDto) => {
        const entry = mockDlqEntries.find(entry => entry.id === id);
        if (!entry) {
          return null;
        }
        
        // Update the entry based on the action
        const updatedEntry = { ...entry };
        updatedEntry.status = processDto.action === 'resolve' ? 'resolved' : 
                             processDto.action === 'reprocess' ? 'reprocessed' : 
                             entry.status;
        
        return updatedEntry;
      }),
      
      getStatistics: jest.fn().mockResolvedValue(mockDlqStatistics)
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideProvider(DlqService)
      .useValue(mockDlqService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /dlq', () => {
    it('should retrieve all DLQ entries with default pagination', () => {
      return request(app.getHttpServer())
        .get('/dlq')
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toHaveProperty('items');
          expect(res.body).toHaveProperty('meta');
          expect(res.body.meta).toHaveProperty('page', 1);
          expect(res.body.meta).toHaveProperty('limit', 10);
          expect(mockDlqService.findAll).toHaveBeenCalledWith(expect.objectContaining({
            page: 1,
            limit: 10
          }));
        });
    });

    it('should filter DLQ entries by userId', () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      
      return request(app.getHttpServer())
        .get(`/dlq?userId=${userId}`)
        .expect(HttpStatus.OK)
        .expect(() => {
          expect(mockDlqService.findAll).toHaveBeenCalledWith(expect.objectContaining({
            userId
          }));
        });
    });

    it('should filter DLQ entries by channel', () => {
      const channel = 'email';
      
      return request(app.getHttpServer())
        .get(`/dlq?channel=${channel}`)
        .expect(HttpStatus.OK)
        .expect(() => {
          expect(mockDlqService.findAll).toHaveBeenCalledWith(expect.objectContaining({
            channel
          }));
        });
    });

    it('should filter DLQ entries by error type', () => {
      const errorType = 'external';
      
      return request(app.getHttpServer())
        .get(`/dlq?errorType=${errorType}`)
        .expect(HttpStatus.OK)
        .expect(() => {
          expect(mockDlqService.findAll).toHaveBeenCalledWith(expect.objectContaining({
            errorType
          }));
        });
    });

    it('should filter DLQ entries by status', () => {
      const status = 'pending';
      
      return request(app.getHttpServer())
        .get(`/dlq?status=${status}`)
        .expect(HttpStatus.OK)
        .expect(() => {
          expect(mockDlqService.findAll).toHaveBeenCalledWith(expect.objectContaining({
            status
          }));
        });
    });

    it('should apply custom pagination', () => {
      const page = 2;
      const limit = 5;
      
      return request(app.getHttpServer())
        .get(`/dlq?page=${page}&limit=${limit}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.meta).toHaveProperty('page', page);
          expect(res.body.meta).toHaveProperty('limit', limit);
          expect(mockDlqService.findAll).toHaveBeenCalledWith(expect.objectContaining({
            page,
            limit
          }));
        });
    });

    it('should return 400 for invalid query parameters', () => {
      return request(app.getHttpServer())
        .get('/dlq?limit=invalid')
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('GET /dlq/:id', () => {
    it('should retrieve a specific DLQ entry by ID', () => {
      const entryId = mockDlqEntries[0].id;
      
      return request(app.getHttpServer())
        .get(`/dlq/${entryId}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', entryId);
          expect(mockDlqService.findOne).toHaveBeenCalledWith(entryId);
        });
    });

    it('should return 404 when entry is not found', () => {
      const nonExistentId = 'non-existent-id';
      
      // Mock findOne to return null for this specific ID
      mockDlqService.findOne = jest.fn().mockImplementation((id: string) => {
        if (id === nonExistentId) {
          return null;
        }
        return mockDlqEntries.find(entry => entry.id === id);
      });
      
      return request(app.getHttpServer())
        .get(`/dlq/${nonExistentId}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('POST /dlq/:id/process', () => {
    it('should resolve a DLQ entry', () => {
      const entryId = mockDlqEntries[0].id;
      const processDto: ProcessDlqEntryDto = {
        action: 'resolve',
        comments: 'Issue resolved manually'
      };
      
      return request(app.getHttpServer())
        .post(`/dlq/${entryId}/process`)
        .send(processDto)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'resolved');
          expect(mockDlqService.process).toHaveBeenCalledWith(entryId, processDto);
        });
    });

    it('should reprocess a DLQ entry', () => {
      const entryId = mockDlqEntries[1].id;
      const processDto: ProcessDlqEntryDto = {
        action: 'reprocess',
        comments: 'Attempting to reprocess with updated token',
        overrideParams: {
          token: 'new-device-token-456'
        }
      };
      
      return request(app.getHttpServer())
        .post(`/dlq/${entryId}/process`)
        .send(processDto)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'reprocessed');
          expect(mockDlqService.process).toHaveBeenCalledWith(entryId, processDto);
        });
    });

    it('should return 400 for invalid action', () => {
      const entryId = mockDlqEntries[0].id;
      const invalidDto = {
        action: 'invalid-action',
        comments: 'This action is not supported'
      };
      
      return request(app.getHttpServer())
        .post(`/dlq/${entryId}/process`)
        .send(invalidDto)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 404 when entry is not found', () => {
      const nonExistentId = 'non-existent-id';
      const processDto: ProcessDlqEntryDto = {
        action: 'resolve',
        comments: 'Resolving non-existent entry'
      };
      
      // Mock process to return null for this specific ID
      mockDlqService.process = jest.fn().mockImplementation((id: string, dto: ProcessDlqEntryDto) => {
        if (id === nonExistentId) {
          return null;
        }
        const entry = mockDlqEntries.find(entry => entry.id === id);
        if (!entry) {
          return null;
        }
        
        const updatedEntry = { ...entry };
        updatedEntry.status = dto.action === 'resolve' ? 'resolved' : 
                             dto.action === 'reprocess' ? 'reprocessed' : 
                             entry.status;
        
        return updatedEntry;
      });
      
      return request(app.getHttpServer())
        .post(`/dlq/${nonExistentId}/process`)
        .send(processDto)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('GET /dlq/statistics', () => {
    it('should retrieve DLQ statistics', () => {
      return request(app.getHttpServer())
        .get('/dlq/statistics')
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toHaveProperty('totalEntries');
          expect(res.body).toHaveProperty('entriesByErrorType');
          expect(res.body).toHaveProperty('entriesByChannel');
          expect(res.body).toHaveProperty('entriesByStatus');
          expect(res.body).toHaveProperty('entriesByTimePeriod');
          expect(res.body).toHaveProperty('averageTimeInQueue');
          expect(mockDlqService.getStatistics).toHaveBeenCalled();
        });
    });
  });
});