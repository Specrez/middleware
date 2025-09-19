# TCP-HTTP Adapter Service

This service acts as a bridge between the WSO2 ESB and the WMS TCP protocol, converting TCP raw protocol messages to HTTP REST calls that WSO2 can handle.

## Overview

The adapter service provides:
- HTTP REST endpoints that WSO2 ESB can call
- TCP client connection to WMS server
- Protocol translation between HTTP JSON and TCP binary format
- Request/response correlation and timeout handling

## Endpoints

### Package Operations
- `POST /api/packages/receive` - Receive a new package
- `POST /api/packages/store` - Store a package in warehouse
- `POST /api/packages/pick` - Pick a package for delivery
- `POST /api/packages/load` - Load package onto vehicle
- `GET /api/packages/status/:packageId` - Get package status
- `GET /api/packages/list` - List all packages

### System
- `GET /health` - Health check endpoint

## Configuration

Environment variables:
- `ADAPTER_HTTP_PORT` - HTTP server port (default: 3004)
- `WMS_HOST` - WMS TCP server host (default: localhost)
- `WMS_TCP_PORT` - WMS TCP server port (default: 8080)

## Usage

```bash
# Install dependencies
npm install

# Start the service
npm start

# Development mode
npm run dev
```

## Integration with WSO2 ESB

The WSO2 ESB can call these HTTP endpoints instead of dealing with TCP protocol directly. The adapter handles:

1. Converting HTTP JSON requests to TCP protocol messages
2. Managing TCP connection and reconnection
3. Correlating requests and responses
4. Converting TCP responses back to HTTP JSON
5. Error handling and timeouts

## Message Flow

```
Frontend → WSO2 ESB → TCP-HTTP Adapter → WMS TCP Server
                                      ↓
Frontend ← WSO2 ESB ← TCP-HTTP Adapter ← WMS TCP Server
```