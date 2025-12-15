// ================================================
// Enhanced Chat System with Discord-like Features
// ================================================

let allUsers = [];
let currentUser = null;
let currentUserProfile = null;
let selectedMentionIndex = 0;
let realtimeInterval = null;
let lastMessageId = null;
let editingMessageId = null;

// Use window.supabaseClient consistently
const getSupabase = () => window.supabaseClient || window.supabase;

// ================================================
// Initialize Chat
// ================================================
async function initChat() {
    try {
        // Wait a moment for Supabase session to be ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const supabaseClient = getSupabase();
        if (!supabaseClient) {
            console.error('Supabase client not available');
            hidePageLoader();
            window.location.href = 'login.html?redirect=chat.html';
            return;
        }
        
        // Get current user from Supabase auth
        const { data: { user } } = await supabaseClient.auth.getUser();
        
        if (!user) {
            window.location.href = 'login.html?redirect=chat.html';
            return;
        }
        
        currentUser = user;
        
        // Get current user profile
        const { data: profile } = await supabaseClient
            .from('profili_utenti')
            .select('*')
            .eq('id', user.id)
            .single();
        
        currentUserProfile = profile;

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
        
        // Setup event delegation for chat messages
        setupChatEventDelegation();
        
        // Start real-time message updates
        startRealtimeUpdates();
        
        // Hide page loader
        hidePageLoader();
    } catch (error) {
        console.error('Error initializing chat:', error);
        hidePageLoader();
        window.location.href = 'login.html?redirect=chat.html';
    }
}

// Hide page loader
function hidePageLoader() {
    const loader = document.getElementById('page-loader');
    if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => {
            loader.style.display = 'none';
        }, 300);
    }
}

// ================================================
// Real-Time Message Updates
// ================================================
function startRealtimeUpdates() {
    realtimeInterval = setInterval(checkForNewMessages, 3000);
    window.addEventListener('beforeunload', stopRealtimeUpdates);
}

function stopRealtimeUpdates() {
    if (realtimeInterval) {
        clearInterval(realtimeInterval);
        realtimeInterval = null;
    }
}

async function checkForNewMessages() {
    try {
        const container = document.getElementById('chatMessages');
        if (!container) return;
        
        const supabaseClient = getSupabase();
        if (!supabaseClient) return;
        
        let query = supabaseClient
            .from('chat_messages')
            .select(`
                *,
                user:profili_utenti!fk_chat_messages_user(username, nome_visualizzato)
            `)
            .eq('is_deleted', false)
            .order('created_at', { ascending: false })
            .limit(20);
        
        if (lastMessageId) {
            query = query.gt('id', lastMessageId);
        }
        
        const { data: newMessages, error } = await query;
        
        if (error) throw error;
        
        if (newMessages && newMessages.length > 0) {
            newMessages.reverse();
            
            const isAtBottom = container.scrollHeight - container.scrollTop === container.clientHeight ||
                              container.scrollHeight - container.scrollTop - container.clientHeight < 100;
            
            newMessages.forEach(msg => {
                const existingMsg = document.querySelector(`[data-message-id="${msg.id}"]`);
                if (!existingMsg) {
                    const messageEl = createMessageElement(msg);
                    container.appendChild(messageEl);
                    
                    if (!lastMessageId || msg.id > lastMessageId) {
                        lastMessageId = msg.id;
                    }
                    
                    // Check if current user is mentioned
                    if (isUserMentioned(msg.content)) {
                        playMentionSound();
                        showMentionNotification(msg);
                    }
                }
            });
            
            if (isAtBottom) {
                container.scrollTop = container.scrollHeight;
            }
        }
    } catch (error) {
        console.error('Error checking for new messages:', error);
    }
}

