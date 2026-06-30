import * as turf from '@turf/turf';

export const fetchOSMFeatures = async (bbox, portBoundaryGeoJSON = null) => {
  const query = `
    [out:json][timeout:25];
    (
      way["building"](${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]});
      node["barrier"="gate"](${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]});
      way["highway"](${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]});
      way["landuse"="industrial"](${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]});
      way["industrial"="port"](${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]});
      way["man_made"](${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]});
      way["amenity"="parking"](${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]});
      way["landuse"="brownfield"](${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]});
    );
    out body;
    >;
    out skel qt;
  `;

  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    const nodes = {};
    const features = [];
    const roadLineStrings = []; // Lưu trữ tim đường để tạo block tự động
    
    data.elements.forEach(el => {
      if (el.type === 'node') {
        nodes[el.id] = [el.lat, el.lon];
        if (el.tags && el.tags.barrier === 'gate') {
          features.push({
            id: `osm-gate-${el.id}`,
            type: 'GATE',
            name: el.tags.name || 'Cổng',
            latLng: [el.lat, el.lon]
          });
        }
      }
    });

    data.elements.forEach(el => {
      if (el.type === 'way' && el.tags) {
        const path = el.nodes.map(nodeId => nodes[nodeId]).filter(Boolean);
        if (path.length >= 2) {
          
          if (el.tags.building && path.length >= 3) {
            const poly = turf.polygon([[...path.map(p => [p[1], p[0]]), [path[0][1], path[0][0]]]]);
            const area = turf.area(poly);
            
            if (area > 50 && area < 30000) {
               features.push({
                id: `osm-yard-${el.id}`,
                type: 'YARD',
                name: el.tags.name || el.tags.ref || 'Block (OSM)',
                path: path
              });
            } else {
              features.push({
                id: `osm-bldg-${el.id}`,
                type: 'BUILDING',
                name: el.tags.name || el.tags.ref || 'Tòa nhà / Kho',
                path: path
              });
            }
          } 
          else if (el.tags.highway) {
            // Biến đường kẻ (LineString) thành một vùng đa giác (Polygon) rộng 6 mét (buffer 3m mỗi bên)
            if (path[0][0] !== path[path.length - 1][0] || path[0][1] !== path[path.length - 1][1]) {
              const line = turf.lineString(path.map(p => [p[1], p[0]]));
              roadLineStrings.push(line);

              const buffer = turf.buffer(line, 4, { units: 'meters' });
              const leafPath = buffer.geometry.coordinates[0].map(coord => [coord[1], coord[0]]);
              features.push({
                id: `osm-road-${el.id}`,
                type: 'ROAD',
                name: el.tags.name || 'Đường nội bộ',
                path: leafPath
              });
            } else {
               // Là đường vòng khép kín hoặc area=yes
               features.push({
                id: `osm-road-${el.id}`,
                type: 'ROAD',
                name: el.tags.name || 'Vòng xuyến / Sân',
                path: path
              });
            }
          }
          else if ((el.tags.landuse === 'industrial' || el.tags.landuse === 'brownfield' || el.tags.industrial === 'port' || el.tags.man_made || el.tags.amenity === 'parking') && path.length >= 3) {
            const poly = turf.polygon([[...path.map(p => [p[1], p[0]]), [path[0][1], path[0][0]]]]);
            const area = turf.area(poly);
            
            let isParentZone = false;
            
            if (el.tags.industrial === 'port' || el.tags.landuse === 'industrial') {
              // Tăng lên 35,000m2 để bắt được cả những bãi quy hoạch lớn chưa được chia lô nhỏ
              if (area > 35000) isParentZone = true;
            } else {
              // Các bãi đỗ xe, bãi đất trống, sân nhân tạo
              if (area > 60000) isParentZone = true;
            }

            if (!isParentZone) {
              features.push({
                id: `osm-yard-${el.id}`,
                type: 'YARD',
                name: el.tags.name || el.tags.ref || 'Sân / Bãi Cảng',
                path: path
              });
            } else {
              features.push({
                id: `osm-gen-${el.id}`,
                type: 'GENERAL',
                name: el.tags.name || el.tags.ref || 'Khu Vực Tổng Hợp',
                path: path
              });
            }
          }
        }
      }
    });

    // THUẬT TOÁN TÌM KHU ĐẤT TRỐNG GIỮA CÁC CON ĐƯỜNG (Polygonize)
    if (roadLineStrings.length > 0) {
      try {
        const polygonized = turf.polygonize(turf.featureCollection(roadLineStrings));
        if (polygonized && polygonized.features) {
          polygonized.features.forEach((polyFeature, idx) => {
            const area = turf.area(polyFeature);
            // Block bãi trống trong cảng có thể rất lớn (từ 500m2 đến 200,000m2)
            if (area > 500 && area < 200000) {
              const centerPt = turf.centerOfMass(polyFeature);
              let isOverlapping = false;
              
              // Kiểm tra xem khoảng trống này đã có bãi (YARD) hoặc nhà (BUILDING) bự nào đè lên chưa
              for (const f of features) {
                if (f.type === 'YARD' || f.type === 'BUILDING') {
                  const fCoords = f.path.map(p => [p[1], p[0]]);
                  if (fCoords.length >= 3) {
                    if (fCoords[0][0] !== fCoords[fCoords.length - 1][0] || fCoords[0][1] !== fCoords[fCoords.length - 1][1]) {
                      fCoords.push([...fCoords[0]]);
                    }
                    try {
                      const fPoly = turf.polygon([fCoords]);
                      const fArea = turf.area(fPoly);
                      // Nếu có một bãi/tòa nhà đã tồn tại chiếm hơn 50% diện tích của block này thì bỏ qua
                      if (fArea > area * 0.5) {
                        if (turf.booleanPointInPolygon(centerPt, fPoly)) {
                          isOverlapping = true; break;
                        }
                      }
                    } catch(e) {}
                  }
                }
              }

              // Nếu là khoảng đất trống thực sự chưa ai khai báo
              if (!isOverlapping) {
                let finalPoly = polyFeature;
                // Thu nhỏ đa giác (Negative Buffer) lại 5 mét để lùi vào trong, tránh đè lên mép đường 4m
                try {
                  const shrunken = turf.buffer(polyFeature, -5, { units: 'meters' });
                  if (shrunken && shrunken.geometry && shrunken.geometry.coordinates.length > 0) {
                     finalPoly = shrunken;
                  }
                } catch(e) { console.warn("Lỗi thu nhỏ đa giác:", e); }

                let coords = [];
                if (finalPoly.geometry.type === 'MultiPolygon') {
                   coords = finalPoly.geometry.coordinates[0][0];
                } else if (finalPoly.geometry.type === 'Polygon') {
                   coords = finalPoly.geometry.coordinates[0];
                } else {
                   return; // Thay vì continue trong forEach
                }

                const leafPath = coords.map(c => [c[1], c[0]]);
                features.push({
                  id: `osm-autoyard-${idx}`,
                  type: 'YARD',
                  name: `Bãi Trống AI`,
                  path: leafPath
                });
              }
            }
          });
        }
      } catch (e) {
        console.warn("Lỗi khi dùng Polygonize tìm bãi trống:", e);
      }
    }

    // Lọc bằng Turf.js nếu có portBoundaryGeoJSON
    if (portBoundaryGeoJSON) {
      let boundaryPolygon;
      try {
        if (portBoundaryGeoJSON.type === 'Polygon' || portBoundaryGeoJSON.type === 'MultiPolygon') {
          boundaryPolygon = portBoundaryGeoJSON; // Đã là geojson chuẩn từ Nominatim
        }
      } catch (e) {
        console.warn("Lỗi parse boundary", e);
      }

      if (boundaryPolygon) {
        return features.filter(f => {
          try {
            if (f.type === 'GATE') {
              const pt = turf.point([f.latLng[1], f.latLng[0]]); // [lng, lat]
              return turf.booleanPointInPolygon(pt, boundaryPolygon);
            } else {
              // Với đường/nhà, lấy 1 điểm đại diện hoặc tâm để test
              const pt = turf.point([f.path[0][1], f.path[0][0]]); // [lng, lat]
              return turf.booleanPointInPolygon(pt, boundaryPolygon);
            }
          } catch(e) { return false; }
        });
      }
    }

    return features;
  } catch (error) {
    console.error("Lỗi Overpass API:", error);
    return [];
  }
};
