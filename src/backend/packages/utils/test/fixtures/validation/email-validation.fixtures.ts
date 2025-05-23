/**
 * @file Email Validation Test Fixtures
 * @description Provides comprehensive test fixtures for email address validation across the AUSTA SuperApp.
 * These fixtures include valid emails with various formats, invalid emails with syntax errors, and edge cases.
 * Used for testing email validation functions in user registration, profile management, and communication workflows.
 *
 * @module @austa/utils/test/fixtures/validation/email
 */

/**
 * Interface for email validation test fixtures
 */
export interface EmailFixture {
  /** The email address to test */
  email: string;
  /** Description of the test case */
  description: string;
  /** Whether the email should be considered valid */
  valid: boolean;
  /** Tags for categorizing test cases */
  tags: EmailFixtureTag[];
}

/**
 * Tags for categorizing email test fixtures
 */
export type EmailFixtureTag = 
  | 'standard'        // Standard email format
  | 'complex'         // Complex email format with special characters
  | 'international'   // International domain or characters
  | 'subdomain'       // Contains subdomain(s)
  | 'ip'              // IP address as domain
  | 'quoted'          // Contains quoted sections
  | 'syntax-error'    // Contains syntax errors
  | 'domain-error'    // Domain-related errors
  | 'length-error'    // Length-related errors
  | 'character-error' // Invalid character errors
  | 'brazilian'       // Brazilian domain
  | 'edge-case';      // Unusual but technically valid format

/**
 * Collection of valid email addresses for testing
 */
export const validEmails: EmailFixture[] = [
  // Standard format emails
  {
    email: 'user@example.com',
    description: 'Simple email with common domain',
    valid: true,
    tags: ['standard']
  },
  {
    email: 'firstname.lastname@example.com',
    description: 'Email with dot in local part',
    valid: true,
    tags: ['standard']
  },
  {
    email: 'user123@example.com',
    description: 'Email with numbers in local part',
    valid: true,
    tags: ['standard']
  },
  {
    email: 'user-name@example.com',
    description: 'Email with hyphen in local part',
    valid: true,
    tags: ['standard']
  },
  {
    email: 'user_name@example.com',
    description: 'Email with underscore in local part',
    valid: true,
    tags: ['standard']
  },
  
  // Complex format emails
  {
    email: 'user+tag@example.com',
    description: 'Email with plus addressing',
    valid: true,
    tags: ['complex']
  },
  {
    email: 'user.name+tag@example.com',
    description: 'Email with dot and plus addressing',
    valid: true,
    tags: ['complex']
  },
  {
    email: '"user.name"@example.com',
    description: 'Email with quoted local part containing dot',
    valid: true,
    tags: ['complex', 'quoted']
  },
  {
    email: '"user@name"@example.com',
    description: 'Email with quoted local part containing @ symbol',
    valid: true,
    tags: ['complex', 'quoted', 'edge-case']
  },
  {
    email: '"very.unusual.@.unusual.com"@example.com',
    description: 'Email with quoted local part containing multiple special characters',
    valid: true,
    tags: ['complex', 'quoted', 'edge-case']
  },
  
  // Subdomain emails
  {
    email: 'user@subdomain.example.com',
    description: 'Email with one subdomain',
    valid: true,
    tags: ['standard', 'subdomain']
  },
  {
    email: 'user@sub.sub.example.com',
    description: 'Email with multiple subdomains',
    valid: true,
    tags: ['complex', 'subdomain']
  },
  
  // International domain emails
  {
    email: 'user@example.co.uk',
    description: 'Email with UK domain',
    valid: true,
    tags: ['standard', 'international']
  },
  {
    email: 'user@example.com.br',
    description: 'Email with Brazilian domain',
    valid: true,
    tags: ['standard', 'international', 'brazilian']
  },
  {
    email: 'user@xn--80akhbyknj4f.xn--p1ai',
    description: 'Email with punycode domain (IDN)',
    valid: true,
    tags: ['international', 'edge-case']
  },
  {
    email: 'user@example.рф',
    description: 'Email with Cyrillic TLD',
    valid: true,
    tags: ['international', 'edge-case']
  },
  
  // Brazilian specific emails
  {
    email: 'usuario@empresa.com.br',
    description: 'Standard Brazilian commercial email',
    valid: true,
    tags: ['standard', 'brazilian']
  },
  {
    email: 'aluno@universidade.edu.br',
    description: 'Brazilian educational email',
    valid: true,
    tags: ['standard', 'brazilian']
  },
  {
    email: 'funcionario@governo.gov.br',
    description: 'Brazilian government email',
    valid: true,
    tags: ['standard', 'brazilian']
  },
  {
    email: 'membro@organizacao.org.br',
    description: 'Brazilian organization email',
    valid: true,
    tags: ['standard', 'brazilian']
  },
  {
    email: 'usuario@dominio.br',
    description: 'Simple Brazilian TLD email',
    valid: true,
    tags: ['standard', 'brazilian']
  },
  
  // IP address domain emails
  {
    email: 'user@[192.168.1.1]',
    description: 'Email with IPv4 address as domain',
    valid: true,
    tags: ['complex', 'ip', 'edge-case']
  },
  {
    email: 'user@[IPv6:2001:db8::1]',
    description: 'Email with IPv6 address as domain',
    valid: true,
    tags: ['complex', 'ip', 'edge-case']
  },
  
  // Edge cases (unusual but valid)
  {
    email: '!#$%&\'*+-/=?^_`{|}~@example.com',
    description: 'Email with all allowed special characters in local part',
    valid: true,
    tags: ['complex', 'edge-case']
  },
  {
    email: 'user@example.museum',
    description: 'Email with unusual TLD',
    valid: true,
    tags: ['standard', 'edge-case']
  },
  {
    email: 'user@example.travel',
    description: 'Email with unusual TLD',
    valid: true,
    tags: ['standard', 'edge-case']
  },
  {
    email: 'a@b.c',
    description: 'Minimal length valid email',
    valid: true,
    tags: ['edge-case']
  }
];

