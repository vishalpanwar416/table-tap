// Example: AI Advisor with Rate Limiting
// This shows how to implement rate limiting in an Edge Function

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { withRateLimit } from '../_shared/rateLimiter.ts';

serve(async (req) => {
    // Apply rate limiting: 10 requests per minute
    return await withRateLimit(
        req,
        async (req) => {
            // Your existing function logic here
            const { query, restaurantId } = await req.json();

            // ... rest of your AI advisor logic ...

            return new Response(
                JSON.stringify({ success: true, data: result }),
                { headers: { 'Content-Type': 'application/json' } }
            );
        },
        {
            windowMs: 60 * 1000,  // 1 minute
            maxRequests: 10,       // 10 requests per minute
            keyPrefix: 'ai-advisor',
        }
    );
});
