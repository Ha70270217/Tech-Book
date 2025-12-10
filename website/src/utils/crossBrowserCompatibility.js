// Cross-browser compatibility utilities and polyfills

class CrossBrowserCompatibility {
  constructor() {
    this.browserInfo = this.detectBrowser();
    this.features = {};
    this.polyfillsApplied = new Set();
    this.compatibilityIssues = [];
    this.browserSupport = new Map();

    this.polyfills = {
      // ES6+ features
      'Promise': this.polyfillPromise,
      'fetch': this.polyfillFetch,
      'Array.from': this.polyfillArrayFrom,
      'Array.find': this.polyfillArrayFind,
      'Array.includes': this.polyfillArrayIncludes,
      'Object.assign': this.polyfillObjectAssign,
      'String.includes': this.polyfillStringIncludes,
      'String.startsWith': this.polyfillStringStartsWith,
      'String.endsWith': this.polyfillStringEndsWith,
      'Element.classList': this.polyfillClassList,
      'Element.closest': this.polyfillClosest,
      'Element.matches': this.polyfillMatches,
      'CustomEvent': this.polyfillCustomEvent,
      'MutationObserver': this.polyfillMutationObserver,
      'IntersectionObserver': this.polyfillIntersectionObserver,
      'URL': this.polyfillURL,
      'URLSearchParams': this.polyfillURLSearchParams,
      'WeakMap': this.polyfillWeakMap,
      'WeakSet': this.polyfillWeakSet,
      'Map': this.polyfillMap,
      'Set': this.polyfillSet,
      'Symbol': this.polyfillSymbol,
      'Proxy': this.polyfillProxy,
      'Reflect': this.polyfillReflect,
      'Promise.allSettled': this.polyfillPromiseAllSettled,
      'Promise.any': this.polyfillPromiseAny,
      'Array.flat': this.polyfillArrayFlat,
      'Array.flatMap': this.polyfillArrayFlatMap,
      'Object.entries': this.polyfillObjectEntries,
      'Object.values': this.polyfillObjectValues,
      'Object.keys': this.polyfillObjectKeys,
      'Object.fromEntries': this.polyfillObjectFromEntries,
      'String.padStart': this.polyfillStringPadStart,
      'String.padEnd': this.polyfillStringPadEnd,
      'String.trimStart': this.polyfillStringTrimStart,
      'String.trimEnd': this.polyfillStringTrimEnd,
      'Array.flatMap': this.polyfillArrayFlatMap,
      'Array.flat': this.polyfillArrayFlat,
      'Array.at': this.polyfillArrayAt,
      'String.at': this.polyfillStringAt,
      'Object.hasOwn': this.polyfillObjectHasOwn,
      'AggregateError': this.polyfillAggregateError,
      'globalThis': this.polyfillGlobalThis
    };

    this.cssPrefixes = {
      'backdrop-filter': ['-webkit-', '-moz-', '-ms-', '-o-'],
      'filter': ['-webkit-', '-moz-', '-ms-', '-o-'],
      'appearance': ['-webkit-', '-moz-', '-ms-', '-o-'],
      'user-select': ['-webkit-', '-moz-', '-ms-', '-o-'],
      'transform': ['-webkit-', '-moz-', '-ms-', '-o-'],
      'transition': ['-webkit-', '-moz-', '-ms-', '-o-'],
      'animation': ['-webkit-', '-moz-', '-ms-', '-o-'],
      'box-sizing': ['-webkit-', '-moz-', '-ms-', '-o-'],
      'flex': ['-webkit-', '-moz-', '-ms-', '-o-'],
      'grid': ['-webkit-', '-moz-', '-ms-', '-o-'],
      'clip-path': ['-webkit-', '-moz-', '-ms-', '-o-'],
      'mask': ['-webkit-', '-moz-', '-ms-', '-o-'],
      'writing-mode': ['-webkit-', '-moz-', '-ms-', '-o-']
    };

    this.init();
  }

  // Initialize compatibility checks and fixes
  init() {
    this.checkBrowserFeatures();
    this.applyNecessaryPolyfills();
    this.fixBrowserSpecificIssues();
    this.addVendorPrefixes();
    this.setupFeatureDetection();
  }

  // Detect browser and version
  detectBrowser() {
    const userAgent = navigator.userAgent;
    const appVersion = navigator.appVersion;

    // Browser detection
    const browsers = [
      { name: 'Chrome', pattern: /Chrome\/(\d+)/ },
      { name: 'Firefox', pattern: /Firefox\/(\d+)/ },
      { name: 'Safari', pattern: /Version\/(\d+).*Safari/ },
      { name: 'Edge', pattern: /Edg(?:e|A|iOS)\/(\d+)/ },
      { name: 'IE', pattern: /MSIE (\d+)|Trident.*rv:(\d+)/ },
      { name: 'Opera', pattern: /OPR\/(\d+)|Opera\/(\d+)/ }
    ];

    for (const browser of browsers) {
      const match = userAgent.match(browser.pattern);
      if (match) {
        return {
          name: browser.name,
          version: parseInt(match[1] || match[2] || '0'),
          userAgent,
          isSupported: this.isBrowserSupported(browser.name, parseInt(match[1] || match[2] || '0'))
        };
      }
    }

    return {
      name: 'Unknown',
      version: 0,
      userAgent,
      isSupported: false
    };
  }

