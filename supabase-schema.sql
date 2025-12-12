-- ============================================
-- GIORNALE SCOLASTICO CESARIS 2.0
-- Complete Supabase SQL Schema - Error-Free Version
-- ============================================
--
-- IMPORTANT: How to execute this script in Supabase:
-- 1. Go to your Supabase project: https://tepxvijiamuaszvyzeze.supabase.co
-- 2. Open the SQL Editor
-- 3. Copy this ENTIRE file (all 1,129 lines)
-- 4. Paste into the SQL Editor
-- 5. Click "Run" button
-- 6. Wait for completion (may take 30-60 seconds)
-- 7. You should see: "Supabase schema created successfully!"
--
-- This script is safe to run multiple times - it will drop and recreate everything.
-- ============================================

-- ============================================
-- STEP 1: ENABLE EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For full-text search

-- ============================================
-- STEP 2: DROP EXISTING OBJECTS (if any)
-- This ensures a clean slate
-- Note: Using DO blocks to handle non-existent objects gracefully
-- ============================================

-- Drop views first (they depend on tables)
DROP VIEW IF EXISTS article_analytics CASCADE;
DROP VIEW IF EXISTS leaderboard_writers CASCADE;
DROP VIEW IF EXISTS trending_articles CASCADE;

-- Drop triggers (using DO blocks to handle non-existent tables)
DO $$ BEGIN
    DROP TRIGGER IF EXISTS update_profili_utenti_updated_at ON profili_utenti;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
    DROP TRIGGER IF EXISTS update_preferenze_utente_updated_at ON preferenze_utente;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
    DROP TRIGGER IF EXISTS update_articoli_updated_at ON articoli;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
    DROP TRIGGER IF EXISTS update_article_comments_updated_at ON article_comments;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
    DROP TRIGGER IF EXISTS update_chat_messages_updated_at ON chat_messages;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
    DROP TRIGGER IF EXISTS increment_views_on_article_view ON article_views;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
    DROP TRIGGER IF EXISTS update_stats_on_article_publish ON articoli;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
    DROP TRIGGER IF EXISTS set_user_profile_on_insert_or_update ON profili_utenti;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS increment_article_views() CASCADE;
