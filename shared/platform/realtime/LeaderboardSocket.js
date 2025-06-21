/**
 * LeaderboardSocket.js - Real-time WebSocket Manager for Leaderboards
 * 
 * PHASE 2: REAL-TIME LEADERBOARD UPDATES
 * 
 * Features:
 * - WebSocket connection management
 * - Optimistic UI updates
 * - Conflict resolution for concurrent updates
 * - Event broadcasting system
 * - Automatic reconnection with exponential backoff
 * - Sub-100ms update latency target
 */

import { EventEmitter } from '../../utils/EventEmitter.js';

export class LeaderboardSocket extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            url: config.url || this.getWebSocketUrl(),
            autoReconnect: config.autoReconnect !== false,
            maxReconnectAttempts: config.maxReconnectAttempts || 10,
            reconnectDelay: config.reconnectDelay || 1000,
            heartbeatInterval: config.heartbeatInterval || 30000,
            enableOptimisticUpdates: config.enableOptimisticUpdates !== false,
            ...config
        };

        // Connection state
        this.socket = null;
        this.isConnected = false;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.lastPingTime = 0;
        this.latency = 0;

        // Subscription management
        this.subscriptions = new Map(); // tournamentId -> Set of callbacks
        this.pendingSubscriptions = new Set(); // tournaments to subscribe to on connect
        
        // Message queuing for offline support
        this.messageQueue = [];
        this.maxQueueSize = 100;
        
        // Optimistic updates
        this.optimisticUpdates = new Map(); // updateId -> update data
        this.updateCounter = 0;
        
        // Performance tracking
        this.metrics = {
            messagesReceived: 0,
            messagesSent: 0,
            reconnections: 0,
            averageLatency: 0,
            lastUpdate: Date.now()
        };
        
        // Timers
        this.heartbeatTimer = null;
        this.reconnectTimer = null;
        
        // Initialize connection
        this.connect();
    }

    /**
     * Get WebSocket URL based on environment
     */
    getWebSocketUrl() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.hostname === 'localhost' 
            ? 'localhost:8080' 
            : 'blockzone-realtime.hambomyers.workers.dev';
        
        return `${protocol}//${host}/ws/leaderboard`;
    }

    /**
     * Establish WebSocket connection
     */
    async connect() {
        if (this.isConnecting || this.isConnected) {
            return;
        }

        this.isConnecting = true;
        
        try {
            console.log('🔌 Connecting to leaderboard WebSocket:', this.config.url);
            
            this.socket = new WebSocket(this.config.url);
            
            // Set up event handlers
            this.socket.onopen = this.handleOpen.bind(this);
            this.socket.onmessage = this.handleMessage.bind(this);
            this.socket.onclose = this.handleClose.bind(this);
            this.socket.onerror = this.handleError.bind(this);
            
        } catch (error) {
            console.error('❌ Failed to create WebSocket connection:', error);
            this.isConnecting = false;
            this.scheduleReconnect();
        }
    }

    /**
     * Handle WebSocket connection opened
     */
    handleOpen(event) {
        console.log('✅ WebSocket connected to leaderboard service');
        
        this.isConnected = true;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        
        // Start heartbeat
        this.startHeartbeat();
        
        // Process pending subscriptions
        this.processPendingSubscriptions();
        
        // Send queued messages
        this.processMessageQueue();
        
        this.emit('connected', { latency: this.latency });
    }

    /**
     * Handle incoming WebSocket messages
     */
    handleMessage(event) {
        try {
            const message = JSON.parse(event.data);
            this.metrics.messagesReceived++;
            
            // Calculate latency for ping/pong
            if (message.type === 'pong') {
                this.latency = Date.now() - this.lastPingTime;
                this.metrics.averageLatency = (this.metrics.averageLatency + this.latency) / 2;
                return;
            }
            
            // Handle different message types
            switch (message.type) {
                case 'scoreUpdate':
                    this.handleScoreUpdateMessage(message);
                    break;
                    
                case 'rankingChange':
                    this.handleRankingChangeMessage(message);
                    break;
                    
                case 'tournamentUpdate':
                    this.handleTournamentUpdateMessage(message);
                    break;
                    
                case 'leaderboardSync':
                    this.handleLeaderboardSyncMessage(message);
                    break;
                    
                case 'optimisticConfirm':
                    this.handleOptimisticConfirm(message);
                    break;
                    
                case 'optimisticReject':
                    this.handleOptimisticReject(message);
                    break;
                    
                default:
                    console.warn('🤷 Unknown WebSocket message type:', message.type);
            }
            
        } catch (error) {
            console.error('❌ Failed to process WebSocket message:', error);
        }
    }

    /**
     * Handle WebSocket connection closed
     */
    handleClose(event) {
        console.log('🔌 WebSocket connection closed:', event.code, event.reason);
        
        this.isConnected = false;
        this.isConnecting = false;
        
        // Stop heartbeat
        this.stopHeartbeat();
        
        // Schedule reconnection if auto-reconnect is enabled
        if (this.config.autoReconnect && this.reconnectAttempts < this.config.maxReconnectAttempts) {
            this.scheduleReconnect();
        }
        
        this.emit('disconnected', { code: event.code, reason: event.reason });
    }

    /**
     * Handle WebSocket errors
     */
    handleError(event) {
        console.error('❌ WebSocket error:', event);
        this.emit('error', { error: event });
    }

    /**
     * Schedule reconnection with exponential backoff
     */
    scheduleReconnect() {
        if (this.reconnectTimer) {
            return;
        }
        
        const delay = Math.min(
            this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts),
            30000 // Max 30 seconds
        );
        
        console.log(`🔄 Scheduling reconnection in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);
        
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.reconnectAttempts++;
            this.metrics.reconnections++;
            this.connect();
        }, delay);
    }

    /**
     * Start heartbeat ping/pong
     */
    startHeartbeat() {
        if (this.heartbeatTimer) {
            return;
        }
        
        this.heartbeatTimer = setInterval(() => {
            if (this.isConnected) {
                this.lastPingTime = Date.now();
                this.sendMessage({ type: 'ping', timestamp: this.lastPingTime });
            }
        }, this.config.heartbeatInterval);
    }

    /**
     * Stop heartbeat
     */
    stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    /**
     * Send message to server
     */
    sendMessage(message) {
        if (!this.isConnected) {
            // Queue message for when connection is restored
            if (this.messageQueue.length < this.maxQueueSize) {
                this.messageQueue.push(message);
            }
            return false;
        }
        
        try {
            this.socket.send(JSON.stringify(message));
            this.metrics.messagesSent++;
            return true;
        } catch (error) {
            console.error('❌ Failed to send WebSocket message:', error);
            return false;
        }
    }

    /**
     * Subscribe to tournament updates
     * @param {string} tournamentId - Tournament identifier
     * @param {Function} callback - Update callback function
     */
    subscribe(tournamentId, callback) {
        // Add to local subscriptions
        if (!this.subscriptions.has(tournamentId)) {
            this.subscriptions.set(tournamentId, new Set());
        }
        this.subscriptions.get(tournamentId).add(callback);
        
        // Send subscription to server
        if (this.isConnected) {
            this.sendMessage({
                type: 'subscribe',
                tournamentId: tournamentId
            });
        } else {
            // Queue for when connection is established
            this.pendingSubscriptions.add(tournamentId);
        }
        
        console.log(`📊 Subscribed to tournament updates: ${tournamentId}`);
    }

    /**
     * Unsubscribe from tournament updates
     * @param {string} tournamentId - Tournament identifier
     * @param {Function} callback - Update callback function
     */
    unsubscribe(tournamentId, callback) {
        const callbacks = this.subscriptions.get(tournamentId);
        if (callbacks) {
            callbacks.delete(callback);
            
            // If no more callbacks, unsubscribe from server
            if (callbacks.size === 0) {
                this.subscriptions.delete(tournamentId);
                this.pendingSubscriptions.delete(tournamentId);
                
                if (this.isConnected) {
                    this.sendMessage({
                        type: 'unsubscribe',
                        tournamentId: tournamentId
                    });
                }
            }
        }
        
        console.log(`📊 Unsubscribed from tournament updates: ${tournamentId}`);
    }

    /**
     * Broadcast score update to server
     * @param {string} tournamentId - Tournament identifier
     * @param {Object} playerData - Player score data
     */
    broadcastScoreUpdate(tournamentId, playerData) {
        const updateId = this.generateUpdateId();
        
        // Optimistic update first
        if (this.config.enableOptimisticUpdates) {
            this.optimisticUpdate(updateId, {
                type: 'scoreUpdate',
                tournamentId,
                ...playerData
            });
        }
        
        // Send to server
        this.sendMessage({
            type: 'scoreUpdate',
            updateId,
            tournamentId,
            playerData,
            timestamp: Date.now()
        });
    }

    /**
     * Perform optimistic update
     * @param {string} updateId - Unique update identifier
     * @param {Object} updateData - Update data
     */
    optimisticUpdate(updateId, updateData) {
        // Store optimistic update
        this.optimisticUpdates.set(updateId, {
            ...updateData,
            timestamp: Date.now(),
            confirmed: false
        });
        
        // Emit optimistic event
        this.emit('optimisticUpdate', updateData);
        
        // Set timeout for rollback if not confirmed
        setTimeout(() => {
            if (this.optimisticUpdates.has(updateId)) {
                const update = this.optimisticUpdates.get(updateId);
                if (!update.confirmed) {
                    this.rollbackOptimisticUpdate(updateId);
                }
            }
        }, 5000); // 5 second timeout
    }

    /**
     * Rollback optimistic update
     * @param {string} updateId - Update identifier
     */
    rollbackOptimisticUpdate(updateId) {
        const update = this.optimisticUpdates.get(updateId);
        if (update) {
            this.optimisticUpdates.delete(updateId);
            this.emit('optimisticRollback', update);
            console.warn(`⚠️ Rolling back optimistic update: ${updateId}`);
        }
    }

    /**
     * Process pending subscriptions after connection
     */
    processPendingSubscriptions() {
        for (const tournamentId of this.pendingSubscriptions) {
            this.sendMessage({
                type: 'subscribe',
                tournamentId: tournamentId
            });
        }
        this.pendingSubscriptions.clear();
    }

    /**
     * Process queued messages after connection
     */
    processMessageQueue() {
        while (this.messageQueue.length > 0 && this.isConnected) {
            const message = this.messageQueue.shift();
            this.sendMessage(message);
        }
    }

    /**
     * Handle score update messages
     */
    handleScoreUpdateMessage(message) {
        const { tournamentId, playerData } = message;
        
        // Notify all subscribers
        const callbacks = this.subscriptions.get(tournamentId);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback({
                        type: 'scoreUpdate',
                        tournamentId,
                        playerData,
                        timestamp: message.timestamp
                    });
                } catch (error) {
                    console.error('❌ Subscription callback error:', error);
                }
            });
        }
        
        // Emit global event
        this.emit('scoreUpdate', {
            tournamentId,
            playerData,
            timestamp: message.timestamp
        });
    }

    /**
     * Handle ranking change messages
     */
    handleRankingChangeMessage(message) {
        const { tournamentId, rankings } = message;
        
        // Notify subscribers
        const callbacks = this.subscriptions.get(tournamentId);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback({
                        type: 'rankingChange',
                        tournamentId,
                        rankings,
                        timestamp: message.timestamp
                    });
                } catch (error) {
                    console.error('❌ Subscription callback error:', error);
                }
            });
        }
        
        this.emit('rankingChange', {
            tournamentId,
            rankings,
            timestamp: message.timestamp
        });
    }

    /**
     * Handle tournament update messages
     */
    handleTournamentUpdateMessage(message) {
        const { tournamentId, tournament } = message;
        
        // Notify subscribers
        const callbacks = this.subscriptions.get(tournamentId);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback({
                        type: 'tournamentUpdate',
                        tournamentId,
                        tournament,
                        timestamp: message.timestamp
                    });
                } catch (error) {
                    console.error('❌ Subscription callback error:', error);
                }
            });
        }
        
        this.emit('tournamentUpdate', {
            tournamentId,
            tournament,
            timestamp: message.timestamp
        });
    }

    /**
     * Handle leaderboard sync messages
     */
    handleLeaderboardSyncMessage(message) {
        const { tournamentId, leaderboard } = message;
        
        this.emit('leaderboardSync', {
            tournamentId,
            leaderboard,
            timestamp: message.timestamp
        });
    }

    /**
     * Handle optimistic update confirmation
     */
    handleOptimisticConfirm(message) {
        const { updateId } = message;
        const update = this.optimisticUpdates.get(updateId);
        
        if (update) {
            update.confirmed = true;
            this.emit('optimisticConfirmed', update);
        }
    }

    /**
     * Handle optimistic update rejection
     */
    handleOptimisticReject(message) {
        const { updateId, reason } = message;
        
        if (this.optimisticUpdates.has(updateId)) {
            this.rollbackOptimisticUpdate(updateId);
            this.emit('optimisticRejected', { updateId, reason });
        }
    }

    /**
     * Generate unique update ID
     */
    generateUpdateId() {
        return `update_${Date.now()}_${++this.updateCounter}`;
    }

    /**
     * Get connection metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            isConnected: this.isConnected,
            latency: this.latency,
            reconnectAttempts: this.reconnectAttempts,
            subscriptions: this.subscriptions.size,
            queuedMessages: this.messageQueue.length,
            optimisticUpdates: this.optimisticUpdates.size
        };
    }

    /**
     * Broadcast generic message
     * @param {Object} data - Data to broadcast
     */
    broadcast(data) {
        this.sendMessage({
            type: 'broadcast',
            data,
            timestamp: Date.now()
        });
    }

    /**
     * Close connection and cleanup
     */
    destroy() {
        console.log('🧹 Destroying LeaderboardSocket...');
        
        // Stop timers
        this.stopHeartbeat();
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        
        // Close connection
        if (this.socket && this.isConnected) {
            this.socket.close(1000, 'Cleanup');
        }
        
        // Clear state
        this.subscriptions.clear();
        this.pendingSubscriptions.clear();
        this.messageQueue.length = 0;
        this.optimisticUpdates.clear();
        
        // Remove all listeners
        this.removeAllListeners();
        
        console.log('✅ LeaderboardSocket destroyed');
    }
}

// Default export for compatibility
export default LeaderboardSocket;
