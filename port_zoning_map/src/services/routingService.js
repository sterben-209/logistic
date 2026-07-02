import * as turf from '@turf/turf';

export const heuristic = (nodeA, nodeB) => {
  const dx = Math.abs(nodeA.coordinates[1] - nodeB.coordinates[1]);
  const dy = Math.abs(nodeA.coordinates[0] - nodeB.coordinates[0]);
  return (dx + dy) * 111000;
};

export const buildDynamicGraph = (storageZones, slots, gates, portBoundary) => {
  const graph = new Map();
  const roadLines = storageZones.filter(z => z.zoneType === 'ROAD_LINE');
  
  // 1. Generate Graph from ROAD_LINEs
  const roadLineNodesMap = new Map(); // roadLineId -> Array of nodes
  
  roadLines.forEach(roadLine => {
    const coords = roadLine.pathLatLngs.map(p => [p.lng, p.lat]);
    if (coords.length < 2) return;
    
    const nodesInLine = [];
    coords.forEach((coord, idx) => {
      const id = `road-${roadLine.id}-${idx}`;
      const node = { id, roadId: roadLine.id, coordinates: [coord[1], coord[0]], type: 'ROAD_CELL', edges: [] };
      graph.set(id, node);
      nodesInLine.push(node);
    });
    
    // Connect consecutive vertices
    for (let i = 0; i < nodesInLine.length - 1; i++) {
      const dist = heuristic(nodesInLine[i], nodesInLine[i+1]);
      nodesInLine[i].edges.push({ to: nodesInLine[i+1].id, distance: dist });
      nodesInLine[i+1].edges.push({ to: nodesInLine[i].id, distance: dist });
    }
    
    roadLineNodesMap.set(roadLine.id, nodesInLine);
  });

  // Precompute lines and bounding boxes
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

  // Helper function to snap a point to the nearest unblocked roadLine
  const snapToRoad = (pointCoord, maxDist, ignoreId = null, targetRoadLineId = null) => {
    const pt = turf.point([pointCoord[1], pointCoord[0]]); // [lng, lat]
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
            coordinates: [projY, projX], // [lat, lng]
            segmentIndex: i,
            distance: distMeters
          };
        }
      }
    });
    
    return bestSnap;
  };

  // Connect intersections accurately using turf.lineIntersect
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

        // Link to line 1
        const snap1 = snapToRoad([lat, lng], 5, null, line1.id);
        if (snap1) {
          const snapNodeId1 = `snap1-${intId}`;
          const snapNode1 = { id: snapNodeId1, coordinates: snap1.coordinates, type: 'SNAP', edges: [] };
          graph.set(snapNodeId1, snapNode1);
          intNode.edges.push({ to: snapNodeId1, distance: snap1.distance });
          snapNode1.edges.push({ to: intId, distance: snap1.distance });
          
          const roadNodes = roadLineNodesMap.get(snap1.roadLineId);
          const nodeA = roadNodes[snap1.segmentIndex];
          const nodeB = roadNodes[snap1.segmentIndex + 1];
          if (nodeA) {
             const d = heuristic(snapNode1, nodeA);
             snapNode1.edges.push({ to: nodeA.id, distance: d });
             nodeA.edges.push({ to: snapNodeId1, distance: d });
          }
          if (nodeB) {
             const d = heuristic(snapNode1, nodeB);
             snapNode1.edges.push({ to: nodeB.id, distance: d });
             nodeB.edges.push({ to: snapNodeId1, distance: d });
          }
        }

        // Link to line 2
        const snap2 = snapToRoad([lat, lng], 5, null, line2.id);
        if (snap2) {
          const snapNodeId2 = `snap2-${intId}`;
          const snapNode2 = { id: snapNodeId2, coordinates: snap2.coordinates, type: 'SNAP', edges: [] };
          graph.set(snapNodeId2, snapNode2);
          intNode.edges.push({ to: snapNodeId2, distance: snap2.distance });
          snapNode2.edges.push({ to: intId, distance: snap2.distance });
          
          const roadNodes = roadLineNodesMap.get(snap2.roadLineId);
          const nodeA = roadNodes[snap2.segmentIndex];
          const nodeB = roadNodes[snap2.segmentIndex + 1];
          if (nodeA) {
             const d = heuristic(snapNode2, nodeA);
             snapNode2.edges.push({ to: nodeA.id, distance: d });
             nodeA.edges.push({ to: snapNodeId2, distance: d });
          }
          if (nodeB) {
             const d = heuristic(snapNode2, nodeB);
             snapNode2.edges.push({ to: nodeB.id, distance: d });
             nodeB.edges.push({ to: snapNodeId2, distance: d });
          }
        }
      });
    }
  }

  // Connect T-junctions and close vertices (e.g. drawn slightly short)
  for (const nodes of roadLineNodesMap.values()) {
    for (const node of nodes) {
      const snap = snapToRoad(node.coordinates, 50, node.roadId); // Tăng lên 50m để dễ dàng nối mạng lưới đường
      if (snap) {
        const snapNodeId = `tsnap-${node.id}`;
        const snapNode = { id: snapNodeId, coordinates: snap.coordinates, type: 'SNAP', edges: [] };
        graph.set(snapNodeId, snapNode);
        
        node.edges.push({ to: snapNodeId, distance: snap.distance });
        snapNode.edges.push({ to: node.id, distance: snap.distance });
        
        const roadNodes = roadLineNodesMap.get(snap.roadLineId);
        const nodeA = roadNodes[snap.segmentIndex];
        const nodeB = roadNodes[snap.segmentIndex + 1];
        if (nodeA) {
           const d = heuristic(snapNode, nodeA);
           snapNode.edges.push({ to: nodeA.id, distance: d });
           nodeA.edges.push({ to: snapNodeId, distance: d });
        }
        if (nodeB) {
           const d = heuristic(snapNode, nodeB);
           snapNode.edges.push({ to: nodeB.id, distance: d });
           nodeB.edges.push({ to: snapNodeId, distance: d });
        }
      }
    }
  }

  // 2. Add Gates and snap to ROAD_LINE
  gates.forEach(gate => {
    if (!gate || !gate.latLng) return;
    const lat = gate.latLng.lat !== undefined ? gate.latLng.lat : gate.latLng[0];
    const lng = gate.latLng.lng !== undefined ? gate.latLng.lng : gate.latLng[1];
    const node = { id: gate.id, coordinates: [lat, lng], type: 'GATE', edges: [] };
    graph.set(gate.id, node);
    
    const snap = snapToRoad([lat, lng], 2000); // Gates have a 2000m snap range
    if (snap) {
      const snapNodeId = `snap-${gate.id}`;
      const snapNode = { id: snapNodeId, coordinates: snap.coordinates, type: 'SNAP', edges: [] };
      graph.set(snapNodeId, snapNode);
      
      // Link GATE to SNAP
      node.edges.push({ to: snapNodeId, distance: snap.distance });
      snapNode.edges.push({ to: gate.id, distance: snap.distance });
      
      // Link SNAP to the two ends of the segment
      const roadNodes = roadLineNodesMap.get(snap.roadLineId);
      const nodeA = roadNodes[snap.segmentIndex];
      const nodeB = roadNodes[snap.segmentIndex + 1];
      
      if (nodeA) {
        const d = heuristic(snapNode, nodeA);
        snapNode.edges.push({ to: nodeA.id, distance: d });
        nodeA.edges.push({ to: snapNodeId, distance: d });
      }
      if (nodeB) {
        const d = heuristic(snapNode, nodeB);
        snapNode.edges.push({ to: nodeB.id, distance: d });
        nodeB.edges.push({ to: snapNodeId, distance: d });
      }
    }
  });

  // 3. Add Slots and snap to ROAD_LINE
  slots.forEach(slot => {
    const lat = slot.path.reduce((sum, p) => sum + p[0], 0) / slot.path.length;
    const lng = slot.path.reduce((sum, p) => sum + p[1], 0) / slot.path.length;
    const node = { id: slot.id, coordinates: [lat, lng], type: 'SLOT', edges: [] };
    graph.set(slot.id, node);
    
    const snap = snapToRoad([lat, lng], 2000, slot.id); // Increased snap range to 2000m
    if (snap) {
      const snapNodeId = `snap-${slot.id}`;
      const snapNode = { id: snapNodeId, coordinates: snap.coordinates, type: 'SNAP', edges: [] };
      graph.set(snapNodeId, snapNode);
      
      // Link SLOT to SNAP
      node.edges.push({ to: snapNodeId, distance: snap.distance });
      snapNode.edges.push({ to: slot.id, distance: snap.distance });
      
      // Link SNAP to the two ends of the segment
      const roadNodes = roadLineNodesMap.get(snap.roadLineId);
      const nodeA = roadNodes[snap.segmentIndex];
      const nodeB = roadNodes[snap.segmentIndex + 1];
      
      if (nodeA) {
        const d = heuristic(snapNode, nodeA);
        snapNode.edges.push({ to: nodeA.id, distance: d });
        nodeA.edges.push({ to: snapNodeId, distance: d });
      }
      if (nodeB) {
        const d = heuristic(snapNode, nodeB);
        snapNode.edges.push({ to: nodeB.id, distance: d });
        nodeB.edges.push({ to: snapNodeId, distance: d });
      }
    }
  });

  console.log(`[A* Centerline] Graph built: ${graph.size} total nodes, ${slots.length} slots, ${gates.length} gates.`);
  return graph;
};

