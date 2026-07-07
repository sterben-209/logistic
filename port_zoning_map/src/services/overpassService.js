export const fetchOSMBuildings = async (s, w, n, e) => {
  const query = `[out:json][timeout:25];(way["building"~"warehouse|storage|tank|industrial"](${s},${w},${n},${e});relation["building"~"warehouse|storage|tank|industrial"](${s},${w},${n},${e}););out geom;`;
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    let tankCount = 0;
    let warehouseCount = 0;

    const buildings = data.elements.map(element => {
      // 2. Nâng cấp Parser (Trích xuất tính chất)
      let subType = 'GENERAL_BUILDING';
      let isHazardous = false;

      if (element.tags) {
        if (element.tags['building'] === 'tank' || element.tags['industrial'] === 'tank') {
          subType = 'TANK';
          isHazardous = true;
          tankCount++;
        } else if (element.tags['building'] === 'warehouse' || element.tags['building'] === 'storage') {
          subType = 'WAREHOUSE';
          isHazardous = false;
          warehouseCount++;
        }
      }

      // Format lại data cho chuẩn với hệ thống của mình
      const path = element.geometry ? element.geometry.map(pt => [pt.lat, pt.lon]) : [];
      
      return {
        id: `osm-${element.id}`,
        zoneType: 'BUILDING',
        subType: subType,
        isHazardous: isHazardous,
        properties: { ...element.tags, subType, isHazardous },
        path: path,
        turfCoords: path.map(p => [p[1], p[0]]) // [lng, lat]
      };
    });

    console.log(`Đã xác định ${warehouseCount} kho hàng và ${tankCount} bể chứa từ OSM`);
    
    return buildings;
  } catch (error) {
    console.error("Lỗi Overpass API:", error);
    return [];
  }
};
