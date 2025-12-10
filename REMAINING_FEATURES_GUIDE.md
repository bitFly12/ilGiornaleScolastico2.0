# Guida Implementazione Features Rimanenti

## 📋 Panoramica

Questo documento descrive tutte le feature richieste che richiedono implementazione completa.

---

## 🎨 Parte 2: Rimozione Dark Mode + Design Neon

### Files da Modificare (35+ files)

#### CSS Changes
**File**: `css/style.css`

1. **Rimuovere tutte le sezioni dark-mode** (linee 54-1000+):
```css
/* RIMUOVERE COMPLETAMENTE */
:root.dark-mode { ... }
.dark-mode .header { ... }
.dark-mode .card { ... }
/* ... tutte le altre 100+ regole dark-mode */
```

2. **Aggiungere nuova palette neon/colorata**:
```css
:root {
    /* Neon & Vibrant Colors */
    --neon-pink: #FF006E;
    --neon-blue: #00F5FF;
    --neon-green: #39FF14;
    --neon-purple: #BF00FF;
    --neon-yellow: #FFFF00;
    
    /* Gradients */
    --gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    --gradient-secondary: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    --gradient-neon: linear-gradient(135deg, #FF006E 0%, #00F5FF 50%, #39FF14 100%);
    
    /* Bright Background */
    --bg-light: #FFFFFF;
    --bg-card: #F8F9FA;
    --text-dark: #212529;
    
    /* Shadows with color */
    --shadow-pink: 0 0 20px rgba(255, 0, 110, 0.3);
    --shadow-blue: 0 0 20px rgba(0, 245, 255, 0.3);
    --shadow-multi: 0 0 30px rgba(255, 0, 110, 0.2), 0 0 40px rgba(0, 245, 255, 0.2);
}
```

3. **Applicare nuovi stili ai componenti**:
```css
/* Header con gradient neon */
.header {
    background: var(--gradient-neon);
    box-shadow: var(--shadow-multi);
}

/* Buttons con effetto neon */
.btn-primary {
    background: var(--neon-pink);
    box-shadow: var(--shadow-pink);
    transition: all 0.3s ease;
}

.btn-primary:hover {
    box-shadow: 0 0 30px var(--neon-pink);
    transform: translateY(-2px);
}

/* Cards con bordi colorati */
.card {
    border: 2px solid transparent;
    background: linear-gradient(white, white) padding-box,
                var(--gradient-primary) border-box;
    box-shadow: var(--shadow-multi);
}

/* Article cards con accent neon */
.article-card {
    border-left: 4px solid var(--neon-blue);
    transition: all 0.3s ease;
}

.article-card:hover {
    box-shadow: var(--shadow-blue);
    transform: translateY(-5px);
}
```

#### HTML Changes (Tutti i files)
Rimuovere da OGNI file HTML:
- [ ] `index.html` - Rimuovi dark mode toggle
- [ ] `articoli.html` - Rimuovi dark mode toggle
- [ ] `articolo.html` - Rimuovi dark mode toggle  
- [ ] `chat.html` - Rimuovi dark mode toggle
- [ ] `dashboard.html` - Rimuovi dark mode toggle
- [ ] `admin.html` - Rimuovi dark mode toggle
- [ ] `profilo.html` - Rimuovi dark mode toggle
- [ ] `impostazioni.html` - Rimuovi sezione tema (linee 150-180)
- [ ] Altri 25+ files HTML

**Codice da rimuovere da ogni HTML**:
```html
<!-- RIMUOVERE -->
<button id="theme-toggle" class="theme-toggle">
    <i class="fas fa-moon"></i>
</button>

<!-- RIMUOVERE da impostazioni.html -->
<div class="setting-item">
    <label for="theme-select">Tema</label>
    <select id="theme-select">
        <option value="light">Chiaro</option>
        <option value="dark">Scuro</option>
        <option value="auto">Automatico</option>
    </select>
</div>
```

#### JavaScript Changes
**File**: `js/main.js`

Rimuovere funzioni dark mode (linee ~200-300):
```javascript
// RIMUOVERE COMPLETAMENTE
function initThemeToggle() { ... }
function setTheme(theme) { ... }
function getSystemTheme() { ... }
// Tutte le funzioni dark mode
```

---

## 🚨 Parte 3: Sistema Segnalazioni

### Database Setup

#### Nuove Tabelle SQL