// ================================================
// Load All Users for Mentions
// ================================================
async function loadAllUsers() {
    try {
        const supabaseClient = getSupabase();
        if (!supabaseClient) return;
        
        const { data, error } = await supabaseClient
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
    
    const loadingEl = document.createElement('div');
    loadingEl.id = 'chatLoadingState';
    loadingEl.style.cssText = 'display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem; text-align: center;';
    loadingEl.innerHTML = `
        <div style="width: 50px; height: 50px; border: 4px solid #e5e7eb; border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 1rem;"></div>
        <p style="color: var(--neutral); font-size: 1rem; margin: 0;">Caricamento messaggi in corso...</p>
    `;
    
    const pinnedMsg = container.querySelector('.pinned-messages');
    container.innerHTML = '';
    if (pinnedMsg) {
        container.appendChild(pinnedMsg);
    }
    container.appendChild(loadingEl);
}

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

    showChatLoading();

    try {
        const supabaseClient = getSupabase();
        if (!supabaseClient) {
            hideChatLoading();
            return;
        }
        
        const { data: messages, error } = await supabaseClient
            .from('chat_messages')
            .select(`
                *,
                user:profili_utenti!fk_chat_messages_user(username, nome_visualizzato)
            `)
            .eq('is_deleted', false)
            .order('created_at', { ascending: true })
            .limit(100);

        if (error) throw error;

        hideChatLoading();

        const pinnedMsg = container.querySelector('.pinned-messages');
        container.innerHTML = '';
        if (pinnedMsg) {
            container.appendChild(pinnedMsg);
        }

        if (messages && messages.length > 0) {
            messages.forEach(msg => {
                const messageEl = createMessageElement(msg);
                container.appendChild(messageEl);
                
                if (!lastMessageId || msg.id > lastMessageId) {
                    lastMessageId = msg.id;
                }
            });
        } else {
            const welcomeDiv = document.createElement('div');
            welcomeDiv.style.cssText = 'text-align: center; padding: 2rem; color: var(--neutral);';
            welcomeDiv.innerHTML = '<p>💬 Nessun messaggio ancora. Inizia la conversazione!</p>';
            container.appendChild(welcomeDiv);
        }

        container.scrollTop = container.scrollHeight;
        hidePageLoader();
    } catch (error) {
        console.error('Error loading messages:', error);
        hidePageLoader();
    }
}

// ================================================
// Setup Event Delegation for Chat Actions
// ================================================
function setupChatEventDelegation() {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    
    container.addEventListener('click', (e) => {
        const target = e.target.closest('[data-action]');
        if (!target) return;
        
        const action = target.dataset.action;
        const messageId = target.dataset.messageId;
        const emoji = target.dataset.emoji;
        
        switch (action) {
            case 'toggle-reaction':
                if (messageId && emoji) {
                    toggleReaction(messageId, emoji);
                }
                break;
            case 'show-reaction-picker':
                if (messageId) {
                    showReactionPicker(messageId);
                }
                break;
            case 'edit-message':
                if (messageId) {
                    editMessage(messageId);
                }
                break;
            case 'delete-message':
                if (messageId) {
                    deleteMessage(messageId);
                }
                break;
            case 'add-reaction':
                if (messageId && emoji) {
                    addReaction(messageId, emoji);
                }
                break;
        }
    });
}

// ================================================
// Create Message Element with Discord-like Features
// ================================================
function createMessageElement(msg) {
    const div = document.createElement('div');
    div.className = 'message fade-in';
    div.dataset.messageId = msg.id;
    div.dataset.userId = msg.user_id;

    const userEmailName = currentUser.email ? currentUser.email.split('@')[0] : 'Utente';

    const username = msg.user?.username || userEmailName;
    const displayName = msg.user?.nome_visualizzato || username;
    const initial = displayName.charAt(0).toUpperCase();
    const timeAgo = formatTimeAgo(new Date(msg.created_at));
    const fullTime = new Date(msg.created_at).toLocaleString('it-IT');

    // Check if current user is mentioned
    const isMentioned = isUserMentioned(msg.content || msg.message || msg.messaggio || '');
    if (isMentioned) {
        div.classList.add('message-mentioned');
    }

    // Parse and highlight mentions
    const messageText = highlightMentions(msg.content || msg.message || msg.messaggio || '', currentUserProfile?.username);
    
    // Check if this is the current user's message
    const isOwnMessage = msg.user_id === currentUser?.id;
    
    // Build reactions HTML using data attributes for security
    let reactionsHTML = '<div class="message-reactions">';
    if (msg.reactions && Object.keys(msg.reactions).length > 0) {
        for (const [emoji, count] of Object.entries(msg.reactions)) {
            // Validate emoji is safe (only emoji characters)
            const safeEmoji = escapeHTML(emoji);
            reactionsHTML += `<button class="reaction-btn" data-action="toggle-reaction" data-message-id="${msg.id}" data-emoji="${safeEmoji}">${safeEmoji} ${count}</button>`;
        }
    }
    // Add reaction picker button
    reactionsHTML += `<button class="reaction-btn reaction-add" data-action="show-reaction-picker" data-message-id="${msg.id}">➕</button>`;
    reactionsHTML += '</div>';
    
    // Build message actions for own messages using data attributes
    let actionsHTML = '';
    if (isOwnMessage) {
        actionsHTML = `
            <div class="message-actions">
                <button class="action-btn" data-action="edit-message" data-message-id="${msg.id}" title="Modifica">✏️</button>
                <button class="action-btn" data-action="delete-message" data-message-id="${msg.id}" title="Elimina">🗑️</button>
            </div>
        `;
    }
    
    // Edited indicator
    const editedIndicator = msg.edited_at ? `<span class="edited-indicator" title="Modificato ${new Date(msg.edited_at).toLocaleString('it-IT')}">(modificato)</span>` : '';

    div.innerHTML = `
        <div class="message-avatar" style="background: ${stringToColor(username)}">${initial}</div>
        <div class="message-content">
            <div class="message-header">
                <span class="message-author">${escapeHTML(displayName)} <span style="color: var(--neutral); font-weight: normal;">@${escapeHTML(username)}</span></span>
                <span class="message-time" title="${escapeHTML(fullTime)}">${timeAgo}</span>
                ${editedIndicator}
                ${actionsHTML}
            </div>
            <div class="message-text" id="msg-text-${msg.id}">${messageText}</div>
            ${reactionsHTML}
        </div>
    `;

    return div;
}

