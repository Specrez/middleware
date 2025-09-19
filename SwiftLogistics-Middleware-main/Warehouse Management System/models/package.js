/**
 * Package Model
 * Represents a package in the warehouse management system
 * Tracks lifecycle from receipt to vehicle loading
 */

class Package {
    constructor(packageId, clientId, orderId, items = [], deliveryAddress = null) {
        this.packageId = packageId;
        this.clientId = clientId;
        this.orderId = orderId;
        this.items = items;
        this.deliveryAddress = deliveryAddress;
        this.status = 'received'; // received -> stored -> picked -> loaded
        this.location = null; // Warehouse zone/shelf location
        this.assignedVehicle = null;
        this.events = [];
        this.createdAt = new Date();
        this.updatedAt = new Date();
        
        // Add initial event
        this.addEvent('received', 'Package received from client');
    }

    /**
     * Update package status and location
     * @param {string} newStatus - New package status
     * @param {string} location - New location (optional)
     * @param {string} description - Event description
     */
    updateStatus(newStatus, location = null, description = null) {
        const validStatuses = ['received', 'stored', 'picked', 'loaded'];
        
        if (!validStatuses.includes(newStatus)) {
            throw new Error(`Invalid status: ${newStatus}. Valid statuses: ${validStatuses.join(', ')}`);
        }

        this.status = newStatus;
        if (location) {
            this.location = location;
        }
        this.updatedAt = new Date();
        
        this.addEvent(newStatus, description || `Package status updated to ${newStatus}`);
    }

    /**
     * Assign package to a vehicle
     * @param {string} vehicleId - Vehicle ID
     */
    assignToVehicle(vehicleId) {
        this.assignedVehicle = vehicleId;
        this.updateStatus('loaded', null, `Package loaded onto vehicle ${vehicleId}`);
    }

    /**
     * Add event to package history
     * @param {string} eventType - Type of event
     * @param {string} description - Event description
     */
    addEvent(eventType, description) {
        this.events.push({
            eventType,
            description,
            timestamp: new Date().toISOString(),
            location: this.location
        });
    }

    /**
     * Get current package status
     * @returns {Object} Status information
     */
    getStatus() {
        return {
            packageId: this.packageId,
            status: this.status,
            location: this.location,
            assignedVehicle: this.assignedVehicle,
            updatedAt: this.updatedAt.toISOString()
        };
    }

    /**
     * Get package history
     * @returns {Array} Array of events
     */
    getHistory() {
        return this.events.map(event => ({
            ...event,
            packageId: this.packageId
        }));
    }

    /**
     * Check if package is ready for pickup
     * @returns {boolean} True if package is ready
     */
    isReadyForPickup() {
        return this.status === 'stored';
    }

    /**
     * Check if package is loaded and ready for delivery
     * @returns {boolean} True if loaded
     */
    isLoaded() {
        return this.status === 'loaded';
    }

    /**
     * Convert to JSON representation
     * @returns {Object} JSON object
     */
    toJSON() {
        return {
            packageId: this.packageId,
            clientId: this.clientId,
            orderId: this.orderId,
            items: this.items,
            deliveryAddress: this.deliveryAddress,
            status: this.status,
            location: this.location,
            assignedVehicle: this.assignedVehicle,
            events: this.events,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString()
        };
    }
}

/**
 * Package Manager
 * Manages all packages in the warehouse
 */
class PackageManager {
    constructor() {
        this.packages = new Map();
        this.eventHandlers = new Map();
    }

    /**
     * Add new package to warehouse
     * @param {Package} pkg - Package to add
     */
    addPackage(pkg) {
        this.packages.set(pkg.packageId, pkg);
        this.emitEvent('package_received', pkg);
        return pkg;
    }

    /**
     * Get package by ID
     * @param {string} packageId - Package ID
     * @returns {Package|null} Found package or null
     */
    getPackage(packageId) {
        return this.packages.get(packageId) || null;
    }

    /**
     * Get all packages
     * @returns {Array<Package>} Array of packages
     */
    getAllPackages() {
        return Array.from(this.packages.values());
    }

    /**
     * Get packages by status
     * @param {string} status - Package status to filter by
     * @returns {Array<Package>} Filtered packages
     */
    getPackagesByStatus(status) {
        return this.getAllPackages().filter(pkg => pkg.status === status);
    }

    /**
     * Update package status
     * @param {string} packageId - Package ID
     * @param {string} newStatus - New status
     * @param {string} location - New location (optional)
     * @param {string} description - Event description (optional)
     * @returns {Package|null} Updated package
     */
    updatePackageStatus(packageId, newStatus, location = null, description = null) {
        const pkg = this.getPackage(packageId);
        if (!pkg) {
            return null;
        }

        pkg.updateStatus(newStatus, location, description);
        this.emitEvent('package_updated', pkg);
        return pkg;
    }

    /**
     * Assign package to vehicle
     * @param {string} packageId - Package ID
     * @param {string} vehicleId - Vehicle ID
     * @returns {Package|null} Updated package
     */
    assignPackageToVehicle(packageId, vehicleId) {
        const pkg = this.getPackage(packageId);
        if (!pkg) {
            return null;
        }

        pkg.assignToVehicle(vehicleId);
        this.emitEvent('package_loaded', pkg);
        return pkg;
    }

    /**
     * Get warehouse statistics
     * @returns {Object} Statistics object
     */
    getStatistics() {
        const packages = this.getAllPackages();
        const statusCounts = {};
        
        packages.forEach(pkg => {
            statusCounts[pkg.status] = (statusCounts[pkg.status] || 0) + 1;
        });

        return {
            totalPackages: packages.length,
            statusBreakdown: statusCounts,
            readyForPickup: this.getPackagesByStatus('stored').length,
            loaded: this.getPackagesByStatus('loaded').length,
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * Register event handler
     * @param {string} eventType - Event type
     * @param {Function} handler - Event handler function
     */
    on(eventType, handler) {
        if (!this.eventHandlers.has(eventType)) {
            this.eventHandlers.set(eventType, []);
        }
        this.eventHandlers.get(eventType).push(handler);
    }

    /**
     * Emit event to all registered handlers
     * @param {string} eventType - Event type
     * @param {any} data - Event data
     */
    emitEvent(eventType, data) {
        const handlers = this.eventHandlers.get(eventType) || [];
        handlers.forEach(handler => {
            try {
                handler(data);
            } catch (error) {
                console.error(`Error in event handler for ${eventType}:`, error);
            }
        });
    }
}

module.exports = {
    Package,
    PackageManager
};