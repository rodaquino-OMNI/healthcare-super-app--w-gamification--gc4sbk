/**
 * Password Validation Test Fixtures
 * 
 * This module provides comprehensive test fixtures for password strength and security policy validation.
 * It contains categorized examples of weak, medium, and strong passwords, along with test cases for
 * specific password policy requirements (length, character types, etc.) and common security vulnerabilities.
 * 
 * These fixtures ensure consistent password policy enforcement across all authentication flows in the
 * AUSTA SuperApp, supporting both user registration and password change operations.
 */

/**
 * Interface representing a single password test case with expected validation results
 */
export interface PasswordTestCase {
  /** The password string to test */
  password: string;
  /** Description of what this test case is validating */
  description: string;
  /** Expected validation results for different criteria */
  expected: {
    /** Whether the password meets minimum length requirements */
    meetsMinLength: boolean;
    /** Whether the password contains at least one uppercase letter */
    hasUppercase: boolean;
    /** Whether the password contains at least one lowercase letter */
    hasLowercase: boolean;
    /** Whether the password contains at least one number */
    hasNumber: boolean;
    /** Whether the password contains at least one special character */
    hasSymbol: boolean;
    /** Whether the password is considered strong overall */
    isStrong: boolean;
  };
}

/**
 * Interface for categorized password test cases by strength
 */
export interface PasswordStrengthFixtures {
  /** Passwords that fail multiple strength criteria */
  weak: PasswordTestCase[];
  /** Passwords that meet some but not all strength criteria */
  medium: PasswordTestCase[];
  /** Passwords that meet all strength criteria */
  strong: PasswordTestCase[];
}

/**
 * Interface for password policy test cases
 */
export interface PasswordPolicyFixtures {
  /** Test cases for minimum length requirement */
  length: PasswordTestCase[];
  /** Test cases for uppercase letter requirement */
  uppercase: PasswordTestCase[];
  /** Test cases for lowercase letter requirement */
  lowercase: PasswordTestCase[];
  /** Test cases for number requirement */
  numbers: PasswordTestCase[];
  /** Test cases for special character requirement */
  symbols: PasswordTestCase[];
  /** Test cases for password history (previously used passwords) */
  history: string[];
}

/**
 * Interface for common password vulnerability test cases
 */
export interface PasswordVulnerabilityFixtures {
  /** Common passwords that should be rejected */
  common: PasswordTestCase[];
  /** Passwords containing personal information */
  personal: PasswordTestCase[];
  /** Passwords with simple patterns */
  patterns: PasswordTestCase[];
  /** Passwords with keyboard sequences */
  sequences: PasswordTestCase[];
}

/**
 * Password strength test fixtures categorized as weak, medium, and strong
 */
