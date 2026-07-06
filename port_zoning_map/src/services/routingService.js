import * as turf from '@turf/turf';

export const getDistance = (nodeA, nodeB) => {
  const dx = nodeA.coordinates[1] - nodeB.coordinates[1];
  const dy = nodeA.coordinates[0] - nodeB.coordinates[0];
  return Math.sqrt(dx*dx + dy*dy) * 111000;
};

export const heuristic = (nodeA, nodeB) => {
  return getDistance(nodeA, nodeB);
};

export const buildDynamicGraph = (storageZones, slots, gates, portBoundary) => {
  const graph = new Map();
  const roadLines = storageZones.filter(z => z.zoneType === 'ROAD_LINE');
  
  const roadLineSegmentsMap = new Map();
  
  roadLines.forEach(roadLine => {
    const coords = roadLine.pathLatLngs.map(p => [p.lng, p.lat]);
    if (coords.length < 2) return;
    
    const segments = [];
    for (let i = 0; i < coords.length - 1; i++) {
      segments.push([]);
    }
    roadLineSegmentsMap.set(roadLine.id, segments);
    
    for (let i = 0; i < coords.length; i++) {
      const id = `road-${roadLine.id}-${i}`;
      const node = { id, roadId: roadLine.id, coordinates: [coords[i][1], coords[i][0]], type: 'ROAD_CELL', edges: [] };
      graph.set(id, node);
      
      if (i < coords.length - 1) {
         segments[i].push({ node, t: 0 });
      }
      if (i > 0) {
         segments[i - 1].push({ node, t: 1 });
      }
    }
  });

  const precomputedRoadLines = roadLines.map(roadLine => {
    const coords = roadLine.pathLatLngs.map(p => [p.lng, p.lat]);
    if (coords.length < 2) return null;
    const line = turf.lineString(coords);
    return {
      id: roadLine.id,
      line: line,
      bbox: turf.bbox(line)
    };
  }).filter(Boolean);

  const snapToRoad = (pointCoord, maxDist, ignoreId = null, targetRoadLineId = null) => {
    let bestSnap = null;
    let minDist = maxDist;
    const searchRadiusDeg = maxDist / 100000;

    precomputedRoadLines.forEach(roadLineData => {
      if (targetRoadLineId && roadLineData.id !== targetRoadLineId) return;
      if (ignoreId && roadLineData.id === ignoreId) return;
      if (
        pointCoord[1] < roadLineData.bbox[0] - searchRadiusDeg ||
        pointCoord[1] > roadLineData.bbox[2] + searchRadiusDeg ||
        pointCoord[0] < roadLineData.bbox[1] - searchRadiusDeg ||
        pointCoord[0] > roadLineData.bbox[3] + searchRadiusDeg
      ) return;

      const coords = roadLineData.line.geometry.coordinates;
      const px = pointCoord[1];
      const py = pointCoord[0];
      for (let i = 0; i < coords.length - 1; i++) {
        const vx = coords[i][0];
        const vy = coords[i][1];
        const wx = coords[i+1][0];
        const wy = coords[i+1][1];
        
        const l2 = (wx - vx)**2 + (wy - vy)**2;
        let t = 0;
        if (l2 > 0) {
          t = ((px - vx) * (wx - vx) + (py - vy) * (wy - vy)) / l2;
          t = Math.max(0, Math.min(1, t));
        }
        const projX = vx + t * (wx - vx);
        const projY = vy + t * (wy - vy);
        
        const dx = px - projX;
        const dy = py - projY;
        const distMeters = Math.sqrt(dx * dx + dy * dy) * 111000;
        
        if (distMeters < minDist) {
          minDist = distMeters;
          bestSnap = {
            roadLineId: roadLineData.id,
            coordinates: [projY, projX],
            segmentIndex: i,
            distance: distMeters,
            t: t
          };
        }
      }
    });
    
    return bestSnap;
  };

  for (let i = 0; i < precomputedRoadLines.length; i++) {
    for (let j = i + 1; j < precomputedRoadLines.length; j++) {
      const line1 = precomputedRoadLines[i];
      const line2 = precomputedRoadLines[j];
      const intersects = turf.lineIntersect(line1.line, line2.line);
      
      intersects.features.forEach((pt, idx) => {
        const lat = pt.geometry.coordinates[1];
        const lng = pt.geometry.coordinates[0];
        const intId = `int-${line1.id}-${line2.id}-${idx}`;
        const intNode = { id: intId, coordinates: [lat, lng], type: 'ROAD_CELL', edges: [] };
        graph.set(intId, intNode);

        const snap1 = snapToRoad([lat, lng], 5, null, line1.id);
        if (snap1) {
          const snapNodeId1 = `snap1-${intId}`;
          const snapNode1 = { id: snapNodeId1, coordinates: snap1.coordinates, type: 'SNAP', edges: [] };
          graph.set(snapNodeId1, snapNode1);
          intNode.edges.push({ to: snapNodeId1, distance: snap1.distance });
          snapNode1.edges.push({ to: intId, distance: snap1.distance });
          roadLineSegmentsMap.get(snap1.roadLineId)[snap1.segmentIndex].push({ node: snapNode1, t: snap1.t });
        }

        const snap2 = snapToRoad([lat, lng], 5, null, line2.id);
        if (snap2) {
          const snapNodeId2 = `snap2-${intId}`;
          const snapNode2 = { id: snapNodeId2, coordinates: snap2.coordinates, type: 'SNAP', edges: [] };
          graph.set(snapNodeId2, snapNode2);
          intNode.edges.push({ to: snapNodeId2, distance: snap2.distance });
          snapNode2.edges.push({ to: intId, distance: snap2.distance });
          roadLineSegmentsMap.get(snap2.roadLineId)[snap2.segmentIndex].push({ node: snapNode2, t: snap2.t });
        }
      });
    }
  }

  for (const segments of roadLineSegmentsMap.values()) {
    for (const segment of segments) {
      // Dùng mảng tạm để duyệt tránh infinite loop khi push thêm phần tử vào chính segment này
      const originalNodes = segment.filter(item => item.node.type === 'ROAD_CELL' && (item.t === 0 || item.t === 1));
      
      for (const {node, t} of originalNodes) {
        const snap = snapToRoad(node.coordinates, 5, node.roadId); 
        if (snap) {
          const snapNodeId = `tsnap-${node.id}`;
          const snapNode = { id: snapNodeId, coordinates: snap.coordinates, type: 'SNAP', edges: [] };
          graph.set(snapNodeId, snapNode);
          
          node.edges.push({ to: snapNodeId, distance: snap.distance });
          snapNode.edges.push({ to: node.id, distance: snap.distance });
          
          roadLineSegmentsMap.get(snap.roadLineId)[snap.segmentIndex].push({ node: snapNode, t: snap.t });
        }
      }
    }
  }

  gates.forEach(gate => {
    if (!gate || !gate.latLng) return;
    const lat = gate.latLng.lat !== undefined ? gate.latLng.lat : gate.latLng[0];
    const lng = gate.latLng.lng !== undefined ? gate.latLng.lng : gate.latLng[1];
    const node = { id: gate.id, coordinates: [lat, lng], type: 'GATE', edges: [] };
    graph.set(gate.id, node);
    
    const snap = snapToRoad([lat, lng], 2000);
    if (snap) {
      const snapNodeId = `snap-${gate.id}`;
      const snapNode = { id: snapNodeId, coordinates: snap.coordinates, type: 'SNAP', edges: [] };
      graph.set(snapNodeId, snapNode);
      
      node.edges.push({ to: snapNodeId, distance: snap.distance });
      snapNode.edges.push({ to: gate.id, distance: snap.distance });
      
      roadLineSegmentsMap.get(snap.roadLineId)[snap.segmentIndex].push({ node: snapNode, t: snap.t });
    }
  });

  let totalSlotsCount = 0;

  storageZones.forEach(zone => {
    if (!zone.slots || zone.slots.length === 0) return;
    if (zone.zoneType === 'ROAD' || zone.zoneType === 'ROAD_LINE') return;

    totalSlotsCount += zone.slots.length;

    // Tính điểm truy cập (SNAP) trên đường cho TỪNG slot riêng biệt
    // Điều này giúp xe tải đi vào sâu nhất có thể trên đường xương cá đến điểm gần container nhất
    zone.slots.forEach(slot => {
      const lat = slot.path.reduce((sum, p) => sum + p[0], 0) / slot.path.length;
      const lng = slot.path.reduce((sum, p) => sum + p[1], 0) / slot.path.length;
      const node = { id: slot.id, coordinates: [lat, lng], type: 'SLOT', edges: [] };
      graph.set(slot.id, node);
      
      const snap = snapToRoad([lat, lng], 2000, zone.id);
      if (snap) {
        const snapNodeId = `snap-slot-${slot.id}`;
        // Nếu đã có snap node ở vị trí này (cùng t) thì có thể tái sử dụng, 
        // nhưng để đơn giản ta cứ tạo node mới, Dijkstra vẫn xử lý tốt trọng số 0
        const snapNode = { id: snapNodeId, coordinates: snap.coordinates, type: 'SNAP', edges: [] };
        graph.set(snapNodeId, snapNode);
        
        node.edges.push({ to: snapNodeId, distance: snap.distance });
        snapNode.edges.push({ to: slot.id, distance: snap.distance });
        
        roadLineSegmentsMap.get(snap.roadLineId)[snap.segmentIndex].push({ node: snapNode, t: snap.t });
      }
    });
  });

  for (const segments of roadLineSegmentsMap.values()) {
    for (const segment of segments) {
      segment.sort((a, b) => a.t - b.t);
      for (let k = 0; k < segment.length - 1; k++) {
        const node1 = segment[k].node;
        const node2 = segment[k+1].node;
        if (node1.id !== node2.id) {
          const d = heuristic(node1, node2);
          node1.edges.push({ to: node2.id, distance: d });
          node2.edges.push({ to: node1.id, distance: d });
        }
      }
    }
  }

  console.log(`[A* Hierarchical] Graph built: ${graph.size} nodes, ${totalSlotsCount} slots nested in zones, ${gates.length} gates.`);
  pathCache.clear(); 
  precomputeAllPaths(graph, gates);
  return graph;
};

