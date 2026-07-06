import { useEffect, useRef } from 'react';
import useTaskStore from '../store/useTaskStore';

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
    
    // We only call state updates if something actually changes to avoid thrashing
    tasks.forEach(task => {
      if (task.status === 'COMPLETED') return;

      const pathLength = task.path.length;

      if (task.status === 'EN_ROUTE_TO_SLOT') {
        if (task.currentIndex >= pathLength - 1) {
          state.updateTask(task.id, { status: 'HANDLING' });
          setTimeout(() => {
            const currentTask = useTaskStore.getState().tasks.find(t => t.id === task.id);
            if (currentTask) {
              const reversedPath = [...currentTask.path].reverse();
              state.updateTask(task.id, { 
                status: 'EN_ROUTE_TO_GATE',
                path: reversedPath,
                currentIndex: 0,
                progress: 0
              });
            }
          }, 1500); // Reduce handling time from 3s to 1.5s
        } else {
          // Jump 4 nodes per tick to increase speed 4x without CPU overhead
          const nextIndex = Math.min(task.currentIndex + 4, pathLength - 1);
          state.updateTask(task.id, { 
            currentIndex: nextIndex,
            progress: (nextIndex / pathLength) * 100
          });
        }
      }

      if (task.status === 'EN_ROUTE_TO_GATE') {
        if (task.currentIndex >= pathLength - 1) {
          state.updateTask(task.id, { status: 'COMPLETED', progress: 100 });
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
          
          const currentState = useTaskStore.getState();
          if (currentState.broadcasters?.broadcastInventorySync) {
            currentState.broadcasters.broadcastInventorySync(currentState.inventory);
          }
          
          setTimeout(() => state.removeTask(task.id), 500); 
        } else {
          // Jump 4 nodes per tick to increase speed 4x without CPU overhead
          const nextIndex = Math.min(task.currentIndex + 4, pathLength - 1);
          state.updateTask(task.id, { 
            currentIndex: nextIndex,
            progress: (nextIndex / pathLength) * 100
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
