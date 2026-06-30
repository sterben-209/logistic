import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Polygon, DrawingManager, Marker } from '@react-google-maps/api';
import { mockAiScanPort, generateGridForPolygon, fetchMapData, searchPortsWithSerpApi } from '../services/mapService';

const libraries = ['places', 'drawing', 'geometry'];

const containerStyle = {
  width: '100%',
  height: '100%'
};

const defaultCenter = {
  lat: 10.763428,
  lng: 106.779777 // Cát Lái
};

// Hàm tính tâm (Centroid) của Polygon để đặt Text Label
const getPolygonCentroid = (path) => {
  if (!path || path.length === 0) return defaultCenter;
  let latSum = 0, lngSum = 0;
  path.forEach(p => {
    latSum += p.lat;
    lngSum += p.lng;
  });
  return {
    lat: latSum / path.length,
    lng: lngSum / path.length
  };
};

const PortZoningMap = () => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: '', // Add API Key later
    libraries: libraries
  });

  const [map, setMap] = useState(null);
  const [zones, setZones] = useState([]);
  const [slots, setSlots] = useState([]);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [mapTypeId, setMapTypeId] = useState('roadmap');
  
  // Search States
  const [searchInput, setSearchInput] = useState('');
  const [predictions, setPredictions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Caching / Optimization State
  const [isPortConfigured, setIsPortConfigured] = useState(false);
  const [isCheckingData, setIsCheckingData] = useState(false);

  const onLoad = useCallback(function callback(map) {
    setMap(map);
    checkPortData('DEFAULT_PORT_ID');
  }, []);

  const onUnmount = useCallback(function callback(map) {
    setMap(null);
  }, []);

  const toggleMapType = () => {
    setMapTypeId((prev) => (prev === 'roadmap' ? 'satellite' : 'roadmap'));
  };

  // TỐI ƯU CHI PHÍ: Chỉ tìm kiếm khi nhấn nút (Tránh tốn 250 limit của SerpApi)
  const handleExecuteSearch = async (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    
    setIsSearching(true);
    const results = await searchPortsWithSerpApi(searchInput);
    setPredictions(results);
    setIsSearching(false);
  };

  const handleSelectPrediction = (placeId, description, location) => {
    setSearchInput(description);
    setPredictions([]);

    if (location && map) {
      map.panTo(location);
      map.setZoom(16);
      checkPortData(placeId);
    }
  };

  const checkPortData = async (portId) => {
    setIsCheckingData(true);
    setZones([]);
    setSlots([]);
    
    try {
      const data = await fetchMapData(portId);
      if (data && data.zones && data.zones.length > 0) {
        setZones(data.zones);
        setSlots(data.slots || []);
        setIsPortConfigured(true); 
      } else {
        setIsPortConfigured(false); 
      }
    } catch (error) {
      console.error('Lỗi khi fetch data', error);
      setIsPortConfigured(false);
    } finally {
      setIsCheckingData(false);
    }
  };

  const handleAiZoning = async () => {
    if (!map || isPortConfigured) return;
    setIsLoadingAi(true);
    try {
      const bounds = map.getBounds();
      const newZones = await mockAiScanPort(bounds);
      
      const newSlots = [];
      newZones.forEach(zone => {
        const zoneSlots = generateGridForPolygon(zone.path);
        newSlots.push(...zoneSlots);
      });

      setZones(prev => [...prev, ...newZones]);
      setSlots(prev => [...prev, ...newSlots]);
    } catch (error) {
      console.error('AI Zoning Failed', error);
    } finally {
      setIsLoadingAi(false);
    }
  };

  const onPolygonComplete = (polygon) => {
    const path = polygon.getPath();
    const pathArray = [];
    for (let i = 0; i < path.getLength(); i++) {
      const p = path.getAt(i);
      pathArray.push({ lat: p.lat(), lng: p.lng() });
    }
    
    polygon.setMap(null);

    const newZone = {
      id: `manual-zone-${Date.now()}`,
      path: pathArray,
      name: `Bãi Mới (${pathArray.length} góc)`
    };

    const newSlots = generateGridForPolygon(pathArray);
    
    setZones(prev => [...prev, newZone]);
    setSlots(prev => [...prev, ...newSlots]);
  };

  const exportData = () => {
    const data = { zones, slots };
    console.log('Exported Data:', JSON.stringify(data, null, 2));
    alert('Dữ liệu đã được in ra Console!');
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.code === 'Tab') {
        e.preventDefault();
        toggleMapType();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return isLoaded ? (
    <div className="map-wrapper">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={16}
        onLoad={onLoad}
        onUnmount={onUnmount}
        mapTypeId={mapTypeId}
        options={{
          disableDefaultUI: true,
        }}
      >
        {!isPortConfigured && map && window.google && (
          <DrawingManager
            onPolygonComplete={onPolygonComplete}
            options={{
              drawingControl: true,
              drawingControlOptions: {
                position: window.google?.maps?.ControlPosition?.TOP_CENTER,
                drawingModes: [window.google?.maps?.drawing?.OverlayType?.POLYGON]
              },

              polygonOptions: {
                fillColor: '#2196F3',
                fillOpacity: 0.1,
                strokeWeight: 2,
                strokeColor: '#2196F3',
                clickable: false,
                editable: false,
                zIndex: 1
              }
            }}
          />
        )}

        {/* Vẽ các Slots (Ô container) */}
        {slots.map(slot => (
          <Polygon
            key={slot.id}
            paths={slot.path}
            options={{
              fillColor: '#4CAF50',
              fillOpacity: 0.4,
              strokeColor: mapTypeId === 'satellite' ? '#69F0AE' : '#1B5E20',
              strokeOpacity: 1,
              strokeWeight: 1,
              zIndex: 3
            }}
          />
        ))}

        {/* Vẽ các Zone lớn và gắn Tên UI lên bản đồ */}
        {zones.map((zone, idx) => {
          const center = getPolygonCentroid(zone.path);
          return (
            <React.Fragment key={zone.id}>
              <Polygon
                paths={zone.path}
                options={{
                  fillColor: '#FF9800',
                  fillOpacity: 0.2,
                  strokeColor: mapTypeId === 'satellite' ? '#FFEB3B' : '#FF9800',
                  strokeOpacity: 1,
                  strokeWeight: 2,
                  zIndex: 2
                }}
              />
              <Marker
                position={center}
                label={{
                  text: zone.name || `Bãi ${idx + 1}`,
                  color: 'white',
                  fontWeight: '900',
                  fontSize: '15px',
                  className: 'map-zone-label' // Cần CSS shadow cho rõ chữ
                }}
                icon={{
                  path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
                  scale: 0 // Ẩn icon tròn, chỉ lấy Label text
                }}
                zIndex={4}
              />
            </React.Fragment>
          );
        })}
      </GoogleMap>

      <div className="control-panel">
        <h1 className="panel-title">Port Zoning Map</h1>

        <div className="search-container">
          <form onSubmit={handleExecuteSearch} style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="text"
              className="search-input"
              placeholder="Nhập tên cảng..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <button type="submit" className="btn btn-export" disabled={isSearching} style={{ padding: '8px', minWidth: '70px' }}>
              {isSearching ? '...' : 'Tìm'}
            </button>
          </form>
          {predictions.length > 0 && (
            <ul className="search-predictions">
              {predictions.map(pred => (
                <li 
                  key={pred.place_id} 
                  onClick={() => handleSelectPrediction(pred.place_id, pred.description, pred.location)}
                >
                  {pred.description}
                </li>
              ))}
            </ul>
          )}
        </div>

        {isCheckingData ? (
          <div className="status-badge checking">Đang kiểm tra dữ liệu cảng...</div>
        ) : isPortConfigured ? (
          <div className="status-badge configured">✅ Cảng đã được quy hoạch (Chế độ xem)</div>
        ) : (
          <div className="status-badge empty">Chưa có dữ liệu quy hoạch</div>
        )}
        
        <button onClick={toggleMapType} className="btn btn-layer">
          <span>Map Layer</span>
          <span className="badge">
            {mapTypeId === 'roadmap' ? 'ROADMAP' : 'SATELLITE'}
          </span>
        </button>

        <button
          onClick={handleAiZoning}
          disabled={isLoadingAi || isPortConfigured}
          className="btn btn-ai"
        >
          {isLoadingAi ? (
            <>
              <div className="spinner" />
              <span>Scanning...</span>
            </>
          ) : (
            <>
              <span style={{ fontSize: '1.2rem' }}>🤖</span>
              <span>AI Quy Hoạch Nhanh</span>
            </>
          )}
        </button>

        <button onClick={exportData} className="btn btn-export">
          💾 Lưu & Xuất Dữ liệu
        </button>

        <div className="tips-box">
          <p>💡 Mẹo:</p>
          <ul>
            <li>Chỉ trừ phí SerpApi khi bấm nút <b>Tìm</b>.</li>
            <li>Sau khi vẽ/quy hoạch, <b>Tên bãi</b> sẽ hiện nổi trên bản đồ.</li>
          </ul>
        </div>
      </div>
    </div>
  ) : <div className="loading-screen">Loading Map...</div>;
};

export default PortZoningMap;
