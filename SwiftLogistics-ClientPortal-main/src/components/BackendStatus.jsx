import React, { useEffect, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

export default function BackendStatus() {
  const [ok, setOk] = useState(null)
  const [msg, setMsg] = useState('Checking...')

  async function check() {
    setMsg('Checking...')
    try {
      const res = await fetch(`${API_BASE}/health`)
      if (res.ok) {
        setOk(true)
        setMsg('Backend: OK')
      } else {
        setOk(false)
        setMsg('Backend: Unreachable')
      }
    } catch (e) {
      setOk(false)
      setMsg('Backend: Unreachable')
    }
  }

  useEffect(() => { check() }, [])

  const dotStyle = {
    display: 'inline-block',
    width: 10,
    height: 10,
    borderRadius: '50%',
    marginRight: 6,
    background: ok == null ? '#999' : ok ? '#0a0' : '#c00'
  }

  return (
    <span title="Click to re-check" style={{cursor:'pointer'}} onClick={check}>
      <span style={dotStyle} /> {msg}
    </span>
  )
}