/**
 * Collection of invalid email addresses for testing
 */
export const invalidEmails: EmailFixture[] = [
  // Missing components
  {
    email: 'userexample.com',
    description: 'Missing @ symbol',
    valid: false,
    tags: ['syntax-error']
  },
  {
    email: 'user@',
    description: 'Missing domain',
    valid: false,
    tags: ['syntax-error', 'domain-error']
  },
  {
    email: '@example.com',
    description: 'Missing local part',
    valid: false,
    tags: ['syntax-error']
  },
  {
    email: 'user@example',
    description: 'Missing TLD',
    valid: false,
    tags: ['syntax-error', 'domain-error']
  },
  
  // Multiple errors
  {
    email: 'user@example@domain.com',
    description: 'Multiple @ symbols',
    valid: false,
    tags: ['syntax-error']
  },
  {
    email: 'user..name@example.com',
    description: 'Consecutive dots in local part',
    valid: false,
    tags: ['syntax-error']
  },
  {
    email: 'user.@example.com',
    description: 'Dot at end of local part',
    valid: false,
    tags: ['syntax-error']
  },
  {
    email: '.user@example.com',
    description: 'Dot at beginning of local part',
    valid: false,
    tags: ['syntax-error']
  },
  
  // Invalid characters
  {
    email: 'user name@example.com',
    description: 'Space in local part',
    valid: false,
    tags: ['syntax-error', 'character-error']
  },
  {
    email: 'user\\name@example.com',
    description: 'Backslash in local part',
    valid: false,
    tags: ['syntax-error', 'character-error']
  },
  {
    email: 'user"name@example.com',
    description: 'Unquoted double quote in local part',
    valid: false,
    tags: ['syntax-error', 'character-error']
  },
  {
    email: 'user(comment)@example.com',
    description: 'Unquoted parentheses in local part',
    valid: false,
    tags: ['syntax-error', 'character-error']
  },
  
  // Domain errors
  {
    email: 'user@example..com',
    description: 'Consecutive dots in domain',
    valid: false,
    tags: ['syntax-error', 'domain-error']
  },
  {
    email: 'user@.example.com',
    description: 'Dot at beginning of domain',
    valid: false,
    tags: ['syntax-error', 'domain-error']
  },
  {
    email: 'user@example.com.',
    description: 'Dot at end of domain',
    valid: false,
    tags: ['syntax-error', 'domain-error']
  },
  {
    email: 'user@-example.com',
    description: 'Hyphen at beginning of domain',
    valid: false,
    tags: ['syntax-error', 'domain-error']
  },
  {
    email: 'user@example-.com',
    description: 'Hyphen at end of domain part',
    valid: false,
    tags: ['syntax-error', 'domain-error']
  },
  
  // Length errors
  {
    email: 'a'.repeat(65) + '@example.com',
    description: 'Local part too long (>64 characters)',
    valid: false,
    tags: ['length-error']
  },
  {
    email: 'user@' + 'a'.repeat(255) + '.com',
    description: 'Domain too long (>255 characters)',
    valid: false,
    tags: ['length-error', 'domain-error']
  },
  {
    email: 'user@example.' + 'a'.repeat(64),
    description: 'TLD too long (>63 characters)',
    valid: false,
    tags: ['length-error', 'domain-error']
  },
  
  // IP address errors
  {
    email: 'user@[192.168.1]',
    description: 'Invalid IPv4 format',
    valid: false,
    tags: ['syntax-error', 'ip', 'domain-error']
  },
  {
    email: 'user@[IPv6:2001:db8:1]',
    description: 'Invalid IPv6 format',
    valid: false,
    tags: ['syntax-error', 'ip', 'domain-error']
  },
  
  // Quoted string errors
  {
    email: '"user"name"@example.com',
    description: 'Unescaped quotes in quoted local part',
    valid: false,
    tags: ['syntax-error', 'quoted', 'character-error']
  },
  {
    email: '"user@example.com',
    description: 'Unclosed quote in local part',
    valid: false,
    tags: ['syntax-error', 'quoted', 'character-error']
  }
];

