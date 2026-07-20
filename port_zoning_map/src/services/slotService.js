/**
 * findBestSlot
 * 
 * Algorithm to find the optimal slot for placing a cargo/container.
 * 
 * Process:
 * 1. Determines valid storage zones based on cargo type (explicit allowedCargo or fallback to zoneType)
 * 2. Pre-indexes inventory by slot ID for O(1) lookup performance
 * 3. Filters valid slots based on:
 *    - Zone compatibility
 *    - Bay capacity (max 5 tiers per bay)
 *    - Stacking constraints (size/weight compatibility)
 *    - Adjacent bay checks for 40ft containers
 * 4. Scores remaining slots based on weight distribution and cargo clustering
 * 5. Returns the highest-scoring slot for optimal space utilization
 * 
 * @param {Object} cargoInfo - Cargo details { size, weight, cargoType }
 * @param {Array} slots - Available storage slots
 * @param {Array} storageZones - Zone definitions with type and allowed cargo
 * @param {Array} inventory - Current container inventory
 * @returns {Object|null} Best slot object or null if no valid slots available
 */
export const findBestSlot = (cargoInfo, slots, storageZones, inventory) => {
  const { size, weight, cargoType } = cargoInfo;
  
  // 1. Tìm các khu vực ưu tiên có ghi rõ loại hàng hóa (vd: TANK_ADJACENT, WAREHOUSE)
  let validZoneIds = [];
  const explicitZones = storageZones.filter(z => z.allowedCargo && z.allowedCargo.includes(cargoType));
  
  if (explicitZones.length > 0) {
      validZoneIds = explicitZones.map(z => z.id);
  } else {
      // 2. Fallback sang logic zoneType mặc định
      let targetZoneType = 'YARD';
      if (cargoType === 'FLAMMABLE' || cargoType === 'CHEMICAL') targetZoneType = 'DANGEROUS';
      else if (cargoType === 'REEFER') targetZoneType = 'REEFER';

      const matchingZones = storageZones.filter(z => z.zoneType === targetZoneType);
      validZoneIds = matchingZones.map(z => z.id);
      
      // Fallback nếu không có zone chuyên dụng nào
      if (validZoneIds.length === 0) {
          const generalZones = storageZones.filter(z => z.zoneType === 'YARD' || z.zoneType === 'GENERAL');
          validZoneIds = generalZones.map(z => z.id);
      }
  }
  
  // If still no zones, use all zones that are not ROAD
  if (validZoneIds.length === 0) {
      validZoneIds = storageZones.map(z => z.id);
  }

  // Pre-index inventory to drastically improve performance (O(N) instead of O(N*M))
  const slotInventoryMap = {};
  inventory.forEach(c => {
     const cBay = parseInt(c.bay, 10);
     const contIs40 = parseInt(c.size, 10) === 40 || String(c.size).includes('40');
     
     const addCont = (bayNum) => {
        const key = `${c.zoneId}-${String(bayNum).padStart(2, '0')}-${c.row}`;
        if (!slotInventoryMap[key]) slotInventoryMap[key] = [];
        slotInventoryMap[key].push(c);
     };

     if (contIs40) {
        const isEven = cBay % 2 === 0;
        if (isEven) {
           addCont(cBay - 1);
           addCont(cBay + 1);
        } else {
           addCont(cBay);
           addCont(cBay + 2);
        }
     } else {
        addCont(cBay);
     }
  });

  const getContainersInSlot = (slot) => {
      const conts = slotInventoryMap[slot.id] || [];
      // Clone array before sorting to avoid mutating the map
      return [...conts].sort((a, b) => a.tier - b.tier);
  };

  const newSizeNum = parseInt(size, 10) === 40 || String(size).includes('40') ? 40 : 20;

  // 2. Filter valid slots
  const validSlots = slots.filter(slot => {
     if (!validZoneIds.includes(slot.zoneId)) return false;
     
     const bayNum = parseInt(slot.bay, 10);
     const capacity = 5; // Default to 5 tiers
     
     const containers = getContainersInSlot(slot);
     if (containers.length >= capacity) return false;
     
     // Stacking constraints function
     const checkStacking = (conts) => {
         if (conts.length === 0) return true;
         const topCont = conts[conts.length - 1];
         if (topCont.size !== newSizeNum) return false;
         const newWeight = parseInt(weight) || 20;
         const topWeight = parseInt(topCont.weight) || 20;
         if (newWeight > topWeight) return false;
         return true;
     };

     if (!checkStacking(containers)) return false;

     if (newSizeNum === 40) {
         // For 40ft, MUST also check the adjacent bay (bayNum + 2)
         const adjacentBayStr = String(bayNum + 2).padStart(2, '0');
         const adjacentSlotId = `${slot.zoneId}-${adjacentBayStr}-${slot.row}`;
         const adjacentSlot = slots.find(s => s.id === adjacentSlotId);
         
         if (!adjacentSlot) return false; // Cannot place at the edge
         
         const adjacentContainers = getContainersInSlot(adjacentSlot);
         if (adjacentContainers.length >= capacity) return false;
         if (!checkStacking(adjacentContainers)) return false;
     }
     
     return true;
  });

  // 3. Scoring
  if (validSlots.length === 0) return null; // No valid slots available at all!

  const scoredSlots = validSlots.map(slot => {
     let score = 0;
     const containers = getContainersInSlot(slot);
     const newWeight = parseInt(weight) || 20;
     
     // Bonus for placing heavy containers on empty slots
     if (newWeight >= 25 && containers.length === 0) {
         score += 100;
     }
     
     // Bonus for clustering (stacking same cargo type/size)
     if (containers.length > 0) {
         const topCont = containers[containers.length - 1];
         if (topCont.type === cargoType || topCont.cargoType === cargoType) {
            score += 50;
         }
         // Penalize stacking very light containers on heavy containers unnecessarily
         const topWeight = parseInt(topCont.weight) || 20;
         score += (topWeight - newWeight);
     }
     
     // Deterministic tie-breaker based on slot ID to distribute load consistently across reloads
     let idHash = 0;
     for (let i = 0; i < slot.id.length; i++) {
        idHash = (idHash * 31 + slot.id.charCodeAt(i)) % 100;
     }
     score += (idHash / 10);
     
     return { slot, score };
  });

  // Sort descending by score
  scoredSlots.sort((a, b) => b.score - a.score);
  return scoredSlots[0].slot;
};

