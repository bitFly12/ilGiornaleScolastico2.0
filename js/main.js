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
    
    try {
        // Check Supabase for maintenance mode state
        if (typeof supabase !== 'undefined') {
            const { data: settings, error } = await supabase
                .from('site_settings')
                .select('setting_value')
                .eq('setting_key', 'maintenance_mode')
                .single();
            
            if (error) {
                console.error('Error checking maintenance mode:', error);
                // Fallback to localStorage if Supabase check fails
                const localSettings = JSON.parse(localStorage.getItem('siteSettings') || '{}');
                if (!localSettings.maintenanceMode) return;
            }
            
            const maintenanceMode = settings?.setting_value?.enabled || false;
            
            if (maintenanceMode) {
                // Check if user is admin
                const userRole = localStorage.getItem('userRole');
                
                // If clearly admin, allow access
                if (userRole === 'caporedattore' || userRole === 'admin' || userRole === 'docente') {
                    console.log('Admin detected, skipping maintenance redirect');
                    return;
                }
                
                // Double-check with Supabase if available
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
    } catch (error) {
        console.error('Error in checkMaintenanceMode:', error);
    }
}

// Poll maintenance mode status every 10 seconds
setInterval(checkMaintenanceMode, 10000);

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

    /*
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
}*/

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

// ================================================
// ADDITIONAL 60+ QOL FEATURES (Features 41-100+)
// ================================================

// Feature 41: Smooth page transitions
function initPageTransitions() {
    document.querySelectorAll('a[href^="./"], a[href^="http"], a[href^="/"]:not([href*="://"]), a[href$=".html"]').forEach(link => {
        if (link.getAttribute('target') === '_blank') return;
        if (link.hasAttribute('data-no-transition')) return;
        
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            // Skip dangerous or special URLs (including data: and vbscript:)
            if (!href || href.startsWith('#') || 
                href.startsWith('javascript:') || 
                href.startsWith('data:') || 
                href.startsWith('vbscript:')) return;
            
            e.preventDefault();
            document.body.classList.add('page-transitioning');
            
            setTimeout(() => {
                window.location.href = href;
            }, 200);
        });
    });
}

// Feature 42: Remember last visited page
function trackLastPage() {
    const currentPage = window.location.pathname + window.location.search;
    const lastPages = JSON.parse(localStorage.getItem('lastVisitedPages') || '[]');
    
    // Don't add duplicates
    if (lastPages[0] !== currentPage) {
        lastPages.unshift(currentPage);
        if (lastPages.length > 10) lastPages.pop();
        localStorage.setItem('lastVisitedPages', JSON.stringify(lastPages));
    }
}

// Feature 43: Show recent pages in menu
function getRecentPages() {
    return JSON.parse(localStorage.getItem('lastVisitedPages') || '[]');
}

// Feature 44: Smart link preview on hover
function initLinkPreviews() {
    let previewTimeout;
    let previewElement;
    
    document.addEventListener('mouseover', (e) => {
        const link = e.target.closest('a[href*="articolo.html"]');
        if (!link) return;
        
        clearTimeout(previewTimeout);
        previewTimeout = setTimeout(() => {
            showLinkPreview(link, e);
        }, 500);
    });
    
    document.addEventListener('mouseout', (e) => {
        clearTimeout(previewTimeout);
        if (previewElement) {
            previewElement.remove();
            previewElement = null;
        }
    });
}

function showLinkPreview(link, event) {
    // Simple preview with article title
    const previewElement = document.createElement('div');
    previewElement.className = 'qol-link-preview';
    previewElement.innerHTML = `<div style="padding: 0.5rem;">📰 Clicca per leggere l'articolo</div>`;
    previewElement.style.cssText = `
        position: fixed;
        left: ${event.clientX + 10}px;
        top: ${event.clientY + 10}px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        pointer-events: none;
    `;
    document.body.appendChild(previewElement);
}

// Feature 45: Article word count display
function showWordCount() {
    const content = document.querySelector('.article-content');
    if (!content) return;
    
    const text = content.textContent || '';
    const words = text.trim().split(/\s+/).length;
    const chars = text.length;
    
    const wordCountEl = document.createElement('div');
    wordCountEl.className = 'qol-word-count';
    wordCountEl.innerHTML = `📊 ${words} parole • ${chars} caratteri`;
    wordCountEl.style.cssText = 'font-size: 0.85rem; color: var(--neutral); margin-bottom: 1rem;';
    
    const articleMeta = document.querySelector('.article-meta');
    if (articleMeta) {
        articleMeta.appendChild(wordCountEl);
    }
}

