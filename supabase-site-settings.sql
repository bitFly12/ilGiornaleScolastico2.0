-- ============================================
-- Site Settings Table for Global Configuration
-- ============================================
-- This table stores global site settings including maintenance mode,
-- which are synchronized across all devices in real-time.

-- Create the site_settings table
CREATE TABLE IF NOT EXISTS site_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    updated_by UUID REFERENCES profili_utenti(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO site_settings (setting_key, setting_value) 
VALUES 
    ('maintenance_mode', '{"enabled": false, "message": "Sito in manutenzione"}'),
    ('registrations_enabled', '{"enabled": true}'),
    ('chat_enabled', '{"enabled": true}'),
    ('comments_enabled', '{"enabled": true}'),
    ('ai_detection', '{"enabled": false}'),
    ('auto_suspension', '{"enabled": false}')
ON CONFLICT (setting_key) DO NOTHING;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(setting_key);

-- Enable Row Level Security
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read site settings (needed for maintenance mode check)
CREATE POLICY "Anyone can read site settings" ON site_settings
    FOR SELECT USING (true);

-- Policy: Only admins (caporedattore, docente) can update settings
CREATE POLICY "Admins can update settings" ON site_settings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profili_utenti 
            WHERE id = auth.uid() 
            AND ruolo IN ('caporedattore', 'docente')
        )
    );

-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_site_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_site_settings_updated_at
    BEFORE UPDATE ON site_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_site_settings_updated_at();

-- Grant permissions (optional, RLS policies handle access)
-- GRANT SELECT ON site_settings TO anon, authenticated;
-- GRANT UPDATE ON site_settings TO authenticated;
