import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Operations from './pages/Operations';

import AuditTrail from './pages/AuditTrail';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/map" replace />} />
          <Route path="operations" element={<Operations />} />
          <Route path="audit-trail" element={<AuditTrail />} />
          <Route path="map" element={<div />} /> {/* Dummy route for active state */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
