// src/services/mapService.js

export const mockAiScanPort = (bounds) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      
      const latSpan = ne.lat() - sw.lat();
      const lngSpan = ne.lng() - sw.lng();

      const numPolygons = Math.floor(Math.random() * 2) + 3; 
      const polygons = [];

      for (let i = 0; i < numPolygons; i++) {
        const centerLat = sw.lat() + latSpan * (0.2 + Math.random() * 0.6);
        const centerLng = sw.lng() + lngSpan * (0.2 + Math.random() * 0.6);

        const polyLatSpan = latSpan * (0.05 + Math.random() * 0.05);
        const polyLngSpan = lngSpan * (0.05 + Math.random() * 0.05);

        const path = [
          { lat: centerLat - polyLatSpan/2, lng: centerLng - polyLngSpan/2 },
          { lat: centerLat - polyLatSpan/2, lng: centerLng + polyLngSpan/2 },
          { lat: centerLat + polyLatSpan/2, lng: centerLng + polyLngSpan/2 },
          { lat: centerLat + polyLatSpan/2, lng: centerLng - polyLngSpan/2 }
        ];

        polygons.push({
          id: `ai-zone-${Date.now()}-${i}`,
          path: path
        });
      }

      resolve(polygons);
    }, 2500); 
  });
};

export const generateGridForPolygon = (polygonPathArray) => {
  if (!window.google || !window.google.maps || !window.google.maps.geometry) {
    return [];
  }
  
  const spherical = window.google.maps.geometry.spherical;
  const polyUtil = window.google.maps.geometry.poly;

  const path = polygonPathArray.map(p => new window.google.maps.LatLng(p.lat, p.lng));
  const polygon = new window.google.maps.Polygon({ paths: path });

  let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
  path.forEach(p => {
    if (p.lat() < minLat) minLat = p.lat();
    if (p.lat() > maxLat) maxLat = p.lat();
    if (p.lng() < minLng) minLng = p.lng();
    if (p.lng() > maxLng) maxLng = p.lng();
  });

  const sw = new window.google.maps.LatLng(minLat, minLng);
  const nw = new window.google.maps.LatLng(maxLat, minLng);
  const se = new window.google.maps.LatLng(minLat, maxLng);

  const heightMeters = spherical.computeDistanceBetween(sw, nw);
  const widthMeters = spherical.computeDistanceBetween(sw, se);

  const SLOT_WIDTH = 3;
  const SLOT_HEIGHT = 13;
  const PADDING = 0.5; 

  const cols = Math.floor(widthMeters / (SLOT_WIDTH + PADDING));
  const rows = Math.floor(heightMeters / (SLOT_HEIGHT + PADDING));

  const slots = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const offsetX = (c * (SLOT_WIDTH + PADDING)) + (SLOT_WIDTH / 2);
      const offsetY = (r * (SLOT_HEIGHT + PADDING)) + (SLOT_HEIGHT / 2);

      const pointLat = spherical.computeOffset(sw, offsetY, 0); 
      const center = spherical.computeOffset(pointLat, offsetX, 90); 

      const n = spherical.computeOffset(center, SLOT_HEIGHT/2, 0);
      const s = spherical.computeOffset(center, SLOT_HEIGHT/2, 180);
      const e = spherical.computeOffset(center, SLOT_WIDTH/2, 90);
      const w = spherical.computeOffset(center, SLOT_WIDTH/2, -90);
      
      const tl = new window.google.maps.LatLng(n.lat(), w.lng());
      const tr = new window.google.maps.LatLng(n.lat(), e.lng());
      const bl = new window.google.maps.LatLng(s.lat(), w.lng());
      const br = new window.google.maps.LatLng(s.lat(), e.lng());

      if (
        polyUtil.containsLocation(center, polygon) &&
        polyUtil.containsLocation(tl, polygon) &&
        polyUtil.containsLocation(tr, polygon) &&
        polyUtil.containsLocation(bl, polygon) &&
        polyUtil.containsLocation(br, polygon)
      ) {
        slots.push({
          id: `slot-${r}-${c}-${Date.now()}`,
          path: [
            { lat: tl.lat(), lng: tl.lng() },
            { lat: tr.lat(), lng: tr.lng() },
            { lat: br.lat(), lng: br.lng() },
            { lat: bl.lat(), lng: bl.lng() }
          ]
        });
      }
    }
  }

  return slots;
};

// Tìm kiếm Cảng bằng SerpApi (Google Maps Engine)
export const searchPortsWithSerpApi = async (query) => {
  if (!query) return [];
  
  // Lưu ý: Cần nhập API Key của SerpApi. Gọi trực tiếp từ frontend có thể bị CORS
  // Trong code này mình bọc qua 1 CORS proxy miễn phí (allorigins) để bạn dễ test trực tiếp trên trình duyệt.
  const API_KEY = 'YOUR_SERPAPI_KEY'; 
  
  try {
    const url = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(query)}&api_key=${API_KEY}`;
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(proxyUrl);
    const data = await response.json();
    const parsedData = JSON.parse(data.contents);

    if (parsedData.local_results) {
      return parsedData.local_results.map(result => ({
        place_id: result.place_id || result.data_id || Math.random().toString(),
        description: result.title + (result.address ? ` - ${result.address}` : ''),
        location: result.gps_coordinates ? {
          lat: result.gps_coordinates.latitude,
          lng: result.gps_coordinates.longitude
        } : null
      })).filter(r => r.location !== null);
    }
    return [];
  } catch (error) {
    console.error('Lỗi khi gọi SerpApi:', error);
    return [];
  }
};

// Giả lập API Backend gọi kiểm tra dữ liệu đã có hay chưa
export const fetchMapData = (portId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Mock logict: nếu là 'ChIJC3d2x9sodTERt1uR4eOqA6g' (id cụ thể nào đó) thì có data
      // Để dễ test, ta quy ước nếu chọn bất kỳ port nào khác thì là chưa quy hoạch (null)
      resolve(null);
    }, 1200);
  });
};
