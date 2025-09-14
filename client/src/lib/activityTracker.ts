import { apiRequest } from './queryClient';

// Activity event types
export type ActivityEventType = 
  | 'page_view'
  | 'product_view'
  | 'add_to_cart'
  | 'cart_update'
  | 'checkout_started'
  | 'purchase_completed'
  | 'admin_ui'
  | 'search'
  | 'filter_applied';

// Activity event data structure
export interface ActivityEvent {
  type: ActivityEventType;
  productId?: string;
  orderId?: string;
  path?: string;
  referrer?: string;
  metadata?: Record<string, any>;
}

// Session management
const SESSION_STORAGE_KEY = 'activity_session_id';
const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

// Rate limiting for client-side
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_EVENTS_PER_WINDOW = 50;
const eventCounts = new Map<string, { count: number; resetTime: number }>();

// Debouncing for similar events
const debouncedEvents = new Map<string, NodeJS.Timeout>();
const DEBOUNCE_DELAY = 300; // 300ms

class ActivityTracker {
  private sessionId: string;
  private isTracking: boolean = true;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
  }

  /**
   * Get or create a session ID
   */
  private getOrCreateSessionId(): string {
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const session = JSON.parse(stored);
        const now = Date.now();
        
        // Check if session is still valid
        if (session.expires > now) {
          // Extend session
          session.expires = now + SESSION_DURATION;
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
          return session.id;
        }
      }
    } catch (error) {
      console.warn('Failed to read session from localStorage:', error);
    }

    // Create new session
    const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const session = {
      id: newSessionId,
      expires: Date.now() + SESSION_DURATION,
      created: Date.now()
    };

    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch (error) {
      console.warn('Failed to save session to localStorage:', error);
    }

    return newSessionId;
  }

  /**
   * Check client-side rate limit
   */
  private checkRateLimit(): boolean {
    const now = Date.now();
    const key = 'client_rate_limit';
    const record = eventCounts.get(key);

    if (!record || now > record.resetTime) {
      eventCounts.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
      return true;
    }

    if (record.count >= MAX_EVENTS_PER_WINDOW) {
      return false;
    }

    record.count++;
    return true;
  }

  /**
   * Generate a debounce key for an event
   */
  private getDebounceKey(event: ActivityEvent): string {
    return `${event.type}-${event.productId || ''}-${event.path || ''}`;
  }

  /**
   * Track an activity event
   */
  public async track(event: ActivityEvent): Promise<void> {
    if (!this.isTracking) {
      return;
    }

    // Check rate limit
    if (!this.checkRateLimit()) {
      console.warn('Activity tracking rate limit exceeded');
      return;
    }

    try {
      // Prepare event data
      const eventData = {
        type: event.type,
        productId: event.productId || null,
        orderId: event.orderId || null,
        path: event.path || window.location.pathname,
        referrer: event.referrer || document.referrer,
        metadata: {
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          ...event.metadata
        }
      };

      // Send to backend with session ID header
      await apiRequest('POST', '/api/activity/events', eventData, {
        'x-session-id': this.sessionId
      });

    } catch (error) {
      // Silently fail - don't break user experience
      console.warn('Failed to track activity event:', error);
    }
  }

  /**
   * Track with debouncing to prevent spam
   */
  public trackDebounced(event: ActivityEvent, delay: number = DEBOUNCE_DELAY): void {
    const debounceKey = this.getDebounceKey(event);
    
    // Clear existing timeout
    const existingTimeout = debouncedEvents.get(debounceKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      this.track(event);
      debouncedEvents.delete(debounceKey);
    }, delay);

    debouncedEvents.set(debounceKey, timeout);
  }

  /**
   * Track page view
   */
  public trackPageView(path?: string, metadata?: Record<string, any>): void {
    this.track({
      type: 'page_view',
      path: path || window.location.pathname,
      metadata: {
        title: document.title,
        ...metadata
      }
    });
  }

  /**
   * Track product view
   */
  public trackProductView(productId: string, metadata?: Record<string, any>): void {
    this.track({
      type: 'product_view',
      productId,
      metadata: {
        productSlug: metadata?.productSlug,
        productName: metadata?.productName,
        categoryId: metadata?.categoryId,
        price: metadata?.price,
        ...metadata
      }
    });
  }

  /**
   * Track add to cart
   */
  public trackAddToCart(productId: string, quantity: number = 1, metadata?: Record<string, any>): void {
    this.track({
      type: 'add_to_cart',
      productId,
      metadata: {
        quantity,
        productName: metadata?.productName,
        price: metadata?.price,
        ...metadata
      }
    });
  }

  /**
   * Track cart update
   */
  public trackCartUpdate(productId: string, oldQuantity: number, newQuantity: number, metadata?: Record<string, any>): void {
    this.track({
      type: 'cart_update',
      productId,
      metadata: {
        oldQuantity,
        newQuantity,
        action: newQuantity > oldQuantity ? 'increase' : newQuantity < oldQuantity ? 'decrease' : 'remove',
        ...metadata
      }
    });
  }

  /**
   * Track checkout started
   */
  public trackCheckoutStarted(metadata?: Record<string, any>): void {
    this.track({
      type: 'checkout_started',
      metadata: {
        cartValue: metadata?.cartValue,
        itemCount: metadata?.itemCount,
        ...metadata
      }
    });
  }

  /**
   * Track purchase completed
   */
  public trackPurchaseCompleted(orderId: string, metadata?: Record<string, any>): void {
    this.track({
      type: 'purchase_completed',
      orderId,
      metadata: {
        orderValue: metadata?.orderValue,
        itemCount: metadata?.itemCount,
        paymentMethod: metadata?.paymentMethod,
        ...metadata
      }
    });
  }

  /**
   * Track admin UI usage
   */
  public trackAdminUI(metadata?: Record<string, any>): void {
    this.track({
      type: 'admin_ui',
      metadata: {
        page: window.location.pathname,
        action: metadata?.action,
        tab: metadata?.tab,
        ...metadata
      }
    });
  }

  /**
   * Track search
   */
  public trackSearch(query: string, metadata?: Record<string, any>): void {
    this.trackDebounced({
      type: 'search',
      metadata: {
        query,
        resultCount: metadata?.resultCount,
        filters: metadata?.filters,
        ...metadata
      }
    }, 1000); // Longer debounce for search
  }

  /**
   * Track filter applied
   */
  public trackFilterApplied(filterType: string, filterValue: string, metadata?: Record<string, any>): void {
    this.trackDebounced({
      type: 'filter_applied',
      metadata: {
        filterType,
        filterValue,
        resultCount: metadata?.resultCount,
        ...metadata
      }
    });
  }

  /**
   * Enable/disable tracking
   */
  public setTracking(enabled: boolean): void {
    this.isTracking = enabled;
  }

  /**
   * Get current session ID
   */
  public getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Refresh session (extend expiry)
   */
  public refreshSession(): void {
    this.sessionId = this.getOrCreateSessionId();
  }
}

// Create global instance
export const activityTracker = new ActivityTracker();

// Auto-track page views on navigation
let lastPath = window.location.pathname;

const trackPageViewOnNavigation = () => {
  const currentPath = window.location.pathname;
  if (currentPath !== lastPath) {
    lastPath = currentPath;
    activityTracker.trackPageView();
  }
};

// Set up page view tracking
if (typeof window !== 'undefined') {
  // Track initial page view
  activityTracker.trackPageView();

  // Listen for navigation changes (for SPA routing)
  window.addEventListener('popstate', trackPageViewOnNavigation);
  
  // Override pushState and replaceState to catch programmatic navigation
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  history.pushState = function(...args) {
    originalPushState.apply(history, args);
    setTimeout(trackPageViewOnNavigation, 0);
  };
  
  history.replaceState = function(...args) {
    originalReplaceState.apply(history, args);
    setTimeout(trackPageViewOnNavigation, 0);
  };
}

export default activityTracker;