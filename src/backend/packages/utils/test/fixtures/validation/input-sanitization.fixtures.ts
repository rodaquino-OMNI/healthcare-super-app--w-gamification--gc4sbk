/**
 * Input Sanitization Test Fixtures
 * 
 * This file contains test fixtures for input sanitization and security validation,
 * including various attack vectors like XSS, SQL injection, script insertion patterns,
 * and other malicious inputs. These fixtures support testing of input validation and
 * sanitization utilities to ensure consistent security protection across all user
 * input fields in the SuperApp.
 * 
 * The fixtures are organized by attack vector type and include documentation about
 * what each fixture is testing.
 */

// ======================================================================
// XSS (Cross-Site Scripting) Attack Vectors
// ======================================================================

/**
 * Basic XSS attack vectors using script tags and common patterns
 */
export const basicXssVectors = {
  // Basic script tag injection
  scriptTag: '<script>alert("XSS")</script>',
  scriptTagWithImg: '<img src="javascript:alert(\'XSS\');">',
  scriptTagWithCharset: '<script charset="ISO-8859-1">alert("XSS");</script>',
  
  // Script with source
  scriptWithSrc: '<script src="https://malicious-site.com/xss.js"></script>',
  scriptWithBase64Src: '<script src="data:text/javascript;base64,YWxlcnQoJ1hTUycpOw=="></script>',
  
  // Encoded script tags
  encodedScript: '%3Cscript%3Ealert%28%22XSS%22%29%3C%2Fscript%3E',
  unicodeEncodedScript: '\u003Cscript\u003Ealert(\u0022XSS\u0022)\u003C/script\u003E',
  
  // Script tag with line breaks
  scriptWithLineBreaks: '<script\n\n>alert("XSS");</script>',
  
  // Null bytes to bypass filters
  nullByteScript: '<scri\x00pt>alert("XSS")</scri\x00pt>',
};

/**
 * XSS attack vectors using event handlers
 */
export const eventHandlerXssVectors = {
  // Basic event handlers
  onloadHandler: '<body onload="alert(\'XSS\');">',
  onclickHandler: '<a href="#" onclick="alert(\'XSS\');">Click me</a>',
  onerrorHandler: '<img src="x" onerror="alert(\'XSS\');">',
  onmouseoverHandler: '<div onmouseover="alert(\'XSS\');">Hover over me</div>',
  
  // Less common event handlers
  onfocusHandler: '<input onfocus="alert(\'XSS\');" autofocus>',
  onblurHandler: '<input onblur="alert(\'XSS\');" autofocus>',
  onchangeHandler: '<select onchange="alert(\'XSS\');"><option>1</option><option>2</option></select>',
  
  // Event handlers with encoded values
  encodedOnload: '<body on&#108;oad="alert(\'XSS\');">',
  
  // Event handlers with line breaks
  lineBreakHandler: '<img src="x" one\nrror="alert(\'XSS\');">',
};

/**
 * XSS attack vectors using JavaScript URI schemes
 */
export const jsUriXssVectors = {
  // Basic javascript: URI
  javascriptUri: 'javascript:alert("XSS")',
  javascriptUriInHref: '<a href="javascript:alert(\'XSS\');">Click me</a>',
  
  // Encoded javascript: URI
  encodedJavascriptUri: 'javascript&#58;alert("XSS")',
  encodedJavascriptUriHex: 'javascript&#x3A;alert("XSS")',
  
  // Data URI with JavaScript
  dataUri: 'data:text/html;base64,PHNjcmlwdD5hbGVydCgiWFNTIik7PC9zY3JpcHQ+',
  dataUriInImg: '<img src="data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9YWxlcnQoMSk+">',
  
  // Vbscript URI (for older IE browsers)
  vbscriptUri: 'vbscript:alert("XSS")',
};

/**
 * XSS attack vectors using CSS-based techniques
 */
