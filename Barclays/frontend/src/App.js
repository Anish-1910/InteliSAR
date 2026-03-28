import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import RoleSelection from './components/RoleSelection';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import SARPage from './components/SARPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<RoleSelection />} />
          <Route path="/login/:role" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/sar/:alertId" element={<SARPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
