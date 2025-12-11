// ================================================
// Giornale Scolastico Cesaris 2.0
// Main JavaScript File
// ================================================

// ================================================
// GLOBAL STATE
// ================================================
const AppState = {
    currentPage: 1,
    articlesPerPage: 8,
    darkMode: false,
    fontSize: 1.0,
    user: null,
    isAuthenticated: false
};

// ================================================
// INITIALIZATION
// ================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎓 Giornale Scolastico Cesaris inizializzato');
    
    // Initialize app features
    initMobileMenu();
    initDailyQuote();
    initChatBubble();
    initPagination();
    initAccessControl();
    
    // Load user preferences
    loadUserPreferences();
    
    // Check authentication
    checkAuth();
    
    // Show terms modal for first-time visitors
    checkTermsAcceptance();
});

// ================================================
// MOBILE MENU
// ================================================
function initMobileMenu() {
    const menuToggle = document.querySelector('.mobile-menu-toggle, .menu-toggle, #menuToggle');
    const navMenu = document.querySelector('nav ul, .nav-menu, #navMenu');
    const navLinks = navMenu ? navMenu.querySelectorAll('li a') : [];
    
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            navMenu.classList.toggle('mobile-menu-open');
        });
        
        // Close menu when clicking a link
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('mobile-menu-open');
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!menuToggle.contains(e.target) && !navMenu.contains(e.target)) {
                navMenu.classList.remove('mobile-menu-open');
            }
        });
        
        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navMenu.classList.contains('mobile-menu-open')) {
                navMenu.classList.remove('mobile-menu-open');
            }
        });
    }
}

