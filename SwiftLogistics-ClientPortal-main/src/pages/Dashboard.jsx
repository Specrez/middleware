import React, { useEffect, useState } from 'react'
import { getDashboard, getVehicles } from '../lib/api'

export default function Dashboard() {
  const [dash, setDash] = useState(null)
  const [vehicles, setVehicles] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    setError('')
    setLoading(true)
    try {
      const [d, v] = await Promise.all([getDashboard(), getVehicles()])
      setDash(d)
      setVehicles(v)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <section>
      <h2>Dashboard</h2>
      <div className="card" style={{background: '#f0f8ff', border: '2px solid #7c2ae8'}}>
        <h3>🚀 Welcome to SwiftTrack!</h3>
        <p>Your logistics management portal is ready. Here's what you can do:</p>
        <div className="row">
          <button onClick={() => window.location.href='/orders'}>📦 Submit Order</button>
          <button onClick={() => window.location.href='/tracking'}>🔍 Track Order</button>
          <button onClick={() => window.location.href='/driver'}>🚛 Driver View</button>
        </div>
      </div>
      <button onClick={load}>Refresh Data</button>
      {error && <p className="error">{error}</p>}
      {loading && (
        <div className="card">
          <p>Loading overview...</p>
        </div>
      )}
      {dash && (
        <div className="card">
          <p><b>Total Orders:</b> {dash.overview.totalOrders}</p>
          <p><b>Active Routes:</b> {dash.overview.activeRoutes}</p>
          <p><b>Uptime:</b> {dash.overview.systemUptime}</p>
        </div>
      )}
      {vehicles && (
        <div className="card">
          <p><b>Vehicles:</b></p>
          <ul>
            {vehicles.vehicles.map(v => (
              <li key={v.vehicleId}>{v.vehicleId} - {v.type} - {v.status} {v.wmsAssignment ? `(WMS: ${v.wmsAssignment.warehouseAssignment})` : ''}</li>
            ))}
          </ul>
        </div>
      )}
      {!loading && !dash && !vehicles && (
        <div className="card">
          <p>No data yet. Ensure the middleware is running on http://localhost:3000 and click Refresh.</p>
        </div>
      )}
    </section>
  )
}
