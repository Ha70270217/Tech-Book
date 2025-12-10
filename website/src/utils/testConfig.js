// Test configuration and setup for the AI-native textbook

class TestConfig {
  constructor() {
    this.config = {
      // Test environment configuration
      environment: {
        name: 'development',
        baseUrl: 'http://localhost:3000',
        timeout: 10000,
        retries: 3,
        parallel: true,
        maxConcurrency: 4
      },

      // Browser configuration for E2E tests
      browser: {
        headless: false,
        viewport: {
          width: 1280,
          height: 720
        },
        userAgent: 'Mozilla/5.0 (AI-Textbook-Test-Agent) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        permissions: ['notifications', 'geolocation', 'camera', 'microphone']
      },

      // Test reporting configuration
      reporting: {
        format: 'junit', // junit, json, html, csv
        outputDir: './test-reports',
        includeScreenshots: true,
        includeTrace: true,
        includeCoverage: true,
        coverageThreshold: {
          branches: 80,
          functions: 85,
          lines: 90,
          statements: 90
        }
      },

      // Performance budget configuration
      performanceBudget: {
        metrics: {
          // Core Web Vitals
          lcp: { max: 2500, warn: 4000 }, // Largest Contentful Paint (ms)
          cls: { max: 0.1, warn: 0.25 }, // Cumulative Layout Shift (unitless)
          fid: { max: 100, warn: 300 }, // First Input Delay (ms)

          // Additional metrics
          fcp: { max: 1800, warn: 3000 }, // First Contentful Paint (ms)
          ttfb: { max: 600, warn: 1000 }, // Time to First Byte (ms)
          tti: { max: 5000, warn: 8000 }, // Time to Interactive (ms)
          si: { max: 3800, warn: 5800 }, // Speed Index (ms)

          // Resource budgets
          totalSize: { max: 2 * 1024 * 1024, warn: 3 * 1024 * 1024 }, // 2MB, 3MB warning
          jsSize: { max: 1 * 1024 * 1024, warn: 1.5 * 1024 * 1024 }, // 1MB, 1.5MB warning
          cssSize: { max: 200 * 1024, warn: 300 * 1024 }, // 200KB, 300KB warning
          imageCount: { max: 15, warn: 25 }, // Max images per page
          requestCount: { max: 50, warn: 75 } // Max requests per page
        }
      },

      // Security testing configuration
      security: {
        enabled: true,
        checks: [
          'xss-protection',
          'csrf-protection',
          'csp',
          'hsts',
          'frame-options',
          'content-type-options',
          'referrers-policy',
          'permissions-policy'
        ],
        vulnerabilityScanning: {
          enabled: true,
          types: ['sast', 'dast', 'sca'],
          frequency: 'on-demand' // daily, weekly, on-demand
        }
      },

      // Accessibility testing configuration
      accessibility: {
        enabled: true,
        standards: ['wcag21aa', 'section508'],
        checks: [
          'color-contrast',
          'heading-levels',
          'link-names',
          'image-alt',
          'form-labels',
          'keyboard-access',
          'screen-reader',
          'focus-indicators'
        ],
        threshold: 95 // Percentage of checks that must pass
      },

      // Test data configuration
      testData: {
        fixtures: {
          users: './test/fixtures/users.json',
          chapters: './test/fixtures/chapters.json',
          exercises: './test/fixtures/exercises.json',
          progress: './test/fixtures/progress.json'
        },
        seed: 12345 // For reproducible test data
      },

      // Mock services configuration
      mocks: {
        enabled: true,
        services: {
          auth: {
            enabled: true,
            delay: 100,
            failureRate: 0.05 // 5% failure rate for testing resilience
          },
          content: {
            enabled: true,
            delay: 200,
            failureRate: 0.02
          },
          progress: {
            enabled: true,
            delay: 150,
            failureRate: 0.01
          },
          search: {
            enabled: true,
            delay: 300,
            failureRate: 0.03
          }
        }
      },

      // Test coverage configuration
      coverage: {
        enabled: true,
        provider: 'istanbul', // istanbul, v8
        include: ['src/**/*.{js,jsx,ts,tsx}'],
        exclude: [
          'src/**/*.test.{js,jsx,ts,tsx}',
          'src/**/*.spec.{js,jsx,ts,tsx}',
          'src/test-utils/**/*',
          'src/setupTests.js'
        ],
        reporters: ['html', 'lcov', 'text'],
        watermarks: {
          lines: [50, 80],
          functions: [50, 80],
          branches: [50, 80],
          statements: [50, 80]
        }
      },

      // Snapshot testing configuration
      snapshots: {
        enabled: true,
        update: false,
        dir: '__snapshots__',
        extension: '.snap',
        resolveSnapshotPath: (testPath, snapshotExtension) =>
          testPath.replace('__tests__', '__snapshots__') + snapshotExtension,
        resolveTestPath: (snapshotFilePath, snapshotExtension) =>
          snapshotFilePath.replace('__snapshots__', '__tests__').slice(0, -snapshotExtension.length)
      },

      // Mock service worker configuration for testing
      serviceWorker: {
        enabled: true,
        mock: true,
        cache: {
          enabled: true,
          maxEntries: 100,
          maxAgeSeconds: 3600 // 1 hour
        },
        network: {
          offline: false,
          latency: 0, // ms
          downloadThroughput: null, // bytes/sec, null for unlimited
          uploadThroughput: null // bytes/sec, null for unlimited
        }
      },

      // Localization testing configuration
      localization: {
        enabled: true,
        languages: ['en', 'ur'], // Test with English and Urdu
        rtlSupport: true, // Test right-to-left languages
        unicodeSupport: true, // Test Unicode character support
        fontSupport: true // Test custom font loading
      },

      // Offline testing configuration
      offline: {
        enabled: true,
        scenarios: [
          'full-offline',
          'partial-connectivity',
          'slow-network',
          'intermittent-connection'
        ],
        cacheStrategies: [
          'cache-first',
          'network-first',
          'stale-while-revalidate',
          'cache-only',
          'network-only'
        ]
      },

      // Notification and alert configuration
      notifications: {
        enabled: true,
        channels: ['console', 'file', 'slack'], // Different notification channels
        levels: {
          error: true,
          warning: true,
          info: false,
          debug: false
        },
        file: {
          enabled: true,
          path: './test-results/test-notifications.log',
          maxFileSize: 10 * 1024 * 1024 // 10MB
        }
      },

      // Integration with CI/CD
      ci: {
        enabled: true,
        providers: ['github-actions', 'jenkins', 'circleci'],
        statusReporting: {
          enabled: true,
          commitStatus: true,
          pullRequestComments: true
        },
        artifacts: {
          enabled: true,
          retentionDays: 30,
          include: ['reports', 'screenshots', 'coverage', 'logs']
        }
      }
    };

    this.setupDefaults();
  }