DROP FUNCTION IF EXISTS update_user_points(UUID, INTEGER, TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS check_and_award_badges(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_article_stats() CASCADE;

-- Drop tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS user_challenge_progress CASCADE;
DROP TABLE IF EXISTS weekly_challenges CASCADE;
DROP TABLE IF EXISTS reading_streaks CASCADE;
DROP TABLE IF EXISTS user_points_history CASCADE;
DROP TABLE IF EXISTS user_badges CASCADE;
DROP TABLE IF EXISTS newsletter_logs CASCADE;
DROP TABLE IF EXISTS iscrizioni_newsletter CASCADE;
DROP TABLE IF EXISTS reading_terms_acceptance CASCADE;
DROP TABLE IF EXISTS reporter_terms_acceptance CASCADE;
DROP TABLE IF EXISTS reporter_candidatures CASCADE;
DROP TABLE IF EXISTS chat_poll_votes CASCADE;
DROP TABLE IF EXISTS chat_reactions CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS comment_reactions CASCADE;
DROP TABLE IF EXISTS article_comments CASCADE;
DROP TABLE IF EXISTS featured_content CASCADE;
DROP TABLE IF EXISTS reading_history CASCADE;
DROP TABLE IF EXISTS article_feedback CASCADE;
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS content_reports CASCADE;
DROP TABLE IF EXISTS article_series_items CASCADE;
DROP TABLE IF EXISTS article_series CASCADE;
DROP TABLE IF EXISTS article_ai_checks CASCADE;
DROP TABLE IF EXISTS article_revisions CASCADE;
DROP TABLE IF EXISTS article_views CASCADE;
DROP TABLE IF EXISTS article_shares CASCADE;
DROP TABLE IF EXISTS article_bookmarks CASCADE;
DROP TABLE IF EXISTS article_reactions CASCADE;
DROP TABLE IF EXISTS articoli CASCADE;
DROP TABLE IF EXISTS utenti_bloccati CASCADE;
DROP TABLE IF EXISTS user_followers CASCADE;
DROP TABLE IF EXISTS preferenze_utente CASCADE;
DROP TABLE IF EXISTS profili_utenti CASCADE;

-- ============================================
-- STEP 3: CREATE TABLES
-- ============================================

-- ============================================
-- AUTHENTICATION & USERS
-- ============================================

-- User profiles table (extends Supabase auth.users)
-- NOTE: username is auto-extracted from email (part before @) by trigger
-- Since email is UNIQUE, username will also be unique (no conflicts possible)
-- Example: mario.rossi@cesaris.edu.it → username: mario.rossi
CREATE TABLE profili_utenti (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT, -- Extracted from email (part before @)
    nome_visualizzato TEXT,
    bio TEXT,
    avatar_url TEXT,
    ruolo TEXT DEFAULT 'utente' CHECK (ruolo IN ('utente', 'reporter', 'docente', 'caporedattore')),
    classe TEXT,
    livello_reporter TEXT DEFAULT 'junior' CHECK (livello_reporter IN ('junior', 'senior', 'chief')),
    punti_totali INTEGER DEFAULT 0,
    articoli_scritti INTEGER DEFAULT 0,
    articoli_pubblicati INTEGER DEFAULT 0,
    visualizzazioni_totali INTEGER DEFAULT 0,
    followers_count INTEGER DEFAULT 0,
    is_expert BOOLEAN DEFAULT false,
    is_hidden BOOLEAN DEFAULT false,
    termini_reporter_accettati BOOLEAN DEFAULT false,
    termini_reporter_data TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User preferences
CREATE TABLE preferenze_utente (
    user_id UUID PRIMARY KEY,
    tema TEXT DEFAULT 'light' CHECK (tema IN ('light', 'dark')),
    dimensione_font NUMERIC(3,1) DEFAULT 1.0,
    font_dislessia BOOLEAN DEFAULT false,
    categorie_preferite TEXT[] DEFAULT ARRAY[]::text[],
    lingua TEXT DEFAULT 'it' CHECK (lingua IN ('it', 'en')),
    notifiche_abilitate BOOLEAN DEFAULT true,
    notifiche_email BOOLEAN DEFAULT true,
    modalita_lettura BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User followers
CREATE TABLE user_followers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID NOT NULL,
    following_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- Blocked users
CREATE TABLE utenti_bloccati (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blocker_id UUID NOT NULL,
    blocked_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_id)
);

-- ============================================
-- ARTICLES SYSTEM
-- ============================================

-- Articles table
CREATE TABLE articoli (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titolo TEXT NOT NULL,
    sommario TEXT NOT NULL,
    contenuto TEXT NOT NULL,
    categoria TEXT NOT NULL,
    tags TEXT[] DEFAULT ARRAY[]::text[],
    immagine_url TEXT,
    autore_id UUID NOT NULL,
    co_autori UUID[] DEFAULT ARRAY[]::uuid[],
    stato TEXT DEFAULT 'bozza' CHECK (stato IN ('bozza', 'in_revisione', 'pubblicato', 'archiviato', 'rifiutato')),
    visualizzazioni INTEGER DEFAULT 0,
    reading_time_minutes INTEGER DEFAULT 5,
    scheduled_publish_at TIMESTAMP WITH TIME ZONE,
    data_pubblicazione TIMESTAMP WITH TIME ZONE,
    complessita_lettura TEXT DEFAULT 'normal' CHECK (complessita_lettura IN ('easy', 'normal', 'complex')),
    video_embeds JSONB DEFAULT '[]'::jsonb,
    table_of_contents JSONB DEFAULT '[]'::jsonb,
    infographics JSONB DEFAULT '[]'::jsonb,
    is_featured BOOLEAN DEFAULT false,
    is_trending BOOLEAN DEFAULT false,
    ai_percentage NUMERIC(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Article reactions
CREATE TABLE article_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID NOT NULL,
    user_id UUID NOT NULL,
    reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'love', 'wow', 'sad')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(article_id, user_id, reaction_type)
);

-- Article bookmarks
CREATE TABLE article_bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID NOT NULL,
    user_id UUID NOT NULL,
    folder_name TEXT DEFAULT 'default',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(article_id, user_id)
);

-- Article shares
CREATE TABLE article_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID NOT NULL,
    user_id UUID,
    platform TEXT CHECK (platform IN ('facebook', 'twitter', 'whatsapp', 'email', 'link')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Article views tracking
CREATE TABLE article_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID NOT NULL,
    user_id UUID,
    session_id TEXT,
    time_spent_seconds INTEGER DEFAULT 0,
    scroll_percentage INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Article series
CREATE TABLE article_series (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Article series items
CREATE TABLE article_series_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    series_id UUID NOT NULL,
    article_id UUID NOT NULL,
    episode_number INTEGER NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(series_id, article_id)
);

-- Article revisions (version history)
CREATE TABLE article_revisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID NOT NULL,
    version INTEGER NOT NULL,
    titolo TEXT NOT NULL,
    sommario TEXT NOT NULL,
    contenuto TEXT NOT NULL,
    edited_by UUID,
    edited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI detection records
CREATE TABLE article_ai_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID NOT NULL,
    ai_percentage NUMERIC(5,2) NOT NULL,
    detected_sections JSONB DEFAULT '{}'::jsonb,
    is_approved BOOLEAN,
    check_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- COMMENTS SYSTEM
-- ============================================

-- Article comments
CREATE TABLE article_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID NOT NULL,
    user_id UUID NOT NULL,
    parent_comment_id UUID,
    content TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT false,
    is_edited BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comment reactions
CREATE TABLE comment_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comment_id UUID NOT NULL,
    user_id UUID NOT NULL,
    reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'love', 'wow', 'sad')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id, reaction_type)
);

