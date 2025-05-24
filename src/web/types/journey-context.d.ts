/**
 * Type definitions for @austa/journey-context package
 * 
 * This file provides ambient type declarations for the @austa/journey-context package,
 * ensuring proper module resolution and type checking.
 */

declare module '@austa/journey-context' {
  import { ReactNode } from 'react';

  // Journey Types
  export type JourneyId = 'health' | 'care' | 'plan';

  export const JOURNEY_IDS: {
    HEALTH: 'health';
    CARE: 'care';
    PLAN: 'plan';
  };

  export interface Journey {
    id: JourneyId;
    name: string;
    color: string;
    icon: string;
    route: string;
  }

  export interface JourneyConfig {
    availableJourneys: Journey[];
    defaultJourney: JourneyId;
    preferredOrder?: JourneyId[];
  }

  // Platform Types
  export type Platform = 'web' | 'mobile';

  export interface PlatformContextMap<T> {
    web: T;
    mobile: T;
  }

  export type PlatformJourneyContextType<P extends Platform, T> = 
    P extends 'web' ? WebJourneyContextType<T> : MobileJourneyContextType<T>;

  export interface PlatformJourneyStateMap<T> {
    web: { journeyState: T };
    mobile: { state: T };
  }

  export type PlatformJourneyState<P extends Platform, T> = 
    PlatformJourneyStateMap<T>[P];

  // Context Types
  export interface JourneyProviderProps {
    children: ReactNode;
    platform: Platform;
    config?: JourneyConfig;
  }

  export interface BaseJourneyContextType {
    currentJourney: Journey | null;
    setCurrentJourney: (journeyId: JourneyId) => void;
    isJourneyAvailable: (journeyId: JourneyId) => boolean;
    getJourneyById: (journeyId: JourneyId) => Journey | undefined;
    availableJourneys: Journey[];
  }

  export interface WebJourneyContextType<T = any> extends BaseJourneyContextType {
    journeyState: T;
    setJourneyState: (state: Partial<T>) => void;
  }

  export interface MobileJourneyContextType<T = any> extends BaseJourneyContextType {
    state: T;
    setState: (state: Partial<T>) => void;
  }

  export type JourneyContextType<P extends Platform = 'web', T = any> = 
    PlatformJourneyContextType<P, T>;

  // Auth Types
  export interface AuthSession {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
    userId: string;
  }

  export type AuthStatus = 'authenticated' | 'unauthenticated' | 'loading';

  export interface UserProfile {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string;
    preferences?: Record<string, any>;
  }

  export interface UseAuthResult {
    session: AuthSession | null;
    status: AuthStatus;
    user: UserProfile | null;
    login: (email: string, password: string) => Promise<AuthSession>;
    logout: () => Promise<void>;
    register: (email: string, password: string, name: string) => Promise<void>;
    getProfile: () => Promise<UserProfile>;
    updateProfile: (data: Partial<UserProfile>) => Promise<UserProfile>;
    isLoading: boolean;
    error: Error | null;
  }

  // Gamification Types
  export interface GameProfile {
    userId: string;
    level: number;
    xp: number;
    xpToNextLevel: number;
    achievements: Achievement[];
    quests: Quest[];
    rewards: Reward[];
  }

  export interface Achievement {
    id: string;
    title: string;
    description: string;
    journeyId: JourneyId | null;
    icon: string;
    xpReward: number;
    progress: number;
    isCompleted: boolean;
    completedAt?: string;
  }

  export interface Quest {
    id: string;
    title: string;
    description: string;
    journeyId: JourneyId | null;
    icon: string;
    xpReward: number;
    progress: number;
    isCompleted: boolean;
    expiresAt?: string;
    completedAt?: string;
    steps: QuestStep[];
  }

  export interface QuestStep {
    id: string;
    description: string;
    isCompleted: boolean;
  }

  export interface Reward {
    id: string;
    title: string;
    description: string;
    journeyId: JourneyId | null;
    icon: string;
    cost: number;
    isRedeemed: boolean;
    redeemedAt?: string;
  }

  export interface UseGamificationResult {
    gameProfile: GameProfile | null;
    achievements: Achievement[];
    quests: Quest[];
    rewards: Reward[];
    triggerEvent: (eventType: string, eventData: Record<string, any>) => Promise<void>;
    isAchievementCompleted: (achievementId: string) => boolean;
    isQuestCompleted: (questId: string) => boolean;
    getAchievementProgress: (achievementId: string) => number;
    getQuestProgress: (questId: string) => number;
    isLoading: boolean;
    error: Error | null;
  }

  // Notification Types
  export interface Notification {
    id: string;
    title: string;
    message: string;
    journeyId: JourneyId | null;
    type: 'achievement' | 'quest' | 'system' | 'journey';
    isRead: boolean;
    createdAt: string;
    data?: Record<string, any>;
  }

  export interface UseNotificationResult {
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (notificationId: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (notificationId: string) => Promise<void>;
    refreshNotifications: () => Promise<void>;
    isLoading: boolean;
    error: Error | null;
  }

  // Journey Context Hooks
  export function useAuth(): UseAuthResult;
  export function useJourney<T = any>(platform?: Platform): JourneyContextType<typeof platform, T>;
  export function useGamification(): UseGamificationResult;
  export function useNotification(): UseNotificationResult;

  // Journey Context Providers
  export function AuthProvider(props: { children: ReactNode }): JSX.Element;
  export function JourneyProvider(props: JourneyProviderProps): JSX.Element;
  export function GamificationProvider(props: { children: ReactNode }): JSX.Element;
  export function NotificationProvider(props: { children: ReactNode }): JSX.Element;

  // Combined Provider
  export function JourneyContextProvider(props: JourneyProviderProps & { children: ReactNode }): JSX.Element;
}