// ================================================
// Supabase Configuration
// ================================================

// NOTE: API keys provided by user - in production, move to environment variables
// For security best practices, use .env files and never commit secrets to git
const SUPABASE_URL = 'https://tepxvijiamuaszvyzeze.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlcHh2aWppYW11YXN6dnl6ZXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyNjU0MTMsImV4cCI6MjA4MDg0MTQxM30.6_OAMwfomGmz93BJrbYbOuqTDF1ZUxbW8eZ91fHifr4';

// External API Keys
// ⚠️ SECURITY NOTE: These API keys are exposed in client-side code.
// For production deployment:
// 1. Move these to Supabase Edge Functions (server-side)
// 2. Use Supabase secrets management
// 3. Never commit sensitive keys to version control
// 4. The Supabase anon key is safe to expose (designed for client-side use)
// 5. Google AI and Resend keys should be server-side only
const GOOGLE_AI_API_KEY = 'AIzaSyDXwkvfGymYKD5pN3cV0f8ofC54j9IcS90';
const RESEND_API_KEY = 're_TdwD1rg2_33toySQdNwgiCuNEwCEXQbWY';

// Export API keys for use in other modules
// TODO: Remove these exports and implement via Edge Functions
window.GOOGLE_AI_API_KEY = GOOGLE_AI_API_KEY;
window.RESEND_API_KEY = RESEND_API_KEY;

// PostgreSQL Error Codes (for better code readability)
const PG_ERROR_CODES = {
    UNIQUE_VIOLATION: '23505',
    FOREIGN_KEY_VIOLATION: '23503',
    NOT_NULL_VIOLATION: '23502'
};

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export for use in other files
window.supabaseClient = supabase;

console.log('✅ Supabase client initialized');

// ================================================
// Authentication Helper Functions
// ================================================

async function signUpWithEmail(email, password, fullName) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: fullName
                }
            }
        });

        if (error) throw error;

        // Create user profile
        if (data.user) {
            const { error: profileError } = await supabase
                .from('profili_utenti')
                .insert([
                    {
                        id: data.user.id,
                        email: email,
                        nome_completo: fullName,
                        nome_visualizzato: fullName.split(' ')[0],
                        ruolo: 'studente'
                    }
                ]);

            if (profileError) console.error('Profile creation error:', profileError);

            // Create user preferences
            await supabase
                .from('preferenze_utente')
                .insert([{ user_id: data.user.id }]);
        }

        return { success: true, user: data.user };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function signInWithEmail(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        // Get user profile
        const { data: profile } = await supabase
            .from('profili_utenti')
            .select('*')
            .eq('id', data.user.id)
            .single();

        return { success: true, user: data.user, profile: profile };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function getCurrentUser() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return null;

        // Get user profile
        const { data: profile } = await supabase
            .from('profili_utenti')
            .select('*')
            .eq('id', user.id)
            .single();

        return { user, profile };
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
}

// ================================================
// Article Functions
// ================================================

