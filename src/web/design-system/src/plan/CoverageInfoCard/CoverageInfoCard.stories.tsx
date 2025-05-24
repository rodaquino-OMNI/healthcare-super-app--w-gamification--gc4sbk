import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { CoverageInfoCard } from './CoverageInfoCard';
import { CoverageType } from '@austa/interfaces/plan/coverage.types';

const meta: Meta<typeof CoverageInfoCard> = {
  title: 'Plan/CoverageInfoCard',
  component: CoverageInfoCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A component that displays insurance coverage information in a card format. Designed for the Plan journey, it shows coverage type, details, limitations, and co-payment information if available.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    coverage: {
      description: 'Coverage information to display',
      control: 'object'
    },
    className: {
      description: 'Optional custom class name',
      control: 'text'
    },
    testID: {
      description: 'Optional test ID for testing',
      control: 'text'
    }
  }
};

export default meta;
type Story = StoryObj<typeof CoverageInfoCard>;

// Base coverage object for stories
const baseCoverage = {
  id: 'coverage-123',
  planId: 'plan-456',
  type: CoverageType.SPECIALIST_VISIT,
  details: 'Covers visits to in-network specialists with a focus on preventive care and early intervention. Includes initial consultation and follow-up visits.',
};

/**
 * Default story showing a coverage card with all information
 */
export const Default: Story = {
  args: {
    coverage: {
      ...baseCoverage,
      limitations: 'Limited to 10 visits per year. Referral from primary care physician required.',
      coPayment: 25
    }
  }
};

/**
 * Story showing a coverage card without limitations
 */
export const WithoutLimitations: Story = {
  args: {
    coverage: {
      ...baseCoverage,
      coPayment: 25
    }
  }
};

/**
 * Story showing a coverage card without co-payment
 */
export const WithoutCoPayment: Story = {
  args: {
    coverage: {
      ...baseCoverage,
      limitations: 'Limited to 10 visits per year. Referral from primary care physician required.'
    }
  }
};

/**
 * Story showing a coverage card with minimal information
 */
export const Minimal: Story = {
  args: {
    coverage: {
      ...baseCoverage
    }
  }
};

/**
 * Story showing different coverage types
 */
export const DifferentCoverageTypes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
      <CoverageInfoCard 
        coverage={{
          id: 'coverage-1',
          planId: 'plan-456',
          type: CoverageType.MEDICAL_VISIT,
          details: 'Covers regular doctor visits and check-ups.',
          coPayment: 15
        }}
      />
      <CoverageInfoCard 
        coverage={{
          id: 'coverage-2',
          planId: 'plan-456',
          type: CoverageType.EMERGENCY_CARE,
          details: 'Covers emergency room and urgent care services.',
          limitations: 'Requires notification within 24 hours of emergency visit.',
          coPayment: 50
        }}
      />
      <CoverageInfoCard 
        coverage={{
          id: 'coverage-3',
          planId: 'plan-456',
          type: CoverageType.PRESCRIPTION_DRUGS,
          details: 'Covers prescription medications with varying co-payments based on tier.',
          limitations: 'Some medications may require prior authorization.',
          coveragePercentage: 80
        }}
      />
    </div>
  )
};