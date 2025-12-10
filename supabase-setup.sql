-- ============================================
-- GIORNALE SCOLASTICO CESARIS - DATABASE SETUP
-- Complete SQL Migration Script for Supabase
-- ============================================
-- 
-- INSTRUCTIONS:
-- 1. Go to Supabase Dashboard > SQL Editor
-- 2. Create a new query
-- 3. Copy and paste this entire file
-- 4. Click "Run" to execute
-- 
-- This will create all necessary tables, functions, triggers, and RLS policies
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PROFILES TABLE (profili_redattori)
-- ============================================
CREATE TABLE IF NOT EXISTS profili_redattori (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    nome_visualizzato TEXT NOT NULL,
    ruolo TEXT DEFAULT 'Studente', -- Studente, Reporter, Caporedattore
    bio TEXT,
    classe TEXT,
    level TEXT DEFAULT 'junior', -- junior, senior, chief
    points INTEGER DEFAULT 0,
    followers_count INTEGER DEFAULT 0,
    articles_count INTEGER DEFAULT 0,
    is_expert BOOLEAN DEFAULT false,
    is_hidden BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. ARTICLES TABLE (articoli)
-- ============================================
CREATE TABLE IF NOT EXISTS articoli (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    autore_id UUID REFERENCES profili_redattori(id) ON DELETE SET NULL,
    titolo TEXT NOT NULL,
    sommario TEXT,
    contenuto TEXT NOT NULL,
    immagine_copertina TEXT,
    categoria TEXT NOT NULL,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    stato TEXT DEFAULT 'bozza', -- bozza, in_revisione, pubblicato, rifiutato
    visualizzazioni INTEGER DEFAULT 0,
    reading_time_minutes INTEGER DEFAULT 5,
    scheduled_publish_at TIMESTAMP WITH TIME ZONE,
    co_authors UUID[],
    video_embeds JSONB,
    table_of_contents JSONB,
    reading_complexity TEXT DEFAULT 'normal',
    infographics JSONB,
    data_creazione TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_pubblicazione TIMESTAMP WITH TIME ZONE,
    data_aggiornamento TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. COMMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS article_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID REFERENCES articoli(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    parent_comment_id UUID REFERENCES article_comments(id) ON DELETE CASCADE,
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. BOOKMARKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS article_bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID REFERENCES articoli(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    folder_name TEXT DEFAULT 'default',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(article_id, user_id)
);

-- ============================================
-- 5. SHARES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS article_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID REFERENCES articoli(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    platform TEXT, -- facebook, twitter, whatsapp, etc
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 6. NEWSLETTER SUBSCRIPTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS iscrizioni_newsletter (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    email_verificata BOOLEAN DEFAULT false,
    ultimo_invio TIMESTAMP WITH TIME ZONE,
    attiva BOOLEAN DEFAULT true,
    unsubscribe_token TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 7. CHAT MESSAGES
-- ============================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text', -- text, poll, voice, system
    poll_data JSONB,
    voice_url TEXT,
    reply_to_message_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 8. CHAT REACTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS chat_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id, emoji)
);

-- ============================================
-- 9. AI DETECTION CHECKS
-- ============================================
CREATE TABLE IF NOT EXISTS article_ai_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID REFERENCES articoli(id) ON DELETE CASCADE,
    ai_percentage NUMERIC(5,2),
    detected_sections JSONB,
    check_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_approved BOOLEAN
);

-- ============================================
-- 10. USER PREFERENCES
-- ============================================
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    theme TEXT DEFAULT 'light',
    font_size_multiplier NUMERIC(3,1) DEFAULT 1.0,
    dyslexia_font BOOLEAN DEFAULT false,
    preferred_categories TEXT[] DEFAULT ARRAY[]::TEXT[],
    language TEXT DEFAULT 'it',
    notifications_enabled BOOLEAN DEFAULT true,
    reading_mode_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 11. READING HISTORY
-- ============================================
CREATE TABLE IF NOT EXISTS reading_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    article_id UUID REFERENCES articoli(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    time_spent_seconds INTEGER,
    progress_percentage INTEGER DEFAULT 0
);

-- ============================================
-- 12. USER FOLLOWERS
-- ============================================
CREATE TABLE IF NOT EXISTS user_followers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

-- ============================================
-- 13. REPORTER CANDIDATURES
-- ============================================
CREATE TABLE IF NOT EXISTS reporter_candidatures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    class TEXT NOT NULL,
    motivation TEXT NOT NULL,
    accepted BOOLEAN DEFAULT false,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 14. REPORTER TERMS ACCEPTANCE
-- ============================================
CREATE TABLE IF NOT EXISTS reporter_terms_acceptance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    terms_version TEXT,
    ip_address TEXT,
    UNIQUE(user_id)
);

-- ============================================
-- 15. READING TERMS ACCEPTANCE
-- ============================================
CREATE TABLE IF NOT EXISTS reading_terms_acceptance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT UNIQUE,
    accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 16. ARTICLE REACTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS article_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID REFERENCES articoli(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reaction_type TEXT NOT NULL, -- like, love, wow, sad
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(article_id, user_id, reaction_type)
);

-- ============================================
-- 17. USER BADGES
-- ============================================
CREATE TABLE IF NOT EXISTS user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_type TEXT NOT NULL,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, badge_type)
);

