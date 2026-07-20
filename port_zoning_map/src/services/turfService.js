/**
 * turfService - Turf.js Geospatial Grid Generation
 * 
 * Core service for generating container slot grids within geographic zones.
 * 
 * Key Algorithms:
 * - Polygon tessellation: subdivides drawn zone polygons into uniform rectangular slots
 * - Rotated grid alignment: aligns slots to longest zone edge (longest axis first = natural harbor orientation)
 * - Obstacle avoidance: respects buildings, roads, and other barriers (no overlapping)
 * - Point-in-polygon testing: validates slot positions within zone boundaries
 * - Distance-based offset: uses Turf.js bearing/destination to compute rotated grid centers
 * 
 * Grid Layout:
 * - Each slot = 3m wide × 6.5m long (TEU 20ft footprint: 2.4m × 12.2m ÷ 2)
 * - Padding: 0.5m between bay rows, 0.2m between slot rows (tighter vertical spacing)
 * - Bay numbering: odd increments (1, 3, 5...) from north/south alternation
 * - Row numbering: sequential increments (01, 02, 03...)
 * - Slot ID format: {zoneId}-{bay:2d}-{row:2d} (e.g., ZONE-01-01)
 * 
 * Performance:
 * - Sweeps grid in expanding square from zone center (O(n²) but limited by bbox)
 * - Pre-computes half-steps to avoid computing entire infinite grid
 * - Batch obstacle intersection checks (skips non-overlapping slots)
 * 
 * @module turfService
 */
import * as turf from '@turf/turf';

/**
 * Calculates bearing angle of the longest edge in a polygon
 * Used to align slot grid to natural zone orientation
 * @param {Array<Array<number>>} coords - Polygon coordinates [lng, lat]
 * @returns {number} - Bearing angle in degrees (0-360)
 */
const getLongestEdgeAngle = (coords) => {
  let maxDist = 0;
  let bestBearing = 0;
  
  for (let i = 0; i < coords.length - 1; i++) {
    const p1 = turf.point(coords[i]);
    const p2 = turf.point(coords[i+1]);
    const dist = turf.distance(p1, p2);
    if (dist > maxDist) {
      maxDist = dist;
      bestBearing = turf.bearing(p1, p2);
    }
  }
  return bestBearing;
};

/**
 * Generates regular grid of container slots within a zone polygon
 * 
 * Process:
 * 1. Extract zone bounds and calculate center point
 * 2. Determine grid orientation from longest zone edge (or custom bearing)
 * 3. Sweep grid outward from center in expanding square pattern
 * 4. For each potential slot position:
 *    a. Calculate 4 corners using Turf destination/bearing math
 *    b. Test if slot center is within zone polygon
 *    c. Test if slot polygon intersects any obstacles
 *    d. If valid: add to results with ISO slot ID (bay-row)
 * 5. Return array of slot features with coordinates
 * 
 * @param {Array<Object>} leafletLatLngs - Zone polygon vertices from Leaflet [LatLng objects]
 * @param {string} zoneId - Zone identifier (ZONE, WAREHOUSE, etc.)
 * @param {string} [zoneName='ZONE'] - Display name for zone
 * @param {Array<Object>} [obstacleGeoJSONs=[]] - GeoJSON features to avoid (buildings, roads)
 * @param {number} [customBearing=null] - Override automatic bearing calculation
 * @returns {Object} - { slots: Array<SlotFeature>, metadata: { bearing: number } }
 * @returns {Array<Object>} slots - Array of slot objects with:
 *   - id: ISO slot ID (e.g., ZONE-01-01)
 *   - zoneId: Parent zone
 *   - bay, row: Grid coordinates
 *   - path: Leaflet polygon coordinates [lat, lng]
 *   - status: 'empty' by default
 */
