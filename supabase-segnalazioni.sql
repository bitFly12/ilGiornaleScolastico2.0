-- ============================================
-- SEGNALAZIONI TABLE - COMPLETE SETUP
-- Giornale Scolastico Cesaris
-- ============================================
-- 
-- INSTRUCTIONS:
-- 1. Go to https://tepxvijiamuaszvyzeze.supabase.co
-- 2. Open SQL Editor
-- 3. Copy and paste this entire file
-- 4. Click "Run"
--
-- ============================================

-- Drop existing table if exists (for clean install)
DROP TABLE IF EXISTS segnalazioni CASCADE;

-- ============================================
-- CREATE SEGNALAZIONI TABLE
-- ============================================
CREATE TABLE segnalazioni (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT,
    motivo TEXT NOT NULL,
    descrizione TEXT,
    tipo_segnalazione VARCHAR(50) DEFAULT 'altro',
    -- Valid types: spamming, contenuto_offensivo, bug, suggerimento, altro
    status VARCHAR(20) DEFAULT 'in_sospeso',
    -- Valid statuses: in_sospeso, esaminato, risolto, chiuso, respinto
    data_segnalazione TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    data_risposta TIMESTAMP WITH TIME ZONE,
    risposta_admin TEXT,
    admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    visualizzata_admin BOOLEAN DEFAULT FALSE,
    priorita VARCHAR(10) DEFAULT 'normale',
    -- Valid priorities: bassa, normale, alta, urgente
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_segnalazioni_user_id ON segnalazioni(user_id);
CREATE INDEX idx_segnalazioni_status ON segnalazioni(status);
CREATE INDEX idx_segnalazioni_data ON segnalazioni(data_segnalazione DESC);
CREATE INDEX idx_segnalazioni_tipo ON segnalazioni(tipo_segnalazione);
CREATE INDEX idx_segnalazioni_priorita ON segnalazioni(priorita);
CREATE INDEX idx_segnalazioni_visualizzata ON segnalazioni(visualizzata_admin);

-- ============================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE segnalazioni ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Policy: Users can read their own reports
CREATE POLICY "Users can view own segnalazioni" 
ON segnalazioni FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Users can create new reports
CREATE POLICY "Users can create segnalazioni" 
ON segnalazioni FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own pending reports
CREATE POLICY "Users can update own pending segnalazioni" 
ON segnalazioni FOR UPDATE 
USING (auth.uid() = user_id AND status = 'in_sospeso');

-- Policy: Admins (caporedattore/docente) can read ALL reports
CREATE POLICY "Admins can view all segnalazioni" 
ON segnalazioni FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM profili_utenti 
        WHERE id = auth.uid() 
        AND ruolo IN ('caporedattore', 'docente')
    )
);

-- Policy: Admins can update ALL reports
CREATE POLICY "Admins can update all segnalazioni" 
ON segnalazioni FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM profili_utenti 
        WHERE id = auth.uid() 
        AND ruolo IN ('caporedattore', 'docente')
    )
);

-- Policy: Admins can delete reports
CREATE POLICY "Admins can delete segnalazioni" 
ON segnalazioni FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM profili_utenti 
        WHERE id = auth.uid() 
        AND ruolo IN ('caporedattore', 'docente')
    )
);

-- ============================================
-- TRIGGER: Auto-update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_segnalazioni_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_segnalazioni_updated_at
    BEFORE UPDATE ON segnalazioni
    FOR EACH ROW EXECUTE FUNCTION update_segnalazioni_updated_at();

-- ============================================
-- HELPER FUNCTION: Get unread segnalazioni count
-- ============================================
CREATE OR REPLACE FUNCTION get_unread_segnalazioni_count()
RETURNS INTEGER AS $$
DECLARE
    count_val INTEGER;
BEGIN
    SELECT COUNT(*) INTO count_val
    FROM segnalazioni
    WHERE visualizzata_admin = FALSE AND status = 'in_sospeso';
    RETURN count_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- HELPER FUNCTION: Mark segnalazione as read
-- ============================================
CREATE OR REPLACE FUNCTION mark_segnalazione_read(segnalazione_id BIGINT)
RETURNS VOID AS $$
BEGIN
    UPDATE segnalazioni
    SET visualizzata_admin = TRUE
    WHERE id = segnalazione_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT SELECT, INSERT, UPDATE ON segnalazioni TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE segnalazioni_id_seq TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_segnalazioni_count() TO authenticated;
GRANT EXECUTE ON FUNCTION mark_segnalazione_read(BIGINT) TO authenticated;

-- ============================================
-- INSERT SAMPLE DATA (for testing)
-- ============================================
-- Uncomment below lines to add test data
/*
INSERT INTO segnalazioni (user_id, user_email, motivo, descrizione, tipo_segnalazione, status, priorita)
VALUES 
    ('00000000-0000-0000-0000-000000000000', 'test@test.com', 'Test segnalazione', 'Descrizione di test', 'bug', 'in_sospeso', 'normale'),
    ('00000000-0000-0000-0000-000000000000', 'test@test.com', 'Bug nel menu', 'Il menu non si apre', 'bug', 'in_sospeso', 'alta');
*/

-- ============================================
-- COMPLETION MESSAGE
-- ============================================
SELECT 'Tabella segnalazioni creata con successo! RLS policies attive.' as status;