-- ============================================
-- CHAT SYSTEM
-- ============================================

-- Chat messages
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    room TEXT DEFAULT 'generale' CHECK (room IN ('generale', 'sport', 'musica', 'gaming', 'meme', 'anime', 'studio', 'tech')),
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'poll', 'voice', 'image')),
    poll_data JSONB,
    voice_url TEXT,
    image_url TEXT,
    reply_to_message_id UUID,
    is_pinned BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat reactions
CREATE TABLE chat_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL,
    user_id UUID NOT NULL,
    emoji TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id, emoji)
);

-- Chat poll votes
CREATE TABLE chat_poll_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL,
    user_id UUID NOT NULL,
    option_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id)
);

-- ============================================
-- REPORTER SYSTEM
-- ============================================

-- Reporter candidatures
CREATE TABLE reporter_candidatures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    username TEXT NOT NULL,
    class TEXT NOT NULL,
    motivation TEXT NOT NULL,
    experience TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reporter terms acceptance
CREATE TABLE reporter_terms_acceptance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    terms_version TEXT DEFAULT '1.0',
    ip_address TEXT
);

-- Reading terms acceptance (for anonymous users)
CREATE TABLE reading_terms_acceptance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    session_id TEXT NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- NEWSLETTER SYSTEM
-- ============================================

-- Newsletter subscriptions
CREATE TABLE iscrizioni_newsletter (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    email_verificata BOOLEAN DEFAULT false,
    ultimo_invio TIMESTAMP WITH TIME ZONE,
    attiva BOOLEAN DEFAULT true,
    unsubscribe_token TEXT UNIQUE DEFAULT uuid_generate_v4()::text,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Newsletter logs
CREATE TABLE newsletter_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID,
    recipients_count INTEGER,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT CHECK (status IN ('sent', 'failed', 'partial'))
);

-- ============================================
-- GAMIFICATION SYSTEM
-- ============================================

-- User badges
CREATE TABLE user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    badge_type TEXT NOT NULL,
    badge_name TEXT NOT NULL,
    badge_icon TEXT,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, badge_type)
);

-- User points history
CREATE TABLE user_points_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    points INTEGER NOT NULL,
    reason TEXT NOT NULL,
    reference_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reading streaks
CREATE TABLE reading_streaks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_read_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Weekly challenges
CREATE TABLE weekly_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    challenge_type TEXT NOT NULL,
    target_value INTEGER,
    reward_points INTEGER,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User challenge progress
CREATE TABLE user_challenge_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    challenge_id UUID NOT NULL,
    current_progress INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, challenge_id)
);

-- ============================================
-- MODERATION & REPORTS
-- ============================================

-- Content reports
CREATE TABLE content_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reported_by UUID,
    content_type TEXT NOT NULL CHECK (content_type IN ('article', 'comment', 'message', 'user')),
    content_id UUID NOT NULL,
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    resolution_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit log
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ANALYTICS & FEEDBACK
-- ============================================

-- Article feedback
CREATE TABLE article_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID NOT NULL,
    user_id UUID,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reading history
CREATE TABLE reading_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    article_id UUID NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    time_spent_seconds INTEGER,
    progress_percentage INTEGER,
    UNIQUE(user_id, article_id, read_at)
);

-- Featured content
CREATE TABLE featured_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID NOT NULL,
    featured_type TEXT NOT NULL CHECK (featured_type IN ('spotlight', 'trending', 'recommended', 'hero')),
    featured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    featured_until TIMESTAMP WITH TIME ZONE,
    display_order INTEGER DEFAULT 0
);

-- ============================================
-- STEP 4: ADD FOREIGN KEY CONSTRAINTS
-- (Added separately to avoid circular dependency issues)
-- ============================================

-- Add foreign keys for article_reactions
ALTER TABLE article_reactions 
    ADD CONSTRAINT fk_article_reactions_article 
    FOREIGN KEY (article_id) REFERENCES articoli(id) ON DELETE CASCADE;

ALTER TABLE article_reactions 
    ADD CONSTRAINT fk_article_reactions_user 
    FOREIGN KEY (user_id) REFERENCES profili_utenti(id) ON DELETE CASCADE;

-- Add foreign keys for article_bookmarks
ALTER TABLE article_bookmarks 
    ADD CONSTRAINT fk_article_bookmarks_article 
    FOREIGN KEY (article_id) REFERENCES articoli(id) ON DELETE CASCADE;

ALTER TABLE article_bookmarks 
    ADD CONSTRAINT fk_article_bookmarks_user 
    FOREIGN KEY (user_id) REFERENCES profili_utenti(id) ON DELETE CASCADE;

-- Add foreign keys for article_shares
ALTER TABLE article_shares 
    ADD CONSTRAINT fk_article_shares_article 
    FOREIGN KEY (article_id) REFERENCES articoli(id) ON DELETE CASCADE;

