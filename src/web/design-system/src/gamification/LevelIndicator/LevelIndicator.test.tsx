import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from '@jest/globals';
import { LevelIndicator } from './LevelIndicator';

// Mock @design-system/primitives/tokens
jest.mock('@design-system/primitives/tokens', () => ({
  colors: {
    journeys: {
      health: { 
        primary: '#0ACF83', 
        secondary: '#05A66A',
        background: '#F0FFF4',
        text: '#1A1A1A'
      },
      care: { 
        primary: '#FF8C42', 
        secondary: '#F17C3A',
        background: '#FFF8F0',
        text: '#1A1A1A'
      },
      plan: { 
        primary: '#3A86FF', 
        secondary: '#2D6FD9',
        background: '#F0F8FF',
        text: '#1A1A1A'
      }
    },
    neutral: { 
      gray700: '#616161',
      white: '#FFFFFF'
    }
  },
  spacing: { 
    xs: '4px', 
    sm: '8px', 
    md: '16px', 
    lg: '24px'
  },
  typography: {
    fontSize: { 
      sm: '14px', 
      md: '16px',
      lg: '18px', 
      xl: '20px'
    },
    fontWeight: { 
      regular: 400,
      medium: 500,
      bold: 700
    },
    lineHeight: {
      base: 1.5,
      tight: 1.2,
      loose: 1.8
    }
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '16px',
    pill: '999px'
  }
}));

// Mock @austa/interfaces/gamification
jest.mock('@austa/interfaces/gamification', () => ({
  JourneyType: {
    HEALTH: 'health',
    CARE: 'care',
    PLAN: 'plan'
  },
  LevelTitles: {
    1: 'Iniciante',
    2: 'Aprendiz',
    3: 'Praticante',
    4: 'Especialista',
    5: 'Aventureiro',
    6: 'Mestre',
    7: 'Campeão',
    8: 'Lendário',
    9: 'Mítico',
    10: 'Transcendente'
  },
  // Export type definitions as values for testing
  Achievement: 'Achievement',
  LevelIndicatorProps: 'LevelIndicatorProps'
}));