export const cssXssVectors = {
  // CSS expression (old IE)
  cssExpression: '<div style="background-color: expression(alert(\'XSS\'));">',
  
  // CSS with JavaScript URL
  cssBackgroundUrl: '<div style="background-image: url(javascript:alert(\'XSS\'));">',
  
  // CSS imports
  cssImport: '<style>@import url("javascript:alert(\'XSS\')");</style>',
  
  // CSS with behavior property (old IE)
  cssBehavior: '<div style="behavior: url(javascript:alert(\'XSS\'));">',
  
  // CSS with -moz-binding (Firefox)
  mozBinding: '<div style="-moz-binding: url(javascript:alert(\'XSS\'));">',
};

/**
 * XSS attack vectors specific to HTML5
 */
export const html5XssVectors = {
  // HTML5 video tag
  videoTag: '<video src="x" onerror="alert(\'XSS\');">',
  
  // HTML5 audio tag
  audioTag: '<audio src="x" onerror="alert(\'XSS\');">',
  
  // HTML5 embed tag
  embedTag: '<embed src="javascript:alert(\'XSS\');">',
  
  // HTML5 svg tag
  svgTag: '<svg onload="alert(\'XSS\');">',
  svgTagWithScript: '<svg><script>alert("XSS")</script></svg>',
  
  // HTML5 canvas tag
  canvasTag: '<canvas id="c"></canvas><script>alert(document.getElementById(\'c\').toDataURL());</script>',
  
  // HTML5 form overrides
  formAction: '<form action="javascript:alert(\'XSS\');"><input type="submit"></form>',
  
  // HTML5 details tag
  detailsTag: '<details open ontoggle="alert(\'XSS\');">',
};

/**
 * XSS attack vectors specifically targeting React applications
 */
export const reactXssVectors = {
  // dangerouslySetInnerHTML attack
  dangerouslySetInnerHTML: '{__html: "<script>alert(\'XSS\')</script>"}',
  
  // React href attribute attack
  reactHref: 'javascript:alert("XSS")',
  
  // React event handler injection
  reactEventHandler: '{() => { alert("XSS") }}',
  
  // React component injection
  reactComponentInjection: '<Component dangerouslySetInnerHTML={{__html: "<script>alert(\'XSS\')</script>"}} />',
  
  // React DOM node reference manipulation
  reactDomRef: 'ref={el => { if (el) { el.innerHTML = "<script>alert(\'XSS\')</script>" } }}',
};

// ======================================================================
// SQL Injection Attack Vectors
// ======================================================================

/**
 * Basic SQL injection attack vectors
 */
export const basicSqlInjectionVectors = {
  // Basic SQL injection with quotes
  singleQuoteInjection: "' OR '1'='1",
  doubleQuoteInjection: '" OR "1"="1',
  
  // Comment-based SQL injection
  commentInjection: "' OR '1'='1' -- ",
  hashCommentInjection: "' OR '1'='1' # ",
  cStyleCommentInjection: "' OR '1'='1' /* */",
  
  // Numeric SQL injection (no quotes)
  numericInjection: "1 OR 1=1",
  
  // Semicolon to chain queries
  queryChaining: "'; DROP TABLE users; --",
  
  // Null byte injection
  nullByteInjection: "'\0OR '1'='1",
};

/**
 * SQL injection attack vectors using UNION-based techniques
 */
export const unionSqlInjectionVectors = {
  // Basic UNION injection
  basicUnion: "' UNION SELECT username, password FROM users --",
  
  // UNION with NULL values to match column count
  unionWithNulls: "' UNION SELECT NULL, NULL, username, password FROM users --",
  
  // UNION with multiple tables
  unionMultipleTables: "' UNION SELECT username, password FROM users UNION SELECT name, credit_card FROM customers --",
  
  // UNION with system tables (MySQL)
  unionSystemTables: "' UNION SELECT table_name, column_name FROM information_schema.columns --",
  
  // UNION with string concatenation
  unionConcat: "' UNION SELECT NULL, concat(username,':',password) FROM users --",
};

/**
 * SQL injection attack vectors using error-based techniques
 */
