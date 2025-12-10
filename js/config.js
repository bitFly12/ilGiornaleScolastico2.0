/**
 * Supabase Configuration
 * 
 * IMPORTANT: Replace these values with your actual Supabase project credentials
 * Find these at: https://app.supabase.com/project/_/settings/api
 */

// For production, use environment variables or a secure config management system
const SUPABASE_CONFIG = {
    url: 'YOUR_SUPABASE_URL', // Replace with: https://YOUR_PROJECT.supabase.co
    anonKey: 'YOUR_SUPABASE_ANON_KEY' // Replace with your project's anon/public key
};

// Validate configuration
if (SUPABASE_CONFIG.url === 'YOUR_SUPABASE_URL' || SUPABASE_CONFIG.anonKey === 'YOUR_SUPABASE_ANON_KEY') {
    console.error('⚠️ CONFIGURATION ERROR: Please update SUPABASE_CONFIG in js/config.js with your actual credentials');
}

export default SUPABASE_CONFIG;