class MinHeap {
  constructor() { this.heap = []; }
  push(node, score) {
    this.heap.push({ node, score });
    this._bubbleUp(this.heap.length - 1);
  }
  pop() {
    if (this.heap.length === 0) return null;
    const min = this.heap[0];
    const end = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = end;
      this._sinkDown(0);
    }
    return min;
  }
  _bubbleUp(idx) {
    const element = this.heap[idx];
    while (idx > 0) {
      let parentIdx = Math.floor((idx - 1) / 2);
      let parent = this.heap[parentIdx];
      if (element.score >= parent.score) break;
      this.heap[parentIdx] = element;
      this.heap[idx] = parent;
      idx = parentIdx;
    }
  }
  _sinkDown(idx) {
    const length = this.heap.length;
    const element = this.heap[idx];
    while (true) {
      let leftChildIdx = 2 * idx + 1;
      let rightChildIdx = 2 * idx + 2;
      let leftChild, rightChild;
      let swap = null;

      if (leftChildIdx < length) {
        leftChild = this.heap[leftChildIdx];
        if (leftChild.score < element.score) swap = leftChildIdx;
      }
      if (rightChildIdx < length) {
        rightChild = this.heap[rightChildIdx];
        if ((swap === null && rightChild.score < element.score) || (swap !== null && rightChild.score < leftChild.score)) {
          swap = rightChildIdx;
        }
      }
      if (swap === null) break;
      this.heap[idx] = this.heap[swap];
      this.heap[swap] = element;
      idx = swap;
    }
  }
  isEmpty() { return this.heap.length === 0; }
}

