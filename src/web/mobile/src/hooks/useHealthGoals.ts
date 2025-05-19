/**
 * useHealthGoals.ts
 * 
 * Custom React hook for managing health goals in the AUSTA SuperApp.
 * Provides functions for creating, updating, fetching, and deleting health goals,
 * with proper loading and error state management.
 */

import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useJourney } from '@austa/journey-context';
import { HealthGoal } from '@austa/interfaces/health';
import { API_BASE_URL } from '../constants/config';

/**
 * Interface for the useHealthGoals hook return value
 */
interface UseHealthGoalsReturn {
  goals: HealthGoal[];
  isLoading: boolean;
  error: Error | null;
  fetchGoals: () => Promise<HealthGoal[]>;
  createGoal: (goal: HealthGoal) => Promise<HealthGoal>;
  updateGoal: (id: string, goal: HealthGoal) => Promise<HealthGoal>;
  deleteGoal: (id: string) => Promise<boolean>;
  getGoalById: (id: string) => Promise<HealthGoal | null>;
}

/**
 * Custom hook for managing health goals
 * @returns Object with health goals data and functions for CRUD operations
 */
export const useHealthGoals = (): UseHealthGoalsReturn => {
  // Get authentication context for API requests
  const { accessToken, userId } = useAuth();
  
  // Get journey context for logging
  const { currentJourney } = useJourney();
  
  // State for goals, loading, and error
  const [goals, setGoals] = useState<HealthGoal[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  /**
   * Fetch all health goals for the current user
   */
  const fetchGoals = useCallback(async (): Promise<HealthGoal[]> => {
    if (!accessToken || !userId) {
      setError(new Error('User not authenticated'));
      return [];
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/health/goals?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch health goals: ${response.status}`);
      }
      
      const data = await response.json();
      setGoals(data);
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      console.error(`[${currentJourney}] Error fetching health goals:`, error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, userId, currentJourney]);
  
  /**
   * Create a new health goal
   */
  const createGoal = useCallback(async (goal: HealthGoal): Promise<HealthGoal> => {
    if (!accessToken || !userId) {
      throw new Error('User not authenticated');
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/health/goals`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...goal,
          userId
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create health goal: ${response.status}`);
      }
      
      const createdGoal = await response.json();
      
      // Update local state with the new goal
      setGoals(prevGoals => [...prevGoals, createdGoal]);
      
      return createdGoal;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      console.error(`[${currentJourney}] Error creating health goal:`, error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, userId, currentJourney]);
  
  /**
   * Update an existing health goal
   */
  const updateGoal = useCallback(async (id: string, goal: HealthGoal): Promise<HealthGoal> => {
    if (!accessToken || !userId) {
      throw new Error('User not authenticated');
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/health/goals/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...goal,
          userId
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update health goal: ${response.status}`);
      }
      
      const updatedGoal = await response.json();
      
      // Update local state with the updated goal
      setGoals(prevGoals => 
        prevGoals.map(g => g.id === id ? updatedGoal : g)
      );
      
      return updatedGoal;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      console.error(`[${currentJourney}] Error updating health goal:`, error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, userId, currentJourney]);
  
  /**
   * Delete a health goal
   */
  const deleteGoal = useCallback(async (id: string): Promise<boolean> => {
    if (!accessToken || !userId) {
      throw new Error('User not authenticated');
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/health/goals/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete health goal: ${response.status}`);
      }
      
      // Update local state by removing the deleted goal
      setGoals(prevGoals => prevGoals.filter(g => g.id !== id));
      
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      console.error(`[${currentJourney}] Error deleting health goal:`, error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, userId, currentJourney]);
  
  /**
   * Get a health goal by ID
   */
  const getGoalById = useCallback(async (id: string): Promise<HealthGoal | null> => {
    if (!accessToken || !userId) {
      throw new Error('User not authenticated');
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/health/goals/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch health goal: ${response.status}`);
      }
      
      const goal = await response.json();
      return goal;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      console.error(`[${currentJourney}] Error fetching health goal by ID:`, error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, userId, currentJourney]);
  
  return {
    goals,
    isLoading,
    error,
    fetchGoals,
    createGoal,
    updateGoal,
    deleteGoal,
    getGoalById
  };
};

export default useHealthGoals;