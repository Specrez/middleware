const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

export function getClientId() {
  return localStorage.getItem('clientId') || ''
}

export function setClientId(id) {
  localStorage.setItem('clientId', id)
}

export async function submitOrder({ orderId, deliveryAddress, items }) {
  const clientId = getClientId()
  const res = await fetch(`${API_BASE}/api/orders/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, clientId, deliveryAddress, items })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || data.error || 'Failed to submit order')
  return data
}

export async function getOrderStatus(orderId) {
  const res = await fetch(`${API_BASE}/api/orders/status/${encodeURIComponent(orderId)}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || data.error || 'Failed to fetch status')
  return data
}

export async function getDashboard() {
  const res = await fetch(`${API_BASE}/api/analytics/dashboard`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || data.error || 'Failed to fetch dashboard')
  return data
}

export async function getVehicles() {
  const res = await fetch(`${API_BASE}/api/vehicles/status`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || data.error || 'Failed to fetch vehicles')
  return data
}
