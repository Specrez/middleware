/**
 * WMS Package Tracking Demo
 * Demonstrates the complete package lifecycle in the warehouse management system
 */

const WMSHandler = require('./handlers/wms-handler');
const { WMSTCPServer } = require('./protocol/tcp-protocol');
const wmsConfig = require('./config/wms-config.json');

async function runDemo() {
    console.log('='.repeat(60));
    console.log('🏭 WMS Package Tracking System Demo');
    console.log('='.repeat(60));

    // Initialize TCP server (but don't start it for demo)
    const tcpServer = new WMSTCPServer(8080);
    const wmsHandler = new WMSHandler(wmsConfig, tcpServer);

    try {
        // Step 1: Receive package from client
        console.log('\n📥 Step 1: Receiving package from client...');
        const packageData = {
            packageId: 'PKG-DEMO-001',
            clientId: 'CLIENT-ACME',
            orderId: 'ORDER-2025-001',
            items: ['Widget A', 'Widget B', 'Gadget C'],
            deliveryAddress: '123 Demo Street, Test City, TC 12345'
        };

        const receiptResult = await wmsHandler.receivePackage(packageData);
        console.log('✅ Package received:', JSON.stringify(receiptResult, null, 2));

        // Step 2: Store package in warehouse
        console.log('\n📍 Step 2: Storing package in warehouse location...');
        const storeResult = await wmsHandler.storePackage('PKG-DEMO-001', 'A1-SHELF-05');
        console.log('✅ Package stored:', JSON.stringify(storeResult, null, 2));

        // Step 3: Track package status
        console.log('\n🔍 Step 3: Tracking package status...');
        const trackResult = await wmsHandler.trackPackage('PKG-DEMO-001');
        console.log('✅ Package tracking:', JSON.stringify(trackResult, null, 2));

        // Step 4: Pick package for fulfillment
        console.log('\n📋 Step 4: Picking package for order fulfillment...');
        const pickResult = await wmsHandler.pickPackage('PKG-DEMO-001');
        console.log('✅ Package picked:', JSON.stringify(pickResult, null, 2));

        // Step 5: Load package onto vehicle
        console.log('\n🚛 Step 5: Loading package onto delivery vehicle...');
        const loadResult = await wmsHandler.loadPackage('PKG-DEMO-001', 'VH-TRUCK-101');
        console.log('✅ Package loaded:', JSON.stringify(loadResult, null, 2));

        // Step 6: Final package tracking
        console.log('\n🔍 Step 6: Final package status and complete history...');
        const finalTrackResult = await wmsHandler.trackPackage('PKG-DEMO-001');
        console.log('✅ Complete package history:');
        console.log(JSON.stringify(finalTrackResult, null, 2));

        // Step 7: Warehouse statistics
        console.log('\n📊 Step 7: Warehouse statistics...');
        const stats = await wmsHandler.getWarehouseStats();
        console.log('✅ Warehouse stats:', JSON.stringify(stats, null, 2));

        // Step 8: Demonstrate multiple package management
        console.log('\n📦 Step 8: Adding more packages for bulk operations...');
        
        const package2 = await wmsHandler.receivePackage({
            packageId: 'PKG-DEMO-002',
            clientId: 'CLIENT-TECH',
            orderId: 'ORDER-2025-002',
            items: ['Laptop', 'Mouse', 'Keyboard'],
            deliveryAddress: '456 Tech Avenue, Silicon Valley, SV 67890'
        });

        const package3 = await wmsHandler.receivePackage({
            packageId: 'PKG-DEMO-003', 
            clientId: 'CLIENT-RETAIL',
            orderId: 'ORDER-2025-003',
            items: ['T-Shirt', 'Jeans', 'Sneakers'],
            deliveryAddress: '789 Fashion Blvd, Trendy Town, TT 11111'
        });

        console.log('✅ Additional packages received');

        // Store packages in different locations
        await wmsHandler.storePackage('PKG-DEMO-002', 'B2-SHELF-12');
        await wmsHandler.storePackage('PKG-DEMO-003', 'C3-SHELF-08');

        // Get all packages
        console.log('\n📋 Step 9: Listing all packages in warehouse...');
        const allPackages = await wmsHandler.getPackages();
        console.log('✅ All packages:', JSON.stringify(allPackages, null, 2));

        // Get packages by status
        console.log('\n📋 Step 10: Filtering packages by status...');
        const storedPackages = await wmsHandler.getPackages('stored');
        console.log('✅ Stored packages:', JSON.stringify(storedPackages, null, 2));

        const loadedPackages = await wmsHandler.getPackages('loaded');
        console.log('✅ Loaded packages:', JSON.stringify(loadedPackages, null, 2));

        // Final statistics
        console.log('\n📊 Final warehouse statistics:');
        const finalStats = await wmsHandler.getWarehouseStats();
        console.log('✅ Final stats:', JSON.stringify(finalStats, null, 2));

        console.log('\n' + '='.repeat(60));
        console.log('🎉 WMS Package Tracking Demo Completed Successfully!');
        console.log('='.repeat(60));

        // Demo protocol message format
        console.log('\n📡 TCP Protocol Demo:');
        console.log('Sample real-time package update messages:');
        
        const sampleMessages = [
            'PKG_RCV0045' + Date.now() + '{"packageId":"PKG001","status":"received"}' + '89',
            'PKG_STR0043' + Date.now() + '{"packageId":"PKG001","status":"stored"}' + '76',
            'PKG_PCK0042' + Date.now() + '{"packageId":"PKG001","status":"picked"}' + '62',
            'PKG_LDD0042' + Date.now() + '{"packageId":"PKG001","status":"loaded"}' + '58'
        ];

        sampleMessages.forEach((msg, index) => {
            console.log(`${index + 1}. ${msg.substring(0, 50)}...`);
        });

        console.log('\n✅ Demo completed! The WMS system is ready for production use.');
        
    } catch (error) {
        console.error('❌ Demo error:', error);
    }
}

// Run the demo
if (require.main === module) {
    runDemo();
}

module.exports = { runDemo };