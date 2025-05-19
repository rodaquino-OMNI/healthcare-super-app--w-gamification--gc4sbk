# App Identity Assets

This directory contains core application-level image assets for the AUSTA SuperApp. These assets define the visual identity of the application across different platforms and are critical for app building, store submissions, and the runtime mobile UI experience.

## Asset Types

This directory includes the following types of app identity assets:

### App Icons

Icons that represent the application on device home screens, app stores, and within the operating system. These must be provided in multiple resolutions to support different devices and platforms.

### Splash Screens

Images displayed during application startup. These create the initial brand impression and provide visual continuity during loading.

### Notification Icons

Smaller, simplified versions of the app icon used in system notifications. These must follow platform-specific guidelines for transparency and color.

### Navigation Bar Icons

Icons used in the application's navigation bar that represent the AUSTA SuperApp brand.

## Naming Conventions

All app identity assets must follow these naming conventions:

```
app_[asset_type]_[platform]_[size].[file_extension]
```

Examples:
- `app_icon_ios_1024x1024.png`
- `app_splash_android_xxxhdpi.png`
- `app_notification_ios_60x60.png`

For adaptive icons (Android):
```
app_icon_android_adaptive_[foreground/background].[file_extension]
```

## Required Formats and Resolutions

### iOS

| Asset Type | Format | Resolutions |
|------------|--------|-------------|
| App Icon | PNG | 1024x1024 (App Store), 180x180 (iPhone 6+), 120x120 (iPhone), 167x167 (iPad Pro), 152x152 (iPad), 80x80 (Spotlight), 58x58 (Settings) |
| Splash Screen | PNG | 2732x2732 (Universal) |
| Notification Icon | PNG | 60x60, 40x40, 30x30 |

### Android

| Asset Type | Format | Resolutions |
|------------|--------|-------------|
| App Icon | PNG | 512x512 (Play Store), 192x192 (xxxhdpi), 144x144 (xxhdpi), 96x96 (xhdpi), 72x72 (hdpi), 48x48 (mdpi) |
| Adaptive Icon | PNG | 432x432 (foreground), 432x432 (background) |
| Splash Screen | PNG | 1242x2688 (xxxhdpi), 1080x1920 (xxhdpi), 720x1280 (xhdpi) |
| Notification Icon | PNG | 96x96 (xxxhdpi), 72x72 (xxhdpi), 48x48 (xhdpi), 36x36 (hdpi), 24x24 (mdpi) |

### Web

| Asset Type | Format | Resolutions |
|------------|--------|-------------|
| Favicon | ICO, PNG | 16x16, 32x32, 48x48, 64x64 |
| App Icon | PNG | 192x192, 512x512 |
| Splash Image | PNG, JPG | 1200x630 |

## Integration with app.json

These assets are referenced in the `app.json` configuration file, which is used by Expo and React Native during the build process. The configuration specifies paths to these assets for different platforms and purposes.

Example configuration in `app.json`:

```json
{
  "expo": {
    "name": "AUSTA SuperApp",
    "icon": "./src/assets/images/app/app_icon_universal.png",
    "splash": {
      "image": "./src/assets/images/app/app_splash_universal.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.austa.superapp",
      "icon": "./src/assets/images/app/app_icon_ios_1024x1024.png"
    },
    "android": {
      "package": "com.austa.superapp",
      "adaptiveIcon": {
        "foregroundImage": "./src/assets/images/app/app_icon_android_adaptive_foreground.png",
        "backgroundImage": "./src/assets/images/app/app_icon_android_adaptive_background.png"
      }
    }
  }
}
```

## Usage Guidelines

### In Code

When referencing app identity assets in code, use the following pattern:

```javascript
import { Image } from 'react-native';
import appIcon from '@app/assets/images/app/app_icon_universal.png';

// Usage
<Image source={appIcon} style={styles.icon} />
```

### For Build Systems

During the build process, these assets are automatically processed according to the configuration in `app.json`. Ensure that all required assets are present before initiating a build to avoid build failures.

## Updating Assets

When updating app identity assets, follow these guidelines:

1. **Maintain Consistency**: Ensure visual consistency across all platforms and sizes.
2. **Preserve Transparency**: For icons that require transparency, ensure the transparency is preserved in all formats.
3. **Test on All Platforms**: Verify that updated assets display correctly on all target platforms.
4. **Update All Sizes**: When updating an asset, update all required sizes to maintain consistency.
5. **Version Control**: Include a version number or date in commit messages when updating assets.
6. **Optimize File Size**: Compress images appropriately to minimize app bundle size without sacrificing quality.

## Platform Submission Requirements

### App Store (iOS)

- App Icon: 1024x1024 PNG with no alpha channel
- Screenshots: Various sizes depending on device types

### Google Play Store (Android)

- App Icon: 512x512 PNG
- Feature Graphic: 1024x500 PNG
- Screenshots: Various sizes depending on device types

## Important Notes

- Do not modify or remove existing assets without updating their references in `app.json` and throughout the codebase.
- All assets should be optimized for file size without compromising quality.
- Follow platform-specific guidelines for icon design to ensure the best user experience.
- Keep backup copies of source files (e.g., PSD, AI) in a separate repository or storage system.