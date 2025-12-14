# Testing Checklist - Maintenance Mode Synchronization

## Pre-requisites

1. **SQL Setup Complete**: Ensure `supabase-site-settings.sql` has been executed
2. **Database Verification**: Check that `site_settings` table exists with default values
3. **Admin Account**: Have access to an admin account (caporedattore or docente role)
4. **Regular Account**: Have access to a non-admin user account
5. **Multiple Browsers**: Use Chrome + Firefox or Chrome + Incognito for multi-device testing

## Test Suite

### Test 1: Initial Database State ✓

**Goal**: Verify the site_settings table is set up correctly

1. Open Supabase Dashboard → Database → Tables
2. Verify `site_settings` table exists
3. Check that table contains these rows:
   - `maintenance_mode` with `enabled: false`
   - `registrations_enabled` with `enabled: true`
   - `chat_enabled` with `enabled: true`
   - `comments_enabled` with `enabled: true`
   - `auto_suspension` with `enabled: false`

**Expected Result**: All 5 settings present with correct default values

---

### Test 2: Admin Panel Settings Load ✓

**Goal**: Verify settings are loaded from Supabase on page load

1. Login as admin
2. Navigate to `admin.html`
3. Go to **Impostazioni** tab
4. Check **Configurazione Generale** section

**Expected Result**: 
- All toggles reflect current database state
- Maintenance Mode toggle is OFF by default
- Other toggles match database values

---

### Test 3: Enable Maintenance Mode (Single Device) ✓

**Goal**: Verify maintenance mode can be activated

1. As admin in `admin.html`
2. Toggle **Manutenzione** switch to ON
3. Check browser console for success message
4. Verify toast notification appears: "✅ Modalità manutenzione: Attiva"
5. Check Supabase database that `maintenance_mode.enabled = true`

**Expected Result**: 
- Setting saved successfully
- Database updated
- Admin can still navigate all pages

---

### Test 4: Multi-Device Redirect (Critical Test) ✓

**Goal**: Verify non-admin users are redirected from other devices

**Setup**:
- Browser A: Admin with maintenance mode ON
- Browser B: Regular user already logged in on homepage

**Steps**:
1. In Browser A (admin): Ensure maintenance mode is ON
2. In Browser B (regular user): Stay on homepage (index.html)
3. Wait up to 10 seconds
4. Observe Browser B

**Expected Result**:
- Within 10 seconds, Browser B redirects to `manutenzione.html`
- User session is cleared (check localStorage)
- If user was logged in, they are now signed out

---

### Test 5: Admin Bypass During Maintenance ✓

**Goal**: Verify admin users can access all pages during maintenance

**Setup**: Maintenance mode is ON

1. Open new incognito/private window
2. Login as admin (caporedattore or docente)
3. Navigate to various pages:
   - `index.html`
   - `articoli.html`
   - `dashboard.html`
   - `admin.html`

**Expected Result**: 
- Admin can access all pages normally
- No redirect to maintenance page
- Console shows: "Admin detected, skipping maintenance redirect"

---

### Test 6: Disable Maintenance Mode ✓

**Goal**: Verify maintenance mode can be deactivated

**Setup**: 
- Maintenance mode ON
- Browser B on `manutenzione.html`

**Steps**:
1. In Browser A (admin): Toggle Manutenzione to OFF
2. In Browser B (on manutenzione.html): Wait up to 5 seconds

**Expected Result**:
- Browser B redirects from manutenzione.html to index.html
- Database shows `maintenance_mode.enabled = false`
- Regular users can now access the site

---

### Test 7: Polling Verification ✓

**Goal**: Verify periodic checks are working

1. Open `index.html` in browser
2. Open DevTools → Console
3. Watch for 20 seconds

**Expected Result**: 
- No console errors related to maintenance check
- In Network tab, see periodic queries to `site_settings` table (~every 10 seconds)

---

### Test 8: Fallback to localStorage ✓

**Goal**: Verify fallback behavior when Supabase is unreachable

**Setup**: Simulate Supabase error (disable network in DevTools or disconnect internet briefly)

1. Open `index.html`
2. Disable network in DevTools
3. Wait for 10 seconds
4. Check console

**Expected Result**:
- Console shows "Error checking maintenance mode"
- System falls back to localStorage value
- No JavaScript errors or crashes
- Site remains accessible (since localStorage has maintenanceMode: false by default)

---

### Test 9: Multiple Settings Toggle ✓

**Goal**: Verify all settings can be toggled and saved

1. Login as admin → `admin.html` → Impostazioni
2. Toggle each setting one by one:
   - Manutenzione
   - Registrazioni
   - Chat Pubblica
   - Commenti Articoli
   - Auto-Sospensione
3. Check database after each toggle

**Expected Result**:
- Each setting updates in database
- Toast notification for each change
- Settings persist on page reload

---

### Test 10: Non-Admin Session Cleanup ✓

**Goal**: Verify user sessions are properly destroyed during maintenance

**Setup**: Regular user logged in

1. Enable maintenance mode (admin panel)
2. On regular user browser, wait for redirect to manutenzione.html
3. Check localStorage in DevTools

**Expected Result**:
- `userId` removed
- `userEmail` removed
- `userRole` removed
- `username` removed
- `userSession` removed
- `isAuthenticated` removed
- `userProfile` removed
- User is signed out of Supabase

---

## Performance Tests

### Test 11: Database Query Performance ✓

**Goal**: Ensure queries are efficient

1. Open Network tab in DevTools
2. Navigate to `index.html`
3. Find Supabase query to `site_settings`
4. Check response time

