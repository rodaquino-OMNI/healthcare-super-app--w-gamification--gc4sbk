# Achievement Images

This directory contains image assets for achievements within the AUSTA SuperApp's cross-journey gamification system.

## Naming Convention

`achievement_[achievement_id].[file_extension]`

Example: `achievement_daily_steps.png`

## Storage

All achievement images **must** be stored in this directory to ensure they are properly referenced by the design system components.

## Usage

These images are consumed by the `@austa/design-system` package's gamification components:

- `AchievementBadge`: Displays achievement icons with lock/unlock states and progress indicators
- `AchievementNotification`: Shows popup notifications when users unlock new achievements

## Journey Integration

Achievement images support the cross-journey gamification architecture, where events from all three journeys ("Minha Saúde", "Cuidar-me Agora", and "Meu Plano & Benefícios") contribute to the user's achievement progress.

## Implementation Notes

- Ensure that images are optimized for different screen sizes and resolutions to maintain a consistent user experience
- Images should be compatible with the journey-specific theming applied by the design system components
- New achievement images should follow the established naming convention to maintain backward compatibility