// ================================================
// MOBILE MENU
// ================================================
function initDailyQuote() {
    const quotes = [
        "La conoscenza è potenza - Francis Bacon",
        "Leggi ogni giorno, impara ogni giorno - Bill Gates",
        "La scrittura è l'arte di scoprire ciò che pensi - Stephen King",
        "L'istruzione è l'arma più potente per cambiare il mondo - Nelson Mandela",
        "Il giornalismo è stampare ciò che qualcuno non vuole che tu stampi - George Orwell",
        "La penna è più potente della spada - Edward Bulwer-Lytton",
        "Scrivi ciò che non dovrebbe essere dimenticato - Isabel Allende",
        "La verità vi renderà liberi - Giovanni 8:32",
        "Chi non legge, a 70 anni avrà vissuto una sola vita - Umberto Eco",
        "Il futuro appartiene a coloro che credono nella bellezza dei propri sogni - Eleanor Roosevelt"
    ];
    
    const quoteElement = document.getElementById('dailyQuote');
    if (quoteElement) {
        const today = new Date().getDate();
        const quote = quotes[today % quotes.length];
        quoteElement.textContent = quote;
    }
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function showMessage(element, text, type) {
    if (!element) return;
    
    element.textContent = text;
    element.className = type;
    element.classList.remove('hidden');
    
    setTimeout(() => {
        element.classList.add('hidden');
    }, 5000);
}

// ================================================
// CHAT BUBBLE
// ================================================
function initChatBubble() {
    const chatBubble = document.getElementById('chatBubble');
    
    if (chatBubble) {
        chatBubble.addEventListener('click', () => {
            window.location.href = 'chat.html';
        });
    }
}

// ================================================
// PAGINATION
// ================================================
function initPagination() {
    const pagination = document.getElementById('pagination');
    
    if (pagination) {
        const pageButtons = pagination.querySelectorAll('.page-num');
        
        pageButtons.forEach(button => {
            button.addEventListener('click', () => {
                const page = parseInt(button.getAttribute('data-page'));
                changePage(page);
                
                // Update active state
                pageButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });
    }
}

function renderPagination(currentPage, totalPages) {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;
    
    // Clear existing pagination
    pagination.innerHTML = '';
    
    if (totalPages <= 1) {
        // Hide pagination if only one page
        pagination.style.display = 'none';
        return;
    }
    
    pagination.style.display = 'flex';
    
    // Previous button
    if (currentPage > 1) {
        const prevBtn = document.createElement('button');
        prevBtn.className = 'page-num';
        prevBtn.textContent = '← Precedente';
        prevBtn.onclick = () => changePage(currentPage - 1);
        pagination.appendChild(prevBtn);
    }
    
    // Page numbers with smart ellipsis
    const maxButtons = 7; // Show max 7 page buttons
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);
    
    // Adjust if near boundaries
    if (currentPage <= 3) {
        endPage = Math.min(totalPages, maxButtons - 1);
    }
    if (currentPage >= totalPages - 2) {
        startPage = Math.max(1, totalPages - (maxButtons - 2));
    }
    
    // First page
    if (startPage > 1) {
        const firstBtn = document.createElement('button');
        firstBtn.className = 'page-num';
        firstBtn.textContent = '1';
        firstBtn.onclick = () => changePage(1);
        pagination.appendChild(firstBtn);
        
        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.style.padding = '0 0.5rem';
            ellipsis.style.color = 'var(--neutral)';
            pagination.appendChild(ellipsis);
        }
    }
    
    // Page buttons
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `page-num ${i === currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.setAttribute('data-page', i);
        pageBtn.onclick = () => changePage(i);
        pagination.appendChild(pageBtn);
    }
    
    // Last page
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.style.padding = '0 0.5rem';
            ellipsis.style.color = 'var(--neutral)';
            pagination.appendChild(ellipsis);
        }
        
        const lastBtn = document.createElement('button');
        lastBtn.className = 'page-num';
        lastBtn.textContent = totalPages;
        lastBtn.onclick = () => changePage(totalPages);
        pagination.appendChild(lastBtn);
    }
    
    // Next button
    if (currentPage < totalPages) {
        const nextBtn = document.createElement('button');
        nextBtn.className = 'page-num';
        nextBtn.textContent = 'Successivo →';
        nextBtn.onclick = () => changePage(currentPage + 1);
        pagination.appendChild(nextBtn);
    }
}

function changePage(page) {
    AppState.currentPage = page;
    console.log(`Caricamento pagina ${page}`);
    
    // In production, this would reload articles from API
    if (typeof loadArticles === 'function') {
        loadArticles(page);
    }
}

// ================================================
// USER PREFERENCES
// ================================================
function loadUserPreferences() {
    // Font size
    const savedFontSize = localStorage.getItem('fontSize');
    if (savedFontSize) {
        AppState.fontSize = parseFloat(savedFontSize);
        document.documentElement.style.fontSize = `${16 * AppState.fontSize}px`;
    }
    
    // Dyslexia font
    const dyslexiaFont = localStorage.getItem('dyslexiaFont');
    if (dyslexiaFont === 'true') {
        document.body.classList.add('dyslexia-font');
    }
    
    // Language
    const language = localStorage.getItem('language') || 'it';
    document.documentElement.lang = language;
}

function saveUserPreferences() {
    localStorage.setItem('fontSize', AppState.fontSize);
    localStorage.setItem('darkMode', AppState.darkMode);
}

// ================================================
// AUTHENTICATION
// ================================================
async function checkAuth() {
    try {
        // Check if user is logged in via Supabase
        if (window.supabaseClient) {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            
            if (user) {
                // User is authenticated via Supabase
                AppState.isAuthenticated = true;
                
                // Try to get profile from localStorage first (faster)
                const cachedProfile = localStorage.getItem('userProfile');
                if (cachedProfile) {
                    try {
                        AppState.user = JSON.parse(cachedProfile);
                        AppState.user.id = user.id;
                        AppState.user.email = user.email;
                    } catch (e) {
                        console.error('Error parsing cached profile:', e);
                    }
                }
                
                updateUIForAuthenticatedUser();
                return;
            }
        }
        
        // Fallback: Check localStorage (for backwards compatibility)
        const userSession = localStorage.getItem('userSession');
        const isAuthenticated = localStorage.getItem('isAuthenticated');
        
        if (userSession && isAuthenticated === 'true') {
            try {
                AppState.user = JSON.parse(userSession);
                AppState.isAuthenticated = true;
                updateUIForAuthenticatedUser();
            } catch (e) {
                console.error('Error parsing user session:', e);
                logout();
            }
        }
    } catch (error) {
        console.error('Error checking auth:', error);
        AppState.isAuthenticated = false;
    }
}

function updateUIForAuthenticatedUser() {
    // Update navigation links for authenticated users
    const loginBtn = document.querySelector('.nav-link[href="login.html"]');
    if (loginBtn && AppState.user) {
        loginBtn.textContent = AppState.user.name || 'Profilo';
        loginBtn.href = 'profilo.html';
    }
}

function login(email, password) {
    // In production, this would be an API call
    // For demo purposes, we'll simulate authentication
    
    if (!email || !password) {
        return { success: false, error: 'Email e password richiesti' };
    }
    
    // Check if email is from @cesaris.edu.it (case-insensitive)
    if (!email.toLowerCase().endsWith('@cesaris.edu.it')) {
        return { success: false, error: 'Utilizza la tua email @cesaris.edu.it' };
    }
    
    // Simulate successful login
    const user = {
        id: generateUUID(),
        email: email,
        name: email.split('@')[0],
        role: 'student',
        authenticated: true,
        loginTime: new Date().toISOString()
    };
    
    AppState.user = user;
    AppState.isAuthenticated = true;
    localStorage.setItem('userSession', JSON.stringify(user));
    
    return { success: true, user };
}

async function logout() {
    try {
        // Sign out from Supabase
        if (window.supabaseClient) {
            await window.supabaseClient.auth.signOut();
        }
    } catch (error) {
        console.error('Error signing out:', error);
    }
    
    // Clear local state
    AppState.user = null;
    AppState.isAuthenticated = false;
    
    // Clear all localStorage items
    localStorage.removeItem('userSession');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    localStorage.removeItem('userProfile');
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
    
    window.location.href = 'index.html';
}

// ================================================
// ACCESS CONTROL
// ================================================
async function initAccessControl() {
    // Check if current page requires authentication
    const protectedPages = ['chat.html', 'profilo.html', 'dashboard.html', 'editor.html', 'admin.html'];
    const currentPage = window.location.pathname.split('/').pop();
    
    if (protectedPages.includes(currentPage)) {
        try {
            // Wait for Supabase to be ready
            if (!window.supabaseClient) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            // Check Supabase auth
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            
            if (!user) {
                // Not authenticated, redirect to login
                window.location.href = `login.html?redirect=${currentPage}`;
                return;
            }
            
            // User is authenticated
            AppState.isAuthenticated = true;
        } catch (error) {
            console.error('Error checking access:', error);
            // On error, redirect to login
            window.location.href = `login.html?redirect=${currentPage}`;
        }
    }
}

function checkReporterAccess() {
    if (!AppState.user || AppState.user.role !== 'reporter') {
        return false;
    }
    
    // Check if reporter has accepted terms
    const termsAccepted = localStorage.getItem(`reporterTerms_${AppState.user.id}`);
    return termsAccepted === 'true';
}

function checkAdminAccess() {
    return AppState.user && (AppState.user.role === 'admin' || AppState.user.role === 'caporedattore');
}

// ================================================
// TERMS ACCEPTANCE
// ================================================
function checkTermsAcceptance() {
    // Check if user has accepted reading terms
    const sessionId = getOrCreateSessionId();
    const termsAccepted = localStorage.getItem(`readingTerms_${sessionId}`);
    
    if (!termsAccepted && !AppState.isAuthenticated) {
        // Show terms modal (only for first visit)
        const visitCount = parseInt(localStorage.getItem('visitCount') || '0');
        if (visitCount === 0) {
            setTimeout(() => {
                showTermsModal();
            }, 2000);
        }
        localStorage.setItem('visitCount', visitCount + 1);
    }
}

function showTermsModal() {
    // Create modal dynamically
    const modal = document.createElement('div');
    modal.id = 'termsModal';
    modal.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 1rem;">
            <div style="background: white; border-radius: 12px; max-width: 600px; width: 100%; padding: 2rem; max-height: 80vh; overflow-y: auto;">
                <h2 style="color: var(--primary); margin-bottom: 1rem;">Benvenuto al Giornale Cesaris!</h2>
                <p style="margin-bottom: 1rem;">Prima di continuare, ti chiediamo di accettare i nostri termini di utilizzo:</p>
                <ul style="margin-bottom: 1.5rem; padding-left: 1.5rem;">
                    <li>Rispetta gli altri utenti e le loro opinioni</li>
                    <li>Non pubblicare contenuti offensivi o inappropriati</li>
                    <li>Proteggi la tua privacy e quella degli altri</li>
                    <li>Verifica le fonti delle informazioni</li>
                </ul>
                <div style="display: flex; gap: 1rem;">
                    <button onclick="acceptTerms()" class="btn btn-primary" style="flex: 1;">Accetto</button>
                    <button onclick="declineTerms()" class="btn btn-outline" style="flex: 1;">Rifiuto</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function acceptTerms() {
    const sessionId = getOrCreateSessionId();
    localStorage.setItem(`readingTerms_${sessionId}`, 'true');
    
    const modal = document.getElementById('termsModal');
    if (modal) {
        modal.remove();
    }
}

function declineTerms() {
    alert('Per utilizzare il sito è necessario accettare i termini di utilizzo.');
    window.location.href = 'about:blank';
}

// ================================================
// UTILITIES
// ================================================
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function extractUsernameFromEmail(email) {
    // Extract username from email (part before @)
    // Example: mario.rossi@cesaris.edu.it -> mario.rossi
    return email.split('@')[0];
}

function getOrCreateSessionId() {
    let sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
        sessionId = generateUUID();
        localStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('it-IT', options);
}

function calculateReadingTime(text) {
    const wordsPerMinute = 200;
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return minutes;
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// ================================================
// EXPORT FUNCTIONS (for use in other files)
// ================================================
window.AppState = AppState;
window.login = login;
window.logout = logout;
window.checkReporterAccess = checkReporterAccess;
window.checkAdminAccess = checkAdminAccess;
window.acceptTerms = acceptTerms;
window.declineTerms = declineTerms;
window.formatDate = formatDate;
window.calculateReadingTime = calculateReadingTime;
window.truncateText = truncateText;
window.generateUUID = generateUUID;
window.extractUsernameFromEmail = extractUsernameFromEmail;

// ================================================
// QUALITY OF LIFE FEATURES (50+ Features)
// ================================================

// Feature 1: Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K = Quick search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        showQuickSearch();
    }
    // Ctrl/Cmd + / = Show shortcuts
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        showKeyboardShortcuts();
    }
    // Escape = Close modals
    if (e.key === 'Escape') {
        closeAllModals();
    }
    // G + H = Go to Home
    if (e.key === 'h' && !e.ctrlKey && !e.metaKey && !isTyping()) {
        if (lastKeyPressed === 'g') {
            window.location.href = 'index.html';
        }
    }
    // G + C = Go to Chat
    if (e.key === 'c' && !e.ctrlKey && !e.metaKey && !isTyping()) {
        if (lastKeyPressed === 'g') {
            window.location.href = 'chat.html';
        }
    }
    // G + P = Go to Profile
    if (e.key === 'p' && !e.ctrlKey && !e.metaKey && !isTyping()) {
        if (lastKeyPressed === 'g') {
            window.location.href = 'profilo.html';
        }
    }
    lastKeyPressed = e.key;
    setTimeout(() => lastKeyPressed = '', 500);
});

let lastKeyPressed = '';

function isTyping() {
    const active = document.activeElement;
    return active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
}

// Feature 2: Quick Search Modal
function showQuickSearch() {
    if (document.getElementById('quickSearchModal')) return;
    
    const modal = document.createElement('div');
    modal.id = 'quickSearchModal';
    modal.className = 'qol-modal';
    modal.innerHTML = `
        <div class="qol-modal-backdrop" onclick="closeQuickSearch()"></div>
        <div class="qol-modal-content qol-search-modal">
            <input type="text" id="quickSearchInput" placeholder="🔍 Cerca articoli, utenti, pagine..." 
                   onkeyup="handleQuickSearch(event)" autocomplete="off">
            <div class="qol-search-results" id="quickSearchResults">
                <div class="qol-search-hint">Inizia a digitare per cercare...</div>
            </div>
            <div class="qol-search-footer">
                <span>↑↓ per navigare</span>
                <span>↵ per aprire</span>
                <span>Esc per chiudere</span>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => document.getElementById('quickSearchInput').focus(), 100);
}