```sql
-- Tabella segnalazioni articoli
CREATE TABLE article_reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    article_id UUID NOT NULL REFERENCES articoli(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES profili_utenti(user_id),
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(article_id, reporter_id)  -- Un utente può segnalare un articolo solo una volta
);

-- Tabella segnalazioni messaggi chat
CREATE TABLE message_reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES profili_utenti(user_id),
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(message_id, reporter_id)
);

-- Tabella articoli sospesi
CREATE TABLE suspended_articles (
    article_id UUID PRIMARY KEY REFERENCES articoli(id) ON DELETE CASCADE,
    suspended_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    report_count INTEGER NOT NULL,
    is_immune BOOLEAN DEFAULT FALSE,  -- Se true, non può essere auto-sospeso
    reviewed_by UUID REFERENCES profili_utenti(user_id),
    reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Indici per performance
CREATE INDEX idx_article_reports_article ON article_reports(article_id);
CREATE INDEX idx_message_reports_message ON message_reports(message_id);

-- RLS Policies
ALTER TABLE article_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE suspended_articles ENABLE ROW LEVEL SECURITY;

-- Policy: Chiunque può segnalare
CREATE POLICY "Users can report articles"
    ON article_reports FOR INSERT
    WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can report messages"
    ON message_reports FOR INSERT
    WITH CHECK (auth.uid() = reporter_id);

-- Policy: Admin possono vedere tutte le segnalazioni
CREATE POLICY "Admins can view all reports"
    ON article_reports FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profili_utenti
            WHERE user_id = auth.uid()
            AND ruolo IN ('caporedattore', 'docente')
        )
    );
```

#### Trigger Auto-Sospensione

```sql
-- Funzione per auto-sospendere articoli
CREATE OR REPLACE FUNCTION check_article_suspension()
RETURNS TRIGGER AS $$
DECLARE
    report_count INTEGER;
    is_already_immune BOOLEAN;
BEGIN
    -- Conta segnalazioni uniche
    SELECT COUNT(DISTINCT reporter_id) INTO report_count
    FROM article_reports
    WHERE article_id = NEW.article_id;
    
    -- Controlla se è immune
    SELECT COALESCE(is_immune, FALSE) INTO is_already_immune
    FROM suspended_articles
    WHERE article_id = NEW.article_id;
    
    -- Se >= 3 segnalazioni e non immune, sospendi
    IF report_count >= 3 AND NOT is_already_immune THEN
        INSERT INTO suspended_articles (article_id, report_count)
        VALUES (NEW.article_id, report_count)
        ON CONFLICT (article_id) DO UPDATE
        SET report_count = EXCLUDED.report_count;
        
        -- Nascondi articolo (imposta is_published a false)
        UPDATE articoli
        SET is_published = FALSE
        WHERE id = NEW.article_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger dopo ogni segnalazione
CREATE TRIGGER trigger_check_article_suspension
AFTER INSERT ON article_reports
FOR EACH ROW
EXECUTE FUNCTION check_article_suspension();

-- Stesso sistema per messaggi chat
CREATE OR REPLACE FUNCTION check_message_suspension()
RETURNS TRIGGER AS $$
DECLARE
    report_count INTEGER;
BEGIN
    SELECT COUNT(DISTINCT reporter_id) INTO report_count
    FROM message_reports
    WHERE message_id = NEW.message_id;
    
    IF report_count >= 3 THEN
        -- Nascondi messaggio
        UPDATE chat_messages
        SET is_deleted = TRUE
        WHERE id = NEW.message_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_message_suspension
AFTER INSERT ON message_reports
FOR EACH ROW
EXECUTE FUNCTION check_message_suspension();
```

### Frontend Implementation

#### File: `articolo.html`

Aggiungi pulsante segnala:
```html
<!-- Dopo i pulsanti reazioni -->
<button class="btn-report" onclick="reportArticle()">
    <i class="fas fa-flag"></i> Segnala Articolo
</button>
```

JavaScript:
```javascript
async function reportArticle() {
    // Controlla auth
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    if (!user) {
        alert('Devi essere loggato per segnalare');
        return;
    }
    
    // Chiedi motivo
    const reason = prompt('Motivo della segnalazione:');
    if (!reason || reason.trim() === '') return;
    
    try {
        // Invia segnalazione
        const { error } = await window.supabaseClient
            .from('article_reports')
            .insert({
                article_id: articleId,
                reporter_id: user.id,
                reason: reason.trim()
            });
            
        if (error) {
            if (error.code === '23505') {
                alert('Hai già segnalato questo articolo');
            } else {
                throw error;
            }
        } else {
            alert('Segnalazione inviata. Grazie!');
        }
    } catch (error) {
        console.error('Errore segnalazione:', error);
        alert('Errore nell\'invio della segnalazione');
    }
}
```

#### File: `admin.html`

