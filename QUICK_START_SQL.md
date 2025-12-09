# 🚀 Quick Start Guide - Running the SQL Schema

## ✅ The SQL file is now **100% error-free** and ready to use!

---

## 📋 Step-by-Step Instructions

### 1. Open Supabase SQL Editor

Go to your Supabase project:
- URL: https://tepxvijiamuaszvyzeze.supabase.co
- Navigate to **SQL Editor** in the left sidebar

### 2. Create a New Query

- Click **"New Query"** button
- You'll see an empty SQL editor

### 3. Copy the SQL Schema

- Open the file `supabase-schema.sql` in this repository
- Select all (Ctrl+A / Cmd+A)
- Copy (Ctrl+C / Cmd+C)

### 4. Paste and Execute

- Paste into Supabase SQL Editor (Ctrl+V / Cmd+V)
- Click **"Run"** button (or press F5)
- Wait for execution (should take 5-10 seconds)

### 5. Verify Success

You should see at the end:
```
✅ Supabase schema created successfully! All tables, indexes, triggers, and views are ready.
```

---

## 🎯 What Gets Created

### Tables (40+)
- **Users**: profili_utenti, preferenze_utente, user_followers, utenti_bloccati
- **Articles**: articoli, article_reactions, article_bookmarks, article_views, article_series, article_revisions
- **Comments**: article_comments, comment_reactions
- **Chat**: chat_messages, chat_reactions, chat_poll_votes
- **Reporter**: reporter_candidatures, reporter_terms_acceptance
- **Newsletter**: iscrizioni_newsletter, newsletter_logs
- **Gamification**: user_badges, user_points_history, reading_streaks, weekly_challenges
- **Moderation**: content_reports, audit_log
- **Analytics**: article_feedback, reading_history, featured_content

### Indexes (30+)
- Full-text search on articles
- Performance indexes on all key columns
- GIN indexes for array and JSONB fields

### Functions (5)
- `update_updated_at_column()` - Auto-update timestamps
- `increment_article_views()` - Track article views
- `update_user_points()` - Award points to users
- `check_and_award_badges()` - Automatic badge system
- `update_article_stats()` - Update author statistics

### Triggers (5)
- Auto-update `updated_at` on profili_utenti, preferenze_utente, articoli, article_comments, chat_messages
- Auto-increment views on article_views insert
- Auto-award points and badges on article publish

### Views (3)
- `article_analytics` - Comprehensive article statistics
- `leaderboard_writers` - Top 50 writers by points
- `trending_articles` - Most viewed in last 24 hours

### RLS Policies
- Row Level Security enabled on sensitive tables
- Proper authentication checks with auth.uid()
- Public read, authenticated write patterns

### Sample Data
- 3 weekly challenges pre-populated

---

## 🔄 Running Multiple Times

**Safe to run again!** The schema includes `DROP IF EXISTS` statements that clean everything before recreating. This means:

✅ You can run it multiple times
✅ Won't create duplicates
✅ Fresh start every time
✅ Perfect for testing

---

## ⚠️ Important Notes

### Before Running

1. **Backup your data** (if you have any existing tables with same names)
2. The script will **DROP existing tables** with the same names
3. All data in dropped tables will be lost

### After Running

1. **Create Storage Buckets** (see SUPABASE_SETUP.md)
   - article-images
   - user-avatars
   - chat-voices
   - chat-images

2. **Enable Realtime** on these tables:
   - chat_messages
   - article_comments
   - article_reactions

3. **Test the integration**:
   - Open your website
   - Check browser console for: "✅ Supabase client initialized"
   - Try to register a user
   - Create an article
   - Send a chat message

---

## 🐛 Troubleshooting

### If you see errors:

**"extension uuid-ossp does not exist"**
- Extensions should be enabled automatically
- If not, enable manually in Database → Extensions

**"permission denied"**
- Make sure you're logged into Supabase with proper permissions
- Use the project owner account

**"syntax error at or near..."**
- Make sure you copied the ENTIRE file
- Check that no characters were lost during copy/paste

**"relation already exists"**
- The DROP statements should handle this
- If issue persists, manually drop the table first: `DROP TABLE tablename CASCADE;`

**"column does not exist"**
- This should not happen with the new schema
- If you see this, please report it

---

## ✅ Verification Checklist

After running the schema, verify:

- [ ] No errors in SQL Editor output
- [ ] See success message at the end
- [ ] Tables visible in Database → Tables section
- [ ] Can create a user profile manually
- [ ] Can insert an article manually
- [ ] Website connects successfully (check browser console)

---

## 📞 Need Help?

If you encounter any issues:

1. Check the error message carefully
2. Verify you're using the latest `supabase-schema.sql` file
3. Make sure your Supabase project is active
4. Try running again (it's safe!)

---

## 🎉 Success!

Once you see the success message, your backend is **100% ready**!

Next steps:
1. Create storage buckets (see SUPABASE_SETUP.md)
2. Enable realtime on chat/comments tables
3. Test your website
4. Start using all 150+ features!

**Your Giornale Scolastico Cesaris is now fully powered by Supabase!** 🚀
