/**
 * SwiftLogistics Middleware Integration
 * Orchestrates communication between CMS, ROS, and WMS systems
 */

const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');

// Import fetch for HTTP requests
const fetch = require('node-fetch');

// Import system handlers
const ROSHandler = require('./Route Optimisation System/handlers/ros-handler');
const rosConfig = require('./Route Optimisation System/rest-config.json');

// Initialize middleware application
const app = express();
const port = process.env.MIDDLEWARE_PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize handlers
const rosHandler = new ROSHandler(rosConfig);

// Logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'SwiftLogistics Middleware',
        version: '1.0.0',
        systems: {
            cms: 'Client Management System',
            ros: 'Route Optimisation System', 
            wms: 'Warehouse Management System'
        },
        timestamp: new Date().toISOString()
    });
});

/**
 * Middleware Integration Endpoints
 */

// WSO2 ESB configuration
const WSO2_ESB_BASE = process.env.WSO2_ESB_BASE || 'http://localhost:8280';
const WSO2_API_PATH = process.env.WSO2_API_PATH || '/api/v1';

/**
 * POST /api/orders/submit
 * Submit order via WSO2 ESB to CMS SOAP service
 */
app.post('/api/orders/submit', async (req, res) => {
    try {
        console.log('🔄 Routing order submission to WSO2 ESB (CMS SOAP)...');
        console.log('Order data:', JSON.stringify(req.body, null, 2));

        const response = await fetch(`${WSO2_ESB_BASE}${WSO2_API_PATH}/orders/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'WSO2 ESB request failed');
        }

        console.log('✅ Order submitted via WSO2 ESB to CMS');
        res.json({
            ...data,
            route: 'WSO2_ESB → CMS_SOAP',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error routing to WSO2 ESB:', error);
        res.status(500).json({
            error: 'Order submission failed',
            message: error.message,
            route: 'WSO2_ESB → CMS_SOAP'
        });
    }
});

/**
 * GET /api/contracts/:contractId
 * Get contract via WSO2 ESB from CMS SOAP service
 */
app.get('/api/contracts/:contractId', async (req, res) => {
    try {
        const { contractId } = req.params;
        console.log(`🔄 Routing contract lookup to WSO2 ESB (CMS SOAP): ${contractId}`);

        const response = await fetch(`${WSO2_ESB_BASE}${WSO2_API_PATH}/contracts/${contractId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'WSO2 ESB request failed');
        }

        console.log('✅ Contract retrieved via WSO2 ESB from CMS');
        res.json({
            ...data,
            route: 'WSO2_ESB → CMS_SOAP',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error routing to WSO2 ESB:', error);
        res.status(500).json({
            error: 'Contract lookup failed',
            message: error.message,
            route: 'WSO2_ESB → CMS_SOAP'
        });
    }
});

/**
 * Package tracking endpoints - Route to WSO2 ESB (WMS TCP via adapter)
 */

// Package receive
app.post('/api/packages/receive', async (req, res) => {
    try {
        console.log('🔄 Routing package receive to WSO2 ESB (WMS TCP)...');
        
        const response = await fetch(`${WSO2_ESB_BASE}${WSO2_API_PATH}/packages/receive`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'WSO2 ESB request failed');
        }

        res.json({
            ...data,
            route: 'WSO2_ESB → TCP_Adapter → WMS_TCP',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error routing to WSO2 ESB:', error);
        res.status(500).json({
            error: 'Package receive failed',
            message: error.message,
            route: 'WSO2_ESB → TCP_Adapter → WMS_TCP'
        });
    }
});

// Package status
app.get('/api/packages/status/:packageId', async (req, res) => {
    try {
        const { packageId } = req.params;
        console.log(`🔄 Routing package status to WSO2 ESB (WMS TCP): ${packageId}`);
        
        const response = await fetch(`${WSO2_ESB_BASE}${WSO2_API_PATH}/packages/status/${packageId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'WSO2 ESB request failed');
        }

        res.json({
            ...data,
            route: 'WSO2_ESB → TCP_Adapter → WMS_TCP',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error routing to WSO2 ESB:', error);
        res.status(500).json({
            error: 'Package status lookup failed',
            message: error.message,
            route: 'WSO2_ESB → TCP_Adapter → WMS_TCP'
        });
    }
});

/**
 * POST /api/orders/process
 * End-to-end order processing workflow
 * 1. Receives order from CMS via WSO2 ESB
 * 2. Optimizes route via ROS (direct REST)
 * 3. Coordinates with WMS via WSO2 ESB
 */
app.post('/api/orders/process', async (req, res) => {
    try {
        console.log('🔄 Starting end-to-end order processing...');
        console.log('Order data:', JSON.stringify(req.body, null, 2));

        const { orderId, clientId, deliveryAddress, items = [] } = req.body;

        if (!orderId || !clientId || !deliveryAddress) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'orderId, clientId, and deliveryAddress are required'
            });
        }

        // Step 1: Submit order via WSO2 ESB to CMS
        console.log('📝 Step 1: Order submission via WSO2 ESB (CMS SOAP)...');
        const cmsResponse = await fetch(`${WSO2_ESB_BASE}${WSO2_API_PATH}/orders/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
        });
        
        const cmsResult = await cmsResponse.json();
        if (!cmsResponse.ok) {
            throw new Error(`CMS submission failed: ${cmsResult.error}`);
        }

        // Step 2: Process through ROS for route optimization (direct REST)
        console.log('📍 Step 2: Route optimization via ROS (direct REST)...');
        const rosResult = await rosHandler.processOrderForRouteOptimization({
            orderId,
            clientId,
            deliveryAddress,
            items
        });

        // Step 3: Coordinate with WMS via WSO2 ESB (TCP adapter)
        console.log('📦 Step 3: WMS coordination via WSO2 ESB (TCP adapter)...');
        const wmsResponse = await fetch(`${WSO2_ESB_BASE}${WSO2_API_PATH}/packages/receive`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                packageId: orderId,
                clientId,
                items,
                deliveryAddress,
                vehicleId: rosResult.assignedVehicle
            })
        });
        
        const wmsResult = await wmsResponse.json();
        if (!wmsResponse.ok) {
            console.warn('⚠️ WMS coordination warning:', wmsResult.error);
        }

        // Step 4: Create integrated response
        const integratedResult = {
            orderId,
            clientId,
            status: 'processed',
            workflow: {
                cms: { 
                    status: cmsResult.success ? 'order_received' : 'failed', 
                    data: cmsResult,
                    route: 'WSO2_ESB → CMS_SOAP',
                    timestamp: new Date().toISOString() 
                },
                ros: { 
                    status: 'route_optimized', 
                    assignedVehicle: rosResult.assignedVehicle,
                    estimatedDelivery: rosResult.estimatedDelivery,
                    route: 'Direct_REST → ROS',
                    timestamp: rosResult.timestamp
                },
                wms: {
                    status: wmsResult.success ? 'fulfillment_scheduled' : 'warning',
                    data: wmsResult,
                    route: 'WSO2_ESB → TCP_Adapter → WMS_TCP',
                    timestamp: new Date().toISOString()
                }
            },
            deliverySchedule: {
                estimatedTime: rosResult.estimatedDelivery.time,
                estimatedDistance: rosResult.estimatedDelivery.distance,
                assignedVehicle: rosResult.assignedVehicle,
                deliveryAddress: deliveryAddress
            },
            timestamp: new Date().toISOString()
        };

        console.log('✅ Order processing completed successfully');
        res.json(integratedResult);

    } catch (error) {
        console.error('❌ Error in order processing:', error);
        res.status(500).json({
            error: 'Order processing failed',
            message: error.message
        });
    }
});

