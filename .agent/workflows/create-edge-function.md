---
description: Add a new Edge Function to Supabase
---

# Create Edge Function Workflow

Guide for creating and deploying new Supabase Edge Functions.

## Steps

### 1. Create Function Directory
```bash
cd supabase/functions
mkdir your-function-name
cd your-function-name
```

### 2. Create index.ts

Create `index.ts` with this template:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { withRateLimit } from '../_shared/rateLimiter.ts';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Apply rate limiting
  return await withRateLimit(
    req,
    async (req) => {
      try {
        // Get Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Verify JWT
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
          throw new Error('No authorization header');
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        
        if (authError || !user) {
          throw new Error('Unauthorized');
        }

        // Get request body
        const body = await req.json();

        // Your function logic here
        const result = {
          success: true,
          message: 'Function executed successfully',
          data: body,
        };

        return new Response(
          JSON.stringify(result),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );

      } catch (error) {
        console.error('Function error:', error);
        return new Response(
          JSON.stringify({
            error: error.message || 'Internal server error',
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }
    },
    {
      windowMs: 60 * 1000,  // 1 minute
      maxRequests: 10,       // 10 requests per minute
      keyPrefix: 'your-function-name',
    }
  );
});
```

### 3. Test Locally

```bash
# Start Supabase locally
supabase start

# Serve function
supabase functions serve your-function-name --env-file .env
```

### 4. Test with curl

```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/your-function-name' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"test": "data"}'
```

### 5. Deploy to Supabase

```bash
supabase functions deploy your-function-name
```

### 6. Test Production

```bash
curl -i --location --request POST 'https://YOUR_PROJECT.supabase.co/functions/v1/your-function-name' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"test": "data"}'
```

### 7. Update Frontend

Add function call in appropriate service file:

```javascript
// src/modules/[module]/api/yourService.js
import { supabase } from '../../../supabase';

export const callYourFunction = async (data) => {
  const { data: result, error } = await supabase.functions.invoke(
    'your-function-name',
    {
      body: data,
    }
  );

  if (error) throw error;
  return result;
};
```

## Best Practices

1. **Always use rate limiting** - Prevents abuse
2. **Verify JWT** - Don't trust frontend
3. **Handle CORS** - Required for browser requests
4. **Log errors** - Use console.error for debugging
5. **Return consistent format** - Use { success, data, error }
6. **Set appropriate limits** - Based on function purpose

## Common Rate Limits

- **AI/ML functions**: 5-10 req/min
- **Email/SMS**: 3-5 req/min
- **Data queries**: 20-50 req/min
- **Webhooks**: 100+ req/min

## Troubleshooting

### Function not deploying
```bash
# Check Supabase CLI version
supabase --version

# Update if needed
npm install -g supabase

# Try deploying again
supabase functions deploy your-function-name --no-verify-jwt
```

### CORS errors
- Ensure corsHeaders are in all responses
- Handle OPTIONS requests
- Check allowed origins

### Rate limit errors
- Verify rate_limits table exists
- Check rate limiting migration applied
- Adjust limits if needed

## Testing Checklist

- [ ] Function deploys successfully
- [ ] Rate limiting works (test exceeding limit)
- [ ] JWT verification works
- [ ] Error handling works
- [ ] CORS headers present
- [ ] Frontend integration works
- [ ] Logs visible in Supabase dashboard
