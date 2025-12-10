-- ============================================
-- ADVANCED FEATURES DATABASE SETUP
-- For ilGiornaleScolastico2.0
-- ============================================
-- This script creates all necessary tables, triggers, and policies
-- for the advanced features: reporting system, single-session, etc.
-- ============================================

-- ============================================
-- PART 1: REPORTING SYSTEM
-- ============================================

-- Article Reports Table
CREATE TABLE IF NOT EXISTS article_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES articoli(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL CHECK (reason IN ('spam', 'offensive', 'inappropriate', 'misinformation', 'other')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
    
    -- Prevent duplicate reports from same user
    UNIQUE(article_id, reporter_id)
);

-- Message Reports Table  
CREATE TABLE IF NOT EXISTS message_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL CHECK (reason IN ('spam', 'offensive', 'inappropriate', 'harassment', 'other')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
    
    -- Prevent duplicate reports from same user
    UNIQUE(message_id, reporter_id)
);

-- Suspended Articles Table
CREATE TABLE IF NOT EXISTS suspended_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL UNIQUE REFERENCES articoli(id) ON DELETE CASCADE,
    suspended_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    suspended_by TEXT DEFAULT 'auto' CHECK (suspended_by IN ('auto', 'admin')),
    reason TEXT,
    is_immune BOOLEAN DEFAULT FALSE,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Suspended Messages Table
CREATE TABLE IF NOT EXISTS suspended_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL UNIQUE REFERENCES chat_messages(id) ON DELETE CASCADE,
    suspended_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    suspended_by TEXT DEFAULT 'auto' CHECK (suspended_by IN ('auto', 'admin')),
    reason TEXT,
    is_immune BOOLEAN DEFAULT FALSE,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- PART 2: AUTO-SUSPENSION TRIGGERS
-- ============================================

-- Function to check and auto-suspend articles
CREATE OR REPLACE FUNCTION check_article_suspension()
RETURNS TRIGGER AS $$
DECLARE
    report_count INT;
    is_already_suspended BOOLEAN;
    is_immune_article BOOLEAN;
BEGIN
    -- Check if article is already suspended or immune
    SELECT EXISTS(SELECT 1 FROM suspended_articles WHERE article_id = NEW.article_id) INTO is_already_suspended;
    SELECT COALESCE(is_immune, FALSE) FROM suspended_articles WHERE article_id = NEW.article_id INTO is_immune_article;
    
    -- If already suspended or immune, skip
    IF is_already_suspended AND is_immune_article THEN
        RETURN NEW;
    END IF;
    
    -- Count distinct reporters
    SELECT COUNT(DISTINCT reporter_id) 
    FROM article_reports 
    WHERE article_id = NEW.article_id AND status = 'pending'
    INTO report_count;
    
    -- If 3 or more unique reports, auto-suspend
    IF report_count >= 3 AND NOT is_already_suspended THEN
        INSERT INTO suspended_articles (article_id, suspended_by, reason)
        VALUES (NEW.article_id, 'auto', 'Automatically suspended due to 3+ reports')
        ON CONFLICT (article_id) DO NOTHING;
        
        -- Mark article as suspended in articoli table if column exists
        -- UPDATE articoli SET is_suspended = TRUE WHERE id = NEW.article_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check and auto-suspend messages
CREATE OR REPLACE FUNCTION check_message_suspension()
RETURNS TRIGGER AS $$
DECLARE
    report_count INT;
    is_already_suspended BOOLEAN;
    is_immune_message BOOLEAN;
BEGIN
    -- Check if message is already suspended or immune
    SELECT EXISTS(SELECT 1 FROM suspended_messages WHERE message_id = NEW.message_id) INTO is_already_suspended;
    SELECT COALESCE(is_immune, FALSE) FROM suspended_messages WHERE message_id = NEW.message_id INTO is_immune_message;
    
    -- If already suspended or immune, skip
    IF is_already_suspended AND is_immune_message THEN
        RETURN NEW;
    END IF;
    
    -- Count distinct reporters
    SELECT COUNT(DISTINCT reporter_id) 
    FROM message_reports 
    WHERE message_id = NEW.message_id AND status = 'pending'
    INTO report_count;
    
    -- If 3 or more unique reports, auto-suspend
    IF report_count >= 3 AND NOT is_already_suspended THEN
        INSERT INTO suspended_messages (message_id, suspended_by, reason)
        VALUES (NEW.message_id, 'auto', 'Automatically suspended due to 3+ reports')
        ON CONFLICT (message_id) DO NOTHING;
        
        -- Mark message as suspended in chat_messages table if column exists
        -- UPDATE chat_messages SET is_suspended = TRUE WHERE id = NEW.message_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_check_article_suspension ON article_reports;
CREATE TRIGGER trigger_check_article_suspension
    AFTER INSERT ON article_reports
    FOR EACH ROW
    EXECUTE FUNCTION check_article_suspension();

DROP TRIGGER IF EXISTS trigger_check_message_suspension ON message_reports;
CREATE TRIGGER trigger_check_message_suspension
    AFTER INSERT ON message_reports
    FOR EACH ROW
    EXECUTE FUNCTION check_message_suspension();

-- ============================================
-- PART 3: SINGLE SESSION SYSTEM
-- ============================================

-- User Sessions Table
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_agent TEXT,
    ip_address TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

-- Function to invalidate all other sessions
CREATE OR REPLACE FUNCTION invalidate_other_sessions(
    p_user_id UUID,
    p_current_session_token TEXT
)
RETURNS VOID AS $$
BEGIN
    UPDATE user_sessions
    SET is_active = FALSE
    WHERE user_id = p_user_id 
    AND session_token != p_current_session_token
    AND is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old inactive sessions (run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS VOID AS $$
BEGIN
    DELETE FROM user_sessions
    WHERE last_activity < NOW() - INTERVAL '7 days'
    OR (is_active = FALSE AND created_at < NOW() - INTERVAL '1 day');
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 4: RLS POLICIES
-- ============================================

-- Enable RLS on all new tables
ALTER TABLE article_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE suspended_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE suspended_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Article Reports Policies
CREATE POLICY "Users can create article reports" ON article_reports
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view own article reports" ON article_reports
    FOR SELECT
    TO authenticated
    USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all article reports" ON article_reports
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profili_utenti
            WHERE auth_id = auth.uid()
            AND ruolo IN ('caporedattore', 'docente')
        )
    );

