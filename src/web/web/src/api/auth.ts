import { LoginRequest, LoginResponse, LogoutRequest, ProfileResponse } from '@austa/interfaces/api/auth.api';
import { ApiResponse } from '@austa/interfaces/api/response.types';
import { ApiError } from '@austa/interfaces/api/error.types';
import { AUTH_API } from 'src/web/shared/constants/api';
import { restClient } from './client';

/**
 * Authenticates a user with email and password.
 * 
 * @param credentials - The user's login credentials (email and password)
 * @returns A promise that resolves with the authentication session data
 * @throws ApiError if authentication fails
 */
export const login = async (credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
  try {
    const response = await restClient.post<ApiResponse<LoginResponse>>(
      `${AUTH_API.BASE_PATH}${AUTH_API.ENDPOINTS.LOGIN}`, 
      credentials
    );
    
    return response.data;
  } catch (error) {
    // Transform error to typed ApiError for consistent error handling
    throw new ApiError({
      code: error.response?.status || 500,
      message: error.response?.data?.message || 'Authentication failed',
      details: error.response?.data?.details || {},
      path: AUTH_API.ENDPOINTS.LOGIN
    });
  }
};

/**
 * Logs out the current user.
 * 
 * @param request - Optional logout request parameters
 * @returns A promise that resolves when the logout is complete
 * @throws ApiError if logout fails
 */
export const logout = async (request?: LogoutRequest): Promise<void> => {
  try {
    await restClient.post(
      `${AUTH_API.BASE_PATH}${AUTH_API.ENDPOINTS.LOGOUT}`,
      request || {}
    );
  } catch (error) {
    // Transform error to typed ApiError for consistent error handling
    throw new ApiError({
      code: error.response?.status || 500,
      message: error.response?.data?.message || 'Logout failed',
      details: error.response?.data?.details || {},
      path: AUTH_API.ENDPOINTS.LOGOUT
    });
  }
};

/**
 * Retrieves the profile of the currently authenticated user.
 * 
 * @returns A promise that resolves with the user profile data
 * @throws ApiError if profile retrieval fails
 */
export const getProfile = async (): Promise<ApiResponse<ProfileResponse>> => {
  try {
    const response = await restClient.get<ApiResponse<ProfileResponse>>(
      `${AUTH_API.BASE_PATH}${AUTH_API.ENDPOINTS.PROFILE}`
    );
    
    return response.data;
  } catch (error) {
    // Transform error to typed ApiError for consistent error handling
    throw new ApiError({
      code: error.response?.status || 500,
      message: error.response?.data?.message || 'Failed to retrieve user profile',
      details: error.response?.data?.details || {},
      path: AUTH_API.ENDPOINTS.PROFILE
    });
  }
};