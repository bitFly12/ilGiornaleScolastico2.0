/**
 * Homepage JavaScript
 * Handles article loading, authentication UI, and interactions
 */

import { getSupabaseClient, getCurrentUser, signOut } from './supabase-client.js';

// State
let currentPage = 1;
let currentCategory = '';
const articlesPerPage = 9;

/**
 * Initialize homepage
 */
async function init() {
    setupAuthUI();
    setupEventListeners();
    await loadFeaturedArticle();
    await loadArticles();
    setupNewsletterForm();
}

/**
 * Setup authentication UI
 */
async function setupAuthUI() {
    const user = await getCurrentUser();
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    const userName = document.getElementById('user-name');
    const chatBubble = document.getElementById('chat-bubble');
    
    if (user) {
        // User is logged in
        authButtons.classList.add('hidden');
        userMenu.classList.remove('hidden');
        
        // Set user name
        const displayName = user.user_metadata?.display_name || user.email.split('@')[0];
        userName.textContent = displayName;
        
        // Show chat bubble
        if (chatBubble) {
            chatBubble.classList.remove('hidden');
        }
    } else {
        // User is not logged in
        authButtons.classList.remove('hidden');
        userMenu.classList.add('hidden');
        
        if (chatBubble) {
            chatBubble.classList.add('hidden');
        }
    }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Mobile menu toggle
    const navbarToggle = document.getElementById('navbar-toggle');
    const navbarMenu = document.getElementById('navbar-menu');
    
    if (navbarToggle) {
        navbarToggle.addEventListener('click', () => {
            navbarMenu.classList.toggle('active');
        });
    }
    
    // User menu dropdown
    const userButton = document.getElementById('user-button');
    const userDropdown = document.getElementById('user-dropdown');
    
    if (userButton) {
        userButton.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('hidden');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            userDropdown.classList.add('hidden');
        });
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await handleLogout();
        });
    }
    
    // Category filter
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', (e) => {
            currentCategory = e.target.value;
            currentPage = 1;
            loadArticles();
        });
    }
    
    // Chat bubble
    const chatBubble = document.getElementById('chat-bubble');
    if (chatBubble) {
        chatBubble.addEventListener('click', () => {
            window.location.href = 'pages/chat.html';
        });
    }
}

/**
 * Handle user logout
 */
async function handleLogout() {
    const result = await signOut();
    if (!result.error) {
        window.location.reload();
    }
}

/**
 * Load featured article
 */
async function loadFeaturedArticle() {
    const container = document.getElementById('featured-article');
    const client = getSupabaseClient();
    
    if (!client) {
        container.innerHTML = '<div class="empty-state"><p>Impossibile caricare gli articoli. Verifica la configurazione.</p></div>';
        return;
    }
    
    try {
        // Get the most recent published article with highest views
        const { data, error } = await client
            .from('articoli')
            .select(`
                *,
                profili_redattori (nome_visualizzato)
            `)
            .eq('stato', 'pubblicato')
            .order('visualizzazioni', { ascending: false })
            .limit(1)
            .single();
        
        if (error) {
            console.error('Error loading featured article:', error);
            // Show placeholder if no articles
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📰</div>
                    <h3>Nessun articolo in evidenza</h3>
                    <p>Gli articoli pubblicati appariranno qui.</p>
                </div>
            `;
            return;
        }
        
        if (data) {
            container.innerHTML = renderFeaturedArticle(data);
        }
    } catch (error) {
        console.error('Exception loading featured article:', error);
        container.innerHTML = '<div class="empty-state"><p>Errore nel caricamento dell\'articolo in evidenza.</p></div>';
    }
}

/**
 * Render featured article HTML
 */
function renderFeaturedArticle(article) {
    const authorName = article.profili_redattori?.nome_visualizzato || 'Redazione';
    const publishDate = new Date(article.data_pubblicazione).toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    
    return `
        <img src="${article.immagine_copertina || 'https://via.placeholder.com/1200x400?text=Articolo+in+Evidenza'}" 
             alt="${article.titolo}" 
             class="featured-image">
        <div class="featured-content">
            <div class="featured-meta">
                <span>👤 ${authorName}</span>
                <span>📅 ${publishDate}</span>
                <span>👁️ ${article.visualizzazioni || 0} visualizzazioni</span>
                <span>⏱️ ${article.reading_time_minutes || 5} min</span>
            </div>
            <h2 class="featured-title">${article.titolo}</h2>
            <p class="featured-excerpt">${article.sommario || ''}</p>
            <a href="pages/article.html?id=${article.id}" class="btn btn-primary">
                Leggi Articolo Completo
            </a>
        </div>
    `;
}

/**
 * Load articles with pagination
 */
async function loadArticles() {
    const container = document.getElementById('articles-grid');
    const paginationContainer = document.getElementById('pagination');
    const client = getSupabaseClient();
    
    if (!client) {
        container.innerHTML = '<div class="empty-state"><p>Impossibile caricare gli articoli.</p></div>';
        return;
    }
    
    // Show loading
    container.innerHTML = '<div class="spinner"></div>';
    
    try {
        // Build query
        let query = client
            .from('articoli')
            .select(`
                *,
                profili_redattori (nome_visualizzato)
            `, { count: 'exact' })
            .eq('stato', 'pubblicato')
            .order('data_pubblicazione', { ascending: false });
        
        // Add category filter if selected
        if (currentCategory) {
            query = query.eq('categoria', currentCategory);
        }
        
        // Add pagination
        const from = (currentPage - 1) * articlesPerPage;
        const to = from + articlesPerPage - 1;
        query = query.range(from, to);
        
        const { data, error, count } = await query;
        
        if (error) {
            console.error('Error loading articles:', error);
            container.innerHTML = '<div class="empty-state"><p>Errore nel caricamento degli articoli.</p></div>';
            return;
        }
        
        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📝</div>
                    <h3>Nessun articolo trovato</h3>
                    <p>Non ci sono articoli pubblicati${currentCategory ? ' in questa categoria' : ''}.</p>
                </div>
            `;
            paginationContainer.classList.add('hidden');
            return;
        }
        
        // Render articles
        container.innerHTML = data.map(article => renderArticleCard(article)).join('');
        
        // Setup pagination
        if (count > articlesPerPage) {
            renderPagination(count);
            paginationContainer.classList.remove('hidden');
        } else {
            paginationContainer.classList.add('hidden');
        }
        
    } catch (error) {
        console.error('Exception loading articles:', error);
        container.innerHTML = '<div class="empty-state"><p>Si è verificato un errore.</p></div>';
    }
}