export const generateGridWithTurf = (leafletLatLngs, zoneId, zoneName = 'ZONE', obstacleGeoJSONs = [], customBearing = null) => {
  if (!leafletLatLngs || leafletLatLngs.length < 3) return [];
  
  // Turf yêu cầu [lng, lat]
  const coords = leafletLatLngs.map(p => [p.lng, p.lat]);
  
  // Đóng polygon
  if (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1]) {
    coords.push([...coords[0]]);
  }

  const polygon = turf.polygon([coords]);
  const area = turf.area(polygon);
  console.log(`[TURF] Diện tích bãi vẽ: ${area.toFixed(2)} m²`);
  
  // Tính góc xoay dựa trên cạnh dài nhất hoặc dùng customBearing
  let baseBearing = (customBearing !== null && customBearing !== undefined)
    ? customBearing
    : getLongestEdgeAngle(coords);
  // Cố gắng cho hướng bãi nằm ngang/dọc tương đối với cạnh dài nhất
  // baseBearing là góc của chiều dọc container (13m)
  
  // Để bao phủ hết Polygon khi bị xoay, ta tính bounding box của Polygon
  const bbox = turf.bbox(polygon);
  
  // Tìm tâm của Bounding Box làm điểm gốc
  const centerPt = turf.center(polygon);
  
  // Bán kính bao phủ lớn nhất (từ tâm ra các góc xa nhất) để đảm bảo quét hết hình
  const maxRadius = turf.distance(
    turf.point([bbox[0], bbox[1]]), 
    turf.point([bbox[2], bbox[3]]), 
    { units: 'meters' }
  );

  const SLOT_W = 3;
  const SLOT_H = 6.5; // Kích thước cơ sở TEU (20ft)
  const PADDING_X = 0.5;
  const PADDING_Y = 0.2; // Khoảng cách ngắn giữa các đuôi TEU
  
  const stepX = SLOT_W + PADDING_X;
  const stepY = SLOT_H + PADDING_Y;
  
  // Tính số dòng và cột quét ra xung quanh tâm
  const halfStepsX = Math.ceil((maxRadius) / stepX);
  const halfStepsY = Math.ceil((maxRadius) / stepY);
  
  const slots = [];
  
  const angleY = baseBearing;
  const angleX = baseBearing + 90;

  for (let r = -halfStepsY; r <= halfStepsY; r++) {
    for (let c = -halfStepsX; c <= halfStepsX; c++) {
      
      const offsetY = r * stepY;
      const offsetX = c * stepX;
      
      // Dịch chuyển tâm lưới từ centerPt
      const p1 = turf.destination(centerPt, Math.abs(offsetY), offsetY >= 0 ? angleY : angleY - 180, { units: 'meters' });
      const slotCenter = turf.destination(p1, Math.abs(offsetX), offsetX >= 0 ? angleX : angleX - 180, { units: 'meters' });
      
      // 1. Tính toán 4 góc của Slot trước
      const n = turf.destination(slotCenter, SLOT_H / 2, angleY, { units: 'meters' });
      const s = turf.destination(slotCenter, SLOT_H / 2, angleY - 180, { units: 'meters' });
      
      const tl = turf.destination(n, SLOT_W / 2, angleX - 180, { units: 'meters' });
      const tr = turf.destination(n, SLOT_W / 2, angleX, { units: 'meters' });
      
      const bl = turf.destination(s, SLOT_W / 2, angleX - 180, { units: 'meters' });
      const br = turf.destination(s, SLOT_W / 2, angleX, { units: 'meters' });

      const corners = [tl, tr, bl, br];
      let isInsideZone = true;
      
      // Chỉ cần tâm của slot nằm trong bãi để lấp đầy tốt hơn ở các mép (tránh trống chỗ viền)
      if (!turf.booleanPointInPolygon(slotCenter, polygon)) {
        isInsideZone = false;
      }

      if (isInsideZone) {
        // Đảm bảo KHÔNG CÓ BẤT KỲ ĐIỂM GIAO CẮT NÀO với chướng ngại vật (đường/nhà)
        // Tạo Polygon đóng kín từ 4 góc (thứ tự: TL -> TR -> BR -> BL -> TL)
        const slotCoords = [
          tl.geometry.coordinates,
          tr.geometry.coordinates,
          br.geometry.coordinates,
          bl.geometry.coordinates,
          tl.geometry.coordinates
        ];
        const slotPoly = turf.polygon([slotCoords]);

        let isOverlapping = false;
        for (const obs of obstacleGeoJSONs) {
          if (turf.booleanIntersects(slotPoly, obs)) {
            isOverlapping = true;
            break;
          }
        }
        
        if (!isOverlapping) {
          // Tính toán số Row (tuần tự) và Bay (số lẻ) theo chuẩn ISO
          const rowNum = c + halfStepsX + 1;
          const bayNum = (r + halfStepsY) * 2 + 1;
          
          const rowStr = String(rowNum).padStart(2, '0');
          const bayStr = String(bayNum).padStart(2, '0');
          
          const isoId = `${zoneId}-${bayStr}-${rowStr}`;

          slots.push({
            id: isoId, // Đánh số ISO Bay-Row
            zoneId: zoneId,
            row: rowStr,
            bay: bayStr,
            status: 'empty', // Trạng thái mặc định
            path: [
              [tl.geometry.coordinates[1], tl.geometry.coordinates[0]],
              [tr.geometry.coordinates[1], tr.geometry.coordinates[0]],
              [br.geometry.coordinates[1], br.geometry.coordinates[0]],
              [bl.geometry.coordinates[1], bl.geometry.coordinates[0]]
            ]
          });
        }
      }
    }
  }
  
  return { slots, metadata: { bearing: baseBearing } };
};
export const createFlatBufferPolygon = (lineString, width) => {
  const coords = lineString.geometry.coordinates; // [[lng, lat], ...]
  const half = width / 2;
  const polys = [];
  
  for (let i = 0; i < coords.length - 1; i++) {
    const p1 = coords[i];
    const p2 = coords[i+1];
    
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    const len = Math.sqrt(dx*dx + dy*dy);
    if (len === 0) continue;
    
    const nx = -dy / len;
    const ny = dx / len;
    
    const lat = p1[1];
    const metersPerLat = 111320;
    const metersPerLng = 111320 * Math.cos(lat * Math.PI / 180);
    
    const dxDeg = (nx * half) / metersPerLng;
    const dyDeg = (ny * half) / metersPerLat;
    
    const lp1 = [p1[0] + dxDeg, p1[1] + dyDeg];
    const rp1 = [p1[0] - dxDeg, p1[1] - dyDeg];
    const lp2 = [p2[0] + dxDeg, p2[1] + dyDeg];
    const rp2 = [p2[0] - dxDeg, p2[1] - dyDeg];
    
    polys.push(turf.polygon([[lp1, lp2, rp2, rp1, lp1]]));
  }
  return polys;
};
