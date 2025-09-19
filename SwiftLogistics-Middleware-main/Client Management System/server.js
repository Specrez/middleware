/**
 * Client Management System SOAP Server
 * Legacy on-premise system for client contracts, billing, and order intake
 * Implements SOAP-based XML API for integration with SwiftLogistics middleware
 */

const soap = require('soap');
const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');
const CMSHandler = require('./handlers/cms-handler');

class CMSServer {
    constructor() {
        this.app = express();
        this.server = null;
        this.soapConfig = null;
        this.cmsHandler = null;
        this.port = process.env.CMS_PORT || 8081;
        
        this.initializeServer();
    }

    /**
     * Initialize the SOAP server with configuration
     */
    initializeServer() {
        // Load SOAP configuration
        this.loadSoapConfig();
        
        // Initialize CMS Handler
        this.cmsHandler = new CMSHandler(this.soapConfig);
        
        // Setup Express middleware
        this.app.use(express.raw({ type: 'application/xml' }));
        this.app.use(express.raw({ type: 'text/xml' }));
        
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                service: 'Client Management System',
                timestamp: new Date().toISOString()
            });
        });

        // Setup SOAP services
        this.setupSoapServices();
    }

    /**
     * Load SOAP configuration from XML file
     */
    loadSoapConfig() {
        try {
            const configPath = path.join(__dirname, 'soap-config.xml');
            const configXml = fs.readFileSync(configPath, 'utf8');
            
            // Parse XML to extract endpoint configurations
            this.soapConfig = {
                endpoints: {
                    ClientContractService: 'http://localhost:8080/cms/contracts',
                    BillingService: 'http://localhost:8080/cms/billing',
                    OrderIntakeService: 'http://localhost:8080/cms/orders'
                },
                authentication: {
                    type: 'basic',
                    username: 'cms_user',
                    password: 'cms_password'
                }
            };
            
            console.log('SOAP configuration loaded successfully');
        } catch (error) {
            console.error('Error loading SOAP configuration:', error.message);
            process.exit(1);
        }
    }

    /**
     * Setup SOAP services based on WSDL definitions
     */
    setupSoapServices() {
        // Define SOAP service implementations
        const contractService = {
            ContractService: {
                ContractServicePort: {
                    GetContract: async (args, callback) => {
                        try {
                            console.log('SOAP GetContract called with:', args);
                            
                            const contractData = {
                                contractId: args.contractId
                            };
                            
                            const result = await this.cmsHandler.handleContractRequest(contractData);
                            
                            // Return SOAP response format
                            const response = {
                                contract: {
                                    id: result.contractId,
                                    clientId: `CLIENT_${result.contractId}`,
                                    terms: 'Standard logistics contract terms',
                                    status: result.status
                                }
                            };
                            
                            callback(null, response);
                        } catch (error) {
                            console.error('Contract service error:', error);
                            callback(error);
                        }
                    }
                }
            }
        };

        const billingService = {
            BillingService: {
                BillingServicePort: {
                    ProcessBilling: async (args, callback) => {
                        try {
                            console.log('SOAP ProcessBilling called with:', args);
                            
                            const billingData = {
                                billingId: args.billingId,
                                amount: args.amount,
                                clientId: args.clientId
                            };
                            
                            const result = await this.cmsHandler.handleBillingRequest(billingData);
                            
                            const response = {
                                billingResult: {
                                    id: result.billingId,
                                    status: result.status,
                                    processedAt: result.timestamp
                                }
                            };
                            
                            callback(null, response);
                        } catch (error) {
                            console.error('Billing service error:', error);
                            callback(error);
                        }
                    }
                }
            }
        };

        const orderService = {
            OrderIntakeService: {
                OrderServicePort: {
                    ProcessOrder: async (args, callback) => {
                        try {
                            console.log('SOAP ProcessOrder called with:', JSON.stringify(args, null, 2));
                            
                            const orderData = {
                                orderId: args.orderId,
                                clientId: args.clientId,
                                items: args.items || [],
                                deliveryAddress: args.deliveryAddress
                            };
                            
                            console.log('Processing order data:', JSON.stringify(orderData, null, 2));
                            
                            const result = await this.cmsHandler.handleOrderIntake(orderData);
                            
                            const response = {
                                orderResult: {
                                    id: result.orderId,
                                    status: result.status,
                                    receivedAt: result.timestamp
                                }
                            };
                            
                            console.log('Order service response:', JSON.stringify(response, null, 2));
                            callback(null, response);
                        } catch (error) {
                            console.error('Order service error:', error);
                            callback(error);
                        }
                    }
                }
            }
        };

        // Load WSDL files
        const contractWsdlPath = path.join(__dirname, 'wsdl/contracts.wsdl');
        const billingWsdlPath = path.join(__dirname, 'wsdl/billing.wsdl');
        const ordersWsdlPath = path.join(__dirname, 'wsdl/orders.wsdl');
        
        const contractWsdl = fs.readFileSync(contractWsdlPath, 'utf8');
        const billingWsdl = fs.readFileSync(billingWsdlPath, 'utf8');
        const ordersWsdl = fs.readFileSync(ordersWsdlPath, 'utf8');

        // Start SOAP services
        this.server = http.createServer(this.app);
        
        // Contract Service SOAP endpoint
        soap.listen(this.server, '/cms/contracts', contractService, contractWsdl);
        
        // Billing Service SOAP endpoint
        soap.listen(this.server, '/cms/billing', billingService, billingWsdl);
        
        // Order Service SOAP endpoint
        soap.listen(this.server, '/cms/orders', orderService, ordersWsdl);

        console.log('SOAP services configured:');
        console.log('- Contract Service: /cms/contracts');
        console.log('- Billing Service: /cms/billing');
        console.log('- Order Intake Service: /cms/orders');
    }

    /**
     * Start the CMS server
     */
    start() {
        this.server.listen(this.port, () => {
            console.log(`\n=== Client Management System SOAP Server ===`);
            console.log(`Server running on port ${this.port}`);
            console.log(`Health check: http://localhost:${this.port}/health`);
            console.log(`Contract WSDL: http://localhost:${this.port}/cms/contracts?wsdl`);
            console.log(`Billing WSDL: http://localhost:${this.port}/cms/billing?wsdl`);
            console.log(`Order WSDL: http://localhost:${this.port}/cms/orders?wsdl`);
            console.log(`=====================================\n`);
        });
    }

    /**
     * Stop the CMS server
     */
    stop() {
        if (this.server) {
            this.server.close(() => {
                console.log('CMS Server stopped');
            });
        }
    }
}

// Create and start server if run directly
if (require.main === module) {
    const cmsServer = new CMSServer();
    cmsServer.start();

    // Graceful shutdown
    process.on('SIGTERM', () => {
        console.log('Received SIGTERM, shutting down gracefully');
        cmsServer.stop();
        process.exit(0);
    });

    process.on('SIGINT', () => {
        console.log('Received SIGINT, shutting down gracefully');
        cmsServer.stop();
        process.exit(0);
    });
}

module.exports = CMSServer;