export let ssspCameFromCache = new Map();
let pathCache = new Map();

const precomputeAllPaths = (graph, gates) => {
   ssspCameFromCache.clear();
   const t0 = performance.now();
   
   gates.forEach(gate => {
      const gateId = gate.id;
      if (!graph.has(gateId)) return;
      
      const cameFrom = new Map();
      const gScore = new Map();
      const openQueue = new MinHeap();
      
      gScore.set(gateId, 0);
      openQueue.push(gateId, 0);
      
      while (!openQueue.isEmpty()) {
         const minObj = openQueue.pop();
         const current = minObj.node;
         
         if (minObj.score > (gScore.get(current) || Infinity)) continue;
         
         const currentNode = graph.get(current);
         if (!currentNode || !currentNode.edges) continue;
         
         for (const edge of currentNode.edges) {
            const neighbor = edge.to;
            let turnPenalty = 0;
            
            if (cameFrom.has(current)) {
               const prev = cameFrom.get(current);
               const prevNode = graph.get(prev);
               const nextNode = graph.get(neighbor);
               
               if (prevNode && nextNode) {
                 const dx1 = currentNode.coordinates[1] - prevNode.coordinates[1];
                 const dy1 = currentNode.coordinates[0] - prevNode.coordinates[0];
                 const dx2 = nextNode.coordinates[1] - currentNode.coordinates[1];
                 const dy2 = nextNode.coordinates[0] - currentNode.coordinates[0];
                 
                 const dot = dx1*dx2 + dy1*dy2;
                 const len1 = Math.sqrt(dx1*dx1 + dy1*dy1);
                 const len2 = Math.sqrt(dx2*dx2 + dy2*dy2);
                 
                 if (len1 > 0 && len2 > 0) {
                     const cosTheta = dot / (len1 * len2);
                     if (cosTheta < 0.9) turnPenalty = 20;
                 }
               }
            }
            
            const tentativeG = gScore.get(current) + edge.distance + turnPenalty;
            if (tentativeG < (gScore.get(neighbor) === undefined ? Infinity : gScore.get(neighbor))) {
               cameFrom.set(neighbor, current);
               gScore.set(neighbor, tentativeG);
               openQueue.push(neighbor, tentativeG);
            }
         }
      }
      ssspCameFromCache.set(gateId, cameFrom);
   });
   
   console.log(`[SSSP Precompute] Finished in ${(performance.now() - t0).toFixed(2)}ms for ${gates.length} gates.`);
};