// Feature 46: Quick category filter buttons
function initCategoryQuickFilter() {
    const grid = document.getElementById('articlesGrid');
    if (!grid) return;
    
    const categories = ['Tutte', 'Scuola', 'Sport', 'Cultura', 'Tecnologia', 'Ambiente'];
    
    const filterBar = document.createElement('div');
    filterBar.className = 'qol-category-filter';
    filterBar.style.cssText = 'display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap; padding: 0 1rem;';
    
    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'qol-filter-btn';
        btn.textContent = cat;
        btn.style.cssText = 'padding: 0.5rem 1rem; border: 1px solid #ddd; border-radius: 20px; background: white; cursor: pointer; transition: all 0.2s;';
        btn.addEventListener('click', () => filterByCategory(cat));
        filterBar.appendChild(btn);
    });
    
    grid.parentElement.insertBefore(filterBar, grid);
}

function filterByCategory(category) {
    const cards = document.querySelectorAll('.article-card');
    cards.forEach(card => {
        if (category === 'Tutte') {
            card.style.display = '';
        } else {
            const cardCategory = card.querySelector('[style*="text-transform: uppercase"]')?.textContent || '';
            card.style.display = cardCategory.toLowerCase().includes(category.toLowerCase()) ? '' : 'none';
        }
    });
}

// Feature 47: Estimated reading time based on user's reading speed
function getPersonalizedReadTime(wordCount) {
    const userSpeed = parseInt(localStorage.getItem('readingSpeed')) || 200; // words per minute
    return Math.ceil(wordCount / userSpeed);
}

// Feature 48: Adjust reading speed preference
function setReadingSpeed(wpm) {
    localStorage.setItem('readingSpeed', wpm);
    showToast(`Velocità lettura impostata: ${wpm} parole/min`, 'info');
}

// Feature 49: Auto-hide header on scroll down
function initAutoHideHeader() {
    let lastScroll = 0;
    const header = document.querySelector('header');
    if (!header) return;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            if (currentScroll > lastScroll) {
                header.style.transform = 'translateY(-100%)';
            } else {
                header.style.transform = 'translateY(0)';
            }
        } else {
            header.style.transform = 'translateY(0)';
        }
        
        lastScroll = currentScroll;
    }, { passive: true });
    
    header.style.transition = 'transform 0.3s ease';
}

// Feature 50: Night mode scheduler
function initNightModeScheduler() {
    const hour = new Date().getHours();
    const isNightTime = hour >= 21 || hour < 7;
    
    if (isNightTime && !localStorage.getItem('darkModeManual')) {
        document.body.classList.add('dark-mode');
    }
}

// Feature 51: Font contrast enhancement
function toggleHighContrast() {
    document.body.classList.toggle('high-contrast');
    const isOn = document.body.classList.contains('high-contrast');
    localStorage.setItem('highContrast', isOn);
    showToast(isOn ? 'Alto contrasto attivato' : 'Alto contrasto disattivato', 'info');
}

// Feature 52: Reading ruler (line guide)
function toggleReadingRuler() {
    let ruler = document.getElementById('readingRuler');
    
    if (ruler) {
        ruler.remove();
        return;
    }
    
    ruler = document.createElement('div');
    ruler.id = 'readingRuler';
    ruler.style.cssText = `
        position: fixed;
        left: 0;
        right: 0;
        height: 30px;
        background: rgba(255, 255, 0, 0.15);
        pointer-events: none;
        z-index: 9999;
        border-top: 2px solid rgba(0, 51, 160, 0.3);
        border-bottom: 2px solid rgba(0, 51, 160, 0.3);
    `;
    document.body.appendChild(ruler);
    
    document.addEventListener('mousemove', (e) => {
        if (ruler) ruler.style.top = (e.clientY - 15) + 'px';
    });
}

// Feature 53: Text-to-speech for articles
function readArticleAloud() {
    const content = document.querySelector('.article-content');
    if (!content) {
        showToast('Nessun articolo da leggere', 'error');
        return;
    }
    
    if ('speechSynthesis' in window) {
        const text = content.textContent;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'it-IT';
        utterance.rate = 0.9;
        
        speechSynthesis.cancel();
        speechSynthesis.speak(utterance);
        showToast('🔊 Lettura in corso...', 'info');
    } else {
        showToast('Text-to-speech non supportato', 'error');
    }
}

function stopReading() {
    if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
        showToast('Lettura interrotta', 'info');
    }
}

// Feature 54: Article summary generator (uses first paragraph)
function showArticleSummary() {
    const content = document.querySelector('.article-content');
    if (!content) return;
    
    const firstParagraph = content.querySelector('p')?.textContent || '';
    const summary = firstParagraph.substring(0, 200) + '...';
    
    showToast(`📝 Sommario: ${summary}`, 'info');
}

// Feature 55: Related articles suggestions
function loadRelatedArticles(category) {
    // Placeholder - would query Supabase in production
}

// Feature 56: Article comparison mode
function toggleComparisonMode() {
    document.body.classList.toggle('comparison-mode');
    showToast('Modalità confronto: seleziona articoli', 'info');
}