// Mock @austa/journey-context
jest.mock('@austa/journey-context', () => ({
  useJourneyTheme: (journey: string) => ({
    colors: {
      primary: journey === 'health' ? '#0ACF83' : journey === 'care' ? '#FF8C42' : '#3A86FF',
      secondary: journey === 'health' ? '#05A66A' : journey === 'care' ? '#F17C3A' : '#2D6FD9',
      background: journey === 'health' ? '#F0FFF4' : journey === 'care' ? '#FFF8F0' : '#F0F8FF',
      text: '#1A1A1A'
    },
    name: journey,
    getJourneyColor: (colorType: string) => {
      if (colorType === 'primary') {
        return journey === 'health' ? '#0ACF83' : journey === 'care' ? '#FF8C42' : '#3A86FF';
      } else if (colorType === 'secondary') {
        return journey === 'health' ? '#05A66A' : journey === 'care' ? '#F17C3A' : '#2D6FD9';
      } else if (colorType === 'background') {
        return journey === 'health' ? '#F0FFF4' : journey === 'care' ? '#FFF8F0' : '#F0F8FF';
      } else {
        return '#1A1A1A';
      }
    }
  }),
  JourneyProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

// Mock styled-components
jest.mock('styled-components', () => {
  const originalModule = jest.requireActual('styled-components');
  
  return {
    ...originalModule,
    ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
    useTheme: () => ({
      colors: {
        journeys: {
          health: { 
            primary: '#0ACF83', 
            secondary: '#05A66A',
            background: '#F0FFF4',
            text: '#1A1A1A'
          },
          care: { 
            primary: '#FF8C42', 
            secondary: '#F17C3A',
            background: '#FFF8F0',
            text: '#1A1A1A'
          },
          plan: { 
            primary: '#3A86FF', 
            secondary: '#2D6FD9',
            background: '#F0F8FF',
            text: '#1A1A1A'
          }
        },
        neutral: { 
          gray700: '#616161',
          white: '#FFFFFF'
        }
      },
      spacing: { 
        xs: '4px', 
        sm: '8px', 
        md: '16px', 
        lg: '24px'
      },
      typography: {
        fontSize: { 
          sm: '14px', 
          lg: '18px', 
          xl: '20px'
        },
        fontWeight: { 
          bold: 700
        },
        lineHeight: {
          base: 1.5
        }
      },
      borderRadius: {
        md: '8px'
      }
    })
  };
});

// Mock child components
jest.mock('../XPCounter/XPCounter', () => ({
  XPCounter: ({ currentXP, nextLevelXP, journey }: any) => (
    <div data-testid="xp-counter" data-current-xp={currentXP} data-next-level-xp={nextLevelXP} data-journey={journey}>
      XP Counter
    </div>
  )
}));

jest.mock('../AchievementBadge/AchievementBadge', () => ({
  AchievementBadge: ({ achievement, size, journeyTheme }: any) => (
    <div 
      data-testid="achievement-badge" 
      data-achievement-id={achievement.id} 
      data-size={size}
      data-journey-theme={journeyTheme?.name}
    >
      {achievement.title}
    </div>
  )
}));

// Mock @design-system/primitives components
jest.mock('@design-system/primitives', () => ({
  Box: ({ children, ...props }: any) => <div data-testid="primitives-box" {...props}>{children}</div>,
  Text: ({ children, ...props }: any) => <span data-testid="primitives-text" {...props}>{children}</span>,
  Stack: ({ children, ...props }: any) => <div data-testid="primitives-stack" {...props}>{children}</div>,
  Touchable: ({ children, onPress, ...props }: any) => (
    <button data-testid="primitives-touchable" onClick={onPress} {...props}>{children}</button>
  ),
  Icon: ({ name, size, color, ...props }: any) => (
    <span 
      data-testid="primitives-icon" 
      data-icon-name={name} 
      data-icon-size={size} 
      data-icon-color={color} 
      {...props}
    />
  )
}));

describe('LevelIndicator', () => {
  it('renders the LevelIndicator component with correct level and XP', () => {
    render(
      <LevelIndicator 
        level={5} 
        currentXp={500} 
        nextLevelXp={1000} 
        journey="health" 
      />
    );
    
    // Check level display
    expect(screen.getByText(/Nível 5/i)).toBeInTheDocument();
    expect(screen.getByText(/- Aventureiro/i)).toBeInTheDocument();
    
    // Check XP Counter is rendered with correct props
    const xpCounter = screen.getByTestId('xp-counter');
    expect(xpCounter).toBeInTheDocument();
    expect(xpCounter).toHaveAttribute('data-current-xp', '500');
    expect(xpCounter).toHaveAttribute('data-next-level-xp', '1000');
    expect(xpCounter).toHaveAttribute('data-journey', 'health');
  });

  it('applies journey-specific styling to the LevelIndicator component', () => {
    // Health journey
    const { rerender } = render(
      <LevelIndicator 
        level={5} 
        currentXp={500} 
        nextLevelXp={1000} 
        journey="health" 
      />
    );
    
    let xpCounter = screen.getByTestId('xp-counter');
    expect(xpCounter).toHaveAttribute('data-journey', 'health');
    
    // Care journey
    rerender(
      <LevelIndicator 
        level={5} 
        currentXp={500} 
        nextLevelXp={1000} 
        journey="care" 
      />
    );
    
    xpCounter = screen.getByTestId('xp-counter');
    expect(xpCounter).toHaveAttribute('data-journey', 'care');
    
    // Plan journey
    rerender(
      <LevelIndicator 
        level={5} 
        currentXp={500} 
        nextLevelXp={1000} 
        journey="plan" 
      />
    );
    
    xpCounter = screen.getByTestId('xp-counter');
    expect(xpCounter).toHaveAttribute('data-journey', 'plan');
  });

  it('renders with a recent achievement when provided', () => {
    const recentAchievement = {
      id: 'test-achievement',
      title: 'Test Achievement',
      description: 'This is a test achievement',
      icon: 'trophy',
      progress: 1,
      total: 1,
      unlocked: true,
      journey: 'health'
    };
    
    render(
      <LevelIndicator 
        level={5} 
        currentXp={500} 
        nextLevelXp={1000} 
        journey="health" 
        recentAchievement={recentAchievement} 
      />
    );
    
    // Check achievement badge is rendered
    const achievementBadge = screen.getByTestId('achievement-badge');
    expect(achievementBadge).toBeInTheDocument();
    expect(achievementBadge).toHaveAttribute('data-achievement-id', 'test-achievement');
    
    // Check achievement text is displayed
    expect(screen.getByText(/Nova conquista:/i)).toBeInTheDocument();
    expect(screen.getByText('Test Achievement')).toBeInTheDocument();
  });

  it('does not render achievement section when no recent achievement is provided', () => {
    render(
      <LevelIndicator 
        level={5} 
        currentXp={500} 
        nextLevelXp={1000} 
        journey="health" 
      />
    );
    
    // Check achievement badge is not rendered
    expect(screen.queryByTestId('achievement-badge')).not.toBeInTheDocument();
    expect(screen.queryByText(/Nova conquista:/i)).not.toBeInTheDocument();
  });

  it('provides appropriate accessibility attributes', () => {
    render(
      <LevelIndicator 
        level={5} 
        currentXp={500} 
        nextLevelXp={1000} 
        journey="health" 
      />
    );
    
    const container = screen.getByLabelText(/Nível 5 - Aventureiro. 500 XP atual. 500 XP para o próximo nível./i);
    expect(container).toBeInTheDocument();
  });

  it('uses the journey theme from useJourneyTheme hook', () => {
    render(
      <LevelIndicator 
        level={5} 
        currentXp={500} 
        nextLevelXp={1000} 
        journey="health" 
      />
    );
    
    // The component should use the useJourneyTheme hook which is mocked
    // We can verify this by checking that the XPCounter has the correct journey prop
    const xpCounter = screen.getByTestId('xp-counter');
    expect(xpCounter).toHaveAttribute('data-journey', 'health');
    
    // Check that primitive components are used
    expect(screen.getAllByTestId('primitives-box').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('primitives-text').length).toBeGreaterThan(0);
  });
  
  it('passes journey theme to AchievementBadge when rendering achievements', () => {
    const recentAchievement = {
      id: 'test-achievement',
      title: 'Test Achievement',
      description: 'This is a test achievement',
      icon: 'trophy',
      progress: 1,
      total: 1,
      unlocked: true,
      journey: 'health'
    };
    
    render(
      <LevelIndicator 
        level={5} 
        currentXp={500} 
        nextLevelXp={1000} 
        journey="health" 
        recentAchievement={recentAchievement} 
      />
    );
    
    // Check that the AchievementBadge receives the journey theme
    const achievementBadge = screen.getByTestId('achievement-badge');
    expect(achievementBadge).toHaveAttribute('data-journey-theme', 'health');
  });
});