export const passwordStrengthFixtures: PasswordStrengthFixtures = {
  weak: [
    {
      password: 'password',
      description: 'Common dictionary word',
      expected: {
        meetsMinLength: true,
        hasUppercase: false,
        hasLowercase: true,
        hasNumber: false,
        hasSymbol: false,
        isStrong: false,
      },
    },
    {
      password: '12345678',
      description: 'Only numbers',
      expected: {
        meetsMinLength: true,
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: true,
        hasSymbol: false,
        isStrong: false,
      },
    },
    {
      password: 'abcdef',
      description: 'Too short, only lowercase',
      expected: {
        meetsMinLength: false,
        hasUppercase: false,
        hasLowercase: true,
        hasNumber: false,
        hasSymbol: false,
        isStrong: false,
      },
    },
    {
      password: 'ALLCAPS',
      description: 'Only uppercase letters',
      expected: {
        meetsMinLength: true,
        hasUppercase: true,
        hasLowercase: false,
        hasNumber: false,
        hasSymbol: false,
        isStrong: false,
      },
    },
    {
      password: 'qwerty123',
      description: 'Common keyboard sequence with numbers',
      expected: {
        meetsMinLength: true,
        hasUppercase: false,
        hasLowercase: true,
        hasNumber: true,
        hasSymbol: false,
        isStrong: false,
      },
    },
  ],
  medium: [
    {
      password: 'Password123',
      description: 'Has uppercase, lowercase, and numbers but no symbol',
      expected: {
        meetsMinLength: true,
        hasUppercase: true,
        hasLowercase: true,
        hasNumber: true,
        hasSymbol: false,
        isStrong: false,
      },
    },
    {
      password: 'pass@word',
      description: 'Has lowercase and symbol but no uppercase or numbers',
      expected: {
        meetsMinLength: true,
        hasUppercase: false,
        hasLowercase: true,
        hasNumber: false,
        hasSymbol: true,
        isStrong: false,
      },
    },
    {
      password: 'UPPER@123',
      description: 'Has uppercase, numbers, and symbol but no lowercase',
      expected: {
        meetsMinLength: true,
        hasUppercase: true,
        hasLowercase: false,
        hasNumber: true,
        hasSymbol: true,
        isStrong: false,
      },
    },
    {
      password: 'Abcdefghij',
      description: 'Long with uppercase and lowercase but no numbers or symbols',
      expected: {
        meetsMinLength: true,
        hasUppercase: true,
        hasLowercase: true,
        hasNumber: false,
        hasSymbol: false,
        isStrong: false,
      },
    },
    {
      password: 'a1@Def',
      description: 'Has all character types but too short',
      expected: {
        meetsMinLength: false,
        hasUppercase: true,
        hasLowercase: true,
        hasNumber: true,
        hasSymbol: true,
        isStrong: false,
      },
    },
  ],
  strong: [
    {
      password: 'P@ssw0rd123!',
      description: 'Has all character types and sufficient length',
      expected: {
        meetsMinLength: true,
        hasUppercase: true,
        hasLowercase: true,
        hasNumber: true,
        hasSymbol: true,
        isStrong: true,
      },
    },
    {
      password: 'Austa#2023SuperApp',
      description: 'Long with all character types',
      expected: {
        meetsMinLength: true,
        hasUppercase: true,
        hasLowercase: true,
        hasNumber: true,
        hasSymbol: true,
        isStrong: true,
      },
    },
    {
      password: 'H3alth&W3llness!',
      description: 'Health-themed strong password',
      expected: {
        meetsMinLength: true,
        hasUppercase: true,
        hasLowercase: true,
        hasNumber: true,
        hasSymbol: true,
        isStrong: true,
      },
    },
    {
      password: '9Tr@vel*Plans2023',
      description: 'Travel-themed strong password',
      expected: {
        meetsMinLength: true,
        hasUppercase: true,
        hasLowercase: true,
        hasNumber: true,
        hasSymbol: true,
        isStrong: true,
      },
    },
    {
      password: 'C0mpl3x!P@ssw0rd#2023',
      description: 'Very complex password with multiple symbols',
      expected: {
        meetsMinLength: true,
        hasUppercase: true,
        hasLowercase: true,
        hasNumber: true,
        hasSymbol: true,
        isStrong: true,
      },
    },
  ],
};

/**
 * Password policy test fixtures for specific requirements
 */
