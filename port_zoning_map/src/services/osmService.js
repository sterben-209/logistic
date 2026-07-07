import * as turf from '@turf/turf';

export const fetchOSMFeatures = async (bbox, portBoundaryGeoJSON = null) => {
  const query = `
    [out:json][timeout:25];
    (
      way["building"](${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]});
      way["industrial"="tank"](${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]});
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

  const endpoints = [
    'https://overpass.osm.ch/api/interpreter',
    'https://lz4.overpass-api.de/api/interpreter',
    'https://overpass-api.de/api/interpreter'
  ];
  
  let data = null;
  let lastError = null;

  for (const url of endpoints) {
    try {
      console.log("Đang thử fetch từ:", url);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'data=' + encodeURIComponent(query)
      });
      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }
      
      const text = await response.text();
      // Bắt lỗi Gateway Timeout trả về HTML thay vì JSON
      if (text.trim().startsWith('<')) {
        throw new SyntaxError("Response is HTML/XML, not JSON (Probably Gateway Timeout)");
      }
      
      data = JSON.parse(text);
      break; // Thành công thì thoát vòng lặp
    } catch (e) {
      console.warn("Overpass API endpoint failed:", url.split('?')[0], e.message);
      lastError = e;
    }
  }

  if (!data) {
    console.error("Tất cả các server Overpass đều thất bại:", lastError);
    // Trả về mảng rỗng thay vì làm crash app
    return [];
  }
  
  try {
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
          
          if ((el.tags.building || el.tags.industrial === 'tank') && path.length >= 3) {
            const poly = turf.polygon([[...path.map(p => [p[1], p[0]]), [path[0][1], path[0][0]]]]);
            const area = turf.area(poly);
            
            // Logic phân tách WAREHOUSE và TANK (Dựa trên Tag)
            let subType = 'GENERAL_BUILDING';
            let isHazardous = false;

            if (el.tags['building'] === 'tank' || el.tags['industrial'] === 'tank') {
              subType = 'TANK';
              isHazardous = true;
            } else if (el.tags['building'] === 'warehouse' || el.tags['building'] === 'storage') {
              subType = 'WAREHOUSE';
              isHazardous = false;
            }

            // AI DỰ ĐOÁN HÌNH DÁNG (Shape Analysis) - Khắc phục việc OSM lười tag!
            if (subType === 'GENERAL_BUILDING') {
              try {
                // Tạo một LineString để tính chu vi
                const line = turf.lineString([...path.map(p => [p[1], p[0]]), [path[0][1], path[0][0]]]);
                const perimeter = turf.length(line, { units: 'meters' });
                
                if (perimeter > 0) {
                  // Công thức Circularity (Độ tròn): 4 * PI * Area / (Perimeter^2)
                  // Tròn hoàn hảo = 1. Vuông = 0.785. Chữ nhật = < 0.7. Bát giác (OSM vẽ) ~ 0.94
                  const circularity = (4 * Math.PI * area) / (perimeter * perimeter);
                  
                  if (circularity > 0.85) {
                    subType = 'TANK';
                    isHazardous = true;
                    console.log(`AI Shape Detect: Đã nhận diện 1 Bồn chứa (TANK) bằng hình học. Độ tròn: ${circularity.toFixed(2)}`);
                  } else if (area > 2000 && circularity < 0.75) {
                    // Kho bãi thường rất lớn và vuông vức / chữ nhật dài
                    subType = 'WAREHOUSE';
                  }
                }
              } catch (e) {
                // Bỏ qua nếu lỗi tính toán hình học
              }
            }

            let allowedCargo = [];
            if (subType === 'WAREHOUSE') {
              allowedCargo = ['ELECTRONICS'];
            }

            // Nếu OSM chỉ ghi chung chung building thì áp dụng luật chia block/bldg cũ
            if (subType === 'GENERAL_BUILDING' && area > 50 && area < 30000) {
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
                subType: subType,
                isHazardous: isHazardous,
                allowedCargo: allowedCargo,
                properties: { ...el.tags, subType, isHazardous, allowedCargo },
                name: el.tags.name || el.tags.ref || (subType === 'TANK' ? 'Bồn chứa hóa chất' : (subType === 'WAREHOUSE' ? 'Nhà kho / Storage' : 'Tòa nhà')),
                path: path
              });
            }
          } 
          else if (el.tags.highway) {
            // Loại bỏ các đường không dành cho xe tải / container
            const excludedHighways = ['footway', 'path', 'pedestrian', 'steps', 'cycleway', 'corridor', 'track'];
            if (excludedHighways.includes(el.tags.highway)) return;

            if (el.tags.area === 'yes') {
               features.push({
                id: `osm-road-${el.id}`,
                type: 'ROAD',
                name: el.tags.name || 'Khu vực lưu thông chung',
                path: path
              });
            } else {
              const line = turf.lineString(path.map(p => [p[1], p[0]]));
              roadLineStrings.push(line);

              features.push({
                id: `osm-roadline-${el.id}`,
                type: 'ROAD_LINE',
                name: el.tags.name || 'Đường nội bộ',
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
          
          // Kết hợp Cách 1: Giao cắt giữa đường OSM và khung ranh giới cảng để tìm Cổng chính xác
          if (roadLineStrings.length > 0) {
            try {
               const boundaryLines = turf.polygonToLine(boundaryPolygon);
               const tempGates = [];
               roadLineStrings.forEach(roadLine => {
                  // Giảm bộ lọc độ dài xuống 15 mét vì trong nội thành nhiều đoạn đường (way) bị cắt rất ngắn
                  const length = turf.length(roadLine, { units: 'meters' });
                  if (length < 15) return;

                  const intersections = turf.lineIntersect(boundaryLines, roadLine);
                  intersections.features.forEach(pt => {
                      tempGates.push([pt.geometry.coordinates[1], pt.geometry.coordinates[0]]);
                  });
               });
               
               // Clustering: Gộp các cổng cách nhau dưới 20 mét
               const clusteredGates = [];
               tempGates.forEach(pt1 => {
                   let isMerged = false;
                   for (let i = 0; i < clusteredGates.length; i++) {
                       const pt2 = clusteredGates[i];
                       const dist = turf.distance(turf.point([pt1[1], pt1[0]]), turf.point([pt2[1], pt2[0]]), { units: 'meters' });
                       if (dist < 20) {
                           isMerged = true;
                           break;
                       }
                   }
                   if (!isMerged) clusteredGates.push(pt1);
               });

               clusteredGates.forEach((pt, idx) => {
                  features.push({
                    id: `osm-gate-auto-${Date.now()}-${idx}`,
                    type: 'GATE',
                    name: `Cổng AI ${idx + 1}`,
                    latLng: { lat: pt[0], lng: pt[1] }
                  });
               });
            } catch(e) {
               console.warn("Lỗi tính giao điểm Cổng AI", e);
            }
          }
        }
      } catch (e) {
        console.warn("Lỗi parse boundary", e);
      }

      if (boundaryPolygon) {
        return features.filter(f => {
          try {
            if (f.type === 'GATE') {
              // latLng là object {lat, lng} hoặc mảng [lat, lng]
              const lng = f.latLng.lng !== undefined ? f.latLng.lng : f.latLng[1];
              const lat = f.latLng.lat !== undefined ? f.latLng.lat : f.latLng[0];
              const pt = turf.point([lng, lat]);
              // Dùng điểm giao cắt nên nó nằm trên ranh giới, mặc định Turf tính là In
              return turf.booleanPointInPolygon(pt, boundaryPolygon);
            } else {
              // Với đường/nhà, lấy 1 điểm đại diện hoặc tâm để test
              const pt = turf.point([f.path[0][1], f.path[0][0]]); // [lng, lat]
              return turf.booleanPointInPolygon(pt, boundaryPolygon);
            }
          } catch(e) { 
            console.warn("Lọc lỗi:", e);
            return false; 
          }
        });
      }
    }

    return features;
  } catch (error) {
    console.error("Lỗi Overpass API:", error);
    return [];
  }
};
