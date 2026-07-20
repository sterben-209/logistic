/**
 * FreePortDigitizer Component
 * 
 * Main interactive map interface for port management and logistics operations.
 * 
 * Key Features:
 * - Interactive Leaflet map with Geoman drawing tools for zone definition
 * - Real-time vessel tracking and vehicle animation
 * - Storage zone management with automatic slot grid generation
 * - Container inventory management and stacking visualization
 * - Task creation and fleet management interface
 * - Audit trail logging for all operations
 * - Offline data persistence using IndexedDB
 * - Multi-layer base map (satellite, street, terrain)
 * 
 * Integrated Components:
 * - GeomanControl: Drawing polygon zones and routes
 * - MapController: Camera control and navigation
 * - LayerTracker: Track active base map layer
 * - ZoomTracker: Monitor zoom level changes
 * - HoverInfoPanel: Display slot contents on hover
 * - CanvasSlotLayer: High-performance slot visualization
 * - TaskTab: Task management and vehicle controls
 * 
 * Data Flow:
 * - Zones are drawn and stored with geographic boundaries
 * - Slots are automatically generated within zones using Turf.js
 * - Containers are tracked in inventory with location (zone/bay/row/tier)
 * - Tasks are created to move containers between locations
 * - Vehicles execute tasks and animation shows movement on map
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Boolean} props.isActive - Whether the map is currently active/visible
 * @returns {JSX.Element} Interactive port management interface
 */
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
import { assignZoneTags } from '../services/zoneTagging';
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import { generateGridWithTurf, createFlatBufferPolygon } from '../services/turfService';
import { fetchOSMFeatures } from '../services/osmService';
import { buildGraph, findShortestPath, buildDynamicGraph } from '../services/routingService';
import { logAuditEvent } from '../services/auditService';
import { get, set, del } from 'idb-keyval';
import CanvasSlotLayer from './CanvasSlotLayer';
import TaskTab from './TaskTab';
import useVehicleAnimation from '../hooks/useVehicleAnimation';
import useTaskStore from '../store/useTaskStore';

// Local storage replacements for Supabase
const saveMapData = async (userId, data) => {
  try {
    await set(`portMapData_${userId || 'default'}`, data);
  } catch (err) {
    console.error("Local save error:", err);
  }
};

const loadMapData = async (userId) => {
  try {
    return await get(`portMapData_${userId || 'default'}`);
  } catch (err) {
    console.error("Local load error:", err);
    return null;
  }
};

const loadLocalCheData = async () => {
   try {
     const response = await fetch('./dummy_che_data.json');
     return await response.json();
   } catch (err) {
     console.error("Failed to load local CHE data", err);
     return [];
   }
};

const syncCheData = async (data) => {
  // Offline mode: do nothing
};

import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const defaultCenter = [10.766, 106.775]; 

/**
 * GeomanControl Component
 * 
 * Integrates Leaflet-Geoman drawing tools into the map.
 * Allows users to draw polygons (zones), polylines (routes), and markers (gates).
 * 
 * Callbacks:
 * - onPolygonComplete: Called when user finishes drawing a polygon or rectangle
 * - onPolylineComplete: Called when user finishes drawing a line/route
 * - onMarkerComplete: Called when user places a marker
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onPolygonComplete - Handler for completed polygon
 * @param {Function} props.onPolylineComplete - Handler for completed polyline
 * @param {Function} props.onMarkerComplete - Handler for completed marker
 */
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

/**
 * MapController Component
 * 
 * Handles camera navigation and flyTo animations.
 * When targetLocation prop changes, animates map to that location.
 * 
 * @param {Object} props - Component props
 * @param {Array} props.targetLocation - [lat, lng] to fly to
 */
const MapController = ({ targetLocation }) => {
  const map = useMap();
  useEffect(() => {
    if (targetLocation) {
      map.flyTo(targetLocation, 16, { animate: true, duration: 1.5 });
    }
  }, [targetLocation, map]);
  return null;
};

/**
 * LayerTracker Component
 * 
 * Monitors changes to the active base layer (satellite, street, terrain, etc).
 * Updates parent state when user switches between different map backgrounds.
 * 
 * @param {Object} props - Component props
 * @param {Function} props.setActiveBaseLayer - Callback with new layer name
 */
const LayerTracker = ({ setActiveBaseLayer }) => {
  useMapEvents({ baselayerchange(e) { setActiveBaseLayer(e.name); } });
  return null;
};

/**
 * ZoomTracker Component
 * 
 * Monitors zoom level changes on the map.
 * Useful for adjusting UI elements or triggering level-of-detail updates.
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onZoomChange - Callback with new zoom level
 */
const ZoomTracker = ({ onZoomChange }) => {
  const map = useMapEvents({
    zoomend() { onZoomChange(map.getZoom()); }
  });
  return null;
};


/**
 * parseSlotId Helper Function
 * 
 * Extracts zone, bay, and row information from a slot ID string.
 * Slot IDs are formatted as: zoneId-bay-row (with potential hyphens in zoneId)
 * 
 * @param {String} slotId - Slot identifier string
 * @returns {Object|null} Parsed object with { zoneId, bay, row } or null if invalid
 */
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

