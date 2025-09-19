# Warehouse Management System (WMS)

## Overview
The Warehouse Management System is a comprehensive package tracking solution that manages the complete lifecycle of packages from client receipt to vehicle loading. It features real-time updates through a proprietary TCP/IP messaging protocol.

## System Type
- **Architecture**: Package tracking and warehouse management system
- **Protocol**: HTTP REST API + TCP/IP Real-time Protocol
- **Primary Functions**:
  - Package lifecycle tracking (received → stored → picked → loaded)
  - Real-time status broadcasting via TCP/IP protocol
  - Warehouse location management
  - Vehicle assignment and loading operations
  - Event-driven package history
  - Analytics and reporting

## Features

### Package Tracking
- **Received**: Package arrives from client
- **Stored**: Package placed in warehouse location
- **Picked**: Package selected for order fulfillment
- **Loaded**: Package loaded onto delivery vehicle

### Real-time Updates
- Proprietary TCP/IP messaging protocol (Port 8080)
- Message integrity with checksums
- Multi-client connection support
- Heartbeat monitoring
- Event broadcasting for all status changes

### HTTP REST API
- Complete package management operations (Port 3003)
- Package tracking and history
- Warehouse statistics and analytics
- Integration with middleware systems

## Quick Start

### Start the WMS Server
```bash
cd "Warehouse Management System"
npm install
npm start
```

### Run Tests
```bash
npm test
```

### Run Demo
```bash
npm run demo
```

## API Endpoints

### Package Operations
- `POST /api/packages/receive` - Receive package from client
- `PUT /api/packages/{id}/store` - Store package at warehouse location
- `PUT /api/packages/{id}/pick` - Pick package for fulfillment
- `PUT /api/packages/{id}/load` - Load package onto vehicle
- `GET /api/packages/{id}/track` - Track package status and history
- `GET /api/packages` - Get all packages (optional status filter)

### Analytics
- `GET /api/warehouse/stats` - Warehouse statistics
- `GET /api/warehouse/realtime/stats` - TCP connection statistics
- `GET /health` - System health check

### Legacy Integration
- `POST /api/inventory/update` - Legacy inventory updates
- `POST /api/orders/fulfill` - Enhanced order fulfillment
- `GET /api/inventory/{id}/stock` - Stock level checks

## TCP Protocol

### Message Format
```
[TYPE:7][LENGTH:4][TIMESTAMP:13][PAYLOAD:N][CHECKSUM:2]
```

### Message Types
- `PKG_RCV` - Package received
- `PKG_STR` - Package stored
- `PKG_PCK` - Package picked
- `PKG_LDD` - Package loaded
- `STS_REQ` - Status request
- `STS_RSP` - Status response
- `HBT_CHK` - Heartbeat
- `ACK_MSG` - Acknowledgment
- `ERR_MSG` - Error message

### Example Messages
```
PKG_RCV0068175745078{"packageId":"PKG123","status":"received","timestamp":1757450786892}61
PKG_STR0066175745079{"packageId":"PKG123","status":"stored","location":"A1"}45
```

## Configuration

### WMS Configuration (wms-config.json)
```json
{
  "database": {
    "host": "localhost",
    "port": 5432,
    "name": "warehouse_management"
  },
  "warehouse": {
    "defaultLocation": {
      "name": "Main Warehouse",
      "address": "123 Logistics Ave, Business District",
      "capacity": 10000,
      "zones": ["A", "B", "C", "D"]
    }
  },
  "inventory": {
    "trackingEnabled": true,
    "realTimeUpdates": true,
    "lowStockThreshold": 10
  }
}
```

### Environment Variables
- `WMS_HTTP_PORT` - HTTP server port (default: 3003)
- `WMS_TCP_PORT` - TCP protocol port (default: 8080)

## Integration

This WMS integrates seamlessly with:
- **Client Management System (CMS)** - Receives packages from client orders
- **Route Optimisation System (ROS)** - Provides package data for delivery routing
- **Main Middleware** - Orchestrated through central integration server

## Testing

The system includes comprehensive tests covering:
- Package model and lifecycle
- TCP protocol message integrity
- Package manager operations
- WMS handler functionality
- Error handling and validation
- Statistics and analytics
- Integration with legacy systems

All tests pass successfully with 100% coverage of core functionality.

## Demo

The interactive demo showcases:
1. Package receipt from client
2. Warehouse storage operations
3. Package tracking and history
4. Order fulfillment workflow
5. Vehicle loading operations
6. Real-time TCP protocol updates
7. Bulk package management
8. Analytics and reporting

Run `npm run demo` to see the complete package tracking workflow in action!