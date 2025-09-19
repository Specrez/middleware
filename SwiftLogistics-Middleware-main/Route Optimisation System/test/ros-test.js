/**
 * Route Optimisation System Tests
 * Tests for ROS REST API and route optimization functionality
 */

const http = require('http');
const ROSHandler = require('../handlers/ros-handler');
const restConfig = require('../rest-config.json');

// Test data
const testDeliveryAddresses = [
    {
        address: "123 Main St, New York, NY",
        latitude: 40.7128,
        longitude: -74.0060,
        priority: 1
    },
    {
        address: "456 Broadway, New York, NY", 
        latitude: 40.7589,
        longitude: -73.9851,
        priority: 2
    },
    {
        address: "789 Fifth Ave, New York, NY",
        latitude: 40.7505,
        longitude: -73.9934,
        priority: 1
    },
    {
        address: "321 Park Ave, New York, NY",
        latitude: 40.7282,
        longitude: -73.9942,
        priority: 3
    }
];

const testVehicles = [
    {
        vehicleId: 'VH001',
        capacity: 1000,
        currentLocation: { latitude: 40.7128, longitude: -74.0060 }
    },
    {
        vehicleId: 'VH002', 
        capacity: 1500,
        currentLocation: { latitude: 40.7589, longitude: -73.9851 }
    }
];

// Test results tracking
let testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    details: []
};

/**
 * Test helper function
 */
function runTest(testName, testFunction) {
    testResults.total++;
    console.log(`\nTesting ${testName}...`);
    
    try {
        const result = testFunction();
        if (result === true || (result && result.success !== false)) {
            console.log(`✓ ${testName} passed`);
            testResults.passed++;
            testResults.details.push({ test: testName, status: 'PASSED' });
            return true;
        } else {
            console.log(`✗ ${testName} failed:`, result.error || 'Unknown error');
            testResults.failed++;
            testResults.details.push({ test: testName, status: 'FAILED', error: result.error });
            return false;
        }
    } catch (error) {
        console.log(`✗ ${testName} failed:`, error.message);
        testResults.failed++;
        testResults.details.push({ test: testName, status: 'FAILED', error: error.message });
        return false;
    }
}

/**
 * Async test helper function
 */
async function runAsyncTest(testName, testFunction) {
    testResults.total++;
    console.log(`\nTesting ${testName}...`);
    
    try {
        const result = await testFunction();
        if (result === true || (result && result.success !== false)) {
            console.log(`✓ ${testName} passed`);
            testResults.passed++;
            testResults.details.push({ test: testName, status: 'PASSED' });
            return true;
        } else {
            console.log(`✗ ${testName} failed:`, result.error || 'Unknown error');
            testResults.failed++;
            testResults.details.push({ test: testName, status: 'FAILED', error: result.error });
            return false;
        }
    } catch (error) {
        console.log(`✗ ${testName} failed:`, error.message);
        testResults.failed++;
        testResults.details.push({ test: testName, status: 'FAILED', error: error.message });
        return false;
    }
}

/**
 * HTTP Request helper
 */
function makeRequest(options, data) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let responseData = '';
            res.on('data', chunk => responseData += chunk);
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(responseData);
                    resolve({ statusCode: res.statusCode, data: parsedData });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, data: responseData });
                }
            });
        });

        req.on('error', reject);
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

/**
 * Test Suite
 */