export const errorSqlInjectionVectors = {
  // Division by zero error
  divisionByZero: "' OR 1/0 --",
  
  // Type conversion error
  typeConversion: "' OR CAST('abc' AS INT) --",
  
  // MySQL error-based extraction
  mysqlExtractError: "' AND extractvalue(1, concat(0x7e, (SELECT password FROM users LIMIT 1), 0x7e)) --",
  
  // MSSQL error-based extraction
  mssqlExtractError: "' AND 1=(SELECT 1/0 FROM users WHERE username='admin') --",
  
  // PostgreSQL error-based extraction
  postgresqlExtractError: "' AND 1=cast((SELECT password FROM users LIMIT 1) as int) --",
};

/**
 * SQL injection attack vectors using blind techniques
 */
export const blindSqlInjectionVectors = {
  // Boolean-based blind injection
  booleanBlind: "' OR (SELECT 1 FROM users WHERE username='admin' AND LENGTH(password)>5) --",
  
  // Time-based blind injection
  timeBasedBlind: "' OR (SELECT CASE WHEN (username='admin') THEN pg_sleep(5) ELSE pg_sleep(0) END FROM users) --",
  mysqlTimeBasedBlind: "' OR IF(username='admin', SLEEP(5), 0) FROM users --",
  mssqlTimeBasedBlind: "'; WAITFOR DELAY '0:0:5' --",
  oracleTimeBasedBlind: "' OR DBMS_PIPE.RECEIVE_MESSAGE('a',5)=0 --",
  
  // Conditional responses
  conditionalResponse: "' OR (SELECT CASE WHEN (username='admin') THEN 1 ELSE 0 END FROM users) --",
};

// ======================================================================
// SSRF (Server-Side Request Forgery) Attack Vectors
// ======================================================================

/**
 * SSRF attack vectors targeting internal resources
 */
export const ssrfInternalVectors = {
  // Local file access
  localFileAccess: 'file:///etc/passwd',
  windowsLocalFileAccess: 'file:///c:/windows/win.ini',
  
  // Localhost access
  localhost: 'http://localhost:8080/admin',
  localhost127: 'http://127.0.0.1:8080/admin',
  localhostIPv6: 'http://[::1]:8080/admin',
  
  // Internal network IPs
  internalIP: 'http://192.168.1.1',
  internalIPWithPort: 'http://10.0.0.1:8080/admin',
  internalIPRange: 'http://172.16.0.1',
  
  // DNS rebinding
  dnsRebinding: 'http://attacker-controlled-domain.com',
  
  // Non-standard localhost representations
  localhostWithDots: 'http://127.0.0.1',
  localhostDecimal: 'http://2130706433',  // Decimal representation of 127.0.0.1
  localhostOctal: 'http://0177.0000.0000.0001',  // Octal representation
  localhostHex: 'http://0x7f000001',  // Hex representation
};

/**
 * SSRF attack vectors targeting cloud metadata services
 */
export const ssrfCloudVectors = {
  // AWS metadata service
  awsMetadata: 'http://169.254.169.254/latest/meta-data/',
  awsUserData: 'http://169.254.169.254/latest/user-data/',
  awsIamCredentials: 'http://169.254.169.254/latest/meta-data/iam/security-credentials/',
  
  // Google Cloud metadata
  gcpMetadata: 'http://metadata.google.internal/computeMetadata/v1/',
  gcpMetadataWithHeader: 'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
  
  // Azure metadata service
  azureMetadata: 'http://169.254.169.254/metadata/instance',
  azureMetadataWithParams: 'http://169.254.169.254/metadata/instance?api-version=2021-02-01',
  
  // DigitalOcean metadata service
  digitalOceanMetadata: 'http://169.254.169.254/metadata/v1.json',
};

/**
 * SSRF attack vectors using protocol exploitation
 */
