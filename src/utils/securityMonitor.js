// Security monitoring and logging utility
class SecurityMonitor {
  constructor() {
    this.events = [];
    this.maxEvents = 1000; // Keep last 1000 events
    this.suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /data:text\/html/i,
      /vbscript:/i,
      /expression\(/i,
      /eval\(/i,
      /document\./i,
      /window\./i,
      /alert\(/i,
      /confirm\(/i,
      /prompt\(/i
    ];
  }

  // Log a security event
  logEvent(type, details, severity = 'info') {
    const event = {
      timestamp: new Date().toISOString(),
      type,
      details,
      severity,
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: this.getSessionId()
    };

    this.events.push(event);

    // Keep only the last maxEvents
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Security] ${type}:`, details);
    }

    // Send to server in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToServer(event);
    }

    return event;
  }

  // Detect suspicious input
  detectSuspiciousInput(input) {
    if (!input || typeof input !== 'string') return false;

    const suspicious = this.suspiciousPatterns.some(pattern => pattern.test(input));
    
    if (suspicious) {
      this.logEvent('suspicious_input_detected', {
        input: input.substring(0, 100), // Truncate for logging
        patterns: this.suspiciousPatterns.filter(pattern => pattern.test(input)).map(p => p.toString())
      }, 'warning');
    }

    return suspicious;
  }

  // Monitor authentication attempts
  monitorAuthAttempt(email, success, reason = '') {
    const eventType = success ? 'auth_success' : 'auth_failure';
    const severity = success ? 'info' : 'warning';

    this.logEvent(eventType, {
      email: email ? email.substring(0, 3) + '***' : 'unknown',
      reason,
      ip: this.getClientIP()
    }, severity);
  }

  // Monitor rate limiting
  monitorRateLimit(key, action, blocked) {
    this.logEvent('rate_limit', {
      key: key.substring(0, 10) + '***',
      action,
      blocked,
      timestamp: new Date().toISOString()
    }, blocked ? 'warning' : 'info');
  }

  // Monitor session events
  monitorSession(action, details = {}) {
    this.logEvent('session_event', {
      action,
      ...details,
      sessionId: this.getSessionId()
    }, 'info');
  }

  // Monitor file uploads
  monitorFileUpload(file, validationResult) {
    this.logEvent('file_upload', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      validationPassed: validationResult.isValid,
      validationErrors: validationResult.errors || []
    }, validationResult.isValid ? 'info' : 'warning');
  }

  // Monitor API calls
  monitorAPICall(endpoint, method, status, responseTime) {
    const severity = status >= 400 ? 'warning' : 'info';
    
    this.logEvent('api_call', {
      endpoint,
      method,
      status,
      responseTime,
      timestamp: new Date().toISOString()
    }, severity);
  }

  // Monitor DOM changes for XSS attempts
  monitorDOMChanges() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.checkForSuspiciousContent(node);
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return observer;
  }

  // Check for suspicious content in DOM
  checkForSuspiciousContent(element) {
    const suspiciousAttributes = ['onclick', 'onload', 'onerror', 'onmouseover'];
    const suspiciousContent = ['<script', 'javascript:', 'data:text/html'];

    // Check attributes
    suspiciousAttributes.forEach(attr => {
      if (element.hasAttribute(attr)) {
        this.logEvent('suspicious_attribute_detected', {
          attribute: attr,
          value: element.getAttribute(attr),
          element: element.tagName
        }, 'warning');
      }
    });

    // Check content
    if (element.textContent) {
      suspiciousContent.forEach(content => {
        if (element.textContent.toLowerCase().includes(content)) {
          this.logEvent('suspicious_content_detected', {
            content: content,
            element: element.tagName,
            textContent: element.textContent.substring(0, 100)
          }, 'warning');
        }
      });
    }
  }

  // Get session ID
  getSessionId() {
    return sessionStorage.getItem('sessionId') || 'unknown';
  }

  // Get client IP (approximate)
  getClientIP() {
    // This is a placeholder - in a real app, you'd get this from your server
    return 'unknown';
  }

  // Send event to server
  async sendToServer(event) {
    try {
      // In a real implementation, you'd send this to your logging service
      // For now, we'll just store it locally
      const events = JSON.parse(localStorage.getItem('security_events') || '[]');
      events.push(event);
      
      // Keep only last 100 events in localStorage
      if (events.length > 100) {
        events.splice(0, events.length - 100);
      }
      
      localStorage.setItem('security_events', JSON.stringify(events));
    } catch (error) {
      console.error('Failed to send security event to server:', error);
    }
  }

  // Get security report
  getSecurityReport() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const recentEvents = this.events.filter(event => 
      new Date(event.timestamp) > oneHourAgo
    );

    const dailyEvents = this.events.filter(event => 
      new Date(event.timestamp) > oneDayAgo
    );

    const authFailures = dailyEvents.filter(event => 
      event.type === 'auth_failure'
    ).length;

    const suspiciousInputs = dailyEvents.filter(event => 
      event.type === 'suspicious_input_detected'
    ).length;

    const rateLimitBlocks = dailyEvents.filter(event => 
      event.type === 'rate_limit' && event.details.blocked
    ).length;

    return {
      totalEvents: this.events.length,
      recentEvents: recentEvents.length,
      dailyEvents: dailyEvents.length,
      authFailures,
      suspiciousInputs,
      rateLimitBlocks,
      lastEvent: this.events[this.events.length - 1] || null
    };
  }

  // Clear events
  clearEvents() {
    this.events = [];
    localStorage.removeItem('security_events');
  }
}

// Create singleton instance
const securityMonitor = new SecurityMonitor();

export default securityMonitor; 