export const passwordPolicyFixtures: PasswordPolicyFixtures = {
  length: [
    {
      password: 'Abc1!',
      description: 'Too short (5 chars) but has all character types',
      expected: {
        meetsMinLength: false,
        hasUppercase: true,
        hasLowercase: true,
        hasNumber: true,
        hasSymbol: true,
        isStrong: false,
      },
    },
    {
      password: 'Abc1!Def',
      description: 'Exactly 8 chars with all character types',
      expected: {
        meetsMinLength: true,
        hasUppercase: true,
        hasLowercase: true,
        hasNumber: true,
        hasSymbol: true,
        isStrong: true,
      },
    },
    {
      password: 'Abcdefghijklmnop1!',
      description: 'Very long (18 chars) with all character types',
      expected: {
        meetsMinLength: true,
        hasUppercase: true,
        hasLowercase: true,
        hasNumber: true,
        hasSymbol: true,
        isStrong: true,
      },
    },
    {
      password: 'Ab1!',
      description: 'Very short (4 chars) with all character types',
      expected: {
        meetsMinLength: false,
        hasUppercase: true,
        hasLowercase: true,
        hasNumber: true,
        hasSymbol: true,
        isStrong: false,
      },
    },
    {
      password: 'Abcdefg',
      description: 'Exactly 7 chars (below min length of 8)',
      expected: {
        meetsMinLength: false,
        hasUppercase: true,
        hasLowercase: true,
        hasNumber: false,
        hasSymbol: false,
        isStrong: false,
      },
    },
  ],
  uppercase: [
    {
      password: 'password123!',
      description: 'No uppercase letters',
      expected: {
        meetsMinLength: true,
        hasUppercase: false,
        hasLowercase: true,
        hasNumber: true,
        hasSymbol: true,
        isStrong: false,
      },
    },
    {
      password: 'Password123!',
      description: 'One uppercase letter',
      expected: {
        meetsMinLength: true,
        hasUppercase: true,
        hasLowercase: true,
        hasNumber: true,
        hasSymbol: true,
        isStrong: true,
      },
    },
    {
      password: 'PASSword123!',
      description: 'Multiple uppercase letters',
      expected: {
        meetsMinLength: true,
        hasUppercase: true,
        hasLowercase: true,
        hasNumber: true,
        hasSymbol: true,
        isStrong: true,
      },
    },
    {
      password: 'PASSWORD123!',
      description: 'All uppercase letters (no lowercase)',
      expected: {
        meetsMinLength: true,
        hasUppercase: true,
        hasLowercase: false,
        hasNumber: true,
        hasSymbol: true,
        isStrong: false,
      },
    },
  ],
  lowercase: [
    {
      password: 'PASSWORD123!',
      description: 'No lowercase letters',
      expected: {
        meetsMinLength: true,
        hasUppercase: true,
        hasLowercase: false,
        hasNumber: true,
        hasSymbol: true,
        isStrong: false,
      },
    },
    {
      password: 'PASSWORd123!',
      description: 'One lowercase letter',
      expected: {
        meetsMinLength: true,
        hasUppercase: true,
        hasLowercase: true,
        hasNumber: true,
        hasSymbol: true,
        isStrong: true,
      },
    },
    {
      password: 'PASwordS123!',
      description: 'Multiple lowercase letters',
      expected: {
        meetsMinLength: true,
        hasUppercase: true,
        hasLowercase: true,
        hasNumber: true,
        hasSymbol: true,
        isStrong: true,
      },
    },
    {
      password: 'password123!',
      description: 'All lowercase letters (no uppercase)',
      expected: {
        meetsMinLength: true,
        hasUppercase: false,
        hasLowercase: true,
        hasNumber: true,
        hasSymbol: true,
        isStrong: false,
      },
    },
  ],
  numbers: [
    {
      password: 'Password!',
      description: 'No numbers',
      expected: {
        meetsMinLength: true,
        hasUppercase: true,
        hasLowercase: true,
        hasNumber: false,
        hasSymbol: true,
        isStrong: false,
      },
    },
    {
      password: 'Password1!',
      description: 'One number',
      expected: {
        meetsMinLength: true,
        hasUppercase: true,
        hasLowercase: true,
        hasNumber: true,
        hasSymbol: true,
        isStrong: true,
      },
    },
    {
      password: 'Password123!',
      description: 'Multiple numbers',
      expected: {
        meetsMinLength: true,
        hasUppercase: true,
        hasLowercase: true,
        hasNumber: true,
        hasSymbol: true,
        isStrong: true,
      },
    },
    {
      password: '12345678!A',
      description: 'Mostly numbers',
      expected: {
        meetsMinLength: true,
        hasUppercase: true,
        hasLowercase: false,
        hasNumber: true,
        hasSymbol: true,
        isStrong: false,
      },
    },
  ],
  symbols: [
    {
      password: 'Password123',
      description: 'No symbols',
      expected: {
        meetsMinLength: true,
        hasUppercase: true,
        hasLowercase: true,
        hasNumber: true,
        hasSymbol: false,
        isStrong: false,
      },
    },
    {
      password: 'Password123!',
      description: 'One symbol',
      expected: {
        meetsMinLength: true,
        hasUppercase: true,
        hasLowercase: true,
        hasNumber: true,
        hasSymbol: true,
        isStrong: true,
      },
    },
    {
      password: 'P@ssw0rd#123!',
      description: 'Multiple symbols',
      expected: {
        meetsMinLength: true,
        hasUppercase: true,
        hasLowercase: true,
        hasNumber: true,
        hasSymbol: true,
        isStrong: true,
      },
    },
    {
      password: 'P@$$w0rd!#*&',
      description: 'Many different symbols',
      expected: {
        meetsMinLength: true,
        hasUppercase: true,
        hasLowercase: true,
        hasNumber: true,
        hasSymbol: true,
        isStrong: true,
      },
    },
  ],
  // Sample of previously used passwords for history validation
  history: [
    'OldP@ssw0rd123',
    'Pr3v!ousP@ss',
    'AustaApp2022!',
    'H3althC@re!',
    'S3cur3P@ssw0rd',
  ],
};

