// Security hardening and validation utilities

class SecurityValidator {
  constructor() {
    this.securitySettings = {
      enableXSSProtection: true,
      enableCSRFProtection: true,
      enableCSP: true,
      enableHSTS: true,
      enableFrameOptions: true,
      validateInputs: true,
      sanitizeOutputs: true,
      enableCORSProtection: true,
      enableContentTypeSniffingProtection: true
    };

    this.csrfToken = null;
    this.securityHeaders = new Map();
    this.inputFilters = [];
    this.outputSanitizers = [];
    this.securityPolicies = [];
    this.trustedOrigins = [];
    this.blockedPatterns = [];
    this.whitelistedDomains = [];

    this.initSecurity();
  }

  // Initialize security measures
  initSecurity() {
    // Set up security headers
    this.setupSecurityHeaders();

    // Set up CSRF protection
    this.setupCSRFProtection();

    // Set up XSS protection
    this.setupXSSProtection();

    // Set up content security policy
    this.setupContentSecurityPolicy();

    // Set up input validation
    this.setupInputValidation();

    // Set up output sanitization
    this.setupOutputSanitization();

    // Set up security monitoring
    this.setupSecurityMonitoring();
  }

  // Set up security headers
  setupSecurityHeaders() {
    // X-XSS-Protection header
    if (this.securitySettings.enableXSSProtection) {
      this.securityHeaders.set('X-XSS-Protection', '1; mode=block');
    }

    // X-Content-Type-Options header
    if (this.securitySettings.enableContentTypeSniffingProtection) {
      this.securityHeaders.set('X-Content-Type-Options', 'nosniff');
    }

    // X-Frame-Options header
    if (this.securitySettings.enableFrameOptions) {
      this.securityHeaders.set('X-Frame-Options', 'DENY');
    }

    // Referrer-Policy header
    this.securityHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions-Policy header
    this.securityHeaders.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  }

  // Set up CSRF protection
  setupCSRFProtection() {
    if (this.securitySettings.enableCSRFProtection) {
      // Generate CSRF token
      this.csrfToken = this.generateCSRFToken();

      // Add CSRF token to forms automatically
      this.injectCSRFTokenToForms();

      // Monitor for CSRF attempts
      this.monitorCSRFAttempts();
    }
  }

  // Generate CSRF token
  generateCSRFToken() {
    return 'csrf-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  // Inject CSRF token to forms
  injectCSRFTokenToForms() {
    // Add CSRF token to all forms
    const forms = document.querySelectorAll('form[method="post"], form[method="PUT"], form[method="DELETE"]');

    forms.forEach(form => {
      // Check if form already has CSRF token
      const existingToken = form.querySelector('input[name="csrf-token"]');

      if (!existingToken) {
        const tokenInput = document.createElement('input');
        tokenInput.type = 'hidden';
        tokenInput.name = 'csrf-token';
        tokenInput.value = this.csrfToken;
        form.appendChild(tokenInput);
      }
    });
  }

  // Monitor for CSRF attempts
  monitorCSRFAttempts() {
    // Monitor form submissions
    document.addEventListener('submit', (event) => {
      if (event.target.tagName === 'FORM') {
        const csrfToken = event.target.querySelector('input[name="csrf-token"]');

        if (!csrfToken && this.securitySettings.enableCSRFProtection) {
          event.preventDefault();
          this.logSecurityEvent('csrf-attempt', {
            url: window.location.href,
            formAction: event.target.action,
            timestamp: new Date().toISOString()
          });

          // Show error message
          this.showSecurityAlert('Security Error: Missing CSRF token');
        }
      }
    });
  }

  // Set up XSS protection
  setupXSSProtection() {
    if (this.securitySettings.enableXSSProtection) {
      // Monitor for XSS attempts
      this.monitorXSSAttempts();

      // Set up DOM sanitization
      this.setupDOMSanitization();
    }
  }

  // Monitor for XSS attempts
  monitorXSSAttempts() {
    // Monitor for suspicious patterns in inputs
    document.addEventListener('input', (event) => {
      if (event.target.value && typeof event.target.value === 'string') {
        const suspiciousPatterns = [
          /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
          /javascript:/gi,
          /on\w+\s*=/gi,
          /data:text\/html/gi,
          /vbscript:/gi
        ];

        for (const pattern of suspiciousPatterns) {
          if (pattern.test(event.target.value)) {
            this.logSecurityEvent('xss-attempt', {
              element: event.target.tagName,
              value: event.target.value,
              url: window.location.href,
              timestamp: new Date().toISOString()
            });

            // Sanitize the input
            event.target.value = this.sanitizeInput(event.target.value);

            // Prevent the XSS attempt
            return;
          }
        }
      }
    });

    // Monitor for XSS in URL parameters
    window.addEventListener('popstate', () => {
      const urlParams = new URLSearchParams(window.location.search);

      for (const [key, value] of urlParams.entries()) {
        if (this.containsSuspiciousContent(value)) {
          this.logSecurityEvent('xss-url-parameter', {
            param: key,
            value: value,
            url: window.location.href,
            timestamp: new Date().toISOString()
          });
        }
      }
    });
  }

  // Set up DOM sanitization
  setupDOMSanitization() {
    // Override innerHTML to sanitize content
    const originalInnerHTMLDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');

    if (originalInnerHTMLDescriptor) {
      Object.defineProperty(Element.prototype, 'innerHTML', {
        set: function(value) {
          if (typeof value === 'string') {
            const sanitized = SecurityValidator.sanitizeHTML(value);
            originalInnerHTMLDescriptor.set.call(this, sanitized);
          } else {
            originalInnerHTMLDescriptor.set.call(this, value);
          }
        },
        get: originalInnerHTMLDescriptor.get
      });
    }
  }

  // Set up content security policy
  setupContentSecurityPolicy() {
    if (this.securitySettings.enableCSP) {
      // Create CSP meta tag
      const cspMeta = document.createElement('meta');
      cspMeta.httpEquiv = 'Content-Security-Policy';
      cspMeta.content = this.getDefaultCSP();
      document.head.appendChild(cspMeta);
    }
  }

  // Get default content security policy
  getDefaultCSP() {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self' https://api.example.com",
      "frame-src 'none'",
      "object-src 'none'"
    ].join('; ');
  }

