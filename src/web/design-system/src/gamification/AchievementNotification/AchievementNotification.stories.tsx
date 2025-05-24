import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { AchievementNotification } from './AchievementNotification';
import { AchievementCategory } from '@austa/interfaces/gamification/achievements';
import { Box, Button } from '@design-system/primitives/components';

const meta: Meta<typeof AchievementNotification> = {
  title: 'Gamification/AchievementNotification',
  component: AchievementNotification,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof AchievementNotification>;

// Mock achievement data for health journey
const healthAchievement = {
  id: 'achievement-123',
  title: 'First Steps',
  description: 'Complete your first health assessment',
  category: AchievementCategory.HEALTH,
  journey: 'health',
  icon: 'trophy',
  points: 50,
  rarity: 'common',
  imageUrl: '/images/achievements/first-steps.png',
  badgeUrl: '/images/badges/first-steps.png',
  tier: 1,
  progress: {
    current: 1,
    required: 1,
    percentage: 100,
    lastUpdated: new Date(),
  },
  unlocked: true,
  unlockedAt: new Date(),
};

// Mock achievement data for care journey
const careAchievement = {
  id: 'achievement-456',
  title: 'First Appointment',
  description: 'Schedule your first telemedicine appointment',
  category: AchievementCategory.CARE,
  journey: 'care',
  icon: 'calendar',
  points: 75,
  rarity: 'common',
  imageUrl: '/images/achievements/first-appointment.png',
  badgeUrl: '/images/badges/first-appointment.png',
  tier: 1,
  progress: {
    current: 1,
    required: 1,
    percentage: 100,
    lastUpdated: new Date(),
  },
  unlocked: true,
  unlockedAt: new Date(),
};

// Mock achievement data for plan journey
const planAchievement = {
  id: 'achievement-789',
  title: 'Plan Explorer',
  description: 'View all available insurance plans',
  category: AchievementCategory.PLAN,
  journey: 'plan',
  icon: 'document',
  points: 60,
  rarity: 'common',
  imageUrl: '/images/achievements/plan-explorer.png',
  badgeUrl: '/images/badges/plan-explorer.png',
  tier: 1,
  progress: {
    current: 1,
    required: 1,
    percentage: 100,
    lastUpdated: new Date(),
  },
  unlocked: true,
  unlockedAt: new Date(),
};

// Interactive story with button to trigger notification
const InteractiveTemplate = () => {
  const [visible, setVisible] = useState(false);
  const [journey, setJourney] = useState('health');
  const [achievement, setAchievement] = useState(healthAchievement);
  
  const handleShowNotification = (journeyType: string) => {
    setJourney(journeyType);
    
    switch (journeyType) {
      case 'care':
        setAchievement(careAchievement);
        break;
      case 'plan':
        setAchievement(planAchievement);
        break;
      default:
        setAchievement(healthAchievement);
        break;
    }
    
    setVisible(true);
  };
  
  return (
    <Box>
      <Box marginBottom="md">
        <Button 
          variant="primary" 
          journey="health" 
          onPress={() => handleShowNotification('health')}
        >
          Show Health Achievement
        </Button>
      </Box>
      
      <Box marginBottom="md">
        <Button 
          variant="primary" 
          journey="care" 
          onPress={() => handleShowNotification('care')}
        >
          Show Care Achievement
        </Button>
      </Box>
      
      <Box marginBottom="md">
        <Button 
          variant="primary" 
          journey="plan" 
          onPress={() => handleShowNotification('plan')}
        >
          Show Plan Achievement
        </Button>
      </Box>
      
      <AchievementNotification
        achievement={achievement}
        visible={visible}
        onClose={() => setVisible(false)}
      />
    </Box>
  );
};

export const Interactive: Story = {
  render: () => <InteractiveTemplate />,
};

export const HealthJourney: Story = {
  args: {
    achievement: healthAchievement,
    visible: true,
    onClose: () => {},
  },
};

export const CareJourney: Story = {
  args: {
    achievement: careAchievement,
    visible: true,
    onClose: () => {},
  },
};

export const PlanJourney: Story = {
  args: {
    achievement: planAchievement,
    visible: true,
    onClose: () => {},
  },
};