// ================================================
// Chat System
// ================================================

// Sample chat messages
const chatMessages = [
    {
        id: '1',
        author: 'Mario Rossi',
        user_id: '1',
        message: 'Ciao a tutti! Come va?',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        reactions: { '👍': 5, '❤️': 3 }
    },
    {
        id: '2',
        author: 'Anna Bianchi',
        user_id: '2',
        message: 'Tutto bene! Qualcuno ha visto il nuovo articolo sulla gita?',
        timestamp: new Date(Date.now() - 3000000).toISOString(),
        reactions: { '🔥': 2 }
    },
    {
        id: '3',
        author: 'Luca Verdi',
        user_id: '3',
        message: 'Sì! Bellissimo, non vedo l\'ora di partire!',
        timestamp: new Date(Date.now() - 2400000).toISOString(),
        reactions: { '😍': 4, '🎉': 2 }
    },
    {
        id: '4',
        author: 'Sofia Neri',
        user_id: '4',
        message: 'Qualcuno interessato al laboratorio di coding?',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        reactions: { '💻': 6, '👍': 3 }
    }
];

// ================================================
// Load Chat Messages
// ================================================
function loadChatMessages() {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    
    // Load messages from localStorage or use sample
    let messages = JSON.parse(localStorage.getItem('chatMessages') || 'null');
    if (!messages) {
        messages = chatMessages;
        localStorage.setItem('chatMessages', JSON.stringify(messages));
    }
    
    // Keep pinned message and clear the rest
    const pinnedMsg = container.querySelector('.pinned-messages');
    container.innerHTML = '';
    if (pinnedMsg) {
        container.appendChild(pinnedMsg);
    }
    
    // Add messages
    messages.forEach(msg => {
        const messageEl = createMessageElement(msg);
        container.appendChild(messageEl);
    });
    
    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

// ================================================
// Create Message Element
// ================================================
function createMessageElement(msg) {
    const div = document.createElement('div');
    div.className = 'message fade-in';
    div.dataset.messageId = msg.id;
    
    const initial = msg.author.charAt(0).toUpperCase();
    const timeAgo = formatTimeAgo(new Date(msg.timestamp));
    
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
                <span class="message-author">${msg.author}</span>
                <span class="message-time">${timeAgo}</span>
            </div>
            <div class="message-text">${escapeHTML(msg.message)}</div>
            ${reactionsHTML}
        </div>
    `;
    
    return div;
}

// ================================================
// Send Message
// ================================================
function sendMessage(message) {
    if (!message.trim()) return;
    
    // Check if user is authenticated
    if (!window.AppState || !window.AppState.isAuthenticated) {
        alert('Devi effettuare il login per inviare messaggi!');
        window.location.href = 'login.html?redirect=chat.html';
        return;
    }
    
    const newMessage = {
        id: window.generateUUID(),
        author: window.AppState.user.name || 'Utente',
        user_id: window.AppState.user.id,
        message: message,
        timestamp: new Date().toISOString(),
        reactions: {}
    };
    
    // Add to messages
    let messages = JSON.parse(localStorage.getItem('chatMessages') || '[]');
    messages.push(newMessage);
    localStorage.setItem('chatMessages', JSON.stringify(messages));
    
    // Add to UI
    const container = document.getElementById('chatMessages');
    if (container) {
        const messageEl = createMessageElement(newMessage);
        container.appendChild(messageEl);
        container.scrollTop = container.scrollHeight;
    }
    
    // Clear input
    const input = document.getElementById('chatInput');
    if (input) {
        input.value = '';
    }
}

// ================================================
// Toggle Reaction
// ================================================
function toggleReaction(messageId, emoji) {
    let messages = JSON.parse(localStorage.getItem('chatMessages') || '[]');
    const message = messages.find(m => m.id === messageId);
    
    if (message) {
        if (!message.reactions) {
            message.reactions = {};
        }
        
        if (message.reactions[emoji]) {
            message.reactions[emoji]++;
        } else {
            message.reactions[emoji] = 1;
        }
        
        localStorage.setItem('chatMessages', JSON.stringify(messages));
        loadChatMessages();
    }
}

// ================================================
// Format Time Ago
// ================================================
function formatTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Adesso';
    if (diffMins < 60) return `${diffMins} min fa`;
    if (diffHours < 24) return `${diffHours} ore fa`;
    if (diffDays < 7) return `${diffDays} giorni fa`;
    
    return date.toLocaleDateString('it-IT');
}

// ================================================
// Escape HTML
// ================================================
function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ================================================
// Typing Indicator
// ================================================
let typingTimeout;
function showTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.classList.remove('hidden');
        
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            indicator.classList.add('hidden');
        }, 3000);
    }
}

// ================================================
// Initialize Chat
// ================================================
document.addEventListener('DOMContentLoaded', () => {
    // Load messages
    loadChatMessages();
    
    // Setup send button
    const sendBtn = document.getElementById('sendBtn');
    const chatInput = document.getElementById('chatInput');
    
    if (sendBtn && chatInput) {
        sendBtn.addEventListener('click', () => {
            sendMessage(chatInput.value);
        });
        
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage(chatInput.value);
            }
        });
        
        // Typing indicator
        chatInput.addEventListener('input', () => {
            showTypingIndicator();
        });
    }
    
    // Update online count randomly
    const onlineCount = document.getElementById('onlineCount');
    if (onlineCount) {
        setInterval(() => {
            const count = Math.floor(Math.random() * 10) + 10;
            onlineCount.textContent = count;
        }, 10000);
    }
});

// ================================================
// Export Functions
// ================================================
window.sendMessage = sendMessage;
window.toggleReaction = toggleReaction;
window.loadChatMessages = loadChatMessages;

console.log('✅ Chat.js caricato con successo');