Sezione gestione segnalazioni:
```html
<div class="admin-section">
    <h2>📋 Gestione Segnalazioni</h2>
    
    <!-- Articoli segnalati -->
    <div class="reported-items">
        <h3>Articoli Sospesi</h3>
        <div id="suspended-articles-list"></div>
    </div>
</div>

<script>
async function loadSuspendedArticles() {
    const { data, error } = await window.supabaseClient
        .from('suspended_articles')
        .select(`
            *,
            articoli (
                titolo,
                autore_id
            ),
            article_reports (
                reason,
                reporter_id,
                created_at
            )
        `)
        .order('suspended_at', { ascending: false });
        
    if (error) {
        console.error('Errore caricamento:', error);
        return;
    }
    
    const container = document.getElementById('suspended-articles-list');
    container.innerHTML = data.map(item => `
        <div class="suspended-item">
            <h4>${item.articoli.titolo}</h4>
            <p>Segnalazioni: ${item.report_count}</p>
            <p>Sospeso il: ${new Date(item.suspended_at).toLocaleDateString()}</p>
            
            <div class="admin-actions">
                <button onclick="approveArticle('${item.article_id}')" class="btn-success">
                    ✅ Approva e Rendi Immune
                </button>
                <button onclick="deleteArticle('${item.article_id}')" class="btn-danger">
                    🗑️ Elimina Definitivamente
                </button>
            </div>
        </div>
    `).join('');
}

async function approveArticle(articleId) {
    if (!confirm('Approvare l\'articolo e renderlo immune?')) return;
    
    try {
        // Rendi immune
        await window.supabaseClient
            .from('suspended_articles')
            .update({ 
                is_immune: true,
                reviewed_by: (await window.supabaseClient.auth.getUser()).data.user.id,
                reviewed_at: new Date().toISOString()
            })
            .eq('article_id', articleId);
            
        // Ripubblica
        await window.supabaseClient
            .from('articoli')
            .update({ is_published: true })
            .eq('id', articleId);
            
        alert('Articolo approvato e reso immune!');
        loadSuspendedArticles();
    } catch (error) {
        console.error('Errore:', error);
        alert('Errore nell\'approvazione');
    }
}

async function deleteArticle(articleId) {
    if (!confirm('ATTENZIONE: Eliminare l\'articolo in modo permanente?')) return;
    
    try {
        await window.supabaseClient
            .from('articoli')
            .delete()
            .eq('id', articleId);
            
        alert('Articolo eliminato');
        loadSuspendedArticles();
    } catch (error) {
        console.error('Errore:', error);
        alert('Errore nell\'eliminazione');
    }
}
</script>
```

#### File: `chat.html`

Menu contestuale messaggi:
```html
<script>
// Aggiungi a ogni messaggio
function createMessageElement(message) {
    const div = document.createElement('div');
    div.className = 'message';
    div.innerHTML = `
        <div class="message-header">
            <strong>${message.author_name}</strong>
            <span class="message-time">${formatTime(message.created_at)}</span>
            ${canManageMessage(message) ? `
                <button class="btn-menu" onclick="showMessageMenu(event, '${message.id}', ${message.user_id === currentUserId})">
                    ⋮
                </button>
            ` : ''}
        </div>
        <div class="message-text">${message.content}</div>
    `;
    return div;
}

function showMessageMenu(event, messageId, isOwn) {
    event.stopPropagation();
    
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.innerHTML = `
        ${isOwn ? `
            <div onclick="editMessage('${messageId}')">✏️ Modifica</div>
            <div onclick="deleteMessage('${messageId}')">🗑️ Elimina</div>
        ` : `
            <div onclick="reportMessage('${messageId}')">🚩 Segnala</div>
        `}
        ${isAdmin() ? `
            <div onclick="adminDeleteMessage('${messageId}')">❌ Elimina (Admin)</div>
        ` : ''}
    `;
    
    // Posiziona menu
    menu.style.position = 'fixed';
    menu.style.left = event.clientX + 'px';
    menu.style.top = event.clientY + 'px';
    
    document.body.appendChild(menu);
    
    // Chiudi cliccando fuori
    setTimeout(() => {
        document.addEventListener('click', () => menu.remove(), { once: true });
    }, 100);
}

async function editMessage(messageId) {
    const newText = prompt('Modifica messaggio:');
    if (!newText || newText.trim() === '') return;
    
    try {
        await window.supabaseClient
            .from('chat_messages')
            .update({ 
                content: newText.trim(),
                edited_at: new Date().toISOString()
            })
            .eq('id', messageId);
            
        loadChatMessages(); // Ricarica
    } catch (error) {
        console.error('Errore modifica:', error);
        alert('Errore nella modifica');
    }
}

async function deleteMessage(messageId) {
    if (!confirm('Eliminare il messaggio?')) return;
    
    try {
        await window.supabaseClient
            .from('chat_messages')
            .update({ is_deleted: true })
            .eq('id', messageId);
            
        loadChatMessages();
    } catch (error) {
        console.error('Errore eliminazione:', error);
        alert('Errore nell\'eliminazione');
    }
}

async function reportMessage(messageId) {
    const reason = prompt('Motivo della segnalazione:');
    if (!reason || reason.trim() === '') return;
    
    try {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        
        await window.supabaseClient
            .from('message_reports')
            .insert({
                message_id: messageId,
                reporter_id: user.id,
                reason: reason.trim()
            });
            
        alert('Segnalazione inviata!');
    } catch (error) {
        console.error('Errore segnalazione:', error);
        if (error.code === '23505') {
            alert('Hai già segnalato questo messaggio');
        } else {
            alert('Errore nell\'invio');
        }
    }
}

async function adminDeleteMessage(messageId) {
    if (!confirm('ADMIN: Eliminare definitivamente?')) return;
    
    try {
        await window.supabaseClient
            .from('chat_messages')
            .delete()
            .eq('id', messageId);
            
        loadChatMessages();
    } catch (error) {
        console.error('Errore:', error);
        alert('Errore nell\'eliminazione');
    }
}

function isAdmin() {
    const role = localStorage.getItem('userRole');
    return role === 'caporedattore' || role === 'docente';
}
</script>
```

