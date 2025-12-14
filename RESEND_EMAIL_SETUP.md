# Resend Email API Setup Guide

This guide explains how to configure the Resend API for sending candidacy notification emails.

## Prerequisites

1. Supabase project set up
2. Resend account (https://resend.com)
3. Verified domain (optional, but recommended for production)

## Step 1: Create Resend Account

1. Go to https://resend.com
2. Sign up for a free account
3. Verify your email address

## Step 2: Get API Key

1. Log in to Resend dashboard
2. Navigate to **API Keys** section
3. Click **Create API Key**
4. Give it a name (e.g., "Giornale Cesaris Candidacy")
5. Copy the API key (starts with `re_...`)

⚠️ **Important**: Save this key securely. You won't be able to see it again!

## Step 3: Configure Supabase Environment Variables

You need to add the Resend API key to your Supabase project:

### Option A: Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Set the environment variable
supabase secrets set RESEND_API_KEY=re_your_api_key_here
```

### Option B: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Settings** > **Edge Functions**
3. Scroll to **Secrets**
4. Add a new secret:
   - Name: `RESEND_API_KEY`
   - Value: Your Resend API key (e.g., `re_123abc...`)
5. Click **Save**

## Step 4: Deploy the Edge Function

Deploy the `send-candidacy-email` function to Supabase:

```bash
# From your project root
cd /path/to/ilGiornaleScolastico2.0

# Deploy the function
supabase functions deploy send-candidacy-email

# Verify deployment
supabase functions list
```

## Step 5: Test the Email Function

You can test the email sending from the Supabase dashboard or using curl:

### Using curl:

```bash
curl -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-candidacy-email' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "candidatureId": "test-123",
    "email": "student@cesaris.edu.it",
    "fullName": "Mario Rossi",
    "studentClass": "4A",
    "motivation": "Voglio diventare reporter perché...",
    "experience": "Ho scritto per il giornale della mia scuola precedente",
    "toEmail": "mohamed.mashaal@cesaris.edu.it"
  }'
```

### Expected Response:

```json
{
  "success": true,
  "emailId": "49a3999c-0ce1-4ea6-ab68-afcd6dc2e794"
}
```

## Step 6: Verify Email Domain (Production Only)

For production use, you should verify your domain:

1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `giornalecesaris.it`)
4. Follow the DNS configuration instructions
5. Wait for verification (usually 24-48 hours)

### Update the "from" Address

Once your domain is verified, update the edge function:

```typescript
// In supabase/functions/send-candidacy-email/index.ts
from: 'Giornale Cesaris <noreply@yourdomain.com>', // Use your verified domain
```

## Step 7: Test the Complete Flow

1. Open your site: `yoursite.com/candidatura.html`
2. Fill out the candidacy form
3. Submit the form
4. Check that:
   - Candidacy is saved in `reporter_candidatures` table
   - Email is sent to `mohamed.mashaal@cesaris.edu.it`
   - No errors in browser console or Supabase logs

## Monitoring and Logs

### View Supabase Function Logs

```bash
# Real-time logs
supabase functions logs send-candidacy-email

# With filters
supabase functions logs send-candidacy-email --filter error
```

### View Resend Email Logs

1. Go to Resend dashboard
2. Navigate to **Logs** or **Emails**
3. Check delivery status of sent emails

## Troubleshooting

### Error: "Missing RESEND_API_KEY"

**Solution**: Make sure you've set the environment variable in Supabase:
```bash
supabase secrets list
# Should show RESEND_API_KEY
```

### Error: "Resend API error: 403"

**Solution**: Your API key might be invalid or revoked. Create a new one in Resend dashboard.

### Error: "Invalid from address"

**Solution**: 
- In development: Use `onboarding@resend.dev` (default)
- In production: Use your verified domain

### Emails Going to Spam

**Solutions**:
1. Verify your domain in Resend
2. Add SPF, DKIM, and DMARC records
3. Use a professional "from" address
4. Avoid spam trigger words in subject/body

### No Email Received

**Checks**:
1. Check Supabase function logs for errors
2. Check Resend dashboard for delivery status
3. Verify recipient email is correct
4. Check spam folder
5. Verify RESEND_API_KEY is set correctly

## Resend API Limits

### Free Tier:
- 100 emails/day
- 3,000 emails/month
- No credit card required

### Pro Tier ($20/month):
- 50,000 emails/month
- $1 per additional 1,000 emails
- Priority support

## Security Best Practices

1. ✅ **Never commit API keys** to git
2. ✅ **Use environment variables** for all secrets
3. ✅ **Rotate API keys** periodically
4. ✅ **Use separate keys** for dev/staging/production
5. ✅ **Monitor usage** in Resend dashboard
6. ✅ **Set up rate limiting** if needed

## Email Template Customization

The email template is defined in `supabase/functions/send-candidacy-email/index.ts`.

To customize:

1. Edit the HTML in the `html` field
2. Update the plain text in the `text` field
3. Test changes locally:
   ```bash
   supabase functions serve send-candidacy-email
   ```
4. Deploy:
   ```bash
   supabase functions deploy send-candidacy-email
   ```

## Alternative: Using Webhook

If you prefer not to use Edge Functions, you can set up a webhook:

1. Create a webhook endpoint (e.g., using Zapier or Make.com)
2. Configure Supabase to call webhook on `INSERT` to `reporter_candidatures`
3. Webhook forwards data to Resend API

## Support

- **Resend Docs**: https://resend.com/docs
- **Supabase Functions**: https://supabase.com/docs/guides/functions
- **Project Contact**: mohamed.mashaal@cesaris.edu.it

---

**Next Steps**: After email is working, consider adding:
- Email confirmation to applicant
- Auto-approve based on criteria
- Email templates for approval/rejection
- Multi-language support
