import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Operations from './pages/Operations';
import Inventory from './pages/Inventory';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/map" replace />} />
          <Route path="operations" element={<Operations />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="map" element={<div />} /> {/* Dummy route for active state */}
          
          {/* Fallback routes for other items on the sidebar */}
          <Route path="analytics" element={
            <div className="p-margin-desktop text-on-surface">
               <h1 className="text-display-lg font-bold">Analytics</h1>
               <p className="mt-4">This module is not yet ported.</p>
            </div>
          } />
          <Route path="logistics" element={
            <div className="p-margin-desktop text-on-surface">
               <h1 className="text-display-lg font-bold">Logistics Fleet</h1>
               <p className="mt-4">This module is not yet ported.</p>
            </div>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
