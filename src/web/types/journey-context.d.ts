/**
 * Type declarations for @austa/journey-context package
 * 
 * This file provides ambient type declarations for the journey context package,
 * ensuring proper module resolution and type checking. It defines types for
 * context values, provider props, and hook return types for the health, care,
 * and plan journeys.
 */

declare module '@austa/journey-context' {
  import { ReactNode } from 'react';

  /**
   * Journey Types
   */
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

  /**
   * Platform Types
   */
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

  /**
   * Context Types
   */
  export interface JourneyProviderProps {
    children: ReactNode;
    initialJourney?: JourneyId;
    config?: JourneyConfig;
  }

  export interface BaseJourneyContextType {
    currentJourney: Journey;
    setCurrentJourney: (journeyId: JourneyId) => void;
    availableJourneys: Journey[];
    isJourneyAvailable: (journeyId: JourneyId) => boolean;
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

  /**
   * Auth Types
   */
  export interface AuthSession {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
    userId: string;
  }

  export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated' | 'error';

  export interface UserProfile {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    preferences?: Record<string, any>;
  }

  export interface AuthContextType {
    session: AuthSession | null;
    status: AuthStatus;
    user: UserProfile | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    register: (email: string, password: string, name: string) => Promise<void>;
    getProfile: () => Promise<UserProfile>;
    updateProfile: (data: Partial<UserProfile>) => Promise<UserProfile>;
    error: Error | null;
  }

  /**
   * Gamification Types
   */
  export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    points: number;
    progress: number;
    completed: boolean;
    completedAt?: string;
    journeyId?: JourneyId;
  }

  export interface Quest {
    id: string;
    title: string;
    description: string;
    icon: string;
    points: number;
    progress: number;
    completed: boolean;
    completedAt?: string;
    expiresAt?: string;
    journeyId?: JourneyId;
    steps: QuestStep[];
  }

  export interface QuestStep {
    id: string;
    title: string;
    completed: boolean;
    completedAt?: string;
  }

  export interface Reward {
    id: string;
    title: string;
    description: string;
    icon: string;
    cost: number;
    available: boolean;
    claimed: boolean;
    claimedAt?: string;
    expiresAt?: string;
  }

  export interface GameProfile {
    id: string;
    userId: string;
    level: number;
    points: number;
    totalPoints: number;
    pointsToNextLevel: number;
  }

  export interface GamificationEvent {
    type: string;
    journeyId: JourneyId;
    userId: string;
    metadata?: Record<string, any>;
  }

  export interface GamificationContextType {
    gameProfile: GameProfile | null;
    achievements: Achievement[];
    quests: Quest[];
    rewards: Reward[];
    loading: boolean;
    error: Error | null;
    triggerEvent: (event: GamificationEvent) => Promise<void>;
    checkAchievementStatus: (achievementId: string) => {
      completed: boolean;
      progress: number;
    };
    checkQuestStatus: (questId: string) => {
      completed: boolean;
      progress: number;
      steps: { id: string; completed: boolean }[];
    };
    calculateProgress: (current: number, total: number) => number;
    refreshProfile: () => Promise<void>;
  }

  /**
   * Notification Types
   */
  export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'achievement' | 'quest' | 'reward' | 'system' | 'journey';
    read: boolean;
    createdAt: string;
    journeyId?: JourneyId;
    metadata?: Record<string, any>;
  }

  export interface NotificationContextType {
    notifications: Notification[];
    loading: boolean;
    error: Error | null;
    unreadCount: number;
    fetchNotifications: () => Promise<void>;
    markAsRead: (notificationId: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (notificationId: string) => Promise<void>;
    clearNotifications: () => Promise<void>;
  }

  /**
   * Storage Types
   */
  export interface StorageHook {
    getItem: <T>(key: string) => T | null;
    setItem: <T>(key: string, value: T) => void;
    removeItem: (key: string) => void;
    clear: () => void;
  }

  /**
   * Providers
   */
  export const JourneyProvider: React.FC<JourneyProviderProps>;
  export const AuthProvider: React.FC<{ children: ReactNode }>;
  export const GamificationProvider: React.FC<{ children: ReactNode }>;
  export const NotificationProvider: React.FC<{ children: ReactNode }>;

  /**
   * Hooks
   */
  export function useJourney<T = any>(): JourneyContextType<'web', T>;
  export function useAuth(): AuthContextType;
  export function useGamification(): GamificationContextType;
  export function useNotification(): NotificationContextType;
  export function useStorage(): StorageHook;

  /**
   * Constants
   */
  export const ALL_JOURNEYS: Journey[];
  export const DEFAULT_JOURNEY: JourneyId;
}