import { create } from 'zustand';

const useTaskStore = create((set, get) => ({
  inventory: [],
  tasks: [],
  slots: [],
  gates: [],
  storageZones: [],
  portBoundary: null,
  broadcasters: null,

  setBroadcasters: (broadcasters) => set({ broadcasters }),
  setSlots: (slots) => set({ slots }),
  setGates: (gates) => set({ gates }),
  setStorageZones: (storageZones) => set({ storageZones }),
  setPortBoundary: (portBoundary) => set({ portBoundary }),

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