  // Check if browser is supported
  isBrowserSupported(browserName, version) {
    const supportedBrowsers = {
      Chrome: 60,
      Firefox: 65,
      Safari: 12,
      Edge: 79, // New Chromium-based Edge
      Opera: 50
    };

    if (supportedBrowsers[browserName]) {
      return version >= supportedBrowsers[browserName];
    }

    // IE is never considered supported in modern contexts
    if (browserName === 'IE') {
      return false;
    }

    return true;
  }

  // Check for browser feature support
  checkBrowserFeatures() {
    const featuresToCheck = [
      'Promise',
      'fetch',
      'IntersectionObserver',
      'MutationObserver',
      'ResizeObserver',
      'WebGL',
      'WebAssembly',
      'ServiceWorker',
      'PushManager',
      'Notification',
      'IndexedDB',
      'WebSQL',
      'localStorage',
      'sessionStorage',
      'Geolocation',
      'getUserMedia',
      'canvas',
      'webgl',
      'webaudio',
      'websockets',
      'history',
      'geolocation',
      'indexedDB',
      'webWorkers',
      'fileAPI',
      'dragAndDrop',
      'querySelector',
      'querySelectorAll',
      'classList',
      'dataset',
      'customElements',
      'shadowDOM',
      'template',
      'picture',
      'srcset',
      'sizes',
      'objectFit',
      'objectPosition',
      'flexbox',
      'grid',
      'cssVariables',
      'cssCalc',
      'cssGrid',
      'cssFlexbox',
      'cssTransforms',
      'cssTransitions',
      'cssAnimations',
      'cssFilters',
      'cssBackdropFilter',
      'cssMask',
      'cssClipPath',
      'cssAppearance',
      'cssUserSelect',
      'cssWritingMode'
    ];

    featuresToCheck.forEach(feature => {
      this.features[feature] = this.isFeatureSupported(feature);
    });
  }