/**
 * Common password vulnerability test fixtures
 */
export const passwordVulnerabilityFixtures: PasswordVulnerabilityFixtures = {
  common: [
    {
      password: 'Password123!',
      description: 'Very common password pattern',
      expected: {
        meetsMinLength: true,
        hasUppercase: true,
        hasLowercase: true,
        hasNumber: true,
        hasSymbol: true,
        isStrong: true, // Technically strong but common
      },
    },
    {
      password: 'Admin123!',
      description: 'Common admin password',
      expected: {
        meetsMinLength: true,
        hasUppercase: true,
        hasLowercase: true,
        hasNumber: true,
        hasSymbol: true,
        isStrong: true, // Technically strong but common
      },
    },
    {
      password: 'Welcome1!',
      description: 'Common welcome password',
      expected: {
        meetsMinLength: true,
        hasUppercase: true,
        hasLowercase: true,
        hasNumber: true,
        hasSymbol: true,
        isStrong: true, // Technically strong but common
      },
    },
    {
      password: 'Letmein1!',
      description: 'Common phrase password',
      expected: {
        meetsMinLength: true,
        hasUppercase: true,
        hasLowercase: true,
        hasNumber: true,
        hasSymbol: true,
        isStrong: true, // Technically strong but common
      },
    },
  ],
  personal: [
    {
      password: 'Austa2023!',
      description: 'Contains company name and year',
      expected: {
        meetsMinLength: true,
        hasUppercase: true,
        hasLowercase: true,
        hasNumber: true,
        hasSymbol: true,
        isStrong: true, // Technically strong but contains personal info
      },
    },
    {
      password: 'Janeiro1!',
      description: 'Contains location name (Rio de Janeiro)',
      expected: {
        meetsMinLength: true,
        hasUppercase: true,
        hasLowercase: true,
        hasNumber: true,
        hasSymbol: true,
        isStrong: true, // Technically strong but contains personal info
      },
    },
    {
      password: 'Saude2023!',
      description: 'Contains health in Portuguese with year',
      expected: {
        meetsMinLength: true,
        hasUppercase: true,
        hasLowercase: true,
        hasNumber: true,
        hasSymbol: true,
        isStrong: true, // Technically strong but contains personal info
      },
    },
  ],
  patterns: [
    {
      password: 'Aaaaa123!',
      description: 'Repeating characters',
      expected: {
        meetsMinLength: true,
        hasUppercase: true,
        hasLowercase: true,
        hasNumber: true,
        hasSymbol: true,
        isStrong: true, // Technically strong but has pattern
      },
    },
    {
      password: 'Abcdef1!',
      description: 'Sequential letters',
      expected: {
        meetsMinLength: true,
        hasUppercase: true,
        hasLowercase: true,
        hasNumber: true,
        hasSymbol: true,
        isStrong: true, // Technically strong but has pattern
      },
    },
    {
      password: 'Password1!',
      description: 'Word "password" with minimal additions',
      expected: {
        meetsMinLength: true,
        hasUppercase: true,
        hasLowercase: true,
        hasNumber: true,
        hasSymbol: true,
        isStrong: true, // Technically strong but has pattern
      },
    },
  ],
  sequences: [
    {
      password: 'Qwerty1!',
      description: 'Keyboard sequence QWERTY',
      expected: {
        meetsMinLength: true,
        hasUppercase: true,
        hasLowercase: true,
        hasNumber: true,
        hasSymbol: true,
        isStrong: true, // Technically strong but has keyboard sequence
      },
    },
    {
      password: 'Asdfgh1!',
      description: 'Keyboard sequence ASDFGH',
      expected: {
        meetsMinLength: true,
        hasUppercase: true,
        hasLowercase: true,
        hasNumber: true,
        hasSymbol: true,
        isStrong: true, // Technically strong but has keyboard sequence
      },
    },
    {
      password: 'Zxcvbn1!',
      description: 'Keyboard sequence ZXCVBN',
      expected: {
        meetsMinLength: true,
        hasUppercase: true,
        hasLowercase: true,
        hasNumber: true,
        hasSymbol: true,
        isStrong: true, // Technically strong but has keyboard sequence
      },
    },
  ],
};