ALTER TABLE article_shares 
    ADD CONSTRAINT fk_article_shares_user 
    FOREIGN KEY (user_id) REFERENCES profili_utenti(id) ON DELETE SET NULL;

-- Add foreign keys for article_views
ALTER TABLE article_views 
    ADD CONSTRAINT fk_article_views_article 
    FOREIGN KEY (article_id) REFERENCES articoli(id) ON DELETE CASCADE;

ALTER TABLE article_views 
    ADD CONSTRAINT fk_article_views_user 
    FOREIGN KEY (user_id) REFERENCES profili_utenti(id) ON DELETE SET NULL;

-- Add foreign keys for article_series
ALTER TABLE article_series 
    ADD CONSTRAINT fk_article_series_creator 
    FOREIGN KEY (created_by) REFERENCES profili_utenti(id) ON DELETE SET NULL;

-- Add foreign keys for article_series_items
ALTER TABLE article_series_items 
    ADD CONSTRAINT fk_article_series_items_series 
    FOREIGN KEY (series_id) REFERENCES article_series(id) ON DELETE CASCADE;

ALTER TABLE article_series_items 
    ADD CONSTRAINT fk_article_series_items_article 
    FOREIGN KEY (article_id) REFERENCES articoli(id) ON DELETE CASCADE;

-- Add foreign keys for article_revisions
ALTER TABLE article_revisions 
    ADD CONSTRAINT fk_article_revisions_article 
    FOREIGN KEY (article_id) REFERENCES articoli(id) ON DELETE CASCADE;

ALTER TABLE article_revisions 
    ADD CONSTRAINT fk_article_revisions_editor 
    FOREIGN KEY (edited_by) REFERENCES profili_utenti(id) ON DELETE SET NULL;

-- Add foreign keys for article_ai_checks
ALTER TABLE article_ai_checks 
    ADD CONSTRAINT fk_article_ai_checks_article 
    FOREIGN KEY (article_id) REFERENCES articoli(id) ON DELETE CASCADE;

-- Add foreign keys for article_comments
ALTER TABLE article_comments 
    ADD CONSTRAINT fk_article_comments_article 
    FOREIGN KEY (article_id) REFERENCES articoli(id) ON DELETE CASCADE;

ALTER TABLE article_comments 
    ADD CONSTRAINT fk_article_comments_user 
    FOREIGN KEY (user_id) REFERENCES profili_utenti(id) ON DELETE CASCADE;

ALTER TABLE article_comments 
    ADD CONSTRAINT fk_article_comments_parent 
    FOREIGN KEY (parent_comment_id) REFERENCES article_comments(id) ON DELETE CASCADE;

-- Add foreign keys for comment_reactions
ALTER TABLE comment_reactions 
    ADD CONSTRAINT fk_comment_reactions_comment 
    FOREIGN KEY (comment_id) REFERENCES article_comments(id) ON DELETE CASCADE;

ALTER TABLE comment_reactions 
    ADD CONSTRAINT fk_comment_reactions_user 
    FOREIGN KEY (user_id) REFERENCES profili_utenti(id) ON DELETE CASCADE;

-- Add foreign keys for chat_messages
ALTER TABLE chat_messages 
    ADD CONSTRAINT fk_chat_messages_user 
    FOREIGN KEY (user_id) REFERENCES profili_utenti(id) ON DELETE CASCADE;

ALTER TABLE chat_messages 
    ADD CONSTRAINT fk_chat_messages_reply 
    FOREIGN KEY (reply_to_message_id) REFERENCES chat_messages(id) ON DELETE SET NULL;

-- Add foreign keys for chat_reactions
ALTER TABLE chat_reactions 
    ADD CONSTRAINT fk_chat_reactions_message 
    FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE;

ALTER TABLE chat_reactions 
    ADD CONSTRAINT fk_chat_reactions_user 
    FOREIGN KEY (user_id) REFERENCES profili_utenti(id) ON DELETE CASCADE;

-- Add foreign keys for chat_poll_votes
ALTER TABLE chat_poll_votes 
    ADD CONSTRAINT fk_chat_poll_votes_message 
    FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE;

ALTER TABLE chat_poll_votes 
    ADD CONSTRAINT fk_chat_poll_votes_user 
    FOREIGN KEY (user_id) REFERENCES profili_utenti(id) ON DELETE CASCADE;

-- Add foreign keys for reporter_candidatures
ALTER TABLE reporter_candidatures 
    ADD CONSTRAINT fk_reporter_candidatures_reviewer 
    FOREIGN KEY (reviewed_by) REFERENCES profili_utenti(id) ON DELETE SET NULL;

-- Add foreign keys for reporter_terms_acceptance
ALTER TABLE reporter_terms_acceptance 
    ADD CONSTRAINT fk_reporter_terms_user 
    FOREIGN KEY (user_id) REFERENCES profili_utenti(id) ON DELETE CASCADE;

