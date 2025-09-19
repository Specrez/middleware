/**
 * Warehouse Management System Server
 * Main server for package tracking and TCP/IP real-time updates
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');

// Import WMS components
const WMSHandler = require('./handlers/wms-handler');
const { WMSTCPServer } = require('./protocol/tcp-protocol');
const wmsConfig = require('./config/wms-config.json');

// Initialize Express app
const app = express();
const httpPort = process.env.WMS_HTTP_PORT || 3003;
const tcpPort = process.env.WMS_TCP_PORT || 8080;

// Initialize TCP server for real-time updates
const tcpServer = new WMSTCPServer(tcpPort);

// Initialize WMS handler with TCP server
const wmsHandler = new WMSHandler(wmsConfig, tcpServer);

// Middleware
app.use(helmet());
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

/**
 * Health Check Endpoint
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Warehouse Management System',
        version: '1.0.0',
        features: {
            packageTracking: 'enabled',
            realTimeUpdates: 'enabled',
            tcpProtocol: 'active'
        },
        connections: {
            httpPort,
            tcpPort,
            activeTcpClients: tcpServer.getStats().protocol.connectedClients
        },
        timestamp: new Date().toISOString()
    });
});

/**
 * Package Management Endpoints
 */

/**
 * POST /api/packages/receive
 * Receive package from client
 */
app.post('/api/packages/receive', async (req, res) => {
    try {
        console.log('📥 Receiving new package...');
        const result = await wmsHandler.receivePackage(req.body);
        res.json(result);
    } catch (error) {
        console.error('Error receiving package:', error);
        res.status(400).json({
            error: 'Package receipt failed',
            message: error.message
        });
    }
});

/**
 * PUT /api/packages/:packageId/store
 * Store package at warehouse location
 */
app.put('/api/packages/:packageId/store', async (req, res) => {
    try {
        const { packageId } = req.params;
        const { location } = req.body;
        
        if (!location) {
            return res.status(400).json({
                error: 'Location is required',
                message: 'Please specify storage location'
            });
        }

        const result = await wmsHandler.storePackage(packageId, location);
        res.json(result);
    } catch (error) {
        console.error('Error storing package:', error);
        res.status(400).json({
            error: 'Package storage failed',
            message: error.message
        });
    }
});

/**
 * PUT /api/packages/:packageId/pick
 * Pick package for fulfillment
 */
app.put('/api/packages/:packageId/pick', async (req, res) => {
    try {
        const { packageId } = req.params;
        const result = await wmsHandler.pickPackage(packageId);
        res.json(result);
    } catch (error) {
        console.error('Error picking package:', error);
        res.status(400).json({
            error: 'Package picking failed',
            message: error.message
        });
    }
});

/**
 * PUT /api/packages/:packageId/load
 * Load package onto vehicle
 */
app.put('/api/packages/:packageId/load', async (req, res) => {
    try {
        const { packageId } = req.params;
        const { vehicleId } = req.body;
        
        if (!vehicleId) {
            return res.status(400).json({
                error: 'Vehicle ID is required',
                message: 'Please specify vehicle for loading'
            });
        }

        const result = await wmsHandler.loadPackage(packageId, vehicleId);
        res.json(result);
    } catch (error) {
        console.error('Error loading package:', error);
        res.status(400).json({
            error: 'Package loading failed',
            message: error.message
        });
    }
});

/**
 * GET /api/packages/:packageId/track
 * Track package status and history
 */
app.get('/api/packages/:packageId/track', async (req, res) => {
    try {
        const { packageId } = req.params;
        const result = await wmsHandler.trackPackage(packageId);
        res.json(result);
    } catch (error) {
        console.error('Error tracking package:', error);
        res.status(404).json({
            error: 'Package tracking failed',
            message: error.message
        });
    }
});

/**
 * GET /api/packages
 * Get all packages or filter by status
 */
app.get('/api/packages', async (req, res) => {
    try {
        const { status } = req.query;
        const result = await wmsHandler.getPackages(status);
        res.json(result);
    } catch (error) {
        console.error('Error getting packages:', error);
        res.status(500).json({
            error: 'Failed to retrieve packages',
            message: error.message
        });
    }
});

/**
 * Warehouse Analytics Endpoints
 */

/**
 * GET /api/warehouse/stats
 * Get warehouse statistics
 */
