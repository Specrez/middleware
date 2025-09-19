/**
 * CMS SOAP Client Test
 * Tests the Client Management System SOAP server functionality
 */

const soap = require('soap');

class CMSTestClient {
    constructor() {
        this.baseUrl = 'http://localhost:8080';
        this.testResults = [];
    }

    /**
     * Run all CMS tests
     */
    async runAllTests() {
        console.log('\n=== CMS SOAP Server Tests ===\n');
        
        try {
            await this.testContractService();
            await this.testBillingService();
            await this.testOrderService();
            
            this.printResults();
        } catch (error) {
            console.error('Test suite error:', error.message);
            console.log('\nMake sure the CMS server is running: npm start');
        }
    }

    /**
     * Test Contract Service
     */
    async testContractService() {
        try {
            console.log('Testing Contract Service...');
            const wsdlUrl = `${this.baseUrl}/cms/contracts?wsdl`;
            
            const client = await soap.createClientAsync(wsdlUrl);
            
            const args = {
                contractId: 'CONTRACT_001'
            };
            
            const [result] = await client.GetContractAsync(args);
            
            console.log('✓ Contract Service Response:', JSON.stringify(result, null, 2));
            this.testResults.push({ test: 'Contract Service', status: 'PASSED' });
            
        } catch (error) {
            console.error('✗ Contract Service failed:', error.message);
            this.testResults.push({ test: 'Contract Service', status: 'FAILED', error: error.message });
        }
    }

    /**
     * Test Billing Service
     */
    async testBillingService() {
        try {
            console.log('\nTesting Billing Service...');
            const wsdlUrl = `${this.baseUrl}/cms/billing?wsdl`;
            
            const client = await soap.createClientAsync(wsdlUrl);
            
            const args = {
                billingId: 'BILL_001',
                amount: 1250.50,
                clientId: 'CLIENT_001'
            };
            
            const [result] = await client.ProcessBillingAsync(args);
            
            console.log('✓ Billing Service Response:', JSON.stringify(result, null, 2));
            this.testResults.push({ test: 'Billing Service', status: 'PASSED' });
            
        } catch (error) {
            console.error('✗ Billing Service failed:', error.message);
            this.testResults.push({ test: 'Billing Service', status: 'FAILED', error: error.message });
        }
    }

    /**
     * Test Order Service
     */
    async testOrderService() {
        try {
            console.log('\nTesting Order Service...');
            const wsdlUrl = `${this.baseUrl}/cms/orders?wsdl`;
            
            const client = await soap.createClientAsync(wsdlUrl);
            
            const args = {
                orderId: 'ORDER_001',
                clientId: 'CLIENT_001',
                items: ['ITEM_001', 'ITEM_002'],
                deliveryAddress: '123 Main St, City, State'
            };
            
            const [result] = await client.ProcessOrderAsync(args);
            
            console.log('✓ Order Service Response:', JSON.stringify(result, null, 2));
            this.testResults.push({ test: 'Order Service', status: 'PASSED' });
            
        } catch (error) {
            console.error('✗ Order Service failed:', error.message);
            this.testResults.push({ test: 'Order Service', status: 'FAILED', error: error.message });
        }
    }

    /**
     * Test server health endpoint
     */
    async testHealthEndpoint() {
        try {
            const fetch = require('node-fetch');
            const response = await fetch(`${this.baseUrl}/health`);
            const result = await response.json();
            
            console.log('✓ Health Check Response:', JSON.stringify(result, null, 2));
            this.testResults.push({ test: 'Health Check', status: 'PASSED' });
            
        } catch (error) {
            console.error('✗ Health Check failed:', error.message);
            this.testResults.push({ test: 'Health Check', status: 'FAILED', error: error.message });
        }
    }

    /**
     * Print test results summary
     */
    printResults() {
        console.log('\n=== Test Results Summary ===');
        
        let passed = 0;
        let failed = 0;
        
        this.testResults.forEach(result => {
            const status = result.status === 'PASSED' ? '✓' : '✗';
            console.log(`${status} ${result.test}: ${result.status}`);
            
            if (result.status === 'PASSED') passed++;
            else failed++;
        });
        
        console.log(`\nTotal: ${this.testResults.length}, Passed: ${passed}, Failed: ${failed}`);
        
        if (failed === 0) {
            console.log('🎉 All tests passed!');
        } else {
            console.log('❌ Some tests failed. Check server logs for details.');
        }
        console.log('============================\n');
    }
}

// Run tests if executed directly
if (require.main === module) {
    const testClient = new CMSTestClient();
    testClient.runAllTests().catch(console.error);
}

module.exports = CMSTestClient;