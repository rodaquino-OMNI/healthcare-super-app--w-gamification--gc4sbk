import { Platform, PermissionsAndroid } from 'react-native';
import { ApiResponse, ErrorResponse } from '@austa/interfaces/common';

/**
 * Enum representing the types of permissions that can be requested in the app.
 * This is used to standardize permission requests across the application.
 */
export enum PermissionType {
  STORAGE = 'STORAGE',
  CAMERA = 'CAMERA',
  LOCATION = 'LOCATION',
}

/**
 * Interface representing the result of a permission request.
 * Contains information about whether the permission was granted and any error that occurred.
 */
export interface PermissionResult {
  granted: boolean;
  permissionType: PermissionType;
  error?: string;
}

/**
 * Interface representing the result of multiple permission requests.
 * Maps each permission type to its corresponding result.
 */
export interface MultiplePermissionResult {
  results: Record<PermissionType, PermissionResult>;
  allGranted: boolean;
}

/**
 * Maps permission types to their corresponding Android permission strings.
 */
const PERMISSION_MAP: Record<PermissionType, string> = {
  [PermissionType.STORAGE]: PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
  [PermissionType.CAMERA]: PermissionsAndroid.PERMISSIONS.CAMERA,
  [PermissionType.LOCATION]: PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
};

/**
 * Maps permission types to their user-friendly names for display in permission requests.
 */
const PERMISSION_NAMES: Record<PermissionType, string> = {
  [PermissionType.STORAGE]: 'Storage',
  [PermissionType.CAMERA]: 'Camera',
  [PermissionType.LOCATION]: 'Location',
};

/**
 * Maps permission types to their rationale messages explaining why the app needs the permission.
 */
const PERMISSION_RATIONALES: Record<PermissionType, string> = {
  [PermissionType.STORAGE]: 'AUSTA SuperApp needs access to your storage to access files',
  [PermissionType.CAMERA]: 'AUSTA SuperApp needs access to your camera for telemedicine sessions and document scanning',
  [PermissionType.LOCATION]: 'AUSTA SuperApp needs access to your location to find nearby healthcare providers',
};

/**
 * Requests a single permission on Android.
 * 
 * @param permissionType - The type of permission to request
 * @returns A promise that resolves to a PermissionResult object
 */
async function requestAndroidPermission(permissionType: PermissionType): Promise<PermissionResult> {
  try {
    // Check if the platform is Android
    if (Platform.OS !== 'android') {
      // If not Android, return true (permissions not relevant for other platforms)
      return {
        granted: true,
        permissionType,
      };
    }

    const androidPermission = PERMISSION_MAP[permissionType];
    if (!androidPermission) {
      return {
        granted: false,
        permissionType,
        error: `Unsupported permission type: ${permissionType}`,
      };
    }

    // Try to request the permission
    const granted = await PermissionsAndroid.request(
      androidPermission,
      {
        title: `${PERMISSION_NAMES[permissionType]} Permission`,
        message: PERMISSION_RATIONALES[permissionType],
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      },
    );

    // Return result based on the permission status
    return {
      granted: granted === PermissionsAndroid.RESULTS.GRANTED,
      permissionType,
    };
  } catch (error) {
    // Catch any errors during permission request and return false
    console.error(`Error requesting ${PERMISSION_NAMES[permissionType]} permission:`, error);
    return {
      granted: false,
      permissionType,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Checks if the app has been granted a specific permission on Android.
 * 
 * @param permissionType - The type of permission to check
 * @returns A promise that resolves to a boolean indicating if the permission is granted
 */
export async function checkAndroidPermission(permissionType: PermissionType): Promise<boolean> {
  // Check if the platform is Android
  if (Platform.OS !== 'android') {
    // If not Android, return true (permissions not relevant)
    return true;
  }

  try {
    const androidPermission = PERMISSION_MAP[permissionType];
    if (!androidPermission) {
      console.error(`Unsupported permission type: ${permissionType}`);
      return false;
    }

    const result = await PermissionsAndroid.check(androidPermission);
    return result;
  } catch (error) {
    console.error(`Error checking ${PERMISSION_NAMES[permissionType]} permission:`, error);
    return false;
  }
}

/**
 * Requests multiple permissions on Android.
 * 
 * @param permissionTypes - An array of permission types to request
 * @returns A promise that resolves to a MultiplePermissionResult object
 */
export async function requestMultipleAndroidPermissions(
  permissionTypes: PermissionType[]
): Promise<MultiplePermissionResult> {
  // Check if the platform is Android
  if (Platform.OS !== 'android') {
    // If not Android, return all granted (permissions not relevant)
    const results: Record<PermissionType, PermissionResult> = {};
    permissionTypes.forEach(type => {
      results[type] = { granted: true, permissionType: type };
    });
    return { results, allGranted: true };
  }

  try {
    // Create a map of Android permissions to request
    const permissionsToRequest: Record<string, string> = {};
    permissionTypes.forEach(type => {
      const androidPermission = PERMISSION_MAP[type];
      if (androidPermission) {
        permissionsToRequest[type] = androidPermission;
      }
    });

    // Request all permissions
    const permissionResults = await Promise.all(
      permissionTypes.map(type => requestAndroidPermission(type))
    );

    // Process results
    const results: Record<PermissionType, PermissionResult> = {};
    permissionResults.forEach(result => {
      results[result.permissionType] = result;
    });

    // Check if all permissions were granted
    const allGranted = permissionResults.every(result => result.granted);

    return { results, allGranted };
  } catch (error) {
    console.error('Error requesting multiple permissions:', error);
    
    // Create error results for all permissions
    const results: Record<PermissionType, PermissionResult> = {};
    permissionTypes.forEach(type => {
      results[type] = {
        granted: false,
        permissionType: type,
        error: error instanceof Error ? error.message : String(error),
      };
    });

    return { results, allGranted: false };
  }
}

/**
 * Checks if the app has been granted necessary permissions on Android.
 * This is a backward-compatible function that maintains the original API.
 * 
 * @returns A promise that resolves to `true` if the storage permission is granted, and `false` otherwise.
 */
export const checkAndroidPermissions = async (): Promise<boolean> => {
  return checkAndroidPermission(PermissionType.STORAGE);
};

/**
 * Requests all permissions required for the health journey.
 * This includes camera and location permissions.
 * 
 * @returns A promise that resolves to a MultiplePermissionResult object
 */
export async function requestHealthJourneyPermissions(): Promise<ApiResponse<MultiplePermissionResult>> {
  try {
    const result = await requestMultipleAndroidPermissions([
      PermissionType.CAMERA,
      PermissionType.LOCATION,
    ]);

    return {
      data: result,
      success: result.allGranted,
      message: result.allGranted 
        ? 'All health journey permissions granted' 
        : 'Some health journey permissions were denied',
    };
  } catch (error) {
    console.error('Error requesting health journey permissions:', error);
    return {
      data: {
        results: {},
        allGranted: false,
      },
      success: false,
      message: 'Failed to request health journey permissions',
      errors: {
        permissions: [error instanceof Error ? error.message : String(error)],
      },
    };
  }
}