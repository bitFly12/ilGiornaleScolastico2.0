/**
 * Mobile-First Chat System - Discord/WhatsApp Inspired
 * Features: Real-time messaging, mentions, reactions, reply, edit, delete,
 * emoji picker, search, typing indicator, rooms, and more!
 */

// ================================================
// Global State
// ================================================
const ChatState = {
    currentUser: null,
    currentProfile: null,
    currentRoom: 'generale',
    messages: [],
    allUsers: [],
    selectedMessageId: null,
    replyingTo: null,
    editingMessageId: null,
    lastMessageTimestamp: null, // Changed from lastMessageId to use timestamp for proper polling
    isTyping: false,
    typingTimeout: null,
    unreadCount: 0,
    isAtBottom: true,
    realtimeInterval: null
};

// Emoji list for picker
const EMOJI_LIST = [
    '😀', '😂', '🥹', '😍', '🥰', '😎', '🤓', '🤔',
    '😴', '🤯', '😱', '🥳', '😈', '💀', '👻', '🤖',
    '👍', '👎', '👏', '🙌', '🤝', '✌️', '🤟', '💪',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '💔',
    '🔥', '⭐', '✨', '💫', '🎉', '🎊', '🎁', '🏆',
    '⚽', '🏀', '🎮', '🎸', '📚', '💻', '📱', '🎬'
];

// Color palette for avatars
const AVATAR_COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
    '#BB8FCE', '#85C1E9', '#F8B500', '#00CED1',
    '#FF7675', '#74B9FF', '#A29BFE', '#FD79A8'
];

// ================================================
// Initialization
// ================================================
document.addEventListener('DOMContentLoaded', initMobileChat);

async function initMobileChat() {
    try {
        console.log('🚀 Initializing mobile chat...');
        
        // Wait for Supabase
        await waitForSupabase();
        
        // Check authentication
        const user = await checkAuth();
        if (!user) {
            window.location.href = 'login.html?redirect=chat.html';
            return;
        }
        
        ChatState.currentUser = user;
        
        // Load user profile
        await loadUserProfile();
        
        // Load all users for mentions
        await loadAllUsers();
        
        // Initialize emoji picker
        initEmojiPicker();
        
        // Setup input handlers
        setupInputHandlers();
        
        // Load messages
        await loadMessages();
        
        // Update user count
        await updateUserCount();
        
        // Start real-time updates
        startRealtimeUpdates();
        
        // Setup scroll handler
        setupScrollHandler();
        
        // Setup mobile keyboard handling
        setupMobileKeyboardHandling();
        
        // Setup visibility change handler (pause polling when tab not visible)
        setupVisibilityHandler();
        
        console.log('✅ Chat initialized successfully!');
        
    } catch (error) {
        console.error('❌ Chat initialization error:', error);
        showToast('Errore nel caricamento della chat', '❌');
    }
}

// Handle mobile keyboard
function setupMobileKeyboardHandling() {
    const chatApp = document.getElementById('chatApp');
    const input = document.getElementById('messageInput');
    
    if (!chatApp || !input) return;
    
    // Detect if on mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
        input.addEventListener('focus', () => {
            chatApp.classList.add('keyboard-open');
            // Scroll to bottom when keyboard opens
            setTimeout(() => scrollToBottom(false), 300);
        });
        
        input.addEventListener('blur', () => {
            chatApp.classList.remove('keyboard-open');
        });
        
        // Handle visual viewport changes (for iOS)
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', () => {
                // Adjust for keyboard
                const viewport = window.visualViewport;
                const offsetBottom = window.innerHeight - viewport.height - viewport.offsetTop;
                document.body.style.setProperty('--keyboard-height', `${offsetBottom}px`);
            });
        }
    }
}

// Pause polling when tab not visible
function setupVisibilityHandler() {
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopRealtimeUpdates();
        } else {
            startRealtimeUpdates();
            // Refresh messages when returning
            loadMessages();
        }
    });
}

async function waitForSupabase() {
    let attempts = 0;
    while (!window.supabaseClient && attempts < 20) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    if (!window.supabaseClient) {
        throw new Error('Supabase client not available');
    }
}

async function checkAuth() {
    const { data: { user }, error } = await window.supabaseClient.auth.getUser();
    return error ? null : user;
}

async function loadUserProfile() {
    if (!ChatState.currentUser) return;
    
    const { data } = await window.supabaseClient
        .from('profili_utenti')
        .select('*')
        .eq('id', ChatState.currentUser.id)
        .single();
    
    ChatState.currentProfile = data;
}

async function loadAllUsers() {
    const { data } = await window.supabaseClient
        .from('profili_utenti')
        .select('id, username, nome_visualizzato')
        .order('username');
    
    ChatState.allUsers = data || [];
}