  // Set up input validation
  setupInputValidation() {
    // Add common input validation filters
    this.inputFilters.push(this.validateStringLength.bind(this));
    this.inputFilters.push(this.validateSpecialCharacters.bind(this));
    this.inputFilters.push(this.validateSQLInjection.bind(this));
    this.inputFilters.push(this.validateXSSContent.bind(this));
  }

  // Set up output sanitization
  setupOutputSanitization() {
    // Add common output sanitizers
    this.outputSanitizers.push(this.sanitizeHTML.bind(this));
    this.outputSanitizers.push(this.sanitizeURL.bind(this));
    this.outputSanitizers.push(this.sanitizeCSS.bind(this));
  }

  // Set up security monitoring
  setupSecurityMonitoring() {
    // Monitor for security-related events
    this.setupSecurityEventListeners();
  }

  // Set up security event listeners
  setupSecurityEventListeners() {
    // Monitor for security errors
    window.addEventListener('securitypolicyviolation', (event) => {
      this.logSecurityEvent('csp-violation', {
        violatedDirective: event.violatedDirective,
        blockedURI: event.blockedURI,
        documentURI: event.documentURI,
        originalPolicy: event.originalPolicy,
        referrer: event.referrer,
        statusCode: event.statusCode,
        timestamp: new Date().toISOString()
      });
    });

    // Monitor for mixed content
    window.addEventListener('load', () => {
      const mixedContent = Array.from(document.querySelectorAll('img, script, link')).filter(el => {
        const src = el.src || el.href;
        return src && src.startsWith('http://') && window.location.protocol === 'https:';
      });

      if (mixedContent.length > 0) {
        this.logSecurityEvent('mixed-content', {
          count: mixedContent.length,
          elements: mixedContent.map(el => ({
            tagName: el.tagName,
            src: el.src || el.href
          })),
          url: window.location.href,
          timestamp: new Date().toISOString()
        });
      }
    });
  }

  // Validate input string length
  validateStringLength(input, maxLength = 1000) {
    if (input && input.length > maxLength) {
      return {
        isValid: false,
        error: `Input exceeds maximum length of ${maxLength} characters`,
        suggestion: `Truncate input to ${maxLength} characters or less`
      };
    }
    return { isValid: true };
  }