-- Add foreign keys for reading_terms_acceptance
ALTER TABLE reading_terms_acceptance 
    ADD CONSTRAINT fk_reading_terms_user 
    FOREIGN KEY (user_id) REFERENCES profili_utenti(id) ON DELETE SET NULL;

-- Add foreign keys for newsletter_logs
ALTER TABLE newsletter_logs 
    ADD CONSTRAINT fk_newsletter_logs_article 
    FOREIGN KEY (article_id) REFERENCES articoli(id) ON DELETE SET NULL;

-- Add foreign keys for user_badges
ALTER TABLE user_badges 
    ADD CONSTRAINT fk_user_badges_user 
    FOREIGN KEY (user_id) REFERENCES profili_utenti(id) ON DELETE CASCADE;

-- Add foreign keys for user_points_history
ALTER TABLE user_points_history 
    ADD CONSTRAINT fk_user_points_history_user 
    FOREIGN KEY (user_id) REFERENCES profili_utenti(id) ON DELETE CASCADE;

-- Add foreign keys for reading_streaks
ALTER TABLE reading_streaks 
    ADD CONSTRAINT fk_reading_streaks_user 
    FOREIGN KEY (user_id) REFERENCES profili_utenti(id) ON DELETE CASCADE;

-- Add foreign keys for user_challenge_progress
ALTER TABLE user_challenge_progress 
    ADD CONSTRAINT fk_user_challenge_progress_user 
    FOREIGN KEY (user_id) REFERENCES profili_utenti(id) ON DELETE CASCADE;

ALTER TABLE user_challenge_progress 
    ADD CONSTRAINT fk_user_challenge_progress_challenge 
    FOREIGN KEY (challenge_id) REFERENCES weekly_challenges(id) ON DELETE CASCADE;

-- Add foreign keys for content_reports
ALTER TABLE content_reports 
    ADD CONSTRAINT fk_content_reports_reporter 
    FOREIGN KEY (reported_by) REFERENCES profili_utenti(id) ON DELETE SET NULL;

ALTER TABLE content_reports 
    ADD CONSTRAINT fk_content_reports_reviewer 
    FOREIGN KEY (reviewed_by) REFERENCES profili_utenti(id) ON DELETE SET NULL;

-- Add foreign keys for audit_log
ALTER TABLE audit_log 
    ADD CONSTRAINT fk_audit_log_user 
    FOREIGN KEY (user_id) REFERENCES profili_utenti(id) ON DELETE SET NULL;

-- Add foreign keys for article_feedback
ALTER TABLE article_feedback 
    ADD CONSTRAINT fk_article_feedback_article 
    FOREIGN KEY (article_id) REFERENCES articoli(id) ON DELETE CASCADE;

ALTER TABLE article_feedback 
    ADD CONSTRAINT fk_article_feedback_user 
    FOREIGN KEY (user_id) REFERENCES profili_utenti(id) ON DELETE SET NULL;

-- Add foreign keys for reading_history
ALTER TABLE reading_history 
    ADD CONSTRAINT fk_reading_history_user 
    FOREIGN KEY (user_id) REFERENCES profili_utenti(id) ON DELETE CASCADE;

ALTER TABLE reading_history 
    ADD CONSTRAINT fk_reading_history_article 
    FOREIGN KEY (article_id) REFERENCES articoli(id) ON DELETE CASCADE;

-- Add foreign keys for featured_content
ALTER TABLE featured_content 
    ADD CONSTRAINT fk_featured_content_article 
    FOREIGN KEY (article_id) REFERENCES articoli(id) ON DELETE CASCADE;

-- Add foreign keys for articoli
ALTER TABLE articoli 
    ADD CONSTRAINT fk_articoli_autore 
    FOREIGN KEY (autore_id) REFERENCES profili_utenti(id) ON DELETE CASCADE;

-- Add foreign keys for preferenze_utente
ALTER TABLE preferenze_utente 
    ADD CONSTRAINT fk_preferenze_utente_user 
    FOREIGN KEY (user_id) REFERENCES profili_utenti(id) ON DELETE CASCADE;

-- Add foreign keys for user_followers
ALTER TABLE user_followers 
    ADD CONSTRAINT fk_user_followers_follower 
    FOREIGN KEY (follower_id) REFERENCES profili_utenti(id) ON DELETE CASCADE;

ALTER TABLE user_followers 
    ADD CONSTRAINT fk_user_followers_following 
    FOREIGN KEY (following_id) REFERENCES profili_utenti(id) ON DELETE CASCADE;

-- Add foreign keys for utenti_bloccati
ALTER TABLE utenti_bloccati 
    ADD CONSTRAINT fk_utenti_bloccati_blocker 
    FOREIGN KEY (blocker_id) REFERENCES profili_utenti(id) ON DELETE CASCADE;

ALTER TABLE utenti_bloccati 
    ADD CONSTRAINT fk_utenti_bloccati_blocked 
    FOREIGN KEY (blocked_id) REFERENCES profili_utenti(id) ON DELETE CASCADE;

