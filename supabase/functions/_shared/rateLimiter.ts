// Rate Limiting Utility for Supabase Edge Functions
// 
// This module provides rate limiting functionality using Supabase database
// to track and limit requests per user/IP address.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Rate Limiter Configuration
 */
export interface RateLimitConfig {
    windowMs: number;      // Time window in milliseconds
    maxRequests: number;   // Maximum requests per window
    keyPrefix?: string;    // Prefix for rate limit keys
    skipSuccessfulRequests?: boolean;  // Don't count successful requests
    skipFailedRequests?: boolean;      // Don't count failed requests
}

/**
 * Rate Limiter Class
 */
export class RateLimiter {
    private supabase;
    private config: RateLimitConfig;

    constructor(supabaseUrl: string, supabaseKey: string, config: RateLimitConfig) {
        this.supabase = createClient(supabaseUrl, supabaseKey);
        this.config = {
            keyPrefix: 'ratelimit',
            skipSuccessfulRequests: false,
            skipFailedRequests: false,
            ...config,
        };
    }

    /**
     * Check if request should be rate limited
     * @param identifier - User ID, IP address, or other unique identifier
     * @returns Object with allowed status and retry information
     */
    async checkLimit(identifier: string): Promise<{
        allowed: boolean;
        remaining: number;
        resetTime: number;
        retryAfter?: number;
    }> {
        const key = `${this.config.keyPrefix}:${identifier}`;
        const now = Date.now();
        const windowStart = now - this.config.windowMs;

        try {
            // Get or create rate limit record
            const { data: existing, error: fetchError } = await this.supabase
                .from('rate_limits')
                .select('*')
                .eq('key', key)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
                console.error('Rate limit fetch error:', fetchError);
                // Fail open - allow request if we can't check rate limit
                return {
                    allowed: true,
                    remaining: this.config.maxRequests,
                    resetTime: now + this.config.windowMs,
                };
            }

            // Clean up old requests
            if (existing) {
                const validRequests = existing.requests.filter(
                    (timestamp: number) => timestamp > windowStart
                );

                // Check if limit exceeded
                if (validRequests.length >= this.config.maxRequests) {
                    const oldestRequest = Math.min(...validRequests);
                    const resetTime = oldestRequest + this.config.windowMs;
                    const retryAfter = Math.ceil((resetTime - now) / 1000);

                    return {
                        allowed: false,
                        remaining: 0,
                        resetTime,
                        retryAfter,
                    };
                }

                // Update with new request
                const newRequests = [...validRequests, now];
                await this.supabase
                    .from('rate_limits')
                    .update({
                        requests: newRequests,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('key', key);

                return {
                    allowed: true,
                    remaining: this.config.maxRequests - newRequests.length,
                    resetTime: now + this.config.windowMs,
                };
            } else {
                // Create new rate limit record
                await this.supabase
                    .from('rate_limits')
                    .insert({
                        key,
                        requests: [now],
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    });

                return {
                    allowed: true,
                    remaining: this.config.maxRequests - 1,
                    resetTime: now + this.config.windowMs,
                };
            }
        } catch (error) {
            console.error('Rate limit error:', error);
            // Fail open - allow request if error occurs
            return {
                allowed: true,
                remaining: this.config.maxRequests,
                resetTime: now + this.config.windowMs,
            };
        }
    }

    /**
     * Reset rate limit for a specific identifier
     */
    async reset(identifier: string): Promise<void> {
        const key = `${this.config.keyPrefix}:${identifier}`;
        await this.supabase
            .from('rate_limits')
            .delete()
            .eq('key', key);
    }

    /**
     * Clean up expired rate limit records
     */
    async cleanup(): Promise<void> {
        const cutoff = new Date(Date.now() - this.config.windowMs).toISOString();
        await this.supabase
            .from('rate_limits')
            .delete()
            .lt('updated_at', cutoff);
    }
}

/**
 * Helper function to get client identifier from request
 */
export function getClientIdentifier(req: Request): string {
    // Try to get user ID from JWT
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
        try {
            const token = authHeader.replace('Bearer ', '');
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.sub) {
                return `user:${payload.sub}`;
            }
        } catch (e) {
            // Invalid token, fall through to IP
        }
    }

    // Fall back to IP address
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip') || 'unknown';
    return `ip:${ip}`;
}

/**
 * Middleware function to apply rate limiting to Edge Function
 */
export async function withRateLimit(
    req: Request,
    handler: (req: Request) => Promise<Response>,
    config: RateLimitConfig
): Promise<Response> {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const rateLimiter = new RateLimiter(supabaseUrl, supabaseKey, config);
    const identifier = getClientIdentifier(req);

    const { allowed, remaining, resetTime, retryAfter } = await rateLimiter.checkLimit(identifier);

    if (!allowed) {
        return new Response(
            JSON.stringify({
                error: 'Too many requests',
                message: 'Rate limit exceeded. Please try again later.',
                retryAfter,
            }),
            {
                status: 429,
                headers: {
                    'Content-Type': 'application/json',
                    'X-RateLimit-Limit': config.maxRequests.toString(),
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': resetTime.toString(),
                    'Retry-After': retryAfter!.toString(),
                },
            }
        );
    }

    // Add rate limit headers to response
    const response = await handler(req);
    const headers = new Headers(response.headers);
    headers.set('X-RateLimit-Limit', config.maxRequests.toString());
    headers.set('X-RateLimit-Remaining', remaining.toString());
    headers.set('X-RateLimit-Reset', resetTime.toString());

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
    });
}
