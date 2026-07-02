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
  Tooltip,
  Polyline
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import { generateGridWithTurf, createFlatBufferPolygon } from '../services/turfService';
import { fetchOSMFeatures } from '../services/osmService';
import { buildGraph, findShortestPath } from '../services/routingService';
import { saveMapData, loadMapData, logout, loadLocalCheData, syncCheData } from '../services/supabaseService';

import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const defaultCenter = [10.766, 106.775]; 

const GeomanControl = ({ onPolygonComplete, onPolylineComplete, onMarkerComplete }) => {
  const map = useMap();
  useEffect(() => {
    if (map) {
      map.pm.addControls({
        position: 'topleft',
        drawPolygon: true, drawMarker: true, drawCircleMarker: false,
        drawPolyline: true, drawRectangle: true, drawCircle: false,
        drawText: false, editMode: false, dragMode: false,
        cutPolygon: false, removalMode: true,
      });

      map.on('pm:create', (e) => {
        if (e.shape === 'Polygon' || e.shape === 'Rectangle') {
          const latLngs = e.layer.getLatLngs()[0];
          onPolygonComplete(latLngs);
          map.removeLayer(e.layer);
        } else if (e.shape === 'Line') {
          const latLngs = e.layer.getLatLngs();
          if (onPolylineComplete) onPolylineComplete(latLngs);
          map.removeLayer(e.layer);
        } else if (e.shape === 'Marker') {
          const latLng = e.layer.getLatLng();
          if (onMarkerComplete) onMarkerComplete(latLng);
          map.removeLayer(e.layer);
        }
      });
      return () => { map.pm.removeControls(); map.off('pm:create'); };
    }
  }, [map, onPolygonComplete, onPolylineComplete, onMarkerComplete]);
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

const ZoomTracker = ({ onZoomChange }) => {
  const map = useMapEvents({
    zoomend() {
      onZoomChange(map.getZoom());
    }
  });
  return null;
};

// Helper bóc tách ID
const parseSlotId = (slotId) => {
  const parts = slotId.split('-');
  if (parts.length < 3) return null;
  return {
    row: parts[parts.length - 1],
    bay: parts[parts.length - 2],
    zoneId: parts.slice(0, parts.length - 2).join('-')
  };
};

const HoverInfoPanel = ({ inventory }) => {
  const [hoveredSlotData, setHoveredSlotData] = useState(null);

  useEffect(() => {
    const handleHover = (e) => setHoveredSlotData(e.detail);
    window.addEventListener('slotHover', handleHover);
    return () => window.removeEventListener('slotHover', handleHover);
  }, []);

  const stackedContainers = useMemo(() => {
    if (!hoveredSlotData || !hoveredSlotData.id) return [];
    
    const parsed = parseSlotId(hoveredSlotData.id);
    if (!parsed) return [];
    
    const { zoneId, bay, row } = parsed;
    const hoveredBayNum = parseInt(bay, 10);
    
    const filtered = inventory.filter(c => {
      if (c.zoneId !== zoneId || c.row !== row) return false;
      const cBayNum = parseInt(c.bay, 10);
      
      if (hoveredBayNum % 2 === 0) {
         return cBayNum === hoveredBayNum || cBayNum === hoveredBayNum - 1 || cBayNum === hoveredBayNum + 1;
      } else {
         if (c.size === 20) {
            return cBayNum === hoveredBayNum;
         } else if (c.size === 40 || c.size === 45) {
            return cBayNum === hoveredBayNum - 1 || cBayNum === hoveredBayNum + 1;
         }
      }
      return false;
    });
    
    return filtered.sort((a, b) => b.tier - a.tier);
  }, [hoveredSlotData, inventory]);

  if (!hoveredSlotData) return null;
  const parsed = parseSlotId(hoveredSlotData.id);

  return (
    <div style={{ position: 'absolute', bottom: 20, right: 20, zIndex: 1000, backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)', padding: '15px 20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', color: '#f8fafc', minWidth: '260px', pointerEvents: 'auto', fontFamily: 'sans-serif' }}>
      <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#38bdf8', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
           <span>📍</span> Tọa độ: {parsed.zoneId} - Bay {parsed.bay} - Row {parsed.row}
        </div>
        <div style={{ fontSize: '11px', color: '#94a3b8', userSelect: 'all', cursor: 'text', pointerEvents: 'auto' }}>
           ID: {hoveredSlotData.id}
        </div>
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {stackedContainers.length === 0 ? (
          <div style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '10px 0' }}>Bãi trống (Empty Slot)</div>
        ) : (
          stackedContainers.map(cont => (
            <div key={`${cont.containerNo}-${cont.tier}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: cont.type === 'REEFER' ? 'rgba(14, 165, 233, 0.2)' : 'rgba(255,255,255,0.05)', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', borderLeft: `3px solid ${cont.type === 'REEFER' ? '#0ea5e9' : '#f59e0b'}` }}>
              <span><strong style={{ color: '#cbd5e1' }}>Tầng {cont.tier}</strong> {cont.type === 'REEFER' ? '❄️' : ''}</span>
              <span style={{ color: '#94a3b8' }}>{cont.size}ft</span>
              <strong style={{ color: '#fbbf24', letterSpacing: '0.5px' }}>{cont.containerNo}</strong>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const ZonePopupForm = ({ zone, onSave, onGenerateGrid, onAdjustPadding }) => {
  const [name, setName] = useState(zone.name);
  const [zoneType, setZoneType] = useState(zone.zoneType);
  const [isVerified, setIsVerified] = useState(zone.isVerified);
  const [isGenerating, setIsGenerating] = useState(false);
  const [bearing, setBearing] = useState(zone.bearing || 0);

  const handleTypeChange = (e) => { setZoneType(e.target.value); setIsVerified(false); };

  const handleSave = () => {
    let finalVerified = isVerified;
    if (zoneType !== 'REEFER' && zoneType !== 'DANGEROUS') {
      finalVerified = name.trim().length > 0;
    }
    if (!finalVerified && (zoneType === 'REEFER' || zoneType === 'DANGEROUS')) {
      alert("Bạn phải check xác nhận an toàn theo quy định QCVN!"); return;
    }
    onSave(zone.id, { name, zoneType, isVerified: finalVerified, bearing });
  };

  const handleGrid = () => {
    setIsGenerating(true);
    setTimeout(() => {
      onGenerateGrid(zone.id, zone.pathLatLngs, name, bearing);
      setIsGenerating(false);
    }, 400);
  };

  return (
    <div style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: '10px', fontFamily: 'sans-serif' }}>
      <h4 style={{ margin: 0, fontSize: '14px', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>Thiết lập Bãi <span style={{fontSize: '11px', color: '#999', fontWeight: 'normal', userSelect: 'all'}}><br/>ID: {zone.id}</span></h4>
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
          <option value="ROAD">Đường xá (Vùng)</option>
          <option value="ROAD_LINE">Tuyến Đường (A*)</option>
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
      {['YARD', 'REEFER', 'DANGEROUS', 'METAL', 'WOOD_COAL'].includes(zoneType) && (
        <div>
          <label style={{ fontSize: '11px', color: '#666', display: 'flex', justifyContent: 'space-between' }}>
            <span>Góc xoay lưới (độ):</span>
            <span style={{ fontWeight: 'bold' }}>{bearing}°</span>
          </label>
          <input type="range" min="0" max="360" value={bearing} onChange={(e) => setBearing(parseInt(e.target.value))} style={{ width: '100%', cursor: 'pointer' }} />
        </div>
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

// --- OPTIMIZATION: Static Icons and Rotated Marker to prevent memory leaks and React-Leaflet unmounting ---
const TRUCK_SVG = `<svg width="18" height="36" viewBox="0 0 20 40" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="12" width="16" height="28" fill="#3b82f6" rx="2" stroke="#1e3a8a" stroke-width="1"/><rect x="4" y="0" width="12" height="10" fill="#eab308" rx="2" stroke="#a16207" stroke-width="1"/><rect x="5" y="6" width="10" height="3" fill="#1e293b"/></svg>`;
const AGV_SVG = `<svg width="20" height="26" viewBox="0 0 24 30" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="24" height="30" fill="#10b981" rx="4" stroke="#047857" stroke-width="2"/><rect x="4" y="4" width="16" height="22" fill="#059669" rx="2"/><circle cx="12" cy="4" r="2" fill="#fbbf24"/></svg>`;
const RTG_SVG = `<svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="22" height="22" fill="none" stroke="#eab308" stroke-width="3"/><rect x="10" y="10" width="10" height="10" fill="#ca8a04"/><circle cx="4" cy="4" r="2" fill="#333"/><circle cx="26" cy="4" r="2" fill="#333"/><circle cx="4" cy="26" r="2" fill="#333"/><circle cx="26" cy="26" r="2" fill="#333"/></svg>`;
const RS_SVG = `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="8" width="16" height="12" fill="#f97316" rx="2"/><rect x="8" y="4" width="8" height="4" fill="#333"/><rect x="2" y="12" width="2" height="4" fill="#333"/><rect x="20" y="12" width="2" height="4" fill="#333"/></svg>`;

const staticTruckIcon = L.divIcon({
  html: `<div class="rotatable-inner" style="transform-origin: center; filter: drop-shadow(3px 5px 4px rgba(0,0,0,0.4)); display: flex; justify-content: center; align-items: center; width: 100%; height: 100%; transition: transform 0.15s linear;">${TRUCK_SVG}</div>`,
  className: 'fleet-icon-wrapper',
  iconSize: [18, 36],
  iconAnchor: [9, 18]
});
const staticAgvIcon = L.divIcon({
  html: `<div class="rotatable-inner" style="transform-origin: center; filter: drop-shadow(3px 5px 4px rgba(0,0,0,0.4)); display: flex; justify-content: center; align-items: center; width: 100%; height: 100%; transition: transform 0.15s linear;">${AGV_SVG}</div>`,
  className: 'fleet-icon-wrapper',
  iconSize: [20, 26],
  iconAnchor: [10, 13]
});
const staticRtgIcon = L.divIcon({
   html: `<div style="filter: drop-shadow(2px 4px 3px rgba(0,0,0,0.4)); display: flex; justify-content: center; align-items: center; width: 100%; height: 100%;">${RTG_SVG}</div>`,
   className: 'che-icon-wrapper',
   iconSize: [30, 30],
   iconAnchor: [15, 15]
});
const staticRsIcon = L.divIcon({
   html: `<div style="filter: drop-shadow(2px 4px 3px rgba(0,0,0,0.4)); display: flex; justify-content: center; align-items: center; width: 100%; height: 100%;">${RS_SVG}</div>`,
   className: 'che-icon-wrapper',
   iconSize: [24, 24],
   iconAnchor: [12, 12]
});

const RotatedMarker = React.memo(({ id, position, icon, heading, progress }) => {
  const markerRef = useRef(null);

  useEffect(() => {
    if (markerRef.current) {
      const el = markerRef.current.getElement();
      if (el) {
        const inner = el.querySelector('.rotatable-inner');
        if (inner) {
          inner.style.transform = `rotate(${heading || 0}deg)`;
        }
      }
    }
  }, [heading]);

  return (
    <Marker ref={markerRef} position={position} icon={icon}>
      <Tooltip direction="top" opacity={0.9}>
         <span style={{ fontWeight: 'bold' }}>{id}</span> ({Math.round(progress)}%)
      </Tooltip>
    </Marker>
  );
});
// -------------------------------------------------------------------------------------


const MemoizedStaticMapLayers = React.memo(({
  portBoundary, storageZones, getPolygonStyle, showLabels,
  handleUpdateZone, handleGenerateGrid, handleAdjustPadding
}) => {
  return (
    <>
      {portBoundary && (
        <GeoJSON key={JSON.stringify(portBoundary)} data={portBoundary} style={{ color: '#D50000', weight: 4, fillOpacity: 0.05, dashArray: '10, 10' }} />
      )}
      {storageZones.filter(z => z.zoneType !== 'ROAD' && z.zoneType !== 'ROAD_LINE').map(zone => (
        <Polygon key={zone.id} positions={zone.path} pathOptions={getPolygonStyle(zone)}>
          {(showLabels && zone.name && zone.name !== '') && (
            <Tooltip permanent direction="center" className="zone-label" opacity={0.8}>
              <span style={{ fontWeight: 'bold', fontSize: '11px' }}>{zone.name}</span>
            </Tooltip>
          )}
          <Popup><ZonePopupForm zone={zone} onSave={handleUpdateZone} onGenerateGrid={handleGenerateGrid} onAdjustPadding={handleAdjustPadding} /></Popup>
        </Polygon>
      ))}
      {storageZones.filter(z => z.zoneType === 'ROAD').map(zone => (
        <Polygon key={zone.id} positions={zone.path} pathOptions={getPolygonStyle(zone)}>
          {(showLabels && zone.name && zone.name !== '') && (
            <Tooltip permanent direction="center" className="zone-label" opacity={0.8}>
              <span style={{ fontWeight: 'bold', fontSize: '11px' }}>{zone.name}</span>
            </Tooltip>
          )}
          <Popup><ZonePopupForm zone={zone} onSave={handleUpdateZone} onGenerateGrid={handleGenerateGrid} onAdjustPadding={handleAdjustPadding} /></Popup>
        </Polygon>
      ))}
      {storageZones.filter(z => z.zoneType === 'ROAD_LINE').map(zone => (
        <Polyline key={zone.id} positions={zone.path} color="#facc15" weight={6} dashArray="10, 10">
          {showLabels && (
            <Tooltip permanent direction="center" className="zone-label" opacity={0.8}>
              <span style={{ fontWeight: 'bold', fontSize: '11px' }}>{zone.name || 'Đường'} ({zone.id})</span>
            </Tooltip>
          )}
          <Popup><ZonePopupForm zone={zone} onSave={handleUpdateZone} onGenerateGrid={handleGenerateGrid} onAdjustPadding={handleAdjustPadding} /></Popup>
        </Polyline>
      ))}
    </>
  );
});

// Component render GeoJSON tốc độ cao với thuật toán Windowing (Culling off-screen)
const SlotLayer = ({ slotGeoJSON, style, onEachFeature }) => {
  const map = useMap();
  const layerRef = useRef(null);
  const geoJsonRef = useRef(slotGeoJSON);

  // Sync ref and apply style updates without clearLayers()
  useEffect(() => {
     geoJsonRef.current = slotGeoJSON;
     if (layerRef.current) {
         layerRef.current.eachLayer(layer => {
             const updatedFeature = slotGeoJSON.features.find(f => f.properties.id === layer.feature.properties.id);
             if (updatedFeature) {
                 layer.feature = updatedFeature;
                 layer.setStyle(style(updatedFeature));
             }
         });
     }
  }, [slotGeoJSON, style]);

  useEffect(() => {
    if (!layerRef.current) {
      layerRef.current = L.geoJSON(null, { style, onEachFeature }).addTo(map);
    }

    const updateVisible = () => {
      if (map.getZoom() < 18) {
          if (layerRef.current) layerRef.current.clearLayers();
          return;
      }
      
      const bounds = map.getBounds().pad(0.3);
      if (!geoJsonRef.current) return;
      
      const visibleFeatures = geoJsonRef.current.features.filter(f => {
         const coords = f.geometry.coordinates[0][0]; 
         return bounds.contains(L.latLng(coords[1], coords[0]));
      });
      
      if (layerRef.current) {
        layerRef.current.clearLayers();
        layerRef.current.addData({ type: 'FeatureCollection', features: visibleFeatures });
      }
    };

    updateVisible();
    map.on('moveend', updateVisible);
    map.on('zoomend', updateVisible);

    return () => {
      map.off('moveend', updateVisible);
      map.off('zoomend', updateVisible);
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, onEachFeature]);

  return null;
};
const MapResizer = ({ isActive }) => { const map = useMap(); useEffect(() => { if (isActive) { setTimeout(() => map.invalidateSize(), 100); } }, [isActive, map]); return null; };

const FreePortDigitizer = ({ user, isActive }) => {
  const mapRef = useRef(null);
  const [storageZones, setStorageZones] = useState([]);
  const [gates, setGates] = useState([]);
  const [slots, setSlots] = useState([]);
  const [inventory, setInventory] = useState([]); 
  const [slotUpdateTick, setSlotUpdateTick] = useState(0);
  const [showLabels, setShowLabels] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(16);
  const [activeRoute, setActiveRoute] = useState([]);
  const [activeFleet, setActiveFleet] = useState([]);
  const fleetRef = useRef([]);
  const [activeChe, setActiveChe] = useState([]);
  const cheRef = useRef([]);
  const [graphData, setGraphData] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [predictions, setPredictions] = useState([]);
  const [targetLocation, setTargetLocation] = useState(null);
  
  const [isDetecting, setIsDetecting] = useState(false);
  const [aiStatus, setAiStatus] = useState('');
  const [isSyncingChe, setIsSyncingChe] = useState(false);

  // Khởi tạo CHE (Xe nâng) tự động ngay khi load xong bãi
  useEffect(() => {
    if (slots.length === 0 || cheRef.current.length > 0) return;
    const initCHE = async () => {
      try {
        let rawData = await loadLocalCheData();
        if (!rawData || rawData.length === 0) return;
        
        const cheList = rawData.map(c => {
           const randomSlot = slots[Math.floor(Math.random() * slots.length)];
           const pos = randomSlot ? [
               randomSlot.path.reduce((s, p) => s + p[0], 0) / randomSlot.path.length,
               randomSlot.path.reduce((s, p) => s + p[1], 0) / randomSlot.path.length
           ] : [10.762622, 106.741000];
           return {
               id: c.id,
               type: c.type,
               status: 'idle',
               currentPos: pos,
               targetSlotPos: null,
               targetVehicleId: null,
               handlingProgress: 0
           };
        });
        cheRef.current = cheList;
        setActiveChe([...cheList]);
      } catch (e) { console.error("Lỗi khởi tạo CHE", e); }
    };
    initCHE();
  }, [slots]);

  const handleSyncChe = async () => {
     setIsSyncingChe(true);
     let syncError = null;
     let rawData = [];
     try {
        rawData = await loadLocalCheData();
        try {
            await syncCheData(rawData); // Lưu lên Supabase
        } catch (dbErr) {
            console.warn("Chưa tạo bảng che_equipment trên Supabase:", dbErr);
            syncError = dbErr.message;
        }
        
        const cheList = rawData.map(c => {
           const randomSlot = slots[Math.floor(Math.random() * slots.length)];
           const pos = randomSlot ? [
               randomSlot.path.reduce((s, p) => s + p[0], 0) / randomSlot.path.length,
               randomSlot.path.reduce((s, p) => s + p[1], 0) / randomSlot.path.length
           ] : [10.762622, 106.741000];
           return {
               id: c.id,
               type: c.type,
               status: 'idle',
               currentPos: pos,
               targetSlotPos: null,
               targetVehicleId: null,
               handlingProgress: 0
           };
        });
        cheRef.current = cheList;
        setActiveChe([...cheList]);
        
        if (syncError) {
            alert(`Đã nạp ${cheList.length} xe nâng từ Local JSON!\n(Cảnh báo DB: ${syncError} - Sếp cần tạo bảng trên Supabase)`);
        } else {
            alert("Đã đồng bộ " + cheList.length + " thiết bị nâng hạ (CHE) thành công!");
        }
     } catch (e) { alert("Lỗi đọc file: " + e.message); }
     setIsSyncingChe(false);
  };
  const [isSimulating, setIsSimulating] = useState(false);
  
  const [portBoundary, setPortBoundary] = useState(null);
  const [activeBaseLayer, setActiveBaseLayer] = useState('Vệ Tinh (ESRI)');
  const [isSavingToDB, setIsSavingToDB] = useState(false);

  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Khôi phục dữ liệu từ LocalStorage hoặc DB
  useEffect(() => {
    const cached = localStorage.getItem('nexus_port_data_cache');
    let hasCache = false;
    if (cached) {
      try {
        const data = JSON.parse(cached);
        if ((data.storageZones && data.storageZones.length > 0) || (data.slots && data.slots.length > 0) || data.portBoundary) {
          setStorageZones(data.storageZones || []);
          setSlots(data.slots || []);
          setGates(data.gates || []);
          setInventory(data.inventory || []);
          setActiveRoute([]);
          if (data.portBoundary !== undefined) setPortBoundary(data.portBoundary);
          hasCache = true;
          setIsDataLoaded(true);
        }
      } catch(e) {}
    }

    if (!hasCache && user) {
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Supabase Fetch Timeout")), 3000));
      
      Promise.race([loadMapData(user.id || user.uid), timeoutPromise])
      .then(data => {
        if (data) {
          setStorageZones(data.storageZones || []);
          setSlots(data.slots || []);
          setGates(data.gates || []);
          setInventory(data.inventory || []);
          setActiveRoute([]);
          if (data.portBoundary !== undefined) setPortBoundary(data.portBoundary);
        }
        setIsDataLoaded(true);
      }).catch(err => {
        console.warn("Lỗi tải dữ liệu DB (Dùng fallback):", err.message);
        setIsDataLoaded(true);
      });
    } else if (!hasCache && !user) {
      setTimeout(() => setIsDataLoaded(true), 1500);
    }
  }, [user]);

  // Auto-save vào LocalStorage mỗi khi có thay đổi
  useEffect(() => {
    if (!isDataLoaded) return;
    try {
      // Ép kiểu tọa độ còn 6 chữ số thập phân để giảm dung lượng file xuống 60%, tránh QuotaExceededError
      const compactSlots = slots.map(s => ({
         ...s,
         path: s.path.map(p => [Number(p[0].toFixed(6)), Number(p[1].toFixed(6))])
      }));
      const compactZones = storageZones.map(z => ({
         ...z,
         path: z.path.map(p => [Number(p[0].toFixed(6)), Number(p[1].toFixed(6))])
      }));
      
      const dataToCache = { storageZones: compactZones, slots: compactSlots, gates, inventory, portBoundary };
      localStorage.setItem('nexus_port_data_cache', JSON.stringify(dataToCache));
    } catch (error) {
      console.warn("Không thể lưu cache (quá dung lượng):", error);
    }
  }, [storageZones, slots, gates, inventory, portBoundary, isDataLoaded]);

  // Báo cáo thay đổi lên Parent Window (SPA index.html)
  useEffect(() => {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'SYNC_PORT_DATA', payload: { slots, inventory } }, '*');
    }
  }, [slots, inventory]);

  // Fleet Animation Loop
  useEffect(() => {
    let animationFrameId;
    let lastSyncTime = 0;

    const animateFleet = (timestamp) => {
      let hasChanges = false;
      let hasMoving = false;
      
      fleetRef.current.forEach(v => {
        if (v.status !== 'moving') return;
        hasMoving = true;
        hasChanges = true;
        
        const p1 = v.path[v.currentSegmentIdx];
        const p2 = v.path[v.currentSegmentIdx + 1];
        
        if (!p2) {
           if (v.isLeg1) {
              if (!v.cheStatus) {
                 v.cheStatus = 'waiting';
                 // Assign CHE
                 const idleChe = cheRef.current.find(c => c.status === 'idle');
                 if (idleChe) {
                    idleChe.status = 'moving_to_slot';
                    idleChe.targetVehicleId = v.id;
                    idleChe.targetSlotPos = [...v.currentPos];
                 }
              } else if (v.cheStatus === 'done') {
                 if (v.leg2Ready && v.pathOut) {
                    v.path = v.pathOut;
                    v.currentSegmentIdx = 0;
                    v.isLeg1 = false;
                 }
              }
           } else {
              v.status = 'arrived';
              v.progress = 100;
           }
           return;
        }
        
        const lat1 = p1[0];
        const lng1 = p1[1];
        const lat2 = p2[0];
        const lng2 = p2[1];
        
        const dx = lat2 - lat1;
        const dy = lng2 - lng1;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist < 0.000001) {
           v.currentSegmentIdx++;
           return;
        }
        
        const moveRatio = v.speed / dist;
        
        let curLat = v.currentPos[0];
        let curLng = v.currentPos[1];
        
        curLat += dx * moveRatio;
        curLng += dy * moveRatio;
        
        const newDx = lat2 - curLat;
        const newDy = lng2 - curLng;
        
        if (dx * newDx + dy * newDy <= 0) {
           v.currentSegmentIdx++;
           v.currentPos = [lat2, lng2];
        } else {
           v.currentPos = [curLat, curLng];
        }
        
        // Tính góc xoay (Heading) để quay đầu xe
        v.heading = Math.atan2(dy, dx) * (180 / Math.PI);
        
        v.progress = Math.min(99, (v.currentSegmentIdx / (v.path.length - 1)) * 100);
      });
      
      // CHE Animation Logic
      cheRef.current.forEach(che => {
         if (che.status === 'idle') return;
         hasChanges = true;
         // Cập nhật trạng thái CHE
         if (che.status === 'moving_to_slot') {
             const dx = che.targetSlotPos[0] - che.currentPos[0];
             const dy = che.targetSlotPos[1] - che.currentPos[1];
             const dist = Math.sqrt(dx*dx + dy*dy);
             
             if (dist < 0.000005) {
                 che.status = 'handling';
                 che.handlingProgress = 0;
                 che.currentPos = [...che.targetSlotPos];
             } else {
                 const moveRatio = 0.00002 / dist; // Tốc độ di chuyển của cẩu
                 che.currentPos[0] += dx * moveRatio;
                 che.currentPos[1] += dy * moveRatio;
             }
         } else if (che.status === 'handling') {
             che.handlingProgress += 1; 
             if (che.handlingProgress >= 100) {
                 che.status = 'idle';
                 const vehicle = fleetRef.current.find(v => v.id === che.targetVehicleId);
                 if (vehicle) {
                     vehicle.cheStatus = 'done';
                 }
                 che.targetVehicleId = null;
             }
         }
      });
      
      if (hasChanges && (timestamp - lastSyncTime > 150)) {
         // Xóa hẳn xe tải khỏi bản đồ khi đã về đến cổng (arrived)
         const arrivedVehicles = fleetRef.current.filter(v => v.status === 'arrived');
         if (arrivedVehicles.length > 0) {
            setActiveRoute([]); // Xóa đường đi màu xanh khi xe hoàn thành
         }
         
         fleetRef.current = fleetRef.current.filter(v => v.status === 'moving');
         
         setActiveFleet([...fleetRef.current]);
         setActiveChe([...cheRef.current]);
         
         window.postMessage({ 
             type: 'SYNC_FLEET_DATA', 
             payload: { fleet: fleetRef.current } 
         }, '*');
         if (window.parent && window.parent !== window) {
             window.parent.postMessage({ 
                 type: 'SYNC_FLEET_DATA', 
                 payload: { fleet: fleetRef.current } 
             }, '*');
         }
         lastSyncTime = timestamp;
      }
      
      animationFrameId = requestAnimationFrame(animateFleet);
    };
    
    animationFrameId = requestAnimationFrame(animateFleet);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Auto-Simulation Engine (Traffic Generator from JSON file)
  useEffect(() => {
    let timeoutId;
    let isCancelled = false;
    let currentTaskIndex = 0;
    
    if (!isSimulating || !graphData || gates.length === 0 || slots.length === 0) return;

    const runSimulationLoop = async () => {
       try {
          const response = await fetch('/dummy_traffic_data.json');
          const tasks = await response.json();
          if (!tasks || tasks.length === 0) return;

          const processNextTask = () => {
             if (isCancelled) return;
             
             const task = tasks[currentTaskIndex];
             const tempGraph = new Map(graphData);
             
             // Xử lý logic chọn Gate ngẫu nhiên
             const gateId = gates[Math.floor(Math.random() * gates.length)]?.id;
             
             if (gateId) {
                import('../services/routingService').then(({ findShortestPath }) => {
                   let targetSlot = null;
                   
                   // Chọn điểm cuối theo kịch bản trong JSON
                   if (task.destination === 'SLOT_EMPTY_RANDOM') {
                      const emptySlots = slots.filter(s => !s.status || s.status === 'empty');
                      if (emptySlots.length > 0) targetSlot = emptySlots[Math.floor(Math.random() * emptySlots.length)];
                   } else if (task.origin === 'SLOT_OCCUPIED_RANDOM') {
                      const occSlots = slots.filter(s => s.status && s.status !== 'empty');
                      if (occSlots.length > 0) targetSlot = occSlots[Math.floor(Math.random() * occSlots.length)];
                   }
                   
                   if (!targetSlot) {
                      // Fallback lấy slot bất kỳ nếu không thỏa mãn
                      targetSlot = slots[Math.floor(Math.random() * slots.length)];
                   }

                   if (targetSlot) {
                      // Vẽ đường nối Điểm Đầu -> Điểm Cuối (Leg 1)
                      const pathIn = findShortestPath(gateId, targetSlot.id, tempGraph);
                      
                      if (pathIn.length > 0) {
                         const truckId = task.id;
                         fleetRef.current.push({
                            id: truckId,
                            type: task.type,
                            cargoInfo: task.cargoType,
                            origin: gateId,
                            destination: 'CALCULATING...', 
                            path: pathIn,
                            progress: 0,
                            status: 'moving',
                            speed: task.type === 'truck' ? 0.00001 : 0.000007,
                            currentSegmentIdx: 0,
                            currentPos: [...pathIn[0]],
                            isLeg1: true,
                            leg2Ready: false,
                            pathOut: null
                         });
                         
                         // Tính ngầm lộ trình thoát ra cổng gần nhất (Lazy pre-computation)
                         setTimeout(() => {
                             import('../services/routingService').then(async ({ findShortestPath }) => {
                                let shortestOutPath = [];
                                let bestGateOutId = gateId;
                                for (const g of gates) {
                                   const pOut = findShortestPath(targetSlot.id, g.id, tempGraph);
                                   if (pOut.length > 0 && (shortestOutPath.length === 0 || pOut.length < shortestOutPath.length)) {
                                      shortestOutPath = pOut;
                                      bestGateOutId = g.id;
                                   }
                                   // Chống lag: Nhường CPU lại cho trình duyệt render Frame mới trước khi tính tiếp cổng khác
                                   await new Promise(resolve => setTimeout(resolve, 2));
                                }
                                
                                const vehicle = fleetRef.current.find(v => v.id === truckId);
                                if (vehicle) {
                                   vehicle.pathOut = shortestOutPath.length > 0 ? shortestOutPath : [...pathIn].reverse();
                                   vehicle.destination = bestGateOutId;
                                   vehicle.leg2Ready = true;
                                }
                             });
                         }, 10);
                      }
                   }
                });
             }
             
             currentTaskIndex = (currentTaskIndex + 1) % tasks.length;
             const nextDelay = tasks[currentTaskIndex].delayMs || 3000;
             timeoutId = setTimeout(processNextTask, nextDelay);
          };
          
          // Bắt đầu vòng lặp với task đầu tiên
          processNextTask();
       } catch (error) {
          console.error("Lỗi đọc file dummy_traffic_data.json:", error);
       }
    };
    
    runSimulationLoop();
    return () => {
       isCancelled = true;
       clearTimeout(timeoutId);
    };
  }, [isSimulating, graphData, gates, slots]);

  const handlePolygonComplete = useCallback((latLngs) => {
    const newZone = {
      id: `zone-${Date.now()}`,
      path: latLngs.map(p => [p.lat, p.lng]),
      pathLatLngs: latLngs,
      name: '', zoneType: 'GENERAL', isVerified: false
    };
    setStorageZones(prev => [...prev, newZone]);
  }, []);

  const handlePolylineComplete = useCallback((latLngs) => {
    const newZone = {
      id: `road-line-${Date.now()}`,
      path: latLngs.map(p => [p.lat, p.lng]),
      pathLatLngs: latLngs,
      name: '', zoneType: 'ROAD_LINE', isVerified: true
    };
    setStorageZones(prev => [...prev, newZone]);
    
    // Auto-delete slots that overlap with the new road line
    setSlots(prev => {
       const lineCoords = latLngs.map(p => [p.lng, p.lat]);
       if (lineCoords.length < 2) return prev;
       
       const roadLine = turf.lineString(lineCoords);
       const roadBuffer = turf.buffer(roadLine, 2.5, { units: 'meters', steps: 4 });
       const bufferBbox = turf.bbox(roadBuffer);
       
       return prev.filter(slot => {
          // Fast bbox rejection using center point (approximate)
          const sLng = slot.path[0][1];
          const sLat = slot.path[0][0];
          if (sLng < bufferBbox[0] - 0.0001 || sLng > bufferBbox[2] + 0.0001 || sLat < bufferBbox[1] - 0.0001 || sLat > bufferBbox[3] + 0.0001) return true;

          const sPath = slot.path.map(p => [p[1], p[0]]);
          sPath.push([...sPath[0]]);
          const slotPoly = turf.polygon([sPath]);
          
          return !turf.booleanIntersects(slotPoly, roadBuffer);
       });
    });
  }, []);

  const handleMarkerComplete = useCallback((latLng) => {
    const newGate = {
      id: `manual-gate-${Date.now()}`,
      name: `Cổng ${gates.length + 1}`,
      latLng: latLng
    };
    setGates(prev => [...prev, newGate]);
  }, [gates]);

  const handleUpdateZone = useCallback((id, updatedData) => {
    setStorageZones(prev => prev.map(z => z.id === id ? { ...z, ...updatedData } : z));
  }, []);

  const handleGenerateGrid = useCallback((zoneId, latLngs, zoneName = 'ZONE', customBearing = null, currentZones = null) => {
    const zonesToUse = currentZones || storageZones;
    const polygonObstacles = zonesToUse
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

    const lineObstacles = [];
    zonesToUse.filter(z => z.zoneType === 'ROAD_LINE').forEach(z => {
         const coords = z.pathLatLngs.map(p => [p.lng, p.lat]);
         if (coords.length >= 2) {
           const line = turf.lineString(coords);
           const polys = createFlatBufferPolygon(line, 5); // width = 5m
           lineObstacles.push(...polys);
         }
      });
      
    const obstacles = [...polygonObstacles, ...lineObstacles];

    const { slots: newSlots, metadata } = generateGridWithTurf(latLngs, zoneId, zoneName, obstacles, customBearing);
    
    // Lưu lại bearing vào zone metadata để slider hiển thị đúng
    setStorageZones(prev => prev.map(z => z.id === zoneId ? { ...z, bearing: metadata.bearing } : z));
    
    setSlots(prev => {
       const others = prev.filter(s => s.zoneId !== zoneId);
       
       // Dùng thuật toán Grid Spatial Hashing O(N) kết hợp Turf để chống đứng máy khi có hàng vạn Slot
       const gridHash = new Map();
       others.forEach(s => {
          const sLat = (s.path[0][0] + s.path[2][0]) / 2;
          const sLng = (s.path[0][1] + s.path[2][1]) / 2;
          const cellX = Math.floor(sLat / 0.0002);
          const cellY = Math.floor(sLng / 0.0002);
          const key = `${cellX},${cellY}`;
          if (!gridHash.has(key)) gridHash.set(key, []);
          
          const sPath = s.path.map(p => [p[1], p[0]]);
          sPath.push([...sPath[0]]);
          gridHash.get(key).push(turf.polygon([sPath]));
       });
       
       const deduplicatedNewSlots = newSlots.filter(ns => {
          const nsLat = (ns.path[0][0] + ns.path[2][0]) / 2;
          const nsLng = (ns.path[0][1] + ns.path[2][1]) / 2;
          const cellX = Math.floor(nsLat / 0.0002);
          const cellY = Math.floor(nsLng / 0.0002);
          
          const nearbyPolys = [];
          for (let dx = -1; dx <= 1; dx++) {
             for (let dy = -1; dy <= 1; dy++) {
                const key = `${cellX + dx},${cellY + dy}`;
                if (gridHash.has(key)) nearbyPolys.push(...gridHash.get(key));
             }
          }
          
          if (nearbyPolys.length === 0) return true;

          const nsPath = ns.path.map(p => [p[1], p[0]]);
          nsPath.push([...nsPath[0]]);
          const nsPoly = turf.polygon([nsPath]);

          return !nearbyPolys.some(poly => turf.booleanIntersects(nsPoly, poly));
       });
       
       return [...others, ...deduplicatedNewSlots];
    });
    
    setSlotUpdateTick(prev => prev + 1);
  }, [storageZones]);

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  const handleAutoDetect = async () => {
    if (!mapRef.current) return;
    setIsDetecting(true);
    const bounds = mapRef.current.getBounds();
    const bbox = [bounds.getSouth(), bounds.getWest(), bounds.getNorth(), bounds.getEast()];
    
    setAiStatus('Phân tích phổ màu vệ tinh (ESRI)...');
    await sleep(800);
    setAiStatus('Truy xuất siêu dữ liệu không gian (OSM)...');
    await sleep(800);
    setAiStatus('Chạy thuật toán đối chiếu kép (Dual-Fusion)...');
    
    const features = await fetchOSMFeatures(bbox, portBoundary);
    
    const newZones = [];
    const newGates = [];
    
    features.forEach(f => {
      if (f.type === 'BUILDING') {
        newZones.push({ id: f.id, path: f.path, pathLatLngs: f.path.map(p => ({lat: p[0], lng: p[1]})), name: f.name, zoneType: 'BUILDING', isVerified: true });
      } else if (f.type === 'ROAD') {
        newZones.push({ id: f.id, path: f.path, pathLatLngs: f.path.map(p => ({lat: p[0], lng: p[1]})), name: f.name, zoneType: 'ROAD', isVerified: true });
      } else if (f.type === 'ROAD_LINE') {
        newZones.push({ id: f.id, path: f.path, pathLatLngs: f.path.map(p => ({lat: p[0], lng: p[1]})), name: f.name, zoneType: 'ROAD_LINE', isVerified: true });
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
        const finalZones = [...prev, ...filteredNewZones];
        
        setTimeout(() => {
          filteredNewZones.forEach(z => {
            if (z.zoneType === 'YARD') {
              handleGenerateGrid(z.id, z.pathLatLngs, z.name, null, finalZones);
            }
          });
        }, 500);

        return finalZones;
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

  const handleSaveToCloud = async () => {
    if (!user) return;
    setIsSavingToDB(true);
    try {
      await saveMapData(user.id, { storageZones, slots, gates, inventory, activeRoute, portBoundary });
      alert("✅ Đã lưu toàn bộ bản đồ và kho hàng lên hệ thống (Supabase) thành công!");
    } catch (e) {
      console.error(e);
      alert("❌ Lưu thất bại: " + e.message);
    } finally {
      setIsSavingToDB(false);
    }
  };

  // Tự động lưu lên Cloud DB khi người dùng đóng tab hoặc chuyển trang
  useEffect(() => {
    const backupToDB = () => {
      if (user && isDataLoaded) {
        saveMapData(user.id || user.uid, { storageZones, slots, gates, inventory, activeRoute, portBoundary })
          .catch(err => console.error("Lỗi Auto-save DB:", err));
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') backupToDB();
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', backupToDB);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', backupToDB);
    };
  }, [user, isDataLoaded, storageZones, slots, gates, inventory, activeRoute, portBoundary]);

  const handleExportData = () => {
    const data = {
      storageZones,
      gates,
      slots,
      inventory,
      activeRoute,
      portBoundary
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `port_database_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.storageZones) setStorageZones(data.storageZones);
        if (data.gates) setGates(data.gates);
        if (data.slots) setSlots(data.slots);
        if (data.inventory) setInventory(data.inventory);
        if (data.portBoundary !== undefined) setPortBoundary(data.portBoundary);
        alert('✅ Đã tải Database từ file JSON thành công!');
      } catch (err) {
        alert('❌ Lỗi khi đọc file JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

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

  const assignContainer = useCallback((slotId, containerType) => {
    let slotLatLng = null;

    // Lấy tọa độ trước khi set state để đảm bảo tính đồng bộ
    const targetSlot = slots.find(s => s.id === slotId || s.id === slotId.replace(/-(\d+)-/, (match, bay) => `-${String(parseInt(bay)-1).padStart(2,'0')}-`));
    if (targetSlot && targetSlot.path && targetSlot.path.length > 0) {
      slotLatLng = targetSlot.path[0];
    } else if (slots.length > 0) {
      // Fallback
      const fallbackSlot = slots.find(s => s.id.startsWith(slotId.slice(0, -2)));
      if (fallbackSlot) slotLatLng = fallbackSlot.path[0];
    }

    setSlots(prevSlots => {
      let updatedSlots = [...prevSlots];
      const parts = slotId.split('-');
      if (parts.length < 3) return prevSlots;
      
      const row = parts[parts.length - 1];
      const bay = parts[parts.length - 2];
      const zoneName = parts.slice(0, parts.length - 2).join('-');
      const bayNum = parseInt(bay, 10);
      
      if (containerType === '20ft') {
         if (bayNum % 2 === 0) {
            alert(`Lỗi ISO: Không thể xếp cont 20ft vào Bay chẵn (${bayNum})!`);
            return prevSlots;
         }
         const targetIdx = updatedSlots.findIndex(s => s.id === slotId);
         if (targetIdx !== -1) {
            updatedSlots[targetIdx] = { ...updatedSlots[targetIdx], status: 'occupied_20' };
         }
      } 
      else if (containerType === '40ft' || containerType === '45ft') {
         let oddBay1, oddBay2;
         if (bayNum % 2 === 0) {
            oddBay1 = String(bayNum - 1).padStart(2, '0');
            oddBay2 = String(bayNum + 1).padStart(2, '0');
         } else {
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
      setSlotUpdateTick(prev => prev + 1);
      return updatedSlots;
    });

    // Cập nhật Inventory 3D cho Hover Panel
    const parsed = parseSlotId(slotId);
    if (parsed) {
       const is40 = containerType === '40ft' || containerType === '45ft';
       setInventory(prev => {
          const existingTiers = prev.filter(c => c.zoneId === parsed.zoneId && c.row === parsed.row && c.bay === (is40 ? String(parseInt(parsed.bay) + 1).padStart(2, '0') : parsed.bay)).length;
          return [...prev, {
            containerNo: `HLCU${Math.floor(Math.random()*1000000 + 1000000)}`,
            zoneId: parsed.zoneId,
            bay: is40 ? String(parseInt(parsed.bay) + 1).padStart(2, '0') : parsed.bay,
            row: parsed.row,
            tier: existingTiers + 1,
            size: is40 ? 40 : 20,
            type: Math.random() > 0.8 ? 'REEFER' : 'GENERAL'
          }];
       });
    }

    // Tự động tìm đường A* nếu đã có đồ thị
    if (slotLatLng && graphData) {
       const tempGraph = new Map(graphData);
       let startNodeId = null;
       
       // Tìm Gate gần nhất với Slot
       const allGates = Array.from(tempGraph.values()).filter(n => n.type === 'GATE');
       
       import('../services/routingService').then(({ findShortestPath }) => {
          const targetNodeId = slotId;

          if (allGates.length > 0) {
             const sortedGates = allGates.sort((a, b) => {
                const distA = Math.pow(a.coordinates[0] - slotLatLng[0], 2) + Math.pow(a.coordinates[1] - slotLatLng[1], 2);
                const distB = Math.pow(b.coordinates[0] - slotLatLng[0], 2) + Math.pow(b.coordinates[1] - slotLatLng[1], 2);
                return distA - distB;
             });

              for (const gate of sortedGates) {
                 const path = findShortestPath(gate.id, targetNodeId, tempGraph);
                 if (path.length > 0) {
                    setActiveRoute(path);
                    
                    const pathIn = path;
                    const truckId = `TRK-${Math.floor(Math.random() * 9000 + 1000)}`;
                    const vType = Math.random() > 0.3 ? 'truck' : 'agv';
                    
                    fleetRef.current.push({
                       id: truckId,
                       type: vType,
                       origin: gate.id,
                       destination: 'CALCULATING...',
                       path: pathIn,
                       progress: 0,
                       status: 'moving',
                       speed: vType === 'truck' ? 0.00001 : 0.000007, 
                       currentSegmentIdx: 0,
                       currentPos: [...pathIn[0]],
                       isLeg1: true,
                       leg2Ready: false,
                       pathOut: null
                    });
                    
                    // Tính ngầm lộ trình ra
                    setTimeout(() => {
                        import('../services/routingService').then(async ({ findShortestPath }) => {
                           let shortestOutPath = [];
                           let bestGateOutId = gate.id;
                           for (const g of allGates) {
                              const pOut = findShortestPath(targetNodeId, g.id, tempGraph);
                              if (pOut.length > 0 && (shortestOutPath.length === 0 || pOut.length < shortestOutPath.length)) {
                                 shortestOutPath = pOut;
                                 bestGateOutId = g.id;
                              }
                              // Chống lag: Nhường CPU cho UI Thread
                              await new Promise(resolve => setTimeout(resolve, 2));
                           }
                           const vehicle = fleetRef.current.find(v => v.id === truckId);
                           if (vehicle) {
                              vehicle.pathOut = shortestOutPath.length > 0 ? shortestOutPath : [...pathIn].reverse();
                              vehicle.destination = bestGateOutId;
                              vehicle.leg2Ready = true;
                           }
                        });
                    }, 10);
                    
                    return; // Dừng lại khi tìm thấy đường
                 }
              }
             
             alert('Không có cổng nào có thể kết nối được tới vị trí container này (Đường đi bị đứt đoạn)!');
             
          } else {
             // Thử dùng điểm ROAD_CELL gần nhất
             const roadNodes = Array.from(tempGraph.values()).filter(n => n.type === 'ROAD_CELL');
             if (roadNodes.length > 0) {
                let minDist = Infinity;
                let startNodeId = null;
                roadNodes.forEach(r => {
                   const dist = Math.pow(r.coordinates[0] - slotLatLng[0], 2) + Math.pow(r.coordinates[1] - slotLatLng[1], 2);
                   if (dist < minDist) { minDist = dist; startNodeId = r.id; }
                });
                
                const path = findShortestPath(startNodeId, targetNodeId, tempGraph);
                if (path.length > 0) {
                   setActiveRoute(path);
                   fleetRef.current.push({
                      id: `AGV-${Math.floor(Math.random() * 9000 + 1000)}`,
                      type: 'agv',
                      origin: startNodeId,
                      destination: targetNodeId,
                      path: path,
                      progress: 0,
                      status: 'moving',
                      speed: 0.000015, // AGV đi chậm
                      currentSegmentIdx: 0,
                      currentPos: [...path[0]]
                   });
                }
                else alert('Không tìm thấy đường đi khả thi!');
             } else {
                alert('Chưa có Cổng (Gate) hoặc bãi Đường (ROAD) nào trên bản đồ để tìm đường!');
             }
          }
       });
    }
  }, [graphData, slots, gates]);

  // Build dynamic graph based on drawn YARD slots and ROAD polygons
  useEffect(() => {
     if (slots.length > 0 || storageZones.filter(z => z.zoneType === 'ROAD' || z.zoneType === 'ROAD_LINE').length > 0 || gates.length > 0) {
        import('../services/routingService').then(({ buildDynamicGraph }) => {
           setGraphData(buildDynamicGraph(storageZones, slots, gates, portBoundary));
        });
     }
  }, [storageZones, slots, gates, slotUpdateTick, portBoundary]);

  useEffect(() => {
    window.assignContainer = assignContainer;
  }, [assignContainer]);

  const handleExecuteSearch = async (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchInput)}&polygon_geojson=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        setPredictions(data.map(item => ({ 
          place_id: item.place_id, 
          description: item.display_name, 
          location: [parseFloat(item.lat), parseFloat(item.lon)],
          geojson: item.geojson 
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

  const slotGeoJSON = useMemo(() => {
    const emptyColor = isLightMap ? '#00695C' : '#00E676';
    const occ20Color = '#f59e0b';
    const occ40Color = '#ef4444';
    const features = [];
    const groups40ft = {};
    slots.forEach(slot => {
       if (slot.status === 'occupied_40' && slot.parent40ftId) {
          if (!groups40ft[slot.parent40ftId]) groups40ft[slot.parent40ftId] = [];
          groups40ft[slot.parent40ftId].push(slot);
       }
    });
    Object.keys(groups40ft).forEach(parentId => {
       const pair = groups40ft[parentId];
       if (pair.length >= 1) {
          try {
             const pts = [];
             pair.forEach(slot => {
                slot.path.forEach(p => pts.push(turf.point([p[1], p[0]])));
             });
             const featureColl = turf.featureCollection(pts);
             // Turf convex requires at least 3 points, which is satisfied by a single slot's 4 points
             const hull = turf.convex(featureColl);
             if (hull) {
                features.push({
                  type: 'Feature',
                  properties: { id: parentId, status: 'occupied_40', color: '#b91c1c', fillColor: occ40Color, fillOpacity: 0.9, interactive: true },
                  geometry: hull.geometry
                });
             }
          } catch(e) { console.warn("Lỗi vẽ hull 40ft:", e); }
       }
    });
    slots.forEach(slot => {
      if (slot.status === 'occupied_40') return;
      let fillColor = emptyColor, fillOpacity = 0.3, color = emptyColor, interactive = true;
      if (slot.status === 'occupied_20') { fillColor = occ20Color; color = '#d97706'; fillOpacity = 0.9; }
      const geoJsonPath = slot.path.map(p => [p[1], p[0]]);
      geoJsonPath.push([...geoJsonPath[0]]);
      features.push({
        type: 'Feature',
        properties: { id: slot.id, status: slot.status, color, fillColor, fillOpacity, interactive },
        geometry: { type: 'Polygon', coordinates: [geoJsonPath] }
      });
    });
    return { type: 'FeatureCollection', features };
  }, [slots, isLightMap]);
  const geoJsonStyle = useCallback((feature) => ({
     color: feature.properties.color,
     fillColor: feature.properties.fillColor,
     weight: isLightMap ? 2 : 1,
     fillOpacity: feature.properties.fillOpacity,
     opacity: 0.8
  }), [isLightMap]);

  const geoJsonOnEachFeature = useCallback((feature, layer) => {
    layer.on({
      click: (e) => {
         L.DomEvent.stopPropagation(e);
         assignContainer(feature.properties.id, '40ft');
      },
      mouseover: (e) => {
         window.dispatchEvent(new CustomEvent('slotHover', { detail: {
           id: feature.properties.id,
           type: feature.properties.status === 'occupied_40' ? '40ft/45ft' : (feature.properties.status === 'occupied_20' ? '20ft' : 'Trống'),
           status: feature.properties.status
         }}));
         layer.setStyle({ fillOpacity: 1, weight: 3, color: '#ffffff' });
      },
      mouseout: (e) => {
         window.dispatchEvent(new CustomEvent('slotHover', { detail: null }));
         layer.setStyle({ fillOpacity: feature.properties.fillOpacity, weight: isLightMap ? 2 : 1, color: feature.properties.color });
      }
    });
  }, [assignContainer, isLightMap]);


  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', margin: 0, padding: 0 }}>
      <MapContainer preferCanvas={true} center={defaultCenter} zoom={16} maxZoom={22} ref={mapRef} style={{ width: '100%', height: '100%', zIndex: 0 }}>
          <MapResizer isActive={isActive} />
        <ZoomTracker onZoomChange={setCurrentZoom} />
        <LayersControl position="bottomleft">
          <LayersControl.BaseLayer checked name="Vệ Tinh (ESRI)">
            <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" maxZoom={22} maxNativeZoom={19} />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Đường Phố (OSM)">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={22} maxNativeZoom={19} />
          </LayersControl.BaseLayer>
          <LayersControl.Overlay checked name="Lưới Quy Hoạch & Nhà Cửa">
            <FeatureGroup>
              <MemoizedStaticMapLayers 
                portBoundary={portBoundary}
                storageZones={storageZones}
                getPolygonStyle={getPolygonStyle}
                showLabels={showLabels}
                handleUpdateZone={handleUpdateZone}
                handleGenerateGrid={handleGenerateGrid}
                handleAdjustPadding={handleAdjustPadding}
              />
              {currentZoom >= 18 && slots.length > 0 && (
                <SlotLayer 
                  slotGeoJSON={slotGeoJSON} 
                  style={geoJsonStyle}
                  onEachFeature={geoJsonOnEachFeature}
                  currentZoom={currentZoom}
                />
              )}
              {gates.map(gate => (
                <Marker key={gate.id} position={gate.latLng}>
                  <Popup>Cổng ra vào: {gate.name}</Popup>
                </Marker>
              ))}
              
              {/* Vẽ tuyến đường A* (A-Star) */}
              {activeRoute.length > 0 && (
                <Polyline positions={activeRoute} color="#10b981" weight={6} opacity={0.8}>
                  <Tooltip permanent direction="top" className="route-label" opacity={0.9}>
                    <span style={{ fontWeight: 'bold', fontSize: '12px', color: '#047857' }}>Luồng di chuyển A*</span>
                  </Tooltip>
                </Polyline>
              )}
              {/* Vẽ xe (Fleet) đang di chuyển */}
              {activeFleet.map(v => {
                if (v.status !== 'moving') return null;
                return (
                  <RotatedMarker 
                     key={v.id} 
                     id={v.id}
                     position={v.currentPos} 
                     icon={v.type === 'truck' ? staticTruckIcon : staticAgvIcon} 
                     heading={v.heading}
                     progress={v.progress}
                  />
                );
              })}

              {/* Vẽ CHE (Thiết bị nâng hạ) */}
              {activeChe.map(che => (
                 <Marker key={che.id} position={che.currentPos} icon={che.type === 'rtg' ? staticRtgIcon : staticRsIcon} zIndexOffset={1000}>
                   <Tooltip direction="top" opacity={0.9} permanent={che.status !== 'idle'}>
                      <span style={{ fontWeight: 'bold', color: che.status === 'idle' ? '#666' : '#eab308' }}>{che.id}</span>
                      {che.status === 'handling' && ` (${Math.round(che.handlingProgress)}%)`}
                      {che.status === 'moving_to_slot' && ` (Đang chạy)`}
                   </Tooltip>
                 </Marker>
              ))}
            </FeatureGroup>
          </LayersControl.Overlay>
        </LayersControl>
        <GeomanControl onPolygonComplete={handlePolygonComplete} onPolylineComplete={handlePolylineComplete} onMarkerComplete={handleMarkerComplete} />
        <MapController targetLocation={targetLocation} />
        <LayerTracker setActiveBaseLayer={setActiveBaseLayer} />
      </MapContainer>
      
      <div style={{ position: 'absolute', top: 80, right: 20, zIndex: 1000, backgroundColor: 'rgba(255,255,255,0.95)', padding: 20, borderRadius: 12, boxShadow: '0 10px 25px rgba(0,0,0,0.15)', width: 320, fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '5px' }}>
          <button 
            onClick={handleSyncChe}
            disabled={isSyncingChe || slots.length === 0}
            style={{ backgroundColor: '#f59e0b', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', transition: 'background-color 0.2s', opacity: (isSyncingChe || slots.length === 0) ? 0.7 : 1 }}>
            {isSyncingChe ? '⏳ Đang đồng bộ...' : '🚜 Sync Phương tiện (CHE)'}
          </button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '5px' }}>
          <button 
            onClick={() => {
               if (gates.length === 0 || slots.length === 0) {
                  alert('Cần có ít nhất 1 Cổng (Gate) và 1 Bãi (Slot) để mô phỏng!');
                  return;
               }
               setIsSimulating(!isSimulating);
            }} 
            style={{ 
               backgroundColor: isSimulating ? '#ef4444' : '#10b981', 
               color: 'white', border: 'none', padding: '10px 16px', 
               borderRadius: '8px', cursor: 'pointer', fontWeight: '600', 
               transition: 'background-color 0.2s',
               display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px'
            }}
          >
            {isSimulating ? '⏹ Dừng Mô Phỏng (Stop)' : '▶ Chạy Mô Phỏng (Auto Traffic)'}
          </button>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px' }}>
          <input type="checkbox" id="toggle-labels" checked={showLabels} onChange={e => setShowLabels(e.target.checked)} style={{ cursor: 'pointer' }} />
          <label htmlFor="toggle-labels" style={{ fontSize: '13px', color: '#4b5563', cursor: 'pointer', fontWeight: '500' }}>Hiển thị chữ (Tên bãi/Đường)</label>
        </div>

        {activeChe.length > 0 && (
          <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#334155', borderBottom: '1px solid #cbd5e1', paddingBottom: '4px' }}>Hoạt động Cẩu (CHE)</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '150px', overflowY: 'auto' }}>
              {activeChe.map(che => (
                <div key={che.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 6px', backgroundColor: che.status === 'idle' ? '#f1f5f9' : '#fffbeb', borderRadius: '4px', border: '1px solid', borderColor: che.status === 'idle' ? '#e2e8f0' : '#fde68a' }}>
                   <span style={{ fontWeight: 'bold', color: '#475569' }}>{che.id} ({che.type === 'rtg' ? 'Cẩu bánh lốp' : 'Xe nâng'})</span>
                   <span style={{ color: che.status === 'idle' ? '#64748b' : '#d97706', fontWeight: che.status !== 'idle' ? 'bold' : 'normal', fontSize: '11px' }}>
                      {che.status === 'idle' ? 'Rảnh rỗi' : (che.status === 'moving_to_slot' ? 'Chạy tới Ô...' : `Đang gắp ${Math.round(che.handlingProgress)}%`)}
                   </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {slots.length > 0 && currentZoom < 18 && (
          <div style={{ marginTop: '5px', padding: '8px', backgroundColor: '#fffbeb', color: '#b45309', borderRadius: '8px', fontSize: '12px', border: '1px solid #fde68a' }}>
            ⚠️ <strong>Chế độ tối ưu hóa:</strong> Bạn đang ở góc nhìn xa. Lưới Container đã được ẩn đi để chống giật lag. Hãy <strong>Zoom sát vào bản đồ (Mức 18+)</strong> để xem chi tiết từng ô lưới.
          </div>
        )}

        {portBoundary && (
          <button onClick={() => setPortBoundary(null)} style={{ backgroundColor: '#EF4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
            ❌ Xóa khung ranh giới đỏ (Nếu quá to)
          </button>
        )}
      </div>

      <div style={{ position: 'absolute', top: 80, left: 20, zIndex: 1000, display: 'flex', gap: '10px' }}>
        <button onClick={handleSaveToCloud} disabled={isSavingToDB} style={{ backgroundColor: '#10B981', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '5px' }}>
          {isSavingToDB ? '⏳ Đang lưu...' : '☁️ Lưu lên Cloud DB'}
        </button>
        <button onClick={handleExportData} style={{ backgroundColor: '#3B82F6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '5px' }}>
          📥 Xuất Database (JSON)
        </button>
        <button onClick={() => document.getElementById('import-json').click()} style={{ backgroundColor: '#F59E0B', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '5px' }}>
          📂 Tải Database (JSON)
        </button>
        <input type="file" id="import-json" accept=".json" style={{ display: 'none' }} onChange={handleImportData} />
      </div>

      <HoverInfoPanel inventory={inventory} />
    </div>
  );
};
export default FreePortDigitizer;






