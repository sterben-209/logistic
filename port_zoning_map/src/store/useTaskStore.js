import { create } from 'zustand';

const useTaskStore = create((set, get) => ({
  inventory: [],
  tasks: [],
  slots: [],
  gates: [],
  storageZones: [],
  portBoundary: null,

  fleetRegistry: [], // Permanent list of vehicles (AGV, RTG, Reach Stacker)
  taskQueue: [], // Pending tasks waiting for vehicles

  setSlots: (slots) => set({ slots }),
  setGates: (gates) => set({ gates }),
  setStorageZones: (storageZones) => set({ storageZones }),
  setPortBoundary: (portBoundary) => set({ portBoundary }),
  setFleetRegistry: (fleetRegistry) => set({ fleetRegistry }),

  // --- ACTIONS CHO FLEET ---
  addVehicle: (vehicle) => set((state) => ({
    fleetRegistry: [...state.fleetRegistry, vehicle]
  })),
  removeVehicle: (vehicleId) => set((state) => ({
    fleetRegistry: state.fleetRegistry.filter(v => v.id !== vehicleId)
  })),
  updateVehicle: (vehicleId, updates) => set((state) => ({
    fleetRegistry: state.fleetRegistry.map(v => v.id === vehicleId ? { ...v, ...updates } : v)
  })),

  // --- ACTIONS CHO TASK QUEUE ---
  enqueueTask: (task) => set((state) => ({
    taskQueue: [...state.taskQueue, task]
  })),
  dequeueTask: (taskId) => set((state) => ({
    taskQueue: state.taskQueue.filter(t => t.id !== taskId)
  })),

  // --- ACTIONS CHO TASKS ---
  addTask: (task) => set((state) => ({ 
    tasks: [...state.tasks, task] 
  })),

  updateTask: (taskId, updates) => set((state) => ({
    tasks: state.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
  })),

  removeTask: (taskId) => set((state) => ({
    tasks: state.tasks.filter(t => t.id !== taskId)
  })),

  // --- ACTIONS CHO INVENTORY ---
  lockContainer: (containerId) => set((state) => ({
    inventory: state.inventory.map(c => 
      c.id === containerId ? { ...c, isLocked: true } : c
    )
  })),

  addContainer: (container) => set((state) => ({
    inventory: [...state.inventory, container]
  })),

  removeContainer: (containerId) => set((state) => ({
    inventory: state.inventory.filter(c => c.id !== containerId)
  })),

  setInventory: (inventory) => set({ inventory })
}));

export default useTaskStore;