/**
 * GET /api/vehicles/status
 * Get consolidated vehicle status across all systems
 */
app.get('/api/vehicles/status', async (req, res) => {
    try {
        console.log('🚛 Fetching consolidated vehicle status...');

        const rosVehicles = await rosHandler.getAvailableVehicles();
        
        // Mock integration with WMS vehicle assignments
        const wmsVehicleAssignments = await simulateWMSVehicleIntegration();

        const consolidatedStatus = {
            vehicles: rosVehicles.vehicles.map(vehicle => ({
                ...vehicle,
                wmsAssignment: wmsVehicleAssignments.find(w => w.vehicleId === vehicle.vehicleId)
            })),
            summary: {
                ...rosVehicles.summary,
                withWMSAssignments: wmsVehicleAssignments.length
            },
            timestamp: new Date().toISOString()
        };

        res.json(consolidatedStatus);

    } catch (error) {
        console.error('❌ Error fetching vehicle status:', error);
        res.status(500).json({
            error: 'Vehicle status fetch failed',
            message: error.message
        });
    }
});

/**
 * POST /api/routes/optimize
 * Multi-system route optimization
 */
app.post('/api/routes/optimize', async (req, res) => {
    try {
        console.log('🗺️ Starting multi-system route optimization...');

        const { deliveryAddresses, preferredVehicles } = req.body;

        if (!deliveryAddresses || !Array.isArray(deliveryAddresses)) {
            return res.status(400).json({
                error: 'Invalid input',
                message: 'deliveryAddresses must be an array'
            });
        }

        // Get available vehicles from ROS
        const availableVehicles = await rosHandler.getAvailableVehicles();
        const vehiclesToUse = preferredVehicles || availableVehicles.vehicles.filter(v => v.status === 'available');

        // Optimize routes
        const routeResult = await rosHandler.calculateOptimalRoutes({
            deliveryAddresses,
            vehicles: vehiclesToUse
        });

        // Mock WMS inventory check
        const inventoryCheck = await simulateWMSInventoryCheck(deliveryAddresses);

        const multiSystemResult = {
            ...routeResult,
            inventoryStatus: inventoryCheck,
            systemIntegration: {
                ros: 'Route optimization completed',
                wms: 'Inventory verified',
                cms: 'Ready for order assignment'
            }
        };

        res.json(multiSystemResult);

    } catch (error) {
        console.error('❌ Error in route optimization:', error);
        res.status(500).json({
            error: 'Route optimization failed', 
            message: error.message
        });
    }
});

