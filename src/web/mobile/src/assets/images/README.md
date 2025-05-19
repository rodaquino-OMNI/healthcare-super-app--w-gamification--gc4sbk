# Image Assets

This directory contains all image assets used within the AUSTA SuperApp mobile application. These assets are critical for maintaining a consistent visual identity across the application and ensuring optimal performance on mobile devices.

## Directory Structure

The image assets are organized into the following subdirectories:

- **app/**: Application-level assets including app icons, splash screens, and branding elements
- **journey/**: Journey-specific images for Health, Care, and Plan journeys
- **achievements/**: Achievement badges and notification images for the gamification system

## Naming Conventions

### App Images

`app_[purpose]_[size].[file_extension]`

Examples:
- `app_icon_1024x1024.png`
- `app_splash_screen.png`
- `app_logo_dark.png`

### Journey Images

`journey_[journeyType]_[imagePurpose].[file_extension]`

Examples:
- `journey_health_header.png`
- `journey_care_illustration.svg`
- `journey_plan_icon.png`

### Achievement Images

`achievement_[achievement_id].[file_extension]`

Example: 
- `achievement_daily_steps.png`
- `achievement_first_appointment.png`

## Recommended Formats

- **PNG**: Use for images requiring transparency or when high-quality is essential
- **JPG**: Use for photographs or complex images without transparency
- **SVG**: Preferred for icons, logos, and simple illustrations to ensure crisp rendering at all sizes

## Optimization Guidelines

To ensure optimal performance on mobile devices, follow these guidelines:

1. **Size Optimization**:
   - Compress all PNG and JPG images using tools like TinyPNG or ImageOptim
   - Keep file sizes under 100KB when possible
   - Use appropriate dimensions for the intended display size

2. **Resolution Support**:
   - Provide @2x and @3x versions for critical assets
   - Use the naming convention `[filename]@2x.png` and `[filename]@3x.png`

3. **SVG Best Practices**:
   - Optimize SVGs using SVGO
   - Remove unnecessary metadata
   - Use simple paths when possible
   - Consider converting text to paths

4. **Accessibility**:
   - Ensure sufficient contrast in UI elements
   - Avoid using images as the sole means of conveying information

## Usage in Codebase

Images should be imported and used according to the following patterns:

```javascript
// For static images
import logo from '../assets/images/app/app_logo.png';

// In JSX
<Image source={logo} />

// For dynamic images based on journey
import { useJourneyContext } from '@austa/journey-context';

const MyComponent = () => {
  const { journeyType } = useJourneyContext();
  const headerImage = require(`../assets/images/journey/journey_${journeyType}_header.png`);
  
  return <Image source={headerImage} />;
};
```

## Integration with Design System

The image assets in this directory are consumed by components from the `@austa/design-system` package. When adding or modifying images, ensure they align with the design system's specifications:

1. **Color Consistency**: Journey-specific images should use the appropriate color palette:
   - Health Journey: Green (#00B383, #4DDBBA)
   - Care Journey: Orange (#FF8C42, #FFAD75)
   - Plan Journey: Blue (#3772FF, #5096FF)

2. **Component Integration**: These assets are used by the following design system components:
   - `JourneyHeader`: Uses journey-specific header images
   - `AchievementBadge`: Displays achievement images
   - `RewardCard`: Shows reward-related imagery
   - Various journey-specific UI components

3. **Theming Support**: Images should support both light and dark themes when applicable. Use the suffix `_light` or `_dark` for theme-specific assets.

## Adding New Images

When adding new images to the project:

1. Follow the established naming conventions
2. Optimize the image for mobile performance
3. Place it in the appropriate subdirectory
4. Update relevant documentation if introducing a new image category
5. Test the image rendering on multiple device sizes and resolutions

## Maintenance

Regularly review and optimize images to ensure they meet current standards and requirements. Consider batch optimization as part of the CI/CD pipeline to maintain performance standards.