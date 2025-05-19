/**
 * Notification Service API
 * 
 * This module provides functions for interacting with the notification service,
 * allowing clients to fetch user notifications and mark notifications as read.
 * Uses standardized interfaces from @austa/interfaces for type safety.
 */

import axios, { AxiosError, isAxiosError } from 'axios';
import { baseURL } from 'src/web/shared/config/apiConfig';

// Import standardized interfaces for request/response models
import { 
  NotificationRequest, 
  NotificationResponse, 
  NotificationListResponse 
} from '@austa/interfaces/api/notification.api';
import { ApiResponse, PaginatedResponse } from '@austa/interfaces/api/response.types';
import { ApiError, ErrorResponse } from '@austa/interfaces/api/error.types';

/**
 * Fetches notifications for a user.
 * 
 * @param userId - The ID of the user to fetch notifications for
 * @param options - Optional request parameters (pagination, filtering)
 * @returns A promise that resolves to the notifications data with proper typing
 * @throws ApiError with typed error response if the request fails
 */
export const getNotifications = async (
  userId: string,
  options?: NotificationRequest
): Promise<PaginatedResponse<NotificationListResponse>> => {
  try {
    const url = `${baseURL}/notifications/user/${userId}`;
    const response = await axios.get<ApiResponse<PaginatedResponse<NotificationListResponse>>>(
      url,
      { params: options }
    );
    return response.data.data;
  } catch (error) {
    if (isAxiosError<ErrorResponse>(error)) {
      throw new ApiError(
        error.response?.data?.message || 'Failed to fetch notifications',
        error.response?.status,
        error.response?.data
      );
    }
    throw new Error('An unexpected error occurred while fetching notifications');
  }
};

/**
 * Marks a notification as read.
 * 
 * @param notificationId - The ID of the notification to mark as read
 * @returns A promise that resolves to the updated notification data
 * @throws ApiError with typed error response if the request fails
 */
export const markNotificationAsRead = async (
  notificationId: string
): Promise<NotificationResponse> => {
  try {
    const url = `${baseURL}/notifications/${notificationId}/read`;
    const response = await axios.post<ApiResponse<NotificationResponse>>(url);
    return response.data.data;
  } catch (error) {
    if (isAxiosError<ErrorResponse>(error)) {
      throw new ApiError(
        error.response?.data?.message || 'Failed to mark notification as read',
        error.response?.status,
        error.response?.data
      );
    }
    throw new Error('An unexpected error occurred while updating notification');
  }
};