/**
 * findContainerToExport
 * 
 * Finds a container matching the export criteria that's accessible (at or near the top).
 * 
 * Process:
 * 1. Groups inventory by slot to identify stacks
 * 2. Pre-indexes slots by location key for fast lookup
 * 3. Searches each slot for a matching container (prioritizes those closest to top)
 * 4. Filters out containers already pending export
 * 5. Returns deterministic result (sorted by slot ID) to ensure consistency across page reloads
 * 
 * @param {Object} cargoInfo - Export criteria { size, cargoType }
 * @param {Array} inventory - Current container inventory
 * @param {Array} slots - Available storage slots
 * @param {Set} pendingExportsSet - Set of container IDs already scheduled for export
 * @returns {Object|null} Object with slot and container properties, or null if no match found
 */
export const findContainerToExport = (cargoInfo, inventory, slots, pendingExportsSet = new Set()) => {
  const { size, cargoType } = cargoInfo;
  const targetSize = parseInt(size, 10) || (String(size).includes('40') ? 40 : 20);

  // We want to find a slot that has a matching container at the very TOP (highest tier)
  // so we don't have to dig.
  
  // 1. Group inventory by slot (zoneId, row, bay)
  const slotMap = {};
  inventory.forEach(c => {
     const key = `${c.zoneId}|${c.bay}|${c.row}`;
     if (!slotMap[key]) slotMap[key] = [];
     slotMap[key].push(c);
  });

  // Pre-index slots to avoid O(K*M) lookups
  const slotsDict = {};
  slots.forEach(s => {
      const key = `${s.zoneId}|${String(s.bay).padStart(2, '0')}|${String(s.row)}`;
      slotsDict[key] = s;
  });

  // 2. Filter slots that have a matching container (not just the top one)
  const candidates = [];
  Object.keys(slotMap).forEach(key => {
     // Sort descending by tier (top to bottom)
     const containers = slotMap[key].sort((a, b) => b.tier - a.tier);
     
     let foundCont = null;
     for (let i = 0; i < containers.length; i++) {
         const c = containers[i];
         const cId = c.containerNo || c.id;
         if (pendingExportsSet.has(cId)) continue;
         
         const contSizeNum = parseInt(c.size, 10) || (String(c.size).includes('40') ? 40 : 20);
         // Check if container matches criteria
         if (contSizeNum === targetSize && (c.type === cargoType || c.cargoType === cargoType || c.type === 'GENERAL')) {
             foundCont = c;
             break;
         }
     }
     
     if (foundCont) {
         const contSizeNum = parseInt(foundCont.size, 10) || (String(foundCont.size).includes('40') ? 40 : 20);
         const [zoneId, bay, row] = key.split('|');
         let matchBay = String(bay).padStart(2, '0');
         if (contSizeNum === 40 && parseInt(bay, 10) % 2 === 0) {
             matchBay = String(parseInt(bay, 10) - 1).padStart(2, '0');
         }
         
         const slotKey = `${zoneId}|${matchBay}|${String(row)}`;
         const slot = slotsDict[slotKey];
         if (slot) {
             candidates.push({ slot, container: foundCont });
         }
     }
  });

  if (candidates.length === 0) return null;

  // Make selection deterministic by sorting candidates by slot ID
  candidates.sort((a, b) => a.slot.id.localeCompare(b.slot.id));
  
  // Always pick the first one in the sorted list to ensure the same behavior after F5
  return candidates[0];
};