export const ssrfProtocolVectors = {
  // Various protocol handlers
  ftpProtocol: 'ftp://internal-ftp:21/',
  ldapProtocol: 'ldap://internal-ldap:389/',
  dictProtocol: 'dict://internal-dict:2628/info:server',
  gopherProtocol: 'gopher://internal-gopher:70/1',
  
  // SMTP protocol for email sending
  smtpProtocol: 'smtp://internal-smtp:25/',
  
  // Redis protocol exploitation
  redisProtocol: 'redis://internal-redis:6379/info',
  
  // File protocol with directory traversal
  fileTraversal: 'file:///var/www/../../etc/passwd',
  
  // Data URL for browser-based SSRF
  dataUrl: 'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ==',
  
  // Jar protocol (Java specific)
  jarProtocol: 'jar:http://malicious-server.com/payload.jar!/malicious-class',
};

// ======================================================================
// Other Malicious Inputs
// ======================================================================

/**
 * Command injection attack vectors
 */
export const commandInjectionVectors = {
  // Basic command injection
  basicInjection: '; ls -la',
  pipeInjection: '| cat /etc/passwd',
  ampersandInjection: '& echo vulnerable &',
  
  // Command substitution
  backticksSubstitution: '`cat /etc/passwd`',
  dollarSubstitution: '$(cat /etc/passwd)',
  
  // Newline injection
  newlineInjection: 'input\ncat /etc/passwd',
  
  // Windows-specific command injection
  windowsInjection: 'dir & ipconfig',
  windowsNested: 'cmd.exe /c "type C:\\Windows\\win.ini"',
  
  // Time-based blind command injection
  timeBasedInjection: '`sleep 5`',
  windowsTimeBasedInjection: '& ping -n 5 127.0.0.1 &',
};

/**
 * Path traversal attack vectors
 */
export const pathTraversalVectors = {
  // Basic path traversal
  basicTraversal: '../../../etc/passwd',
  windowsTraversal: '..\\..\\..\\Windows\\win.ini',
  
  // URL encoded traversal
  urlEncodedTraversal: '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
  doubleUrlEncodedTraversal: '%252e%252e%252f%252e%252e%252f%252e%252e%252fetc%252fpasswd',
  
  // Nested traversal
  nestedTraversal: '....//....//....//etc/passwd',
  
  // Null byte to bypass file extension checks
  nullByteTraversal: '../../../etc/passwd%00.png',
  
  // Non-standard encodings
  unicodeTraversal: '..%c0%af..%c0%af..%c0%afetc/passwd',  // UTF-8 overlong encoding
  
  // Absolute path
  absolutePath: '/etc/passwd',
  windowsAbsolutePath: 'C:\\Windows\\win.ini',
};

/**
 * Template injection attack vectors
 */