/**
 * Collection of edge case email addresses for testing
 * These are emails that might be technically valid according to RFC 5322,
 * but might cause issues in some implementations or are generally not recommended.
 */
export const edgeCaseEmails: EmailFixture[] = [
  {
    email: '"quoted"@example.com',
    description: 'Quoted local part',
    valid: true,
    tags: ['quoted', 'edge-case']
  },
  {
    email: '"quoted.string"@example.com',
    description: 'Quoted local part with dot',
    valid: true,
    tags: ['quoted', 'edge-case']
  },
  {
    email: '"quoted@string"@example.com',
    description: 'Quoted local part with @ symbol',
    valid: true,
    tags: ['quoted', 'edge-case']
  },
  {
    email: '"quoted\\"string"@example.com',
    description: 'Quoted local part with escaped quote',
    valid: true,
    tags: ['quoted', 'edge-case']
  },
  {
    email: '"quoted\\\\string"@example.com',
    description: 'Quoted local part with escaped backslash',
    valid: true,
    tags: ['quoted', 'edge-case']
  },
  {
    email: 'user+subaddress@example.com',
    description: 'Email with subaddressing (plus addressing)',
    valid: true,
    tags: ['standard', 'edge-case']
  },
  {
    email: 'user-subaddress@example.com',
    description: 'Email with hyphen subaddressing',
    valid: true,
    tags: ['standard', 'edge-case']
  },
  {
    email: 'a@b.co',
    description: 'Very short but valid email',
    valid: true,
    tags: ['edge-case']
  },
  {
    email: 'a@b.c.d.e.f.g.h.i.j.k.l.m.n.o.p',
    description: 'Email with many subdomains',
    valid: true,
    tags: ['subdomain', 'edge-case']
  },
  {
    email: 'a.' + 'b'.repeat(62) + '@example.com',
    description: 'Local part at maximum length (64 characters)',
    valid: true,
    tags: ['length-error', 'edge-case']
  },
  {
    email: 'user@' + 'a'.repeat(63) + '.com',
    description: 'Domain label at maximum length (63 characters)',
    valid: true,
    tags: ['domain-error', 'edge-case']
  },
  {
    email: 'user@example.a'.repeat(40),
    description: 'Email approaching maximum length',
    valid: true,
    tags: ['length-error', 'edge-case']
  }
];

/**
 * Collection of Brazilian email addresses for testing
 */
