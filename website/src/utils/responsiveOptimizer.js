// Responsive design and mobile optimization utility

class ResponsiveOptimizer {
  constructor() {
    this.breakpoints = {
      xs: 0,      // Extra small devices (portrait phones)
      sm: 576,    // Small devices (landscape phones)
      md: 768,    // Medium devices (tablets)
      lg: 992,    // Large devices (desktops)
      xl: 1200,   // Extra large devices (large desktops)
      xxl: 1400   // Extra extra large devices
    };

    this.currentBreakpoint = null;
    this.orientation = 'portrait';
    this.deviceType = 'desktop';
    this.isMobile = false;
    this.isTablet = false;
    this.isDesktop = true;

    this.optimizationSettings = {
      imageOptimization: true,
      touchOptimization: true,
      gestureSupport: true,
      viewportAdjustment: true,
      fontScaling: true,
      touchTargets: true,
      performanceOptimization: true
    };

    this.touchEvents = {
      start: 'touchstart',
      move: 'touchmove',
      end: 'touchend',
      cancel: 'touchcancel'
    };

    // Use pointer events if available, otherwise fall back to touch/mouse
    if (window.PointerEvent) {
      this.touchEvents = {
        start: 'pointerdown',
        move: 'pointermove',
        end: 'pointerup',
        cancel: 'pointercancel'
      };
    } else if ('ontouchstart' in window) {
      this.touchEvents = {
        start: 'touchstart',
        move: 'touchmove',
        end: 'touchend',
        cancel: 'touchcancel'
      };
    } else {
      this.touchEvents = {
        start: 'mousedown',
        move: 'mousemove',
        end: 'mouseup',
        cancel: 'mouseleave'
      };
    }

    this.gestureHandlers = new Map();
    this.touchTargets = new Set();
    this.optimizedElements = new WeakMap();

    this.init();
  }

  // Initialize responsive optimization
  init() {
    this.detectDevice();
    this.setupViewport();
    this.setupOrientationDetection();
    this.setupTouchOptimization();
    this.setupResponsiveImages();
    this.setupFontScaling();
    this.setupTouchTargetOptimization();
    this.setupPerformanceOptimization();
    this.setupBreakpointDetection();
  }

  // Detect device type and characteristics
  detectDevice() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const pixelRatio = window.devicePixelRatio || 1;
    const userAgent = navigator.userAgent;

    // Determine device type based on screen size
    if (width <= this.breakpoints.sm) {
      this.deviceType = 'mobile';
      this.isMobile = true;
      this.isTablet = false;
      this.isDesktop = false;
    } else if (width <= this.breakpoints.md) {
      this.deviceType = 'tablet';
      this.isMobile = false;
      this.isTablet = true;
      this.isDesktop = false;
    } else {
      this.deviceType = 'desktop';
      this.isMobile = false;
      this.isTablet = false;
      this.isDesktop = true;
    }

    // Detect orientation
    this.orientation = width < height ? 'portrait' : 'landscape';

