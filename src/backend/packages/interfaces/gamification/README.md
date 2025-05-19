# Gamification Interfaces

This directory contains TypeScript interfaces and types for the gamification event system used throughout the AUSTA SuperApp. These interfaces standardize the format of events that trigger gamification rules, achievements, and rewards across all journeys.

## Overview

The gamification event system is a core part of the AUSTA SuperApp, enabling cross-journey gamification features such as achievements, quests, and rewards. This package provides the interfaces and types needed to work with gamification events in a type-safe manner.

## Files

- `events.ts` - Contains the main `GamificationEvent` interface, event payload interfaces, and utility functions for working with events.
- `event-types.ts` - Contains the event type enums, type guards, and utility functions for working with event types.
- `index.ts` - Barrel file that exports everything from events.ts and event-types.ts.

## Usage

### Importing

```typescript
// Import everything
import * as GamificationInterfaces from '@austa/interfaces/gamification';

// Import specific interfaces and types
import { GamificationEvent, EventPayload, EventType } from '@austa/interfaces/gamification';
import { HealthEventType, CareEventType, PlanEventType } from '@austa/interfaces/gamification';
```

### Creating Events

```typescript
import { createEvent, HealthEventType, EventPayload } from '@austa/interfaces/gamification';

// Create a health metric recorded event
const payload: EventPayload = {
  data: {
    metricType: 'BLOOD_PRESSURE',
    value: 120,
    unit: 'mmHg',
    source: 'manual',
    recordedAt: new Date().toISOString()
  }
};

const event = createEvent(HealthEventType.HEALTH_METRIC_RECORDED, 'user123', payload, 'health');
```

### Type Guards

```typescript
import { isHealthJourneyEvent, isCareJourneyEvent, isPlanJourneyEvent } from '@austa/interfaces/gamification';

function processEvent(event: GamificationEvent) {
  if (isHealthJourneyEvent(event)) {
    // Process health journey event
  } else if (isCareJourneyEvent(event)) {
    // Process care journey event
  } else if (isPlanJourneyEvent(event)) {
    // Process plan journey event
  } else {
    // Process common event
  }
}
```

### Versioning

```typescript
import { parseVersion, compareVersions, EventVersion } from '@austa/interfaces/gamification';

// Parse version strings
const v1 = parseVersion('1.2.3');
const v2 = parseVersion('1.3.0');

// Compare versions
if (compareVersions(v1, v2) < 0) {
  console.log('v1 is older than v2');
}

// Check if events are compatible
import { areEventsCompatible } from '@austa/interfaces/gamification';

if (areEventsCompatible(event1, event2)) {
  console.log('Events are compatible');
}
```

## Event Types

### Health Journey Events

- `HEALTH_METRIC_RECORDED` - User recorded a health metric
- `GOAL_CREATED` - User created a health goal
- `GOAL_UPDATED` - User updated a health goal
- `GOAL_ACHIEVED` - User achieved a health goal
- `DEVICE_CONNECTED` - User connected a health device
- `DEVICE_SYNCED` - User synced a health device
- `HEALTH_INSIGHT_VIEWED` - User viewed a health insight
- `MEDICAL_EVENT_RECORDED` - User recorded a medical event

### Care Journey Events

- `APPOINTMENT_BOOKED` - User booked an appointment
- `APPOINTMENT_ATTENDED` - User attended an appointment
- `APPOINTMENT_CANCELLED` - User cancelled an appointment
- `MEDICATION_ADDED` - User added a medication
- `MEDICATION_TAKEN` - User took a medication
- `MEDICATION_SKIPPED` - User skipped a medication
- `TELEMEDICINE_SESSION_STARTED` - User started a telemedicine session
- `TELEMEDICINE_SESSION_COMPLETED` - User completed a telemedicine session
- `SYMPTOM_CHECKED` - User checked symptoms
- `TREATMENT_PLAN_CREATED` - User created a treatment plan
- `TREATMENT_PLAN_COMPLETED` - User completed a treatment plan

### Plan Journey Events

- `PLAN_VIEWED` - User viewed a plan
- `BENEFIT_VIEWED` - User viewed a benefit
- `CLAIM_SUBMITTED` - User submitted a claim
- `CLAIM_APPROVED` - User's claim was approved
- `CLAIM_REJECTED` - User's claim was rejected
- `DOCUMENT_UPLOADED` - User uploaded a document
- `COVERAGE_CHECKED` - User checked coverage
- `PLAN_COMPARED` - User compared plans
- `PLAN_SELECTED` - User selected a plan

### Common Events

- `USER_REGISTERED` - User registered
- `USER_LOGGED_IN` - User logged in
- `PROFILE_UPDATED` - User updated their profile
- `NOTIFICATION_VIEWED` - User viewed a notification
- `FEEDBACK_SUBMITTED` - User submitted feedback
- `REWARD_REDEEMED` - User redeemed a reward
- `ACHIEVEMENT_UNLOCKED` - User unlocked an achievement
- `QUEST_COMPLETED` - User completed a quest

## Contributing

When adding new event types or modifying existing ones, please follow these guidelines:

1. Add the new event type to the appropriate enum in `event-types.ts`
2. Create a corresponding payload interface in `events.ts`
3. Update the documentation in this README.md file
4. Ensure backward compatibility by following the versioning guidelines

## Versioning Guidelines

Event schema versions follow semantic versioning (MAJOR.MINOR.PATCH):

- MAJOR: Breaking changes that require updates to consumers
- MINOR: Backward-compatible additions
- PATCH: Backward-compatible fixes

When making changes to event schemas, update the version accordingly and provide migration utilities if needed.