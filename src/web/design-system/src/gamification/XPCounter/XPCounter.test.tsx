import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect, describe, it } from '@jest/globals';
import { ThemeProvider } from 'styled-components';
import XPCounter from './XPCounter';

// Import JourneyContext from the new package structure
import { JourneyProvider, JourneyContext } from '@austa/journey-context';

// Helper function to render components with theme
const renderWithTheme = (ui: React.ReactNode) => {
  // Create a mock theme object with journey colors
  // Updated to align with the new primitives structure
  const mockTheme = {
    spacing: {
      xs: '4px',
      sm: '8px',
      md: '16px',
      lg: '24px',
    },
    typography: {
      fontSize: {
        sm: '14px',
        md: '16px',
        lg: '18px',
      },
      fontWeight: {
        bold: 700,
      },
    },
    colors: {
      brand: {
        primary: '#0066CC',
      },
      neutral: {
        gray600: '#757575',
        gray200: '#EEEEEE',
      },
      journeys: {
        health: {
          primary: '#0ACF83',
          secondary: '#05A66A',
        },
        care: {
          primary: '#FF8C42',
          secondary: '#F17C3A',
        },
        plan: {
          primary: '#3A86FF',
          secondary: '#2D6FD9',
        },
      },
    },
    borderRadius: {
      md: '8px',
    },
  };

  return render(
    <ThemeProvider theme={mockTheme}>
      {ui}
    </ThemeProvider>
  );
};

// Helper function to render components with theme and journey context
const renderWithThemeAndJourneyContext = (ui: React.ReactNode, journey: string = 'health') => {
  // Create a mock theme object with journey colors
  const mockTheme = {
    spacing: {
      xs: '4px',
      sm: '8px',
      md: '16px',
      lg: '24px',
    },
    typography: {
      fontSize: {
        sm: '14px',
        md: '16px',
        lg: '18px',
      },
      fontWeight: {
        bold: 700,
      },
    },
    colors: {
      brand: {
        primary: '#0066CC',
      },
      neutral: {
        gray600: '#757575',
        gray200: '#EEEEEE',
      },
      journeys: {
        health: {
          primary: '#0ACF83',
          secondary: '#05A66A',
        },
        care: {
          primary: '#FF8C42',
          secondary: '#F17C3A',
        },
        plan: {
          primary: '#3A86FF',
          secondary: '#2D6FD9',
        },
      },
    },
    borderRadius: {
      md: '8px',
    },
  };

  // Mock JourneyContext value
  const mockJourneyContextValue = {
    currentJourney: journey,
    setCurrentJourney: jest.fn(),
    isJourneyAvailable: jest.fn().mockReturnValue(true),
    journeys: [
      { id: 'health', name: 'Minha Saúde' },
      { id: 'care', name: 'Cuidar-me Agora' },
      { id: 'plan', name: 'Meu Plano & Benefícios' },
    ],
  };

  return render(
    <ThemeProvider theme={mockTheme}>
      <JourneyContext.Provider value={mockJourneyContextValue}>
        {ui}
      </JourneyContext.Provider>
    </ThemeProvider>
  );
};