    // Detect touch capability
    this.hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Store device info
    this.deviceInfo = {
      width,
      height,
      pixelRatio,
      userAgent,
      deviceType: this.deviceType,
      orientation: this.orientation,
      hasTouch: this.hasTouch,
      isMobile: this.isMobile,
      isTablet: this.isTablet,
      isDesktop: this.isDesktop
    };
  }

  // Set up viewport optimization
  setupViewport() {
    // Add or update viewport meta tag
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      document.head.appendChild(viewport);
    }

    // Set appropriate viewport based on device
    const viewportContent = this.isMobile
      ? 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes'
      : 'width=device-width, initial-scale=1.0';

    viewport.content = viewportContent;
  }

  // Set up orientation detection
  setupOrientationDetection() {
    // Listen for orientation changes
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.orientation = window.innerWidth < window.innerHeight ? 'portrait' : 'landscape';
        this.applyOrientationChanges();
      }, 100); // Small delay to ensure orientation has changed
    });

    // Listen for resize events for non-mobile devices
    window.addEventListener('resize', this.debounce(() => {
      const newOrientation = window.innerWidth < window.innerHeight ? 'portrait' : 'landscape';
      if (newOrientation !== this.orientation) {
        this.orientation = newOrientation;
        this.applyOrientationChanges();
      }
    }, 250));
  }

  // Apply changes based on orientation
  applyOrientationChanges() {
    document.body.classList.remove('portrait', 'landscape');
    document.body.classList.add(this.orientation);

    // Trigger custom event
    const event = new CustomEvent('orientationchangeoptimized', {
      detail: {
        orientation: this.orientation,
        width: window.innerWidth,
        height: window.innerHeight
      }
    });
    window.dispatchEvent(event);
  }

  // Set up touch optimization
  setupTouchOptimization() {
    if (!this.hasTouch) return;

    // Optimize for touch interactions
    document.body.style.touchAction = 'manipulation';

    // Add touch-friendly styles
    this.addTouchOptimizationStyles();

    // Set up gesture recognition
    this.setupGestureRecognition();
  }

  // Add touch optimization styles
  addTouchOptimizationStyles() {
    const style = document.createElement('style');
    style.id = 'touch-optimization-styles';
    style.textContent = `
      /* Touch-friendly styles */
      .touch-target {
        min-height: 44px;
        min-width: 44px;
        touch-action: manipulation;
      }

      /* Remove tap highlights */
      * {
        -webkit-tap-highlight-color: transparent;
      }

      /* Optimize scrolling */
      body {
        -webkit-overflow-scrolling: touch;
      }

      /* Better focus indicators for touch devices */
      button:focus,
      input:focus,
      select:focus,
      textarea:focus {
        outline: 2px solid #007cba;
        outline-offset: 2px;
      }

      /* Touch-friendly form controls */
      input, select, textarea {
        font-size: 16px; /* Prevent zoom on iOS */
      }
    `;

    document.head.appendChild(style);
  }

  // Set up gesture recognition
  setupGestureRecognition() {
    let startX = 0;
    let startY = 0;
    let startTime = 0;

    const handleStart = (event) => {
      if (event.touches && event.touches.length > 1) return; // Ignore multi-touch

      const touch = event.touches ? event.touches[0] : event;
      startX = touch.clientX;
      startY = touch.clientY;
      startTime = Date.now();
    };

    const handleEnd = (event) => {
      if (event.touches && event.touches.length > 0) return; // Still touching with another finger

      const touch = event.changedTouches ? event.changedTouches[0] : event;
      const endX = touch.clientX;
      const endY = touch.clientY;
      const endTime = Date.now();

      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const deltaTime = endTime - startTime;

      // Calculate swipe
      if (Math.abs(deltaX) > 30 || Math.abs(deltaY) > 30) {
        const direction = this.getSwipeDirection(deltaX, deltaY);
        const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / deltaTime;

        this.handleSwipe(direction, velocity, { deltaX, deltaY, deltaTime });
      }

      // Calculate tap
      if (deltaTime < 300 && Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
        this.handleTap({ x: endX, y: endY });
      }
    };

    document.addEventListener(this.touchEvents.start, handleStart);
    document.addEventListener(this.touchEvents.end, handleEnd);
    document.addEventListener(this.touchEvents.cancel, handleEnd);
  }

  // Get swipe direction
  getSwipeDirection(deltaX, deltaY) {
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return deltaX > 0 ? 'right' : 'left';
    } else {
      return deltaY > 0 ? 'down' : 'up';
    }
  }

  // Handle swipe gesture
  handleSwipe(direction, velocity, details) {
    const event = new CustomEvent('swipe', {
      detail: {
        direction,
        velocity,
        details
      }
    });
    window.dispatchEvent(event);

    // Execute any registered swipe handlers
    if (this.gestureHandlers.has('swipe')) {
      this.gestureHandlers.get('swipe')(event);
    }
  }

  // Handle tap gesture
  handleTap(position) {
    const event = new CustomEvent('tap', {
      detail: position
    });
    window.dispatchEvent(event);

    // Execute any registered tap handlers
    if (this.gestureHandlers.has('tap')) {
      this.gestureHandlers.get('tap')(event);
    }
  }

  // Register gesture handler
  addGestureHandler(gesture, handler) {
    this.gestureHandlers.set(gesture, handler);
  }

  // Remove gesture handler
  removeGestureHandler(gesture) {
    this.gestureHandlers.delete(gesture);
  }

  // Set up responsive image optimization
  setupResponsiveImages() {
    // Optimize images based on screen size and device pixel ratio
    const images = document.querySelectorAll('img[data-src]');

    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            this.loadResponsiveImage(img);
            observer.unobserve(img);
          }
        });
      });

      images.forEach(img => imageObserver.observe(img));
    } else {
      // Fallback for browsers without IntersectionObserver
      images.forEach(img => this.loadResponsiveImage(img));
    }
  }

  // Load responsive image based on device characteristics
  loadResponsiveImage(img) {
    const originalSrc = img.dataset.src;
    const devicePixelRatio = window.devicePixelRatio || 1;
    const screenWidth = window.innerWidth;

    // Determine appropriate image size based on screen width and pixel density
    let optimizedSrc = originalSrc;

    if (screenWidth <= this.breakpoints.sm) {
      // Mobile: use smaller image
      optimizedSrc = this.getOptimalImageSize(originalSrc, 400, devicePixelRatio);
    } else if (screenWidth <= this.breakpoints.md) {
      // Tablet: use medium image
      optimizedSrc = this.getOptimalImageSize(originalSrc, 800, devicePixelRatio);
    } else {
      // Desktop: use larger image
      optimizedSrc = this.getOptimalImageSize(originalSrc, 1200, devicePixelRatio);
    }

    img.src = optimizedSrc;
    img.removeAttribute('data-src');

    // Add loading indicator
    img.classList.add('loading');
    img.addEventListener('load', () => {
      img.classList.remove('loading');
      img.classList.add('loaded');
    });
  }

  // Get optimal image size based on device
  getOptimalImageSize(src, baseWidth, pixelRatio) {
    // This is a simplified implementation
    // In a real app, you'd want to check if optimized versions exist
    const optimalWidth = Math.ceil(baseWidth * pixelRatio);

    // Replace width parameter in URL if it exists
    return src.replace(/(w=)\d+/, `$1${optimalWidth}`)
             .replace(/(width=)\d+/, `$1${optimalWidth}`);
  }

  // Set up font scaling for different devices
  setupFontScaling() {
    // Adjust font sizes based on device type
    const fontSize = this.isMobile ? '16px' : this.isTablet ? '17px' : '18px';
    document.documentElement.style.fontSize = fontSize;

    // Add responsive font classes
    this.addResponsiveFontStyles();
  }

  // Add responsive font styles
  addResponsiveFontStyles() {
    const style = document.createElement('style');
    style.id = 'responsive-font-styles';
    style.textContent = `
      /* Responsive font sizes */
      html {
        font-size: 16px;
      }

      @media (min-width: ${this.breakpoints.sm}px) {
        html {
          font-size: 17px;
        }
      }

      @media (min-width: ${this.breakpoints.md}px) {
        html {
          font-size: 18px;
        }
      }

      @media (min-width: ${this.breakpoints.lg}px) {
        html {
          font-size: 19px;
        }
      }

      /* Responsive heading sizes */
      h1 { font-size: clamp(1.75rem, 4vw, 2.5rem); }
      h2 { font-size: clamp(1.5rem, 3.5vw, 2rem); }
      h3 { font-size: clamp(1.25rem, 3vw, 1.75rem); }
      h4 { font-size: clamp(1.1rem, 2.5vw, 1.5rem); }
      h5 { font-size: clamp(1rem, 2vw, 1.25rem); }
      h6 { font-size: clamp(0.875rem, 1.5vw, 1.1rem); }
    `;

    document.head.appendChild(style);
  }

  // Set up touch target optimization
  setupTouchTargetOptimization() {
    // Ensure touch targets meet minimum size requirements
    const touchTargetObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.optimizeTouchTarget(node);

            // Check for touch targets in added nodes
            const touchTargets = node.querySelectorAll('a, button, input, select, textarea, [role="button"], [role="link"]');
            touchTargets.forEach(target => this.optimizeTouchTarget(target));
          }
        });
      });
    });

    touchTargetObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Optimize existing touch targets
    const existingTargets = document.querySelectorAll('a, button, input, select, textarea, [role="button"], [role="link"]');
    existingTargets.forEach(target => this.optimizeTouchTarget(target));
  }

  // Optimize a single touch target
  optimizeTouchTarget(element) {
    if (this.touchTargets.has(element)) return; // Already optimized

    // Add touch target class if needed
    if (!element.classList.contains('touch-target')) {
      element.classList.add('touch-target');
    }

    // Ensure minimum touch target size
    const computedStyle = window.getComputedStyle(element);
    const minWidth = parseInt(computedStyle.minWidth);
    const minHeight = parseInt(computedStyle.minHeight);
    const width = element.offsetWidth;
    const height = element.offsetHeight;

    // Add CSS to ensure minimum touch target size
    if (width < 44 || height < 44) {
      element.style.minWidth = '44px';
      element.style.minHeight = '44px';

      // Center content if needed
      if (computedStyle.display === 'inline' || computedStyle.display === 'inline-block') {
        element.style.display = 'inline-flex';
        element.style.alignItems = 'center';
        element.style.justifyContent = 'center';
      }
    }

    // Add focus indicator for accessibility
    element.addEventListener('focus', () => {
      element.classList.add('accessible-focus');
    });

    element.addEventListener('blur', () => {
      element.classList.remove('accessible-focus');
    });

    this.touchTargets.add(element);
  }

  // Set up performance optimization for mobile
  setupPerformanceOptimization() {
    // Optimize based on connection type
    if ('connection' in navigator) {
      const connection = navigator.connection;

      if (connection.effectiveType.includes('2g') || connection.effectiveType === 'slow-2g') {
        this.enableLightMode();
      }
    }

    // Optimize based on device memory
    if ('deviceMemory' in navigator) {
      if (navigator.deviceMemory < 4) { // Less than 4GB
        this.enableMemoryOptimizations();
      }
    }

    // Set up resource loading optimization
    this.setupResourceOptimization();
  }

  // Enable light mode for slow connections
  enableLightMode() {
    document.body.classList.add('light-mode');

    // Reduce image quality
    document.querySelectorAll('img').forEach(img => {
      if (img.src) {
        // Add parameter to request lower quality image
        const url = new URL(img.src);
        url.searchParams.set('quality', 'low');
        img.src = url.toString();
      }
    });

    // Disable animations
    const style = document.createElement('style');
    style.textContent = `
      *,
      *::before,
      *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    `;
    document.head.appendChild(style);
  }

  // Enable memory optimizations
  enableMemoryOptimizations() {
    // Reduce the number of preloaded components
    this.maxPreloadComponents = 1;

    // Reduce cache sizes
    this.maxCachedImages = 10;
    this.maxCachedData = 50;
  }

  // Set up resource optimization
  setupResourceOptimization() {
    // Optimize resource loading based on viewport
    this.optimizeResourceLoading();
  }

  // Optimize resource loading
  optimizeResourceLoading() {
    // Defer non-critical CSS
    const nonCriticalCSS = document.querySelectorAll('link[rel="stylesheet"][media="print"], link[rel="preload"][as="style"]');
    nonCriticalCSS.forEach(link => {
      link.media = 'print';
      link.onload = () => {
        link.media = 'all';
      };
    });

    // Preload critical resources
    this.preloadCriticalResources();
  }

  // Preload critical resources
  preloadCriticalResources() {
    const criticalResources = [
      { href: '/css/critical.css', as: 'style' },
      { href: '/fonts/main.woff2', as: 'font', type: 'font/woff2', crossorigin: true },
      { href: '/js/main.js', as: 'script' }
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      Object.entries(resource).forEach(([key, value]) => {
        link[key] = value;
      });
      document.head.appendChild(link);
    });
  }

  // Set up breakpoint detection
  setupBreakpointDetection() {
    this.updateBreakpoint();

    window.addEventListener('resize', this.debounce(() => {
      const oldBreakpoint = this.currentBreakpoint;
      this.updateBreakpoint();

      if (this.currentBreakpoint !== oldBreakpoint) {
        this.handleBreakpointChange(oldBreakpoint, this.currentBreakpoint);
      }
    }, 150));
  }

  // Update current breakpoint
  updateBreakpoint() {
    const width = window.innerWidth;

    if (width < this.breakpoints.sm) {
      this.currentBreakpoint = 'xs';
    } else if (width < this.breakpoints.md) {
      this.currentBreakpoint = 'sm';
    } else if (width < this.breakpoints.lg) {
      this.currentBreakpoint = 'md';
    } else if (width < this.breakpoints.xl) {
      this.currentBreakpoint = 'lg';
    } else if (width < this.breakpoints.xxl) {
      this.currentBreakpoint = 'xl';
    } else {
      this.currentBreakpoint = 'xxl';
    }

    // Update body class
    document.body.classList.remove('breakpoint-xs', 'breakpoint-sm', 'breakpoint-md', 'breakpoint-lg', 'breakpoint-xl', 'breakpoint-xxl');
    document.body.classList.add(`breakpoint-${this.currentBreakpoint}`);
  }

  // Handle breakpoint change
  handleBreakpointChange(oldBreakpoint, newBreakpoint) {
    const event = new CustomEvent('breakpointchange', {
      detail: {
        oldBreakpoint,
        newBreakpoint,
        width: window.innerWidth,
        height: window.innerHeight
      }
    });
    window.dispatchEvent(event);

    // Execute breakpoint-specific optimizations
    this.applyBreakpointOptimizations(newBreakpoint);
  }

  // Apply optimizations for specific breakpoint
  applyBreakpointOptimizations(breakpoint) {
    switch (breakpoint) {
      case 'xs':
      case 'sm':
        // Mobile optimizations
        this.applyMobileOptimizations();
        break;
      case 'md':
        // Tablet optimizations
        this.applyTabletOptimizations();
        break;
      default:
        // Desktop optimizations
        this.applyDesktopOptimizations();
        break;
    }
  }

  // Apply mobile-specific optimizations
  applyMobileOptimizations() {
    // Add mobile-specific classes
    document.body.classList.add('mobile-optimized');

    // Optimize navigation for mobile
    this.optimizeMobileNavigation();

    // Optimize forms for mobile
    this.optimizeMobileForms();
  }

  // Apply tablet-specific optimizations
  applyTabletOptimizations() {
    // Add tablet-specific classes
    document.body.classList.add('tablet-optimized');

    // Optimize for touch but with more space
    this.optimizeTabletLayout();
  }

  // Apply desktop-specific optimizations
  applyDesktopOptimizations() {
    // Remove mobile/tablet classes
    document.body.classList.remove('mobile-optimized', 'tablet-optimized');

    // Optimize for mouse interactions
    this.optimizeDesktopInteractions();
  }

  // Optimize navigation for mobile
  optimizeMobileNavigation() {
    const navs = document.querySelectorAll('nav, .navigation, .navbar');
    navs.forEach(nav => {
      // Add mobile-friendly navigation patterns
      if (!nav.classList.contains('mobile-nav-ready')) {
        nav.classList.add('mobile-nav-ready');

        // Add hamburger menu if needed
        this.addHamburgerMenu(nav);
      }
    });
  }

  // Add hamburger menu to navigation
  addHamburgerMenu(nav) {
    if (nav.querySelector('.hamburger-menu')) return; // Already added

    const hamburger = document.createElement('button');
    hamburger.className = 'hamburger-menu';
    hamburger.innerHTML = `
      <span></span>
      <span></span>
      <span></span>
    `;
    hamburger.setAttribute('aria-label', 'Toggle navigation menu');
    hamburger.setAttribute('aria-expanded', 'false');

    hamburger.addEventListener('click', () => {
      const menu = nav.querySelector('.nav-menu, ul, .menu');
      if (menu) {
        menu.classList.toggle('mobile-menu-open');
        hamburger.setAttribute('aria-expanded', menu.classList.contains('mobile-menu-open'));
      }
    });

    nav.prepend(hamburger);
  }

  // Optimize forms for mobile
  optimizeMobileForms() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      // Add mobile-friendly form patterns
      const inputs = form.querySelectorAll('input, select, textarea');
      inputs.forEach(input => {
        if (!input.classList.contains('mobile-optimized')) {
          input.classList.add('mobile-optimized');

          // Improve input field accessibility
          if (input.type === 'text' || input.type === 'email' || input.type === 'tel' || input.type === 'password') {
            input.setAttribute('autocorrect', 'off');
            input.setAttribute('autocapitalize', 'off');
          }

          if (input.type === 'email') {
            input.setAttribute('inputmode', 'email');
          } else if (input.type === 'tel') {
            input.setAttribute('inputmode', 'tel');
          } else if (input.type === 'number') {
            input.setAttribute('inputmode', 'numeric');
          }
        }
      });
    });
  }

  // Optimize tablet layout
  optimizeTabletLayout() {
    // Adjust grid layouts for tablet screens
    const grids = document.querySelectorAll('.grid, .row, .column');
    grids.forEach(grid => {
      // Add tablet-specific classes
      if (window.innerWidth >= this.breakpoints.md && window.innerWidth < this.breakpoints.lg) {
        grid.classList.add('tablet-layout');
      } else {
        grid.classList.remove('tablet-layout');
      }
    });
  }

  // Optimize desktop interactions
  optimizeDesktopInteractions() {
    // Add hover effects and tooltips for desktop
    const hoverable = document.querySelectorAll('button, .hoverable, [title]');
    hoverable.forEach(element => {
      if (element.title && !element.hasAttribute('aria-label')) {
        element.setAttribute('aria-label', element.title);
      }
    });
  }

  // Debounce function for event handling
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Get current device information
  getDeviceInfo() {
    return { ...this.deviceInfo };
  }

  // Get current breakpoint
  getCurrentBreakpoint() {
    return this.currentBreakpoint;
  }

  // Check if current device matches type
  isDeviceType(type) {
    return this.deviceType === type;
  }

  // Check if mobile
  isMobileDevice() {
    return this.isMobile;
  }

  // Check if tablet
  isTabletDevice() {
    return this.isTablet;
  }

  // Check if desktop
  isDesktopDevice() {
    return this.isDesktop;
  }

  // Optimize a specific element for responsiveness
  optimizeElement(element) {
    if (this.optimizedElements.has(element)) return;

    // Apply responsive classes
    element.classList.add('responsive-element');

    // Optimize based on element type
    if (element.tagName === 'IMG') {
      this.optimizeImageElement(element);
    } else if (element.tagName === 'VIDEO') {
      this.optimizeVideoElement(element);
    } else if (element.tagName === 'CANVAS') {
      this.optimizeCanvasElement(element);
    } else if (element.classList.contains('carousel') || element.classList.contains('slider')) {
      this.optimizeCarouselElement(element);
    }

    this.optimizedElements.set(element, Date.now());
  }

  // Optimize image element
  optimizeImageElement(img) {
    if (!img.dataset.src) {
      img.dataset.src = img.src;
    }
    this.loadResponsiveImage(img);
  }

  // Optimize video element
  optimizeVideoElement(video) {
    // Set responsive attributes
    video.style.width = '100%';
    video.style.height = 'auto';
    video.setAttribute('playsinline', '');

    // Add preload optimization
    if (this.isMobileDevice() && !video.hasAttribute('preload')) {
      video.setAttribute('preload', 'metadata');
    }
  }

  // Optimize canvas element
  optimizeCanvasElement(canvas) {
    // Adjust canvas size based on device pixel ratio for crisp rendering
    const rect = canvas.getBoundingClientRect();
    const devicePixelRatio = window.devicePixelRatio || 1;

    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;

    const ctx = canvas.getContext('2d');
    ctx.scale(devicePixelRatio, devicePixelRatio);
  }

  // Optimize carousel element
  optimizeCarouselElement(carousel) {
    // Add touch/swipe support
    carousel.addEventListener(this.touchEvents.start, (e) => {
      // Store start position for swipe detection
      const touch = e.touches ? e.touches[0] : e;
      carousel.dataset.swipeStartX = touch.clientX;
    });

    carousel.addEventListener(this.touchEvents.move, (e) => {
      if (!carousel.dataset.swipeStartX) return;

      const touch = e.touches ? e.touches[0] : e;
      const startX = parseFloat(carousel.dataset.swipeStartX);
      const currentX = touch.clientX;
      const diffX = currentX - startX;

      // Add visual feedback during swipe
      carousel.style.transform = `translateX(${diffX}px)`;
    });

    carousel.addEventListener(this.touchEvents.end, (e) => {
      if (!carousel.dataset.swipeStartX) return;

      const touch = e.changedTouches ? e.changedTouches[0] : e;
      const startX = parseFloat(carousel.dataset.swipeStartX);
      const currentX = touch.clientX;
      const diffX = currentX - startX;

      // If swipe is significant, trigger navigation
      if (Math.abs(diffX) > 50) {
        if (diffX > 0) {
          // Swipe right - go to previous
          this.triggerCarouselNavigation(carousel, 'prev');
        } else {
          // Swipe left - go to next
          this.triggerCarouselNavigation(carousel, 'next');
        }
      }

      // Reset transform
      carousel.style.transform = '';
      delete carousel.dataset.swipeStartX;
    });
  }

  // Trigger carousel navigation
  triggerCarouselNavigation(carousel, direction) {
    const event = new CustomEvent('carousel-swipe', {
      detail: { direction }
    });
    carousel.dispatchEvent(event);
  }

  // Optimize all elements in a container
  optimizeContainer(container) {
    const elements = container.querySelectorAll('*');
    elements.forEach(element => this.optimizeElement(element));
  }

  // Get responsive utility classes
  getResponsiveClasses() {
    return {
      container: 'container-fluid',
      grid: 'row',
      column: 'col',
      breakpoints: {
        xs: 'col-12',
        sm: 'col-sm-12',
        md: 'col-md-12',
        lg: 'col-lg-12',
        xl: 'col-xl-12'
      }
    };
  }

  // Add responsive utility styles
  addResponsiveUtilityStyles() {
    const style = document.createElement('style');
    style.id = 'responsive-utility-styles';
    style.textContent = `
      /* Responsive utility classes */
      .responsive-container {
        width: 100%;
        padding-right: 15px;
        padding-left: 15px;
        margin-right: auto;
        margin-left: auto;
      }

      @media (min-width: ${this.breakpoints.sm}px) {
        .responsive-container {
          max-width: 540px;
        }
      }

      @media (min-width: ${this.breakpoints.md}px) {
        .responsive-container {
          max-width: 720px;
        }
      }

      @media (min-width: ${this.breakpoints.lg}px) {
        .responsive-container {
          max-width: 960px;
        }
      }

      @media (min-width: ${this.breakpoints.xl}px) {
        .responsive-container {
          max-width: 1140px;
        }
      }

      /* Responsive spacing */
      .mobile-padding {
        padding: 1rem;
      }

      @media (min-width: ${this.breakpoints.md}px) {
        .mobile-padding {
          padding: 2rem;
        }
      }

      /* Hide on mobile */
      .hide-mobile {
        display: block;
      }

      @media (max-width: ${this.breakpoints.md - 1}px) {
        .hide-mobile {
          display: none;
        }
      }

      /* Show only on mobile */
      .show-mobile {
        display: none;
      }

      @media (max-width: ${this.breakpoints.md - 1}px) {
        .show-mobile {
          display: block;
        }
      }
    `;

    document.head.appendChild(style);
  }

  // Clean up and remove optimizations
  destroy() {
    // Remove event listeners
    if (this.orientationListener) {
      window.removeEventListener('orientationchange', this.orientationListener);
    }

    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }

    // Remove styles
    const stylesToRemove = ['touch-optimization-styles', 'responsive-font-styles', 'responsive-utility-styles'];
    stylesToRemove.forEach(id => {
      const style = document.getElementById(id);
      if (style) {
        style.remove();
      }
    });

    // Reset body classes
    document.body.classList.remove(
      'mobile-optimized',
      'tablet-optimized',
      'portrait',
      'landscape',
      'light-mode'
    );

    // Clear any intervals or timeouts
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
    }
  }
}

// Singleton instance
const responsiveOptimizer = new ResponsiveOptimizer();

// Export the class and instance
export { ResponsiveOptimizer, responsiveOptimizer };

// Initialize when DOM is loaded
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    responsiveOptimizer.init();
  });
}