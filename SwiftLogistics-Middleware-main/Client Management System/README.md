# Client Management System (CMS)

## Overview
A legacy, on-premise system that handles client contracts, billing, and order intake. This system exposes a SOAP-based XML API for integration with the SwiftLogistics middleware.

## System Type
- **Architecture**: Legacy on-premise system
- **API Type**: SOAP-based XML API
- **Primary Functions**:
  - Client contract management
  - Billing operations
  - Order intake processing

## Server Implementation

The CMS server is implemented as a Node.js SOAP server that provides three main services:

### 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

3. **Run tests:**
   ```bash
   npm test
   ```

4. **Run demonstration:**
   ```bash
   node demo.js
   ```

### 📋 Available Services

#### 1. Contract Service
- **Endpoint**: `http://localhost:8080/cms/contracts`
- **WSDL**: `http://localhost:8080/cms/contracts?wsdl`
- **Operation**: `GetContract`
- **Purpose**: Retrieve client contract information

**Sample Request:**
```xml
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GetContractRequest xmlns="http://swiftlogistics.com/cms/contracts">
      <contractId>CONTRACT_001</contractId>
    </GetContractRequest>
  </soap:Body>
</soap:Envelope>
```

#### 2. Billing Service
- **Endpoint**: `http://localhost:8080/cms/billing`
- **WSDL**: `http://localhost:8080/cms/billing?wsdl`
- **Operation**: `ProcessBilling`
- **Purpose**: Process billing requests

**Sample Request:**
```xml
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <ProcessBillingRequest xmlns="http://swiftlogistics.com/cms/billing">
      <billingId>BILL_001</billingId>
      <amount>1250.50</amount>
      <clientId>CLIENT_001</clientId>
    </ProcessBillingRequest>
  </soap:Body>
</soap:Envelope>
```

#### 3. Order Intake Service
- **Endpoint**: `http://localhost:8080/cms/orders`
- **WSDL**: `http://localhost:8080/cms/orders?wsdl`
- **Operation**: `ProcessOrder`
- **Purpose**: Handle order intake processing

**Sample Request:**
```xml
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <ProcessOrderRequest xmlns="http://swiftlogistics.com/cms/orders">
      <orderId>ORDER_001</orderId>
      <clientId>CLIENT_001</clientId>
      <deliveryAddress>123 Main St, City, State</deliveryAddress>
    </ProcessOrderRequest>
  </soap:Body>
</soap:Envelope>
```

### 🔧 Configuration

The server uses configuration from:
- `soap-config.xml` - SOAP service endpoints and authentication
- `wsdl/` directory - Web Service Definition Language files
- `package.json` - Node.js dependencies and scripts

### 🏥 Health Check

The server provides a health check endpoint:
- **URL**: `http://localhost:8080/health`
- **Method**: GET
- **Response**: JSON with server status

### 📁 Project Structure

```
Client Management System/
├── package.json                 # Node.js project configuration
├── server.js                    # Main SOAP server application
├── demo.js                      # Demonstration script
├── soap-config.xml              # SOAP service configuration
├── handlers/                    # Request/response handlers
│   └── cms-handler.js           # CMS business logic handler
├── wsdl/                        # Web Service Definition Language files
│   ├── contracts.wsdl           # Contract service WSDL
│   ├── billing.wsdl             # Billing service WSDL
│   └── orders.wsdl              # Order service WSDL
└── test/                        # Test files
    └── cms-test.js              # SOAP client tests
```

### 🔍 Server Features

- **SOAP 1.1/1.2 Support**: Full SOAP protocol implementation
- **WSDL Generation**: Auto-generated WSDL files for each service
- **Error Handling**: Comprehensive error handling and logging
- **Health Monitoring**: Built-in health check endpoint
- **Graceful Shutdown**: Proper cleanup on server termination
- **Legacy Integration**: Designed for legacy system compatibility

### 🌐 Integration

This directory contains the middleware components and configurations needed to integrate with the legacy CMS SOAP services as part of the SwiftLogistics middleware ecosystem.