export const findShortestPath = (startNodeId, targetNodeId, graph) => {
  if (!graph.has(startNodeId) || !graph.has(targetNodeId)) return [];

  const openSet = new Set([startNodeId]);
  const cameFrom = new Map();
  
  const gScore = new Map();
  const fScore = new Map();
  
  for (const [id] of graph) {
    gScore.set(id, Infinity);
    fScore.set(id, Infinity);
  }
  
  gScore.set(startNodeId, 0);
  fScore.set(startNodeId, heuristic(graph.get(startNodeId), graph.get(targetNodeId)));
  
  while (openSet.size > 0) {
    let current = null;
    let lowestF = Infinity;
    for (const id of openSet) {
      const score = fScore.get(id);
      if (score < lowestF) {
        lowestF = score;
        current = id;
      }
    }
    
    if (current === null) break;
    
    if (current === targetNodeId) {
      const path = [];
      let curr = current;
      while (cameFrom.has(curr)) {
        path.unshift(graph.get(curr).coordinates);
        curr = cameFrom.get(curr);
      }
      path.unshift(graph.get(startNodeId).coordinates);
      return path;
    }
    
    openSet.delete(current);
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
      
      const tentativeG = gScore.get(current) + edge.distance + turnPenalty;
      
      if (tentativeG < gScore.get(neighbor)) {
        cameFrom.set(neighbor, current);
        gScore.set(neighbor, tentativeG);
        fScore.set(neighbor, tentativeG + heuristic(graph.get(neighbor), graph.get(targetNodeId)));
        openSet.add(neighbor);
      }
    }
  }
  
  return [];
};
export const buildGraph = buildDynamicGraph;







