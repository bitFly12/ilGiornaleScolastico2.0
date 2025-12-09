// ================================================
// Articles Management with Supabase Integration
// ================================================

// Sample articles data (fallback for offline mode)
const sampleArticles = [
    {
        id: '1',
        titolo: 'Inaugurazione Nuovo Anno Scolastico',
        sommario: 'Un nuovo anno ricco di opportunità e sfide per tutti gli studenti del Cesaris',
        contenuto: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        categoria: 'Attualità',
        tags: ['scuola', 'anno scolastico', 'eventi'],
        immagine: 'img/article-1.jpg',
        autore: { nome: 'Mario Rossi', id: '1' },
        data_pubblicazione: '2024-09-15',
        visualizzazioni: 1250,
        reading_time: 5,
        stato: 'pubblicato'
    },
    {
        id: '2',
        titolo: 'Gita Scolastica a Firenze',
        sommario: 'Gli studenti del quinto anno visitano la culla del Rinascimento italiano',
        contenuto: 'Una giornata indimenticabile tra arte, cultura e storia nella bellissima città di Firenze.',
        categoria: 'Viaggi',
        tags: ['gita', 'firenze', 'arte'],
        immagine: 'img/article-2.jpg',
        autore: { nome: 'Anna Bianchi', id: '2' },
        data_pubblicazione: '2024-10-20',
        visualizzazioni: 890,
        reading_time: 4,
        stato: 'pubblicato'
    },
    {
        id: '3',
        titolo: 'Torneo Sportivo Interclasse',
        sommario: 'Grande successo per il torneo di calcetto che ha coinvolto tutte le classi',
        contenuto: 'Sport, fair play e divertimento caratterizzano il torneo annuale della nostra scuola.',
        categoria: 'Sport',
        tags: ['sport', 'calcetto', 'torneo'],
        immagine: 'img/article-3.jpg',
        autore: { nome: 'Luca Verdi', id: '3' },
        data_pubblicazione: '2024-11-05',
        visualizzazioni: 670,
        reading_time: 3,
        stato: 'pubblicato'
    },
    {
        id: '4',
        titolo: 'Laboratorio di Coding',
        sommario: 'Nuovo corso di programmazione per gli studenti interessati alla tecnologia',
        contenuto: 'Imparare Python, JavaScript e sviluppo web attraverso progetti pratici e divertenti.',
        categoria: 'Tecnologia',
        tags: ['coding', 'programmazione', 'tecnologia'],
        immagine: 'img/article-4.jpg',
        autore: { nome: 'Sofia Neri', id: '4' },
        data_pubblicazione: '2024-11-15',
        visualizzazioni: 1120,
        reading_time: 6,
        stato: 'pubblicato'
    },
    {
        id: '5',
        titolo: 'Festival della Scienza',
        sommario: 'Tre giorni dedicati alla scoperta e alla divulgazione scientifica',
        contenuto: 'Esperimenti, conferenze e workshop per avvicinare gli studenti al mondo della scienza.',
        categoria: 'Scienza',
        tags: ['scienza', 'festival', 'esperimenti'],
        immagine: 'img/article-5.jpg',
        autore: { nome: 'Marco Blu', id: '5' },
        data_pubblicazione: '2024-11-20',
        visualizzazioni: 950,
        reading_time: 5,
        stato: 'pubblicato'
    },
    {
        id: '6',
        titolo: 'Teatro Studentesco',
        sommario: 'La compagnia teatrale presenta il suo nuovo spettacolo',
        contenuto: 'Una rappresentazione moderna di un classico della letteratura italiana.',
        categoria: 'Cultura',
        tags: ['teatro', 'spettacolo', 'cultura'],
        immagine: 'img/article-6.jpg',
        autore: { nome: 'Elena Gialli', id: '6' },
        data_pubblicazione: '2024-11-25',
        visualizzazioni: 780,
        reading_time: 4,
        stato: 'pubblicato'
    },
    {
        id: '7',
        titolo: 'Concorso Letterario',
        sommario: 'Partecipa al concorso di scrittura creativa della scuola',
        contenuto: 'Racconti brevi, poesie e saggi: mostra il tuo talento letterario.',
        categoria: 'Cultura',
        tags: ['letteratura', 'concorso', 'scrittura'],
        immagine: 'img/article-7.jpg',
        autore: { nome: 'Paolo Viola', id: '7' },
        data_pubblicazione: '2024-11-28',
        visualizzazioni: 620,
        reading_time: 3,
        stato: 'pubblicato'
    },
    {
        id: '8',
        titolo: 'Orientamento Universitario',
        sommario: 'Incontri con rappresentanti di diverse università per aiutare nella scelta',
        contenuto: 'Informazioni su corsi di laurea, test di ingresso e sbocchi professionali.',
        categoria: 'Orientamento',
        tags: ['università', 'orientamento', 'futuro'],
        immagine: 'img/article-8.jpg',
        autore: { nome: 'Giulia Rosa', id: '8' },
        data_pubblicazione: '2024-12-01',
        visualizzazioni: 1340,
        reading_time: 7,
        stato: 'pubblicato'
    }
];

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
    
    // Try to load from Supabase first
    if (window.SupabaseAPI) {
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
            return;
        }
    }
    
    // Fallback to sample articles
    const startIndex = offset;
    const endIndex = startIndex + articlesPerPage;
    const articlesToShow = sampleArticles.slice(startIndex, endIndex);
    
    // Clear existing articles
    articlesGrid.innerHTML = '';
    
    // Add articles to grid
    articlesToShow.forEach(article => {
        const articleCard = createArticleCard(article);
        articlesGrid.appendChild(articleCard);
    });
    
    // Add fade-in animation
    const cards = articlesGrid.querySelectorAll('.article-card');
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('fade-in');
        }, index * 100);
    });
}

