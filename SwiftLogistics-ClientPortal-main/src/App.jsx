import React from 'react'
import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom'
import Login from './pages/Login'
import Orders from './pages/Orders'
import Tracking from './pages/Tracking'
import Dashboard from './pages/Dashboard'
import DriverManifest from './pages/DriverManifest'
import { getClientId } from './lib/api'
import BackendStatus from './components/BackendStatus'

function Layout({ children }) {
  const navigate = useNavigate()
  const clientId = getClientId()
  return (
    <div className="container">
      <header>
        <h1>SwiftTrack Client Portal</h1>
        <nav>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/orders">Orders</Link>
          <Link to="/tracking">Tracking</Link>
          <Link to="/driver">Driver</Link>
        </nav>
        <div className="auth">
          <BackendStatus />
          {clientId ? (
            <>
              <span>Client: <b>{clientId}</b></span>
              <button onClick={() => { localStorage.removeItem('clientId'); navigate('/login') }}>Logout</button>
            </>
          ) : (
            <Link to="/login">Login</Link>
          )}
        </div>
      </header>
      <main>{children}</main>
      <footer>© {new Date().getFullYear()} SwiftTrack</footer>
    </div>
  )
}

export default function App() {
  const authed = !!getClientId()
  return (
    <Routes>
      <Route path="/login" element={<Layout><Login /></Layout>} />
      <Route path="/orders" element={authed ? <Layout><Orders /></Layout> : <Navigate to="/login" />} />
      <Route path="/tracking" element={authed ? <Layout><Tracking /></Layout> : <Navigate to="/login" />} />
      <Route path="/driver" element={authed ? <Layout><DriverManifest /></Layout> : <Navigate to="/login" />} />
      <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="*" element={<Layout><div>Not found</div></Layout>} />
    </Routes>
  )
}
