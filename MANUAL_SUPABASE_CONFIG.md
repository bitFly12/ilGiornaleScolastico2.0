# 🔧 Manual Supabase Configuration Guide

## ⚠️ IMPORTANT: Manual Steps Required in Supabase Dashboard

After running the SQL schema (`supabase-schema.sql`), you MUST perform these manual configurations in the Supabase Dashboard to ensure proper functionality.

## 📋 Configuration Checklist

### 1. Enable Email Confirmation (CRITICAL for Registration)

**Why this is needed:** The registration process requires email confirmation. If not configured, users will get database errors during signup.

**Steps:**
1. Go to **Authentication** → **Settings** in Supabase Dashboard
2. Under **Email Auth**:
   - ✅ Enable email confirmations: **ON**
   - ✅ Secure email change: **ON**
   - ✅ Double confirm email changes: **ON**
3. Set **Site URL**: `https://yoursite.com` (or your actual domain)
4. Add **Redirect URLs** (one per line):
   ```
   http://localhost:8080/login.html
   http://localhost:3000/login.html
   https://yoursite.com/login.html
   https://www.yoursite.com/login.html
   ```
5. Click **Save**

### 2. Configure Email Templates

**Steps:**
1. Go to **Authentication** → **Email Templates**

#### Confirm Signup Template
```html
<h2>🎓 Benvenuto al Giornale Cesaris!</h2>

<p>Ciao,</p>

<p>Grazie per esserti registrato al Giornale Scolastico Cesaris.</p>

<p>Per completare la registrazione, clicca sul pulsante qui sotto per confermare la tua email:</p>

<p><a href="{{ .ConfirmationURL }}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Conferma Email</a></p>

<p>Oppure copia e incolla questo link nel tuo browser:</p>
<p>{{ .ConfirmationURL }}</p>

<p>Se non hai richiesto questa registrazione, ignora questa email.</p>

<p>A presto!<br>
Il Team del Giornale Cesaris</p>
```

#### Password Reset Template
```html
<h2>🔐 Reset della Password</h2>

<p>Ciao,</p>

<p>Hai richiesto il reset della tua password per il Giornale Cesaris.</p>

<p>Clicca sul pulsante qui sotto per impostare una nuova password:</p>

<p><a href="{{ .ConfirmationURL }}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Reset Password</a></p>

<p>Oppure copia e incolla questo link nel tuo browser:</p>
<p>{{ .ConfirmationURL }}</p>

<p>Se non hai richiesto questo reset, ignora questa email.</p>

<p>Il Team del Giornale Cesaris</p>
```

### 3. Fix RLS (Row Level Security) Policies

The SQL schema enables RLS, but you need to verify these policies exist:

**Steps:**
1. Go to **Database** → **Policies** in Supabase Dashboard
2. Find the `profili_utenti` table
3. Verify these policies exist:

```sql
-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile" ON profili_utenti
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- Allow users to view all profiles (public)
CREATE POLICY "Public profiles are viewable by everyone" ON profili_utenti
    FOR SELECT 
    USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profili_utenti
    FOR UPDATE 
    USING (auth.uid() = id);
```

**If these don't exist, run this SQL in the SQL Editor:**

```sql
-- Drop old policies if they exist
DROP POLICY IF EXISTS "Users can insert own profile" ON profili_utenti;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profili_utenti;
DROP POLICY IF EXISTS "Users can update own profile" ON profili_utenti;

-- Create new policies
CREATE POLICY "Users can insert own profile" ON profili_utenti
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Public profiles are viewable by everyone" ON profili_utenti
    FOR SELECT 
    USING (true);

CREATE POLICY "Users can update own profile" ON profili_utenti
    FOR UPDATE 
    USING (auth.uid() = id);
```

### 4. Create Storage Buckets

**Why needed:** For storing article images, user avatars, and chat media.

**Steps:**
1. Go to **Storage** in Supabase Dashboard
2. Create the following buckets:

#### Bucket 1: `article-images`
- **Public**: ✅ Yes
- **File size limit**: 5 MB
- **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`, `image/gif`

**Policies for article-images:**
```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload article images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'article-images');