// ================================================
// Check if Current User is Mentioned
// ================================================
function isUserMentioned(text) {
    if (!currentUserProfile?.username) return false;
    const mentionPattern = new RegExp(`@${currentUserProfile.username}\\b`, 'i');
    return mentionPattern.test(text);
}

// ================================================
// Highlight @ Mentions in Message (with special highlight for current user)
// ================================================
function highlightMentions(text, currentUsername) {
    const mentionRegex = /@(\w+(?:\.\w+)*)/g;
    return escapeHTML(text).replace(mentionRegex, (match, username) => {
        const isSelf = currentUsername && username.toLowerCase() === currentUsername.toLowerCase();
        const className = isSelf ? 'mention mention-self' : 'mention';
        return `<span class="${className}">@${username}</span>`;
    });
}

// ================================================
// Generate Color from String (for avatars)
// ================================================
function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
        '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
        '#BB8FCE', '#85C1E9', '#F8B500', '#00CED1'
    ];
    return colors[Math.abs(hash) % colors.length];
}

// ================================================
// Edit Message
// ================================================
async function editMessage(messageId) {
    const messageEl = document.querySelector(`[data-message-id="${messageId}"]`);
    if (!messageEl) return;
    
    const textEl = document.getElementById(`msg-text-${messageId}`);
    if (!textEl) return;
    
    // Get current text (innerText already strips HTML)
    const currentText = textEl.innerText;
    
    // Create edit input using DOM methods (avoid innerHTML for security)
    const editContainer = document.createElement('div');
    editContainer.className = 'edit-container';
    editContainer.id = `edit-container-${messageId}`;
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'edit-input';
    input.id = `edit-input-${messageId}`;
    input.value = currentText; // No need to escape, setting via .value is safe
    
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'edit-actions';
    
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-sm btn-primary';
    saveBtn.textContent = 'Salva';
    saveBtn.addEventListener('click', () => saveEdit(messageId));
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-sm btn-secondary';
    cancelBtn.textContent = 'Annulla';
    cancelBtn.addEventListener('click', () => cancelEdit(messageId));
    
    const hint = document.createElement('small');
    hint.style.color = 'var(--neutral)';
    hint.textContent = 'Esc per annullare, Invio per salvare';
    
    actionsDiv.appendChild(saveBtn);
    actionsDiv.appendChild(cancelBtn);
    editContainer.appendChild(input);
    editContainer.appendChild(actionsDiv);
    editContainer.appendChild(hint);
    
    textEl.style.display = 'none';
    textEl.parentNode.insertBefore(editContainer, textEl.nextSibling);
    
    input.focus();
    input.select();
    
    // Handle keyboard events
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            saveEdit(messageId);
        } else if (e.key === 'Escape') {
            cancelEdit(messageId);
        }
    });
    
    editingMessageId = messageId;
}

