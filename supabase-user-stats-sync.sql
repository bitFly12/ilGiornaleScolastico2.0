-- ============================================
-- User Statistics Synchronization
-- ============================================
-- This script ensures that user statistics (views, badges, points) 
-- are properly synchronized with the backend and not stored in localStorage

-- Function to update user's total views when article views change
CREATE OR REPLACE FUNCTION sync_user_total_views()
RETURNS TRIGGER AS $$
DECLARE
    author_total_views INTEGER;
BEGIN
    -- Calculate total views for the author
    SELECT COALESCE(SUM(visualizzazioni), 0) 
    INTO author_total_views
    FROM articoli 
    WHERE autore_id = NEW.autore_id AND stato = 'pubblicato';
    
    -- Update user's total views
    UPDATE profili_utenti
    SET visualizzazioni_totali = author_total_views,
        updated_at = NOW()
    WHERE id = NEW.autore_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to sync views when article views are updated
DROP TRIGGER IF EXISTS sync_author_views_on_article_update ON articoli;
CREATE TRIGGER sync_author_views_on_article_update 
    AFTER UPDATE OF visualizzazioni ON articoli
    FOR EACH ROW 
    WHEN (NEW.visualizzazioni IS DISTINCT FROM OLD.visualizzazioni)
    EXECUTE FUNCTION sync_user_total_views();

-- Also sync when article is first published
DROP TRIGGER IF EXISTS sync_author_views_on_article_publish ON articoli;
CREATE TRIGGER sync_author_views_on_article_publish 
    AFTER UPDATE OF stato ON articoli
    FOR EACH ROW 
    WHEN (NEW.stato = 'pubblicato' AND OLD.stato != 'pubblicato')
    EXECUTE FUNCTION sync_user_total_views();

-- Function to recalculate and fix any existing user stats
CREATE OR REPLACE FUNCTION recalculate_user_stats(p_user_id UUID DEFAULT NULL)
RETURNS void AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- If specific user, process only that user
    IF p_user_id IS NOT NULL THEN
        -- Get user's actual stats
        SELECT 
            u.id,
            COALESCE(COUNT(DISTINCT a.id) FILTER (WHERE a.stato = 'pubblicato'), 0) as actual_published,
            COALESCE(SUM(a.visualizzazioni) FILTER (WHERE a.stato = 'pubblicato'), 0) as actual_views,
            COALESCE(SUM(ph.points), 0) as actual_points
        INTO user_record
        FROM profili_utenti u
        LEFT JOIN articoli a ON a.autore_id = u.id
        LEFT JOIN user_points_history ph ON ph.user_id = u.id
        WHERE u.id = p_user_id
        GROUP BY u.id;
        
        -- Update user's stats
        UPDATE profili_utenti
        SET 
            articoli_pubblicati = user_record.actual_published,
            visualizzazioni_totali = user_record.actual_views,
            punti_totali = user_record.actual_points,
            updated_at = NOW()
        WHERE id = p_user_id;
        
    ELSE
        -- Process all users
        FOR user_record IN 
            SELECT 
                u.id,
                COALESCE(COUNT(DISTINCT a.id) FILTER (WHERE a.stato = 'pubblicato'), 0) as actual_published,
                COALESCE(SUM(a.visualizzazioni) FILTER (WHERE a.stato = 'pubblicato'), 0) as actual_views,
                COALESCE(SUM(ph.points), 0) as actual_points
            FROM profili_utenti u
            LEFT JOIN articoli a ON a.autore_id = u.id
            LEFT JOIN user_points_history ph ON ph.user_id = u.id
            GROUP BY u.id
        LOOP
            -- Update user's stats
            UPDATE profili_utenti
            SET 
                articoli_pubblicati = user_record.actual_published,
                visualizzazioni_totali = user_record.actual_views,
                punti_totali = user_record.actual_points,
                updated_at = NOW()
            WHERE id = user_record.id;
        END LOOP;
    END IF;
    
    RAISE NOTICE 'User stats recalculated successfully';
END;
$$ LANGUAGE plpgsql;

-- Function to ensure badges are stored in database
-- This is called by check_and_award_badges() which already exists
-- Just adding a comment to clarify that badges MUST be in user_badges table

-- Create an index on user_badges for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_type ON user_badges(badge_type);

-- Create an index on user_points_history for faster aggregation
CREATE INDEX IF NOT EXISTS idx_user_points_history_user_id ON user_points_history(user_id);

-- RLS policies for user_badges (if not already exists)
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own badges" ON user_badges;
CREATE POLICY "Users can view their own badges" ON user_badges
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can view badges" ON user_badges;
CREATE POLICY "Anyone can view badges" ON user_badges
    FOR SELECT USING (true);

-- RLS policies for user_points_history
ALTER TABLE user_points_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own points history" ON user_points_history;
CREATE POLICY "Users can view their own points history" ON user_points_history
    FOR SELECT USING (user_id = auth.uid());

-- Run initial recalculation for all users (optional - comment out if not needed)
-- SELECT recalculate_user_stats();

-- ============================================
-- USAGE INSTRUCTIONS
-- ============================================

/*
-- To recalculate stats for all users:
SELECT recalculate_user_stats();

-- To recalculate stats for a specific user:
SELECT recalculate_user_stats('user-uuid-here');

-- To manually check a user's stats:
SELECT 
    id,
    username,
    articoli_pubblicati,
    visualizzazioni_totali,
    punti_totali
FROM profili_utenti
WHERE id = 'user-uuid-here';

-- To see all badges for a user:
SELECT * FROM user_badges WHERE user_id = 'user-uuid-here';

-- To see points history for a user:
SELECT * FROM user_points_history WHERE user_id = 'user-uuid-here' ORDER BY created_at DESC;
*/