export const findShortestPath = (startNodeId, targetNodeId, graph) => {
  if (!graph.has(startNodeId) || !graph.has(targetNodeId)) return [];

  const processPathArray = (nodeIds) => {
     let finalIds = [...nodeIds];
     
     // Keep all nodes so the vehicle goes all the way into the slot
     
     return finalIds.map(id => graph.get(id).coordinates);
  };
  
  // KIỂM TRA SSSP CACHE TRƯỚC (Thời gian: O(L) ~ 0.001ms)
  if (ssspCameFromCache.has(startNodeId)) {
      const cameFrom = ssspCameFromCache.get(startNodeId);
      if (cameFrom.has(targetNodeId)) {
          const nodePath = [];
          let curr = targetNodeId;
          while (cameFrom.has(curr)) {
            nodePath.unshift(curr);
            curr = cameFrom.get(curr);
          }
          nodePath.unshift(startNodeId);
          return processPathArray(nodePath);
      }
  } else if (ssspCameFromCache.has(targetNodeId)) {
      // Trường hợp ngược lại (Slot -> Gate)
      const cameFrom = ssspCameFromCache.get(targetNodeId);
      if (cameFrom.has(startNodeId)) {
          const nodePath = [];
          let curr = startNodeId;
          while (cameFrom.has(curr)) {
            nodePath.unshift(curr);
            curr = cameFrom.get(curr);
          }
          nodePath.unshift(targetNodeId);
          return processPathArray(nodePath.reverse());
      }
  }

  // FALLBACK SANG A* NẾU KHÔNG CÓ TRONG SSSP (Ví dụ Slot -> Slot)
  const cacheKey = `${startNodeId}->${targetNodeId}`;
  if (pathCache.has(cacheKey)) {
      return [...pathCache.get(cacheKey)];
  }

  const openQueue = new MinHeap();
  const cameFrom = new Map();
  const gScore = new Map();
  const fScore = new Map();
  
  gScore.set(startNodeId, 0);
  const startF = heuristic(graph.get(startNodeId), graph.get(targetNodeId));
  fScore.set(startNodeId, startF);
  openQueue.push(startNodeId, startF);
  
  while (!openQueue.isEmpty()) {
    const minObj = openQueue.pop();
    const current = minObj.node;
    
    // Bỏ qua nếu đã có đường tốt hơn được xử lý
    if (minObj.score > (fScore.get(current) || Infinity)) continue;
    
    if (current === targetNodeId) {
      const nodePath = [];
      let curr = current;
      while (cameFrom.has(curr)) {
        nodePath.unshift(curr);
        curr = cameFrom.get(curr);
      }
      nodePath.unshift(startNodeId);
      
      const finalCoords = processPathArray(nodePath);
      pathCache.set(cacheKey, finalCoords);
      return [...finalCoords];
    }
    
    const currentNode = graph.get(current);
    
    for (const edge of currentNode.edges) {
      const neighbor = edge.to;
      let turnPenalty = 0;
      
      // Calculate turn penalty
      if (cameFrom.has(current)) {
         const prev = cameFrom.get(current);
         const prevNode = graph.get(prev);
         const nextNode = graph.get(neighbor);
         
         const dx1 = currentNode.coordinates[1] - prevNode.coordinates[1];
         const dy1 = currentNode.coordinates[0] - prevNode.coordinates[0];
         const dx2 = nextNode.coordinates[1] - currentNode.coordinates[1];
         const dy2 = nextNode.coordinates[0] - currentNode.coordinates[0];
         
         const dot = dx1*dx2 + dy1*dy2;
         const len1 = Math.sqrt(dx1*dx1 + dy1*dy1);
         const len2 = Math.sqrt(dx2*dx2 + dy2*dy2);
         
         if (len1 > 0 && len2 > 0) {
             const cosTheta = dot / (len1 * len2);
             // If angle is significant (e.g. cosTheta < 0.9), add penalty
             if (cosTheta < 0.9) {
                turnPenalty = 20; // Turn penalty cost
             }
         }
      }
      
      const currentG = gScore.get(current);
      const tentativeG = (currentG !== undefined ? currentG : Infinity) + edge.distance + turnPenalty;
      
      const neighborG = gScore.get(neighbor);
      if (tentativeG < (neighborG !== undefined ? neighborG : Infinity)) {
        cameFrom.set(neighbor, current);
        gScore.set(neighbor, tentativeG);
        fScore.set(neighbor, tentativeG + heuristic(graph.get(neighbor), graph.get(targetNodeId)));
        openQueue.push(neighbor, fScore.get(neighbor));
      }
    }
  }
  
  return [];
};

export const buildGraph = buildDynamicGraph;
