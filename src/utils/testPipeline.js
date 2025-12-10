// Automated testing pipeline for continuous integration

class TestPipeline {
  constructor() {
    this.pipelineConfig = {
      stages: {
        setup: {
          name: 'Setup Environment',
          description: 'Initialize test environment and dependencies',
          enabled: true,
          timeout: 60000 // 1 minute
        },
        unit: {
          name: 'Unit Tests',
          description: 'Run unit tests for individual components',
          enabled: true,
          timeout: 120000, // 2 minutes
          parallel: true
        },
        integration: {
          name: 'Integration Tests',
          description: 'Run integration tests for component interactions',
          enabled: true,
          timeout: 180000, // 3 minutes
          parallel: true
        },
        e2e: {
          name: 'End-to-End Tests',
          description: 'Run end-to-end tests for user flows',
          enabled: true,
          timeout: 300000, // 5 minutes
          parallel: false // E2E tests often need to run sequentially
        },
        performance: {
          name: 'Performance Tests',
          description: 'Run performance and load tests',
          enabled: true,
          timeout: 240000, // 4 minutes
          parallel: false
        },
        security: {
          name: 'Security Tests',
          description: 'Run security scanning and vulnerability tests',
          enabled: true,
          timeout: 180000, // 3 minutes
          parallel: true
        },
        teardown: {
          name: 'Teardown Environment',
          description: 'Clean up test environment and resources',
          enabled: true,
          timeout: 30000 // 30 seconds
        }
      },
      triggers: {
        push: true,
        pull_request: true,
        schedule: false,
        manual: true
      },
      notifications: {
        email: true,
        slack: false,
        github_status: true
      },
      reporting: {
        format: 'junit',
        coverage: true,
        threshold: 80, // Minimum coverage percentage
        performance_budget: {
          lcp: 2500, // Largest Contentful Paint in ms
          cls: 0.1,  // Cumulative Layout Shift
          fid: 100   // First Input Delay in ms
        }
      }
    };

    this.testResults = {
      setup: null,
      unit: [],
      integration: [],
      e2e: [],
      performance: [],
      security: [],
      teardown: null
    };

    this.pipelineState = {
      currentStage: null,
      status: 'idle', // idle, running, success, failure, cancelled
      startTime: null,
      endTime: null,
      duration: null,
      progress: 0,
      completedStages: [],
      failedStages: []
    };

    this.testRunners = {
      unit: new UnitTestRunner(),
      integration: new IntegrationTestRunner(),
      e2e: new E2ETestRunner(),
      performance: new PerformanceTestRunner(),
      security: new SecurityTestRunner()
    };

    this.eventListeners = new Map();
  }

  // Initialize the pipeline
  init() {
    this.setupEventListeners();
    this.setupReporting();
    this.setupNotifications();
  }

  // Setup event listeners for pipeline events
  setupEventListeners() {
    // Stage start event
    this.addEventListener('stage:start', (event) => {
      console.log(`🚀 Starting stage: ${event.stage}`);
      this.pipelineState.currentStage = event.stage;
    });

    // Stage complete event
    this.addEventListener('stage:complete', (event) => {
      console.log(`✅ Stage completed: ${event.stage} (${event.duration}ms)`);
      this.pipelineState.completedStages.push(event.stage);
      this.updateProgress();
    });

    // Stage failure event
    this.addEventListener('stage:fail', (event) => {
      console.error(`❌ Stage failed: ${event.stage}`, event.error);
      this.pipelineState.failedStages.push(event.stage);
    });

    // Pipeline start event
    this.addEventListener('pipeline:start', (event) => {
      console.log('🎬 Pipeline started');
      this.pipelineState.status = 'running';
      this.pipelineState.startTime = Date.now();
    });

    // Pipeline complete event
    this.addEventListener('pipeline:complete', (event) => {
      this.pipelineState.endTime = Date.now();
      this.pipelineState.duration = this.pipelineState.endTime - this.pipelineState.startTime;
      this.pipelineState.status = event.success ? 'success' : 'failure';

      console.log(`🎉 Pipeline ${event.success ? 'succeeded' : 'failed'} in ${this.pipelineState.duration}ms`);

      // Generate final report
      this.generateFinalReport();

      // Send notifications
      this.sendNotifications();
    });
  }

  // Setup reporting configuration
  setupReporting() {
    // Initialize coverage tracking
    if (this.pipelineConfig.reporting.coverage) {
      this.setupCoverageTracking();
    }

    // Initialize performance monitoring
    this.setupPerformanceMonitoring();
  }