describe('XPCounter', () => {
  it('renders correctly with required props', () => {
    renderWithTheme(
      <XPCounter
        currentXP={500}
        nextLevelXP={1000}
        journey="health"
        testId="xp-counter"
      />
    );

    // Check XP value is displayed
    expect(screen.getByText('500 XP')).toBeInTheDocument();
    
    // Check remaining XP text
    expect(screen.getByText('500 XP para o próximo nível')).toBeInTheDocument();
    
    // Check progress bar exists
    expect(screen.getByTestId('xp-counter-progress')).toBeInTheDocument();
  });

  it('calculates and displays the correct remaining XP', () => {
    renderWithTheme(
      <XPCounter
        currentXP={450}
        nextLevelXP={1000}
        journey="health"
      />
    );

    // Verify remaining XP calculation (1000 - 450 = 550)
    expect(screen.getByText('550 XP para o próximo nível')).toBeInTheDocument();
  });

  it('applies journey-specific styling based on the journey prop', () => {
    // Test health journey
    const { rerender } = renderWithTheme(
      <XPCounter
        currentXP={500}
        nextLevelXP={1000}
        journey="health"
        testId="health-xp"
      />
    );

    const healthXPLabel = screen.getByText('500 XP');
    expect(healthXPLabel).toHaveStyle(`color: #0ACF83`);

    // Test care journey
    rerender(
      <ThemeProvider theme={mockTheme}>
        <XPCounter
          currentXP={500}
          nextLevelXP={1000}
          journey="care"
          testId="care-xp"
        />
      </ThemeProvider>
    );

    const careXPLabel = screen.getByText('500 XP');
    expect(careXPLabel).toHaveStyle(`color: #FF8C42`);

    // Test plan journey
    rerender(
      <ThemeProvider theme={mockTheme}>
        <XPCounter
          currentXP={500}
          nextLevelXP={1000}
          journey="plan"
          testId="plan-xp"
        />
      </ThemeProvider>
    );

    const planXPLabel = screen.getByText('500 XP');
    expect(planXPLabel).toHaveStyle(`color: #3A86FF`);
  });

  it('handles edge cases with currentXP equal to nextLevelXP', () => {
    renderWithTheme(
      <XPCounter
        currentXP={1000}
        nextLevelXP={1000}
        journey="health"
        testId="edge-xp"
      />
    );

    // Should show 0 XP remaining
    expect(screen.getByText('0 XP para o próximo nível')).toBeInTheDocument();
    
    // Progress bar should be at 100%
    const progressBar = screen.getByTestId('edge-xp-progress');
    expect(progressBar).toHaveAttribute('aria-valuenow', '100');
  });

  it('handles edge cases with currentXP greater than nextLevelXP', () => {
    renderWithTheme(
      <XPCounter
        currentXP={1500}
        nextLevelXP={1000}
        journey="health"
        testId="overflow-xp"
      />
    );

    // Should show 0 XP remaining
    expect(screen.getByText('0 XP para o próximo nível')).toBeInTheDocument();
    
    // Progress bar should be at 100% (capped)
    const progressBar = screen.getByTestId('overflow-xp-progress');
    expect(progressBar).toHaveAttribute('aria-valuenow', '100');
  });

  it('renders with optional level prop', () => {
    renderWithTheme(
      <XPCounter
        currentXP={500}
        nextLevelXP={1000}
        levelXP={0}
        level={5}
        journey="health"
        testId="level-xp"
      />
    );

    // Check aria-label includes level information
    const container = screen.getByTestId('level-xp');
    expect(container).toHaveAttribute('aria-label', expect.stringContaining('Level 5'));
  });

  it('is accessible with proper ARIA attributes', () => {
    renderWithTheme(
      <XPCounter
        currentXP={500}
        nextLevelXP={1000}
        journey="health"
        testId="a11y-xp"
      />
    );

    // Check progress bar has proper ARIA attributes
    const progressBar = screen.getByTestId('a11y-xp-progress');
    expect(progressBar).toHaveAttribute('role', 'progressbar');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
    expect(progressBar).toHaveAttribute('aria-label', expect.stringContaining('50% progress'));
    
    // Check the XP counter container has appropriate aria-label
    const container = screen.getByTestId('a11y-xp');
    expect(container).toHaveAttribute('aria-label', expect.stringContaining('500 XP, 500 XP to next level'));
  });

  // New tests for journey context integration
  it('applies journey-specific styling from JourneyContext when no journey prop is provided', () => {
    // Test health journey from context
    renderWithThemeAndJourneyContext(
      <XPCounter
        currentXP={500}
        nextLevelXP={1000}
        testId="context-health-xp"
      />,
      'health'
    );

    const healthXPLabel = screen.getByText('500 XP');
    expect(healthXPLabel).toHaveStyle(`color: #0ACF83`);
  });

  it('prioritizes explicit journey prop over JourneyContext value', () => {
    // Provide care journey via prop but health via context
    renderWithThemeAndJourneyContext(
      <XPCounter
        currentXP={500}
        nextLevelXP={1000}
        journey="care"
        testId="prop-priority-xp"
      />,
      'health'
    );

    const xpLabel = screen.getByText('500 XP');
    // Should use care color from prop, not health from context
    expect(xpLabel).toHaveStyle(`color: #FF8C42`);
  });

  it('supports all journey types from context', () => {
    // Test care journey from context
    const { rerender } = renderWithThemeAndJourneyContext(
      <XPCounter
        currentXP={500}
        nextLevelXP={1000}
        testId="context-care-xp"
      />,
      'care'
    );

    let xpLabel = screen.getByText('500 XP');
    expect(xpLabel).toHaveStyle(`color: #FF8C42`);

    // Test plan journey from context
    rerender(
      <ThemeProvider theme={mockTheme}>
        <JourneyContext.Provider 
          value={{
            currentJourney: 'plan',
            setCurrentJourney: jest.fn(),
            isJourneyAvailable: jest.fn().mockReturnValue(true),
            journeys: [
              { id: 'health', name: 'Minha Saúde' },
              { id: 'care', name: 'Cuidar-me Agora' },
              { id: 'plan', name: 'Meu Plano & Benefícios' },
            ],
          }}
        >
          <XPCounter
            currentXP={500}
            nextLevelXP={1000}
            testId="context-plan-xp"
          />
        </JourneyContext.Provider>
      </ThemeProvider>
    );

    xpLabel = screen.getByText('500 XP');
    expect(xpLabel).toHaveStyle(`color: #3A86FF`);
  });

  it('maintains internationalization support with journey context', () => {
    renderWithThemeAndJourneyContext(
      <XPCounter
        currentXP={500}
        nextLevelXP={1000}
        testId="i18n-context-xp"
      />,
      'health'
    );

    // Check remaining XP text is properly localized
    expect(screen.getByText('500 XP para o próximo nível')).toBeInTheDocument();
  });
});