// ================================================
// Messages
// ================================================
async function loadMessages() {
    try {
        // Filter by current room
        const { data: messages, error } = await window.supabaseClient
            .from('chat_messages')
            .select(`
                *,
                user:profili_utenti!fk_chat_messages_user(username, nome_visualizzato)
            `)
            .eq('is_deleted', false)
            .eq('room', ChatState.currentRoom) // Filter by current room
            .order('created_at', { ascending: true })
            .limit(100);
        
        if (error) throw error;
        
        ChatState.messages = messages || [];
        renderMessages();
        
        if (messages && messages.length > 0) {
            // Use timestamp for proper polling (works with UUIDs)
            ChatState.lastMessageTimestamp = messages[messages.length - 1].created_at;
        }
        
        scrollToBottom(false);
        
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

function renderMessages() {
    const container = document.getElementById('messagesList');
    if (!container) return;
    
    if (ChatState.messages.length === 0) {
        container.innerHTML = `
            <div class="system-message">
                <span>👋 Benvenuto nella chat! Sii il primo a scrivere.</span>
            </div>
        `;
        return;
    }
    
    let html = '';
    let lastDate = null;
    
    ChatState.messages.forEach(msg => {
        const msgDate = new Date(msg.created_at).toDateString();
        
        // Date separator
        if (msgDate !== lastDate) {
            const dateLabel = formatDateLabel(new Date(msg.created_at));
            html += `<div class="date-separator"><span>${dateLabel}</span></div>`;
            lastDate = msgDate;
        }
        
        html += createMessageBubble(msg);
    });
    
    container.innerHTML = html;
}

function createMessageBubble(msg) {
    const isOwn = msg.user_id === ChatState.currentUser?.id;
    const username = msg.user?.username || 'anonimo';
    const displayName = msg.user?.nome_visualizzato || username;
    const initial = displayName.charAt(0).toUpperCase();
    const avatarColor = stringToColor(username);
    const time = formatTime(new Date(msg.created_at));
    const text = formatMessageText(msg.content || msg.message || '');
    
    // Check if mentioned
    const isMentioned = checkIfMentioned(msg.content);
    const mentionedClass = isMentioned ? 'mentioned' : '';
    
    // Build reactions
    let reactionsHtml = '';
    if (msg.reactions && Object.keys(msg.reactions).length > 0) {
        reactionsHtml = '<div class="bubble-reactions">';
        for (const [emoji, count] of Object.entries(msg.reactions)) {
            reactionsHtml += `<span class="reaction-pill" onclick="toggleReaction('${msg.id}', '${emoji}')">${emoji} ${count}</span>`;
        }
        reactionsHtml += '</div>';
    }
    
    // Reply preview
    let replyHtml = '';
    if (msg.reply_to_id) {
        const replyMsg = ChatState.messages.find(m => m.id === msg.reply_to_id);
        if (replyMsg) {
            const replyAuthor = replyMsg.user?.nome_visualizzato || 'Utente';
            const replyText = truncateText(replyMsg.content || '', 50);
            replyHtml = `
                <div class="reply-preview">
                    <div class="reply-author">${escapeHtml(replyAuthor)}</div>
                    <div class="reply-text">${escapeHtml(replyText)}</div>
                </div>
            `;
        }
    }
    
    // Edited indicator
    const editedHtml = msg.edited_at ? '<span style="font-size: 0.6rem; opacity: 0.6;"> (modificato)</span>' : '';
    
    // Delete button - only visible for own messages
    const deleteButtonHtml = isOwn ? `
        <button class="bubble-delete-btn" onclick="event.stopPropagation(); ChatState.selectedMessageId='${msg.id}'; deleteCurrentMessage();" title="Elimina" style="background: none; border: none; cursor: pointer; opacity: 0.5; font-size: 0.7rem; padding: 2px 4px; margin-left: 4px;">🗑️</button>
    ` : '';
    
    return `
        <div class="message-bubble ${isOwn ? 'own' : ''} ${mentionedClass}" 
             data-message-id="${msg.id}"
             data-user-id="${msg.user_id}"
             onclick="handleMessageClick(event, '${msg.id}')"
             oncontextmenu="handleMessageLongPress(event, '${msg.id}')">
            ${!isOwn ? `<div class="message-avatar-small" style="background: ${avatarColor}">${initial}</div>` : ''}
            <div class="bubble-content">
                ${!isOwn ? `<div class="bubble-author">${escapeHtml(displayName)}</div>` : ''}
                ${replyHtml}
                <div class="bubble-text">${text}${editedHtml}</div>
                <div class="bubble-footer">
                    <span class="bubble-time">${time}</span>
                    ${isOwn ? '<span class="bubble-status">✓✓</span>' : ''}
                    ${deleteButtonHtml}
                </div>
                ${reactionsHtml}
            </div>
        </div>
    `;
}

// ================================================
// Send Message
// ================================================
let isSending = false;

async function sendMessage() {
    const input = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const message = input.value.trim();
    
    if (!message || isSending || !ChatState.currentUser) return;
    
    isSending = true;
    sendBtn.disabled = true;
    
    try {
        const authorName = ChatState.currentProfile?.nome_visualizzato || 
                          ChatState.currentProfile?.username || 'Anonimo';
        
        const messageData = {
            user_id: ChatState.currentUser.id,
            author_name: authorName,
            content: message,
            message_type: 'text',
            room: ChatState.currentRoom // Include current room
        };
        
        // Add reply reference if replying
        if (ChatState.replyingTo) {
            messageData.reply_to_id = ChatState.replyingTo.id;
        }
        
        const { data, error } = await window.supabaseClient
            .from('chat_messages')
            .insert([messageData])
            .select(`
                *,
                user:profili_utenti!fk_chat_messages_user(username, nome_visualizzato)
            `)
            .single();
        
        if (error) throw error;
        
        // Clear input and reply state
        input.value = '';
        input.style.height = 'auto';
        cancelReply();
        
        // Add message to state and render (check for duplicates)
        const exists = ChatState.messages.some(m => m.id === data.id);
        if (!exists) {
            ChatState.messages.push(data);
            ChatState.lastMessageTimestamp = data.created_at;
        }
        renderMessages();
        scrollToBottom(true);
        
    } catch (error) {
        console.error('Error sending message:', error);
        showToast('Errore nell\'invio del messaggio', '❌');
    } finally {
        isSending = false;
        sendBtn.disabled = false;
        updateSendButton();
    }
}

// ================================================
// Message Actions
// ================================================
function handleMessageClick(event, messageId) {
    // Single click - do nothing special on mobile
    event.stopPropagation();
}

function handleMessageLongPress(event, messageId) {
    event.preventDefault();
    event.stopPropagation();
    showActionsMenu(event, messageId);
}

function showActionsMenu(event, messageId) {
    const menu = document.getElementById('actionsMenu');
    const msg = ChatState.messages.find(m => m.id === messageId);
    
    if (!msg) return;
    
    ChatState.selectedMessageId = messageId;
    const isOwn = msg.user_id === ChatState.currentUser?.id;
    
    // Show/hide own-only actions
    menu.querySelectorAll('.own-only').forEach(el => {
        el.style.display = isOwn ? 'flex' : 'none';
    });
    
    // Position menu
    const x = Math.min(event.clientX, window.innerWidth - 200);
    const y = Math.min(event.clientY, window.innerHeight - 250);
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    menu.classList.remove('hidden');
    
    // Close on outside click
    setTimeout(() => {
        document.addEventListener('click', closeActionsMenu);
    }, 100);
}

function closeActionsMenu() {
    document.getElementById('actionsMenu').classList.add('hidden');
    document.removeEventListener('click', closeActionsMenu);
}

function replyToMessage() {
    const msg = ChatState.messages.find(m => m.id === ChatState.selectedMessageId);
    if (!msg) return;
    
    ChatState.replyingTo = msg;
    
    const banner = document.getElementById('replyBanner');
    document.getElementById('replyAuthor').textContent = msg.user?.nome_visualizzato || 'Utente';
    document.getElementById('replyText').textContent = truncateText(msg.content || '', 50);
    banner.classList.add('show');
    
    document.getElementById('messageInput').focus();
    closeActionsMenu();
}

function cancelReply() {
    ChatState.replyingTo = null;
    document.getElementById('replyBanner').classList.remove('show');
}

function copyMessage() {
    const msg = ChatState.messages.find(m => m.id === ChatState.selectedMessageId);
    if (!msg) return;
    
    // Use clipboard API with fallback
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(msg.content || '').then(() => {
            showToast('Messaggio copiato!', '📋');
        }).catch(() => {
            fallbackCopy(msg.content || '');
        });
    } else {
        fallbackCopy(msg.content || '');
    }
    closeActionsMenu();
}

function fallbackCopy(text) {
    // Fallback for non-secure contexts
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        document.execCommand('copy');
        showToast('Messaggio copiato!', '📋');
    } catch (err) {
        showToast('Impossibile copiare', '❌');
    }
    document.body.removeChild(textArea);
}