CREATE POLICY "Admins can update article reports" ON article_reports
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profili_utenti
            WHERE auth_id = auth.uid()
            AND ruolo IN ('caporedattore', 'docente')
        )
    );

-- Message Reports Policies (similar to article reports)
CREATE POLICY "Users can create message reports" ON message_reports
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view own message reports" ON message_reports
    FOR SELECT
    TO authenticated
    USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all message reports" ON message_reports
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profili_utenti
            WHERE auth_id = auth.uid()
            AND ruolo IN ('caporedattore', 'docente')
        )
    );

CREATE POLICY "Admins can update message reports" ON message_reports
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profili_utenti
            WHERE auth_id = auth.uid()
            AND ruolo IN ('caporedattore', 'docente')
        )
    );

-- Suspended Articles Policies
CREATE POLICY "Anyone can view suspended articles" ON suspended_articles
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Only admins can manage suspended articles" ON suspended_articles
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profili_utenti
            WHERE auth_id = auth.uid()
            AND ruolo IN ('caporedattore', 'docente')
        )
    );

-- Suspended Messages Policies
CREATE POLICY "Anyone can view suspended messages" ON suspended_messages
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Only admins can manage suspended messages" ON suspended_messages
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profili_utenti
            WHERE auth_id = auth.uid()
            AND ruolo IN ('caporedattore', 'docente')
        )
    );

-- User Sessions Policies
CREATE POLICY "Users can view own sessions" ON user_sessions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON user_sessions
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON user_sessions
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON user_sessions
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- ============================================
-- PART 5: HELPER VIEWS
-- ============================================

-- View for article report counts
CREATE OR REPLACE VIEW article_report_counts AS
SELECT 
    article_id,
    COUNT(DISTINCT reporter_id) as unique_reporters,
    COUNT(*) as total_reports,
    MAX(created_at) as last_report_at,
    BOOL_OR(status = 'pending') as has_pending
FROM article_reports
GROUP BY article_id;

-- View for message report counts
CREATE OR REPLACE VIEW message_report_counts AS
SELECT 
    message_id,
    COUNT(DISTINCT reporter_id) as unique_reporters,
    COUNT(*) as total_reports,
    MAX(created_at) as last_report_at,
    BOOL_OR(status = 'pending') as has_pending
FROM message_reports
GROUP BY message_id;

-- ============================================
-- PART 6: INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_article_reports_article_id ON article_reports(article_id);
CREATE INDEX IF NOT EXISTS idx_article_reports_reporter_id ON article_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_article_reports_status ON article_reports(status);

CREATE INDEX IF NOT EXISTS idx_message_reports_message_id ON message_reports(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reports_reporter_id ON message_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_message_reports_status ON message_reports(status);

CREATE INDEX IF NOT EXISTS idx_suspended_articles_article_id ON suspended_articles(article_id);
CREATE INDEX IF NOT EXISTS idx_suspended_messages_message_id ON suspended_messages(message_id);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON user_sessions(last_activity);

-- ============================================
-- PART 7: OPTIONAL COLUMNS TO ADD TO EXISTING TABLES
-- ============================================

-- Add is_suspended flag to articoli table (optional, for faster queries)
-- ALTER TABLE articoli ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE;
-- CREATE INDEX IF NOT EXISTS idx_articoli_is_suspended ON articoli(is_suspended);

-- Add is_suspended flag to chat_messages table (optional)
-- ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE;
-- CREATE INDEX IF NOT EXISTS idx_chat_messages_is_suspended ON chat_messages(is_suspended);

-- Add is_edited flag to chat_messages table
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE;

-- ============================================
-- SETUP COMPLETE
-- ============================================

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT ALL ON article_reports TO authenticated;
-- GRANT ALL ON message_reports TO authenticated;
-- GRANT ALL ON suspended_articles TO authenticated;
-- GRANT ALL ON suspended_messages TO authenticated;
-- GRANT ALL ON user_sessions TO authenticated;

-- You can now use these tables and functions in your application!
