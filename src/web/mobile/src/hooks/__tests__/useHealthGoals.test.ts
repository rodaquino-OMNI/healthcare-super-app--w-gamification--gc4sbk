/**
 * useHealthGoals.test.ts
 * 
 * Unit tests for the useHealthGoals custom hook
 */

import { renderHook, act } from '@testing-library/react-hooks';
import { useHealthGoals } from '../useHealthGoals';
import { useAuth } from '../useAuth';
import { useJourney } from '@austa/journey-context';

// Mock the fetch API
global.fetch = jest.fn();

// Mock the dependent hooks
jest.mock('../useAuth');
jest.mock('@austa/journey-context');

// Mock console.error to avoid cluttering test output
const originalConsoleError = console.error;
console.error = jest.fn();

describe('useHealthGoals', () => {
  // Setup default mock values
  const mockUserId = 'user-123';
  const mockAccessToken = 'mock-token';
  const mockJourney = 'health';
  const mockGoal = {
    id: 'goal-123',
    type: 'STEPS',
    target: 10000,
    startDate: new Date(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    status: 'ACTIVE'
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock useAuth hook
    (useAuth as jest.Mock).mockReturnValue({
      userId: mockUserId,
      accessToken: mockAccessToken
    });
    
    // Mock useJourney hook
    (useJourney as jest.Mock).mockReturnValue({
      currentJourney: mockJourney
    });
    
    // Mock successful fetch response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue([mockGoal])
    });
  });

  afterAll(() => {
    // Restore console.error
    console.error = originalConsoleError;
  });

  it('should fetch goals successfully', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useHealthGoals());
    
    // Call fetchGoals
    let fetchPromise;
    act(() => {
      fetchPromise = result.current.fetchGoals();
    });
    
    // Wait for the async operation to complete
    await waitForNextUpdate();
    const goals = await fetchPromise;
    
    // Verify fetch was called with correct parameters
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/health/goals?userId=${mockUserId}`),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Authorization': `Bearer ${mockAccessToken}`
        })
      })
    );
    
    // Verify goals were returned and state was updated
    expect(goals).toEqual([mockGoal]);
    expect(result.current.goals).toEqual([mockGoal]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should create a goal successfully', async () => {
    // Mock successful creation response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockGoal)
    });
    
    const { result, waitForNextUpdate } = renderHook(() => useHealthGoals());
    
    // Call createGoal
    let createPromise;
    act(() => {
      createPromise = result.current.createGoal(mockGoal);
    });
    
    // Wait for the async operation to complete
    await waitForNextUpdate();
    const createdGoal = await createPromise;
    
    // Verify fetch was called with correct parameters
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/health/goals'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': `Bearer ${mockAccessToken}`,
          'Content-Type': 'application/json'
        }),
        body: expect.any(String)
      })
    );
    
    // Verify the body contains the goal data and userId
    const requestBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(requestBody).toEqual(expect.objectContaining({
      ...mockGoal,
      userId: mockUserId
    }));
    
    // Verify goal was returned and state was updated
    expect(createdGoal).toEqual(mockGoal);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should update a goal successfully', async () => {
    const updatedGoal = { ...mockGoal, target: 12000 };
    
    // Mock successful update response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(updatedGoal)
    });
    
    const { result, waitForNextUpdate } = renderHook(() => useHealthGoals());
    
    // Call updateGoal
    let updatePromise;
    act(() => {
      updatePromise = result.current.updateGoal(mockGoal.id, updatedGoal);
    });
    
    // Wait for the async operation to complete
    await waitForNextUpdate();
    const returnedGoal = await updatePromise;
    
    // Verify fetch was called with correct parameters
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/health/goals/${mockGoal.id}`),
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          'Authorization': `Bearer ${mockAccessToken}`,
          'Content-Type': 'application/json'
        }),
        body: expect.any(String)
      })
    );
    
    // Verify goal was returned and state was updated
    expect(returnedGoal).toEqual(updatedGoal);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should delete a goal successfully', async () => {
    // Mock successful delete response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({})
    });
    
    const { result, waitForNextUpdate } = renderHook(() => useHealthGoals());
    
    // Call deleteGoal
    let deletePromise;
    act(() => {
      deletePromise = result.current.deleteGoal(mockGoal.id);
    });
    
    // Wait for the async operation to complete
    await waitForNextUpdate();
    const success = await deletePromise;
    
    // Verify fetch was called with correct parameters
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/health/goals/${mockGoal.id}`),
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({
          'Authorization': `Bearer ${mockAccessToken}`
        })
      })
    );
    
    // Verify success was returned and state was updated
    expect(success).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should get a goal by ID successfully', async () => {
    // Mock successful get response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockGoal)
    });
    
    const { result, waitForNextUpdate } = renderHook(() => useHealthGoals());
    
    // Call getGoalById
    let getPromise;
    act(() => {
      getPromise = result.current.getGoalById(mockGoal.id);
    });
    
    // Wait for the async operation to complete
    await waitForNextUpdate();
    const goal = await getPromise;
    
    // Verify fetch was called with correct parameters
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/health/goals/${mockGoal.id}`),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Authorization': `Bearer ${mockAccessToken}`
        })
      })
    );
    
    // Verify goal was returned and state was updated
    expect(goal).toEqual(mockGoal);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should handle API errors correctly', async () => {
    // Mock failed response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500
    });
    
    const { result, waitForNextUpdate } = renderHook(() => useHealthGoals());
    
    // Call fetchGoals
    let fetchPromise;
    act(() => {
      fetchPromise = result.current.fetchGoals();
    });
    
    // Wait for the async operation to complete
    await waitForNextUpdate();
    const goals = await fetchPromise;
    
    // Verify error state was set correctly
    expect(goals).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toContain('Failed to fetch health goals: 500');
    expect(console.error).toHaveBeenCalled();
  });

  it('should handle network errors correctly', async () => {
    // Mock network error
    const networkError = new Error('Network error');
    (global.fetch as jest.Mock).mockRejectedValue(networkError);
    
    const { result, waitForNextUpdate } = renderHook(() => useHealthGoals());
    
    // Call fetchGoals
    let fetchPromise;
    act(() => {
      fetchPromise = result.current.fetchGoals();
    });
    
    // Wait for the async operation to complete
    await waitForNextUpdate();
    const goals = await fetchPromise;
    
    // Verify error state was set correctly
    expect(goals).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(networkError);
    expect(console.error).toHaveBeenCalled();
  });

  it('should handle unauthenticated state', async () => {
    // Mock unauthenticated state
    (useAuth as jest.Mock).mockReturnValue({
      userId: null,
      accessToken: null
    });
    
    const { result } = renderHook(() => useHealthGoals());
    
    // Call fetchGoals
    let fetchPromise;
    act(() => {
      fetchPromise = result.current.fetchGoals();
    });
    
    const goals = await fetchPromise;
    
    // Verify error state was set correctly
    expect(goals).toEqual([]);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('User not authenticated');
    
    // Verify fetch was not called
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should throw error for operations requiring authentication', async () => {
    // Mock unauthenticated state
    (useAuth as jest.Mock).mockReturnValue({
      userId: null,
      accessToken: null
    });
    
    const { result } = renderHook(() => useHealthGoals());
    
    // Attempt to create a goal
    await expect(result.current.createGoal(mockGoal)).rejects.toThrow('User not authenticated');
    
    // Verify fetch was not called
    expect(global.fetch).not.toHaveBeenCalled();
  });
});