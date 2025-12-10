# 🚀 Supabase Setup Guide - Giornale Scolastico Cesaris

## Quick Start

Follow these steps to set up the complete backend infrastructure for the website.

## Step 1: Run the SQL Schema

1. Go to your Supabase project: https://tepxvijiamuaszvyzeze.supabase.co
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire content of `supabase-schema.sql`
5. Paste it into the query editor
6. Click **Run** to execute the SQL

This will create:
- ✅ 40+ database tables
- ✅ Row Level Security policies
- ✅ Indexes for performance
- ✅ Functions and triggers
- ✅ Views for analytics

## Step 2: Create Storage Buckets

Navigate to **Storage** in Supabase Dashboard and create these buckets:

### 1. article-images
- **Public**: Yes
- **Allowed MIME types**: `image/jpeg, image/png, image/webp, image/gif`
- **Max file size**: 5MB

**Policy for article-images:**
```sql
-- INSERT policy
CREATE POLICY "Authenticated users can upload article images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'article-images');

-- SELECT policy (public read)
CREATE POLICY "Anyone can view article images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'article-images');
```

### 2. user-avatars
- **Public**: Yes
- **Allowed MIME types**: `image/jpeg, image/png, image/webp`
- **Max file size**: 2MB

**Policy for user-avatars:**
```sql
-- Users can upload their own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Anyone can view avatars
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-avatars');

-- Users can update own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING ((storage.foldername(name))[1] = auth.uid()::text);
```

### 3. chat-voices
- **Public**: No (authenticated only)
- **Allowed MIME types**: `audio/mpeg, audio/wav, audio/ogg, audio/webm`
- **Max file size**: 10MB

**Policy for chat-voices:**
```sql
-- Authenticated users can upload voices
CREATE POLICY "Authenticated users can upload voice messages"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-voices');

-- Authenticated users can view voices
CREATE POLICY "Authenticated users can view voice messages"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'chat-voices');
```

### 4. chat-images
- **Public**: No (authenticated only)
- **Allowed MIME types**: `image/jpeg, image/png, image/webp, image/gif`
- **Max file size**: 5MB

**Policy for chat-images:**
```sql
-- Authenticated users can upload chat images
CREATE POLICY "Authenticated users can upload chat images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-images');

-- Authenticated users can view chat images
CREATE POLICY "Authenticated users can view chat images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'chat-images');
```

## Step 3: Enable Realtime

1. Go to **Database** → **Replication** in Supabase
2. Enable replication for these tables:
   - ✅ `chat_messages`
   - ✅ `chat_reactions`
   - ✅ `article_comments`
   - ✅ `article_reactions`

This enables real-time subscriptions for chat and comments.

## Step 4: Configure Authentication

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider (already enabled)
3. Optional: Enable **Google** or **GitHub** for OAuth

### Email Templates

Go to **Authentication** → **Email Templates** and customize:

#### Confirm Signup
```html
<h2>Conferma la tua email</h2>
<p>Benvenuto al Giornale Scolastico Cesaris!</p>
<p>Clicca il link per confermare il tuo account:</p>
<p><a href="{{ .ConfirmationURL }}">Conferma Email</a></p>
```

#### Reset Password
```html
<h2>Reset Password</h2>
<p>Hai richiesto il reset della password.</p>
<p>Clicca il link per reimpostare:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
```

## Step 5: Edge Functions (Optional - for Email Sending)

Create an Edge Function for sending newsletters:

```bash
supabase functions new send-newsletter
```

**send-newsletter/index.ts:**
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { article_id } = await req.json()

    // Get article
    const { data: article } = await supabaseClient
      .from('articoli')
      .select('*')
      .eq('id', article_id)
      .single()

    // Get active subscribers
    const { data: subscribers } = await supabaseClient
      .from('iscrizioni_newsletter')
      .select('email')
      .eq('attiva', true)

    // Send emails using Resend API
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    
    for (const subscriber of subscribers) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Giornale Cesaris <newsletter@cesaris.edu.it>',
          to: subscriber.email,
          subject: `Nuovo articolo: ${article.titolo}`,
          html: `
            <h2>${article.titolo}</h2>
            <p>${article.sommario}</p>
            <a href="https://yoursite.com/articolo.html?id=${article.id}">Leggi l'articolo completo</a>
          `
        })
      })
    }

    return new Response(
      JSON.stringify({ success: true, sent: subscribers.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
```

Deploy the function:
```bash
supabase functions deploy send-newsletter
```

## Step 6: Environment Variables

If you need additional API keys, add them in **Project Settings** → **API**:

- `RESEND_API_KEY` - For email sending (if using Resend)
- `OPENAI_API_KEY` - For AI content moderation (optional)
- `TRANSFORMERS_JS_URL` - For AI detection (optional)

## Step 7: Test the Integration

1. Open `index.html` in a browser
2. Check browser console for: `✅ Supabase client initialized`
3. Try to login/register
4. Create an article
5. Test chat functionality
6. Verify real-time updates

## Verification Checklist

- [ ] SQL schema executed successfully
- [ ] All 4 storage buckets created with policies
- [ ] Realtime enabled for chat/comments tables
- [ ] Email authentication configured
- [ ] Email templates customized
- [ ] Edge Function deployed (optional)
- [ ] Test user registration works
- [ ] Test article creation works
- [ ] Test chat messaging works
- [ ] Test real-time updates work

## Database Tables Created

### Core Tables (40+)
- `profili_utenti` - User profiles
- `preferenze_utente` - User preferences
- `articoli` - Articles
- `article_reactions` - Article reactions (👍❤️😮😢)
- `article_bookmarks` - Saved articles
- `article_comments` - Comments on articles
- `article_views` - View tracking
- `chat_messages` - Chat messages
- `chat_reactions` - Chat reactions
- `reporter_candidatures` - Reporter applications
- `iscrizioni_newsletter` - Newsletter subscriptions
- `user_badges` - Gamification badges
- `user_points_history` - Points tracking
- `content_reports` - Moderation reports
- `audit_log` - System audit trail
- And 25+ more tables...

## API Keys Already Configured

Your Supabase project is already configured with:
- **URL**: `https://tepxvijiamuaszvyzeze.supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

These are already in `js/supabase-config.js`.

## Next Steps

After setup is complete:

1. **Seed Data**: Add some initial articles and users for testing
2. **Test All Features**: Go through each page and test functionality
3. **Monitor**: Check Supabase Dashboard logs for any errors
4. **Optimize**: Add indexes if queries are slow
5. **Scale**: Supabase handles scaling automatically

## Support

If you encounter issues:

1. Check Supabase Dashboard logs
2. Check browser console for errors
3. Verify RLS policies are correct
4. Ensure all buckets have proper policies

## Security Notes

- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Email domain validation (@cesaris.edu.it)
- ✅ SQL injection protection (parameterized queries)
- ✅ XSS protection (HTML escaping)
- ✅ CSRF protection (Supabase handles this)

---

**Your website is now fully integrated with Supabase backend! 🎉**
