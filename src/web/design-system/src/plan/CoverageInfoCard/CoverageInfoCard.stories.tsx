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
        component: 'A card component that displays insurance coverage information for the Plan journey.'
      }
    }
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof CoverageInfoCard>;

/**
 * Basic example of the CoverageInfoCard component with all information provided.
 */
export const Default: Story = {
  args: {
    coverage: {
      id: 'coverage-123',
      type: 'medical_visit' as CoverageType,
      details: 'Coverage for regular doctor visits with general practitioners.',
      limitations: 'Limited to 10 visits per year.',
      coPayment: 25.00
    }
  }
};

/**
 * Example without limitations specified.
 */
export const WithoutLimitations: Story = {
  args: {
    coverage: {
      id: 'coverage-456',
      type: 'specialist_visit' as CoverageType,
      details: 'Coverage for visits to medical specialists such as cardiologists, neurologists, etc.',
      coPayment: 50.00
    }
  }
};

/**
 * Example without co-payment specified.
 */
export const WithoutCoPayment: Story = {
  args: {
    coverage: {
      id: 'coverage-789',
      type: 'preventive_care' as CoverageType,
      details: 'Coverage for preventive health services including annual check-ups and screenings.',
      limitations: 'One comprehensive check-up per year.'
    }
  }
};

/**
 * Example showing emergency care coverage.
 */
export const EmergencyCare: Story = {
  args: {
    coverage: {
      id: 'coverage-101',
      type: 'emergency_care' as CoverageType,
      details: 'Coverage for emergency room visits and urgent medical situations.',
      limitations: 'Must be a genuine emergency. Non-emergency visits may not be fully covered.',
      coPayment: 100.00
    }
  }
};

/**
 * Example showing prescription drug coverage.
 */
export const PrescriptionDrugs: Story = {
  args: {
    coverage: {
      id: 'coverage-102',
      type: 'prescription_drugs' as CoverageType,
      details: 'Coverage for prescription medications as prescribed by your doctor.',
      limitations: 'Generic alternatives must be used when available. Some specialty medications may require prior authorization.',
      coPayment: 15.00
    }
  }
};