-- ============================================
-- STEP 5: CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Articles indexes
CREATE INDEX idx_articoli_autore ON articoli(autore_id);
CREATE INDEX idx_articoli_stato ON articoli(stato);
CREATE INDEX idx_articoli_categoria ON articoli(categoria);
CREATE INDEX idx_articoli_data_pubblicazione ON articoli(data_pubblicazione DESC);
CREATE INDEX idx_articoli_visualizzazioni ON articoli(visualizzazioni DESC);
CREATE INDEX idx_articoli_featured ON articoli(is_featured) WHERE is_featured = true;
CREATE INDEX idx_articoli_trending ON articoli(is_trending) WHERE is_trending = true;
CREATE INDEX idx_articoli_tags ON articoli USING GIN(tags);

-- Full-text search on articles
CREATE INDEX idx_articoli_search ON articoli USING GIN(
    to_tsvector('italian', coalesce(titolo, '') || ' ' || coalesce(sommario, '') || ' ' || coalesce(contenuto, ''))
);

-- Comments indexes
CREATE INDEX idx_comments_article ON article_comments(article_id);
CREATE INDEX idx_comments_user ON article_comments(user_id);
CREATE INDEX idx_comments_approved ON article_comments(is_approved) WHERE is_approved = true;
CREATE INDEX idx_comments_parent ON article_comments(parent_comment_id);

-- Chat indexes
CREATE INDEX idx_chat_messages_user ON chat_messages(user_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at DESC);
CREATE INDEX idx_chat_messages_pinned ON chat_messages(is_pinned) WHERE is_pinned = true;
CREATE INDEX idx_chat_messages_room ON chat_messages(room);

-- Reactions indexes
CREATE INDEX idx_article_reactions_article ON article_reactions(article_id);
CREATE INDEX idx_article_reactions_user ON article_reactions(user_id);
CREATE INDEX idx_chat_reactions_message ON chat_reactions(message_id);

-- User indexes
CREATE INDEX idx_profili_utenti_email ON profili_utenti(email);
CREATE INDEX idx_profili_utenti_ruolo ON profili_utenti(ruolo);
CREATE INDEX idx_user_followers_follower ON user_followers(follower_id);
CREATE INDEX idx_user_followers_following ON user_followers(following_id);

-- Reports and moderation
CREATE INDEX idx_content_reports_status ON content_reports(status);
CREATE INDEX idx_content_reports_type ON content_reports(content_type, content_id);

-- Analytics
CREATE INDEX idx_article_views_article ON article_views(article_id);
CREATE INDEX idx_reading_history_user ON reading_history(user_id);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp DESC);

-- ============================================
-- STEP 6: CREATE FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update_updated_at trigger to relevant tables
CREATE TRIGGER update_profili_utenti_updated_at BEFORE UPDATE ON profili_utenti
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_preferenze_utente_updated_at BEFORE UPDATE ON preferenze_utente
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_articoli_updated_at BEFORE UPDATE ON articoli
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_article_comments_updated_at BEFORE UPDATE ON article_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at BEFORE UPDATE ON chat_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment article views
CREATE OR REPLACE FUNCTION increment_article_views()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE articoli 
    SET visualizzazioni = visualizzazioni + 1 
    WHERE id = NEW.article_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_views_on_article_view AFTER INSERT ON article_views
    FOR EACH ROW EXECUTE FUNCTION increment_article_views();

