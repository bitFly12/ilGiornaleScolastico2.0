# Giornale Scolastico Cesaris 2.0 - Deployment Guide

## 🚀 Quick Start

### Prerequisites
- A Supabase account (free tier works)
- A web hosting service or local development server
- Modern web browser with JavaScript enabled

### Setup Steps

#### 1. Clone Repository
```bash
git clone https://github.com/bitFly12/ilGiornaleScolastico2.0.git
cd ilGiornaleScolastico2.0
```

#### 2. Configure Supabase
Follow the detailed guide in [`SUPABASE_SETUP_GUIDE.md`](SUPABASE_SETUP_GUIDE.md)

**Summary:**
1. Create a Supabase project
2. Copy your Project URL and anon key
3. Update `js/config.js` with your credentials:
```javascript
const SUPABASE_CONFIG = {
    url: 'https://your-project.supabase.co',
    anonKey: 'your-anon-key'
};
```

#### 3. Setup Database
1. Go to Supabase Dashboard > SQL Editor
2. Open `supabase-setup.sql`
3. Copy all content and paste in SQL Editor
4. Run the query

#### 4. Configure Email
1. Go to Supabase Dashboard > Authentication > Settings
2. Configure SMTP (Gmail, SendGrid, or other)
3. Enable email confirmations
4. Set redirect URLs

#### 5. Local Development
You can use any local server. Examples:

**Python:**
```bash
python -m http.server 8000
```

**Node.js (http-server):**
```bash
npm install -g http-server
http-server -p 8000
```

**VS Code Live Server:**
- Install Live Server extension
- Right-click `index.html` > Open with Live Server

Then open: `http://localhost:8000`

---

## 📁 Project Structure

```
ilGiornaleScolastico2.0/
├── index.html                  # Homepage
├── css/
│   ├── main.css               # Core styles & design system
│   └── homepage.css           # Homepage specific styles
├── js/
│   ├── config.js              # Supabase configuration
│   ├── supabase-client.js     # Supabase client wrapper
│   ├── auth.js                # Authentication functions
│   └── homepage.js            # Homepage logic
├── pages/
│   ├── register.html          # User registration
│   ├── login.html             # User login
│   ├── confirm-email.html     # Email confirmation
│   └── forgot-password.html   # Password reset
├── images/                    # Static images
├── supabase-setup.sql        # Complete DB migration
├── SUPABASE_SETUP_GUIDE.md   # Detailed setup guide
└── README.md                 # This file
```

---

## 🔧 Configuration

### Environment-Specific Settings

**Development:**
```javascript
// js/config.js
const SUPABASE_CONFIG = {
    url: 'https://xxxxx.supabase.co',
    anonKey: 'eyJhbGci...',
};
```

**Production:**
For production, consider using environment variables or a build system to inject credentials securely.

### Email Configuration

Required for registration to work:
1. **SMTP Provider**: Gmail (dev) or SendGrid (prod)
2. **Email Templates**: Configured in Supabase Dashboard
3. **Redirect URLs**: Must match your domain

---

## 🚨 Troubleshooting

### Registration Errors

**Error: "Database error saving new user"**
- ✅ Run `supabase-setup.sql` again
- ✅ Check that trigger `on_auth_user_created` exists
- ✅ Verify `profili_redattori` table exists

**Error: "Email not sent"**
- ✅ Check SMTP configuration in Supabase
- ✅ Test with "Send Test Email" button
- ✅ Check spam folder
- ✅ Verify sender email is verified (for Gmail)

**Error: "Invalid API key"**
- ✅ Copy fresh credentials from Supabase Dashboard
- ✅ Update `js/config.js`
- ✅ Clear browser cache (Ctrl+Shift+R)

### Common Issues

**Articles not loading:**
- Check browser console for errors
- Verify Supabase credentials in `js/config.js`
- Ensure database tables exist
- Check RLS policies are set correctly

**CORS errors:**
- Verify allowed origins in Supabase settings
- Check that you're using the correct Project URL

---

## 📊 Database Tables

The following tables are created by `supabase-setup.sql`:

### Core Tables:
- `profili_redattori` - User profiles
- `articoli` - Articles/posts
- `article_comments` - Comments on articles
- `article_bookmarks` - User bookmarks
- `article_shares` - Share tracking
- `iscrizioni_newsletter` - Newsletter subscriptions