async function deleteCurrentMessage() {
    if (!ChatState.selectedMessageId) return;
    
    if (!confirm('Eliminare questo messaggio?')) {
        closeActionsMenu();
        return;
    }
    
    try {
        await window.supabaseClient
            .from('chat_messages')
            .update({ is_deleted: true })
            .eq('id', ChatState.selectedMessageId)
            .eq('user_id', ChatState.currentUser.id);
        
        // Remove from state
        ChatState.messages = ChatState.messages.filter(m => m.id !== ChatState.selectedMessageId);
        renderMessages();
        showToast('Messaggio eliminato', '🗑️');
        
    } catch (error) {
        console.error('Error deleting message:', error);
        showToast('Errore nell\'eliminazione', '❌');
    }
    
    closeActionsMenu();
}

function editCurrentMessage() {
    const msg = ChatState.messages.find(m => m.id === ChatState.selectedMessageId);
    if (!msg) return;
    
    const input = document.getElementById('messageInput');
    input.value = msg.content || '';
    input.focus();
    
    ChatState.editingMessageId = ChatState.selectedMessageId;
    document.getElementById('sendBtn').innerHTML = '✏️';
    
    closeActionsMenu();
}

async function saveEdit() {
    if (!ChatState.editingMessageId) return;
    
    const input = document.getElementById('messageInput');
    const newText = input.value.trim();
    
    if (!newText) {
        showToast('Il messaggio non può essere vuoto', '⚠️');
        return;
    }
    
    try {
        await window.supabaseClient
            .from('chat_messages')
            .update({ 
                content: newText,
                edited_at: new Date().toISOString()
            })
            .eq('id', ChatState.editingMessageId)
            .eq('user_id', ChatState.currentUser.id);
        
        // Update local state
        const msgIndex = ChatState.messages.findIndex(m => m.id === ChatState.editingMessageId);
        if (msgIndex !== -1) {
            ChatState.messages[msgIndex].content = newText;
            ChatState.messages[msgIndex].edited_at = new Date().toISOString();
        }
        
        renderMessages();
        input.value = '';
        ChatState.editingMessageId = null;
        document.getElementById('sendBtn').innerHTML = '📤';
        showToast('Messaggio modificato', '✏️');
        
    } catch (error) {
        console.error('Error editing message:', error);
        showToast('Errore nella modifica', '❌');
    }
}

function reactToMessage() {
    // Show mini emoji picker for reactions
    const reactions = ['👍', '❤️', '😂', '😮', '😢', '🔥'];
    const html = reactions.map(r => 
        `<span class="emoji-item" onclick="addReaction('${ChatState.selectedMessageId}', '${r}')">${r}</span>`
    ).join('');
    
    showToast(html, '', 5000, true);
    closeActionsMenu();
}

async function addReaction(messageId, emoji) {
    try {
        const msg = ChatState.messages.find(m => m.id === messageId);
        if (!msg) return;
        
        let reactions = msg.reactions || {};
        reactions[emoji] = (reactions[emoji] || 0) + 1;
        
        await window.supabaseClient
            .from('chat_messages')
            .update({ reactions })
            .eq('id', messageId);
        
        msg.reactions = reactions;
        renderMessages();
        
    } catch (error) {
        console.error('Error adding reaction:', error);
    }
}

async function toggleReaction(messageId, emoji) {
    await addReaction(messageId, emoji);
}

function forwardMessage() {
    showToast('Funzione in arrivo!', '🚧');
    closeActionsMenu();
}

// ================================================
// Input Handlers
// ================================================
function setupInputHandlers() {
    const input = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    
    // Auto-resize textarea
    input.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 120) + 'px';
        updateSendButton();
        handleMentionInput(input.value);
    });
    
    // Send on Enter (no shift)
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (ChatState.editingMessageId) {
                saveEdit();
            } else {
                sendMessage();
            }
        }
        
        // Handle mention navigation
        if (document.getElementById('mentionDropdown').classList.contains('show')) {
            handleMentionKeydown(e);
        }
    });
    
    // Update button state
    input.addEventListener('input', updateSendButton);
}

function updateSendButton() {
    const input = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    sendBtn.disabled = !input.value.trim();
}

// ================================================
// Mentions
// ================================================
let mentionSearchText = '';
let selectedMentionIndex = 0;

function handleMentionInput(text) {
    const dropdown = document.getElementById('mentionDropdown');
    
    // Check for / trigger
    const lastSlash = text.lastIndexOf('/');
    if (lastSlash === -1 || lastSlash < text.lastIndexOf(' ')) {
        dropdown.classList.remove('show');
        return;
    }
    
    const searchText = text.substring(lastSlash + 1).toLowerCase();
    mentionSearchText = searchText;
    
    const matches = ChatState.allUsers.filter(u => 
        u.username.toLowerCase().includes(searchText) ||
        (u.nome_visualizzato && u.nome_visualizzato.toLowerCase().includes(searchText))
    ).slice(0, 5);
    
    if (matches.length === 0) {
        dropdown.classList.remove('show');
        return;
    }
    
    selectedMentionIndex = 0;
    dropdown.innerHTML = matches.map((user, i) => {
        const avatarColor = stringToColor(user.username);
        const initial = (user.nome_visualizzato || user.username).charAt(0).toUpperCase();
        return `
            <div class="mention-item ${i === 0 ? 'selected' : ''}" 
                 data-username="${user.username}"
                 onclick="insertMention('${user.username}')">
                <div class="mention-item-avatar" style="background: ${avatarColor}">${initial}</div>
                <div class="mention-item-info">
                    <div class="mention-item-name">${escapeHtml(user.nome_visualizzato || user.username)}</div>
                    <div class="mention-item-username">@${escapeHtml(user.username)}</div>
                </div>
            </div>
        `;
    }).join('');
    
    dropdown.classList.add('show');
}

