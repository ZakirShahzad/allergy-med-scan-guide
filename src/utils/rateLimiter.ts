interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  
  // Default limits: 10 calls per minute for most functions
  private defaultLimit = 10;
  private windowMs = 60 * 1000; // 1 minute
  
  // Special limits for specific functions
  private functionLimits: Record<string, number> = {
    'check-subscription': 5, // Only 5 subscription checks per minute
    'analyze-medication': 20, // Allow more for medication scanning
    'create-checkout': 3, // Limit checkout attempts
    'cancel-subscription': 2, // Very limited cancellation attempts
    'customer-portal': 2, // Limited portal access
  };

  canExecute(functionName: string): boolean {
    const now = Date.now();
    const key = functionName;
    const limit = this.functionLimits[functionName] || this.defaultLimit;
    
    // Get or create entry
    let entry = this.limits.get(key);
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + this.windowMs
      };
      this.limits.set(key, entry);
    }
    
    // Check if within limit
    if (entry.count >= limit) {
      console.warn(`Rate limit exceeded for ${functionName}. Limit: ${limit} calls per minute.`);
      return false;
    }
    
    // Increment counter
    entry.count++;
    this.limits.set(key, entry);
    
    return true;
  }

  getRemainingCalls(functionName: string): number {
    const now = Date.now();
    const key = functionName;
    const limit = this.functionLimits[functionName] || this.defaultLimit;
    
    const entry = this.limits.get(key);
    if (!entry || now > entry.resetTime) {
      return limit;
    }
    
    return Math.max(0, limit - entry.count);
  }

  getResetTime(functionName: string): number {
    const entry = this.limits.get(functionName);
    return entry ? entry.resetTime : Date.now();
  }
}

export const rateLimiter = new RateLimiter();