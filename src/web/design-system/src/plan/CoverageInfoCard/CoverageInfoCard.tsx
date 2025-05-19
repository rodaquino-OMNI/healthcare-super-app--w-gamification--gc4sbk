import React from 'react';
import styled from 'styled-components';
import { Card } from '@austa/design-system/components/Card';
import { colors, spacing, typography } from '@design-system/primitives/tokens';
import { Coverage, CoverageType } from '@austa/interfaces/plan/coverage.types';

/**
 * Interface defining the props for the CoverageInfoCard component
 */
export interface CoverageInfoCardProps {
  /** The coverage data to display in the card */
  coverage: Coverage;
  /** Optional test ID for component testing */
  testID?: string;
}

// Styled components for the card contents
const CoverageTitle = styled.h3`
  font-family: ${typography.fontFamily.heading};
  font-size: ${typography.fontSize.lg};
  font-weight: ${typography.fontWeight.medium};
  margin: 0 0 ${spacing.sm} 0;
  color: ${colors.journeys.plan.primary};
`;

const CoverageDetails = styled.p`
  font-family: ${typography.fontFamily.base};
  font-size: ${typography.fontSize.md};
  line-height: ${typography.lineHeight.base};
  margin: 0 0 ${spacing.md} 0;
  color: ${colors.neutral.gray800};
`;

const CoverageLimitations = styled.div`
  padding: ${spacing.sm};
  background-color: ${colors.neutral.gray100};
  border-radius: ${spacing.xs};
  margin: ${spacing.sm} 0;
  font-size: ${typography.fontSize.sm};
  color: ${colors.neutral.gray700};
`;

const CoPaymentBadge = styled.div`
  display: inline-block;
  padding: ${spacing.xs} ${spacing.sm};
  background-color: ${colors.journeys.plan.secondary};
  color: ${colors.neutral.white};
  border-radius: ${spacing.xs};
  font-size: ${typography.fontSize.sm};
  font-weight: ${typography.fontWeight.medium};
  margin-top: ${spacing.sm};
`;

// Map coverage types to human-readable names
const coverageTypeNames: Record<CoverageType, string> = {
  medical_visit: 'Consulta Médica',
  specialist_visit: 'Consulta com Especialista',
  emergency_care: 'Atendimento de Emergência',
  preventive_care: 'Cuidados Preventivos',
  prescription_drugs: 'Medicamentos com Receita',
  mental_health: 'Saúde Mental',
  rehabilitation: 'Reabilitação',
  durable_medical_equipment: 'Equipamentos Médicos Duráveis',
  lab_tests: 'Exames Laboratoriais',
  imaging: 'Exames de Imagem',
  other: 'Outros Serviços'
};

/**
 * A component that displays insurance coverage information in a card format.
 * Designed for the Plan journey, it shows coverage type, details, limitations,
 * and co-payment information if available.
 *
 * @example
 * ```tsx
 * <CoverageInfoCard 
 *   coverage={{
 *     id: '123',
 *     type: 'medical_visit',
 *     details: 'Coverage for regular doctor visits',
 *     limitations: 'Limited to 10 visits per year',
 *     coPayment: 25.00
 *   }} 
 * />
 * ```
 */
export const CoverageInfoCard: React.FC<CoverageInfoCardProps> = ({ coverage, testID }) => {
  // Get the human-readable coverage type name
  const coverageName = coverageTypeNames[coverage.type as CoverageType] || coverage.type;
  
  return (
    <Card 
      journey="plan" 
      elevation="sm"
      accessibilityLabel={`Coverage information for ${coverageName}`}
      testID={testID}
      role="region"
      aria-labelledby={`coverage-title-${coverage.id}`}
    >
      <CoverageTitle id={`coverage-title-${coverage.id}`}>{coverageName}</CoverageTitle>
      <CoverageDetails>{coverage.details}</CoverageDetails>
      
      {coverage.limitations && (
        <CoverageLimitations aria-label="Coverage limitations">
          <strong>Limitações:</strong> {coverage.limitations}
        </CoverageLimitations>
      )}
      
      {coverage.coPayment !== undefined && (
        <CoPaymentBadge aria-label={`Co-payment amount: ${coverage.coPayment.toFixed(2)} reais`}>
          Copagamento: R$ {coverage.coPayment.toFixed(2)}
        </CoPaymentBadge>
      )}
    </Card>
  );
};