function handleMentionKeydown(e) {
    const dropdown = document.getElementById('mentionDropdown');
    const items = dropdown.querySelectorAll('.mention-item');
    
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedMentionIndex = Math.min(selectedMentionIndex + 1, items.length - 1);
        updateMentionSelection(items);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedMentionIndex = Math.max(selectedMentionIndex - 1, 0);
        updateMentionSelection(items);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const selected = items[selectedMentionIndex];
        if (selected) {
            insertMention(selected.dataset.username);
        }
    } else if (e.key === 'Escape') {
        dropdown.classList.remove('show');
    }
}

function updateMentionSelection(items) {
    items.forEach((item, i) => {
        item.classList.toggle('selected', i === selectedMentionIndex);
    });
}

function insertMention(username) {
    const input = document.getElementById('messageInput');
    const value = input.value;
    const lastSlash = value.lastIndexOf('/');
    
    const before = value.substring(0, lastSlash);
    const newValue = before + '@' + username + ' ';
    
    input.value = newValue;
    input.focus();
    document.getElementById('mentionDropdown').classList.remove('show');
}

function checkIfMentioned(text) {
    if (!ChatState.currentProfile?.username || !text) return false;
    const regex = new RegExp(`@${ChatState.currentProfile.username}\\b`, 'i');
    return regex.test(text);
}

// ================================================
// Emoji Picker
// ================================================
function initEmojiPicker() {
    const grid = document.getElementById('emojiGrid');
    grid.innerHTML = EMOJI_LIST.map(emoji => 
        `<span class="emoji-item" onclick="insertEmoji('${emoji}')">${emoji}</span>`
    ).join('');
}

function toggleEmojiPicker() {
    const picker = document.getElementById('emojiPicker');
    picker.classList.toggle('show');
    
    if (picker.classList.contains('show')) {
        document.addEventListener('click', closeEmojiPickerOnOutside);
    }
}

function closeEmojiPickerOnOutside(e) {
    const picker = document.getElementById('emojiPicker');
    const btn = document.querySelector('.emoji-btn');
    if (!picker.contains(e.target) && e.target !== btn) {
        picker.classList.remove('show');
        document.removeEventListener('click', closeEmojiPickerOnOutside);
    }
}

function insertEmoji(emoji) {
    const input = document.getElementById('messageInput');
    const pos = input.selectionStart;
    const text = input.value;
    input.value = text.slice(0, pos) + emoji + text.slice(pos);
    input.focus();
    updateSendButton();
}

// ================================================
// UI Controls
// ================================================
function toggleSidebar() {
    document.getElementById('chatSidebar').classList.toggle('open');
    document.getElementById('sidebarOverlay').classList.toggle('show');
}

