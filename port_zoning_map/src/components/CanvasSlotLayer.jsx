import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

// Ray-Casting algorithm for point-in-polygon hit testing
const pointInPolygon = (point, vs) => {
    let x = point[0], y = point[1];
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        let xi = vs[i][0], yi = vs[i][1];
        let xj = vs[j][0], yj = vs[j][1];
        let intersect = ((yi > y) !== (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
};

const DEG2RAD = Math.PI / 180;
const R = 6378137;

const CanvasSlotLayer = ({ slots, isLightMap, onSlotClick, zoneType, subType, slotCounts, allowedCargo }) => {
    const map = useMap();
    const canvasRef = useRef(null);
    const hoveredSlotRef = useRef(null);
    const slotsRef = useRef(slots);
    slotsRef.current = slots;

    useEffect(() => {
        const canvas = L.DomUtil.create('canvas', 'leaflet-zoom-animated');
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '500';
        canvasRef.current = canvas;
        map.getPanes().overlayPane.appendChild(canvas);

        let rafId = null;

        const render = () => {
            const currentSlots = slotsRef.current;
            const size = map.getSize();
            const topLeft = map.containerPointToLayerPoint([0, 0]);
            L.DomUtil.setPosition(canvas, topLeft);
            canvas.width = size.x;
            canvas.height = size.y;
            const ctx = canvas.getContext('2d');

            if (!currentSlots || currentSlots.length === 0) return;

            // ===== BUILD FAST PROJECTION (calibrated against Leaflet) =====
            const zoom = map.getZoom();
            const scale = 256 * Math.pow(2, zoom);
            const a = 0.5 / (Math.PI * R);
            const kLng = scale * a * R * DEG2RAD;    // lng multiplier
            const kLat = -scale * a * R * 0.5;        // lat log multiplier

            // Calibrate: compute offset using one known point from Leaflet
            const center = map.getCenter();
            const refPt = map.latLngToContainerPoint(center);
            const sinRef = Math.sin(center.lat * DEG2RAD);
            const calX = refPt.x - kLng * center.lng;
            const calY = refPt.y - kLat * Math.log((1 + sinRef) / (1 - sinRef));

            // Inline projection function (just multiply + add, no object creation)
            // x = kLng * lng + calX
            // sinLat = sin(lat * DEG2RAD)
            // y = kLat * log((1+sinLat)/(1-sinLat)) + calY

            const bounds = map.getBounds().pad(0.1);
            const bSouth = bounds.getSouth(), bNorth = bounds.getNorth();
            const bWest = bounds.getWest(), bEast = bounds.getEast();

            const getBaseColor = (slot) => {
              if (slot && slot.isCovered && zoneType !== 'BUILDING') return '#616161';
              switch(zoneType) {
                case 'BUILDING':
                  if (subType === 'TANK') return '#ff9800'; // Cam
                  if (subType === 'WAREHOUSE') return '#42a5f5'; // Xanh
                  return '#424242';
                case 'CUSTOMS': return '#8e24aa';
                case 'REEFER': return '#1565c0';
                case 'DANGEROUS': return '#c62828';
                case 'YARD': 
                  if (subType === 'COVERED') return '#616161';
                  if (allowedCargo && allowedCargo.includes('WOOD')) return '#4e342e';
                  return '#2e7d32';
                case 'METAL': return '#424242';
                case 'WOOD_COAL': return '#4e342e';
                case 'GENERAL':
                default:
                  return isLightMap ? '#d84315' : '#ffb300';
              }
            };
            
            const lineWidth = isLightMap ? 2 : 1;
            const MIN_PIXEL_SIZE = 3;

            const dynamicBatches = {};
            const hoveredData = [];

            for (let i = 0; i < currentSlots.length; i++) {
                const slot = currentSlots[i];
                if (!slot || !slot.path || slot.path.length < 3) continue;
                const path = slot.path;

                // Fast bbox culling (raw number comparisons)
                let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
                for (let k = 0; k < path.length; k++) {
                    const lat = path[k][0], lng = path[k][1];
                    if (lat < minLat) minLat = lat;
                    if (lat > maxLat) maxLat = lat;
                    if (lng < minLng) minLng = lng;
                    if (lng > maxLng) maxLng = lng;
                }
                if (maxLat < bSouth || minLat > bNorth || maxLng < bWest || minLng > bEast) continue;

                // Sub-pixel skip using inline projection on bbox corners (2 points)
                const tlx = kLng * minLng + calX;
                const sinMaxLat = Math.sin(maxLat * DEG2RAD);
                const tly = kLat * Math.log((1 + sinMaxLat) / (1 - sinMaxLat)) + calY;
                const brx = kLng * maxLng + calX;
                const sinMinLat = Math.sin(minLat * DEG2RAD);
                const bry = kLat * Math.log((1 + sinMinLat) / (1 - sinMinLat)) + calY;
                if (Math.abs(brx - tlx) < MIN_PIXEL_SIZE && Math.abs(bry - tly) < MIN_PIXEL_SIZE) continue;

                // Convert all vertices using inline math (no object creation!)
                const len = path.length;
                // Store as flat array [x0,y0,x1,y1,...] to avoid creating objects
                const pts = new Float64Array(len * 2);
                for (let j = 0; j < len; j++) {
                    const lat = path[j][0];
                    const lng = path[j][1];
                    const sinL = Math.sin(lat * DEG2RAD);
                    pts[j * 2] = kLng * lng + calX;
                    pts[j * 2 + 1] = kLat * Math.log((1 + sinL) / (1 - sinL)) + calY;
                }

                // Route to batch
                const isHovered = hoveredSlotRef.current === slot.id;
                const count = slotCounts ? (slotCounts[slot.id] || 0) : 0;
                
                let opacity = 0.2;
                let topContainerColor = null;
                
                if (count > 0) {
                  opacity = Math.min(0.4 + (count - 1) * 0.2, 1.0);
                  
                  // If we want to color code based on top container type, we would need the inventory.
                  // For now, we just indicate occupancy via opacity, and perhaps a tint if count >= 3
                  if (count >= 3) {
                      // Fully occupied or nearly full slots are red-tinted or darker
                  }
                }
                
                const slotColor = topContainerColor || getBaseColor(slot);

                if (isHovered) {
                    hoveredData.push({ pts, len, opacity, color: slotColor });
                } else {
                    const opKey = opacity.toFixed(2);
                    const batchKey = `${slotColor}_${opKey}`;
                    if (!dynamicBatches[batchKey]) dynamicBatches[batchKey] = { pts: [], opacity, color: slotColor };
                    dynamicBatches[batchKey].pts.push(pts);
                }
            }

            const drawBatch = (batch, fillColor, strokeColor, fillOpacity) => {
                if (batch.length === 0) return;
                ctx.fillStyle = fillColor;
                ctx.globalAlpha = fillOpacity;
                ctx.beginPath();
                for (let p = 0; p < batch.length; p++) {
                    const pts = batch[p];
                    const len = pts.length;
                    ctx.moveTo(pts[0], pts[1]);
                    for (let j = 2; j < len; j += 2) ctx.lineTo(pts[j], pts[j + 1]);
                    ctx.closePath();
                }
                ctx.fill();
                ctx.globalAlpha = 1.0;
                ctx.strokeStyle = strokeColor;
                ctx.lineWidth = lineWidth;
                ctx.stroke();
            };

            Object.entries(dynamicBatches).forEach(([batchKey, batchData]) => {
                const op = batchData.opacity;
                const strokeColor = op <= 0.2 ? batchData.color : (isLightMap ? '#000000' : '#ffffff');
                drawBatch(batchData.pts, batchData.color, strokeColor, op);
            });

            // Hovered slot on top
            for (let h = 0; h < hoveredData.length; h++) {
                const hs = hoveredData[h];
                ctx.fillStyle = hs.color;
                ctx.globalAlpha = Math.min(hs.opacity + 0.3, 1.0);
                ctx.beginPath();
                ctx.moveTo(hs.pts[0], hs.pts[1]);
                for (let j = 2; j < hs.len * 2; j += 2) ctx.lineTo(hs.pts[j], hs.pts[j + 1]);
                ctx.closePath();
                ctx.fill();
                ctx.globalAlpha = 1.0;
                ctx.strokeStyle = '#00e5ff';
                ctx.lineWidth = lineWidth + 2;
                ctx.stroke();
            }
        };

        const scheduleRender = () => {
            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(render);
        };

        // Hover hit-testing (throttled via rAF)
        let hoverRAF = null;
        const onMouseMove = (e) => {
            if (hoverRAF) cancelAnimationFrame(hoverRAF);
            hoverRAF = requestAnimationFrame(() => {
                const currentSlots = slotsRef.current;
                const lat = e.latlng.lat, lng = e.latlng.lng;
                let foundHover = null;
                for (let i = 0; i < currentSlots.length; i++) {
                    const slot = currentSlots[i];
                    if (!slot || !slot.path) continue;
                    const path = slot.path;
                    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
                    for (let k = 0; k < path.length; k++) {
                        if (path[k][0] < minLat) minLat = path[k][0];
                        if (path[k][0] > maxLat) maxLat = path[k][0];
                        if (path[k][1] < minLng) minLng = path[k][1];
                        if (path[k][1] > maxLng) maxLng = path[k][1];
                    }
                    if (lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng) {
                        if (pointInPolygon([lat, lng], path)) {
                            foundHover = slot;
                            break;
                        }
                    }
                }
                if (foundHover) {
                    if (hoveredSlotRef.current !== foundHover.id) {
                        hoveredSlotRef.current = foundHover.id;
                        window.dispatchEvent(new CustomEvent('slotHover', { detail: {
                            id: foundHover.id,
                            type: foundHover.status === 'occupied_40' ? '40ft/45ft' : (foundHover.status === 'occupied_20' ? '20ft' : 'Trống'),
                            status: foundHover.status
                        }}));
                        scheduleRender();
                    }
                } else if (hoveredSlotRef.current !== null) {
                    hoveredSlotRef.current = null;
                    window.dispatchEvent(new CustomEvent('slotHover', { detail: null }));
                    scheduleRender();
                }
            });
        };

        // Click hit-testing for slot assignment. Use preclick so zone popups do not open first.
        const hitTestSlot = (e) => {
            const currentSlots = slotsRef.current;
            const lat = e.latlng.lat, lng = e.latlng.lng;
            for (let i = 0; i < currentSlots.length; i++) {
                const slot = currentSlots[i];
                if (!slot || !slot.path) continue;
                if (pointInPolygon([lat, lng], slot.path)) {
                    map.closePopup();
                    if (onSlotClick) onSlotClick(slot.id);
                    return true;
                }
            }
            return false;
        };

        const onPreClick = (e) => { hitTestSlot(e); };

        // Disable double-click zoom so clicks on slots work properly
        map.doubleClickZoom.disable();

        map.on('moveend', scheduleRender);
        map.on('resize', scheduleRender);
        map.on('mousemove', onMouseMove);
        map.on('preclick', onPreClick);
        render();

        return () => {
            if (canvasRef.current) {
                L.DomUtil.remove(canvasRef.current);
                canvasRef.current = null;
            }
            map.doubleClickZoom.enable();
            map.off('moveend', scheduleRender);
            map.off('resize', scheduleRender);
            map.off('mousemove', onMouseMove);
            map.off('preclick', onPreClick);
            if (rafId) cancelAnimationFrame(rafId);
            if (hoverRAF) cancelAnimationFrame(hoverRAF);
        };
    }, [map, isLightMap, onSlotClick]);

    useEffect(() => {
        if (canvasRef.current && map) {
            map.fire('moveend');
        }
    }, [slots, map]);

    return null;
};

export default CanvasSlotLayer;
