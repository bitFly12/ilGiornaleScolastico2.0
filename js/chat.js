// ================================================
// Chat System with @ Mentions and Supabase Integration
// ================================================

let allUsers = [];
let currentUser = null;
let selectedMentionIndex = 0;

// ================================================
// Initialize Chat
// ================================================
async function initChat() {
    try {
        // Wait a moment for Supabase session to be ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Get current user from Supabase auth (use window.supabaseClient for consistency)
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        
        if (!user) {
            // No authenticated user, redirect to login
            window.location.href = 'login.html?redirect=chat.html';
            return;
        }
        
        // Store as currentUser
        currentUser = user;

        // Load all users for mentions
        await loadAllUsers();

        // Load chat messages
        await loadChatMessages();

        // Update online count
        await updateOnlineCount();

        // Setup input handlers
        setupChatInput();

        // Setup send button
        document.getElementById('sendBtn').addEventListener('click', sendMessage);
    } catch (error) {
        console.error('Error initializing chat:', error);
        // On error, redirect to login
        window.location.href = 'login.html?redirect=chat.html';
    }
}

// ================================================
// Load All Users for Mentions
// ================================================
async function loadAllUsers() {
    try {
        const { data, error } = await supabase
            .from('profili_utenti')
            .select('id, username, nome_visualizzato')
            .order('username');

        if (error) throw error;

        allUsers = data || [];
    } catch (error) {
        console.error('Error loading users:', error);
        allUsers = [];
    }
}

// ================================================
// Show Loading State
// ================================================
function showChatLoading() {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    
    // Create loading element
    const loadingEl = document.createElement('div');
    loadingEl.id = 'chatLoadingState';
    loadingEl.style.cssText = 'display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem; text-align: center;';
    loadingEl.innerHTML = `
        <div style="width: 50px; height: 50px; border: 4px solid #e5e7eb; border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 1rem;"></div>
        <p style="color: var(--neutral); font-size: 1rem; margin: 0;">Caricamento messaggi in corso...</p>
        <style>
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        </style>
    `;
    
    // Keep pinned message
    const pinnedMsg = container.querySelector('.pinned-messages');
    container.innerHTML = '';
    if (pinnedMsg) {
        container.appendChild(pinnedMsg);
    }
    container.appendChild(loadingEl);
}

// ================================================
// Hide Loading State
// ================================================
function hideChatLoading() {
    const loadingEl = document.getElementById('chatLoadingState');
    if (loadingEl) {
        loadingEl.remove();
    }
}