/**
 * Interface for password policy configuration test cases
 */
export interface PasswordPolicyConfigFixtures {
  /** Test cases for different minimum length configurations */
  minLength: {
    /** The minimum length value being tested */
    value: number;
    /** Test passwords for this configuration */
    passwords: PasswordTestCase[];
  }[];
  /** Test cases for password history validation */
  historyCount: {
    /** The history count value being tested */
    value: number;
    /** Previous passwords to test against */
    previousPasswords: string[];
    /** New passwords to test */
    newPasswords: PasswordTestCase[];
  }[];
  /** Test cases for password age validation */
  maxAgeDays: {
    /** The maximum age in days being tested */
    value: number;
    /** Test cases with different password ages */
    passwords: {
      /** The password string */
      password: string;
      /** Age of the password in days */
      ageDays: number;
      /** Whether the password should be considered expired */
      isExpired: boolean;
    }[];
  }[];
}

/**
 * Password policy configuration test fixtures
 * Based on the configurable password policy in the Auth Service
 */
export const passwordPolicyConfigFixtures: PasswordPolicyConfigFixtures = {
  minLength: [
    {
      value: 8, // Default in web validation
      passwords: [
        {
          password: 'P@ss123',
          description: 'Too short for min length 8',
          expected: {
            meetsMinLength: false,
            hasUppercase: true,
            hasLowercase: true,
            hasNumber: true,
            hasSymbol: true,
            isStrong: false,
          },
        },
        {
          password: 'P@ssw123',
          description: 'Exactly min length 8',
          expected: {
            meetsMinLength: true,
            hasUppercase: true,
            hasLowercase: true,
            hasNumber: true,
            hasSymbol: true,
            isStrong: true,
          },
        },
      ],
    },
    {
      value: 10, // Default in auth service config
      passwords: [
        {
          password: 'P@ssw123',
          description: 'Too short for min length 10',
          expected: {
            meetsMinLength: false,
            hasUppercase: true,
            hasLowercase: true,
            hasNumber: true,
            hasSymbol: true,
            isStrong: false,
          },
        },
        {
          password: 'P@ssword123',
          description: 'Exactly min length 10',
          expected: {
            meetsMinLength: true,
            hasUppercase: true,
            hasLowercase: true,
            hasNumber: true,
            hasSymbol: true,
            isStrong: true,
          },
        },
      ],
    },
    {
      value: 12, // Enhanced security setting
      passwords: [
        {
          password: 'P@ssword123',
          description: 'Too short for min length 12',
          expected: {
            meetsMinLength: false,
            hasUppercase: true,
            hasLowercase: true,
            hasNumber: true,
            hasSymbol: true,
            isStrong: false,
          },
        },
        {
          password: 'P@ssword123XY',
          description: 'Exactly min length 12',
          expected: {
            meetsMinLength: true,
            hasUppercase: true,
            hasLowercase: true,
            hasNumber: true,
            hasSymbol: true,
            isStrong: true,
          },
        },
      ],
    },
  ],
  historyCount: [
    {
      value: 3,
      previousPasswords: [
        'OldP@ssw0rd123',
        'Pr3v!ousP@ss',
        'AustaApp2022!',
      ],
      newPasswords: [
        {
          password: 'OldP@ssw0rd123',
          description: 'Matches most recent previous password',
          expected: {
            meetsMinLength: true,
            hasUppercase: true,
            hasLowercase: true,
            hasNumber: true,
            hasSymbol: true,
            isStrong: true,
          },
        },
        {
          password: 'AustaApp2022!',
          description: 'Matches oldest previous password within history',
          expected: {
            meetsMinLength: true,
            hasUppercase: true,
            hasLowercase: true,
            hasNumber: true,
            hasSymbol: true,
            isStrong: true,
          },
        },
        {
          password: 'N3wP@ssw0rd!',
          description: 'Does not match any previous password',
          expected: {
            meetsMinLength: true,
            hasUppercase: true,
            hasLowercase: true,
            hasNumber: true,
            hasSymbol: true,
            isStrong: true,
          },
        },
      ],
    },
    {
      value: 5, // Default in auth service config
      previousPasswords: [
        'OldP@ssw0rd123',
        'Pr3v!ousP@ss',
        'AustaApp2022!',
        'H3althC@re!',
        'S3cur3P@ssw0rd',
      ],
      newPasswords: [
        {
          password: 'OldP@ssw0rd123',
          description: 'Matches most recent previous password',
          expected: {
            meetsMinLength: true,
            hasUppercase: true,
            hasLowercase: true,
            hasNumber: true,
            hasSymbol: true,
            isStrong: true,
          },
        },
        {
          password: 'S3cur3P@ssw0rd',
          description: 'Matches oldest previous password within history',
          expected: {
            meetsMinLength: true,
            hasUppercase: true,
            hasLowercase: true,
            hasNumber: true,
            hasSymbol: true,
            isStrong: true,
          },
        },
        {
          password: 'N3wP@ssw0rd!',
          description: 'Does not match any previous password',
          expected: {
            meetsMinLength: true,
            hasUppercase: true,
            hasLowercase: true,
            hasNumber: true,
            hasSymbol: true,
            isStrong: true,
          },
        },
      ],
    },
  ],
  maxAgeDays: [
    {
      value: 90, // Default in auth service config
      passwords: [
        {
          password: 'CurrentP@ss123',
          ageDays: 30,
          isExpired: false,
        },
        {
          password: 'AlmostExpiredP@ss123',
          ageDays: 89,
          isExpired: false,
        },
        {
          password: 'JustExpiredP@ss123',
          ageDays: 90,
          isExpired: true,
        },
        {
          password: 'OldP@ss123',
          ageDays: 120,
          isExpired: true,
        },
      ],
    },
    {
      value: 60, // More strict setting
      passwords: [
        {
          password: 'CurrentP@ss123',
          ageDays: 30,
          isExpired: false,
        },
        {
          password: 'AlmostExpiredP@ss123',
          ageDays: 59,
          isExpired: false,
        },
        {
          password: 'JustExpiredP@ss123',
          ageDays: 60,
          isExpired: true,
        },
        {
          password: 'OldP@ss123',
          ageDays: 90,
          isExpired: true,
        },
      ],
    },
  ],
};

