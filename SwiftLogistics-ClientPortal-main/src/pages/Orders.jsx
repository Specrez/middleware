import React, { useState } from 'react'
import { submitOrder } from '../lib/api'

export default function Orders() {
  const [orderId, setOrderId] = useState('ORD' + Math.floor(Math.random()*1000))
  const [address, setAddress] = useState('1 Main St')
  const [latitude, setLat] = useState(6.9271)
  const [longitude, setLng] = useState(79.8612)
  const [items, setItems] = useState('PKG001,PKG002')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setLoading(true); setError(''); setResult(null)
    try {
      const payload = {
        orderId,
        deliveryAddress: { address, latitude: parseFloat(latitude), longitude: parseFloat(longitude) },
        items: items.split(',').map(s=>s.trim()).filter(Boolean)
      }
      const data = await submitOrder(payload)
      setResult(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section>
      <h2>Submit Order</h2>
      <form onSubmit={onSubmit} className="form grid">
        <label>Order ID<input value={orderId} onChange={e=>setOrderId(e.target.value)} required/></label>
        <label>Address<input value={address} onChange={e=>setAddress(e.target.value)} required/></label>
        <label>Latitude<input type="number" step="any" value={latitude} onChange={e=>setLat(e.target.value)} required/></label>
        <label>Longitude<input type="number" step="any" value={longitude} onChange={e=>setLng(e.target.value)} required/></label>
        <label>Items<input value={items} onChange={e=>setItems(e.target.value)} placeholder="PKG001,PKG002"/></label>
        <div className="row">
          <button type="submit" disabled={loading}>{loading ? 'Submitting...' : 'Submit Order'}</button>
        </div>
      </form>
      {error && <p className="error">{error}</p>}
      {result && (
        <div className="card">
          <p><b>Status:</b> {result.status}</p>
          <p><b>Track URL:</b> {result.track}</p>
        </div>
      )}
    </section>
  )
}
