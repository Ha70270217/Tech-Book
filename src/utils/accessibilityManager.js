// Accessibility manager for WCAG compliance and accessibility features

class AccessibilityManager {
  constructor() {
    this.settings = {
      fontSize: 'medium',
      contrast: 'normal',
      screenReaderSupport: true,
      keyboardNavigation: true,
      focusIndicators: true,
      reducedMotion: false,
      highContrastMode: false
    };

    this.keyboardShortcuts = new Map();
    this.focusableElements = [];
    this.currentFocusIndex = -1;
    this.isKeyboardNavigationActive = false;
    this.accessibleNavigation = true;
    this.accessibilityFeatures = {
      skipLinks: true,
      ariaLabels: true,
      semanticStructure: true,
      alternativeText: true,
      keyboardControls: true,
      screenReaderSupport: true
    };

    this.initAccessibility();
  }

  // Initialize accessibility features
  initAccessibility() {
    // Set up keyboard navigation detection
    this.setupKeyboardNavigationDetection();

    // Set up focus management
    this.setupFocusManagement();

    // Set up reduced motion support
    this.setupReducedMotion();

    // Set up high contrast mode
    this.setupHighContrastMode();

    // Set up skip links
    this.setupSkipLinks();

    // Set up ARIA live regions
    this.setupAriaLiveRegions();

    // Set up semantic structure
    this.setupSemanticStructure();

    // Apply initial accessibility settings
    this.applySettings();
  }

