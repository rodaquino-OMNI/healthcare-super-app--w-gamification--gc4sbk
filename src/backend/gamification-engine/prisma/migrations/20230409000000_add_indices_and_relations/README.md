# Add Indices and Relations Migration

## Purpose

This migration enhances the gamification engine database with critical performance indices and strengthens relational constraints across all tables. It optimizes query performance for journey-specific operations, improves database access patterns for high-volume event processing, and ensures proper referential integrity between related entities.

## Key Improvements

### Performance Optimizations

1. **Journey-Specific Queries**
   - Added composite indices on events table (userId + journey + type) to optimize filtering by user and journey
   - Created journey-specific indices on achievements, quests, rewards, and leaderboards tables
   - Optimized game_profiles table for journey-specific filtering and leaderboard generation

2. **Event Processing Performance**
   - Implemented partial indices for processing status to improve event consumption performance
   - Added indices on timestamp fields for time-based queries and reporting
   - Created specialized indices for retry mechanism and dead letter queue management

3. **JSONB Query Optimization**
   - Enhanced JSONB indices for efficient payload querying and rules evaluation
   - Added GIN indices for preferences, conditions, and actions fields
   - Enabled btree_gin extension for improved JSONB indexing capabilities

### Data Integrity Enhancements

1. **Foreign Key Relationships**
   - Strengthened foreign key relationships between achievements, rewards, and user progress tables
   - Implemented proper cascading delete behavior for user-related junction tables
   - Enhanced referential integrity between leaderboards and related entities

2. **Data Validation Constraints**
   - Added check constraints to ensure progress values are within valid range (0-1000)
   - Implemented constraints to prevent excessive retry attempts for failed events
   - Added validation for XP rewards and game profile level/XP values

## Impact on System

This migration significantly improves the performance and reliability of the gamification engine, particularly for:

- Cross-journey achievement tracking and leaderboard generation
- High-volume event processing from all three journeys (Health, Care, Plan)
- Complex rule evaluation and action execution
- User progress tracking across multiple gamification elements

The enhanced indices and constraints support the journey-centered architecture while maintaining the centralized gamification engine's ability to process events from all journeys efficiently.

## Technical Notes

- This migration does not modify any existing data structures or schemas
- All indices are created concurrently to minimize impact on production systems
- The migration includes detailed comments on indices and constraints for documentation
- The btree_gin extension is required for optimal JSONB indexing performance