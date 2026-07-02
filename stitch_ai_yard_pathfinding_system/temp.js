
    (function() {
        const canvas = document.getElementById('main-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const container = document.getElementById('canvas-container');
        
        let imgObj = null;
        let bgImgData = null; 
        let mode = 'idle'; 
        let pins = []; 
        let rulerLine = []; 
        let pixelToMeterRatio = null; 
        let measurements = [];
        let mapZones = [];
        let yardGrid = [];
        let currentRect = null; 
        let isDragging = false;
        
        // Pan and Zoom states
        let scale = 1;
        let offsetX = 0;
        let offsetY = 0;
        let isPanning = false;
        let startPan = {x:0, y:0};
        
        const SLOT_WIDTH_M = 3;
        const SLOT_HEIGHT_M = 13;

        const fileInput = document.getElementById('upload-img');
        const pinBtn = document.getElementById('btn-pin');
        const flattenBtn = document.getElementById('btn-flatten');
        const pinStatus = document.getElementById('pin-status');
        const rulerBtn = document.getElementById('btn-ruler');
        const ratioDisplay = document.getElementById('ratio-display');
        const drawZoneBtn = document.getElementById('btn-draw-zone');
        const zoneTypeSel = document.getElementById('zone-type');
        const undoBtn = document.getElementById('btn-undo');
        const clearBtn = document.getElementById('btn-clear');
        const aiDetectBtn = document.getElementById('btn-ai-detect');
        const exportBtn = document.getElementById('btn-export');
        const exportOut = document.getElementById('export-output');

        let animationFrameId = null;
        
        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
                    canvas.width = entry.contentRect.width;
                    canvas.height = entry.contentRect.height;
                }
            }
        });
        if (container) resizeObserver.observe(container);

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            ctx.save();
            ctx.translate(offsetX, offsetY);
            ctx.scale(scale, scale);
            
            if (bgImgData) ctx.drawImage(bgImgData, 0, 0);
            else if (imgObj) ctx.drawImage(imgObj, 0, 0);

            if (pins.length > 0) {
                ctx.strokeStyle = '#ffb4ab';
                ctx.lineWidth = 2 / scale;
                ctx.beginPath();
                ctx.moveTo(pins[0].x, pins[0].y);
                for(let i=1; i<pins.length; i++) ctx.lineTo(pins[i].x, pins[i].y);
                if(pins.length === 4) ctx.closePath();
                ctx.stroke();

                pins.forEach((p, i) => {
                    ctx.fillStyle = '#ff5451';
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 5 / scale, 0, Math.PI*2);
                    ctx.fill();
                    ctx.fillStyle = 'white';
                    ctx.font = `${12/scale}px Inter`;
                    ctx.fillText(i+1, p.x + 8/scale, p.y - 8/scale);
                });
            }

            if (rulerLine.length > 0) {
                ctx.strokeStyle = '#ff5451';
                ctx.lineWidth = 3 / scale;
                ctx.beginPath();
                ctx.moveTo(rulerLine[0].x, rulerLine[0].y);
                if(rulerLine[1]) ctx.lineTo(rulerLine[1].x, rulerLine[1].y);
                ctx.stroke();
                
                rulerLine.forEach(p => {
                    ctx.fillStyle = 'white';
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 4 / scale, 0, Math.PI*2);
                    ctx.fill();
                });
            }

            measurements.forEach(m => {
                ctx.strokeStyle = m.source === 'AI' ? '#a855f7' : '#ff5451';
                ctx.lineWidth = 3 / scale;
                ctx.beginPath();
                ctx.moveTo(m.p1.x, m.p1.y);
                ctx.lineTo(m.p2.x, m.p2.y);
                ctx.stroke();
                
                ctx.fillStyle = 'white';
                ctx.font = `${12/scale}px Inter`;
                ctx.fillText(`${m.m}m`, (m.p1.x + m.p2.x)/2, (m.p1.y + m.p2.y)/2 - 5/scale);
            });

            mapZones.forEach(z => drawZone(z));

            yardGrid.forEach(slot => {
                ctx.strokeStyle = 'rgba(78, 222, 163, 0.4)'; 
                ctx.lineWidth = 1 / scale;
                ctx.strokeRect(slot.x, slot.y, slot.w, slot.h);
            });

            if (currentRect && mode === 'zone') {
                const tempZone = { ...currentRect, type: zoneTypeSel.value };
                drawZone(tempZone);
            }

            ctx.restore();
            animationFrameId = requestAnimationFrame(draw);
        }

        function drawZone(z) {
            ctx.lineWidth = 2 / scale;
            if (z.type === 'Storage') {
                ctx.strokeStyle = '#4d8eff';
                ctx.fillStyle = 'rgba(77, 142, 255, 0.1)';
            } else if (z.type === 'Road') {
                ctx.strokeStyle = '#8c909f';
                ctx.fillStyle = 'rgba(140, 144, 159, 0.3)';
            } else if (z.type === 'Building') {
                ctx.strokeStyle = '#000000';
                ctx.fillStyle = 'rgba(0,0,0,0.6)';
            }
            
            ctx.fillRect(z.startX, z.startY, z.width, z.height);
            ctx.strokeRect(z.startX, z.startY, z.width, z.height);
            
            if (pixelToMeterRatio) {
                const wm = Math.abs(z.width / pixelToMeterRatio).toFixed(1);
                const hm = Math.abs(z.height / pixelToMeterRatio).toFixed(1);
                ctx.fillStyle = 'white';
                ctx.font = `${10/scale}px JetBrains Mono, monospace`;
                ctx.fillText(`${wm}m x ${hm}m`, z.startX + 5/scale, z.startY + 15/scale);
            }
        }
        
        function getMousePos(e) {
            const rect = canvas.getBoundingClientRect();
            const cssScaleX = canvas.width / rect.width;
            const cssScaleY = canvas.height / rect.height;
            const x = (e.clientX - rect.left) * cssScaleX;
            const y = (e.clientY - rect.top) * cssScaleY;
            return {
                x: (x - offsetX) / scale,
                y: (y - offsetY) / scale
            };
        }
        
        // PAN & ZOOM EVENTS
        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const cssScaleX = canvas.width / rect.width;
            const cssScaleY = canvas.height / rect.height;
            const mouseX = (e.clientX - rect.left) * cssScaleX;
            const mouseY = (e.clientY - rect.top) * cssScaleY;
            
            const zoomIntensity = 0.1;
            const wheel = e.deltaY < 0 ? 1 : -1;
            const zoomFactor = Math.exp(wheel * zoomIntensity);
            
            offsetX = mouseX - (mouseX - offsetX) * zoomFactor;
            offsetY = mouseY - (mouseY - offsetY) * zoomFactor;
            scale *= zoomFactor;
        }, { passive: false });

        let draggingPinIndex = -1;
        canvas.addEventListener('mousedown', (e) => {
            if (e.button === 1 || mode === 'idle' || e.altKey) {
                isPanning = true;
                const rect = canvas.getBoundingClientRect();
                const cssScaleX = canvas.width / rect.width;
                const cssScaleY = canvas.height / rect.height;
                const x = (e.clientX - rect.left) * cssScaleX;
                const y = (e.clientY - rect.top) * cssScaleY;
                startPan = { x: x - offsetX, y: y - offsetY };
                canvas.style.cursor = 'grabbing';
                return;
            }
            
            const pos = getMousePos(e);
            if (mode === 'pin') {
                let clickedExisting = false;
                for (let i = 0; i < pins.length; i++) {
                    const dx = pins[i].x - pos.x;
                    const dy = pins[i].y - pos.y;
                    if (dx*dx + dy*dy <= (15 / scale) * (15 / scale)) {
                        draggingPinIndex = i;
                        clickedExisting = true;
                        canvas.style.cursor = 'move';
                        break;
                    }
                }
                
                if (!clickedExisting && pins.length < 4) {
                    pins.push(pos);
                    pinStatus.textContent = `${pins.length}/4 Pins Set`;
                }
            } else if (mode === 'ruler') {
                if (rulerLine.length === 0) rulerLine.push(pos);
                else if (rulerLine.length === 1) {
                    rulerLine.push(pos);
                    processRuler();
                } else rulerLine = [pos];
            
            } else if (mode === 'cv-crop') {
                isDragging = true;
                currentRect = { startX: pos.x, startY: pos.y, width: 0, height: 0 };
            } else if (mode === 'zone') {
                isDragging = true;
                currentRect = { startX: pos.x, startY: pos.y, width: 0, height: 0 };
            }
        });

        canvas.addEventListener('mousemove', (e) => {
            if (isPanning) {
                const rect = canvas.getBoundingClientRect();
                const cssScaleX = canvas.width / rect.width;
                const cssScaleY = canvas.height / rect.height;
                const x = (e.clientX - rect.left) * cssScaleX;
                const y = (e.clientY - rect.top) * cssScaleY;
                offsetX = x - startPan.x;
                offsetY = y - startPan.y;
                return;
            }
            
            if (draggingPinIndex !== -1 && mode === 'pin') {
                pins[draggingPinIndex] = getMousePos(e);
                return;
            }
            
            if (mode === 'pin') {
                const pos = getMousePos(e);
                let hoverPin = false;
                for (let i = 0; i < pins.length; i++) {
                    const dx = pins[i].x - pos.x;
                    const dy = pins[i].y - pos.y;
                    if (dx*dx + dy*dy <= (15 / scale) * (15 / scale)) {
                        hoverPin = true;
                        break;
                    }
                }
                canvas.style.cursor = hoverPin ? 'grab' : 'crosshair';
            }
            
            
            if (isDragging && mode === 'cv-crop') {
                const pos = getMousePos(e);
                currentRect.width = pos.x - currentRect.startX;
                currentRect.height = pos.y - currentRect.startY;
            }
            
            if (isDragging && mode === 'cv-crop') {
                isDragging = false;
                if (Math.abs(currentRect.width) > 20 / scale && Math.abs(currentRect.height) > 20 / scale) {
                    const x = currentRect.width < 0 ? currentRect.startX + currentRect.width : currentRect.startX;
                    const y = currentRect.height < 0 ? currentRect.startY + currentRect.height : currentRect.startY;
                    const w = Math.abs(currentRect.width);
                    const h = Math.abs(currentRect.height);
                    
                    const temp = document.createElement('canvas');
                    temp.width = w; temp.height = h;
                    const tctx = temp.getContext('2d');
                    
                    const sourceImg = bgImgData ? bgImgData : imgObj;
                    if(sourceImg) {
                        tctx.drawImage(sourceImg, x, y, w, h, 0, 0, w, h);
                        const imgData = tctx.getImageData(0, 0, w, h);
                        const mId = Date.now();
                        pendingCVMesures[mId] = { p1: {x,y}, p2: {x:x+w, y:y+h} };
                        
                        btnCvCrop.innerHTML = '<span class="material-symbols-outlined text-[14px] animate-spin">refresh</span> Processing...';
                        btnCvCrop.disabled = true;
                        
                        cvWorker.postMessage({ type: 'PROCESS', imageData: imgData, id: mId });
                    }
                }
                currentRect = null;
                mode = 'idle';
            }
            if (isDragging && mode === 'zone') {
                const pos = getMousePos(e);
                currentRect.width = pos.x - currentRect.startX;
                currentRect.height = pos.y - currentRect.startY;
            } else if (mode === 'ruler' && rulerLine.length === 1) {
                rulerLine[1] = getMousePos(e); 
            }
        });

        canvas.addEventListener('mouseup', (e) => {
            if (isPanning) {
                isPanning = false;
                canvas.style.cursor = 'crosshair';
                return;
            }
            if (draggingPinIndex !== -1) {
                draggingPinIndex = -1;
                canvas.style.cursor = 'crosshair';
                return;
            }
            if (isDragging && mode === 'zone') {
                isDragging = false;
                if (Math.abs(currentRect.width) > 10 / scale && Math.abs(currentRect.height) > 10 / scale) saveZone();
                currentRect = null;
            }
        });
        
        function zoomToFit(w, h) {
            const padding = 40;
            let cw = canvas.width > 0 ? canvas.width : 800;
            let ch = canvas.height > 0 ? canvas.height : 600;
            let scaleX = (cw - padding*2) / w;
            let scaleY = (ch - padding*2) / h;
            if (scaleX <= 0) scaleX = 0.1;
            if (scaleY <= 0) scaleY = 0.1;
            scale = Math.min(scaleX, scaleY);
            offsetX = (cw - w * scale) / 2;
            offsetY = (ch - h * scale) / 2;
        }
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    imgObj = img;
                    bgImgData = null;
                    pins = [];
                    pinStatus.textContent = `0/4 Pins Set`;
                    zoomToFit(img.width, img.height);
                }
                img.src = event.target.result;
            }
            reader.readAsDataURL(file);
        });

        pinBtn.addEventListener('click', () => { mode = 'pin'; pins = []; pinStatus.textContent = `0/4 Pins Set`; });
        
        // HOMOGRAPHY WARP HELPERS
        function solveLinearSystem(A, b) {
            const n = b.length;
            for (let i = 0; i < n; i++) {
                let maxEl = Math.abs(A[i][i]);
                let maxRow = i;
                for (let k = i + 1; k < n; k++) {
                    if (Math.abs(A[k][i]) > maxEl) {
                        maxEl = Math.abs(A[k][i]);
                        maxRow = k;
                    }
                }
                for (let k = i; k < n; k++) {
                    const tmp = A[maxRow][k];
                    A[maxRow][k] = A[i][k];
                    A[i][k] = tmp;
                }
                const tmp = b[maxRow];
                b[maxRow] = b[i];
                b[i] = tmp;
                
                for (let k = i + 1; k < n; k++) {
                    const c = -A[k][i] / A[i][i];
                    for (let j = i; j < n; j++) {
                        if (i === j) A[k][j] = 0;
                        else A[k][j] += c * A[i][j];
                    }
                    b[k] += c * b[i];
                }
            }
            const x = new Array(n).fill(0);
            for (let i = n - 1; i >= 0; i--) {
                x[i] = b[i] / A[i][i];
                for (let k = i - 1; k >= 0; k--) {
                    b[k] -= A[k][i] * x[i];
                }
            }
            return x;
        }

        function getHomography(src, dst) {
            const A = [];
            const b = [];
            for (let i = 0; i < 4; i++) {
                const x = src[i].x;
                const y = src[i].y;
                const u = dst[i].x;
                const v = dst[i].y;
                A.push([x, y, 1, 0, 0, 0, -u*x, -u*y]);
                b.push(u);
                A.push([0, 0, 0, x, y, 1, -v*x, -v*y]);
                b.push(v);
            }
            const h = solveLinearSystem(A, b);
            return [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], 1.0];
        }

        function warpPerspective(srcImgData, targetWidth, targetHeight, H) {
            const dstData = new ImageData(targetWidth, targetHeight);
            const dstPixels = dstData.data;
            const srcPixels = srcImgData.data;
            const sw = srcImgData.width;
            const sh = srcImgData.height;
            
            let dstIdx = 0;
            for (let y = 0; y < targetHeight; y++) {
                for (let x = 0; x < targetWidth; x++) {
                    const z = H[6]*x + H[7]*y + H[8];
                    const sx = (H[0]*x + H[1]*y + H[2]) / z;
                    const sy = (H[3]*x + H[4]*y + H[5]) / z;
                    
                    if (sx >= 0 && sx < sw - 1 && sy >= 0 && sy < sh - 1) {
                        const sx0 = Math.floor(sx);
                        const sy0 = Math.floor(sy);
                        const dx = sx - sx0;
                        const dy = sy - sy0;
                        
                        const idx00 = (sy0 * sw + sx0) * 4;
                        const idx10 = idx00 + 4;
                        const idx01 = idx00 + sw * 4;
                        const idx11 = idx01 + 4;
                        
                        for (let c = 0; c < 4; c++) {
                            const val00 = srcPixels[idx00 + c];
                            const val10 = srcPixels[idx10 + c];
                            const val01 = srcPixels[idx01 + c];
                            const val11 = srcPixels[idx11 + c];
                            
                            const top = val00 * (1 - dx) + val10 * dx;
                            const bot = val01 * (1 - dx) + val11 * dx;
                            dstPixels[dstIdx + c] = top * (1 - dy) + bot * dy;
                        }
                        dstPixels[dstIdx + 3] = 255;
                    } else {
                        dstPixels[dstIdx + 3] = 0; 
                    }
                    dstIdx += 4;
                }
            }
            return dstData;
        }

        function sortPins(p) {
            const sortedY = [...p].sort((a,b) => a.y - b.y);
            const top = sortedY.slice(0,2).sort((a,b) => a.x - b.x); // TL, TR
            const bottom = sortedY.slice(2,4).sort((a,b) => a.x - b.x); // BL, BR
            return [top[0], top[1], bottom[1], bottom[0]]; // returns tl, tr, br, bl
        }

        flattenBtn.addEventListener('click', () => {
            if (pins.length !== 4 || !imgObj) return alert("Please upload an image and set exactly 4 pins.");
            pinStatus.textContent = "Processing...";
            
            setTimeout(() => {
                const [tl, tr, br, bl] = sortPins(pins);
                const dist = (p1, p2) => Math.hypot(p2.x - p1.x, p2.y - p1.y);
                const targetWidth = Math.floor(Math.max(dist(tl, tr), dist(bl, br)));
                const targetHeight = Math.floor(Math.max(dist(tl, bl), dist(tr, br)));
                
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = imgObj.width;
                tempCanvas.height = imgObj.height;
                const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
                tempCtx.drawImage(imgObj, 0, 0);
                const srcData = tempCtx.getImageData(0, 0, imgObj.width, imgObj.height);
                
                const dstCorners = [
                    {x: 0, y: 0},
                    {x: targetWidth, y: 0},
                    {x: targetWidth, y: targetHeight},
                    {x: 0, y: targetHeight}
                ];
                const srcCorners = [tl, tr, br, bl];
                
                const H = getHomography(dstCorners, srcCorners);
                const warpedData = warpPerspective(srcData, targetWidth, targetHeight, H);
                
                const off = document.createElement('canvas');
                off.width = targetWidth;
                off.height = targetHeight;
                off.getContext('2d').putImageData(warpedData, 0, 0);
                
                const newImg = new Image();
                newImg.onload = () => {
                    bgImgData = newImg;
                    imgObj = null;
                    pins = [];
                    pinStatus.textContent = "Image Flattened Perfectly!";
                    zoomToFit(targetWidth, targetHeight);
                };
                newImg.src = off.toDataURL();
            }, 10);
        });
        
        rulerBtn.addEventListener('click', () => { mode = 'ruler'; rulerLine = []; });
        
        function processRuler() {
            const p1 = rulerLine[0];
            const p2 = rulerLine[1];
            const pxDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
            
            setTimeout(() => {
                const meters = prompt(`Line drawn is ${pxDist.toFixed(2)} pixels.\nEnter real-world distance in meters:`);
                if (meters && !isNaN(meters) && meters > 0) {
                    measurements.push({
                        id: 'm_' + Date.now(),
                        source: 'Manual',
                        type: 'Custom',
                        m: parseFloat(meters),
                        px: pxDist,
                        ratio: pxDist / parseFloat(meters),
                        p1: {x: p1.x, y: p1.y},
                        p2: {x: p2.x, y: p2.y}
                    });
                    updateMeasurementsUI();
                }
                mode = 'idle';
                rulerLine = []; 
            }, 50);
        }

        function updateMeasurementsUI() {
            const list = document.getElementById('measurements-list');
            list.innerHTML = '';
            
            if (measurements.length === 0) {
                pixelToMeterRatio = null;
                ratioDisplay.textContent = 'Not calibrated';
                return;
            }
            
            let totalRatio = 0;
            measurements.forEach(m => {
                totalRatio += m.ratio;
                
                const item = document.createElement('div');
                item.className = "flex justify-between items-center bg-[#222a3d] p-1.5 rounded border border-[#424754]";
                
                const badgeColor = m.source === 'OpenCV' ? 'bg-blue-900 text-blue-300' : 'bg-red-900 text-red-300';
                
                item.innerHTML = `
                    <div class="flex items-center gap-2">
                        <span class="${badgeColor} text-[9px] px-1 py-0.5 rounded uppercase font-bold">${m.source}</span>
                        <span class="text-[10px] text-white">${m.type}: ${m.px.toFixed(1)}px = ${m.m}m</span>
                    </div>
                    <button class="text-[#8c909f] hover:text-[#ffb4ab] transition-colors" onclick="deleteMeasurement('${m.id}')">
                        <span class="material-symbols-outlined text-[14px]">delete</span>
                    </button>
                `;
                list.appendChild(item);
            });
            
            pixelToMeterRatio = totalRatio / measurements.length;
            ratioDisplay.textContent = `${pixelToMeterRatio.toFixed(2)} px/m`;
        }

        window.deleteMeasurement = function(id) {
            measurements = measurements.filter(m => m.id !== id);
            updateMeasurementsUI();
        };

                // OpenCV Web Worker
        const workerCode = `
        importScripts('https://docs.opencv.org/4.8.0/opencv.js');
        cv['onRuntimeInitialized'] = () => { postMessage({ type: 'READY' }); };
        onmessage = function(e) {
            if (e.data.type === 'PROCESS') {
                const imgData = e.data.imageData;
                try {
                    let src = cv.matFromImageData(imgData);
                    let dst = new cv.Mat();
                    let edges = new cv.Mat();
                    let lines = new cv.Mat();
                    
                    cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY, 0);
                    cv.Canny(dst, edges, 50, 150, 3);
                    cv.HoughLinesP(edges, lines, 1, Math.PI / 180, 30, 20, 5);
                    
                    if (lines.rows === 0) {
                        src.delete(); dst.delete(); edges.delete(); lines.delete();
                        throw new Error("Không tìm thấy đường vạch container nào.");
                    }
                    
                    let lengths = [];
                    for (let i = 0; i < lines.rows; ++i) {
                        let x1 = lines.data32S[i * 4];
                        let y1 = lines.data32S[i * 4 + 1];
                        let x2 = lines.data32S[i * 4 + 2];
                        let y2 = lines.data32S[i * 4 + 3];
                        lengths.push(Math.hypot(x2 - x1, y2 - y1));
                    }
                    
                    lengths.sort((a, b) => b - a);
                    let topLengths = lengths.slice(0, Math.max(1, Math.floor(lengths.length * 0.15)));
                    let avgPixelLength = topLengths.reduce((a, b) => a + b, 0) / topLengths.length;
                    
                    src.delete(); dst.delete(); edges.delete(); lines.delete();
                    
                    postMessage({ type: 'RESULT', px: avgPixelLength, ratio: avgPixelLength / 12.2, id: e.data.id });
                } catch (err) {
                    postMessage({ type: 'ERROR', error: err.message, id: e.data.id });
                }
            }
        };`;
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const cvWorker = new Worker(URL.createObjectURL(blob));
        let isCvReady = false;
        
        let pendingCVMesures = {};
        const btnCvCrop = document.getElementById('btn-cv-crop');
        
        cvWorker.onmessage = (e) => {
            if (e.data.type === 'READY') {
                isCvReady = true;
            }
            else if (e.data.type === 'RESULT') {
                const pending = pendingCVMesures[e.data.id];
                if(pending) {
                    measurements.push({
                        id: 'cv_' + Date.now(), source: 'OpenCV', type: '40ft Auto',
                        m: 12.2, px: e.data.px, ratio: e.data.ratio,
                        p1: pending.p1, p2: pending.p2
                    });
                    updateMeasurementsUI();
                    delete pendingCVMesures[e.data.id];
                    btnCvCrop.innerHTML = '🔍 CV Crop';
                    btnCvCrop.disabled = false;
                }
            } else if (e.data.type === 'ERROR') {
                alert("OpenCV: " + e.data.error + "\\nĐã tự động chuyển sang Thước đo thủ công.");
                const pending = pendingCVMesures[e.data.id];
                if(pending) delete pendingCVMesures[e.data.id];
                btnCvCrop.innerHTML = '🔍 CV Crop';
                btnCvCrop.disabled = false;
                mode = 'ruler';
                rulerLine = [];
            }
        };
        
        if(btnCvCrop) {
            btnCvCrop.addEventListener('click', () => {
                if(!isCvReady) return alert("OpenCV đang được tải xuống từ CDN, vui lòng đợi vài giây...");
                mode = 'cv-crop';
                currentRect = null;
            });
        }

        
        drawZoneBtn.addEventListener('click', () => {
            if(!pixelToMeterRatio) return alert("Please calibrate scale (Phase 2) first!");
            mode = 'zone';
        });
        
        undoBtn.addEventListener('click', () => {
            const last = mapZones.pop();
            if(last && last.type === 'Storage') yardGrid = yardGrid.filter(s => s.zoneId !== last.id);
        });
        clearBtn.addEventListener('click', () => { mapZones = []; yardGrid = []; });

        function saveZone() {
            let x = currentRect.width < 0 ? currentRect.startX + currentRect.width : currentRect.startX;
            let y = currentRect.height < 0 ? currentRect.startY + currentRect.height : currentRect.startY;
            let w = Math.abs(currentRect.width);
            let h = Math.abs(currentRect.height);

            const zone = {
                id: 'zone_' + Date.now(),
                type: zoneTypeSel.value,
                startX: x,
                startY: y,
                width: w,
                height: h,
                realWidthMeters: w / pixelToMeterRatio,
                realHeightMeters: h / pixelToMeterRatio
            };
            
            mapZones.push(zone);
            if (zone.type === 'Storage') generateGrid(zone);
        }

        function generateGrid(zone) {
            const slotPxW = SLOT_WIDTH_M * pixelToMeterRatio;
            const slotPxH = SLOT_HEIGHT_M * pixelToMeterRatio;
            
            const cols = Math.floor(zone.width / slotPxW);
            const rows = Math.floor(zone.height / slotPxH);
            
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const gx = zone.startX + c * slotPxW;
                    const gy = zone.startY + r * slotPxH;
                    
                    yardGrid.push({
                        id: `slot_${zone.id}_${r}_${c}`,
                        zoneId: zone.id,
                        row: r,
                        col: c,
                        x: gx,
                        y: gy,
                        w: slotPxW,
                        h: slotPxH,
                        status: 'Empty'
                    });
                }
            }
        }
        
        aiDetectBtn.addEventListener('click', async () => {
            if (!pixelToMeterRatio) return alert("Please calibrate scale (Phase 2) first!");
            const targetImage = bgImgData ? bgImgData : imgObj;
            if (!targetImage) return alert("Please upload an image first!");
            
            aiDetectBtn.innerHTML = '<span class="material-symbols-outlined text-[14px] animate-spin">refresh</span> Processing...';
            aiDetectBtn.disabled = true;
            
            try {
                const temp = document.createElement('canvas');
                temp.width = targetImage.width || targetImage.naturalWidth;
                temp.height = targetImage.height || targetImage.naturalHeight;
                temp.getContext('2d').drawImage(targetImage, 0, 0);
                const blob = await new Promise(r => temp.toBlob(r, 'image/jpeg'));

                const res = await fetch("https://api-inference.huggingface.co/models/facebook/detr-resnet-50", {
                    method: "POST",
                    body: blob
                });
                
                if (!res.ok) throw new Error("API rate limit reached (Free Endpoint limit).");
                
                const data = await res.json();
                
                let count = 0;
                data.forEach(obj => {
                    if (obj.score > 0.5) {
                        const box = obj.box;
                        const w = box.xmax - box.xmin;
                        const h = box.ymax - box.ymin;
                        const type = (obj.label === 'car' || obj.label === 'truck' || obj.label === 'train' || obj.label === 'boat') ? 'Storage' : 'Building';
                        
                        const zone = {
                            id: 'ai_zone_' + Date.now() + Math.random(),
                            type: type,
                            startX: box.xmin,
                            startY: box.ymin,
                            width: w,
                            height: h,
                            realWidthMeters: w / pixelToMeterRatio,
                            realHeightMeters: h / pixelToMeterRatio
                        };
                        mapZones.push(zone);
                        if (zone.type === 'Storage') generateGrid(zone);
                        count++;
                    }
                });
                alert(`AI Detected ${count} objects!`);
            } catch (err) {
                alert("AI Detection Failed: " + err.message);
            } finally {
                aiDetectBtn.innerHTML = '<span class="material-symbols-outlined text-[14px]">smart_toy</span> AI Auto-Detect (Free Endpoint)';
                aiDetectBtn.disabled = false;
            }
        });

        exportBtn.addEventListener('click', () => {
            const payload = {
                metadata: { pixelToMeterRatio, generatedAt: new Date().toISOString() },
                zones: mapZones.map(z => ({
                    id: z.id, type: z.type,
                    realWidthMeters: z.realWidthMeters, realHeightMeters: z.realHeightMeters,
                    pixelBounds: { x: z.startX, y: z.startY, w: z.width, h: z.height }
                })),
                grid_slots: yardGrid.map(s => ({
                    id: s.id, zoneId: s.zoneId, status: s.status,
                    pixelBounds: { x: s.x, y: s.y, w: s.w, h: s.h }
                }))
            };
            exportOut.value = JSON.stringify(payload, null, 2);
        });

        // Start Loop
        animationFrameId = requestAnimationFrame(draw);
    })();
    