/**
 * GET /api/analytics/dashboard
 * Integrated analytics dashboard
 */
app.get('/api/analytics/dashboard', async (req, res) => {
    try {
        console.log('📊 Generating integrated analytics dashboard...');

        const rosAnalytics = await rosHandler.getRouteAnalytics();
        const systemMetrics = await getSystemMetrics();

        const dashboard = {
            overview: {
                totalOrders: systemMetrics.totalOrders,
                activeRoutes: systemMetrics.activeRoutes,
                systemUptime: systemMetrics.uptime
            },
            routeOptimization: rosAnalytics,
            systemHealth: {
                cms: { status: 'operational', uptime: '99.9%' },
                ros: { status: 'operational', uptime: '99.8%' },
                wms: { status: 'operational', uptime: '99.7%' }
            },
            performance: {
                avgProcessingTime: '2.3s',
                successRate: '99.2%',
                customerSatisfaction: '4.8/5'
            },
            timestamp: new Date().toISOString()
        };

        res.json(dashboard);

    } catch (error) {
        console.error('❌ Error generating dashboard:', error);
        res.status(500).json({
            error: 'Dashboard generation failed',
            message: error.message
        });
    }
});

/**
 * Direct ROS (Route Optimization System) endpoints - bypass WSO2 ESB
 * These maintain the original REST JSON functionality
 */

/**
 * POST /api/routes/calculate
 * Direct route calculation via ROS
 */
