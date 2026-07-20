/**
 * TaskTab Component
 * 
 * Right-side collapsible panel for port task dispatch and fleet management.
 * 
 * Key Responsibilities:
 * - Inbound task creation: generates external tractor + AGV support task pairs
 * - Outbound task creation: locates exportable containers and routes to gates
 * - Bulk task generation: spawns 1-20 tasks with staggered delays to prevent lock-outs
 * - Real-time task status display: live progress bars and state tracking
 * - Form controls: size (20ft/40ft), cargo type (DRY/REEFER/FLAMMABLE), quantity
 * 
 * Task Flow:
 * 1. User fills form (Inbound/Outbound, size, cargo type, quantity)
 * 2. On submit: calls findBestSlot (INBOUND) or findContainerToExport (OUTBOUND)
 * 3. Creates task pair: {externalTractor} + {supportTask} per item
 * 4. Enqueues tasks to store, broadcasts to other listeners
 * 5. useVehicleAnimation picks up tasks and animates vehicle movement
 * 
 * UI Design:
 * - Minimalist collapsible sidebar (48px when closed, 380px when expanded)
 * - Glass morphism effect with blur and semi-transparent background
 * - Real-time metrics: active tasks count, pending queue length
 * - Styled progress bars with gradient and glow effects
 * - Vietnamese labels and status messages (i18n-ready)
 * 
 * @component
 * @returns {JSX.Element} Collapsible task dispatch panel
 */
import React, { useState, useMemo } from 'react';
import useTaskStore from '../store/useTaskStore';
import { findBestSlot, findContainerToExport } from '../services/slotService';

/**
 * Helper function: delays execution for a specified milliseconds
 * Used to yield control to browser for UI updates and prevent rapid-fire enqueues
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * TaskTab Component
 * @component
 */
