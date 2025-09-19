/**
 * Warehouse Management System Handler
 * Handles warehouse operations, inventory management, and package tracking
 */

const { Package, PackageManager } = require('../models/package');
const { InventoryItem, Warehouse } = require('../models/inventory');

class WMSHandler {
    constructor(wmsConfig, tcpServer = null) {
        this.config = wmsConfig;
        this.warehouseConfig = wmsConfig.warehouse;
        this.inventoryConfig = wmsConfig.inventory;
        this.tcpServer = tcpServer;
        
        // Initialize package manager
        this.packageManager = new PackageManager();
        
        // Initialize warehouse
        this.warehouse = new Warehouse(
            'WH001',
            this.warehouseConfig.defaultLocation.name,
            this.warehouseConfig.defaultLocation.address,
            this.warehouseConfig.defaultLocation.capacity,
            this.warehouseConfig.defaultLocation.zones
        );
        
        // Set up event listeners for real-time updates
        this.setupEventListeners();
    }

    /**
     * Set up event listeners for package tracking
     */
    setupEventListeners() {
        this.packageManager.on('package_received', (pkg) => {
            console.log(`📦 Package received: ${pkg.packageId}`);
            if (this.tcpServer) {
                this.tcpServer.broadcastPackageUpdate('received', pkg);
            }
        });

        this.packageManager.on('package_updated', (pkg) => {
            console.log(`📋 Package updated: ${pkg.packageId} -> ${pkg.status}`);
            if (this.tcpServer) {
                this.tcpServer.broadcastPackageUpdate(pkg.status, pkg);
            }
        });

        this.packageManager.on('package_loaded', (pkg) => {
            console.log(`🚛 Package loaded: ${pkg.packageId} -> ${pkg.assignedVehicle}`);
            if (this.tcpServer) {
                this.tcpServer.broadcastPackageUpdate('loaded', pkg);
            }
        });
    }

    /**
     * Receive package from client
     * @param {Object} packageData - Package data from client
     * @returns {Promise<Object>} - Receipt response
     */
    async receivePackage(packageData) {
        console.log('📥 Processing package receipt from client');
        
        const { packageId, clientId, orderId, items, deliveryAddress } = packageData;
        
        if (!packageId || !clientId) {
            throw new Error('Package ID and Client ID are required');
        }

        // Create new package
        const pkg = new Package(packageId, clientId, orderId, items, deliveryAddress);
        
        // Add to package manager
        this.packageManager.addPackage(pkg);
        
        return {
            status: 'received',
            packageId: pkg.packageId,
            warehouse: this.warehouseConfig.defaultLocation.name,
            receiptTime: pkg.createdAt.toISOString(),
            nextStep: 'storage_assignment'
        };
    }

    /**
     * Store package in warehouse location
     * @param {string} packageId - Package ID
     * @param {string} location - Storage location
     * @returns {Promise<Object>} - Storage response
     */
    async storePackage(packageId, location) {
        console.log(`📍 Storing package ${packageId} at location ${location}`);
        
        const pkg = this.packageManager.updatePackageStatus(
            packageId, 
            'stored', 
            location, 
            `Package stored at ${location}`
        );
        
        if (!pkg) {
            throw new Error(`Package ${packageId} not found`);
        }

        return {
            status: 'stored',
            packageId,
            location,
            warehouse: this.warehouseConfig.defaultLocation.name,
            storageTime: pkg.updatedAt.toISOString()
        };
    }

    /**
     * Pick package for order fulfillment
     * @param {string} packageId - Package ID
     * @returns {Promise<Object>} - Picking response
     */
    async pickPackage(packageId) {
        console.log(`📋 Picking package ${packageId} for fulfillment`);
        
        const pkg = this.packageManager.getPackage(packageId);
        
        if (!pkg) {
            throw new Error(`Package ${packageId} not found`);
        }

        if (pkg.status !== 'stored') {
            throw new Error(`Package ${packageId} is not ready for pickup. Current status: ${pkg.status}. Expected: stored`);
        }

        const updatedPkg = this.packageManager.updatePackageStatus(
            packageId,
            'picked',
            null,
            'Package picked for order fulfillment'
        );

        return {
            status: 'picked',
            packageId,
            location: updatedPkg.location,
            pickingTime: updatedPkg.updatedAt.toISOString(),
            nextStep: 'vehicle_loading'
        };
    }