  // Validate special characters in input
  validateSpecialCharacters(input) {
    // Check for potentially dangerous patterns
    const dangerousPatterns = [
      /\.\.\/|\.\/\.\./, // Directory traversal
      /union\s+select/i, // SQL injection
      /drop\s+\w+/i, // SQL injection
      /delete\s+from/i, // SQL injection
      /insert\s+into/i, // SQL injection
      /update\s+\w+\s+set/i, // SQL injection
      /exec\s*\(/i, // Command execution
      /execute\s+/i // Command execution
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(input)) {
        return {
          isValid: false,
          error: 'Input contains potentially dangerous patterns',
          suggestion: 'Remove dangerous patterns from input'
        };
      }
    }

    return { isValid: true };
  }

  // Validate for SQL injection patterns
  validateSQLInjection(input) {
    const sqlPatterns = [
      /('|;|--|\/\*|\*\/|xp_|sp_|sysobjects|syscolumns)/i,
      /(exec|execute|select|insert|update|delete|drop|create|alter|grant|revoke|truncate|declare|cast|convert)/i
    ];

    for (const pattern of sqlPatterns) {
      if (pattern.test(input)) {
        return {
          isValid: false,
          error: 'Potential SQL injection detected',
          suggestion: 'Use parameterized queries and input validation'
        };
      }
    }

    return { isValid: true };
  }

  // Validate for XSS content
  validateXSSContent(input) {
    if (typeof input !== 'string') return { isValid: true };

    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /data:text\/html/gi,
      /on\w+\s*=\s*["'][^"']*["']/gi,
      /<iframe/gi,
      /<object/gi,
      /<embed/gi,
      /<form/gi
    ];

    for (const pattern of xssPatterns) {
      if (pattern.test(input)) {
        return {
          isValid: false,
          error: 'Potential XSS detected',
          suggestion: 'Sanitize input before displaying'
        };
      }
    }

    return { isValid: true };
  }

  // Sanitize HTML content
  static sanitizeHTML(html) {
    if (typeof html !== 'string') return html;

    // Create a temporary DOM element to parse HTML safely
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Remove potentially dangerous elements and attributes
    const dangerousElements = ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'];
    const dangerousAttributes = ['onclick', 'onload', 'onerror', 'onmouseover', 'onmouseout', 'onfocus', 'onblur'];

    const walk = (node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        // Remove dangerous elements
        if (dangerousElements.includes(node.tagName.toLowerCase())) {
          node.remove();
          return;
        }

        // Remove dangerous attributes
        dangerousAttributes.forEach(attr => {
          if (node.hasAttribute(attr)) {
            node.removeAttribute(attr);
          }
        });

        // Remove href/src attributes with javascript: protocol
        if (node.hasAttribute('href') || node.hasAttribute('src')) {
          const href = node.getAttribute('href');
          const src = node.getAttribute('src');

          if (href && href.toLowerCase().startsWith('javascript:')) {
            node.removeAttribute('href');
          }
          if (src && src.toLowerCase().startsWith('javascript:')) {
            node.removeAttribute('src');
          }
        }
      }

      // Walk child nodes
      const children = Array.from(node.childNodes);
      children.forEach(child => walk(child));
    };

    walk(tempDiv);

