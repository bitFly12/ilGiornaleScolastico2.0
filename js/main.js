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
    
    // Check maintenance mode first
    checkMaintenanceMode();
    
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
// MAINTENANCE MODE CHECK
// ================================================
async function checkMaintenanceMode() {
    // Skip check on maintenance page and admin page
    const currentPath = window.location.pathname.toLowerCase();
    if (currentPath.includes('manutenzione.html') || 
        currentPath.includes('admin.html') ||
        currentPath.includes('login.html')) {
        return;
    }
    
    // Check local storage for maintenance mode
    const settings = JSON.parse(localStorage.getItem('siteSettings') || '{}');
    
    if (settings.maintenanceMode) {
        // Check if user is admin - check both localStorage and async Supabase check
        const userRole = localStorage.getItem('userRole');
        
        // If clearly admin, allow access
        if (userRole === 'caporedattore' || userRole === 'admin' || userRole === 'docente') {
            console.log('Admin detected, skipping maintenance redirect');
            return;
        }
        
        // Double-check with Supabase if available
        try {
            if (typeof supabase !== 'undefined') {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: profile } = await supabase
                        .from('profili_utenti')
                        .select('ruolo')
                        .eq('id', user.id)
                        .single();
                    
                    if (profile && (profile.ruolo === 'caporedattore' || profile.ruolo === 'admin' || profile.ruolo === 'docente')) {
                        localStorage.setItem('userRole', profile.ruolo);
                        console.log('Admin confirmed via Supabase, skipping maintenance redirect');
                        return;
                    }
                    
                    // User is logged in but NOT admin - destroy their session
                    console.log('Maintenance mode: Destroying non-admin user session');
                    await supabase.auth.signOut();
                }
            }
        } catch (e) {
            console.log('Supabase check failed, using localStorage');
        }
        
        // Clear all user session data for non-admins
        console.log('Maintenance mode: Clearing session data');
        localStorage.removeItem('userId');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userRole');
        localStorage.removeItem('username');
        localStorage.removeItem('userSession');
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('userProfile');
        
        // Redirect non-admin users to maintenance page
        console.log('Maintenance mode active, redirecting to maintenance page');
        window.location.replace('manutenzione.html');
        return;
    }
}

// ================================================
// MOBILE MENU - SIMPLIFIED ROBUST IMPLEMENTATION
// ================================================
function initMobileMenu() {
    // Get elements by ID (most reliable)
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (!menuToggle || !navMenu) {
        console.log('Mobile menu: Elements not found (menuToggle or navMenu missing)');
        return;
    }
    
    console.log('Mobile menu: Initializing...');
    
    // Create overlay if it doesn't exist
    let overlay = document.getElementById('mobileMenuOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'mobileMenuOverlay';
        overlay.className = 'mobile-menu-overlay';
        document.body.appendChild(overlay);
    }
    
    let isOpen = false;
    
    function openMenu() {
        if (isOpen) return;
        isOpen = true;
        navMenu.classList.add('mobile-menu-open');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        menuToggle.innerHTML = '<span>✕</span>';
        menuToggle.setAttribute('aria-expanded', 'true');
        console.log('Mobile menu: Opened');
    }
    
    function closeMenu() {
        if (!isOpen) return;
        isOpen = false;
        navMenu.classList.remove('mobile-menu-open');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
        menuToggle.innerHTML = '<span>☰</span>';
        menuToggle.setAttribute('aria-expanded', 'false');
        console.log('Mobile menu: Closed');
    }
    
    // Toggle button - click event
    menuToggle.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (isOpen) {
            closeMenu();
        } else {
            openMenu();
        }
    });
    
    // Overlay click - close menu
    overlay.addEventListener('click', function(e) {
        e.preventDefault();
        closeMenu();
    });
    
    // Menu links - close menu on click
    const links = navMenu.querySelectorAll('a');
    links.forEach(function(link) {
        link.addEventListener('click', function() {
            setTimeout(closeMenu, 100);
        });
    });
    
    // Escape key - close menu
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && isOpen) {
            closeMenu();
        }
    });
    
    // Resize handler - close menu when going to desktop
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768 && isOpen) {
            closeMenu();
        }
    });
    
    console.log('Mobile menu: Initialized successfully');
}

