# Setup Modalità Manutenzione

La modalità manutenzione utilizza Supabase per sincronizzare lo stato tra tutti i dispositivi in tempo reale.

## Problema Risolto

In precedenza, lo stato della modalità manutenzione era salvato in `localStorage`, che è locale al browser. Questo significava che:
- Quando un admin attivava la manutenzione, solo il suo browser riceveva l'aggiornamento
- Altri utenti su dispositivi diversi continuavano a vedere il sito normalmente
- Era necessario un refresh manuale o attendere un periodo indefinito

## Nuova Soluzione

Ora lo stato è salvato su Supabase in una tabella `site_settings` condivisa:
- L'admin attiva la manutenzione → salvato su Supabase
- Tutti i client controllano Supabase ogni 5-10 secondi
- Se la manutenzione è attiva → reindirizzamento immediato (entro 5-10 secondi)
- Gli admin possono continuare ad accedere al sito normalmente

## Setup

### 1. Eseguire lo Script SQL

Apri il [Supabase SQL Editor](https://supabase.com/dashboard/project/tepxvijiamuaszvyzeze/sql) ed esegui lo script SQL da `supabase-site-settings.sql`:

```sql
-- Questo creerà la tabella site_settings con le policy RLS appropriate
-- Vedi il file supabase-site-settings.sql per lo script completo
```

### 2. Verifica la Tabella

Dopo aver eseguito lo script, verifica che la tabella sia stata creata:

1. Vai a **Database** > **Tables** nel dashboard Supabase
2. Dovresti vedere la tabella `site_settings`
3. La tabella dovrebbe contenere 4 righe con le impostazioni predefinite:
   - `maintenance_mode` (enabled: false)
   - `registrations_enabled` (enabled: true)
   - `ai_detection` (enabled: false)
   - `auto_suspension` (enabled: false)

### 3. Policy di Sicurezza (RLS)

Le Row Level Security policies sono già configurate nello script:

- **Lettura**: Tutti possono leggere le impostazioni (necessario per il controllo manutenzione)
- **Scrittura**: Solo admin (ruolo `caporedattore` o `docente`) possono modificare le impostazioni

### 4. Testing

#### Test 1: Attivazione Modalità Manutenzione

1. Accedi come admin (caporedattore o docente)
2. Vai su `admin.html`
3. Nella sezione **Impostazioni** > **Configurazione Generale**
4. Attiva il toggle "Manutenzione"
5. Apri il sito da un altro browser/dispositivo (NON come admin)
6. Entro 10 secondi dovresti essere reindirizzato a `manutenzione.html`

#### Test 2: Disattivazione Modalità Manutenzione

1. Come admin, disattiva il toggle "Manutenzione" in `admin.html`
2. Apri `manutenzione.html` da un altro browser
3. Entro 5 secondi dovresti essere reindirizzato a `index.html`

#### Test 3: Accesso Admin Durante Manutenzione

1. Attiva la modalità manutenzione come admin
2. Logout e fai login di nuovo come admin
3. Dovresti poter accedere a tutte le pagine normalmente
4. Gli utenti non-admin vengono reindirizzati a `manutenzione.html`

## Come Funziona

### Controllo Periodico (Polling)

Il sistema utilizza polling per controllare lo stato:

- **main.js**: Controlla ogni 10 secondi (`setInterval(checkMaintenanceMode, 10000)`)
- **manutenzione.html**: Controlla ogni 5 secondi (`setInterval(checkMaintenanceStatus, 5000)`)

### Flusso di Controllo

```
User naviga → checkMaintenanceMode() → 
  ↓
Supabase query: SELECT * FROM site_settings WHERE setting_key = 'maintenance_mode'
  ↓
Se enabled = true:
  ↓
  ├── User è admin? → Accesso consentito
  └── User NON admin? → Redirect a manutenzione.html + Sign out
```

### Vantaggi del Polling a 10 Secondi

- **Bilanciamento**: Reattività sufficiente senza sovraccaricare il database
- **Costo**: Minimal API requests (1 query ogni 10 secondi per utente attivo)
- **UX**: Gli utenti vengono reindirizzati entro 10 secondi dall'attivazione

## File Modificati

1. **supabase-site-settings.sql**: Schema SQL per la tabella
2. **js/main.js**: Funzione `checkMaintenanceMode()` aggiornata
3. **admin.html**: Funzioni `loadSettings()` e `toggleSiteSetting()` aggiornate
4. **manutenzione.html**: Funzione `checkMaintenanceStatus()` aggiornata

## Troubleshooting

### Problema: La manutenzione non si attiva immediatamente

**Causa**: Il polling avviene ogni 10 secondi
**Soluzione**: Aspetta fino a 10 secondi. Per test più rapidi, modifica l'intervallo in `main.js`

### Problema: Errore "site_settings does not exist"

**Causa**: Script SQL non eseguito
**Soluzione**: Esegui lo script `supabase-site-settings.sql` nel Supabase SQL Editor

### Problema: Admin viene reindirizzato a manutenzione

**Causa**: Policy RLS non corretta o ruolo non riconosciuto
**Soluzione**: 
1. Verifica che l'utente abbia ruolo `caporedattore` o `docente` nella tabella `profili_utenti`
2. Controlla le policy RLS nel dashboard Supabase

### Problema: Impostazioni non si salvano

**Causa**: Policy UPDATE mancante o errata
**Soluzione**: Verifica che la policy "Admins can update settings" sia attiva

## Note Tecniche

### Compatibilità con localStorage

Il sistema mantiene anche il salvataggio su `localStorage` per:
- **Backward compatibility**: Vecchi browser o in caso di errore Supabase
- **Offline support**: Funziona anche se Supabase è temporaneamente irraggiungibile

### Sicurezza

- **RLS attivo**: Solo admin possono modificare le impostazioni
- **Lettura pubblica**: Necessaria per permettere il controllo manutenzione
- **Sign out automatico**: Gli utenti non-admin vengono scollegati durante la manutenzione

### Performance

- **Query lightweight**: Solo 1 campo (`setting_value`) da 1 riga
- **Cache locale**: localStorage usato come fallback
- **Polling ottimizzato**: Intervalli bilanciati per non sovraccaricare il DB

## Sviluppi Futuri

Possibili miglioramenti:

1. **Real-time subscriptions**: Usare Supabase Realtime invece di polling
2. **Messaggi personalizzati**: Permettere all'admin di impostare il messaggio di manutenzione
3. **Scheduled maintenance**: Programmazione automatica della manutenzione
4. **Notifiche push**: Avvisare gli utenti prima dell'attivazione
5. **Maintenance log**: Storico delle attivazioni/disattivazioni

## Supporto

Per problemi o domande:
- Email: mohamed.mashaal@cesaris.edu.it
- GitHub Issues: [Repository Issues](https://github.com/bitFly12/ilGiornaleScolastico2.0/issues)