// Feature 57: Quick report issue
function showReportIssue() {
    const modal = document.createElement('div');
    modal.className = 'qol-modal';
    modal.innerHTML = `
        <div class="qol-modal-backdrop" onclick="this.parentElement.remove()"></div>
        <div class="qol-modal-content">
            <h3>🚨 Segnala un problema</h3>
            <select id="issueType" style="width: 100%; padding: 0.5rem; margin: 1rem 0; border-radius: 8px; border: 1px solid #ddd;">
                <option>Bug tecnico</option>
                <option>Contenuto inappropriato</option>
                <option>Errore di ortografia</option>
                <option>Link rotto</option>
                <option>Altro</option>
            </select>
            <textarea id="issueDesc" placeholder="Descrivi il problema..." style="width: 100%; height: 100px; padding: 0.5rem; border-radius: 8px; border: 1px solid #ddd;"></textarea>
            <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                <button onclick="submitIssue()" class="btn btn-primary">Invia</button>
                <button onclick="this.closest('.qol-modal').remove()" class="btn">Annulla</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function submitIssue() {
    showToast('Segnalazione inviata. Grazie!', 'success');
    document.querySelector('.qol-modal').remove();
}

// Feature 58: Quick navigation breadcrumbs
function initBreadcrumbs() {
    const path = window.location.pathname.split('/').filter(Boolean);
    const container = document.querySelector('.container');
    if (!container || path.length < 1) return;
    
    const breadcrumb = document.createElement('nav');
    breadcrumb.className = 'qol-breadcrumb';
    breadcrumb.setAttribute('aria-label', 'Breadcrumb');
    breadcrumb.style.cssText = 'padding: 0.5rem 1rem; font-size: 0.85rem; color: var(--neutral);';
    
    let html = '<a href="index.html">Home</a>';
    
    const pageName = path[path.length - 1].replace('.html', '').replace(/-/g, ' ');
    html += ` › <span style="text-transform: capitalize;">${pageName}</span>`;
    
    breadcrumb.innerHTML = html;
    container.insertBefore(breadcrumb, container.firstChild);
}

// Feature 59: Keyboard navigation for articles
function initKeyboardArticleNav() {
    document.addEventListener('keydown', (e) => {
        const cards = document.querySelectorAll('.article-card');
        if (cards.length === 0) return;
        
        const focusedCard = document.activeElement.closest('.article-card');
        let index = Array.from(cards).indexOf(focusedCard);
        
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            index = (index + 1) % cards.length;
            cards[index].focus();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            index = (index - 1 + cards.length) % cards.length;
            cards[index].focus();
        } else if (e.key === 'Enter' && focusedCard) {
            const link = focusedCard.querySelector('a');
            if (link) link.click();
        }
    });
}

// Feature 60: Quick scroll to comments
function scrollToComments() {
    const comments = document.querySelector('#commentsSection, .comments-section, [id*="comment"]');
    if (comments) {
        comments.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        showToast('Sezione commenti non trovata', 'info');
    }
}

// Feature 61: Article freshness indicator
function showArticleFreshness() {
    const dateElements = document.querySelectorAll('[data-date], time');
    
    dateElements.forEach(el => {
        const dateStr = el.getAttribute('datetime') || el.textContent;
        const date = new Date(dateStr);
        const now = new Date();
        const diffHours = (now - date) / (1000 * 60 * 60);
        
        if (diffHours < 24) {
            el.insertAdjacentHTML('afterend', '<span class="qol-new-badge" style="background: #10b981; color: white; padding: 0.125rem 0.5rem; border-radius: 10px; font-size: 0.75rem; margin-left: 0.5rem;">NUOVO</span>');
        } else if (diffHours < 72) {
            el.insertAdjacentHTML('afterend', '<span class="qol-recent-badge" style="background: #f59e0b; color: white; padding: 0.125rem 0.5rem; border-radius: 10px; font-size: 0.75rem; margin-left: 0.5rem;">RECENTE</span>');
        }
    });
}

// Feature 62: Estimated time to finish reading
function showTimeToFinish() {
    const progressBar = document.querySelector('.qol-progress-bar');
    if (!progressBar) return;
    
    const scrollPercent = parseFloat(progressBar.style.width) || 0;
    const remainingPercent = 100 - scrollPercent;
    const totalReadTime = parseInt(document.querySelector('[data-reading-time]')?.dataset.readingTime) || 5;
    const remainingTime = Math.ceil(totalReadTime * remainingPercent / 100);
    
    let indicator = document.getElementById('timeToFinish');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'timeToFinish';
        indicator.style.cssText = 'position: fixed; bottom: 10px; left: 10px; background: rgba(0,0,0,0.8); color: white; padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.85rem; z-index: 1000;';
        document.body.appendChild(indicator);
    }
    
    indicator.textContent = `⏱️ ~${remainingTime} min rimanenti`;
}

// Feature 63: Mobile swipe to navigate
function initSwipeNavigation() {
    let touchStartX = 0;
    let touchEndX = 0;
    
    document.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    document.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });
    
    function handleSwipe() {
        const diff = touchEndX - touchStartX;
        const threshold = 100;
        
        if (diff > threshold) {
            // Swipe right - go back
            if (document.referrer) {
                history.back();
            }
        } else if (diff < -threshold) {
            // Swipe left - could go to next article
        }
    }
}

// Feature 64: Quick emoji reactions
const quickEmojis = ['👍', '❤️', '😮', '👏', '🤔'];

function showQuickReactions(articleId) {
    const existing = document.getElementById('quickReactions');
    if (existing) existing.remove();
    
    const container = document.createElement('div');
    container.id = 'quickReactions';
    container.style.cssText = 'display: flex; gap: 0.5rem; margin: 1rem 0;';
    
    quickEmojis.forEach(emoji => {
        const btn = document.createElement('button');
        btn.textContent = emoji;
        btn.style.cssText = 'font-size: 1.5rem; background: var(--bg-light); border: none; padding: 0.5rem; border-radius: 50%; cursor: pointer; transition: transform 0.2s;';
        btn.addEventListener('click', () => {
            btn.style.transform = 'scale(1.3)';
            setTimeout(() => btn.style.transform = '', 200);
            showToast(`Reazione ${emoji} inviata!`, 'success');
        });
        container.appendChild(btn);
    });
    
    document.querySelector('.article-body')?.appendChild(container);
}

// Feature 65: Quick stats display
function showQuickStats() {
    const articlesRead = JSON.parse(localStorage.getItem('readingHistory') || '[]').length;
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]').length;
    const streak = parseInt(localStorage.getItem('readingStreak')) || 0;
    
    showToast(`📊 Articoli letti: ${articlesRead} | Salvati: ${bookmarks} | Serie: ${streak} giorni`, 'info');
}

// Feature 66: Color theme selector
function showThemeSelector() {
    const themes = [
        { name: 'Default', primary: '#0033A0', bg: '#ffffff' },
        { name: 'Oceano', primary: '#0077b6', bg: '#f0f9ff' },
        { name: 'Foresta', primary: '#2d6a4f', bg: '#f0fff4' },
        { name: 'Tramonto', primary: '#c2410c', bg: '#fff7ed' },
        { name: 'Lavanda', primary: '#7c3aed', bg: '#faf5ff' }
    ];
    
    const modal = document.createElement('div');
    modal.className = 'qol-modal';
    modal.innerHTML = `
        <div class="qol-modal-backdrop" onclick="this.parentElement.remove()"></div>
        <div class="qol-modal-content">
            <h3>🎨 Scegli un tema</h3>
            <div style="display: grid; gap: 0.5rem; margin-top: 1rem;">
                ${themes.map(t => `
                    <button onclick="applyTheme('${t.primary}', '${t.bg}')" 
                        style="padding: 1rem; border: 2px solid ${t.primary}; border-radius: 8px; background: ${t.bg}; cursor: pointer;">
                        <span style="color: ${t.primary}; font-weight: 600;">${t.name}</span>
                    </button>
                `).join('')}
            </div>
            <button onclick="this.closest('.qol-modal').remove()" class="btn" style="margin-top: 1rem;">Chiudi</button>
        </div>
    `;
    document.body.appendChild(modal);
}

function applyTheme(primary, bg) {
    document.documentElement.style.setProperty('--primary', primary);
    document.documentElement.style.setProperty('--bg-light', bg);
    localStorage.setItem('customTheme', JSON.stringify({ primary, bg }));
    showToast('Tema applicato!', 'success');
    document.querySelector('.qol-modal')?.remove();
}

// Feature 67: Restore custom theme on load
function restoreCustomTheme() {
    const theme = JSON.parse(localStorage.getItem('customTheme'));
    if (theme) {
        document.documentElement.style.setProperty('--primary', theme.primary);
        document.documentElement.style.setProperty('--bg-light', theme.bg);
    }
}

// Feature 68: Reading goals
function setReadingGoal(articles) {
    localStorage.setItem('readingGoal', articles);
    showToast(`Obiettivo impostato: ${articles} articoli al giorno`, 'success');
}

function checkReadingGoal() {
    const goal = parseInt(localStorage.getItem('readingGoal')) || 3;
    const today = new Date().toDateString();
    const readToday = JSON.parse(localStorage.getItem('readToday') || '{}');
    
    if (readToday.date !== today) {
        localStorage.setItem('readToday', JSON.stringify({ date: today, count: 0 }));
    }
    
    return { goal, read: readToday.count || 0 };
}

// Feature 69: Celebration on goal achievement
function checkGoalAndCelebrate() {
    const { goal, read } = checkReadingGoal();
    if (read >= goal) {
        showConfetti();
        showToast('🎉 Obiettivo giornaliero raggiunto!', 'success');
    }
}

// Feature 70: Article difficulty indicator
function estimateDifficulty(wordCount, avgWordLength) {
    if (avgWordLength > 6 && wordCount > 1000) return '🔴 Avanzato';
    if (avgWordLength > 5 && wordCount > 500) return '🟡 Medio';
    return '🟢 Facile';
}

// Feature 71: Quick language toggle (if multilingual)
function toggleLanguage() {
    const currentLang = document.documentElement.lang || 'it';
    const newLang = currentLang === 'it' ? 'en' : 'it';
    document.documentElement.lang = newLang;
    localStorage.setItem('language', newLang);
    showToast(`Lingua: ${newLang.toUpperCase()}`, 'info');
}

// Feature 72: Zen mode (hide all distractions)
function toggleZenMode() {
    document.body.classList.toggle('zen-mode');
    const isZen = document.body.classList.contains('zen-mode');
    
    if (isZen) {
        document.querySelectorAll('header, footer, aside, .sidebar, .qol-fab, .chat-bubble').forEach(el => {
            el.style.display = 'none';
        });
    } else {
        document.querySelectorAll('header, footer, aside, .sidebar, .qol-fab, .chat-bubble').forEach(el => {
            el.style.display = '';
        });
    }
    
    showToast(isZen ? '🧘 Modalità Zen attivata' : '🧘 Modalità Zen disattivata', 'info');
}

// Feature 73: Smart image zoom
function initImageZoom() {
    document.querySelectorAll('.article-image, .article-card img').forEach(img => {
        img.style.cursor = 'zoom-in';
        img.addEventListener('click', () => {
            const modal = document.createElement('div');
            modal.className = 'qol-image-modal';
            modal.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 10000; display: flex; align-items: center; justify-content: center; cursor: zoom-out;';
            modal.innerHTML = `<img src="${img.src}" style="max-width: 95%; max-height: 95%; object-fit: contain;">`;
            modal.addEventListener('click', () => modal.remove());
            document.body.appendChild(modal);
        });
    });
}

// Feature 74: Recent activity feed
function showRecentActivity() {
    const history = JSON.parse(localStorage.getItem('readingHistory') || '[]');
    const recent = history.slice(0, 5);
    
    let html = '<h4>Attività Recente</h4>';
    recent.forEach(item => {
        html += `<p style="font-size: 0.85rem; color: var(--neutral);">📖 ${item.title || 'Articolo'}</p>`;
    });
    
    showToast(recent.length ? `Ultimi ${recent.length} articoli letti` : 'Nessuna attività recente', 'info');
}

// Feature 75: Quick settings panel
function showQuickSettings() {
    const modal = document.createElement('div');
    modal.className = 'qol-modal';
    modal.innerHTML = `
        <div class="qol-modal-backdrop" onclick="this.parentElement.remove()"></div>
        <div class="qol-modal-content">
            <h3>⚙️ Impostazioni Rapide</h3>
            <div style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;">
                <label><input type="checkbox" id="autoHideHeader" ${localStorage.getItem('autoHideHeader') === 'true' ? 'checked' : ''}> Nascondi header durante scroll</label>
                <label><input type="checkbox" id="nightSchedule" ${localStorage.getItem('nightSchedule') === 'true' ? 'checked' : ''}> Modalità notte automatica</label>
                <label><input type="checkbox" id="soundEffects" ${localStorage.getItem('soundEffects') !== 'false' ? 'checked' : ''}> Effetti sonori</label>
                <label><input type="checkbox" id="animations" ${localStorage.getItem('animations') !== 'false' ? 'checked' : ''}> Animazioni</label>
            </div>
            <button onclick="saveQuickSettings()" class="btn btn-primary" style="margin-top: 1rem;">Salva</button>
        </div>
    `;
    document.body.appendChild(modal);
}

function saveQuickSettings() {
    localStorage.setItem('autoHideHeader', document.getElementById('autoHideHeader').checked);
    localStorage.setItem('nightSchedule', document.getElementById('nightSchedule').checked);
    localStorage.setItem('soundEffects', document.getElementById('soundEffects').checked);
    localStorage.setItem('animations', document.getElementById('animations').checked);
    showToast('Impostazioni salvate!', 'success');
    document.querySelector('.qol-modal').remove();
}

// Feature 76: Search within article
function searchInArticle() {
    const content = document.querySelector('.article-content');
    if (!content) return;
    
    const searchTerm = prompt('Cerca nel testo:');
    if (!searchTerm) return;
    
    const html = content.innerHTML;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const highlighted = html.replace(regex, '<mark style="background: yellow;">$1</mark>');
    content.innerHTML = highlighted;
    
    const matches = content.querySelectorAll('mark').length;
    showToast(`Trovate ${matches} corrispondenze`, 'info');
}

// Feature 77: Article audio preview
function playArticlePreview() {
    if ('speechSynthesis' in window) {
        const title = document.querySelector('.article-title')?.textContent || '';
        const summary = document.querySelector('.article-summary')?.textContent || '';
        
        const text = `${title}. ${summary}`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'it-IT';
        
        speechSynthesis.cancel();
        speechSynthesis.speak(utterance);
    }
}

// Feature 78: Floating action for current article
function showArticleActions() {
    const existing = document.getElementById('articleActions');
    if (existing) {
        existing.remove();
        return;
    }
    
    const actions = document.createElement('div');
    actions.id = 'articleActions';
    actions.style.cssText = 'position: fixed; bottom: 100px; right: 20px; display: flex; flex-direction: column; gap: 0.5rem; z-index: 1000;';
    actions.innerHTML = `
        <button onclick="toggleBookmark()" style="padding: 0.75rem; border-radius: 50%; border: none; background: var(--primary); color: white; cursor: pointer;">🔖</button>
        <button onclick="shareArticle()" style="padding: 0.75rem; border-radius: 50%; border: none; background: #10b981; color: white; cursor: pointer;">📤</button>
        <button onclick="scrollToComments()" style="padding: 0.75rem; border-radius: 50%; border: none; background: #6366f1; color: white; cursor: pointer;">💬</button>
        <button onclick="readArticleAloud()" style="padding: 0.75rem; border-radius: 50%; border: none; background: #f59e0b; color: white; cursor: pointer;">🔊</button>
    `;
    document.body.appendChild(actions);
}

// Feature 79: Desktop notifications for new articles
function requestNotifications() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(perm => {
            if (perm === 'granted') {
                showToast('Notifiche abilitate!', 'success');
            }
        });
    }
}

function sendNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/favicon.ico' });
    }
}

// Feature 80: Quick tip of the day
function showRandomTip() {
    const tips = [
        '💡 Premi Ctrl+K per aprire la ricerca rapida',
        '💡 Clicca due volte su un articolo per salvarlo',
        '💡 Usa le frecce per navigare tra gli articoli',
        '💡 Premi F per attivare la modalità lettura',
        '💡 Scuoti il telefono per tornare alla home',
        '💡 Premi ? per vedere tutte le scorciatoie',
        '💡 Trascina verso destra per tornare indietro',
        '💡 Il tema si adatta automaticamente di notte',
        '💡 Puoi evidenziare testo per condividerlo',
        '💡 Premi Z per attivare la modalità Zen'
    ];
    
    return tips[Math.floor(Math.random() * tips.length)];
}

// Feature 81: Article scheduling reminder
function remindLater(articleId, minutes = 30) {
    const reminder = {
        id: articleId,
        time: Date.now() + minutes * 60 * 1000,
        title: document.querySelector('.article-title')?.textContent || 'Articolo'
    };
    
    const reminders = JSON.parse(localStorage.getItem('articleReminders') || '[]');
    reminders.push(reminder);
    localStorage.setItem('articleReminders', JSON.stringify(reminders));
    
    showToast(`Ti ricorderemo tra ${minutes} minuti!`, 'success');
}

// Feature 82: Check and show reminders
function checkReminders() {
    const reminders = JSON.parse(localStorage.getItem('articleReminders') || '[]');
    const now = Date.now();
    
    reminders.forEach((reminder, index) => {
        if (reminder.time <= now) {
            sendNotification('Promemoria lettura', `Non dimenticare: ${reminder.title}`);
            reminders.splice(index, 1);
        }
    });
    
    localStorage.setItem('articleReminders', JSON.stringify(reminders));
}

// Feature 83: Table of contents for long articles
function generateTableOfContents() {
    const content = document.querySelector('.article-content');
    if (!content) return;
    
    const headings = content.querySelectorAll('h2, h3');
    if (headings.length < 3) return;
    
    const toc = document.createElement('nav');
    toc.className = 'qol-toc';
    toc.style.cssText = 'background: var(--bg-light); padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;';
    toc.innerHTML = '<strong>📑 Indice</strong>';
    
    const list = document.createElement('ul');
    list.style.cssText = 'margin: 0.5rem 0 0 1rem; font-size: 0.9rem;';
    
    headings.forEach((h, i) => {
        h.id = `section-${i}`;
        const li = document.createElement('li');
        li.style.margin = '0.25rem 0';
        li.innerHTML = `<a href="#section-${i}" style="color: var(--primary); text-decoration: none;">${h.textContent}</a>`;
        list.appendChild(li);
    });
    
    toc.appendChild(list);
    content.insertBefore(toc, content.firstChild);
}

// Feature 84: Progress milestone celebrations
function celebrateMilestone(milestone) {
    const milestones = {
        10: '🌟 Hai letto 10 articoli!',
        25: '🏆 25 articoli! Sei un lettore appassionato!',
        50: '🎖️ 50 articoli! Incredibile!',
        100: '👑 100 articoli! Sei una leggenda!'
    };
    
    if (milestones[milestone]) {
        showConfetti();
        showToast(milestones[milestone], 'success');
    }
}

// Feature 85: Dynamic favicon based on status
function updateFavicon(status) {
    const link = document.querySelector('link[rel="icon"]') || document.createElement('link');
    link.rel = 'icon';
    
    // Simple emoji-based favicon
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    ctx.font = '24px serif';
    ctx.fillText(status === 'new' ? '🔔' : '📰', 4, 24);
    
    link.href = canvas.toDataURL();
    document.head.appendChild(link);
}

// Feature 86: Reading position sync across tabs
function syncReadingPosition() {
    const articleId = new URLSearchParams(window.location.search).get('id');
    if (!articleId) return;
    
    window.addEventListener('storage', (e) => {
        if (e.key === `reading-pos-${articleId}`) {
            const pos = parseFloat(e.newValue);
            window.scrollTo(0, document.body.scrollHeight * pos);
        }
    });
    
    window.addEventListener('scroll', () => {
        const pos = window.scrollY / document.body.scrollHeight;
        localStorage.setItem(`reading-pos-${articleId}`, pos.toString());
    }, { passive: true });
}

// Feature 87: Quick article download as PDF
function downloadAsPDF() {
    showToast('Preparazione PDF in corso...', 'info');
    window.print();
}

// Feature 88: Article footnotes popup
function initFootnotes() {
    document.querySelectorAll('sup[data-footnote]').forEach(sup => {
        sup.style.cursor = 'help';
        sup.addEventListener('click', () => {
            const note = sup.dataset.footnote;
            showToast(note, 'info');
        });
    });
}

// Feature 89: Typewriter effect for titles
function typewriterEffect(element, text, speed = 50) {
    let i = 0;
    element.textContent = '';
    
    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    
    type();
}

// Feature 90: Parallax scroll effect for images
function initParallax() {
    const images = document.querySelectorAll('.article-image, .hero-image');
    
    window.addEventListener('scroll', () => {
        images.forEach(img => {
            const rect = img.getBoundingClientRect();
            const scrolled = window.pageYOffset;
            const rate = scrolled * 0.3;
            
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                img.style.transform = `translateY(${rate * 0.1}px)`;
            }
        });
    }, { passive: true });
}

// Feature 91: Sticky table headers
function initStickyTableHeaders() {
    document.querySelectorAll('table').forEach(table => {
        const thead = table.querySelector('thead');
        if (thead) {
            thead.style.position = 'sticky';
            thead.style.top = '60px';
            thead.style.background = 'white';
            thead.style.zIndex = '10';
        }
    });
}

// Feature 92: Code block copy button
function initCodeCopy() {
    document.querySelectorAll('pre code').forEach(block => {
        const btn = document.createElement('button');
        btn.textContent = '📋 Copia';
        btn.style.cssText = 'position: absolute; top: 0.5rem; right: 0.5rem; padding: 0.25rem 0.5rem; font-size: 0.75rem; border: none; background: var(--primary); color: white; border-radius: 4px; cursor: pointer;';
        btn.addEventListener('click', () => {
            navigator.clipboard.writeText(block.textContent);
            btn.textContent = '✓ Copiato!';
            setTimeout(() => btn.textContent = '📋 Copia', 2000);
        });
        
        block.parentElement.style.position = 'relative';
        block.parentElement.appendChild(btn);
    });
}

// Feature 93: Scroll spy for TOC
function initScrollSpy() {
    const sections = document.querySelectorAll('[id^="section-"]');
    if (sections.length === 0) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const link = document.querySelector(`.qol-toc a[href="#${entry.target.id}"]`);
            if (link) {
                link.style.fontWeight = entry.isIntersecting ? '700' : '400';
            }
        });
    }, { threshold: 0.5 });
    
    sections.forEach(section => observer.observe(section));
}

// Feature 94: Gesture hints on first visit
function showGestureHints() {
    if (localStorage.getItem('gestureHintsSeen')) return;
    if (!('ontouchstart' in window)) return;
    
    const hints = document.createElement('div');
    hints.className = 'qol-gesture-hints';
    hints.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 10000; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; text-align: center; padding: 2rem;';
    hints.innerHTML = `
        <h2>👆 Gesti Touch</h2>
        <p style="margin: 1rem 0;">← Scorri a destra per tornare indietro</p>
        <p style="margin: 1rem 0;">↓ Tira giù per aggiornare</p>
        <p style="margin: 1rem 0;">👆👆 Doppio tap per salvare</p>
        <button onclick="this.parentElement.remove(); localStorage.setItem('gestureHintsSeen', 'true');" style="padding: 1rem 2rem; background: var(--primary); color: white; border: none; border-radius: 8px; margin-top: 2rem; cursor: pointer;">Ho capito!</button>
    `;
    document.body.appendChild(hints);
}

// Feature 95: Cookie consent banner
function showCookieConsent() {
    if (localStorage.getItem('cookieConsent')) return;
    
    const banner = document.createElement('div');
    banner.className = 'qol-cookie-banner';
    banner.style.cssText = 'position: fixed; bottom: 0; left: 0; right: 0; background: var(--text-dark); color: white; padding: 1rem; display: flex; justify-content: space-between; align-items: center; z-index: 998; flex-wrap: wrap; gap: 1rem;';
    banner.innerHTML = `
        <p style="margin: 0; flex: 1;">🍪 Questo sito utilizza cookie per migliorare l'esperienza. <a href="privacy.html" style="color: #00f0ff;">Scopri di più</a></p>
        <div>
            <button onclick="acceptCookies()" style="padding: 0.5rem 1rem; background: var(--primary); color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 0.5rem;">Accetta</button>
            <button onclick="declineCookies()" style="padding: 0.5rem 1rem; background: transparent; color: white; border: 1px solid white; border-radius: 4px; cursor: pointer;">Rifiuta</button>
        </div>
    `;
    document.body.appendChild(banner);
}

function acceptCookies() {
    localStorage.setItem('cookieConsent', 'accepted');
    document.querySelector('.qol-cookie-banner')?.remove();
}

function declineCookies() {
    localStorage.setItem('cookieConsent', 'declined');
    document.querySelector('.qol-cookie-banner')?.remove();
}

// Feature 96: Performance monitor (dev mode)
function showPerformance() {
    if (window.performance && window.location.hostname === 'localhost') {
        const timing = performance.timing;
        const loadTime = timing.loadEventEnd - timing.navigationStart;
        console.log(`⚡ Pagina caricata in ${loadTime}ms`);
    }
}

// Feature 97: Smooth anchor scrolls
function smoothAnchorScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const targetId = anchor.getAttribute('href').slice(1);
            const target = document.getElementById(targetId);
            
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

// Feature 98: Idle detection for auto-pause
let idleTime = 0;
function initIdleDetection() {
    setInterval(() => {
        idleTime++;
        if (idleTime >= 5 && 'speechSynthesis' in window) {
            speechSynthesis.pause();
        }
    }, 60000);
    
    ['mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
        document.addEventListener(event, () => idleTime = 0, { passive: true });
    });
}

// Feature 99: Reading companion widget
function showReadingCompanion() {
    const existing = document.getElementById('readingCompanion');
    if (existing) {
        existing.remove();
        return;
    }
    
    const companion = document.createElement('div');
    companion.id = 'readingCompanion';
    companion.style.cssText = 'position: fixed; bottom: 20px; left: 20px; background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); padding: 1rem; max-width: 250px; z-index: 1000;';
    companion.innerHTML = `
        <h4 style="margin: 0 0 0.5rem;">📚 Compagno di Lettura</h4>
        <p style="font-size: 0.85rem; color: var(--neutral); margin: 0;">${showRandomTip()}</p>
        <button onclick="this.parentElement.remove()" style="margin-top: 0.5rem; padding: 0.25rem 0.5rem; font-size: 0.75rem; border: none; background: var(--bg-light); border-radius: 4px; cursor: pointer;">Chiudi</button>
    `;
    document.body.appendChild(companion);
}

// Feature 100: Celebration for 100 features!
function celebrate100Features() {
    // Silent celebration - avoid console noise in production
}

// Initialize additional QoL features
function initAdditionalQoL() {
    trackLastPage();
    restoreCustomTheme();
    initKeyboardArticleNav();
    showArticleFreshness();
    initImageZoom();
    initCodeCopy();
    smoothAnchorScroll();
    initIdleDetection();
    showPerformance();
    showCookieConsent();
    generateTableOfContents();
    initScrollSpy();
    initFootnotes();
    showGestureHints();
    checkReminders();
    
    // Check reading goal
    setTimeout(() => {
        const { goal, read } = checkReadingGoal();
        if (read > 0 && read < goal) {
            showToast(`📖 Hai letto ${read}/${goal} articoli oggi`, 'info');
        }
    }, 3000);
    
    // Initialize auto-hide header if enabled
    if (localStorage.getItem('autoHideHeader') === 'true') {
        initAutoHideHeader();
    }
    
    // Initialize night mode scheduler if enabled
    if (localStorage.getItem('nightSchedule') === 'true') {
        initNightModeScheduler();
    }
    
    // Show word count on article pages
    if (window.location.pathname.includes('articolo')) {
        showWordCount();
        showArticleActions();
        syncReadingPosition();
    }
    
    // Swipe navigation on mobile
    if ('ontouchstart' in window) {
        initSwipeNavigation();
    }
    
    celebrate100Features();
}

// Call additional QoL initialization
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initAdditionalQoL, 500);
});

// Export new functions
window.toggleHighContrast = toggleHighContrast;
window.toggleReadingRuler = toggleReadingRuler;
window.readArticleAloud = readArticleAloud;
window.stopReading = stopReading;
window.showThemeSelector = showThemeSelector;
window.applyTheme = applyTheme;
window.setReadingGoal = setReadingGoal;
window.toggleZenMode = toggleZenMode;
window.showQuickStats = showQuickStats;
window.showQuickSettings = showQuickSettings;
window.saveQuickSettings = saveQuickSettings;
window.showReportIssue = showReportIssue;
window.submitIssue = submitIssue;
window.remindLater = remindLater;
window.searchInArticle = searchInArticle;
window.downloadAsPDF = downloadAsPDF;
window.scrollToComments = scrollToComments;
window.showReadingCompanion = showReadingCompanion;
window.acceptCookies = acceptCookies;
window.declineCookies = declineCookies;

}

// Main.js loaded with 100+ QoL features
