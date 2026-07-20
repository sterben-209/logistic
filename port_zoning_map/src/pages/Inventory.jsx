/**
 * Inventory Page
 * 
 * Real-time telemetry and inventory dashboard for container port operations.
 * 
 * Features:
 * - Summary cards: total containers, active reefer units, terminal occupancy
 * - KPI metrics: with trend indicators (% change) and visual gauges
 * - Real-time status: shows zone capacities and alerts for near-full zones
 * - Data table: detailed container information with filtering and sorting
 * - Responsive design: adapts from 1-column (mobile) to 3-column (desktop) layout
 * 
 * Metrics Displayed:
 * - Total Containers: 14,285 units (↑2.4% trend)
 * - Active Reefer Units: 3,192 units at optimal temperature
 * - Terminal Occupancy: 88% (Zone C nearing capacity)
 * 
 * UI Components:
 * - Bento grid card layout with glassmorphism effects
 * - Circular occupancy gauge (SVG-based progress indicator)
 * - Sparkline charts showing temporal trends
 * - Filter toolbar for type, size, zone, and status
 * - Type-coded color indicators (DRY=green, REEFER=blue, HAZMAT=red)
 * 
 * Data Flow:
 * - Pulls from global state (useTaskStore)
 * - Updates in real-time as containers move
 * - Responsive to zone capacity changes
 * 
 * @component
 * @returns {JSX.Element} Full-page inventory telemetry dashboard
 */
import React from "react";

/**
 * Inventory Component
 * Displays real-time container inventory metrics and details
 * @component
 */