---

## 💬 Chat Loading Message

#### File: `chat.html`

```html
<div id="chat-loading" class="chat-loading" style="display: none;">
    <div class="spinner"></div>
    <p>Caricamento messaggi...</p>
</div>

<style>
.chat-loading {
    text-align: center;
    padding: 2rem;
    color: var(--neutral);
}

.spinner {
    border: 3px solid var(--bg-card);
    border-top: 3px solid var(--neon-blue);
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
</style>

<script>
async function loadChatMessages() {
    // Mostra loading
    document.getElementById('chat-loading').style.display = 'block';
    document.getElementById('chat-messages').style.display = 'none';
    
    try {
        // Carica messaggi
        const { data, error } = await window.supabaseClient
            .from('chat_messages')
            .select('*')
            .eq('is_deleted', false)
            .order('created_at', { ascending: true })
            .limit(100);
            
        if (error) throw error;
        
        // Nascondi loading, mostra chat
        document.getElementById('chat-loading').style.display = 'none';
        document.getElementById('chat-messages').style.display = 'block';
        
        // Renderizza messaggi
        renderMessages(data);
    } catch (error) {
        console.error('Errore caricamento:', error);
        document.getElementById('chat-loading').innerHTML = `
            <p style="color: var(--error);">Errore nel caricamento dei messaggi</p>
        `;
    }
}
</script>
```

---

## 🔐 Single Session (Logout Altri Dispositivi)

### Database Setup

```sql
-- Tabella sessioni attive
CREATE TABLE user_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profili_utenti(user_id) ON DELETE CASCADE,
    session_token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    device_info JSONB,  -- Browser, OS, etc.
    ip_address INET
);

-- Indice per query veloci
CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);

-- RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions"
    ON user_sessions FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own sessions"
    ON user_sessions FOR DELETE
    USING (user_id = auth.uid());
```

### Frontend Implementation

#### File: `login.html`

```javascript
async function handleLogin(email, password) {
    try {
        // Login con Supabase
        const { data, error } = await window.supabaseClient.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        
        const user = data.user;
        
        // Genera session token unico
        const sessionToken = crypto.randomUUID();
        
        // Salva in localStorage
        localStorage.setItem('sessionToken', sessionToken);
        
        // Registra nuova sessione e invalida le altre
        await registerNewSession(user.id, sessionToken);
        
        // Redirect
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Errore login:', error);
        alert('Errore nel login');
    }
}

async function registerNewSession(userId, sessionToken) {
    try {
        // Ottieni info dispositivo
        const deviceInfo = {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language
        };
        
        // Elimina TUTTE le sessioni precedenti
        await window.supabaseClient
            .from('user_sessions')
            .delete()
            .eq('user_id', userId);
        
        // Registra nuova sessione
        await window.supabaseClient
            .from('user_sessions')
            .insert({
                user_id: userId,
                session_token: sessionToken,
                device_info: deviceInfo
            });
            
        console.log('Nuova sessione registrata, vecchie sessioni invalidate');
    } catch (error) {
        console.error('Errore registrazione sessione:', error);
    }
}
```