/**
 * Interface for account lockout policy test fixtures
 */
export interface AccountLockoutFixtures {
  /** Test cases for maximum failed attempts */
  maxAttempts: {
    /** The maximum attempts value being tested */
    value: number;
    /** Test cases with different attempt counts */
    attempts: {
      /** Number of failed attempts */
      count: number;
      /** Whether the account should be locked */
      shouldLock: boolean;
    }[];
  }[];
  /** Test cases for lockout duration */
  lockoutDuration: {
    /** The lockout duration in minutes being tested */
    value: number;
    /** Test cases with different elapsed times */
    elapsedTimes: {
      /** Minutes elapsed since lockout */
      minutes: number;
      /** Whether the lockout should be lifted */
      shouldUnlock: boolean;
    }[];
  }[];
}

/**
 * Account lockout policy test fixtures
 * Based on the configurable lockout policy in the Auth Service
 */
export const accountLockoutFixtures: AccountLockoutFixtures = {
  maxAttempts: [
    {
      value: 5, // Default in auth service config
      attempts: [
        { count: 3, shouldLock: false },
        { count: 4, shouldLock: false },
        { count: 5, shouldLock: true },
        { count: 6, shouldLock: true },
      ],
    },
    {
      value: 3, // More strict setting
      attempts: [
        { count: 2, shouldLock: false },
        { count: 3, shouldLock: true },
        { count: 4, shouldLock: true },
      ],
    },
  ],
  lockoutDuration: [
    {
      value: 30, // Default in auth service config
      elapsedTimes: [
        { minutes: 15, shouldUnlock: false },
        { minutes: 29, shouldUnlock: false },
        { minutes: 30, shouldUnlock: true },
        { minutes: 45, shouldUnlock: true },
      ],
    },
    {
      value: 60, // More strict setting
      elapsedTimes: [
        { minutes: 30, shouldUnlock: false },
        { minutes: 59, shouldUnlock: false },
        { minutes: 60, shouldUnlock: true },
        { minutes: 90, shouldUnlock: true },
      ],
    },
  ],
};

