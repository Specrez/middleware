/**
 * Warehouse Management System Tests
 * Tests for package tracking and TCP/IP protocol functionality
 */

const { Package, PackageManager } = require('../models/package');
const { WMSProtocol, WMSTCPServer, MESSAGE_TYPES } = require('../protocol/tcp-protocol');
const WMSHandler = require('../handlers/wms-handler');
const wmsConfig = require('../config/wms-config.json');

// Test utilities
function createMockPackageData() {
    return {
        packageId: `PKG${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        clientId: 'CLIENT001',
        orderId: `ORDER${Date.now()}`,
        items: ['item1', 'item2'],
        deliveryAddress: '123 Test Street, Test City'
    };
}

function runTest(testName, testFunction) {
    try {
        testFunction();
        console.log(`✅ ${testName}: PASSED`);
        return true;
    } catch (error) {
        console.log(`❌ ${testName}: FAILED - ${error.message}`);
        return false;
    }
}

function assertEqual(actual, expected, message = 'Values should be equal') {
    if (actual !== expected) {
        throw new Error(`${message}. Expected: ${expected}, Got: ${actual}`);
    }
}

function assertTrue(condition, message = 'Condition should be true') {
    if (!condition) {
        throw new Error(message);
    }
}

// Test Results Tracker
let totalTests = 0;
let passedTests = 0;

console.log('='.repeat(50));
console.log('🧪 WMS Package Tracking System Tests');
console.log('='.repeat(50));

// Test 1: Package Model Creation
totalTests++;
if (runTest('Package Model Creation', () => {
    const packageData = createMockPackageData();
    const pkg = new Package(
        packageData.packageId,
        packageData.clientId,
        packageData.orderId,
        packageData.items,
        packageData.deliveryAddress
    );
    
    assertEqual(pkg.packageId, packageData.packageId);
    assertEqual(pkg.status, 'received');
    assertTrue(pkg.events.length > 0);
    assertEqual(pkg.events[0].eventType, 'received');
})) passedTests++;

// Test 2: Package Status Updates
totalTests++;
if (runTest('Package Status Updates', () => {
    const packageData = createMockPackageData();
    const pkg = new Package(packageData.packageId, packageData.clientId, packageData.orderId);
    
    // Test status progression
    pkg.updateStatus('stored', 'A1', 'Stored in zone A');
    assertEqual(pkg.status, 'stored');
    assertEqual(pkg.location, 'A1');
    
    pkg.updateStatus('picked', null, 'Picked for fulfillment');
    assertEqual(pkg.status, 'picked');
    
    pkg.assignToVehicle('VH001');
    assertEqual(pkg.status, 'loaded');
    assertEqual(pkg.assignedVehicle, 'VH001');
    
    assertTrue(pkg.events.length === 4); // received + stored + picked + loaded
})) passedTests++;

// Test 3: Package Manager Operations
totalTests++;
if (runTest('Package Manager Operations', () => {
    const packageManager = new PackageManager();
    const packageData = createMockPackageData();
    const pkg = new Package(packageData.packageId, packageData.clientId, packageData.orderId);
    
    // Add package
    packageManager.addPackage(pkg);
    assertTrue(packageManager.packages.size === 1);
    
    // Get package
    const retrievedPackage = packageManager.getPackage(packageData.packageId);
    assertEqual(retrievedPackage.packageId, packageData.packageId);
    
    // Update package status
    const updatedPackage = packageManager.updatePackageStatus(
        packageData.packageId, 
        'stored', 
        'B2', 
        'Test storage update'
    );
    assertEqual(updatedPackage.status, 'stored');
    assertEqual(updatedPackage.location, 'B2');
    
    // Get packages by status
    const storedPackages = packageManager.getPackagesByStatus('stored');
    assertTrue(storedPackages.length === 1);
    assertEqual(storedPackages[0].packageId, packageData.packageId);
})) passedTests++;

// Test 4: TCP Protocol Message Creation and Parsing
totalTests++;
if (runTest('TCP Protocol Message Creation and Parsing', () => {
    const protocol = new WMSProtocol();
    const testPayload = { packageId: 'PKG123', status: 'received', timestamp: Date.now() };
    
    // Create message
    const message = protocol.createMessage(MESSAGE_TYPES.PACKAGE_RECEIVED, testPayload);
    assertTrue(message.length > 20); // Should have proper structure
    assertTrue(message.startsWith('PKG_RCV')); // Should start with message type
    
    // Parse message
    const parsed = protocol.parseMessage(message);
    if (parsed) {
        assertEqual(parsed.type, MESSAGE_TYPES.PACKAGE_RECEIVED);
        assertEqual(parsed.payload.packageId, testPayload.packageId);
        assertEqual(parsed.payload.status, testPayload.status);
    } else {
        throw new Error('Failed to parse valid message');
    }
})) passedTests++;

// Test 5: WMS Handler Package Tracking
totalTests++;
if (runTest('WMS Handler Package Tracking', async () => {
    const wmsHandler = new WMSHandler(wmsConfig);
    const packageData = createMockPackageData();
    
    // Receive package
    const receiptResult = await wmsHandler.receivePackage(packageData);
    assertEqual(receiptResult.status, 'received');
    assertEqual(receiptResult.packageId, packageData.packageId);
    
    // Store package
    const storeResult = await wmsHandler.storePackage(packageData.packageId, 'A1');
    assertEqual(storeResult.status, 'stored');
    assertEqual(storeResult.location, 'A1');
    
    // Pick package
    const pickResult = await wmsHandler.pickPackage(packageData.packageId);
    assertEqual(pickResult.status, 'picked');
    
    // Load package
    const loadResult = await wmsHandler.loadPackage(packageData.packageId, 'VH001');
    assertEqual(loadResult.status, 'loaded');
    assertEqual(loadResult.vehicleId, 'VH001');
    
    // Track package
    const trackResult = await wmsHandler.trackPackage(packageData.packageId);
    assertEqual(trackResult.packageId, packageData.packageId);
    assertEqual(trackResult.currentStatus.status, 'loaded');
    assertTrue(trackResult.history.length === 4); // All status changes
})) passedTests++;

// Test 6: Package Lifecycle Validation
totalTests++;
if (runTest('Package Lifecycle Validation', () => {
    const packageData = createMockPackageData();
    const pkg = new Package(packageData.packageId, packageData.clientId, packageData.orderId);
    
    // Test initial state
    assertTrue(!pkg.isReadyForPickup()); // Should not be ready when just received
    assertTrue(!pkg.isLoaded());
    
    // Store package
    pkg.updateStatus('stored', 'A1');
    assertTrue(pkg.isReadyForPickup()); // Should be ready after storing
    assertTrue(!pkg.isLoaded());
    
    // Pick and load
    pkg.updateStatus('picked');
    pkg.assignToVehicle('VH001');
    assertTrue(pkg.isLoaded()); // Should be loaded
})) passedTests++;

// Test 7: Error Handling
totalTests++;
if (runTest('Error Handling', () => {
    const pkg = new Package('PKG123', 'CLIENT001', 'ORDER001');
    
    // Test invalid status update
    let errorThrown = false;
    try {
        pkg.updateStatus('invalid_status');
    } catch (error) {
        errorThrown = true;
        assertTrue(error.message.includes('Invalid status'));
    }
    assertTrue(errorThrown, 'Should throw error for invalid status');
    
    // Test package manager with non-existent package
    const packageManager = new PackageManager();
    const result = packageManager.updatePackageStatus('NON_EXISTENT', 'stored');
    assertTrue(result === null, 'Should return null for non-existent package');
})) passedTests++;

// Test 8: Statistics and Analytics
totalTests++;
if (runTest('Statistics and Analytics', async () => {
    const wmsHandler = new WMSHandler(wmsConfig);
    
    // Add multiple packages with different statuses
    const packages = [
        createMockPackageData(),
        createMockPackageData(), 
        createMockPackageData()
    ];
    
    for (const packageData of packages) {
        await wmsHandler.receivePackage(packageData);
    }
    
    // Store one package
    await wmsHandler.storePackage(packages[0].packageId, 'A1');
    
    // Pick and load another
    await wmsHandler.storePackage(packages[1].packageId, 'B1');
    await wmsHandler.pickPackage(packages[1].packageId);
    await wmsHandler.loadPackage(packages[1].packageId, 'VH001');
    
    // Get statistics
    const stats = await wmsHandler.getWarehouseStats();
    assertTrue(stats.packages.totalPackages === 3);
    assertTrue(stats.packages.statusBreakdown.received === 1);
    assertTrue(stats.packages.statusBreakdown.stored === 1);
    assertTrue(stats.packages.statusBreakdown.loaded === 1);
    
    // Test package filtering
    const storedPackages = await wmsHandler.getPackages('stored');
    assertTrue(storedPackages.count === 1);
    
    const allPackages = await wmsHandler.getPackages();
    assertTrue(allPackages.count === 3);
})) passedTests++;

// Test 9: Protocol Message Integrity
totalTests++;
if (runTest('Protocol Message Integrity', () => {
    const protocol = new WMSProtocol();
    const testPayload = { test: 'data', number: 123, array: [1, 2, 3] };
    
    // Create message
    const message = protocol.createMessage(MESSAGE_TYPES.STATUS_RESPONSE, testPayload);
    
    // Parse it back
    const parsed = protocol.parseMessage(message);
    
    // Verify integrity
    if (parsed) {
        assertEqual(JSON.stringify(parsed.payload), JSON.stringify(testPayload));
    } else {
        throw new Error('Failed to parse valid message');
    }
    
    // Test corrupted message
    const corruptedMessage = message.slice(0, -2) + '99'; // Change checksum
    const corruptedParsed = protocol.parseMessage(corruptedMessage);
    assertTrue(corruptedParsed === null, 'Should reject corrupted message');
})) passedTests++;

// Test 10: Integration with Legacy Methods
totalTests++;
if (runTest('Integration with Legacy Methods', async () => {
    const wmsHandler = new WMSHandler(wmsConfig);
    const packageData = createMockPackageData();
    
    // Receive and store package
    await wmsHandler.receivePackage(packageData);
    await wmsHandler.storePackage(packageData.packageId, 'A1');
    
    // Test legacy order fulfillment with package tracking
    const fulfillmentResult = await wmsHandler.handleOrderFulfillment({
        orderId: packageData.orderId,
        items: packageData.items,
        packageId: packageData.packageId
    });
    
    assertEqual(fulfillmentResult.status, 'fulfilled');
    assertEqual(fulfillmentResult.packageId, packageData.packageId);
    
    // Verify package was picked during fulfillment
    const trackResult = await wmsHandler.trackPackage(packageData.packageId);
    assertEqual(trackResult.currentStatus.status, 'picked');
})) passedTests++;

console.log('\n' + '='.repeat(50));
console.log('📊 Test Results Summary');
console.log('='.repeat(50));

const testResults = [
    'Package Model Creation',
    'Package Status Updates', 
    'Package Manager Operations',
    'TCP Protocol Message Creation and Parsing',
    'WMS Handler Package Tracking',
    'Package Lifecycle Validation',
    'Error Handling',
    'Statistics and Analytics',
    'Protocol Message Integrity',
    'Integration with Legacy Methods'
];

testResults.forEach((testName, index) => {
    const status = index < passedTests ? '✅ PASSED' : '❌ FAILED';
    console.log(`${status}: ${testName}`);
});

console.log('\n==============================');
console.log(`Total: ${totalTests}, Passed: ${passedTests}, Failed: ${totalTests - passedTests}`);

if (passedTests === totalTests) {
    console.log('🎉 All tests passed!');
} else {
    console.log('⚠️  Some tests failed. Please review the implementation.');
}

console.log('==============================');