// ================================================
// DAILY QUOTE
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
                
                // Fetch fresh profile from Supabase to check suspension status
                const { data: profile } = await window.supabaseClient
                    .from('profili_utenti')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                
                if (profile) {
                    AppState.user = profile;
                    AppState.user.id = user.id;
                    AppState.user.email = user.email;
                    
                    // Check if user is suspended (is_hidden = true)
                    if (profile.is_hidden === true) {
                        AppState.isSuspended = true;
                        localStorage.setItem('userSuspended', 'true');
                        console.log('⚠️ User is suspended - read-only mode');
                        showSuspensionNotice();
                    } else {
                        AppState.isSuspended = false;
                        localStorage.removeItem('userSuspended');
                    }
                    
                    // Cache profile
                    localStorage.setItem('userProfile', JSON.stringify(profile));
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
                AppState.isSuspended = localStorage.getItem('userSuspended') === 'true';
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

// Show suspension notice to user
function showSuspensionNotice() {
    // Only show once per session
    if (sessionStorage.getItem('suspensionNoticeShown')) return;
    sessionStorage.setItem('suspensionNoticeShown', 'true');
    
    const notice = document.createElement('div');
    notice.id = 'suspensionNotice';
    notice.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; right: 0; background: #ef4444; color: white; padding: 1rem; text-align: center; z-index: 10000; font-size: 0.9rem;">
            ⚠️ <strong>Account Sospeso:</strong> Il tuo account è stato sospeso. Puoi solo leggere contenuti. Per maggiori informazioni contatta gli amministratori.
            <button onclick="this.parentElement.remove()" style="margin-left: 1rem; background: rgba(255,255,255,0.2); border: none; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; cursor: pointer;">✕</button>
        </div>
    `;
    document.body.prepend(notice);
}

// Check if user is suspended before any action
function checkSuspensionBeforeAction(actionName = 'questa azione') {
    if (AppState.isSuspended) {
        alert(`⚠️ Il tuo account è sospeso. Non puoi eseguire ${actionName}.`);
        return true; // blocked
    }
    return false; // allowed
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

// Mobile detection helper
function isMobileDevice() {
    return window.innerWidth <= 768 || 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

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
window.isMobileDevice = isMobileDevice;

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
    
    // Create elements safely to prevent XSS
    const iconSpan = document.createElement('span');
    iconSpan.className = 'toast-icon';
    iconSpan.textContent = icons[type] || 'ℹ️';
    
    const messageSpan = document.createElement('span');
    messageSpan.className = 'toast-message';
    messageSpan.textContent = message; // Using textContent to prevent XSS
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast-close';
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', () => toast.remove());
    
    toast.appendChild(iconSpan);
    toast.appendChild(messageSpan);
    toast.appendChild(closeBtn);
    
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
    // Sanitize inputs for security
    const safeTitle = String(title).replace(/[<>"'&]/g, '');
    const safeUrl = String(url).replace(/[<>"'&]/g, '');
    
    const modal = document.createElement('div');
    modal.className = 'qol-modal';
    
    // Build modal content safely
    const backdrop = document.createElement('div');
    backdrop.className = 'qol-modal-backdrop';
    backdrop.addEventListener('click', () => modal.remove());
    
    const content = document.createElement('div');
    content.className = 'qol-modal-content qol-share-modal';
    
    const heading = document.createElement('h3');
    heading.textContent = '📤 Condividi';
    
    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'share-buttons';
    
    // WhatsApp link
    const waLink = document.createElement('a');
    waLink.href = `https://wa.me/?text=${encodeURIComponent(safeTitle + ' ' + safeUrl)}`;
    waLink.target = '_blank';
    waLink.className = 'share-btn whatsapp';
    waLink.textContent = '📱 WhatsApp';
    
    // Twitter link
    const twLink = document.createElement('a');
    twLink.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(safeTitle)}&url=${encodeURIComponent(safeUrl)}`;
    twLink.target = '_blank';
    twLink.className = 'share-btn twitter';
    twLink.textContent = '🐦 Twitter';
    
    // Copy button
    const copyBtn = document.createElement('button');
    copyBtn.className = 'share-btn copy';
    copyBtn.textContent = '📋 Copia Link';
    copyBtn.addEventListener('click', () => {
        copyToClipboard(safeUrl);
        modal.remove();
    });
    
    buttonsDiv.appendChild(waLink);
    buttonsDiv.appendChild(twLink);
    buttonsDiv.appendChild(copyBtn);
    content.appendChild(heading);
    content.appendChild(buttonsDiv);
    modal.appendChild(backdrop);
    modal.appendChild(content);
    
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
    
    // Create main button
    const mainBtn = document.createElement('button');
    mainBtn.className = 'fab-main';
    mainBtn.textContent = '⚡';
    mainBtn.addEventListener('click', toggleFabMenu);
    
    // Create menu
    const menu = document.createElement('div');
    menu.className = 'fab-menu';
    menu.id = 'fabMenu';
    
    // Search button
    const searchBtn = document.createElement('button');
    searchBtn.title = 'Cerca';
    searchBtn.textContent = '🔍';
    searchBtn.addEventListener('click', showQuickSearch);
    
    // Chat button
    const chatBtn = document.createElement('button');
    chatBtn.title = 'Chat';
    chatBtn.textContent = '💬';
    chatBtn.addEventListener('click', () => window.location.href = 'chat.html');
    
    // Share button
    const shareBtn = document.createElement('button');
    shareBtn.title = 'Condividi';
    shareBtn.textContent = '📤';
    shareBtn.addEventListener('click', () => shareArticle(document.title, window.location.href));
    
    menu.appendChild(searchBtn);
    menu.appendChild(chatBtn);
    menu.appendChild(shareBtn);
    
    // Only add keyboard shortcuts button on desktop (not mobile)
    if (!isMobileDevice()) {
        const shortcutsBtn = document.createElement('button');
        shortcutsBtn.title = 'Scorciatoie';
        shortcutsBtn.textContent = '⌨️';
        shortcutsBtn.addEventListener('click', showKeyboardShortcuts);
        menu.appendChild(shortcutsBtn);
        
        // Show shortcuts popup once per device (only on PC)
        showKeyboardShortcutsOnce();
    }
    
    fab.appendChild(mainBtn);
    fab.appendChild(menu);
    document.body.appendChild(fab);
    
    // Hide the chat bubble on mobile since FAB has chat option
    hideChatBubbleOnMobile();
}

// Show keyboard shortcuts popup once per device (PC only)
function showKeyboardShortcutsOnce() {
    const hasSeenShortcuts = localStorage.getItem('hasSeenKeyboardShortcuts');
    if (!hasSeenShortcuts) {
        setTimeout(() => {
            showKeyboardShortcuts();
            localStorage.setItem('hasSeenKeyboardShortcuts', 'true');
        }, 3000);
    }
}

// Hide chat bubble on mobile to prevent overlap with FAB
function hideChatBubbleOnMobile() {
    const chatBubble = document.getElementById('chatBubble');
    if (chatBubble && isMobileDevice()) {
        chatBubble.style.display = 'none';
    }
}

function toggleFabMenu() {
    document.getElementById('fabMenu').classList.toggle('open');
}

// Feature 21: Text selection sharing
function initTextSelectionShare() {
    let popup = null;
    let selectedText = '';
    
    document.addEventListener('mouseup', (e) => {
        const selection = window.getSelection();
        const text = selection.toString().trim();
        
        if (text.length > 10 && text.length < 500) {
            if (popup) popup.remove();
            
            // Store text safely for later use
            selectedText = text;
            
            popup = document.createElement('div');
            popup.className = 'qol-selection-popup';
            
            // Create buttons safely with event listeners instead of inline handlers
            const copyBtn = document.createElement('button');
            copyBtn.textContent = '📋';
            copyBtn.addEventListener('click', () => {
                copyToClipboard(selectedText);
                popup.remove();
            });
            
            const searchBtn = document.createElement('button');
            searchBtn.textContent = '🔍';
            searchBtn.addEventListener('click', () => {
                searchGoogle(selectedText);
                popup.remove();
            });
            
            popup.appendChild(copyBtn);
            popup.appendChild(searchBtn);
            
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

// Feature 26: Reading streak tracker
function trackReadingStreak() {
    const today = new Date().toDateString();
    const lastRead = localStorage.getItem('lastReadDate');
    let streak = parseInt(localStorage.getItem('readingStreak') || '0');
    
    if (lastRead !== today) {
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        if (lastRead === yesterday) {
            streak++;
            if (streak === 7) {
                showToast('🔥 7 giorni consecutivi di lettura! Sei incredibile!', 'success', 5000);
                showConfetti();
            } else if (streak === 30) {
                showToast('🏆 30 giorni di lettura! Sei un campione!', 'success', 5000);
                showConfetti();
            }
        } else {
            streak = 1;
        }
        localStorage.setItem('readingStreak', streak);
        localStorage.setItem('lastReadDate', today);
    }
    return streak;
}

// Feature 27: Quick jump to section (on article pages)
function initQuickJump() {
    const headings = document.querySelectorAll('h2, h3');
    if (headings.length < 3) return;
    
    const jumpBtn = document.createElement('button');
    jumpBtn.className = 'qol-quick-jump-btn';
    jumpBtn.innerHTML = '📑';
    jumpBtn.title = 'Vai a sezione';
    jumpBtn.addEventListener('click', showJumpMenu);
    document.body.appendChild(jumpBtn);
}

function showJumpMenu() {
    if (document.getElementById('jumpMenu')) {
        document.getElementById('jumpMenu').remove();
        return;
    }
    
    const headings = document.querySelectorAll('h2, h3');
    const menu = document.createElement('div');
    menu.id = 'jumpMenu';
    menu.className = 'qol-jump-menu';
    
    headings.forEach((h, i) => {
        h.id = h.id || `section-${i}`;
        const item = document.createElement('a');
        item.href = `#${h.id}`;
        item.className = h.tagName === 'H2' ? 'jump-h2' : 'jump-h3';
        item.textContent = h.textContent;
        item.addEventListener('click', () => menu.remove());
        menu.appendChild(item);
    });
    
    document.body.appendChild(menu);
    
    // Close on outside click
    setTimeout(() => {
        document.addEventListener('click', function closeMenu(e) {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        });
    }, 100);
}

