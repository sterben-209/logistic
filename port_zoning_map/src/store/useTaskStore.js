import { create } from 'zustand';

/**
 * useTaskStore
 * 
 * Global state management store for the port logistics system.
 * Manages all application state including inventory, tasks, infrastructure, and vehicle fleet.
 * 
 * State includes:
 * - inventory: Array of containers in the port
 * - tasks: Array of active port operations/tasks
 * - slots: Storage slot definitions
 * - gates: Port gate definitions
 * - storageZones: Zone definitions and configurations
 * - portBoundary: Geographic boundary of the port
 * - fleetRegistry: Permanent list of vehicles (AGVs, RTGs, Reach Stackers)
 * - taskQueue: Queue of pending tasks awaiting vehicle assignment
 * 
 * @returns {Object} Zustand store with state and action methods
 */
const useTaskStore = create((set, get) => ({
  // --- STATE ---
  inventory: [],
  tasks: [],
  slots: [],
  gates: [],
  storageZones: [],
  portBoundary: null,

  fleetRegistry: [], // Permanent list of vehicles (AGV, RTG, Reach Stacker)
  taskQueue: [], // Pending tasks waiting for vehicles

  // --- SETTERS FOR MAP/INFRASTRUCTURE ---
  /** Set the available storage slots */
  setSlots: (slots) => set({ slots }),
  /** Set the port gate definitions */
  setGates: (gates) => set({ gates }),
  /** Set the storage zone definitions */
  setStorageZones: (storageZones) => set({ storageZones }),
  /** Set the geographic boundary of the port */
  setPortBoundary: (portBoundary) => set({ portBoundary }),
  /** Set the complete vehicle fleet */
  setFleetRegistry: (fleetRegistry) => set({ fleetRegistry }),

  // --- FLEET MANAGEMENT ACTIONS ---
  /** Add a new vehicle to the fleet */
  addVehicle: (vehicle) => set((state) => ({
    fleetRegistry: [...state.fleetRegistry, vehicle]
  })),
  /** Remove a vehicle from the fleet */
  removeVehicle: (vehicleId) => set((state) => ({
    fleetRegistry: state.fleetRegistry.filter(v => v.id !== vehicleId)
  })),
  /** Update vehicle properties */
  updateVehicle: (vehicleId, updates) => set((state) => ({
    fleetRegistry: state.fleetRegistry.map(v => v.id === vehicleId ? { ...v, ...updates } : v)
  })),

  // --- TASK QUEUE MANAGEMENT ACTIONS ---
  /** Add a task to the pending queue */
  enqueueTask: (task) => set((state) => ({
    taskQueue: [...state.taskQueue, task]
  })),
  /** Remove a task from the pending queue */
  dequeueTask: (taskId) => set((state) => ({
    taskQueue: state.taskQueue.filter(t => t.id !== taskId)
  })),

  // --- TASK MANAGEMENT ACTIONS ---
  /** Add a new task to the task list */
  addTask: (task) => set((state) => ({ 
    tasks: [...state.tasks, task] 
  })),

  /** Update task properties */
  updateTask: (taskId, updates) => set((state) => ({
    tasks: state.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
  })),

  /** Remove a task from the task list */
  removeTask: (taskId) => set((state) => ({
    tasks: state.tasks.filter(t => t.id !== taskId)
  })),

  // --- INVENTORY MANAGEMENT ACTIONS ---
  /** Lock a container to prevent modifications */
  lockContainer: (containerId) => set((state) => ({
    inventory: state.inventory.map(c => 
      c.id === containerId ? { ...c, isLocked: true } : c
    )
  })),

  /** Add a new container to inventory */
  addContainer: (container) => set((state) => ({
    inventory: [...state.inventory, container]
  })),

  /** Remove a container from inventory */
  removeContainer: (containerId) => set((state) => ({
    inventory: state.inventory.filter(c => c.id !== containerId)
  })),

  /** Replace entire inventory (used for batch updates) */
  setInventory: (inventory) => set({ inventory })
}));

export default useTaskStore;
