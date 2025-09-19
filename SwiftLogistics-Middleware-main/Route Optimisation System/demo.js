/**
 * Route Optimisation System Demo
 * Demonstrates the functionality of the ROS system
 */

const ROSHandler = require('./handlers/ros-handler');
const restConfig = require('./rest-config.json');

// Demo data
const demoDeliveryAddresses = [
    {
        address: "Empire State Building, 350 5th Ave, New York, NY",
        latitude: 40.7484,
        longitude: -73.9857,
        priority: 1
    },
    {
        address: "Times Square, New York, NY",
        latitude: 40.7580,
        longitude: -73.9855,
        priority: 2
    },
    {
        address: "Central Park, New York, NY",
        latitude: 40.7829,
        longitude: -73.9654,
        priority: 1
    },
    {
        address: "Brooklyn Bridge, New York, NY",
        latitude: 40.7061,
        longitude: -73.9969,
        priority: 3
    },
    {
        address: "Statue of Liberty, New York, NY",
        latitude: 40.6892,
        longitude: -74.0445,
        priority: 2
    },
    {
        address: "One World Trade Center, New York, NY",
        latitude: 40.7127,
        longitude: -74.0134,
        priority: 1
    }
];

const demoVehicles = [
    {
        vehicleId: 'DEMO_VH001',
        capacity: 1200,
        currentLocation: { latitude: 40.7128, longitude: -74.0060 } // Lower Manhattan
    },
    {
        vehicleId: 'DEMO_VH002',
        capacity: 1500,
        currentLocation: { latitude: 40.7589, longitude: -73.9851 } // Midtown
    },
    {
        vehicleId: 'DEMO_VH003',
        capacity: 800,
        currentLocation: { latitude: 40.6782, longitude: -73.9442 } // Brooklyn
    }
];

/**
 * Demo helper functions
 */
function printSeparator(title = '') {
    console.log('\n' + '='.repeat(60));
    if (title) {
        console.log(`🚀 ${title}`);
        console.log('='.repeat(60));
    }
}

function printSubSection(title) {
    console.log(`\n📋 ${title}`);
    console.log('-'.repeat(40));
}

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main demo function
 */
