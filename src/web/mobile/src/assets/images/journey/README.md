# Journey Image Assets

## Overview

This directory contains all journey-specific image assets for the AUSTA SuperApp mobile application. These assets are essential for maintaining the visual identity of each journey and ensuring consistent user experience across the platform.

The AUSTA SuperApp is built around three distinct user journeys:

1. **Health Journey** ("Minha Saúde") - Green theme
2. **Care Journey** ("Cuidar-me Agora") - Orange theme
3. **Plan Journey** ("Meu Plano & Benefícios") - Blue theme

## Naming Convention

All journey-specific images must follow this naming pattern:

```
journey_[journeyType]_[imagePurpose].[extension]
```

Where:
- `journeyType`: One of `health`, `care`, or `plan`
- `imagePurpose`: Descriptive name of the image's purpose (e.g., `header`, `icon`, `background`)
- `extension`: File format extension (see supported formats below)

Examples:
- `journey_health_header.png`
- `journey_care_icon_appointment.svg`
- `journey_plan_background.png`

## Color Guidelines

Each journey has a specific color palette that must be maintained across all visual assets:

### Health Journey (Green)
- Primary: `#00B383`
- Secondary: `#4DDBBA`
- Use these colors for all Health journey icons, illustrations, and UI elements

### Care Journey (Orange)
- Primary: `#FF8C42`
- Secondary: `#FFAD75`
- Use these colors for all Care journey icons, illustrations, and UI elements

### Plan Journey (Blue)
- Primary: `#3772FF`
- Secondary: `#5096FF`
- Use these colors for all Plan journey icons, illustrations, and UI elements

## Image Format Requirements

### Supported Formats

- **SVG**: Preferred format for icons and simple illustrations (vector-based)
- **PNG**: Use for complex illustrations with transparency
- **JPG**: Use only for photographic content without transparency needs

### Size Requirements

- **Icons**: 24×24dp, 36×36dp, 48×48dp (provide all three sizes)
- **Headers**: 750×250dp @3x with responsive variants
- **Backgrounds**: 1125×2436px @3x (iPhone X and newer)

### Optimization Guidelines

- All bitmap assets must be optimized for mobile performance
- SVGs should be optimized with tools like SVGO
- PNGs should be compressed with tools like TinyPNG
- Maximum file size for icons: 10KB
- Maximum file size for headers: 100KB
- Maximum file size for backgrounds: 200KB

## Usage Patterns

### JourneyHeader Component

Header images are used in the JourneyHeader component to visually identify each journey:

```jsx
<JourneyHeader 
  journeyType="health" 
  imageSource={require('../assets/images/journey/journey_health_header.png')} 
/>
```

### Navigation Components

Journey icons are used in navigation components to represent journey sections:

```jsx
<JourneyTab 
  journeyType="care" 
  icon={require('../assets/images/journey/journey_care_icon_appointment.svg')} 
  label="Appointments" 
/>
```

### Journey-Specific UI Elements

Background images and decorative elements enhance journey-specific screens:

```jsx
<JourneyScreen 
  journeyType="plan" 
  backgroundImage={require('../assets/images/journey/journey_plan_background.png')} 
>
  {/* Screen content */}
</JourneyScreen>
```

## Related Design System Components

These journey images are consumed by the following design system components:

- `@austa/design-system`: Main package containing all journey-themed components
  - `src/health/*`: Health journey components
  - `src/care/*`: Care journey components
  - `src/plan/*`: Plan journey components

- `@design-system/primitives`: Contains primitive components that may use journey images
  - `src/components/Icon`: Icon component that renders journey-specific SVGs

- `@austa/journey-context`: Provides context for journey-specific theming
  - Uses journey type to determine which images to display

## Directory Structure

```
src/web/mobile/src/assets/images/journey/
├── health/                  # Health journey specific images
│   ├── icons/               # Health journey icons
│   ├── headers/             # Health journey header images
│   └── backgrounds/         # Health journey background images
├── care/                    # Care journey specific images
│   ├── icons/               # Care journey icons
│   ├── headers/             # Care journey header images
│   └── backgrounds/         # Care journey background images
├── plan/                    # Plan journey specific images
│   ├── icons/               # Plan journey icons
│   ├── headers/             # Plan journey header images
│   └── backgrounds/         # Plan journey background images
└── shared/                  # Images shared across journeys
    └── icons/               # Shared journey icons
```

## Cross-Journey Gamification

Some images in this directory support the cross-journey gamification system. These assets follow the same naming convention but may incorporate elements from multiple journey color palettes:

```
journey_gamification_[imagePurpose].[extension]
```

Example: `journey_gamification_achievement_health.svg`

## Platform Independence

While these assets are optimized for the mobile application, they should maintain visual consistency with their web counterparts. The web application uses similar assets located at:

```
src/web/web/public/images/journey/
```

## Contributing New Journey Images

When adding new journey images:

1. Follow the naming convention strictly
2. Adhere to the color guidelines for the specific journey
3. Optimize the image according to the format requirements
4. Place the image in the appropriate subdirectory
5. Update this README if you're adding a new image category
6. Test the image in both light and dark mode

## Accessibility Considerations

When creating journey images, ensure:

1. Sufficient contrast between foreground and background elements
2. Text embedded in images meets WCAG 2.1 AA contrast standards
3. Decorative images are marked appropriately in code
4. Informative images have proper alt text in implementation

---

For questions or clarifications about journey image assets, contact the Design System team.