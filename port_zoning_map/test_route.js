import fs from 'fs';
import { buildDynamicGraph, findShortestPath, heuristic } from './src/services/routingService.js';

// Read JSON file
const data = JSON.parse(fs.readFileSync('../port_database_export_2026-07-02.json', 'utf8'));

console.log('Building graph...');
const graph = buildDynamicGraph(data.storageZones, data.slots, data.gates, data.portBoundary);

console.log(`Graph built with ${graph.size} nodes.`);

// Find target slot
const targetSlotId = 'osm-autoyard-280-289-288';
if (!graph.has(targetSlotId)) {
  console.log(`Slot ${targetSlotId} not found in graph!`);
  // Let's check why
  const slotData = data.slots.find(s => s.id === targetSlotId);
  console.log('Slot data from JSON:', slotData);
}

// Find a gate
const gates = Array.from(graph.values()).filter(n => n.type === 'GATE');
console.log(`Found ${gates.length} gates.`);

  let closestGate = null;
  let minDist = Infinity;
  
  gates.forEach(g => {
    const dist = heuristic(g, {coordinates: [10.766697265057427, 106.79364346061722]});
    if (dist < minDist) {
      minDist = dist;
      closestGate = g.id;
    }
    console.log(`\nTesting gate ${g.id} (Distance: ${Math.round(dist)}m)...`);
    const path = findShortestPath(g.id, targetSlotId, graph);
    if (path.length > 0) {
      console.log(`✅ Path found with ${path.length} points!`);
    } else {
      console.log(`❌ No path found from gate ${g.id}!`);
    }
  });
  console.log(`\nClosest gate is: ${closestGate} with distance ${Math.round(minDist)}m`);
  // Try ROAD_CELL
  const roads = Array.from(graph.values()).filter(n => n.type === 'ROAD_CELL');
  if (roads.length > 0) {
    const startNode = roads[0].id;
    console.log(`Finding path from ROAD ${startNode} to ${targetSlotId}...`);
    const path = findShortestPath(startNode, targetSlotId, graph);
    if (path.length > 0) {
      console.log(`Path found with ${path.length} points!`);
    } else {
      console.log('No path found! Checking A* logic...');
    }
  }

