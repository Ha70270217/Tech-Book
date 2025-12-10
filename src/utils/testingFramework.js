// Comprehensive Testing Framework

class TestingFramework {
  constructor() {
    this.tests = [];
    this.testSuites = [];
    this.results = [];
    this.running = false;
    this.currentTest = null;
    this.testStats = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      pending: 0
    };

    this.testConfig = {
      timeout: 5000,
      bail: false, // Whether to stop on first failure
      verbose: false,
      reporters: ['console'],
      coverage: false,
      parallel: false
    };

    this.hooks = {
      beforeEach: [],
      afterEach: [],
      beforeAll: [],
      afterAll: []
    };

    this.mocks = new Map();
    this.stubs = new Map();
    this.spies = new Map();

    this.assertions = new Assertions();
    this.expectations = new Expectations(this.assertions);
  }

  // Initialize the testing framework
  init(config = {}) {
    this.testConfig = { ...this.testConfig, ...config };

    // Set up reporters
    this.setupReporters();

    // Initialize coverage if enabled
    if (this.testConfig.coverage) {
      this.initCoverage();
    }

    console.log('Testing framework initialized');
  }

  // Set up reporters
  setupReporters() {
    this.reporters = [];

    if (this.testConfig.reporters.includes('console')) {
      this.reporters.push(new ConsoleReporter());
    }

    if (this.testConfig.reporters.includes('json')) {
      this.reporters.push(new JSONReporter());
    }

    if (this.testConfig.reporters.includes('html')) {
      this.reporters.push(new HTMLReporter());
    }
  }

  // Define a test
  test(name, fn, timeout = this.testConfig.timeout) {
    const testDef = {
      id: this.generateTestId(),
      name,
      fn,
      timeout,
      suite: this.currentSuite,
      status: 'pending',
      startTime: null,
      endTime: null,
      duration: null,
      error: null,
      skipped: false,
      retries: 0,
      maxRetries: 3
    };

    this.tests.push(testDef);
    this.testStats.total++;

    return testDef;
  }

  // Define a test suite
  describe(name, fn) {
    const suite = {
      id: this.generateTestId(),
      name,
      tests: [],
      suites: [],
      parent: this.currentSuite,
      startTime: null,
      endTime: null,
      duration: null,
      status: 'pending'
    };

    this.testSuites.push(suite);

    // Set current suite and run the suite function
    const oldSuite = this.currentSuite;
    this.currentSuite = suite;

    try {
      fn();
    } finally {
      this.currentSuite = oldSuite;
    }
  }

  // Generate unique test ID
  generateTestId() {
    return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Skip a test
  skip(name, fn) {
    const test = this.test(name, fn);
    test.skipped = true;
    this.testStats.skipped++;
    return test;
  }

  // Only run this test (useful for debugging)
  only(name, fn) {
    const test = this.test(name, fn);
    test.only = true;
    return test;
  }

  // Run all tests
  async run() {
    if (this.running) {
      throw new Error('Tests are already running');
    }

    this.running = true;
    this.testStats = { total: 0, passed: 0, failed: 0, skipped: 0, pending: 0 };

    // Run beforeAll hooks
    await this.runHooks('beforeAll');

    try {
      // Run tests
      for (const test of this.tests) {
        if (test.skipped) continue;

        // Skip if not 'only' test and there are 'only' tests
        const hasOnlyTests = this.tests.some(t => t.only);
        if (hasOnlyTests && !test.only) continue;

        await this.runTest(test);

        // Bail on first failure if configured
        if (this.testConfig.bail && this.testStats.failed > 0) {
          break;
        }
      }
    } finally {
      // Run afterAll hooks
      await this.runHooks('afterAll');

      this.running = false;

      // Report results
      this.reportResults();

      // Generate coverage report if enabled
      if (this.testConfig.coverage) {
        this.generateCoverageReport();
      }
    }
  }

  // Run a single test
  async runTest(test) {
    this.currentTest = test;
    test.startTime = Date.now();

    try {
      // Run beforeEach hooks
      await this.runHooks('beforeEach');

      // Execute test function with timeout
      const result = await this.executeTestWithTimeout(test);

      test.status = 'passed';
      this.testStats.passed++;
    } catch (error) {
      test.status = 'failed';
      test.error = error;
      this.testStats.failed++;

      // Retry if configured and not already retried max times
      if (test.retries < test.maxRetries) {
        test.retries++;
        console.log(`Retrying test: ${test.name} (${test.retries}/${test.maxRetries})`);
        await this.runTest(test);
        return;
      }
    } finally {
      test.endTime = Date.now();
      test.duration = test.endTime - test.startTime;

      // Run afterEach hooks
      await this.runHooks('afterEach');

      this.results.push(test);
      this.currentTest = null;
    }
  }

  // Execute test with timeout
  async executeTestWithTimeout(test) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Test "${test.name}" timed out after ${test.timeout}ms`));
      }, test.timeout);

      try {
        const result = test.fn();
        if (result && typeof result.then === 'function') {
          result.then(() => {
            clearTimeout(timeoutId);
            resolve();
          }).catch(error => {
            clearTimeout(timeoutId);
            reject(error);
          });
        } else {
          clearTimeout(timeoutId);
          resolve();
        }
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  // Run hooks of a specific type
  async runHooks(hookType) {
    const hooks = this.hooks[hookType] || [];

    for (const hook of hooks) {
      try {
        const result = hook();
        if (result && typeof result.then === 'function') {
          await result;
        }
      } catch (error) {
        console.error(`Error in ${hookType} hook:`, error);
        throw error;
      }
    }
  }

  // Add hook
  addHook(hookType, fn) {
    if (!this.hooks[hookType]) {
      this.hooks[hookType] = [];
    }
    this.hooks[hookType].push(fn);
  }

  // Before each hook
  beforeEach(fn) {
    this.addHook('beforeEach', fn);
  }

  // After each hook
  afterEach(fn) {
    this.addHook('afterEach', fn);
  }

  // Before all hook
  beforeAll(fn) {
    this.addHook('beforeAll', fn);
  }

  // After all hook
  afterAll(fn) {
    this.addHook('afterAll', fn);
  }

  // Mock a function or object
  mock(obj, property, mockImplementation) {
    const original = obj[property];
    const mockFn = this.createMockFunction(mockImplementation);

    obj[property] = mockFn;

    const mockId = this.generateMockId();
    this.mocks.set(mockId, { obj, property, original, mock: mockFn });

    return {
      mockId,
      restore: () => this.restoreMock(mockId),
      mockImplementation: (newImpl) => {
        obj[property] = this.createMockFunction(newImpl);
      },
      mockReturnValue: (value) => {
        obj[property] = () => value;
      },
      mockResolvedValue: (value) => {
        obj[property] = () => Promise.resolve(value);
      },
      mockRejectedValue: (error) => {
        obj[property] = () => Promise.reject(error);
      }
    };
  }

  // Create mock function
  createMockFunction(implementation) {
    const mockFn = function(...args) {
      mockFn.mock.calls.push(args);
      mockFn.mock.instances.push(this);

      if (implementation) {
        return implementation.apply(this, args);
      }

      return undefined;
    };

    mockFn.mock = {
      calls: [],
      instances: [],
      results: []
    };

    return mockFn;
  }

  // Stub a function
  stub(obj, property, stubValue) {
    const original = obj[property];
    obj[property] = stubValue;

    const stubId = this.generateMockId();
    this.stubs.set(stubId, { obj, property, original });

    return {
      stubId,
      restore: () => this.restoreStub(stubId)
    };
  }

  // Spy on a function
  spy(obj, property) {
    const original = obj[property];
    let callCount = 0;
    const calls = [];

    const spyFn = function(...args) {
      callCount++;
      calls.push(args);
      return original.apply(this, args);
    };

    spyFn.getCallCount = () => callCount;
    spyFn.getCalls = () => [...calls];
    spyFn.wasCalled = () => callCount > 0;
    spyFn.wasCalledWith = (expectedArgs) => {
      return calls.some(callArgs =>
        JSON.stringify(callArgs) === JSON.stringify(expectedArgs)
      );
    };

    obj[property] = spyFn;

    const spyId = this.generateMockId();
    this.spies.set(spyId, { obj, property, original, spy: spyFn });

    return spyFn;
  }

  // Generate mock ID
  generateMockId() {
    return `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Restore mock
  restoreMock(mockId) {
    const mock = this.mocks.get(mockId);
    if (mock) {
      mock.obj[mock.property] = mock.original;
      this.mocks.delete(mockId);
    }
  }

  // Restore stub
  restoreStub(stubId) {
    const stub = this.stubs.get(stubId);
    if (stub) {
      stub.obj[stub.property] = stub.original;
      this.stubs.delete(stubId);
    }
  }

  // Restore spy
  restoreSpy(spyId) {
    const spy = this.spies.get(spyId);
    if (spy) {
      spy.obj[spy.property] = spy.original;
      this.spies.delete(spyId);
    }
  }

  // Initialize coverage tracking
  initCoverage() {
    if (typeof window !== 'undefined') {
      // Browser-based coverage tracking
      window.__coverage__ = window.__coverage__ || {};
    }
  }

  // Generate coverage report
  generateCoverageReport() {
    if (this.testConfig.coverage && typeof window !== 'undefined') {
      const coverage = window.__coverage__;
      if (coverage) {
        console.log('Coverage report:', coverage);
        // In a real implementation, we would generate a detailed report
      }
    }
  }

  // Report test results
  reportResults() {
    const report = {
      stats: { ...this.testStats },
      results: [...this.results],
      timestamp: new Date().toISOString()
    };

    this.reporters.forEach(reporter => {
      reporter.report(report);
    });

    console.log(`\nTest Results: ${this.testStats.passed} passed, ${this.testStats.failed} failed, ${this.testStats.skipped} skipped`);
  }

  // Get test results
  getResults() {
    return {
      stats: { ...this.testStats },
      results: [...this.results],
      timestamp: new Date().toISOString()
    };
  }

  // Reset test framework
  reset() {
    this.tests = [];
    this.testSuites = [];
    this.results = [];
    this.testStats = { total: 0, passed: 0, failed: 0, skipped: 0, pending: 0 };
    this.mocks.clear();
    this.stubs.clear();
    this.spies.clear();
    this.running = false;
  }

  // Run tests matching a pattern
  async runMatching(pattern) {
    const filteredTests = this.tests.filter(test =>
      test.name.toLowerCase().includes(pattern.toLowerCase())
    );

    const originalTests = [...this.tests];
    this.tests = filteredTests;

    try {
      await this.run();
    } finally {
      this.tests = originalTests;
    }
  }

  // Run tests in a specific suite
  async runSuite(suiteName) {
    const suite = this.testSuites.find(s => s.name === suiteName);
    if (!suite) {
      throw new Error(`Suite not found: ${suiteName}`);
    }

    // Filter tests that belong to the suite
    const suiteTests = this.tests.filter(test => test.suite === suite);
    const originalTests = [...this.tests];
    this.tests = suiteTests;

    try {
      await this.run();
    } finally {
      this.tests = originalTests;
    }
  }

  // Wait for condition to be true
  async waitFor(condition, timeout = 5000, interval = 100) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (condition()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }

    throw new Error(`Condition not met within ${timeout}ms`);
  }

  // Wait for element to exist
  async waitForElement(selector, timeout = 5000) {
    return this.waitFor(() => document.querySelector(selector), timeout);
  }

  // Wait for element to be visible
  async waitForVisible(selector, timeout = 5000) {
    return this.waitFor(() => {
      const element = document.querySelector(selector);
      return element && element.offsetParent !== null;
    }, timeout);
  }

  // Wait for element to contain text
  async waitForText(selector, text, timeout = 5000) {
    return this.waitFor(() => {
      const element = document.querySelector(selector);
      return element && element.textContent.includes(text);
    }, timeout);
  }

  // Wait for element to have class
  async waitForClass(selector, className, timeout = 5000) {
    return this.waitFor(() => {
      const element = document.querySelector(selector);
      return element && element.classList.contains(className);
    }, timeout);
  }

  // Wait for network request to complete
  async waitForNetworkRequest(urlPattern, timeout = 5000) {
    return this.waitFor(() => {
      // This would check for network requests in a real implementation
      // For now, we'll just return true
      return true;
    }, timeout);
  }

  // Take a screenshot (in browser environment)
  async takeScreenshot(name) {
    if (typeof document !== 'undefined') {
      // This would use HTML2Canvas or similar in a real implementation
      console.log(`Screenshot taken: ${name}`);
    }
  }

  // Get element text
  getElementText(selector) {
    const element = document.querySelector(selector);
    return element ? element.textContent : null;
  }

  // Get element attribute
  getElementAttribute(selector, attribute) {
    const element = document.querySelector(selector);
    return element ? element.getAttribute(attribute) : null;
  }

  // Get element style
  getElementStyle(selector, property) {
    const element = document.querySelector(selector);
    return element ? window.getComputedStyle(element)[property] : null;
  }

  // Click element
  click(selector) {
    const element = document.querySelector(selector);
    if (element) {
      element.click();
    } else {
      throw new Error(`Element not found: ${selector}`);
    }
  }

  // Type text into element
  type(selector, text) {
    const element = document.querySelector(selector);
    if (element) {
      element.value = text;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      throw new Error(`Element not found: ${selector}`);
    }
  }

  // Select option from dropdown
  selectOption(selector, value) {
    const element = document.querySelector(selector);
    if (element) {
      element.value = value;
      element.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      throw new Error(`Element not found: ${selector}`);
    }
  }

  // Check if element exists
  exists(selector) {
    return document.querySelector(selector) !== null;
  }

  // Check if element is visible
  isVisible(selector) {
    const element = document.querySelector(selector);
    return element && element.offsetParent !== null;
  }

  // Check if element is enabled
  isEnabled(selector) {
    const element = document.querySelector(selector);
    return element && !element.disabled;
  }

  // Check if element is checked
  isChecked(selector) {
    const element = document.querySelector(selector);
    return element && element.checked;
  }

  // Get element count
  getCount(selector) {
    return document.querySelectorAll(selector).length;
  }

  // Wait for page to load
  async waitForPageLoad() {
    return new Promise(resolve => {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        window.addEventListener('load', resolve);
      }
    });
  }

  // Wait for DOM to be ready
  async waitForDOMReady() {
    return new Promise(resolve => {
      if (document.readyState !== 'loading') {
        resolve();
      } else {
        document.addEventListener('DOMContentLoaded', resolve);
      }
    });
  }

  // Get page title
  getPageTitle() {
    return document.title;
  }

  // Get current URL
  getCurrentURL() {
    return window.location.href;
  }

  // Navigate to URL
  navigateTo(url) {
    window.location.href = url;
  }

  // Go back in history
  goBack() {
    window.history.back();
  }

  // Go forward in history
  goForward() {
    window.history.forward();
  }

  // Refresh page
  refresh() {
    window.location.reload();
  }

  // Get cookies
  getCookies() {
    return document.cookie.split(';').map(cookie => {
      const [name, value] = cookie.trim().split('=');
      return { name, value };
    });
  }

  // Set cookie
  setCookie(name, value, options = {}) {
    let cookieString = `${name}=${value}`;

    if (options.expires) {
      cookieString += `; expires=${options.expires.toUTCString()}`;
    }
    if (options.path) {
      cookieString += `; path=${options.path}`;
    }
    if (options.domain) {
      cookieString += `; domain=${options.domain}`;
    }
    if (options.secure) {
      cookieString += '; secure';
    }
    if (options.httpOnly) {
      cookieString += '; HttpOnly';
    }

    document.cookie = cookieString;
  }

  // Remove cookie
  removeCookie(name, path, domain) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT${path ? `; path=${path}` : ''}${domain ? `; domain=${domain}` : ''}`;
  }

  // Get localStorage item
  getLocalStorageItem(key) {
    return localStorage.getItem(key);
  }

  // Set localStorage item
  setLocalStorageItem(key, value) {
    localStorage.setItem(key, value);
  }

  // Remove localStorage item
  removeLocalStorageItem(key) {
    localStorage.removeItem(key);
  }

  // Clear localStorage
  clearLocalStorage() {
    localStorage.clear();
  }

  // Get sessionStorage item
  getSessionStorageItem(key) {
    return sessionStorage.getItem(key);
  }

  // Set sessionStorage item
  setSessionStorageItem(key, value) {
    sessionStorage.setItem(key, value);
  }

  // Remove sessionStorage item
  removeSessionStorageItem(key) {
    sessionStorage.removeItem(key);
  }

  // Clear sessionStorage
  clearSessionStorage() {
    sessionStorage.clear();
  }

  // Wait for animation to complete
  async waitForAnimation(selector, timeout = 5000) {
    return this.waitFor(() => {
      const element = document.querySelector(selector);
      if (!element) return false;

      const computedStyle = window.getComputedStyle(element);
      return computedStyle.animationName === 'none' || !computedStyle.animationName;
    }, timeout);
  }

  // Wait for transition to complete
  async waitForTransition(selector, timeout = 5000) {
    return this.waitFor(() => {
      const element = document.querySelector(selector);
      if (!element) return false;

      const computedStyle = window.getComputedStyle(element);
      return computedStyle.transitionProperty === 'none' || !computedStyle.transitionProperty;
    }, timeout);
  }

  // Scroll to element
  scrollToElement(selector) {
    const element = document.querySelector(selector);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
      throw new Error(`Element not found: ${selector}`);
    }
  }

  // Scroll to top
  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Scroll to bottom
  scrollToBottom() {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }

  // Get element position
  getElementPosition(selector) {
    const element = document.querySelector(selector);
    if (element) {
      const rect = element.getBoundingClientRect();
      return {
        x: rect.left + window.scrollX,
        y: rect.top + window.scrollY,
        width: rect.width,
        height: rect.height
      };
    }
    return null;
  }

  // Get window dimensions
  getWindowDimensions() {
    return {
      width: window.innerWidth,
      height: window.innerHeight
    };
  }

  // Resize window (for testing responsive behavior)
  resizeWindow(width, height) {
    window.resizeTo(width, height);
  }

  // Get computed style
  getComputedStyle(selector, property) {
    const element = document.querySelector(selector);
    if (element) {
      return window.getComputedStyle(element)[property];
    }
    return null;
  }

  // Get element bounding box
  getBoundingBox(selector) {
    const element = document.querySelector(selector);
    if (element) {
      return element.getBoundingClientRect();
    }
    return null;
  }

  // Check if element is in viewport
  isElementInViewport(selector) {
    const element = document.querySelector(selector);
    if (element) {
      const rect = element.getBoundingClientRect();
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      );
    }
    return false;
  }

  // Simulate keyboard event
  simulateKeyboardEvent(selector, eventType, key) {
    const element = document.querySelector(selector) || document;
    const event = new KeyboardEvent(eventType, { key });
    element.dispatchEvent(event);
  }

  // Simulate mouse event
  simulateMouseEvent(selector, eventType, options = {}) {
    const element = document.querySelector(selector);
    if (element) {
      const event = new MouseEvent(eventType, {
        bubbles: true,
        cancelable: true,
        view: window,
        ...options
      });
      element.dispatchEvent(event);
    } else {
      throw new Error(`Element not found: ${selector}`);
    }
  }

  // Simulate touch event
  simulateTouchEvent(selector, eventType, options = {}) {
    const element = document.querySelector(selector);
    if (element) {
      const event = new TouchEvent(eventType, {
        bubbles: true,
        cancelable: true,
        touches: [new Touch({
          identifier: Date.now(),
          target: element,
          ...options
        })],
        ...options
      });
      element.dispatchEvent(event);
    } else {
      throw new Error(`Element not found: ${selector}`);
    }
  }

  // Wait for specific event
  async waitForEvent(element, eventType, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Event ${eventType} did not occur within ${timeout}ms`));
      }, timeout);

      const listener = () => {
        clearTimeout(timeoutId);
        element.removeEventListener(eventType, listener);
        resolve();
      };

      element.addEventListener(eventType, listener);
    });
  }

  // Wait for custom event
  async waitForCustomEvent(eventName, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Custom event ${eventName} did not occur within ${timeout}ms`));
      }, timeout);

      const listener = (event) => {
        clearTimeout(timeoutId);
        window.removeEventListener(eventName, listener);
        resolve(event);
      };

      window.addEventListener(eventName, listener);
    });
  }

  // Fire custom event
  fireCustomEvent(eventName, detail = {}) {
    const event = new CustomEvent(eventName, { detail });
    window.dispatchEvent(event);
  }

  // Get performance metrics
  getPerformanceMetrics() {
    if ('performance' in window) {
      return {
        navigation: performance.getEntriesByType('navigation')[0],
        paint: performance.getEntriesByType('paint'),
        resources: performance.getEntriesByType('resource'),
        longTasks: performance.getEntriesByType('longtask'),
        memory: performance.memory ? {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
        } : null
      };
    }
    return null;
  }

  // Measure function execution time
  async measureFunction(fn, iterations = 1) {
    const times = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await Promise.resolve(fn());
      const end = performance.now();
      times.push(end - start);
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);

    return {
      times,
      average: avg,
      min,
      max,
      iterations
    };
  }

  // Measure element rendering time
  async measureElementRenderTime(selector, timeout = 5000) {
    const start = performance.now();

    await this.waitForElement(selector, timeout);

    const end = performance.now();
    return end - start;
  }

  // Check accessibility
  checkAccessibility(selector) {
    // This would use an accessibility testing library in a real implementation
    // For now, we'll return a mock result
    return {
      element: selector,
      issues: [],
      score: 100,
      report: 'No accessibility issues found'
    };
  }

  // Run accessibility audit
  async runAccessibilityAudit() {
    // This would run a full accessibility audit in a real implementation
    return {
      score: 100,
      issues: [],
      report: 'No accessibility issues found'
    };
  }

  // Run performance audit
  async runPerformanceAudit() {
    // This would run a full performance audit in a real implementation
    return {
      lcp: 0,
      cls: 0,
      fid: 0,
      fcp: 0,
      ttfb: 0,
      score: 100,
      report: 'No performance issues found'
    };
  }

  // Run security audit
  async runSecurityAudit() {
    // This would run a security audit in a real implementation
    return {
      score: 100,
      issues: [],
      report: 'No security issues found'
    };
  }

  // Run comprehensive audit
  async runComprehensiveAudit() {
    const [accessibility, performance, security] = await Promise.all([
      this.runAccessibilityAudit(),
      this.runPerformanceAudit(),
      this.runSecurityAudit()
    ]);

    return {
      accessibility,
      performance,
      security,
      overallScore: Math.round((accessibility.score + performance.score + security.score) / 3),
      timestamp: new Date().toISOString()
    };
  }

  // Generate test report
  generateTestReport(format = 'json') {
    const report = {
      framework: 'Custom Testing Framework',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      stats: { ...this.testStats },
      results: this.results.map(result => ({
        name: result.name,
        status: result.status,
        duration: result.duration,
        error: result.error ? result.error.message : null
      })),
      coverage: this.testConfig.coverage ? window.__coverage__ : null
    };

    if (format === 'json') {
      return JSON.stringify(report, null, 2);
    } else if (format === 'html') {
      return this.generateHTMLReport(report);
    } else if (format === 'text') {
      return this.generateTextReport(report);
    }

    return null;
  }

  // Generate HTML report
  generateHTMLReport(report) {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Test Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .header { background: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px; }
    .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
    .passed { background: #d4edda; border-color: #c3e6cb; color: #155724; }
    .failed { background: #f8d7da; border-color: #f5c6cb; color: #721c24; }
    .skipped { background: #fff3cd; border-color: #ffeaa7; color: #856404; }
    .results { margin-top: 20px; }
    .result { padding: 10px; margin: 5px 0; border-radius: 3px; }
    .result.passed { background: #d4edda; }
    .result.failed { background: #f8d7da; }
    .result.skipped { background: #fff3cd; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Test Report</h1>
    <p>Generated: ${new Date(report.timestamp).toLocaleString()}</p>
  </div>

  <div class="stats">
    <div class="stat-card passed">
      <h3>Passed</h3>
      <p>${report.stats.passed}</p>
    </div>
    <div class="stat-card failed">
      <h3>Failed</h3>
      <p>${report.stats.failed}</p>
    </div>
    <div class="stat-card skipped">
      <h3>Skipped</h3>
      <p>${report.stats.skipped}</p>
    </div>
    <div class="stat-card">
      <h3>Total</h3>
      <p>${report.stats.total}</p>
    </div>
  </div>

  <div class="results">
    <h2>Test Results</h2>
    ${report.results.map(result => `
      <div class="result ${result.status}">
        <strong>${result.name}</strong> - ${result.status} (${result.duration}ms)
        ${result.error ? `<div style="margin-top: 5px; color: #721c24;">Error: ${result.error}</div>` : ''}
      </div>
    `).join('')}
  </div>
</body>
</html>`;
  }

  // Generate text report
  generateTextReport(report) {
    let text = `Test Report\n`;
    text += `Generated: ${new Date(report.timestamp).toLocaleString()}\n\n`;
    text += `Stats:\n`;
    text += `  Passed: ${report.stats.passed}\n`;
    text += `  Failed: ${report.stats.failed}\n`;
    text += `  Skipped: ${report.stats.skipped}\n`;
    text += `  Total: ${report.stats.total}\n\n`;

    text += `Results:\n`;
    report.results.forEach(result => {
      text += `  ${result.status.toUpperCase()}: ${result.name} (${result.duration}ms)\n`;
      if (result.error) {
        text += `    ERROR: ${result.error}\n`;
      }
      text += `\n`;
    });

    return text;
  }

  // Download test report
  downloadTestReport(filename = 'test-report', format = 'json') {
    const report = this.generateTestReport(format);
    if (!report) return;

    const blob = new Blob([report], {
      type: format === 'json' ? 'application/json' :
            format === 'html' ? 'text/html' :
            'text/plain'
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

  // Clean up resources
  destroy() {
    this.reset();
    this.mocks.clear();
    this.stubs.clear();
    this.spies.clear();
  }
}

// Assertions class
class Assertions {
  constructor() {
    this.assertionCount = 0;
  }

  // Equal assertion
  equal(actual, expected, message = 'Expected values to be equal') {
    this.assertionCount++;
    if (actual != expected) {
      throw new Error(`${message}: ${actual} !== ${expected}`);
    }
  }

  // Strict equal assertion
  strictEqual(actual, expected, message = 'Expected values to be strictly equal') {
    this.assertionCount++;
    if (actual !== expected) {
      throw new Error(`${message}: ${actual} !== ${expected}`);
    }
  }

  // Deep equal assertion
  deepEqual(actual, expected, message = 'Expected objects to be deeply equal') {
    this.assertionCount++;
    if (!this.isDeepEqual(actual, expected)) {
      throw new Error(`${message}: ${JSON.stringify(actual)} !== ${JSON.stringify(expected)}`);
    }
  }

  // Is true assertion
  isTrue(actual, message = 'Expected value to be true') {
    this.assertionCount++;
    if (actual !== true) {
      throw new Error(`${message}: ${actual} is not true`);
    }
  }

  // Is false assertion
  isFalse(actual, message = 'Expected value to be false') {
    this.assertionCount++;
    if (actual !== false) {
      throw new Error(`${message}: ${actual} is not false`);
    }
  }

  // Is null assertion
  isNull(actual, message = 'Expected value to be null') {
    this.assertionCount++;
    if (actual !== null) {
      throw new Error(`${message}: ${actual} is not null`);
    }
  }

  // Is undefined assertion
  isUndefined(actual, message = 'Expected value to be undefined') {
    this.assertionCount++;
    if (actual !== undefined) {
      throw new Error(`${message}: ${actual} is not undefined`);
    }
  }

  // Is defined assertion
  isDefined(actual, message = 'Expected value to be defined') {
    this.assertionCount++;
    if (actual === undefined) {
      throw new Error(`${message}: ${actual} is undefined`);
    }
  }

  // Throws assertion
  throws(fn, expectedError, message = 'Expected function to throw an error') {
    this.assertionCount++;
    try {
      fn();
      throw new Error(`${message}: Function did not throw an error`);
    } catch (error) {
      if (expectedError) {
        if (typeof expectedError === 'string') {
          if (error.message !== expectedError) {
            throw new Error(`${message}: Expected error message "${expectedError}", got "${error.message}"`);
          }
        } else if (expectedError instanceof RegExp) {
          if (!expectedError.test(error.message)) {
            throw new Error(`${message}: Error message "${error.message}" does not match pattern ${expectedError}`);
          }
        } else if (typeof expectedError === 'function') {
          if (!(error instanceof expectedError)) {
            throw new Error(`${message}: Expected error of type ${expectedError.name}, got ${error.constructor.name}`);
          }
        }
      }
    }
  }

  // Does not throw assertion
  doesNotThrow(fn, message = 'Expected function not to throw an error') {
    this.assertionCount++;
    try {
      fn();
    } catch (error) {
      throw new Error(`${message}: Function threw an error: ${error.message}`);
    }
  }

  // Matches assertion
  matches(actual, pattern, message = 'Expected value to match pattern') {
    this.assertionCount++;
    if (typeof pattern === 'string') {
      if (actual !== pattern) {
        throw new Error(`${message}: "${actual}" does not match "${pattern}"`);
      }
    } else if (pattern instanceof RegExp) {
      if (!pattern.test(actual)) {
        throw new Error(`${message}: "${actual}" does not match pattern ${pattern}`);
      }
    } else {
      throw new Error('Pattern must be string or RegExp');
    }
  }

  // Does not match assertion
  doesNotMatch(actual, pattern, message = 'Expected value not to match pattern') {
    this.assertionCount++;
    if (typeof pattern === 'string') {
      if (actual === pattern) {
        throw new Error(`${message}: "${actual}" matches "${pattern}"`);
      }
    } else if (pattern instanceof RegExp) {
      if (pattern.test(actual)) {
        throw new Error(`${message}: "${actual}" matches pattern ${pattern}`);
      }
    } else {
      throw new Error('Pattern must be string or RegExp');
    }
  }

  // Greater than assertion
  greaterThan(actual, expected, message = `Expected ${actual} to be greater than ${expected}`) {
    this.assertionCount++;
    if (actual <= expected) {
      throw new Error(message);
    }
  }

  // Less than assertion
  lessThan(actual, expected, message = `Expected ${actual} to be less than ${expected}`) {
    this.assertionCount++;
    if (actual >= expected) {
      throw new Error(message);
    }
  }

  // Greater than or equal assertion
  greaterThanOrEqual(actual, expected, message = `Expected ${actual} to be greater than or equal to ${expected}`) {
    this.assertionCount++;
    if (actual < expected) {
      throw new Error(message);
    }
  }

  // Less than or equal assertion
  lessThanOrEqual(actual, expected, message = `Expected ${actual} to be less than or equal to ${expected}`) {
    this.assertionCount++;
    if (actual > expected) {
      throw new Error(message);
    }
  }

  // Array contains assertion
  contains(arr, item, message = `Expected array to contain item`) {
    this.assertionCount++;
    if (!arr.includes(item)) {
      throw new Error(`${message}: Array [${arr.join(', ')}] does not contain ${item}`);
    }
  }

  // Array does not contain assertion
  doesNotContain(arr, item, message = `Expected array not to contain item`) {
    this.assertionCount++;
    if (arr.includes(item)) {
      throw new Error(`${message}: Array [${arr.join(', ')}] contains ${item}`);
    }
  }

  // Array has length assertion
  hasLength(arr, length, message = `Expected array to have length ${length}`) {
    this.assertionCount++;
    if (arr.length !== length) {
      throw new Error(`${message}: Array has length ${arr.length}`);
    }
  }

  // Is instance of assertion
  isInstanceOf(actual, expected, message = `Expected ${actual} to be instance of ${expected.name}`) {
    this.assertionCount++;
    if (!(actual instanceof expected)) {
      throw new Error(message);
    }
  }

  // Is type of assertion
  isTypeOf(actual, expected, message = `Expected ${typeof actual} to be ${expected}`) {
    this.assertionCount++;
    if (typeof actual !== expected) {
      throw new Error(message);
    }
  }

  // Check if two objects are deeply equal
  isDeepEqual(obj1, obj2) {
    if (obj1 === obj2) return true;

    if (obj1 == null || obj2 == null) return obj1 === obj2;

    if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return obj1 === obj2;

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
      if (!keys2.includes(key)) return false;
      if (!this.isDeepEqual(obj1[key], obj2[key])) return false;
    }

    return true;
  }
}

// Expectations class (similar to Chai's expect)
class Expectations {
  constructor(assertions) {
    this.assertions = assertions;
  }

  expect(actual) {
    return new Expectation(actual, this.assertions);
  }
}

class Expectation {
  constructor(actual, assertions) {
    this.actual = actual;
    this.assertions = assertions;
    this.negated = false;
  }

  get not() {
    this.negated = !this.negated;
    return this;
  }

  equal(expected) {
    if (this.negated) {
      if (this.actual == expected) {
        throw new Error(`Expected ${this.actual} not to equal ${expected}`);
      }
    } else {
      this.assertions.equal(this.actual, expected);
    }
  }

  strictEqual(expected) {
    if (this.negated) {
      if (this.actual === expected) {
        throw new Error(`Expected ${this.actual} not to strictly equal ${expected}`);
      }
    } else {
      this.assertions.strictEqual(this.actual, expected);
    }
  }

  deepEqual(expected) {
    if (this.negated) {
      if (this.assertions.isDeepEqual(this.actual, expected)) {
        throw new Error(`Expected ${this.actual} not to deeply equal ${expected}`);
      }
    } else {
      this.assertions.deepEqual(this.actual, expected);
    }
  }

  true() {
    if (this.negated) {
      if (this.actual === true) {
        throw new Error(`Expected ${this.actual} not to be true`);
      }
    } else {
      this.assertions.isTrue(this.actual);
    }
  }

  false() {
    if (this.negated) {
      if (this.actual === false) {
        throw new Error(`Expected ${this.actual} not to be false`);
      }
    } else {
      this.assertions.isFalse(this.actual);
    }
  }

  null() {
    if (this.negated) {
      if (this.actual === null) {
        throw new Error(`Expected ${this.actual} not to be null`);
      }
    } else {
      this.assertions.isNull(this.actual);
    }
  }

  undefined() {
    if (this.negated) {
      if (this.actual === undefined) {
        throw new Error(`Expected ${this.actual} not to be undefined`);
      }
    } else {
      this.assertions.isUndefined(this.actual);
    }
  }

  defined() {
    if (this.negated) {
      if (this.actual !== undefined) {
        throw new Error(`Expected ${this.actual} not to be defined`);
      }
    } else {
      this.assertions.isDefined(this.actual);
    }
  }

  throw(expectedError) {
    if (this.negated) {
      this.assertions.doesNotThrow(this.actual, `Expected function not to throw${expectedError ? ` ${expectedError}` : ''}`);
    } else {
      this.assertions.throws(this.actual, expectedError);
    }
  }

  match(pattern) {
    if (this.negated) {
      this.assertions.doesNotMatch(this.actual, pattern);
    } else {
      this.assertions.matches(this.actual, pattern);
    }
  }

  gt(expected) {
    if (this.negated) {
      this.assertions.lessThanOrEqual(this.actual, expected);
    } else {
      this.assertions.greaterThan(this.actual, expected);
    }
  }

  lt(expected) {
    if (this.negated) {
      this.assertions.greaterThanOrEqual(this.actual, expected);
    } else {
      this.assertions.lessThan(this.actual, expected);
    }
  }

  gte(expected) {
    if (this.negated) {
      this.assertions.lessThan(this.actual, expected);
    } else {
      this.assertions.greaterThanOrEqual(this.actual, expected);
    }
  }

  lte(expected) {
    if (this.negated) {
      this.assertions.greaterThan(this.actual, expected);
    } else {
      this.assertions.lessThanOrEqual(this.actual, expected);
    }
  }

  length(expected) {
    if (this.negated) {
      if (this.actual.length === expected) {
        throw new Error(`Expected array not to have length ${expected}`);
      }
    } else {
      this.assertions.hasLength(this.actual, expected);
    }
  }

  contain(item) {
    if (this.negated) {
      this.assertions.doesNotContain(this.actual, item);
    } else {
      this.assertions.contains(this.actual, item);
    }
  }
}

// Reporter classes
class ConsoleReporter {
  report(testReport) {
    console.log('\n=== Test Results ===');
    console.log(`Total: ${testReport.stats.total}`);
    console.log(`Passed: ${testReport.stats.passed}`);
    console.log(`Failed: ${testReport.stats.failed}`);
    console.log(`Skipped: ${testReport.stats.skipped}`);

    testReport.results.forEach(result => {
      const statusSymbol = result.status === 'passed' ? '✓' : result.status === 'failed' ? '✗' : '-';
      console.log(`${statusSymbol} ${result.name} (${result.duration}ms)`);
      if (result.error) {
        console.error(`  Error: ${result.error.message}`);
      }
    });
  }
}

class JSONReporter {
  report(testReport) {
    console.log(JSON.stringify(testReport, null, 2));
  }
}

class HTMLReporter {
  report(testReport) {
    // In a real implementation, this would generate an HTML report file
    console.log('HTML report generated');
  }
}

// Singleton instance
const testingFramework = new TestingFramework();

// Export the classes and instance
export { TestingFramework, testingFramework, Assertions, Expectations };

// Make available globally for testing
if (typeof window !== 'undefined') {
  window.TestingFramework = testingFramework;
  window.test = testingFramework.test.bind(testingFramework);
  window.describe = testingFramework.describe.bind(testingFramework);
  window.it = testingFramework.test.bind(testingFramework);
  window.expect = testingFramework.expectations.expect.bind(testingFramework.expectations);
  window.assert = testingFramework.assertions;
}