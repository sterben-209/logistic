import * as turf from '@turf/turf';

/**
 * Assigns tags to zones based on spatial relationships with buildings and gates.
 * @param {Array} zones - Array of zone features (Polygons)
 * @param {Array} buildings - Array of building features (Polygons)
 * @param {Object} gateNode - Gate feature (Point)
 * @returns {Array} - Array of zones with added properties: zoneType and subType
 */
export const assignZoneTags = (zones, buildings, gateNode) => {
  // Handle edge cases: ensure inputs are arrays
  const zoneArray = Array.isArray(zones) ? zones : [];
  const buildingArray = Array.isArray(buildings) ? buildings : [];

  // Convert inputs to turf features if they aren't already
  const zoneFeatures = zoneArray.map(zone => {
    // Handle null/undefined zone
    if (!zone) {
      return null;
    }

    if (zone.type === 'Feature') {
      return zone;
    }
    // Handle different input formats
    if (zone.geometry) {
      return {
        type: 'Feature',
        properties: zone.properties || {},
        geometry: zone.geometry
      };
    }
    // Assume it's a polygon coordinates array (expecting [lng, lat] pairs)
    // Check for turfCoords (pre-processed closed polygon), then pathLatLngs, then fall back to empty array
    const coordinates = zone.turfCoords || zone.coordinates || zone.pathLatLngs || [];
    // Skip if we don't have valid coordinates for a polygon (need at least 4 points to form a closed ring)
    if (!Array.isArray(coordinates) || coordinates.length === 0) {
      return null;
    }
    
    // Đảm bảo có ít nhất 4 điểm và vòng lặp khép kín (điểm đầu trùng điểm cuối)
    let validCoords = [...coordinates];
    if (validCoords.length > 0) {
      const first = validCoords[0];
      const last = validCoords[validCoords.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        validCoords.push([...first]);
      }
    }
    if (validCoords.length < 4) {
      return null;
    }

    try {
      const props = zone.properties ? { ...zone.properties } : {};
      if (zone.id) props.id = zone.id;
      if (zone.name) props.name = zone.name;
      
      // CLEAR old tags so the AI tagger processes it fresh!
      delete props.zoneType;
      delete props.subType;
      delete props.allowedCargo;
      delete props.taggingReason;
      
      return turf.polygon([validCoords], props);
    } catch(e) {
      console.warn("Lỗi turf.polygon ở zone:", zone.id || 'unknown', "coords:", validCoords);
      return null;
    }
  }).filter(Boolean); // Remove null values

  const buildingFeatures = buildingArray.map(building => {
    // Handle null/undefined building
    if (!building) {
      return null;
    }

    if (building.type === 'Feature') {
      return building;
    }
    if (building.geometry) {
      return {
        type: 'Feature',
        properties: building.properties || {},
        geometry: building.geometry
      };
    }
    // Assume it's a polygon coordinates array (expecting [lng, lat] pairs)
    // Check for turfCoords (pre-processed closed polygon), then pathLatLngs, then fall back to empty array
    const coordinates = building.turfCoords || building.coordinates || building.pathLatLngs || [];
    // Skip if we don't have valid coordinates for a polygon (need at least 4 points to form a closed ring)
    if (!Array.isArray(coordinates) || coordinates.length === 0) {
      return null;
    }

    let validCoords = [...coordinates];
    if (validCoords.length > 0) {
      const first = validCoords[0];
      const last = validCoords[validCoords.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        validCoords.push([...first]);
      }
    }
    if (validCoords.length < 4) {
      return null;
    }

    try {
      const props = building.properties ? { ...building.properties } : {};
      if (building.id) props.id = building.id;
      if (building.name) props.name = building.name;
      return turf.polygon([validCoords], props);
    } catch(e) {
      console.warn("Lỗi turf.polygon ở building:", building.id || 'unknown', "coords:", validCoords);
      return null;
    }
  }).filter(Boolean); // Remove null values

  const gateFeature = gateNode && gateNode.type === 'Feature'
    ? gateNode
    : (gateNode && gateNode.turfCoords
      ? turf.point(gateNode.turfCoords, gateNode.properties || {})
      : (gateNode && gateNode.geometry
        ? turf.point(gateNode.geometry.coordinates, gateNode.properties || {})
        : (gateNode && gateNode.latLng
          ? turf.point([gateNode.latLng.lng, gateNode.latLng.lat], gateNode.properties || {})
          : (gateNode && Array.isArray(gateNode)
            ? turf.point(gateNode, {})
            : turf.point([0, 0], {})))));

  // If we have no zones to process, return early
  if (zoneFeatures.length === 0) {
    return zoneArray;
  }

  let currentZones = [...zoneFeatures];

  // 1. RULE 1: KHO MÁI CHE (Hàng Kim khí/Thiết bị)
  currentZones = currentZones.map(zone => {
    if (!zone) return null;
    if (zone.properties.zoneType) return zone;

    const intersectsBuilding = buildingFeatures.some(building => {
      if (!building) return false;
      // Chỉ kiểm tra các building có subType là WAREHOUSE
      if (building.properties.subType !== 'WAREHOUSE') return false;

      try {
        const intersection = turf.intersect(turf.featureCollection([zone, building]));
        if (intersection) {
           const intArea = turf.area(intersection);
           const zoneArea = turf.area(zone);
           // Chỉ công nhận là Kho Mái Che nếu phần giao cắt chiếm ít nhất 50% diện tích của Bãi
           return intArea > 1 && (intArea / zoneArea > 0.5);
        }
        return false;
      } catch (e) {
        return false;
      }
    });

    if (intersectsBuilding) {
      return {
        ...zone,
        properties: {
          ...zone.properties,
          zoneType: 'YARD',
          subType: 'COVERED',
          allowedCargo: ['METAL', 'EQUIPMENT'],
          taggingReason: 'Zone giao cắt thực sự với tòa nhà (Kho mái che).'
        }
      };
    }
    return zone;
  }).filter(Boolean);

  // 2. RULE 2: CÁCH LY HÓA CHẤT (Hàng Nguy hiểm/Dễ cháy nổ)
  const MIN_TANK_DISTANCE = 100;
  
  // Xác định các bãi NẰM SÁT các tòa nhà loại TANK (Giao cắt hoặc rất gần < 1m)
  currentZones = currentZones.map(zone => {
    if (!zone) return null;
    if (zone.properties.zoneType) return zone;

    let nearTank = false;
    for (const building of buildingFeatures) {
      if (building && building.properties.subType === 'TANK') {
        try {
          // Tính khoảng cách Mép-cách-Mép (Edge-to-Edge) thay vì Tâm-cách-Tâm
          // Tạo một vùng đệm (buffer) 10 mét xung quanh bồn chứa
          const bufferedTank = turf.buffer(building, 10, { units: 'meters' });
          // Nếu bãi trống giao cắt với vùng đệm 10m của bồn chứa -> Bãi đó nằm sát bồn chứa!
          if (turf.booleanIntersects(zone, bufferedTank)) {
            nearTank = true;
            break;
          }
        } catch (e) {
          // Fallback an toàn nếu lỗi tạo buffer
          const distToTank = turf.distance(turf.centroid(zone), turf.centroid(building), { units: 'meters' });
          if (distToTank <= 10) {
            nearTank = true;
            break;
          }
        }
      }
    }

    if (nearTank) {
      return {
        ...zone,
        properties: {
          ...zone.properties,
          zoneType: 'DANGEROUS',
          subType: 'TANK_ADJACENT',
          allowedCargo: ['FLAMMABLE', 'TOXIC'],
          taggingReason: 'Bãi nằm ngay cạnh Bồn chứa hóa chất (TANK) nên TỰ ĐỘNG bị chỉ định làm bãi hóa chất.'
        }
      };
    }
    return zone;
  });

  const untaggedForDangerous = currentZones.filter(z => !z.properties.zoneType);
  if (untaggedForDangerous.length > 0) {
    let mostIsolatedZone = null;
    let maxDistance = -Infinity;

    untaggedForDangerous.forEach(zone => {
      const centroid = turf.centroid(zone);
      let totalDistance = 0;
      let minDistanceToTank = Infinity;

      buildingFeatures.forEach(building => {
        if (!building) return;
        const dist = turf.distance(centroid, turf.centroid(building), { units: 'meters' });
        totalDistance += dist;
        
        if (building.properties.subType === 'TANK' && dist < minDistanceToTank) {
          minDistanceToTank = dist;
        }
      });

      if (gateFeature) {
        totalDistance += turf.distance(centroid, gateFeature, { units: 'meters' });
      }

      // Chỉ xét bãi làm bãi hóa chất nếu nó cách xa các TANK ít nhất MIN_TANK_DISTANCE (100m)
      // (Hoặc nếu không có TANK nào thì điều kiện này mặc định pass)
      if (minDistanceToTank >= MIN_TANK_DISTANCE) {
        if (totalDistance > maxDistance) {
          maxDistance = totalDistance;
          mostIsolatedZone = zone;
        }
      }
    });

    if (mostIsolatedZone) {
      currentZones = currentZones.map(zone => {
        if (zone === mostIsolatedZone) {
          return {
            ...zone,
            properties: {
              ...zone.properties,
              zoneType: 'DANGEROUS',
              subType: 'ISOLATED',
              allowedCargo: ['FLAMMABLE', 'TOXIC'],
              taggingReason: `Zone có vị trí cô lập nhất, nằm xa cổng cảng và cách TANK ít nhất ${MIN_TANK_DISTANCE}m để đảm bảo an toàn.`
            }
          };
        }
        return zone;
      });
    }
  }

  // 3. RULE 3: BÃI GỖ (Khoảng cách an toàn > 20m)
  const dangerousZones = currentZones.filter(z => z.properties.zoneType === 'DANGEROUS');
  if (dangerousZones.length > 0) {
    let woodTaggedCount = 0;
    
    currentZones = currentZones.map(zone => {
      if (zone.properties.zoneType) return zone;
      if (woodTaggedCount >= 2) return zone; // Max 2 zones

      let isSafeDistance = true;
      for (const dz of dangerousZones) {
         // Calculate distance between centroids
         const dist = turf.distance(turf.centroid(zone), turf.centroid(dz), { units: 'meters' });
         if (dist < 20) {
            isSafeDistance = false;
            break;
         }
      }

      if (isSafeDistance) {
         woodTaggedCount++;
         return {
            ...zone,
            properties: {
              ...zone.properties,
              zoneType: 'YARD',
              subType: 'OPEN_AIR',
              allowedCargo: ['WOOD'],
              taggingReason: 'Zone cách bãi hóa chất trên 20 mét, đảm bảo tiêu chuẩn chống cháy lan cho bãi gỗ.'
            }
         };
      }
      return zone;
    });
  }

  // 4. RULE 4: HÀNG KHÔ TỔNG HỢP (Mặc định)
  const finalZones = currentZones.map(zone => {
    if (!zone.properties.zoneType) {
      return {
        ...zone,
        properties: {
          ...zone.properties,
          zoneType: 'YARD',
          subType: 'OPEN_AIR',
          allowedCargo: ['DRY'],
          taggingReason: 'Bãi lộ thiên tiêu chuẩn, quy hoạch mặc định cho hàng khô tổng hợp.'
        }
      };
    }
    return zone;
  });

  // Map back to original zoneArray format
  const processedZoneMap = new Map();
  finalZones.forEach(zone => {
    if (zone && zone.properties && zone.properties.id) {
      processedZoneMap.set(zone.properties.id, zone);
    }
  });

  return zoneArray.map(zone => {
    if (!zone) return null;

    const processedZone = processedZoneMap.get(zone.id);
    if (processedZone && processedZone.properties) {
      return {
        ...zone,
        zoneType: processedZone.properties.zoneType || zone.zoneType,
        ...(processedZone.properties.subType && { subType: processedZone.properties.subType }),
        ...(processedZone.properties.allowedCargo && { allowedCargo: processedZone.properties.allowedCargo }),
        ...(processedZone.properties.taggingReason && { taggingReason: processedZone.properties.taggingReason })
      };
    }
    return zone;
  }).filter(Boolean);
};