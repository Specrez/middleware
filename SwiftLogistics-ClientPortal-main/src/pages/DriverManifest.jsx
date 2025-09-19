import React, { useState, useEffect } from 'react'
import { getClientId } from '../lib/api'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

export default function DriverManifest() {
  const [manifest, setManifest] = useState(null)
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const clientId = getClientId()

  async function loadManifest() {
    if (!clientId) return
    setLoading(true)
    setError('')
    try {
      // Mock driver manifest - in real implementation, this would be a dedicated endpoint
      const mockManifest = {
        driverId: `DRIVER_${clientId}`,
        vehicleId: 'VH001',
        date: new Date().toDateString(),
        totalDeliveries: 3,
        estimatedDistance: '45.2 km',
        estimatedTime: '4.5 hours',
        route: [
          { orderId: 'ORD001', address: '123 Main St, Colombo', status: 'pending', priority: 'high' },
          { orderId: 'ORD002', address: '456 Park Ave, Galle', status: 'pending', priority: 'normal' },
          { orderId: 'ORD003', address: '789 Sea View, Kandy', status: 'pending', priority: 'normal' }
        ]
      }
      setManifest(mockManifest)
      setDeliveries(mockManifest.route)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function updateDeliveryStatus(orderId, status, reason = '') {
    try {
      setDeliveries(prev => prev.map(d => 
        d.orderId === orderId 
          ? { ...d, status, reason, completedAt: status === 'delivered' ? new Date().toLocaleTimeString() : null }
          : d
      ))
      
      // In real implementation, this would update the backend
      console.log(`Updated ${orderId} to ${status}`, reason ? `Reason: ${reason}` : '')
    } catch (e) {
      setError(e.message)
    }
  }

  useEffect(() => { loadManifest() }, [clientId])

  if (!clientId) {
    return (
      <section>
        <h2>Driver Manifest</h2>
        <p>Please login first to view your delivery manifest.</p>
      </section>
    )
  }

  return (
    <section>
      <h2>Driver Manifest</h2>
      <button onClick={loadManifest} disabled={loading}>
        {loading ? 'Loading...' : 'Refresh Manifest'}
      </button>
      
      {error && <p className="error">{error}</p>}
      
      {manifest && (
        <div className="card">
          <p><b>Driver:</b> {manifest.driverId}</p>
          <p><b>Vehicle:</b> {manifest.vehicleId}</p>
          <p><b>Date:</b> {manifest.date}</p>
          <p><b>Total Deliveries:</b> {manifest.totalDeliveries}</p>
          <p><b>Estimated Distance:</b> {manifest.estimatedDistance}</p>
          <p><b>Estimated Time:</b> {manifest.estimatedTime}</p>
        </div>
      )}

      {deliveries.length > 0 && (
        <div>
          <h3>Delivery Route</h3>
          {deliveries.map((delivery, index) => (
            <div key={delivery.orderId} className="card">
              <div className="row">
                <div style={{flex: 1}}>
                  <p><b>#{index + 1} - {delivery.orderId}</b> 
                    {delivery.priority === 'high' && <span style={{color: 'red', marginLeft: 8}}>HIGH PRIORITY</span>}
                  </p>
                  <p>{delivery.address}</p>
                  <p><b>Status:</b> {delivery.status}</p>
                  {delivery.completedAt && <p><b>Completed:</b> {delivery.completedAt}</p>}
                  {delivery.reason && <p><b>Reason:</b> {delivery.reason}</p>}
                </div>
                <div>
                  {delivery.status === 'pending' && (
                    <>
                      <button onClick={() => updateDeliveryStatus(delivery.orderId, 'delivered')}>
                        Mark Delivered
                      </button>
                      <button onClick={() => {
                        const reason = prompt('Reason for failed delivery:')
                        if (reason) updateDeliveryStatus(delivery.orderId, 'failed', reason)
                      }}>
                        Mark Failed
                      </button>
                    </>
                  )}
                  {delivery.status === 'delivered' && <span style={{color: 'green'}}>✓ Delivered</span>}
                  {delivery.status === 'failed' && <span style={{color: 'red'}}>✗ Failed</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{marginTop: 16, background: '#f0f8ff'}}>
        <h4>Driver Features (Demo)</h4>
        <p>• View optimized delivery route</p>
        <p>• Mark packages as delivered/failed</p>
        <p>• Real-time status updates</p>
        <p>• High-priority delivery alerts</p>
        <p>• Digital proof of delivery (would integrate camera/signature)</p>
      </div>
    </section>
  )
}