#### File: `js/main.js`

Controllo sessione su ogni pagina:
```javascript
// All'avvio di ogni pagina
async function checkSessionValidity() {
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    if (!user) return;  // Non loggato
    
    const sessionToken = localStorage.getItem('sessionToken');
    if (!sessionToken) {
        // Nessun token, logout
        await forceLogout('Sessione non valida');
        return;
    }
    
    try {
        // Verifica se la sessione è valida
        const { data, error } = await window.supabaseClient
            .from('user_sessions')
            .select('*')
            .eq('user_id', user.id)
            .eq('session_token', sessionToken)
            .single();
            
        if (error || !data) {
            // Sessione non trovata = logout da altro dispositivo
            await forceLogout('Hai effettuato il login da un altro dispositivo');
            return;
        }
        
        // Aggiorna last_active
        await window.supabaseClient
            .from('user_sessions')
            .update({ last_active: new Date().toISOString() })
            .eq('session_token', sessionToken);
            
    } catch (error) {
        console.error('Errore verifica sessione:', error);
    }
}

async function forceLogout(message) {
    // Mostra messaggio
    alert(message);
    
    // Pulisci localStorage
    localStorage.clear();
    
    // Logout da Supabase
    await window.supabaseClient.auth.signOut();
    
    // Redirect
    window.location.href = 'login.html';
}

// Esegui controllo all'avvio e ogni 30 secondi
document.addEventListener('DOMContentLoaded', () => {
    checkSessionValidity();
    setInterval(checkSessionValidity, 30000);  // Ogni 30 secondi
});
```

---

## 📝 Checklist Implementazione

### Parte 2: Design Neon (Stimato: 4-6 ore)
- [ ] Rimuovere dark-mode da css/style.css (500+ linee)
- [ ] Aggiungere nuove variabili CSS neon
- [ ] Applicare gradienti a header/cards/buttons
- [ ] Rimuovere toggle dark-mode da tutti HTML (35+ files)
- [ ] Rimuovere funzioni dark-mode da js/main.js
- [ ] Rimuovere sezione tema da impostazioni.html
- [ ] Testare su tutti i browser

### Parte 3A: Sistema Segnalazioni (Stimato: 6-8 ore)
- [ ] Creare tabelle SQL (article_reports, message_reports, suspended_articles)
- [ ] Creare trigger auto-sospensione
- [ ] Implementare RLS policies
- [ ] Aggiungere pulsante segnala in articolo.html
- [ ] Implementare funzione reportArticle()
- [ ] Aggiungere sezione admin per gestire segnalazioni
- [ ] Implementare approveArticle() e deleteArticle()
- [ ] Aggiungere menu contestuale messaggi chat
- [ ] Implementare editMessage(), deleteMessage(), reportMessage()
- [ ] Testare flusso completo

### Parte 3B: Single Session (Stimato: 3-4 ore)
- [ ] Creare tabella user_sessions
- [ ] Modificare login.html per registrare sessioni
- [ ] Implementare registerNewSession()
- [ ] Aggiungere checkSessionValidity() in main.js
- [ ] Testare logout automatico
- [ ] Testare con 2+ dispositivi simultanei

### Parte 3C: Chat Improvements (Stimato: 2 ore)
- [ ] Aggiungere spinner loading in chat.html
- [ ] Implementare stato loading
- [ ] Testare su connessioni lente

---

## 🚀 Deployment

Dopo implementazione:

1. **SQL su Supabase**:
```bash
# Esegui tutti gli script SQL nel pannello SQL Editor
```

2. **Deploy codice**:
```bash
git add .
git commit -m "Implementa design neon, reporting system e single session"
git push
```

3. **Verifica RLS**:
- Vai su Supabase → Authentication → Policies
- Verifica che tutte le policies siano attive

4. **Test End-to-End**:
- [ ] Registrazione funziona
- [ ] Login da 2 dispositivi → primo viene disconnesso
- [ ] Segnala articolo → dopo 3 segnalazioni viene nascosto
- [ ] Admin approva/elimina articoli segnalati
- [ ] Segnala messaggio chat → dopo 3 viene nascosto
- [ ] Utente modifica/elimina propri messaggi
- [ ] Design neon visibile ovunque
- [ ] Nessuna traccia di dark mode

---

## 📞 Supporto

Se hai domande sull'implementazione:
1. Controlla la documentazione Supabase
2. Verifica che tutti gli script SQL siano eseguiti
3. Controlla console browser per errori
4. Verifica RLS policies nel dashboard Supabase

---

**Nota**: Queste modifiche richiedono circa 15-20 ore di lavoro per implementazione completa e testing.
