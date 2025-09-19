/**
 * TCP Protocol for Warehouse Management System
 * Proprietary messaging protocol for real-time package tracking updates
 */

const net = require('net');
const EventEmitter = require('events');

/**
 * WMS TCP Protocol Messages
 */
const MESSAGE_TYPES = {
    PACKAGE_RECEIVED: 'PKG_RCV',
    PACKAGE_STORED: 'PKG_STR', 
    PACKAGE_PICKED: 'PKG_PCK',
    PACKAGE_LOADED: 'PKG_LDD',
    STATUS_REQUEST: 'STS_REQ',
    STATUS_RESPONSE: 'STS_RSP',
    HEARTBEAT: 'HBT_CHK',
    ERROR: 'ERR_MSG',
    ACK: 'ACK_MSG'
};

/**
 * Protocol Message Structure:
 * [TYPE:7][LENGTH:4][TIMESTAMP:13][PAYLOAD:N][CHECKSUM:2]
 * - TYPE: 7-character message type code
 * - LENGTH: 4-digit payload length (padded with zeros)
 * - TIMESTAMP: 13-digit Unix timestamp in milliseconds
 * - PAYLOAD: JSON payload
 * - CHECKSUM: 2-digit checksum for message integrity
 */

class WMSProtocol extends EventEmitter {
    constructor() {
        super();
        this.clients = new Set();
    }

    /**
     * Create a protocol message
     * @param {string} type - Message type
     * @param {Object} payload - Message payload
     * @returns {string} Formatted protocol message
     */
    createMessage(type, payload) {
        const jsonPayload = JSON.stringify(payload);
        const timestamp = Date.now().toString();
        const length = jsonPayload.length.toString().padStart(4, '0');
        const checksum = this.calculateChecksum(type + length + timestamp + jsonPayload);
        
        return `${type}${length}${timestamp}${jsonPayload}${checksum}`;
    }

    /**
     * Parse incoming protocol message
     * @param {string} rawMessage - Raw message string
     * @returns {Object|null} Parsed message or null if invalid
     */
    parseMessage(rawMessage) {
        try {
            if (rawMessage.length < 26) { // Minimum message length with 7-char type
                return null;
            }

            // Extract parts from message: [TYPE:7][LENGTH:4][TIMESTAMP:13][PAYLOAD:N][CHECKSUM:2]
            const type = rawMessage.substring(0, 7); // First 7 characters
            const lengthStr = rawMessage.substring(7, 11); // Next 4 characters
            const length = parseInt(lengthStr);
            const timestampStr = rawMessage.substring(11, 24); // Next 13 characters
            const payload = rawMessage.substring(24, 24 + length); // Next N characters
            const checksum = rawMessage.substring(24 + length); // Last 2 characters

            // Verify checksum using the raw parts as they appear in message
            const expectedChecksum = this.calculateChecksum(type + lengthStr + timestampStr + payload);
            if (checksum !== expectedChecksum) {
                console.error(`Invalid checksum in message. Expected: ${expectedChecksum}, Got: ${checksum}`);
                return null;
            }

            return {
                type,
                timestamp: parseInt(timestampStr),
                payload: JSON.parse(payload),
                raw: rawMessage
            };
        } catch (error) {
            console.error('Error parsing message:', error);
            return null;
        }
    }

