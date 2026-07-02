import * as turf from '@turf/turf';

// Hàm tính góc của cạnh dài nhất của Polygon
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
      
      // Đảm bảo cả 4 góc của slot đều NẰM TRONG bãi (không thò ra ngoài)
      for (const corner of corners) {
        if (!turf.booleanPointInPolygon(corner, polygon)) {
          isInsideZone = false;
          break;
        }
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