  // Set up default configurations
  setupDefaults() {
    // Set environment based on NODE_ENV
    if (process.env.NODE_ENV === 'production') {
      this.config.environment.name = 'production';
      this.config.environment.timeout = 15000;
      this.config.environment.retries = 1;
    } else if (process.env.NODE_ENV === 'staging') {
      this.config.environment.name = 'staging';
      this.config.environment.timeout = 12000;
      this.config.environment.retries = 2;
    }

    // Override with environment variables
    if (process.env.TEST_BASE_URL) {
      this.config.environment.baseUrl = process.env.TEST_BASE_URL;
    }

    if (process.env.TEST_TIMEOUT) {
      this.config.environment.timeout = parseInt(process.env.TEST_TIMEOUT);
    }

    if (process.env.CI) {
      this.config.environment.parallel = true;
      this.config.browser.headless = true;
      this.config.reporting.includeScreenshots = false;
    }
  }

  // Get configuration value by path (dot notation)
  get(path, defaultValue = undefined) {
    const keys = path.split('.');
    let value = this.config;

    for (const key of keys) {
      if (value === null || value === undefined) {
        return defaultValue;
      }
      value = value[key];
    }

    return value !== undefined ? value : defaultValue;
  }

  // Set configuration value by path (dot notation)
  set(path, value) {
    const keys = path.split('.');
    let current = this.config;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
  }

  // Merge configuration with new values
  merge(newConfig) {
    this.config = this.deepMerge(this.config, newConfig);
    return this.config;
  }

  // Deep merge two objects
  deepMerge(target, source) {
    const output = { ...target };

    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }

    return output;
  }

  // Check if value is an object
  isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item) && item !== null);
  }

  // Validate configuration
  validate() {
    const errors = [];

    // Validate environment
    if (!this.config.environment.baseUrl) {
      errors.push('Environment base URL is required');
    }

    if (typeof this.config.environment.timeout !== 'number' || this.config.environment.timeout <= 0) {
      errors.push('Environment timeout must be a positive number');
    }

    // Validate performance budget
    if (this.config.performanceBudget.enabled) {
      for (const [metric, budget] of Object.entries(this.config.performanceBudget.metrics)) {
        if (typeof budget.max !== 'number' || budget.max <= 0) {
          errors.push(`Performance budget for ${metric} must have a positive max value`);
        }
        if (typeof budget.warn !== 'number' || budget.warn <= 0) {
          errors.push(`Performance budget for ${metric} must have a positive warn value`);
        }
        if (budget.warn <= budget.max) {
          errors.push(`Performance budget warn value for ${metric} should be greater than max value`);
        }
      }
    }

    // Validate coverage thresholds
    if (this.config.coverage.enabled) {
      const { branches, functions, lines, statements } = this.config.coverage.threshold;
      if (branches < 0 || branches > 100) errors.push('Branch coverage threshold must be between 0 and 100');
      if (functions < 0 || functions > 100) errors.push('Function coverage threshold must be between 0 and 100');
      if (lines < 0 || lines > 100) errors.push('Line coverage threshold must be between 0 and 100');
      if (statements < 0 || statements > 100) errors.push('Statement coverage threshold must be between 0 and 100');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Load configuration from file
  async loadFromFile(filePath) {
    try {
      // In a real implementation, this would load from a file
      // For this implementation, we'll simulate loading
      const configData = await this.readFile(filePath);
      const parsedConfig = JSON.parse(configData);

      this.merge(parsedConfig);
      return this.config;
    } catch (error) {
      console.error(`Error loading config from ${filePath}:`, error);
      throw error;
    }
  }

  // Save configuration to file
  async saveToFile(filePath) {
    try {
      const configString = JSON.stringify(this.config, null, 2);
      await this.writeFile(filePath, configString);
      return true;
    } catch (error) {
      console.error(`Error saving config to ${filePath}:`, error);
      throw error;
    }
  }

  // Simulate reading file
  readFile(filePath) {
    return new Promise((resolve, reject) => {
      // In a real implementation, this would read the actual file
      // For now, we'll return a mock response
      resolve('{}');
    });
  }

  // Simulate writing file
  writeFile(filePath, content) {
    return new Promise((resolve, reject) => {
      // In a real implementation, this would write to the actual file
      // For now, we'll just resolve
      resolve();
    });
  }

  // Get configuration for specific test type
  getForTestType(testType) {
    const configMap = {
      unit: {
        timeout: this.config.environment.timeout,
        retries: this.config.environment.retries,
        coverage: this.config.coverage,
        snapshots: this.config.snapshots
      },
      integration: {
        timeout: this.config.environment.timeout * 2,
        retries: this.config.environment.retries,
        mocks: this.config.mocks,
        coverage: this.config.coverage
      },
      e2e: {
        timeout: this.config.environment.timeout * 3,
        retries: this.config.environment.retries,
        browser: this.config.browser,
        performanceBudget: this.config.performanceBudget,
        accessibility: this.config.accessibility
      },
      performance: {
        timeout: this.config.environment.timeout * 5,
        performanceBudget: this.config.performanceBudget,
        environment: this.config.environment
      },
      security: {
        security: this.config.security,
        environment: this.config.environment
      }
    };

    return configMap[testType] || this.config;
  }

  // Get CI/CD configuration
  getCIConfig() {
    return {
      ...this.config.ci,
      environment: this.config.environment.name,
      reporting: this.config.reporting,
      notifications: this.config.notifications
    };
  }

  // Get performance budget for specific page
  getPerformanceBudgetForPage(pageType) {
    // Different pages may have different performance budgets
    const pageSpecificBudgets = {
      homepage: {
        lcp: { max: 2000, warn: 3000 },
        cls: { max: 0.05, warn: 0.1 },
        fid: { max: 80, warn: 150 }
      },
      chapter: {
        lcp: { max: 2500, warn: 4000 },
        cls: { max: 0.1, warn: 0.25 },
        fid: { max: 100, warn: 200 }
      },
      exercise: {
        lcp: { max: 3000, warn: 5000 },
        cls: { max: 0.15, warn: 0.3 },
        fid: { max: 120, warn: 250 }
      },
      search: {
        lcp: { max: 1800, warn: 2500 },
        cls: { max: 0.05, warn: 0.1 },
        fid: { max: 90, warn: 180 }
      }
    };

    return {
      ...this.config.performanceBudget.metrics,
      ...pageSpecificBudgets[pageType]
    };
  }

  // Get localization config for specific language
  getLocalizationConfig(languageCode) {
    return {
      ...this.config.localization,
      currentLanguage: languageCode,
      isRTL: ['ur', 'ar', 'he', 'fa', 'ps', 'sd', 'ug', 'ku', 'dv', 'ha'].includes(languageCode)
    };
  }

  // Get offline test configuration for specific scenario
  getOfflineConfig(scenario) {
    const scenarioConfig = {
      'full-offline': {
        network: { offline: true },
        cache: { enabled: true, strategies: ['cache-first', 'cache-only'] }
      },
      'partial-connectivity': {
        network: {
          offline: false,
          latency: 1000,
          downloadThroughput: 50 * 1024, // 50 KB/s
          uploadThroughput: 10 * 1024   // 10 KB/s
        },
        cache: { enabled: true, strategies: ['cache-first', 'stale-while-revalidate'] }
      },
      'slow-network': {
        network: {
          offline: false,
          latency: 500,
          downloadThroughput: 100 * 1024, // 100 KB/s
          uploadThroughput: 20 * 1024    // 20 KB/s
        },
        cache: { enabled: true, strategies: ['cache-first'] }
      },
      'intermittent-connection': {
        network: {
          offline: false,
          latency: 200,
          downloadThroughput: 200 * 1024, // 200 KB/s
          uploadThroughput: 50 * 1024    // 50 KB/s
        },
        cache: { enabled: true, strategies: ['cache-first', 'network-first'] }
      }
    };

    return {
      ...this.config.offline,
      ...scenarioConfig[scenario] || {}
    };
  }

  // Get security checks for specific test level
  getSecurityChecks(level = 'standard') {
    const checkLevels = {
      minimal: ['xss-protection', 'csp'],
      standard: [
        'xss-protection', 'csrf-protection', 'csp',
        'content-type-options', 'frame-options'
      ],
      comprehensive: Object.keys(this.config.security.checks)
    };

    return checkLevels[level] || checkLevels.standard;
  }

  // Get accessibility checks for specific conformance level
  getAccessibilityChecks(level = 'wcag21aa') {
    const checkLevels = {
      wcag21a: [
        'image-alt', 'link-names', 'color-contrast-low', 'keyboard-access'
      ],
      wcag21aa: [
        'image-alt', 'link-names', 'color-contrast', 'keyboard-access',
        'heading-levels', 'form-labels', 'focus-indicators'
      ],
      wcag21aaa: [
        'image-alt', 'link-names', 'color-contrast-enhanced', 'keyboard-access',
        'heading-levels', 'form-labels', 'focus-indicators', 'screen-reader',
        'repetitive-content', 'timed-events', 'animation-from-interactions'
      ]
    };

    return checkLevels[level] || checkLevels.wcag21aa;
  }

  // Get mock configuration for specific service
  getMockConfig(serviceName) {
    return {
      ...this.config.mocks,
      service: this.config.mocks.services[serviceName] || {}
    };
  }

  // Get test data for specific entity
  getTestData(entity) {
    const fixtures = {
      users: [
        { id: 1, name: 'Test User', email: 'test@example.com', role: 'student' },
        { id: 2, name: 'Admin User', email: 'admin@example.com', role: 'admin' },
        { id: 3, name: 'Instructor', email: 'instructor@example.com', role: 'instructor' }
      ],
      chapters: [
        { id: 1, title: 'Introduction to Physical AI', content: 'Test chapter content...', difficulty: 'beginner' },
        { id: 2, title: 'Advanced Control Systems', content: 'Test chapter content...', difficulty: 'advanced' }
      ],
      exercises: [
        {
          id: 1,
          type: 'multiple_choice',
          question: 'What is the primary goal of Physical AI?',
          options: ['A', 'B', 'C', 'D'],
          correct_answer: 'A',
          difficulty: 'medium'
        },
        {
          id: 2,
          type: 'short_answer',
          question: 'Explain the concept of embodied intelligence.',
          difficulty: 'hard'
        }
      ],
      progress: [
        { user_id: 1, chapter_id: 1, progress: 75, completed: false, last_accessed: new Date().toISOString() },
        { user_id: 1, chapter_id: 2, progress: 30, completed: false, last_accessed: new Date().toISOString() }
      ]
    };

    return fixtures[entity] || [];
  }

  // Generate test report configuration
  getReportConfig(format) {
    const baseConfig = {
      format,
      outputDir: this.config.reporting.outputDir,
      includeScreenshots: this.config.reporting.includeScreenshots,
      includeTrace: this.config.reporting.includeTrace,
      includeCoverage: this.config.reporting.includeCoverage,
      timestamp: new Date().toISOString()
    };

    if (format === 'html') {
      return {
        ...baseConfig,
        template: 'detailed',
        theme: 'default',
        showCharts: true,
        showTimeline: true
      };
    } else if (format === 'junit') {
      return {
        ...baseConfig,
        suiteName: 'AI-Textbook-Tests',
        packageName: 'com.example.textbook'
      };
    } else if (format === 'json') {
      return {
        ...baseConfig,
        detailed: true,
        timings: true
      };
    }

    return baseConfig;
  }

  // Get notification configuration
  getNotificationConfig(channel) {
    const channelConfig = {
      console: {
        enabled: true,
        level: 'info',
        color: true
      },
      file: {
        enabled: this.config.notifications.file.enabled,
        path: this.config.notifications.file.path,
        maxFileSize: this.config.notifications.file.maxFileSize
      },
      slack: {
        enabled: this.config.notifications.channels.includes('slack'),
        webhookUrl: process.env.SLACK_WEBHOOK_URL || null,
        channel: '#test-notifications'
      }
    };

    return channelConfig[channel] || { enabled: false };
  }

  // Validate specific configuration section
  validateSection(section) {
    const validators = {
      environment: () => {
        const env = this.config.environment;
        const errors = [];

        if (!env.baseUrl) errors.push('baseUrl is required');
        if (typeof env.timeout !== 'number' || env.timeout <= 0) errors.push('timeout must be positive number');
        if (typeof env.retries !== 'number' || env.retries < 0) errors.push('retries must be non-negative number');

        return { isValid: errors.length === 0, errors };
      },

      performanceBudget: () => {
        const budget = this.config.performanceBudget;
        const errors = [];

        if (!budget.enabled) return { isValid: true, errors: [] };

        for (const [metric, config] of Object.entries(budget.metrics)) {
          if (typeof config.max !== 'number' || config.max <= 0) {
            errors.push(`max value for ${metric} must be positive number`);
          }
          if (typeof config.warn !== 'number' || config.warn <= 0) {
            errors.push(`warn value for ${metric} must be positive number`);
          }
          if (config.warn <= config.max) {
            errors.push(`warn value for ${metric} should be greater than max`);
          }
        }

        return { isValid: errors.length === 0, errors };
      },

      coverage: () => {
        const cov = this.config.coverage;
        const errors = [];

        if (!cov.enabled) return { isValid: true, errors: [] };

        const { threshold } = cov;
        if (threshold.branches < 0 || threshold.branches > 100) errors.push('branches threshold must be 0-100');
        if (threshold.functions < 0 || threshold.functions > 100) errors.push('functions threshold must be 0-100');
        if (threshold.lines < 0 || threshold.lines > 100) errors.push('lines threshold must be 0-100');
        if (threshold.statements < 0 || threshold.statements > 100) errors.push('statements threshold must be 0-100');

        return { isValid: errors.length === 0, errors };
      }
    };

    return validators[section] ? validators[section]() : { isValid: true, errors: [] };
  }

  // Reset to default configuration
  resetToDefaults() {
    this.config = {
      environment: {
        name: 'development',
        baseUrl: 'http://localhost:3000',
        timeout: 10000,
        retries: 3,
        parallel: true,
        maxConcurrency: 4
      },
      // ... (other default configurations)
    };

    this.setupDefaults();
  }

  // Get a clone of the current configuration
  getConfig() {
    return JSON.parse(JSON.stringify(this.config));
  }
}

// Singleton instance
const testConfig = new TestConfig();

// Export the class and instance
export { TestConfig, testConfig };

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.TestConfig = testConfig;
}