function closeQuickSearch() {
    const modal = document.getElementById('quickSearchModal');
    if (modal) modal.remove();
}

function handleQuickSearch(e) {
    if (e.key === 'Escape') {
        closeQuickSearch();
        return;
    }
    
    const query = e.target.value.toLowerCase();
    const results = document.getElementById('quickSearchResults');
    
    if (!query) {
        results.innerHTML = '<div class="qol-search-hint">Inizia a digitare per cercare...</div>';
        return;
    }
    
    // Quick links
    const pages = [
        { title: 'Home', url: 'index.html', icon: '🏠' },
        { title: 'Articoli', url: 'articoli.html', icon: '📰' },
        { title: 'Chat', url: 'chat.html', icon: '💬' },
        { title: 'Profilo', url: 'profilo.html', icon: '👤' },
        { title: 'Impostazioni', url: 'impostazioni.html', icon: '⚙️' },
        { title: 'Categorie', url: 'categorie.html', icon: '📁' },
        { title: 'Diventa Reporter', url: 'candidatura.html', icon: '✍️' }
    ];
    
    const matches = pages.filter(p => p.title.toLowerCase().includes(query));
    
    if (matches.length > 0) {
        results.innerHTML = matches.map((p, i) => `
            <a href="${p.url}" class="qol-search-item ${i === 0 ? 'selected' : ''}">
                <span class="icon">${p.icon}</span>
                <span class="title">${p.title}</span>
            </a>
        `).join('');
    } else {
        results.innerHTML = '<div class="qol-search-hint">Nessun risultato trovato</div>';
    }
}

