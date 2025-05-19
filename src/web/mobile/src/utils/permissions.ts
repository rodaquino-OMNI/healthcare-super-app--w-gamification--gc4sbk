import { Platform, PermissionsAndroid } from 'react-native';

/**
 * Type definitions for permission results
 */
export enum PermissionResult {
  GRANTED = 'granted',
  DENIED = 'denied',
  NEVER_ASK_AGAIN = 'never_ask_again'
}

/**
 * Type definition for permission request options
 */
export interface PermissionRequestOptions {
  title: string;
  message: string;
  buttonNeutral?: string;
  buttonNegative?: string;
  buttonPositive?: string;
}

/**
 * Type definition for permission request result
 */
export interface PermissionRequestResult {
  permission: string;
  result: PermissionResult;
}

/**
 * Default permission request options with user-friendly messages
 */
const defaultPermissionOptions: Record<string, PermissionRequestOptions> = {
  [PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE]: {
    title: 'Storage Permission',
    message: 'AUSTA SuperApp needs access to your storage to access files',
    buttonNeutral: 'Ask Me Later',
    buttonNegative: 'Cancel',
    buttonPositive: 'OK',
  },
  [PermissionsAndroid.PERMISSIONS.CAMERA]: {
    title: 'Camera Permission',
    message: 'AUSTA SuperApp needs access to your camera for telemedicine sessions',
    buttonNeutral: 'Ask Me Later',
    buttonNegative: 'Cancel',
    buttonPositive: 'OK',
  },
  [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION]: {
    title: 'Location Permission',
    message: 'AUSTA SuperApp needs access to your location to find nearby healthcare providers',
    buttonNeutral: 'Ask Me Later',
    buttonNegative: 'Cancel',
    buttonPositive: 'OK',
  },
};

/**
 * Checks if the app has been granted a specific Android permission.
 * 
 * @param permission The Android permission to check
 * @returns A promise that resolves to `true` if the permission is granted, and `false` otherwise.
 */
export const checkAndroidPermission = async (permission: string): Promise<boolean> => {
  // Check if the platform is Android
  if (Platform.OS !== 'android') {
    // If not Android, return true (permissions not relevant)
    return true;
  }

  try {
    const result = await PermissionsAndroid.check(permission);
    return result;
  } catch (error) {
    console.error(`Error checking permission ${permission}:`, error);
    return false;
  }
};

/**
 * Requests a specific Android permission.
 * 
 * @param permission The Android permission to request
 * @param options Custom options for the permission request dialog
 * @returns A promise that resolves to a PermissionRequestResult object
 */
export const requestAndroidPermission = async (
  permission: string,
  options?: PermissionRequestOptions
): Promise<PermissionRequestResult> => {
  // Check if the platform is Android
  if (Platform.OS !== 'android') {
    // If not Android, return granted (permissions not relevant)
    return {
      permission,
      result: PermissionResult.GRANTED
    };
  }

  try {
    // Use provided options or default options for this permission type
    const requestOptions = options || defaultPermissionOptions[permission] || {
      title: 'Permission Required',
      message: 'AUSTA SuperApp needs this permission to function properly',
      buttonNeutral: 'Ask Me Later',
      buttonNegative: 'Cancel',
      buttonPositive: 'OK',
    };

    const result = await PermissionsAndroid.request(permission, requestOptions);
    
    return {
      permission,
      result: result as PermissionResult
    };
  } catch (error) {
    console.error(`Error requesting permission ${permission}:`, error);
    return {
      permission,
      result: PermissionResult.DENIED
    };
  }
};

/**
 * Checks if the app has been granted necessary permissions on Android.
 * Specifically, it checks for the `READ_EXTERNAL_STORAGE` permission,
 * which is required to access files on the device's storage.
 * 
 * @returns A promise that resolves to `true` if the permission is granted, and `false` otherwise.
 */
export const checkAndroidPermissions = async (): Promise<boolean> => {
  // Check if the platform is Android
  if (Platform.OS !== 'android') {
    // If not Android, return true (permissions not relevant)
    return true;
  }

  try {
    // Try to grant the READ_EXTERNAL_STORAGE permission
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      {
        title: 'Storage Permission',
        message: 'AUSTA SuperApp needs access to your storage to access files',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      },
    );

    // Return true if permission is granted, false otherwise
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (error) {
    // Catch any errors during permission request and return false
    console.error('Error requesting permission:', error);
    return false;
  }
};

/**
 * Checks and requests multiple Android permissions at once.
 * 
 * @param permissions Array of Android permissions to request
 * @returns A promise that resolves to an array of PermissionRequestResult objects
 */
export const requestMultipleAndroidPermissions = async (
  permissions: string[]
): Promise<PermissionRequestResult[]> => {
  // Check if the platform is Android
  if (Platform.OS !== 'android') {
    // If not Android, return all as granted (permissions not relevant)
    return permissions.map(permission => ({
      permission,
      result: PermissionResult.GRANTED
    }));
  }

  try {
    const results = await PermissionsAndroid.requestMultiple(permissions);
    
    return Object.entries(results).map(([permission, result]) => ({
      permission,
      result: result as PermissionResult
    }));
  } catch (error) {
    console.error('Error requesting multiple permissions:', error);
    return permissions.map(permission => ({
      permission,
      result: PermissionResult.DENIED
    }));
  }
};

/**
 * Checks and requests permissions needed for the Health journey.
 * This includes camera and location permissions.
 * 
 * @returns A promise that resolves to an object containing the results for each permission
 */
export const requestHealthJourneyPermissions = async (): Promise<{
  camera: PermissionResult;
  location: PermissionResult;
}> => {
  // Check if the platform is Android
  if (Platform.OS !== 'android') {
    // If not Android, return all as granted (permissions not relevant)
    return {
      camera: PermissionResult.GRANTED,
      location: PermissionResult.GRANTED
    };
  }

  try {
    const results = await requestMultipleAndroidPermissions([
      PermissionsAndroid.PERMISSIONS.CAMERA,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    ]);

    const resultMap = results.reduce((acc, { permission, result }) => {
      if (permission === PermissionsAndroid.PERMISSIONS.CAMERA) {
        acc.camera = result;
      } else if (permission === PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION) {
        acc.location = result;
      }
      return acc;
    }, { 
      camera: PermissionResult.DENIED, 
      location: PermissionResult.DENIED 
    });

    return resultMap;
  } catch (error) {
    console.error('Error requesting Health journey permissions:', error);
    return {
      camera: PermissionResult.DENIED,
      location: PermissionResult.DENIED
    };
  }
};