/**
 * calculateNewTier
 * 
 * Calculates the tier (vertical stack position) for a new container placement.
 * 
 * Logic:
 * - For 40ft containers: Occupies two adjacent bays, finds overlapping containers on the even bay
 * - For 20ft containers: Occupies single bay, finds all overlapping containers (including those from 40ft stacks)
 * - Returns one tier above the highest overlapping container
 * 
 * @param {String} zoneName - Zone ID where container will be placed
 * @param {Number} bay - Bay number (column position)
 * @param {Number} row - Row number (position in zone)
 * @param {Number|String} size - Container size (20 or 40 feet)
 * @param {Array} inventory - Current container inventory
 * @returns {Number} New tier value for placement (1-5 typically)
 */
export const calculateNewTier = (zoneName, bay, row, size, inventory) => {
    const baseBay = parseInt(bay, 10);
    const sizeNum = parseInt(size, 10) || (String(size).includes('40') ? 40 : 20);
    
    let overlappingCount = 0;
    
    // We check all containers in the same zone and row to find overlapping tiers
    const sameZoneRow = inventory.filter(c => c.zoneId === zoneName && c.row === row);
    
    if (sizeNum === 40) {
        // A 40ft container dropped at an odd baseBay occupies baseBay and baseBay + 2 (logically saved at baseBay + 1)
        const evenBay = baseBay + 1;
        
        let maxTier = 0;
        sameZoneRow.forEach(c => {
            const cBay = parseInt(c.bay, 10);
            const contIs40 = parseInt(c.size, 10) === 40 || String(c.size).includes('40');
            let isOverlap = false;
            if (contIs40) {
                // Another 40ft container overlaps if it's on the same even bay
                isOverlap = (cBay === evenBay) || (cBay % 2 === 0 && (cBay === evenBay - 2 || cBay === evenBay + 2)); // Actually 40ft only overlaps if on exactly the same even bay, wait, if cBay is evenBay, yes.
                if (cBay === evenBay) isOverlap = true;
            } else {
                // A 20ft container overlaps if it's on baseBay or baseBay + 2
                isOverlap = (cBay === baseBay || cBay === baseBay + 2);
            }
            if (isOverlap && parseInt(c.tier, 10) > maxTier) {
                maxTier = parseInt(c.tier, 10);
            }
        });
        return maxTier + 1;
    } else {
        // A 20ft container dropped at baseBay occupies only baseBay
        let maxTier = 0;
        sameZoneRow.forEach(c => {
            const cBay = parseInt(c.bay, 10);
            const contIs40 = parseInt(c.size, 10) === 40 || String(c.size).includes('40');
            let isOverlap = false;
            if (contIs40) {
                // A 40ft container overlaps if its even bay covers this baseBay
                // Even bay covers (evenBay - 1) and (evenBay + 1)
                isOverlap = (cBay - 1 === baseBay || cBay + 1 === baseBay);
            } else {
                // Another 20ft container overlaps if it's on the exact same bay
                isOverlap = (cBay === baseBay);
            }
            if (isOverlap && parseInt(c.tier, 10) > maxTier) {
                maxTier = parseInt(c.tier, 10);
            }
        });
        return maxTier + 1;
    }
};
