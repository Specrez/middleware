/**
 * Route Optimisation System (ROS) REST API Server
 * Modern cloud-based service for generating optimal delivery routes
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const path = require('path');

// Import configuration and handlers
const restConfig = require('./rest-config.json');
const ROSHandler = require('./handlers/ros-handler');

const app = express();
const port = process.env.PORT || 3002;

// Middleware
app.use(helmet());
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize ROS handler
const rosHandler = new ROSHandler(restConfig);

// Logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Route Optimisation System',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// API Routes

/**
 * POST /v1/routes/calculate
 * Calculate optimal routes based on delivery addresses and vehicle availability
 */
app.post('/v1/routes/calculate', async (req, res) => {
    try {
        console.log('Received route calculation request:', JSON.stringify(req.body, null, 2));
        
        const { deliveryAddresses, vehicles } = req.body;
        
        // Validate input
        if (!deliveryAddresses || !Array.isArray(deliveryAddresses) || deliveryAddresses.length === 0) {
            return res.status(400).json({
                error: 'Invalid or missing delivery addresses',
                message: 'deliveryAddresses must be a non-empty array'
            });
        }
        
        if (!vehicles || !Array.isArray(vehicles) || vehicles.length === 0) {
            return res.status(400).json({
                error: 'Invalid or missing vehicles',
                message: 'vehicles must be a non-empty array'
            });
        }
        
        // Calculate optimal routes
        const result = await rosHandler.calculateOptimalRoutes({ deliveryAddresses, vehicles });
        
        console.log('Route calculation completed:', JSON.stringify(result, null, 2));
        res.json(result);
    } catch (error) {
        console.error('Error calculating routes:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to calculate optimal routes'
        });
    }
});

/**
 * GET /v1/vehicles
 * Get available vehicles for route optimization
 */
app.get('/v1/vehicles', async (req, res) => {
    try {
        const result = await rosHandler.getAvailableVehicles();
        res.json(result);
    } catch (error) {
        console.error('Error fetching vehicles:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to fetch available vehicles'
        });
    }
});

/**
 * PUT /v1/vehicles/:vehicleId/status
 * Update vehicle availability status
 */
app.put('/v1/vehicles/:vehicleId/status', async (req, res) => {
    try {
        const { vehicleId } = req.params;
        const { status } = req.body;
        
        if (!status) {
            return res.status(400).json({
                error: 'Missing status',
                message: 'Status is required in request body'
            });
        }
        
        const result = await rosHandler.updateVehicleStatus(vehicleId, status);
        res.json(result);
    } catch (error) {
        console.error('Error updating vehicle status:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to update vehicle status'
        });
    }
});

/**
 * POST /v1/integration/process-order
 * Integration endpoint to process orders from CMS and coordinate with WMS
 */
app.post('/v1/integration/process-order', async (req, res) => {
    try {
        console.log('Received order processing request:', JSON.stringify(req.body, null, 2));
        
        const { orderId, clientId, deliveryAddress, items } = req.body;
        
        if (!orderId || !clientId || !deliveryAddress) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'orderId, clientId, and deliveryAddress are required'
            });
        }
        
        // Process the order and generate routes
        const result = await rosHandler.processOrderForRouteOptimization({
            orderId,
            clientId,
            deliveryAddress,
            items: items || []
        });
        
        console.log('Order processing completed:', JSON.stringify(result, null, 2));
        res.json(result);
    } catch (error) {
        console.error('Error processing order:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to process order for route optimization'
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: 'An unexpected error occurred'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        message: `Route ${req.method} ${req.path} not found`
    });
});

// Start server
app.listen(port, () => {
    console.log('='.repeat(50));
    console.log(`🚀 Route Optimisation System (ROS) API Server`);
    console.log(`🌐 Running on: http://localhost:${port}`);
    console.log(`📋 Health check: http://localhost:${port}/health`);
    console.log(`📚 API Base URL: ${restConfig.baseUrl}`);
    console.log(`⏰ Started at: ${new Date().toISOString()}`);
    console.log('='.repeat(50));
});

module.exports = app;