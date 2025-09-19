# SwiftLogistics WSO2 MI Configuration

## Overview
This WSO2 Micro Integrator project provides enterprise-grade integration for the SwiftLogistics system, handling protocol transformation between JSON/REST (frontend) and SOAP/TCP (backend systems).

## Architecture

```
Frontend (React)     →  Node.js Middleware  →  WSO2 ESB  →  Backend Systems
JSON/REST           →  Routing Logic       →  Protocol   →  SOAP XML (CMS)
http://localhost:5173                         Transform     TCP Raw (WMS)
                    →  http://localhost:3000  →  http://localhost:8280
```

## Services Configuration

### 1. CMS Integration (SOAP)
- **Proxy Service**: `CMSOrderProxy`, `CMSContractProxy`  
- **Endpoints**: `CMSContractEndpoint`, `CMSOrderEndpoint`, `CMSBillingEndpoint`
- **Sequences**: `JSON_to_SOAP_Transform`, `SOAP_to_JSON_Transform`
- **Backend**: http://localhost:8080 (CMS SOAP Server)

### 2. WMS Integration (TCP via HTTP Adapter)
- **Proxy Service**: `WMSPackageProxy`
- **Endpoint**: `TCPAdapterEndpoint` 
- **TCP Adapter**: http://localhost:3004 (Converts TCP ↔ HTTP)
- **Backend**: TCP connection to WMS server (port 8080)

### 3. API Gateway
- **API**: `SwiftLogisticsAPI` (`/api/v1`)
- **Provides unified REST interface for all backend systems**

## Port Configuration

| Service | Port | Protocol | Purpose |
|---------|------|----------|---------|
| WSO2 MI HTTP | 8280 | HTTP | Main ESB endpoint |
| WSO2 MI HTTPS | 8243 | HTTPS | Secure ESB endpoint |
| Frontend | 5173 | HTTP | React client |
| Middleware | 3000 | HTTP | Node.js orchestration |
| TCP Adapter | 3004 | HTTP | TCP-to-HTTP bridge |
| CMS SOAP | 8080 | SOAP/HTTP | Legacy system |
| WMS TCP | 8080 | TCP | Real-time protocol |
| ROS REST | 3002 | HTTP/REST | Modern API |

## Deployment

### Prerequisites
1. WSO2 MI 4.4.0 installed
2. Java 11+ runtime
3. TCP-HTTP adapter service running
4. Backend systems (CMS, WMS) running

### Build & Deploy
```bash
# Build the project
cd wso2mi-4.4.0/SwiftLogisticsMI
mvn clean install

# Copy artifacts to WSO2 MI
cp -r src/main/wso2mi/artifacts/* ../repository/deployment/server/synapse-configs/default/

# Start TCP adapter
cd tcp-http-adapter
npm install
npm start

# Start WSO2 MI
cd ../../bin
./micro-integrator.sh
```

### Verification
- WSO2 MI: http://localhost:8280/api/v1/health
- TCP Adapter: http://localhost:3004/health  
- Proxy Services: http://localhost:8280/services/

## Integration Flow

### Order Submission Flow
1. **Frontend** → POST `/api/orders/submit` → **Middleware**
2. **Middleware** → POST `http://localhost:8280/api/v1/orders/submit` → **WSO2 ESB**
3. **WSO2 ESB** → Transform JSON → SOAP → **CMS Server**
4. **CMS** → SOAP Response → Transform → JSON → **Frontend**

### Package Tracking Flow  
1. **Frontend** → GET `/api/packages/status/PKG123` → **Middleware**
2. **Middleware** → GET `http://localhost:8280/api/v1/packages/status/PKG123` → **WSO2 ESB**
3. **WSO2 ESB** → HTTP → **TCP Adapter** → TCP → **WMS Server**
4. **WMS** → TCP Response → **TCP Adapter** → HTTP → **WSO2 ESB** → **Frontend**

### Route Optimization Flow (Direct)
1. **Frontend** → POST `/api/routes/calculate` → **Middleware** 
2. **Middleware** → Direct REST call → **ROS Server**
3. **ROS** → JSON Response → **Frontend**

## Environment Variables

```bash
# WSO2 ESB
WSO2_ESB_BASE=http://localhost:8280
WSO2_API_PATH=/api/v1

# TCP Adapter
ADAPTER_HTTP_PORT=3004
WMS_HOST=localhost  
WMS_TCP_PORT=8080

# Backend Systems
CMS_PORT=8080
ROS_PORT=3002
WMS_HTTP_PORT=3003
```

## Monitoring & Logs

- **WSO2 Logs**: `wso2mi-4.4.0/repository/logs/`
- **TCP Adapter Logs**: Console output with timestamp
- **Health Checks**: All services provide `/health` endpoints
- **CORS**: Configured for frontend integration