// ================================================
// Create Article Card from Supabase Data
// ================================================
function createArticleCardFromSupabase(article) {
    const card = document.createElement('div');
    card.className = 'article-card article-card-mini';
    
    // Use placeholder if image doesn't exist
    const imageSrc = article.immagine_url || createPlaceholderImage(article.categoria);
    const authorName = article.autore?.nome_visualizzato || 'Anonimo';
    
    card.innerHTML = `
        <img src="${imageSrc}" alt="${article.titolo}" onerror="this.src='${createPlaceholderImage(article.categoria)}'">
        <div class="card-body">
            <span style="font-size: 0.75rem; color: var(--primary); font-weight: 600; text-transform: uppercase;">${article.categoria}</span>
            <h3 class="card-title">${truncateText(article.titolo, 60)}</h3>
            <div class="card-meta">
                <span>👤 ${authorName}</span>
                <span>📖 ${article.reading_time_minutes} min</span>
            </div>
            <a href="articolo.html?id=${article.id}" class="btn btn-primary btn-sm" style="margin-top: 0.5rem; width: 100%;">Leggi</a>
        </div>
    `;
    
    return card;
}

// ================================================
// Create Article Card
// ================================================
function createArticleCard(article) {
    const card = document.createElement('div');
    card.className = 'article-card article-card-mini';
    
    // Use placeholder if image doesn't exist
    const imageSrc = article.immagine || createPlaceholderImage(article.categoria);
    
    card.innerHTML = `
        <img src="${imageSrc}" alt="${article.titolo}" onerror="this.src='${createPlaceholderImage(article.categoria)}'">
        <div class="card-body">
            <span style="font-size: 0.75rem; color: var(--primary); font-weight: 600; text-transform: uppercase;">${article.categoria}</span>
            <h3 class="card-title">${truncateText(article.titolo, 60)}</h3>
            <div class="card-meta">
                <span>👤 ${article.autore.nome}</span>
                <span>📖 ${article.reading_time} min</span>
            </div>
            <a href="articolo.html?id=${article.id}" class="btn btn-primary btn-sm" style="margin-top: 0.5rem; width: 100%;">Leggi</a>
        </div>
    `;
    
    return card;
}