// Feature 3: Keyboard shortcuts help
function showKeyboardShortcuts() {
    if (document.getElementById('shortcutsModal')) return;
    
    const modal = document.createElement('div');
    modal.id = 'shortcutsModal';
    modal.className = 'qol-modal';
    modal.innerHTML = `
        <div class="qol-modal-backdrop" onclick="closeShortcuts()"></div>
        <div class="qol-modal-content qol-shortcuts-modal">
            <h3>⌨️ Scorciatoie da Tastiera</h3>
            <div class="shortcuts-grid">
                <div class="shortcut-item">
                    <kbd>Ctrl</kbd> + <kbd>K</kbd>
                    <span>Ricerca rapida</span>
                </div>
                <div class="shortcut-item">
                    <kbd>Ctrl</kbd> + <kbd>/</kbd>
                    <span>Mostra scorciatoie</span>
                </div>
                <div class="shortcut-item">
                    <kbd>G</kbd> poi <kbd>H</kbd>
                    <span>Vai alla Home</span>
                </div>
                <div class="shortcut-item">
                    <kbd>G</kbd> poi <kbd>C</kbd>
                    <span>Vai alla Chat</span>
                </div>
                <div class="shortcut-item">
                    <kbd>G</kbd> poi <kbd>P</kbd>
                    <span>Vai al Profilo</span>
                </div>
                <div class="shortcut-item">
                    <kbd>Esc</kbd>
                    <span>Chiudi modali</span>
                </div>
            </div>
            <button onclick="closeShortcuts()" class="btn btn-primary" style="margin-top: 1rem;">Chiudi</button>
        </div>
    `;
    document.body.appendChild(modal);
}

