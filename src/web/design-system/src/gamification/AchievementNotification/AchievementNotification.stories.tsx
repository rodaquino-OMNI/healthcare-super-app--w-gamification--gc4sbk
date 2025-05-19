import React from 'react';
import { Story, Meta } from '@storybook/react';
import { AchievementNotification, AchievementNotificationProps } from './AchievementNotification';

export default {
  title: 'Gamification/AchievementNotification',
  component: AchievementNotification,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A modal notification that appears when users unlock achievements. Features journey-specific theming and an achievement badge.',
      },
    },
  },
  argTypes: {
    onDismiss: { action: 'dismissed' },
  },
} as Meta;

const Template: Story<AchievementNotificationProps> = (args) => <AchievementNotification {...args} />;

export const HealthJourney = Template.bind({});
HealthJourney.args = {
  achievement: {
    id: 'health-achievement-1',
    title: 'Health Milestone',
    description: 'You completed your first health check. Keep up the good work!',
    icon: 'heart-pulse',
    journey: 'health',
    unlocked: true,
    progress: 1,
    total: 1,
  },
  isVisible: true,
};

export const CareJourney = Template.bind({});
CareJourney.args = {
  achievement: {
    id: 'care-achievement-1',
    title: 'Care Champion',
    description: 'You scheduled your first appointment. Taking care of yourself is important!',
    icon: 'stethoscope',
    journey: 'care',
    unlocked: true,
    progress: 1,
    total: 1,
  },
  isVisible: true,
};

export const PlanJourney = Template.bind({});
PlanJourney.args = {
  achievement: {
    id: 'plan-achievement-1',
    title: 'Plan Explorer',
    description: 'You reviewed all your plan benefits. Knowledge is power!',
    icon: 'shield-check',
    journey: 'plan',
    unlocked: true,
    progress: 1,
    total: 1,
  },
  isVisible: true,
};

export const LongDescription = Template.bind({});
LongDescription.args = {
  achievement: {
    id: 'long-description',
    title: 'Dedicated Health Tracker',
    description: 'You have logged your health metrics consistently for 30 days straight. This kind of dedication leads to better health outcomes and helps you stay aware of your health trends over time.',
    icon: 'calendar-check',
    journey: 'health',
    unlocked: true,
    progress: 30,
    total: 30,
  },
  isVisible: true,
};

export const Hidden = Template.bind({});
Hidden.args = {
  achievement: {
    id: 'hidden-achievement',
    title: 'Hidden Achievement',
    description: 'This achievement notification is not visible.',
    icon: 'eye-slash',
    journey: 'health',
    unlocked: true,
    progress: 1,
    total: 1,
  },
  isVisible: false,
};
Hidden.parameters = {
  docs: {
    description: {
      story: 'When `isVisible` is set to `false`, the notification is not rendered.',
    },
  },
};