// Feature 28: Double tap to like on mobile
function initDoubleTapLike() {
    if (!('ontouchstart' in window)) return;
    
    let lastTap = 0;
    document.addEventListener('touchend', (e) => {
        const target = e.target.closest('.article-card, .message-bubble');
        if (!target) return;
        
        const now = Date.now();
        if (now - lastTap < 300) {
            // Double tap detected
            showHeartAnimation(e);
        }
        lastTap = now;
    });
}

function showHeartAnimation(e) {
    const heart = document.createElement('div');
    heart.className = 'qol-heart-animation';
    heart.textContent = '❤️';
    heart.style.left = e.changedTouches[0].clientX + 'px';
    heart.style.top = e.changedTouches[0].clientY + 'px';
    document.body.appendChild(heart);
    setTimeout(() => heart.remove(), 1000);
}

// Feature 29: Pull to refresh (mobile)
function initPullToRefresh() {
    if (!('ontouchstart' in window)) return;
    
    let startY = 0;
    let pulling = false;
    
    document.addEventListener('touchstart', (e) => {
        if (window.scrollY === 0) {
            startY = e.touches[0].clientY;
            pulling = true;
        }
    });
    
    document.addEventListener('touchmove', (e) => {
        if (!pulling) return;
        const diff = e.touches[0].clientY - startY;
        if (diff > 100 && window.scrollY === 0) {
            showToast('Rilascia per aggiornare...', 'info', 1000);
        }
    });
    
    document.addEventListener('touchend', (e) => {
        if (!pulling) return;
        const diff = e.changedTouches[0].clientY - startY;
        if (diff > 100 && window.scrollY === 0) {
            showToast('Aggiornamento...', 'info');
            setTimeout(() => window.location.reload(), 500);
        }
        pulling = false;
    });
}

