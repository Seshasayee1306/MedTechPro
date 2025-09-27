import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';

// Page Components
import Navbar from './components/Navbar';
import Home from './components/Home';
import S3Contents from './components/S3Contents';
import AthenaQuery from './components/AthenaQuery';
import SendEmail from './components/SendEmail';
import Visualization from './components/Visualization'; // 📊 Real-time Graph Page

// Global Styles
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        {/* Top Navigation */}
        <Navbar />

        {/* Page Routing */}
        <main style={{ padding: '1rem', minHeight: '90vh' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/s3" element={<S3Contents />} />
            <Route path="/athena" element={<AthenaQuery />} />
            <Route path="/send-email" element={<SendEmail />} />
            <Route path="/visualization" element={<Visualization />} /> {/* 👈 New Route */}
          </Routes>
        </main>

        {/* Footer (Optional) */}
        <footer style={{
          textAlign: 'center',
          padding: '1rem',
          backgroundColor: '#f0f0f0',
          color: '#555'
        }}>
          © {new Date().getFullYear()} MedTechPro - Built for Predictive Maintenance
        </footer>
      </div>
    </Router>
  );
}

export default App;
