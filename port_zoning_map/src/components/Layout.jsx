import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import FreePortDigitizer from './FreePortDigitizer';

/**
 * Layout Component
 * 
 * Provides the main application layout with:
 * - Fixed sidebar navigation that expands on hover
 * - Navigation links to Map, Operations, and Audit Trail pages
 * - Dynamic main content area that renders either the Map or other pages via Outlet
 * 
 * The sidebar collapses to a narrow icon-only view by default and expands
 * to show full navigation labels on hover. The component uses React Router's
 * useLocation hook to track the active route and highlight the corresponding nav item.
 * 
 * @returns {JSX.Element} Layout with sidebar and main content area
 */
const Layout = () => {
  // Get current location to determine which nav item should be active
  const location = useLocation();

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen selection:bg-primary-container selection:text-on-primary-container dark">
      {/* Sidebar Navigation - Fixed, collapsible on hover */}
      <aside className="fixed left-0 top-0 h-full w-16 hover:w-64 bg-surface-container-low border-r border-outline-variant/30 shadow-sm flex flex-col py-6 z-50 group transition-[width] duration-300 ease-in-out overflow-hidden">
        {/* Sidebar Header - Logo and Brand Name */}
        <div className="px-6 mb-8 flex items-center gap-4 whitespace-nowrap">
          <div className="w-10 h-10 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 -ml-2">
            <span className="material-symbols-outlined text-primary">anchor</span>
          </div>
          {/* Brand name appears on hover */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
            <h1 className="text-lg font-bold text-primary leading-tight">Nexus Terminal</h1>
            <p className="text-xs text-on-surface-variant">Command Center</p>
          </div>
        </div>
        
        {/* Main Navigation Links */}
        <nav className="flex-1 px-2 space-y-2 overflow-y-auto overflow-x-hidden">
          {/* Live Map Navigation Link */}
          <NavLink 
            to="/map" 
            className={({isActive}) => `flex items-center gap-3 px-4 py-3 transition-colors rounded-lg group/item ${isActive ? 'bg-primary/10 text-primary border-r-2 border-primary rounded-l-lg rounded-r-none' : 'text-on-surface-variant hover:bg-surface-container-highest/50'}`}
            title="Live Map"
          >
            <span className="material-symbols-outlined group-hover/item:text-primary transition-colors shrink-0 -ml-1">map</span>
            <span className="text-sm font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">Live Map</span>
          </NavLink>
          
          {/* Operations Navigation Link */}
          <NavLink 
            to="/operations" 
            className={({isActive}) => `flex items-center gap-3 px-4 py-3 transition-colors rounded-lg group/item ${isActive ? 'bg-primary/10 text-primary border-r-2 border-primary rounded-l-lg rounded-r-none' : 'text-on-surface-variant hover:bg-surface-container-highest/50'}`}
            title="Operations"
          >
            <span className="material-symbols-outlined group-hover/item:text-primary transition-colors shrink-0 -ml-1">monitoring</span>
            <span className="text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">Operations</span>
          </NavLink>
          
          {/* Audit Trail Navigation Link */}
          <NavLink 
            to="/audit-trail" 
            className={({isActive}) => `flex items-center gap-3 px-4 py-3 transition-colors rounded-lg group/item ${isActive ? 'bg-primary/10 text-primary border-r-2 border-primary rounded-l-lg rounded-r-none' : 'text-on-surface-variant hover:bg-surface-container-highest/50'}`}
            title="Audit Trail"
          >
            <span className="material-symbols-outlined group-hover/item:text-primary transition-colors shrink-0 -ml-1">security</span>
            <span className="text-sm font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">Audit Trail</span>
          </NavLink>
        </nav>

        {/* Sidebar Footer - Support and Sign Out */}
        <div className="px-2 mt-auto space-y-2">
          {/* Support Link */}
          <a className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-highest/50 transition-colors rounded-lg cursor-pointer group/item" title="Support">
            <span className="material-symbols-outlined shrink-0 -ml-1">help</span>
            <span className="text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">Support</span>
          </a>
          {/* Sign Out Link */}
          <a className="flex items-center gap-3 px-4 py-3 text-error hover:bg-error/10 transition-colors rounded-lg cursor-pointer group/item" title="Sign Out">
            <span className="material-symbols-outlined shrink-0 -ml-1">logout</span>
            <span className="text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">Sign Out</span>
          </a>
        </div>
      </aside>

      {/* Main Content Area - Renders pages via Router Outlet */}
      <main className="ml-16 min-h-screen relative transition-[margin] duration-300 ease-in-out">
         {/* Map Page - Shows FreePortDigitizer when on /map route */}
         <div style={{ display: location.pathname === '/map' ? 'block' : 'none', width: '100%', height: '100vh' }}>
            <FreePortDigitizer isActive={location.pathname === '/map'} />
         </div>
         {/* Other Pages - Rendered via Outlet for Operations, Audit Trail, etc. */}
         {location.pathname !== '/map' && <Outlet />}
      </main>
    </div>
  );
};

export default Layout;