export default function TaskTab() {
  const { inventory, tasks, taskQueue, enqueueTask, lockContainer, broadcasters, gates, slots, storageZones, portBoundary } = useTaskStore();
  const activeTasks = tasks.filter(t => t.status !== 'COMPLETED');
  const pendingTasks = taskQueue;

  const [taskType, setTaskType] = useState('INBOUND');
  const [size, setSize] = useState(20);
  const [cargoType, setCargoType] = useState('DRY');
  const [quantity, setQuantity] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    if (!gates || gates.length === 0 || !storageZones || storageZones.length === 0) {
        alert("Bản đồ chưa sẵn sàng! Vui lòng chờ load Gate và Zones.");
        return;
    }
    setIsProcessing(true);
    
    // Yield to let the browser update the button UI to "Processing..."
    await delay(50);

    try {
        const qty = Math.min(Math.max(Number(quantity), 1), 20);
        const pendingExportIds = new Set();

        for (let i = 0; i < qty; i++) {
          // Yield to unblock UI, but keep it very short to spawn quickly
          await delay(10); 

          const generatedId = `TASK-${Date.now()}-${i}`;
          
          if (taskType === 'INBOUND') {
            const cargoInfo = { size, cargoType, weight: 20 };
            const targetSlot = findBestSlot(cargoInfo, slots, storageZones, inventory);
            
            if (!targetSlot) {
              alert('Bãi đầy hoặc không có Slot phù hợp!');
              break; 
            }

            const bestGate = gates[0];
            const tractorId = `TRUCK-${Math.floor(10000 + Math.random() * 90000)}`;

            // 1. Sinh ra Xe Đầu Kéo ngoại vi (External Tractor)
            const externalTractor = {
              id: tractorId,
              type: 'INBOUND', // Same as before so useVehicleAnimation handles it automatically
              truckPlate: tractorId,
              cargoType,
              size,
              gateId: bestGate.id,
              targetSlotId: targetSlot.id,
              targetZoneId: targetSlot.zoneId,
              targetBay: targetSlot.bay,
              targetRow: targetSlot.row,
              status: 'EN_ROUTE_TO_SLOT',
              progress: 0,
              currentIndex: 0,
              path: [], // Will be calculated by dispatcher
              containerId: `CONT-${Date.now()}-${i}`,
              delayTicks: i * 40
            };
            enqueueTask(externalTractor);

            // 2. Ném Yêu cầu hỗ trợ vào Queue cho AGV/RTG nội bộ
            const supportTask = {
              id: `SUPPORT-${generatedId}`,
              type: 'SUPPORT', // New type for AGV
              targetSlotId: targetSlot.id,
              targetZoneId: targetSlot.zoneId,
              targetBay: targetSlot.bay,
              targetRow: targetSlot.row,
              tractorId: tractorId,
              status: 'PENDING_SUPPORT',
              currentIndex: 0,
              progress: 0
            };
            enqueueTask(supportTask);
            if (broadcasters?.broadcastTaskAdded) broadcasters.broadcastTaskAdded(externalTractor);

          } else {
            // OUTBOUND
            const cargoInfo = { size, cargoType };
            // Use slotService to find the best container to export (at the top of a tier)
            const exportTarget = findContainerToExport(cargoInfo, inventory, slots, pendingExportIds);
            
            if (!exportTarget) {
              alert(`Hết hàng hoặc hàng bị kẹt ở dưới! (Size: ${size} - ${cargoType})`);
              break;
            }

            const targetCont = exportTarget.container;
            const targetSlot = exportTarget.slot;
            
            pendingExportIds.add(targetCont.containerNo || targetCont.id);
            lockContainer(targetCont.id);

            const bestGate = gates[0];
            const tractorId = `TRUCK-${Math.floor(10000 + Math.random() * 90000)}`;

            // 1. Sinh ra Xe Đầu Kéo ngoại vi (External Tractor)
            const externalTractor = {
              id: tractorId,
              type: 'OUTBOUND',
              truckPlate: tractorId,
              cargoType,
              size,
              gateId: bestGate.id,
              targetSlotId: targetSlot.id,
              targetZoneId: targetSlot.zoneId,
              targetBay: targetSlot.bay,
              targetRow: targetSlot.row,
              status: 'EN_ROUTE_TO_SLOT',
              progress: 0,
              currentIndex: 0,
              path: [],
              containerId: targetCont.id,
              delayTicks: i * 40
            };
            enqueueTask(externalTractor);

            // 2. Ném Yêu cầu hỗ trợ vào Queue cho AGV/RTG nội bộ
            const supportTask = {
              id: `SUPPORT-${generatedId}`,
              type: 'SUPPORT',
              targetSlotId: targetSlot.id,
              targetZoneId: targetSlot.zoneId,
              targetBay: targetSlot.bay,
              targetRow: targetSlot.row,
              tractorId: tractorId,
              status: 'PENDING_SUPPORT',
              currentIndex: 0,
              progress: 0
            };
            enqueueTask(supportTask);
            if (broadcasters?.broadcastTaskAdded) broadcasters.broadcastTaskAdded(externalTractor);
          }
        }
    } catch (err) {
        console.error("Lỗi khi điều phối:", err);
        alert("Có lỗi xảy ra khi tính toán đường đi. Vuyên lòng thử lại!");
    } finally {
        setIsProcessing(false);
    }
  };

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ 
      position: 'absolute', 
      top: 0, 
      right: 0, 
      zIndex: 1000, 
      background: isOpen ? 'linear-gradient(145deg, rgba(15, 23, 42, 0.97) 0%, rgba(30, 41, 59, 0.97) 100%)' : 'linear-gradient(145deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRight: 'none',
      padding: isOpen ? '16px 20px 24px 20px' : '0', 
      borderRadius: '16px 0 0 16px', 
      boxShadow: '-6px 0 30px rgba(0,0,0,0.4)', 
      width: isOpen ? '380px' : '48px', 
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', 
      height: '100%',
      boxSizing: 'border-box',
      display: 'flex', 
      flexDirection: 'column', 
      transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      color: '#f8fafc',
      overflowX: 'hidden',
      overflowY: isOpen ? 'auto' : 'hidden'
    }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          cursor: 'pointer', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: isOpen ? 'auto' : '100%',
          paddingBottom: isOpen ? '12px' : '0', 
          borderBottom: isOpen ? '1px solid rgba(255,255,255,0.05)' : 'none', 
          marginBottom: isOpen ? '16px' : '0',
          writingMode: isOpen ? 'horizontal-tb' : 'vertical-rl',
          textOrientation: isOpen ? 'mixed' : 'mixed',
          whiteSpace: 'nowrap'
        }}
      >
        {isOpen ? (
          <>
            <h2 style={{ fontSize: '0.95rem', fontWeight: '600', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' }}>
              <span style={{ color: '#38bdf8' }}>⚡</span> ĐIỀU PHỐI <span style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>{activeTasks.length}</span>
              <span style={{ marginLeft: 'auto', fontSize: '18px', opacity: 0.5 }}>✕</span>
            </h2>
          </>
        ) : (
          <span style={{ fontSize: '0.8rem', fontWeight: '600', letterSpacing: '0.1em', color: '#38bdf8', padding: '12px 0' }}>⚡ ĐIỀU PHỐI ({activeTasks.length})</span>
        )}
      </div>
      
      {isOpen && (
        <>
          <form onSubmit={handleBulkSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px' }}>
            
            <div style={{ display: 'flex', gap: '8px', padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ flex: 1, padding: '8px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Đang chạy</span>
                <span style={{ fontSize: '18px', fontWeight: '700', color: '#38bdf8' }}>{activeTasks.length}</span>
              </div>
              <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
              <div style={{ flex: 1, padding: '8px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Hàng đợi</span>
                <span style={{ fontSize: '18px', fontWeight: '700', color: '#fbbf24' }}>{pendingTasks.length}</span>
              </div>
            </div>

            {/* Task Type Switcher */}
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div 
                onClick={() => setTaskType('INBOUND')}
                style={{ flex: 1, textAlign: 'center', padding: '8px 0', cursor: 'pointer', borderRadius: '8px', background: taskType === 'INBOUND' ? 'rgba(56, 189, 248, 0.15)' : 'transparent', color: taskType === 'INBOUND' ? '#38bdf8' : '#94a3b8', fontWeight: taskType === 'INBOUND' ? '600' : '500', transition: 'all 0.2s' }}
              >
                Nhập Bãi (Inbound)
              </div>
              <div 
                onClick={() => setTaskType('OUTBOUND')}
                style={{ flex: 1, textAlign: 'center', padding: '8px 0', cursor: 'pointer', borderRadius: '8px', background: taskType === 'OUTBOUND' ? 'rgba(56, 189, 248, 0.15)' : 'transparent', color: taskType === 'OUTBOUND' ? '#38bdf8' : '#94a3b8', fontWeight: taskType === 'OUTBOUND' ? '600' : '500', transition: 'all 0.2s' }}
              >
                Xuất Bãi (Outbound)
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Kích cỡ</label>
                <select value={size} onChange={(e) => setSize(Number(e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.2)', color: '#f8fafc', outline: 'none', cursor: 'pointer', appearance: 'none' }}>
                  <option value={20} style={{ background: '#1e293b' }}>20 ft</option>
                  <option value={40} style={{ background: '#1e293b' }}>40 ft</option>
                </select>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Loại hàng</label>
                <select value={cargoType} onChange={(e) => setCargoType(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.2)', color: '#f8fafc', outline: 'none', cursor: 'pointer', appearance: 'none' }}>
                  <option value="DRY" style={{ background: '#1e293b' }}>Hàng Khô (DRY)</option>
                  <option value="REEFER" style={{ background: '#1e293b' }}>Hàng Lạnh (REEFER)</option>
                  <option value="FLAMMABLE" style={{ background: '#1e293b' }}>Dễ Cháy (FLAMMABLE)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
               <label style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Số lượng xe điều động</span>
                  <span style={{ color: '#38bdf8' }}>Max 20</span>
               </label>
               <input type="number" min="1" max="20" value={quantity} onChange={(e) => setQuantity(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.2)', color: '#f8fafc', outline: 'none' }} required />
            </div>

            <button type="submit" disabled={isProcessing} style={{ padding: '12px', borderRadius: '10px', border: 'none', background: isProcessing ? 'rgba(255,255,255,0.1)' : 'linear-gradient(90deg, #0284c7 0%, #2563eb 100%)', color: isProcessing ? '#94a3b8' : 'white', fontWeight: '600', fontSize: '14px', cursor: isProcessing ? 'not-allowed' : 'pointer', marginTop: '4px', transition: 'all 0.2s', boxShadow: isProcessing ? 'none' : '0 4px 12px rgba(37, 99, 235, 0.3)' }}>
              {isProcessing ? 'ĐANG PHÂN LUỒNG...' : 'PHÁT LỆNH ĐIỀU PHỐI'}
            </button>
          </form>

          <div style={{ marginTop: '24px', flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
            <h3 style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tiến độ luồng xe ({activeTasks.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {activeTasks.map(task => (
                <div key={task.id} style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '600', color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: task.status === 'HANDLING' ? '#fbbf24' : '#10b981', boxShadow: `0 0 8px ${task.status === 'HANDLING' ? '#fbbf24' : '#10b981'}` }}></span>
                      {task.truckPlate}
                    </span>
                    <span style={{ color: '#cbd5e1', fontWeight: '500', backgroundColor: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: '12px', fontSize: '11px' }}>{task.size}ft {task.cargoType}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ textTransform: 'capitalize' }}>{task.status.replace(/_/g, ' ')}</span>
                    <span style={{ fontWeight: '600', color: '#38bdf8' }}>{Math.round(task.progress)}%</span>
                  </div>
                  <div style={{ height: '4px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: 'linear-gradient(90deg, #38bdf8 0%, #818cf8 100%)', width: `${task.progress}%`, transition: 'width 0.2s linear', borderRadius: '2px' }}></div>
                  </div>
                </div>
              ))}
              {activeTasks.length === 0 && (
                <div style={{ textAlign: 'center', padding: '30px 0', color: '#64748b', fontStyle: 'italic', fontSize: '13px', background: 'rgba(0,0,0,0.1)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                  Hệ thống đang chờ lệnh...
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
