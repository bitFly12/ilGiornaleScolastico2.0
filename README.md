# ilGiornaleScolastico2.0
# 🎓 PROMPT COMPLETO:  Rigenerazione Giornale Scolastico Cesaris

## 🎯 OBIETTIVO PRINCIPALE

Rigenerare completamente il sito del **Giornale Scolastico Cesaris** con: 
- ✅ **Design completamente NUOVO** (colori indigo/rosa, typography elegante, diverso dall'originale)
- ✅ **Mobile-First per LETTURA** (molte info per schermata, zero scroll infinito)
- ✅ **Desktop-First per SCRITTURA** (dashboard redattore ampia e potente)
- ✅ **Paginazione NUMERICA** (click 1 2 3 4 5, non scroll)
- ✅ **AI Detector** (> 50% AI = BLOCCA, < 50% = PUBBLICA)
- ✅ **Chat Globale Avanzata** (real-time, sondaggi, voice messages, reazioni emoji, grafici)
- ✅ **50+ Feature Aggiuntive** (gamification, personalizzazione, analytics, community)
- ✅ **Frontend-Heavy** (minimizzare backend, JS nel browser quando possibile)
- ✅ **Accesso Controllato**: 
  - Lettura:  SENZA login
  - Chat: CON login @cesaris.edu.it
  - Reporter: CON candidatura + acceptance terms
  - Redazione: NASCOSTA (no link pubblico)
  - Admin: RLS check

---

## 📱 DESIGN VISUAL (Completamente Nuovo)

### Colori Principali
```css
--primary:  #4338CA;      /* Indigo scuro */
--secondary: #EC4899;    /* Rosa accento */
--success: #10B981;      /* Verde menta */
--neutral: #78716C;      /* Grigio taupe */
--bg-light: #FFFBF0;     /* Bianco cremoso */
--bg-card: #FFFFFF;      /* Bianco puro */
--text-dark: #1F2937;    /* Grigio carbone */
--error: #DC2626;        /* Rosso */
```

### Typography
- **Headings**: Georgia / Garamond (serif elegante)
- **Body**: Inter / Poppins (sans-serif pulito, leggibile)
- **Code**: Fira Code (monospace)
- **Dyslexia-friendly**: OpenDyslexic (opzione disponibile)

### Layout Mobile (HOME PAGE)
```
┌─────────────────────┐
│ HEADER COMPATTO     │ (logo + burger menu)
├─────────────────────┤
│  HERO ARTICOLO      │ (img grande)
│  IN EVIDENZA        │
├─────────────────────┤
│ Mario | 5 min | Top │ (meta compatta 1 linea)
├─────────────────────┤
│  GRID 4 COLONNE     │ (4 articoli con foto piccola)
│  ARTICOLI RECENTI   │
│  [Card 1] [Card 2]  │
│  [Card 3] [Card 4]  │
├─────────────────────┤
│ PAGINAZIONE NUMERI  │
│  [1] [2] [3] [4]    │ ← CLICK per cambiare pagina
├─────────────────────┤
│  NEWSLETTER WIDGET  │
├─────────────────────┤
│ CHAT BUBBLE STICKY  │
│ (corner bottom-right)│
└─────────────────────┘
```

### Layout Desktop (DASHBOARD REDATTORE)
```
┌──────────────────────────────────────────────────────┐
│ HEADER FISSO                                          │
├────────────┬──────────────────────────┬──────────────┤
│ SIDEBAR    │ EDITOR ARTICOLO (CENTRO) │ PREVIEW      │
│ - Dashboard│ ┌────────────────────┐   │ - Live       │
│ - Articoli │ │ Titolo             │   │   preview    │
│ - Nuovo    │ │ Sommario           │   │ - AI GAUGE   │
│ - Stats    │ │ [EDITOR RICCO]     │   │   45% ✓ OK   │
│ - Impost.   │ │ Categoria + Tags   │   │ - Errori     │
│            │ │ Upload IMG (D&D)   │   │ - Stats      │
│            │ │ Schedule publish   │   │              │
│            │ │ [PUBLISH BUTTON]   │   │              │
│            │ │ [SAVE DRAFT]       │   │              │
│            │ └────────────────────┘   │              │
└────────────┴──────────────────────────┴──────────────┘
```

---

## 🔐 SISTEMA DI ACCESSO (4 LIVELLI)

### 1️⃣ LETTORE ANONIMO (Senza Login)
**Cosa può fare:**
- ✅ Leggi articoli
- ✅ Vedi home
- ✅ Ricerca e filtri
- ✅ Leggi commenti approvati
- ✅ Accetta termini lettura (modal al primo accesso)

**NON può fare:**
- ❌ Scrivere commenti
- ❌ Entrare in chat
- ❌ Fare bookmark
- ❌ Diventare reporter

---

### 2️⃣ STUDENTE AUTENTICATO (Login @cesaris.edu.it)
**Cosa può fare:**
- ✅ Tutto di lettore anonimo +
- ✅ Chat globale
- ✅ Scrivere commenti
- ✅ Fare bookmarks
- ✅ Seguire autori
- ✅ Profilo personale
- ✅ Candidarsi come reporter

**NON può fare:**
- ❌ Creare articoli (finché non diventato reporter)
- ❌ Moderare contenuti
- ❌ Accedere area redazione

---

### 3️⃣ REPORTER (Studente Approvato + Terms Accepted)
**Cosa può fare:**
- ✅ Tutto di studente autenticato +
- ✅ **CREARE/MODIFICARE ARTICOLI**
- ✅ Inviare per approvazione
- ✅ Vedere dashboard stats personali
- ✅ **1 VOLTA SOLA**:  Accettare Terms & Conditions etici/legali (obbligatorio al primo accesso area redazione)

**Flusso Candidatura:**
```
1. Studente login con @cesaris.edu.it
2. Clicca "Candidati come Reporter"
3. Form (nome completo, classe, motivazione)
4. Admin riceve candidatura
5. Admin approva → Email notifica
6. Reporter accede area redazione
7. Modale Terms → Deve accettare
8. Può iniziare a scrivere articoli
```

**Terms Reporter** (accettati 1 volta):
```
"Come reporter, accetti: 
- Codice etico deontologico giornalismo
- Responsabilità civile/penale contenuti
- Obbligo verificare fonti
- DIVIETO: Plagio, contenuto AI > 50%
- GDPR:  Protezione dati studenti
- Linee guida community
- Rischio sospensione violazioni"
```

---

### 4️⃣ AREA REDAZIONE (Staff Selezionato - NASCOSTA)
**Chi può accedere:** Caporedattore + Moderatori (RLS check)

**NON c'è link pubblico.**  
**Metodo di accesso:** URL segreta o RLS check nel DB

**Come implementare (FURBO):**
```javascript
// Frontend check - link aggiunto DINAMICAMENTE solo se authorized
const user = supabase.auth.user();
const { data: profile } = await supabase
    .from('profili_redattori')
    .select('ruolo, is_hidden')
    .eq('id', user.id)
    .single();

// Se è Caporedattore e is_hidden = false:
if (profile.ruolo === 'Caporedattore' && ! profile.is_hidden) {
    // Aggiungi link dinamico nel nav: 
    // <a href="/redazione/moderate">Area Redazione</a>
}
```

**NO href statico nel HTML** → link viene aggiunto da JS dopo auth check. 

**Dashboard Redazione:**
- Articoli in revisione (approve/reject)
- Commenti da moderare
- Newsletter logs
- Analytics globali
- Gestione utenti

---

### 5️⃣ ADMIN (RLS Policy)
**Chi può accedere:** Caporedattore (ruolo = 'Caporedattore')

**Dashboard Admin:**
- CRUD su tutte le tabelle
- Gestione candidature reporter
- Analytics globali
- Configurazione sito

---

## 📋 FUNZIONALITÀ PRINCIPALI (Mantenute)

### 📰 Articoli
- **Creazione**: Titolo, sommario, contenuto (HTML), categoria, tags, immagine
- **Stati**: Bozza → In revisione → Pubblicato
- **AI Check**: Frontend JavaScript detector (transformers.js)
  - Se AI < 50% → verde "PUBBLICA" ✓
  - Se AI > 50% → rosso "BLOCCA" ✗
- **Approvazione**:  Moderatore approva articoli in revisione
- **Publishing**: Data pubblicazione, pianificazione futura (scheduled_publish_at)
- **Metriche**: Visualizzazioni, commenti (approved), bookmarks, shares
- **Reading time**: Calcolo automatico in minuti

### 💬 Commenti
- Utenti registrati possono commentare (dopo login @cesaris.edu.it)
- Moderazione:  `is_approved = false` per default, moderatore approva
- Mostra solo commenti approvati

### 📧 Newsletter
- Iscrizione semplice (email, no login richiesto)
- **UNICA Edge Function**: Resend API per invio email
- Trigger: Quando articolo → stato='pubblicato', invia email batch
- Template HTML professionale

### ⭐ Extra Features Mantentute
- Bookmarks articoli
- Social shares tracking
- Dark mode
- Responsive design
- Tags e categorie

---

## 💥 50+ FEATURE NUOVE (Detailed Implementation)

### 💬 CHAT GLOBALE (10 feature)

#### 1. Chat Globale Real-Time
```javascript
// Supabase Realtime subscription
const subscription = supabase
    .from('chat_messages')
    .on('*', payload => {
        // Update UI real-time
    })
    .subscribe();

// POST /api/chat/messages
// Save to DB + broadcast to all connected clients
```
- **Accesso**: Solo studenti login @cesaris.edu.it
- **Real-time**: WebSocket via Supabase Realtime
- **Messaggi salvati**: DB `chat_messages` table
- **Paginazione**:  Carica ultimi 50 messaggi, lazy load on scroll up

#### 2. Sondaggi in Chat
```javascript
// Creare sondaggio
{
    "content": "Qual è il tuo sport preferito?",
    "message_type": "poll",
    "poll_data": {
        "question": "Sport preferito",
        "options":  ["Calcio", "Basket", "Volley", "Tennis"],
        "votes": { "Calcio": 15, "Basket": 8, "Volley": 12, "Tennis": 3 }
    }
}

// Votare - Frontend ONLY (no backend call)
function votePoll(messageId, option) {
    // localStorage save temporaneo
    // UPDATE DB poll_data votes
    // Display aggiornato istantaneo
}
```
- **Widget poll**: Display domanda + barre verticali colorate
- **Vote**: Click opzione → voto salvato DB
- **Risultati**: Visualizzazione real-time barre

#### 3. Voice Messages
```javascript
// Registrazione browser MediaRecorder API
const mediaRecorder = new MediaRecorder(stream);
// Salva audio → Supabase Storage (es:  /chat-voices/: messageId. mp3)
// Link audio salvato in `chat_messages. voice_url`
// Display:  🎤 [PLAY BUTTON] 2: 34 min
```
- **Registrazione**: Tasto "🎤 Registra", browser API
- **Storage**: Supabase Storage bucket
- **Playback**: Audio player HTML5 inline
- **Max duration**: 5 minuti

#### 4. Reazioni Emoji ai Messaggi
```javascript
// Table chat_reactions
{
    message_id: ".. .",
    user_id: "...",
    emoji: "👍"  // or 😂 ❤️ 🤔 etc
}

// Display: [emoji count] under message
// Click emoji → toggle reaction
```
- **Picker**: Emoji selector popup
- **Display**: Sotto ogni messaggio, count reazioni
- **Like**:  👍 predefinito

#### 5. Quote/Reply in Chat
```javascript
// Rispondere a messaggio
{
    "content": "Sono d'accordo! ",
    "reply_to_message_id": "uuid_del_messaggio_precedente",
    "message_type": "text"
}

// Display: 
// > "Citazione messaggio precedente"
// Sono d'accordo!
```

#### 6. @mentions Studenti
```javascript
// Digitare @ mostra popup autocomplete studenti
const mention = "@Mario";
// Salva nel DB, invia notifica user
// Display: @Mario in link azzurro
```

#### 7. Pinned Messages
```javascript
// Admin/moderatore clicca "Fissa messaggio"
UPDATE chat_messages SET is_pinned = true WHERE id = ... ;

// Display: 
// ┌─────────────────────┐
// │ 📌 MESSAGGI FISSATI │
// │ "Importante:  ..."   │
// │ "Deadline: ..."      │
// └─────────────────────┘
// [Normal messages below]
```

#### 8. Search Chat
```javascript
// Input search
<input type="text" id="chat-search" placeholder="Cerca messaggi...">

// Frontend filter su messages già loaded:
const results = messages.filter(msg => 
    msg.content.toLowerCase().includes(query.toLowerCase())
);

// Se > 100 messaggi, POST /api/chat/search per search full DB
```

#### 9. Typing Indicators
```javascript
// Digitare → WebSocket emit "user-typing" evento
// Display: "Mario sta scrivendo..."
// Auto-hide dopo 3 secondi

// Implementation:  Debounce on input, emit event
```

#### 10. User Status Online/Offline
```javascript
// WebSocket subscribe user_sessions
// Display: 🟢 online / 🔘 offline next to username
// Update on login/logout
```

---

### 🎮 GAMIFICATION (10 feature)

#### 11. Punti Reporter
```sql
-- user_points table
user_id | total_points | articles_published | total_views
   1    |     250      |        5          |    1250

-- Logica punti:
-- +10 points per articolo pubblicato
-- +1 point per 100 views
-- +5 points per commento approvato
-- +2 points per bookmark ricevuto
```

#### 12. Badges & Achievements
```javascript
// Array badges disponibili:
const BADGES = [
    { type: 'first_article', name: 'Primo Articolo', icon: '📝' },
    { type: 'hundred_views', name: 'Cento Visualizzazioni', icon: '👁️' },
    { type: 'thousand_views', name: 'Mille Visualizzazioni', icon:  '🌟' },
    { type: 'top_writer', name: 'Scrittore Prolifico', icon: '✍️' },
    { type: 'community_helper', name: 'Aiutante Community', icon: '🤝' }
];

// Trigger al raggiungimento: 
// - Popup celebrativo "🎉 Hai sbloccato:  Primo Articolo!"
// - Salva in `user_badges` table
// - Mostra nel profilo pubblico
```

#### 13. Leaderboard Scrittori
```
GET /api/leaderboard? period=week

Display: 
┌─────────────────────────────────┐
│ TOP SCRITTORI (questa settimana)│
├─────────────────────────────────┤
│ 🥇 Mario Rossi       | 450 pts  │
│ 🥈 Anna Bianchi      | 380 pts  │
│ 🥉 Luca Verdi        | 320 pts  │
│  4.  Sofia Neri       | 280 pts  │
└─────────────────────────────────┘
```

#### 14. Reading Streak
```javascript
// Frontend localStorage tracking
// "Giorni consecutivi di lettura"
const today = new Date().toDateString();
if (localStorage.readingDate !== today) {
    streak++;
    localStorage.readingDate = today;
}

// Display: "🔥 Streak: 7 giorni"
```

#### 15. Article Reactions
```javascript
// Oltre a commenti, reazioni semplici
// Like, Love, Wow, Sad reactions
// Table article_reactions: 
{
    article_id: ".. .",
    user_id: "...",
    reaction_type: "love"  // or 'like', 'wow', 'sad'
}

// Display sotto articolo:
// ❤️ 25  😍 18  😮 5  😢 2
```

#### 16. Top Commenters Leaderboard
```
GET /api/leaderboard/commenters

┌─────────────────────────┐
│ TOP COMMENTATORI        │
├─────────────────────────┤
│ 1. Marco - 157 comments│
│ 2. Lisa - 134 comments │
│ 3. Paolo - 98 comments │
└─────────────────────────┘
```

#### 17. Weekly Challenges
```javascript
// Hardcoded challenges nel frontend
const WEEKLY_CHALLENGES = [
    {
        id: 'challenge-1',
        title: 'Scrittore Prolifico',
        description: 'Scrivi un articolo di 800+ parole',
        reward: 50,
        deadline: '2025-12-15'
    }
];

// Check automatico al publish articolo
// Se word_count > 800 → unlock challenge
// Popup: "🎉 Challenge sbloccato!  +50 punti"
```

#### 18. Reporter Level (junior/senior/chief)
```sql
-- profili_redattori
role:  'junior', 'senior', 'chief'  -- basato su articles_count

-- Logic:
-- 0-5 articoli: junior
-- 6-15 articoli: senior
-- 16+: chief
```

#### 19. Article Milestone Notifications
```javascript
// Trigger al raggiungimento: 
// - 100 visualizzazioni
// - 1000 visualizzazioni
// - 50 commenti approvati
// - 100 bookmarks

// Notification:  "🎯 Articolo raggiunto 1000 visualizzazioni!"
// Alert author + mostra in dashboard
```

#### 20. Daily Quote Widget
```javascript
// Array quote hardcoded
const DAILY_QUOTES = [
    "La conoscenza è potenza - Francis Bacon",
    "Leggi ogni giorno - Bill Gates",
    "La scrittura è arte - Stephen King"
];

// Frontend logic:
const today = new Date().getDate();
const quote = DAILY_QUOTES[today % DAILY_QUOTES.length];

// Display: Widget homepage con quote random daily
```

---

### 🎨 PERSONALIZZAZIONE (10 feature)

#### 21. Dark Mode Toggle
```javascript
// CSS variables theme
:root {
    --bg: #ffffff;
    --text: #1f2937;
    --border: #e5e7eb;
}

: root.dark-mode {
    --bg: #1a1a1a;
    --text: #f3f4f6;
    --border: #3f3f3f;
}

// Toggle button → localStorage persist
// Check OS preference:  prefers-color-scheme
```

#### 22. Font Size Personalizzato
```javascript
// +/- buttons:  80%, 100%, 120%, 150%
// CSS: body { font-size: calc(16px * var(--font-multiplier)) }
// localStorage persist
```

#### 23. Dyslexia-Friendly Font
```javascript
// Toggle OpenDyslexic font
// Link: https://www.dyslexiefont.com/
// CSS: font-family: 'OpenDyslexic', sans-serif;
```

#### 24. Preferred Categories Filter
```javascript
// Utente seleziona categorie preferite
// Dashboard mostra solo articoli quelle categorie
// Salva in user_preferences
```

#### 25. Reading Mode Distraction-Free
```javascript
// Button "🔍 Modalità lettura"
// CSS: Hide nav, sidebar, comments, ads
// Full-width content, font grande
// Colore fondo beige/sepia opzionale
```

#### 26. Bookmark Folders
```javascript
// Creare cartelle:  "Sport", "Tech", "Attualità"
// Drag-drop bookmark in cartella
// Frontend: localStorage JSON structure
// {
//     "Sport": [article_id_1, article_id_2],
//     "Tech": [article_id_3]
// }
```

#### 27. Reading History
```
GET /api/user/reading-history

Display:
┌────────────────────┐
│ STORICO LETTURE    │
├────────────────────┤
│ 1. Titolo 1 (oggi) │
│ 2. Titolo 2 (ieri) │
│ 3. Titolo 3 (2gg)  │
└────────────────────┘
```

#### 28. Language Toggle
```javascript
// Button flag:  🇮🇹 / 🇬🇧
// HTML lang attribute: it / en
// localStorage persist
// (Implementazione semplice:  tradurre labels principali)
```

#### 29.  Notification Preferences
```javascript
// Checkbox settings: 
// ☑️ Notifica quando articolo mio è commentato
// ☑️ Notifica quando follower pubblica
// ☑️ Notifica newsletter giornaliera
// ☑️ Notifica mensile leaderboard

// Salva in user_preferences table
```

#### 30. Custom Homepage Grid
```javascript
// Drag-drop widget order:
// [⬆️⬇️] Featured Articles
// [⬆️⬇️] Latest News
// [⬆️⬇️] Top Writers
// [⬆️⬇️] Chat Preview

// localStorage save posizione
```

---

### 📊 ANALYTICS (8 feature)

#### 31. Heatmap Articolo
```javascript
// Supabase track scroll position per ogni reader
// Frontend calcolo zona più letta (media scroll position)
// Visualizzazione:  barra laterale articolo colore intensità
// Rosso = zona molto letta, blu = zona poco letta
```

#### 32. Reading Session Analytics
```sql
-- reading_progress table
user_id | article_id | progress_percentage | time_spent_seconds

-- Dashboard mostra:
-- "Tempo medio lettura: 3:45 minuti"
-- "% lettori che completano: 67%"
```

#### 33. Comment Sentiment Analyzer
```javascript
// Libreria: sentiment. js
// Analizzare commenti → positivo/negativo/neutrale
// Display: ❤️ (positive), 😑 (neutral), 😞 (negative)
// Mostra trend sentiment articolo
```

#### 34. Author Analytics Dashboard
```
GET /api/author/: id/analytics

Display:
┌──────────────────────────┐
│ STATS MIEI ARTICOLI      │
├──────────────────────────┤
│ Total views: 5,320       │
│ Avg views/article: 664   │
│ Total comments: 87       │
│ Engagement rate: 15%     │
│ Top article: "Titolo..." │
└──────────────────────────┘
```

#### 35. SEO Optimization Checker
```javascript
// Frontend validation durante scrittura: 
// ☑️ Title length 30-60 chars
// ☑️ Meta description 120-160 chars
// ☑️ Keyword density 1-3%
// ☑️ Heading structure (H1, H2, H3)
// ☑️ Image alt text

// Visual feedback: ✓ O ✗ per ogni check
```

#### 36. A/B Testing Titoli
```javascript
// Creare 2 varianti articolo stesso contenuto, titoli diversi
// Random show 50/50 agli utenti
// Comparare CTR (click-through rate)
// Notificare autore winner
```

#### 37. Feedback Popup
```javascript
// Dopo 2 minuti lettura articolo:
// "Quanto ti è piaciuto questo articolo?"
// ⭐⭐⭐⭐⭐ (5 stars)
// "Commenti (opzionale):" [textarea]

// Save in feedback table per analytics
```

#### 38. Survey Articles
```html
<!-- Nel contenuto articolo -->
<div class="survey-inline">
    <p>Sei d'accordo con questo? </p>
    <button>Sì</button>
    <button>No</button>
    <button>Forse</button>
</div>

<!-- Traccia risposte, mostra real-time chart -->
```

---

### 👥 COMMUNITY (10 feature)

#### 39. User Profiles Pubblici
```
GET /api/user/: id/profile

Display: 
┌──────────────────────┐
│ Mario Rossi 🎖️       │
│ Reporter Senior      │
│ 📍 Classe 4A         │
│ Bio: "Appassionato.. │
│                      │
│ 📝 15 articoli      │
│ 👀 5,230 visualiz.  │
│ 👥 234 followers   │
│ [SEGUI] [UNFOLLOW] │
└──────────────────────┘

Articoli di Mario:
[Grid ultimi 6 articoli]
```

#### 40. Follow/Unfollow Authors
```sql
-- user_followers table
follower_id | following_id | created_at

-- Logica:
-- Seguire autore → ricevi notifiche nuovi articoli
-- Pagina "Miei seguiti" mostra articoli new
```

#### 41. Report Abuse
```javascript
// Popup report (on every article/comment)
// Categorie: "Spam", "Offensivo", "Plagio", "Altro"
// Testo descrittivo
// POST /api/reports

// Moderatore vede queue, approva/rigetta
```

#### 42. Moderation Queue
```
Admin/Moderatore dashboard: 

┌─────────────────────────────┐
│ CODA MODERAZIONE (12 items) │
├─────────────────────────────┤
│ 🚩 Commento offensivo       │
│    "Sei un..." - Mario      │
│    [APPROVA] [RIFIUTA]      │
│                             │
│ 🚩 Articolo sospetto AI     │
│    "Titolo articolo..." - Luca
│    AI:  67% [BLOCCA] [APPROVA│
└─────────────────────────────┘
```

#### 43. Community Guidelines
```html
<!-- Pagina statica: /guidelines -->
- Rispetta gli altri
- No spam/hate speech
- Verifica fonti
- Cita origini
- Proteggi privacy compagni
```

#### 44. Code of Conduct Reporter
```html
<!-- Documento legale: /code-of-conduct -->
Obblighi reporter:
- Verificare fonti
- Evitare plagio
- Rispettare privacy GDPR
- Responsabilità contenuti
- Etica giornalismo
```

#### 45. Author Spotlight
```
/spotlight/:month

Display:
┌──────────────────────┐
│ AUTORE DEL MESE      │
│ [FOTO GRANDE]        │
│ Mario Rossi          │
│ "Straordinario..."   │
│ 15 articoli          │
│ 5,230 views         │
│                      │
│ [GRID ARTICOLI]      │
└──────────────────────┘
```

#### 46. Co-Authored Articles
```javascript
// Creare articolo con multipli autori
// UI: "Aggiungi co-autore" → search studente
// Display: "Di Mario Rossi & Anna Bianchi"
// Entrambi vedono nel loro dashboard
```

#### 47. Comments Thread (Nested Replies)
```
Articolo "Titolo"

Mario Rossi
Questo è fantastico! 
└─ Anna Bianchi (reply to Mario)
   Sono d'accordo, +1! 
   └─ Mario Rossi (reply to Anna)
      Grazie! 

Luca Verdi
Secondo me... 
```

#### 48. Ignore/Block Users
```javascript
// Click profilo utente → "Blocca utente"
// Salva in blocked_users table
// NON vedi messaggi/commenti bloccato
// Blocca NON vede tue stesse attività
```

---

### 📚 CONTENT ORGANIZATION (10 feature)

#### 49. Sezioni Gerarchiche
```
Categorie: 
├─ Sport
│  ├─ Calcio
│  ├─ Basket
│  └─ Volley
├─ Cultura
│  ├─ Letteratura
│  └─ Cinema
└─ Tech
   ├─ AI
   └─ Cybersecurity

Navigation:  Dropdown + visual tree
```

#### 50. Trending Articles (24h)
```
GET /api/trending

Display: 
┌────────────────────┐
│ 🔥 IN TENDENZA     │
├────────────────────┤
│ 🥇 Titolo 1 (1k)  │
│ 🥈 Titolo 2 (856) │
│ 🥉 Titolo 3 (724) │
└────────────────────┘

Last 24 hours, top views
```

#### 51. Suggested Next Article
```javascript
// Algoritmo simple: 
// - Same category + same author = priorità
// - Same category pero different author
// - Different category pero trending

// Display: "Se ti è piaciuto, leggi:"
// [Suggested article card]
```

#### 52. Article Series
```sql
-- article_series table
id | title | description

-- article_series_items
series_id | article_id | episode_number

-- Display: 
// [SERIE] "4 Puntate sulla Storia"
// Episodio 1: "Inizi della Scuola" (27 Nov)
// Episodio 2: "Gli Anni 2000" (4 Dec) ← CURRENT
// Episodio 3: "Oggi" (prossimamente)
// Episodio 4: "Futuro" (prossimamente)
```

#### 53. Expert Columns
```javascript
// profili_redattori. is_expert = true
// Sezione speciale:  "Colonne Esperti"
// Display articoli da is_expert = true
// Badge 🎖️ "Expert" nel profilo
```

#### 54. Long-Form Articles
```sql
-- articoli. table_of_contents JSONB
{
    "headings": [
        {"id": "h1", "text": "Introduzione", "level": 1},
        {"id": "h2", "text": "Capitolo 1", "level": 2}
    ]
}

-- Display:  Indice interno clickable, auto-scroll
```

#### 55. Visual Articles (Infografiche)
```javascript
// articoli.infographics JSONB array
[
    {
        "type": "svg",
        "title": "Grafico vendite",
        "data": {... }
    }
]

// Display: Infografiche inline nel contenuto
```

#### 56.  Explainer Articles
```javascript
// Tag speciale: "spiegone"
// Sezione homepage: "Spiegati semplici"
// Articoli lunghi che spiegano temi complicati
```

#### 57. Video Embeds
```javascript
// Whitelist:  YouTube, TikTok
// Contenuto articolo:
// [VIDEO] https://youtu.be/xxxxx
// Display: iframe embedded, responsive
```

#### 58. Live Blog
```javascript
// Articolo che si aggiorna live
// Trigger CRON ogni 5 min check aggiornamenti
// Frontend auto-refresh se updated_at cambiato
// Display: "🔴 LIVE" badge
```

---

### 🔧 ADMIN TOOLS (6 feature)

#### 59. Bulk Editor
```javascript
// Checkbox seleziona multipli articoli
// Form batch edit: 
// - Categoria (change all)
// - Tags (add all)
// - Status (publish all)
// [APPLY CHANGES]
```

#### 60. Scheduled Publishing
```javascript
// articoli.scheduled_publish_at:  TIMESTAMP
// CRON job ogni minuto controlla
// Se time passed e status = 'scheduled' → UPDATE status = 'published'
// Email notifica autore
```

#### 61. Revision History
```sql
-- article_revisions table
article_id | version | content | edited_by | edited_at

-- Mostra timeline modifiche
-- Possibilità rollback versione precedente
```

#### 62. Audit Log
```sql
-- audit_log table
user_id | action | resource | timestamp

-- Entries: 
-- "Mario ha eliminato articolo 'Titolo' - 2025-12-09 15:23"
-- "Anna ha approvato commento di Lisa - 2025-12-09 14:12"
```

#### 63. Spam Detector
```javascript
// OpenAI Moderation API call al publish
// Flag se spam confidence > 0.7
// Block automatico, notifica moderatore
// Possibilità override admin
```

#### 64. Database Backup
```javascript
// Supabase automated backups (daily)
// Manual export button: 
// [EXPORT CSV] [EXPORT JSON]
// Download articles, comments, users
```

---

## 🗄️ DATABASE SCHEMA COMPLETO

### Tabelle Principali (Mantenute + Estese)

```sql
-- ============================================
-- SCHEMA DATABASE COMPLETO
-- Giornale Scolastico Cesaris v2.0
-- ============================================

-- EXISTING TABLES (con aggiunte nuove colonne)

ALTER TABLE articoli ADD COLUMN IF NOT EXISTS (
    reading_time_minutes INTEGER DEFAULT 5,
    scheduled_publish_at TIMESTAMP,
    co_authors UUID[],
    video_embeds JSONB,
    table_of_contents JSONB,
    reading_complexity TEXT DEFAULT 'normal', -- easy, normal, complex
    infographics JSONB
);

ALTER TABLE profili_redattori ADD COLUMN IF NOT EXISTS (
    bio TEXT,
    level TEXT DEFAULT 'junior', -- junior, senior, chief
    points INTEGER DEFAULT 0,
    followers_count INTEGER DEFAULT 0,
    articles_count INTEGER DEFAULT 0,
    is_expert BOOLEAN DEFAULT false,
    is_hidden BOOLEAN DEFAULT false -- per nascondere da link pubblico
);

ALTER TABLE iscrizioni_newsletter ADD COLUMN IF NOT EXISTS (
    email_verificata BOOLEAN DEFAULT false,
    ultimo_invio TIMESTAMP,
    attiva BOOLEAN DEFAULT true,
    unsubscribe_token TEXT UNIQUE
);

-- ============================================
-- NUOVE TABELLE
-- ============================================

-- CHAT & MESSAGING
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth. users(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text', -- text, poll, voice, graphic
    poll_data JSONB,
    voice_url TEXT,
    graphic_data JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_pinned BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS chat_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(message_id, user_id, emoji)
);

-- AI DETECTION
CREATE TABLE IF NOT EXISTS article_ai_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID REFERENCES articoli(id) ON DELETE CASCADE,
    ai_percentage NUMERIC(5,2),
    detected_sections JSONB,
    check_timestamp TIMESTAMP DEFAULT NOW(),
    is_approved BOOLEAN
);

-- USER PREFERENCES & HISTORY
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    theme TEXT DEFAULT 'light',
    font_size_multiplier NUMERIC(3,1) DEFAULT 1.0,
    dyslexia_font BOOLEAN DEFAULT false,
    preferred_categories TEXT[] DEFAULT ARRAY[]::text[],
    language TEXT DEFAULT 'it',
    notifications_enabled BOOLEAN DEFAULT true,
    reading_mode_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reading_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    article_id UUID REFERENCES articoli(id) ON DELETE CASCADE,
    read_at TIMESTAMP DEFAULT NOW(),
    time_spent_seconds INTEGER,
    UNIQUE(user_id, article_id, read_at)
);

CREATE TABLE IF NOT EXISTS user_followers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID REFERENCES auth. users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

-- CANDIDATURE & TERMS
CREATE TABLE IF NOT EXISTS reporter_candidatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL, -- @cesaris.edu. it only
    full_name TEXT NOT NULL,
    class TEXT NOT NULL,
    motivation TEXT NOT NULL,
    accepted BOOLEAN DEFAULT false,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reporter_terms_acceptance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    accepted_at TIMESTAMP DEFAULT NOW(),
    terms_version TEXT,
    ip_address TEXT,
    UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS reading_terms_acceptance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT UNIQUE,
    accepted_at TIMESTAMP DEFAULT NOW()
);

-- REACTIONS & ENGAGEMENT
CREATE TABLE IF NOT EXISTS article_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID REFERENCES articoli(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reaction_type TEXT NOT NULL, -- like, love, wow, sad
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(article_id, user_id, reaction_type)
);

CREATE TABLE IF NOT EXISTS user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth. users(id) ON DELETE CASCADE,
    badge_type TEXT NOT NULL,
    earned_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, badge_type)
);

CREATE TABLE IF NOT EXISTS user_points (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    total_points INTEGER DEFAULT 0,
    articles_written INTEGER DEFAULT 0,
    articles_published INTEGER DEFAULT 0,
    total_views INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blocked_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id UUID REFERENCES auth. users(id) ON DELETE CASCADE,
    blocked_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_id)
);

-- MODERATION & REPORTS
CREATE TABLE IF NOT EXISTS content_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    content_type TEXT NOT NULL, -- article, comment, message
    content_id UUID NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, reviewed, resolved
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS featured_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID REFERENCES articoli(id) ON DELETE CASCADE,
    featured_type TEXT NOT NULL, -- spotlight, trending, recommended
    featured_at TIMESTAMP DEFAULT NOW(),
    featured_until TIMESTAMP
);

-- CONTENT ORGANIZATION
CREATE TABLE IF NOT EXISTS article_series (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS article_series_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    series_id UUID REFERENCES article_series(id) ON DELETE CASCADE,
    article_id UUID REFERENCES articoli(id) ON DELETE CASCADE,
    episode_number INTEGER,
    added_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(series_id, article_id)
);

-- ADMIN & AUDIT
CREATE TABLE IF NOT EXISTS article_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID REFERENCES articoli(id) ON DELETE CASCADE,
    version INTEGER,
    content TEXT,
    edited_by UUID REFERENCES auth.users(id),
    edited_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- create, update, delete, approve, reject
    resource_type TEXT, -- article, comment, user
    resource_id UUID,
    details JSONB,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- FEEDBACK
CREATE TABLE IF NOT EXISTS article_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID REFERENCES articoli(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- INDEXES (per performance)
-- ============================================

CREATE INDEX idx_chat_messages_user ON chat_messages(user_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at DESC);
CREATE INDEX idx_article_ai_checks_article ON article_ai_checks(article_id);
CREATE INDEX idx_reading_history_user ON reading_history(user_id);
CREATE INDEX idx_user_followers_follower ON user_followers(follower_id);
CREATE INDEX idx_user_followers_following ON user_followers(following_id);
CREATE INDEX idx_user_badges_user ON user_badges(user_id);
CREATE INDEX idx_article_reactions_article ON article_reactions(article_id);
CREATE INDEX idx_blocked_users_blocker ON blocked_users(blocker_id);
CREATE INDEX idx_content_reports_status ON content_reports(status);
CREATE INDEX idx_featured_content_type ON featured_content(featured_type);
CREATE INDEX idx_article_revisions_article ON article_revisions(article_id);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp DESC);

-- ============================================
-- VIEWS & FUNCTIONS
-- ============================================

-- View:  Article Analytics (Mantenuta + estesa)
CREATE OR REPLACE VIEW article_analytics AS
SELECT 
    a.id,
    a.titolo,
    a.categoria,
    a.data_pubblicazione,
    a.visualizzazioni,
    COALESCE(c.comment_count, 0) as comments_count,
    COALESCE(b.bookmark_count, 0) as bookmarks_count,
    COALESCE(s.shares_count, 0) as shares_count,
    COALESCE(r.reactions_count, 0) as reactions_count,
    pr.nome_visualizzato as author_name,
    pr.level as author_level
FROM articoli a
LEFT JOIN (SELECT article_id, COUNT(*) as comment_count FROM article_comments WHERE is_approved = true GROUP BY article_id) c ON a.id = c. article_id
LEFT JOIN (SELECT article_id, COUNT(*) as bookmark_count FROM article_bookmarks GROUP BY article_id) b ON a.id = b.article_id
LEFT JOIN (SELECT article_id, COUNT(*) as shares_count FROM article_shares GROUP BY article_id) s ON a.id = s.article_id
LEFT JOIN (SELECT article_id, COUNT(*) as reactions_count FROM article_reactions GROUP BY article_id) r ON a.id = r.article_id
LEFT JOIN profili_redattori pr ON a.autore_id = pr.id
WHERE a.stato = 'pubblicato';

-- Function: Update user points
CREATE OR REPLACE FUNCTION update_user_points(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO user_points (user_id, articles_written, articles_published, total_views)
    SELECT 
        p_user_id,
        COUNT(*) FILTER (WHERE stato IN ('bozza', 'in_revisione', 'pubblicato')) as articles_written,
        COUNT(*) FILTER (WHERE stato = 'pubblicato') as articles_published,
        COALESCE(SUM(visualizzazioni), 0) as total_views
    FROM articoli
    WHERE autore_id = p_user_id
    ON CONFLICT (user_id) DO UPDATE SET
        articles_written = EXCLUDED.articles_written,
        articles_published = EXCLUDED.articles_published,
        total_views = EXCLUDED.total_views,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function: Check and award badges
CREATE OR REPLACE FUNCTION check_and_award_badges(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Badge:  First Article
    IF NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = p_user_id AND badge_type = 'first_article') THEN
        IF (SELECT COUNT(*) FROM articoli WHERE autore_id = p_user_id AND stato = 'pubblicato') > 0 THEN
            INSERT INTO user_badges (user_id, badge_type) VALUES (p_user_id, 'first_article');
        END IF;
    END IF;
    
    -- Badge:  Hundred Views
    IF (SELECT COALESCE(SUM(visualizzazioni), 0) FROM articoli WHERE autore_id = p_user_id) >= 100 THEN
        INSERT INTO user_badges (user_id, badge_type) VALUES (p_user_id, 'hundred_views')
        ON CONFLICT DO NOTHING;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate reading time
CREATE OR REPLACE FUNCTION calculate_reading_time(p_content TEXT)
RETURNS INTEGER AS $$
DECLARE
    word_count INTEGER;
BEGIN
    word_count := array_length(string_to_array(p_content, ' '), 1);
    RETURN COALESCE(CEIL(word_count:: NUMERIC / 200), 1)::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on sensitive tables
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_terms_acceptance ENABLE ROW LEVEL SECURITY;
ALTER TABLE reporter_terms_acceptance ENABLE ROW LEVEL SECURITY;

-- RLS Policy:  Users can only see own preferences
CREATE POLICY "Users can view own preferences" ON user_preferences
    FOR SELECT USING (auth. uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policy: Chat messages visible to authenticated users
CREATE POLICY "Authenticated users can view chat" ON chat_messages
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert chat" ON chat_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Reports visible only to admin
CREATE POLICY "Admin can view all reports" ON content_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profili_redattori 
            WHERE id = auth.uid() AND ruolo = 'Caporedattore'
        )
    );

```

---

## 🤖 AI DETECTOR (Frontend)

### Implementazione Semplice (Transformers. js)

```javascript
// File: js/ai-detector.js

import { pipeline } from "https://cdn.jsdelivr.net/npm/@xenova/transformers";

let detectionReady = false;
let detector = null;

// Initialize AI detector
async function initAIDetector() {
    try {
        // Load model once
        if (! detector) {
            detector = await pipeline('text-classification', 'Xenova/roberta-base-openai-detector');
            detectionReady = true;
            console.log('AI Detector ready');
        }
        return true;
    } catch (error) {
        console.error('AI Detector load error:', error);
        return false;
    }
}

// Check article for AI content
async function checkArticleAI(title, content) {
    if (!detectionReady) {
        await initAIDetector();
    }

    try {
        const fullText = `${title}.  ${content}`;
        const result = await detector(fullText);
        
        // result[0]. score between 0-1
        // closer to 1 = more likely AI
        const aiPercentage = Math.round(result[0].score * 100);
        
        return {
            percentage: aiPercentage,
            isApproved: aiPercentage < 50,
            status: aiPercentage < 50 ? 'approved' : 'blocked'
        };
    } catch (error) {
        console.error('AI check error:', error);
        // Fallback:  allow if error
        return {
            percentage:  0,
            isApproved:  true,
            status: 'error'
        };
    }
}

// Update gauge in real-time during editing
async function updateAIGauge(content) {
    const gauge = document.getElementById('ai-gauge');
    const gaugeText = document.getElementById('ai-gauge-text');
    const publishBtn = document.getElementById('publish-btn');
    
    if (!content || content.length < 50) {
        gauge.style.backgroundColor = '#d1d5db';
        gaugeText. textContent = 'Scrivi almeno 50 caratteri';
        publishBtn.disabled = true;
        return;
    }

    const result = await checkArticleAI(
        document.getElementById('title').value,
        content
    );

    // Update visual gauge
    let color = '#10B981'; // green
    if (result.percentage >= 30) color = '#FCD34D'; // yellow
    if (result.percentage >= 50) color = '#EF4444'; // red

    gauge.style.width = result.percentage + '%';
    gauge.style.backgroundColor = color;
    gaugeText.textContent = `${result.percentage}% AI`;

    // Enable/disable publish
    publishBtn.disabled = ! result.isApproved;
    if (!result.isApproved) {
        publishBtn.title = 'Contenuto AI > 50%, non puoi pubblicare';
    }
}

export { initAIDetector, checkArticleAI, updateAIGauge };
```

### HTML Widget

```html
<!-- Dashboard redattore -->
<div class="ai-detector-section">
    <label>AI Detection</label>
    <div class="ai-gauge-container">
        <div class="ai-gauge">
            <div id="ai-gauge" class="ai-gauge-fill"></div>
        </div>
        <div id="ai-gauge-text" class="ai-gauge-text">Analizzando... </div>
    </div>
    <p class="ai-help-text">
        ℹ️ Articoli con > 50% AI non possono essere pubblicati
    </p>
</div>

<button id="publish-btn" class="btn btn-primary btn-lg" disabled>
    Pubblica Articolo
</button>
```

### CSS

```css
.ai-gauge-container {
    display: flex;
    gap: 12px;
    align-items: center;
    margin:  16px 0;
}

. ai-gauge {
    flex: 1;
    height:  24px;
    background: #e5e7eb;
    border-radius: 12px;
    overflow: hidden;
}

.ai-gauge-fill {
    height: 100%;
    width: 0%;
    background:  #10B981;
    transition:  all 0.3s ease;
}

.ai-gauge-text {
    min-width: 80px;
    text-align:  right;
    font-weight: 600;
    font-size: 14px;
}
```

---

## 📱 RESPONSIVE LAYOUT MOBILE

### Homepage Mobile Compatta

```html
<!-- HERO COMPATTO -->
<header class="hero-mobile">
    <img src="featured. jpg" alt="In Evidenza" class="hero-img">
    <div class="hero-overlay">
        <h1 class="hero-title">Titolo Articolo</h1>
        <div class="hero-meta">Mario | 5 min | Top</div>
        <a href="/articolo. html? id=..." class="btn-read">Leggi</a>
    </div>
</header>

<!-- GRID 4 COLONNE COMPATTO -->
<section class="articles-grid">
    <!-- 4 articoli contemporaneamente -->
    <article class="article-card-mini">
        <img src="thumb. jpg" alt="Thumb">
        <h3 class="card-title">Titolo... </h3>
        <div class="card-meta">Autore | 3 min</div>
    </article>
    <!-- x3 più -->
</section>

<!-- PAGINAZIONE NUMERICA SOTTO -->
<nav class="pagination-numbers">
    <button class="page-num">1</button>
    <button class="page-num active">2</button>
    <button class="page-num">3</button>
    <button class="page-num">4</button>
    <button class="page-num">... </button>
</nav>

<!-- NEWSLETTER CTA -->
<section class="newsletter-widget">
    <h4>📰 Iscriviti alla Newsletter</h4>
    <input type="email" placeholder="tua@email.com">
    <button>Iscriviti</button>
</section>

<!-- CHAT STICKY BUBBLE -->
<div class="chat-bubble">💬</div>
```

### CSS Mobile

```css
@media (max-width: 768px) {
    .hero-mobile {
        height: 200px; /* compatto */
    }

    .articles-grid {
        grid-template-columns: repeat(2, 1fr); /* 2 colonne da 2 */
        gap: 8px;
    }

    . article-card-mini {
        aspect-ratio: 1; /* quadrato */
    }

    . pagination-numbers {
        display:  flex;
        gap: 4px;
        justify-content: center;
        margin:  16px 0;
    }

    .page-num {
        width: 32px;
        height: 32px;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        cursor: pointer;
    }

    .page-num.active {
        background:  #4338CA;
        color: white;
    }

    .chat-bubble {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: #4338CA;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        cursor: pointer;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
}
```

---

## 💻 DASHBOARD REDATTORE (Desktop Optimized)

```html
<div class="dashboard-layout">
    <!-- LEFT SIDEBAR -->
    <aside class="dashboard-sidebar">
        <nav class="nav-vertical">
            <a href="#dashboard" class="nav-item active">
                <i class="icon-chart"></i> Dashboard
            </a>
            <a href="#articles" class="nav-item">
                <i class="icon-newspaper"></i> Miei Articoli
            </a>
            <a href="#new-article" class="nav-item">
                <i class="icon-plus"></i> Nuovo Articolo
            </a>
            <a href="#stats" class="nav-item">
                <i class="icon-graph"></i> Statistiche
            </a>
            <a href="#settings" class="nav-item">
                <i class="icon-gear"></i> Impostazioni
            </a>
        </nav>
    </aside>

    <!-- CENTER:  EDITOR -->
    <main class="dashboard-main">
        <div class="editor-container">
            <h2>Nuovo Articolo</h2>

            <!-- Title -->
            <div class="form-group">
                <label>Titolo *</label>
                <input type="text" id="title" class="form-input" placeholder="Titolo articolo... ">
            </div>

            <!-- Summary -->
            <div class="form-group">
                <label>Sommario *</label>
                <textarea id="summary" class="form-input" rows="3" placeholder="Breve riassunto..."></textarea>
            </div>

            <!-- Content Editor (Rich Text) -->
            <div class="form-group">
                <label>Contenuto *</label>
                <div class="editor-toolbar">
                    <button class="btn-toolbar" data-cmd="bold" title="Bold"><b>B</b></button>
                    <button class="btn-toolbar" data-cmd="italic" title="Italic"><i>I</i></button>
                    <button class="btn-toolbar" data-cmd="createLink" title="Link">🔗</button>
                    <button class="btn-toolbar" data-cmd="insertUnorderedList" title="Bullet">•</button>
                    <!-- etc -->
                </div>
                <div id="editor" class="editor-content" contenteditable="true"></div>
            </div>

            <!-- Category & Tags -->
            <div class="form-row">
                <div class="form-group">
                    <label>Categoria *</label>
                    <select id="category" class="form-input">
                        <option>Sport</option>
                        <option>Cultura</option>
                        <option>Tech</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Tags</label>
                    <input type="text" id="tags" class="form-input" placeholder="Tag1, Tag2, Tag3">
                </div>
            </div>

            <!-- Image Upload -->
            <div class="form-group">
                <label>Immagine Copertina</label>
                <div class="upload-zone" id="upload-zone">
                    <p>Trascina immagine qui</p>
                    <input type="file" id="image-upload" accept="image/*">
                </div>
            </div>

            <!-- Scheduled Publish -->
            <div class="form-group">
                <label>Pubblica il</label>
                <input type="datetime-local" id="scheduled-publish" class="form-input">
            </div>

            <!-- BUTTONS -->
            <div class="button-group">
                <button id="save-draft-btn
