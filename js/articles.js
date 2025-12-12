// ================================================
// Articles Management with Supabase Integration
// ================================================

// NOTE: All sample articles removed - using Supabase database only
// Articles are now loaded from the 'articoli' table in Supabase

// ================================================
// Load Articles on Page
// ================================================
async function loadArticles(page = 1) {
    const articlesGrid = document.getElementById('articlesGrid');
    if (!articlesGrid) return;
    
    const articlesPerPage = window.AppState?.articlesPerPage || 8;
    const offset = (page - 1) * articlesPerPage;
    
    // Show loading state
    articlesGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem;"><div class="spinner"></div><p>Caricamento articoli...</p></div>';
    
    // Load from Supabase only
    if (!window.SupabaseAPI) {
        articlesGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem;"><p style="color: var(--error);">Errore: Supabase non inizializzato</p></div>';
        return;
    }
    
    const result = await window.SupabaseAPI.getArticles({ 
        limit: articlesPerPage, 
        offset: offset 
    });
    
    if (result.success && result.data && result.data.length > 0) {
        articlesGrid.innerHTML = '';
        result.data.forEach(article => {
            const articleCard = createArticleCardFromSupabase(article);
            articlesGrid.appendChild(articleCard);
        });
        
        // Add fade-in animation
        const cards = articlesGrid.querySelectorAll('.article-card');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('fade-in');
            }, index * 100);
        });
    } else {
        // Show empty state
        articlesGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 4rem 2rem;">
                <div style="font-size: 4rem; margin-bottom: 1rem;">📰</div>
                <h3 style="color: var(--text-dark); margin-bottom: 0.5rem;">Nessun articolo pubblicato</h3>
                <p style="color: var(--neutral); margin-bottom: 1.5rem;">Torna più tardi per nuovi contenuti</p>
                ${result.error ? `<p style="color: var(--error); font-size: 0.875rem;">Errore: ${result.error}</p>` : ''}
            </div>
        `;
    }
}

// ================================================
// Create Article Card from Supabase Data
// ================================================
function createArticleCardFromSupabase(article) {
    const card = document.createElement('div');
    card.className = 'article-card article-card-mini';
    card.style.cursor = 'pointer';
    
    // Use placeholder if image doesn't exist
    const imageSrc = article.immagine_url || createPlaceholderImage(article.categoria);
    const authorName = article.autore?.nome_visualizzato || 'Anonimo';
    const articleUrl = `articolo.html?id=${article.id}`;
    
    card.innerHTML = `
        <a href="${articleUrl}" style="display: block; text-decoration: none; color: inherit;">
            <img src="${imageSrc}" alt="${escapeHtml(article.titolo)}" onerror="this.src='${createPlaceholderImage(article.categoria)}'">
            <div class="card-body">
                <span style="font-size: 0.75rem; color: var(--primary); font-weight: 600; text-transform: uppercase;">${escapeHtml(article.categoria)}</span>
                <h3 class="card-title">${truncateText(escapeHtml(article.titolo), 60)}</h3>
                <div class="card-meta">
                    <span>👤 ${escapeHtml(authorName)}</span>
                    <span>📖 ${article.reading_time_minutes || 5} min</span>
                </div>
                <span class="btn btn-primary btn-sm" style="margin-top: 0.5rem; width: 100%; display: block; text-align: center;">Leggi</span>
            </div>
        </a>
    `;
    
    // Make entire card clickable with touch support
    card.addEventListener('click', (e) => {
        if (e.target.tagName !== 'A') {
            window.location.href = articleUrl;
        }
    });
    
    return card;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ================================================
// Create Article Card (handles Supabase format)
// ================================================
function createArticleCard(article) {
    const card = document.createElement('div');
    card.className = 'article-card article-card-mini';
    card.style.cursor = 'pointer';
    
    // Use placeholder if image doesn't exist
    const imageSrc = article.immagine_url || article.immagine || createPlaceholderImage(article.categoria);
    const authorName = article.autore?.nome_visualizzato || article.autore?.nome || 'Redazione';
    const readingTime = article.reading_time_minutes || article.reading_time || 5;
    const articleUrl = `articolo.html?id=${article.id}`;
    
    card.innerHTML = `
        <a href="${articleUrl}" style="display: block; text-decoration: none; color: inherit;">
            <img src="${imageSrc}" alt="${escapeHtml(article.titolo)}" onerror="this.src='${createPlaceholderImage(article.categoria)}'">
            <div class="card-body">
                <span style="font-size: 0.75rem; color: var(--primary); font-weight: 600; text-transform: uppercase;">${escapeHtml(article.categoria)}</span>
                <h3 class="card-title">${truncateText(escapeHtml(article.titolo), 60)}</h3>
                <div class="card-meta">
                    <span>👤 ${escapeHtml(authorName)}</span>
                    <span>📖 ${readingTime} min</span>
                </div>
                <span class="btn btn-primary btn-sm" style="margin-top: 0.5rem; width: 100%; display: block; text-align: center;">Leggi</span>
            </div>
        </a>
    `;
    
    // Make entire card clickable with touch support
    card.addEventListener('click', (e) => {
        if (e.target.tagName !== 'A') {
            window.location.href = articleUrl;
        }
    });
    
    return card;
}

// ================================================
// Load Hero Article
// ================================================
async function loadHeroArticle() {
    // Get featured article from Supabase
    if (!window.SupabaseAPI) return;
    
    const result = await window.SupabaseAPI.getArticles({ limit: 1 });
    if (result.success && result.data && result.data.length > 0) {
        const heroArticle = result.data[0];
        updateHeroUI(heroArticle);
    }
}

function updateHeroUI(article) {
    const heroTitle = document.getElementById('heroTitle');
    const heroMeta = document.getElementById('heroMeta');
    const heroBtn = document.getElementById('heroBtn');
    const heroImg = document.getElementById('heroImg');
    
    const authorName = article.autore?.nome_visualizzato || article.autore?.nome || 'Redazione';
    const readingTime = article.reading_time_minutes || article.reading_time || 5;
    const views = article.visualizzazioni || 0;
    
    if (heroTitle) heroTitle.textContent = article.titolo;
    if (heroMeta) heroMeta.textContent = `${authorName} | ${readingTime} min | ${views} visualizzazioni`;
    if (heroBtn) heroBtn.href = `articolo.html?id=${article.id}`;
    if (heroImg) heroImg.src = article.immagine_url || article.immagine || createPlaceholderImage(article.categoria);
}

// ================================================
// Load Trending Articles
// ================================================
async function loadTrendingArticles() {
    const trendingGrid = document.getElementById('trendingGrid');
    if (!trendingGrid) return;
    
    // Get trending from Supabase
    if (!window.SupabaseAPI) return;
    
    const result = await window.SupabaseAPI.getArticles({ limit: 3 });
    if (result.success && result.data && result.data.length > 0) {
        renderTrendingArticles(result.data, trendingGrid);
    } else {
        trendingGrid.innerHTML = '<p style="text-align: center; color: var(--neutral); grid-column: 1/-1;">Nessun articolo disponibile</p>';
    }
}

function renderTrendingArticles(articles, container) {
    container.innerHTML = '';
    
    articles.forEach((article, index) => {
        const medal = ['🥇', '🥈', '🥉'][index];
        const authorName = article.autore?.nome_visualizzato || article.autore?.nome || 'Redazione';
        const views = article.visualizzazioni || 0;
        const imageSrc = article.immagine_url || article.immagine || createPlaceholderImage(article.categoria);
        const articleUrl = `articolo.html?id=${article.id}`;
        
        const card = document.createElement('div');
        card.className = 'card';
        card.style.cursor = 'pointer';
        card.innerHTML = `
            <a href="${articleUrl}" style="display: block; text-decoration: none; color: inherit;">
                <img src="${imageSrc}" alt="${escapeHtml(article.titolo)}" class="card-img" onerror="this.src='${createPlaceholderImage(article.categoria)}'">
                <div class="card-body">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <span style="font-size: 0.875rem; color: var(--primary); font-weight: 600;">${escapeHtml(article.categoria)}</span>
                        <span style="font-size: 1.5rem;">${medal}</span>
                    </div>
                    <h3 class="card-title">${escapeHtml(article.titolo)}</h3>
                    <p class="card-text">${truncateText(escapeHtml(article.sommario || ''), 100)}</p>
                    <div class="card-meta">
                        <span>👤 ${escapeHtml(authorName)}</span>
                        <span>👁️ ${views}</span>
                    </div>
                    <span class="btn btn-primary" style="margin-top: 1rem; width: 100%; display: block; text-align: center;">Leggi Articolo</span>
                </div>
            </a>
        `;
        
        // Make entire card clickable with touch support
        card.addEventListener('click', (e) => {
            if (e.target.tagName !== 'A') {
                window.location.href = articleUrl;
            }
        });
        
        container.appendChild(card);
    });
}

// ================================================
// Create Placeholder Image
// ================================================
function createPlaceholderImage(category) {
    // Create a data URI with SVG placeholder
    const colors = {
        'Attualità': '#0033A0',
        'Sport': '#10B981',
        'Cultura': '#EC4899',
        'Tecnologia': '#FFD700',
        'Scienza': '#6366F1',
        'Viaggi': '#F59E0B',
        'Orientamento': '#8B5CF6',
        'default': '#6B7280'
    };
    
    const color = colors[category] || colors.default;
    const emoji = {
        'Attualità': '📰',
        'Sport': '⚽',
        'Cultura': '🎭',
        'Tecnologia': '💻',
        'Scienza': '🔬',
        'Viaggi': '✈️',
        'Orientamento': '🎓',
        'default': '📝'
    };
    
    const icon = emoji[category] || emoji.default;
    
    const svg = `
        <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
            <rect width="400" height="300" fill="${color}"/>
            <text x="50%" y="50%" font-size="80" text-anchor="middle" dy=".3em">${icon}</text>
        </svg>
    `;
    
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// ================================================
// Get Article by ID (from Supabase only)
// ================================================
async function getArticleById(id) {
    if (!window.SupabaseAPI) return null;
    const result = await window.SupabaseAPI.getArticleById(id);
    return result.success ? result.data : null;
}

// ================================================
// Filter Articles (from Supabase only)
// ================================================
async function filterArticlesByCategory(category) {
    if (!window.SupabaseAPI) return [];
    const result = await window.SupabaseAPI.getArticles({ categoria: category });
    return result.success ? result.data : [];
}

async function searchArticles(query) {
    if (!window.SupabaseAPI) return [];
    const result = await window.SupabaseAPI.searchArticles(query);
    return result.success ? result.data : [];
}

// ================================================
// Save Article (for reporters)
// ================================================
async function saveArticle(articleData) {
    if (!window.SupabaseAPI) {
        return { success: false, error: 'Supabase not initialized' };
    }
    
    return await window.SupabaseAPI.createArticle(articleData);
}

// ================================================
// Initialize on page load
// ================================================
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on the homepage
    if (document.getElementById('articlesGrid')) {
        loadArticles(1);
        loadHeroArticle();
        loadTrendingArticles();
    }
});

// ================================================
// Export functions
// ================================================
window.loadArticles = loadArticles;
window.getArticleById = getArticleById;
window.filterArticlesByCategory = filterArticlesByCategory;
window.searchArticles = searchArticles;
window.saveArticle = saveArticle;

console.log('✅ Articles.js loaded - using Supabase only');