  // Setup notifications
  setupNotifications() {
    // Setup notification channels based on config
    if (this.pipelineConfig.notifications.slack) {
      this.setupSlackNotifications();
    }

    if (this.pipelineConfig.notifications.email) {
      this.setupEmailNotifications();
    }
  }

  // Setup coverage tracking
  setupCoverageTracking() {
    if (typeof window !== 'undefined' && window.__coverage__) {
      // Coverage tracking is already set up
      this.coverageCollector = window.__coverage__;
    } else {
      // Initialize coverage collector
      this.coverageCollector = {};
    }
  }

  // Setup performance monitoring
  setupPerformanceMonitoring() {
    this.performanceMonitor = new PerformanceMonitor();
  }

  // Setup Slack notifications
  setupSlackNotifications() {
    // In a real implementation, this would connect to Slack webhook
    console.log('Slack notifications configured');
  }

  // Setup email notifications
  setupEmailNotifications() {
    // In a real implementation, this would connect to email service
    console.log('Email notifications configured');
  }

  // Run the entire pipeline
  async runPipeline(options = {}) {
    const config = { ...this.pipelineConfig, ...options };

    this.pipelineState.status = 'running';
    this.pipelineState.startTime = Date.now();
    this.pipelineState.completedStages = [];
    this.pipelineState.failedStages = [];

    this.dispatchPipelineEvent('pipeline:start', {
      config,
      timestamp: this.pipelineState.startTime
    });

    try {
      // Run each stage in sequence
      for (const [stageName, stageConfig] of Object.entries(config.stages)) {
        if (!stageConfig.enabled) continue;

        await this.runStage(stageName, stageConfig);
      }

      const success = this.pipelineState.failedStages.length === 0;
      const duration = Date.now() - this.pipelineState.startTime;

      this.dispatchPipelineEvent('pipeline:complete', {
        success,
        duration,
        results: this.testResults,
        timestamp: Date.now()
      });

      return {
        success,
        duration,
        results: this.testResults,
        coverage: this.getCoverageReport(),
        performance: this.getPerformanceReport()
      };
    } catch (error) {
      console.error('Pipeline execution error:', error);
      this.pipelineState.status = 'failure';
      this.dispatchPipelineEvent('pipeline:complete', {
        success: false,
        error: error.message,
        timestamp: Date.now()
      });

      throw error;
    }
  }