/**
 * Combined password fixtures for comprehensive testing
 */
export const combinedPasswordFixtures = {
  ...passwordStrengthFixtures,
  policy: passwordPolicyFixtures,
  vulnerability: passwordVulnerabilityFixtures,
  policyConfig: passwordPolicyConfigFixtures,
  accountLockout: accountLockoutFixtures,
  // Additional test cases for edge cases
  edgeCases: [
    {
      password: ' P@ss1 ',
      description: 'Contains whitespace at beginning and end',
      expected: {
        meetsMinLength: false,
        hasUppercase: true,
        hasLowercase: true,
        hasNumber: true,
        hasSymbol: true,
        isStrong: false,
      },
    },
    {
      password: 'P@ss word1',
      description: 'Contains whitespace in the middle',
      expected: {
        meetsMinLength: true,
        hasUppercase: true,
        hasLowercase: true,
        hasNumber: true,
        hasSymbol: true,
        isStrong: true,
      },
    },
    {
      password: 'Пароль123!',
      description: 'Contains non-Latin characters (Cyrillic)',
      expected: {
        meetsMinLength: true,
        hasUppercase: true,
        hasLowercase: true,
        hasNumber: true,
        hasSymbol: true,
        isStrong: true,
      },
    },
    {
      password: 'Senha123!',
      description: 'Contains Portuguese word for password',
      expected: {
        meetsMinLength: true,
        hasUppercase: true,
        hasLowercase: true,
        hasNumber: true,
        hasSymbol: true,
        isStrong: true,
      },
    },
    {
      password: '𝓟𝓪𝓼𝓼𝔀𝓸𝓻𝓭𝟏!',
      description: 'Contains fancy Unicode characters',
      expected: {
        meetsMinLength: true,
        hasUppercase: true,
        hasLowercase: true,
        hasNumber: true,
        hasSymbol: true,
        isStrong: true,
      },
    },
  ],
};