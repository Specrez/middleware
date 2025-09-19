# SwiftTrack Client Portal (React)

A lightweight React app for the Swift Logistics assignment. It connects to the middleware at http://localhost:3000 to submit orders, track status, and view a dashboard.

## Pages
- Dashboard: overview stats and vehicles
- Orders: submit new orders
- Tracking: check order status with optional auto-refresh
- Login: set your Client ID (used when submitting orders)

## Run locally
1. Ensure middleware server is running at http://localhost:3000
2. Install and start client

```powershell
cd "c:\Users\USER\Desktop\Intern Projects\SwiftLogistics-ClientPortal"
npm install
npm run dev
```

Open the shown URL (default http://localhost:5173).

## Configure API base
Optionally create a `.env` with:
```
VITE_API_BASE=http://localhost:3000
```
