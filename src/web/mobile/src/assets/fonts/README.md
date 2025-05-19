# Fonts

This directory contains font files used in the AUSTA SuperApp mobile application.

## Current Font Implementation

While the AUSTA design system has been updated to use the **Inter** font family (`font-family: Inter`), the mobile application currently maintains **Roboto** for compatibility reasons. This approach ensures consistent rendering across all Android and iOS devices while the design system transition is completed.

## Integration with Design System

The typography system is now defined in the `@design-system/primitives` package, which contains all design tokens including typography definitions. The mobile app consumes these tokens while applying the Roboto font family for rendering.

### Typography Token Integration

To use typography tokens in your components:

```tsx
import { typography } from '@design-system/primitives';
import { Text } from 'react-native';

const MyComponent = () => (
  <Text style={{
    fontFamily: 'Roboto-Regular', // Mobile-specific override
    fontSize: typography.size.md,
    lineHeight: typography.lineHeight.md,
    letterSpacing: typography.letterSpacing.normal
  }}>
    Hello World
  </Text>
);
```

## Adding New Fonts

To add new fonts to the mobile application:

1. Place the font files (e.g., `.ttf`, `.otf`) in this directory.

2. Register the fonts in `react-native.config.js` at the root of the mobile app:

   ```js
   module.exports = {
     project: {
       ios: {},
       android: {},
     },
     assets: ['./src/assets/fonts/'],
   };
   ```

3. Run the following command to link the fonts:

   ```bash
   npx react-native-asset
   ```

4. For iOS, you may need to add the font files to your Xcode project and update the Info.plist file.

5. Update the application's styling to reference the new font files, integrating with typography tokens:

   ```tsx
   import { typography } from '@design-system/primitives';
   
   // Use the typography tokens with your custom font
   const styles = StyleSheet.create({
     heading: {
       fontFamily: 'YourNewFont-Bold',
       fontSize: typography.size.xl,
       lineHeight: typography.lineHeight.xl,
     }
   });
   ```

## Font Compatibility Notes

### Working with Both Roboto and Inter

During the transition period, you may need to work with both Roboto (mobile app) and Inter (design system). Here are some guidelines:

- Use the typography tokens from `@design-system/primitives` for size, weight, line height, and letter spacing
- Override the `fontFamily` property to use Roboto in mobile components
- When creating new components, follow the mobile app's font convention (Roboto) while adhering to the design system's typography scale

### Font Weight Mapping

Roboto and Inter have slightly different weight distributions. Use this mapping to ensure consistency:

| Design Token | Inter (Design System) | Roboto (Mobile App) |
|--------------|------------------------|---------------------|
| thin         | Inter-Thin             | Roboto-Thin         |
| extraLight   | Inter-ExtraLight       | Roboto-Thin         |
| light        | Inter-Light            | Roboto-Light        |
| regular      | Inter-Regular          | Roboto-Regular      |
| medium       | Inter-Medium           | Roboto-Medium       |
| semiBold     | Inter-SemiBold         | Roboto-Medium       |
| bold         | Inter-Bold             | Roboto-Bold         |
| extraBold    | Inter-ExtraBold        | Roboto-Bold         |
| black        | Inter-Black            | Roboto-Black        |

## Licensing

Ensure that all font files are properly licensed for use in the application. The current fonts have the following licenses:

- **Roboto**: Apache License, Version 2.0
- **Inter**: SIL Open Font License 1.1

## Troubleshooting

If fonts are not displaying correctly:

1. Verify that the font files are correctly placed in this directory
2. Check that `react-native.config.js` is properly configured
3. Ensure you've run `npx react-native-asset` after adding new fonts
4. For iOS, verify that the fonts are included in the Xcode project and Info.plist
5. Clear the build cache and rebuild the application

```bash
# Clear cache and rebuild
npx react-native start --reset-cache
```