function selectRoom(roomId) {
    // Validate roomId
    const validRooms = ['generale', 'sport', 'musica', 'gaming', 'meme', 'anime', 'studio', 'tech'];
    if (!validRooms.includes(roomId)) {
        console.error('Invalid room ID:', roomId);
        return;
    }
    
    ChatState.currentRoom = roomId;
    ChatState.lastMessageTimestamp = null; // Reset for new room
    
    // Update active state
    document.querySelectorAll('.room-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const activeRoom = document.querySelector(`.room-item[data-room="${roomId}"]`);
    if (activeRoom) {
        activeRoom.classList.add('active');
    }
    
    // Update header
    const roomNames = {
        'generale': 'Chat Globale',
        'sport': 'Sport',
        'musica': 'Musica',
        'gaming': 'Gaming',
        'meme': 'Meme',
        'anime': 'Anime',
        'studio': 'Studio',
        'tech': 'Tech'
    };
    
    const roomIcons = {
        'generale': '💬',
        'sport': '⚽',
        'musica': '🎵',
        'gaming': '🎮',
        'meme': '😂',
        'anime': '🎌',
        'studio': '📚',
        'tech': '💻'
    };
    
    const headerTitle = document.querySelector('.chat-header-info h1');
    if (headerTitle) {
        headerTitle.textContent = roomNames[roomId] || 'Chat';
    }
    
    const headerIcon = document.querySelector('.chat-avatar-group');
    if (headerIcon) {
        headerIcon.textContent = roomIcons[roomId] || '💬';
    }
    
    toggleSidebar();
    
    // Reload messages for the selected room
    loadMessages();
}

function openSearch() {
    document.getElementById('searchOverlay').classList.add('show');
    document.getElementById('searchInput').focus();
}

function closeSearch() {
    document.getElementById('searchOverlay').classList.remove('show');
}

function handleSearch(query) {
    const results = document.getElementById('searchResults');
    
    if (!query.trim()) {
        results.innerHTML = '<p style="text-align: center; color: #64748b; padding: 2rem;">Digita per cercare nei messaggi</p>';
        return;
    }
    
    const matches = ChatState.messages.filter(m => 
        (m.content || '').toLowerCase().includes(query.toLowerCase())
    );
    
    if (matches.length === 0) {
        results.innerHTML = '<p style="text-align: center; color: #64748b; padding: 2rem;">Nessun risultato trovato</p>';
        return;
    }
    
    results.innerHTML = matches.slice(0, 20).map(msg => `
        <div class="search-result-item" onclick="scrollToMessage('${msg.id}')">
            <strong>${escapeHtml(msg.user?.nome_visualizzato || 'Utente')}</strong>
            <p style="margin: 0.25rem 0 0; color: #64748b; font-size: 0.85rem;">
                ${highlightSearch(escapeHtml(msg.content || ''), query)}
            </p>
        </div>
    `).join('');
}

function highlightSearch(text, query) {
    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

function scrollToMessage(messageId) {
    closeSearch();
    const el = document.querySelector(`[data-message-id="${messageId}"]`);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.style.background = '#fef3c7';
        setTimeout(() => {
            el.style.background = '';
        }, 2000);
    }
}

function togglePinned() {
    document.getElementById('pinnedBanner').style.display = 'none';
}

function toggleMediaPicker() {
    document.getElementById('mediaPicker').classList.toggle('show');
}

function selectMediaTab(tab) {
    document.querySelectorAll('.media-tab').forEach(t => t.classList.remove('active'));
    event.currentTarget.classList.add('active');
    // Load media for the selected tab
}

function attachImage() {
    showToast('Caricamento immagini in arrivo!', '📷');
}

// ================================================
// Real-time Updates
// ================================================
function startRealtimeUpdates() {
    ChatState.realtimeInterval = setInterval(checkForNewMessages, 3000);
    window.addEventListener('beforeunload', stopRealtimeUpdates);
}

function stopRealtimeUpdates() {
    if (ChatState.realtimeInterval) {
        clearInterval(ChatState.realtimeInterval);
    }
}

async function checkForNewMessages() {
    if (!ChatState.lastMessageTimestamp) return;
    
    try {
        // Filter by current room
        const { data: newMessages } = await window.supabaseClient
            .from('chat_messages')
            .select(`
                *,
                user:profili_utenti!fk_chat_messages_user(username, nome_visualizzato)
            `)
            .eq('is_deleted', false)
            .eq('room', ChatState.currentRoom) // Filter by current room
            .gt('created_at', ChatState.lastMessageTimestamp)
            .order('created_at', { ascending: true });
        
        if (newMessages && newMessages.length > 0) {
            // Filter out any duplicates by checking existing message IDs
            const existingIds = new Set(ChatState.messages.map(m => m.id));
            const uniqueNewMessages = newMessages.filter(msg => !existingIds.has(msg.id));
            
            if (uniqueNewMessages.length > 0) {
                uniqueNewMessages.forEach(msg => {
                    ChatState.messages.push(msg);
                    
                    // Notify if mentioned
                    if (checkIfMentioned(msg.content) && msg.user_id !== ChatState.currentUser?.id) {
                        showToast(`${msg.user?.nome_visualizzato || 'Qualcuno'} ti ha menzionato!`, '🔔');
                        notifyMention(msg);
                    }
                });
                
                // Update timestamp to latest message
                ChatState.lastMessageTimestamp = uniqueNewMessages[uniqueNewMessages.length - 1].created_at;
                
                renderMessages();
                
                if (ChatState.isAtBottom) {
                    scrollToBottom(true);
                } else {
                    ChatState.unreadCount += uniqueNewMessages.length;
                    updateUnreadBadge();
                }
            }
        }
    } catch (error) {
        console.error('Error checking for new messages:', error);
    }
}

async function updateUserCount() {
    try {
        const { count } = await window.supabaseClient
            .from('profili_utenti')
            .select('*', { count: 'exact', head: true });
        
        document.getElementById('onlineCount').textContent = count || 0;
    } catch (error) {
        console.error('Error updating user count:', error);
    }
}

// ================================================
// Scroll Handling
// ================================================
function setupScrollHandler() {
    const container = document.getElementById('messagesContainer');
    
    container.addEventListener('scroll', () => {
        const { scrollTop, scrollHeight, clientHeight } = container;
        ChatState.isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
        
        const scrollBtn = document.getElementById('scrollBtn');
        scrollBtn.classList.toggle('show', !ChatState.isAtBottom);
    });
}

function scrollToBottom(smooth = true) {
    const container = document.getElementById('messagesContainer');
    container.scrollTo({
        top: container.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
    });
    ChatState.isAtBottom = true;
    ChatState.unreadCount = 0;
    updateUnreadBadge();
}

function updateUnreadBadge() {
    const badge = document.getElementById('newMessagesBadge');
    if (ChatState.unreadCount > 0) {
        badge.textContent = ChatState.unreadCount;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

// ================================================
// Notifications
// ================================================
function showToast(message, icon = '📬', duration = 3000, isHtml = false) {
    const toast = document.getElementById('notificationToast');
    document.getElementById('toastIcon').textContent = isHtml ? '' : icon;
    document.getElementById('toastMessage').innerHTML = isHtml ? message : escapeHtml(message);
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

function notifyMention(msg) {
    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Ti hanno menzionato!', {
            body: `${msg.user?.nome_visualizzato}: ${truncateText(msg.content, 50)}`,
            icon: '💬'
        });
    }
}

// Request notification permission
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}

// ================================================
// Utility Functions
// ================================================
function stringToColor(str) {
    if (!str) return AVATAR_COLORS[0];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatTime(date) {
    return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

function formatDateLabel(date) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
        return 'Oggi';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Ieri';
    } else {
        return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' });
    }
}

function formatMessageText(text) {
    if (!text) return '';
    
    // Escape HTML first
    let formatted = escapeHtml(text);
    
    // Convert mentions
    formatted = formatted.replace(/@(\w+)/g, (match, username) => {
        const isSelf = ChatState.currentProfile?.username?.toLowerCase() === username.toLowerCase();
        return `<span class="mention ${isSelf ? 'mention-self' : ''}">${match}</span>`;
    });
    
    // Convert URLs to links
    formatted = formatted.replace(
        /(https?:\/\/[^\s]+)/g,
        '<a href="$1" target="_blank" rel="noopener" style="color: #3b82f6;">$1</a>'
    );
    
    // Convert newlines
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text || '';
    return text.substring(0, maxLength) + '...';
}

// ================================================
// Global Export (for onclick handlers)
// ================================================
window.sendMessage = sendMessage;
window.toggleEmojiPicker = toggleEmojiPicker;
window.insertEmoji = insertEmoji;
window.insertMention = insertMention;
window.toggleSidebar = toggleSidebar;
window.selectRoom = selectRoom;
window.openSearch = openSearch;
window.closeSearch = closeSearch;
window.handleSearch = handleSearch;
window.scrollToMessage = scrollToMessage;
window.togglePinned = togglePinned;
window.toggleMediaPicker = toggleMediaPicker;
window.selectMediaTab = selectMediaTab;
window.attachImage = attachImage;
window.scrollToBottom = scrollToBottom;
window.handleMessageClick = handleMessageClick;
window.handleMessageLongPress = handleMessageLongPress;
window.replyToMessage = replyToMessage;
window.cancelReply = cancelReply;
window.copyMessage = copyMessage;
window.deleteCurrentMessage = deleteCurrentMessage;
window.editCurrentMessage = editCurrentMessage;
window.reactToMessage = reactToMessage;
window.forwardMessage = forwardMessage;
window.addReaction = addReaction;
window.toggleReaction = toggleReaction;

