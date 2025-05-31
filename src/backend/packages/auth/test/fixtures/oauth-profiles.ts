/**
 * OAuth Profile Fixtures
 * 
 * This file provides standardized mock OAuth profiles from different providers
 * (Google, Facebook, Apple) for testing OAuth authentication strategies.
 * 
 * These fixtures are essential for testing the OAuthStrategy and its
 * provider-specific implementations, ensuring consistent behavior across
 * all authentication methods.
 */

/**
 * Google OAuth Profile
 * 
 * Structure based on passport-google-oauth20 profile format
 */
export const googleProfile = {
  id: '123456789012345678901',
  displayName: 'John Doe',
  name: {
    givenName: 'John',
    familyName: 'Doe'
  },
  emails: [
    {
      value: 'john.doe@gmail.com',
      verified: true
    }
  ],
  photos: [
    {
      value: 'https://lh3.googleusercontent.com/a-/AOh14Gi0DgQb8HESk_IAUIFAfGK-6O_zSPJwGJ-kN8Vh=s96-c'
    }
  ],
  provider: 'google',
  _raw: '{"sub":"123456789012345678901","name":"John Doe","given_name":"John","family_name":"Doe","picture":"https://lh3.googleusercontent.com/a-/AOh14Gi0DgQb8HESk_IAUIFAfGK-6O_zSPJwGJ-kN8Vh=s96-c","email":"john.doe@gmail.com","email_verified":true}',
  _json: {
    sub: '123456789012345678901',
    name: 'John Doe',
    given_name: 'John',
    family_name: 'Doe',
    picture: 'https://lh3.googleusercontent.com/a-/AOh14Gi0DgQb8HESk_IAUIFAfGK-6O_zSPJwGJ-kN8Vh=s96-c',
    email: 'john.doe@gmail.com',
    email_verified: true
  }
};

/**
 * Google OAuth Profile with unverified email
 */
export const googleProfileUnverifiedEmail = {
  ...googleProfile,
  emails: [
    {
      value: 'john.doe@gmail.com',
      verified: false
    }
  ],
  _raw: '{"sub":"123456789012345678901","name":"John Doe","given_name":"John","family_name":"Doe","picture":"https://lh3.googleusercontent.com/a-/AOh14Gi0DgQb8HESk_IAUIFAfGK-6O_zSPJwGJ-kN8Vh=s96-c","email":"john.doe@gmail.com","email_verified":false}',
  _json: {
    ...googleProfile._json,
    email_verified: false
  }
};

/**
 * Facebook OAuth Profile
 * 
 * Structure based on passport-facebook profile format
 */
export const facebookProfile = {
  id: '1234567890',
  displayName: 'Jane Smith',
  name: {
    givenName: 'Jane',
    familyName: 'Smith'
  },
  emails: [
    {
      value: 'jane.smith@example.com'
    }
  ],
  photos: [
    {
      value: 'https://graph.facebook.com/1234567890/picture?type=large'
    }
  ],
  provider: 'facebook',
  _raw: '{"id":"1234567890","name":"Jane Smith","first_name":"Jane","last_name":"Smith","picture":{"data":{"height":320,"is_silhouette":false,"url":"https://graph.facebook.com/1234567890/picture?type=large","width":320}},"email":"jane.smith@example.com"}',
  _json: {
    id: '1234567890',
    name: 'Jane Smith',
    first_name: 'Jane',
    last_name: 'Smith',
    picture: {
      data: {
        height: 320,
        is_silhouette: false,
        url: 'https://graph.facebook.com/1234567890/picture?type=large',
        width: 320
      }
    },
    email: 'jane.smith@example.com'
  }
};

/**
 * Facebook OAuth Profile without email
 */
export const facebookProfileNoEmail = {
  ...facebookProfile,
  emails: [],
  _raw: '{"id":"1234567890","name":"Jane Smith","first_name":"Jane","last_name":"Smith","picture":{"data":{"height":320,"is_silhouette":false,"url":"https://graph.facebook.com/1234567890/picture?type=large","width":320}}}',
  _json: {
    id: '1234567890',
    name: 'Jane Smith',
    first_name: 'Jane',
    last_name: 'Smith',
    picture: {
      data: {
        height: 320,
        is_silhouette: false,
        url: 'https://graph.facebook.com/1234567890/picture?type=large',
        width: 320
      }
    }
  }
};

/**
 * Apple OAuth Profile - First Login
 * 
 * Structure based on passport-apple profile format
 * Apple only provides name information on the first login
 */
export const appleProfileFirstLogin = {
  id: '001234.abcdef1234567890abcdef1234567890.1234',
  name: {
    firstName: 'Robert',
    lastName: 'Johnson'
  },
  emails: [
    {
      value: 'robert.johnson@icloud.com'
    }
  ],
  emailVerified: true,
  isPrivateEmail: false,
  provider: 'apple',
  _raw: '{"sub":"001234.abcdef1234567890abcdef1234567890.1234","email":"robert.johnson@icloud.com","email_verified":true,"is_private_email":false,"name":{"firstName":"Robert","lastName":"Johnson"}}',
  _json: {
    sub: '001234.abcdef1234567890abcdef1234567890.1234',
    email: 'robert.johnson@icloud.com',
    email_verified: true,
    is_private_email: false,
    name: {
      firstName: 'Robert',
      lastName: 'Johnson'
    }
  }
};

/**
 * Apple OAuth Profile - Subsequent Login
 * 
 * Apple doesn't provide name information on subsequent logins
 */
export const appleProfileSubsequentLogin = {
  id: '001234.abcdef1234567890abcdef1234567890.1234',
  emails: [
    {
      value: 'robert.johnson@icloud.com'
    }
  ],
  emailVerified: true,
  isPrivateEmail: false,
  provider: 'apple',
  _raw: '{"sub":"001234.abcdef1234567890abcdef1234567890.1234","email":"robert.johnson@icloud.com","email_verified":true,"is_private_email":false}',
  _json: {
    sub: '001234.abcdef1234567890abcdef1234567890.1234',
    email: 'robert.johnson@icloud.com',
    email_verified: true,
    is_private_email: false
  }
};

/**
 * Apple OAuth Profile with Private Email
 * 
 * Apple provides a private relay email when the user chooses to hide their real email
 */
export const appleProfilePrivateEmail = {
  id: '001234.abcdef1234567890abcdef1234567890.1234',
  emails: [
    {
      value: 'private-relay@privaterelay.appleid.com'
    }
  ],
  emailVerified: true,
  isPrivateEmail: true,
  provider: 'apple',
  _raw: '{"sub":"001234.abcdef1234567890abcdef1234567890.1234","email":"private-relay@privaterelay.appleid.com","email_verified":true,"is_private_email":true}',
  _json: {
    sub: '001234.abcdef1234567890abcdef1234567890.1234',
    email: 'private-relay@privaterelay.appleid.com',
    email_verified: true,
    is_private_email: true
  }
};

/**
 * Collection of all OAuth profiles for convenience
 */
export const oauthProfiles = {
  google: googleProfile,
  googleUnverifiedEmail: googleProfileUnverifiedEmail,
  facebook: facebookProfile,
  facebookNoEmail: facebookProfileNoEmail,
  appleFirstLogin: appleProfileFirstLogin,
  appleSubsequentLogin: appleProfileSubsequentLogin,
  applePrivateEmail: appleProfilePrivateEmail
};

export default oauthProfiles;