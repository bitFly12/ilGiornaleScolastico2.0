# 📧 Supabase Email Configuration Guide

Complete guide for configuring email templates and redirects in Supabase for the Giornale Cesaris website.

## 🎯 What Needs to Be Configured

1. **Email Confirmation** - After registration
2. **Password Reset** - When user forgets password
3. **Email Change** - When user changes email
4. **Candidacy Notifications** - For reporter applications (via Edge Function)

---

## 📝 Step 1: Configure Email Templates in Supabase

### Access Email Templates

1. Go to your Supabase project: https://tepxvijiamuaszvyzeze.supabase.co
2. Click on **Authentication** in the left sidebar
3. Click on **Email Templates** tab

---

### 1️⃣ Confirm Signup Template

**Purpose:** Sent when user registers. Redirects to login page after confirmation.

**Template Configuration:**

- **Subject:** `Conferma il tuo account - Giornale Cesaris`
- **Body (HTML):**

```html
<h2>Benvenuto al Giornale Scolastico Cesaris!</h2>
<p>Ciao! Grazie per esserti registrato.</p>
<p>Clicca il pulsante qui sotto per confermare il tuo account. Dopo la conferma verrai reindirizzato automaticamente alla pagina di login.</p>

<p>
  <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 12px 24px; background-color: #0033A0; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">
    Conferma la tua email
  </a>
</p>

<p style="margin-top: 20px; color: #666; font-size: 14px;">
Se il pulsante non funziona, copia e incolla questo link nel browser:
</p>
<p style="color: #666; font-size: 14px; word-break: break-all;">
  {{ .ConfirmationURL }}
</p>

<p style="margin-top: 30px; color: #999; font-size: 12px;">
Se non hai richiesto questa email, ignora questo messaggio.
</p>

<hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
<p style="color: #999; font-size: 12px; text-align: center;">
  © 2024 Giornale Scolastico Cesaris - Tutti i diritti riservati
</p>
```

**Redirect URL Setting:**
- The app automatically sets `emailRedirectTo` in registration
- Default redirect: `https://your-domain.com/login.html`
- Already configured in `register.html`

---

### 2️⃣ Reset Password Template

**Purpose:** Sent when user requests password reset.

**Template Configuration:**

- **Subject:** `Reimposta la tua password - Giornale Cesaris`
- **Body (HTML):**

```html
<h2>Reimposta la tua password</h2>
<p>Hai richiesto di reimpostare la tua password per il Giornale Scolastico Cesaris.</p>
<p>Clicca il pulsante qui sotto per creare una nuova password:</p>

<p>
  <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 12px 24px; background-color: #0033A0; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">
    Reimposta Password
  </a>
</p>

<p style="margin-top: 20px; color: #666; font-size: 14px;">
Se il pulsante non funziona, copia e incolla questo link nel browser:
</p>
<p style="color: #666; font-size: 14px; word-break: break-all;">
  {{ .ConfirmationURL }}
</p>

<p style="margin-top: 20px; font-weight: 600; color: #DC2626;">
⚠️ Questo link scadrà tra 1 ora per motivi di sicurezza.
</p>

<p style="margin-top: 30px; color: #999; font-size: 12px;">
Se non hai richiesto questa email, ignora questo messaggio. La tua password non verrà modificata.
</p>

<hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
<p style="color: #999; font-size: 12px; text-align: center;">
  © 2024 Giornale Scolastico Cesaris
</p>
```

---

### 3️⃣ Change Email Template

**Purpose:** Sent when user changes their email address.

**Template Configuration:**

- **Subject:** `Conferma il cambio email - Giornale Cesaris`
- **Body (HTML):**

```html
<h2>Conferma il cambio della tua email</h2>
<p>Hai richiesto di cambiare la tua email su Giornale Scolastico Cesaris.</p>
<p>Clicca il pulsante per confermare il nuovo indirizzo email:</p>

<p>
  <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 12px 24px; background-color: #0033A0; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">
    Conferma Nuovo Email
  </a>
</p>

<p style="margin-top: 20px; color: #666; font-size: 14px;">
Se il pulsante non funziona, copia e incolla questo link nel browser:
</p>
<p style="color: #666; font-size: 14px; word-break: break-all;">
  {{ .ConfirmationURL }}
</p>

<p style="margin-top: 30px; color: #999; font-size: 12px;">
Se non hai richiesto questa modifica, contatta immediatamente l'amministratore.
</p>

<hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
<p style="color: #999; font-size: 12px; text-align: center;">
  © 2024 Giornale Scolastico Cesaris
</p>
```

---

## 🔗 Step 2: Configure Redirect URLs

### Site URL Configuration

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** to your production domain:
   - For local dev: `http://localhost:3000` or `http://127.0.0.1:5500`
   - For production: `https://your-domain.com`

### Redirect URLs (Whitelist)