// ================================================
// ADDITIONAL CHAT FEATURES (35+ more features)
// ================================================

// Feature 26: Message status (sent, delivered, read)
function updateMessageStatus(messageId, status) {
    const statusIcon = {
        sent: '✓',
        delivered: '✓✓',
        read: '✓✓' // Could be colored blue
    };
    
    const msg = document.querySelector(`[data-message-id="${messageId}"] .bubble-status`);
    if (msg) {
        msg.textContent = statusIcon[status] || '✓';
        if (status === 'read') {
            msg.style.color = '#3b82f6';
        }
    }
}

// Feature 27: User status (online/offline/away)
function updateUserStatus(userId, status) {
    const statusColors = {
        online: '#22c55e',
        away: '#f59e0b',
        offline: '#94a3b8'
    };
    
    // Update in sidebar or wherever user avatars are shown
    const userAvatars = document.querySelectorAll(`[data-user-id="${userId}"] .status-dot`);
    userAvatars.forEach(dot => {
        dot.style.backgroundColor = statusColors[status] || statusColors.offline;
    });
}

// Feature 28: Typing indicator broadcast
let typingBroadcastTimeout = null;

function broadcastTyping() {
    if (typingBroadcastTimeout) return;
    
    // In a real app, this would send to the server
    typingBroadcastTimeout = setTimeout(() => {
        typingBroadcastTimeout = null;
    }, 2000);
    
    // Show typing indicator for current user (for demo)
    showTypingIndicator(ChatState.currentProfile?.nome_visualizzato || 'Tu');
}

function showTypingIndicator(username) {
    const indicator = document.getElementById('typingIndicator');
    const typingUsers = document.getElementById('typingUsers');
    
    if (indicator && typingUsers) {
        typingUsers.textContent = `${username} sta scrivendo...`;
        indicator.classList.add('show');
        
        setTimeout(() => {
            indicator.classList.remove('show');
        }, 3000);
    }
}

// Feature 29: Double tap to like
let lastTapTime = 0;

function handleDoubleTap(messageId) {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTapTime;
    
    if (tapLength < 300 && tapLength > 0) {
        // Double tap detected
        addReaction(messageId, '❤️');
        showHeartAnimation();
    }
    
    lastTapTime = currentTime;
}

function showHeartAnimation() {
    const heart = document.createElement('div');
    heart.className = 'heart-animation';
    heart.textContent = '❤️';
    document.body.appendChild(heart);
    
    setTimeout(() => heart.remove(), 1000);
}

// Feature 30: Swipe to reply (mobile)
let touchStartX = 0;
let touchStartY = 0;
let swipingMessageId = null;

function initSwipeToReply() {
    const container = document.getElementById('messagesContainer');
    if (!container) return;
    
    container.addEventListener('touchstart', (e) => {
        const bubble = e.target.closest('.message-bubble');
        if (bubble) {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            swipingMessageId = bubble.dataset.messageId;
        }
    }, { passive: true });
    
    container.addEventListener('touchmove', (e) => {
        if (!swipingMessageId) return;
        
        const touchX = e.touches[0].clientX;
        const touchY = e.touches[0].clientY;
        const diffX = touchX - touchStartX;
        const diffY = Math.abs(touchY - touchStartY);
        
        // Only horizontal swipes
        if (diffX > 50 && diffY < 30) {
            const bubble = document.querySelector(`[data-message-id="${swipingMessageId}"]`);
            if (bubble) {
                bubble.style.transform = `translateX(${Math.min(diffX - 50, 50)}px)`;
            }
        }
    }, { passive: true });
    
    container.addEventListener('touchend', (e) => {
        if (!swipingMessageId) return;
        
        const bubble = document.querySelector(`[data-message-id="${swipingMessageId}"]`);
        if (bubble) {
            const transform = bubble.style.transform;
            bubble.style.transform = '';
            
            if (transform && parseInt(transform.match(/\d+/)?.[0] || 0) >= 50) {
                // Trigger reply
                ChatState.selectedMessageId = swipingMessageId;
                replyToMessage();
            }
        }
        
        swipingMessageId = null;
    }, { passive: true });
}

// Feature 31: Message search with date filter
function searchMessagesWithFilter(query, dateFrom = null, dateTo = null) {
    let filtered = ChatState.messages.filter(m => 
        (m.content || '').toLowerCase().includes(query.toLowerCase())
    );
    
    if (dateFrom) {
        filtered = filtered.filter(m => new Date(m.created_at) >= new Date(dateFrom));
    }
    
    if (dateTo) {
        filtered = filtered.filter(m => new Date(m.created_at) <= new Date(dateTo));
    }
    
    return filtered;
}

// Feature 32: Pin message
async function pinMessage(messageId) {
    const msg = ChatState.messages.find(m => m.id === messageId);
    if (!msg) return;
    
    // In real app, would save to database
    const pinnedBanner = document.getElementById('pinnedBanner');
    const pinnedText = pinnedBanner.querySelector('.pinned-banner-text');
    
    if (pinnedText) {
        pinnedText.textContent = truncateText(msg.content, 50);
    }
    
    pinnedBanner.style.display = 'flex';
    showToast('Messaggio fissato! 📌', '📌');
}

// Feature 33: Quote message (different from reply)
function quoteMessage() {
    const msg = ChatState.messages.find(m => m.id === ChatState.selectedMessageId);
    if (!msg) return;
    
    const input = document.getElementById('messageInput');
    const author = msg.user?.nome_visualizzato || 'Utente';
    const text = truncateText(msg.content || '', 50);
    
    input.value = `"${text}" - ${author}\n\n`;
    input.focus();
    
    closeActionsMenu();
}

// Feature 34: Schedule message (UI only)
function scheduleMessage() {
    showToast('Programmazione messaggi in arrivo! ⏰', '⏰');
    closeActionsMenu();
}

