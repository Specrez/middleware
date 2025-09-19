/**
 * Inventory Model
 * Data model for warehouse inventory items
 */

class InventoryItem {
    constructor(itemId, name, category, quantity, location) {
        this.itemId = itemId;
        this.name = name;
        this.category = category;
        this.quantity = quantity;
        this.location = location;
        this.lastUpdated = new Date();
        this.status = 'active';
    }

    /**
     * Update item quantity
     * @param {number} newQuantity - New quantity value
     */
    updateQuantity(newQuantity) {
        this.quantity = newQuantity;
        this.lastUpdated = new Date();
    }

    /**
     * Check if item is low stock
     * @param {number} threshold - Low stock threshold
     * @returns {boolean} - True if stock is low
     */
    isLowStock(threshold = 10) {
        return this.quantity <= threshold;
    }

    /**
     * Convert to JSON representation
     * @returns {Object} - JSON object
     */
    toJSON() {
        return {
            itemId: this.itemId,
            name: this.name,
            category: this.category,
            quantity: this.quantity,
            location: this.location,
            lastUpdated: this.lastUpdated.toISOString(),
            status: this.status
        };
    }
}

/**
 * Warehouse Model
 * Data model for warehouse information
 */
class Warehouse {
    constructor(warehouseId, name, address, capacity, zones) {
        this.warehouseId = warehouseId;
        this.name = name;
        this.address = address;
        this.capacity = capacity;
        this.zones = zones || [];
        this.inventory = new Map();
        this.createdAt = new Date();
    }

    /**
     * Add inventory item to warehouse
     * @param {InventoryItem} item - Inventory item to add
     */
    addItem(item) {
        this.inventory.set(item.itemId, item);
    }

    /**
     * Get inventory item by ID
     * @param {string} itemId - Item ID
     * @returns {InventoryItem|null} - Found item or null
     */
    getItem(itemId) {
        return this.inventory.get(itemId) || null;
    }

    /**
     * Get all inventory items
     * @returns {Array<InventoryItem>} - Array of inventory items
     */
    getAllItems() {
        return Array.from(this.inventory.values());
    }

    /**
     * Calculate total capacity usage
     * @returns {number} - Percentage of capacity used
     */
    getCapacityUsage() {
        const totalItems = this.inventory.size;
        return (totalItems / this.capacity) * 100;
    }
}

module.exports = {
    InventoryItem,
    Warehouse
};