# Gamification Decorators

This directory contains decorators used throughout the gamification engine to control behavior and associate components with specific journeys.

## GamificationJourney Decorator

The `GamificationJourney` decorator associates a class or method with specific journeys (Health, Care, Plan). This controls which journeys a particular handler or component applies to, enabling journey-specific gamification rules.

### Usage Examples

#### Basic Usage

```typescript
import { GamificationJourney } from '@app/common/decorators';
import { Injectable } from '@nestjs/common';
import { IHealthEvent } from '@app/events/interfaces';

// Apply to a class to make all methods journey-specific
@Injectable()
@GamificationJourney({ journeys: ['health', 'care'] })
export class HealthAndCareAchievementsService {
  // This method will only process events from the Health and Care journeys
  processEvent(event: IHealthEvent) {
    // Implementation
  }
}

// Apply to a method to make just that method journey-specific
@Injectable()
export class AchievementsService {
  @GamificationJourney(['health'])
  handleHealthMetricEvent(event: IHealthEvent) {
    // Implementation
  }
  
  @GamificationJourney(['care'])
  handleCareAppointmentEvent(event: ICareEvent) {
    // Implementation
  }
}
```

#### Advanced Usage

```typescript
import { GamificationJourney, HealthJourney, CareJourney, PlanJourney, AllJourneys, SystemEvents } from '@app/common/decorators';
import { Injectable } from '@nestjs/common';
import { EventsService } from '@app/events/events.service';
import { GamificationEvent } from '@app/events/interfaces';

@Injectable()
export class EventProcessingService {
  constructor(private readonly eventsService: EventsService) {}
  
  // Apply with priority for cross-journey handlers
  @GamificationJourney({ journeys: ['health', 'care', 'plan'], priority: 10 })
  handleHighPriorityEvent(event: GamificationEvent) {
    // Implementation for high-priority events from any journey
  }
  
  // Apply to handle system events
  @SystemEvents()
  handleSystemEvent(event: ISystemEvent) {
    // Implementation for system events (no journey)
  }
  
  // Apply to handle all journeys
  @AllJourneys(5)
  handleAllJourneys(event: GamificationEvent) {
    // Implementation for events from any journey with priority 5
  }
  
  // Shorthand decorators for specific journeys
  @HealthJourney()
  handleHealthEvent(event: IHealthEvent) {
    // Implementation for health journey events
  }
  
  @CareJourney()
  handleCareEvent(event: ICareEvent) {
    // Implementation for care journey events
  }
  
  @PlanJourney()
  handlePlanEvent(event: IPlanEvent) {
    // Implementation for plan journey events
  }
}
```

### Utility Functions

The decorator module also provides utility functions for working with journey metadata:

```typescript
import { filterHandlersByJourney, sortHandlersByPriority, getJourneyMetadata } from '@app/common/decorators';

// Filter an array of handlers to only those that should process a specific journey
const healthHandlers = filterHandlersByJourney(allHandlers, 'health');

// Sort handlers by priority (highest first)
const sortedHandlers = sortHandlersByPriority(healthHandlers, 'health');

// Get journey metadata from a class or method
const metadata = getJourneyMetadata(handler);
```

### Integration with Event Processing

The decorator is designed to work with the event processing system in the gamification engine. When an event is received, the event processor can use the decorator metadata to determine which handlers should process the event based on its journey.

```typescript
import { Injectable } from '@nestjs/common';
import { filterAndSortHandlers } from '@app/common/decorators';
import { GamificationEvent } from '@app/events/interfaces';

@Injectable()
export class EventProcessor {
  private handlers: any[] = [];
  
  registerHandler(handler: any) {
    this.handlers.push(handler);
  }
  
  processEvent(event: GamificationEvent) {
    // Filter and sort handlers based on the event's journey
    const applicableHandlers = filterAndSortHandlers(this.handlers, event.journey);
    
    // Process the event with each applicable handler in priority order
    for (const handler of applicableHandlers) {
      handler.processEvent(event);
    }
  }
}
```

## Complete Examples

For more detailed examples of how to use the `GamificationJourney` decorator in real-world scenarios, see the `examples` directory:

- `journey-specific-handler.example.ts`: Shows how to use the decorator to create journey-specific event handlers
- `event-processor.example.ts`: Demonstrates how to use the decorator in an event processor to route events to the appropriate handlers

These examples provide comprehensive implementations that demonstrate best practices for using the decorator in different contexts.