// ================================================
// Load Hero Article
// ================================================
async function loadHeroArticle() {
    // Try to get featured article from Supabase
    if (window.SupabaseAPI) {
        const result = await window.SupabaseAPI.getArticles({ limit: 1 });
        if (result.success && result.data && result.data.length > 0) {
            const heroArticle = result.data[0];
            updateHeroUI(heroArticle);
            return;
        }
    }
    
    // Fallback to sample articles
    const heroArticle = sampleArticles.reduce((prev, current) => 
        (prev.visualizzazioni > current.visualizzazioni) ? prev : current
    );
    updateHeroUI(heroArticle);
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
    
    // Try to get trending from Supabase
    if (window.SupabaseAPI) {
        const result = await window.SupabaseAPI.getArticles({ limit: 3 });
        if (result.success && result.data && result.data.length > 0) {
            renderTrendingArticles(result.data, trendingGrid);
            return;
        }
    }
    
    // Fallback to sample articles
    const trendingArticles = [...sampleArticles]
        .sort((a, b) => b.visualizzazioni - a.visualizzazioni)
        .slice(0, 3);
    
    renderTrendingArticles(trendingArticles, trendingGrid);
}

function renderTrendingArticles(articles, container) {
    container.innerHTML = '';
    
    articles.forEach((article, index) => {
        const medal = ['🥇', '🥈', '🥉'][index];
        const authorName = article.autore?.nome_visualizzato || article.autore?.nome || 'Redazione';
        const views = article.visualizzazioni || 0;
        const imageSrc = article.immagine_url || article.immagine || createPlaceholderImage(article.categoria);
        
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <img src="${imageSrc}" alt="${article.titolo}" class="card-img" onerror="this.src='${createPlaceholderImage(article.categoria)}'">
            <div class="card-body">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <span style="font-size: 0.875rem; color: var(--primary); font-weight: 600;">${article.categoria}</span>
                    <span style="font-size: 1.5rem;">${medal}</span>
                </div>
                <h3 class="card-title">${article.titolo}</h3>
                <p class="card-text">${truncateText(article.sommario, 100)}</p>
                <div class="card-meta">
                    <span>👤 ${authorName}</span>
                    <span>👁️ ${views}</span>
                </div>
                <a href="articolo.html?id=${article.id}" class="btn btn-primary" style="margin-top: 1rem; width: 100%;">Leggi Articolo</a>
            </div>
        `;
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
// Get Article by ID
// ================================================
function getArticleById(id) {
    return sampleArticles.find(article => article.id === id);
}

// ================================================
// Filter Articles
// ================================================
function filterArticlesByCategory(category) {
    return sampleArticles.filter(article => article.categoria === category);
}

function searchArticles(query) {
    const lowerQuery = query.toLowerCase();
    return sampleArticles.filter(article => 
        article.titolo.toLowerCase().includes(lowerQuery) ||
        article.sommario.toLowerCase().includes(lowerQuery) ||
        article.contenuto.toLowerCase().includes(lowerQuery) ||
        article.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
}

// ================================================
// Save Article (for reporters)
// ================================================
function saveArticle(articleData) {
    // In production, this would be an API call
    const article = {
        id: generateUUID(),
        ...articleData,
        data_creazione: new Date().toISOString(),
        visualizzazioni: 0,
        stato: 'bozza'
    };
    
    // Save to localStorage
    let articles = JSON.parse(localStorage.getItem('userArticles') || '[]');
    articles.push(article);
    localStorage.setItem('userArticles', JSON.stringify(articles));
    
    return { success: true, article };
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
window.sampleArticles = sampleArticles;

console.log('✅ Articles.js caricato con successo');