app.post('/api/routes/calculate', async (req, res) => {
    try {
        console.log('🗺️ Direct route calculation via ROS...');
        const result = await rosHandler.calculateOptimalRoutes(req.body);
        
        res.json({
            ...result,
            route: 'Direct_REST → ROS',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ ROS route calculation error:', error);
        res.status(500).json({
            error: 'Route calculation failed',
            message: error.message,
            route: 'Direct_REST → ROS'
        });
    }
});

/**
 * GET /api/vehicles/status
 * Direct vehicle status via ROS
 */
app.get('/api/vehicles/status', async (req, res) => {
    try {
        console.log('🚛 Getting vehicle status via ROS...');
        const vehicles = await rosHandler.getAvailableVehicles();
        
        res.json({
            ...vehicles,
            route: 'Direct_REST → ROS',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ ROS vehicle status error:', error);
        res.status(500).json({
            error: 'Vehicle status fetch failed',
            message: error.message,
            route: 'Direct_REST → ROS'
        });
    }
});

/**
 * GET /api/analytics/dashboard
 * Dashboard data combining direct ROS with system metrics
 */
app.get('/api/analytics/dashboard', async (req, res) => {
    try {
        console.log('📊 Generating dashboard data...');
        
        // Get ROS data directly
        const vehicles = await rosHandler.getAvailableVehicles();
        const systemMetrics = await getSystemMetrics();
        
        const dashboardData = {
            metrics: systemMetrics,
            vehicles: vehicles.vehicles || [],
            routes: vehicles.activeRoutes || [],
            systemStatus: {
                ros: 'operational - direct_rest',
                cms: 'operational - wso2_esb_soap', 
                wms: 'operational - wso2_esb_tcp',
                middleware: 'operational'
            },
            route: 'Direct_REST → ROS + System_Metrics',
            timestamp: new Date().toISOString()
        };

        res.json(dashboardData);
        
    } catch (error) {
        console.error('❌ Dashboard generation error:', error);
        res.status(500).json({
            error: 'Dashboard generation failed',
            message: error.message,
            route: 'Direct_REST → ROS + System_Metrics'
        });
    }
});

/**
 * Helper functions for system simulation
 */

async function simulateWMSCoordination(orderId, items, vehicleId) {
    // Simulate WMS processing time
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
        warehouseId: 'WH001',
        pickingList: items.map(item => ({
            item,
            location: `A${Math.floor(Math.random() * 99) + 1}`,
            quantity: 1
        })),
        assignedVehicle: vehicleId,
        status: 'scheduled',
        timestamp: new Date().toISOString()
    };
}

async function simulateWMSVehicleIntegration() {
    return [
        { vehicleId: 'VH001', warehouseAssignment: 'WH001', loadStatus: 'empty' },
        { vehicleId: 'VH002', warehouseAssignment: 'WH002', loadStatus: 'partial' }
    ];
}

async function simulateWMSInventoryCheck(addresses) {
    return {
        status: 'available',
        itemsInStock: addresses.length * 2,
        warehousesInvolved: ['WH001', 'WH002'],
        fulfillmentReady: true
    };
}

async function getSystemMetrics() {
    return {
        totalOrders: Math.floor(Math.random() * 1000) + 500,
        activeRoutes: Math.floor(Math.random() * 50) + 10,
        uptime: '99.5%'
    };
}

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
    console.log('='.repeat(60));
    console.log(`🚀 SwiftLogistics Middleware Integration Server`);
    console.log(`🌐 Running on: http://localhost:${port}`);
    console.log(`📋 Health check: http://localhost:${port}/health`);
    console.log(`📊 Dashboard: http://localhost:${port}/api/analytics/dashboard`);
    console.log(`⏰ Started at: ${new Date().toISOString()}`);
    console.log('='.repeat(60));
    console.log('🔗 Integrated Systems:');
    console.log('  📞 CMS: Client Management System (SOAP)');
    console.log('  🗺️  ROS: Route Optimisation System (REST)');
    console.log('  📦 WMS: Warehouse Management System');
    console.log('='.repeat(60));
});

module.exports = app;