**Expected Result**:
- Query completes in < 200ms
- Response size is minimal (< 1KB)
- No repeated queries within the 10-second interval

---

### Test 12: Load Test Simulation ✓

**Goal**: Verify polling doesn't cause issues with multiple tabs

1. Open 5 tabs with `index.html`
2. Leave them open for 60 seconds
3. Monitor DevTools Network tab

**Expected Result**:
- Each tab polls independently every 10 seconds
- No race conditions or conflicts
- No excessive API calls

---

## Edge Cases

### Test 13: Page Refresh During Maintenance ✓

**Goal**: Verify maintenance check on page reload

**Setup**: Maintenance mode ON, user on homepage

1. Reload the page
2. Observe behavior

**Expected Result**:
- Maintenance check runs on DOMContentLoaded
- User redirected to manutenzione.html
- No flash of content before redirect

---

### Test 14: Login During Maintenance ✓

**Goal**: Verify login behavior during maintenance

**Setup**: Maintenance mode ON

1. Navigate to `login.html` (should be accessible)
2. Login as regular user
3. Observe post-login behavior

**Expected Result**:
- Login page is accessible (excluded from maintenance check)
- After successful login, user is immediately redirected to manutenzione.html
- Session is destroyed

---

### Test 15: Direct URL Access During Maintenance ✓

**Goal**: Verify maintenance check on direct page navigation

**Setup**: Maintenance mode ON

1. Open browser
2. Directly navigate to `articoli.html` (not admin)

**Expected Result**:
- Maintenance check runs immediately
- User redirected to manutenzione.html within 10 seconds
- Direct access is blocked for non-admins

---

## Security Tests

### Test 16: RLS Policy - Read Access ✓

**Goal**: Verify anyone can read site_settings

1. In Supabase SQL Editor, run:
   ```sql
   SELECT * FROM site_settings WHERE setting_key = 'maintenance_mode';
   ```
2. Run without authentication

**Expected Result**: Query succeeds, returns maintenance mode setting

---

### Test 17: RLS Policy - Write Access (Non-Admin) ✓

**Goal**: Verify non-admins cannot update settings

1. Login as regular user (utente or reporter role)
2. In DevTools Console, attempt to update:
   ```javascript
   await supabase
     .from('site_settings')
     .update({ setting_value: { enabled: true } })
     .eq('setting_key', 'maintenance_mode')
   ```

**Expected Result**: Update fails with RLS error (403 Forbidden)

---

### Test 18: RLS Policy - Write Access (Admin) ✓

**Goal**: Verify admins can update settings

1. Login as admin (caporedattore or docente)
2. Use admin panel to toggle maintenance mode
3. Check database for update

**Expected Result**: Update succeeds, database reflects change

---

## Documentation Tests

### Test 19: Setup Instructions ✓

**Goal**: Verify setup documentation is accurate

1. Follow steps in `MAINTENANCE_MODE_SETUP.md`
2. Execute SQL script
3. Test functionality

**Expected Result**: All steps work as documented

---

### Test 20: Troubleshooting Guide ✓

**Goal**: Verify troubleshooting section is helpful

1. Review each problem in troubleshooting section
2. Simulate the problem
3. Apply the solution

**Expected Result**: Solutions resolve the issues

---

## Regression Tests

### Test 21: Existing Features Still Work ✓

**Goal**: Ensure changes didn't break existing functionality

1. Test user registration
2. Test article creation
3. Test chat functionality
4. Test comments
5. Test user profiles

**Expected Result**: All features work normally

---

## Test Results Summary

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1 | Initial Database State | ⬜ Pending | |
| 2 | Admin Panel Settings Load | ⬜ Pending | |
| 3 | Enable Maintenance Mode | ⬜ Pending | |
| 4 | Multi-Device Redirect | ⬜ Pending | **Critical** |
| 5 | Admin Bypass | ⬜ Pending | **Critical** |
| 6 | Disable Maintenance Mode | ⬜ Pending | **Critical** |
| 7 | Polling Verification | ⬜ Pending | |
| 8 | Fallback to localStorage | ⬜ Pending | |
| 9 | Multiple Settings Toggle | ⬜ Pending | |
| 10 | Session Cleanup | ⬜ Pending | |
| 11 | Query Performance | ⬜ Pending | |
| 12 | Load Test | ⬜ Pending | |
| 13 | Page Refresh | ⬜ Pending | |
| 14 | Login During Maintenance | ⬜ Pending | |
| 15 | Direct URL Access | ⬜ Pending | |
| 16 | RLS Read Access | ⬜ Pending | |
| 17 | RLS Write (Non-Admin) | ⬜ Pending | |
| 18 | RLS Write (Admin) | ⬜ Pending | |
| 19 | Setup Instructions | ⬜ Pending | |
| 20 | Troubleshooting | ⬜ Pending | |
| 21 | Regression Tests | ⬜ Pending | |

**Legend**: ⬜ Pending | ✅ Pass | ❌ Fail | ⚠️ Warning

---

## Notes for Testers

- Tests 4, 5, and 6 are **critical** - these verify the core functionality
- Take screenshots during testing for documentation
- Record any unexpected behavior
- Check browser console for errors during all tests
- Test on both desktop and mobile browsers if possible

## Reporting Issues

If you encounter any issues:

1. Note the test number and name
2. Describe the expected vs actual behavior
3. Include browser console logs
4. Take screenshots if UI-related
5. Note your user role and browser version
6. Report to mohamed.mashaal@cesaris.edu.it
