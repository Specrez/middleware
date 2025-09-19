/**
 * TCP to HTTP Adapter Service for WSO2 ESB Integration
 * Converts WMS TCP protocol messages to HTTP REST calls that WSO2 can handle
 */

const express = require('express');
const net = require('net');
const cors = require('cors');
const bodyParser = require('body-parser');

// TCP Protocol Constants (from WMS)
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

class TCPHTTPAdapter {
    constructor() {
        this.app = express();
        this.httpPort = process.env.ADAPTER_HTTP_PORT || 3004;
        this.tcpClient = null;
        this.wmsHost = process.env.WMS_HOST || 'localhost';
        this.wmsPort = process.env.WMS_TCP_PORT || 8080;
        this.pendingRequests = new Map(); // Track pending TCP requests
        
        this.setupHTTPServer();
        this.connectToWMSTCP();
    }

    /**
     * Setup HTTP server for WSO2 ESB communication
     */
    setupHTTPServer() {
        // Middleware
        this.app.use(cors());
        this.app.use(bodyParser.json({ limit: '10mb' }));
        this.app.use(bodyParser.urlencoded({ extended: true }));

        // Logging middleware
        this.app.use((req, res, next) => {
            console.log(`[${new Date().toISOString()}] HTTP ${req.method} ${req.path}`);
            next();
        });

        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                service: 'TCP-HTTP Adapter',
                version: '1.0.0',
                tcpConnection: this.tcpClient ? 'connected' : 'disconnected',
                timestamp: new Date().toISOString()
            });
        });

        // Package tracking endpoints (HTTP interface for WSO2)
        this.app.post('/api/packages/receive', this.handlePackageReceive.bind(this));
        this.app.post('/api/packages/store', this.handlePackageStore.bind(this));
        this.app.post('/api/packages/pick', this.handlePackagePick.bind(this));
        this.app.post('/api/packages/load', this.handlePackageLoad.bind(this));
        this.app.get('/api/packages/status/:packageId', this.handlePackageStatus.bind(this));
        this.app.get('/api/packages/list', this.handlePackageList.bind(this));

        // Start HTTP server
        this.app.listen(this.httpPort, () => {
            console.log(`🔄 TCP-HTTP Adapter server running on port ${this.httpPort}`);
        });
    }

    /**
     * Connect to WMS TCP server
     */
    connectToWMSTCP() {
        console.log(`🔌 Connecting to WMS TCP server at ${this.wmsHost}:${this.wmsPort}`);
        
        this.tcpClient = new net.Socket();
        
        this.tcpClient.connect(this.wmsPort, this.wmsHost, () => {
            console.log('✅ Connected to WMS TCP server');
            this.sendHeartbeat();
        });

        this.tcpClient.on('data', (data) => {
            this.handleTCPResponse(data.toString());
        });

        this.tcpClient.on('error', (error) => {
            console.error('❌ TCP connection error:', error);
            this.reconnectTCP();
        });

        this.tcpClient.on('close', () => {
            console.log('🔌 TCP connection closed. Reconnecting...');
            this.reconnectTCP();
        });

        // Setup heartbeat
        setInterval(() => {
            if (this.tcpClient && !this.tcpClient.destroyed) {
                this.sendHeartbeat();
            }
        }, 30000); // Every 30 seconds
    }

    /**
     * Reconnect to TCP server
     */
    reconnectTCP() {
        setTimeout(() => {
            this.connectToWMSTCP();
        }, 5000); // Retry after 5 seconds
    }

    /**
     * Send heartbeat to WMS TCP server
     */
    sendHeartbeat() {
        const message = this.createTCPMessage(MESSAGE_TYPES.HEARTBEAT, { timestamp: Date.now() });
        this.sendTCPMessage(message);
    }

    /**
     * Create TCP protocol message
     */
    createTCPMessage(type, payload) {
        const jsonPayload = JSON.stringify(payload);
        const timestamp = Date.now().toString();
        const length = jsonPayload.length.toString().padStart(4, '0');
        const checksum = this.calculateChecksum(type + length + timestamp + jsonPayload);
        
        return `${type}${length}${timestamp}${jsonPayload}${checksum}`;
    }

    /**
     * Parse TCP protocol message
     */
    parseTCPMessage(rawMessage) {
        try {
            if (rawMessage.length < 26) {
                return null;
            }

            const type = rawMessage.substring(0, 7);
            const lengthStr = rawMessage.substring(7, 11);
            const length = parseInt(lengthStr);
            const timestampStr = rawMessage.substring(11, 24);
            const payload = rawMessage.substring(24, 24 + length);
            const checksum = rawMessage.substring(24 + length);

            const expectedChecksum = this.calculateChecksum(type + lengthStr + timestampStr + payload);
            if (checksum !== expectedChecksum) {
                console.error(`Invalid checksum. Expected: ${expectedChecksum}, Got: ${checksum}`);
                return null;
            }

            return {
                type,
                timestamp: parseInt(timestampStr),
                payload: JSON.parse(payload),
                raw: rawMessage
            };
        } catch (error) {
            console.error('Error parsing TCP message:', error);
            return null;
        }
    }

    /**
     * Calculate checksum for message integrity
     */
    calculateChecksum(data) {
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
            sum += data.charCodeAt(i);
        }
        return (sum % 100).toString().padStart(2, '0');
    }

    /**
     * Send TCP message and track it
     */
    sendTCPMessage(message, requestId = null) {
        if (this.tcpClient && !this.tcpClient.destroyed) {
            this.tcpClient.write(message);
            if (requestId) {
                this.pendingRequests.set(requestId, Date.now());
            }
        } else {
            throw new Error('TCP connection not available');
        }
    }

    /**
     * Handle TCP response from WMS
     */
    handleTCPResponse(data) {
        console.log('📥 Received TCP data:', data);
        
        const message = this.parseTCPMessage(data);
        if (!message) {
            console.error('Failed to parse TCP message');
            return;
        }

        // Handle different message types
        switch (message.type) {
            case MESSAGE_TYPES.STATUS_RESPONSE:
                this.handleStatusResponse(message);
                break;
            case MESSAGE_TYPES.ACK:
                this.handleAckMessage(message);
                break;
            case MESSAGE_TYPES.ERROR:
                this.handleErrorMessage(message);
                break;
            default:
                console.log(`Received TCP message type: ${message.type}`);
        }
    }

    /**
     * Handle status response from WMS
     */
    handleStatusResponse(message) {
        const requestId = message.payload.requestId;
        if (this.pendingRequests.has(requestId)) {
            this.pendingRequests.delete(requestId);
            // Store response for HTTP request
            this.tcpResponses = this.tcpResponses || new Map();
            this.tcpResponses.set(requestId, message.payload);
        }
    }

    /**
     * Handle acknowledgment message
     */
    handleAckMessage(message) {
        console.log('✅ Received ACK from WMS:', message.payload);
    }

    /**
     * Handle error message
     */
    handleErrorMessage(message) {
        console.error('❌ Received error from WMS:', message.payload);
    }

    // HTTP Endpoint Handlers for WSO2 ESB

    /**
     * Handle package receive request
     */
    async handlePackageReceive(req, res) {
        try {
            const { packageId, clientId, items, deliveryAddress } = req.body;
            const requestId = `recv_${Date.now()}`;
            
            const tcpMessage = this.createTCPMessage(MESSAGE_TYPES.PACKAGE_RECEIVED, {
                requestId,
                packageId,
                clientId,
                items,
                deliveryAddress,
                timestamp: Date.now()
            });

            this.sendTCPMessage(tcpMessage, requestId);
            
            // Wait for response (with timeout)
            const response = await this.waitForTCPResponse(requestId, 5000);
            
            res.json({
                success: true,
                message: 'Package received successfully',
                packageId,
                timestamp: new Date().toISOString(),
                data: response
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Handle package store request
     */
    async handlePackageStore(req, res) {
        try {
            const { packageId, location, zone } = req.body;
            const requestId = `store_${Date.now()}`;
            
            const tcpMessage = this.createTCPMessage(MESSAGE_TYPES.PACKAGE_STORED, {
                requestId,
                packageId,
                location,
                zone,
                timestamp: Date.now()
            });

            this.sendTCPMessage(tcpMessage, requestId);
            const response = await this.waitForTCPResponse(requestId, 5000);
            
            res.json({
                success: true,
                message: 'Package stored successfully',
                packageId,
                location,
                data: response
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Handle package pick request
     */
    async handlePackagePick(req, res) {
        try {
            const { packageId, pickerId } = req.body;
            const requestId = `pick_${Date.now()}`;
            
            const tcpMessage = this.createTCPMessage(MESSAGE_TYPES.PACKAGE_PICKED, {
                requestId,
                packageId,
                pickerId,
                timestamp: Date.now()
            });

            this.sendTCPMessage(tcpMessage, requestId);
            const response = await this.waitForTCPResponse(requestId, 5000);
            
            res.json({
                success: true,
                message: 'Package picked successfully',
                packageId,
                pickerId,
                data: response
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Handle package load request
     */
    async handlePackageLoad(req, res) {
        try {
            const { packageId, vehicleId, driverId } = req.body;
            const requestId = `load_${Date.now()}`;
            
            const tcpMessage = this.createTCPMessage(MESSAGE_TYPES.PACKAGE_LOADED, {
                requestId,
                packageId,
                vehicleId,
                driverId,
                timestamp: Date.now()
            });

            this.sendTCPMessage(tcpMessage, requestId);
            const response = await this.waitForTCPResponse(requestId, 5000);
            
            res.json({
                success: true,
                message: 'Package loaded successfully',
                packageId,
                vehicleId,
                data: response
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Handle package status request
     */
    async handlePackageStatus(req, res) {
        try {
            const { packageId } = req.params;
            const requestId = `status_${Date.now()}`;
            
            const tcpMessage = this.createTCPMessage(MESSAGE_TYPES.STATUS_REQUEST, {
                requestId,
                packageId,
                timestamp: Date.now()
            });

            this.sendTCPMessage(tcpMessage, requestId);
            const response = await this.waitForTCPResponse(requestId, 5000);
            
            res.json({
                success: true,
                packageId,
                status: response.status || 'unknown',
                data: response
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Handle package list request
     */
    async handlePackageList(req, res) {
        try {
            const requestId = `list_${Date.now()}`;
            
            const tcpMessage = this.createTCPMessage(MESSAGE_TYPES.STATUS_REQUEST, {
                requestId,
                action: 'list_all',
                timestamp: Date.now()
            });

            this.sendTCPMessage(tcpMessage, requestId);
            const response = await this.waitForTCPResponse(requestId, 5000);
            
            res.json({
                success: true,
                packages: response.packages || [],
                count: response.count || 0,
                data: response
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Wait for TCP response with timeout
     */
    waitForTCPResponse(requestId, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            const checkResponse = () => {
                this.tcpResponses = this.tcpResponses || new Map();
                
                if (this.tcpResponses.has(requestId)) {
                    const response = this.tcpResponses.get(requestId);
                    this.tcpResponses.delete(requestId);
                    resolve(response);
                } else if (Date.now() - startTime > timeout) {
                    this.pendingRequests.delete(requestId);
                    reject(new Error('TCP response timeout'));
                } else {
                    setTimeout(checkResponse, 100);
                }
            };
            
            checkResponse();
        });
    }
}

// Start the adapter service
if (require.main === module) {
    console.log('🚀 Starting TCP-HTTP Adapter Service...');
    new TCPHTTPAdapter();
}

module.exports = TCPHTTPAdapter;