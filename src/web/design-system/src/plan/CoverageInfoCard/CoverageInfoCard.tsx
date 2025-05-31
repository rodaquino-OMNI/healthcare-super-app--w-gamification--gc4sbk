import React from 'react';
import styled from 'styled-components';
import { Card } from '@austa/design-system/components/Card';
import { colors, spacing, typography } from '@design-system/primitives/tokens';
import { Coverage, CoverageType } from '@austa/interfaces/plan/coverage.types';

/**
 * Interface defining the props for the CoverageInfoCard component
 */
export interface CoverageInfoCardProps {
  /** Coverage information to display */
  coverage: Coverage;
  /** Optional custom class name */
  className?: string;
  /** Optional test ID for testing */
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
  [CoverageType.MEDICAL_VISIT]: 'Consulta Médica',
  [CoverageType.SPECIALIST_VISIT]: 'Consulta com Especialista',
  [CoverageType.EMERGENCY_CARE]: 'Atendimento de Emergência',
  [CoverageType.PREVENTIVE_CARE]: 'Cuidados Preventivos',
  [CoverageType.PRESCRIPTION_DRUGS]: 'Medicamentos com Receita',
  [CoverageType.MENTAL_HEALTH]: 'Saúde Mental',
  [CoverageType.REHABILITATION]: 'Reabilitação',
  [CoverageType.DURABLE_MEDICAL_EQUIPMENT]: 'Equipamentos Médicos Duráveis',
  [CoverageType.LAB_TESTS]: 'Exames Laboratoriais',
  [CoverageType.IMAGING]: 'Exames de Imagem',
  [CoverageType.OTHER]: 'Outros Serviços'
};

/**
 * A component that displays insurance coverage information in a card format.
 * Designed for the Plan journey, it shows coverage type, details, limitations,
 * and co-payment information if available.
 * 
 * @example
 * // Basic usage
 * <CoverageInfoCard coverage={coverageData} />
 * 
 * @example
 * // With custom class name
 * <CoverageInfoCard 
 *   coverage={coverageData} 
 *   className="custom-coverage-card"
 * />
 */
export const CoverageInfoCard: React.FC<CoverageInfoCardProps> = ({ 
  coverage, 
  className,
  testID 
}) => {
  // Get the human-readable coverage type name
  const coverageName = coverageTypeNames[coverage.type] || String(coverage.type);
  
  return (
    <Card 
      journey="plan" 
      elevation="sm"
      accessibilityLabel={`Informações de cobertura para ${coverageName}`}
      className={className}
      data-testid={testID || 'coverage-info-card'}
      aria-labelledby="coverage-title"
    >
      <CoverageTitle id="coverage-title">{coverageName}</CoverageTitle>
      <CoverageDetails>{coverage.details}</CoverageDetails>
      
      {coverage.limitations && (
        <CoverageLimitations aria-label="Limitações da cobertura">
          <strong>Limitações:</strong> {coverage.limitations}
        </CoverageLimitations>
      )}
      
      {coverage.coPayment !== undefined && (
        <CoPaymentBadge aria-label={`Copagamento: R$ ${coverage.coPayment.toFixed(2)}`}>
          Copagamento: R$ {coverage.coPayment.toFixed(2)}
        </CoPaymentBadge>
      )}
    </Card>
  );
};