// Feature 30: Shake to go home (mobile)
function initShakeToHome() {
    if (!window.DeviceMotionEvent) return;
    
    let shakeThreshold = 15;
    let lastShake = 0;
    
    window.addEventListener('devicemotion', (e) => {
        const acc = e.accelerationIncludingGravity;
        if (!acc) return;
        
        const total = Math.abs(acc.x) + Math.abs(acc.y) + Math.abs(acc.z);
        if (total > shakeThreshold) {
            const now = Date.now();
            if (now - lastShake > 1000) {
                lastShake = now;
                if (confirm('Vuoi tornare alla Home?')) {
                    window.location.href = 'index.html';
                }
            }
        }
    });
}

// Feature 31: Haptic feedback (mobile)
function vibrate(pattern = [50]) {
    if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
    }
}

// Feature 32: Reading mode
function toggleReadingMode() {
    document.body.classList.toggle('reading-mode');
    const isReading = document.body.classList.contains('reading-mode');
    showToast(isReading ? 'Modalità lettura attivata 📖' : 'Modalità lettura disattivata', 'info');
    localStorage.setItem('readingMode', isReading);
}

// Feature 33: Text highlight and note
// Constants for highlight validation
const HIGHLIGHT_MIN_LENGTH = 10;
const HIGHLIGHT_MAX_LENGTH = 500;