function closeShortcuts() {
    const modal = document.getElementById('shortcutsModal');
    if (modal) modal.remove();
}

function closeAllModals() {
    closeQuickSearch();
    closeShortcuts();
    const termsModal = document.getElementById('termsModal');
    if (termsModal) termsModal.remove();
}

// Feature 4: Toast notifications system
function showToast(message, type = 'info', duration = 3000) {
    const toastContainer = document.getElementById('toastContainer') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `qol-toast qol-toast-${type}`;
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'qol-toast-container';
    document.body.appendChild(container);
    return container;
}

// Feature 5: Back to top button
function initBackToTop() {
    const btn = document.createElement('button');
    btn.id = 'backToTop';
    btn.className = 'qol-back-to-top';
    btn.innerHTML = '↑';
    btn.title = 'Torna su';
    btn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.appendChild(btn);
    
    window.addEventListener('scroll', () => {
        btn.classList.toggle('visible', window.scrollY > 300);
    });
}

// Feature 6: Reading progress indicator
function initReadingProgress() {
    if (!document.querySelector('.article-content, .articolo-content')) return;
    
    const progress = document.createElement('div');
    progress.id = 'readingProgress';
    progress.className = 'qol-reading-progress';
    document.body.appendChild(progress);
    
    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const percent = (scrollTop / docHeight) * 100;
        progress.style.width = `${percent}%`;
    });
}