async function runDemo() {
    printSeparator('Route Optimisation System Demo');
    
    console.log('Welcome to the SwiftLogistics Route Optimisation System!');
    console.log('This demo will showcase the key features of our ROS middleware.');
    
    // Initialize ROS handler
    console.log('\n🔧 Initializing Route Optimisation System...');
    const rosHandler = new ROSHandler(restConfig);
    await delay(1000);
    console.log('✅ ROS System initialized successfully!');

    // Demo 1: Vehicle Management
    printSubSection('Vehicle Management');
    console.log('Fetching available vehicles...');
    const vehiclesResult = await rosHandler.getAvailableVehicles();
    console.log(`Found ${vehiclesResult.summary.total} vehicles (${vehiclesResult.summary.available} available)`);
    
    vehiclesResult.vehicles.forEach(vehicle => {
        const statusEmoji = vehicle.status === 'available' ? '🟢' : '🔴';
        console.log(`  ${statusEmoji} ${vehicle.vehicleId}: Capacity ${vehicle.capacity}, Status: ${vehicle.status}`);
    });

    await delay(2000);

    // Demo 2: Route Calculation
    printSubSection('Route Optimization Calculation');
    console.log(`Calculating optimal routes for ${demoDeliveryAddresses.length} delivery addresses...`);
    
    console.log('\n📍 Delivery Addresses:');
    demoDeliveryAddresses.forEach((addr, index) => {
        console.log(`  ${index + 1}. ${addr.address} (Priority: ${addr.priority})`);
    });
    
    console.log('\n🚛 Available Vehicles:');
    demoVehicles.forEach(vehicle => {
        console.log(`  • ${vehicle.vehicleId}: Capacity ${vehicle.capacity}`);
    });

    await delay(2000);
    
    const routeResult = await rosHandler.calculateOptimalRoutes({
        deliveryAddresses: demoDeliveryAddresses,
        vehicles: demoVehicles
    });

    console.log('\n🎯 Optimized Routes Generated:');
    console.log(`Algorithm: ${routeResult.optimization.algorithm}`);
    console.log(`Processing Time: ${routeResult.optimization.processingTime}`);
    
    routeResult.optimizedRoutes.forEach((route, index) => {
        console.log(`\n  Route ${index + 1} - Vehicle ${route.vehicleId}:`);
        console.log(`    📦 Addresses: ${route.addressCount}`);
        console.log(`    🛣️  Total Distance: ${route.totalDistance} km`);
        console.log(`    ⏱️  Estimated Time: ${route.estimatedTime} minutes`);
        console.log(`    🗺️  Route Order:`);
        route.route.forEach((address, idx) => {
            console.log(`      ${idx + 1}. ${address}`);
        });
    });

    console.log('\n📊 Route Summary:');
    console.log(`  Total Vehicles Used: ${routeResult.summary.totalVehicles}`);
    console.log(`  Total Distance: ${routeResult.summary.totalDistance.toFixed(2)} km`);
    console.log(`  Average Time per Route: ${routeResult.summary.averageTimePerRoute.toFixed(0)} minutes`);

    await delay(3000);

    // Demo 3: Order Processing Integration
    printSubSection('Order Processing Integration');
    const sampleOrder = {
        orderId: 'DEMO_ORD001',
        clientId: 'DEMO_CL001',
        deliveryAddress: {
            address: "Madison Square Garden, New York, NY",
            latitude: 40.7505,
            longitude: -73.9934
        },
        items: ['Package A', 'Package B', 'Package C']
    };

    console.log('Processing sample order from CMS...');
    console.log(`Order ID: ${sampleOrder.orderId}`);
    console.log(`Delivery: ${sampleOrder.deliveryAddress.address}`);
    console.log(`Items: ${sampleOrder.items.join(', ')}`);

    await delay(1500);

    const orderResult = await rosHandler.processOrderForRouteOptimization(sampleOrder);
    console.log('\n✅ Order processed successfully!');
    console.log(`Status: ${orderResult.status}`);
    console.log(`Assigned Vehicle: ${orderResult.assignedVehicle}`);
    console.log(`Estimated Delivery Time: ${orderResult.estimatedDelivery.time} minutes`);
    console.log(`Estimated Distance: ${orderResult.estimatedDelivery.distance} km`);

    await delay(2000);

    // Demo 4: Vehicle Status Management
    printSubSection('Vehicle Status Management');
    console.log('Updating vehicle statuses...');
    
    await rosHandler.updateVehicleStatus('VH001', 'in-transit');
    console.log('✅ VH001 → in-transit');
    await delay(500);
    
    await rosHandler.updateVehicleStatus('VH002', 'loading');
    console.log('✅ VH002 → loading');
    await delay(500);
    
    const updatedVehicles = await rosHandler.getAvailableVehicles();
    console.log(`\nUpdated vehicle status - Available: ${updatedVehicles.summary.available}/${updatedVehicles.summary.total}`);

    await delay(2000);

    // Demo 5: Analytics
    printSubSection('Route Analytics');
    const analytics = await rosHandler.getRouteAnalytics();
    
    console.log('📈 System Analytics:');
    console.log(`  Vehicle Utilization: ${analytics.vehicleAnalytics.utilizationRate}`);
    console.log(`  Algorithm: ${analytics.systemMetrics.algorithmType}`);
    console.log(`  Average Processing Time: ${analytics.systemMetrics.averageOptimizationTime}`);
    console.log(`  Success Rate: ${analytics.systemMetrics.successRate}`);
    
    console.log('\n🚛 Vehicle Status Breakdown:');
    Object.entries(analytics.vehicleAnalytics.statusBreakdown).forEach(([status, count]) => {
        const emoji = status === 'available' ? '🟢' : status === 'in-transit' ? '🔄' : '🔴';
        console.log(`  ${emoji} ${status}: ${count} vehicles`);
    });

    await delay(2000);

    // Demo conclusion
    printSeparator('Demo Complete');
    console.log('🎉 Route Optimisation System demo completed successfully!');
    console.log('\nKey Features Demonstrated:');
    console.log('  ✅ Advanced route optimization algorithms');
    console.log('  ✅ Vehicle management and status tracking');
    console.log('  ✅ CMS order processing integration');
    console.log('  ✅ Real-time analytics and reporting');
    console.log('  ✅ RESTful API endpoints for system integration');
    
    console.log('\n🌐 API Endpoints Available:');
    console.log('  POST /v1/routes/calculate - Calculate optimal routes');
    console.log('  GET  /v1/vehicles - Get available vehicles');
    console.log('  PUT  /v1/vehicles/{id}/status - Update vehicle status');
    console.log('  POST /v1/integration/process-order - Process orders');
    console.log('  GET  /health - System health check');

    console.log('\n📚 To start the ROS server: npm start');
    console.log('🧪 To run tests: npm test');
    console.log('📖 More details in README.md');
    
    console.log('\nThank you for exploring the SwiftLogistics Route Optimisation System! 🚀');
}

// Run the demo
if (require.main === module) {
    runDemo().catch(console.error);
}

module.exports = { runDemo };