function initHighlightText() {
    document.addEventListener('mouseup', (e) => {
        const selection = window.getSelection();
        const text = selection.toString().trim();
        if (text.length > HIGHLIGHT_MIN_LENGTH && text.length < HIGHLIGHT_MAX_LENGTH) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            showHighlightPopup(text, rect);
        }
    });
}

// Store current highlight text for secure access
let currentHighlightText = '';

function showHighlightPopup(text, rect) {
    const existing = document.querySelector('.qol-highlight-popup');
    if (existing) existing.remove();
    
    // Store the full text securely
    currentHighlightText = text;
    
    const popup = document.createElement('div');
    popup.className = 'qol-highlight-popup';
    popup.style.top = (rect.top - 50) + 'px';
    popup.style.left = rect.left + 'px';
    
    // Create buttons safely without inline handlers
    const saveBtn = document.createElement('button');
    saveBtn.textContent = '📌 Salva';
    saveBtn.addEventListener('click', () => saveHighlight(currentHighlightText));
    
    const copyBtn = document.createElement('button');
    copyBtn.textContent = '📋 Copia';
    copyBtn.addEventListener('click', () => {
        copyToClipboard(currentHighlightText);
        popup.remove();
    });
    
    popup.appendChild(saveBtn);
    popup.appendChild(copyBtn);
    document.body.appendChild(popup);
    
    setTimeout(() => {
        document.addEventListener('click', function remove(e) {
            if (!popup.contains(e.target)) {
                popup.remove();
                document.removeEventListener('click', remove);
            }
        });
    }, 100);
}

function saveHighlight(text) {
    const highlights = JSON.parse(localStorage.getItem('highlights') || '[]');
    highlights.push({ text, date: new Date().toISOString(), page: window.location.pathname });
    localStorage.setItem('highlights', JSON.stringify(highlights));
    showToast('Testo salvato nei tuoi appunti! 📝', 'success');
    document.querySelector('.qol-highlight-popup')?.remove();
}