// Feature 35: Save message to favorites
function saveToFavorites() {
    const msg = ChatState.messages.find(m => m.id === ChatState.selectedMessageId);
    if (!msg) return;
    
    const favorites = JSON.parse(localStorage.getItem('chatFavorites') || '[]');
    
    if (favorites.some(f => f.id === msg.id)) {
        showToast('Già nei preferiti', 'info');
    } else {
        favorites.push({
            id: msg.id,
            content: msg.content,
            author: msg.user?.nome_visualizzato,
            savedAt: new Date().toISOString()
        });
        localStorage.setItem('chatFavorites', JSON.stringify(favorites));
        showToast('Aggiunto ai preferiti! ⭐', '⭐');
    }
    
    closeActionsMenu();
}

// Feature 36: Clear chat history (local only)
function clearChatHistory() {
    if (!confirm('Vuoi cancellare la cronologia chat locale? I messaggi resteranno visibili agli altri.')) {
        return;
    }
    
    ChatState.messages = [];
    renderMessages();
    showToast('Cronologia locale cancellata', 'info');
}

// Feature 37: Export chat
function exportChat() {
    const chatData = ChatState.messages.map(m => ({
        author: m.user?.nome_visualizzato || 'Utente',
        message: m.content,
        time: new Date(m.created_at).toLocaleString('it-IT')
    }));
    
    const text = chatData.map(m => `[${m.time}] ${m.author}: ${m.message}`).join('\n');
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-export-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('Chat esportata! 📥', '📥');
}

// Feature 38: Message translate (placeholder)
function translateMessage() {
    showToast('Traduzione in arrivo! 🌍', '🌍');
    closeActionsMenu();
}

// Feature 39: Report message - now saves to database
async function reportMessage() {
    if (!ChatState.selectedMessageId) return;
    
    const reasons = [
        'Contenuto inappropriato',
        'Spam o pubblicità',
        'Linguaggio offensivo',
        'Molestie o bullismo',
        'Contenuto pericoloso',
        'Altro'
    ];
    
    const reasonIndex = prompt(
        'Seleziona il motivo della segnalazione (1-6):\n' +
        reasons.map((r, i) => `${i + 1}. ${r}`).join('\n')
    );
    
    const idx = parseInt(reasonIndex) - 1;
    if (isNaN(idx) || idx < 0 || idx >= reasons.length) {
        closeActionsMenu();
        return;
    }
    
    const reason = reasons[idx];
    const description = prompt('Descrivi il problema (opzionale):');
    
    try {
        // Get current user
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) {
            showToast('Devi essere loggato per segnalare', '❌');
            closeActionsMenu();
            return;
        }
        
        // Save report to database
        const { error } = await window.supabaseClient
            .from('content_reports')
            .insert({
                reported_by: user.id,
                content_type: 'message',
                content_id: ChatState.selectedMessageId,
                reason: reason,
                description: description || null,
                status: 'pending'
            });
        
        if (error) {
            if (error.code === '23505') {
                showToast('Hai già segnalato questo messaggio', '⚠️');
            } else {
                console.error('Report error:', error);
                showToast('Errore nella segnalazione', '❌');
            }
        } else {
            showToast('Messaggio segnalato. Grazie! 🚩', '🚩');
        }
    } catch (error) {
        console.error('Report error:', error);
        showToast('Errore nella segnalazione', '❌');
    }
    
    closeActionsMenu();
}

// Feature 40: Message info (who read it, etc)
function showMessageInfo() {
    const msg = ChatState.messages.find(m => m.id === ChatState.selectedMessageId);
    if (!msg) return;
    
    const info = `
        📝 Inviato: ${new Date(msg.created_at).toLocaleString('it-IT')}
        ${msg.edited_at ? `✏️ Modificato: ${new Date(msg.edited_at).toLocaleString('it-IT')}` : ''}
        👤 Autore: ${msg.user?.nome_visualizzato || 'Anonimo'}
    `.trim();
    
    showToast(info.replace(/\n/g, '<br>'), 'ℹ️', 5000, true);
    closeActionsMenu();
}

// Feature 41: Voice message placeholder
function startVoiceMessage() {
    showToast('Messaggi vocali in arrivo! 🎤', '🎤');
}

// Feature 42: GIF search (placeholder)
function searchGifs(query) {
    // In real app, would call GIPHY/Tenor API
    showToast('Ricerca GIF in arrivo! 🎬', '🎬');
}

// Feature 43: Sticker packs (placeholder)
function showStickerPacks() {
    showToast('Pacchetti sticker in arrivo! 🎨', '🎨');
}

// Feature 44: Chat themes
const chatThemes = {
    default: { bg: '#f8fafc', primary: '#0033A0', bubble: '#0033A0' },
    dark: { bg: '#1e293b', primary: '#3b82f6', bubble: '#475569' },
    ocean: { bg: '#e0f2fe', primary: '#0284c7', bubble: '#0284c7' },
    forest: { bg: '#dcfce7', primary: '#15803d', bubble: '#15803d' },
    sunset: { bg: '#fef3c7', primary: '#ea580c', bubble: '#ea580c' },
    purple: { bg: '#f3e8ff', primary: '#7c3aed', bubble: '#7c3aed' }
};

function setChatTheme(themeName) {
    const theme = chatThemes[themeName] || chatThemes.default;
    const app = document.getElementById('chatApp');
    
    if (app) {
        app.style.setProperty('--chat-bg', theme.bg);
        app.style.setProperty('--primary', theme.primary);
        app.style.setProperty('--bubble-own', theme.bubble);
    }
    
    localStorage.setItem('chatTheme', themeName);
    showToast(`Tema applicato: ${themeName}`, '🎨');
}

// Feature 45: Message scheduling (UI)
function showScheduleOptions() {
    const options = ['Tra 1 ora', 'Domani mattina', 'Data personalizzata'];
    showToast('Programmazione: ' + options.join(', '), '⏰', 3000);
}