app.get('/api/warehouse/stats', async (req, res) => {
    try {
        const result = await wmsHandler.getWarehouseStats();
        res.json(result);
    } catch (error) {
        console.error('Error getting warehouse stats:', error);
        res.status(500).json({
            error: 'Failed to retrieve statistics',
            message: error.message
        });
    }
});

/**
 * GET /api/warehouse/realtime/stats
 * Get real-time connection statistics
 */
app.get('/api/warehouse/realtime/stats', (req, res) => {
    const tcpStats = tcpServer.getStats();
    res.json({
        tcp: tcpStats,
        protocol: {
            version: '1.0',
            messageTypes: ['PKG_RCV', 'PKG_STR', 'PKG_PCK', 'PKG_LDD', 'STS_REQ', 'STS_RSP', 'HBT'],
            features: ['real-time-updates', 'heartbeat', 'message-integrity']
        },
        timestamp: new Date().toISOString()
    });
});

/**
 * Legacy Integration Endpoints
 * For backward compatibility with existing middleware
 */

/**
 * POST /api/inventory/update
 * Legacy inventory update endpoint
 */
app.post('/api/inventory/update', async (req, res) => {
    try {
        const result = await wmsHandler.handleInventoryUpdate(req.body);
        res.json(result);
    } catch (error) {
        console.error('Error updating inventory:', error);
        res.status(400).json({
            error: 'Inventory update failed',
            message: error.message
        });
    }
});

/**
 * POST /api/orders/fulfill
 * Legacy order fulfillment endpoint (enhanced with package tracking)
 */
app.post('/api/orders/fulfill', async (req, res) => {
    try {
        const result = await wmsHandler.handleOrderFulfillment(req.body);
        res.json(result);
    } catch (error) {
        console.error('Error fulfilling order:', error);
        res.status(400).json({
            error: 'Order fulfillment failed',
            message: error.message
        });
    }
});

/**
 * GET /api/inventory/:itemId/stock
 * Legacy stock level check endpoint
 */
app.get('/api/inventory/:itemId/stock', async (req, res) => {
    try {
        const { itemId } = req.params;
        const result = await wmsHandler.checkStockLevel(itemId);
        res.json(result);
    } catch (error) {
        console.error('Error checking stock:', error);
        res.status(500).json({
            error: 'Stock check failed',
            message: error.message
        });
    }
});

/**
 * TCP Protocol Event Handlers
 */

// Handle incoming protocol messages
tcpServer.on('message', (data) => {
    const { client, message, type, payload } = data;
    
    switch (type) {
        case 'STS_REQ': // Status request
            // Handle status request from client
            wmsHandler.getWarehouseStats().then(stats => {
                tcpServer.protocol.sendToClient(client, 'STS_RSP', {
                    warehouse: stats.warehouse,
                    packages: stats.packages,
                    timestamp: Date.now()
                });
            });
            break;
            
        default:
            console.log(`📨 Received ${type} message:`, payload);
    }
});

/**
 * Error Handling Middleware
 */
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: 'An unexpected error occurred in WMS'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        message: `WMS endpoint ${req.method} ${req.path} not found`
    });
});

/**
 * Server Startup
 */
async function startServer() {
    try {
        // Start TCP server first
        await tcpServer.start();
        
        // Start HTTP server
        app.listen(httpPort, () => {
            console.log('='.repeat(70));
            console.log(`🏭 Warehouse Management System Server`);
            console.log(`🌐 HTTP API: http://localhost:${httpPort}`);
            console.log(`📡 TCP Protocol: localhost:${tcpPort}`);
            console.log(`🏥 Health Check: http://localhost:${httpPort}/health`);
            console.log(`📊 Statistics: http://localhost:${httpPort}/api/warehouse/stats`);
            console.log(`⏰ Started at: ${new Date().toISOString()}`);
            console.log('='.repeat(70));
            console.log('📦 Package Tracking Features:');
            console.log('  📥 Package Receipt from Clients');
            console.log('  📍 Warehouse Storage Management');
            console.log('  📋 Order Fulfillment & Picking');
            console.log('  🚛 Vehicle Loading Operations');
            console.log('  🔍 Real-time Package Tracking');
            console.log('  📡 TCP/IP Real-time Updates');
            console.log('='.repeat(70));
        });
    } catch (error) {
        console.error('❌ Failed to start WMS server:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down WMS server...');
    await tcpServer.stop();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down WMS server...');
    await tcpServer.stop();
    process.exit(0);
});

// Start the server
startServer();

module.exports = app;