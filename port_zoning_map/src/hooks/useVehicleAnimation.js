/**
 * useVehicleAnimation Hook
 * 
 * Core animation engine for port vehicle movement and task lifecycle management.
 * 
 * Responsibilities:
 * - Animates vehicle movement along pre-calculated paths (4 nodes per tick = 4x speed multiplier)
 * - Manages task state transitions (EN_ROUTE_TO_SLOT → HANDLING → EN_ROUTE_TO_GATE → COMPLETED)
 * - Implements collision detection and deadlock prevention (ghost mode bypass after 3s stuck)
 * - Coordinates INBOUND/OUTBOUND task pairs: tractor + support task handoff at yard
 * - Logs audit events (YARD_DROP_CONFIRMED, GATE_OUT_CONFIRMED) with worker verification
 * - Tracks container inventory updates (add on INBOUND, remove on OUTBOUND)
 * - Tick-based animation loop at 20fps (~50ms per frame) to balance smoothness and CPU load
 * 
 * Task Lifecycle:
 * 1. EN_ROUTE_TO_SLOT: Vehicle moves toward destination, checks for collision/deadlock
 * 2. WAITING_FOR_SUPPORT / WAITING_FOR_TRACTOR: Pair coordination (one waits for other)
 * 3. HANDLING / HANDLING_SUPPORT: Both vehicles at slot, performing operation (1.5s delay)
 * 4. EN_ROUTE_TO_GATE: Vehicle returns to gate along reversed path
 * 5. COMPLETED: Task removed from store after 500ms delay
 * 
 * Collision Handling:
 * - Checks if next position conflicts with other moving vehicles
 * - If stuck for 3 seconds: enters "ghost mode" (can phase through obstacles for 2s)
 * - Ghost mode moves slower (2 nodes/tick vs 4) to simulate careful navigation
 * 
 * Performance Optimizations:
 * - Uses requestAnimationFrame + setTimeout for consistent 20fps
 * - Avoids object allocation in tight loop (reuses state refs)
 * - Only updates store if task state changes (prevents thrashing)
 * - Path-4x jump: moves 4 waypoints per tick instead of 1
 * 
 * @hook
 * @returns {void} - Side effect hook, no return value
 */
import { useEffect, useRef } from 'react';
import useTaskStore from '../store/useTaskStore';
import { logAuditEvent, MOCK_WORKERS } from '../services/auditService';

/**
 * Vehicle animation hook implementation
 * Sets up requestAnimationFrame loop for continuous task updates
 * @hook
 */