// Feature 46: Quick reactions bar
function showQuickReactions(messageId) {
    // Validate messageId to prevent XSS
    if (!messageId || typeof messageId !== 'string') return;
    const safeMessageId = messageId.replace(/[^a-zA-Z0-9-_]/g, '');
    
    const reactions = ['👍', '❤️', '😂', '😮', '🎉', '🔥'];
    const bar = document.createElement('div');
    bar.className = 'quick-reactions-bar';
    
    // Create buttons safely with event listeners
    reactions.forEach(reaction => {
        const btn = document.createElement('button');
        btn.className = 'quick-reaction';
        btn.textContent = reaction;
        btn.addEventListener('click', () => {
            addReaction(safeMessageId, reaction);
            bar.remove();
        });
        bar.appendChild(btn);
    });
    
    const bubble = document.querySelector(`[data-message-id="${CSS.escape(safeMessageId)}"]`);
    if (bubble) {
        bubble.appendChild(bar);
        setTimeout(() => bar.remove(), 5000);
    }
}

// Feature 47: Mute conversation
let isMuted = false;

function toggleMute() {
    isMuted = !isMuted;
    showToast(isMuted ? 'Notifiche disattivate 🔇' : 'Notifiche attivate 🔔', isMuted ? '🔇' : '🔔');
}

// Feature 48: Chat sound effects
function playChatSound(type) {
    // In real app, would play actual sounds
    const sounds = {
        send: '🔊 whoosh',
        receive: '🔔 ding',
        mention: '📣 alert'
    };
    console.log('Sound:', sounds[type] || 'unknown');
}

// Feature 49: Auto-scroll toggle
let autoScrollEnabled = true;

function toggleAutoScroll() {
    autoScrollEnabled = !autoScrollEnabled;
    showToast(autoScrollEnabled ? 'Auto-scroll attivato' : 'Auto-scroll disattivato', 'ℹ️');
}

// Feature 50: Message timestamps toggle
let showTimestamps = true;

function toggleTimestamps() {
    showTimestamps = !showTimestamps;
    document.querySelectorAll('.bubble-time').forEach(el => {
        el.style.display = showTimestamps ? '' : 'none';
    });
    showToast(showTimestamps ? 'Orari visibili' : 'Orari nascosti', 'ℹ️');
}

// Feature 51: Compact mode
let compactMode = false;

function toggleCompactMode() {
    compactMode = !compactMode;
    document.getElementById('chatApp')?.classList.toggle('compact-mode', compactMode);
    showToast(compactMode ? 'Modalità compatta' : 'Modalità normale', 'ℹ️');
}

// Feature 52: Jump to date
function jumpToDate(date) {
    const dateStr = new Date(date).toDateString();
    const msg = ChatState.messages.find(m => 
        new Date(m.created_at).toDateString() === dateStr
    );
    
    if (msg) {
        scrollToMessage(msg.id);
    } else {
        showToast('Nessun messaggio in questa data', 'info');
    }
}

// Feature 53: Unread counter
function getUnreadCount() {
    return ChatState.unreadCount;
}

function markAllAsRead() {
    ChatState.unreadCount = 0;
    updateUnreadBadge();
    showToast('Tutti i messaggi letti ✓', '✓');
}

// Feature 54: Message highlight effect
function highlightMessage(messageId) {
    const el = document.querySelector(`[data-message-id="${messageId}"]`);
    if (el) {
        el.classList.add('highlighted');
        setTimeout(() => el.classList.remove('highlighted'), 3000);
    }
}

// Feature 55: Share location (placeholder)
function shareLocation() {
    if (navigator.geolocation) {
        showToast('Condivisione posizione in arrivo! 📍', '📍');
    } else {
        showToast('Geolocalizzazione non supportata', 'error');
    }
}

// Feature 56: Contact card sharing (placeholder)
function shareContact() {
    showToast('Condivisione contatti in arrivo! 👤', '👤');
}

// Feature 57: Disappearing messages toggle (placeholder)
function toggleDisappearingMessages() {
    showToast('Messaggi effimeri in arrivo! ⏱️', '⏱️');
}

// Feature 58: Message read receipts toggle
let showReadReceipts = true;

function toggleReadReceipts() {
    showReadReceipts = !showReadReceipts;
    showToast(showReadReceipts ? 'Conferme di lettura attive' : 'Conferme di lettura disattivate', 'ℹ️');
}

// Feature 59: Link preview toggle
let showLinkPreviews = true;

function toggleLinkPreviews() {
    showLinkPreviews = !showLinkPreviews;
    showToast(showLinkPreviews ? 'Anteprime link attive' : 'Anteprime link disattivate', 'ℹ️');
}

// Feature 60: Media auto-download toggle
let autoDownloadMedia = true;

function toggleAutoDownload() {
    autoDownloadMedia = !autoDownloadMedia;
    showToast(autoDownloadMedia ? 'Download automatico attivo' : 'Download automatico disattivato', 'ℹ️');
}

// Initialize additional features
function initAdditionalFeatures() {
    initSwipeToReply();
    
    // Load saved theme
    const savedTheme = localStorage.getItem('chatTheme');
    if (savedTheme) {
        setChatTheme(savedTheme);
    }
    
    // Add double tap listener to messages
    document.getElementById('messagesContainer')?.addEventListener('click', (e) => {
        const bubble = e.target.closest('.message-bubble');
        if (bubble) {
            handleDoubleTap(bubble.dataset.messageId);
        }
    });
}

// Call init after main initialization
setTimeout(initAdditionalFeatures, 500);

// Export additional functions
window.pinMessage = pinMessage;
window.quoteMessage = quoteMessage;
window.scheduleMessage = scheduleMessage;
window.saveToFavorites = saveToFavorites;
window.clearChatHistory = clearChatHistory;
window.exportChat = exportChat;
window.translateMessage = translateMessage;
window.reportMessage = reportMessage;
window.showMessageInfo = showMessageInfo;
window.startVoiceMessage = startVoiceMessage;
window.searchGifs = searchGifs;
window.showStickerPacks = showStickerPacks;
window.setChatTheme = setChatTheme;
window.showQuickReactions = showQuickReactions;
window.toggleMute = toggleMute;
window.toggleAutoScroll = toggleAutoScroll;
window.toggleTimestamps = toggleTimestamps;
window.toggleCompactMode = toggleCompactMode;
window.jumpToDate = jumpToDate;
window.markAllAsRead = markAllAsRead;
window.highlightMessage = highlightMessage;
window.shareLocation = shareLocation;
window.shareContact = shareContact;
window.toggleDisappearingMessages = toggleDisappearingMessages;
window.toggleReadReceipts = toggleReadReceipts;
window.toggleLinkPreviews = toggleLinkPreviews;
window.toggleAutoDownload = toggleAutoDownload;
