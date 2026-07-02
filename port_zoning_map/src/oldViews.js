
export const operationsHtml = `<div id="view-operations" class="spa-view hidden w-full h-full flex flex-col">
<div class="absolute inset-0 bg-gradient-to-b from-transparent to-background/50 pointer-events-none"></div>
<div class="flex-1 flex gap-panel-gap min-h-0 relative z-10">
<!-- Center Panel: Interactive Data Grid -->
<section class="flex-[2] flex flex-col bg-surface-container/90 backdrop-blur-sm rounded-xl border border-outline-variant/30 shadow-lg overflow-hidden flex flex-col h-full">
<!-- Data Grid Header Controls -->
<div class="p-4 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-high/50">
<div class="flex items-center gap-3">
<span class="material-symbols-outlined text-primary text-[24px]">dataset</span>
<h2 class="font-title-md text-title-md text-primary">Container Matrix</h2>
<span class="px-2 py-0.5 rounded text-[10px] font-label-sm bg-primary/10 text-primary border border-primary/20 ml-2">LIVE SYNC</span>
</div>
<div class="flex items-center gap-4">
<div class="flex items-center gap-2">
<span class="font-label-sm text-[11px] text-outline">Manual Override</span>
<div class="relative inline-block w-9 h-5 align-middle select-none">
<input class="toggle-checkbox absolute block w-4 h-4 rounded-full bg-white border-4 appearance-none cursor-pointer z-10 top-0.5 left-0.5 opacity-0" id="manualOverride" name="toggle" type="checkbox"/>
<label class="toggle-label block overflow-hidden h-5 rounded-full bg-gray-300 cursor-pointer" for="manualOverride"></label>
</div>
</div>
<div class="h-6 w-px bg-outline-variant/50"></div>
<button class="flex items-center gap-2 px-3 py-1.5 border border-primary/40 text-primary hover:bg-primary/10 rounded transition-colors text-sm font-label-sm">
<span class="material-symbols-outlined text-[16px]">sync</span>
                            Sync Real-time Data
                        </button>
<button class="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 rounded transition-colors text-sm font-label-sm">
<span class="material-symbols-outlined text-[16px]">download</span>
                            Export CSV
                        </button>
</div>
</div>
<!-- The Grid -->
<div class="flex-1 overflow-auto">
<table class="w-full text-left border-collapse">
<thead>
<tr>
<th class="data-grid-header w-12 text-center">#</th>
<th class="data-grid-header">Container ID</th>
<th class="data-grid-header">Type</th>
<th class="data-grid-header">Weight (tons)</th>
<th class="data-grid-header">X-Coord</th>
<th class="data-grid-header">Y-Coord</th>
<th class="data-grid-header">Status</th>
<th class="data-grid-header text-right">Actions</th>
</tr>
</thead>
<tbody>
<tr class="data-grid-row">
<td class="data-grid-cell text-center text-outline-variant">1</td>
<td class="data-grid-cell font-bold text-on-surface">NX-9901</td>
<td class="data-grid-cell text-on-surface-variant">40' HC</td>
<td class="data-grid-cell">28.5</td>
<td class="data-grid-cell text-secondary">A-14</td>
<td class="data-grid-cell text-secondary">Y-02</td>
<td class="data-grid-cell">
<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-label-sm bg-secondary/10 text-secondary border border-secondary/20">ACTIVE</span>
</td>
<td class="data-grid-cell text-right">
<button class="text-outline hover:text-primary transition-colors"><span class="material-symbols-outlined text-[18px]">edit</span></button>
</td>
</tr>
<tr class="data-grid-row">
<td class="data-grid-cell text-center text-outline-variant">2</td>
<td class="data-grid-cell font-bold text-on-surface">NX-9902</td>
<td class="data-grid-cell text-on-surface-variant">20' Dry</td>
<td class="data-grid-cell">14.2</td>
<td class="data-grid-cell text-outline-variant">B-05</td>
<td class="data-grid-cell text-outline-variant">Y-11</td>
<td class="data-grid-cell">
<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-label-sm bg-surface-bright text-on-surface-variant border border-outline-variant/30">STAGED</span>
</td>
<td class="data-grid-cell text-right">
<button class="text-outline hover:text-primary transition-colors"><span class="material-symbols-outlined text-[18px]">edit</span></button>
</td>
</tr>
<tr class="data-grid-row">
<td class="data-grid-cell text-center text-outline-variant">3</td>
<td class="data-grid-cell font-bold text-on-surface">NX-9903</td>
<td class="data-grid-cell text-on-surface-variant">40' Reefer</td>
<td class="data-grid-cell">32.1</td>
<td class="data-grid-cell text-tertiary">C-22</td>
<td class="data-grid-cell text-tertiary">Y-44</td>
<td class="data-grid-cell">
<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-label-sm bg-tertiary-container/20 text-tertiary border border-tertiary/30">HOLD</span>
</td>
<td class="data-grid-cell text-right">
<button class="text-outline hover:text-primary transition-colors"><span class="material-symbols-outlined text-[18px]">edit</span></button>
</td>
</tr>
<tr class="data-grid-row">
<td class="data-grid-cell text-center text-outline-variant">4</td>
<td class="data-grid-cell font-bold text-on-surface">NX-9904</td>
<td class="data-grid-cell text-on-surface-variant">40' Flat Rack</td>
<td class="data-grid-cell">18.0</td>
<td class="data-grid-cell text-primary">D-10</td>
<td class="data-grid-cell text-primary">Y-15</td>
<td class="data-grid-cell">
<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-label-sm bg-primary/10 text-primary border border-primary/30">TRANSIT</span>
</td>
<td class="data-grid-cell text-right">
<button class="text-outline hover:text-primary transition-colors"><span class="material-symbols-outlined text-[18px]">edit</span></button>
</td>
</tr>
<tr class="data-grid-row">
<td class="data-grid-cell text-center text-outline-variant">5</td>
<td class="data-grid-cell font-bold text-on-surface">NX-9905</td>
<td class="data-grid-cell text-on-surface-variant">20' Tank</td>
<td class="data-grid-cell">22.4</td>
<td class="data-grid-cell text-secondary">A-15</td>
<td class="data-grid-cell text-secondary">Y-03</td>
<td class="data-grid-cell">
<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-label-sm bg-secondary/10 text-secondary border border-secondary/20">ACTIVE</span>
</td>
<td class="data-grid-cell text-right">
<button class="text-outline hover:text-primary transition-colors"><span class="material-symbols-outlined text-[18px]">edit</span></button>
</td>
</tr>
<tr class="data-grid-row">
<td class="data-grid-cell text-center text-outline-variant">6</td>
<td class="data-grid-cell font-bold text-on-surface">NX-9906</td>
<td class="data-grid-cell text-on-surface-variant">40' HC</td>
<td class="data-grid-cell">29.1</td>
<td class="data-grid-cell text-outline-variant">E-02</td>
<td class="data-grid-cell text-outline-variant">Y-21</td>
<td class="data-grid-cell">
<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-label-sm bg-surface-bright text-on-surface-variant border border-outline-variant/30">STAGED</span>
</td>
<td class="data-grid-cell text-right">
<button class="text-outline hover:text-primary transition-colors"><span class="material-symbols-outlined text-[18px]">edit</span></button>
</td>
</tr>
<tr class="data-grid-row">
<td class="data-grid-cell text-center text-outline-variant">7</td>
<td class="data-grid-cell font-bold text-on-surface">NX-9907</td>
<td class="data-grid-cell text-on-surface-variant">20' Dry</td>
<td class="data-grid-cell">12.5</td>
<td class="data-grid-cell text-tertiary">F-11</td>
<td class="data-grid-cell text-tertiary">Y-33</td>
<td class="data-grid-cell">
<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-label-sm bg-tertiary-container/20 text-tertiary border border-tertiary/30">HOLD</span>
</td>
<td class="data-grid-cell text-right">
<button class="text-outline hover:text-primary transition-colors"><span class="material-symbols-outlined text-[18px]">edit</span></button>
</td>
</tr>
<tr class="data-grid-row">
<td class="data-grid-cell text-center text-outline-variant">8</td>
<td class="data-grid-cell font-bold text-on-surface">NX-9908</td>
<td class="data-grid-cell text-on-surface-variant">40' Dry</td>
<td class="data-grid-cell">25.0</td>
<td class="data-grid-cell text-secondary">A-16</td>
<td class="data-grid-cell text-secondary">Y-04</td>
<td class="data-grid-cell">
<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-label-sm bg-secondary/10 text-secondary border border-secondary/20">ACTIVE</span>
</td>
<td class="data-grid-cell text-right">
<button class="text-outline hover:text-primary transition-colors"><span class="material-symbols-outlined text-[18px]">edit</span></button>
</td>
</tr>
</tbody>
</table>
</div>
</section>
<!-- Right Panel: Live Terminal Feed -->
<section class="flex-1 flex flex-col bg-[#050914] rounded-xl border border-outline-variant/20 shadow-lg overflow-hidden h-full min-w-[320px]">
<div class="p-3 border-b border-outline-variant/20 bg-surface-container-lowest flex justify-between items-center">
<h3 class="font-label-sm text-sm text-outline flex items-center gap-2 tracking-wider">
<span class="material-symbols-outlined text-[18px] text-primary">terminal</span>
                        LIVE TERMINAL FEED
                    </h3>
<div class="flex gap-1.5">
<div class="w-2.5 h-2.5 rounded-full bg-surface-variant"></div>
<div class="w-2.5 h-2.5 rounded-full bg-surface-variant"></div>
<div class="w-2.5 h-2.5 rounded-full bg-secondary/50 animate-pulse"></div>
</div>
</div>
<div class="flex-1 p-4 overflow-y-auto terminal-text">
<div class="terminal-log-entry info">
<span class="text-outline-variant">[10:42:01]</span> <span class="text-primary-fixed-dim">SYS:</span> Connecting to master orchestrator...
                    </div>
<div class="terminal-log-entry success">
<span class="text-outline-variant">[10:42:02]</span> <span class="text-secondary-fixed">NET:</span> Connection established. Latency: 12ms
                    </div>
<div class="terminal-log-entry info">
<span class="text-outline-variant">[10:42:05]</span> <span class="text-primary-fixed-dim">SYNC:</span> Receiving yard layout state (v4.2.1)
                    </div>
<div class="terminal-log-entry info">
<span class="text-outline-variant">[10:42:08]</span> <span class="text-primary-fixed-dim">OP:</span> RTG-Crane-04 dispatched to zone A-14
                    </div>
<div class="terminal-log-entry info">
<span class="text-outline-variant">[10:42:15]</span> <span class="text-primary-fixed-dim">DATA:</span> Matrix updated. 8234 containers tracked.
                    </div>
<div class="terminal-log-entry warning">
<span class="text-outline-variant">[10:43:22]</span> <span class="text-tertiary">WARN:</span> Slight temp deviation detected in NX-9903 (Reefer). Target: -18C, Current: -17.2C
                    </div>
<div class="terminal-log-entry info">
<span class="text-outline-variant">[10:44:01]</span> <span class="text-primary-fixed-dim">OP:</span> AGV-Unit-99 en route to D-10. ETA 4m 12s.
                    </div>
<div class="terminal-log-entry success">
<span class="text-outline-variant">[10:45:30]</span> <span class="text-secondary-fixed">DATA:</span> Heartbeat ACK. System nominal.
                    </div>
<div class="terminal-log-entry info mt-4">
<span class="text-secondary animate-pulse">_</span>
</div>
</div>
</section>
</div>
</div>
`;
export const inventoryHtml = `<div id="view-inventory" class="spa-view hidden w-full h-full flex flex-col">
<!-- Page Header -->
<div class="mb-8 flex justify-between items-end">
<div>
<h2 class="font-display-lg text-display-lg text-inverse-surface mb-2">Inventory Management</h2>
<p class="font-body-md text-body-md text-outline">Real-time telemetry and container logistics oversight.</p>
</div>
<button class="bg-primary-container text-on-primary-container px-6 py-2.5 rounded-lg font-title-md text-[14px] font-semibold flex items-center gap-2 hover:bg-primary hover:text-on-primary transition-colors shadow-[0_4px_20px_rgba(77,142,255,0.15)]">
<span class="material-symbols-outlined text-[18px]">add_box</span>
                Register Inbound
            </button>
</div>
<!-- Quick Summary Dashboard (Bento Grid) -->
<div class="grid grid-cols-1 md:grid-cols-3 gap-panel-gap mb-8">
<!-- Card 1: Total Containers -->
<div class="bg-surface border border-outline-variant/20 rounded-xl p-6 relative overflow-hidden group hover:border-primary/50 transition-colors">
<div class="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-primary/10 transition-colors"></div>
<div class="flex justify-between items-start mb-4 relative z-10">
<h3 class="font-title-md text-[16px] text-on-surface-variant font-medium">Total Containers</h3>
<span class="material-symbols-outlined text-outline-variant">deployed_code</span>
</div>
<div class="flex items-baseline gap-3 relative z-10">
<span class="font-telemetry-num text-[40px] leading-none font-bold text-inverse-surface">14,285</span>
<span class="font-label-sm text-label-sm text-secondary flex items-center">
<span class="material-symbols-outlined text-[14px]">arrow_upward</span> 2.4%
                    </span>
</div>
<div class="mt-4 h-1 w-full bg-surface-container-highest rounded-full overflow-hidden">
<div class="h-full bg-primary w-[75%] rounded-full shadow-[0_0_10px_rgba(173,198,255,0.8)]"></div>
</div>
</div>
<!-- Card 2: Reefer Units -->
<div class="bg-surface border border-outline-variant/20 rounded-xl p-6 relative overflow-hidden group hover:border-secondary/50 transition-colors">
<div class="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-secondary/10 transition-colors"></div>
<div class="flex justify-between items-start mb-4 relative z-10">
<h3 class="font-title-md text-[16px] text-on-surface-variant font-medium">Active Reefer Units</h3>
<span class="material-symbols-outlined text-secondary">ac_unit</span>
</div>
<div class="flex items-baseline gap-3 relative z-10">
<span class="font-telemetry-num text-[40px] leading-none font-bold text-secondary">3,192</span>
<span class="font-label-sm text-label-sm bg-secondary/10 text-secondary px-2 py-0.5 rounded border border-secondary/20">Optimal</span>
</div>
<!-- Sparkline mock -->
<div class="mt-4 flex items-end h-8 gap-1 opacity-70">
<div class="w-1/6 bg-secondary/40 h-[40%] rounded-t-sm"></div>
<div class="w-1/6 bg-secondary/60 h-[60%] rounded-t-sm"></div>
<div class="w-1/6 bg-secondary/50 h-[50%] rounded-t-sm"></div>
<div class="w-1/6 bg-secondary/80 h-[80%] rounded-t-sm"></div>
<div class="w-1/6 bg-secondary h-[100%] rounded-t-sm shadow-[0_0_8px_rgba(78,222,163,0.6)]"></div>
<div class="w-1/6 bg-secondary/90 h-[90%] rounded-t-sm"></div>
</div>
</div>
<!-- Card 3: Occupancy -->
<div class="bg-surface border border-outline-variant/20 rounded-xl p-6 relative overflow-hidden group hover:border-tertiary-container/50 transition-colors">
<div class="absolute top-0 right-0 w-32 h-32 bg-tertiary-container/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-tertiary-container/10 transition-colors"></div>
<div class="flex justify-between items-start mb-2 relative z-10">
<h3 class="font-title-md text-[16px] text-on-surface-variant font-medium">Terminal Occupancy</h3>
<span class="material-symbols-outlined text-outline-variant">warehouse</span>
</div>
<div class="flex items-center gap-6 relative z-10 mt-2">
<!-- Circular Gauge Mock -->
<div class="relative w-16 h-16 flex-shrink-0">
<svg class="w-full h-full transform -rotate-90" viewbox="0 0 36 36">
<!-- Background Circle -->
<path class="text-surface-container-highest" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-width="3"></path>
<!-- Progress Circle (88%) -->
<path class="text-tertiary-container shadow-[0_0_10px_rgba(255,84,81,0.5)]" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-dasharray="88, 100" stroke-linecap="round" stroke-width="3"></path>
</svg>
<div class="absolute inset-0 flex items-center justify-center">
<span class="font-telemetry-num text-[12px] font-bold text-inverse-surface">88%</span>
</div>
</div>
<div>
<p class="font-body-md text-[14px] text-outline mb-1">Zone C nearing capacity.</p>
<span class="font-label-sm text-label-sm bg-tertiary-container/10 text-tertiary-container px-2 py-0.5 rounded border border-tertiary-container/20">Action Required</span>
</div>
</div>
</div>
</div>
<!-- Data Table Section -->
<div class="bg-surface border border-outline-variant/20 rounded-xl overflow-hidden shadow-lg shadow-black/40 flex flex-col">
<!-- Table Toolbar / Filters -->
<div class="p-4 border-b border-outline-variant/20 bg-surface-container-low/50 flex flex-wrap gap-4 items-center justify-between">
<div class="flex gap-3">
<div class="relative">
<select class="appearance-none bg-surface-dim border border-outline-variant/30 text-on-surface font-title-md text-[14px] rounded-lg pl-4 pr-10 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer">
<option value="">All Types</option>
<option value="dry">Dry</option>
<option value="reefer">Reefer</option>
<option value="open">Open Top</option>
</select>
<span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline-variant">expand_more</span>
</div>
<div class="relative">
<select class="appearance-none bg-surface-dim border border-outline-variant/30 text-on-surface font-title-md text-[14px] rounded-lg pl-4 pr-10 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer">
<option value="">All Sizes</option>
<option value="20">20ft</option>
<option value="40">40ft</option>
<option value="45">45ft HQ</option>
</select>
<span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline-variant">expand_more</span>
</div>
</div>
<div class="flex items-center gap-2">
<button class="p-2 rounded-lg border border-outline-variant/30 text-outline hover:text-primary hover:border-primary/50 transition-colors">
<span class="material-symbols-outlined text-[20px]">filter_list</span>
</button>
<button class="p-2 rounded-lg border border-outline-variant/30 text-outline hover:text-primary hover:border-primary/50 transition-colors">
<span class="material-symbols-outlined text-[20px]">download</span>
</button>
</div>
</div>
<!-- The Data Table -->
<div class="overflow-x-auto">
<table class="w-full text-left border-collapse">
<thead>
<tr class="bg-surface-container-high border-b border-outline-variant/20">
<th class="py-3 px-6 font-label-sm text-label-sm text-outline-variant uppercase tracking-wider">Container ID</th>
<th class="py-3 px-6 font-label-sm text-label-sm text-outline-variant uppercase tracking-wider">Type</th>
<th class="py-3 px-6 font-label-sm text-label-sm text-outline-variant uppercase tracking-wider">Size</th>
<th class="py-3 px-6 font-label-sm text-label-sm text-outline-variant uppercase tracking-wider">Cargo Type</th>
<th class="py-3 px-6 font-label-sm text-label-sm text-outline-variant uppercase tracking-wider text-right">Days in Terminal</th>
<th class="py-3 px-6 font-label-sm text-label-sm text-outline-variant uppercase tracking-wider text-center">Actions</th>
</tr>
</thead>
<tbody class="font-body-md text-[14px] text-on-surface-variant divide-y divide-outline-variant/10">
<!-- Row 1 (Dry) -->
<tr class="hover:bg-primary/5 transition-colors group cursor-pointer">
<td class="py-4 px-6 font-telemetry-num font-medium text-inverse-surface group-hover:text-primary transition-colors">NEXU-883920-1</td>
<td class="py-4 px-6">
<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-bright border border-outline-variant/20 text-on-surface">
<span class="w-1.5 h-1.5 rounded-full bg-outline"></span> Dry
                                </span>
</td>
<td class="py-4 px-6 font-telemetry-num text-outline">40ft</td>
<td class="py-4 px-6">Electronics</td>
<td class="py-4 px-6 text-right font-telemetry-num text-on-surface">04</td>
<td class="py-4 px-6 text-center">
<button class="text-outline-variant hover:text-primary transition-colors p-1">
<span class="material-symbols-outlined text-[18px]">more_vert</span>
</button>
</td>
</tr>
<!-- Row 2 (Reefer - Active) -->
<tr class="hover:bg-primary/5 transition-colors group cursor-pointer bg-secondary/5">
<td class="py-4 px-6 font-telemetry-num font-medium text-inverse-surface group-hover:text-primary transition-colors">COLD-441029-4</td>
<td class="py-4 px-6">
<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary/10 border border-secondary/30 text-secondary">
<span class="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse shadow-[0_0_5px_rgba(78,222,163,0.8)]"></span> Reefer
                                </span>
</td>
<td class="py-4 px-6 font-telemetry-num text-outline">40ft</td>
<td class="py-4 px-6">Pharmaceuticals</td>
<td class="py-4 px-6 text-right font-telemetry-num text-on-surface">02</td>
<td class="py-4 px-6 text-center">
<button class="text-outline-variant hover:text-primary transition-colors p-1">
<span class="material-symbols-outlined text-[18px]">more_vert</span>
</button>
</td>
</tr>
<!-- Row 3 (Dry - Warning) -->
<tr class="hover:bg-primary/5 transition-colors group cursor-pointer">
<td class="py-4 px-6 font-telemetry-num font-medium text-inverse-surface group-hover:text-primary transition-colors">MAER-119283-7</td>
<td class="py-4 px-6">
<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-bright border border-outline-variant/20 text-on-surface">
<span class="w-1.5 h-1.5 rounded-full bg-outline"></span> Dry
                                </span>
</td>
<td class="py-4 px-6 font-telemetry-num text-outline">20ft</td>
<td class="py-4 px-6">Textiles</td>
<td class="py-4 px-6 text-right font-telemetry-num text-tertiary-container font-bold">18</td>
<td class="py-4 px-6 text-center">
<button class="text-outline-variant hover:text-primary transition-colors p-1">
<span class="material-symbols-outlined text-[18px]">more_vert</span>
</button>
</td>
</tr>
<!-- Row 4 (Open Top) -->
<tr class="hover:bg-primary/5 transition-colors group cursor-pointer">
<td class="py-4 px-6 font-telemetry-num font-medium text-inverse-surface group-hover:text-primary transition-colors">HLCU-992314-2</td>
<td class="py-4 px-6">
<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 border border-primary/30 text-primary">
<span class="material-symbols-outlined text-[12px]">view_in_ar</span> Open Top
                                </span>
</td>
<td class="py-4 px-6 font-telemetry-num text-outline">40ft</td>
<td class="py-4 px-6">Industrial Machinery</td>
<td class="py-4 px-6 text-right font-telemetry-num text-on-surface">07</td>
<td class="py-4 px-6 text-center">
<button class="text-outline-variant hover:text-primary transition-colors p-1">
<span class="material-symbols-outlined text-[18px]">more_vert</span>
</button>
</td>
</tr>
<!-- Row 5 (Reefer - Critical) -->
<tr class="hover:bg-primary/5 transition-colors group cursor-pointer bg-error/5">
<td class="py-4 px-6 font-telemetry-num font-medium text-inverse-surface group-hover:text-primary transition-colors">COLD-882103-9</td>
<td class="py-4 px-6">
<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-error/10 border border-error/30 text-error">
<span class="material-symbols-outlined text-[12px] animate-ping">warning</span> Reefer
                                </span>
</td>
<td class="py-4 px-6 font-telemetry-num text-outline">20ft</td>
<td class="py-4 px-6">Perishables (Meat)</td>
<td class="py-4 px-6 text-right font-telemetry-num text-on-surface">01</td>
<td class="py-4 px-6 text-center">
<button class="text-outline-variant hover:text-primary transition-colors p-1">
<span class="material-symbols-outlined text-[18px]">more_vert</span>
</button>
</td>
</tr>
</tbody>
</table>
</div>
<!-- Table Footer / Pagination -->
<div class="p-4 border-t border-outline-variant/20 bg-surface-container-low/30 flex justify-between items-center">
<span class="font-label-sm text-label-sm text-outline-variant">Showing 1-5 of 14,285</span>
<div class="flex gap-1">
<button class="p-1 rounded bg-surface border border-outline-variant/30 text-outline-variant hover:text-primary hover:border-primary/50 disabled:opacity-50" disabled="">
<span class="material-symbols-outlined text-[20px]">chevron_left</span>
</button>
<button class="w-8 h-8 rounded bg-primary/20 border border-primary/50 text-primary font-telemetry-num text-[12px] flex items-center justify-center">1</button>
<button class="w-8 h-8 rounded bg-surface border border-outline-variant/30 text-outline-variant hover:text-primary hover:border-primary/50 font-telemetry-num text-[12px] flex items-center justify-center transition-colors">2</button>
<button class="w-8 h-8 rounded bg-surface border border-outline-variant/30 text-outline-variant hover:text-primary hover:border-primary/50 font-telemetry-num text-[12px] flex items-center justify-center transition-colors">3</button>
<span class="w-8 h-8 flex items-center justify-center text-outline-variant">...</span>
<button class="p-1 rounded bg-surface border border-outline-variant/30 text-outline-variant hover:text-primary hover:border-primary/50 transition-colors">
<span class="material-symbols-outlined text-[20px]">chevron_right</span>
</button>
</div>
</div>
</div>
</div>
`;
export const analyticsHtml = `<div id="view-analytics" class="spa-view hidden w-full h-full flex flex-col">
<div class="flex-1 overflow-auto p-margin-desktop">
<header class="mb-6 flex justify-between items-end">
<div>
<h2 class="font-headline-lg text-headline-lg text-on-surface mb-1">Terminal Analytics</h2>
<p class="font-label-sm text-label-sm text-on-surface-variant">Real-time performance metrics and historical trends</p>
</div>
<div class="flex gap-2">
<button class="bg-[#1e293b] border border-outline-variant/30 text-on-surface px-4 py-2 rounded-DEFAULT font-label-sm text-label-sm flex items-center gap-2 hover:border-primary transition-colors">
<span class="material-symbols-outlined text-[16px]">calendar_today</span>
                        Last 24 Hours
                    </button>
<button class="bg-inverse-primary text-on-primary px-4 py-2 rounded-DEFAULT font-label-sm text-label-sm font-semibold flex items-center gap-2 hover:bg-primary transition-colors glow-active">
<span class="material-symbols-outlined text-[16px]">download</span>
                        Export Data
                    </button>
</div>
</header>
<!-- Bento Grid Layout -->
<div class="grid grid-cols-1 md:grid-cols-12 gap-panel-gap">
<!-- KPI 1: Throughput -->
<div class="glass-panel rounded-lg p-5 col-span-1 md:col-span-4 relative overflow-hidden group">
<div class="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-primary/10"></div>
<div class="flex justify-between items-start mb-4">
<div class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Throughput (TEUs)</div>
<span class="material-symbols-outlined text-primary text-[20px]">view_in_ar</span>
</div>
<div class="font-display-lg text-display-lg text-on-surface mb-2">12,450</div>
<div class="flex items-center gap-2">
<span class="font-telemetry-num text-telemetry-num text-secondary bg-secondary/10 px-2 py-0.5 rounded-DEFAULT flex items-center gap-1">
<span class="material-symbols-outlined text-[14px]">trending_up</span> +8.4%
                        </span>
<span class="font-label-sm text-label-sm text-on-surface-variant">vs previous 24h</span>
</div>
</div>
<!-- KPI 2: Turnaround Time -->
<div class="glass-panel rounded-lg p-5 col-span-1 md:col-span-4 relative overflow-hidden group">
<div class="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-secondary/10"></div>
<div class="flex justify-between items-start mb-4">
<div class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Avg Turnaround Time</div>
<span class="material-symbols-outlined text-secondary text-[20px]">timer</span>
</div>
<div class="font-display-lg text-display-lg text-on-surface mb-2">42<span class="text-title-md text-on-surface-variant ml-1">min</span></div>
<div class="flex items-center gap-2">
<span class="font-telemetry-num text-telemetry-num text-secondary bg-secondary/10 px-2 py-0.5 rounded-DEFAULT flex items-center gap-1">
<span class="material-symbols-outlined text-[14px]">trending_down</span> -2.1%
                        </span>
<span class="font-label-sm text-label-sm text-on-surface-variant">vs target (45m)</span>
</div>
</div>
<!-- KPI 3: Yard Utilization -->
<div class="glass-panel rounded-lg p-5 col-span-1 md:col-span-4 relative overflow-hidden group">
<div class="absolute top-0 right-0 w-32 h-32 bg-tertiary-container/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-tertiary-container/10"></div>
<div class="flex justify-between items-start mb-4">
<div class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Yard Utilization</div>
<span class="material-symbols-outlined text-tertiary-container text-[20px]">layers</span>
</div>
<div class="font-display-lg text-display-lg text-on-surface mb-2">87<span class="text-title-md text-on-surface-variant ml-1">%</span></div>
<!-- Progress Bar -->
<div class="w-full h-2 bg-surface-container-highest rounded-full mt-3 overflow-hidden">
<div class="h-full bg-tertiary-container rounded-full w-[87%] relative">
<div class="absolute inset-0 bg-white/20 w-full h-full animate-pulse"></div>
</div>
</div>
<div class="flex justify-between mt-2">
<span class="font-label-sm text-label-sm text-on-surface-variant">Zone Alpha: 92%</span>
<span class="font-label-sm text-label-sm text-tertiary-container">Warning</span>
</div>
</div>
<!-- Main Chart: 24h Volume Trends -->
<div class="glass-panel rounded-lg p-5 col-span-1 md:col-span-8 flex flex-col min-h-[360px]">
<div class="flex justify-between items-center mb-4">
<h3 class="font-title-md text-title-md text-on-surface">Volume Trends (24h)</h3>
<div class="flex gap-4">
<div class="flex items-center gap-2">
<div class="w-3 h-3 rounded-sm bg-primary"></div>
<span class="font-label-sm text-label-sm text-on-surface-variant">Inbound</span>
</div>
<div class="flex items-center gap-2">
<div class="w-3 h-3 rounded-sm bg-secondary"></div>
<span class="font-label-sm text-label-sm text-on-surface-variant">Outbound</span>
</div>
</div>
</div>
<!-- Simulated Chart Area -->
<div class="flex-1 relative chart-grid mt-2 rounded-DEFAULT overflow-hidden border border-outline-variant/10">
<!-- Y-Axis Labels (Simulated) -->
<div class="absolute left-2 top-0 bottom-0 flex flex-col justify-between py-2 text-on-surface-variant font-telemetry-num text-[10px] z-10">
<span>1000</span>
<span>750</span>
<span>500</span>
<span>250</span>
<span>0</span>
</div>
<!-- X-Axis Labels (Simulated) -->
<div class="absolute left-10 right-0 bottom-1 flex justify-between px-4 text-on-surface-variant font-telemetry-num text-[10px] z-10">
<span>00:00</span>
<span>06:00</span>
<span>12:00</span>
<span>18:00</span>
<span>24:00</span>
</div>
<!-- Simulated Line Graphs using SVG -->
<svg class="absolute inset-0 w-full h-full pl-10 pb-6 pt-4 pr-4" preserveaspectratio="none" viewbox="0 0 1000 300">
<!-- Inbound Line (Primary Blue) -->
<path d="M0,250 C100,220 200,280 300,150 C400,50 500,100 600,180 C700,250 800,120 900,80 L1000,100" fill="none" stroke="#adc6ff" stroke-width="3" style="filter: drop-shadow(0 4px 6px rgba(173, 198, 255, 0.3));"></path>
<!-- Inbound Area Fill -->
<path d="M0,250 C100,220 200,280 300,150 C400,50 500,100 600,180 C700,250 800,120 900,80 L1000,100 L1000,300 L0,300 Z" fill="url(#grad-inbound)" opacity="0.2"></path>
<!-- Outbound Line (Secondary Green) -->
<path d="M0,280 C150,260 250,180 350,200 C450,220 550,150 650,90 C750,40 850,160 1000,140" fill="none" stroke="#4edea3" stroke-dasharray="6,4" stroke-width="2" style="filter: drop-shadow(0 2px 4px rgba(78, 222, 163, 0.2));"></path>
<defs>
<lineargradient id="grad-inbound" x1="0%" x2="0%" y1="0%" y2="100%">
<stop offset="0%" stop-color="#adc6ff" stop-opacity="1"></stop>
<stop offset="100%" stop-color="#adc6ff" stop-opacity="0"></stop>
</lineargradient>
</defs>
</svg>
<!-- Hover Tooltip Indicator (Simulated) -->
<div class="absolute left-[60%] top-0 bottom-6 w-px bg-white/30 border-r border-dashed border-white/20"></div>
<div class="absolute left-[60%] top-[40%] -translate-x-1/2 -translate-y-1/2 bg-surface-container-highest border border-outline-variant/50 rounded-DEFAULT p-2 shadow-lg z-20 pointer-events-none">
<div class="font-label-sm text-label-sm text-on-surface mb-1">14:30 HRS</div>
<div class="flex items-center justify-between gap-4 font-telemetry-num text-[12px]">
<span class="text-primary">IN: 842</span>
<span class="text-secondary">OUT: 615</span>
</div>
</div>
</div>
</div>
<!-- Heat Map: High Traffic Zones -->
<div class="glass-panel rounded-lg p-5 col-span-1 md:col-span-4 flex flex-col min-h-[360px]">
<div class="flex justify-between items-center mb-4">
<h3 class="font-title-md text-title-md text-on-surface">Traffic Density</h3>
<span class="material-symbols-outlined text-on-surface-variant text-[20px]">map</span>
</div>
<div class="flex-1 relative rounded-DEFAULT border border-outline-variant/30 overflow-hidden bg-surface-container-lowest">
<!-- Simulated Terminal Map Image overlay -->
<div class="absolute inset-0 opacity-30" data-alt="Schematic blueprint map of a modern shipping terminal port, top-down view, dark theme with faint grid lines, industrial technical aesthetic, high-contrast structural outlines." style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuCEHoAC_LbKjul-1lHLRVpKOR8Fb6K_jJLmqzmEB5D3hC-DqdzPP4OsTnD-FegQ0tSHcDbMYBpJGHFiUymg15vnZvq9x6UFfdf2wcAacOSUmFHpIqhwrg2UaBrMOu3Be8c41nweFvaf8sycY9jnUwyRrTeZGpuancoOF3GOzbD_jo7UTLNlDOQHFyBYyVf9-NU-vWRYnBXYqqld7DCI1d4ZjclebtMduJFECoIpQsO5X6deVe19grfbuMTHApcPGwrl4Llws8ri9Ls'); background-size: cover; background-position: center;"></div>
<!-- Heat map grid overlay -->
<div class="absolute inset-0 grid grid-cols-4 grid-rows-4 gap-1 p-2">
<!-- High density zones -->
<div class="rounded-sm bg-tertiary-container/60 blur-[4px] slot-occupied-critical col-start-2 row-start-2"></div>
<div class="rounded-sm bg-tertiary-container/40 blur-[4px] col-start-3 row-start-2"></div>
<div class="rounded-sm bg-primary/40 blur-[4px] col-start-2 row-start-3"></div>
<!-- Medium density -->
<div class="rounded-sm bg-secondary/30 blur-[4px] col-start-4 row-start-1"></div>
<div class="rounded-sm bg-secondary/20 blur-[4px] col-start-3 row-start-4"></div>
<!-- Low density (empty dashed slots) -->
<div class="rounded-sm border border-dashed border-outline-variant/30 col-start-1 row-start-1"></div>
<div class="rounded-sm border border-dashed border-outline-variant/30 col-start-1 row-start-4"></div>
</div>
<!-- Legend -->
<div class="absolute bottom-2 right-2 bg-surface-container-highest/90 backdrop-blur-sm border border-outline-variant/30 rounded-DEFAULT p-1.5 flex flex-col gap-1 z-10">
<div class="flex items-center gap-1.5">
<div class="w-2 h-2 rounded-full bg-tertiary-container"></div>
<span class="font-label-sm text-[9px] text-on-surface-variant">Congested</span>
</div>
<div class="flex items-center gap-1.5">
<div class="w-2 h-2 rounded-full bg-primary"></div>
<span class="font-label-sm text-[9px] text-on-surface-variant">Active</span>
</div>
<div class="flex items-center gap-1.5">
<div class="w-2 h-2 rounded-full bg-secondary"></div>
<span class="font-label-sm text-[9px] text-on-surface-variant">Optimal</span>
</div>
</div>
</div>
</div>
<!-- Recent Alerts Table -->
<div class="glass-panel rounded-lg p-0 col-span-1 md:col-span-12 overflow-hidden mt-2">
<div class="p-5 border-b border-outline-variant/20 flex justify-between items-center">
<h3 class="font-title-md text-title-md text-on-surface">Live Telemetry Alerts</h3>
<a class="font-label-sm text-label-sm text-primary hover:underline" href="#">View All Logs</a>
</div>
<div class="overflow-x-auto">
<table class="w-full text-left border-collapse">
<thead>
<tr class="bg-surface-container/50 border-b border-outline-variant/30">
<th class="py-3 px-5 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-medium">Timestamp</th>
<th class="py-3 px-5 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-medium">Zone</th>
<th class="py-3 px-5 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-medium">Event Code</th>
<th class="py-3 px-5 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-medium">Status</th>
</tr>
</thead>
<tbody class="font-telemetry-num text-telemetry-num text-on-surface">
<tr class="data-table-row transition-colors cursor-default">
<td class="py-3 px-5 text-on-surface-variant">14:42:05 Z</td>
<td class="py-3 px-5">Yard Alpha-04</td>
<td class="py-3 px-5">Capacity Warning (92%)</td>
<td class="py-3 px-5">
<span class="inline-flex items-center px-2 py-0.5 rounded-DEFAULT text-[11px] font-label-sm text-tertiary-container bg-tertiary-container/10 border border-tertiary-container/30">
                                            CRITICAL
                                        </span>
</td>
</tr>
<tr class="data-table-row transition-colors cursor-default">
<td class="py-3 px-5 text-on-surface-variant">14:38:12 Z</td>
<td class="py-3 px-5">Gate 3 (Inbound)</td>
<td class="py-3 px-5">Throughput Spike Detected</td>
<td class="py-3 px-5">
<span class="inline-flex items-center px-2 py-0.5 rounded-DEFAULT text-[11px] font-label-sm text-primary bg-primary/10 border border-primary/30">
                                            NOTICE
                                        </span>
</td>
</tr>
<tr class="data-table-row transition-colors cursor-default">
<td class="py-3 px-5 text-on-surface-variant">14:15:00 Z</td>
<td class="py-3 px-5">Crane System B</td>
<td class="py-3 px-5">Maintenance Cycle Complete</td>
<td class="py-3 px-5">
<span class="inline-flex items-center px-2 py-0.5 rounded-DEFAULT text-[11px] font-label-sm text-secondary bg-secondary/10 border border-secondary/30">
                                            RESOLVED
                                        </span>
</td>
</tr>
</tbody>
</table>
</div>
</div>
</div>
</div>
</div>
`;
export const logisticsHtml = `<div id="view-logistics" class="spa-view hidden w-full h-full flex flex-col">
    <div class="p-6">
        <header class="mb-6 flex justify-between items-end">
            <div>
                <h2 class="text-3xl font-bold text-on-surface mb-1">Fleet Management</h2>
                <p class="text-sm text-on-surface-variant">Live tracking of AGVs, Trucks, and Rail connections.</p>
            </div>
            <div class="flex gap-2">
                <button class="bg-primary-container text-on-primary-container px-4 py-2 rounded font-semibold text-sm flex items-center gap-2 hover:bg-primary transition-colors glow-active">
                    <span class="material-symbols-outlined text-[18px]">add_road</span>
                    Dispatch Vehicle
                </button>
            </div>
        </header>

        <!-- KPI Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div class="glass-panel rounded-xl p-5 border border-outline-variant/30 relative overflow-hidden group">
                <div class="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-xl group-hover:bg-primary/20 transition"></div>
                <div class="text-xs text-on-surface-variant uppercase tracking-wider mb-2">Active AGVs</div>
                <div class="text-4xl font-bold text-on-surface mb-1">42<span class="text-sm text-outline ml-1">/ 50</span></div>
                <div class="text-xs text-secondary flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">check_circle</span> Optimal Status</div>
            </div>
            <div class="glass-panel rounded-xl p-5 border border-outline-variant/30 relative overflow-hidden group">
                <div class="absolute -right-4 -top-4 w-24 h-24 bg-secondary/10 rounded-full blur-xl group-hover:bg-secondary/20 transition"></div>
                <div class="text-xs text-on-surface-variant uppercase tracking-wider mb-2">External Trucks</div>
                <div class="text-4xl font-bold text-on-surface mb-1">118</div>
                <div class="text-xs text-secondary flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">trending_up</span> +12 from yesterday</div>
            </div>
            <div class="glass-panel rounded-xl p-5 border border-outline-variant/30 relative overflow-hidden group">
                <div class="absolute -right-4 -top-4 w-24 h-24 bg-tertiary-container/10 rounded-full blur-xl group-hover:bg-tertiary-container/20 transition"></div>
                <div class="text-xs text-on-surface-variant uppercase tracking-wider mb-2">Avg Gate Wait</div>
                <div class="text-4xl font-bold text-on-surface mb-1">14<span class="text-sm text-outline ml-1">min</span></div>
                <div class="text-xs text-tertiary-container flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">warning</span> Minor delays at Gate B</div>
            </div>
            <div class="glass-panel rounded-xl p-5 border border-outline-variant/30 relative overflow-hidden group">
                <div class="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-xl group-hover:bg-primary/20 transition"></div>
                <div class="text-xs text-on-surface-variant uppercase tracking-wider mb-2">Rail Cars Ready</div>
                <div class="text-4xl font-bold text-on-surface mb-1">24</div>
                <div class="text-xs text-on-surface-variant flex items-center gap-1">Departure in 2h 15m</div>
            </div>
        </div>

        <!-- Main Map & Live Feed Area -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
            
            <!-- Live Radar Map -->
            <div class="lg:col-span-2 glass-panel rounded-xl border border-outline-variant/30 overflow-hidden relative map-bg">
                <div class="absolute top-4 left-4 z-10 flex items-center gap-2 bg-surface/80 px-3 py-1.5 rounded-lg border border-outline-variant/20 backdrop-blur-md">
                    <span class="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                    <span class="text-xs font-semibold text-secondary tracking-wider">LIVE RADAR</span>
                </div>
                
                <!-- Simulated Vehicles -->
                <div class="absolute top-[30%] left-[40%] vehicle-dot w-3 h-3 bg-secondary rounded-full shadow-[0_0_10px_#4edea3]">
                    <div class="absolute -top-6 -left-8 bg-surface border border-outline-variant/50 text-[10px] px-2 py-1 rounded text-on-surface">AGV-12</div>
                </div>
                <div class="absolute top-[60%] left-[20%] vehicle-dot w-3 h-3 bg-primary rounded-full shadow-[0_0_10px_#adc6ff]">
                    <div class="absolute -top-6 -left-8 bg-surface border border-outline-variant/50 text-[10px] px-2 py-1 rounded text-on-surface">TRK-84</div>
                </div>
                <div class="absolute top-[45%] left-[70%] vehicle-dot w-3 h-3 bg-secondary rounded-full shadow-[0_0_10px_#4edea3]">
                    <div class="absolute -top-6 -left-8 bg-surface border border-outline-variant/50 text-[10px] px-2 py-1 rounded text-on-surface">AGV-33</div>
                </div>
                <div class="absolute top-[80%] left-[50%] vehicle-dot w-3 h-3 bg-tertiary-container rounded-full shadow-[0_0_10px_#ff5451]">
                    <div class="absolute -top-6 -left-8 bg-surface border border-outline-variant/50 text-[10px] px-2 py-1 rounded text-on-surface text-tertiary-container">TRK-91 (IDLE)</div>
                </div>
                
                <!-- Simulated Routes (SVG) -->
                <svg class="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M 20% 60% C 30% 50%, 35% 35%, 40% 30%" fill="none" stroke="#adc6ff" stroke-width="2" stroke-dasharray="4 4" opacity="0.5"/>
                    <path d="M 70% 45% C 60% 45%, 50% 50%, 50% 80%" fill="none" stroke="#4edea3" stroke-width="2" stroke-dasharray="4 4" opacity="0.5"/>
                </svg>
            </div>

            <!-- Active Dispatch List -->
            <div class="glass-panel rounded-xl border border-outline-variant/30 flex flex-col overflow-hidden">
                <div class="p-4 border-b border-outline-variant/20 bg-surface-container-high/50 flex justify-between items-center">
                    <h3 class="text-sm font-semibold text-on-surface">Active Dispatches</h3>
                    <span class="material-symbols-outlined text-[18px] text-outline">sort</span>
                </div>
                <div class="flex-1 overflow-y-auto p-2 space-y-2">
                    
                    <div class="p-3 bg-surface/50 border border-outline-variant/20 rounded-lg hover:border-primary/50 transition cursor-pointer">
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-xs font-bold text-primary">TRK-8492</span>
                            <span class="text-[10px] px-1.5 py-0.5 rounded bg-secondary/10 text-secondary border border-secondary/20">IN TRANSIT</span>
                        </div>
                        <div class="text-xs text-on-surface-variant flex items-center gap-1 mb-1">
                            <span class="material-symbols-outlined text-[12px]">route</span> Gate A → Zone 4
                        </div>
                        <div class="w-full bg-surface-container h-1 rounded-full overflow-hidden mt-2">
                            <div class="bg-secondary h-full w-[60%]"></div>
                        </div>
                    </div>

                    <div class="p-3 bg-surface/50 border border-outline-variant/20 rounded-lg hover:border-primary/50 transition cursor-pointer">
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-xs font-bold text-primary">AGV-Unit-12</span>
                            <span class="text-[10px] px-1.5 py-0.5 rounded bg-secondary/10 text-secondary border border-secondary/20">IN TRANSIT</span>
                        </div>
                        <div class="text-xs text-on-surface-variant flex items-center gap-1 mb-1">
                            <span class="material-symbols-outlined text-[12px]">route</span> Yard B → Ship-to-Shore Crane 2
                        </div>
                        <div class="w-full bg-surface-container h-1 rounded-full overflow-hidden mt-2">
                            <div class="bg-secondary h-full w-[85%]"></div>
                        </div>
                    </div>

                    <div class="p-3 bg-surface/50 border border-outline-variant/20 rounded-lg hover:border-primary/50 transition cursor-pointer border-l-2 border-l-tertiary-container">
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-xs font-bold text-tertiary-container">TRK-1102</span>
                            <span class="text-[10px] px-1.5 py-0.5 rounded bg-tertiary-container/10 text-tertiary-container border border-tertiary-container/20">DELAYED</span>
                        </div>
                        <div class="text-xs text-on-surface-variant flex items-center gap-1 mb-1">
                            <span class="material-symbols-outlined text-[12px]">route</span> Waiting at Checkpoint
                        </div>
                        <div class="w-full bg-surface-container h-1 rounded-full overflow-hidden mt-2">
                            <div class="bg-tertiary-container h-full w-[10%]"></div>
                        </div>
                    </div>

                </div>
            </div>
        </div>

    </div>
</div>
<div id="view-digitizer" class="spa-view hidden w-full h-full flex flex-col">
    <!-- BẢN ĐỒ REACT MỚI -->
    <iframe src="http://localhost:5173" class="w-full h-full border-0" style="width: 100%; height: 100%; min-height: 100vh;"></iframe>
    <!-- CODE CŨ (TẠM ẨN BẰNG TEMPLATE ĐỂ NGĂN SCRIPT CHẠY) -->
    <template id="old-digitizer">

    <div class="h-full w-full flex overflow-hidden">
        <!-- Left Sidebar: Controls -->
        <div class="w-80 bg-[#131b2e] border-r border-[#2d3449] p-4 flex flex-col gap-4 overflow-y-auto shrink-0 z-10 shadow-lg">
            <div>
                <h1 class="text-xl font-bold text-white tracking-wide">MAP DIGITIZER</h1>
                <p class="text-[10px] text-[#8c909f] uppercase tracking-widest mt-1">Nexus Terminal Subsystem</p>
            </div>
            
            <!-- PHASE 1: UPLOAD & WARP -->
            <div class="p-3 bg-[#171f33] rounded-lg border border-[#2d3449]">
                <h2 class="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                    <span class="bg-[#adc6ff] text-[#002e6a] w-5 h-5 flex items-center justify-center rounded-full text-xs">1</span> 
                    Upload & Warp
                </h2>
                <input type="file" id="upload-img" accept="image/jpeg, image/png" class="w-full text-xs mb-3 text-[#c2c6d6] file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#adc6ff] file:text-[#002e6a] hover:file:bg-[#d8e2ff]" />
                <div class="flex gap-2">
                    <button id="btn-pin" class="flex-1 bg-[#222a3d] border border-[#424754] text-[#dae2fd] py-1.5 rounded text-xs hover:bg-[#31394d] hover:border-[#8c909f] transition-colors" title="Click 4 corners of the yard">📍 Pin Corners</button>
                    <button id="btn-flatten" class="flex-1 bg-[#00a572]/20 border border-[#4edea3] text-[#4edea3] py-1.5 rounded text-xs hover:bg-[#00a572]/40 transition-colors">📐 Flatten</button>
                </div>
                <div id="pin-status" class="text-[10px] text-[#8c909f] mt-2 text-center">0/4 Pins Set</div>
            </div>

            <!-- PHASE 2: CALIBRATION -->
            <div class="p-3 bg-[#171f33] rounded-lg border border-[#2d3449]">
                <h2 class="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                    <span class="bg-[#adc6ff] text-[#002e6a] w-5 h-5 flex items-center justify-center rounded-full text-xs">2</span> 
                    Hybrid Scale Calibration
                </h2>
                <div class="flex gap-2 mb-2">
                    <button id="btn-ruler" class="flex-1 bg-[#222a3d] border border-[#424754] text-[#dae2fd] py-1.5 rounded text-xs hover:bg-[#31394d] transition-colors" title="Vẽ tay đường đo">📏 Manual</button>
                    <button id="btn-cv-crop" class="flex-1 bg-blue-900/40 border border-blue-500 text-blue-300 py-1.5 rounded text-xs hover:bg-blue-600 hover:text-white transition-colors flex items-center justify-center gap-1" title="Khoanh vùng OpenCV">🔍 CV Crop</button>
                </div>
                
                <!-- Measurements List -->
                <div id="measurements-list" class="flex flex-col gap-1 mb-2 max-h-32 overflow-y-auto pr-1">
                    <!-- JS generated items -->
                </div>
                
                <div class="bg-[#0b1326] p-2 rounded border border-[#2d3449] font-mono text-[11px] flex justify-between items-center mt-2">
                    <div class="text-[#8c909f]">Global Scale:</div>
                    <div id="ratio-display" class="text-[#4edea3] font-bold">Not calibrated</div>
                </div>
            </div>

            <!-- PHASE 3 & 4: ZONING & AUTO-GRID -->
            <div class="p-3 bg-[#171f33] rounded-lg border border-[#2d3449]">
                <h2 class="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                    <span class="bg-[#adc6ff] text-[#002e6a] w-5 h-5 flex items-center justify-center rounded-full text-xs">3 & 4</span> 
                    Zoning & Auto-Grid
                </h2>
                <label class="text-[10px] text-[#8c909f] uppercase mb-1 block">Zone Type</label>
                <select id="zone-type" class="w-full bg-[#0b1326] border border-[#424754] rounded p-1.5 mb-3 text-xs text-white outline-none focus:border-[#adc6ff]">
                    <option value="Storage">Storage (Auto-Grid)</option>
                    <option value="Road">Road</option>
                    <option value="Building">Building / Obstacle</option>
                </select>
                <div class="flex gap-2 mb-2">
                    <button id="btn-pan" class="flex-1 bg-[#222a3d] border border-[#424754] text-[#dae2fd] py-1.5 rounded text-xs hover:bg-[#31394d] transition-colors" title="Di chuyển bản đồ bằng chuột trái">🤚 Pan Map</button>
                    <button id="btn-draw-zone" class="flex-1 bg-[#4d8eff]/20 border border-[#adc6ff] text-[#adc6ff] py-1.5 rounded text-xs hover:bg-[#4d8eff]/40 font-semibold transition-colors">✏️ Draw Zone</button>
                </div>
                <label class="flex items-center gap-2 text-xs text-[#dae2fd] mb-3 cursor-pointer">
                    <input type="checkbox" id="chk-rotate-grid" class="accent-[#4d8eff]">
                    🔄 Rotate Grid 90° (Dọc/Ngang)
                </label>
                
                <button id="btn-ai-detect" class="w-full bg-purple-900/40 border border-purple-500 text-purple-300 py-1.5 rounded text-xs hover:bg-purple-600 hover:text-white transition-colors mb-3 flex items-center justify-center gap-2">
                    <span class="material-symbols-outlined text-[14px]">smart_toy</span>
                    AI Auto-Detect (Free Endpoint)
                </button>
                
                <div class="flex gap-2">
                    <button id="btn-undo" class="flex-1 bg-[#222a3d] border border-[#424754] text-white py-1 rounded text-xs hover:bg-[#31394d]">Undo</button>
                    <button id="btn-clear" class="flex-1 bg-[#93000a]/30 border border-[#ffb4ab] text-[#ffdad6] py-1 rounded text-xs hover:bg-[#93000a]/60">Clear All</button>
                </div>
            </div>

            <!-- PHASE 5: EXPORT -->
            <div class="p-3 bg-[#171f33] rounded-lg border border-[#2d3449] mt-auto">
                <h2 class="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                    <span class="bg-[#adc6ff] text-[#002e6a] w-5 h-5 flex items-center justify-center rounded-full text-xs">5</span> 
                    Export JSON
                </h2>
                <button id="btn-export" class="w-full bg-[#adc6ff] text-[#002e6a] py-2 rounded font-bold hover:bg-[#d8e2ff] transition-colors mb-2 text-sm shadow-[0_0_10px_rgba(173,198,255,0.3)]">Export to Database</button>
                <textarea id="export-output" class="w-full h-32 bg-[#060e20] text-[#6ffbbe] font-mono text-[10px] p-2 rounded border border-[#2d3449] outline-none" readonly placeholder="// JSON Output..."></textarea>
            </div>
        </div>

        <!-- Right Workspace: Canvas -->
        <div class="flex-1 relative bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdHRlcm4gaWQ9InNtYWxsR3JpZCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNMTAgMEwwIDBMMCAxMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMWMyNDNjIiBzdHJva2Utd2lkdGg9IjAuNSIvPjwvcGF0dGVybj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9InVybCgjc21hbGxHcmlkKSIvPjxwYXRoIGQ9Ik00MCAwTDAgMEwwIDQwIiBmaWxsPSJub25lIiBzdHJva2U9IiMxYzI0M2MiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] flex items-center justify-center overflow-hidden p-0" id="canvas-container">
            <canvas id="main-canvas" class="rounded-lg border border-[#2d3449]" style="cursor: crosshair; touch-action: none; background-color: #060e20; box-shadow: 0 4px 20px rgba(59, 130, 246, 0.15);"></canvas>
        </div>
    </div>

    <!-- Application Logic -->
    <script>
    (function() {
        const canvas = document.getElementById('main-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const container = document.getElementById('canvas-container');
        
        let imgObj = null;
        let bgImgData = null; 
        let mode = 'idle'; 
        let pins = []; 
        let rulerLine = []; 
        let pixelToMeterRatio = null; 
        let measurements = [];
        let mapZones = [];
        let yardGrid = [];
        let currentRect = null; 
        let isDragging = false;
        
        // Pan and Zoom states
        let scale = 1;
        let offsetX = 0;
        let offsetY = 0;
        let isPanning = false;
        let startPan = {x:0, y:0};
        
        const SLOT_WIDTH_M = 3;
        const SLOT_HEIGHT_M = 13;

        const fileInput = document.getElementById('upload-img');
        const pinBtn = document.getElementById('btn-pin');
        const flattenBtn = document.getElementById('btn-flatten');
        const pinStatus = document.getElementById('pin-status');
        const rulerBtn = document.getElementById('btn-ruler');
        const ratioDisplay = document.getElementById('ratio-display');
        const drawZoneBtn = document.getElementById('btn-draw-zone');
        const panBtn = document.getElementById('btn-pan');
        const zoneTypeSel = document.getElementById('zone-type');
        const undoBtn = document.getElementById('btn-undo');
        const clearBtn = document.getElementById('btn-clear');
        const aiDetectBtn = document.getElementById('btn-ai-detect');
        const exportBtn = document.getElementById('btn-export');
        const exportOut = document.getElementById('export-output');

        let animationFrameId = null;
        
        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
                    canvas.width = entry.contentRect.width;
                    canvas.height = entry.contentRect.height;
                }
            }
        });
        if (container) resizeObserver.observe(container);

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            ctx.save();
            ctx.translate(offsetX, offsetY);
            ctx.scale(scale, scale);
            
            if (bgImgData) ctx.drawImage(bgImgData, 0, 0);
            else if (imgObj) ctx.drawImage(imgObj, 0, 0);

            if (pins.length > 0) {
                ctx.strokeStyle = '#ffb4ab';
                ctx.lineWidth = 2 / scale;
                ctx.beginPath();
                ctx.moveTo(pins[0].x, pins[0].y);
                for(let i=1; i<pins.length; i++) ctx.lineTo(pins[i].x, pins[i].y);
                if(pins.length === 4) ctx.closePath();
                ctx.stroke();

                pins.forEach((p, i) => {
                    ctx.fillStyle = '#ff5451';
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 5 / scale, 0, Math.PI*2);
                    ctx.fill();
                    ctx.fillStyle = 'white';
                    ctx.font = \`\${12/scale}px Inter\`;
                    ctx.fillText(i+1, p.x + 8/scale, p.y - 8/scale);
                });
            }

            if (rulerLine.length > 0) {
                ctx.strokeStyle = '#ff5451';
                ctx.lineWidth = 3 / scale;
                ctx.beginPath();
                ctx.moveTo(rulerLine[0].x, rulerLine[0].y);
                if(rulerLine[1]) ctx.lineTo(rulerLine[1].x, rulerLine[1].y);
                ctx.stroke();
                
                rulerLine.forEach(p => {
                    ctx.fillStyle = 'white';
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 4 / scale, 0, Math.PI*2);
                    ctx.fill();
                });
            }

            measurements.forEach(m => {
                ctx.strokeStyle = m.source === 'AI' ? '#a855f7' : '#ff5451';
                ctx.lineWidth = 3 / scale;
                ctx.beginPath();
                ctx.moveTo(m.p1.x, m.p1.y);
                ctx.lineTo(m.p2.x, m.p2.y);
                ctx.stroke();
                
                ctx.fillStyle = 'white';
                ctx.font = \`\${12/scale}px Inter\`;
                ctx.fillText(\`\${m.m}m\`, (m.p1.x + m.p2.x)/2, (m.p1.y + m.p2.y)/2 - 5/scale);
            });

            mapZones.forEach(z => drawZone(z));

            yardGrid.forEach(slot => {
                ctx.strokeStyle = 'rgba(78, 222, 163, 0.4)'; 
                ctx.lineWidth = 1 / scale;
                ctx.strokeRect(slot.x, slot.y, slot.w, slot.h);
            });

            if (currentRect && mode === 'zone') {
                const tempZone = { ...currentRect, type: zoneTypeSel.value };
                drawZone(tempZone);
            }
            
            if (isDragging && mode === 'cv-crop' && currentRect) {
                ctx.strokeStyle = '#3b82f6';
                ctx.fillStyle = 'rgba(59, 130, 246, 0.3)'; // Semi-transparent blue layer
                ctx.lineWidth = 2 / scale;
                ctx.setLineDash([5/scale, 5/scale]);
                ctx.fillRect(currentRect.startX, currentRect.startY, currentRect.width, currentRect.height);
                ctx.strokeRect(currentRect.startX, currentRect.startY, currentRect.width, currentRect.height);
                ctx.setLineDash([]);
            }

            ctx.restore();
            animationFrameId = requestAnimationFrame(draw);
        }

        function drawZone(z) {
            ctx.lineWidth = 2 / scale;
            if (z.type === 'Storage') {
                ctx.strokeStyle = '#4d8eff';
                ctx.fillStyle = 'rgba(77, 142, 255, 0.1)';
            } else if (z.type === 'Road') {
                ctx.strokeStyle = '#8c909f';
                ctx.fillStyle = 'rgba(140, 144, 159, 0.3)';
            } else if (z.type === 'Building') {
                ctx.strokeStyle = '#000000';
                ctx.fillStyle = 'rgba(0,0,0,0.6)';
            }
            
            ctx.fillRect(z.startX, z.startY, z.width, z.height);
            ctx.strokeRect(z.startX, z.startY, z.width, z.height);
            
            if (pixelToMeterRatio) {
                const wm = Math.abs(z.width / pixelToMeterRatio).toFixed(1);
                const hm = Math.abs(z.height / pixelToMeterRatio).toFixed(1);
                ctx.fillStyle = 'white';
                ctx.font = \`\${10/scale}px JetBrains Mono, monospace\`;
                ctx.fillText(\`\${wm}m x \${hm}m\`, z.startX + 5/scale, z.startY + 15/scale);
            }
        }
        
        function getMousePos(e) {
            const rect = canvas.getBoundingClientRect();
            const cssScaleX = canvas.width / rect.width;
            const cssScaleY = canvas.height / rect.height;
            const x = (e.clientX - rect.left) * cssScaleX;
            const y = (e.clientY - rect.top) * cssScaleY;
            return {
                x: (x - offsetX) / scale,
                y: (y - offsetY) / scale
            };
        }
        
        // PAN & ZOOM EVENTS
        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const cssScaleX = canvas.width / rect.width;
            const cssScaleY = canvas.height / rect.height;
            const mouseX = (e.clientX - rect.left) * cssScaleX;
            const mouseY = (e.clientY - rect.top) * cssScaleY;
            
            const zoomIntensity = 0.1;
            const wheel = e.deltaY < 0 ? 1 : -1;
            const zoomFactor = Math.exp(wheel * zoomIntensity);
            
            offsetX = mouseX - (mouseX - offsetX) * zoomFactor;
            offsetY = mouseY - (mouseY - offsetY) * zoomFactor;
            scale *= zoomFactor;
        }, { passive: false });

        let draggingPinIndex = -1;
        canvas.addEventListener('mousedown', (e) => {
            if (e.button === 1 || mode === 'idle' || e.altKey) {
                isPanning = true;
                const rect = canvas.getBoundingClientRect();
                const cssScaleX = canvas.width / rect.width;
                const cssScaleY = canvas.height / rect.height;
                const x = (e.clientX - rect.left) * cssScaleX;
                const y = (e.clientY - rect.top) * cssScaleY;
                startPan = { x: x - offsetX, y: y - offsetY };
                canvas.style.cursor = 'grabbing';
                return;
            }
            
            const pos = getMousePos(e);
            if (mode === 'pin') {
                let clickedExisting = false;
                for (let i = 0; i < pins.length; i++) {
                    const dx = pins[i].x - pos.x;
                    const dy = pins[i].y - pos.y;
                    if (dx*dx + dy*dy <= (15 / scale) * (15 / scale)) {
                        draggingPinIndex = i;
                        clickedExisting = true;
                        canvas.style.cursor = 'move';
                        break;
                    }
                }
                
                if (!clickedExisting && pins.length < 4) {
                    pins.push(pos);
                    pinStatus.textContent = \`\${pins.length}/4 Pins Set\`;
                }
            } else if (mode === 'ruler') {
                if (rulerLine.length === 0) rulerLine.push(pos);
                else {
                    rulerLine[1] = pos;
                    processRuler();
                }
            
            } else if (mode === 'cv-crop') {
                isDragging = true;
                currentRect = { startX: pos.x, startY: pos.y, width: 0, height: 0 };
            } else if (mode === 'zone') {
                isDragging = true;
                currentRect = { startX: pos.x, startY: pos.y, width: 0, height: 0 };
            }
        });

        canvas.addEventListener('mousemove', (e) => {
            if (isPanning) {
                const rect = canvas.getBoundingClientRect();
                const cssScaleX = canvas.width / rect.width;
                const cssScaleY = canvas.height / rect.height;
                const x = (e.clientX - rect.left) * cssScaleX;
                const y = (e.clientY - rect.top) * cssScaleY;
                offsetX = x - startPan.x;
                offsetY = y - startPan.y;
                return;
            }
            
            if (draggingPinIndex !== -1 && mode === 'pin') {
                pins[draggingPinIndex] = getMousePos(e);
                return;
            }
            
            if (mode === 'pin') {
                const pos = getMousePos(e);
                let hoverPin = false;
                for (let i = 0; i < pins.length; i++) {
                    const dx = pins[i].x - pos.x;
                    const dy = pins[i].y - pos.y;
                    if (dx*dx + dy*dy <= (15 / scale) * (15 / scale)) {
                        hoverPin = true;
                        break;
                    }
                }
                canvas.style.cursor = hoverPin ? 'grab' : 'crosshair';
            }
            
            
            if (isDragging && mode === 'cv-crop') {
                const pos = getMousePos(e);
                currentRect.width = pos.x - currentRect.startX;
                currentRect.height = pos.y - currentRect.startY;
            }
            

            if (isDragging && mode === 'zone') {
                const pos = getMousePos(e);
                currentRect.width = pos.x - currentRect.startX;
                currentRect.height = pos.y - currentRect.startY;
            } else if (mode === 'ruler' && rulerLine.length > 0) {
                rulerLine[1] = getMousePos(e); 
            }
        });

        canvas.addEventListener('mouseup', (e) => {
            if (isPanning) {
                isPanning = false;
                canvas.style.cursor = mode === 'idle' ? 'grab' : 'crosshair';
                return;
            }
            if (draggingPinIndex !== -1) {
                draggingPinIndex = -1;
                canvas.style.cursor = 'crosshair';
                return;
            }
            if (isDragging && mode === 'cv-crop') {
                isDragging = false;
                if (Math.abs(currentRect.width) > 20 / scale && Math.abs(currentRect.height) > 20 / scale) {
                    const x = currentRect.width < 0 ? currentRect.startX + currentRect.width : currentRect.startX;
                    const y = currentRect.height < 0 ? currentRect.startY + currentRect.height : currentRect.startY;
                    const w = Math.abs(currentRect.width);
                    const h = Math.abs(currentRect.height);
                    
                    const temp = document.createElement('canvas');
                    temp.width = w; temp.height = h;
                    const tctx = temp.getContext('2d');
                    
                    const sourceImg = bgImgData ? bgImgData : imgObj;
                    if(sourceImg) {
                        tctx.drawImage(sourceImg, x, y, w, h, 0, 0, w, h);
                        const imgData = tctx.getImageData(0, 0, w, h);
                        const mId = Date.now();
                        pendingCVMesures[mId] = { p1: {x,y}, p2: {x:x+w, y:y+h} };
                        
                        btnCvCrop.innerHTML = '<span class="material-symbols-outlined text-[14px] animate-spin">refresh</span> Processing...';
                        btnCvCrop.disabled = true;
                        
                        cvWorker.postMessage({ type: 'PROCESS', imageData: imgData, id: mId });
                    }
                }
                currentRect = null;
                mode = 'idle';
            }
            if (isDragging && mode === 'zone') {
                isDragging = false;
                if (Math.abs(currentRect.width) > 10 / scale && Math.abs(currentRect.height) > 10 / scale) saveZone();
                currentRect = null;
            }
        });
        
        canvas.addEventListener('dblclick', (e) => {
            if (mode !== 'zone' && mode !== 'idle') return;
            const pos = getMousePos(e);
            
            for (let i = mapZones.length - 1; i >= 0; i--) {
                const z = mapZones[i];
                if (z.type === 'Storage') {
                    const x = z.startX;
                    const y = z.startY;
                    const w = z.width;
                    const h = z.height;
                    
                    const minX = w < 0 ? x + w : x;
                    const minY = h < 0 ? y + h : y;
                    const maxX = w < 0 ? x : x + w;
                    const maxY = h < 0 ? y : y + h;
                    
                    if (pos.x >= minX && pos.x <= maxX && pos.y >= minY && pos.y <= maxY) {
                        const input = prompt("Override Grid for this zone.\\nEnter number of Rows and Cols separated by comma (e.g., 5,10):", "5,10");
                        if (input) {
                            const parts = input.split(',');
                            if (parts.length === 2) {
                                const r = parseInt(parts[0].trim());
                                const c = parseInt(parts[1].trim());
                                if (!isNaN(r) && !isNaN(c) && r > 0 && c > 0) {
                                    z.overrideRows = r;
                                    z.overrideCols = c;
                                    generateGrid(z);
                                } else {
                                    alert("Invalid input!");
                                }
                            }
                        }
                        break;
                    }
                }
            }
        });
        
        function zoomToFit(w, h) {
            const padding = 40;
            let cw = canvas.width > 0 ? canvas.width : 800;
            let ch = canvas.height > 0 ? canvas.height : 600;
            let scaleX = (cw - padding*2) / w;
            let scaleY = (ch - padding*2) / h;
            if (scaleX <= 0) scaleX = 0.1;
            if (scaleY <= 0) scaleY = 0.1;
            scale = Math.min(scaleX, scaleY);
            offsetX = (cw - w * scale) / 2;
            offsetY = (ch - h * scale) / 2;
        }
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    imgObj = img;
                    bgImgData = null;
                    pins = [];
                    pinStatus.textContent = \`0/4 Pins Set\`;
                    zoomToFit(img.width, img.height);
                }
                img.src = event.target.result;
            }
            reader.readAsDataURL(file);
        });

        pinBtn.addEventListener('click', () => { mode = 'pin'; pins = []; pinStatus.textContent = \`0/4 Pins Set\`; });
        
        // HOMOGRAPHY WARP HELPERS
        function solveLinearSystem(A, b) {
            const n = b.length;
            for (let i = 0; i < n; i++) {
                let maxEl = Math.abs(A[i][i]);
                let maxRow = i;
                for (let k = i + 1; k < n; k++) {
                    if (Math.abs(A[k][i]) > maxEl) {
                        maxEl = Math.abs(A[k][i]);
                        maxRow = k;
                    }
                }
                for (let k = i; k < n; k++) {
                    const tmp = A[maxRow][k];
                    A[maxRow][k] = A[i][k];
                    A[i][k] = tmp;
                }
                const tmp = b[maxRow];
                b[maxRow] = b[i];
                b[i] = tmp;
                
                for (let k = i + 1; k < n; k++) {
                    const c = -A[k][i] / A[i][i];
                    for (let j = i; j < n; j++) {
                        if (i === j) A[k][j] = 0;
                        else A[k][j] += c * A[i][j];
                    }
                    b[k] += c * b[i];
                }
            }
            const x = new Array(n).fill(0);
            for (let i = n - 1; i >= 0; i--) {
                x[i] = b[i] / A[i][i];
                for (let k = i - 1; k >= 0; k--) {
                    b[k] -= A[k][i] * x[i];
                }
            }
            return x;
        }

        function getHomography(src, dst) {
            const A = [];
            const b = [];
            for (let i = 0; i < 4; i++) {
                const x = src[i].x;
                const y = src[i].y;
                const u = dst[i].x;
                const v = dst[i].y;
                A.push([x, y, 1, 0, 0, 0, -u*x, -u*y]);
                b.push(u);
                A.push([0, 0, 0, x, y, 1, -v*x, -v*y]);
                b.push(v);
            }
            const h = solveLinearSystem(A, b);
            return [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], 1.0];
        }

        function warpPerspective(srcImgData, targetWidth, targetHeight, H) {
            const dstData = new ImageData(targetWidth, targetHeight);
            const dstPixels = dstData.data;
            const srcPixels = srcImgData.data;
            const sw = srcImgData.width;
            const sh = srcImgData.height;
            
            let dstIdx = 0;
            for (let y = 0; y < targetHeight; y++) {
                for (let x = 0; x < targetWidth; x++) {
                    const z = H[6]*x + H[7]*y + H[8];
                    const sx = (H[0]*x + H[1]*y + H[2]) / z;
                    const sy = (H[3]*x + H[4]*y + H[5]) / z;
                    
                    if (sx >= 0 && sx < sw - 1 && sy >= 0 && sy < sh - 1) {
                        const sx0 = Math.floor(sx);
                        const sy0 = Math.floor(sy);
                        const dx = sx - sx0;
                        const dy = sy - sy0;
                        
                        const idx00 = (sy0 * sw + sx0) * 4;
                        const idx10 = idx00 + 4;
                        const idx01 = idx00 + sw * 4;
                        const idx11 = idx01 + 4;
                        
                        for (let c = 0; c < 4; c++) {
                            const val00 = srcPixels[idx00 + c];
                            const val10 = srcPixels[idx10 + c];
                            const val01 = srcPixels[idx01 + c];
                            const val11 = srcPixels[idx11 + c];
                            
                            const top = val00 * (1 - dx) + val10 * dx;
                            const bot = val01 * (1 - dx) + val11 * dx;
                            dstPixels[dstIdx + c] = top * (1 - dy) + bot * dy;
                        }
                        dstPixels[dstIdx + 3] = 255;
                    } else {
                        dstPixels[dstIdx + 3] = 0; 
                    }
                    dstIdx += 4;
                }
            }
            return dstData;
        }

        function sortPins(p) {
            const sortedY = [...p].sort((a,b) => a.y - b.y);
            const top = sortedY.slice(0,2).sort((a,b) => a.x - b.x); // TL, TR
            const bottom = sortedY.slice(2,4).sort((a,b) => a.x - b.x); // BL, BR
            return [top[0], top[1], bottom[1], bottom[0]]; // returns tl, tr, br, bl
        }

        flattenBtn.addEventListener('click', () => {
            if (pins.length !== 4 || !imgObj) return alert("Please upload an image and set exactly 4 pins.");
            pinStatus.textContent = "Processing...";
            
            setTimeout(() => {
                const [tl, tr, br, bl] = sortPins(pins);
                const dist = (p1, p2) => Math.hypot(p2.x - p1.x, p2.y - p1.y);
                const targetWidth = Math.floor(Math.max(dist(tl, tr), dist(bl, br)));
                const targetHeight = Math.floor(Math.max(dist(tl, bl), dist(tr, br)));
                
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = imgObj.width;
                tempCanvas.height = imgObj.height;
                const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
                tempCtx.drawImage(imgObj, 0, 0);
                const srcData = tempCtx.getImageData(0, 0, imgObj.width, imgObj.height);
                
                const dstCorners = [
                    {x: 0, y: 0},
                    {x: targetWidth, y: 0},
                    {x: targetWidth, y: targetHeight},
                    {x: 0, y: targetHeight}
                ];
                const srcCorners = [tl, tr, br, bl];
                
                const H = getHomography(dstCorners, srcCorners);
                const warpedData = warpPerspective(srcData, targetWidth, targetHeight, H);
                
                const off = document.createElement('canvas');
                off.width = targetWidth;
                off.height = targetHeight;
                off.getContext('2d').putImageData(warpedData, 0, 0);
                
                const newImg = new Image();
                newImg.onload = () => {
                    bgImgData = newImg;
                    imgObj = null;
                    pins = [];
                    pinStatus.textContent = "Image Flattened Perfectly!";
                    zoomToFit(targetWidth, targetHeight);
                };
                newImg.src = off.toDataURL();
            }, 10);
        });
        
        rulerBtn.addEventListener('click', () => { mode = 'ruler'; rulerLine = []; });
        
        function processRuler() {
            const p1 = rulerLine[0];
            const p2 = rulerLine[1];
            const pxDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
            
            setTimeout(() => {
                const meters = prompt(\`Line drawn is \${pxDist.toFixed(2)} pixels.\nEnter real-world distance in meters:\`);
                if (meters && !isNaN(meters) && meters > 0) {
                    measurements.push({
                        id: 'm_' + Date.now(),
                        source: 'Manual',
                        type: 'Custom',
                        m: parseFloat(meters),
                        px: pxDist,
                        ratio: pxDist / parseFloat(meters),
                        p1: {x: p1.x, y: p1.y},
                        p2: {x: p2.x, y: p2.y}
                    });
                    updateMeasurementsUI();
                }
                mode = 'idle';
                rulerLine = []; 
            }, 50);
        }

        function updateMeasurementsUI() {
            const list = document.getElementById('measurements-list');
            list.innerHTML = '';
            
            if (measurements.length === 0) {
                pixelToMeterRatio = null;
                ratioDisplay.textContent = 'Not calibrated';
                return;
            }
            
            let totalRatio = 0;
            measurements.forEach(m => {
                totalRatio += m.ratio;
                
                const item = document.createElement('div');
                item.className = "flex justify-between items-center bg-[#222a3d] p-1.5 rounded border border-[#424754]";
                
                const badgeColor = m.source === 'OpenCV' ? 'bg-blue-900 text-blue-300' : 'bg-red-900 text-red-300';
                
                item.innerHTML = \`
                    <div class="flex items-center gap-2">
                        <span class="\${badgeColor} text-[9px] px-1 py-0.5 rounded uppercase font-bold">\${m.source}</span>
                        <span class="text-[10px] text-white">\${m.type}: \${m.px.toFixed(1)}px = \${m.m}m</span>
                    </div>
                    <button class="text-[#8c909f] hover:text-[#ffb4ab] transition-colors" onclick="deleteMeasurement('\${m.id}')">
                        <span class="material-symbols-outlined text-[14px]">delete</span>
                    </button>
                \`;
                list.appendChild(item);
            });
            
            pixelToMeterRatio = totalRatio / measurements.length;
            ratioDisplay.textContent = \`\${pixelToMeterRatio.toFixed(2)} px/m\`;
        }

        window.deleteMeasurement = function(id) {
            measurements = measurements.filter(m => m.id !== id);
            updateMeasurementsUI();
        };

                // OpenCV Web Worker
        const workerCode = \`
        self.Module = {
            locateFile: function(path) {
                if (path === 'opencv_js.wasm') {
                    return 'https://docs.opencv.org/4.8.0/opencv_js.wasm';
                }
                return path;
            }
        };
        importScripts('https://docs.opencv.org/4.8.0/opencv.js');
        
        if (typeof cv === 'function') {
            cv(self.Module).then(function(c) {
                self.cv = c;
                postMessage({ type: 'READY' });
            }).catch(function(err) {
                console.error("OpenCV init error:", err);
            });
        } else {
            let checkCv = setInterval(() => {
                if (typeof cv !== 'undefined' && cv.Mat) {
                    clearInterval(checkCv);
                    postMessage({ type: 'READY' });
                }
            }, 500);
            if (cv) cv['onRuntimeInitialized'] = () => { postMessage({ type: 'READY' }); };
        }
        
        onmessage = function(e) {
            if (e.data.type === 'PROCESS') {
                const imgData = e.data.imageData;
                try {
                    let src = cv.matFromImageData(imgData);
                    let dst = new cv.Mat();
                    let edges = new cv.Mat();
                    let lines = new cv.Mat();
                    
                    cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY, 0);
                    cv.Canny(dst, edges, 50, 150, 3);
                    cv.HoughLinesP(edges, lines, 1, Math.PI / 180, 20, 10, 5);
                    
                    if (lines.rows === 0) {
                        src.delete(); dst.delete(); edges.delete(); lines.delete();
                        throw new Error("Không tìm thấy vạch container nào.");
                    }
                    
                    let linesList = [];
                    for (let i = 0; i < lines.rows; ++i) {
                        let x1 = lines.data32S[i * 4];
                        let y1 = lines.data32S[i * 4 + 1];
                        let x2 = lines.data32S[i * 4 + 2];
                        let y2 = lines.data32S[i * 4 + 3];
                        let angle = Math.atan2(y2 - y1, x2 - x1);
                        if (angle < 0) angle += Math.PI;
                        if (angle > Math.PI - 0.1) angle -= Math.PI;
                        linesList.push({x1, y1, x2, y2, angle});
                    }
                    
                    let bins = new Array(36).fill(0);
                    linesList.forEach(l => {
                        let bin = Math.floor((l.angle * 180 / Math.PI) / 5) % 36;
                        bins[bin]++;
                    });
                    let maxBin = bins.indexOf(Math.max(...bins));
                    let dominantAngle = (maxBin * 5 + 2.5) * Math.PI / 180;
                    
                    let domLines = linesList.filter(l => {
                        let diff = Math.abs(l.angle - dominantAngle);
                        if (diff > Math.PI/2) diff = Math.PI - diff;
                        return diff < 10 * Math.PI / 180;
                    });
                    
                    let nx = -Math.sin(dominantAngle);
                    let ny = Math.cos(dominantAngle);
                    
                    let projections = domLines.map(l => {
                        let cx = (l.x1 + l.x2) / 2;
                        let cy = (l.y1 + l.y2) / 2;
                        return cx * nx + cy * ny;
                    });
                    projections.sort((a, b) => a - b);
                    
                    let gaps = [];
                    for (let i = 1; i < projections.length; i++) {
                        let gap = projections[i] - projections[i-1];
                        if (gap > 2) gaps.push(gap);
                    }
                    
                    if (gaps.length === 0) {
                        src.delete(); dst.delete(); edges.delete(); lines.delete();
                        throw new Error("Không thể đo được khoảng cách giữa các container.");
                    }
                    
                    gaps.sort((a, b) => a - b);
                    let medianGap = gaps[Math.floor(gaps.length / 2)];
                    
                    src.delete(); dst.delete(); edges.delete(); lines.delete();
                    
                    postMessage({ type: 'RESULT', px: medianGap, ratio: medianGap / 2.44, id: e.data.id, m: 2.44, typeName: 'Width 8ft' });
                } catch (err) {
                    postMessage({ type: 'ERROR', error: err.message, id: e.data.id });
            } else if (e.data.type === 'AUTO_ZONE') {
                const imgData = e.data.imageData;
                const ratio = e.data.ratio;
                try {
                    let src = cv.matFromImageData(imgData);
                    let gray = new cv.Mat();
                    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
                    
                    let edges = new cv.Mat();
                    cv.Canny(gray, edges, 50, 150);
                    
                    let dilated = new cv.Mat();
                    let kSize = Math.max(3, Math.floor(2.44 * ratio)); 
                    let M = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(kSize, kSize));
                    cv.dilate(edges, dilated, M, new cv.Point(-1, -1), 2);
                    cv.erode(dilated, dilated, M, new cv.Point(-1, -1), 1);
                    
                    let contours = new cv.MatVector();
                    let hierarchy = new cv.Mat();
                    cv.findContours(dilated, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
                    
                    let minZoneArea = (12.2 * ratio) * (2.44 * ratio) * 2; 
                    let zones = [];
                    for (let i = 0; i < contours.size(); ++i) {
                        let cnt = contours.get(i);
                        let rect = cv.boundingRect(cnt);
                        if (rect.width * rect.height > minZoneArea) {
                            zones.push(rect);
                        }
                    }
                    
                    src.delete(); gray.delete(); edges.delete(); dilated.delete(); M.delete(); contours.delete(); hierarchy.delete();
                    
                    postMessage({ type: 'AUTO_ZONE_RESULT', zones: zones, id: e.data.id });
                } catch (err) {
                    postMessage({ type: 'AUTO_ZONE_ERROR', error: err.message, id: e.data.id });
                }
            }
        };\`;
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const cvWorker = new Worker(URL.createObjectURL(blob));
        let isCvReady = false;
        
        let pendingCVMesures = {};
        const btnCvCrop = document.getElementById('btn-cv-crop');
        
        cvWorker.onmessage = (e) => {
            if (e.data.type === 'READY') {
                isCvReady = true;
            }
            else if (e.data.type === 'RESULT') {
                const pending = pendingCVMesures[e.data.id];
                if(pending) {
                    measurements.push({
                        id: 'cv_' + Date.now(), source: 'OpenCV', type: e.data.typeName || 'Auto',
                        m: e.data.m || 12.2, px: e.data.px, ratio: e.data.ratio,
                        p1: pending.p1, p2: pending.p2
                    });
                    updateMeasurementsUI();
                    delete pendingCVMesures[e.data.id];
                    btnCvCrop.innerHTML = '🔍 CV Crop';
                    btnCvCrop.disabled = false;
                }
            } else if (e.data.type === 'ERROR') {
                alert("OpenCV: " + e.data.error + "\\nĐã tự động chuyển sang Thước đo thủ công.");
                const pending = pendingCVMesures[e.data.id];
                if(pending) delete pendingCVMesures[e.data.id];
                btnCvCrop.innerHTML = '🔍 CV Crop';
                btnCvCrop.disabled = false;
                mode = 'ruler';
                rulerLine = [];
            } else if (e.data.type === 'AUTO_ZONE_RESULT') {
                const zones = e.data.zones;
                zones.forEach(rect => {
                    const zone = {
                        id: 'cv_zone_' + Date.now() + Math.random(),
                        type: 'Storage',
                        isRotated: rect.height > rect.width,
                        startX: rect.x,
                        startY: rect.y,
                        width: rect.width,
                        height: rect.height,
                        realWidthMeters: rect.width / pixelToMeterRatio,
                        realHeightMeters: rect.height / pixelToMeterRatio
                    };
                    mapZones.push(zone);
                    generateGrid(zone);
                });
                alert(\`OpenCV Computer Vision Detected \${zones.length} container blocks!\`);
                aiDetectBtn.innerHTML = '<span class="material-symbols-outlined text-[14px]">smart_toy</span> AI Auto-Detect (CV)';
                aiDetectBtn.disabled = false;
            } else if (e.data.type === 'AUTO_ZONE_ERROR') {
                alert("OpenCV Detection Failed: " + e.data.error);
                aiDetectBtn.innerHTML = '<span class="material-symbols-outlined text-[14px]">smart_toy</span> AI Auto-Detect (CV)';
                aiDetectBtn.disabled = false;
            }
        };
        
        if(btnCvCrop) {
            btnCvCrop.addEventListener('click', () => {
                if(!isCvReady) return alert("OpenCV đang được tải xuống từ CDN, vui lòng đợi vài giây...");
                mode = 'cv-crop';
                currentRect = null;
                alert("Đã bật chế độ Khoanh vùng OpenCV. Hãy dùng chuột kéo một hình chữ nhật bao quanh một khu vực container trên ảnh.");
            });
        }

        
        drawZoneBtn.addEventListener('click', () => {
            if(!pixelToMeterRatio) return alert("Please calibrate scale (Phase 2) first!");
            mode = 'zone';
        });
        
        if (panBtn) {
            panBtn.addEventListener('click', () => {
                mode = 'idle';
                canvas.style.cursor = 'grab';
            });
        }
        
        undoBtn.addEventListener('click', () => {
            const last = mapZones.pop();
            if(last && last.type === 'Storage') yardGrid = yardGrid.filter(s => s.zoneId !== last.id);
        });
        clearBtn.addEventListener('click', () => { mapZones = []; yardGrid = []; });

        function saveZone() {
            let x = currentRect.width < 0 ? currentRect.startX + currentRect.width : currentRect.startX;
            let y = currentRect.height < 0 ? currentRect.startY + currentRect.height : currentRect.startY;
            let w = Math.abs(currentRect.width);
            let h = Math.abs(currentRect.height);

            const zone = {
                id: 'zone_' + Date.now(),
                type: zoneTypeSel.value,
                isRotated: document.getElementById('chk-rotate-grid').checked,
                startX: x,
                startY: y,
                width: w,
                height: h,
                realWidthMeters: w / pixelToMeterRatio,
                realHeightMeters: h / pixelToMeterRatio
            };
            
            mapZones.push(zone);
            if (zone.type === 'Storage') generateGrid(zone);
        }

        function generateGrid(zone) {
            yardGrid = yardGrid.filter(s => s.zoneId !== zone.id);
            
            let cols, rows, slotPxW, slotPxH, padX = 0, padY = 0;
            
            if (zone.overrideCols && zone.overrideRows) {
                cols = zone.overrideCols;
                rows = zone.overrideRows;
                slotPxW = Math.abs(zone.width) / cols;
                slotPxH = Math.abs(zone.height) / rows;
            } else {
                const baseSlotW = zone.isRotated ? SLOT_HEIGHT_M : SLOT_WIDTH_M;
                const baseSlotH = zone.isRotated ? SLOT_WIDTH_M : SLOT_HEIGHT_M;
                
                slotPxW = baseSlotW * pixelToMeterRatio;
                slotPxH = baseSlotH * pixelToMeterRatio;
                cols = Math.floor(Math.abs(zone.width) / slotPxW);
                rows = Math.floor(Math.abs(zone.height) / slotPxH);
                
                if (cols === 0) cols = 1; // Prevent invisible grids on thin zones
                if (rows === 0) rows = 1;
                
                // Center the grid inside the zone by distributing leftover space equally
                padX = (Math.abs(zone.width) - (cols * slotPxW)) / 2;
                padY = (Math.abs(zone.height) - (rows * slotPxH)) / 2;
                if (padX < 0) padX = 0;
                if (padY < 0) padY = 0;
            }
            
            const startX = (zone.width < 0 ? zone.startX + zone.width : zone.startX) + padX;
            const startY = (zone.height < 0 ? zone.startY + zone.height : zone.startY) + padY;
            
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const gx = startX + c * slotPxW;
                    const gy = startY + r * slotPxH;
                    
                    yardGrid.push({
                        id: \`slot_\${zone.id}_\${r}_\${c}\`,
                        zoneId: zone.id,
                        row: r,
                        col: c,
                        x: gx,
                        y: gy,
                        w: slotPxW,
                        h: slotPxH,
                        status: 'Empty'
                    });
                }
            }
        }
        
        aiDetectBtn.addEventListener('click', async () => {
            if (!pixelToMeterRatio) return alert("Please calibrate scale (Phase 2) first!");
            const targetImage = bgImgData ? bgImgData : imgObj;
            if (!targetImage) return alert("Please upload an image first!");
            
            if(!isCvReady) return alert("OpenCV is still loading, please wait...");
            
            aiDetectBtn.innerHTML = '<span class="material-symbols-outlined text-[14px] animate-spin">refresh</span> Processing CV...';
            aiDetectBtn.disabled = true;
            
            const temp = document.createElement('canvas');
            temp.width = targetImage.width || targetImage.naturalWidth;
            temp.height = targetImage.height || targetImage.naturalHeight;
            temp.getContext('2d').drawImage(targetImage, 0, 0);
            const imgData = temp.getContext('2d').getImageData(0, 0, temp.width, temp.height);
            
            cvWorker.postMessage({ type: 'AUTO_ZONE', imageData: imgData, ratio: pixelToMeterRatio, id: Date.now() });
        });

        exportBtn.addEventListener('click', () => {
            const payload = {
                metadata: { pixelToMeterRatio, generatedAt: new Date().toISOString() },
                zones: mapZones.map(z => ({
                    id: z.id, type: z.type,
                    realWidthMeters: z.realWidthMeters, realHeightMeters: z.realHeightMeters,
                    pixelBounds: { x: z.startX, y: z.startY, w: z.width, h: z.height }
                })),
                grid_slots: yardGrid.map(s => ({
                    id: s.id, zoneId: s.zoneId, status: s.status,
                    pixelBounds: { x: s.x, y: s.y, w: s.w, h: s.h }
                }))
            };
            exportOut.value = JSON.stringify(payload, null, 2);
        });

        // Start Loop
        animationFrameId = requestAnimationFrame(draw);
    })();
    </script>

    </template>
</div>
`;
