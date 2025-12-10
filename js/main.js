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
    initDarkMode();
    initDailyQuote();
    initNewsletterForm();
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
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!menuToggle.contains(e.target) && !navMenu.contains(e.target)) {
                navMenu.classList.remove('active');
            }
        });
    }
}

// ================================================
// DARK MODE
// ================================================
function initDarkMode() {
    // Check localStorage for saved preference
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode === 'true') {
        enableDarkMode();
    }
    
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches && !savedMode) {
        enableDarkMode();
    }
}

function enableDarkMode() {
    document.documentElement.classList.add('dark-mode');
    AppState.darkMode = true;
    localStorage.setItem('darkMode', 'true');
}

function disableDarkMode() {
    document.documentElement.classList.remove('dark-mode');
    AppState.darkMode = false;
    localStorage.setItem('darkMode', 'false');
}

function toggleDarkMode() {
    if (AppState.darkMode) {
        disableDarkMode();
    } else {
        enableDarkMode();
    }
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

// ================================================
// NEWSLETTER FORM
// ================================================
function initNewsletterForm() {
    const form = document.getElementById('newsletterForm');
    const message = document.getElementById('newsletterMessage');
    
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const emailInput = document.getElementById('newsletterEmail');
            const email = emailInput.value.trim();
            
            if (!validateEmail(email)) {
                showMessage(message, 'Inserisci un indirizzo email valido', 'error');
                return;
            }
            
            try {
                // Save to Supabase database
                if (window.supabaseClient) {
                    const { data, error } = await window.supabaseClient
                        .from('iscrizioni_newsletter')
                        .insert([{ email: email }])
                        .select();
                    
                    if (error) {
                        // Check if already subscribed (unique constraint violation)
                        if (error.code === '23505') {
                            showMessage(message, 'Sei già iscritto alla newsletter!', 'info');
                            form.reset();
                            return;
                        }
                        throw error;
                    }
                    
                    // Successfully subscribed
                    showMessage(message, '✅ Iscrizione completata! Controlla la tua email per confermare.', 'success');
                    form.reset();
                    
                    // Send confirmation email via Edge Function (if available)
                    try {
                        await sendNewsletterConfirmation(email);
                    } catch (emailError) {
                        console.error('Error sending confirmation email:', emailError);
                        // Don't show error to user, subscription was successful
                    }
                } else {
                    // Fallback to localStorage if Supabase not available
                    let subscribers = JSON.parse(localStorage.getItem('newsletterSubscribers') || '[]');
                    
                    if (subscribers.includes(email)) {
                        showMessage(message, 'Sei già iscritto alla newsletter!', 'info');
                        return;
                    }
                    
                    subscribers.push(email);
                    localStorage.setItem('newsletterSubscribers', JSON.stringify(subscribers));
                    showMessage(message, '✅ Iscrizione completata! Grazie!', 'success');
                    form.reset();
                }
            } catch (error) {
                console.error('Newsletter subscription error:', error);
                showMessage(message, '❌ Errore durante l\'iscrizione. Riprova più tardi.', 'error');
            }
        });
    }
}

// Send newsletter confirmation email
async function sendNewsletterConfirmation(email) {
    // Call Supabase Edge Function to send confirmation email via Resend
    try {
        if (window.supabaseClient && window.supabaseClient.functions) {
            const { data, error } = await window.supabaseClient.functions.invoke('send-newsletter-confirmation', {
                body: { email: email }
            });
            
            if (error) {
                console.error('Error calling edge function:', error);
                return { success: false, error: error.message };
            }
            
            console.log('Confirmation email sent successfully:', data);
            return { success: true, data };
        } else {
            // Edge function not available
            console.log('[Newsletter] Edge function not deployed yet.');
            console.log(`[Newsletter] Confirmation email should be sent to: ${email}`);
            console.log('[Newsletter] Deploy the edge function: supabase functions deploy send-newsletter-confirmation');
            return { success: true, message: 'Edge function not deployed' };
        }
    } catch (error) {
        console.error('Error sending confirmation email:', error);
        return { success: false, error: error.message };
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
window.toggleDarkMode = toggleDarkMode;
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

console.log('✅ Main.js caricato con successo');