export const brazilianEmails: EmailFixture[] = [
  {
    email: 'usuario@empresa.com.br',
    description: 'Standard Brazilian commercial email',
    valid: true,
    tags: ['standard', 'brazilian']
  },
  {
    email: 'aluno@universidade.edu.br',
    description: 'Brazilian educational email',
    valid: true,
    tags: ['standard', 'brazilian']
  },
  {
    email: 'funcionario@governo.gov.br',
    description: 'Brazilian government email',
    valid: true,
    tags: ['standard', 'brazilian']
  },
  {
    email: 'membro@organizacao.org.br',
    description: 'Brazilian organization email',
    valid: true,
    tags: ['standard', 'brazilian']
  },
  {
    email: 'usuario@dominio.br',
    description: 'Simple Brazilian TLD email',
    valid: true,
    tags: ['standard', 'brazilian']
  },
  {
    email: 'usuario@empresa.net.br',
    description: 'Brazilian network provider email',
    valid: true,
    tags: ['standard', 'brazilian']
  },
  {
    email: 'usuario@empresa.adv.br',
    description: 'Brazilian lawyer email',
    valid: true,
    tags: ['standard', 'brazilian']
  },
  {
    email: 'usuario@empresa.med.br',
    description: 'Brazilian medical email',
    valid: true,
    tags: ['standard', 'brazilian']
  },
  {
    email: 'usuario@empresa.tv.br',
    description: 'Brazilian TV station email',
    valid: true,
    tags: ['standard', 'brazilian']
  },
  {
    email: 'usuario@empresa.eti.br',
    description: 'Brazilian IT professional email',
    valid: true,
    tags: ['standard', 'brazilian']
  },
  {
    email: 'usuario@empresa.esp.br',
    description: 'Brazilian sports organization email',
    valid: true,
    tags: ['standard', 'brazilian']
  },
  {
    email: 'usuario@empresa.art.br',
    description: 'Brazilian artistic and cultural email',
    valid: true,
    tags: ['standard', 'brazilian']
  },
  {
    email: 'usuario@empresa.ind.br',
    description: 'Brazilian industry email',
    valid: true,
    tags: ['standard', 'brazilian']
  }
];

/**
 * All email fixtures combined for comprehensive testing
 */
export const allEmailFixtures: EmailFixture[] = [
  ...validEmails,
  ...invalidEmails,
  ...edgeCaseEmails,
  // Filter out duplicates from brazilianEmails that are already in validEmails
  ...brazilianEmails.filter(bEmail => 
    !validEmails.some(vEmail => vEmail.email === bEmail.email)
  )
];

/**
 * Helper function to filter email fixtures by tag
 * 
 * @param fixtures - The fixtures to filter
 * @param tag - The tag to filter by
 * @returns Filtered fixtures that have the specified tag
 * 
 * @example
 * const standardEmails = filterByTag(allEmailFixtures, 'standard');
 */
export function filterByTag(fixtures: EmailFixture[], tag: EmailFixtureTag): EmailFixture[] {
  return fixtures.filter(fixture => fixture.tags.includes(tag));
}

/**
 * Helper function to filter email fixtures by validity
 * 
 * @param fixtures - The fixtures to filter
 * @param valid - Whether to return valid or invalid emails
 * @returns Filtered fixtures based on validity
 * 
 * @example
 * const validFixtures = filterByValidity(allEmailFixtures, true);
 */
export function filterByValidity(fixtures: EmailFixture[], valid: boolean): EmailFixture[] {
  return fixtures.filter(fixture => fixture.valid === valid);
}

/**
 * Helper function to get just the email strings from fixtures
 * 
 * @param fixtures - The fixtures to extract emails from
 * @returns Array of email strings
 * 
 * @example
 * const validEmailStrings = getEmailStrings(validEmails);
 */
export function getEmailStrings(fixtures: EmailFixture[]): string[] {
  return fixtures.map(fixture => fixture.email);
}

/**
 * Default export for convenient importing
 */
export default {
  validEmails,
  invalidEmails,
  edgeCaseEmails,
  brazilianEmails,
  allEmailFixtures,
  filterByTag,
  filterByValidity,
  getEmailStrings
};