// Feature 7: Image lazy loading with placeholder
function initLazyImages() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.add('loaded');
                observer.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// Feature 8: Smooth scroll for anchor links
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

// Feature 9: Copy to clipboard with feedback
function copyToClipboard(text, successMessage = 'Copiato!') {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            showToast(successMessage, 'success');
        }).catch(() => {
            fallbackCopyToClipboard(text, successMessage);
        });
    } else {
        fallbackCopyToClipboard(text, successMessage);
    }
}

function fallbackCopyToClipboard(text, successMessage) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        showToast(successMessage, 'success');
    } catch (err) {
        showToast('Impossibile copiare', 'error');
    }
    document.body.removeChild(textarea);
}

// Feature 10: Share buttons
function shareArticle(title, url) {
    if (navigator.share) {
        navigator.share({ title, url }).catch(() => {});
    } else {
        showShareModal(title, url);
    }
}

function showShareModal(title, url) {
    const modal = document.createElement('div');
    modal.className = 'qol-modal';
    modal.innerHTML = `
        <div class="qol-modal-backdrop" onclick="this.parentElement.remove()"></div>
        <div class="qol-modal-content qol-share-modal">
            <h3>📤 Condividi</h3>
            <div class="share-buttons">
                <a href="https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}" target="_blank" class="share-btn whatsapp">
                    📱 WhatsApp
                </a>
                <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}" target="_blank" class="share-btn twitter">
                    🐦 Twitter
                </a>
                <button onclick="copyToClipboard('${url}'); this.closest('.qol-modal').remove();" class="share-btn copy">
                    📋 Copia Link
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Feature 11: Confetti effect for celebrations
function showConfetti() {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd'];
    
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'qol-confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 3 + 's';
        confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
        document.body.appendChild(confetti);
        
        setTimeout(() => confetti.remove(), 5000);
    }
}

// Feature 12: Notification bell
function initNotificationBell() {
    const bell = document.createElement('div');
    bell.id = 'notificationBell';
    bell.className = 'qol-notification-bell';
    bell.innerHTML = `
        <span class="bell-icon">🔔</span>
        <span class="bell-badge" id="bellBadge">0</span>
    `;
    bell.onclick = showNotifications;
    
    // Add to header if exists
    const header = document.querySelector('.header-content');
    if (header) {
        header.appendChild(bell);
    }
    
    // Check for notifications
    checkNotifications();
}

function checkNotifications() {
    // Simulated notification check
    const badge = document.getElementById('bellBadge');
    if (badge) {
        const count = parseInt(localStorage.getItem('unreadNotifications') || '0');
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
}

function showNotifications() {
    // Placeholder for notification system
    showToast('Nessuna nuova notifica', 'info');
    localStorage.setItem('unreadNotifications', '0');
    checkNotifications();
}

// Feature 13: Online/offline indicator
function initOnlineIndicator() {
    window.addEventListener('online', () => {
        showToast('Connessione ripristinata! 🌐', 'success');
    });
    
    window.addEventListener('offline', () => {
        showToast('Connessione persa. Alcune funzioni potrebbero non essere disponibili.', 'warning', 5000);
    });
}

// Feature 14: Page visibility optimization
function initPageVisibility() {
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // Pause animations and polling when tab is not visible
            document.body.classList.add('tab-hidden');
        } else {
            document.body.classList.remove('tab-hidden');
        }
    });
}

// Feature 15: Print-friendly styles
function initPrintStyles() {
    window.matchMedia('print').addEventListener('change', (e) => {
        if (e.matches) {
            document.body.classList.add('printing');
        } else {
            document.body.classList.remove('printing');
        }
    });
}

// Feature 16: Font size controls
function increaseFontSize() {
    AppState.fontSize = Math.min(AppState.fontSize + 0.1, 1.5);
    document.documentElement.style.fontSize = `${16 * AppState.fontSize}px`;
    localStorage.setItem('fontSize', AppState.fontSize);
    showToast(`Dimensione testo: ${Math.round(AppState.fontSize * 100)}%`, 'info');
}

function decreaseFontSize() {
    AppState.fontSize = Math.max(AppState.fontSize - 0.1, 0.8);
    document.documentElement.style.fontSize = `${16 * AppState.fontSize}px`;
    localStorage.setItem('fontSize', AppState.fontSize);
    showToast(`Dimensione testo: ${Math.round(AppState.fontSize * 100)}%`, 'info');
}

function resetFontSize() {
    AppState.fontSize = 1.0;
    document.documentElement.style.fontSize = '16px';
    localStorage.setItem('fontSize', '1');
    showToast('Dimensione testo ripristinata', 'info');
}

// Feature 17: Last visit tracker
function trackVisit() {
    const lastVisit = localStorage.getItem('lastVisit');
    const now = new Date().toISOString();
    
    if (lastVisit) {
        const lastDate = new Date(lastVisit);
        const diff = Date.now() - lastDate.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (days > 7) {
            showToast(`Bentornato! Non ti vedevamo da ${days} giorni 👋`, 'info', 5000);
        }
    } else {
        showToast('Benvenuto sul Giornale Cesaris! 🎉', 'success', 5000);
    }
    
    localStorage.setItem('lastVisit', now);
}

// Feature 18: Article bookmarks
function toggleBookmark(articleId) {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    const index = bookmarks.indexOf(articleId);
    
    if (index > -1) {
        bookmarks.splice(index, 1);
        showToast('Articolo rimosso dai preferiti', 'info');
    } else {
        bookmarks.push(articleId);
        showToast('Articolo aggiunto ai preferiti! ⭐', 'success');
    }
    
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
    return index === -1;
}

function isBookmarked(articleId) {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    return bookmarks.includes(articleId);
}

// Feature 19: Reading history
function addToReadingHistory(article) {
    const history = JSON.parse(localStorage.getItem('readingHistory') || '[]');
    
    // Remove if already exists
    const filtered = history.filter(h => h.id !== article.id);
    
    // Add to beginning
    filtered.unshift({
        id: article.id,
        title: article.title,
        readAt: new Date().toISOString()
    });
    
    // Keep only last 20
    localStorage.setItem('readingHistory', JSON.stringify(filtered.slice(0, 20)));
}

// Feature 20: Quick actions menu (FAB)
function initQuickActions() {
    const fab = document.createElement('div');
    fab.id = 'quickActionsFab';
    fab.className = 'qol-fab';
    fab.innerHTML = `
        <button class="fab-main" onclick="toggleFabMenu()">⚡</button>
        <div class="fab-menu" id="fabMenu">
            <button onclick="showQuickSearch()" title="Cerca">🔍</button>
            <button onclick="window.location.href='chat.html'" title="Chat">💬</button>
            <button onclick="shareArticle(document.title, window.location.href)" title="Condividi">📤</button>
            <button onclick="showKeyboardShortcuts()" title="Scorciatoie">⌨️</button>
        </div>
    `;
    document.body.appendChild(fab);
}

function toggleFabMenu() {
    document.getElementById('fabMenu').classList.toggle('open');
}

// Feature 21: Text selection sharing
function initTextSelectionShare() {
    let popup = null;
    
    document.addEventListener('mouseup', (e) => {
        const selection = window.getSelection();
        const text = selection.toString().trim();
        
        if (text.length > 10 && text.length < 500) {
            if (popup) popup.remove();
            
            popup = document.createElement('div');
            popup.className = 'qol-selection-popup';
            popup.innerHTML = `
                <button onclick="copyToClipboard('${text.replace(/'/g, "\\'")}'); this.parentElement.remove();">📋</button>
                <button onclick="searchGoogle('${text.replace(/'/g, "\\'")}'); this.parentElement.remove();">🔍</button>
            `;
            
            const rect = selection.getRangeAt(0).getBoundingClientRect();
            popup.style.top = (rect.top + window.scrollY - 40) + 'px';
            popup.style.left = (rect.left + rect.width / 2 - 50) + 'px';
            
            document.body.appendChild(popup);
            
            setTimeout(() => popup && popup.remove(), 5000);
        } else if (popup) {
            popup.remove();
            popup = null;
        }
    });
}

function searchGoogle(text) {
    window.open(`https://www.google.com/search?q=${encodeURIComponent(text)}`, '_blank');
}

