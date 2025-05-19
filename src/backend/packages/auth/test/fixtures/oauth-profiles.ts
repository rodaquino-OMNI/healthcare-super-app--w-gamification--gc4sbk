/**
 * OAuth Profile Fixtures
 * 
 * This file provides standardized mock OAuth profiles from different providers
 * (Google, Facebook, Apple) for testing OAuth authentication strategies.
 * 
 * These fixtures match the structure of real provider responses and include
 * provider-specific formats, profile images, email variations, and account
 * verification states.
 */

/**
 * Base OAuth Profile Interface
 * Common properties across all OAuth providers
 */
export interface BaseOAuthProfile {
  id: string;
  displayName: string;
  provider: string;
  emails?: Array<{ value: string; verified?: boolean }>;
  photos?: Array<{ value: string }>;
  name?: {
    familyName?: string;
    givenName?: string;
    middleName?: string;
  };
}

/**
 * Google OAuth Profile Interface
 * Extends base with Google-specific properties
 */
export interface GoogleOAuthProfile extends BaseOAuthProfile {
  provider: 'google';
  _json: {
    sub: string;
    name: string;
    given_name: string;
    family_name: string;
    picture: string;
    email: string;
    email_verified: boolean;
    locale: string;
  };
}

/**
 * Facebook OAuth Profile Interface
 * Extends base with Facebook-specific properties
 */
export interface FacebookOAuthProfile extends BaseOAuthProfile {
  provider: 'facebook';
  _json: {
    id: string;
    name: string;
    first_name: string;
    last_name: string;
    picture: {
      data: {
        url: string;
        width: number;
        height: number;
        is_silhouette: boolean;
      };
    };
    email: string;
  };
}

/**
 * Apple OAuth Profile Interface
 * Extends base with Apple-specific properties
 */
export interface AppleOAuthProfile extends BaseOAuthProfile {
  provider: 'apple';
  _json: {
    sub: string;
    email?: string;
    email_verified?: boolean;
    is_private_email?: boolean;
    name?: {
      firstName: string;
      lastName: string;
    };
  };
}

/**
 * Mock Google OAuth Profile
 * Represents a verified Google account with profile image
 */
export const mockGoogleProfile: GoogleOAuthProfile = {
  id: '123456789012345678901',
  displayName: 'John Doe',
  name: {
    familyName: 'Doe',
    givenName: 'John'
  },
  emails: [
    { value: 'john.doe@gmail.com', verified: true }
  ],
  photos: [
    { value: 'https://lh3.googleusercontent.com/a-/AOh14Gi0DgQZN_U9V5TPQkVYj2eEj9a5H5sf5mZ9n=s96-c' }
  ],
  provider: 'google',
  _json: {
    sub: '123456789012345678901',
    name: 'John Doe',
    given_name: 'John',
    family_name: 'Doe',
    picture: 'https://lh3.googleusercontent.com/a-/AOh14Gi0DgQZN_U9V5TPQkVYj2eEj9a5H5sf5mZ9n=s96-c',
    email: 'john.doe@gmail.com',
    email_verified: true,
    locale: 'en'
  }
};

/**
 * Mock Google OAuth Profile - Unverified
 * Represents an unverified Google account for testing verification flows
 */
export const mockGoogleProfileUnverified: GoogleOAuthProfile = {
  ...mockGoogleProfile,
  id: '987654321098765432109',
  emails: [
    { value: 'john.unverified@gmail.com', verified: false }
  ],
  _json: {
    ...mockGoogleProfile._json,
    sub: '987654321098765432109',
    email: 'john.unverified@gmail.com',
    email_verified: false
  }
};

/**
 * Mock Facebook OAuth Profile
 * Represents a standard Facebook account with profile image
 */
export const mockFacebookProfile: FacebookOAuthProfile = {
  id: '1234567890',
  displayName: 'Jane Smith',
  name: {
    familyName: 'Smith',
    givenName: 'Jane'
  },
  emails: [
    { value: 'jane.smith@example.com' }
  ],
  photos: [
    { value: 'https://platform-lookaside.fbsbx.com/platform/profilepic/?asid=1234567890' }
  ],
  provider: 'facebook',
  _json: {
    id: '1234567890',
    name: 'Jane Smith',
    first_name: 'Jane',
    last_name: 'Smith',
    picture: {
      data: {
        url: 'https://platform-lookaside.fbsbx.com/platform/profilepic/?asid=1234567890',
        width: 100,
        height: 100,
        is_silhouette: false
      }
    },
    email: 'jane.smith@example.com'
  }
};

/**
 * Mock Facebook OAuth Profile - No Email
 * Represents a Facebook account that hasn't shared their email
 */
export const mockFacebookProfileNoEmail: FacebookOAuthProfile = {
  ...mockFacebookProfile,
  id: '9876543210',
  emails: [],
  _json: {
    ...mockFacebookProfile._json,
    id: '9876543210',
    email: undefined
  }
};

/**
 * Mock Apple OAuth Profile - First Login
 * Represents an Apple account on first login (with name information)
 */
export const mockAppleProfileFirstLogin: AppleOAuthProfile = {
  id: '001234.abcdef1234567890abcdef1234567890.1234',
  displayName: 'Robert Johnson',
  name: {
    familyName: 'Johnson',
    givenName: 'Robert'
  },
  emails: [
    { value: 'robert.johnson@privaterelay.appleid.com', verified: true }
  ],
  provider: 'apple',
  _json: {
    sub: '001234.abcdef1234567890abcdef1234567890.1234',
    email: 'robert.johnson@privaterelay.appleid.com',
    email_verified: true,
    is_private_email: true,
    name: {
      firstName: 'Robert',
      lastName: 'Johnson'
    }
  }
};

/**
 * Mock Apple OAuth Profile - Subsequent Login
 * Represents an Apple account on subsequent login (without name information)
 */
export const mockAppleProfileSubsequentLogin: AppleOAuthProfile = {
  id: '001234.abcdef1234567890abcdef1234567890.1234',
  displayName: 'Robert Johnson', // Name must be stored from first login
  name: {
    familyName: 'Johnson',
    givenName: 'Robert'
  },
  emails: [
    { value: 'robert.johnson@privaterelay.appleid.com', verified: true }
  ],
  provider: 'apple',
  _json: {
    sub: '001234.abcdef1234567890abcdef1234567890.1234',
    email: 'robert.johnson@privaterelay.appleid.com',
    email_verified: true,
    is_private_email: true
    // Note: name is not provided on subsequent logins
  }
};

/**
 * Mock Apple OAuth Profile - Real Email
 * Represents an Apple account that shared their real email instead of a relay
 */
export const mockAppleProfileRealEmail: AppleOAuthProfile = {
  id: '001234.fedcba0987654321fedcba0987654321.5678',
  displayName: 'Sarah Williams',
  name: {
    familyName: 'Williams',
    givenName: 'Sarah'
  },
  emails: [
    { value: 'sarah.williams@example.com', verified: true }
  ],
  provider: 'apple',
  _json: {
    sub: '001234.fedcba0987654321fedcba0987654321.5678',
    email: 'sarah.williams@example.com',
    email_verified: true,
    is_private_email: false,
    name: {
      firstName: 'Sarah',
      lastName: 'Williams'
    }
  }
};