export const templateInjectionVectors = {
  // Server-side template injection
  // Jinja2/Twig
  jinja2Injection: '{{7*7}}',  // Should output 49 if vulnerable
  jinja2RceInjection: '{{ self.__init__.__globals__.__builtins__.__import__("os").popen("id").read() }}',
  
  // Freemarker
  freemarkerInjection: '${7*7}',  // Should output 49 if vulnerable
  freemarkerRceInjection: '<#assign ex="freemarker.template.utility.Execute"?new()>${ex("id")}',
  
  // Velocity
  velocityInjection: '#set($x = 7 * 7)${x}',  // Should output 49 if vulnerable
  velocityRceInjection: '#set($str=$class.inspect("java.lang.String").type)#set($chr=$class.inspect("java.lang.Character").type)$ex.getRuntime().exec("id")',
  
  // Handlebars
  handlebarsInjection: '{{#with "s" as |string|}}
  {{#with "e"}}
    {{#with split as |conslist|}}
      {{this.push (lookup string.sub "constructor")}}
      {{this.push "alert(1)"}}
      {{#with string.split as |codelist|}}
        {{this.push "return eval"}}
      {{/with}}
      {{this.pop}}
      {{this.pop}}
      {{this.pop}}
    {{/with}}
  {{/with}}
{{/with}}',
  
  // EJS
  ejsInjection: '<%= 7 * 7 %>',  // Should output 49 if vulnerable
};

/**
 * NoSQL injection attack vectors
 */
export const noSqlInjectionVectors = {
  // MongoDB injection
  mongoBasicInjection: '{ "$gt": "" }',  // Greater than empty string matches everything
  mongoOrInjection: '{ "$or": [ { "username": "admin" }, { "username": "administrator" } ] }',
  mongoWhereInjection: '{ "$where": "this.password == this.username" }',
  mongoJsInjection: '{ "$where": "sleep(5000)" }',  // Time-based attack
  
  // MongoDB operator injection
  mongoOperatorInjection: '{ "username": { "$ne": null } }',  // Not equal to null matches everything
  mongoRegexInjection: '{ "username": { "$regex": "^admin" } }',  // Username starting with 'admin'
  
  // MongoDB aggregation injection
  mongoAggregationInjection: '{ "$group": { "_id": null, "count": { "$sum": 1 } } }',
  
  // MongoDB JavaScript execution
  mongoJsExecution: '{ "$function": { "body": "function() { return db.collection(\"users\").find().toArray(); }" } }',
};

// ======================================================================
// Nested Object Test Cases with Embedded Malicious Content
// ======================================================================

/**
 * Nested objects with malicious content
 */
export const nestedMaliciousObjects = {
  // Simple nested object with XSS
  simpleNested: {
    user: {
      name: '<script>alert("XSS")</script>',
      id: 1
    }
  },
  
  // Deeply nested object with SQL injection
  deeplyNested: {
    data: {
      user: {
        profile: {
          details: {
            address: {
              street: "' OR '1'='1"
            }
          }
        }
      }
    }
  },
  
  // Object with array containing malicious items
  arrayNested: {
    users: [
      { name: 'Alice', role: 'user' },
      { name: 'Bob', role: 'user' },
      { name: '<script>alert("XSS")</script>', role: 'admin' }
    ]
  },
  
  // Object with multiple attack vectors
  multiVectorNested: {
    user: {
      name: '<script>alert("XSS")</script>',
      query: "' OR '1'='1",
      command: '; rm -rf /',
      url: 'http://169.254.169.254/latest/meta-data/'
    }
  },
  
  // Object with hidden payload in unexpected property
  hiddenPayload: {
    user: {
      name: 'Alice',
      age: 30,
      __proto__: {
        malicious: '<script>alert("XSS")</script>'
      },
      toString: function() {
        return '<script>alert("XSS")</script>';
      }
    }
  },
  
  // Object with malicious content in property names
  maliciousPropertyNames: {
    user: {
      name: 'Alice',
      ['<script>alert("XSS")</script>']: 'malicious',
      ['javascript:alert("XSS")']: 'malicious'
    }
  }
};

/**
 * Complex nested structures with hidden payloads
 */
export const complexNestedStructures = {
  // Nested arrays with malicious content
  nestedArrays: [
    [1, 2, 3],
    [4, 5, '<script>alert("XSS")</script>'],
    [7, 8, 9, ['a', 'b', "' OR '1'='1"]]
  ],
  
  // Mixed object and array nesting
  mixedNesting: {
    data: [
      { safe: true },
      [
        { safe: false, payload: '<script>alert("XSS")</script>' },
        { safe: false, nested: { payload: "' OR '1'='1" } }
      ]
    ]
  },
  
  // Object with circular references containing payloads
  circularWithPayload: (() => {
    const obj: any = { name: 'Circular' };
    obj.self = obj;
    obj.payload = '<script>alert("XSS")</script>';
    return obj;
  })(),
  
  // Object with getters that return malicious content
  getterPayload: {
    user: {
      _name: 'Alice',
      get name() {
        return '<script>alert("XSS")</script>';
      }
    }
  },
  
  // Object with symbols containing malicious content
  symbolPayload: (() => {
    const obj: any = { visible: 'safe' };
    obj[Symbol('hidden')] = '<script>alert("XSS")</script>';
    return obj;
  })(),
  
  // Object with non-enumerable properties containing payloads
  nonEnumerablePayload: (() => {
    const obj: any = { visible: 'safe' };
    Object.defineProperty(obj, 'hidden', {
      value: '<script>alert("XSS")</script>',
      enumerable: false
    });
    return obj;
  })()
};