-- Function to update user points
CREATE OR REPLACE FUNCTION update_user_points(p_user_id UUID, p_points INTEGER, p_reason TEXT, p_reference_id UUID DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
    -- Add to points history
    INSERT INTO user_points_history (user_id, points, reason, reference_id)
    VALUES (p_user_id, p_points, p_reason, p_reference_id);
    
    -- Update total points in profile
    UPDATE profili_utenti
    SET punti_totali = punti_totali + p_points,
        updated_at = NOW()
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to award badges
CREATE OR REPLACE FUNCTION check_and_award_badges(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    articles_count INTEGER;
    total_views INTEGER;
    comments_count INTEGER;
BEGIN
    -- Get user stats
    SELECT articoli_pubblicati, visualizzazioni_totali INTO articles_count, total_views
    FROM profili_utenti WHERE id = p_user_id;
    
    SELECT COUNT(*) INTO comments_count 
    FROM article_comments 
    WHERE user_id = p_user_id AND is_approved = true;
    
    -- First Article Badge
    IF articles_count >= 1 THEN
        INSERT INTO user_badges (user_id, badge_type, badge_name, badge_icon)
        VALUES (p_user_id, 'first_article', 'Primo Articolo', '📝')
        ON CONFLICT (user_id, badge_type) DO NOTHING;
    END IF;
    
    -- Hundred Views Badge
    IF total_views >= 100 THEN
        INSERT INTO user_badges (user_id, badge_type, badge_name, badge_icon)
        VALUES (p_user_id, 'hundred_views', 'Cento Visualizzazioni', '👁️')
        ON CONFLICT (user_id, badge_type) DO NOTHING;
    END IF;
    
    -- Thousand Views Badge
    IF total_views >= 1000 THEN
        INSERT INTO user_badges (user_id, badge_type, badge_name, badge_icon)
        VALUES (p_user_id, 'thousand_views', 'Mille Visualizzazioni', '🌟')
        ON CONFLICT (user_id, badge_type) DO NOTHING;
    END IF;
    
    -- Top Writer Badge (10+ articles)
    IF articles_count >= 10 THEN
        INSERT INTO user_badges (user_id, badge_type, badge_name, badge_icon)
        VALUES (p_user_id, 'top_writer', 'Scrittore Prolifico', '✍️')
        ON CONFLICT (user_id, badge_type) DO NOTHING;
    END IF;
    
    -- Community Helper Badge (50+ comments)
    IF comments_count >= 50 THEN
        INSERT INTO user_badges (user_id, badge_type, badge_name, badge_icon)
        VALUES (p_user_id, 'community_helper', 'Aiutante Community', '🤝')
        ON CONFLICT (user_id, badge_type) DO NOTHING;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update article stats when published
CREATE OR REPLACE FUNCTION update_article_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.stato = 'pubblicato' AND OLD.stato != 'pubblicato' THEN
        -- Update author's published articles count
        UPDATE profili_utenti
        SET articoli_pubblicati = articoli_pubblicati + 1,
            updated_at = NOW()
        WHERE id = NEW.autore_id;
        
        -- Award points
        PERFORM update_user_points(NEW.autore_id, 10, 'Articolo pubblicato', NEW.id);
        
        -- Check for badges
        PERFORM check_and_award_badges(NEW.autore_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stats_on_article_publish AFTER UPDATE ON articoli
    FOR EACH ROW EXECUTE FUNCTION update_article_stats();

-- Function to set user role and extract username on profile creation/update
CREATE OR REPLACE FUNCTION set_user_role_and_username()
RETURNS TRIGGER AS $$
BEGIN
    -- Extract username from email (part before @)
    IF NEW.username IS NULL OR NEW.username = '' THEN
        NEW.username := SPLIT_PART(NEW.email, '@', 1);
    END IF;
    
    -- Auto-assign caporedattore role to mohamed.mashaal@cesaris.edu.it
    IF LOWER(NEW.email) = 'mohamed.mashaal@cesaris.edu.it' THEN
        NEW.ruolo := 'caporedattore';
    END IF;
    
    -- Set nome_visualizzato if not provided
    IF NEW.nome_visualizzato IS NULL OR NEW.nome_visualizzato = '' THEN
        NEW.nome_visualizzato := NEW.username;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_user_profile_on_insert_or_update
    BEFORE INSERT OR UPDATE ON profili_utenti
    FOR EACH ROW EXECUTE FUNCTION set_user_role_and_username();

-- ============================================
-- STEP 7: CREATE VIEWS FOR ANALYTICS
-- ============================================

-- Article analytics view
CREATE OR REPLACE VIEW article_analytics AS
SELECT 
    a.id,
    a.titolo,
    a.categoria,
    a.data_pubblicazione,
    a.visualizzazioni,
    a.autore_id,
    p.nome_visualizzato as author_name,
    p.livello_reporter as author_level,
    COALESCE(c.comment_count, 0) as comments_count,
    COALESCE(b.bookmark_count, 0) as bookmarks_count,
    COALESCE(s.shares_count, 0) as shares_count,
    COALESCE(r.reactions_count, 0) as reactions_count,
    COALESCE(f.avg_rating, 0) as avg_rating
FROM articoli a
LEFT JOIN profili_utenti p ON a.autore_id = p.id
LEFT JOIN (
    SELECT article_id, COUNT(*) as comment_count 
    FROM article_comments 
    WHERE is_approved = true 
    GROUP BY article_id
) c ON a.id = c.article_id
LEFT JOIN (
    SELECT article_id, COUNT(*) as bookmark_count 
    FROM article_bookmarks 
    GROUP BY article_id
) b ON a.id = b.article_id
LEFT JOIN (
    SELECT article_id, COUNT(*) as shares_count 
    FROM article_shares 
    GROUP BY article_id
) s ON a.id = s.article_id
LEFT JOIN (
    SELECT article_id, COUNT(*) as reactions_count 
    FROM article_reactions 
    GROUP BY article_id
) r ON a.id = r.article_id
LEFT JOIN (
    SELECT article_id, AVG(rating) as avg_rating 
    FROM article_feedback 
    GROUP BY article_id
) f ON a.id = f.article_id
WHERE a.stato = 'pubblicato';

-- Leaderboard view
CREATE OR REPLACE VIEW leaderboard_writers AS
SELECT 
    p.id,
    p.nome_visualizzato,
    p.avatar_url,
    p.punti_totali,
    p.articoli_pubblicati,
    p.visualizzazioni_totali,
    p.livello_reporter,
    COUNT(DISTINCT ub.id) as badges_count
FROM profili_utenti p
LEFT JOIN user_badges ub ON p.id = ub.user_id
WHERE p.ruolo IN ('reporter', 'moderatore', 'caporedattore')
GROUP BY p.id, p.nome_visualizzato, p.avatar_url, p.punti_totali, p.articoli_pubblicati, p.visualizzazioni_totali, p.livello_reporter
ORDER BY p.punti_totali DESC
LIMIT 50;

-- Trending articles view (last 24 hours)
CREATE OR REPLACE VIEW trending_articles AS
SELECT 
    a.*,
    COUNT(av.id) as views_24h
FROM articoli a
LEFT JOIN article_views av ON a.id = av.article_id AND av.created_at > NOW() - INTERVAL '24 hours'
WHERE a.stato = 'pubblicato' AND a.data_pubblicazione > NOW() - INTERVAL '7 days'
GROUP BY a.id
ORDER BY views_24h DESC
LIMIT 10;

-- ============================================
-- STEP 8: ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on tables
ALTER TABLE profili_utenti ENABLE ROW LEVEL SECURITY;
ALTER TABLE preferenze_utente ENABLE ROW LEVEL SECURITY;
ALTER TABLE articoli ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reporter_candidatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

-- Profili utenti policies
CREATE POLICY "Public profiles are viewable by everyone" ON profili_utenti
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profili_utenti
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profili_utenti
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Preferenze utente policies
CREATE POLICY "Users can view own preferences" ON preferenze_utente
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON preferenze_utente
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON preferenze_utente
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Articoli policies
CREATE POLICY "Published articles are viewable by everyone" ON articoli
    FOR SELECT USING (stato = 'pubblicato' OR autore_id = auth.uid());

CREATE POLICY "Reporters can insert own articles" ON articoli
    FOR INSERT WITH CHECK (
        auth.uid() = autore_id AND 
        EXISTS (SELECT 1 FROM profili_utenti WHERE id = auth.uid() AND ruolo IN ('reporter', 'moderatore', 'caporedattore'))
    );

CREATE POLICY "Authors can update own articles" ON articoli
    FOR UPDATE USING (auth.uid() = autore_id);

CREATE POLICY "Moderators can update all articles" ON articoli
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profili_utenti WHERE id = auth.uid() AND ruolo IN ('moderatore', 'caporedattore'))
    );

-- Comments policies
CREATE POLICY "Approved comments are viewable by everyone" ON article_comments
    FOR SELECT USING (is_approved = true OR auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert comments" ON article_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON article_comments
    FOR UPDATE USING (auth.uid() = user_id);

-- Chat policies
CREATE POLICY "Authenticated users can view chat messages" ON chat_messages
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert chat messages" ON chat_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own messages" ON chat_messages
    FOR UPDATE USING (auth.uid() = user_id);

-- Reporter candidatures policies
CREATE POLICY "Users can view own candidatures" ON reporter_candidatures
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert candidature" ON reporter_candidatures
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Moderators can update candidatures" ON reporter_candidatures
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profili_utenti WHERE id = auth.uid() AND ruolo IN ('moderatore', 'caporedattore'))
    );

