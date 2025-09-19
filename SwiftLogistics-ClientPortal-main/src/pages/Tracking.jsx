import React, { useEffect, useState } from 'react'
import { getOrderStatus } from '../lib/api'

export default function Tracking() {
  const [orderId, setOrderId] = useState('')
  const [status, setStatus] = useState(null)
  const [error, setError] = useState('')
  const [polling, setPolling] = useState(false)

  async function fetchStatus(id) {
    setError('')
    try {
      const data = await getOrderStatus(id)
      setStatus(data)
    } catch (e) {
      setError(e.message)
      setStatus(null)
    }
  }

  useEffect(() => {
    let t
    if (polling && orderId) {
      const poll = async () => {
        await fetchStatus(orderId)
        t = setTimeout(poll, 3000)
      }
      poll()
    }
    return () => clearTimeout(t)
  }, [polling, orderId])

  return (
    <section>
      <h2>Track Order</h2>
      <div className="row">
        <input placeholder="Order ID" value={orderId} onChange={e=>setOrderId(e.target.value)} />
        <button onClick={() => fetchStatus(orderId)} disabled={!orderId}>Check</button>
        <label className="switch">
          <input type="checkbox" checked={polling} onChange={e=>setPolling(e.target.checked)} />
          <span>Auto-refresh</span>
        </label>
      </div>
      {error && <p className="error">{error}</p>}
      {status && (
        <div className="card">
          <p><b>Order:</b> {status.orderId}</p>
          <p><b>Status:</b> {status.status}</p>
          <p><b>Received:</b> {status.receivedAt}</p>
          <p><b>Last Updated:</b> {status.lastUpdated}</p>
          {status.error && <p className="error">Error: {status.error}</p>}
        </div>
      )}
    </section>
  )
}
