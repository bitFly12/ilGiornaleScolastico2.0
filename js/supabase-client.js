/**
 * Supabase Client Wrapper
 * Provides a centralized Supabase client with error handling and logging
 */

import SUPABASE_CONFIG from './config.js';

// Initialize Supabase client
let supabaseClient = null;

/**
 * Get or create Supabase client instance
 */
export function getSupabaseClient() {
    if (supabaseClient) {
        return supabaseClient;
    }

    // Check if Supabase library is loaded
    if (typeof supabase === 'undefined') {
        console.error('Supabase library not loaded. Make sure to include the Supabase CDN script.');
        return null;
    }

    try {
        supabaseClient = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        console.log('✅ Supabase client initialized successfully');
        return supabaseClient;
    } catch (error) {
        console.error('❌ Failed to initialize Supabase client:', error);
        return null;
    }
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser() {
    const client = getSupabaseClient();
    if (!client) return null;

    try {
        const { data: { user }, error } = await client.auth.getUser();
        if (error) {
            console.error('Error getting current user:', error);
            return null;
        }
        return user;
    } catch (error) {
        console.error('Exception getting current user:', error);
        return null;
    }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated() {
    const user = await getCurrentUser();
    return user !== null;
}

/**
 * Sign out user
 */
export async function signOut() {
    const client = getSupabaseClient();
    if (!client) return { error: 'Supabase client not initialized' };

    try {
        const { error } = await client.auth.signOut();
        if (error) {
            console.error('Error signing out:', error);
            return { error };
        }
        console.log('✅ User signed out successfully');
        return { error: null };
    } catch (error) {
        console.error('Exception signing out:', error);
        return { error };
    }
}

/**
 * Handle authentication state changes
 */
export function onAuthStateChange(callback) {
    const client = getSupabaseClient();
    if (!client) return null;

    const { data: authListener } = client.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        callback(event, session);
    });

    return authListener;
}

// Export singleton client
export default getSupabaseClient();