### Chat Tables:
- `chat_messages` - Global chat messages
- `chat_reactions` - Emoji reactions to messages

### Gamification Tables:
- `user_points` - User points tracking
- `user_badges` - Earned badges
- `user_followers` - Follow system

### Additional Tables:
- `article_ai_checks` - AI content detection results
- `user_preferences` - User settings
- `reading_history` - Article reading tracking
- `content_reports` - Abuse reports
- `audit_log` - System audit trail

See `supabase-setup.sql` for complete schema.

---

## 🎨 Design System

### Colors
```css
--primary: #4338CA;      /* Indigo */
--secondary: #EC4899;    /* Pink */
--success: #10B981;      /* Green */
--error: #DC2626;        /* Red */
```

### Typography
- **Headings**: Georgia, Garamond (serif)
- **Body**: Inter, system fonts (sans-serif)
- **Code**: Fira Code (monospace)

### Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

---

## 🔐 Security Features

1. **Row Level Security (RLS)**: Enabled on all sensitive tables
2. **Email Validation**: Only @cesaris.edu.it emails allowed
3. **Password Requirements**: Minimum 8 characters
4. **Input Sanitization**: All user inputs validated
5. **HTTPS**: Required for production
6. **API Keys**: Never expose service_role key in frontend

---

## 🧪 Testing

### Manual Testing Checklist

**Registration Flow:**
- [ ] Can register with @cesaris.edu.it email
- [ ] Cannot register with other domains
- [ ] Password validation works
- [ ] Email confirmation sent
- [ ] Can confirm email via link
- [ ] Profile created in database

**Login Flow:**
- [ ] Can login with correct credentials
- [ ] Cannot login with wrong password
- [ ] "Remember me" works
- [ ] Logout works correctly

**Homepage:**
- [ ] Articles load correctly
- [ ] Category filter works
- [ ] Pagination works
- [ ] Newsletter subscription works

---

## 📝 Development Roadmap

### Phase 1: Core Features (Current)
- [x] Authentication system
- [x] User registration/login
- [x] Email confirmation
- [x] Basic homepage
- [x] Article listing
- [ ] Article detail page
- [ ] User profiles

### Phase 2: Content Creation
- [ ] Rich text editor
- [ ] Image upload
- [ ] AI content detector
- [ ] Article preview
- [ ] Draft management

### Phase 3: Social Features
- [ ] Comments system
- [ ] Bookmarks
- [ ] User following
- [ ] Real-time chat
- [ ] Reactions

### Phase 4: Gamification
- [ ] Points system
- [ ] Badges
- [ ] Leaderboards
- [ ] Challenges

### Phase 5: Admin Features
- [ ] Moderation dashboard
- [ ] Article approval
- [ ] User management
- [ ] Analytics

---

## 🌐 Deployment Options

### Option 1: Netlify (Recommended)
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

### Option 2: Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### Option 3: GitHub Pages
1. Go to repository Settings > Pages
2. Select branch: `main`
3. Select folder: `/` (root)
4. Save

### Option 4: Traditional Hosting
Upload all files via FTP to your web hosting service.

---

## 🔄 Updates & Maintenance

### Database Migrations
When adding new features, create migration SQL files:
```sql
-- migrations/2025-12-10-add-reactions.sql
ALTER TABLE articoli ADD COLUMN reactions_count INTEGER DEFAULT 0;
```

Run migrations in Supabase SQL Editor.

### Updating Dependencies
Supabase library is loaded via CDN. To update:
1. Check latest version at [Supabase CDN](https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2)
2. Update version in HTML files

---

## 📞 Support

### Resources
- [Supabase Documentation](https://supabase.com/docs)
- [Project README](README.md)
- [Setup Guide](SUPABASE_SETUP_GUIDE.md)

### Common Commands

**View Supabase logs:**
```
Dashboard > Authentication > Logs
```

**Backup database:**
```sql
-- Run in SQL Editor
-- Export tables as needed
SELECT * FROM articoli;
```

**Reset user password (admin):**
```sql
-- Run in SQL Editor with user's email
UPDATE auth.users 
SET encrypted_password = crypt('newpassword', gen_salt('bf'))
WHERE email = 'user@cesaris.edu.it';
```

---

## 📄 License

This project is created for educational purposes for Istituto Cesaris.

---

## 👥 Contributors

Built with ❤️ by the Cesaris development team.

---

**Last Updated:** December 2025
**Version:** 2.0.0