async function getArticles(options = {}) {
    try {
        let query = supabase
            .from('articoli')
            .select(`
                *,
                autore:profili_utenti!articoli_autore_id_fkey(nome_visualizzato, avatar_url, livello_reporter)
            `)
            .eq('stato', 'pubblicato')
            .order('data_pubblicazione', { ascending: false });

        if (options.category) {
            query = query.eq('categoria', options.category);
        }

        if (options.limit) {
            query = query.limit(options.limit);
        }

        if (options.offset) {
            query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
        }

        const { data, error } = await query;

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function getArticleById(id) {
    try {
        const { data, error } = await supabase
            .from('articoli')
            .select(`
                *,
                autore:profili_utenti!articoli_autore_id_fkey(
                    id,
                    nome_visualizzato,
                    avatar_url,
                    livello_reporter,
                    bio
                )
            `)
            .eq('id', id)
            .eq('stato', 'pubblicato')
            .single();

        if (error) throw error;

        // Record view
        const currentUser = await getCurrentUser();
        await supabase
            .from('article_views')
            .insert([
                {
                    article_id: id,
                    user_id: currentUser?.user?.id || null,
                    session_id: getOrCreateSessionId()
                }
            ]);

        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function searchArticles(query, options = {}) {
    try {
        let dbQuery = supabase
            .from('articoli')
            .select(`
                *,
                autore:profili_utenti!articoli_autore_id_fkey(nome_visualizzato, avatar_url)
            `)
            .eq('stato', 'pubblicato')
            .or(`titolo.ilike.%${query}%,sommario.ilike.%${query}%,contenuto.ilike.%${query}%`)
            .order('data_pubblicazione', { ascending: false });

        if (options.limit) {
            dbQuery = dbQuery.limit(options.limit);
        }

        const { data, error } = await dbQuery;

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function createArticle(articleData) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('articoli')
            .insert([
                {
                    ...articleData,
                    autore_id: currentUser.user.id,
                    stato: 'bozza'
                }
            ])
            .select()
            .single();

        if (error) throw error;

        // Update user article count
        await supabase.rpc('update_user_points', {
            p_user_id: currentUser.user.id,
            p_points: 5,
            p_reason: 'Articolo creato',
            p_reference_id: data.id
        });

        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function addArticleReaction(articleId, reactionType) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('article_reactions')
            .insert([
                {
                    article_id: articleId,
                    user_id: currentUser.user.id,
                    reaction_type: reactionType
                }
            ])
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        // If already exists (unique constraint violation), remove it
        if (error.code === PG_ERROR_CODES.UNIQUE_VIOLATION) {
            return await removeArticleReaction(articleId, reactionType);
        }
        return { success: false, error: error.message };
    }
}

async function removeArticleReaction(articleId, reactionType) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) throw new Error('User not authenticated');

        const { error } = await supabase
            .from('article_reactions')
            .delete()
            .eq('article_id', articleId)
            .eq('user_id', currentUser.user.id)
            .eq('reaction_type', reactionType);

        if (error) throw error;
        return { success: true, removed: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function getArticleReactions(articleId) {
    try {
        const { data, error } = await supabase
            .from('article_reactions')
            .select('reaction_type, user_id')
            .eq('article_id', articleId);

        if (error) throw error;

        // Count reactions by type
        const counts = data.reduce((acc, reaction) => {
            acc[reaction.reaction_type] = (acc[reaction.reaction_type] || 0) + 1;
            return acc;
        }, {});

        return { success: true, data: counts, userReactions: data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ================================================
// Chat Functions
// ================================================

async function getChatMessages(limit = 50, offset = 0) {
    try {
        const { data, error } = await supabase
            .from('chat_messages')
            .select(`
                *,
                user:profili_utenti!chat_messages_user_id_fkey(nome_visualizzato, avatar_url)
            `)
            .eq('is_deleted', false)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;
        return { success: true, data: data.reverse() };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function sendChatMessage(content, messageType = 'text', extraData = {}) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('chat_messages')
            .insert([
                {
                    user_id: currentUser.user.id,
                    author_name: currentUser.profile.nome_visualizzato,
                    content: content,
                    message_type: messageType,
                    ...extraData
                }
            ])
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function subscribeToChatMessages(callback) {
    const subscription = supabase
        .channel('chat-messages')
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages'
        }, payload => {
            callback(payload.new);
        })
        .subscribe();

    return subscription;
}

async function addChatReaction(messageId, emoji) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('chat_reactions')
            .insert([
                {
                    message_id: messageId,
                    user_id: currentUser.user.id,
                    emoji: emoji
                }
            ])
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ================================================
// Comments Functions
// ================================================

async function getArticleComments(articleId) {
    try {
        const { data, error } = await supabase
            .from('article_comments')
            .select(`
                *,
                user:profili_utenti!article_comments_user_id_fkey(nome_visualizzato, avatar_url)
            `)
            .eq('article_id', articleId)
            .eq('is_approved', true)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function addComment(articleId, content, parentCommentId = null) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('article_comments')
            .insert([
                {
                    article_id: articleId,
                    user_id: currentUser.user.id,
                    content: content,
                    parent_comment_id: parentCommentId
                }
            ])
            .select()
            .single();

        if (error) throw error;

        // Award points
        await supabase.rpc('update_user_points', {
            p_user_id: currentUser.user.id,
            p_points: 2,
            p_reason: 'Commento aggiunto',
            p_reference_id: data.id
        });

        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ================================================
// Reporter Functions
// ================================================

async function submitReporterCandidature(candidatureData) {
    try {
        const { data, error } = await supabase
            .from('reporter_candidatures')
            .insert([candidatureData])
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ================================================
// Newsletter Functions
// ================================================

async function subscribeToNewsletter(email) {
    try {
        const { data, error } = await supabase
            .from('iscrizioni_newsletter')
            .insert([{ email: email }])
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        if (error.code === PG_ERROR_CODES.UNIQUE_VIOLATION) {
            return { success: false, error: 'Email già registrata' };
        }
        return { success: false, error: error.message };
    }
}

// ================================================
// Helper Functions
// ================================================

function getOrCreateSessionId() {
    let sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
        sessionId = 'sess_' + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
}

// ================================================
// Export Functions
// ================================================

window.SupabaseAPI = {
    // Auth
    signUpWithEmail,
    signInWithEmail,
    signOut,
    getCurrentUser,
    
    // Articles
    getArticles,
    getArticleById,
    searchArticles,
    createArticle,
    addArticleReaction,
    removeArticleReaction,
    getArticleReactions,
    
    // Chat
    getChatMessages,
    sendChatMessage,
    subscribeToChatMessages,
    addChatReaction,
    
    // Comments
    getArticleComments,
    addComment,
    
    // Reporter
    submitReporterCandidature,
    
    // Newsletter
    subscribeToNewsletter
};

console.log('✅ Supabase API functions loaded');