    /**
     * Calculate simple checksum for message integrity
     * @param {string} data - Data to calculate checksum for
     * @returns {string} 2-digit checksum
     */
    calculateChecksum(data) {
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
            sum += data.charCodeAt(i);
        }
        return (sum % 100).toString().padStart(2, '0');
    }

    /**
     * Broadcast message to all connected clients
     * @param {string} type - Message type
     * @param {Object} payload - Message payload
     */
    broadcast(type, payload) {
        const message = this.createMessage(type, payload);
        console.log(`📡 Broadcasting ${type}: ${JSON.stringify(payload)}`);
        
        this.clients.forEach(client => {
            try {
                client.write(message + '\n');
            } catch (error) {
                console.error('Error broadcasting to client:', error);
                this.clients.delete(client);
            }
        });
    }

    /**
     * Send message to specific client
     * @param {net.Socket} client - Client socket
     * @param {string} type - Message type
     * @param {Object} payload - Message payload
     */
    sendToClient(client, type, payload) {
        const message = this.createMessage(type, payload);
        try {
            client.write(message + '\n');
        } catch (error) {
            console.error('Error sending to client:', error);
            this.clients.delete(client);
        }
    }

    /**
     * Handle incoming client data
     * @param {net.Socket} client - Client socket
     * @param {Buffer} data - Incoming data
     */
    handleClientData(client, data) {
        const messages = data.toString().trim().split('\n');
        
        messages.forEach(messageStr => {
            if (!messageStr) return;
            
            const message = this.parseMessage(messageStr);
            if (!message) {
                this.sendToClient(client, MESSAGE_TYPES.ERROR, {
                    error: 'Invalid message format',
                    timestamp: Date.now()
                });
                return;
            }

            console.log(`📨 Received ${message.type} from client`);
            
            // Send ACK for all messages
            this.sendToClient(client, MESSAGE_TYPES.ACK, {
                originalType: message.type,
                timestamp: Date.now()
            });

            // Emit event for message processing
            this.emit('message', {
                client,
                message,
                type: message.type,
                payload: message.payload
            });
        });
    }

    /**
     * Add client to the protocol
     * @param {net.Socket} client - Client socket
     */
    addClient(client) {
        this.clients.add(client);
        console.log(`👥 Client connected. Total clients: ${this.clients.size}`);
        
        // Send welcome message
        this.sendToClient(client, MESSAGE_TYPES.STATUS_RESPONSE, {
            status: 'connected',
            serverTime: Date.now(),
            protocolVersion: '1.0'
        });

        client.on('data', (data) => this.handleClientData(client, data));
        
        client.on('close', () => {
            this.clients.delete(client);
            console.log(`👋 Client disconnected. Total clients: ${this.clients.size}`);
        });

        client.on('error', (error) => {
            console.error('Client error:', error);
            this.clients.delete(client);
        });
    }

    /**
     * Start heartbeat for connected clients
     */
    startHeartbeat() {
        setInterval(() => {
            if (this.clients.size > 0) {
                this.broadcast(MESSAGE_TYPES.HEARTBEAT, {
                    timestamp: Date.now(),
                    activeClients: this.clients.size
                });
            }
        }, 30000); // Every 30 seconds
    }

    /**
     * Get protocol statistics
     * @returns {Object} Protocol statistics
     */
    getStats() {
        return {
            connectedClients: this.clients.size,
            messageTypes: Object.keys(MESSAGE_TYPES),
            uptime: process.uptime()
        };
    }
}

/**
 * TCP Server for WMS Protocol
 */
class WMSTCPServer extends EventEmitter {
    constructor(port = 8080, protocol = null) {
        super();
        this.port = port;
        this.protocol = protocol || new WMSProtocol();
        this.server = null;
        
        // Forward protocol events
        this.protocol.on('message', (data) => this.emit('message', data));
    }

    /**
     * Start the TCP server
     * @returns {Promise} Server start promise
     */
    start() {
        return new Promise((resolve, reject) => {
            this.server = net.createServer((client) => {
                console.log(`🔌 New TCP connection from ${client.remoteAddress}:${client.remotePort}`);
                this.protocol.addClient(client);
            });

            this.server.on('error', (error) => {
                console.error('TCP Server error:', error);
                reject(error);
            });

            this.server.listen(this.port, () => {
                console.log(`🚀 WMS TCP Server listening on port ${this.port}`);
                console.log(`📡 Protocol ready for real-time package updates`);
                this.protocol.startHeartbeat();
                resolve();
            });
        });
    }

    /**
     * Stop the TCP server
     * @returns {Promise} Server stop promise
     */
    stop() {
        return new Promise((resolve) => {
            if (this.server) {
                this.server.close(() => {
                    console.log('🛑 WMS TCP Server stopped');
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    /**
     * Broadcast package update
     * @param {string} eventType - Event type (received, stored, picked, loaded)
     * @param {Object} packageData - Package data
     */
    broadcastPackageUpdate(eventType, packageData) {
        const messageTypeMap = {
            'received': MESSAGE_TYPES.PACKAGE_RECEIVED,
            'stored': MESSAGE_TYPES.PACKAGE_STORED,
            'picked': MESSAGE_TYPES.PACKAGE_PICKED,
            'loaded': MESSAGE_TYPES.PACKAGE_LOADED
        };

        const messageType = messageTypeMap[eventType];
        if (messageType) {
            this.protocol.broadcast(messageType, {
                packageId: packageData.packageId,
                status: packageData.status,
                location: packageData.location,
                assignedVehicle: packageData.assignedVehicle,
                timestamp: Date.now()
            });
        }
    }

    /**
     * Get server statistics
     * @returns {Object} Server statistics
     */
    getStats() {
        return {
            port: this.port,
            isListening: this.server ? this.server.listening : false,
            protocol: this.protocol.getStats()
        };
    }
}

module.exports = {
    WMSProtocol,
    WMSTCPServer,
    MESSAGE_TYPES
};