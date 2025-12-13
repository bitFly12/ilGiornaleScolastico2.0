-- ============================================
-- COMPREHENSIVE RLS POLICIES FIX
-- Giornale Scolastico Cesaris
-- ============================================
-- 
-- This script adds all missing RLS policies for:
-- 1. content_reports (article reports - 403 error)
-- 2. articoli DELETE policy (article deletion fails)
-- 3. article_reactions policies
-- 4. article_comments DELETE policy
-- 5. chat_messages DELETE policy
--
-- Run this in Supabase SQL Editor.
--
-- ============================================

-- ============================================
-- 1. CONTENT_REPORTS POLICIES
-- (Fixes: POST content_reports 403 Forbidden)
-- ============================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can create reports" ON content_reports;
DROP POLICY IF EXISTS "Users can view own reports" ON content_reports;
DROP POLICY IF EXISTS "Admins can view all reports" ON content_reports;
DROP POLICY IF EXISTS "Admins can update reports" ON content_reports;
DROP POLICY IF EXISTS "Admins can delete reports" ON content_reports;

-- Enable RLS (if not already enabled)
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Any authenticated user can CREATE reports
CREATE POLICY "Users can create reports" ON content_reports
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Users can view their own reports
CREATE POLICY "Users can view own reports" ON content_reports
    FOR SELECT USING (reported_by = auth.uid());

-- Policy: Admins can view ALL reports
CREATE POLICY "Admins can view all reports" ON content_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profili_utenti 
            WHERE id = auth.uid() 
            AND ruolo IN ('caporedattore', 'docente')
        )
    );

-- Policy: Admins can update reports
CREATE POLICY "Admins can update reports" ON content_reports
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profili_utenti 
            WHERE id = auth.uid() 
            AND ruolo IN ('caporedattore', 'docente')
        )
    );

-- Policy: Admins can delete reports
CREATE POLICY "Admins can delete reports" ON content_reports
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profili_utenti 
            WHERE id = auth.uid() 
            AND ruolo IN ('caporedattore', 'docente')
        )
    );

-- ============================================
-- 2. ARTICOLI DELETE POLICY
-- (Fixes: Article deletion error)
-- ============================================

-- Drop existing delete policies if any
DROP POLICY IF EXISTS "Authors can delete own articles" ON articoli;
DROP POLICY IF EXISTS "Admins can delete all articles" ON articoli;

-- Policy: Authors can delete their own articles
CREATE POLICY "Authors can delete own articles" ON articoli
    FOR DELETE USING (auth.uid() = autore_id);

-- Policy: Admins can delete any article
CREATE POLICY "Admins can delete all articles" ON articoli
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profili_utenti 
            WHERE id = auth.uid() 
            AND ruolo IN ('caporedattore', 'docente')
        )
    );

-- ============================================
-- 3. ARTICLE_REACTIONS POLICIES
-- (Fixes: 406 Not Acceptable error)
-- ============================================

-- Enable RLS
ALTER TABLE article_reactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view reactions" ON article_reactions;
DROP POLICY IF EXISTS "Users can create reactions" ON article_reactions;
DROP POLICY IF EXISTS "Users can delete own reactions" ON article_reactions;

-- Policy: Anyone can view reactions
CREATE POLICY "Anyone can view reactions" ON article_reactions
    FOR SELECT USING (true);

-- Policy: Authenticated users can create reactions
CREATE POLICY "Users can create reactions" ON article_reactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update own reactions
CREATE POLICY "Users can update own reactions" ON article_reactions
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own reactions
CREATE POLICY "Users can delete own reactions" ON article_reactions
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 4. ARTICLE_COMMENTS DELETE POLICY
-- ============================================

-- Drop existing delete policies
DROP POLICY IF EXISTS "Users can delete own comments" ON article_comments;
DROP POLICY IF EXISTS "Admins can delete comments" ON article_comments;

-- Policy: Users can delete their own comments
CREATE POLICY "Users can delete own comments" ON article_comments
    FOR DELETE USING (auth.uid() = user_id);

-- Policy: Admins can delete any comment
CREATE POLICY "Admins can delete comments" ON article_comments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profili_utenti 
            WHERE id = auth.uid() 
            AND ruolo IN ('caporedattore', 'docente')
        )
    );

-- ============================================
-- 5. CHAT_MESSAGES DELETE POLICY
-- ============================================

-- Drop existing delete policies
DROP POLICY IF EXISTS "Users can delete own messages" ON chat_messages;

-- Policy: Users can delete their own messages
CREATE POLICY "Users can delete own messages" ON chat_messages
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 6. VERIFY chat_messages.room COLUMN EXISTS
-- (Fixes: column chat_messages.room does not exist)
-- ============================================

-- Add room column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'chat_messages' AND column_name = 'room'
    ) THEN
        ALTER TABLE chat_messages ADD COLUMN room TEXT DEFAULT 'generale';
    END IF;
END $$;

-- Add check constraint for room values
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'chat_messages_room_check'
    ) THEN
        ALTER TABLE chat_messages ADD CONSTRAINT chat_messages_room_check 
            CHECK (room IN ('generale', 'sport', 'musica', 'gaming', 'meme', 'anime', 'studio', 'tech'));
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Create index on room column
CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(room);

-- ============================================
-- 7. VERIFY POLICIES
-- ============================================
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename IN ('content_reports', 'articoli', 'article_reactions', 'article_comments', 'chat_messages')
ORDER BY tablename, policyname;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================
SELECT 'All RLS policies added successfully!' as status;
