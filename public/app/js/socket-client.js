/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MASHRIQ SOCKET CLIENT
 * منصة مشرق - عميل WebSocket للرسائل الفورية
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This client provides real-time WebSocket functionality for:
 * - Instant message delivery (no more polling!)
 * - Typing indicators
 * - Online status
 * - Read receipts
 * - Notifications
 * 
 * USAGE:
 * 1. Include socket.io-client from CDN
 * 2. Include this file
 * 3. Call MashriqSocket.connect() after user is authenticated
 * 4. Subscribe to events as needed
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

const MashriqSocket = (function() {
    'use strict';
    
    // ─────────────────────────────────────────────────────────────────────────
    // Configuration
    // ─────────────────────────────────────────────────────────────────────────
    
    const config = {
        // Will auto-detect server URL
        serverUrl: window.location.origin,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        debug: true
    };
    
    // ─────────────────────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────────────────────
    
    let socket = null;
    let isConnected = false;
    let currentChatId = null;
    let eventListeners = {};
    
    // ─────────────────────────────────────────────────────────────────────────
    // Logging
    // ─────────────────────────────────────────────────────────────────────────
    
    function log(message, ...args) {
        if (config.debug) {
            console.log(`🔌 [Socket] ${message}`, ...args);
        }
    }
    
    function logError(message, ...args) {
        console.error(`🔌 [Socket Error] ${message}`, ...args);
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Connection Management
    // ─────────────────────────────────────────────────────────────────────────
    
    /**
     * Connect to the WebSocket server.
     * Requires user to be authenticated (token in localStorage).
     * 
     * @returns {Promise<boolean>} Connection success status
     */
    function connect() {
        return new Promise((resolve, reject) => {
            // Check if socket.io client is loaded
            if (typeof io === 'undefined') {
                logError('Socket.IO client not loaded! Include the CDN script first.');
                reject(new Error('Socket.IO not available'));
                return;
            }
            
            // Get auth token
            let token = null;
            try {
                const userData = localStorage.getItem('userData');
                if (userData) {
                    const parsed = JSON.parse(userData);
                    token = parsed.token;
                }
            } catch (e) {
                logError('Failed to get auth token:', e);
            }
            
            if (!token) {
                log('No auth token found, socket will not connect');
                reject(new Error('No auth token'));
                return;
            }
            
            // Already connected?
            if (socket && isConnected) {
                log('Already connected');
                resolve(true);
                return;
            }
            
            // Disconnect existing socket if any
            if (socket) {
                socket.disconnect();
            }
            
            // Create new connection
            log('Connecting to server...');
            
            socket = io(config.serverUrl, {
                auth: { token },
                reconnection: true,
                reconnectionAttempts: config.reconnectionAttempts,
                reconnectionDelay: config.reconnectionDelay,
                transports: ['websocket', 'polling']
            });
            
            // Connection events
            socket.on('connect', () => {
                isConnected = true;
                log('Connected! Socket ID:', socket.id);
                emit('connected', { socketId: socket.id });
                resolve(true);
            });
            
            socket.on('disconnect', (reason) => {
                isConnected = false;
                log('Disconnected:', reason);
                emit('disconnected', { reason });
            });
            
            socket.on('connect_error', (error) => {
                logError('Connection error:', error.message);
                emit('error', { message: error.message });
                if (!isConnected) {
                    reject(error);
                }
            });
            
            socket.on('error', (error) => {
                logError('Socket error:', error);
                emit('error', error);
            });
            
            // ─────────────────────────────────────────────────────────────
            // CHAT EVENTS
            // ─────────────────────────────────────────────────────────────
            
            // New message received
            socket.on('chat:new-message', (data) => {
                log('New message received:', data);
                emit('message', data);
            });
            
            // User started typing
            socket.on('chat:typing', (data) => {
                emit('typing', data);
            });
            
            // User stopped typing
            socket.on('chat:typing-stopped', (data) => {
                emit('typing-stopped', data);
            });
            
            // User came online in chat
            socket.on('chat:user-online', (data) => {
                log('User online:', data);
                emit('user-online', data);
            });
            
            // User went offline from chat
            socket.on('chat:user-offline', (data) => {
                emit('user-offline', data);
            });
            
            // Messages marked as read
            socket.on('chat:messages-read', (data) => {
                emit('messages-read', data);
            });
            
            // ─────────────────────────────────────────────────────────────
            // NOTIFICATION EVENTS
            // ─────────────────────────────────────────────────────────────
            
            socket.on('notification', (notification) => {
                log('Notification received:', notification);
                emit('notification', notification);
            });
            
            socket.on('unread-count-update', (data) => {
                emit('unread-count', data);
            });
        });
    }
    
    /**
     * Disconnect from the server.
     */
    function disconnect() {
        if (socket) {
            log('Disconnecting...');
            socket.disconnect();
            socket = null;
            isConnected = false;
        }
    }
    
    /**
     * Check if connected.
     * 
     * @returns {boolean}
     */
    function isSocketConnected() {
        return isConnected && socket !== null;
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Chat Functions
    // ─────────────────────────────────────────────────────────────────────────
    
    /**
     * Join a chat room to receive messages.
     * 
     * @param {string} chatId - The chat ID to join
     */
    function joinChat(chatId) {
        if (!socket || !isConnected) {
            logError('Cannot join chat: not connected');
            return;
        }
        
        // Leave current chat if any
        if (currentChatId && currentChatId !== chatId) {
            leaveChat();
        }
        
        currentChatId = chatId;
        socket.emit('chat:join', chatId);
        log('Joined chat:', chatId);
    }
    
    /**
     * Leave the current chat room.
     */
    function leaveChat() {
        if (!socket || !currentChatId) return;
        
        socket.emit('chat:leave', currentChatId);
        log('Left chat:', currentChatId);
        currentChatId = null;
    }
    
    /**
     * Send typing indicator - started typing.
     */
    function startTyping() {
        if (!socket || !currentChatId) return;
        socket.emit('chat:typing-start', currentChatId);
    }
    
    /**
     * Send typing indicator - stopped typing.
     */
    function stopTyping() {
        if (!socket || !currentChatId) return;
        socket.emit('chat:typing-stop', currentChatId);
    }
    
    /**
     * Mark messages as read.
     */
    function markAsRead() {
        if (!socket || !currentChatId) return;
        socket.emit('chat:mark-read', currentChatId);
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Event System
    // ─────────────────────────────────────────────────────────────────────────
    
    /**
     * Subscribe to an event.
     * 
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    function on(event, callback) {
        if (!eventListeners[event]) {
            eventListeners[event] = [];
        }
        eventListeners[event].push(callback);
        
        // Return unsubscribe function
        return () => {
            off(event, callback);
        };
    }
    
    /**
     * Unsubscribe from an event.
     * 
     * @param {string} event - Event name
     * @param {Function} callback - Callback to remove
     */
    function off(event, callback) {
        if (!eventListeners[event]) return;
        
        const index = eventListeners[event].indexOf(callback);
        if (index > -1) {
            eventListeners[event].splice(index, 1);
        }
    }
    
    /**
     * Emit an event to listeners.
     * 
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    function emit(event, data) {
        if (!eventListeners[event]) return;
        
        eventListeners[event].forEach(callback => {
            try {
                callback(data);
            } catch (err) {
                logError(`Error in event listener for "${event}":`, err);
            }
        });
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────────────────────────────────
    
    return {
        // Connection
        connect,
        disconnect,
        isConnected: isSocketConnected,
        
        // Chat
        joinChat,
        leaveChat,
        startTyping,
        stopTyping,
        markAsRead,
        
        // Events
        on,
        off,
        
        // Get current socket (for advanced use)
        getSocket: () => socket
    };
    
})();

// Auto-connect when DOM is ready if user is authenticated
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const userData = localStorage.getItem('userData');
    if (userData) {
        // Delay connection slightly to allow page to initialize
        setTimeout(() => {
            MashriqSocket.connect().then(() => {
                console.log('🟢 Real-time messaging activated');
            }).catch(err => {
                console.log('🔴 Real-time messaging not available:', err.message);
            });
        }, 500);
    }
});
