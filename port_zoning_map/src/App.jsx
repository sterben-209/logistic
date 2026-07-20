import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Operations from './pages/Operations';

import AuditTrail from './pages/AuditTrail';
import './index.css';

/**
 * App Component
 * 
 * Main application component that sets up the routing structure.
 * Configures the browser router with three main routes:
 * - "/" (root) → redirects to "/map"
 * - "/operations" → Operations page
 * - "/audit-trail" → Audit trail page
 * - "/map" → Map page (dummy route for active state)
 * 
 * All routes are wrapped in the Layout component which provides
 * the shared UI layout and navigation.
 * 
 * @returns {JSX.Element} React component with routing configuration
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Redirect root path to /map */}
          <Route index element={<Navigate to="/map" replace />} />
          {/* Operations page route */}
          <Route path="operations" element={<Operations />} />
          {/* Audit trail page route */}
          <Route path="audit-trail" element={<AuditTrail />} />
          {/* Map page route - dummy route for active state */}
          <Route path="map" element={<div />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
