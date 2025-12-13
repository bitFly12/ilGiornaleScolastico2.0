-- ============================================
-- FINAL COMPREHENSIVE FIX
-- Giornale Scolastico Cesaris
-- ============================================
-- 
-- This script fixes ALL remaining database issues:
-- 1. article_reactions - 406/400 errors
-- 2. article_comments - policies
-- 3. content_reports - for messages and users
-- 4. Auto-suspension after 3 reports
-- 5. chat_messages room column
--
-- Run this in Supabase SQL Editor.
--
-- ============================================

-- ============================================
-- 1. FIX article_reactions TABLE
-- ============================================

-- Ensure table exists with correct structure
DO $$
BEGIN
    -- Check if clap column exists (schema might use different reaction types)
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'article_reactions_reaction_type_check'
    ) THEN
        -- Drop old check constraint if exists
        ALTER TABLE article_reactions DROP CONSTRAINT IF EXISTS article_reactions_reaction_type_check;
    END IF;
EXCEPTION WHEN undefined_table THEN
    -- Table doesn't exist, create it
    CREATE TABLE article_reactions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        article_id UUID NOT NULL REFERENCES articoli(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES profili_utenti(id) ON DELETE CASCADE,
        reaction_type TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(article_id, user_id, reaction_type)
    );
END $$;

-- Enable RLS
ALTER TABLE article_reactions ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies first
DROP POLICY IF EXISTS "Anyone can view reactions" ON article_reactions;
DROP POLICY IF EXISTS "Users can create reactions" ON article_reactions;
DROP POLICY IF EXISTS "Users can update own reactions" ON article_reactions;
DROP POLICY IF EXISTS "Users can delete own reactions" ON article_reactions;
DROP POLICY IF EXISTS "Public read access for reactions" ON article_reactions;
DROP POLICY IF EXISTS "Authenticated insert reactions" ON article_reactions;
DROP POLICY IF EXISTS "Users delete own reactions" ON article_reactions;

-- Create fresh policies
CREATE POLICY "Public read access for reactions" ON article_reactions
    FOR SELECT USING (true);

CREATE POLICY "Authenticated insert reactions" ON article_reactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own reactions" ON article_reactions
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 2. FIX article_comments TABLE
-- ============================================

-- Enable RLS
ALTER TABLE article_comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view approved comments" ON article_comments;
DROP POLICY IF EXISTS "Approved comments are viewable by everyone" ON article_comments;
DROP POLICY IF EXISTS "Authenticated users can insert comments" ON article_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON article_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON article_comments;
DROP POLICY IF EXISTS "Admins can delete comments" ON article_comments;

-- Create fresh policies
CREATE POLICY "Anyone can view approved comments" ON article_comments
    FOR SELECT USING (is_approved = true OR auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert comments" ON article_comments
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own comments" ON article_comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON article_comments
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete comments" ON article_comments
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM profili_utenti WHERE id = auth.uid() AND ruolo IN ('caporedattore', 'docente'))
    );

-- ============================================
-- 3. FIX content_reports TABLE
-- ============================================

-- Add column for reported_user_id if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_reports' AND column_name = 'reported_user_id') THEN
        ALTER TABLE content_reports ADD COLUMN reported_user_id UUID REFERENCES profili_utenti(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add column for message_content to store reported message
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_reports' AND column_name = 'message_content') THEN
        ALTER TABLE content_reports ADD COLUMN message_content TEXT;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create reports" ON content_reports;
DROP POLICY IF EXISTS "Users can view own reports" ON content_reports;
DROP POLICY IF EXISTS "Admins can view all reports" ON content_reports;
DROP POLICY IF EXISTS "Admins can update reports" ON content_reports;
DROP POLICY IF EXISTS "Admins can delete reports" ON content_reports;

-- Create policies
CREATE POLICY "Users can create reports" ON content_reports
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view own reports" ON content_reports
    FOR SELECT USING (reported_by = auth.uid());

CREATE POLICY "Admins can view all reports" ON content_reports
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profili_utenti WHERE id = auth.uid() AND ruolo IN ('caporedattore', 'docente'))
    );

CREATE POLICY "Admins can update reports" ON content_reports
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profili_utenti WHERE id = auth.uid() AND ruolo IN ('caporedattore', 'docente'))
    );

CREATE POLICY "Admins can delete reports" ON content_reports
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM profili_utenti WHERE id = auth.uid() AND ruolo IN ('caporedattore', 'docente'))
    );

-- ============================================
-- 4. FIX articoli DELETE POLICIES
-- ============================================

-- Drop existing delete policies
DROP POLICY IF EXISTS "Authors can delete own articles" ON articoli;
DROP POLICY IF EXISTS "Admins can delete all articles" ON articoli;

-- Create delete policies
CREATE POLICY "Authors can delete own articles" ON articoli
    FOR DELETE USING (auth.uid() = autore_id);

CREATE POLICY "Admins can delete all articles" ON articoli
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM profili_utenti WHERE id = auth.uid() AND ruolo IN ('caporedattore', 'docente'))
    );

-- ============================================
-- 5. FIX chat_messages room column
-- ============================================

-- Add room column if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_messages' AND column_name = 'room') THEN
        ALTER TABLE chat_messages ADD COLUMN room TEXT DEFAULT 'generale';
    END IF;
END $$;

-- Enable RLS on chat_messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Authenticated users can insert chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can update own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON chat_messages;

-- Create policies
CREATE POLICY "Authenticated users can view chat messages" ON chat_messages
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert chat messages" ON chat_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own messages" ON chat_messages
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages" ON chat_messages
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 6. ADD AUTO-SUSPENSION FUNCTION
-- ============================================

-- Function to check and suspend user after 3 reports
CREATE OR REPLACE FUNCTION check_and_suspend_user()
RETURNS TRIGGER AS $$
DECLARE
    report_count INTEGER;
    target_user_id UUID;
BEGIN
    -- Get the user being reported
    IF NEW.content_type = 'message' THEN
        SELECT user_id INTO target_user_id FROM chat_messages WHERE id = NEW.content_id;
    ELSIF NEW.content_type = 'user' THEN
        target_user_id := NEW.content_id::UUID;
    ELSIF NEW.reported_user_id IS NOT NULL THEN
        target_user_id := NEW.reported_user_id;
    ELSE
        RETURN NEW;
    END IF;
    
    IF target_user_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Count unique reporters for this user
    SELECT COUNT(DISTINCT reported_by) INTO report_count
    FROM content_reports
    WHERE (content_id = NEW.content_id OR reported_user_id = target_user_id)
    AND status = 'pending';
    
    -- If 3 or more unique reporters, suspend user
    IF report_count >= 3 THEN
        UPDATE profili_utenti
        SET is_hidden = true
        WHERE id = target_user_id;
        
        -- Log the auto-suspension
        INSERT INTO audit_log (user_id, action, resource_type, resource_id, details)
        VALUES (
            NULL,
            'auto_suspension',
            'user',
            target_user_id,
            jsonb_build_object('reason', 'Auto-suspended after 3 reports', 'report_count', report_count)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_check_suspension ON content_reports;

-- Create trigger
CREATE TRIGGER trigger_check_suspension
    AFTER INSERT ON content_reports
    FOR EACH ROW EXECUTE FUNCTION check_and_suspend_user();

-- ============================================
-- 7. CREATE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_article_reactions_article ON article_reactions(article_id);
CREATE INDEX IF NOT EXISTS idx_article_reactions_user ON article_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_user ON content_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(room);

-- ============================================
-- COMPLETION
-- ============================================
SELECT 'All database fixes applied successfully!' as status;