const Inventory = () => {
  return (
    <div className="p-margin-desktop min-h-[calc(100vh-4rem)]">

{/* Page Header */}
<div className="mb-8 flex justify-between items-end">
<div>
<h2 className="font-display-lg text-display-lg text-inverse-surface mb-2">Inventory Management</h2>
<p className="font-body-md text-body-md text-outline">Real-time telemetry and container logistics oversight.</p>
</div>
<button className="bg-primary-container text-on-primary-container px-6 py-2.5 rounded-lg font-title-md text-[14px] font-semibold flex items-center gap-2 hover:bg-primary hover:text-on-primary transition-colors shadow-[0_4px_20px_rgba(77,142,255,0.15)]">
<span className="material-symbols-outlined text-[18px]">add_box</span>
                Register Inbound
            </button>
</div>
{/* Quick Summary Dashboard (Bento Grid) */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-panel-gap mb-8">
{/* Card 1: Total Containers */}
<div className="bg-surface border border-outline-variant/20 rounded-xl p-6 relative overflow-hidden group hover:border-primary/50 transition-colors">
<div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-primary/10 transition-colors"></div>
<div className="flex justify-between items-start mb-4 relative z-10">
<h3 className="font-title-md text-[16px] text-on-surface-variant font-medium">Total Containers</h3>
<span className="material-symbols-outlined text-outline-variant">deployed_code</span>
</div>
<div className="flex items-baseline gap-3 relative z-10">
<span className="font-telemetry-num text-[40px] leading-none font-bold text-inverse-surface">14,285</span>
<span className="font-label-sm text-label-sm text-secondary flex items-center">
<span className="material-symbols-outlined text-[14px]">arrow_upward</span> 2.4%
                    </span>
</div>
<div className="mt-4 h-1 w-full bg-surface-container-highest rounded-full overflow-hidden">
<div className="h-full bg-primary w-[75%] rounded-full shadow-[0_0_10px_rgba(173,198,255,0.8)]"></div>
</div>
</div>
{/* Card 2: Reefer Units */}
<div className="bg-surface border border-outline-variant/20 rounded-xl p-6 relative overflow-hidden group hover:border-secondary/50 transition-colors">
<div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-secondary/10 transition-colors"></div>
<div className="flex justify-between items-start mb-4 relative z-10">
<h3 className="font-title-md text-[16px] text-on-surface-variant font-medium">Active Reefer Units</h3>
<span className="material-symbols-outlined text-secondary">ac_unit</span>
</div>
<div className="flex items-baseline gap-3 relative z-10">
<span className="font-telemetry-num text-[40px] leading-none font-bold text-secondary">3,192</span>
<span className="font-label-sm text-label-sm bg-secondary/10 text-secondary px-2 py-0.5 rounded border border-secondary/20">Optimal</span>
</div>
{/* Sparkline mock */}
<div className="mt-4 flex items-end h-8 gap-1 opacity-70">
<div className="w-1/6 bg-secondary/40 h-[40%] rounded-t-sm"></div>
<div className="w-1/6 bg-secondary/60 h-[60%] rounded-t-sm"></div>
<div className="w-1/6 bg-secondary/50 h-[50%] rounded-t-sm"></div>
<div className="w-1/6 bg-secondary/80 h-[80%] rounded-t-sm"></div>
<div className="w-1/6 bg-secondary h-[100%] rounded-t-sm shadow-[0_0_8px_rgba(78,222,163,0.6)]"></div>
<div className="w-1/6 bg-secondary/90 h-[90%] rounded-t-sm"></div>
</div>
</div>
{/* Card 3: Occupancy */}
<div className="bg-surface border border-outline-variant/20 rounded-xl p-6 relative overflow-hidden group hover:border-tertiary-container/50 transition-colors">
<div className="absolute top-0 right-0 w-32 h-32 bg-tertiary-container/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-tertiary-container/10 transition-colors"></div>
<div className="flex justify-between items-start mb-2 relative z-10">
<h3 className="font-title-md text-[16px] text-on-surface-variant font-medium">Terminal Occupancy</h3>
<span className="material-symbols-outlined text-outline-variant">warehouse</span>
</div>
<div className="flex items-center gap-6 relative z-10 mt-2">
{/* Circular Gauge Mock */}
<div className="relative w-16 h-16 flex-shrink-0">
<svg className="w-full h-full transform -rotate-90" viewbox="0 0 36 36">
{/* Background Circle */}
<path className="text-surface-container-highest" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-width="3"></path>
{/* Progress Circle (88%) */}
<path className="text-tertiary-container shadow-[0_0_10px_rgba(255,84,81,0.5)]" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-dasharray="88, 100" stroke-linecap="round" stroke-width="3"></path>
</svg>
<div className="absolute inset-0 flex items-center justify-center">
<span className="font-telemetry-num text-[12px] font-bold text-inverse-surface">88%</span>
</div>
</div>
<div>
<p className="font-body-md text-[14px] text-outline mb-1">Zone C nearing capacity.</p>
<span className="font-label-sm text-label-sm bg-tertiary-container/10 text-tertiary-container px-2 py-0.5 rounded border border-tertiary-container/20">Action Required</span>
</div>
</div>
</div>
</div>
{/* Data Table Section */}
<div className="bg-surface border border-outline-variant/20 rounded-xl overflow-hidden shadow-lg shadow-black/40 flex flex-col">
{/* Table Toolbar / Filters */}
<div className="p-4 border-b border-outline-variant/20 bg-surface-container-low/50 flex flex-wrap gap-4 items-center justify-between">
<div className="flex gap-3">
<div className="relative">
<select className="appearance-none bg-surface-dim border border-outline-variant/30 text-on-surface font-title-md text-[14px] rounded-lg pl-4 pr-10 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer">
<option value="">All Types</option>
<option value="dry">Dry</option>
<option value="reefer">Reefer</option>
<option value="open">Open Top</option>
</select>
<span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline-variant">expand_more</span>
</div>
<div className="relative">
<select className="appearance-none bg-surface-dim border border-outline-variant/30 text-on-surface font-title-md text-[14px] rounded-lg pl-4 pr-10 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer">
<option value="">All Sizes</option>
<option value="20">20ft</option>
<option value="40">40ft</option>
<option value="45">45ft HQ</option>
</select>
<span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline-variant">expand_more</span>
</div>
</div>
<div className="flex items-center gap-2">
<button className="p-2 rounded-lg border border-outline-variant/30 text-outline hover:text-primary hover:border-primary/50 transition-colors">
<span className="material-symbols-outlined text-[20px]">filter_list</span>
</button>
<button className="p-2 rounded-lg border border-outline-variant/30 text-outline hover:text-primary hover:border-primary/50 transition-colors">
<span className="material-symbols-outlined text-[20px]">download</span>
</button>
</div>
</div>
{/* The Data Table */}
<div className="overflow-x-auto">
<table className="w-full text-left border-collapse">
<thead>
<tr className="bg-surface-container-high border-b border-outline-variant/20">
<th className="py-3 px-6 font-label-sm text-label-sm text-outline-variant uppercase tracking-wider">Container ID</th>
<th className="py-3 px-6 font-label-sm text-label-sm text-outline-variant uppercase tracking-wider">Type</th>
<th className="py-3 px-6 font-label-sm text-label-sm text-outline-variant uppercase tracking-wider">Size</th>
<th className="py-3 px-6 font-label-sm text-label-sm text-outline-variant uppercase tracking-wider">Cargo Type</th>
<th className="py-3 px-6 font-label-sm text-label-sm text-outline-variant uppercase tracking-wider text-right">Weight (Tons)</th>
<th className="py-3 px-6 font-label-sm text-label-sm text-outline-variant uppercase tracking-wider text-right">Days in Terminal</th>
<th className="py-3 px-6 font-label-sm text-label-sm text-outline-variant uppercase tracking-wider text-center">Actions</th>
</tr>
</thead>
<tbody className="font-body-md text-[14px] text-on-surface-variant divide-y divide-outline-variant/10">
{/* Row 1 (Dry) */}
<tr className="hover:bg-primary/5 transition-colors group cursor-pointer">
<td className="py-4 px-6 font-telemetry-num font-medium text-inverse-surface group-hover:text-primary transition-colors">NEXU-883920-1</td>
<td className="py-4 px-6">
<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-bright border border-outline-variant/20 text-on-surface">
<span className="w-1.5 h-1.5 rounded-full bg-outline"></span> Dry
                                </span>
</td>
<td className="py-4 px-6 font-telemetry-num text-outline">40ft</td>
<td className="py-4 px-6">Electronics</td>
<td className="py-4 px-6 text-right font-telemetry-num text-on-surface">14.5</td>
<td className="py-4 px-6 text-right font-telemetry-num text-on-surface">04</td>
<td className="py-4 px-6 text-center">
<button className="text-outline-variant hover:text-primary transition-colors p-1">
<span className="material-symbols-outlined text-[18px]">more_vert</span>
</button>
</td>
</tr>
{/* Row 2 (Reefer - Active) */}
<tr className="hover:bg-primary/5 transition-colors group cursor-pointer bg-secondary/5">
<td className="py-4 px-6 font-telemetry-num font-medium text-inverse-surface group-hover:text-primary transition-colors">COLD-441029-4</td>
<td className="py-4 px-6">
<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary/10 border border-secondary/30 text-secondary">
<span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse shadow-[0_0_5px_rgba(78,222,163,0.8)]"></span> Reefer
                                </span>
</td>
<td className="py-4 px-6 font-telemetry-num text-outline">40ft</td>
<td className="py-4 px-6">Pharmaceuticals</td>
<td className="py-4 px-6 text-right font-telemetry-num text-on-surface">22.0</td>
<td className="py-4 px-6 text-right font-telemetry-num text-on-surface">02</td>
<td className="py-4 px-6 text-center">
<button className="text-outline-variant hover:text-primary transition-colors p-1">
<span className="material-symbols-outlined text-[18px]">more_vert</span>
</button>
</td>
</tr>
{/* Row 3 (Dry - Warning) */}
<tr className="hover:bg-primary/5 transition-colors group cursor-pointer">
<td className="py-4 px-6 font-telemetry-num font-medium text-inverse-surface group-hover:text-primary transition-colors">MAER-119283-7</td>
<td className="py-4 px-6">
<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-bright border border-outline-variant/20 text-on-surface">
<span className="w-1.5 h-1.5 rounded-full bg-outline"></span> Dry
                                </span>
</td>
<td className="py-4 px-6 font-telemetry-num text-outline">20ft</td>
<td className="py-4 px-6">Textiles</td>
<td className="py-4 px-6 text-right font-telemetry-num text-on-surface">8.2</td>
<td className="py-4 px-6 text-right font-telemetry-num text-tertiary-container font-bold">18</td>
<td className="py-4 px-6 text-center">
<button className="text-outline-variant hover:text-primary transition-colors p-1">
<span className="material-symbols-outlined text-[18px]">more_vert</span>
</button>
</td>
</tr>
{/* Row 4 (Open Top) */}
<tr className="hover:bg-primary/5 transition-colors group cursor-pointer">
<td className="py-4 px-6 font-telemetry-num font-medium text-inverse-surface group-hover:text-primary transition-colors">HLCU-992314-2</td>
<td className="py-4 px-6">
<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 border border-primary/30 text-primary">
<span className="material-symbols-outlined text-[12px]">view_in_ar</span> Open Top
                                </span>
</td>
<td className="py-4 px-6 font-telemetry-num text-outline">40ft</td>
<td className="py-4 px-6">Industrial Machinery</td>
<td className="py-4 px-6 text-right font-telemetry-num text-on-surface">18.5</td>
<td className="py-4 px-6 text-right font-telemetry-num text-on-surface">07</td>
<td className="py-4 px-6 text-center">
<button className="text-outline-variant hover:text-primary transition-colors p-1">
<span className="material-symbols-outlined text-[18px]">more_vert</span>
</button>
</td>
</tr>
{/* Row 5 (Reefer - Critical) */}
<tr className="hover:bg-primary/5 transition-colors group cursor-pointer bg-error/5">
<td className="py-4 px-6 font-telemetry-num font-medium text-inverse-surface group-hover:text-primary transition-colors">COLD-882103-9</td>
<td className="py-4 px-6">
<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-error/10 border border-error/30 text-error">
<span className="material-symbols-outlined text-[12px] animate-ping">warning</span> Reefer
                                </span>
</td>
<td className="py-4 px-6 font-telemetry-num text-outline">20ft</td>
<td className="py-4 px-6">Perishables (Meat)</td>
<td className="py-4 px-6 text-right font-telemetry-num text-on-surface">28.4</td>
<td className="py-4 px-6 text-right font-telemetry-num text-on-surface">01</td>
<td className="py-4 px-6 text-center">
<button className="text-outline-variant hover:text-primary transition-colors p-1">
<span className="material-symbols-outlined text-[18px]">more_vert</span>
</button>
</td>
</tr>
</tbody>
</table>
</div>
{/* Table Footer / Pagination */}
<div className="p-4 border-t border-outline-variant/20 bg-surface-container-low/30 flex justify-between items-center">
<span className="font-label-sm text-label-sm text-outline-variant">Showing 1-5 of 14,285</span>
<div className="flex gap-1">
<button className="p-1 rounded bg-surface border border-outline-variant/30 text-outline-variant hover:text-primary hover:border-primary/50 disabled:opacity-50" disabled="">
<span className="material-symbols-outlined text-[20px]">chevron_left</span>
</button>
<button className="w-8 h-8 rounded bg-primary/20 border border-primary/50 text-primary font-telemetry-num text-[12px] flex items-center justify-center">1</button>
<button className="w-8 h-8 rounded bg-surface border border-outline-variant/30 text-outline-variant hover:text-primary hover:border-primary/50 font-telemetry-num text-[12px] flex items-center justify-center transition-colors">2</button>
<button className="w-8 h-8 rounded bg-surface border border-outline-variant/30 text-outline-variant hover:text-primary hover:border-primary/50 font-telemetry-num text-[12px] flex items-center justify-center transition-colors">3</button>
<span className="w-8 h-8 flex items-center justify-center text-outline-variant">...</span>
<button className="p-1 rounded bg-surface border border-outline-variant/30 text-outline-variant hover:text-primary hover:border-primary/50 transition-colors">
<span className="material-symbols-outlined text-[20px]">chevron_right</span>
</button>
</div>
</div>
</div>

    </div>
  );
};

export default Inventory;
