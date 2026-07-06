import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import FreePortDigitizer from './FreePortDigitizer';

const Layout = () => {
  const location = useLocation();

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen selection:bg-primary-container selection:text-on-primary-container dark">
      {/* TopNavBar Removed */}      {/* SideNavBar */}
      <aside className="fixed left-0 top-0 h-full w-16 hover:w-64 bg-surface-container-low border-r border-outline-variant/30 shadow-sm flex flex-col py-6 z-50 group transition-[width] duration-300 ease-in-out overflow-hidden">
        <div className="px-6 mb-8 flex items-center gap-4 whitespace-nowrap">
          <div className="w-10 h-10 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 -ml-2">
            <span className="material-symbols-outlined text-primary">anchor</span>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
            <h1 className="text-lg font-bold text-primary leading-tight">Nexus Terminal</h1>
            <p className="text-xs text-on-surface-variant">Command Center</p>
          </div>
        </div>
        
        <nav className="flex-1 px-2 space-y-2 overflow-y-auto overflow-x-hidden">
          <NavLink 
            to="/map" 
            className={({isActive}) => `flex items-center gap-3 px-4 py-3 transition-colors rounded-lg group/item ${isActive ? 'bg-primary/10 text-primary border-r-2 border-primary rounded-l-lg rounded-r-none' : 'text-on-surface-variant hover:bg-surface-container-highest/50'}`}
            title="Live Map"
          >
            <span className="material-symbols-outlined group-hover/item:text-primary transition-colors shrink-0 -ml-1">map</span>
            <span className="text-sm font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">Live Map</span>
          </NavLink>
          
          <NavLink 
            to="/operations" 
            className={({isActive}) => `flex items-center gap-3 px-4 py-3 transition-colors rounded-lg group/item ${isActive ? 'bg-primary/10 text-primary border-r-2 border-primary rounded-l-lg rounded-r-none' : 'text-on-surface-variant hover:bg-surface-container-highest/50'}`}
            title="Operations"
          >
            <span className="material-symbols-outlined group-hover/item:text-primary transition-colors shrink-0 -ml-1">monitoring</span>
            <span className="text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">Operations</span>
          </NavLink>
          
          <NavLink 
            to="/inventory" 
            className={({isActive}) => `flex items-center gap-3 px-4 py-3 transition-colors rounded-lg group/item ${isActive ? 'bg-primary/10 text-primary border-r-2 border-primary rounded-l-lg rounded-r-none' : 'text-on-surface-variant hover:bg-surface-container-highest/50'}`}
            title="Inventory"
          >
            <span className="material-symbols-outlined shrink-0 -ml-1" style={{fontVariationSettings: "'FILL' 1"}}>inventory_2</span>
            <span className="text-sm font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">Inventory</span>
          </NavLink>
          
          <NavLink 
            to="/analytics" 
            className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-highest/50 transition-colors rounded-lg group/item"
            title="Analytics"
          >
            <span className="material-symbols-outlined group-hover/item:text-primary transition-colors shrink-0 -ml-1">analytics</span>
            <span className="text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">Analytics</span>
          </NavLink>
          
          <NavLink 
            to="/logistics" 
            className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-highest/50 transition-colors rounded-lg group/item"
            title="Logistics Fleet"
          >
            <span className="material-symbols-outlined group-hover/item:text-primary transition-colors shrink-0 -ml-1">local_shipping</span>
            <span className="text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">Logistics Fleet</span>
          </NavLink>
        </nav>

        <div className="px-2 mt-auto space-y-2">
          <a className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-highest/50 transition-colors rounded-lg cursor-pointer group/item" title="Support">
            <span className="material-symbols-outlined shrink-0 -ml-1">help</span>
            <span className="text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">Support</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 text-error hover:bg-error/10 transition-colors rounded-lg cursor-pointer group/item" title="Sign Out">
            <span className="material-symbols-outlined shrink-0 -ml-1">logout</span>
            <span className="text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">Sign Out</span>
          </a>
        </div>
      </aside>

      {/* Main Content Area - Rendered via Router */}
      <main className="ml-16 min-h-screen relative transition-[margin] duration-300 ease-in-out">
         <div style={{ display: location.pathname === '/map' ? 'block' : 'none', width: '100%', height: '100vh' }}>
            <FreePortDigitizer isActive={location.pathname === '/map'} />
         </div>
         {location.pathname !== '/map' && <Outlet />}
      </main>
    </div>
  );
};

export default Layout;