-- Allow public read
CREATE POLICY "Anyone can view article images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'article-images');

-- Allow authors to delete their images
CREATE POLICY "Users can delete own article images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'article-images');
```

#### Bucket 2: `user-avatars`
- **Public**: ✅ Yes
- **File size limit**: 2 MB
- **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`

**Policies for user-avatars:**
```sql
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-avatars');

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

#### Bucket 3: `chat-images`
- **Public**: ❌ No (authenticated only)
- **File size limit**: 5 MB
- **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`, `image/gif`

**Policies:**
```sql
CREATE POLICY "Authenticated users can upload chat images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-images');

CREATE POLICY "Authenticated users can view chat images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'chat-images');
```

#### Bucket 4: `chat-voices`
- **Public**: ❌ No (authenticated only)
- **File size limit**: 10 MB
- **Allowed MIME types**: `audio/mpeg`, `audio/wav`, `audio/ogg`, `audio/webm`

**Policies:**
```sql
CREATE POLICY "Authenticated users can upload voice messages"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-voices');

CREATE POLICY "Authenticated users can view voice messages"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'chat-voices');
```

### 5. Enable Realtime

**Why needed:** For real-time chat and live article comments.

**Steps:**
1. Go to **Database** → **Replication** in Supabase Dashboard
2. Find and enable replication for these tables:
   - ✅ `chat_messages`
   - ✅ `chat_reactions`
   - ✅ `article_comments`
   - ✅ `article_reactions`
   - ✅ `chat_poll_votes`

3. Click **Save**

### 6. Verify Triggers and Functions

**Steps:**
1. Go to **Database** → **Functions** in Supabase Dashboard
2. Verify these functions exist:
   - ✅ `update_updated_at_column()`
   - ✅ `increment_article_views()`
   - ✅ `update_user_points()`
   - ✅ `check_and_award_badges()`
   - ✅ `update_article_stats()`
   - ✅ `set_user_role_and_username()`
   - ✅ `create_user_profile()` (for manual profile creation if needed)

If any are missing, they should have been created by the SQL schema. If not, re-run the schema.

### 7. Test User Registration Flow

**Manual Testing Steps:**
1. Open your site in a browser
2. Go to the registration page
3. Register with a test email (format: `test@cesaris.edu.it`)
4. Check your email for confirmation link
5. Click the confirmation link
6. Try to login
7. Verify profile is created in `profili_utenti` table

**If registration fails:**
- Check Supabase Dashboard → **Logs** → **API Logs**
- Look for errors related to RLS policies or triggers
- Verify email confirmation is enabled
- Check that the `profili_utenti` INSERT policy exists

### 8. Configure Email Provider (Optional but Recommended)

By default, Supabase uses their email service, but it has limits.

**For production, set up a custom SMTP provider:**

1. Go to **Project Settings** → **Auth** → **SMTP Settings**
2. Enable **Custom SMTP**
3. Configure with your email provider:
   - **Host**: `smtp.your-provider.com`
   - **Port**: `587` (TLS) or `465` (SSL)
   - **Username**: Your SMTP username
   - **Password**: Your SMTP password
   - **Sender email**: `noreply@cesaris.edu.it`
   - **Sender name**: `Giornale Cesaris`

**Recommended providers:**
- SendGrid (free tier: 100 emails/day)
- Mailgun (free tier: 5,000 emails/month)
- AWS SES (very cheap)
- Resend (modern, developer-friendly)

### 9. Security Settings Review

**Steps:**
1. Go to **Authentication** → **Policies**
2. Review these security settings:

**Password Requirements:**
- Minimum length: 6 characters (can increase to 8+)

**Rate Limiting:**
- Enable rate limiting to prevent brute force attacks
- Limit: 5 attempts per hour per IP

**JWT Settings:**
- JWT expiry: 3600 seconds (1 hour) - can adjust
- Refresh token rotation: Enabled

### 10. Additional Indexes (For Performance)

If you notice slow queries, add these indexes:

```sql
-- Article search performance
CREATE INDEX IF NOT EXISTS idx_articoli_fulltext 
ON articoli USING GIN(to_tsvector('italian', titolo || ' ' || sommario || ' ' || contenuto));

-- User lookups
CREATE INDEX IF NOT EXISTS idx_profili_utenti_email_lower 
ON profili_utenti(LOWER(email));

CREATE INDEX IF NOT EXISTS idx_profili_utenti_username_lower 
ON profili_utenti(LOWER(username));

-- Chat message queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_desc 
ON chat_messages(created_at DESC) WHERE is_deleted = false;

-- Article views for analytics
CREATE INDEX IF NOT EXISTS idx_article_views_created 
ON article_views(created_at) WHERE created_at > NOW() - INTERVAL '30 days';
```

## 🧪 Verification Steps

After completing all configurations:

### Test 1: User Registration
```
1. Go to /register.html
2. Enter: test@cesaris.edu.it, password: test123
3. Submit form
4. Check email (might be in spam)
5. Click confirmation link
6. Try to login at /login.html
7. Should redirect to index.html
```

### Test 2: Profile Creation
```
1. After login, go to Supabase Dashboard
2. Check Database → profili_utenti table
3. Verify your user exists with correct:
   - id (matches auth.users id)
   - email
   - username (extracted from email)
   - nome_visualizzato
   - ruolo (should be 'utente')
```

### Test 3: Chat Functionality
```
1. Login as user
2. Go to /chat.html
3. Send a message
4. Check Database → chat_messages table
5. Message should appear immediately (realtime)
```

### Test 4: Article Creation (For Reporters)
```
1. Manually set ruolo='reporter' in profili_utenti table
2. Go to /dashboard.html
3. Try to create an article
4. Check articoli table
5. Article should be saved as 'bozza'
```

## 🔍 Troubleshooting

### Issue: "Database error saving new user"
**Solution:**
- Verify RLS policies exist on `profili_utenti`
- Check that email confirmation is enabled
- Look at Supabase logs for specific error
- Verify trigger `set_user_role_and_username` exists

### Issue: Email confirmation not received
**Solution:**
- Check spam folder
- Verify SMTP settings (if custom SMTP)
- Check Supabase logs → Auth logs
- Verify redirect URLs are configured
- Try with a different email provider

### Issue: Cannot upload images
**Solution:**
- Verify storage buckets exist
- Check storage policies (INSERT, SELECT)
- Verify file size limits
- Check MIME type restrictions

### Issue: Chat messages not showing in real-time
**Solution:**
- Verify realtime is enabled for `chat_messages`
- Check browser console for subscription errors
- Verify RLS policies allow reading messages
- Check Supabase logs

### Issue: Cannot create articles (for reporters)
**Solution:**
- Verify user has `ruolo='reporter'` in `profili_utenti`
- Check RLS policy on `articoli` table
- Verify foreign key constraint exists
- Check browser console for errors

## 📞 Support

If issues persist:
1. Check Supabase Dashboard → **Logs**
2. Look at browser console (F12)
3. Review Network tab for failed API calls
4. Check SQL schema was fully executed

## ✅ Final Checklist

Before going live, ensure:

- [ ] SQL schema executed successfully
- [ ] Email confirmation enabled
- [ ] Email templates configured
- [ ] All RLS policies verified
- [ ] Storage buckets created with policies
- [ ] Realtime enabled for required tables
- [ ] Test registration works
- [ ] Test login works
- [ ] Test profile creation works
- [ ] Test chat works
- [ ] Test article creation works (reporter)
- [ ] Custom SMTP configured (production)
- [ ] Security settings reviewed
- [ ] Performance indexes added
- [ ] All test cases passed

## 🚀 Ready to Launch

Once all items are checked, your Giornale Cesaris is ready to use!

**Important URLs:**
- Registration: `/register.html`
- Login: `/login.html`
- Homepage: `/index.html`
- Chat: `/chat.html`
- Reporter Dashboard: `/dashboard.html`
- Admin Dashboard: `/admin.html`

---

**Last Updated:** December 2024
**Supabase Version:** Latest
**Schema Version:** 2.0