// Feature 34: Daily tip
function showDailyTip() {
    const tips = [
        '💡 Usa Ctrl+K per cercare rapidamente!',
        '💡 Puoi salvare articoli nei preferiti con ⭐',
        '💡 Premi G poi H per tornare alla Home',
        '💡 Trascina per selezionare testo e condividerlo',
        '💡 La chat supporta le menzioni con /username',
        '💡 Puoi aumentare la dimensione del testo in Impostazioni',
        '💡 Il tema scuro riduce l\'affaticamento degli occhi',
        '💡 Seguici sui social per non perdere nulla!'
    ];
    
    const lastTip = localStorage.getItem('lastTipDate');
    const today = new Date().toDateString();
    
    if (lastTip !== today) {
        const tip = tips[Math.floor(Math.random() * tips.length)];
        setTimeout(() => showToast(tip, 'info', 6000), 5000);
        localStorage.setItem('lastTipDate', today);
    }
}

// Feature 35: Session timer
function initSessionTimer() {
    const startTime = Date.now();
    
    // Show session duration on leaving
    window.addEventListener('beforeunload', () => {
        const duration = Math.round((Date.now() - startTime) / 60000);
        if (duration > 5) {
            localStorage.setItem('lastSessionDuration', duration);
        }
    });
    
    // Show welcome message based on last session
    const lastDuration = localStorage.getItem('lastSessionDuration');
    if (lastDuration && parseInt(lastDuration) > 30) {
        showToast('Bentornato! La tua ultima visita è durata ' + lastDuration + ' minuti 📚', 'info', 5000);
    }
}

// Feature 36: Page loader animation
function showPageLoader() {
    const loader = document.getElementById('page-loader');
    if (loader) {
        loader.style.display = 'flex';
        loader.style.opacity = '1';
    }
}

function hidePageLoader() {
    const loader = document.getElementById('page-loader');
    if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => {
            loader.style.display = 'none';
        }, 300);
    }
}

// Feature 37: Focus mode
function toggleFocusMode() {
    document.body.classList.toggle('focus-mode');
    const isFocus = document.body.classList.contains('focus-mode');
    showToast(isFocus ? 'Modalità focus attivata 🎯' : 'Modalità focus disattivata', 'info');
}

// Feature 38: Quick note
function openQuickNote() {
    const existing = document.getElementById('quickNoteModal');
    if (existing) {
        existing.remove();
        return;
    }
    
    const savedNote = localStorage.getItem('quickNote') || '';
    const modal = document.createElement('div');
    modal.id = 'quickNoteModal';
    modal.className = 'qol-modal';
    modal.innerHTML = `
        <div class="qol-modal-backdrop" onclick="document.getElementById('quickNoteModal').remove()"></div>
        <div class="qol-modal-content" style="max-width: 400px;">
            <h3>📝 Note Veloci</h3>
            <textarea id="quickNoteText" style="width: 100%; height: 150px; margin: 1rem 0; padding: 0.5rem; border-radius: 8px; border: 1px solid #ddd;">${savedNote}</textarea>
            <button onclick="saveQuickNote()" class="btn btn-primary">Salva</button>
            <button onclick="document.getElementById('quickNoteModal').remove()" class="btn">Chiudi</button>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('quickNoteText').focus();
}

function saveQuickNote() {
    const text = document.getElementById('quickNoteText').value;
    localStorage.setItem('quickNote', text);
    showToast('Nota salvata! 📝', 'success');
    document.getElementById('quickNoteModal').remove();
}

// Feature 40: Smart scroll (pause on focus)
function initSmartScroll() {
    let scrollPaused = false;
    
    document.addEventListener('focus', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            scrollPaused = true;
        }
    }, true);
    
    document.addEventListener('blur', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            scrollPaused = false;
        }
    }, true);
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
    trackReadingStreak();
    initQuickJump();
    initDoubleTapLike();
    initPullToRefresh();
    initSmartScroll();
    showDailyTip();
    initSessionTimer();
    
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
window.toggleReadingMode = toggleReadingMode;
window.toggleFocusMode = toggleFocusMode;
window.openQuickNote = openQuickNote;
window.saveQuickNote = saveQuickNote;
window.saveHighlight = saveHighlight;
window.vibrate = vibrate;
window.showPageLoader = showPageLoader;
window.hidePageLoader = hidePageLoader;

console.log('✅ Main.js caricato con successo con 40+ funzionalità QoL');
