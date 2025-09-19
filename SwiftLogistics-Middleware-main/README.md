# SwiftLogistics-Middleware

## Overview
SwiftLogistics-Middleware is a comprehensive middleware solution that integrates multiple logistics systems to provide seamless communication and data flow between different components of the logistics infrastructure.

## System Architecture

The middleware consists of three main system components:

### 1. Client Management System (CMS)
- **Type**: Legacy on-premise system
- **API**: SOAP-based XML API
- **Purpose**: Handles client contracts, billing, and order intake
- **Location**: `Client Management System/`

### 2. Route Optimisation System (ROS)
- **Type**: Modern cloud-based service (third-party vendor)
- **API**: RESTful API
- **Purpose**: Generates optimal delivery routes based on addresses and vehicle availability
- **Location**: `Route Optimisation System/`
- **Status**: ✅ **IMPLEMENTED** - Full route optimization with advanced algorithms
- **Features**:
  - Advanced Nearest Neighbor algorithm for route optimization
  - Real-time vehicle management and status tracking
  - Distance calculation using Haversine formula
  - Integration with CMS for order processing
  - Analytics and performance metrics
  - RESTful API endpoints for system integration

### 3. Warehouse Management System (WMS)
- **Type**: Package tracking and warehouse management system
- **API**: HTTP REST API + TCP/IP Protocol
- **Purpose**: Tracks packages from client receipt to vehicle loading with real-time updates
- **Location**: `Warehouse Management System/`
- **Status**: ✅ **IMPLEMENTED** - Complete package tracking with real-time TCP/IP protocol
- **Features**:
  - Package lifecycle tracking (received → stored → picked → loaded)
  - Real-time TCP/IP messaging protocol for live updates
  - Event-driven architecture with package history
  - Warehouse location management and capacity tracking
  - Vehicle assignment and loading operations
  - HTTP REST API for all package operations
  - Comprehensive analytics and reporting
  - Integration with CMS and ROS systems
  - Message integrity with checksum validation
  - Multi-client TCP connection support

## Directory Structure

```
SwiftLogistics-Middleware/
├── Client Management System/          # Legacy SOAP-based system
│   ├── README.md                     # CMS documentation
│   ├── package.json                 # CMS dependencies
│   ├── server.js                    # SOAP server
│   ├── soap-config.xml               # SOAP service configuration
│   ├── wsdl/                         # Web Service Definition Language files
│   │   └── contracts.wsdl
│   ├── handlers/                     # Request/response handlers
│   │   └── cms-handler.js
│   └── test/                         # CMS tests
│       └── cms-test.js
├── Route Optimisation System/         # ✅ Modern REST API system - IMPLEMENTED
│   ├── README.md                     # ROS documentation
│   ├── package.json                 # ROS dependencies
│   ├── server.js                    # ✅ REST API server
│   ├── rest-config.json              # REST API configuration
│   ├── api/                          # API definitions and schemas
│   │   └── openapi.json
│   ├── handlers/                     # Request/response handlers
│   │   └── ros-handler.js           # ✅ Enhanced with route optimization algorithms
│   ├── test/                         # ✅ ROS tests
│   │   └── ros-test.js
│   └── demo.js                      # ✅ Interactive demo
├── Warehouse Management System/       # ✅ Package tracking system - IMPLEMENTED
│   ├── README.md                     # WMS documentation
│   ├── package.json                 # ✅ WMS dependencies
│   ├── server.js                    # ✅ WMS HTTP server with TCP protocol
│   ├── demo.js                      # ✅ Package tracking demo
│   ├── config/                       # System configuration
│   │   └── wms-config.json
│   ├── handlers/                     # Integration handlers
│   │   └── wms-handler.js           # ✅ Enhanced package tracking operations
│   ├── models/                       # Data models
│   │   ├── inventory.js             # Legacy inventory models
│   │   └── package.js               # ✅ Package tracking and lifecycle management
│   ├── protocol/                     # ✅ TCP/IP messaging protocol
│   │   └── tcp-protocol.js          # ✅ Real-time messaging with integrity checks
│   └── test/                         # ✅ WMS tests
│       └── wms-test.js              # ✅ Complete test suite
├── middleware-integration.js         # ✅ Main integration server
└── package.json                     # ✅ Main project dependencies
```

## Integration Features

- **SOAP Integration**: Legacy system integration with XML-based communication
- **REST API Integration**: Modern cloud service integration with JSON-based communication
- **Warehouse Management**: Comprehensive package tracking and fulfillment operations with real-time TCP/IP updates
- **Cross-system Communication**: Seamless data flow between all three systems

## Getting Started

### Quick Setup

```bash
# Install all dependencies
npm run setup

# Start the main middleware integration server
npm start

# Start individual systems
npm run start:cms    # Client Management System
npm run start:ros    # Route Optimisation System
npm run start:wms    # Warehouse Management System

# Run tests
npm test

# Run demos
npm run demo         # Route Optimization Demo
npm run demo:wms     # Warehouse Management Demo
```

### API Endpoints

**Main Middleware Integration (Port 3000):**
- `GET /health` - System health check
- `POST /api/orders/process` - End-to-end order processing
- `GET /api/vehicles/status` - Consolidated vehicle status
- `POST /api/routes/optimize` - Multi-system route optimization
- `GET /api/analytics/dashboard` - Integrated analytics

**Route Optimisation System (Port 3002):**
- `POST /v1/routes/calculate` - Calculate optimal routes
- `GET /v1/vehicles` - Get available vehicles
- `PUT /v1/vehicles/{id}/status` - Update vehicle status
- `POST /v1/integration/process-order` - Process orders

**Warehouse Management System (Port 3003):**
- `POST /api/packages/receive` - Receive package from client
- `PUT /api/packages/{id}/store` - Store package in warehouse
- `PUT /api/packages/{id}/pick` - Pick package for fulfillment
- `PUT /api/packages/{id}/load` - Load package onto vehicle
- `GET /api/packages/{id}/track` - Track package status and history
- `GET /api/packages` - Get all packages (with status filtering)
- `GET /api/warehouse/stats` - Get warehouse statistics

**WMS TCP Protocol (Port 8080):**
- Real-time package status updates
- Message integrity with checksums
- Multi-client connection support

Each system directory contains its own README.md with specific setup and configuration instructions. Please refer to the individual system documentation for detailed implementation guidance.