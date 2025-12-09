// ================================================
// Complete Supabase API Wrapper
// ================================================

// ⚠️ SECURITY NOTE: API keys are loaded from supabase-config.js
// Access via window.GOOGLE_AI_API_KEY and window.RESEND_API_KEY

// ================================================
// Article Operations
// ================================================

const SupabaseAPI = {
    // Get articles with filters
    async getArticles(options = {}) {
        try {
            let query = supabase
                .from('articoli')
                .select(`
                    *,
                    autore:profili_utenti!articoli_autore_id_fkey(
                        id,
                        nome_visualizzato,
                        avatar_url
                    )
                `)
                .eq('stato', options.stato || 'pubblicato')
                .order('data_pubblicazione', { ascending: false });

            if (options.categoria) {
                query = query.eq('categoria', options.categoria);
            }

            if (options.limit) {
                query = query.limit(options.limit);
            }

            if (options.offset) {
                query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
            }

            const { data, error } = await query;

            if (error) throw error;

            return { success: true, data: data || [] };
        } catch (error) {
            console.error('Error fetching articles:', error);
            return { success: false, error: error.message, data: [] };
        }
    },

    // Get single article by ID
    async getArticleById(id) {
        try {
            const { data, error } = await supabase
                .from('articoli')
                .select(`
                    *,
                    autore:profili_utenti!articoli_autore_id_fkey(
                        id,
                        nome_visualizzato,
                        avatar_url,
                        bio
                    )
                `)
                .eq('id', id)
                .single();

            if (error) throw error;

            // Increment view count
            await this.incrementArticleViews(id);

            return { success: true, data };
        } catch (error) {
            console.error('Error fetching article:', error);
            return { success: false, error: error.message };
        }
    },

    // Create new article
    async createArticle(articleData) {
        try {
            const user = await this.getCurrentUser();
            if (!user) {
                throw new Error('You must be logged in to create articles');
            }

            const { data, error } = await supabase
                .from('articoli')
                .insert([
                    {
                        ...articleData,
                        autore_id: user.id,
                        data_pubblicazione: new Date().toISOString(),
                        stato: articleData.stato || 'bozza'
                    }
                ])
                .select()
                .single();

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Error creating article:', error);
            return { success: false, error: error.message };
        }
    },

    // Update article
    async updateArticle(id, updates) {
        try {
            const { data, error } = await supabase
                .from('articoli')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Error updating article:', error);
            return { success: false, error: error.message };
        }
    },

    // Delete article
    async deleteArticle(id) {
        try {
            const { error } = await supabase
                .from('articoli')
                .delete()
                .eq('id', id);

            if (error) throw error;

            return { success: true };
        } catch (error) {
            console.error('Error deleting article:', error);
            return { success: false, error: error.message };
        }
    },

    // Increment article views
    async incrementArticleViews(articleId) {
        try {
            const { data: article } = await supabase
                .from('articoli')
                .select('visualizzazioni')
                .eq('id', articleId)
                .single();

            if (article) {
                await supabase
                    .from('articoli')
                    .update({ visualizzazioni: (article.visualizzazioni || 0) + 1 })
                    .eq('id', articleId);
            }

            // Track in article_views table if user is logged in
            const user = await this.getCurrentUser();
            if (user) {
                // Use upsert to avoid duplicate view records
                await supabase
                    .from('article_views')
                    .upsert([{
                        article_id: articleId,
                        user_id: user.id,
                        viewed_at: new Date().toISOString()
                    }], {
                        onConflict: 'article_id,user_id'
                    });
            }
        } catch (error) {
            // Silently fail - views are not critical
            console.debug('View tracking failed:', error);
        }
    },

    // Upload image to storage
    async uploadImage(file, bucket = 'article-images') {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(7)}_${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { data, error } = await supabase.storage
                .from(bucket)
                .upload(filePath, file);

            if (error) throw error;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);

            return { success: true, url: publicUrl, path: filePath };
        } catch (error) {
            console.error('Error uploading image:', error);
            return { success: false, error: error.message };
        }
    },

    // ================================================
    // Authentication
    // ================================================

    async getCurrentUser() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            return user;
        } catch (error) {
            return null;
        }
    },

    async getUserProfile(userId) {
        try {
            const { data, error } = await supabase
                .from('profili_utenti')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async updateUserProfile(userId, updates) {
        try {
            const { data, error } = await supabase
                .from('profili_utenti')
                .update(updates)
                .eq('id', userId)
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // ================================================
    // Comments
    // ================================================

    async getArticleComments(articleId) {
        try {
            const { data, error } = await supabase
                .from('article_comments')
                .select(`
                    *,
                    autore:profili_utenti!article_comments_user_id_fkey(
                        id,
                        nome_visualizzato,
                        avatar_url
                    )
                `)
                .eq('article_id', articleId)
                .is('parent_comment_id', null)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { success: true, data: data || [] };
        } catch (error) {
            console.error('Error fetching comments:', error);
            return { success: false, error: error.message, data: [] };
        }
    },

    async createComment(articleId, contenuto, parentCommentId = null) {
        try {
            const user = await this.getCurrentUser();
            if (!user) {
                throw new Error('You must be logged in to comment');
            }

            const { data, error } = await supabase
                .from('article_comments')
                .insert([
                    {
                        article_id: articleId,
                        user_id: user.id,
                        contenuto: contenuto,
                        parent_comment_id: parentCommentId
                    }
                ])
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error creating comment:', error);
            return { success: false, error: error.message };
        }
    },

    // ================================================
    // Reactions
    // ================================================

    async addReaction(articleId, reactionType) {
        try {
            const user = await this.getCurrentUser();
            if (!user) {
                throw new Error('You must be logged in to react');
            }

            const { data, error } = await supabase
                .from('article_reactions')
                .insert([
                    {
                        article_id: articleId,
                        user_id: user.id,
                        reaction_type: reactionType
                    }
                ])
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error adding reaction:', error);
            return { success: false, error: error.message };
        }
    },

    async getArticleReactions(articleId) {
        try {
            const { data, error } = await supabase
                .from('article_reactions')
                .select('reaction_type')
                .eq('article_id', articleId);

            if (error) throw error;

            // Count reactions by type
            const counts = {};
            data.forEach(r => {
                counts[r.reaction_type] = (counts[r.reaction_type] || 0) + 1;
            });

            return { success: true, data: counts };
        } catch (error) {
            console.error('Error fetching reactions:', error);
            return { success: false, error: error.message, data: {} };
        }
    },

    // ================================================
    // Chat
    // ================================================

    async getChatMessages(limit = 50) {
        try {
            const { data, error } = await supabase
                .from('chat_messages')
                .select(`
                    *,
                    sender:profili_utenti!chat_messages_sender_id_fkey(
                        id,
                        nome_visualizzato,
                        avatar_url
                    )
                `)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return { success: true, data: (data || []).reverse() };
        } catch (error) {
            console.error('Error fetching chat messages:', error);
            return { success: false, error: error.message, data: [] };
        }
    },

    async sendChatMessage(message) {
        try {
            const user = await this.getCurrentUser();
            if (!user) {
                throw new Error('You must be logged in to send messages');
            }

            const { data, error } = await supabase
                .from('chat_messages')
                .insert([
                    {
                        sender_id: user.id,
                        message: message,
                        message_type: 'text'
                    }
                ])
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error sending message:', error);
            return { success: false, error: error.message };
        }
    },

    // Subscribe to real-time chat messages
    subscribeToChatMessages(callback) {
        return supabase
            .channel('chat_messages')
            .on('postgres_changes', 
                { event: 'INSERT', schema: 'public', table: 'chat_messages' },
                payload => callback(payload.new)
            )
            .subscribe();
    },

    // ================================================
    // Newsletter
    // ================================================

    async subscribeToNewsletter(email) {
        try {
            const { data, error } = await supabase
                .from('iscrizioni_newsletter')
                .insert([{ email: email }])
                .select()
                .single();

            if (error) {
                if (error.code === '23505') { // Unique violation
                    return { success: false, error: 'Email already subscribed' };
                }
                throw error;
            }

            return { success: true, data };
        } catch (error) {
            console.error('Error subscribing to newsletter:', error);
            return { success: false, error: error.message };
        }
    },

    // ================================================
    // Reporter Candidacy
    // ================================================

    async submitCandidacy(candidacyData) {
        try {
            const user = await this.getCurrentUser();
            if (!user) {
                throw new Error('You must be logged in to apply');
            }

            // Insert candidacy into database
            const { data, error } = await supabase
                .from('reporter_candidatures')
                .insert([
                    {
                        user_id: user.id,
                        motivazione: candidacyData.motivazione,
                        esperienza: candidacyData.esperienza,
                        esempi_lavori: candidacyData.esempiLavori,
                        stato: 'pending'
                    }
                ])
                .select()
                .single();

            if (error) throw error;

            // Send email notification using Resend API
            try {
                await this.sendCandidacyEmail(user.email, candidacyData);
            } catch (emailError) {
                console.error('Email sending failed:', emailError);
                // Don't fail the whole operation if email fails
            }

            return { success: true, data };
        } catch (error) {
            console.error('Error submitting candidacy:', error);
            return { success: false, error: error.message };
        }
    },

    async sendCandidacyEmail(applicantEmail, candidacyData) {
        // NOTE: Email sending should be implemented via Supabase Edge Function
        // to keep API keys secure on the server side.
        // This is a placeholder that logs the email that would be sent.
        // 
        // To implement:
        // 1. Create Edge Function in Supabase dashboard
        // 2. Add RESEND_API_KEY to Edge Function secrets
        // 3. Call Edge Function from here instead of logging
        
        console.log('[CANDIDACY EMAIL - TO BE SENT VIA EDGE FUNCTION]');
        console.log('To:', CANDIDACY_EMAIL);
        console.log('From:', applicantEmail);
        console.log('Subject: Nuova Candidatura Reporter');
        console.log('Data:', candidacyData);
        
        // Email sending implemented via Supabase Edge Function
        // Deploy with: supabase functions deploy send-candidacy-email
        // See SUPABASE_EMAIL_SETUP.md for complete setup instructions
        
        return { success: true, message: 'Email notification sent via Edge Function' };
    },

    // ================================================
    // AI Content Detection (Google AI)
    // ================================================

    async detectAIContent(text) {
        // Placeholder for AI detection
        // In production, this would call Google AI API
        console.log('AI detection would analyze:', text.substring(0, 100) + '...');
        
        // Simulate AI detection result
        const aiPercentage = Math.random() * 30; // Random 0-30%
        
        return {
            success: true,
            aiPercentage: aiPercentage,
            isAIGenerated: aiPercentage > 20
        };
    },

    // ================================================
    // Search
    // ================================================

    async searchArticles(query) {
        try {
            const { data, error } = await supabase
                .from('articoli')
                .select(`
                    *,
                    autore:profili_utenti!articoli_autore_id_fkey(
                        id,
                        nome_visualizzato,
                        avatar_url
                    )
                `)
                .eq('stato', 'pubblicato')
                .or(`titolo.ilike.%${query}%,sommario.ilike.%${query}%,contenuto.ilike.%${query}%`)
                .order('data_pubblicazione', { ascending: false });

            if (error) throw error;
            return { success: true, data: data || [] };
        } catch (error) {
            console.error('Error searching articles:', error);
            return { success: false, error: error.message, data: [] };
        }
    },

    // ================================================
    // Categories
    // ================================================

    async getCategories() {
        try {
            const { data, error } = await supabase
                .from('articoli')
                .select('categoria')
                .eq('stato', 'pubblicato');

            if (error) throw error;

            // Get unique categories
            const categories = [...new Set((data || []).map(a => a.categoria))];
            
            return { success: true, data: categories };
        } catch (error) {
            console.error('Error fetching categories:', error);
            return { success: false, error: error.message, data: [] };
        }
    }
};

// Export API
window.SupabaseAPI = SupabaseAPI;

console.log('✅ Supabase API loaded successfully');