  // Check if a specific feature is supported
  isFeatureSupported(feature) {
    switch (feature) {
      case 'Promise':
        return typeof Promise !== 'undefined';
      case 'fetch':
        return typeof fetch !== 'undefined';
      case 'IntersectionObserver':
        return typeof IntersectionObserver !== 'undefined';
      case 'MutationObserver':
        return typeof MutationObserver !== 'undefined';
      case 'ResizeObserver':
        return typeof ResizeObserver !== 'undefined';
      case 'WebGL':
        return !!document.createElement('canvas').getContext('webgl');
      case 'WebAssembly':
        return typeof WebAssembly !== 'undefined';
      case 'ServiceWorker':
        return 'serviceWorker' in navigator;
      case 'PushManager':
        return 'PushManager' in window;
      case 'Notification':
        return 'Notification' in window;
      case 'IndexedDB':
        return 'indexedDB' in window;
      case 'WebSQL':
        return 'openDatabase' in window;
      case 'localStorage':
        try {
          const test = '__test__';
          localStorage.setItem(test, test);
          localStorage.removeItem(test);
          return true;
        } catch (e) {
          return false;
        }
      case 'sessionStorage':
        try {
          const test = '__test__';
          sessionStorage.setItem(test, test);
          sessionStorage.removeItem(test);
          return true;
        } catch (e) {
          return false;
        }
      case 'Geolocation':
        return 'geolocation' in navigator;
      case 'getUserMedia':
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) ||
               !!(navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia);
      case 'canvas':
        return !!document.createElement('canvas').getContext;
      case 'webgl':
        return !!document.createElement('canvas').getContext('webgl');
      case 'webaudio':
        return !!(window.AudioContext || window.webkitAudioContext);
      case 'websockets':
        return 'WebSocket' in window;
      case 'history':
        return !!(window.history && window.history.pushState);
      case 'indexedDB':
        return 'indexedDB' in window;
      case 'webWorkers':
        return 'Worker' in window;
      case 'fileAPI':
        return !!(window.File && window.FileReader && window.FileList && window.Blob);
      case 'dragAndDrop':
        return 'ondragstart' in window && 'ondrop' in window;
      case 'querySelector':
        return 'querySelector' in document;
      case 'querySelectorAll':
        return 'querySelectorAll' in document;
      case 'classList':
        return 'classList' in document.documentElement;
      case 'dataset':
        return 'dataset' in document.documentElement;
      case 'customElements':
        return 'customElements' in window;
      case 'shadowDOM':
        return !!(Element.prototype.attachShadow && document.documentElement.createShadowRoot);
      case 'template':
        return 'content' in document.createElement('template');
      case 'picture':
        return 'HTMLPictureElement' in window;
      case 'srcset':
        return 'srcset' in document.createElement('img');
      case 'sizes':
        return 'sizes' in document.createElement('img');
      case 'objectFit':
        return 'objectFit' in document.documentElement.style;
      case 'objectPosition':
        return 'objectPosition' in document.documentElement.style;
      case 'flexbox':
        return this.testCSSProperty('display', 'flex');
      case 'grid':
        return this.testCSSProperty('display', 'grid');
      case 'cssVariables':
        return this.testCSSVariableSupport();
      case 'cssCalc':
        return this.testCSSFunctionSupport('calc');
      case 'cssGrid':
        return this.testCSSProperty('display', 'grid');
      case 'cssFlexbox':
        return this.testCSSProperty('display', 'flex');
      case 'cssTransforms':
        return this.testCSSProperty('transform', 'rotate(1deg)');
      case 'cssTransitions':
        return this.testCSSProperty('transition', 'all 1s');
      case 'cssAnimations':
        return this.testCSSProperty('animation', 'test 1s');
      case 'cssFilters':
        return this.testCSSProperty('filter', 'blur(1px)');
      case 'cssBackdropFilter':
        return this.testCSSProperty('backdrop-filter', 'blur(1px)');
      case 'cssMask':
        return this.testCSSProperty('mask', 'url(#test)');
      case 'cssClipPath':
        return this.testCSSProperty('clip-path', 'circle(50%)');
      case 'cssAppearance':
        return this.testCSSProperty('appearance', 'none');
      case 'cssUserSelect':
        return this.testCSSProperty('user-select', 'none');
      case 'cssWritingMode':
        return this.testCSSProperty('writing-mode', 'vertical-rl');
      default:
        return false;
    }
  }

  // Test CSS property support
  testCSSProperty(property, value) {
    const element = document.createElement('div');
    const prefixedProperties = [
      property,
      '-webkit-' + property,
      '-moz-' + property,
      '-ms-' + property,
      '-o-' + property
    ];

    for (const prop of prefixedProperties) {
      try {
        element.style.cssText = `${prop}: ${value}`;
        if (element.style.length) {
          return true;
        }
      } catch (e) {
        // Property not supported
      }
    }

    return false;
  }

  // Test CSS variable support
  testCSSVariableSupport() {
    const element = document.createElement('div');
    element.style.setProperty('--test-var', 'red');
    return element.style.getPropertyValue('--test-var') === 'red';
  }

  // Test CSS function support
  testCSSFunctionSupport(functionName) {
    const element = document.createElement('div');
    const testValues = [
      `${functionName}(10px)`,
      `${functionName}(10px, 10px)`,
      `${functionName}(10px + 10px)`
    ];

    for (const value of testValues) {
      try {
        element.style.cssText = `width: ${value}`;
        if (element.style.length) {
          return true;
        }
      } catch (e) {
        // Function not supported
      }
    }

    return false;
  }

  // Apply necessary polyfills based on feature detection
  applyNecessaryPolyfills() {
    for (const [feature, isSupported] of Object.entries(this.features)) {
      if (!isSupported && this.polyfills[feature]) {
        try {
          this.polyfills[feature].call(this);
          this.polyfillsApplied.add(feature);
          console.log(`Applied polyfill for ${feature}`);
        } catch (error) {
          console.error(`Failed to apply polyfill for ${feature}:`, error);
          this.compatibilityIssues.push({
            type: 'polyfill-failure',
            feature,
            error: error.message
          });
        }
      }
    }
  }

  // Fix browser-specific issues
  fixBrowserSpecificIssues() {
    switch (this.browserInfo.name) {
      case 'IE':
        this.fixIEIssues();
        break;
      case 'Safari':
        this.fixSafariIssues();
        break;
      case 'Firefox':
        this.fixFirefoxIssues();
        break;
      case 'Chrome':
        this.fixChromeIssues();
        break;
      case 'Edge':
        if (this.browserInfo.version < 79) {
          this.fixLegacyEdgeIssues();
        } else {
          this.fixModernEdgeIssues();
        }
        break;
      case 'Opera':
        this.fixOperaIssues();
        break;
    }
  }

  // Fix Internet Explorer issues
  fixIEIssues() {
    // Add class for IE-specific styling
    document.documentElement.classList.add('ie', `ie${this.browserInfo.version}`);

    // Fix flexbox issues in IE
    this.fixIEFlexbox();

    // Fix grid issues in IE
    this.fixIEGrid();

    // Add missing CSS properties
    this.addMissingCSSProperties();

    // Fix event issues
    this.fixEventIssues();

    // Add missing DOM methods
    this.addMissingDOMMethods();
  }

  // Fix Safari issues
  fixSafariIssues() {
    document.documentElement.classList.add('safari', `safari${this.browserInfo.version}`);

    // Fix flexbox issues in Safari
    this.fixSafariFlexbox();

    // Fix animation issues
    this.fixSafariAnimation();

    // Fix input issues
    this.fixSafariInput();

    // Fix scroll issues
    this.fixSafariScroll();
  }

  // Fix Firefox issues
  fixFirefoxIssues() {
    document.documentElement.classList.add('firefox', `firefox${this.browserInfo.version}`);

    // Fix flexbox issues in Firefox
    this.fixFirefoxFlexbox();

    // Fix grid issues
    this.fixFirefoxGrid();

    // Fix animation issues
    this.fixFirefoxAnimation();
  }

  // Fix Chrome issues
  fixChromeIssues() {
    document.documentElement.classList.add('chrome', `chrome${this.browserInfo.version}`);

    // Fix any Chrome-specific issues
    this.fixChromeSpecificIssues();
  }

  // Fix legacy Edge issues
  fixLegacyEdgeIssues() {
    document.documentElement.classList.add('edge-legacy', `edge-legacy${this.browserInfo.version}`);

    // Fix flexbox issues in legacy Edge
    this.fixLegacyEdgeFlexbox();

    // Fix grid issues in legacy Edge
    this.fixLegacyEdgeGrid();

    // Fix other legacy Edge issues
    this.fixLegacyEdgeIssues();
  }

  // Fix modern Edge issues
  fixModernEdgeIssues() {
    document.documentElement.classList.add('edge-modern', `edge-modern${this.browserInfo.version}`);

    // Modern Edge is based on Chromium, so mostly compatible
    // Fix any remaining issues
    this.fixModernEdgeIssues();
  }

  // Fix Opera issues
  fixOperaIssues() {
    document.documentElement.classList.add('opera', `opera${this.browserInfo.version}`);

    // Fix Opera-specific issues
    this.fixOperaSpecificIssues();
  }

  // Add vendor prefixes to CSS properties
  addVendorPrefixes() {
    // Add CSS to handle vendor prefixes
    const style = document.createElement('style');
    style.id = 'vendor-prefix-styles';
    style.textContent = this.generateVendorPrefixCSS();
    document.head.appendChild(style);
  }

  // Generate CSS with vendor prefixes
  generateVendorPrefixCSS() {
    let css = '';

    for (const [property, prefixes] of Object.entries(this.cssPrefixes)) {
      css += `/* Vendor prefixes for ${property} */\n`;
      css += `.${property.replace(/-/g, '_')}-supported {\n`;

      prefixes.forEach(prefix => {
        css += `  ${prefix}${property}: inherit;\n`;
      });

      css += `  ${property}: inherit;\n`;
      css += `}\n\n`;
    }

    return css;
  }

  // Set up feature detection
  setupFeatureDetection() {
    // Create a global feature detection object
    window.BrowserFeatures = {
      ...this.features,
      browser: this.browserInfo,
      isSupported: (feature) => this.features[feature] || false,
      getBrowserInfo: () => this.browserInfo,
      getCompatibilityIssues: () => [...this.compatibilityIssues]
    };
  }

  // Polyfill Promise
  polyfillPromise() {
    if (typeof Promise !== 'undefined') return;

    // Simple Promise polyfill implementation
    window.Promise = function(executor) {
      const self = this;
      self.state = 'pending';
      self.value = undefined;
      self.handlers = [];

      function resolve(result) {
        if (self.state !== 'pending') return;
        self.state = 'fulfilled';
        self.value = result;
        self.handlers.forEach(handle);
        self.handlers = [];
      }

      function reject(error) {
        if (self.state !== 'pending') return;
        self.state = 'rejected';
        self.value = error;
        self.handlers.forEach(handle);
        self.handlers = [];
      }

      function handle(handler) {
        if (self.state === 'pending') {
          self.handlers.push(handler);
        } else {
          if (self.state === 'fulfilled' && typeof handler.onFulfilled === 'function') {
            handler.onFulfilled(self.value);
          }
          if (self.state === 'rejected' && typeof handler.onRejected === 'function') {
            handler.onRejected(self.value);
          }
        }
      }

      this.then = function(onFulfilled, onRejected) {
        return new Promise(function(resolve, reject) {
          handle({
            onFulfilled: function(result) {
              try {
                const returnValue = onFulfilled ? onFulfilled(result) : result;
                resolve(returnValue);
              } catch (error) {
                reject(error);
              }
            },
            onRejected: function(error) {
              try {
                const returnValue = onRejected ? onRejected(error) : error;
                resolve(returnValue);
              } catch (error) {
                reject(error);
              }
            }
          });
        });
      };

      this.catch = function(onRejected) {
        return this.then(null, onRejected);
      };

      try {
        executor(resolve, reject);
      } catch (error) {
        reject(error);
      }
    };

    window.Promise.resolve = function(value) {
      return new Promise(function(resolve) {
        resolve(value);
      });
    };

    window.Promise.reject = function(reason) {
      return new Promise(function(resolve, reject) {
        reject(reason);
      });
    };

    window.Promise.all = function(promises) {
      return new Promise(function(resolve, reject) {
        const results = [];
        let completed = 0;

        if (promises.length === 0) {
          resolve(results);
          return;
        }

        promises.forEach(function(promise, index) {
          Promise.resolve(promise).then(function(value) {
            results[index] = value;
            completed++;
            if (completed === promises.length) {
              resolve(results);
            }
          }, function(error) {
            reject(error);
          });
        });
      });
    };

    window.Promise.race = function(promises) {
      return new Promise(function(resolve, reject) {
        promises.forEach(function(promise) {
          Promise.resolve(promise).then(resolve, reject);
        });
      });
    };
  }

  // Polyfill fetch
  polyfillFetch() {
    if (typeof fetch !== 'undefined') return;

    // Simple fetch polyfill using XMLHttpRequest
    window.fetch = function(url, options = {}) {
      return new Promise(function(resolve, reject) {
        const xhr = new XMLHttpRequest();

        xhr.open(options.method || 'GET', url);

        // Set headers
        if (options.headers) {
          for (const [key, value] of Object.entries(options.headers)) {
            xhr.setRequestHeader(key, value);
          }
        }

        // Set response type
        xhr.responseType = options.responseType || 'json';

        xhr.onload = function() {
          const response = {
            ok: xhr.status >= 200 && xhr.status < 300,
            status: xhr.status,
            statusText: xhr.statusText,
            url: url,
            text: function() {
              return Promise.resolve(xhr.responseText);
            },
            json: function() {
              try {
                return Promise.resolve(JSON.parse(xhr.responseText));
              } catch (error) {
                return Promise.reject(error);
              }
            },
            headers: {
              get: function(header) {
                return xhr.getResponseHeader(header);
              }
            }
          };

          if (response.ok) {
            resolve(response);
          } else {
            reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
          }
        };

        xhr.onerror = function() {
          reject(new Error('Network error'));
        };

        xhr.ontimeout = function() {
          reject(new Error('Request timeout'));
        };

        // Set timeout
        if (options.timeout) {
          xhr.timeout = options.timeout;
        }

        // Send request
        xhr.send(options.body || null);
      });
    };
  }

  // Polyfill Array.from
  polyfillArrayFrom() {
    if (Array.from) return;

    Array.from = function(arrayLike /*, mapFn, thisArg */) {
      const mapFn = arguments[1];
      const thisArg = arguments[2];

      if (arrayLike == null) {
        throw new TypeError('Array.from requires an array-like object - not null or undefined');
      }

      const length = parseInt(arrayLike.length) || 0;
      const arr = new Array(length);

      for (let i = 0; i < length; i++) {
        const element = arrayLike[i];
        if (mapFn) {
          arr[i] = typeof thisArg !== 'undefined' ? mapFn.call(thisArg, element, i) : mapFn(element, i);
        } else {
          arr[i] = element;
        }
      }

      return arr;
    };
  }

  // Polyfill Array.find
  polyfillArrayFind() {
    if (Array.prototype.find) return;

    Array.prototype.find = function(predicate) {
      if (this === null) {
        throw new TypeError('Array.prototype.find called on null or undefined');
      }
      if (typeof predicate !== 'function') {
        throw new TypeError('predicate must be a function');
      }

      const list = Object(this);
      const length = parseInt(list.length) || 0;

      for (let i = 0; i < length; i++) {
        if (i in list) {
          const element = list[i];
          if (predicate.call(arguments[1], element, i, list)) {
            return element;
          }
        }
      }

      return undefined;
    };
  }

  // Polyfill Array.includes
  polyfillArrayIncludes() {
    if (Array.prototype.includes) return;

    Array.prototype.includes = function(searchElement /*, fromIndex*/) {
      const fromIndex = arguments[1] || 0;
      const O = Object(this);
      const len = parseInt(O.length) || 0;

      if (len === 0) return false;

      const n = fromIndex || 0;
      let k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

      while (k < len) {
        if (O[k] === searchElement) {
          return true;
        }
        k++;
      }

      return false;
    };
  }

  // Polyfill Object.assign
  polyfillObjectAssign() {
    if (Object.assign) return;

    Object.assign = function(target) {
      if (target == null) {
        throw new TypeError('Cannot convert undefined or null to object');
      }

      const to = Object(target);

      for (let index = 1; index < arguments.length; index++) {
        const nextSource = arguments[index];

        if (nextSource != null) {
          for (const nextKey in nextSource) {
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }

      return to;
    };
  }

  // Polyfill String.includes
  polyfillStringIncludes() {
    if (String.prototype.includes) return;

    String.prototype.includes = function(search, start) {
      if (typeof start !== 'number') {
        start = 0;
      }

      if (start + search.length > this.length) {
        return false;
      } else {
        return this.indexOf(search, start) !== -1;
      }
    };
  }

  // Polyfill String.startsWith
  polyfillStringStartsWith() {
    if (String.prototype.startsWith) return;

    String.prototype.startsWith = function(search, pos) {
      return this.substr(!pos || pos < 0 ? 0 : +pos, search.length) === search;
    };
  }

  // Polyfill String.endsWith
  polyfillStringEndsWith() {
    if (String.prototype.endsWith) return;

    String.prototype.endsWith = function(search, this_len) {
      if (this_len === undefined || this_len > this.length) {
        this_len = this.length;
      }
      return this.substring(this_len - search.length, this_len) === search;
    };
  }

  // Polyfill Element.classList
  polyfillClassList() {
    if (typeof document !== 'undefined' && document.documentElement.classList) return;

    // ClassList polyfill
    function ClassList(element) {
      this.element = element;
    }

    ClassList.prototype = {
      add: function(className) {
        if (!this.contains(className)) {
          const currentClasses = this.element.className.split(' ').filter(c => c !== '');
          currentClasses.push(className);
          this.element.className = currentClasses.join(' ');
        }
      },

      remove: function(className) {
        const currentClasses = this.element.className.split(' ').filter(c => c !== className);
        this.element.className = currentClasses.join(' ');
      },

      toggle: function(className) {
        if (this.contains(className)) {
          this.remove(className);
          return false;
        } else {
          this.add(className);
          return true;
        }
      },

      contains: function(className) {
        return this.element.className.split(' ').indexOf(className) !== -1;
      }
    };

    // Add classList property to all elements
    if (typeof document !== 'undefined') {
      Object.defineProperty(Element.prototype, 'classList', {
        get: function() {
          return new ClassList(this);
        }
      });
    }
  }

  // Polyfill Element.closest
  polyfillClosest() {
    if (Element.prototype.closest) return;

    Element.prototype.closest = function(selector) {
      let element = this;

      while (element && element.nodeType === 1) {
        if (element.matches(selector)) {
          return element;
        }
        element = element.parentNode;
      }

      return null;
    };
  }

  // Polyfill Element.matches
  polyfillMatches() {
    if (Element.prototype.matches) return;

    Element.prototype.matches =
      Element.prototype.matchesSelector ||
      Element.prototype.mozMatchesSelector ||
      Element.prototype.msMatchesSelector ||
      Element.prototype.oMatchesSelector ||
      Element.prototype.webkitMatchesSelector ||
      function(s) {
        const matches = (this.document || this.ownerDocument).querySelectorAll(s);
        let i = matches.length;

        while (--i >= 0 && matches.item(i) !== this) {}

        return i > -1;
      };
  }

  // Polyfill CustomEvent
  polyfillCustomEvent() {
    if (typeof window !== 'undefined' && window.CustomEvent) return;

    function CustomEvent(event, params) {
      params = params || { bubbles: false, cancelable: false, detail: undefined };
      const evt = document.createEvent('CustomEvent');
      evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
      return evt;
    }

    CustomEvent.prototype = window.Event.prototype;

    if (typeof window !== 'undefined') {
      window.CustomEvent = CustomEvent;
    }
  }

  // Polyfill MutationObserver
  polyfillMutationObserver() {
    if (typeof MutationObserver !== 'undefined') return;

    // Simple MutationObserver polyfill
    if (typeof window !== 'undefined') {
      window.MutationObserver = window.MutationObserver || window.WebKitMutationObserver || function(callback) {
        this.callback = callback;
      };

      window.MutationObserver.prototype.observe = function(element, options) {
        // Simple implementation - just call callback on DOM changes
        const self = this;
        const oldInnerHTML = element.innerHTML;

        this.interval = setInterval(function() {
          if (element.innerHTML !== oldInnerHTML) {
            self.callback([{
              type: 'childList',
              target: element,
              addedNodes: [],
              removedNodes: [],
              previousSibling: null,
              nextSibling: null
            }]);
          }
        }, 100);
      };

      window.MutationObserver.prototype.disconnect = function() {
        if (this.interval) {
          clearInterval(this.interval);
        }
      };
    }
  }

  // Polyfill IntersectionObserver
  polyfillIntersectionObserver() {
    if (typeof IntersectionObserver !== 'undefined') return;

    // Simple IntersectionObserver polyfill
    if (typeof window !== 'undefined') {
      window.IntersectionObserver = function(callback, options) {
        this.callback = callback;
        this.options = options || { threshold: 0 };
      };

      window.IntersectionObserver.prototype.observe = function(element) {
        // Simple implementation - just check if element is in viewport
        const self = this;
        this.interval = setInterval(function() {
          const rect = element.getBoundingClientRect();
          const isVisible = rect.top < window.innerHeight && rect.bottom >= 0;

          if (isVisible) {
            self.callback([{
              isIntersecting: true,
              target: element,
              intersectionRatio: 1,
              boundingClientRect: rect,
              rootBounds: { top: 0, right: window.innerWidth, bottom: window.innerHeight, left: 0, width: window.innerWidth, height: window.innerHeight }
            }]);
          }
        }, 100);
      };

      window.IntersectionObserver.prototype.disconnect = function() {
        if (this.interval) {
          clearInterval(this.interval);
        }
      };
    }
  }

  // Polyfill URL
  polyfillURL() {
    if (typeof URL !== 'undefined') return;

    // Simple URL polyfill
    if (typeof window !== 'undefined') {
      window.URL = function(url, base) {
        const parser = document.createElement('a');
        if (base) {
          parser.href = base;
          parser.href = url; // This resolves the URL
        } else {
          parser.href = url;
        }

        this.href = parser.href;
        this.protocol = parser.protocol;
        this.host = parser.host;
        this.hostname = parser.hostname;
        this.port = parser.port;
        this.pathname = parser.pathname;
        this.search = parser.search;
        this.hash = parser.hash;
        this.origin = parser.origin || (parser.protocol + '//' + parser.host);
      };

      window.URL.createObjectURL = function(blob) {
        return (window.webkitURL || window.URL).createObjectURL.call(this, blob);
      };

      window.URL.revokeObjectURL = function(url) {
        return (window.webkitURL || window.URL).revokeObjectURL.call(this, url);
      };
    }
  }

  // Polyfill URLSearchParams
  polyfillURLSearchParams() {
    if (typeof URLSearchParams !== 'undefined') return;

    // Simple URLSearchParams polyfill
    window.URLSearchParams = function(init) {
      this.params = {};

      if (typeof init === 'string') {
        if (init.charAt(0) === '?') {
          init = init.substring(1);
        }
        const pairs = init.split('&');
        for (const pair of pairs) {
          if (pair === '') continue;
          const [key, value] = pair.split('=');
          this.params[decodeURIComponent(key)] = decodeURIComponent(value || '');
        }
      } else if (init instanceof URLSearchParams) {
        for (const [key, value] of init.entries()) {
          this.params[key] = value;
        }
      }

      this.append = function(name, value) {
        this.params[name] = value;
      };

      this.delete = function(name) {
        delete this.params[name];
      };

      this.get = function(name) {
        return this.params[name];
      };

      this.getAll = function(name) {
        return [this.params[name]].filter(val => val !== undefined);
      };

      this.has = function(name) {
        return this.params.hasOwnProperty(name);
      };

      this.set = function(name, value) {
        this.params[name] = value;
      };

      this.toString = function() {
        return Object.keys(this.params)
          .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(this.params[key]))
          .join('&');
      };

      this.entries = function* () {
        for (const key in this.params) {
          if (this.params.hasOwnProperty(key)) {
            yield [key, this.params[key]];
          }
        }
      };

      this.forEach = function(callback) {
        for (const [key, value] of this.entries()) {
          callback(value, key, this);
        }
      };
    };
  }

  // Polyfill WeakMap
  polyfillWeakMap() {
    if (typeof WeakMap !== 'undefined') return;

    // Simple WeakMap polyfill
    window.WeakMap = function() {
      const keys = [];
      const values = [];

      this.get = function(key) {
        const index = keys.indexOf(key);
        return index !== -1 ? values[index] : undefined;
      };

      this.set = function(key, value) {
        const index = keys.indexOf(key);
        if (index !== -1) {
          values[index] = value;
        } else {
          keys.push(key);
          values.push(value);
        }
        return this;
      };

      this.has = function(key) {
        return keys.indexOf(key) !== -1;
      };

      this.delete = function(key) {
        const index = keys.indexOf(key);
        if (index !== -1) {
          keys.splice(index, 1);
          values.splice(index, 1);
          return true;
        }
        return false;
      };
    };
  }

  // Add other polyfills as needed...

  // Fix IE flexbox issues
  fixIEFlexbox() {
    // Add CSS to fix IE flexbox issues
    const ieFlexFixes = document.createElement('style');
    ieFlexFixes.textContent = `
      /* IE Flexbox fixes */
      .flex-container {
        display: -ms-flexbox;
        display: flex;
      }

      .flex-item {
        -ms-flex: 1;
        flex: 1;
      }

      .flex-row {
        -ms-flex-direction: row;
        flex-direction: row;
      }

      .flex-column {
        -ms-flex-direction: column;
        flex-direction: column;
      }

      .justify-center {
        -ms-flex-pack: center;
        justify-content: center;
      }

      .align-center {
        -ms-flex-align: center;
        align-items: center;
      }
    `;
    document.head.appendChild(ieFlexFixes);
  }

  // Fix Safari flexbox issues
  fixSafariFlexbox() {
    // Add CSS to fix Safari flexbox issues
    const safariFlexFixes = document.createElement('style');
    safariFlexFixes.textContent = `
      /* Safari Flexbox fixes */
      .flex-item {
        -webkit-flex-shrink: 1;
        flex-shrink: 1;
      }

      .flex-container {
        -webkit-flex-wrap: wrap;
        flex-wrap: wrap;
      }
    `;
    document.head.appendChild(safariFlexFixes);
  }

  // Fix Firefox flexbox issues
  fixFirefoxFlexbox() {
    // Add CSS to fix Firefox flexbox issues
    const firefoxFlexFixes = document.createElement('style');
    firefoxFlexFixes.textContent = `
      /* Firefox Flexbox fixes */
      .flex-item {
        -moz-flex-shrink: 1;
        flex-shrink: 1;
      }
    `;
    document.head.appendChild(firefoxFlexFixes);
  }

  // Fix legacy Edge flexbox issues
  fixLegacyEdgeFlexbox() {
    // Add CSS to fix legacy Edge flexbox issues
    const edgeFlexFixes = document.createElement('style');
    edgeFlexFixes.textContent = `
      /* Legacy Edge Flexbox fixes */
      .flex-container {
        -ms-display: flexbox;
        display: -ms-flexbox;
        display: flex;
      }

      .flex-item {
        -ms-flex: 1 1 auto;
        flex: 1 1 auto;
      }
    `;
    document.head.appendChild(edgeFlexFixes);
  }

  // Add missing CSS properties for older browsers
  addMissingCSSProperties() {
    // Add CSS with vendor prefixes for older browsers
    const vendorPrefixes = document.createElement('style');
    vendorPrefixes.textContent = `
      /* Vendor prefixes for older browsers */
      .transform {
        -webkit-transform: var(--transform-value);
        -moz-transform: var(--transform-value);
        -ms-transform: var(--transform-value);
        -o-transform: var(--transform-value);
        transform: var(--transform-value);
      }

      .transition {
        -webkit-transition: var(--transition-value);
        -moz-transition: var(--transition-value);
        -o-transition: var(--transition-value);
        transition: var(--transition-value);
      }

      .animation {
        -webkit-animation: var(--animation-value);
        -moz-animation: var(--animation-value);
        -o-animation: var(--animation-value);
        animation: var(--animation-value);
      }

      .box-sizing {
        -webkit-box-sizing: var(--box-sizing-value);
        -moz-box-sizing: var(--box-sizing-value);
        box-sizing: var(--box-sizing-value);
      }

      .user-select {
        -webkit-user-select: var(--user-select-value);
        -moz-user-select: var(--user-select-value);
        -ms-user-select: var(--user-select-value);
        user-select: var(--user-select-value);
      }
    `;
    document.head.appendChild(vendorPrefixes);
  }

  // Fix event issues in older browsers
  fixEventIssues() {
    // Ensure event methods exist
    if (!Event.prototype.preventDefault) {
      Event.prototype.preventDefault = function() {
        this.returnValue = false;
      };
    }

    if (!Event.prototype.stopPropagation) {
      Event.prototype.stopPropagation = function() {
        this.cancelBubble = true;
      };
    }

    // Add event listener for older IE
    if (!Element.prototype.addEventListener) {
      Element.prototype.addEventListener = function(event, handler) {
        const self = this;
        this.attachEvent('on' + event, function() {
          handler.call(self);
        });
      };

      Element.prototype.removeEventListener = function(event, handler) {
        this.detachEvent('on' + event, handler);
      };
    }
  }

  // Add missing DOM methods
  addMissingDOMMethods() {
    // Add querySelector/querySelectorAll for older browsers if needed
    if (!document.querySelector) {
      document.querySelector = function(selector) {
        const els = document.getElementsByTagName('*');
        for (let i = 0; i < els.length; i++) {
          if (els[i].matches && els[i].matches(selector)) {
            return els[i];
          }
        }
        return null;
      };
    }

    if (!document.querySelectorAll) {
      document.querySelectorAll = function(selector) {
        const els = document.getElementsByTagName('*');
        const result = [];
        for (let i = 0; i < els.length; i++) {
          if (els[i].matches && els[i].matches(selector)) {
            result.push(els[i]);
          }
        }
        return result;
      };
    }
  }

  // Fix Safari-specific issues
  fixSafariSpecificIssues() {
    // Fix for Safari's 3D transform issues
    const safari3DFix = document.createElement('style');
    safari3DFix.textContent = `
      /* Safari 3D Transform fixes */
      .transform-3d {
        -webkit-transform-style: preserve-3d;
        transform-style: preserve-3d;
      }

      /* Fix for Safari's animation issues */
      .animated {
        -webkit-backface-visibility: hidden;
        backface-visibility: hidden;
      }
    `;
    document.head.appendChild(safari3DFix);
  }

  // Fix Firefox-specific issues
  fixFirefoxSpecificIssues() {
    // Fix for Firefox's flexbox issues
    const firefoxFlexFix = document.createElement('style');
    firefoxFlexFix.textContent = `
      /* Firefox flexbox fixes */
      .flex-fix {
        min-height: 0;
        min-width: 0;
      }
    `;
    document.head.appendChild(firefoxFlexFix);
  }

  // Fix Chrome-specific issues
  fixChromeSpecificIssues() {
    // Chrome-specific fixes if needed
    // Currently none needed as Chrome is generally well-supported
  }

  // Fix legacy Edge-specific issues
  fixLegacyEdgeSpecificIssues() {
    // Fix for legacy Edge's grid issues
    const legacyEdgeGridFix = document.createElement('style');
    legacyEdgeGridFix.textContent = `
      /* Legacy Edge grid fixes */
      .grid-container {
        display: -ms-grid;
        display: grid;
      }
    `;
    document.head.appendChild(legacyEdgeGridFix);
  }

  // Fix Opera-specific issues
  fixOperaSpecificIssues() {
    // Opera-specific fixes if needed
    // Currently none needed as Opera is based on Chromium
  }

  // Get browser compatibility report
  getCompatibilityReport() {
    return {
      browser: this.browserInfo,
      features: { ...this.features },
      polyfillsApplied: [...this.polyfillsApplied],
      compatibilityIssues: [...this.compatibilityIssues],
      timestamp: new Date().toISOString()
    };
  }

  // Export compatibility report
  exportCompatibilityReport(format = 'json') {
    const report = this.getCompatibilityReport();

    if (format === 'json') {
      return JSON.stringify(report, null, 2);
    } else if (format === 'csv') {
      let csv = 'Feature,Supported,Polyfill Applied\n';
      for (const [feature, isSupported] of Object.entries(this.features)) {
        const polyfillApplied = this.polyfillsApplied.has(feature) ? 'Yes' : 'No';
        csv += `"${feature}","${isSupported ? 'Yes' : 'No'}","${polyfillApplied}"\n`;
      }
      return csv;
    }

    return null;
  }

  // Download compatibility report
  downloadCompatibilityReport(filename = 'compatibility-report', format = 'json') {
    const data = this.exportCompatibilityReport(format);
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

  // Check for specific compatibility issues
  checkCompatibilityIssues() {
    const issues = [];

    // Check for missing polyfills
    for (const [feature, isSupported] of Object.entries(this.features)) {
      if (!isSupported && !this.polyfillsApplied.has(feature)) {
        issues.push({
          type: 'missing-polyfill',
          feature,
          severity: 'warning',
          message: `Feature ${feature} is not supported and no polyfill was applied`
        });
      }
    }

    // Check for browser-specific issues
    if (this.browserInfo.name === 'IE') {
      issues.push({
        type: 'browser-support',
        feature: 'ie-support',
        severity: 'critical',
        message: `Internet Explorer ${this.browserInfo.version} is not fully supported`
      });
    }

    // Add to main issues list
    this.compatibilityIssues.push(...issues);

    return issues;
  }

  // Get recommended fixes for compatibility issues
  getRecommendedFixes() {
    const fixes = [];
    const issues = this.checkCompatibilityIssues();

    for (const issue of issues) {
      switch (issue.type) {
        case 'missing-polyfill':
          fixes.push({
            issue: issue.feature,
            fix: `Apply polyfill for ${issue.feature}`,
            priority: 'high'
          });
          break;
        case 'browser-support':
          fixes.push({
            issue: issue.feature,
            fix: 'Recommend upgrading to a modern browser',
            priority: 'critical'
          });
          break;
        default:
          fixes.push({
            issue: issue.feature,
            fix: 'Investigate compatibility issue',
            priority: 'medium'
          });
      }
    }

    return fixes;
  }

  // Apply recommended fixes
  async applyRecommendedFixes() {
    const fixes = this.getRecommendedFixes();
    const results = [];

    for (const fix of fixes) {
      try {
        if (fix.issue.startsWith('missing-polyfill')) {
          const feature = fix.issue.replace('missing-polyfill-', '');
          if (this.polyfills[feature]) {
            this.polyfills[feature].call(this);
            results.push({ fix: fix.issue, success: true, message: `Applied polyfill for ${feature}` });
          }
        }
      } catch (error) {
        results.push({ fix: fix.issue, success: false, message: error.message });
      }
    }

    return results;
  }

  // Clean up and remove compatibility fixes
  destroy() {
    // Remove any added styles
    const stylesToRemove = ['vendor-prefix-styles', 'ie-flex-fixes', 'safari-flex-fixes', 'firefox-flex-fixes', 'edge-flex-fixes'];
    stylesToRemove.forEach(id => {
      const style = document.getElementById(id);
      if (style) {
        style.remove();
      }
    });

    // Clean up any intervals or timeouts
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
    }

    // Remove global feature detection object
    delete window.BrowserFeatures;
  }
}

// Singleton instance
const crossBrowserCompatibility = new CrossBrowserCompatibility();

// Export the class and instance
export { CrossBrowserCompatibility, crossBrowserCompatibility };

// Initialize when DOM is loaded
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    crossBrowserCompatibility.init();
  });
}