/**
 * Render article card HTML
 */
function renderArticleCard(article) {
    const authorName = article.profili_redattori?.nome_visualizzato || 'Redazione';
    const publishDate = new Date(article.data_pubblicazione).toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
    
    return `
        <article class="article-card" onclick="window.location.href='pages/article.html?id=${article.id}'">
            <img src="${article.immagine_copertina || 'https://via.placeholder.com/400x300?text=' + encodeURIComponent(article.categoria)}" 
                 alt="${article.titolo}" 
                 class="article-image">
            <div class="article-content">
                <span class="article-category">${article.categoria}</span>
                <h3 class="article-title">${article.titolo}</h3>
                <p class="article-excerpt">${article.sommario || ''}</p>
                <div class="article-meta">
                    <span>👤 ${authorName}</span>
                    <span>📅 ${publishDate}</span>
                </div>
            </div>
        </article>
    `;
}

/**
 * Render pagination
 */
function renderPagination(totalCount) {
    const paginationContainer = document.getElementById('pagination');
    const totalPages = Math.ceil(totalCount / articlesPerPage);
    
    let html = '';
    
    // Previous button
    html += `
        <button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">
            ← Precedente
        </button>
    `;
    
    // Page numbers
    for (let i = 1; i <= Math.min(totalPages, 5); i++) {
        let pageNum = i;
        
        // Show first, last, and pages around current
        if (totalPages > 5) {
            if (i === 1) pageNum = 1;
            else if (i === 5) pageNum = totalPages;
            else if (currentPage <= 3) pageNum = i;
            else if (currentPage >= totalPages - 2) pageNum = totalPages - 5 + i;
            else pageNum = currentPage - 3 + i;
        }
        
        html += `
            <button class="page-btn ${currentPage === pageNum ? 'active' : ''}" onclick="changePage(${pageNum})">
                ${pageNum}
            </button>
        `;
    }
    
    // Next button
    html += `
        <button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">
            Successiva →
        </button>
    `;
    
    paginationContainer.innerHTML = html;
}

/**
 * Change page
 */
window.changePage = function(page) {
    currentPage = page;
    loadArticles();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

/**
 * Setup newsletter form
 */
function setupNewsletterForm() {
    const form = document.getElementById('newsletter-form');
    const messageContainer = document.getElementById('newsletter-message');
    
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const emailInput = document.getElementById('newsletter-email');
        const email = emailInput.value.trim();
        const client = getSupabaseClient();
        
        if (!client) {
            showNewsletterMessage('Errore: Configurazione non trovata', 'error');
            return;
        }
        
        try {
            // Generate unsubscribe token
            const unsubscribeToken = Math.random().toString(36).substring(2, 15);
            
            const { error } = await client
                .from('iscrizioni_newsletter')
                .insert([{
                    email: email,
                    unsubscribe_token: unsubscribeToken,
                    attiva: true
                }]);
            
            if (error) {
                if (error.code === '23505') { // Unique constraint violation
                    showNewsletterMessage('Sei già iscritto alla newsletter!', 'warning');
                } else {
                    console.error('Newsletter subscription error:', error);
                    showNewsletterMessage('Errore durante l\'iscrizione. Riprova.', 'error');
                }
                return;
            }
            
            showNewsletterMessage('✅ Iscrizione completata! Riceverai i nostri aggiornamenti.', 'success');
            form.reset();
            
        } catch (error) {
            console.error('Exception during newsletter subscription:', error);
            showNewsletterMessage('Errore imprevisto. Riprova più tardi.', 'error');
        }
    });
}

/**
 * Show newsletter message
 */
function showNewsletterMessage(message, type) {
    const messageContainer = document.getElementById('newsletter-message');
    const alertClass = type === 'success' ? 'alert-success' : 
                      type === 'warning' ? 'alert-warning' : 'alert-error';
    
    messageContainer.innerHTML = `<div class="alert ${alertClass}">${message}</div>`;
    messageContainer.classList.remove('hidden');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        messageContainer.classList.add('hidden');
    }, 5000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);