Add these URLs to the **Redirect URLs** whitelist:

```
http://localhost:3000/login.html
http://localhost:3000/reset-password.html
http://127.0.0.1:5500/login.html
http://127.0.0.1:5500/reset-password.html
https://your-domain.com/login.html
https://your-domain.com/reset-password.html
```

---

## 📨 Step 3: Reporter Candidacy Email (Edge Function)

**Purpose:** Notify mohamed.mashaal@cesaris.edu.it when someone applies to be a reporter.

### Create Edge Function for Email Sending

**File:** `supabase/functions/send-candidacy-email/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const ADMIN_EMAIL = 'mohamed.mashaal@cesaris.edu.it'
const SITE_URL = Deno.env.get('SITE_URL') || 'https://your-domain.com'

serve(async (req) => {
  try {
    const { candidatureId, email, fullName, motivation } = await req.json()
    
    // Send email via Resend API
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Giornale Cesaris <noreply@cesaris.edu.it>',
        to: [ADMIN_EMAIL],
        subject: `Nuova Candidatura Reporter: ${fullName}`,
        html: `
          <h2>Nuova Candidatura Reporter</h2>
          <p><strong>Nome:</strong> ${fullName}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Motivazione:</strong></p>
          <p>${motivation}</p>
          
          <hr>
          
          <p>
            <a href="${SITE_URL}/admin.html?tab=candidatures&action=approve&id=${candidatureId}" 
               style="display: inline-block; padding: 12px 24px; background-color: #10B981; color: white; text-decoration: none; border-radius: 6px; margin-right: 10px;">
              ✅ Approva
            </a>
            
            <a href="${SITE_URL}/admin.html?tab=candidatures&action=reject&id=${candidatureId}" 
               style="display: inline-block; padding: 12px 24px; background-color: #DC2626; color: white; text-decoration: none; border-radius: 6px;">
              ❌ Rifiuta
            </a>
          </p>
          
          <p style="margin-top: 20px; color: #666; font-size: 14px;">
            Oppure vai alla <a href="${SITE_URL}/admin.html">dashboard admin</a> per revisionare.
          </p>
        `
      })
    })
    
    const data = await res.json()
    
    return new Response(JSON.stringify({ success: true, data }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    })
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400
    })
  }
})
```

### Deploy Edge Function

```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Login to Supabase
supabase login

# Deploy function
supabase functions deploy send-candidacy-email

# Set secrets
supabase secrets set RESEND_API_KEY=re_TdwD1rg2_33toySQdNwgiCuNEwCEXQbWY
supabase secrets set SITE_URL=https://your-domain.com
```

### Call Edge Function from Frontend

Update `candidatura.html` to call the Edge Function after saving candidature:

```javascript
// After successfully inserting candidature to database
const { error: emailError } = await supabaseClient.functions.invoke('send-candidacy-email', {
  body: {
    candidatureId: data.id,
    email: email,
    fullName: fullName,
    motivation: motivation
  }
})

if (emailError) {
  console.error('Email sending error:', emailError)
  // Don't fail the whole operation, just log
}
```

---

## ✅ Testing Checklist

### Email Confirmation Test:
- [ ] Register new user
- [ ] Check email inbox
- [ ] Click confirmation link
- [ ] Should redirect to login page
- [ ] Login should work

### Password Reset Test:
- [ ] Click "Forgot Password"
- [ ] Enter email
- [ ] Check email inbox
- [ ] Click reset link
- [ ] Should redirect to reset password page
- [ ] Set new password
- [ ] Login with new password

### Candidacy Email Test:
- [ ] Fill candidacy form
- [ ] Submit application
- [ ] mohamed.mashaal@cesaris.edu.it receives email
- [ ] Email contains approve/reject links
- [ ] Links redirect to admin panel
- [ ] Can approve/reject from email or admin panel

---

## 🔧 Troubleshooting

### Emails not being sent

1. Check Supabase email settings:
   - Go to Authentication → Email Templates
   - Check if SMTP is configured (or using Supabase default)

2. Check spam folder

3. For candidacy emails:
   - Check Edge Function logs: `supabase functions logs send-candidacy-email`
   - Verify RESEND_API_KEY is set correctly
   - Check Resend dashboard for delivery status

### Redirects not working

1. Verify Site URL matches your domain exactly
2. Check Redirect URLs whitelist includes your URLs
3. Make sure URLs don't have trailing slashes mismatch

### Profile not created after registration

1. Check if trigger `on_auth_user_created` is enabled
2. Check function `handle_new_user()` exists
3. Check Supabase logs for errors
4. Manually check if profile exists in profili_utenti table

---

## 📚 Additional Resources

- [Supabase Email Templates Docs](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Resend API Docs](https://resend.com/docs)

---

**Last Updated:** December 9, 2024
**Project:** Giornale Scolastico Cesaris 2.0