// ================================================
// Save Edited Message
// ================================================
async function saveEdit(messageId) {
    const input = document.getElementById(`edit-input-${messageId}`);
    if (!input) return;
    
    const newText = input.value.trim();
    if (!newText) {
        alert('Il messaggio non può essere vuoto');
        return;
    }
    
    try {
        const supabaseClient = getSupabase();
        if (!supabaseClient) return;
        
        const { error } = await supabaseClient
            .from('chat_messages')
            .update({ 
                content: newText,
                edited_at: new Date().toISOString()
            })
            .eq('id', messageId)
            .eq('user_id', currentUser.id);
        
        if (error) throw error;
        
        // Update UI
        const textEl = document.getElementById(`msg-text-${messageId}`);
        textEl.innerHTML = highlightMentions(newText, currentUserProfile?.username) + 
            ' <span class="edited-indicator">(modificato)</span>';
        textEl.style.display = 'block';
        
        // Remove edit container
        const editContainer = document.getElementById(`edit-container-${messageId}`);
        if (editContainer) editContainer.remove();
        
        editingMessageId = null;
    } catch (error) {
        console.error('Error saving edit:', error);
        alert('Errore nel salvare la modifica');
    }
}

// ================================================
// Cancel Edit
// ================================================
function cancelEdit(messageId) {
    const textEl = document.getElementById(`msg-text-${messageId}`);
    if (textEl) {
        textEl.style.display = 'block';
    }
    
    const editContainer = document.getElementById(`edit-container-${messageId}`);
    if (editContainer) editContainer.remove();
    
    editingMessageId = null;
}

// ================================================
// Delete Message
// ================================================
async function deleteMessage(messageId) {
    if (!confirm('Sei sicuro di voler eliminare questo messaggio?')) {
        return;
    }
    
    try {
        const supabaseClient = getSupabase();
        if (!supabaseClient) return;
        
        const { error } = await supabaseClient
            .from('chat_messages')
            .update({ is_deleted: true })
            .eq('id', messageId)
            .eq('user_id', currentUser.id);
        
        if (error) throw error;
        
        // Remove from UI with animation
        const messageEl = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageEl) {
            messageEl.style.opacity = '0';
            messageEl.style.transform = 'translateX(-20px)';
            setTimeout(() => messageEl.remove(), 300);
        }
    } catch (error) {
        console.error('Error deleting message:', error);
        alert('Errore nell\'eliminare il messaggio');
    }
}

// ================================================
// Show Reaction Picker
// ================================================
function showReactionPicker(messageId) {
    // Remove any existing picker
    const existingPicker = document.querySelector('.reaction-picker');
    if (existingPicker) existingPicker.remove();
    
    const reactions = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '👏'];
    
    const picker = document.createElement('div');
    picker.className = 'reaction-picker';
    
    // Create buttons safely without inline onclick
    reactions.forEach(r => {
        const btn = document.createElement('button');
        btn.className = 'reaction-option';
        btn.textContent = r;
        btn.dataset.action = 'add-reaction';
        btn.dataset.messageId = messageId;
        btn.dataset.emoji = r;
        picker.appendChild(btn);
    });
    
    const messageEl = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageEl) {
        const reactionsDiv = messageEl.querySelector('.message-reactions');
        reactionsDiv.appendChild(picker);
    }
    
    // Close picker when clicking outside
    setTimeout(() => {
        document.addEventListener('click', closePicker);
    }, 100);
    
    function closePicker(e) {
        if (!picker.contains(e.target)) {
            picker.remove();
            document.removeEventListener('click', closePicker);
        }
    }
}

// ================================================
// Add Reaction
// ================================================
async function addReaction(messageId, emoji) {
    try {
        const supabaseClient = getSupabase();
        if (!supabaseClient) return;
        
        // Validate emoji - only allow known safe emoji
        const safeEmojis = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '👏'];
        if (!safeEmojis.includes(emoji)) {
            console.warn('Invalid emoji attempted:', emoji);
            return;
        }
        
        // Get current message
        const { data: message, error: fetchError } = await supabaseClient
            .from('chat_messages')
            .select('reactions')
            .eq('id', messageId)
            .single();
        
        if (fetchError) throw fetchError;
        
        let reactions = message.reactions || {};
        reactions[emoji] = (reactions[emoji] || 0) + 1;
        
        const { error } = await supabaseClient
            .from('chat_messages')
            .update({ reactions })
            .eq('id', messageId);
        
        if (error) throw error;
        
        // Update UI
        const messageEl = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageEl) {
            const reactionsDiv = messageEl.querySelector('.message-reactions');
            const existingBtn = reactionsDiv.querySelector(`[data-emoji="${emoji}"]`);
            if (existingBtn) {
                existingBtn.innerHTML = `${emoji} ${reactions[emoji]}`;
            } else {
                const newBtn = document.createElement('button');
                newBtn.className = 'reaction-btn';
                newBtn.dataset.emoji = emoji;
                newBtn.innerHTML = `${emoji} ${reactions[emoji]}`;
                newBtn.onclick = () => toggleReaction(messageId, emoji);
                reactionsDiv.insertBefore(newBtn, reactionsDiv.querySelector('.reaction-add'));
            }
        }
        
        // Remove picker
        const picker = document.querySelector('.reaction-picker');
        if (picker) picker.remove();
    } catch (error) {
        console.error('Error adding reaction:', error);
    }
}