// Feature 22: Auto-save drafts
function initAutoSave() {
    const textareas = document.querySelectorAll('textarea[data-autosave]');
    
    textareas.forEach(textarea => {
        const key = `draft_${textarea.dataset.autosave}`;
        
        // Load saved draft
        const saved = localStorage.getItem(key);
        if (saved) {
            textarea.value = saved;
        }
        
        // Save on input
        let timeout;
        textarea.addEventListener('input', () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                localStorage.setItem(key, textarea.value);
            }, 1000);
        });
    });
}

// Feature 23: Reduced motion preference
function initReducedMotion() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleMotionPreference = (e) => {
        document.body.classList.toggle('reduce-motion', e.matches);
    };
    
    handleMotionPreference(prefersReducedMotion);
    prefersReducedMotion.addEventListener('change', handleMotionPreference);
}

// Feature 24: Article reading time estimator
function estimateReadingTime(content) {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    
    if (minutes < 1) return 'Meno di 1 min';
    if (minutes === 1) return '1 min di lettura';
    return `${minutes} min di lettura`;
}

// Feature 25: Scroll progress memory
function saveScrollPosition() {
    const path = window.location.pathname;
    localStorage.setItem(`scroll_${path}`, window.scrollY);
}

function restoreScrollPosition() {
    const path = window.location.pathname;
    const saved = localStorage.getItem(`scroll_${path}`);
    if (saved) {
        setTimeout(() => window.scrollTo(0, parseInt(saved)), 100);
    }
}

