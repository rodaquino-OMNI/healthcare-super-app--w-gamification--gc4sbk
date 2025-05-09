/**
 * Tests for journey-context utilities
 */

import {
  JourneyType,
  isValidJourney,
  createJourneyContext,
  validateJourneyContext,
  extractJourneyContext,
  addJourneyContext,
  isJourneyEvent,
  isHealthJourneyEvent,
  isCareJourneyEvent,
  isPlanJourneyEvent,
  createHealthJourneyContext,
  createCareJourneyContext,
  createPlanJourneyContext,
  ensureJourneyContext,
  routeEventByJourney,
  createCrossJourneyEvent,
  isCrossJourneyEvent,
  getCrossJourneyContexts,
  JourneyContextError
} from '../../../src/utils/journey-context';

describe('Journey Context Utilities', () => {
  describe('isValidJourney', () => {
    it('should return true for valid journey types', () => {
      expect(isValidJourney(JourneyType.HEALTH)).toBe(true);
      expect(isValidJourney(JourneyType.CARE)).toBe(true);
      expect(isValidJourney(JourneyType.PLAN)).toBe(true);
    });

    it('should return false for invalid journey types', () => {
      expect(isValidJourney('invalid')).toBe(false);
      expect(isValidJourney('')).toBe(false);
    });
  });

  describe('createJourneyContext', () => {
    it('should create a valid journey context object', () => {
      const context = createJourneyContext(JourneyType.HEALTH);
      expect(context).toEqual({
        journey: JourneyType.HEALTH,
        metadata: undefined
      });
    });

    it('should include metadata when provided', () => {
      const metadata = { source: 'test' };
      const context = createJourneyContext(JourneyType.CARE, metadata);
      expect(context).toEqual({
        journey: JourneyType.CARE,
        metadata
      });
    });

    it('should throw an error for invalid journey types', () => {
      expect(() => createJourneyContext('invalid')).toThrow(JourneyContextError);
    });
  });

  describe('validateJourneyContext', () => {
    it('should return true for events with valid journey context', () => {
      const event = { journey: JourneyType.HEALTH, type: 'TEST', userId: '123', data: {} };
      expect(validateJourneyContext(event)).toBe(true);
    });

    it('should return false for events without journey context', () => {
      const event = { type: 'TEST', userId: '123', data: {} };
      expect(validateJourneyContext(event)).toBe(false);
    });

    it('should return false for events with invalid journey context', () => {
      const event = { journey: 'invalid', type: 'TEST', userId: '123', data: {} };
      expect(validateJourneyContext(event)).toBe(false);
    });
  });

  describe('extractJourneyContext', () => {
    it('should extract journey context from events with valid context', () => {
      const event = { journey: JourneyType.HEALTH, type: 'TEST', userId: '123', data: {} };
      const context = extractJourneyContext(event);
      expect(context).toEqual({
        journey: JourneyType.HEALTH,
        metadata: {}
      });
    });

    it('should return null for events without valid journey context', () => {
      const event = { type: 'TEST', userId: '123', data: {} };
      expect(extractJourneyContext(event)).toBeNull();
    });
  });

  describe('addJourneyContext', () => {
    it('should add journey context to an event', () => {
      const event = { type: 'TEST', userId: '123', data: {} };
      const result = addJourneyContext(event, JourneyType.HEALTH);
      expect(result).toEqual({
        ...event,
        journey: JourneyType.HEALTH
      });
    });

    it('should throw an error for invalid journey types', () => {
      const event = { type: 'TEST', userId: '123', data: {} };
      expect(() => addJourneyContext(event, 'invalid')).toThrow(JourneyContextError);
    });
  });

  describe('isJourneyEvent', () => {
    it('should return true for events matching the specified journey', () => {
      const event = { journey: JourneyType.HEALTH, type: 'TEST', userId: '123', data: {} };
      expect(isJourneyEvent(event, JourneyType.HEALTH)).toBe(true);
    });

    it('should return false for events not matching the specified journey', () => {
      const event = { journey: JourneyType.CARE, type: 'TEST', userId: '123', data: {} };
      expect(isJourneyEvent(event, JourneyType.HEALTH)).toBe(false);
    });
  });

  describe('journey-specific checks', () => {
    const healthEvent = { journey: JourneyType.HEALTH, type: 'TEST', userId: '123', data: {} };
    const careEvent = { journey: JourneyType.CARE, type: 'TEST', userId: '123', data: {} };
    const planEvent = { journey: JourneyType.PLAN, type: 'TEST', userId: '123', data: {} };

    it('isHealthJourneyEvent should identify health events', () => {
      expect(isHealthJourneyEvent(healthEvent)).toBe(true);
      expect(isHealthJourneyEvent(careEvent)).toBe(false);
      expect(isHealthJourneyEvent(planEvent)).toBe(false);
    });

    it('isCareJourneyEvent should identify care events', () => {
      expect(isCareJourneyEvent(healthEvent)).toBe(false);
      expect(isCareJourneyEvent(careEvent)).toBe(true);
      expect(isCareJourneyEvent(planEvent)).toBe(false);
    });

    it('isPlanJourneyEvent should identify plan events', () => {
      expect(isPlanJourneyEvent(healthEvent)).toBe(false);
      expect(isPlanJourneyEvent(careEvent)).toBe(false);
      expect(isPlanJourneyEvent(planEvent)).toBe(true);
    });
  });

  describe('journey-specific context creation', () => {
    it('createHealthJourneyContext should create health journey context', () => {
      expect(createHealthJourneyContext()).toEqual({
        journey: JourneyType.HEALTH,
        metadata: undefined
      });
    });

    it('createCareJourneyContext should create care journey context', () => {
      expect(createCareJourneyContext()).toEqual({
        journey: JourneyType.CARE,
        metadata: undefined
      });
    });

    it('createPlanJourneyContext should create plan journey context', () => {
      expect(createPlanJourneyContext()).toEqual({
        journey: JourneyType.PLAN,
        metadata: undefined
      });
    });
  });

  describe('ensureJourneyContext', () => {
    it('should keep existing valid journey context', () => {
      const event = { journey: JourneyType.HEALTH, type: 'TEST', userId: '123', data: {} };
      expect(ensureJourneyContext(event)).toBe(event);
    });

    it('should add default journey context if none exists', () => {
      const event = { type: 'TEST', userId: '123', data: {} };
      expect(ensureJourneyContext(event)).toEqual({
        ...event,
        journey: JourneyType.HEALTH
      });
    });

    it('should replace invalid journey context with default', () => {
      const event = { journey: 'invalid', type: 'TEST', userId: '123', data: {} };
      expect(ensureJourneyContext(event)).toEqual({
        ...event,
        journey: JourneyType.HEALTH
      });
    });

    it('should use specified default journey if provided', () => {
      const event = { type: 'TEST', userId: '123', data: {} };
      expect(ensureJourneyContext(event, JourneyType.CARE)).toEqual({
        ...event,
        journey: JourneyType.CARE
      });
    });
  });

  describe('routeEventByJourney', () => {
    it('should route events to the appropriate journey handler', () => {
      const event = { journey: JourneyType.HEALTH, type: 'TEST', userId: '123', data: {} };
      const handlers = {
        [JourneyType.HEALTH]: jest.fn().mockReturnValue('health'),
        [JourneyType.CARE]: jest.fn().mockReturnValue('care'),
        [JourneyType.PLAN]: jest.fn().mockReturnValue('plan')
      };

      const result = routeEventByJourney(event, handlers);
      expect(result).toBe('health');
      expect(handlers[JourneyType.HEALTH]).toHaveBeenCalledWith(event);
      expect(handlers[JourneyType.CARE]).not.toHaveBeenCalled();
      expect(handlers[JourneyType.PLAN]).not.toHaveBeenCalled();
    });

    it('should use default handler if no journey-specific handler exists', () => {
      const event = { journey: JourneyType.HEALTH, type: 'TEST', userId: '123', data: {} };
      const handlers = {
        [JourneyType.CARE]: jest.fn(),
        [JourneyType.PLAN]: jest.fn()
      };
      const defaultHandler = jest.fn().mockReturnValue('default');

      const result = routeEventByJourney(event, handlers, defaultHandler);
      expect(result).toBe('default');
      expect(defaultHandler).toHaveBeenCalledWith(event);
    });

    it('should use default handler for events without valid journey context', () => {
      const event = { type: 'TEST', userId: '123', data: {} };
      const handlers = {
        [JourneyType.HEALTH]: jest.fn(),
        [JourneyType.CARE]: jest.fn(),
        [JourneyType.PLAN]: jest.fn()
      };
      const defaultHandler = jest.fn().mockReturnValue('default');

      const result = routeEventByJourney(event, handlers, defaultHandler);
      expect(result).toBe('default');
      expect(defaultHandler).toHaveBeenCalledWith(event);
      expect(handlers[JourneyType.HEALTH]).not.toHaveBeenCalled();
      expect(handlers[JourneyType.CARE]).not.toHaveBeenCalled();
      expect(handlers[JourneyType.PLAN]).not.toHaveBeenCalled();
    });
  });

  describe('cross-journey events', () => {
    it('createCrossJourneyEvent should create an event with cross-journey context', () => {
      const event = { type: 'TEST', userId: '123', data: {} };
      const journeys = [JourneyType.HEALTH, JourneyType.CARE];
      const result = createCrossJourneyEvent(event, journeys);

      expect(result.journey).toBe(JourneyType.HEALTH);
      expect(result.data).toHaveProperty('crossJourneyContext');
      expect(result.data.crossJourneyContext).toEqual({
        journeys,
        isPrimaryJourney: true
      });
    });

    it('should throw an error if any journey is invalid', () => {
      const event = { type: 'TEST', userId: '123', data: {} };
      const journeys = [JourneyType.HEALTH, 'invalid' as JourneyType];
      expect(() => createCrossJourneyEvent(event, journeys)).toThrow(JourneyContextError);
    });

    it('isCrossJourneyEvent should identify cross-journey events', () => {
      const event = { type: 'TEST', userId: '123', data: {} };
      const crossJourneyEvent = createCrossJourneyEvent(event, [JourneyType.HEALTH, JourneyType.CARE]);
      
      expect(isCrossJourneyEvent(crossJourneyEvent)).toBe(true);
      expect(isCrossJourneyEvent(event)).toBe(false);
    });

    it('getCrossJourneyContexts should extract all journeys from a cross-journey event', () => {
      const event = { type: 'TEST', userId: '123', data: {} };
      const journeys = [JourneyType.HEALTH, JourneyType.CARE];
      const crossJourneyEvent = createCrossJourneyEvent(event, journeys);
      
      expect(getCrossJourneyContexts(crossJourneyEvent)).toEqual(journeys);
      expect(getCrossJourneyContexts(event)).toBeNull();
    });
  });
});