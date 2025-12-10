// Performance testing and benchmarking tools

class PerformanceTesting {
  constructor() {
    this.testResults = [];
    this.benchmarks = {};
    this.currentTest = null;
    this.isTesting = false;
    this.testHistory = [];
    this.maxHistory = 50; // Keep last 50 test results
  }

  // Run a performance test
  async runTest(testName, testFunction, iterations = 1, options = {}) {
    const {
      warmup = true,
      warmupIterations = 3,
      collectMemory = false,
      collectGC = false
    } = options;

    if (this.isTesting) {
      throw new Error('A test is already running');
    }

    this.isTesting = true;
    this.currentTest = testName;

    try {
      // Warmup phase
      if (warmup) {
        for (let i = 0; i < warmupIterations; i++) {
          await testFunction();
        }
      }

      // Memory collection before test
      let memoryBefore = null;
      if (collectMemory && 'performance' in window && 'memory' in performance) {
        memoryBefore = { ...performance.memory };
      }

      // Start timing
      const startTime = performance.now();
      const startMark = `test_start_${testName}_${Date.now()}`;
      performance.mark(startMark);

      // Run the test
      const results = [];
      for (let i = 0; i < iterations; i++) {
        const iterationStart = performance.now();
        const result = await testFunction();
        const iterationEnd = performance.now();

        results.push({
          iteration: i + 1,
          duration: iterationEnd - iterationStart,
          result: result,
          timestamp: Date.now()
        });
      }

      // End timing
      const endTime = performance.now();
      const endMark = `test_end_${testName}_${Date.now()}`;
      performance.mark(endMark);

      // Memory collection after test
      let memoryAfter = null;
      if (collectMemory && 'performance' in window && 'memory' in performance) {
        memoryAfter = { ...performance.memory };
      }

      // Calculate metrics
      const totalTime = endTime - startTime;
      const averageTime = totalTime / iterations;
      const minTime = Math.min(...results.map(r => r.duration));
      const maxTime = Math.max(...results.map(r => r.duration));

      // Create test result
      const testResult = {
        id: this.generateTestId(testName),
        name: testName,
        iterations,
        totalTime,
        averageTime,
        minTime,
        maxTime,
        results,
        memoryBefore,
        memoryAfter,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      // Add to results and history
      this.testResults.push(testResult);

      this.testHistory.push(testResult);
      if (this.testHistory.length > this.maxHistory) {
        this.testHistory.shift();
      }

      // Clean up performance marks
      performance.clearMarks(startMark);
      performance.clearMarks(endMark);

      return testResult;
    } finally {
      this.isTesting = false;
      this.currentTest = null;
    }
  }

  // Run multiple tests and compare results
  async runSuite(testSuite, options = {}) {
    const { parallel = false } = options;
    const results = [];

    if (parallel) {
      // Run tests in parallel
      const promises = testSuite.map(test => this.runTest(test.name, test.function, test.iterations, test.options));
      results.push(...await Promise.all(promises));
    } else {
      // Run tests sequentially
      for (const test of testSuite) {
        const result = await this.runTest(test.name, test.function, test.iterations, test.options);
        results.push(result);
      }
    }

    return {
      suiteName: 'performance-test-suite',
      timestamp: Date.now(),
      results,
      summary: this.generateSuiteSummary(results)
    };
  }

  // Generate suite summary
  generateSuiteSummary(results) {
    return results.map(result => ({
      name: result.name,
      averageTime: result.averageTime,
      totalTime: result.totalTime,
      iterations: result.iterations,
      status: this.getResultStatus(result)
    }));
  }

  // Get result status based on benchmarks
  getResultStatus(result) {
    if (this.benchmarks[result.name]) {
      const benchmark = this.benchmarks[result.name];
      if (result.averageTime <= benchmark.good) return 'excellent';
      if (result.averageTime <= benchmark.acceptable) return 'good';
      return 'poor';
    }
    return 'unknown';
  }

  // Set benchmark for a test
  setBenchmark(testName, benchmark) {
    this.benchmarks[testName] = {
      good: benchmark.good || benchmark.averageTime * 0.8, // 80% of average is good
      acceptable: benchmark.acceptable || benchmark.averageTime, // Average is acceptable
      poor: benchmark.poor || benchmark.averageTime * 1.5, // 150% of average is poor
      averageTime: benchmark.averageTime
    };
  }

  // Compare current result with baseline
  compareWithBaseline(testName, currentResult, baselineResult) {
    if (!baselineResult) return null;

    return {
      testName,
      current: currentResult.averageTime,
      baseline: baselineResult.averageTime,
      difference: currentResult.averageTime - baselineResult.averageTime,
      percentageChange: ((currentResult.averageTime - baselineResult.averageTime) / baselineResult.averageTime) * 100,
      regression: currentResult.averageTime > baselineResult.averageTime * 1.1, // 10% worse is regression
      improvement: currentResult.averageTime < baselineResult.averageTime * 0.9 // 10% better is improvement
    };
  }

  // Run common performance benchmarks
  async runCommonBenchmarks() {
    const suite = [
      {
        name: 'dom-manipulation',
        function: () => this.testDOMManipulation(),
        iterations: 100
      },
      {
        name: 'string-operations',
        function: () => this.testStringOperations(),
        iterations: 1000
      },
      {
        name: 'math-calculations',
        function: () => this.testMathCalculations(),
        iterations: 10000
      },
      {
        name: 'array-operations',
        function: () => this.testArrayOperations(),
        iterations: 1000
      },
      {
        name: 'object-operations',
        function: () => this.testObjectOperations(),
        iterations: 1000
      }
    ];

    return await this.runSuite(suite);
  }

  // Test DOM manipulation performance
  testDOMManipulation() {
    const container = document.createElement('div');

    // Create and append elements
    for (let i = 0; i < 100; i++) {
      const element = document.createElement('div');
      element.textContent = `Element ${i}`;
      element.style.display = 'none'; // Reduce layout thrashing
      container.appendChild(element);
    }

    // Measure reflow by accessing offsetHeight
    const height = container.offsetHeight;

    // Clean up
    container.remove();

    return height;
  }

  // Test string operations performance
  testStringOperations() {
    let str = '';
    for (let i = 0; i < 1000; i++) {
      str += `test-${i}-`;
    }

    // Test various string operations
    const length = str.length;
    const upper = str.toUpperCase();
    const lower = str.toLowerCase();
    const split = str.split('-');
    const joined = split.join('-');

    return { length, upperLength: upper.length, splitCount: split.length };
  }

  // Test math calculations performance
  testMathCalculations() {
    let result = 0;
    for (let i = 0; i < 10000; i++) {
      result += Math.sin(i) * Math.cos(i) + Math.sqrt(i);
      result = Math.max(0, result % 1000);
    }

    return result;
  }

  // Test array operations performance
  testArrayOperations() {
    const arr = [];
    for (let i = 0; i < 1000; i++) {
      arr.push(i);
    }

    // Test various array operations
    const mapped = arr.map(x => x * 2);
    const filtered = arr.filter(x => x % 2 === 0);
    const reduced = arr.reduce((acc, curr) => acc + curr, 0);
    const sliced = arr.slice(100, 200);

    return { mappedLength: mapped.length, filteredLength: filtered.length, reducedSum: reduced, slicedLength: sliced.length };
  }

  // Test object operations performance
  testObjectOperations() {
    const obj = {};
    for (let i = 0; i < 1000; i++) {
      obj[`key-${i}`] = i;
    }

    // Test various object operations
    const keys = Object.keys(obj);
    const values = Object.values(obj);
    const entries = Object.entries(obj);
    const hasProp = 'key-500' in obj;

    return { keysCount: keys.length, valuesCount: values.length, entriesCount: entries.length, hasProperty: hasProp };
  }

  // Benchmark loading performance
  async benchmarkLoading() {
    const navigation = performance.getEntriesByType('navigation')[0];

    if (!navigation) {
      throw new Error('Navigation timing not available');
    }

    const metrics = {
      dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
      tcpConnection: navigation.connectEnd - navigation.connectStart,
      request: navigation.responseStart - navigation.requestStart,
      response: navigation.responseEnd - navigation.responseStart,
      domProcessing: navigation.domContentLoadedEventEnd - navigation.domLoading,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
      loadComplete: navigation.loadEventEnd - navigation.fetchStart,
      total: navigation.loadEventEnd - navigation.navigationStart
    };

    const result = {
      id: this.generateTestId('loading-performance'),
      name: 'loading-performance',
      metrics,
      timestamp: Date.now(),
      url: window.location.href
    };

    this.testResults.push(result);
    return result;
  }

  // Benchmark rendering performance
  async benchmarkRendering() {
    return await this.runTest('rendering-performance', async () => {
      const startTime = performance.now();

      // Force a reflow
      document.body.offsetHeight;

      // Create a large DOM tree
      const container = document.createElement('div');
      container.style.visibility = 'hidden';

      for (let i = 0; i < 50; i++) {
        const row = document.createElement('div');
        for (let j = 0; j < 20; j++) {
          const cell = document.createElement('span');
          cell.textContent = `${i}-${j}`;
          row.appendChild(cell);
        }
        container.appendChild(row);
      }

      document.body.appendChild(container);

      // Measure layout
      const rect = container.getBoundingClientRect();

      // Clean up
      container.remove();

      return rect.width;
    }, 10);
  }

  // Benchmark memory usage
  async benchmarkMemory() {
    if (!('memory' in performance)) {
      return { error: 'Memory API not available' };
    }

    const memoryBefore = { ...performance.memory };

    // Perform memory-intensive operations
    const largeArray = new Array(1000000).fill(0).map((_, i) => ({ id: i, data: `data-${i}` }));

    const memoryAfter = { ...performance.memory };

    // Clean up
    largeArray.length = 0;

    const result = {
      id: this.generateTestId('memory-benchmark'),
      name: 'memory-benchmark',
      memoryBefore,
      memoryAfter,
      allocated: memoryAfter.usedJSHeapSize - memoryBefore.usedJSHeapSize,
      timestamp: Date.now()
    };

    this.testResults.push(result);
    return result;
  }

  // Generate test ID
  generateTestId(testName) {
    return `${testName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get test results
  getTestResults(testName = null) {
    if (testName) {
      return this.testResults.filter(result => result.name === testName);
    }
    return [...this.testResults];
  }

  // Get recent test results
  getRecentResults(hours = 24) {
    const timeThreshold = Date.now() - (hours * 60 * 60 * 1000);
    return this.testResults.filter(result => result.timestamp >= timeThreshold);
  }

  // Get test history
  getTestHistory() {
    return [...this.testHistory];
  }

  // Get performance summary
  getPerformanceSummary() {
    if (this.testResults.length === 0) {
      return { error: 'No test results available' };
    }

    const summary = {
      totalTests: this.testResults.length,
      testNames: [...new Set(this.testResults.map(r => r.name))],
      averagePerformance: {},
      bestPerformers: {},
      worstPerformers: {}
    };

    // Calculate averages for each test type
    const groupedResults = this.groupResultsByTestName();

    for (const [testName, results] of Object.entries(groupedResults)) {
      const avgTime = results.reduce((sum, r) => sum + r.averageTime, 0) / results.length;
      const minTime = Math.min(...results.map(r => r.averageTime));
      const maxTime = Math.max(...results.map(r => r.averageTime));

      summary.averagePerformance[testName] = {
        average: avgTime,
        min: minTime,
        max: maxTime,
        count: results.length
      };

      // Find best and worst performers
      const best = results.reduce((best, current) =>
        current.averageTime < best.averageTime ? current : best
      );
      const worst = results.reduce((worst, current) =>
        current.averageTime > worst.averageTime ? current : worst
      );

      summary.bestPerformers[testName] = best;
      summary.worstPerformers[testName] = worst;
    }

    return summary;
  }

  // Group results by test name
  groupResultsByTestName() {
    const grouped = {};
    this.testResults.forEach(result => {
      if (!grouped[result.name]) {
        grouped[result.name] = [];
      }
      grouped[result.name].push(result);
    });
    return grouped;
  }

  // Clear test results
  clearResults() {
    this.testResults = [];
  }

  // Clear test history
  clearHistory() {
    this.testHistory = [];
  }

  // Export test results
  exportResults(format = 'json') {
    const data = {
      results: this.testResults,
      history: this.testHistory,
      benchmarks: this.benchmarks,
      summary: this.getPerformanceSummary(),
      exportTimestamp: new Date().toISOString()
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else if (format === 'csv') {
      let csv = 'Test Name,Avg Time,Min Time,Max Time,Total Time,Iterations,Timestamp\n';
      this.testResults.forEach(result => {
        csv += `"${result.name}",${result.averageTime},${result.minTime},${result.maxTime},${result.totalTime},${result.iterations},"${new Date(result.timestamp).toISOString()}"\n`;
      });
      return csv;
    }

    return null;
  }

  // Download test results
  downloadResults(filename = 'performance-tests', format = 'json') {
    const data = this.exportResults(format);
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

  // Compare two test results
  compareResults(result1, result2) {
    if (result1.name !== result2.name) {
      throw new Error('Cannot compare results from different tests');
    }

    return {
      testName: result1.name,
      result1: {
        averageTime: result1.averageTime,
        totalTime: result1.totalTime
      },
      result2: {
        averageTime: result2.averageTime,
        totalTime: result2.totalTime
      },
      difference: {
        averageTime: result2.averageTime - result1.averageTime,
        totalTime: result2.totalTime - result1.totalTime,
        averageTimePercent: ((result2.averageTime - result1.averageTime) / result1.averageTime) * 100,
        totalTimePercent: ((result2.totalTime - result1.totalTime) / result1.totalTime) * 100
      }
    };
  }

  // Run synthetic load test
  async runLoadTest(durationMs = 5000, concurrency = 5) {
    const startTime = Date.now();
    const results = [];

    // Function that simulates work
    const workFunction = async () => {
      const start = performance.now();

      // Simulate CPU-bound work
      let sum = 0;
      for (let i = 0; i < 100000; i++) {
        sum += Math.sqrt(i) * Math.sin(i);
      }

      return {
        duration: performance.now() - start,
        sum
      };
    };

    while (Date.now() - startTime < durationMs) {
      const batchResults = await Promise.all(
        Array(concurrency).fill().map(() => workFunction())
      );
      results.push(...batchResults);

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const totalDuration = Date.now() - startTime;
    const averageDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;

    return {
      testName: 'load-test',
      duration: totalDuration,
      operations: results.length,
      operationsPerSecond: (results.length / totalDuration) * 1000,
      averageDuration,
      results
    };
  }

  // Get current status
  getStatus() {
    return {
      isTesting: this.isTesting,
      currentTest: this.currentTest,
      totalResults: this.testResults.length,
      totalHistory: this.testHistory.length,
      benchmarksCount: Object.keys(this.benchmarks).length
    };
  }
}

// Singleton instance
const performanceTesting = new PerformanceTesting();

// Export the class and instance
export { PerformanceTesting, performanceTesting };

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.PerformanceTesting = performanceTesting;
}