  // Run a specific stage
  async runStage(stageName, stageConfig) {
    this.dispatchPipelineEvent('stage:start', {
      stage: stageName,
      config: stageConfig,
      timestamp: Date.now()
    });

    const stageStartTime = Date.now();

    try {
      let result;

      switch (stageName) {
        case 'setup':
          result = await this.runSetupStage(stageConfig);
          break;
        case 'unit':
          result = await this.runUnitStage(stageConfig);
          break;
        case 'integration':
          result = await this.runIntegrationStage(stageConfig);
          break;
        case 'e2e':
          result = await this.runE2EStage(stageConfig);
          break;
        case 'performance':
          result = await this.runPerformanceStage(stageConfig);
          break;
        case 'security':
          result = await this.runSecurityStage(stageConfig);
          break;
        case 'teardown':
          result = await this.runTeardownStage(stageConfig);
          break;
        default:
          throw new Error(`Unknown stage: ${stageName}`);
      }

      const duration = Date.now() - stageStartTime;

      this.testResults[stageName] = result;
      this.pipelineState.progress = this.calculateProgress();

      this.dispatchPipelineEvent('stage:complete', {
        stage: stageName,
        result,
        duration,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      const duration = Date.now() - stageStartTime;

      this.dispatchPipelineEvent('stage:fail', {
        stage: stageName,
        error: error.message,
        duration,
        timestamp: Date.now()
      });

      // If bail is configured, stop the pipeline
      if (this.pipelineConfig.bailOnFailure) {
        throw error;
      }

      // Otherwise, continue with the next stage
      return { error: error.message, success: false };
    }
  }

  // Run setup stage
  async runSetupStage(config) {
    console.log('Setting up test environment...');

    // Initialize test environment
    await this.initializeTestEnvironment();

    // Setup test fixtures
    await this.setupTestFixtures();

    // Setup mock services
    await this.setupMockServices();

    return { success: true, message: 'Environment setup completed' };
  }

  // Run unit test stage
  async runUnitStage(config) {
    console.log('Running unit tests...');

    // Discover and run unit tests
    const testFiles = await this.discoverTestFiles('unit');

    if (config.parallel && testFiles.length > 1) {
      // Run tests in parallel
      const results = await this.runTestsInParallel(
        testFiles,
        this.testRunners.unit,
        config.timeout
      );
      return results;
    } else {
      // Run tests sequentially
      const results = [];
      for (const testFile of testFiles) {
        const result = await this.testRunners.unit.runTest(testFile, config.timeout);
        results.push(result);
      }
      return results;
    }
  }

  // Run integration test stage
  async runIntegrationStage(config) {
    console.log('Running integration tests...');

    // Discover and run integration tests
    const testFiles = await this.discoverTestFiles('integration');

    if (config.parallel && testFiles.length > 1) {
      // Run tests in parallel
      const results = await this.runTestsInParallel(
        testFiles,
        this.testRunners.integration,
        config.timeout
      );
      return results;
    } else {
      // Run tests sequentially
      const results = [];
      for (const testFile of testFiles) {
        const result = await this.testRunners.integration.runTest(testFile, config.timeout);
        results.push(result);
      }
      return results;
    }
  }

  // Run end-to-end test stage
  async runE2EStage(config) {
    console.log('Running end-to-end tests...');

    // Discover and run E2E tests
    const testFiles = await this.discoverTestFiles('e2e');

    // E2E tests typically run sequentially to avoid conflicts
    const results = [];
    for (const testFile of testFiles) {
      const result = await this.testRunners.e2e.runTest(testFile, config.timeout);
      results.push(result);
    }
    return results;
  }

  // Run performance test stage
  async runPerformanceStage(config) {
    console.log('Running performance tests...');

    // Run performance tests
    const testFiles = await this.discoverTestFiles('performance');
    const results = [];

    for (const testFile of testFiles) {
      const result = await this.testRunners.performance.runTest(testFile, config.timeout);
      results.push(result);
    }

    // Check performance budgets
    const performanceResults = await this.checkPerformanceBudgets(results);
    return performanceResults;
  }

  // Run security test stage
  async runSecurityStage(config) {
    console.log('Running security tests...');

    // Run security tests
    const testFiles = await this.discoverTestFiles('security');
    const results = [];

    if (config.parallel && testFiles.length > 1) {
      // Run security tests in parallel
      return await this.runTestsInParallel(
        testFiles,
        this.testRunners.security,
        config.timeout
      );
    } else {
      // Run security tests sequentially
      for (const testFile of testFiles) {
        const result = await this.testRunners.security.runTest(testFile, config.timeout);
        results.push(result);
      }
      return results;
    }
  }

  // Run teardown stage
  async runTeardownStage(config) {
    console.log('Tearing down test environment...');

    // Clean up test environment
    await this.cleanupTestEnvironment();

    // Clear test fixtures
    await this.clearTestFixtures();

    return { success: true, message: 'Environment teardown completed' };
  }

  // Discover test files by type
  async discoverTestFiles(testType) {
    // This would typically scan the file system for test files
    // For this implementation, we'll return mock test files
    const testPatterns = {
      unit: ['**/*.test.js', '**/*.spec.js', 'src/**/test/**/*.js'],
      integration: ['**/integration/**/*.test.js', '**/integration/**/*.spec.js'],
      e2e: ['**/e2e/**/*.test.js', '**/e2e/**/*.spec.js'],
      performance: ['**/performance/**/*.test.js', '**/perf/**/*.test.js'],
      security: ['**/security/**/*.test.js', '**/audit/**/*.test.js']
    };

    // In a real implementation, this would scan files based on patterns
    // For now, we'll return mock test files
    switch (testType) {
      case 'unit':
        return [
          'src/components/__tests__/ProgressTracker.test.js',
          'src/utils/__tests__/PerformanceMonitor.test.js',
          'src/services/__tests__/OfflineService.test.js',
          'src/hooks/__tests__/useExercises.test.js'
        ];
      case 'integration':
        return [
          'src/integration/__tests__/AuthFlow.test.js',
          'src/integration/__tests__/ContentSync.test.js',
          'src/integration/__tests__/ProgressTracking.test.js'
        ];
      case 'e2e':
        return [
          'src/e2e/__tests__/UserJourney.test.js',
          'src/e2e/__tests__/OfflineExperience.test.js',
          'src/e2e/__tests__/ExerciseFlow.test.js'
        ];
      case 'performance':
        return [
          'src/performance/__tests__/LoadTime.test.js',
          'src/performance/__tests__/ResourceOptimization.test.js',
          'src/performance/__tests__/CoreWebVitals.test.js'
        ];
      case 'security':
        return [
          'src/security/__tests__/XSSProtection.test.js',
          'src/security/__tests__/CSP.test.js',
          'src/security/__tests__/InputValidation.test.js'
        ];
      default:
        return [];
    }
  }

  // Run tests in parallel
  async runTestsInParallel(testFiles, runner, timeout) {
    const results = await Promise.allSettled(
      testFiles.map(testFile =>
        this.runTestWithTimeout(runner.runTest(testFile, timeout), timeout)
      )
    );

    return results.map((result, index) => ({
      testFile: testFiles[index],
      ...result
    }));
  }

  // Run test with timeout
  async runTestWithTimeout(testPromise, timeout) {
    return Promise.race([
      testPromise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Test timeout')), timeout)
      )
    ]);
  }

  // Initialize test environment
  async initializeTestEnvironment() {
    // Set up test database connection
    if (typeof window !== 'undefined') {
      // Setup browser test environment
      this.setupBrowserTestEnvironment();
    } else {
      // Setup Node.js test environment
      this.setupNodeTestEnvironment();
    }
  }

  // Setup browser test environment
  setupBrowserTestEnvironment() {
    // Mock browser APIs for testing
    if (!window.localStorage) {
      window.localStorage = this.createMockStorage();
    }

    if (!window.sessionStorage) {
      window.sessionStorage = this.createMockStorage();
    }

    // Mock service worker for testing
    if (!window.navigator.serviceWorker) {
      window.navigator.serviceWorker = this.createMockServiceWorker();
    }

    // Mock fetch for testing
    if (!window.fetch) {
      window.fetch = this.createMockFetch();
    }
  }

  // Setup Node.js test environment
  setupNodeTestEnvironment() {
    // Setup Node.js specific test environment
    // This would typically involve setting up test databases, etc.
  }

  // Create mock storage
  createMockStorage() {
    const store = {};
    return {
      getItem: (key) => store[key] || null,
      setItem: (key, value) => { store[key] = value.toString(); },
      removeItem: (key) => { delete store[key]; },
      clear: () => { Object.keys(store).forEach(key => delete store[key]); },
      key: (index) => Object.keys(store)[index] || null,
      get length() { return Object.keys(store).length; }
    };
  }

  // Create mock service worker
  createMockServiceWorker() {
    return {
      register: () => Promise.resolve({ active: true }),
      getRegistrations: () => Promise.resolve([]),
      ready: Promise.resolve()
    };
  }

  // Create mock fetch
  createMockFetch() {
    return async (url, options = {}) => {
      // Return mock response based on URL
      const mockResponses = {
        '/api/chapters': { id: 1, title: 'Test Chapter', content: 'Test content' },
        '/api/exercises': [{ id: 1, question: 'Test question', type: 'multiple_choice' }],
        '/api/user': { id: 1, name: 'Test User', progress: 0 },
        '/api/progress': { chapter_id: 1, progress: 50, completed: false }
      };

      const response = mockResponses[url] || { message: 'Mock response' };

      return {
        ok: true,
        status: 200,
        json: () => Promise.resolve(response),
        text: () => Promise.resolve(JSON.stringify(response))
      };
    };
  }

  // Setup test fixtures
  async setupTestFixtures() {
    // Load test data and fixtures
    this.testFixtures = {
      users: [
        { id: 1, name: 'Test User', email: 'test@example.com', role: 'student' },
        { id: 2, name: 'Admin User', email: 'admin@example.com', role: 'admin' }
      ],
      chapters: [
        { id: 1, title: 'Introduction to Physical AI', content: 'Test content for chapter 1' },
        { id: 2, title: 'Basic Concepts', content: 'Test content for chapter 2' }
      ],
      exercises: [
        { id: 1, type: 'multiple_choice', question: 'What is Physical AI?', options: ['A', 'B', 'C'], correct_answer: 'A' },
        { id: 2, type: 'short_answer', question: 'Explain Physical AI', expected_length: 100 }
      ]
    };
  }

  // Setup mock services
  async setupMockServices() {
    this.mockServices = {
      authService: new MockAuthService(this.testFixtures.users),
      contentService: new MockContentService(this.testFixtures.chapters),
      exerciseService: new MockExerciseService(this.testFixtures.exercises),
      progressService: new MockProgressService(),
      offlineService: new MockOfflineService()
    };
  }

  // Clean up test environment
  async cleanupTestEnvironment() {
    // Clean up any test-specific resources
    if (typeof window !== 'undefined') {
      // Remove test-specific DOM elements
      const testElements = document.querySelectorAll('[data-testid]');
      testElements.forEach(el => el.remove());

      // Clear test-specific storage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('test-')) {
          localStorage.removeItem(key);
        }
      });

      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('test-')) {
          sessionStorage.removeItem(key);
        }
      });
    }
  }

  // Clear test fixtures
  async clearTestFixtures() {
    this.testFixtures = null;
    this.mockServices = null;
  }

  // Check performance budgets
  async checkPerformanceBudgets(results) {
    const performanceBudget = this.pipelineConfig.reporting.performance_budget;
    const violations = [];

    // Check each performance metric against budget
    results.forEach(result => {
      if (result.metrics) {
        if (result.metrics.lcp && result.metrics.lcp > performanceBudget.lcp) {
          violations.push({
            metric: 'lcp',
            value: result.metrics.lcp,
            budget: performanceBudget.lcp,
            message: `LCP ${result.metrics.lcp}ms exceeds budget of ${performanceBudget.lcp}ms`
          });
        }

        if (result.metrics.cls && result.metrics.cls > performanceBudget.cls) {
          violations.push({
            metric: 'cls',
            value: result.metrics.cls,
            budget: performanceBudget.cls,
            message: `CLS ${result.metrics.cls} exceeds budget of ${performanceBudget.cls}`
          });
        }

        if (result.metrics.fid && result.metrics.fid > performanceBudget.fid) {
          violations.push({
            metric: 'fid',
            value: result.metrics.fid,
            budget: performanceBudget.fid,
            message: `FID ${result.metrics.fid}ms exceeds budget of ${performanceBudget.fid}ms`
          });
        }
      }
    });

    return {
      results,
      violations,
      passed: violations.length === 0
    };
  }

  // Calculate pipeline progress
  calculateProgress() {
    const totalStages = Object.keys(this.pipelineConfig.stages).length;
    const completedStages = this.pipelineState.completedStages.length;
    return Math.round((completedStages / totalStages) * 100);
  }

  // Add event listener
  addEventListener(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  // Remove event listener
  removeEventListener(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Dispatch pipeline event
  dispatchPipelineEvent(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  // Generate final report
  generateFinalReport() {
    const report = {
      timestamp: new Date().toISOString(),
      duration: this.pipelineState.duration,
      status: this.pipelineState.status,
      stages: {
        completed: this.pipelineState.completedStages,
        failed: this.pipelineState.failedStages
      },
      results: this.testResults,
      coverage: this.getCoverageReport(),
      performance: this.getPerformanceReport(),
      summary: this.getSummary()
    };

    // Save report
    this.saveReport(report);

    return report;
  }

  // Get coverage report
  getCoverageReport() {
    if (typeof window !== 'undefined' && window.__coverage__) {
      return window.__coverage__;
    }
    return null;
  }

  // Get performance report
  getPerformanceReport() {
    if (this.performanceMonitor) {
      return this.performanceMonitor.getMetrics();
    }
    return null;
  }

  // Get pipeline summary
  getSummary() {
    const totalTests = Object.values(this.testResults)
      .flat()
      .filter(result => typeof result === 'object' && result.name)
      .length;

    const passedTests = Object.values(this.testResults)
      .flat()
      .filter(result => typeof result === 'object' && result.status === 'passed')
      .length;

    const failedTests = totalTests - passedTests;

    return {
      totalTests,
      passedTests,
      failedTests,
      successRate: totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0,
      stagesCompleted: this.pipelineState.completedStages.length,
      stagesFailed: this.pipelineState.failedStages.length
    };
  }

  // Save report to storage
  saveReport(report) {
    try {
      const reports = JSON.parse(localStorage.getItem('testReports') || '[]');
      reports.push(report);

      // Keep only last 10 reports
      if (reports.length > 10) {
        reports.shift();
      }

      localStorage.setItem('testReports', JSON.stringify(reports));
    } catch (error) {
      console.error('Error saving test report:', error);
    }
  }

  // Get recent reports
  getRecentReports(count = 5) {
    try {
      const reports = JSON.parse(localStorage.getItem('testReports') || '[]');
      return reports.slice(-count);
    } catch (error) {
      console.error('Error loading test reports:', error);
      return [];
    }
  }

  // Send notifications
  sendNotifications() {
    const summary = this.getSummary();

    if (this.pipelineConfig.notifications.email) {
      this.sendEmailNotification(summary);
    }

    if (this.pipelineConfig.notifications.slack) {
      this.sendSlackNotification(summary);
    }

    if (this.pipelineConfig.notifications.github_status) {
      this.sendGitHubStatus(summary);
    }
  }

  // Send email notification
  sendEmailNotification(summary) {
    // In a real implementation, this would send an email
    console.log('Email notification would be sent:', summary);
  }

  // Send Slack notification
  sendSlackNotification(summary) {
    // In a real implementation, this would send to Slack webhook
    console.log('Slack notification would be sent:', summary);
  }

  // Send GitHub status update
  sendGitHubStatus(summary) {
    // In a real implementation, this would update GitHub status
    console.log('GitHub status would be updated:', summary);
  }

  // Export test results in various formats
  exportResults(format = 'json') {
    const report = this.generateFinalReport();

    if (format === 'json') {
      return JSON.stringify(report, null, 2);
    } else if (format === 'junit') {
      return this.convertToJUnit(report);
    } else if (format === 'html') {
      return this.generateHTMLReport(report);
    } else if (format === 'csv') {
      return this.convertToCSV(report);
    }

    return null;
  }

  // Convert to JUnit XML format
  convertToJUnit(report) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<testsuites>\n';

    // Add summary test suite
    xml += `  <testsuite name="Pipeline Results" tests="${report.summary.totalTests}" failures="${report.summary.failedTests}" errors="0" time="${report.duration / 1000}">\n`;

    // Add individual test cases
    Object.entries(report.results).forEach(([stage, results]) => {
      if (Array.isArray(results)) {
        results.forEach(result => {
          if (typeof result === 'object' && result.name) {
            xml += `    <testcase name="${result.name || 'Unknown Test'}" classname="${stage}" time="${(result.duration || 0) / 1000}">\n`;
            if (result.status === 'failed' || result.error) {
              xml += `      <failure message="${result.error || 'Test failed'}">${result.error || 'Test failed'}</failure>\n`;
            }
            xml += '    </testcase>\n';
          }
        });
      }
    });

    xml += '  </testsuite>\n';
    xml += '</testsuites>';

    return xml;
  }

  // Convert to CSV format
  convertToCSV(report) {
    let csv = 'Stage,Test Name,Status,Duration,Error\n';

    Object.entries(report.results).forEach(([stage, results]) => {
      if (Array.isArray(results)) {
        results.forEach(result => {
          if (typeof result === 'object' && result.name) {
            csv += `"${stage}","${result.name || ''}","${result.status || ''}","${result.duration || ''}","${(result.error || '').replace(/"/g, '""')}"\n`;
          }
        });
      }
    });

    return csv;
  }

  // Generate HTML report
  generateHTMLReport(report) {
    return `<!DOCTYPE html>
<html>
<head>
  <title>Test Pipeline Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: #2c3e50; color: white; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
    .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
    .summary-card { background: #ecf0f1; padding: 15px; border-radius: 5px; text-align: center; }
    .passed { background: #d4edda; color: #155724; }
    .failed { background: #f8d7da; color: #721c24; }
    .results-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .results-table th, .results-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    .results-table th { background-color: #f2f2f2; }
    .status-passed { color: #28a745; }
    .status-failed { color: #dc3545; }
    .status-skipped { color: #ffc107; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Test Pipeline Report</h1>
      <p>Generated: ${new Date().toLocaleString()}</p>
      <p>Duration: ${(report.duration / 1000).toFixed(2)} seconds</p>
    </div>

    <div class="summary-grid">
      <div class="summary-card">
        <h3>Total Tests</h3>
        <p class="text-2xl font-bold">${report.summary.totalTests}</p>
      </div>
      <div class="summary-card passed">
        <h3>Passed</h3>
        <p class="text-2xl font-bold">${report.summary.passedTests}</p>
      </div>
      <div class="summary-card failed">
        <h3>Failed</h3>
        <p class="text-2xl font-bold">${report.summary.failedTests}</p>
      </div>
      <div class="summary-card">
        <h3>Success Rate</h3>
        <p class="text-2xl font-bold">${report.summary.successRate}%</p>
      </div>
    </div>

    <h2>Stage Results</h2>
    <table class="results-table">
      <thead>
        <tr>
          <th>Stage</th>
          <th>Total</th>
          <th>Passed</th>
          <th>Failed</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${Object.entries(report.results).map(([stage, results]) => {
          const total = Array.isArray(results) ? results.length : 0;
          const passed = Array.isArray(results) ? results.filter(r => r.status === 'passed').length : 0;
          const failed = total - passed;
          const status = failed > 0 ? 'failed' : 'passed';

          return `
            <tr>
              <td>${stage}</td>
              <td>${total}</td>
              <td>${passed}</td>
              <td>${failed}</td>
              <td class="status-${status}">${status}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  </div>
</body>
</html>`;
  }

  // Download report
  downloadReport(filename = 'test-pipeline-report', format = 'json') {
    const data = this.exportResults(format);
    if (!data) return;

    const blob = new Blob([data], {
      type: format === 'json' ? 'application/json' :
            format === 'junit' ? 'application/xml' :
            format === 'html' ? 'text/html' :
            'text/csv'
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${format === 'junit' ? 'xml' : format}`;
    document.body.appendChild(a);
    a.click();

    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Trigger pipeline manually
  async triggerManualRun() {
    console.log('Manual pipeline run triggered');
    return await this.runPipeline();
  }

  // Schedule pipeline run
  scheduleRun(cronExpression, options = {}) {
    // In a real implementation, this would use a scheduler
    console.log(`Pipeline scheduled with cron: ${cronExpression}`);

    // For this implementation, we'll simulate a scheduler
    const interval = this.parseCronToInterval(cronExpression);
    if (interval > 0) {
      return setInterval(() => {
        this.runPipeline(options);
      }, interval);
    }

    return null;
  }

  // Parse cron expression to interval in milliseconds
  parseCronToInterval(cronExpression) {
    // Simple cron parsing for common expressions
    const [minute, hour, day, month, weekday] = cronExpression.split(' ');

    // Handle simple cases like "@daily", "@hourly", etc.
    if (cronExpression === '@daily') return 24 * 60 * 60 * 1000; // 24 hours
    if (cronExpression === '@hourly') return 60 * 60 * 1000; // 1 hour
    if (cronExpression === '@weekly') return 7 * 24 * 60 * 60 * 1000; // 1 week

    // For more complex cron expressions, we'd need a proper parser
    // For now, return 0 to indicate unsupported
    return 0;
  }

  // Cancel ongoing pipeline
  cancelPipeline() {
    if (this.pipelineState.status === 'running') {
      this.pipelineState.status = 'cancelled';
      console.log('Pipeline cancelled');
    }
  }

  // Get pipeline status
  getStatus() {
    return {
      ...this.pipelineState,
      config: this.pipelineConfig,
      summary: this.getSummary()
    };
  }

  // Reset pipeline state
  reset() {
    this.pipelineState = {
      currentStage: null,
      status: 'idle',
      startTime: null,
      endTime: null,
      duration: null,
      progress: 0,
      completedStages: [],
      failedStages: []
    };

    this.testResults = {
      setup: null,
      unit: [],
      integration: [],
      e2e: [],
      performance: [],
      security: [],
      teardown: null
    };
  }

  // Validate pipeline configuration
  validateConfig(config = this.pipelineConfig) {
    const errors = [];

    // Validate stages configuration
    for (const [stageName, stageConfig] of Object.entries(config.stages)) {
      if (typeof stageConfig !== 'object') {
        errors.push(`Invalid configuration for stage ${stageName}`);
        continue;
      }

      if (stageConfig.timeout && typeof stageConfig.timeout !== 'number') {
        errors.push(`Invalid timeout for stage ${stageName}`);
      }

      if (stageConfig.parallel !== undefined && typeof stageConfig.parallel !== 'boolean') {
        errors.push(`Invalid parallel setting for stage ${stageName}`);
      }
    }

    // Validate reporting configuration
    if (config.reporting && typeof config.reporting === 'object') {
      if (config.reporting.threshold && (config.reporting.threshold < 0 || config.reporting.threshold > 100)) {
        errors.push('Coverage threshold must be between 0 and 100');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Update pipeline configuration
  updateConfig(newConfig) {
    const validation = this.validateConfig(newConfig);
    if (!validation.isValid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
    }

    this.pipelineConfig = { ...this.pipelineConfig, ...newConfig };
  }
}

// Unit test runner
class UnitTestRunner {
  async runTest(testFile, timeout) {
    // In a real implementation, this would run actual unit tests
    // For this implementation, we'll simulate a test run

    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate test result with random success/failure
        const success = Math.random() > 0.1; // 90% success rate

        resolve({
          name: testFile,
          status: success ? 'passed' : 'failed',
          duration: Math.floor(Math.random() * 1000) + 100, // Random duration 100-1100ms
          timestamp: Date.now()
        });
      }, Math.random() * 200 + 50); // Random delay 50-250ms
    });
  }
}

// Integration test runner
class IntegrationTestRunner {
  async runTest(testFile, timeout) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate integration test result
        const success = Math.random() > 0.15; // 85% success rate

        resolve({
          name: testFile,
          status: success ? 'passed' : 'failed',
          duration: Math.floor(Math.random() * 2000) + 500, // Random duration 500-2500ms
          timestamp: Date.now()
        });
      }, Math.random() * 500 + 100); // Random delay 100-600ms
    });
  }
}