    return tempDiv.innerHTML;
  }

  // Sanitize URL
  static sanitizeURL(url) {
    if (typeof url !== 'string') return url;

    // Only allow http, https, mailto, and tel protocols
    const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
    const urlObj = new URL(url, window.location.origin);

    if (!allowedProtocols.includes(urlObj.protocol)) {
      return '#';
    }

    return urlObj.href;
  }

  // Sanitize CSS
  static sanitizeCSS(css) {
    if (typeof css !== 'string') return css;

    // Remove potentially dangerous CSS properties
    const dangerousCSS = [
      /expression\s*\(/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /behavior:/gi,
      /url\s*\(\s*["']?\s*javascript:/gi,
      /url\s*\(\s*["']?\s*vbscript:/gi
    ];

    let sanitized = css;
    for (const pattern of dangerousCSS) {
      sanitized = sanitized.replace(pattern, '');
    }

    return sanitized;
  }

  // Validate user input
  validateInput(input, options = {}) {
    const {
      minLength = 0,
      maxLength = 1000,
      allowSpecialChars = false,
      required = false,
      pattern = null
    } = options;

    // Check if required
    if (required && (!input || input.trim() === '')) {
      return {
        isValid: false,
        error: 'Field is required',
        suggestion: 'Provide a value for this field'
      };
    }

    // Check minimum length
    if (input && input.length < minLength) {
      return {
        isValid: false,
        error: `Input must be at least ${minLength} characters`,
        suggestion: `Add ${minLength - input.length} more characters`
      };
    }

    // Check maximum length
    if (input && input.length > maxLength) {
      return {
        isValid: false,
        error: `Input exceeds maximum length of ${maxLength} characters`,
        suggestion: `Remove ${input.length - maxLength} characters`
      };
    }

    // Validate against custom pattern if provided
    if (pattern && input && !pattern.test(input)) {
      return {
        isValid: false,
        error: 'Input does not match required pattern',
        suggestion: 'Check input format and try again'
      };
    }

    // Validate for special characters if not allowed
    if (!allowSpecialChars && input) {
      const specialCharRegex = /[^a-zA-Z0-9\s\-_]/;
      if (specialCharRegex.test(input)) {
        return {
          isValid: false,
          error: 'Input contains disallowed special characters',
          suggestion: 'Remove special characters except hyphens and underscores'
        };
      }
    }

    // Run through input filters
    for (const filter of this.inputFilters) {
      const result = filter(input);
      if (!result.isValid) {
        return result;
      }
    }

    return { isValid: true };
  }

  // Sanitize user input
  sanitizeInput(input) {
    if (typeof input !== 'string') return input;

    // Apply output sanitizers in reverse order
    let sanitized = input;

    // Basic sanitization
    sanitized = sanitized.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    sanitized = sanitized.replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
    sanitized = sanitized.replace(/\//g, '&#x2F;');

    // Apply sanitizers
    for (const sanitizer of this.outputSanitizers) {
      sanitized = sanitizer(sanitized);
    }

    return sanitized;
  }

  // Validate file upload
  validateFileUpload(file, options = {}) {
    const {
      allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
      maxSize = 5 * 1024 * 1024, // 5MB
      allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf']
    } = options;

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `File type ${file.type} is not allowed`,
        suggestion: `Allowed types: ${allowedTypes.join(', ')}`
      };
    }

    // Check file size
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `File size ${file.size} bytes exceeds maximum of ${maxSize} bytes`,
        suggestion: `Choose a file smaller than ${maxSize / (1024 * 1024)}MB`
      };
    }

    // Check file extension
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
      return {
        isValid: false,
        error: `File extension ${fileExtension} is not allowed`,
        suggestion: `Allowed extensions: ${allowedExtensions.join(', ')}`
      };
    }

    return { isValid: true };
  }

  // Check if content contains suspicious patterns
  containsSuspiciousContent(content) {
    if (typeof content !== 'string') return false;

    const suspiciousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /data:text\/html/gi,
      /vbscript:/gi,
      /<iframe/gi,
      /<object/gi,
      /<embed/gi,
      /<form/gi
    ];

    return suspiciousPatterns.some(pattern => pattern.test(content));
  }

  // Log security event
  logSecurityEvent(type, data) {
    const securityEvent = {
      id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      type,
      data,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      sessionId: this.sessionId
    };

    // In a real implementation, this would be sent to a security monitoring service
    console.warn('Security Event:', securityEvent);

    // Store in local security log
    if (!window.securityLog) {
      window.securityLog = [];
    }
    window.securityLog.push(securityEvent);

    // Keep only last 1000 events
    if (window.securityLog.length > 1000) {
      window.securityLog.shift();
    }

    // Trigger security event
    const event = new CustomEvent('securityEvent', { detail: securityEvent });
    window.dispatchEvent(event);
  }

  // Show security alert
  showSecurityAlert(message) {
    // Create a modal-style security alert
    const overlay = document.createElement('div');
    overlay.className = 'security-alert-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    const alertBox = document.createElement('div');
    alertBox.className = 'security-alert-box';
    alertBox.style.cssText = `
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      max-width: 500px;
      width: 90%;
      text-align: center;
    `;

    alertBox.innerHTML = `
      <h3 style="color: #e74c3c; margin-top: 0;">Security Alert</h3>
      <p>${message}</p>
      <button id="security-alert-close" style="
        background: #3498db;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 4px;
        cursor: pointer;
        margin-top: 15px;
      ">OK</button>
    `;

    overlay.appendChild(alertBox);
    document.body.appendChild(overlay);

    // Close handler
    document.getElementById('security-alert-close').addEventListener('click', () => {
      document.body.removeChild(overlay);
    });

    // Close on outside click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
      }
    });
  }

  // Validate JWT token
  validateJWT(token) {
    try {
      if (!token || typeof token !== 'string') {
        return { isValid: false, error: 'Invalid token format' };
      }

      // Check if token has 3 parts (header.payload.signature)
      const parts = token.split('.');
      if (parts.length !== 3) {
        return { isValid: false, error: 'Invalid JWT format' };
      }

      // Decode payload (without verification for client-side)
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));

      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        return { isValid: false, error: 'Token has expired' };
      }

      // Check not before
      if (payload.nbf && payload.nbf > now) {
        return { isValid: false, error: 'Token is not yet valid' };
      }

      return { isValid: true, payload };
    } catch (error) {
      return { isValid: false, error: 'Invalid token: ' + error.message };
    }
  }

  // Generate secure random string
  generateSecureRandom(length = 32) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Hash data using Web Crypto API
  async hashData(data, algorithm = 'SHA-256') {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest(algorithm, dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Encrypt data using AES-GCM
  async encryptData(data, key) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM

    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      dataBuffer
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    return btoa(String.fromCharCode(...combined));
  }

  // Decrypt data using AES-GCM
  async decryptData(encryptedData, key) {
    const combined = new Uint8Array(atob(encryptedData).split('').map(c => c.charCodeAt(0)));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      data
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  // Generate encryption key
  async generateEncryptionKey() {
    return await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  // Validate email format
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return {
      isValid: emailRegex.test(email),
      error: emailRegex.test(email) ? null : 'Invalid email format'
    };
  }

  // Validate phone number
  validatePhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return {
      isValid: phoneRegex.test(phone.replace(/[\s\-\(\)]/g, '')),
      error: phoneRegex.test(phone.replace(/[\s\-\(\)]/g, '')) ? null : 'Invalid phone number format'
    };
  }

  // Validate URL
  validateURL(url) {
    try {
      new URL(url);
      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: 'Invalid URL format' };
    }
  }

  // Validate IP address
  validateIP(ip) {
    const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^([\da-fA-F]{1,4}:){7}[\da-fA-F]{1,4}$|^::1$|^::$/;

    return {
      isValid: ipv4Regex.test(ip) || ipv6Regex.test(ip),
      error: ipv4Regex.test(ip) || ipv6Regex.test(ip) ? null : 'Invalid IP address format'
    };
  }

  // Sanitize user-generated content
  sanitizeUserContent(content, options = {}) {
    const {
      allowHTML = false,
      allowedTags = ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li'],
      allowedAttributes = ['class', 'id']
    } = options;

    if (!allowHTML) {
      // Strip all HTML
      return content.replace(/<[^>]*>/g, '');
    }

    // Sanitize HTML content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;

    const walk = (node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        // Check if element is allowed
        if (!allowedTags.includes(node.tagName.toLowerCase())) {
          // Replace with text content if not allowed
          const textContent = document.createTextNode(node.textContent);
          node.parentNode.replaceChild(textContent, node);
          return;
        }

        // Remove disallowed attributes
        const attributes = Array.from(node.attributes);
        attributes.forEach(attr => {
          if (!allowedAttributes.includes(attr.name)) {
            node.removeAttribute(attr.name);
          }
        });
      }

      // Walk child nodes
      const children = Array.from(node.childNodes);
      children.forEach(child => walk(child));
    };

    walk(tempDiv);

    return tempDiv.innerHTML;
  }

  // Validate password strength
  validatePasswordStrength(password) {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    const passedChecks = Object.values(checks).filter(check => check).length;
    const strength = passedChecks / Object.keys(checks).length;

    return {
      isValid: passedChecks >= 4, // Need at least 4 out of 5 checks
      strength: strength,
      checks,
      error: passedChecks < 4 ? 'Password does not meet strength requirements' : null
    };
  }

  // Validate rate limiting
  validateRateLimit(identifier, maxRequests = 10, windowMs = 60000) {
    const now = Date.now();
    const key = `rateLimit_${identifier}`;

    let requests = JSON.parse(localStorage.getItem(key) || '[]');

    // Remove old requests outside the window
    requests = requests.filter(timestamp => now - timestamp < windowMs);

    if (requests.length >= maxRequests) {
      return {
        isValid: false,
        error: 'Rate limit exceeded',
        retryAfter: windowMs - (now - requests[0])
      };
    }

    // Add current request
    requests.push(now);
    localStorage.setItem(key, JSON.stringify(requests));

    return { isValid: true, remaining: maxRequests - requests.length };
  }

  // Validate session
  validateSession(sessionId) {
    const sessionData = localStorage.getItem(`session_${sessionId}`);
    if (!sessionData) {
      return { isValid: false, error: 'Session not found' };
    }

    try {
      const session = JSON.parse(sessionData);
      const now = Date.now();

      if (session.expiresAt && session.expiresAt < now) {
        localStorage.removeItem(`session_${sessionId}`);
        return { isValid: false, error: 'Session expired' };
      }

      return { isValid: true, session };
    } catch (error) {
      localStorage.removeItem(`session_${sessionId}`);
      return { isValid: false, error: 'Invalid session data' };
    }
  }

  // Generate session ID
  generateSessionId() {
    return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Create secure session
  createSecureSession(userData, options = {}) {
    const {
      expiresAfter = 24 * 60 * 60 * 1000, // 24 hours
      includeIP = false,
      includeUserAgent = false
    } = options;

    const sessionId = this.generateSessionId();
    const sessionData = {
      id: sessionId,
      userData,
      createdAt: Date.now(),
      expiresAt: Date.now() + expiresAfter,
      ...(includeIP && { ip: this.getClientIP() }),
      ...(includeUserAgent && { userAgent: navigator.userAgent })
    };

    localStorage.setItem(`session_${sessionId}`, JSON.stringify(sessionData));

    return sessionId;
  }

  // Get client IP (from a trusted proxy header if available)
  getClientIP() {
    // In a real implementation, this would check for headers like X-Forwarded-For
    // For client-side, we can only get limited info
    return 'client-ip-unavailable';
  }

  // Validate request origin
  validateOrigin(origin, allowedOrigins = []) {
    if (allowedOrigins.length === 0) {
      // Use default security policy
      const hostname = window.location.hostname;
      allowedOrigins = [
        `https://${hostname}`,
        `https://www.${hostname}`,
        window.location.origin
      ];
    }

    return {
      isValid: allowedOrigins.includes(origin),
      error: allowedOrigins.includes(origin) ? null : 'Invalid origin'
    };
  }

  // Check for clickjacking protection
  checkClickjackingProtection() {
    if (window.self !== window.top) {
      this.logSecurityEvent('potential-clickjacking', {
        message: 'Page is embedded in an iframe',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Get security report
  getSecurityReport() {
    return {
      timestamp: new Date().toISOString(),
      securitySettings: this.securitySettings,
      securityHeaders: Object.fromEntries(this.securityHeaders),
      csrfToken: this.csrfToken ? 'present' : 'not-present',
      securityLogCount: window.securityLog ? window.securityLog.length : 0,
      securityLog: window.securityLog ? window.securityLog.slice(-10) : [] // Last 10 events
    };
  }

  // Export security report
  exportSecurityReport(format = 'json') {
    const report = this.getSecurityReport();

    if (format === 'json') {
      return JSON.stringify(report, null, 2);
    } else if (format === 'csv') {
      let csv = 'Security Report\n';
      csv += `Generated: ${report.timestamp}\n\n`;
      csv += 'Setting,Value\n';
      for (const [key, value] of Object.entries(report.securitySettings)) {
        csv += `"${key}","${value}"\n`;
      }
      return csv;
    }

    return null;
  }

  // Download security report
  downloadSecurityReport(filename = 'security-report', format = 'json') {
    const data = this.exportSecurityReport(format);
    if (!data) return;

    const blob = new Blob([data], {
      type: format === 'json' ? 'application/json' : 'text/csv'
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${format}`;
    document.body.appendChild(a);
    a.click();

    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Destroy security validator instance
  destroy() {
    // Clear intervals and event listeners if any
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
    }
  }
}

// Singleton instance
const securityValidator = new SecurityValidator();

// Export the class and instance
export { SecurityValidator, securityValidator };

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.SecurityValidator = securityValidator;
}