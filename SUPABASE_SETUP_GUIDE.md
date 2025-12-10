# Guida Completa Setup Supabase
## Giornale Scolastico Cesaris 2.0

Questa guida ti aiuterà a configurare correttamente Supabase per risolvere gli errori di registrazione e garantire il corretto funzionamento dell'applicazione.

---

## 🔧 Parte 1: Configurazione Iniziale Supabase

### 1.1 Creare un Progetto Supabase

1. Vai su [https://supabase.com](https://supabase.com)
2. Accedi o crea un account
3. Clicca su "New Project"
4. Compila i campi:
   - **Nome progetto**: `giornale-scolastico-cesaris`
   - **Database Password**: Scegli una password sicura (salvala!)
   - **Regione**: Scegli quella più vicina (es. Europe West)
5. Clicca "Create new project" e attendi il completamento (2-3 minuti)

### 1.2 Ottenere le Credenziali

1. Nella dashboard del progetto, vai su **Settings** > **API**
2. Copia questi valori:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon/public key**: Una lunga stringa che inizia con `eyJ...`

3. Apri il file `js/config.js` nel progetto e sostituisci:
```javascript
const SUPABASE_CONFIG = {
    url: 'https://xxxxxxxxxxxxx.supabase.co', // Il tuo Project URL
    anonKey: 'eyJhbGci...' // La tua anon key
};
```

---

## 📊 Parte 2: Setup Database

### 2.1 Eseguire lo Script SQL

1. Nella dashboard Supabase, vai su **SQL Editor**
2. Clicca su **New Query**
3. Apri il file `supabase-setup.sql` dalla root del progetto
4. Copia **tutto il contenuto** del file
5. Incolla nell'editor SQL di Supabase
6. Clicca **Run** (in basso a destra)
7. Attendi il completamento (dovresti vedere "Success" in verde)

### 2.2 Verificare le Tabelle Create

1. Vai su **Table Editor** nella sidebar
2. Dovresti vedere tutte queste tabelle:
   - ✅ `profili_redattori`
   - ✅ `articoli`
   - ✅ `article_comments`
   - ✅ `article_bookmarks`
   - ✅ `chat_messages`
   - ✅ `iscrizioni_newsletter`
   - ✅ E altre...

Se manca qualche tabella, riesegui lo script SQL.

---

## 📧 Parte 3: Configurazione Email (CRITICO per la registrazione)

### 3.1 Configurare il Provider Email

**Opzione A: Usa l'Email Integrata di Supabase (per testing)**
1. Vai su **Authentication** > **Email Templates**
2. Le email di default funzionano per il testing, ma hanno limiti
3. ⚠️ NON usare in produzione - configurare un provider custom

**Opzione B: Configurare SMTP Custom (RACCOMANDATO)**

1. Vai su **Settings** > **Auth** > **SMTP Settings**
2. Clicca su **Enable Custom SMTP**
3. Configura con uno di questi provider:

#### Gmail (per testing):
```
Host: smtp.gmail.com
Port: 587
Username: tua-email@gmail.com
Password: [App Password - vedi sotto]
Sender email: tua-email@gmail.com
Sender name: Giornale Scolastico Cesaris
```

**Come ottenere Gmail App Password:**
1. Vai su [https://myaccount.google.com/security](https://myaccount.google.com/security)
2. Abilita "2-Step Verification"
3. Vai su "App passwords"
4. Genera una nuova password per "Mail"
5. Usa quella password nel campo Password SMTP

#### SendGrid (per produzione):
```
Host: smtp.sendgrid.net
Port: 587
Username: apikey
Password: [La tua SendGrid API Key]
Sender email: noreply@tuodominio.com
Sender name: Giornale Scolastico Cesaris
```

### 3.2 Configurare i Template Email

1. Vai su **Authentication** > **Email Templates**
2. Personalizza questi template:

#### Confirm Signup (Email di Conferma)
```html
<h2>Benvenuto al Giornale Scolastico Cesaris!</h2>
<p>Ciao {{ .Email }},</p>
<p>Grazie per esserti registrato. Clicca sul pulsante qui sotto per confermare il tuo account:</p>
<p><a href="{{ .ConfirmationURL }}" style="background-color: #4338CA; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Conferma Email</a></p>
<p>Se non hai richiesto questa registrazione, puoi ignorare questa email.</p>
<p>Il link scadrà tra 24 ore.</p>
```

#### Magic Link
```html
<h2>Accedi al Giornale Scolastico Cesaris</h2>
<p>Ciao,</p>
<p>Clicca sul link qui sotto per accedere:</p>
<p><a href="{{ .ConfirmationURL }}" style="background-color: #4338CA; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Accedi</a></p>
```

#### Reset Password
```html
<h2>Reimposta la tua Password</h2>
<p>Ciao {{ .Email }},</p>
<p>Hai richiesto di reimpostare la password. Clicca sul pulsante qui sotto:</p>
<p><a href="{{ .ConfirmationURL }}" style="background-color: #4338CA; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Reimposta Password</a></p>
<p>Se non hai richiesto questa operazione, ignora questa email.</p>
```

### 3.3 Configurare URL di Redirect

1. Vai su **Authentication** > **URL Configuration**
2. In **Site URL**, inserisci:
   - Per sviluppo locale: `http://localhost:5500` (o la tua porta)
   - Per produzione: `https://tuodominio.com`

3. In **Redirect URLs**, aggiungi:
   - `http://localhost:5500/pages/confirm-email.html`
   - `http://localhost:5500/pages/reset-password.html`
   - `https://tuodominio.com/pages/confirm-email.html` (per produzione)
   - `https://tuodominio.com/pages/reset-password.html` (per produzione)

---

## 🔒 Parte 4: Configurazione Autenticazione

### 4.1 Impostazioni Auth Generali

1. Vai su **Authentication** > **Settings**
2. Configura:
   - ✅ **Enable Email Confirmations**: ON (obbligatorio!)
   - ✅ **Enable Email Signups**: ON
   - ⚠️ **Disable Email Signups**: OFF
   - ✅ **Minimum Password Length**: 8

### 4.2 Provider Email

1. Vai su **Authentication** > **Providers**
2. Assicurati che **Email** sia abilitato
3. Configura:
   - ✅ **Confirm email**: ON
   - ✅ **Secure email change**: ON

### 4.3 Validazione Email Domain (Opzionale ma Consigliato)

Per limitare le registrazioni solo a @cesaris.edu.it:

1. Vai su **SQL Editor**
2. Esegui questa query:

```sql
-- Crea funzione di validazione email
CREATE OR REPLACE FUNCTION validate_email_domain()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.email NOT LIKE '%@cesaris.edu.it' THEN
        RAISE EXCEPTION 'Email must be from @cesaris.edu.it domain';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crea trigger
DROP TRIGGER IF EXISTS check_email_domain ON auth.users;
CREATE TRIGGER check_email_domain
    BEFORE INSERT OR UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION validate_email_domain();
```

---

## 🗄️ Parte 5: Storage Setup (per immagini e file)

### 5.1 Creare i Bucket

1. Vai su **Storage**
2. Clicca **New bucket**
3. Crea questi bucket:

#### Bucket: article-images
- Nome: `article-images`
- Public: ✅ ON
- File size limit: 5 MB
- Allowed MIME types: `image/jpeg, image/png, image/gif, image/webp`

#### Bucket: chat-voices
- Nome: `chat-voices`
- Public: ✅ ON
- File size limit: 10 MB
- Allowed MIME types: `audio/mp3, audio/mpeg, audio/wav`

#### Bucket: user-avatars
- Nome: `user-avatars`
- Public: ✅ ON
- File size limit: 2 MB
- Allowed MIME types: `image/jpeg, image/png`

### 5.2 Configurare RLS Policy per Storage

Per ogni bucket, vai su **Policies** e aggiungi:

```sql
-- Policy per article-images
CREATE POLICY "Chiunque può vedere le immagini"
ON storage.objects FOR SELECT
USING (bucket_id = 'article-images');

CREATE POLICY "Utenti autenticati possono caricare"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'article-images' 
    AND auth.role() = 'authenticated'
);

-- Ripeti per gli altri bucket sostituendo 'article-images' con il nome del bucket
```

---

## 🧪 Parte 6: Testing della Configurazione

### 6.1 Test Email

1. Vai su **Authentication** > **Users**
2. Clicca **Invite User**
3. Inserisci un'email di test (usa la tua email personale)
4. Clicca **Send Invite**
5. Controlla la tua casella email
6. ✅ Dovresti ricevere l'email di conferma

Se NON ricevi l'email:
- Controlla la cartella Spam
- Verifica la configurazione SMTP
- Controlla i log in **Authentication** > **Logs**

### 6.2 Test Registrazione

1. Apri il progetto in locale
2. Vai su `pages/register.html`
3. Compila il form con:
   - Nome: Test User
   - Email: test@cesaris.edu.it (o la tua email se hai configurato il dominio)
   - Password: TestPassword123
4. Clicca **Registrati**
5. ✅ Dovresti vedere "Controlla la tua email"
6. ✅ Ricevi l'email di conferma
7. Clicca sul link nell'email
8. ✅ Vieni reindirizzato a `/pages/confirm-email.html`

### 6.3 Verificare l'Utente nel Database

1. Vai su **Authentication** > **Users**
2. Dovresti vedere il nuovo utente con:
   - Email confermata: ✅ (dopo aver cliccato il link)
   - Last Sign In: (dopo il login)

3. Vai su **Table Editor** > **profili_redattori**
4. Dovresti vedere una riga con:
   - ID che corrisponde all'utente
   - Email
   - Nome visualizzato

Se la tabella `profili_redattori` è vuota:
- ⚠️ Il trigger `on_auth_user_created` non funziona
- Riesegui lo script SQL `supabase-setup.sql`
- Oppure crea manualmente il profilo per testare

---

## 🚨 Risoluzione Problemi Comuni

### Errore: "Database error saving new user"

**Causa**: Il trigger per creare il profilo non è configurato o fallisce

**Soluzione**:
1. Vai su **SQL Editor**
2. Esegui:
```sql
-- Verifica che il trigger esista
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Se non esiste, ricrealo
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profili_redattori (id, email, nome_visualizzato)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();
```

### Errore: Email non arriva

**Soluzioni**:
1. Controlla **Authentication** > **Logs** per errori
2. Verifica configurazione SMTP in **Settings** > **Auth**
3. Testa con il tasto "Send Test Email"
4. Controlla che il sender email sia verificato (per Gmail/SendGrid)
5. Controlla spam folder

### Errore: 500 Internal Server Error

**Causa**: Credenziali Supabase non configurate o errate

**Soluzione**:
1. Verifica `js/config.js` abbia le credenziali corrette
2. Verifica che la console browser non mostri errori CORS
3. Controlla che il progetto Supabase sia attivo (non paused)

### Errore: "Invalid API key"

**Causa**: La chiave API è scaduta o errata

**Soluzione**:
1. Vai su **Settings** > **API**
2. Copia nuovamente la **anon/public key**
3. Aggiorna `js/config.js`
4. Ricarica la pagina (Ctrl+Shift+R per pulire cache)

---

## ✅ Checklist Finale

Prima di considerare la configurazione completa, verifica:

- [ ] Progetto Supabase creato
- [ ] Credenziali copiate in `js/config.js`
- [ ] Script SQL `supabase-setup.sql` eseguito con successo
- [ ] Tutte le tabelle visibili in Table Editor
- [ ] SMTP configurato (Gmail o SendGrid)
- [ ] Email template personalizzati
- [ ] URL di redirect configurati
- [ ] Email confirmation abilitata
- [ ] Bucket storage creati
- [ ] Test registrazione completato con successo
- [ ] Email di conferma ricevuta
- [ ] Utente visibile in Authentication > Users
- [ ] Profilo creato in `profili_redattori`

---

## 📚 Risorse Aggiuntive

- [Documentazione Supabase Auth](https://supabase.com/docs/guides/auth)
- [Guida SMTP Setup](https://supabase.com/docs/guides/auth/auth-smtp)
- [RLS Policy Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Setup](https://supabase.com/docs/guides/storage)

---

## 💬 Supporto

Se riscontri ancora problemi dopo aver seguito questa guida:
1. Controlla i log in **Authentication** > **Logs**
2. Controlla la console del browser (F12) per errori JavaScript
3. Verifica che tutte le query SQL siano state eseguite senza errori
4. Consulta la documentazione ufficiale di Supabase

---

**Ultimo aggiornamento**: Dicembre 2025
