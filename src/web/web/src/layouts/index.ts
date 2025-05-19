/**
 * @file Layout Components Export Barrel
 * @description Centralizes exports for all layout components used throughout the AUSTA SuperApp.
 * This file provides a single import point for all layout components, improving module resolution
 * and reducing import complexity across the codebase.
 */

import { AuthLayout as AuthLayoutComponent } from './AuthLayout';
import { MainLayout as MainLayoutComponent } from './MainLayout';
import CareLayoutComponent from './CareLayout';
import HealthLayoutComponent from './HealthLayout';
import PlanLayoutComponent from './PlanLayout';

// Re-export component types for better developer experience
import type { FC, PropsWithChildren, ReactNode } from 'react';

/**
 * AuthLayout Props Interface
 * @interface AuthLayoutProps
 * @description Defines the props interface for the AuthLayout component
 */
export interface AuthLayoutProps {
  /**
   * The content to be rendered inside the authentication layout
   * (typically authentication forms like login, register, forgot password)
   */
  children: ReactNode;
}

/**
 * MainLayout Props Interface
 * @interface MainLayoutProps
 * @description Defines the props interface for the MainLayout component
 */
export type MainLayoutProps = PropsWithChildren<{}>;

/**
 * CareLayout Props Interface
 * @interface CareLayoutProps
 * @description Defines the props interface for the CareLayout component
 */
export type CareLayoutProps = PropsWithChildren<{}>;

/**
 * HealthLayout Props Interface
 * @interface HealthLayoutProps
 * @description Defines the props interface for the HealthLayout component
 */
export type HealthLayoutProps = PropsWithChildren<{}>;

/**
 * PlanLayout Props Interface
 * @interface PlanLayoutProps
 * @description Defines the props interface for the PlanLayout component
 */
export type PlanLayoutProps = PropsWithChildren<{}>;

/**
 * Authentication Layout Component
 * @component
 * @description Provides a consistent layout for authentication pages in the AUSTA SuperApp.
 * This component creates a centered container with appropriate styling for auth forms.
 */
export const AuthLayout: FC<AuthLayoutProps> = AuthLayoutComponent;

/**
 * Main Application Layout Component
 * @component
 * @description Primary layout component that provides the structural foundation for the entire AUSTA SuperApp.
 * It composes a responsive layout with sidebar navigation (desktop) and top bar (mobile),
 * retrieves authentication state, journey context and gamification data, enforces authentication requirements,
 * renders page content via children prop, and displays gamification achievement popups when triggered.
 */
export const MainLayout: FC<MainLayoutProps> = MainLayoutComponent;

/**
 * Care Journey Layout Component
 * @component
 * @description Journey-specific layout component for the "Cuidar-me Agora" (Care) journey that provides
 * consistent page structure and navigation. It wraps MainLayout, renders the JourneyNav for journey switching,
 * and ensures the Care journey context is properly set.
 */
export const CareLayout: FC<CareLayoutProps> = CareLayoutComponent;

/**
 * Health Journey Layout Component
 * @component
 * @description Journey-specific layout component for the "Minha Saúde" (Health) journey that provides
 * consistent styling and structure. It applies the health journey theme (green-based palette) to all
 * contained components, ensures the correct journey context is active, and organizes content with a
 * themed header, main content area, and footer.
 */
export const HealthLayout: FC<HealthLayoutProps> = HealthLayoutComponent;

/**
 * Plan Journey Layout Component
 * @component
 * @description Journey-specific layout component for the "Meu Plano & Benefícios" (Plan) journey that provides
 * consistent page structure and navigation. It wraps MainLayout, displays a journey-specific header,
 * renders the sidebar navigation, and ensures proper journey context is maintained.
 */
export const PlanLayout: FC<PlanLayoutProps> = PlanLayoutComponent;

// Default exports for components that can be imported directly
export { default as AuthLayout } from './AuthLayout';
export { default as CareLayout } from './CareLayout';
export { default as HealthLayout } from './HealthLayout';
export { default as PlanLayout } from './PlanLayout';

// Note: MainLayout doesn't have a default export in its file, so we don't re-export it as default here