-- ============================================
-- 18. USER POINTS
-- ============================================
CREATE TABLE IF NOT EXISTS user_points (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    total_points INTEGER DEFAULT 0,
    articles_written INTEGER DEFAULT 0,
    articles_published INTEGER DEFAULT 0,
    total_views INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 19. BLOCKED USERS
-- ============================================
CREATE TABLE IF NOT EXISTS blocked_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blocker_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    blocked_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_id)
);

-- ============================================
-- 20. CONTENT REPORTS
-- ============================================
CREATE TABLE IF NOT EXISTS content_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    content_type TEXT NOT NULL, -- article, comment, message
    content_id UUID NOT NULL,
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending', -- pending, reviewed, resolved
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 21. ARTICLE SERIES
-- ============================================
CREATE TABLE IF NOT EXISTS article_series (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS article_series_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    series_id UUID REFERENCES article_series(id) ON DELETE CASCADE,
    article_id UUID REFERENCES articoli(id) ON DELETE CASCADE,
    episode_number INTEGER,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(series_id, article_id)
);

-- ============================================
-- 22. ARTICLE FEEDBACK
-- ============================================
CREATE TABLE IF NOT EXISTS article_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID REFERENCES articoli(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 23. AUDIT LOG
-- ============================================
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    details JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_articoli_autore ON articoli(autore_id);
CREATE INDEX IF NOT EXISTS idx_articoli_stato ON articoli(stato);
CREATE INDEX IF NOT EXISTS idx_articoli_categoria ON articoli(categoria);
CREATE INDEX IF NOT EXISTS idx_articoli_data_pubblicazione ON articoli(data_pubblicazione DESC);
CREATE INDEX IF NOT EXISTS idx_article_comments_article ON article_comments(article_id);
CREATE INDEX IF NOT EXISTS idx_article_comments_user ON article_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reading_history_user ON reading_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_followers_follower ON user_followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_followers_following ON user_followers(following_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp DESC);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function: Handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profili_redattori (id, email, nome_visualizzato)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update article view count
CREATE OR REPLACE FUNCTION increment_article_views(article_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE articoli
    SET visualizzazioni = visualizzazioni + 1
    WHERE id = article_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate reading time
CREATE OR REPLACE FUNCTION calculate_reading_time(p_content TEXT)
RETURNS INTEGER AS $$
DECLARE
    word_count INTEGER;
BEGIN
    word_count := array_length(string_to_array(p_content, ' '), 1);
    RETURN COALESCE(CEIL(word_count::NUMERIC / 200), 1)::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger: Create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Trigger: Update article timestamp
CREATE OR REPLACE FUNCTION update_article_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.data_aggiornamento = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_articoli_timestamp ON articoli;
CREATE TRIGGER update_articoli_timestamp
    BEFORE UPDATE ON articoli
    FOR EACH ROW
    EXECUTE FUNCTION update_article_timestamp();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profili_redattori ENABLE ROW LEVEL SECURITY;
ALTER TABLE articoli ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_followers ENABLE ROW LEVEL SECURITY;

-- Profiles: Public read, users can update own
CREATE POLICY "Profiles are viewable by everyone" ON profili_redattori
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profili_redattori
    FOR UPDATE USING (auth.uid() = id);

-- Articles: Published articles viewable by everyone
CREATE POLICY "Published articles are viewable by everyone" ON articoli
    FOR SELECT USING (stato = 'pubblicato' OR autore_id = auth.uid());

CREATE POLICY "Users can create own articles" ON articoli
    FOR INSERT WITH CHECK (autore_id = auth.uid());

CREATE POLICY "Users can update own articles" ON articoli
    FOR UPDATE USING (autore_id = auth.uid());

CREATE POLICY "Users can delete own articles" ON articoli
    FOR DELETE USING (autore_id = auth.uid());

-- Comments: Approved comments viewable by everyone
CREATE POLICY "Approved comments are viewable" ON article_comments
    FOR SELECT USING (is_approved = true OR user_id = auth.uid());

CREATE POLICY "Authenticated users can create comments" ON article_comments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own comments" ON article_comments
    FOR UPDATE USING (user_id = auth.uid());

-- Bookmarks: Users can only see own bookmarks
CREATE POLICY "Users can view own bookmarks" ON article_bookmarks
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own bookmarks" ON article_bookmarks
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own bookmarks" ON article_bookmarks
    FOR DELETE USING (user_id = auth.uid());

-- Chat: Authenticated users can view and create
CREATE POLICY "Authenticated users can view chat" ON chat_messages
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can send messages" ON chat_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User Preferences: Users can only access own preferences
CREATE POLICY "Users can view own preferences" ON user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Reading History: Users can only access own history
CREATE POLICY "Users can view own reading history" ON reading_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create reading history" ON reading_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User Followers: Public read, users manage own follows
CREATE POLICY "Followers are viewable by everyone" ON user_followers
    FOR SELECT USING (true);

CREATE POLICY "Users can follow others" ON user_followers
    FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow" ON user_followers
    FOR DELETE USING (auth.uid() = follower_id);

-- ============================================
-- INITIAL DATA (Optional)
-- ============================================

-- Insert default categories (you can customize these)
-- Note: This assumes you'll handle categories in your application logic
-- or create a separate categories table if needed

-- ============================================
-- COMPLETION MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ Database setup complete!';
    RAISE NOTICE '📝 Next steps:';
    RAISE NOTICE '1. Configure Supabase Auth email templates';
    RAISE NOTICE '2. Set up email provider (SMTP/SendGrid)';
    RAISE NOTICE '3. Configure redirect URLs for email confirmation';
    RAISE NOTICE '4. Update your js/config.js with Supabase credentials';
END $$;
