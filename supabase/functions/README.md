# Supabase Edge Functions - Giornale Cesaris

This directory contains Supabase Edge Functions for the Giornale Scolastico Cesaris project.

## Functions

### 1. send-newsletter-confirmation

Sends a confirmation email when a user subscribes to the newsletter using Resend API.

**Endpoint**: `/functions/v1/send-newsletter-confirmation`

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Confirmation email sent successfully",
  "id": "resend-email-id"
}
```

## Deployment

### Prerequisites

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
supabase link --project-ref tepxvijiamuaszvyzeze
```

### Deploy Functions

Deploy all functions:
```bash
supabase functions deploy
```

Deploy a specific function:
```bash
supabase functions deploy send-newsletter-confirmation
```

### Set Environment Variables

Set the Resend API key as a secret:
```bash
supabase secrets set RESEND_API_KEY=your_resend_api_key_here
```

To get your Resend API key:
1. Go to https://resend.com/
2. Sign up or login
3. Go to API Keys section
4. Create a new API key
5. Copy the key and set it as a secret

### Test the Function

Test locally:
```bash
supabase functions serve send-newsletter-confirmation
```

Test with curl:
```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/send-newsletter-confirmation' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"email":"test@cesaris.edu.it"}'
```

Test in production:
```bash
curl -i --location --request POST 'https://tepxvijiamuaszvyzeze.supabase.co/functions/v1/send-newsletter-confirmation' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"email":"test@cesaris.edu.it"}'
```

## Configuration Steps

### 1. Setup Resend Account

1. Go to https://resend.com/ and sign up
2. Verify your domain (cesaris.edu.it) or use resend.dev for testing
3. Create an API key
4. Set the API key in Supabase:
   ```bash
   supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxx
   ```

### 2. Configure Email Sender

In the Edge Function code, update the `from` field:
```typescript
from: 'Giornale Cesaris <newsletter@cesaris.edu.it>'
```

If you haven't verified your domain yet, use Resend's test domain:
```typescript
from: 'onboarding@resend.dev'
```

### 3. Update Frontend Code

The frontend (`js/main.js`) is already configured to call this function:

```javascript
// Call Edge Function to send confirmation email
const { data, error } = await supabaseClient.functions.invoke('send-newsletter-confirmation', {
  body: { email: email }
});
```

Currently it's commented out and logs a message. Uncomment it after deploying the function.

## Monitoring

View function logs:
```bash
supabase functions logs send-newsletter-confirmation
```

View function logs in real-time:
```bash
supabase functions logs send-newsletter-confirmation --follow
```

## Troubleshooting

### Error: RESEND_API_KEY not configured

Make sure you've set the secret:
```bash
supabase secrets set RESEND_API_KEY=your_key_here
```

Verify it's set:
```bash
supabase secrets list
```

### Error: Domain not verified

If using your own domain (cesaris.edu.it), you need to:
1. Add DNS records in your domain provider
2. Verify domain in Resend dashboard
3. Wait for verification (can take a few minutes)

For testing, use `onboarding@resend.dev` as the sender.

### Error: CORS

The function already includes CORS headers. If you still have issues:
1. Check that the frontend is calling the correct URL
2. Verify the Authorization header is included
3. Check browser console for specific CORS errors

## Cost

Resend Free Tier:
- 3,000 emails per month
- 100 emails per day

Sufficient for a school newsletter. Monitor usage in Resend dashboard.

## Security

- ✅ API key stored as Supabase secret (not in code)
- ✅ CORS configured to allow only necessary origins
- ✅ Email validation before sending
- ✅ Rate limiting via Supabase (default: 100 requests/min)

## Next Steps

1. Deploy the function to Supabase
2. Set the RESEND_API_KEY secret
3. Test the function with a test email
4. Update the `from` email address if needed
5. Uncomment the function call in `js/main.js`
6. Test newsletter subscription on the website

## Additional Resources

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Resend Docs](https://resend.com/docs)
- [Deno Deploy](https://deno.com/deploy/docs)
