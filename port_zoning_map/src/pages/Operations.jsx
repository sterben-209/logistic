import React, { useState } from "react";
import useTaskStore from "../store/useTaskStore";

const Operations = () => {
  const [activeTab, setActiveTab] = useState("containers");
  const [newVehicleType, setNewVehicleType] = useState('agv');
  const [containerPage, setContainerPage] = useState(1);
  const [slotPage, setSlotPage] = useState(1);
  const ITEMS_PER_PAGE = 100;
  
  const fleetData = useTaskStore(state => state.tasks);
  const slotsData = useTaskStore(state => state.slots);
  const inventoryData = useTaskStore(state => state.inventory);
  const fleetRegistry = useTaskStore(state => state.fleetRegistry);
  const addVehicle = useTaskStore(state => state.addVehicle);
  const removeVehicle = useTaskStore(state => state.removeVehicle);

  const transitContainers = fleetData
    .filter(v => v.status !== 'COMPLETED')
    .map(v => {
      const isImport = v.type === 'INBOUND';
      return {
        containerNo: v.containerId || `[NO CONT]`,
        size: v.size || 20,
        type: v.cargoType || 'DRY',
        weight: 20,
        zoneId: isImport && v.targetZoneId ? v.targetZoneId : (isImport && v.targetSlotId ? v.targetSlotId.split('-').slice(0, -2).join('-') : 'GATE'),
        bay: isImport && v.targetBay ? v.targetBay : '-',
        row: isImport && v.targetRow ? v.targetRow : '-',
        tier: '-',
        status: isImport ? 'TRANSIT (INBOUND)' : 'DEPARTING (OUTBOUND)'
      };
    });
  
  const exportTargetIds = fleetData
     .filter(v => v.type === 'OUTBOUND' && v.status !== 'COMPLETED')
     .map(v => v.containerId);

  const inventoryWithStatus = inventoryData
    .filter(c => !transitContainers.some(t => t.containerNo === c.id)) // Hide if already departing
    .map(c => {
       if (exportTargetIds.includes(c.id)) {
           return { ...c, status: 'PENDING EXPORT' };
       }
       return { ...c, status: 'STORED' };
    });

  const allContainers = [...inventoryWithStatus, ...transitContainers];

  const handleAddVehicle = () => {
    const id = `${newVehicleType.toUpperCase()}-${Math.floor(Math.random() * 9000 + 1000)}`;
    const newVehicle = {
      id,
      type: newVehicleType,
      status: 'IDLE',
      currentPos: [10.762622, 106.701140], // Default coords
      speed: newVehicleType === 'truck' ? 0.00001 : 0.000015
    };
    addVehicle(newVehicle);
  };

  return (
    <div className="p-margin-desktop h-[calc(100vh-4rem)] flex flex-col gap-panel-gap bg-grid-pattern relative">

<div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/50 pointer-events-none"></div>
<div className="flex-1 flex gap-panel-gap min-h-0 relative z-10">
{/* Center Panel: Interactive Data Grid */}
<section className="flex-1 flex flex-col bg-surface-container/90 backdrop-blur-sm rounded-xl border border-outline-variant/30 shadow-lg overflow-hidden flex flex-col h-full">
{/* Data Grid Header Controls */}
<div className="p-4 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-high/50">
<div className="flex flex-col gap-2">
    <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-primary text-[24px]">dataset</span>
        <h2 id="operations-title" className="font-title-md text-title-md text-primary">Container Matrix</h2>
        <span className="px-2 py-0.5 rounded text-[10px] font-label-sm bg-primary/10 text-primary border border-primary/20 ml-2">LIVE SYNC</span>
    </div>
    <div className="flex items-center gap-1 mt-1 bg-surface-container p-1 rounded-lg w-max border border-outline-variant/20">
        <button 
          onClick={() => setActiveTab("containers")}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'containers' ? 'bg-primary/20 text-primary' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest'}`}
        >Containers</button>
        <button 
          onClick={() => setActiveTab("slots")}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'slots' ? 'bg-primary/20 text-primary' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest'}`}
        >Yards / Slots</button>
        <button 
          onClick={() => setActiveTab("fleet")}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'fleet' ? 'bg-primary/20 text-primary' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest'}`}
        >Logistics Fleet</button>
    </div>
</div>
<div className="flex items-center gap-4">
<div className="flex items-center gap-2">
<span className="font-label-sm text-[11px] text-outline">Manual Override</span>
<div className="relative inline-block w-9 h-5 align-middle select-none">
<input className="toggle-checkbox absolute block w-4 h-4 rounded-full bg-white border-4 appearance-none cursor-pointer z-10 top-0.5 left-0.5 opacity-0" id="manualOverride" name="toggle" type="checkbox"/>
<label className="toggle-label block overflow-hidden h-5 rounded-full bg-gray-300 cursor-pointer" htmlFor="manualOverride"></label>
</div>
</div>
<div className="h-6 w-px bg-outline-variant/50"></div>
<button id="btn-sync-operations" className="flex items-center gap-2 px-3 py-1.5 border border-primary/40 text-primary hover:bg-primary/10 rounded transition-colors text-sm font-label-sm">
<span className="material-symbols-outlined text-[16px]">sync</span>
                            Sync Real-time Data
                        </button>
<button className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 rounded transition-colors text-sm font-label-sm">
<span className="material-symbols-outlined text-[16px]">download</span>
                            Export CSV
                        </button>
</div>
</div>
{/* Toolbar: Find, Filter, Sort */}
<div className="p-3 bg-surface-container border-b border-outline-variant/30 flex gap-4 items-center">
    <div className="relative flex-1 max-w-xs">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
        <input type="text" id="ops-search" placeholder="Search ID or Zone..." className="w-full bg-surface border border-outline-variant/40 rounded-lg py-1.5 pl-9 pr-3 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none placeholder:text-outline/50"/>
    </div>
    <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-outline text-[18px]">filter_list</span>
        <select id="ops-filter" className="bg-surface border border-outline-variant/40 rounded-lg py-1.5 px-3 text-sm text-on-surface focus:border-primary outline-none cursor-pointer">
            <option value="all">All Status</option>
            <option value="empty">Empty</option>
            <option value="occupied_20">Occupied (20ft)</option>
            <option value="occupied_40">Occupied (40ft)</option>
        </select>
    </div>
    <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-outline text-[18px]">sort</span>
        <select id="ops-sort" className="bg-surface border border-outline-variant/40 rounded-lg py-1.5 px-3 text-sm text-on-surface focus:border-primary outline-none cursor-pointer">
            <option value="default">Default Order</option>
            <option value="id_asc">ID (A-Z)</option>
            <option value="id_desc">ID (Z-A)</option>
            <option value="zone_asc">Zone (A-Z)</option>
        </select>
    </div>
</div>
{/* The Grid */}
<div className="flex-1 overflow-auto">
{activeTab === 'containers' && (
<div className="flex flex-col h-full">
<div className="flex-1 overflow-auto">
<table className="w-full text-left border-collapse">
<thead>
<tr>
<th className="data-grid-header w-12 text-center">#</th>
<th className="data-grid-header">Container ID</th>
<th className="data-grid-header">Type</th>
<th className="data-grid-header">Weight (tons)</th>
<th className="data-grid-header">Zone</th>
<th className="data-grid-header">Slot (Bay/Row/Tier)</th>
<th className="data-grid-header">Status</th>
<th className="data-grid-header text-right">Actions</th>
</tr>
</thead>
<tbody id="operations-table-body">
{(() => {
  if (allContainers.length === 0) {
    return (
      <tr>
        <td colSpan="8" className="text-center py-8 text-outline-variant">No containers tracked.</td>
      </tr>
    );
  }
  
  const startIndex = (containerPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = allContainers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return paginatedData.map((container, index) => (
    <tr key={container.containerNo || container.id || index} className="data-grid-row">
      <td className="data-grid-cell text-center text-outline-variant">{(containerPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
      <td className="data-grid-cell font-mono text-primary font-bold tracking-wider">{container.containerNo || container.id}</td>
      <td className="data-grid-cell flex items-center gap-2">
        <span className="px-2 py-0.5 bg-surface-container-highest rounded text-[10px] font-bold text-on-surface-variant">
          {container.size} {container.type === 'REEFER' ? 'RF' : 'GP'}
        </span>
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
          container.cargoType === 'FLAMMABLE' ? 'bg-error/10 text-error' :
          container.cargoType === 'REEFER' ? 'bg-blue-500/10 text-blue-500' :
          'bg-secondary/10 text-secondary'
        }`}>
          {container.cargoType || 'DRY'}
        </span>
      </td>
      <td className="data-grid-cell text-secondary">{container.weight || '-'}</td>
      <td className="data-grid-cell text-secondary">{container.zoneId || (container.slotId ? container.slotId.split('-').slice(0,-2).join('-') : 'Unknown')}</td>
      <td className="data-grid-cell text-secondary">{container.bay || '-'}/{container.row || '-'}/{container.tier || '-'}</td>
      <td className="data-grid-cell">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-label-sm ${container.status === 'TRANSIT' ? 'bg-primary/10 text-primary border border-primary/30' : container.status === 'DEPARTING' ? 'bg-error/10 text-error border border-error/30' : container.status === 'PENDING EXPORT' ? 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/30' : 'bg-secondary/10 text-secondary border border-secondary/20'}`}>
           {container.status || 'STORED'}
        </span>
      </td>
      <td className="data-grid-cell text-right">
        <button className="text-outline hover:text-primary transition-colors"><span className="material-symbols-outlined text-[18px]">edit</span></button>
      </td>
    </tr>
  ));
})()}
</tbody>
</table>
</div>
<div className="p-2 border-t border-outline-variant/30 bg-surface-container flex justify-between items-center text-sm">
  <span className="text-outline-variant">Showing {(containerPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(containerPage * ITEMS_PER_PAGE, allContainers.length)} of {allContainers.length}</span>
  <div className="flex gap-2">
    <button disabled={containerPage === 1} onClick={() => setContainerPage(p => p - 1)} className="px-3 py-1 bg-surface-container-highest rounded hover:bg-primary/20 disabled:opacity-50">Prev</button>
    <button disabled={containerPage * ITEMS_PER_PAGE >= allContainers.length} onClick={() => setContainerPage(p => p + 1)} className="px-3 py-1 bg-surface-container-highest rounded hover:bg-primary/20 disabled:opacity-50">Next</button>
  </div>
</div>
</div>
)}

{activeTab === 'slots' && (
<div className="flex flex-col h-full">
<div className="flex-1 overflow-auto">
  <table className="w-full text-left border-collapse">
    <thead>
      <tr>
        <th className="data-grid-header w-12 text-center">#</th>
        <th className="data-grid-header">Slot ID</th>
        <th className="data-grid-header">Zone</th>
        <th className="data-grid-header">Status</th>
        <th className="data-grid-header">Coords</th>
      </tr>
    </thead>
    <tbody>
      {slotsData.length === 0 ? (
        <tr>
          <td colSpan="5" className="text-center py-8 text-outline-variant">Waiting for Map data...</td>
        </tr>
      ) : (
        slotsData.slice((slotPage - 1) * ITEMS_PER_PAGE, slotPage * ITEMS_PER_PAGE).map((slot, index) => (
          <tr key={slot.id} className="border-b border-outline-variant/10 text-sm hover:bg-surface-container-highest transition-colors">
             <td className="py-2 text-center text-outline-variant">{(slotPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
             <td className="py-2 font-bold text-on-surface">{slot.id}</td>
             <td className="py-2 text-secondary">{slot.zoneId || 'Unzoned'}</td>
             <td className="py-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-label-sm ${slot.status && slot.status !== 'empty' ? 'bg-primary/10 text-primary border border-primary/30' : 'bg-surface-bright text-on-surface-variant border border-outline-variant/30'}`}>
                  {(slot.status || 'EMPTY').toUpperCase()}
                </span>
             </td>
             <td className="py-2 text-outline-variant text-[11px] font-mono">
               {slot.center ? `[${slot.center[0].toFixed(5)}, ${slot.center[1].toFixed(5)}]` : 'N/A'}
             </td>
          </tr>
        ))
      )}
    </tbody>
  </table>
</div>
<div className="p-2 border-t border-outline-variant/30 bg-surface-container flex justify-between items-center text-sm">
  <span className="text-outline-variant">Showing {(slotPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(slotPage * ITEMS_PER_PAGE, slotsData.length)} of {slotsData.length}</span>
  <div className="flex gap-2">
    <button disabled={slotPage === 1} onClick={() => setSlotPage(p => p - 1)} className="px-3 py-1 bg-surface-container-highest rounded hover:bg-primary/20 disabled:opacity-50">Prev</button>
    <button disabled={slotPage * ITEMS_PER_PAGE >= slotsData.length} onClick={() => setSlotPage(p => p + 1)} className="px-3 py-1 bg-surface-container-highest rounded hover:bg-primary/20 disabled:opacity-50">Next</button>
  </div>
</div>
</div>
)}

{activeTab === 'fleet' && (
  <div className="flex flex-col h-full">
    <div className="p-3 bg-surface-container-highest/20 border-b border-outline-variant/30 flex justify-between items-center">
      <div className="text-sm font-medium text-on-surface-variant">
        Quản lý Đội Xe ({fleetRegistry.length} xe)
      </div>
      <div className="flex gap-2">
        <select 
          value={newVehicleType} 
          onChange={(e) => setNewVehicleType(e.target.value)}
          className="bg-surface-container text-on-surface border border-outline-variant/50 px-3 py-1.5 rounded-lg text-sm outline-none"
        >
          <option value="agv">AGV</option>
          <option value="rtg">RTG Crane</option>
          <option value="rs">Reach Stacker</option>
        </select>
        <button 
          onClick={handleAddVehicle}
          className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          Thêm Xe
        </button>
      </div>
    </div>
    <div className="flex-1 overflow-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr>
            <th className="data-grid-header w-24">Vehicle ID</th>
            <th className="data-grid-header w-24">Type</th>
            <th className="data-grid-header w-24">Status</th>
            <th className="data-grid-header">Live Tracking / Action</th>
          </tr>
        </thead>
        <tbody id="operations-fleet-tbody">
          {fleetRegistry.length === 0 ? (
            <tr>
              <td colSpan="4" className="text-center py-8 text-outline-variant">Chưa có xe nào. Hãy thêm xe mới!</td>
            </tr>
          ) : (
            fleetRegistry.map(v => {
              const activeTask = fleetData.find(t => t.assignedVehicleId === v.id);
              return (
                <tr key={v.id} className="border-b border-outline-variant/10 text-sm group hover:bg-surface-container-highest/30 transition-colors">
                  <td className="py-2.5 px-4 font-bold text-on-surface">{v.id}</td>
                  <td className="py-2.5 px-4 text-secondary capitalize">{v.type === 'agv' ? 'AGV' : (v.type === 'rtg' ? 'RTG Crane' : 'Reach Stacker')}</td>
                  <td className="py-2.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${v.status === 'MOVING' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-success/10 text-success border-success/20'}`}>
                      {v.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 flex items-center justify-between gap-4">
                    {activeTask ? (
                      <div className="w-full max-w-[200px] flex items-center gap-2">
                         <span className="text-xs text-on-surface-variant w-16 truncate text-primary">{activeTask.tractorId || activeTask.id}</span>
                         <span className="text-xs text-on-surface-variant w-16 truncate">{activeTask.status.replace(/_/g, ' ')}</span>
                         <div className="flex-1 bg-surface-container-highest h-1.5 rounded overflow-hidden">
                            <div className="bg-primary h-full transition-all duration-300" style={{ width: `${Math.round(activeTask.progress || 0)}%` }}></div>
                         </div>
                      </div>
                    ) : (
                      <span className="text-xs text-outline-variant italic">Đang chờ lệnh...</span>
                    )}
                    
                    <button 
                      onClick={() => removeVehicle(v.id)}
                      className="text-error opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-error/10 rounded"
                      title="Xóa xe"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  </div>
)}

</div>
</section>

</div>

    </div>
  );
};

export default Operations;