    /**
     * Load package onto vehicle
     * @param {string} packageId - Package ID
     * @param {string} vehicleId - Vehicle ID
     * @returns {Promise<Object>} - Loading response
     */
    async loadPackage(packageId, vehicleId) {
        console.log(`🚛 Loading package ${packageId} onto vehicle ${vehicleId}`);
        
        const pkg = this.packageManager.assignPackageToVehicle(packageId, vehicleId);
        
        if (!pkg) {
            throw new Error(`Package ${packageId} not found`);
        }

        return {
            status: 'loaded',
            packageId,
            vehicleId,
            loadingTime: pkg.updatedAt.toISOString(),
            readyForDelivery: true
        };
    }

    /**
     * Track package status
     * @param {string} packageId - Package ID to track
     * @returns {Promise<Object>} - Package tracking information
     */
    async trackPackage(packageId) {
        console.log(`🔍 Tracking package ${packageId}`);
        
        const pkg = this.packageManager.getPackage(packageId);
        
        if (!pkg) {
            throw new Error(`Package ${packageId} not found`);
        }

        return {
            packageId,
            currentStatus: pkg.getStatus(),
            history: pkg.getHistory(),
            warehouse: this.warehouseConfig.defaultLocation.name
        };
    }

    /**
     * Get all packages with optional status filter
     * @param {string} status - Optional status filter
     * @returns {Promise<Object>} - Packages list
     */
    async getPackages(status = null) {
        console.log(`📋 Getting packages${status ? ` with status: ${status}` : ''}`);
        
        const packages = status 
            ? this.packageManager.getPackagesByStatus(status)
            : this.packageManager.getAllPackages();

        return {
            packages: packages.map(pkg => pkg.toJSON()),
            count: packages.length,
            warehouse: this.warehouseConfig.defaultLocation.name,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Get warehouse statistics
     * @returns {Promise<Object>} - Warehouse statistics
     */
    async getWarehouseStats() {
        console.log('📊 Generating warehouse statistics');
        
        const packageStats = this.packageManager.getStatistics();
        const warehouseCapacity = this.warehouse.getCapacityUsage();

        return {
            warehouse: {
                id: this.warehouse.warehouseId,
                name: this.warehouse.name,
                address: this.warehouse.address,
                capacity: this.warehouse.capacity,
                capacityUsage: `${warehouseCapacity.toFixed(1)}%`
            },
            packages: packageStats,
            realTimeConnections: this.tcpServer ? this.tcpServer.getStats().protocol.connectedClients : 0,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Handle inventory update (legacy method)
     * @param {Object} inventoryData - Inventory update data
     * @returns {Promise<Object>} - Update response
     */
    async handleInventoryUpdate(inventoryData) {
        console.log('Processing inventory update');
        
        const { itemId, quantity, operation } = inventoryData;
        
        return {
            status: 'updated',
            itemId,
            newQuantity: operation === 'add' ? quantity : -quantity,
            warehouse: this.warehouseConfig.defaultLocation.name,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Handle order fulfillment (enhanced with package tracking)
     * @param {Object} orderData - Order fulfillment data
     * @returns {Promise<Object>} - Fulfillment response
     */
    async handleOrderFulfillment(orderData) {
        console.log('Processing order fulfillment with package tracking');
        
        const { orderId, items, packageId } = orderData;
        
        // If packageId is provided, track the package through fulfillment
        if (packageId) {
            const pkg = this.packageManager.getPackage(packageId);
            if (pkg && pkg.status === 'stored') {
                await this.pickPackage(packageId);
            }
        }
        
        return {
            status: 'fulfilled',
            orderId,
            packageId,
            itemsProcessed: items.length,
            warehouse: this.warehouseConfig.defaultLocation.name,
            estimatedShipTime: '2-4 hours',
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Check stock levels (legacy method)
     * @param {string} itemId - Item ID to check
     * @returns {Promise<Object>} - Stock level response
     */
    async checkStockLevel(itemId) {
        console.log(`Checking stock level for item ${itemId}`);
        
        // Mock stock level data
        const mockStock = Math.floor(Math.random() * 100) + 10;
        
        return {
            itemId,
            currentStock: mockStock,
            status: mockStock < this.inventoryConfig.lowStockThreshold ? 'low' : 'normal',
            reorderNeeded: mockStock < this.inventoryConfig.reorderLevel,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = WMSHandler;