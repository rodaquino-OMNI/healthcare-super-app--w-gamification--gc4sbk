/**
 * @file gamification-journey.decorator.spec.ts
 * @description Tests for the GamificationJourney decorator
 */

import { Test } from '@nestjs/testing';
import {
  GamificationJourney,
  HealthJourney,
  CareJourney,
  PlanJourney,
  SystemEvents,
  AllJourneys,
  getJourneyMetadata,
  shouldProcessJourney,
  getHandlerPriority,
  sortHandlersByPriority,
  filterHandlersByJourney,
  filterAndSortHandlers,
  JOURNEY_METADATA_KEY,
  JourneyMetadata
} from './gamification-journey.decorator';

describe('GamificationJourney Decorator', () => {
  // Test classes
  @GamificationJourney({ journeys: ['health', 'care'] })
  class HealthAndCareService {}

  @GamificationJourney(['health'])
  class HealthService {}

  @GamificationJourney({ journeys: ['care'], priority: 5 })
  class CareService {}

  @GamificationJourney({ journeys: ['plan'], priority: 10 })
  class PlanService {}

  @GamificationJourney({ journeys: [], includeSystemEvents: true })
  class SystemService {}

  @GamificationJourney({ allJourneys: true, priority: 3 })
  class AllJourneysService {}

  @HealthJourney()
  class HealthJourneyService {}

  @CareJourney(2)
  class CareJourneyService {}

  @PlanJourney(4)
  class PlanJourneyService {}

  @SystemEvents(6)
  class SystemEventsService {}

  @AllJourneys(8)
  class AllJourneysShorthandService {}

  class NoDecoratorService {}

  describe('Metadata Application', () => {
    it('should apply metadata to classes with array journeys', () => {
      const metadata = getJourneyMetadata(HealthService);
      expect(metadata).toBeDefined();
      expect(metadata?.journeys).toEqual(['health']);
      expect(metadata?.priority).toEqual(0);
      expect(metadata?.includeSystemEvents).toEqual(false);
      expect(metadata?.allJourneys).toEqual(false);
    });

    it('should apply metadata to classes with options object', () => {
      const metadata = getJourneyMetadata(HealthAndCareService);
      expect(metadata).toBeDefined();
      expect(metadata?.journeys).toEqual(['health', 'care']);
      expect(metadata?.priority).toEqual(0);
      expect(metadata?.includeSystemEvents).toEqual(false);
      expect(metadata?.allJourneys).toEqual(false);
    });

    it('should apply priority when specified', () => {
      const metadata = getJourneyMetadata(CareService);
      expect(metadata).toBeDefined();
      expect(metadata?.journeys).toEqual(['care']);
      expect(metadata?.priority).toEqual(5);
    });

    it('should apply includeSystemEvents when specified', () => {
      const metadata = getJourneyMetadata(SystemService);
      expect(metadata).toBeDefined();
      expect(metadata?.journeys).toEqual([]);
      expect(metadata?.includeSystemEvents).toEqual(true);
    });

    it('should apply allJourneys when specified', () => {
      const metadata = getJourneyMetadata(AllJourneysService);
      expect(metadata).toBeDefined();
      expect(metadata?.allJourneys).toEqual(true);
      expect(metadata?.priority).toEqual(3);
    });

    it('should return undefined for classes without decorator', () => {
      const metadata = getJourneyMetadata(NoDecoratorService);
      expect(metadata).toBeUndefined();
    });
  });

  describe('Shorthand Decorators', () => {
    it('should apply correct metadata for HealthJourney', () => {
      const metadata = getJourneyMetadata(HealthJourneyService);
      expect(metadata).toBeDefined();
      expect(metadata?.journeys).toEqual(['health']);
      expect(metadata?.priority).toEqual(0);
    });

    it('should apply correct metadata for CareJourney with priority', () => {
      const metadata = getJourneyMetadata(CareJourneyService);
      expect(metadata).toBeDefined();
      expect(metadata?.journeys).toEqual(['care']);
      expect(metadata?.priority).toEqual(2);
    });

    it('should apply correct metadata for PlanJourney with priority', () => {
      const metadata = getJourneyMetadata(PlanJourneyService);
      expect(metadata).toBeDefined();
      expect(metadata?.journeys).toEqual(['plan']);
      expect(metadata?.priority).toEqual(4);
    });

    it('should apply correct metadata for SystemEvents with priority', () => {
      const metadata = getJourneyMetadata(SystemEventsService);
      expect(metadata).toBeDefined();
      expect(metadata?.journeys).toEqual([]);
      expect(metadata?.includeSystemEvents).toEqual(true);
      expect(metadata?.priority).toEqual(6);
    });

    it('should apply correct metadata for AllJourneys with priority', () => {
      const metadata = getJourneyMetadata(AllJourneysShorthandService);
      expect(metadata).toBeDefined();
      expect(metadata?.journeys).toEqual(['health', 'care', 'plan']);
      expect(metadata?.allJourneys).toEqual(true);
      expect(metadata?.priority).toEqual(8);
    });
  });

  describe('Utility Functions', () => {
    describe('shouldProcessJourney', () => {
      it('should return true for matching journey', () => {
        expect(shouldProcessJourney(HealthService, 'health')).toBe(true);
        expect(shouldProcessJourney(HealthAndCareService, 'health')).toBe(true);
        expect(shouldProcessJourney(HealthAndCareService, 'care')).toBe(true);
      });

      it('should return false for non-matching journey', () => {
        expect(shouldProcessJourney(HealthService, 'care')).toBe(false);
        expect(shouldProcessJourney(HealthService, 'plan')).toBe(false);
        expect(shouldProcessJourney(HealthAndCareService, 'plan')).toBe(false);
      });

      it('should return true for system events when includeSystemEvents is true', () => {
        expect(shouldProcessJourney(SystemService, undefined)).toBe(true);
      });

      it('should return false for system events when includeSystemEvents is false', () => {
        expect(shouldProcessJourney(HealthService, undefined)).toBe(false);
      });

      it('should return true for any journey when allJourneys is true', () => {
        expect(shouldProcessJourney(AllJourneysService, 'health')).toBe(true);
        expect(shouldProcessJourney(AllJourneysService, 'care')).toBe(true);
        expect(shouldProcessJourney(AllJourneysService, 'plan')).toBe(true);
        expect(shouldProcessJourney(AllJourneysService, undefined)).toBe(true);
      });

      it('should return true for any class without decorator', () => {
        expect(shouldProcessJourney(NoDecoratorService, 'health')).toBe(true);
        expect(shouldProcessJourney(NoDecoratorService, 'care')).toBe(true);
        expect(shouldProcessJourney(NoDecoratorService, 'plan')).toBe(true);
        expect(shouldProcessJourney(NoDecoratorService, undefined)).toBe(true);
      });
    });

    describe('getHandlerPriority', () => {
      it('should return correct priority for handlers with priority', () => {
        expect(getHandlerPriority(CareService)).toBe(5);
        expect(getHandlerPriority(PlanService)).toBe(10);
        expect(getHandlerPriority(AllJourneysService)).toBe(3);
      });

      it('should return 0 for handlers without priority', () => {
        expect(getHandlerPriority(HealthService)).toBe(0);
        expect(getHandlerPriority(HealthAndCareService)).toBe(0);
      });

      it('should return 0 for handlers without decorator', () => {
        expect(getHandlerPriority(NoDecoratorService)).toBe(0);
      });
    });

    describe('sortHandlersByPriority', () => {
      it('should sort handlers by priority (highest first)', () => {
        const handlers = [
          HealthService,
          CareService,
          PlanService,
          AllJourneysService,
          NoDecoratorService
        ];

        const sorted = sortHandlersByPriority(handlers);
        expect(sorted).toEqual([
          PlanService,
          CareService,
          AllJourneysService,
          HealthService,
          NoDecoratorService
        ]);
      });
    });

    describe('filterHandlersByJourney', () => {
      it('should filter handlers by journey', () => {
        const handlers = [
          HealthService,
          CareService,
          PlanService,
          HealthAndCareService,
          SystemService,
          AllJourneysService,
          NoDecoratorService
        ];

        const healthHandlers = filterHandlersByJourney(handlers, 'health');
        expect(healthHandlers).toEqual([
          HealthService,
          HealthAndCareService,
          AllJourneysService,
          NoDecoratorService
        ]);

        const careHandlers = filterHandlersByJourney(handlers, 'care');
        expect(careHandlers).toEqual([
          CareService,
          HealthAndCareService,
          AllJourneysService,
          NoDecoratorService
        ]);

        const planHandlers = filterHandlersByJourney(handlers, 'plan');
        expect(planHandlers).toEqual([
          PlanService,
          AllJourneysService,
          NoDecoratorService
        ]);

        const systemHandlers = filterHandlersByJourney(handlers, undefined);
        expect(systemHandlers).toEqual([
          SystemService,
          AllJourneysService,
          NoDecoratorService
        ]);
      });
    });

    describe('filterAndSortHandlers', () => {
      it('should filter and sort handlers by journey and priority', () => {
        const handlers = [
          HealthService,
          CareService,
          PlanService,
          HealthAndCareService,
          SystemService,
          AllJourneysService,
          NoDecoratorService
        ];

        const healthHandlers = filterAndSortHandlers(handlers, 'health');
        expect(healthHandlers).toEqual([
          AllJourneysService,
          HealthService,
          HealthAndCareService,
          NoDecoratorService
        ]);

        const careHandlers = filterAndSortHandlers(handlers, 'care');
        expect(careHandlers).toEqual([
          CareService,
          AllJourneysService,
          HealthAndCareService,
          NoDecoratorService
        ]);

        const planHandlers = filterAndSortHandlers(handlers, 'plan');
        expect(planHandlers).toEqual([
          PlanService,
          AllJourneysService,
          NoDecoratorService
        ]);

        const systemHandlers = filterAndSortHandlers(handlers, undefined);
        expect(systemHandlers).toEqual([
          AllJourneysService,
          SystemService,
          NoDecoratorService
        ]);
      });
    });
  });

  describe('Method Decorators', () => {
    class TestService {
      @GamificationJourney(['health'])
      healthMethod() {}

      @GamificationJourney({ journeys: ['care'], priority: 5 })
      careMethod() {}

      @HealthJourney(3)
      healthJourneyMethod() {}

      @AllJourneys(7)
      allJourneysMethod() {}

      noDecoratorMethod() {}
    }

    const service = new TestService();

    it('should apply metadata to methods', () => {
      const healthMetadata = getJourneyMetadata(service.healthMethod);
      expect(healthMetadata).toBeDefined();
      expect(healthMetadata?.journeys).toEqual(['health']);

      const careMetadata = getJourneyMetadata(service.careMethod);
      expect(careMetadata).toBeDefined();
      expect(careMetadata?.journeys).toEqual(['care']);
      expect(careMetadata?.priority).toEqual(5);

      const healthJourneyMetadata = getJourneyMetadata(service.healthJourneyMethod);
      expect(healthJourneyMetadata).toBeDefined();
      expect(healthJourneyMetadata?.journeys).toEqual(['health']);
      expect(healthJourneyMetadata?.priority).toEqual(3);

      const allJourneysMetadata = getJourneyMetadata(service.allJourneysMethod);
      expect(allJourneysMetadata).toBeDefined();
      expect(allJourneysMetadata?.allJourneys).toEqual(true);
      expect(allJourneysMetadata?.priority).toEqual(7);

      const noDecoratorMetadata = getJourneyMetadata(service.noDecoratorMethod);
      expect(noDecoratorMetadata).toBeUndefined();
    });

    it('should correctly determine if methods should process journeys', () => {
      expect(shouldProcessJourney(service.healthMethod, 'health')).toBe(true);
      expect(shouldProcessJourney(service.healthMethod, 'care')).toBe(false);

      expect(shouldProcessJourney(service.careMethod, 'care')).toBe(true);
      expect(shouldProcessJourney(service.careMethod, 'health')).toBe(false);

      expect(shouldProcessJourney(service.allJourneysMethod, 'health')).toBe(true);
      expect(shouldProcessJourney(service.allJourneysMethod, 'care')).toBe(true);
      expect(shouldProcessJourney(service.allJourneysMethod, 'plan')).toBe(true);

      expect(shouldProcessJourney(service.noDecoratorMethod, 'health')).toBe(true);
    });
  });
});