#!/usr/bin/env node

/**
 * CMS Server Demonstration
 * Shows how to interact with the Client Management System SOAP services
 */

const soap = require('soap');

async function demonstrateCMSServices() {
    const baseUrl = 'http://localhost:8080';
    
    console.log('🚀 CMS Server Demonstration');
    console.log('============================\n');
    
    try {
        // Demonstrate Contract Service
        console.log('📋 Testing Contract Management...');
        const contractClient = await soap.createClientAsync(`${baseUrl}/cms/contracts?wsdl`);
        const contractResult = await contractClient.GetContractAsync({
            contractId: 'CONTRACT_12345'
        });
        console.log('Contract Response:', JSON.stringify(contractResult[0], null, 2));
        
        // Demonstrate Billing Service
        console.log('\n💰 Testing Billing Processing...');
        const billingClient = await soap.createClientAsync(`${baseUrl}/cms/billing?wsdl`);
        const billingResult = await billingClient.ProcessBillingAsync({
            billingId: 'BILL_67890',
            amount: 2500.75,
            clientId: 'CLIENT_ABC123'
        });
        console.log('Billing Response:', JSON.stringify(billingResult[0], null, 2));
        
        // Demonstrate Order Service
        console.log('\n📦 Testing Order Intake...');
        const orderClient = await soap.createClientAsync(`${baseUrl}/cms/orders?wsdl`);
        const orderResult = await orderClient.ProcessOrderAsync({
            orderId: 'ORDER_54321',
            clientId: 'CLIENT_ABC123',
            items: ['LAPTOP_001', 'MOUSE_002', 'KEYBOARD_003'],
            deliveryAddress: '456 Business Ave, Enterprise District, City 12345'
        });
        console.log('Order Response:', JSON.stringify(orderResult[0], null, 2));
        
        console.log('\n✅ All CMS services are working correctly!');
        console.log('\n🌐 Available Endpoints:');
        console.log('- Contract Service: http://localhost:8080/cms/contracts?wsdl');
        console.log('- Billing Service: http://localhost:8080/cms/billing?wsdl');
        console.log('- Order Service: http://localhost:8080/cms/orders?wsdl');
        console.log('- Health Check: http://localhost:8080/health');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('\n💡 Make sure the CMS server is running:');
        console.log('   cd "Client Management System" && npm start');
    }
}

// Run demonstration
demonstrateCMSServices().catch(console.error);