// E2E test runner
class E2ETestRunner {
  async runTest(testFile, timeout) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate E2E test result (these typically take longer)
        const success = Math.random() > 0.2; // 80% success rate

        resolve({
          name: testFile,
          status: success ? 'passed' : 'failed',
          duration: Math.floor(Math.random() * 5000) + 2000, // Random duration 2000-7000ms
          timestamp: Date.now()
        });
      }, Math.random() * 1000 + 500); // Random delay 500-1500ms
    });
  }
}

// Performance test runner
class PerformanceTestRunner {
  async runTest(testFile, timeout) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate performance test result with metrics
        const success = Math.random() > 0.05; // 95% success rate

        resolve({
          name: testFile,
          status: success ? 'passed' : 'failed',
          duration: Math.floor(Math.random() * 1000) + 100,
          metrics: {
            lcp: Math.floor(Math.random() * 3000) + 1000, // 1000-4000ms
            cls: Math.random() * 0.3, // 0-0.3
            fid: Math.floor(Math.random() * 200) + 50, // 50-250ms
            fcp: Math.floor(Math.random() * 2000) + 500, // 500-2500ms
            ttfb: Math.floor(Math.random() * 800) + 100 // 100-900ms
          },
          timestamp: Date.now()
        });
      }, Math.random() * 300 + 100); // Random delay 100-400ms
    });
  }
}