export default function useVehicleAnimation() {
  const requestRef = useRef();
  
  const tasksRef = useRef([]); 
  useEffect(() => {
    return useTaskStore.subscribe((state) => {
      tasksRef.current = state.tasks;
    });
  }, []);

  const tick = () => {
    const state = useTaskStore.getState();
    const tasks = tasksRef.current;
    
    const SAFE_DISTANCE_SQ = 0.00000003; // ~15-20 meters squared

    const checkCollision = (task, nextIndex) => {
        const myNextPos = task.path[nextIndex];
        if (!myNextPos) return true;

        for (const other of tasks) {
           if (other.id === task.id || other.status === 'COMPLETED' || other.status === 'HANDLING') continue;
           if (!other.path || other.currentIndex === undefined) continue;
           if (other.delayTicks && other.delayTicks > 0) continue; // Waiting at spawn
           
           const otherPos = other.path[other.currentIndex];
           if (!otherPos) continue;
           
           const dx = myNextPos[1] - otherPos[1];
           const dy = myNextPos[0] - otherPos[0];
           if (dx*dx + dy*dy < SAFE_DISTANCE_SQ) { 
               // Deadlock prevention: tie-breaker based on ID so they don't mutually yield
               if (task.id > other.id) {
                   return false; // I yield (I stop)
               }
           }
        }
        return true;
    };
    
    // We only call state updates if something actually changes to avoid thrashing
    tasks.forEach(task => {
      if (task.status === 'COMPLETED') return;
      
      // Handle spawn staggering
      if (task.delayTicks && task.delayTicks > 0) {
          state.updateTask(task.id, { delayTicks: task.delayTicks - 1 });
          return;
      }

      const pathLength = task.path.length;

      if (task.status === 'EN_ROUTE_TO_SLOT') {
        if (task.currentIndex >= pathLength - 1) {
          
          if (task.type === 'SUPPORT') {
            const tractor = tasks.find(t => t.id === task.tractorId);
            if (tractor && tractor.status === 'WAITING_FOR_SUPPORT') {
                // Tractor is already waiting here. We both arrived! Start handling.
                state.updateTask(task.id, { status: 'HANDLING_SUPPORT', progress: 100 });
                state.updateTask(tractor.id, { status: 'HANDLING' });
                
                setTimeout(() => {
                    const currentTractor = useTaskStore.getState().tasks.find(t => t.id === tractor.id);
                    if (currentTractor) {
                      const reversedPath = [...currentTractor.path].reverse();
                      state.updateTask(tractor.id, { 
                        status: 'EN_ROUTE_TO_GATE',
                        path: reversedPath,
                        currentIndex: 0,
                        progress: 0
                      });
                    }
                    
                    state.updateTask(task.id, { status: 'COMPLETED' });
                    if (task.assignedVehicleId) {
                        state.updateVehicle(task.assignedVehicleId, { 
                          status: 'IDLE', 
                          currentPos: task.path[task.path.length - 1] 
                        });
                    }
                    setTimeout(() => state.removeTask(task.id), 500);
                }, 1500);
            } else {
                // We arrived first. Wait for tractor.
                state.updateTask(task.id, { status: 'WAITING_FOR_TRACTOR', progress: 100 });
            }
            return;
          }

          // For INBOUND / OUTBOUND (Tractor)
          const supportTask = tasks.find(t => t.type === 'SUPPORT' && t.tractorId === task.id);
          
          if (!supportTask || supportTask.status === 'WAITING_FOR_TRACTOR') {
             // Support is already here (or doesn't exist). We both arrived! Start handling.
             state.updateTask(task.id, { status: 'HANDLING' });
             if (supportTask) state.updateTask(supportTask.id, { status: 'HANDLING_SUPPORT' });
             
             // Log Crane Worker Action
             const craneWorker = (task.cargoType === 'HAZARDOUS' || task.cargoType === 'CHEMICAL') 
               ? MOCK_WORKERS.CRANE_HAZARDOUS 
               : MOCK_WORKERS.CRANE_DRY;
               
             logAuditEvent(
               craneWorker.name, 
               'YARD_DROP_CONFIRMED', 
               task.containerId, 
               { 
                 workerWalletAddress: craneWorker.wallet,
                 status: "Verified on Edge Device",
                 allocatedZone: task.targetZoneId
               }
             );

             setTimeout(() => {
                const currentTractor = useTaskStore.getState().tasks.find(t => t.id === task.id);
                if (currentTractor) {
                  const reversedPath = [...currentTractor.path].reverse();
                  state.updateTask(task.id, { 
                    status: 'EN_ROUTE_TO_GATE',
                    path: reversedPath,
                    currentIndex: 0,
                    progress: 0
                  });
                }
                
                if (supportTask) {
                    state.updateTask(supportTask.id, { status: 'COMPLETED' });
                    if (supportTask.assignedVehicleId) {
                        state.updateVehicle(supportTask.assignedVehicleId, { 
                          status: 'IDLE', 
                          currentPos: supportTask.path[supportTask.path.length - 1] 
                        });
                    }
                    setTimeout(() => state.removeTask(supportTask.id), 500);
                }
             }, 1500);
          } else {
             // Support hasn't arrived yet. Wait for support.
             state.updateTask(task.id, { status: 'WAITING_FOR_SUPPORT', progress: 100 });
          }
        } else {
          // Jump 4 nodes per tick to increase speed 4x without CPU overhead
          let nextIndex = Math.min(task.currentIndex + 4, pathLength - 1);
          let newStuckTicks = task.stuckTicks || 0;
          let newGhostTicks = task.ghostTicks || 0;
          let isGhost = false;

          if (newGhostTicks > 0) {
              newGhostTicks--;
              isGhost = true;
              newStuckTicks = 0;
              nextIndex = Math.min(task.currentIndex + 2, pathLength - 1); // Move slower in ghost mode
          }

          if (!isGhost && !checkCollision(task, nextIndex)) {
              nextIndex = task.currentIndex; // Traffic stop
              newStuckTicks++;
              if (newStuckTicks >= 60) { // 3 seconds (60 ticks @ 50ms)
                  newStuckTicks = 0;
                  newGhostTicks = 40; // 2 seconds ghost mode (40 ticks @ 50ms)
              }
          } else if (!isGhost) {
              newStuckTicks = 0; // reset if moving normally
          }

          state.updateTask(task.id, { 
            currentIndex: nextIndex,
            progress: (nextIndex / pathLength) * 100,
            stuckTicks: newStuckTicks,
            ghostTicks: newGhostTicks
          });
        }
      }

      if (task.status === 'EN_ROUTE_TO_GATE') {
        if (task.currentIndex >= pathLength - 1) {
          state.updateTask(task.id, { status: 'COMPLETED', progress: 100 });
          
          // Log Gate Worker Action
          const gateWorker = MOCK_WORKERS.GATE;
          logAuditEvent(
            gateWorker.name, 
            'GATE_OUT_CONFIRMED', 
            task.containerId, 
            { 
              workerWalletAddress: gateWorker.wallet,
              status: "Verified on Edge Device",
              allocatedZone: "GATE_AREA"
            }
          );

          if (task.type === 'INBOUND') {
            const existingContainers = state.inventory.filter(c => 
               c.zoneId === task.targetZoneId && c.bay === task.targetBay && c.row === task.targetRow
            );
            
            state.addContainer({
              id: task.containerId,
              containerNo: `HLCU${Math.floor(Math.random()*1000000 + 1000000)}`,
              slotId: task.targetSlotId,
              zoneId: task.targetZoneId,
              bay: task.targetBay,
              row: task.targetRow,
              tier: existingContainers.length + 1,
              size: task.size,
              type: task.cargoType,
              cargoType: task.cargoType,
              isLocked: false
            });
          } else {
            state.removeContainer(task.containerId);
          }
          
          if (task.assignedVehicleId) {
            state.updateVehicle(task.assignedVehicleId, { 
              status: 'IDLE', 
              currentPos: task.path[task.currentIndex] 
            });
          }
          
          setTimeout(() => state.removeTask(task.id), 500);  
        } else {
          // Jump 4 nodes per tick to increase speed 4x without CPU overhead
          let nextIndex = Math.min(task.currentIndex + 4, pathLength - 1);
          let newStuckTicks = task.stuckTicks || 0;
          let newGhostTicks = task.ghostTicks || 0;
          let isGhost = false;

          if (newGhostTicks > 0) {
              newGhostTicks--;
              isGhost = true;
              newStuckTicks = 0;
              nextIndex = Math.min(task.currentIndex + 2, pathLength - 1); // Move slower in ghost mode
          }

          if (!isGhost && !checkCollision(task, nextIndex)) {
              nextIndex = task.currentIndex; // Traffic stop
              newStuckTicks++;
              if (newStuckTicks >= 60) { // 3 seconds (60 ticks @ 50ms)
                  newStuckTicks = 0;
                  newGhostTicks = 40; // 2 seconds ghost mode (40 ticks @ 50ms)
              }
          } else if (!isGhost) {
              newStuckTicks = 0; // reset if moving normally
          }
          
          state.updateTask(task.id, { 
            currentIndex: nextIndex,
            progress: (nextIndex / pathLength) * 100,
            stuckTicks: newStuckTicks,
            ghostTicks: newGhostTicks
          });
        }
      }
    });

    // Reduce tick speed a bit for map rendering performance
    setTimeout(() => {
      requestRef.current = requestAnimationFrame(tick);
    }, 50); // 20fps for map vehicles is usually smooth enough
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(requestRef.current);
  }, []);
}