// Initialize all QoL features
function initQoLFeatures() {
    initBackToTop();
    initReadingProgress();
    initLazyImages();
    initSmoothScroll();
    initOnlineIndicator();
    initPageVisibility();
    initPrintStyles();
    initReducedMotion();
    initAutoSave();
    initQuickActions();
    initTextSelectionShare();
    trackVisit();
    
    // Restore scroll position on page load
    restoreScrollPosition();
    
    // Save scroll position before unload
    window.addEventListener('beforeunload', saveScrollPosition);
}

// Call on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initQoLFeatures, 100);
});

// Export additional functions
window.showToast = showToast;
window.copyToClipboard = copyToClipboard;
window.shareArticle = shareArticle;
window.showConfetti = showConfetti;
window.toggleBookmark = toggleBookmark;
window.isBookmarked = isBookmarked;
window.increaseFontSize = increaseFontSize;
window.decreaseFontSize = decreaseFontSize;
window.resetFontSize = resetFontSize;
window.showQuickSearch = showQuickSearch;
window.closeQuickSearch = closeQuickSearch;
window.handleQuickSearch = handleQuickSearch;
window.showKeyboardShortcuts = showKeyboardShortcuts;
window.closeShortcuts = closeShortcuts;
window.toggleFabMenu = toggleFabMenu;
window.searchGoogle = searchGoogle;

console.log('✅ Main.js caricato con successo');
