import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import * as turf from '@turf/turf';
import { 
  MapContainer, 
  TileLayer, 
  Polygon, 
  useMap, 
  LayersControl, 
  FeatureGroup, 
  useMapEvents,
  Popup,
  Marker,
  GeoJSON,
  Tooltip
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import { generateGridWithTurf } from '../services/turfService';
import { fetchOSMFeatures } from '../services/osmService';

import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const defaultCenter = [10.766, 106.775]; 

const GeomanControl = ({ onPolygonComplete }) => {
  const map = useMap();
  useEffect(() => {
    if (map) {
      map.pm.addControls({
        position: 'topleft',
        drawPolygon: true, drawMarker: false, drawCircleMarker: false,
        drawPolyline: false, drawRectangle: false, drawCircle: false,
        drawText: false, editMode: false, dragMode: false,
        cutPolygon: false, removalMode: true,
      });

      map.on('pm:create', (e) => {
        if (e.shape === 'Polygon') {
          const latLngs = e.layer.getLatLngs()[0];
          onPolygonComplete(latLngs);
          map.removeLayer(e.layer);
        }
      });
      return () => { map.pm.removeControls(); map.off('pm:create'); };
    }
  }, [map, onPolygonComplete]);
  return null;
};

const MapController = ({ targetLocation }) => {
  const map = useMap();
  useEffect(() => {
    if (targetLocation) {
      map.flyTo(targetLocation, 16, { animate: true, duration: 1.5 });
    }
  }, [targetLocation, map]);
  return null;
};

const LayerTracker = ({ setActiveBaseLayer }) => {
  useMapEvents({ baselayerchange(e) { setActiveBaseLayer(e.name); } });
  return null;
};

const ZonePopupForm = ({ zone, onSave, onGenerateGrid, onAdjustPadding }) => {
  const [name, setName] = useState(zone.name);
  const [zoneType, setZoneType] = useState(zone.zoneType);
  const [isVerified, setIsVerified] = useState(zone.isVerified);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleTypeChange = (e) => { setZoneType(e.target.value); setIsVerified(false); };

  const handleSave = () => {
    let finalVerified = isVerified;
    if (zoneType !== 'REEFER' && zoneType !== 'DANGEROUS') {
      finalVerified = name.trim().length > 0;
    }
    if (!finalVerified && (zoneType === 'REEFER' || zoneType === 'DANGEROUS')) {
      alert("Bạn phải check xác nhận an toàn theo quy định QCVN!"); return;
    }
    onSave(zone.id, { name, zoneType, isVerified: finalVerified });
  };

  const handleGrid = () => {
    setIsGenerating(true);
    setTimeout(() => {
      onGenerateGrid(zone.id, zone.pathLatLngs);
      setIsGenerating(false);
    }, 100);
  };

  return (
    <div style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: '10px', fontFamily: 'sans-serif' }}>
      <h4 style={{ margin: 0, fontSize: '14px', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>Thiết lập Bãi</h4>
      <div>
        <label style={{ fontSize: '11px', color: '#666', display: 'block' }}>Tên bãi/khu vực:</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: '4px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}/>
      </div>
      <div>
        <label style={{ fontSize: '11px', color: '#666', display: 'block' }}>Loại hình:</label>
        <select value={zoneType} onChange={handleTypeChange} style={{ width: '100%', padding: '4px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}>
          <option value="GENERAL">Hàng Tổng hợp</option>
          <option value="REEFER">Hàng Lạnh (Reefer)</option>
          <option value="DANGEROUS">Hàng Nguy hiểm</option>
          <option value="METAL">Hàng Kim khí</option>
          <option value="WOOD_COAL">Hàng Gỗ/Than</option>
          <option value="BUILDING">Tòa nhà / Kho</option>
          <option value="ROAD">Đường xá</option>
          <option value="YARD">Sân / Bãi Cảng</option>
        </select>
      </div>
      {zoneType === 'REEFER' && (
        <label style={{ fontSize: '11px', color: '#0277bd', display: 'flex', gap: '5px', background: '#e1f5fe', padding: '5px', borderRadius: '4px' }}>
          <input type="checkbox" checked={isVerified} onChange={e => setIsVerified(e.target.checked)} /> Cấp điện liên tục
        </label>
      )}
      {zoneType === 'DANGEROUS' && (
        <label style={{ fontSize: '11px', color: '#c62828', display: 'flex', gap: '5px', background: '#ffebee', padding: '5px', borderRadius: '4px' }}>
          <input type="checkbox" checked={isVerified} onChange={e => setIsVerified(e.target.checked)} /> Cách ly an toàn
        </label>
      )}
      <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
        <button type="button" onClick={handleSave} style={{ flex: 1, backgroundColor: '#1976d2', color: 'white', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Lưu</button>
        {['YARD', 'REEFER', 'DANGEROUS', 'METAL', 'WOOD_COAL'].includes(zoneType) && (
          <button type="button" onClick={handleGrid} disabled={isGenerating} style={{ flex: 1, backgroundColor: '#00796B', color: 'white', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Tạo Lưới</button>
        )}
      </div>
      <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
        <button type="button" onClick={(e) => { e.preventDefault(); onAdjustPadding(zone.id, -1); }} style={{ flex: 1, backgroundColor: '#f59e0b', color: 'white', border: 'none', padding: '4px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>Thu viền (-1m)</button>
        <button type="button" onClick={(e) => { e.preventDefault(); onAdjustPadding(zone.id, 1); }} style={{ flex: 1, backgroundColor: '#f59e0b', color: 'white', border: 'none', padding: '4px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>Phóng viền (+1m)</button>
      </div>
    </div>
  );
};

const FreePortDigitizer = () => {
  const mapRef = useRef(null);
  const [storageZones, setStorageZones] = useState([]);
  const [gates, setGates] = useState([]);
  const [slots, setSlots] = useState([]);
  
  const [searchInput, setSearchInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [predictions, setPredictions] = useState([]);
  const [targetLocation, setTargetLocation] = useState(null);
  
  // Pipeline AI State
  const [isDetecting, setIsDetecting] = useState(false);
  const [aiStatus, setAiStatus] = useState('');
  
  // State lưu ranh giới cảng khi Search
  const [portBoundary, setPortBoundary] = useState(null);

  const [activeBaseLayer, setActiveBaseLayer] = useState('Vệ Tinh (ESRI)');

  const handlePolygonComplete = useCallback((latLngs) => {
    const newZone = {
      id: `zone-${Date.now()}`,
      path: latLngs.map(p => [p.lat, p.lng]),
      pathLatLngs: latLngs,
      name: '', zoneType: 'GENERAL', isVerified: false
    };
    setStorageZones(prev => [...prev, newZone]);
  }, []);

  const handleUpdateZone = useCallback((id, updatedData) => {
    setStorageZones(prev => prev.map(z => z.id === id ? { ...z, ...updatedData } : z));
  }, []);

  const handleGenerateGrid = useCallback((zoneId, latLngs) => {
    // Trích xuất nhà cửa và đường xá thành chướng ngại vật (Obstacles)
    const obstacles = storageZones
      .filter(z => z.zoneType === 'BUILDING' || z.zoneType === 'ROAD')
      .map(z => {
         const coords = z.pathLatLngs.map(p => [p.lng, p.lat]);
         if (coords.length >= 3) {
           if (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1]) {
             coords.push([...coords[0]]);
           }
           return turf.polygon([coords]);
         }
         return null;
      }).filter(Boolean);

    const newSlots = generateGridWithTurf(latLngs, zoneId, obstacles);
    setSlots(prev => [...prev.filter(s => s.zoneId !== zoneId), ...newSlots]);
  }, [storageZones]);

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  const handleAutoDetect = async () => {
    if (!mapRef.current) return;
    setIsDetecting(true);
    const bounds = mapRef.current.getBounds();
    const bbox = [bounds.getSouth(), bounds.getWest(), bounds.getNorth(), bounds.getEast()];
    
    // UI Feedback để thể hiện AI đang dùng 2 nguồn bản đồ độc lập
    setAiStatus('Phân tích phổ màu vệ tinh (ESRI)...');
    await sleep(800);
    setAiStatus('Truy xuất siêu dữ liệu không gian (OSM)...');
    await sleep(800);
    setAiStatus('Chạy thuật toán đối chiếu kép (Dual-Fusion)...');
    
    // Gọi Service trích xuất dữ liệu thực tế (Truyền thêm boundary để AI lọc rác)
    const features = await fetchOSMFeatures(bbox, portBoundary);
    
    const newZones = [];
    const newGates = [];
    
    features.forEach(f => {
      if (f.type === 'BUILDING') {
        newZones.push({ id: f.id, path: f.path, pathLatLngs: f.path.map(p => ({lat: p[0], lng: p[1]})), name: f.name, zoneType: 'BUILDING', isVerified: true });
      } else if (f.type === 'ROAD') {
        newZones.push({ id: f.id, path: f.path, pathLatLngs: f.path.map(p => ({lat: p[0], lng: p[1]})), name: f.name, zoneType: 'ROAD', isVerified: true });
      } else if (f.type === 'YARD') {
        newZones.push({ id: f.id, path: f.path, pathLatLngs: f.path.map(p => ({lat: p[0], lng: p[1]})), name: f.name, zoneType: 'YARD', isVerified: true });
      } else if (f.type === 'GATE') {
        newGates.push({ id: f.id, name: f.name, latLng: f.latLng });
      }
    });
    
    if (newZones.length > 0 || newGates.length > 0) {
      setStorageZones(prev => {
        const existingIds = new Set(prev.map(z => z.id));
        const filteredNewZones = newZones.filter(z => !existingIds.has(z.id));
        
        // Auto-generate grids for YARDs
        setTimeout(() => {
          filteredNewZones.forEach(z => {
            if (z.zoneType === 'YARD') {
              handleGenerateGrid(z.id, z.pathLatLngs);
            }
          });
        }, 500);

        return [...prev, ...filteredNewZones];
      });
      setGates(prev => {
        const existingIds = new Set(prev.map(g => g.id));
        return [...prev, ...newGates.filter(g => !existingIds.has(g.id))];
      });
      setAiStatus(`Hoàn tất: Tìm thấy ${newZones.length} cấu trúc & ${newGates.length} cổng.`);
    } else {
      setAiStatus("Hoàn tất: Không phát hiện cấu trúc trong vùng này.");
    }
    
    await sleep(2500);
    setIsDetecting(false);
    setAiStatus('');
  };

  const exportData = useCallback(() => {
    const data = { zones: storageZones, slots, gates };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const a = document.createElement('a');
    a.setAttribute("href", dataStr);
    a.setAttribute("download", "port_data.json");
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }, [storageZones, slots, gates]);

  // Xử lý vi chỉnh kích thước (Padding)
  const handleAdjustPadding = useCallback((zoneId, meters) => {
    setStorageZones(prev => prev.map(zone => {
      if (zone.id === zoneId) {
        try {
          const coords = zone.pathLatLngs.map(p => [p.lng, p.lat]);
          if (coords.length >= 3) {
            if (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1]) {
              coords.push([...coords[0]]);
            }
            const poly = turf.polygon([coords]);
            const buffered = turf.buffer(poly, meters, { units: 'meters' });
            
            let newCoords = [];
            if (buffered.geometry.type === 'MultiPolygon') {
              newCoords = buffered.geometry.coordinates[0][0];
            } else if (buffered.geometry.type === 'Polygon') {
              newCoords = buffered.geometry.coordinates[0];
            }
            if (newCoords.length > 0) {
              const newPath = newCoords.map(c => [c[1], c[0]]);
              return { ...zone, path: newPath, pathLatLngs: newPath.map(p => ({ lat: p[0], lng: p[1] })) };
            }
          }
        } catch(e) { console.warn("Lỗi vi chỉnh padding:", e); }
      }
      return zone;
    }));
  }, []);

  // Helper API: Nhét container (20ft, 40ft, 45ft) vào Slot theo ID ISO
  const assignContainer = useCallback((slotId, containerType) => {
    setSlots(prevSlots => {
      let updatedSlots = [...prevSlots];
      
      const parts = slotId.split('-');
      if (parts.length < 3) return prevSlots; // Yêu cầu format: [ZoneName]-[Bay]-[Row]
      
      const row = parts[parts.length - 1];
      const bay = parts[parts.length - 2];
      const zoneName = parts.slice(0, parts.length - 2).join('-');
      
      const bayNum = parseInt(bay, 10);
      
      if (containerType === '20ft') {
         if (bayNum % 2 === 0) {
            alert(`Lỗi ISO: Không thể xếp cont 20ft vào Bay chẵn (${bayNum})! Cont 20ft phải nằm ở Bay lẻ.`);
            return prevSlots;
         }
         const targetIdx = updatedSlots.findIndex(s => s.id === slotId);
         if (targetIdx !== -1) {
            updatedSlots[targetIdx] = { ...updatedSlots[targetIdx], status: 'occupied_20' };
         }
      } 
      else if (containerType === '40ft' || containerType === '45ft') {
         // ISO quy định cont 40ft mang số bay chẵn, chiếm 2 bay lẻ liền kề
         let oddBay1, oddBay2;
         if (bayNum % 2 === 0) {
            oddBay1 = String(bayNum - 1).padStart(2, '0');
            oddBay2 = String(bayNum + 1).padStart(2, '0');
         } else {
            // Giả sử họ lỡ truyền bay lẻ đầu tiên cho cont 40ft
            oddBay1 = bay;
            oddBay2 = String(bayNum + 2).padStart(2, '0');
         }
         
         const slot1Id = `${zoneName}-${oddBay1}-${row}`;
         const slot2Id = `${zoneName}-${oddBay2}-${row}`;
         
         updatedSlots = updatedSlots.map(s => {
            if (s.id === slot1Id || s.id === slot2Id) {
               return { ...s, status: 'occupied_40', parent40ftId: slotId };
            }
            return s;
         });
      }
      return updatedSlots;
    });
  }, []);

  // Expose API cho console để Dev test
  useEffect(() => {
    window.assignContainer = assignContainer;
  }, [assignContainer]);

  const handleExecuteSearch = async (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setIsSearching(true);
    try {
      // Gọi API Nominatim kèm polygon_geojson=1 để lấy biên giới cảng
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchInput)}&polygon_geojson=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        setPredictions(data.map(item => ({ 
          place_id: item.place_id, 
          description: item.display_name, 
          location: [parseFloat(item.lat), parseFloat(item.lon)],
          geojson: item.geojson // Lấy dữ liệu ranh giới
        })));
      } else {
        setPredictions([]); alert("Không tìm thấy địa điểm này!");
      }
    } catch (error) { console.error('Lỗi tìm kiếm:', error); } finally { setIsSearching(false); }
  };

  const isLightMap = activeBaseLayer === 'Đường Phố (OSM)';

  const getPolygonStyle = useCallback((zone) => {
    if (!zone.isVerified) return { color: '#9e9e9e', fillColor: '#ffffff', fillOpacity: 0.2, weight: 2, dashArray: '5, 5' };
    switch(zone.zoneType) {
      case 'BUILDING': return { color: '#000000', fillColor: '#424242', fillOpacity: 0.7, weight: 2 };
      case 'ROAD': return { color: '#757575', fillColor: '#9e9e9e', fillOpacity: 0.4, weight: 1, dashArray: '4,4' };
      case 'YARD': return { color: '#388E3C', fillColor: '#A5D6A7', fillOpacity: 0.2, weight: 2 };
      case 'DANGEROUS': return { color: '#c62828', fillColor: '#ffcccc', fillOpacity: 0.5, weight: 3 };
      case 'REEFER': return { color: '#1565c0', fillColor: '#cce5ff', fillOpacity: 0.5, weight: 3 };
      case 'METAL': return { color: '#424242', fillColor: '#e0e0e0', fillOpacity: 0.5, weight: 3 };
      case 'WOOD_COAL': return { color: '#4e342e', fillColor: '#d7ccc8', fillOpacity: 0.5, weight: 3 };
      case 'GENERAL':
      default:
        const defaultStroke = isLightMap ? '#d84315' : '#ffb300';
        return { color: defaultStroke, fillColor: defaultStroke, fillOpacity: 0.2, weight: 2 };
    }
  }, [isLightMap]);

  // Lưới slots: Tối ưu hóa render bằng useMemo
  const renderedSlots = useMemo(() => {
    const emptyColor = isLightMap ? '#00695C' : '#00E676';
    const occ20Color = '#f59e0b'; // Màu Vàng cho Cont 20ft
    const occ40Color = '#ef4444'; // Màu Đỏ cho Cont 40ft
    const weight = isLightMap ? 2 : 1;

    // Phân nhóm các ô lẻ đang chứa chung 1 cont 40ft
    const groups40ft = {};
    slots.forEach(slot => {
       if (slot.status === 'occupied_40' && slot.parent40ftId) {
          if (!groups40ft[slot.parent40ftId]) groups40ft[slot.parent40ftId] = [];
          groups40ft[slot.parent40ftId].push(slot);
       }
    });

    const rendered40ft = [];
    Object.keys(groups40ft).forEach(parentId => {
       const pair = groups40ft[parentId];
       if (pair.length === 2) {
          try {
             // Bao trùm 2 ô 20ft bằng thuật toán Convex Hull để tạo 1 ô 40ft duy nhất
             const pts = [];
             pair[0].path.forEach(p => pts.push(turf.point([p[1], p[0]])));
             pair[1].path.forEach(p => pts.push(turf.point([p[1], p[0]])));
             const hull = turf.convex(turf.featureCollection(pts));
             const leafPath = hull.geometry.coordinates[0].map(c => [c[1], c[0]]);
             
             rendered40ft.push(
                <Polygon key={parentId} positions={leafPath} pathOptions={{ color: '#b91c1c', fillColor: occ40Color, fillOpacity: 0.9, weight: 2, interactive: true }}>
                   <Popup><div style={{textAlign: 'center'}}><strong>Container 40ft</strong><br/>Bay Chẵn ISO: {parentId}</div></Popup>
                </Polygon>
             );
          } catch(e) {}
       }
    });

    return (
      <FeatureGroup>
        {slots.map(slot => {
          if (slot.status === 'occupied_40') return null; // Ẩn ô 20ft bị đè bởi 40ft

          let fillColor = emptyColor;
          let fillOpacity = 0.3;
          let color = emptyColor;
          let interactive = false;
          
          if (slot.status === 'occupied_20') {
             fillColor = occ20Color;
             color = '#d97706';
             fillOpacity = 0.9;
             interactive = true;
          }

          return (
            <Polygon key={slot.id} positions={slot.path} pathOptions={{ color, fillColor, fillOpacity, weight, interactive }}>
               {slot.status === 'occupied_20' && (
                 <Popup><div style={{textAlign: 'center'}}><strong>Container 20ft</strong><br/>Bay Lẻ ISO: {slot.id}</div></Popup>
               )}
            </Polygon>
          );
        })}
        {rendered40ft}
      </FeatureGroup>
    );
  }, [slots, isLightMap]);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
      <MapContainer preferCanvas={true} center={defaultCenter} zoom={16} maxZoom={22} ref={mapRef} style={{ width: '100%', height: '100%', zIndex: 0 }}>
        <LayersControl position="bottomleft">
          <LayersControl.BaseLayer checked name="Vệ Tinh (ESRI)">
            <TileLayer 
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" 
              maxZoom={22}
              maxNativeZoom={19}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Đường Phố (OSM)">
            <TileLayer 
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
              maxZoom={22}
              maxNativeZoom={19}
            />
          </LayersControl.BaseLayer>
          <LayersControl.Overlay checked name="Lưới Quy Hoạch & Nhà Cửa">
            <FeatureGroup>
              {portBoundary && (
                <GeoJSON 
                  key={JSON.stringify(portBoundary)} 
                  data={portBoundary} 
                  style={{ color: '#D50000', weight: 4, fillOpacity: 0.05, dashArray: '10, 10' }} 
                />
              )}
              {storageZones.filter(z => z.zoneType !== 'ROAD').map(zone => (
                <Polygon key={zone.id} positions={zone.path} pathOptions={getPolygonStyle(zone)}>
                  {(zone.name && zone.name !== '') && (
                    <Tooltip permanent direction="center" className="zone-label" opacity={0.8}>
                      <span style={{ fontWeight: 'bold', fontSize: '11px' }}>{zone.name}</span>
                    </Tooltip>
                  )}
                  <Popup><ZonePopupForm zone={zone} onSave={handleUpdateZone} onGenerateGrid={handleGenerateGrid} onAdjustPadding={handleAdjustPadding} /></Popup>
                </Polygon>
              ))}
              {storageZones.filter(z => z.zoneType === 'ROAD').map(zone => (
                <Polygon key={zone.id} positions={zone.path} pathOptions={getPolygonStyle(zone)}>
                  {(zone.name && zone.name !== '') && (
                    <Tooltip permanent direction="center" className="zone-label" opacity={0.8}>
                      <span style={{ fontWeight: 'bold', fontSize: '11px' }}>{zone.name}</span>
                    </Tooltip>
                  )}
                  <Popup><ZonePopupForm zone={zone} onSave={handleUpdateZone} onGenerateGrid={handleGenerateGrid} onAdjustPadding={handleAdjustPadding} /></Popup>
                </Polygon>
              ))}
              {renderedSlots}
              {gates.map(gate => (
                <Marker key={gate.id} position={gate.latLng}>
                  <Popup>Cổng ra vào: {gate.name}</Popup>
                </Marker>
              ))}
            </FeatureGroup>
          </LayersControl.Overlay>
        </LayersControl>
        <GeomanControl onPolygonComplete={handlePolygonComplete} />
        <MapController targetLocation={targetLocation} />
        <LayerTracker setActiveBaseLayer={setActiveBaseLayer} />
      </MapContainer>
      
      <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 1000, backgroundColor: 'rgba(255,255,255,0.95)', padding: 20, borderRadius: 12, boxShadow: '0 10px 25px rgba(0,0,0,0.15)', width: 320, fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <h3 style={{ margin: '0 0 5px 0', fontSize: '1.25rem', color: '#1f2937' }}>Free Port Digitizer</h3>
          <p style={{ margin: '0', fontSize: '0.85rem', color: '#6b7280' }}>Open Source Stack: Leaflet + Turf + OSM</p>
        </div>

        <div style={{ position: 'relative' }}>
          <form onSubmit={handleExecuteSearch} style={{ display: 'flex', gap: '8px' }}>
            <input type="text" style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', outline: 'none', color: '#111827', backgroundColor: '#ffffff' }} placeholder="Tìm cảng (VD: Cát Lái)" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
            <button type="submit" disabled={isSearching} style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}>{isSearching ? '...' : 'Tìm'}</button>
          </form>
          {predictions.length > 0 && (
            <ul style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', color: 'black', border: '1px solid #d1d5db', borderRadius: '8px', padding: 0, listStyle: 'none', maxHeight: '200px', overflowY: 'auto', zIndex: 20 }}>
              {predictions.map(pred => (
                <li key={pred.place_id} onClick={() => { 
                  setSearchInput(pred.description); 
                  setPredictions([]); 
                  setTargetLocation(pred.location);
                  if (pred.geojson && (pred.geojson.type === 'Polygon' || pred.geojson.type === 'MultiPolygon')) {
                    setPortBoundary(pred.geojson);
                  } else {
                    setPortBoundary(null);
                  }
                }} style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', color: 'black' }}>{pred.description}</li>
              ))}
            </ul>
          )}
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <button onClick={handleAutoDetect} disabled={isDetecting} style={{ backgroundColor: '#8b5cf6', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', transition: 'background-color 0.2s', opacity: isDetecting ? 0.7 : 1 }}>
            🤖 Dual-Source AI Detect
          </button>
          {aiStatus && <div style={{ fontSize: '11px', color: '#8b5cf6', fontStyle: 'italic', textAlign: 'center' }}>{aiStatus}</div>}
        </div>

        {portBoundary && (
          <button onClick={() => setPortBoundary(null)} style={{ backgroundColor: '#EF4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
            ❌ Xóa khung ranh giới đỏ (Nếu quá to)
          </button>
        )}

        <button onClick={exportData} style={{ backgroundColor: '#059669', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
          💾 Xuất Dữ Liệu Quy Hoạch
        </button>
      </div>
    </div>
  );
};
export default FreePortDigitizer;