// ================================================
// Toggle Reaction
// ================================================
async function toggleReaction(messageId, emoji) {
    await addReaction(messageId, emoji);
}

// ================================================
// Play Mention Sound
// ================================================
function playMentionSound() {
    // Create a simple notification sound using Web Audio API
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.1;
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
        // Audio not supported
    }
}

// ================================================
// Show Mention Notification
// ================================================
function showMentionNotification(msg) {
    const username = msg.user?.username || 'Qualcuno';
    
    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Sei stato menzionato!', {
            body: `${username}: ${msg.content?.substring(0, 50)}...`,
            icon: '💬'
        });
    }
    
    // In-page notification
    const notification = document.createElement('div');
    notification.className = 'mention-notification';
    notification.innerHTML = `
        <span>📢 <strong>${escapeHTML(username)}</strong> ti ha menzionato!</span>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
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
            } else if (e.key === 'Tab') {
                e.preventDefault();
                selectCurrentMention();
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
    
    const filteredUsers = allUsers.filter(user =>
        user.username.toLowerCase().includes(searchTerm) ||
        (user.nome_visualizzato && user.nome_visualizzato.toLowerCase().includes(searchTerm))
    ).slice(0, 5);

    if (filteredUsers.length === 0) {
        hideMentionDropdown();
        return;
    }

    selectedMentionIndex = 0;
    dropdown.innerHTML = filteredUsers.map((user, index) => `
        <div class="mention-option ${index === 0 ? 'selected' : ''}" data-username="${user.username}" data-index="${index}">
            <div class="mention-avatar" style="background: ${stringToColor(user.username)}">${user.username.charAt(0).toUpperCase()}</div>
            <div class="mention-info">
                <strong>@${user.username}</strong>
                ${user.nome_visualizzato && user.nome_visualizzato !== user.username ? `<span style="color: var(--neutral); font-size: 0.875rem;"> • ${user.nome_visualizzato}</span>` : ''}
            </div>
        </div>
    `).join('');

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

    options[selectedMentionIndex].classList.remove('selected');

    selectedMentionIndex += direction;
    if (selectedMentionIndex < 0) selectedMentionIndex = options.length - 1;
    if (selectedMentionIndex >= options.length) selectedMentionIndex = 0;

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
let isSendingMessage = false;

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const message = input.value.trim();

    if (!message || !currentUser || isSendingMessage) return;

    isSendingMessage = true;
    
    if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.style.opacity = '0.5';
        sendBtn.textContent = 'Invio...';
    }

    try {
        const supabaseClient = getSupabase();
        if (!supabaseClient) return;
        const userEmailName = currentUser.email ? currentUser.email.split('@')[0] : 'Utente';
        const authorName = currentUserProfile?.nome_visualizzato || currentUserProfile?.username || userEmailName;
        
        const { data, error } = await supabaseClient
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

        input.value = '';

        const container = document.getElementById('chatMessages');
        const messageEl = createMessageElement(data);
        container.appendChild(messageEl);

        container.scrollTop = container.scrollHeight;
        
        if (!lastMessageId || data.id > lastMessageId) {
            lastMessageId = data.id;
        }
    } catch (error) {
        console.error('Error sending message:', error);
        alert('Errore nell\'invio del messaggio');
    } finally {
        setTimeout(() => {
            isSendingMessage = false;
            if (sendBtn) {
                sendBtn.disabled = false;
                sendBtn.style.opacity = '1';
                sendBtn.textContent = 'Invia 📤';
            }
        }, 500);
    }
}

// ================================================
// Update Online Count
// ================================================
async function updateOnlineCount() {
    try {
        const supabaseClient = getSupabase();
        if (!supabaseClient) return;
        
        const { count } = await supabaseClient
            .from('profili_utenti')
            .select('*', { count: 'exact', head: true });

        const countEl = document.getElementById('onlineCount');
        if (countEl) {
            countEl.textContent = count || 0;
        }
    } catch (error) {
        console.error('Error updating online count:', error);
    }
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
