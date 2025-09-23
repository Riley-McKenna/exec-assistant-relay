// Global variables
let apiKey = '';
let chatHistory = [];

// DOM elements
const apiKeyInput = document.getElementById('apiKey');
const saveKeyButton = document.getElementById('saveKey');
const keyStatus = document.getElementById('keyStatus');
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Load saved API key
    const savedKey = localStorage.getItem('openai_api_key');
    if (savedKey) {
        apiKey = savedKey;
        updateKeyStatus('API Key loaded', 'success');
        enableChat();
    }

    // Add event listeners
    messageInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Focus on message input if API key is set
    if (apiKey) {
        messageInput.focus();
    } else {
        apiKeyInput.focus();
    }
});

function saveApiKey() {
    const key = apiKeyInput.value.trim();
    if (!key) {
        updateKeyStatus('Please enter an API key', 'error');
        return;
    }

    if (!key.startsWith('sk-')) {
        updateKeyStatus('Invalid API key format', 'error');
        return;
    }

    apiKey = key;
    localStorage.setItem('openai_api_key', key);
    apiKeyInput.value = '';
    updateKeyStatus('API Key saved successfully!', 'success');
    enableChat();
    messageInput.focus();
}

function updateKeyStatus(message, type) {
    keyStatus.textContent = message;
    keyStatus.className = `status ${type}`;
    
    if (type === 'success') {
        setTimeout(() => {
            keyStatus.textContent = '';
            keyStatus.className = 'status';
        }, 3000);
    }
}

function enableChat() {
    sendButton.disabled = false;
    messageInput.disabled = false;
    messageInput.placeholder = 'Type your message here...';
}

function addMessage(content, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const senderDiv = document.createElement('div');
    senderDiv.className = 'message-sender';
    senderDiv.textContent = sender === 'user' ? 'You' : 'ChatGPT';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = content;
    
    messageDiv.appendChild(senderDiv);
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addLoadingMessage() {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message assistant';
    messageDiv.id = 'loading-message';
    
    const senderDiv = document.createElement('div');
    senderDiv.className = 'message-sender';
    senderDiv.textContent = 'ChatGPT';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content loading';
    contentDiv.textContent = 'Thinking...';
    
    messageDiv.appendChild(senderDiv);
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeLoadingMessage() {
    const loadingMessage = document.getElementById('loading-message');
    if (loadingMessage) {
        loadingMessage.remove();
    }
}

async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message || !apiKey) return;

    // Disable send button and clear input
    sendButton.disabled = true;
    const originalMessage = message;
    messageInput.value = '';

    // Add user message to chat
    addMessage(originalMessage, 'user');
    chatHistory.push({ role: 'user', content: originalMessage });

    // Show loading indicator
    addLoadingMessage();

    try {
        // Call our backend endpoint which will handle the OpenAI API call
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: chatHistory,
                apiKey: apiKey
            })
        });

        const data = await response.json();
        
        // Remove loading message
        removeLoadingMessage();

        if (data.error) {
            addMessage(`Error: ${data.error}`, 'assistant');
        } else if (data.content) {
            addMessage(data.content, 'assistant');
            chatHistory.push({ role: 'assistant', content: data.content });
        } else {
            addMessage('Sorry, I received an unexpected response.', 'assistant');
        }

    } catch (error) {
        removeLoadingMessage();
        addMessage(`Connection error: ${error.message}`, 'assistant');
        console.error('Error:', error);
    }

    // Re-enable send button
    sendButton.disabled = false;
    messageInput.focus();
}

// Clear chat function (can be called from console)
function clearChat() {
    chatHistory = [];
    chatMessages.innerHTML = '';
    messageInput.focus();
}