// ================================================
// Load Chat Messages from Supabase
// ================================================
async function loadChatMessages() {
    const container = document.getElementById('chatMessages');
    if (!container) return;

    // Show loading state
    showChatLoading();

    try {
        const { data: messages, error } = await supabase
            .from('chat_messages')
            .select(`
                *,
                user:profili_utenti!fk_chat_messages_user(username, nome_visualizzato)
            `)
            .eq('is_deleted', false)
            .order('created_at', { ascending: true })
            .limit(100);

        if (error) throw error;

        // Hide loading state
        hideChatLoading();

        // Keep pinned message
        const pinnedMsg = container.querySelector('.pinned-messages');
        container.innerHTML = '';
        if (pinnedMsg) {
            container.appendChild(pinnedMsg);
        }

        // Add messages
        if (messages && messages.length > 0) {
            messages.forEach(msg => {
                const messageEl = createMessageElement(msg);
                container.appendChild(messageEl);
            });
        } else {
            // Show welcome message
            const welcomeDiv = document.createElement('div');
            welcomeDiv.style.cssText = 'text-align: center; padding: 2rem; color: var(--neutral);';
            welcomeDiv.innerHTML = '<p>💬 Nessun messaggio ancora. Inizia la conversazione!</p>';
            container.appendChild(welcomeDiv);
        }

        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

// ================================================
// Create Message Element with Mention Highlighting
// ================================================
function createMessageElement(msg) {
    const div = document.createElement('div');
    div.className = 'message fade-in';
    div.dataset.messageId = msg.id;

    const username = msg.user?.username || 'anonimo';
    const displayName = msg.user?.nome_visualizzato || username;
    const initial = displayName.charAt(0).toUpperCase();
    const timeAgo = formatTimeAgo(new Date(msg.created_at));

    // Parse and highlight mentions
    // Note: Multiple fallbacks for backwards compatibility with old data
    // - msg.content: Current schema (correct)
    // - msg.message: Legacy field name (deprecated)
    // - msg.messaggio: Old Italian field name (deprecated)
    // TODO: Remove legacy fallbacks after data migration
    const messageText = highlightMentions(msg.content || msg.message || msg.messaggio || '');

    let reactionsHTML = '';
    if (msg.reactions && Object.keys(msg.reactions).length > 0) {
        reactionsHTML = '<div class="message-reactions">';
        for (const [emoji, count] of Object.entries(msg.reactions)) {
            reactionsHTML += `<button class="reaction-btn" onclick="toggleReaction('${msg.id}', '${emoji}')">${emoji} ${count}</button>`;
        }
        reactionsHTML += '</div>';
    }

    div.innerHTML = `
        <div class="message-avatar">${initial}</div>
        <div class="message-content">
            <div class="message-header">
                <span class="message-author">${escapeHTML(displayName)} <span style="color: var(--neutral); font-weight: normal;">@${username}</span></span>
                <span class="message-time">${timeAgo}</span>
            </div>
            <div class="message-text">${messageText}</div>
            ${reactionsHTML}
        </div>
    `;

    return div;
}

// ================================================
// Highlight @ Mentions in Message
// ================================================
function highlightMentions(text) {
    // Find all @username mentions in message text
    // Regex pattern explanation:
    // @ - literal @ character
    // (\w+(?:\.\w+)*) - captures username:
    //   \w+ - one or more word characters (letters, digits, underscore)
    //   (?:\.\w+)* - zero or more groups of: dot followed by word characters
    // Examples matched: @mario.rossi, @john_doe, @user123, @test.user.name
    const mentionRegex = /@(\w+(?:\.\w+)*)/g;
    return escapeHTML(text).replace(mentionRegex, (match, username) => {
        return `<span class="mention">@${username}</span>`;
    });
}

// ================================================
// Setup Chat Input with Mention Autocomplete
// ================================================
function setupChatInput() {
    const input = document.getElementById('chatInput');
    const dropdown = document.getElementById('mentionDropdown');

    input.addEventListener('input', (e) => {
        const value = e.target.value;
        const cursorPos = e.target.selectionStart;
        
        // Check if user is typing a mention (started with /)
        const textBeforeCursor = value.substring(0, cursorPos);
        const slashIndex = textBeforeCursor.lastIndexOf('/');
        
        if (slashIndex !== -1) {
            const searchTerm = textBeforeCursor.substring(slashIndex + 1).toLowerCase();
            showMentionDropdown(searchTerm, slashIndex);
        } else {
            hideMentionDropdown();
        }
    });

    input.addEventListener('keydown', (e) => {
        const dropdown = document.getElementById('mentionDropdown');
        
        if (dropdown.classList.contains('show')) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                navigateMentions(1);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                navigateMentions(-1);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                selectCurrentMention();
            } else if (e.key === 'Escape') {
                hideMentionDropdown();
            }
        } else if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
}

// ================================================
// Show Mention Dropdown
// ================================================
function showMentionDropdown(searchTerm, startPos) {
    const dropdown = document.getElementById('mentionDropdown');
    
    // Filter users by search term
    const filteredUsers = allUsers.filter(user =>
        user.username.toLowerCase().includes(searchTerm) ||
        (user.nome_visualizzato && user.nome_visualizzato.toLowerCase().includes(searchTerm))
    ).slice(0, 5); // Limit to 5 results

    if (filteredUsers.length === 0) {
        hideMentionDropdown();
        return;
    }

    selectedMentionIndex = 0;
    dropdown.innerHTML = filteredUsers.map((user, index) => `
        <div class="mention-option ${index === 0 ? 'selected' : ''}" data-username="${user.username}" data-index="${index}">
            <strong>@${user.username}</strong>
            ${user.nome_visualizzato && user.nome_visualizzato !== user.username ? `<span style="color: var(--neutral); font-size: 0.875rem;"> • ${user.nome_visualizzato}</span>` : ''}
        </div>
    `).join('');

    // Add click handlers
    dropdown.querySelectorAll('.mention-option').forEach(option => {
        option.addEventListener('click', () => {
            insertMention(option.dataset.username, startPos);
        });
    });

    dropdown.classList.add('show');
}

// ================================================
// Hide Mention Dropdown
// ================================================
function hideMentionDropdown() {
    const dropdown = document.getElementById('mentionDropdown');
    dropdown.classList.remove('show');
    dropdown.innerHTML = '';
    selectedMentionIndex = 0;
}

// ================================================
// Navigate Mentions with Arrow Keys
// ================================================
function navigateMentions(direction) {
    const dropdown = document.getElementById('mentionDropdown');
    const options = dropdown.querySelectorAll('.mention-option');
    
    if (options.length === 0) return;

    // Remove current selection
    options[selectedMentionIndex].classList.remove('selected');

    // Update index
    selectedMentionIndex += direction;
    if (selectedMentionIndex < 0) selectedMentionIndex = options.length - 1;
    if (selectedMentionIndex >= options.length) selectedMentionIndex = 0;

    // Add new selection
    options[selectedMentionIndex].classList.add('selected');
    options[selectedMentionIndex].scrollIntoView({ block: 'nearest' });
}

// ================================================
// Select Current Mention
// ================================================
function selectCurrentMention() {
    const dropdown = document.getElementById('mentionDropdown');
    const selected = dropdown.querySelector('.mention-option.selected');
    
    if (selected) {
        const input = document.getElementById('chatInput');
        const value = input.value;
        const cursorPos = input.selectionStart;
        const textBeforeCursor = value.substring(0, cursorPos);
        const slashIndex = textBeforeCursor.lastIndexOf('/');
        
        insertMention(selected.dataset.username, slashIndex);
    }
}

// ================================================
// Insert Mention into Input
// ================================================
function insertMention(username, startPos) {
    const input = document.getElementById('chatInput');
    const value = input.value;
    const cursorPos = input.selectionStart;
    
    // Replace /username with @username
    const before = value.substring(0, startPos);
    const after = value.substring(cursorPos);
    const newValue = before + '@' + username + ' ' + after;
    
    input.value = newValue;
    input.setSelectionRange(startPos + username.length + 2, startPos + username.length + 2);
    input.focus();
    
    hideMentionDropdown();
}

// ================================================
// Send Message
// ================================================
let isSendingMessage = false; // Prevent rapid-fire sending

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const message = input.value.trim();

    if (!message || !currentUser || isSendingMessage) return;

    // Prevent rapid clicks
    isSendingMessage = true;
    
    // Disable send button
    if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.style.opacity = '0.5';
        sendBtn.style.cursor = 'not-allowed';
        sendBtn.textContent = 'Invio...';
    }

    try {
        // Get user profile for author_name
        const { data: profile } = await supabase
            .from('profili_utenti')
            .select('nome_visualizzato, username')
            .eq('id', currentUser.id)
            .single();
        
        const authorName = profile?.nome_visualizzato || profile?.username || 'Anonimo';
        
        // Insert message into Supabase
        const { data, error } = await supabase
            .from('chat_messages')
            .insert([
                {
                    user_id: currentUser.id,
                    author_name: authorName,
                    content: message,
                    message_type: 'text'
                }
            ])
            .select(`
                *,
                user:profili_utenti!fk_chat_messages_user(username, nome_visualizzato)
            `)
            .single();

        if (error) throw error;

        // Clear input
        input.value = '';

        // Add message to UI
        const container = document.getElementById('chatMessages');
        const messageEl = createMessageElement(data);
        container.appendChild(messageEl);

        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
    } catch (error) {
        console.error('Error sending message:', error);
        alert('Errore nell\'invio del messaggio');
    } finally {
        // Re-enable send button after a short delay
        setTimeout(() => {
            isSendingMessage = false;
            if (sendBtn) {
                sendBtn.disabled = false;
                sendBtn.style.opacity = '1';
                sendBtn.style.cursor = 'pointer';
                sendBtn.textContent = 'Invia';
            }
        }, 500); // 500ms cooldown to prevent spam
    }
}

// ================================================
// Update Online Count
// ================================================
async function updateOnlineCount() {
    try {
        const { count } = await supabase
            .from('profili_utenti')
            .select('*', { count: 'exact', head: true });

        document.getElementById('onlineCount').textContent = count || 0;
    } catch (error) {
        console.error('Error updating online count:', error);
    }
}

// ================================================
// Toggle Reaction (placeholder)
// ================================================
function toggleReaction(messageId, emoji) {
    console.log('Toggle reaction:', messageId, emoji);
    // Reaction toggle functionality - integrates with chat_reactions table
}

// ================================================
// Format Time Ago
// ================================================
function formatTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' anni fa';
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' mesi fa';
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' giorni fa';
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' ore fa';
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minuti fa';
    
    return 'Adesso';
}

// ================================================
// Escape HTML
// ================================================
function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ================================================
// Initialize on Page Load
// ================================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChat);
} else {
    initChat();
}