async function runTests() {
    console.log('='.repeat(50));
    console.log('🧪 ROS System Tests');
    console.log('='.repeat(50));

    // Initialize ROS handler
    const rosHandler = new ROSHandler(restConfig);

    // Test 1: ROS Handler Initialization
    runTest('ROS Handler Initialization', () => {
        return rosHandler && rosHandler.config && rosHandler.baseUrl;
    });

    // Test 2: Vehicle Management
    await runAsyncTest('Vehicle Management - Get Available Vehicles', async () => {
        const result = await rosHandler.getAvailableVehicles();
        return result && result.vehicles && Array.isArray(result.vehicles) && result.vehicles.length > 0;
    });

    // Test 3: Vehicle Status Update
    await runAsyncTest('Vehicle Status Update', async () => {
        const result = await rosHandler.updateVehicleStatus('VH001', 'in-transit');
        return result && result.vehicleId === 'VH001' && result.status === 'in-transit' && result.updated === true;
    });

    // Test 4: Route Calculation
    await runAsyncTest('Route Calculation with Multiple Addresses', async () => {
        const result = await rosHandler.calculateOptimalRoutes({
            deliveryAddresses: testDeliveryAddresses,
            vehicles: testVehicles
        });
        
        return result && 
               result.optimizedRoutes && 
               Array.isArray(result.optimizedRoutes) &&
               result.optimizedRoutes.length > 0 &&
               result.optimizedRoutes[0].vehicleId &&
               result.optimizedRoutes[0].route &&
               result.summary;
    });

    // Test 5: Distance Calculation
    runTest('Distance Calculation Algorithm', () => {
        const point1 = { latitude: 40.7128, longitude: -74.0060 };
        const point2 = { latitude: 40.7589, longitude: -73.9851 };
        const distance = rosHandler.calculateDistance(point1, point2);
        
        return distance > 0 && distance < 100; // Should be a reasonable distance in NYC
    });

    // Test 6: Order Processing Integration
    await runAsyncTest('Order Processing Integration', async () => {
        const orderData = {
            orderId: 'ORD001',
            clientId: 'CL001',
            deliveryAddress: {
                address: "123 Test St, New York, NY",
                latitude: 40.7128,
                longitude: -74.0060
            },
            items: ['item1', 'item2']
        };
        
        const result = await rosHandler.processOrderForRouteOptimization(orderData);
        return result && result.orderId === 'ORD001' && result.status;
    });

    // Test 7: Route Analytics
    await runAsyncTest('Route Analytics Generation', async () => {
        const result = await rosHandler.getRouteAnalytics();
        return result && result.vehicleAnalytics && result.systemMetrics;
    });

    // Test 8: Input Validation
    await runAsyncTest('Input Validation - Empty Addresses', async () => {
        try {
            await rosHandler.calculateOptimalRoutes({
                deliveryAddresses: [],
                vehicles: testVehicles
            });
            return false; // Should have thrown an error
        } catch (error) {
            return true; // Error was expected
        }
    });

    // Test 9: Route Optimization Algorithm
    runTest('Route Optimization Algorithm - Nearest Neighbor', () => {
        const startLocation = { latitude: 40.7128, longitude: -74.0060 };
        const addresses = [
            { latitude: 40.7589, longitude: -73.9851, address: "Address 1" },
            { latitude: 40.7282, longitude: -73.9942, address: "Address 2" },
            { latitude: 40.7505, longitude: -73.9934, address: "Address 3" }
        ];
        
        const optimized = rosHandler.optimizeRouteOrder(addresses, startLocation);
        return optimized && optimized.length === addresses.length;
    });

    // Print test results
    console.log('\n' + '='.repeat(50));
    console.log('📊 Test Results Summary');
    console.log('='.repeat(50));
    
    testResults.details.forEach(test => {
        const icon = test.status === 'PASSED' ? '✓' : '✗';
        const status = test.status === 'PASSED' ? 'PASSED' : 'FAILED';
        console.log(`${icon} ${test.test}: ${status}`);
        if (test.error) {
            console.log(`   Error: ${test.error}`);
        }
    });

    console.log('\n' + '='.repeat(30));
    console.log(`Total: ${testResults.total}, Passed: ${testResults.passed}, Failed: ${testResults.failed}`);
    
    if (testResults.failed === 0) {
        console.log('🎉 All tests passed!');
        process.exit(0);
    } else {
        console.log('❌ Some tests failed.');
        process.exit(1);
    }
}

// Run the tests
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { runTests, testResults };