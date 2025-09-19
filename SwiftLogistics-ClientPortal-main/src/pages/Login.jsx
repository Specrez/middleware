import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setClientId } from '../lib/api'

export default function Login() {
  const [clientId, setClient] = useState('CLIENT001')
  const navigate = useNavigate()

  function onSubmit(e) {
    e.preventDefault()
    if (!clientId.trim()) return
    setClientId(clientId.trim())
    navigate('/dashboard')
  }

  return (
    <section>
      <h2>Login</h2>
      <form onSubmit={onSubmit} className="form">
        <label>Client ID
          <input value={clientId} onChange={e=>setClient(e.target.value)} placeholder="CLIENT001" />
        </label>
        <button type="submit">Continue</button>
      </form>
      <p className="muted">No password for the demo. Just set your Client ID.</p>
    </section>
  )
}