// Security test runner
class SecurityTestRunner {
  async runTest(testFile, timeout) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate security test result
        const success = Math.random() > 0.05; // 95% success rate

        resolve({
          name: testFile,
          status: success ? 'passed' : 'failed',
          duration: Math.floor(Math.random() * 1500) + 300, // Random duration 300-1800ms
          vulnerabilities: success ? 0 : Math.floor(Math.random() * 5) + 1,
          timestamp: Date.now()
        });
      }, Math.random() * 400 + 100); // Random delay 100-500ms
    });
  }
}

// Mock service classes for testing
class MockAuthService {
  constructor(users) {
    this.users = users;
  }

  async login(email, password) {
    const user = this.users.find(u => u.email === email);
    if (user) {
      return { success: true, user, token: 'mock-token' };
    }
    return { success: false, error: 'Invalid credentials' };
  }
}

class MockContentService {
  constructor(chapters) {
    this.chapters = chapters;
  }

  async getChapter(chapterId) {
    return this.chapters.find(c => c.id == chapterId) || null;
  }
}

class MockExerciseService {
  constructor(exercises) {
    this.exercises = exercises;
  }

  async getExercise(exerciseId) {
    return this.exercises.find(e => e.id == exerciseId) || null;
  }
}

class MockProgressService {
  async getProgress(userId, chapterId) {
    return { userId, chapterId, progress: 50, lastAccessed: new Date().toISOString() };
  }

  async saveProgress(userId, chapterId, progress) {
    return { success: true, userId, chapterId, progress };
  }
}

class MockOfflineService {
  async isOnline() {
    return true;
  }

  async syncData() {
    return { success: true, syncedAt: new Date().toISOString() };
  }
}

// Singleton instance
const testPipeline = new TestPipeline();

// Export the class and instance
export { TestPipeline, testPipeline };

// Initialize when DOM is loaded
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    testPipeline.init();
  });
}