  // Set up keyboard navigation detection
  setupKeyboardNavigationDetection() {
    // Listen for keyboard events to detect keyboard navigation
    document.addEventListener('keydown', (event) => {
      // Mark that keyboard navigation is active
      this.isKeyboardNavigationActive = true;

      // Handle keyboard shortcuts
      if (this.keyboardShortcuts.has(event.key)) {
        event.preventDefault();
        const shortcut = this.keyboardShortcuts.get(event.key);
        shortcut.handler(event);
      }
    });

    // Listen for mouse events to detect mouse navigation
    document.addEventListener('mousedown', () => {
      this.isKeyboardNavigationActive = false;
    });

    // Add class to body when keyboard navigation is active
    document.addEventListener('keydown', () => {
      if (!document.body.classList.contains('keyboard-navigation')) {
        document.body.classList.add('keyboard-navigation');
      }
    });

    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-navigation');
    });
  }

  // Set up focus management
  setupFocusManagement() {
    // Add focus indicators to focusable elements
    document.addEventListener('focusin', (event) => {
      const element = event.target;

      // Add focus indicator class
      if (element.matches('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')) {
        element.classList.add('accessible-focus');
      }
    });

    document.addEventListener('focusout', (event) => {
      const element = event.target;
      element.classList.remove('accessible-focus');
    });

    // Manage focus for dynamic content
    this.setupDynamicFocusManagement();
  }

  // Set up dynamic focus management
  setupDynamicFocusManagement() {
    // Use MutationObserver to detect new focusable elements
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.enhanceAccessibilityForElement(node);

            // Check if the node has focusable children
            const focusableChildren = node.querySelectorAll(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );

            focusableChildren.forEach(child => {
              this.enhanceAccessibilityForElement(child);
            });
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Enhance accessibility for an element
  enhanceAccessibilityForElement(element) {
    // Add ARIA labels where needed
    if (element.tagName === 'BUTTON' && !element.getAttribute('aria-label') && !element.textContent.trim()) {
      element.setAttribute('aria-label', 'Button');
    }

    // Add focus indicators
    if (!element.classList.contains('accessible-element')) {
      element.classList.add('accessible-element');
    }

    // Enhance semantic structure
    this.enhanceSemanticStructure(element);
  }

  // Enhance semantic structure for an element
  enhanceSemanticStructure(element) {
    // Add landmark roles where appropriate
    if (element.tagName === 'HEADER') {
      element.setAttribute('role', 'banner');
    } else if (element.tagName === 'NAV') {
      element.setAttribute('role', 'navigation');
    } else if (element.tagName === 'MAIN') {
      element.setAttribute('role', 'main');
    } else if (element.tagName === 'FOOTER') {
      element.setAttribute('role', 'contentinfo');
    } else if (element.tagName === 'ASIDE') {
      element.setAttribute('role', 'complementary');
    } else if (element.id && element.id.includes('search')) {
      element.setAttribute('role', 'search');
    }

    // Add heading levels if missing
    if (element.tagName === 'DIV' && element.classList.contains('heading') && !/^H[1-6]$/.test(element.tagName)) {
      const headingLevel = this.guessHeadingLevel(element);
      if (headingLevel) {
        element.setAttribute('role', 'heading');
        element.setAttribute('aria-level', headingLevel);
      }
    }
  }

  // Guess heading level based on context
  guessHeadingLevel(element) {
    // Simple heuristic to guess heading level
    const parentHeadings = element.closest('article, section, div')?.querySelectorAll('h1, h2, h3, h4, h5, h6, [role="heading"]');
    if (parentHeadings && parentHeadings.length > 0) {
      const highestLevel = Math.min(...Array.from(parentHeadings).map(h => parseInt(h.tagName[1] || h.getAttribute('aria-level') || '2')));
      return Math.min(highestLevel + 1, 6);
    }
    return 2; // Default to h2
  }

  // Set up reduced motion support
  setupReducedMotion() {
    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.settings.reducedMotion = true;
      this.applyReducedMotion();
    }

    // Listen for changes to reduced motion preference
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      this.settings.reducedMotion = e.matches;
      this.applyReducedMotion();
    });
  }

  // Apply reduced motion settings
  applyReducedMotion() {
    if (this.settings.reducedMotion) {
      // Add class to disable animations
      document.body.classList.add('reduce-motion');

      // Remove animation properties from elements
      const style = document.createElement('style');
      style.textContent = `
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      `;
      document.head.appendChild(style);
    } else {
      document.body.classList.remove('reduce-motion');
    }
  }

  // Set up high contrast mode
  setupHighContrastMode() {
    // Add high contrast styles
    const highContrastStyle = document.createElement('style');
    highContrastStyle.id = 'high-contrast-styles';
    highContrastStyle.textContent = `
      .high-contrast-mode {
        background-color: #000 !important;
        color: #fff !important;
      }
      .high-contrast-mode a,
      .high-contrast-mode a:visited {
        color: #ffff00 !important;
      }
      .high-contrast-mode button,
      .high-contrast-mode input,
      .high-contrast-mode select,
      .high-contrast-mode textarea {
        background-color: #000 !important;
        color: #fff !important;
        border: 2px solid #fff !important;
      }
      .high-contrast-mode .accessible-focus {
        outline: 3px solid #ffff00 !important;
      }
    `;
    document.head.appendChild(highContrastStyle);
  }

  // Toggle high contrast mode
  toggleHighContrastMode() {
    this.settings.highContrastMode = !this.settings.highContrastMode;

    if (this.settings.highContrastMode) {
      document.body.classList.add('high-contrast-mode');
    } else {
      document.body.classList.remove('high-contrast-mode');
    }
  }

  // Set up skip links
  setupSkipLinks() {
    // Create skip links for common landmarks
    const skipLinks = document.createElement('div');
    skipLinks.className = 'skip-links visually-hidden';
    skipLinks.innerHTML = `
      <a href="#main-content" class="skip-link">Skip to main content</a>
      <a href="#navigation" class="skip-link">Skip to navigation</a>
      <a href="#search" class="skip-link">Skip to search</a>
    `;

    document.body.insertBefore(skipLinks, document.body.firstChild);

    // Make skip links visible when focused
    document.querySelectorAll('.skip-link').forEach(link => {
      link.addEventListener('focus', () => {
        link.classList.remove('visually-hidden');
      });

      link.addEventListener('blur', () => {
        link.classList.add('visually-hidden');
      });
    });
  }

  // Set up ARIA live regions
  setupAriaLiveRegions() {
    // Create live region for announcements
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.id = 'aria-live-region';

    document.body.appendChild(liveRegion);
    this.ariaLiveRegion = liveRegion;
  }

  // Announce message to screen readers
  announceToScreenReader(message, politeness = 'polite') {
    if (this.ariaLiveRegion) {
      this.ariaLiveRegion.textContent = '';

      // Create a temporary element to trigger the announcement
      const announcer = document.createElement('div');
      announcer.setAttribute('aria-live', politeness);
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'sr-only';
      announcer.textContent = message;

      this.ariaLiveRegion.appendChild(announcer);

      // Remove after a delay
      setTimeout(() => {
        if (announcer.parentNode) {
          announcer.parentNode.removeChild(announcer);
        }
      }, 1000);
    }
  }

  // Set up semantic structure
  setupSemanticStructure() {
    // Enhance semantic structure of existing content
    this.enhanceExistingContent();
  }

  // Enhance semantic structure of existing content
  enhanceExistingContent() {
    // Add landmark roles to common containers
    const commonContainers = {
      'header': 'banner',
      'nav': 'navigation',
      'main': 'main',
      'footer': 'contentinfo',
      'aside': 'complementary'
    };

    Object.entries(commonContainers).forEach(([tagName, role]) => {
      document.querySelectorAll(tagName).forEach(element => {
        if (!element.getAttribute('role')) {
          element.setAttribute('role', role);
        }
      });
    });

    // Add ARIA labels to buttons without text
    document.querySelectorAll('button').forEach(button => {
      if (!button.textContent.trim() && !button.getAttribute('aria-label')) {
        // Try to infer label from other attributes
        if (button.title) {
          button.setAttribute('aria-label', button.title);
        } else if (button.querySelector('img[alt]')) {
          button.setAttribute('aria-label', button.querySelector('img').alt);
        } else {
          button.setAttribute('aria-label', 'Button');
        }
      }
    });

    // Add ARIA labels to form controls without labels
    document.querySelectorAll('input, select, textarea').forEach(control => {
      if (!this.hasAssociatedLabel(control) && !control.getAttribute('aria-label') && !control.getAttribute('aria-labelledby')) {
        control.setAttribute('aria-label', this.generateAccessibleName(control));
      }
    });
  }

  // Check if an element has an associated label
  hasAssociatedLabel(element) {
    // Check for explicit label
    if (element.id) {
      const associatedLabel = document.querySelector(`label[for="${element.id}"]`);
      if (associatedLabel) return true;
    }

    // Check for implicit label (element inside label)
    const parentLabel = element.closest('label');
    if (parentLabel) return true;

    return false;
  }

  // Generate accessible name for an element
  generateAccessibleName(element) {
    if (element.placeholder) return element.placeholder;
    if (element.title) return element.title;
    if (element.type) return `${element.type} field`;
    return 'Form field';
  }

  // Add keyboard shortcut
  addKeyboardShortcut(key, handler, description) {
    this.keyboardShortcuts.set(key, { handler, description });
  }

  // Remove keyboard shortcut
  removeKeyboardShortcut(key) {
    this.keyboardShortcuts.delete(key);
  }

  // Set font size
  setFontSize(size) {
    if (['small', 'medium', 'large', 'x-large'].includes(size)) {
      this.settings.fontSize = size;
      document.documentElement.style.setProperty('--font-scale', this.getFontScale(size));
    }
  }

  // Get font scale factor
  getFontScale(size) {
    switch (size) {
      case 'small': return '0.875';
      case 'medium': return '1';
      case 'large': return '1.125';
      case 'x-large': return '1.25';
      default: return '1';
    }
  }

  // Set contrast level
  setContrast(level) {
    if (['normal', 'high'].includes(level)) {
      this.settings.contrast = level;

      if (level === 'high') {
        document.body.classList.add('high-contrast');
      } else {
        document.body.classList.remove('high-contrast');
      }
    }
  }

  // Apply current accessibility settings
  applySettings() {
    // Apply font size
    this.setFontSize(this.settings.fontSize);

    // Apply contrast
    this.setContrast(this.settings.contrast);

    // Apply high contrast mode
    if (this.settings.highContrastMode) {
      document.body.classList.add('high-contrast-mode');
    }

    // Apply reduced motion
    if (this.settings.reducedMotion) {
      this.applyReducedMotion();
    }
  }

  // Check accessibility of current page
  checkAccessibility() {
    const issues = [];

    // Check for missing alt attributes on images
    document.querySelectorAll('img:not([alt]), img[alt=""]').forEach(img => {
      issues.push({
        type: 'missing-alt-text',
        element: img,
        message: 'Image missing alt text',
        severity: 'critical'
      });
    });

    // Check for low contrast text
    document.querySelectorAll('body *').forEach(element => {
      if (this.hasLowContrast(element)) {
        issues.push({
          type: 'low-contrast',
          element: element,
          message: 'Text has low contrast ratio',
          severity: 'warning'
        });
      }
    });

    // Check for missing labels on form controls
    document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea').forEach(control => {
      if (!this.hasAssociatedLabel(control)) {
        issues.push({
          type: 'missing-label',
          element: control,
          message: 'Form control missing associated label',
          severity: 'critical'
        });
      }
    });

    // Check for missing ARIA labels on interactive elements
    document.querySelectorAll('button, [role="button"], a[href]').forEach(element => {
      if (!element.getAttribute('aria-label') && !element.getAttribute('aria-labelledby') && !element.textContent.trim()) {
        issues.push({
          type: 'missing-aria-label',
          element: element,
          message: 'Interactive element missing accessible name',
          severity: 'warning'
        });
      }
    });

    // Check for proper heading hierarchy
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6, [role="heading"][aria-level]'));
    let lastLevel = 0;

    headings.forEach(heading => {
      const level = parseInt(heading.tagName[1] || heading.getAttribute('aria-level'));
      if (level > lastLevel + 1) {
        issues.push({
          type: 'heading-hierarchy',
          element: heading,
          message: `Heading level skipped from ${lastLevel} to ${level}`,
          severity: 'warning'
        });
      }
      lastLevel = level;
    });

    return issues;
  }

  // Check if element has low contrast
  hasLowContrast(element) {
    // This is a simplified check - a full implementation would calculate actual contrast ratios
    const computedStyle = window.getComputedStyle(element);
    const color = this.hexToRgb(computedStyle.color);
    const backgroundColor = this.hexToRgb(computedStyle.backgroundColor);

    if (!color || !backgroundColor) return false;

    const contrastRatio = this.calculateContrastRatio(color, backgroundColor);
    const fontSize = parseFloat(computedStyle.fontSize);

    // For normal text, we need 4.5:1 ratio; for large text (>18px bold or >24px), 3:1 is acceptable
    const requiredRatio = (fontSize >= 24 || (fontSize >= 18 && computedStyle.fontWeight >= 'bold')) ? 3 : 4.5;

    return contrastRatio < requiredRatio;
  }

  // Convert hex color to RGB
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  // Calculate contrast ratio between two colors
  calculateContrastRatio(color1, color2) {
    const luminance1 = this.relativeLuminance(color1);
    const luminance2 = this.relativeLuminance(color2);

    const lighter = Math.max(luminance1, luminance2);
    const darker = Math.min(luminance1, luminance2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  // Calculate relative luminance
  relativeLuminance(color) {
    const r = this.normalizeColor(color.r / 255);
    const g = this.normalizeColor(color.g / 255);
    const b = this.normalizeColor(color.b / 255);

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  // Normalize color component for luminance calculation
  normalizeColor(color) {
    return color <= 0.03928 ? color / 12.92 : Math.pow((color + 0.055) / 1.055, 2.4);
  }

  // Fix accessibility issues
  fixAccessibilityIssues(issues) {
    const fixed = [];

    issues.forEach(issue => {
      switch (issue.type) {
        case 'missing-alt-text':
          if (issue.element.src) {
            const filename = issue.element.src.split('/').pop().replace(/\.[^/.]+$/, "");
            issue.element.setAttribute('alt', filename);
            fixed.push(issue);
          }
          break;

        case 'missing-label':
          // Create a label element and associate it with the control
          const label = document.createElement('label');
          const controlId = `accessible-control-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          label.setAttribute('for', controlId);
          label.textContent = this.generateAccessibleName(issue.element);

          issue.element.setAttribute('id', controlId);

          if (issue.element.parentNode) {
            issue.element.parentNode.insertBefore(label, issue.element);
          }

          fixed.push(issue);
          break;

        case 'missing-aria-label':
          if (issue.element.textContent.trim()) {
            issue.element.setAttribute('aria-label', issue.element.textContent.trim());
            fixed.push(issue);
          } else if (issue.element.title) {
            issue.element.setAttribute('aria-label', issue.element.title);
            fixed.push(issue);
          }
          break;

        default:
          break;
      }
    });

    return fixed;
  }

  // Generate accessibility report
  generateReport() {
    const issues = this.checkAccessibility();
    const stats = this.getAccessibilityStats(issues);

    return {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      issues,
      stats,
      recommendations: this.generateRecommendations(issues),
      score: this.calculateAccessibilityScore(issues)
    };
  }

  // Get accessibility statistics
  getAccessibilityStats(issues) {
    const stats = {
      totalIssues: issues.length,
      critical: issues.filter(issue => issue.severity === 'critical').length,
      serious: issues.filter(issue => issue.severity === 'serious').length,
      moderate: issues.filter(issue => issue.severity === 'moderate').length,
      minor: issues.filter(issue => issue.severity === 'minor').length,
      elementsChecked: document.querySelectorAll('*').length,
      pageUrl: window.location.href
    };

    return stats;
  }

  // Generate recommendations based on issues
  generateRecommendations(issues) {
    const recommendations = [];

    const issueCounts = issues.reduce((counts, issue) => {
      counts[issue.type] = (counts[issue.type] || 0) + 1;
      return counts;
    }, {});

    Object.entries(issueCounts).forEach(([type, count]) => {
      switch (type) {
        case 'missing-alt-text':
          recommendations.push({
            type: 'missing-alt-text',
            count,
            recommendation: `Add descriptive alt text to ${count} image${count !== 1 ? 's' : ''}. Alt text should convey the purpose or content of the image.`,
            priority: 'high'
          });
          break;

        case 'low-contrast':
          recommendations.push({
            type: 'low-contrast',
            count,
            recommendation: `Improve contrast for ${count} element${count !== 1 ? 's' : ''}. Ensure text has sufficient contrast against its background (4.5:1 for normal text, 3:1 for large text).`,
            priority: 'high'
          });
          break;

        case 'missing-label':
          recommendations.push({
            type: 'missing-label',
            count,
            recommendation: `Add associated labels to ${count} form control${count !== 1 ? 's' : ''}. Each form control should have an associated label element or aria-label attribute.`,
            priority: 'high'
          });
          break;

        case 'missing-aria-label':
          recommendations.push({
            type: 'missing-aria-label',
            count,
            recommendation: `Add accessible names to ${count} interactive element${count !== 1 ? 's' : ''}. Elements like buttons without text should have aria-label or aria-labelledby attributes.`,
            priority: 'medium'
          });
          break;

        case 'heading-hierarchy':
          recommendations.push({
            type: 'heading-hierarchy',
            count,
            recommendation: `Fix ${count} heading hierarchy issu${count !== 1 ? 'es' : 'e'}. Headings should follow proper sequence (H1, H2, H3, etc.) without skipping levels.`,
            priority: 'medium'
          });
          break;
      }
    });

    return recommendations;
  }

  // Calculate accessibility score (0-100)
  calculateAccessibilityScore(issues) {
    if (issues.length === 0) return 100;

    // Assign weights to different severity levels
    const severityWeights = {
      critical: 10,
      serious: 5,
      moderate: 2,
      minor: 1
    };

    // Calculate total penalty points
    let totalPenalty = 0;
    issues.forEach(issue => {
      totalPenalty += severityWeights[issue.severity] || 1;
    });

    // Calculate score (higher penalty = lower score)
    // Max penalty is arbitrary - adjust as needed
    const maxPenalty = 100;
    const score = Math.max(0, 100 - (totalPenalty / maxPenalty) * 100);

    return Math.round(score);
  }

  // Export accessibility report
  exportReport(format = 'json') {
    const report = this.generateReport();

    if (format === 'json') {
      return JSON.stringify(report, null, 2);
    } else if (format === 'html') {
      return this.generateHtmlReport(report);
    } else if (format === 'csv') {
      return this.generateCsvReport(report);
    }

    return null;
  }

  // Generate HTML report
  generateHtmlReport(report) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Accessibility Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .header { background: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px; }
    .metric-card { border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
    .issues-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    .issues-table th, .issues-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    .issues-table th { background-color: #f2f2f2; }
    .severity-critical { color: #d32f2f; }
    .severity-serious { color: #f57c00; }
    .severity-moderate { color: #fbc02d; }
    .severity-minor { color: #388e3c; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Accessibility Report</h1>
    <p>Generated: ${new Date(report.timestamp).toLocaleString()}</p>
    <p>Page: ${report.url}</p>
  </div>

  <div class="summary">
    <div class="metric-card">
      <h3>Overall Score</h3>
      <p class="score">${report.score}/100</p>
    </div>
    <div class="metric-card">
      <h3>Total Issues</h3>
      <p>${report.stats.totalIssues}</p>
    </div>
    <div class="metric-card">
      <h3>Critical Issues</h3>
      <p class="severity-critical">${report.stats.critical}</p>
    </div>
    <div class="metric-card">
      <h3>Elements Checked</h3>
      <p>${report.stats.elementsChecked}</p>
    </div>
  </div>

  <h2>Issues Found</h2>
  <table class="issues-table">
    <thead>
      <tr>
        <th>Type</th>
        <th>Severity</th>
        <th>Message</th>
        <th>Element</th>
      </tr>
    </thead>
    <tbody>
      ${report.issues.map(issue => `
        <tr>
          <td>${issue.type}</td>
          <td class="severity-${issue.severity}">${issue.severity}</td>
          <td>${issue.message}</td>
          <td>&lt;${issue.element.tagName.toLowerCase()}&gt;</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2>Recommendations</h2>
  <ul>
    ${report.recommendations.map(rec => `<li><strong>${rec.priority.toUpperCase()} PRIORITY:</strong> ${rec.recommendation}</li>`).join('')}
  </ul>
</body>
</html>`;
  }

  // Generate CSV report
  generateCsvReport(report) {
    let csv = 'Type,Severity,Message,Element,Priority\n';
    report.issues.forEach(issue => {
      csv += `"${issue.type}","${issue.severity}","${issue.message.replace(/"/g, '""')}","<${issue.element.tagName.toLowerCase()}>","${this.getPriorityForIssue(issue)}"\n`;
    });
    return csv;
  }

  // Get priority for an issue
  getPriorityForIssue(issue) {
    switch (issue.severity) {
      case 'critical': return 'High';
      case 'serious': return 'High';
      case 'moderate': return 'Medium';
      case 'minor': return 'Low';
      default: return 'Medium';
    }
  }

  // Download accessibility report
  downloadReport(filename = 'accessibility-report', format = 'json') {
    const data = this.exportReport(format);
    if (!data) return;

    const blob = new Blob([data], {
      type: format === 'json' ? 'application/json' :
            format === 'html' ? 'text/html' :
            'text/csv'
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

  // Get accessibility status summary
  getStatusSummary() {
    const issues = this.checkAccessibility();
    const score = this.calculateAccessibilityScore(issues);

    return {
      score,
      status: this.getAccessibilityStatus(score),
      issueCount: issues.length,
      criticalIssues: issues.filter(i => i.severity === 'critical').length,
      lastChecked: new Date().toISOString()
    };
  }

  // Get accessibility status based on score
  getAccessibilityStatus(score) {
    if (score >= 90) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'fair';
    return 'poor';
  }

  // Run automated accessibility tests
  async runAutomatedTests() {
    const results = {
      axe: await this.runAxeTests(),
      custom: this.checkAccessibility(),
      summary: null
    };

    // Combine results
    results.summary = {
      totalIssues: results.axe.violations.length + results.custom.length,
      axeIssues: results.axe.violations.length,
      customIssues: results.custom.length,
      score: this.calculateAccessibilityScore([...results.axe.violations, ...results.custom]),
      timestamp: new Date().toISOString()
    };

    return results;
  }

  // Run axe-core accessibility tests (if available)
  async runAxeTests() {
    // Check if axe-core is available
    if (typeof window !== 'undefined' && window.axe) {
      try {
        const results = await window.axe.run(document);
        return results;
      } catch (error) {
        console.warn('Axe tests failed:', error);
        return { violations: [], passes: [], incomplete: [], url: window.location.href };
      }
    }

    // Return empty results if axe is not available
    return { violations: [], passes: [], incomplete: [], url: window.location.href };
  }

  // Set up accessibility monitoring
  setupMonitoring() {
    // Monitor for new content that might need accessibility checks
    const observer = new MutationObserver((mutations) => {
      let needsCheck = false;

      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          needsCheck = true;
        }
      });

      if (needsCheck) {
        // Debounce the check to avoid excessive processing
        clearTimeout(this.accessibilityCheckTimeout);
        this.accessibilityCheckTimeout = setTimeout(() => {
          const issues = this.checkAccessibility();
          if (issues.length > 0) {
            this.announceToScreenReader(`Accessibility issues detected: ${issues.length} found`);
          }
        }, 1000);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    this.monitoringObserver = observer;
  }

  // Stop accessibility monitoring
  stopMonitoring() {
    if (this.monitoringObserver) {
      this.monitoringObserver.disconnect();
      this.monitoringObserver = null;
    }

    if (this.accessibilityCheckTimeout) {
      clearTimeout(this.accessibilityCheckTimeout);
    }
  }

  // Enhance accessibility for a specific component
  enhanceComponentAccessibility(componentElement) {
    // Add ARIA roles and properties as needed
    this.enhanceSemanticStructure(componentElement);

    // Add keyboard navigation support
    this.addKeyboardNavigationSupport(componentElement);

    // Add focus management
    this.addFocusManagement(componentElement);
  }

  // Add keyboard navigation support to a component
  addKeyboardNavigationSupport(element) {
    // Add tabindex if not already present and element should be focusable
    if (!element.hasAttribute('tabindex') && this.shouldBeFocusable(element)) {
      element.setAttribute('tabindex', '0');
    }

    // Add keyboard event handlers for common patterns
    if (element.classList.contains('carousel') || element.classList.contains('slider')) {
      this.setupCarouselKeyboardNavigation(element);
    } else if (element.classList.contains('modal')) {
      this.setupModalKeyboardNavigation(element);
    } else if (element.classList.contains('menu') || element.classList.contains('dropdown')) {
      this.setupMenuKeyboardNavigation(element);
    }
  }

  // Check if an element should be focusable
  shouldBeFocusable(element) {
    const focusableSelectors = [
      'a[href]',
      'button',
      'input',
      'select',
      'textarea',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable]'
    ];

    return element.matches(focusableSelectors.join(', '));
  }

  // Set up keyboard navigation for carousels
  setupCarouselKeyboardNavigation(carouselElement) {
    carouselElement.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        // Navigate to previous slide
        this.announceToScreenReader('Previous slide');
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        // Navigate to next slide
        this.announceToScreenReader('Next slide');
      } else if (event.key === 'Home') {
        event.preventDefault();
        // Go to first slide
        this.announceToScreenReader('First slide');
      } else if (event.key === 'End') {
        event.preventDefault();
        // Go to last slide
        this.announceToScreenReader('Last slide');
      }
    });
  }

  // Set up keyboard navigation for modals
  setupModalKeyboardNavigation(modalElement) {
    modalElement.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        // Close modal
        this.announceToScreenReader('Closing modal');
      } else if (event.key === 'Tab') {
        // Trap focus within modal
        this.trapFocusWithinModal(modalElement, event);
      }
    });
  }

  // Trap focus within modal
  trapFocusWithinModal(modalElement, event) {
    const focusableElements = modalElement.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  // Set up keyboard navigation for menus
  setupMenuKeyboardNavigation(menuElement) {
    menuElement.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        // Move to next menu item
        this.focusNextMenuItem(menuElement);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        // Move to previous menu item
        this.focusPreviousMenuItem(menuElement);
      } else if (event.key === 'Home') {
        event.preventDefault();
        // Focus first menu item
        this.focusFirstMenuItem(menuElement);
      } else if (event.key === 'End') {
        event.preventDefault();
        // Focus last menu item
        this.focusLastMenuItem(menuElement);
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        // Activate current menu item
        this.activateCurrentMenuItem(menuElement);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        // Close menu
        this.closeMenu(menuElement);
      }
    });
  }

  // Focus next menu item
  focusNextMenuItem(menuElement) {
    const currentItem = document.activeElement;
    const items = menuElement.querySelectorAll('[role="menuitem"]');
    const currentIndex = Array.from(items).indexOf(currentItem);

    if (currentIndex < items.length - 1) {
      items[currentIndex + 1].focus();
    } else {
      items[0].focus(); // Wrap around
    }
  }

  // Focus previous menu item
  focusPreviousMenuItem(menuElement) {
    const currentItem = document.activeElement;
    const items = menuElement.querySelectorAll('[role="menuitem"]');
    const currentIndex = Array.from(items).indexOf(currentItem);

    if (currentIndex > 0) {
      items[currentIndex - 1].focus();
    } else {
      items[items.length - 1].focus(); // Wrap around
    }
  }

  // Focus first menu item
  focusFirstMenuItem(menuElement) {
    const items = menuElement.querySelectorAll('[role="menuitem"]');
    if (items.length > 0) {
      items[0].focus();
    }
  }

  // Focus last menu item
  focusLastMenuItem(menuElement) {
    const items = menuElement.querySelectorAll('[role="menuitem"]');
    if (items.length > 0) {
      items[items.length - 1].focus();
    }
  }

  // Activate current menu item
  activateCurrentMenuItem(menuElement) {
    const currentItem = document.activeElement;
    if (currentItem && currentItem.click) {
      currentItem.click();
    }
  }

  // Close menu
  closeMenu(menuElement) {
    menuElement.style.display = 'none';
    this.announceToScreenReader('Menu closed');
  }

  // Add focus management to a component
  addFocusManagement(element) {
    // Ensure focus stays within component when needed
    element.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        this.handleTabKeyNavigation(element, event);
      }
    });
  }

  // Handle tab key navigation within a component
  handleTabKeyNavigation(componentElement, event) {
    // Check if component has specific focus management needs
    if (componentElement.classList.contains('modal') ||
        componentElement.classList.contains('dialog') ||
        componentElement.classList.contains('popup')) {

      // Trap focus within component
      const focusableElements = componentElement.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }

  // Clean up and remove accessibility enhancements
  destroy() {
    // Stop monitoring
    this.stopMonitoring();

    // Remove event listeners
    if (this.keyboardNavigationListener) {
      document.removeEventListener('keydown', this.keyboardNavigationListener);
    }

    if (this.mouseDetectionListener) {
      document.removeEventListener('mousedown', this.mouseDetectionListener);
    }

    // Clean up DOM modifications
    const skipLinks = document.querySelector('.skip-links');
    if (skipLinks) {
      skipLinks.remove();
    }

    const liveRegion = document.getElementById('aria-live-region');
    if (liveRegion) {
      liveRegion.remove();
    }

    // Remove high contrast styles
    const highContrastStyles = document.getElementById('high-contrast-styles');
    if (highContrastStyles) {
      highContrastStyles.remove();
    }

    // Remove any accessibility classes added
    document.querySelectorAll('.accessible-focus, .accessible-element').forEach(el => {
      el.classList.remove('accessible-focus', 'accessible-element');
    });
  }
}

// Singleton instance
const accessibilityManager = new AccessibilityManager();

// Export the class and instance
export { AccessibilityManager, accessibilityManager };

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.AccessibilityManager = accessibilityManager;
}