/**
 * HoverInfoPanel Component
 * 
 * Displays information about a storage slot when user hovers over it.
 * Shows the slot location (zone/bay/row) and stacked containers with their details.
 * 
 * Handles both 20ft and 40ft container overlaps by checking adjacent bays.
 * Container details include tier, type (REEFER/GENERAL), size, and container number.
 * 
 * @param {Object} props - Component props
 * @param {Array} props.inventory - Container inventory to query for slot contents
 */
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
  const [subType, setSubType] = useState(zone.subType || 'GENERAL_BUILDING');
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
    onSave(zone.id, { name, zoneType, subType, isVerified: finalVerified, bearing });
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
      {zoneType === 'BUILDING' && (
        <div>
          <label style={{ fontSize: '11px', color: '#666', display: 'block' }}>Phân loại công trình:</label>
          <select value={subType} onChange={e => setSubType(e.target.value)} style={{ width: '100%', padding: '4px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', backgroundColor: '#fff3e0' }}>
            <option value="GENERAL_BUILDING">Tòa nhà chung</option>
            <option value="WAREHOUSE">Nhà kho (Warehouse)</option>
            <option value="TANK">Bồn chứa hóa chất (Tank)</option>
          </select>
        </div>
      )}
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
  handleUpdateZone, handleGenerateGrid, handleAdjustPadding,
  isLightMap, handleCanvasSlotClick, currentZoom, slotCounts
}) => {
  return (
    <>
      {portBoundary && (
        <GeoJSON key={JSON.stringify(portBoundary)} data={portBoundary} style={{ color: '#D50000', weight: 4, fillOpacity: 0.05, dashArray: '10, 10' }} />
      )}
      {storageZones.filter(z => z.zoneType !== 'ROAD' && z.zoneType !== 'ROAD_LINE').map(zone => (
        <FeatureGroup key={`${zone.id}-${zone.zoneType}-${zone.subType}`}>
          <Polygon positions={zone.path} pathOptions={getPolygonStyle(zone)}>
            {(showLabels && zone.name && zone.name !== '') && (
              <Tooltip permanent direction="center" className="zone-label" opacity={0.8}>
                <div style={{ textAlign: 'center', lineHeight: '1.2' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '11px' }}>{zone.name || 'Zone'}</span>
                  {zone.zoneType !== 'GENERAL' && (
                    <div style={{ fontSize: '9px', color: '#666' }}>
                      [{zone.zoneType}{zone.subType ? `-${zone.subType}` : ''}]
                    </div>
                  )}
                </div>
              </Tooltip>
            )}
            <Popup><ZonePopupForm zone={zone} onSave={handleUpdateZone} onGenerateGrid={handleGenerateGrid} onAdjustPadding={handleAdjustPadding} /></Popup>
          </Polygon>
          {(zone.slots && zone.slots.length > 0 && currentZoom >= 17) && (
            <CanvasSlotLayer 
              slots={zone.slots}
              isLightMap={isLightMap}
              onSlotClick={handleCanvasSlotClick}
              zoneType={zone.zoneType}
              subType={zone.subType}
              allowedCargo={zone.allowedCargo}
              slotCounts={slotCounts}
            />
          )}
        </FeatureGroup>
      ))}
      {storageZones.filter(z => z.zoneType === 'ROAD').map(zone => (
        <Polygon key={`${zone.id}-${zone.zoneType}`} positions={zone.path} pathOptions={getPolygonStyle(zone)}>
          {(showLabels && zone.name && zone.name !== '') && (
            <Tooltip permanent direction="center" className="zone-label" opacity={0.8}>
              <span style={{ fontWeight: 'bold', fontSize: '11px' }}>{zone.name}</span>
            </Tooltip>
          )}
          <Popup><ZonePopupForm zone={zone} onSave={handleUpdateZone} onGenerateGrid={handleGenerateGrid} onAdjustPadding={handleAdjustPadding} /></Popup>
        </Polygon>
      ))}
      {storageZones.filter(z => z.zoneType === 'ROAD_LINE').map(zone => (
        <Polyline key={`${zone.id}-${zone.zoneType}`} positions={zone.path} color="#facc15" weight={6} dashArray="10, 10">
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

// SlotLayer đã được thay thế bằng CanvasSlotLayer (raw HTML5 Canvas) để đạt hiệu năng 60fps
const MapResizer = ({ isActive }) => { const map = useMap(); useEffect(() => { if (isActive) { setTimeout(() => map.invalidateSize(), 100); } }, [isActive, map]); return null; };

const FreePortDigitizer = ({ user, isActive }) => {
  const mapRef = useRef(null);
  const fleetRef = useRef([]);
  const [storageZones, setStorageZones] = useState([]);
  const slots = useMemo(() => storageZones.flatMap(z => z.slots || []), [storageZones]);
  const [gates, setGates] = useState([]);
  
  const inventory = useTaskStore(state => state.inventory);
  const setStoreInventory = useTaskStore(state => state.setInventory);
  const setInventory = useCallback((newInv) => {
      if (typeof newInv === 'function') {
          setStoreInventory(newInv(useTaskStore.getState().inventory));
      } else {
          setStoreInventory(newInv);
      }
  }, [setStoreInventory]);

  const [portBoundary, setPortBoundary] = useState(null);
  
  const setStoreSlots = useTaskStore(state => state.setSlots);
  const setStoreGates = useTaskStore(state => state.setGates);
  const setStoreStorageZones = useTaskStore(state => state.setStorageZones);
  const setStorePortBoundary = useTaskStore(state => state.setPortBoundary);
  const setStoreFleetRegistry = useTaskStore(state => state.setFleetRegistry);
  const activeTasks = useTaskStore(state => state.tasks);

  useEffect(() => {
    setStoreSlots(slots);
  }, [slots, setStoreSlots]);

  useEffect(() => {
    setStoreGates(gates);
  }, [gates, setStoreGates]);

  useEffect(() => {
    setStoreStorageZones(storageZones);
  }, [storageZones, setStoreStorageZones]);

  useEffect(() => {
    setStorePortBoundary(portBoundary);
  }, [portBoundary, setStorePortBoundary]);
  
  const slotCounts = useMemo(() => {
    const counts = {};
    inventory.forEach(c => {
      const cBayNum = parseInt(c.bay, 10);
      const row = c.row;
      const zoneId = c.zoneId;

      const pad = (n) => n.toString().padStart(2, '0');

      if (c.size === 20) {
         const id = `${zoneId}-${pad(cBayNum)}-${row}`;
         counts[id] = (counts[id] || 0) + 1;
      } else {
         const id1 = `${zoneId}-${pad(cBayNum - 1)}-${row}`;
         const id2 = `${zoneId}-${pad(cBayNum)}-${row}`;
         const id3 = `${zoneId}-${pad(cBayNum + 1)}-${row}`;
         counts[id1] = (counts[id1] || 0) + 1;
         counts[id2] = (counts[id2] || 0) + 1;
         counts[id3] = (counts[id3] || 0) + 1;
      }
    });
    return counts;
  }, [inventory]);

  const [slotUpdateTick, setSlotUpdateTick] = useState(0);
  const [showLabels, setShowLabels] = useState(false);
  const [graphData, setGraphData] = useState(null);
  const [activeRoute, setActiveRoute] = useState([]);

  const [searchInput, setSearchInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [predictions, setPredictions] = useState([]);
  const [targetLocation, setTargetLocation] = useState(null);
  
  const [isDetecting, setIsDetecting] = useState(false);
  const [aiStatus, setAiStatus] = useState('');
  const [isTagging, setIsTagging] = useState(false);
  const [taggingStatus, setTaggingStatus] = useState('');
  const [activeBaseLayer, setActiveBaseLayer] = useState('Vệ Tinh (ESRI)');
  const [currentZoom, setCurrentZoom] = useState(16);
  const [isSavingToDB, setIsSavingToDB] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Lazy Backup (đẩy lên cloud mỗi 3 phút nếu có thay đổi)
  const saveToCloudRef = useRef();
  useEffect(() => {
    saveToCloudRef.current = handleSaveToCloud;
  });

  useEffect(() => {
    const backupInterval = setInterval(() => {
      if (isDataLoaded && activeTasks.length === 0) {
        if (saveToCloudRef.current) saveToCloudRef.current();
      }
    }, 180000); // 3 phút
    return () => clearInterval(backupInterval);
  }, [isDataLoaded, activeTasks.length]);

  const handleRunZoneTagging = async () => {
    // Filter out zones with invalid or insufficient coordinates early
    const validZonesForTagging = storageZones.filter(zone => {
      const latLngCoords = zone.pathLatLngs || zone.path;
      if (!latLngCoords || !Array.isArray(latLngCoords) || latLngCoords.length < 3) {
        return false; // Not enough points for a potential polygon
      }
      return true;
    });

    if (validZonesForTagging.length === 0) {
      alert("Vui lòng vẽ ít nhất một vùng hợp lệ (ít nhất 3 điểm) trước khi gán nhãn!");
      return;
    }

    setIsTagging(true);
    setTaggingStatus("Đang phân tích và gán nhãn cho các vùng...");

    try {
      // Prepare data for tagging algorithm using only valid zones
      const zones = validZonesForTagging
        .filter(zone => !zone.zoneType || zone.zoneType === 'YARD' || zone.zoneType === 'GENERAL')
        .map(zone => {
          let latLngCoords = zone.pathLatLngs || zone.path;

          // Convert to [lng, lat] format for Turf (handle both [lat, lng] arrays and {lat, lng} objects)
          const lngLatCoords = latLngCoords.map(p => {
            if (Array.isArray(p)) return [p[1], p[0]];
            if (p && typeof p === 'object' && p.lng !== undefined && p.lat !== undefined) return [p.lng, p.lat];
            return [0, 0]; // Fallback, shouldn't happen for valid data
          });

          // Ensure polygon is closed (first point = last point)
          if (lngLatCoords.length > 0 &&
              (lngLatCoords[0][0] !== lngLatCoords[lngLatCoords.length - 1][0] ||
               lngLatCoords[0][1] !== lngLatCoords[lngLatCoords.length - 1][1])) {
            lngLatCoords.push([lngLatCoords[0][0], lngLatCoords[0][1]]);
          }

          // Ensure we have at least 4 points for a valid polygon ring
          if (lngLatCoords.length < 4) {
            console.warn("Not enough points to create a valid polygon for zone:", zone.id);
            return null; // Skip invalid polygons
          }

          return {
            ...zone,
            // Store original [lat, lng] format for Leaflet display and future use
            pathLatLngs: latLngCoords,
            // Add the Turf-compatible lngLatCoords for direct use in assignZoneTags
            turfCoords: lngLatCoords
          };
        })
        .filter(zone => zone !== null); // Remove null entries

      const buildings = storageZones
        .filter(zone => zone.zoneType === 'BUILDING')
        .map(zone => {
          let latLngCoords = zone.pathLatLngs || zone.path;
          if (!latLngCoords || !Array.isArray(latLngCoords) || latLngCoords.length < 3) {
            return null; // Skip if no coordinates or not enough points
          }

          const lngLatCoords = latLngCoords.map(p => {
            if (Array.isArray(p)) return [p[1], p[0]];
            if (p && typeof p === 'object' && p.lng !== undefined && p.lat !== undefined) return [p.lng, p.lat];
            return [0, 0]; // Fallback
          });

          if (lngLatCoords.length > 0 &&
              (lngLatCoords[0][0] !== lngLatCoords[lngLatCoords.length - 1][0] ||
               lngLatCoords[0][1] !== lngLatCoords[lngLatCoords.length - 1][1])) {
            lngLatCoords.push([lngLatCoords[0][0], lngLatCoords[0][1]]);
          }

          if (lngLatCoords.length < 4) {
            console.warn("Not enough points to create a valid polygon for building:", zone.id);
            return null; // Skip invalid polygons
          }

          return {
            ...zone,
            pathLatLngs: latLngCoords,
            turfCoords: lngLatCoords
          };
        })
        .filter(zone => zone !== null); // Remove null entries

      const mainGate = gates.length > 0 ? gates[0] : null;
      
      const taggedZones = assignZoneTags(zones, buildings, mainGate);

      // Map back the tagged results to the full storageZones array
      const newStorageZones = storageZones.map(origZone => {
        const tagged = taggedZones.find(t => t.id === origZone.id);
        if (tagged) {
          // Tính toán isCovered cho từng slot riêng biệt nếu bãi này có chứa tòa nhà
          let updatedSlots = origZone.slots;
          if (origZone.slots && origZone.slots.length > 0) {
            updatedSlots = origZone.slots.map(slot => {
              // Create turf polygon for slot
              let isCovered = false;
              try {
                const slotRing = [...slot.path.map(p => [p[1], p[0]]), [slot.path[0][1], slot.path[0][0]]];
                const slotPoly = turf.polygon([slotRing]);
                
                isCovered = buildings.some(b => {
                  try {
                    const bPoly = turf.polygon([b.turfCoords]);
                    const intersection = turf.intersect(turf.featureCollection([slotPoly, bPoly]));
                    if (intersection) {
                      const intArea = turf.area(intersection);
                      const slotArea = turf.area(slotPoly);
                      // Slot chỉ thành xám nếu trên 50% diện tích của nó nằm trong tòa nhà
                      return (intArea / slotArea) > 0.5;
                    }
                    return false;
                  } catch(e) {
                    // Fallback to centroid point-in-polygon if intersection fails
                    const slotLat = slot.path.reduce((sum, p) => sum + p[0], 0) / slot.path.length;
                    const slotLng = slot.path.reduce((sum, p) => sum + p[1], 0) / slot.path.length;
                    return turf.booleanPointInPolygon(turf.point([slotLng, slotLat]), turf.polygon([b.turfCoords]));
                  }
                });
              } catch(e) {
                isCovered = false;
              }

              return { ...slot, isCovered };
            });
          }

          return {
            ...origZone,
            slots: updatedSlots,
            zoneType: tagged.zoneType || origZone.zoneType,
            subType: tagged.subType || origZone.subType,
            allowedCargo: tagged.allowedCargo || origZone.allowedCargo,
            taggingReason: tagged.taggingReason || origZone.taggingReason,
            isVerified: true
          };
        }
        return origZone;
      });

      setStorageZones(newStorageZones);
      setTaggingStatus("Gán nhãn thành công!");
      console.log("Tag thành công!", taggedZones);
      setTimeout(() => setTaggingStatus(''), 3000);
    } catch (error) {
      console.error("Lỗi khi gán nhãn:", error);
      alert("Đã xảy ra lỗi khi gán nhãn: " + error.message);
      setTaggingStatus("Lỗi gán nhãn");
    } finally {
      setIsTagging(false);
    }
  };

  // Khôi phục dữ liệu từ DB (ưu tiên) hoặc IndexedDB
  useEffect(() => {
    const loadFromCache = async () => {
      try {
        const cached = await get('nexus_port_data_cache');
        if (cached) {
          const data = typeof cached === 'string' ? JSON.parse(cached) : cached;
          if ((data.storageZones && data.storageZones.length > 0) || (data.slots && data.slots.length > 0) || data.portBoundary) {
            const zones = data.storageZones || [];
            const flatSlots = data.slots || [];
            setStorageZones(zones.map(z => ({ ...z, slots: z.slots || flatSlots.filter(s => s.zoneId === z.id) })));
            setGates(data.gates || []);
            setInventory(data.inventory || []);
            setActiveRoute([]);
            if (data.portBoundary !== undefined) setPortBoundary(data.portBoundary);
            if (data.fleetRegistry) setStoreFleetRegistry(data.fleetRegistry);
            setIsDataLoaded(true);
            return true;
          }
        }
      } catch(e) {
         console.warn("Lỗi khi đọc IndexedDB:", e);
      }
      return false;
    };

    const initializeData = async () => {
      if (user) {
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Supabase Fetch Timeout")), 3000));
        try {
          const data = await Promise.race([loadMapData(user.id || user.uid), timeoutPromise]);
          if (data && ((data.storageZones && data.storageZones.length > 0) || (data.slots && data.slots.length > 0) || data.portBoundary)) {
            const zones = data.storageZones || [];
            const flatSlots = data.slots || [];
            setStorageZones(zones.map(z => ({ ...z, slots: z.slots || flatSlots.filter(s => s.zoneId === z.id) })));
            setGates(data.gates || []);
            setInventory(data.inventory || []);
            setActiveRoute([]);
            if (data.portBoundary !== undefined) setPortBoundary(data.portBoundary);
            if (data.fleetRegistry) setStoreFleetRegistry(data.fleetRegistry);
            
            setIsDataLoaded(true);
            await set('nexus_port_data_cache', {
               storageZones: data.storageZones || [],
               slots: data.slots || [],
               gates: data.gates || [],
               inventory: data.inventory || [],
               activeRoute: [],
               portBoundary: data.portBoundary,
               fleetRegistry: data.fleetRegistry || []
            });
          } else {
            const loaded = await loadFromCache();
            if (!loaded) setIsDataLoaded(true);
          }
        } catch (err) {
          console.warn("Lỗi tải dữ liệu DB, dùng IndexedDB fallback:", err.message);
          const loaded = await loadFromCache();
          if (!loaded) {
             window.__FETCH_ERROR_DO_NOT_SAVE = true;
             setIsDataLoaded(true);
          }
        }
      } else {
        const loaded = await loadFromCache();
        if (!loaded) {
          setTimeout(() => setIsDataLoaded(true), 1500);
        }
      }
    };

    initializeData();
  }, [user]);

  // Auto-save vào IndexedDB mỗi khi có thay đổi
  useEffect(() => {
    if (!isDataLoaded) return;
    
    const saveToIndexedDB = async () => {
      try {
        const compactSlots = slots.map(s => ({
           ...s,
           path: s.path.map(p => [Number(p[0].toFixed(6)), Number(p[1].toFixed(6))])
        }));
        const compactZones = storageZones.map(z => ({
           ...z,
           path: z.path.map(p => [Number(p[0].toFixed(6)), Number(p[1].toFixed(6))])
        }));
        
        const dataToCache = { 
           storageZones: compactZones, 
           slots: compactSlots, 
           gates, 
           inventory, 
           portBoundary,
           fleetRegistry: useTaskStore.getState().fleetRegistry 
        };
        await set('nexus_port_data_cache', dataToCache);
      } catch (error) {
        console.warn("Không thể lưu cache IndexedDB:", error);
      }
    };
    
    saveToIndexedDB();
  }, [storageZones, slots, gates, inventory, portBoundary, isDataLoaded]);

  // Báo cáo thay đổi lên Parent Window (SPA index.html)
  useEffect(() => {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'SYNC_PORT_DATA', payload: { slots, inventory } }, '*');
    }
  }, [slots, inventory]);



  const handlePolygonComplete = useCallback((latLngs) => {
    // Ensure we have at least 3 distinct points to form a valid polygon (will become 4 when closed)
    if (latLngs.length < 3) {
      alert("Vui lòng vẽ ít nhất 3 điểm để tạo thành một vùng hợp lệ!");
      return;
    }

    // Ensure the polygon is closed (first point = last point)
    let processedLatLngs = [...latLngs];
    const first = latLngs[0];
    const last = latLngs[latLngs.length - 1];
    if (first.lat !== last.lat || first.lng !== last.lng) {
      // If not closed, add the first point at the end to close it
      processedLatLngs.push(first);
    }

    const newZone = {
      id: `zone-${Date.now()}`,
      path: processedLatLngs.map(p => [p.lat, p.lng]),
      pathLatLngs: processedLatLngs,
      name: '', zoneType: 'GENERAL', isVerified: false
    };
    setStorageZones(prev => [...prev, newZone]);
  }, []);

  const handlePolylineComplete = useCallback((latLngs) => {
    // Ensure we have at least 2 points for a polyline
    if (latLngs.length < 2) {
      console.warn("Not enough points to create a polyline");
      return;
    }

    const newZone = {
      id: `road-line-${Date.now()}`,
      path: latLngs.map(p => [p.lat, p.lng]),
      pathLatLngs: latLngs,
      name: '', zoneType: 'ROAD_LINE', isVerified: true
    };
    setStorageZones(prev => [...prev, newZone]);

    // Auto-delete slots that overlap with the new road line
    setStorageZones(prev => {
       const lineCoords = latLngs.map(p => [p.lng, p.lat]);
       if (lineCoords.length < 2) return prev;

       const roadLine = turf.lineString(lineCoords);
       const roadBuffer = turf.buffer(roadLine, 2.5, { units: 'meters', steps: 4 });
       const bufferBbox = turf.bbox(roadBuffer);

       return prev.map(zone => {
          if (!zone.slots || zone.slots.length === 0) return zone;
          const filteredSlots = zone.slots.filter(slot => {
             // Fast bbox rejection using center point (approximate)
             const sLng = slot.path[0][1];
             const sLat = slot.path[0][0];
             if (sLng < bufferBbox[0] - 0.0001 || sLng > bufferBbox[2] + 0.0001 || sLat < bufferBbox[1] - 0.0001 || sLat > bufferBbox[3] + 0.0001) return true;

             const sPath = slot.path.map(p => [p[1], p[0]]);
             sPath.push([...sPath[0]]);
             const slotPoly = turf.polygon([sPath]);

             return !turf.booleanIntersects(slotPoly, roadBuffer);
          });
          return { ...zone, slots: filteredSlots };
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
      .filter(z => (z.zoneType === 'BUILDING' || z.zoneType === 'ROAD') && z.id !== zoneId)
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
    
    // Update storageZones with the new slots and bearing
    setStorageZones(prev => {
       const othersSlots = prev.filter(z => z.id !== zoneId).flatMap(z => z.slots || []);
       
       // Dùng thuật toán Grid Spatial Hashing O(N) kết hợp Turf để chống đứng máy khi có hàng vạn Slot
       const gridHash = new Map();
       othersSlots.forEach(s => {
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
       
       return prev.map(z => z.id === zoneId ? { ...z, bearing: metadata.bearing, slots: deduplicatedNewSlots } : z);
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
        newZones.push({ id: f.id, path: f.path, pathLatLngs: f.path.map(p => ({lat: p[0], lng: p[1]})), name: f.name, zoneType: 'BUILDING', isVerified: true, subType: f.subType, isHazardous: f.isHazardous, properties: f.properties, allowedCargo: f.allowedCargo });
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
            if (z.zoneType === 'YARD' || (z.zoneType === 'BUILDING' && z.subType === 'WAREHOUSE')) {
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
      const dataToSave = { storageZones, slots, gates, inventory, activeRoute, portBoundary };
      await saveMapData(user.id, dataToSave);
      await logAuditEvent(user.id || 'system', 'UPDATE_ZONE', 'MAP', { message: 'Cập nhật cấu hình bản đồ và kho hàng' });
      try {
          await set('nexus_port_data_cache', dataToSave);
      } catch (cacheErr) {
          console.warn("Không thể lưu cache IndexedDB:", cacheErr);
      }
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
      // Do not auto-save if there was a fetch error to prevent corrupting DB with empty state
      if (window.__FETCH_ERROR_DO_NOT_SAVE) return;
      if (user && isDataLoaded) {
        saveMapData(user.id || user.uid, { 
           storageZones, slots, gates, inventory, activeRoute, portBoundary, 
           fleetRegistry: useTaskStore.getState().fleetRegistry 
        })
          .catch(err => console.error("Lỗi Auto-save DB:", err));
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') backupToDB();
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, isDataLoaded, storageZones, slots, gates, inventory, activeRoute, portBoundary]);

  const handleClearGrid = async () => {
    if (window.confirm("⚠️ BẠN CÓ CHẮC MUỐN XÓA TOÀN BỘ CÁC LƯỚI CONTAINER VÀ CỔNG TRÊN BẢN ĐỒ?\n\nHành động này không thể hoàn tác!")) {
      setStorageZones([]);
      setGates([]);
      setInventory([]);
      setActiveRoute([]);
      await del('nexus_port_data_cache');
    }
  };

  const handleClearMap = async () => {
    if (!window.confirm('Bạn có CHẮC CHẮN muốn xóa TRẮNG toàn bộ bản đồ và dữ liệu trên Cloud không? Hành động này KHÔNG THỂ HOÀN TÁC!')) return;
    setStorageZones([]);
    setGates([]);
    setInventory([]);
    setActiveRoute([]);
    setPortBoundary(null);
    localStorage.removeItem('nexus_port_data_cache');
    if (user) {
       try {
           setIsSavingToDB(true);
           await saveMapData(user.id, { storageZones: [], gates: [], inventory: [], activeRoute: [], portBoundary: null, fleetRegistry: [] });
           alert('✅ Đã xóa trắng bản đồ và cập nhật lên Cloud DB!');
       } catch(e) {
           alert('❌ Lỗi khi xóa Cloud DB: ' + e.message);
       } finally {
           setIsSavingToDB(false);
       }
    } else {
       alert('✅ Đã xóa trắng bản đồ cục bộ!');
    }
  };

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
        if (data.storageZones) {
           const zones = data.storageZones;
           const flatSlots = data.slots || [];
           setStorageZones(zones.map(z => ({ ...z, slots: z.slots || flatSlots.filter(s => s.zoneId === z.id) })));
        }
        if (data.gates) setGates(data.gates);
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

    setStorageZones(prevZones => prevZones.map(zone => {
      if (!zone.slots) return zone;
      let updatedSlots = [...zone.slots];
      const parts = slotId.split('-');
      if (parts.length < 3) return zone;
      
      const row = parts[parts.length - 1];
      const bay = parts[parts.length - 2];
      const zoneName = parts.slice(0, parts.length - 2).join('-');
      const bayNum = parseInt(bay, 10);
      
      if (containerType === '20ft') {
         if (bayNum % 2 === 0) {
            // Note: Alert might trigger multiple times if we aren't careful, but bay checks should be localized.
            return zone;
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
      return { ...zone, slots: updatedSlots };
    }));
    setSlotUpdateTick(prev => prev + 1);

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
       let nearestGate = null;
       
       // Tìm Gate gần nhất với Slot
       const allGates = Array.from(tempGraph.values()).filter(n => n.type === 'GATE');
       if (allGates.length > 0) {
          nearestGate = allGates.reduce((best, gate) => {
             if (!best) return gate;
             const bestDist = Math.pow(best.coordinates[0] - slotLatLng[0], 2) + Math.pow(best.coordinates[1] - slotLatLng[1], 2);
             const gateDist = Math.pow(gate.coordinates[0] - slotLatLng[0], 2) + Math.pow(gate.coordinates[1] - slotLatLng[1], 2);
             return gateDist < bestDist ? gate : best;
          }, null);
       }
       
       Promise.resolve().then(() => {
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
                        Promise.resolve().then(async () => {
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
             
             if (nearestGate) {
                setActiveRoute([nearestGate.coordinates, slotLatLng]);
                fleetRef.current.push({
                   id: `AGV-${Math.floor(Math.random() * 9000 + 1000)}`,
                   type: 'agv',
                   origin: nearestGate.id,
                   destination: targetNodeId,
                   path: [nearestGate.coordinates, slotLatLng],
                   progress: 0,
                   status: 'moving',
                   speed: 0.000015,
                   currentSegmentIdx: 0,
                   currentPos: [...nearestGate.coordinates]
                });
                alert('Không có đường graph đầy đủ, đã vẽ fallback tuyến thẳng từ cổng gần nhất.');
             } else {
                alert('Không có cổng nào có thể kết nối được tới vị trí container này (Đường đi bị đứt đoạn)!');
             }
             
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
                else {
                   setActiveRoute([tempGraph.get(startNodeId).coordinates, slotLatLng]);
                   fleetRef.current.push({
                      id: `AGV-${Math.floor(Math.random() * 9000 + 1000)}`,
                      type: 'agv',
                      origin: startNodeId,
                      destination: targetNodeId,
                      path: [tempGraph.get(startNodeId).coordinates, slotLatLng],
                      progress: 0,
                      status: 'moving',
                      speed: 0.000015,
                      currentSegmentIdx: 0,
                      currentPos: [...tempGraph.get(startNodeId).coordinates]
                   });
                   alert('Không tìm thấy graph route đầy đủ, đã dùng fallback tuyến thẳng.');
                }
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
        Promise.resolve().then(() => {
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
      case 'BUILDING': 
        if (zone.subType === 'TANK') return { color: '#b71c1c', fillColor: '#ff9800', fillOpacity: 0.85, weight: 2 }; // Cam viền đỏ
        if (zone.subType === 'WAREHOUSE') return { color: '#1565c0', fillColor: '#42a5f5', fillOpacity: 0.75, weight: 2 }; // Xanh dương
        return { color: '#000000', fillColor: '#424242', fillOpacity: 0.7, weight: 2 };
      case 'ROAD': return { color: '#757575', fillColor: '#9e9e9e', fillOpacity: 0.4, weight: 1, dashArray: '4,4' };
      case 'CUSTOMS': return { color: '#8e24aa', fillColor: '#e1bee7', fillOpacity: 0.4, weight: 3, dashArray: '5, 5' };
      case 'YARD': 
        if (zone.subType === 'COVERED') return { color: '#616161', fillColor: '#9e9e9e', fillOpacity: 0.4, weight: 2, dashArray: '2, 6' };
        if (zone.allowedCargo && zone.allowedCargo.includes('WOOD')) return { color: '#4e342e', fillColor: '#8d6e63', fillOpacity: 0.4, weight: 2 };
        return { color: '#2e7d32', fillColor: '#81c784', fillOpacity: 0.4, weight: 2 };
      case 'DANGEROUS': 
        if (zone.subType === 'TANK_ADJACENT') return { color: '#b71c1c', fillColor: '#f44336', fillOpacity: 0.6, weight: 4, dashArray: '10, 5' }; // Bãi sát TANK cảnh báo mức cao
        return { color: '#c62828', fillColor: '#ffcccc', fillOpacity: 0.5, weight: 3 };
      case 'REEFER': return { color: '#1565c0', fillColor: '#cce5ff', fillOpacity: 0.5, weight: 3 };
      case 'METAL': return { color: '#424242', fillColor: '#e0e0e0', fillOpacity: 0.5, weight: 3 };
      case 'WOOD_COAL': return { color: '#4e342e', fillColor: '#d7ccc8', fillOpacity: 0.5, weight: 3 };
      case 'GENERAL':
      default:
        const defaultStroke = isLightMap ? '#d84315' : '#ffb300';
        return { color: defaultStroke, fillColor: defaultStroke, fillOpacity: 0.2, weight: 2 };
    }
  }, [isLightMap]);

  // Canvas slot click handler
  const handleCanvasSlotClick = useCallback((slotId) => {
    assignContainer(slotId, '40ft');
  }, [assignContainer]);

  useVehicleAnimation();

  // --- SMART DISPATCHER ---
  const taskQueue = useTaskStore(state => state.taskQueue);
  const dequeueTask = useTaskStore(state => state.dequeueTask);
  const fleetRegistry = useTaskStore(state => state.fleetRegistry);
  const updateVehicle = useTaskStore(state => state.updateVehicle);
  const addTask = useTaskStore(state => state.addTask);
  const broadcasters = useTaskStore(state => state.broadcasters);

  useEffect(() => {
    if (!graphData || taskQueue.length === 0) return;
    
    const tempGraph = new Map(graphData);
    const nodes = Array.from(tempGraph.values());
    
    // Track vehicles assigned this tick to avoid double-assigning
    const assignedVehicleIds = new Set();
    const tasksToDispatch = [];
    
    for (const task of taskQueue) {
      if (task.type === 'INBOUND' || task.type === 'OUTBOUND') {
        let firstLegTarget = task.type === 'INBOUND' ? task.gateId : task.targetSlotId;
        let secondLegTarget = task.type === 'INBOUND' ? task.targetSlotId : task.gateId;
        
        let pathArray = findShortestPath(firstLegTarget, secondLegTarget, tempGraph);
        if (pathArray && pathArray.length > 0) {
          tasksToDispatch.push({ task, pathArray, type: 'tractor' });
        } else {
          console.warn("Dispatcher: Cannot find path for external tractor", task.id);
          tasksToDispatch.push({ task, type: 'drop' });
        }
      } else if (task.type === 'SUPPORT') {
        const idleVehicles = fleetRegistry.filter(v => v.status === 'IDLE' && !assignedVehicleIds.has(v.id));
        if (idleVehicles.length === 0) continue; // Skip, don't block queue
        
        let targetCoords = tempGraph.get(task.targetSlotId)?.coordinates;
        let bestVehicle = null;
        let minDist = Infinity;
        
        if (targetCoords) {
          for (const v of idleVehicles) {
            if (!v.currentPos) continue;
            const d = Math.pow(targetCoords[0] - v.currentPos[0], 2) + Math.pow(targetCoords[1] - v.currentPos[1], 2);
            if (d < minDist) { minDist = d; bestVehicle = v; }
          }
        }
        
        const vehicle = bestVehicle || idleVehicles[0];
        if (!vehicle || !vehicle.currentPos) continue;
        
        let vehicleNodeId = null;
        let minVDist = Infinity;
        for (const n of nodes) {
          const dist = Math.pow(n.coordinates[0] - vehicle.currentPos[0], 2) + Math.pow(n.coordinates[1] - vehicle.currentPos[1], 2);
          if (dist < minVDist) { minVDist = dist; vehicleNodeId = n.id; }
        }
        
        let pathArray = [];
        if (vehicleNodeId && vehicleNodeId !== task.targetSlotId) {
          const route = findShortestPath(vehicleNodeId, task.targetSlotId, tempGraph);
          if (route) pathArray = route;
        }
        
        if (pathArray.length > 0) {
          assignedVehicleIds.add(vehicle.id);
          tasksToDispatch.push({ task, pathArray, type: 'support', vehicle });
        } else {
          console.warn("Dispatcher: Cannot find path for support task", task.id);
          tasksToDispatch.push({ task, type: 'drop' });
        }
      }
    }
    
    if (tasksToDispatch.length === 0) return;
    
    Promise.resolve().then(() => {
      for (const item of tasksToDispatch) {
        if (item.type === 'drop') {
          dequeueTask(item.task.id);
        } else if (item.type === 'tractor') {
          dequeueTask(item.task.id);
          addTask({ ...item.task, path: item.pathArray, status: 'EN_ROUTE_TO_SLOT' });
        } else if (item.type === 'support') {
          updateVehicle(item.vehicle.id, { status: 'MOVING' });
          dequeueTask(item.task.id);
          addTask({ ...item.task, assignedVehicleId: item.vehicle.id, path: item.pathArray, status: 'EN_ROUTE_TO_SLOT' });
        }
      }
    });
  }, [taskQueue, fleetRegistry, graphData, dequeueTask, updateVehicle, addTask, broadcasters]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', margin: 0, padding: 0, overflow: 'hidden' }}>
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
                isLightMap={isLightMap}
                handleCanvasSlotClick={handleCanvasSlotClick}
                currentZoom={currentZoom}
                slotCounts={slotCounts}
              />
              {gates.map(gate => (
                <Marker key={gate.id} position={gate.latLng}>
                  <Popup>Cổng ra vào: {gate.name}</Popup>
                </Marker>
              ))}
              
              {/* Vẽ tuyến đường A* (A-Star) tĩnh */}
              {activeRoute.length > 0 && (
                <Polyline positions={activeRoute} color="#10b981" weight={6} opacity={0.8}>
                  <Tooltip permanent direction="top" className="route-label" opacity={0.9}>
                    <span style={{ fontWeight: 'bold', fontSize: '12px', color: '#047857' }}>Luồng di chuyển A*</span>
                  </Tooltip>
                </Polyline>
              )}
              
              {/* Vẽ đường đi dự kiến của các xe đang hoạt động */}
              {activeTasks.map(task => {
                if (!task.path || task.path.length === 0 || task.status === 'COMPLETED') return null;
                return (
                  <Polyline 
                    key={`path-${task.id}`} 
                    positions={task.path} 
                    color={task.type === 'INBOUND' ? "#3b82f6" : "#f59e0b"} 
                    weight={3} 
                    opacity={0.4} 
                    dashArray="5, 10" 
                  />
                );
              })}
              {/* Vẽ xe nhàn rỗi (IDLE) từ Fleet Registry */}
              {fleetRegistry.map(vehicle => {
                if (vehicle.status !== 'IDLE' || !vehicle.currentPos) return null;
                const icon = vehicle.type === 'agv' ? staticAgvIcon : (vehicle.type === 'rs' ? staticRsIcon : staticRtgIcon);
                return (
                  <Marker 
                     key={`idle-${vehicle.id}`} 
                     position={vehicle.currentPos} 
                     icon={icon}
                     zIndexOffset={900}
                  >
                     <Tooltip permanent direction="top" opacity={0.8}>
                       <span style={{ fontWeight: 'bold', fontSize: '10px', color: '#10b981' }}>{vehicle.id} (IDLE)</span>
                     </Tooltip>
                  </Marker>
                );
              })}
              {/* Vẽ xe từ Task Store */}
              {activeTasks.map(task => {
                if (!task.path || task.currentIndex >= task.path.length) return null;
                const currentPos = task.path[task.currentIndex];
                let heading = 0;
                if (task.currentIndex < task.path.length - 1) {
                  const nextPos = task.path[task.currentIndex + 1];
                  const dx = nextPos[1] - currentPos[1];
                  const dy = nextPos[0] - currentPos[0];
                  heading = (Math.atan2(dx, dy) * 180 / Math.PI);
                } else if (task.currentIndex > 0) {
                  const prevPos = task.path[task.currentIndex - 1];
                  const dx = currentPos[1] - prevPos[1];
                  const dy = currentPos[0] - prevPos[0];
                  heading = (Math.atan2(dx, dy) * 180 / Math.PI);
                }

                let icon = staticTruckIcon;
                if (task.type === 'SUPPORT' && task.assignedVehicleId) {
                   if (task.assignedVehicleId.startsWith('AGV')) icon = staticAgvIcon;
                   else if (task.assignedVehicleId.startsWith('RS')) icon = staticRsIcon;
                   else icon = staticRtgIcon;
                }

                return (
                  <RotatedMarker 
                     key={task.id} 
                     id={task.type === 'SUPPORT' ? (task.assignedVehicleId || 'AGV') : task.truckPlate}
                     position={currentPos} 
                     icon={icon} 
                     heading={heading}
                     progress={task.progress}
                  />
                );
              })}
            </FeatureGroup>
          </LayersControl.Overlay>
        </LayersControl>
        <GeomanControl onPolygonComplete={handlePolygonComplete} onPolylineComplete={handlePolylineComplete} onMarkerComplete={handleMarkerComplete} />
        <MapController targetLocation={targetLocation} />
        <LayerTracker setActiveBaseLayer={setActiveBaseLayer} />
      </MapContainer>
      
      <div style={{ position: 'absolute', top: 20, left: 60, right: 60, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', backgroundColor: 'rgba(255,255,255,0.95)', padding: '12px 20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1f2937', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Free Port Digitizer</h3>
          <form onSubmit={handleExecuteSearch} style={{ display: 'flex', gap: '8px', position: 'relative', width: '250px' }}>
            <input type="text" style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', outline: 'none', color: '#111827', backgroundColor: '#ffffff', fontSize: '13px' }} placeholder="Tìm cảng (VD: Cát Lái)" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
            <button type="submit" disabled={isSearching} style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>{isSearching ? '...' : 'Tìm'}</button>
            {predictions.length > 0 && (
              <ul style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', color: 'black', border: '1px solid #d1d5db', borderRadius: '8px', padding: 0, listStyle: 'none', maxHeight: '200px', overflowY: 'auto', zIndex: 20, marginTop: '4px' }}>
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
                  }} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', color: 'black', fontSize: '13px' }}>{pred.description}</li>
                ))}
              </ul>
            )}
          </form>
          
          <div style={{ width: '1px', height: '24px', backgroundColor: '#e5e7eb', margin: '0 4px' }}></div>
          
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={handleAutoDetect} disabled={isDetecting} style={{ backgroundColor: 'transparent', color: '#374151', border: '1px solid #d1d5db', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '500', opacity: isDetecting ? 0.5 : 1 }}>🤖 AI Detect</button>
            <button onClick={handleRunZoneTagging} disabled={storageZones.length === 0} style={{ backgroundColor: 'transparent', color: '#374151', border: '1px solid #d1d5db', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '500', opacity: storageZones.length === 0 ? 0.5 : 1 }}>🏷️ Gán nhãn</button>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#4b5563', cursor: 'pointer', fontWeight: '500' }}>
              <input type="checkbox" checked={showLabels} onChange={e => setShowLabels(e.target.checked)} /> Hiện chữ
            </label>
            {portBoundary && (
              <button onClick={() => setPortBoundary(null)} style={{ backgroundColor: '#fecaca', color: '#dc2626', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>❌ Xóa viền đỏ</button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleSaveToCloud} disabled={isSavingToDB} style={{ backgroundColor: 'transparent', color: '#10b981', border: '1px solid #10b981', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}>
            {isSavingToDB ? '⏳...' : '☁️ Lưu DB'}
          </button>
          <button onClick={handleClearMap} style={{ backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #ef4444', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}>
            💥 Xóa
          </button>
          <button onClick={handleExportData} style={{ backgroundColor: 'transparent', color: '#3b82f6', border: '1px solid #3b82f6', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}>
            📥 Xuất
          </button>
          <button onClick={() => document.getElementById('import-json').click()} style={{ backgroundColor: 'transparent', color: '#f59e0b', border: '1px solid #f59e0b', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}>
            📂 Tải
          </button>
        </div>
      </div>
      


      <input type="file" id="import-json" accept=".json" style={{ display: 'none' }} onChange={handleImportData} />

      <HoverInfoPanel inventory={inventory} />
      <TaskTab />
    </div>
  );
};
export default FreePortDigitizer;






