import styled from 'styled-components';
import { Box } from '@design-system/primitives/components';

/**
 * Container for the entire appointment card
 */
export const AppointmentCardContainer = styled(Box)`
  display: flex;
  flex-direction: column;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ theme }) => theme.colors.neutral.gray200};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.neutral.white};
  transition: box-shadow 0.2s ease-in-out;
  overflow: hidden;
  width: 100%;
  
  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
`;

/**
 * Header section of the appointment card containing provider info and type icon
 */
export const AppointmentCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

/**
 * Container for provider information (image, name, specialty)
 */
export const ProviderInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  
  img {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
  }
  
  div {
    display: flex;
    flex-direction: column;
  }
`;

/**
 * Body section of the appointment card containing appointment details
 */
export const AppointmentCardBody = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

/**
 * Container for appointment details (date, type, status)
 */
export const AppointmentDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  
  div {
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing.xs};
  }
`;

/**
 * Footer section of the appointment card containing action buttons
 */
export const AppointmentCardFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: ${({ theme }) => theme.spacing.sm};
`;

/**
 * Container for appointment action buttons
 */
export const AppointmentActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  justify-content: flex-end;
`;