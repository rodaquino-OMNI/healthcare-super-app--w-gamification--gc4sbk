# AchievementNotification Component

The `AchievementNotification` component displays a modal notification when users unlock achievements in the AUSTA SuperApp. It shows the achievement badge, title, and description with journey-specific theming.

## Features

- Modal notification for unlocked achievements
- Journey-specific theming based on the achievement's journey property
- Accessible design with proper ARIA attributes
- Responsive layout that works on both web and mobile platforms
- Customizable visibility control

## Usage

```tsx
import { AchievementNotification } from '@austa/design-system/src/gamification/AchievementNotification';
import { Achievement } from '@austa/interfaces/gamification/achievements';

const MyComponent = () => {
  const [showNotification, setShowNotification] = useState(true);
  const achievement: Achievement = {
    id: '123',
    title: 'First Steps',
    description: 'Complete your first health check',
    icon: 'heart-pulse',
    journey: 'health',
    unlocked: true,
    progress: 1,
    total: 1
  };

  return (
    <AchievementNotification
      achievement={achievement}
      onDismiss={() => setShowNotification(false)}
      isVisible={showNotification}
    />
  );
};
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `achievement` | `Achievement` | Yes | - | The achievement to display in the notification |
| `onDismiss` | `() => void` | Yes | - | Callback function called when the notification is dismissed |
| `isVisible` | `boolean` | No | `true` | Whether the notification is visible |

## Journey-Specific Theming

The component automatically applies journey-specific theming based on the `journey` property of the achievement:

- **Health Journey**: Green color scheme
- **Care Journey**: Orange color scheme
- **Plan Journey**: Blue color scheme

If the achievement doesn't specify a journey, the component will use the active journey from the journey context.

## Accessibility

The component includes the following accessibility features:

- Proper ARIA role (`dialog`)
- Modal attribute (`aria-modal="true"`)
- Labeled by the achievement title (`aria-labelledby="achievement-title"`)
- Described by the achievement description (`aria-describedby="achievement-description"`)
- Accessible button for dismissing the notification

## Dependencies

- `@design-system/primitives`: For Box and Text components
- `@austa/interfaces/gamification/achievements`: For Achievement interface
- `@austa/journey-context/src/hooks`: For useJourney hook
- `../AchievementBadge`: For displaying the achievement badge