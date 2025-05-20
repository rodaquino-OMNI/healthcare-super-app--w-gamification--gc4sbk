import { TOPICS } from '../../../src/constants/topics.constants';

describe('Topics Constants', () => {
  describe('Naming Pattern Consistency', () => {
    it('should follow the <journey/category>.<event-type> naming pattern', () => {
      // Check all topics follow the pattern
      const allTopics = getAllTopicValues(TOPICS);
      
      // Skip the dead letter queue which has a different pattern
      const regularTopics = allTopics.filter(topic => topic !== TOPICS.DEAD_LETTER);
      
      for (const topic of regularTopics) {
        expect(topic).toMatch(/^[a-z]+\.[a-z]+$/);
      }
    });
    
    it('should use consistent journey prefixes', () => {
      // Health journey topics
      expect(TOPICS.HEALTH.EVENTS).toMatch(/^health\./);
      expect(TOPICS.HEALTH.METRICS).toMatch(/^health\./);
      expect(TOPICS.HEALTH.GOALS).toMatch(/^health\./);
      expect(TOPICS.HEALTH.DEVICES).toMatch(/^health\./);
      
      // Care journey topics
      expect(TOPICS.CARE.EVENTS).toMatch(/^care\./);
      expect(TOPICS.CARE.APPOINTMENTS).toMatch(/^care\./);
      expect(TOPICS.CARE.MEDICATIONS).toMatch(/^care\./);
      expect(TOPICS.CARE.TELEMEDICINE).toMatch(/^care\./);
      
      // Plan journey topics
      expect(TOPICS.PLAN.EVENTS).toMatch(/^plan\./);
      expect(TOPICS.PLAN.CLAIMS).toMatch(/^plan\./);
      expect(TOPICS.PLAN.BENEFITS).toMatch(/^plan\./);
      expect(TOPICS.PLAN.SELECTION).toMatch(/^plan\./);
    });
    
    it('should use consistent cross-cutting concern prefixes', () => {
      // User topics
      expect(TOPICS.USER.EVENTS).toMatch(/^user\./);
      expect(TOPICS.USER.PROFILE).toMatch(/^user\./);
      expect(TOPICS.USER.PREFERENCES).toMatch(/^user\./);
      
      // Gamification topics
      expect(TOPICS.GAMIFICATION.EVENTS).toMatch(/^game\./);
      expect(TOPICS.GAMIFICATION.ACHIEVEMENTS).toMatch(/^game\./);
      expect(TOPICS.GAMIFICATION.REWARDS).toMatch(/^game\./);
      expect(TOPICS.GAMIFICATION.LEADERBOARD).toMatch(/^game\./);
      
      // Notification topics
      expect(TOPICS.NOTIFICATIONS.EVENTS).toMatch(/^notification\./);
      expect(TOPICS.NOTIFICATIONS.PUSH).toMatch(/^notification\./);
      expect(TOPICS.NOTIFICATIONS.EMAIL).toMatch(/^notification\./);
      expect(TOPICS.NOTIFICATIONS.SMS).toMatch(/^notification\./);
    });
  });
  
  describe('Cross-Journey Event Topics', () => {
    it('should define user.events topic for user-related events', () => {
      expect(TOPICS.USER.EVENTS).toBe('user.events');
    });
    
    it('should define game.events topic for gamification events', () => {
      expect(TOPICS.GAMIFICATION.EVENTS).toBe('game.events');
    });
  });
  
  describe('Namespace Organization', () => {
    it('should organize topics by journey for proper code completion', () => {
      // Check journey namespaces exist
      expect(TOPICS.HEALTH).toBeDefined();
      expect(TOPICS.CARE).toBeDefined();
      expect(TOPICS.PLAN).toBeDefined();
      
      // Check cross-cutting concern namespaces exist
      expect(TOPICS.USER).toBeDefined();
      expect(TOPICS.GAMIFICATION).toBeDefined();
      expect(TOPICS.NOTIFICATIONS).toBeDefined();
    });
    
    it('should include an EVENTS topic for each journey/category', () => {
      expect(TOPICS.HEALTH.EVENTS).toBeDefined();
      expect(TOPICS.CARE.EVENTS).toBeDefined();
      expect(TOPICS.PLAN.EVENTS).toBeDefined();
      expect(TOPICS.USER.EVENTS).toBeDefined();
      expect(TOPICS.GAMIFICATION.EVENTS).toBeDefined();
      expect(TOPICS.NOTIFICATIONS.EVENTS).toBeDefined();
    });
  });
  
  describe('Topic Coverage', () => {
    it('should cover all health journey event types', () => {
      expect(TOPICS.HEALTH.METRICS).toBeDefined();
      expect(TOPICS.HEALTH.GOALS).toBeDefined();
      expect(TOPICS.HEALTH.DEVICES).toBeDefined();
    });
    
    it('should cover all care journey event types', () => {
      expect(TOPICS.CARE.APPOINTMENTS).toBeDefined();
      expect(TOPICS.CARE.MEDICATIONS).toBeDefined();
      expect(TOPICS.CARE.TELEMEDICINE).toBeDefined();
    });
    
    it('should cover all plan journey event types', () => {
      expect(TOPICS.PLAN.CLAIMS).toBeDefined();
      expect(TOPICS.PLAN.BENEFITS).toBeDefined();
      expect(TOPICS.PLAN.SELECTION).toBeDefined();
    });
    
    it('should cover all user-related event types', () => {
      expect(TOPICS.USER.PROFILE).toBeDefined();
      expect(TOPICS.USER.PREFERENCES).toBeDefined();
    });
    
    it('should cover all gamification event types', () => {
      expect(TOPICS.GAMIFICATION.ACHIEVEMENTS).toBeDefined();
      expect(TOPICS.GAMIFICATION.REWARDS).toBeDefined();
      expect(TOPICS.GAMIFICATION.LEADERBOARD).toBeDefined();
    });
    
    it('should cover all notification event types', () => {
      expect(TOPICS.NOTIFICATIONS.PUSH).toBeDefined();
      expect(TOPICS.NOTIFICATIONS.EMAIL).toBeDefined();
      expect(TOPICS.NOTIFICATIONS.SMS).toBeDefined();
    });
    
    it('should define a dead letter queue topic', () => {
      expect(TOPICS.DEAD_LETTER).toBeDefined();
      expect(TOPICS.DEAD_LETTER).toBe('dead-letter');
    });
  });
  
  describe('Versioning Pattern', () => {
    it('should support future versioning of topics', () => {
      // This test is a placeholder for future versioning implementation
      // When versioning is implemented, this test should be updated to verify
      // that topics follow the versioning pattern
      
      // Example implementation once versioning is added:
      // expect(TOPICS.HEALTH.EVENTS_V1).toBeDefined();
      // expect(TOPICS.HEALTH.EVENTS_V1).toMatch(/^health\.events\.v1$/);
      
      // For now, just verify the current structure exists
      expect(TOPICS).toBeDefined();
    });
  });
});

/**
 * Helper function to extract all topic values from the TOPICS object,
 * including nested values.
 */
function getAllTopicValues(topics: any): string[] {
  const result: string[] = [];
  
  function extractValues(obj: any) {
    for (const key in obj) {
      const value = obj[key];
      if (typeof value === 'string') {
        result.push(value);
      } else if (typeof value === 'object' && value !== null) {
        extractValues(value);
      }
    }
  }
  
  extractValues(topics);
  return result;
}