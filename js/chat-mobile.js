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
    lastMessageId: null,
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
        
        console.log('✅ Chat initialized successfully!');
        
    } catch (error) {
        console.error('❌ Chat initialization error:', error);
        showToast('Errore nel caricamento della chat', '❌');
    }
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
        const { data: messages, error } = await window.supabaseClient
            .from('chat_messages')
            .select(`
                *,
                user:profili_utenti!fk_chat_messages_user(username, nome_visualizzato)
            `)
            .eq('is_deleted', false)
            .order('created_at', { ascending: true })
            .limit(100);
        
        if (error) throw error;
        
        ChatState.messages = messages || [];
        renderMessages();
        
        if (messages && messages.length > 0) {
            ChatState.lastMessageId = messages[messages.length - 1].id;
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
            message_type: 'text'
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
        
        // Add message to state and render
        ChatState.messages.push(data);
        ChatState.lastMessageId = data.id;
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
    
    navigator.clipboard.writeText(msg.content || '').then(() => {
        showToast('Messaggio copiato!', '📋');
    });
    closeActionsMenu();
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
    ChatState.currentRoom = roomId;
    document.querySelectorAll('.room-item').forEach(item => {
        item.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    toggleSidebar();
    showToast(`Stanza: ${roomId}`, '💬');
    // In a full implementation, would load messages for the selected room
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
    if (!ChatState.lastMessageId) return;
    
    try {
        const { data: newMessages } = await window.supabaseClient
            .from('chat_messages')
            .select(`
                *,
                user:profili_utenti!fk_chat_messages_user(username, nome_visualizzato)
            `)
            .eq('is_deleted', false)
            .gt('id', ChatState.lastMessageId)
            .order('created_at', { ascending: true });
        
        if (newMessages && newMessages.length > 0) {
            newMessages.forEach(msg => {
                ChatState.messages.push(msg);
                ChatState.lastMessageId = msg.id;
                
                // Notify if mentioned
                if (checkIfMentioned(msg.content) && msg.user_id !== ChatState.currentUser?.id) {
                    showToast(`${msg.user?.nome_visualizzato || 'Qualcuno'} ti ha menzionato!`, '🔔');
                    notifyMention(msg);
                }
            });
            
            renderMessages();
            
            if (ChatState.isAtBottom) {
                scrollToBottom(true);
            } else {
                ChatState.unreadCount += newMessages.length;
                updateUnreadBadge();
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
