# Newsletter CORS Error - Fix Guide

## Problem
The newsletter subscription is failing with a CORS error:
```
Access to fetch at 'https://tepxvijiamuaszvyzeze.supabase.co/functions/v1/send-newsletter-confirmation' from origin 'https://ilgiornalescolastico.it' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: It does not have HTTP ok status.
```

## Root Cause
The Supabase Edge Function `send-newsletter-confirmation` is either:
1. Not deployed
2. Not properly configured
3. Returning an error before reaching the CORS handler

## Solution Steps

### Step 1: Verify Edge Function is Deployed

```bash
# Login to Supabase CLI
supabase login

# Link to your project
supabase link --project-ref tepxvijiamuaszvyzeze

# Check if function exists
supabase functions list

# Deploy the function
cd supabase/functions/send-newsletter-confirmation
supabase functions deploy send-newsletter-confirmation
```

### Step 2: Set Environment Variables

The function requires the `RESEND_API_KEY` environment variable:

```bash
# Get your Resend API key from https://resend.com/api-keys
# Set the secret in Supabase
supabase secrets set RESEND_API_KEY=re_your_actual_key_here
```

### Step 3: Verify Deployment

After deploying, test the function:

```bash
# Test with curl
curl -X POST https://tepxvijiamuaszvyzeze.supabase.co/functions/v1/send-newsletter-confirmation \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -d '{"email":"test@example.com"}'
```

### Step 4: Check Function Logs

If still failing, check the logs:

```bash
supabase functions logs send-newsletter-confirmation
```

## Alternative: Use Database-Only Solution (Temporary Fix)

If you can't deploy Edge Functions immediately, you can temporarily disable email sending:

### Option A: Disable Email Sending

In `js/main.js`, comment out the email sending part:

```javascript
// Temporary: Skip email sending
async function sendNewsletterConfirmation(email) {
    console.log('Email sending skipped (Edge Function not deployed)');
    return { success: true };
}
```

### Option B: Use Client-Side Email Service

Alternatively, use a client-side service like EmailJS:

1. Sign up at https://www.emailjs.com/
2. Create an email template
3. Replace the Edge Function call with EmailJS

```javascript
async function sendNewsletterConfirmation(email) {
    try {
        await emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', {
            to_email: email,
            to_name: email.split('@')[0]
        });
        return { success: true };
    } catch (error) {
        console.error('EmailJS error:', error);
        return { success: false, error: error.message };
    }
}
```

## Verify It Works

After deploying:

1. Open browser console (F12)
2. Go to your website homepage
3. Subscribe to newsletter
4. Check Network tab - should see:
   - OPTIONS request → 200 OK
   - POST request → 200 OK
5. Check email inbox for confirmation

## Common Issues

### Issue 1: "RESEND_API_KEY not configured"
**Solution**: Set the environment variable (Step 2 above)

### Issue 2: "Failed to send a request to the Edge Function"
**Solution**: Function not deployed (Step 1 above)

### Issue 3: "Email not received"
**Solution**: 
- Check Resend dashboard for delivery status
- Verify sender email is verified in Resend
- Check spam folder

### Issue 4: CORS still failing after deployment
**Solution**:
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh page (Ctrl+Shift+R)
- Wait 1-2 minutes for DNS propagation

## Current Edge Function Configuration

The function is correctly configured with:
- ✅ CORS headers for all origins (`*`)
- ✅ Proper OPTIONS preflight handling
- ✅ Error responses include CORS headers
- ✅ Returns proper status codes

**File**: `supabase/functions/send-newsletter-confirmation/index.ts`

## Quick Deployment Script

Save this as `deploy-newsletter-function.sh`:

```bash
#!/bin/bash

# Deploy newsletter Edge Function
echo "Deploying newsletter Edge Function..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Supabase CLI not found. Install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Deploy function
cd supabase/functions/send-newsletter-confirmation
supabase functions deploy send-newsletter-confirmation

# Check if RESEND_API_KEY is set
echo ""
echo "Don't forget to set your RESEND_API_KEY:"
echo "supabase secrets set RESEND_API_KEY=your_key_here"
echo ""
echo "Get your Resend API key from: https://resend.com/api-keys"
```

Make executable: `chmod +x deploy-newsletter-function.sh`

Run: `./deploy-newsletter-function.sh`

## Contact

If issues persist after following these steps, check:
1. Supabase project status (https://status.supabase.com/)
2. Resend API status (https://resend.com/status)
3. Your Supabase project logs in the dashboard

---

**Status**: Function code is correct. Issue is deployment-related, not code-related.