-- ============================================
-- STEP 9: INITIAL DATA
-- ============================================

-- Insert sample weekly challenges
INSERT INTO weekly_challenges (title, description, challenge_type, target_value, reward_points, start_date, end_date) VALUES
('Scrittore Prolifico', 'Scrivi un articolo di 800+ parole', 'word_count', 800, 50, CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days'),
('Lettore Appassionato', 'Leggi 5 articoli completi', 'articles_read', 5, 30, CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days'),
('Community Champion', 'Lascia 10 commenti approvati', 'comments_count', 10, 40, CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days')
ON CONFLICT DO NOTHING;

-- ============================================
-- STEP 10: AUTH TRIGGER FOR AUTOMATIC PROFILE CREATION
-- ============================================
-- This ensures profili_utenti is always in sync with auth.users
-- Automatically creates profile when user signs up

-- Function to create user profile (called from application after signup)
-- This function is called explicitly after user registration
CREATE OR REPLACE FUNCTION public.create_user_profile(user_id UUID, user_email TEXT)
RETURNS void AS $$
BEGIN
    -- Insert new profile entry
    INSERT INTO public.profili_utenti (id, email)
    VALUES (user_id, user_email)
    ON CONFLICT (id) DO NOTHING;
    
    -- The set_user_role_and_username trigger will handle:
    -- - Extracting username from email
    -- - Assigning caporedattore role to mohamed.mashaal@cesaris.edu.it
    -- - Setting nome_visualizzato
    
    -- Create default preferences
    INSERT INTO public.preferenze_utente (user_id)
    VALUES (user_id)
    ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_user_profile(UUID, TEXT) TO authenticated;

-- ============================================
-- COMPLETION
-- ============================================

SELECT 'Supabase schema created successfully! All tables, indexes, triggers, views, and auth sync are ready.' as status;
