import { ReactNode } from 'react';

/**
 * Interface for the MainLayout component props
 */
export interface MainLayoutProps {
  /**
   * The content to be rendered inside the layout
   */
  children: ReactNode;
}

/**
 * Interface for the AuthLayout component props
 */
export interface AuthLayoutProps {
  /**
   * The content to be rendered inside the layout
   */
  children: ReactNode;
  /**
   * Optional title to display in the auth layout header
   */
  title?: string;
}

/**
 * Interface for journey-specific layout props
 */
export interface JourneyLayoutProps {
  /**
   * The content to be rendered inside the layout
   */
  children: ReactNode;
  /**
   * Optional header title for the journey layout
   */
  headerTitle?: string;
  /**
   * Whether to show the back button in the header
   */
  showBackButton?: boolean;
  /**
   * Callback function for when the back button is clicked
   */
  onBackClick?: () => void;
}

/**
 * Interface for the HealthLayout component props
 */
export interface HealthLayoutProps extends JourneyLayoutProps {}

/**
 * Interface for the CareLayout component props
 */
export interface CareLayoutProps extends JourneyLayoutProps {}

/**
 * Interface for the PlanLayout component props
 */
export interface PlanLayoutProps extends JourneyLayoutProps {}