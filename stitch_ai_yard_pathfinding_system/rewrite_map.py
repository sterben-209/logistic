import re

filepath = r'D:\test everything\logistic\stitch_ai_yard_pathfinding_system\index.html'
with open(filepath, 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Replace HTML of op-tab-map
map_tab_pattern = r'<!-- Map Tab -->\s*<div id="op-tab-map" class="op-tab-content absolute inset-0 p-4">\s*<canvas id="yard-canvas" class="w-full h-full rounded-lg border border-outline-variant/30 bg-\[#0b1326\]"></canvas>\s*</div>'

new_map_tab = '''<!-- Map Tab -->
            <div id="op-tab-map" class="op-tab-content absolute inset-0 flex p-4 gap-4">
                <!-- Left Column -->
                <div class="w-72 flex flex-col gap-4 bg-surface-container/30 p-4 rounded-xl border border-outline-variant/20 overflow-y-auto">
                    <h3 class="font-bold text-lg text-primary flex items-center gap-2">
                        <span class="material-symbols-outlined">satellite_alt</span> Map Builder
                    </h3>
                    
                    <div class="flex flex-col gap-2">
                        <label class="text-sm text-on-surface-variant font-bold">Background Image</label>
                        <input type="file" id="map-bg-upload" accept="image/png, image/jpeg" class="block w-full text-sm text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/20 file:text-primary hover:file:bg-primary/30 cursor-pointer"/>
                    </div>

                    <div class="w-full h-40 rounded border border-outline-variant/30 flex items-center justify-center bg-surface-container-lowest overflow-hidden">
                        <img id="map-bg-preview" class="w-full h-full object-cover hidden" alt="Map Preview"/>
                        <span id="map-bg-placeholder" class="text-outline-variant text-sm">No image</span>
                    </div>

                    <button id="btn-ai-scan" class="bg-inverse-primary text-on-primary px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-primary transition-colors">
                        <span class="material-symbols-outlined">psychology</span> AI Auto-Scan
                    </button>
                    <span id="ai-scan-status" class="text-xs text-secondary text-center hidden animate-pulse">Scanning map semantics...</span>

                    <div class="flex-1"></div>

                    <button id="btn-save-map" class="bg-primary text-on-primary px-4 py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-primary-fixed transition-colors shadow-lg shadow-primary/20">
                        <span class="material-symbols-outlined">save</span> Save to DB
                    </button>
                </div>

                <!-- Right Column -->
                <div class="flex-1 flex flex-col gap-3 bg-surface-container/30 p-4 rounded-xl border border-outline-variant/20 relative">
                    <!-- Toolbar -->
                    <div class="flex gap-2 bg-surface-container-high/80 p-2 rounded-lg border border-outline-variant/30 w-fit">
                        <button class="map-tool-btn active flex items-center gap-1 px-3 py-1.5 rounded bg-primary/20 text-primary border border-primary/50" data-tool="storage">
                            <span class="w-3 h-3 rounded bg-[rgba(59,130,246,0.5)]"></span> Storage
                        </button>
                        <button class="map-tool-btn flex items-center gap-1 px-3 py-1.5 rounded text-on-surface-variant hover:bg-surface-variant/50" data-tool="building">
                            <span class="w-3 h-3 rounded bg-[rgba(0,0,0,0.7)] border border-white/20"></span> Building
                        </button>
                        <button class="map-tool-btn flex items-center gap-1 px-3 py-1.5 rounded text-on-surface-variant hover:bg-surface-variant/50" data-tool="road">
                            <span class="w-3 h-3 rounded bg-[rgba(156,163,175,0.5)]"></span> Road
                        </button>
                        <div class="w-px h-6 bg-outline-variant/50 self-center mx-1"></div>
                        <button class="map-tool-btn flex items-center gap-1 px-3 py-1.5 rounded text-on-surface-variant hover:bg-error/20 hover:text-error" data-tool="eraser">
                            <span class="material-symbols-outlined text-[16px]">ink_eraser</span> Eraser
                        </button>
                    </div>

                    <!-- Canvas Wrapper -->
                    <div class="flex-1 relative border border-outline-variant/50 rounded overflow-hidden bg-surface-lowest" id="canvas-wrapper">
                        <canvas id="yard-canvas" class="absolute top-0 left-0 w-full h-full cursor-crosshair"></canvas>
                    </div>
                </div>
            </div>'''
html = re.sub(map_tab_pattern, new_map_tab, html, flags=re.DOTALL)


# 2. Replace JS drawMap and add new logic
js_start = r'// --- CANVAS MAP ---'
js_end = r'// Resize observer for canvas'

# Extract the previous code first
match = re.search(f'{js_start}.*?(?={js_end})', html, re.DOTALL)

new_canvas_js = r'''// --- CANVAS MAP BUILDER ---
    const GRID_SIZE = 20;
    let mapGridData = []; // Store cell types
    let currentTool = 'storage';
    let isDrawing = false;
    let bgImage = null;

    // Init empty grid data
    for(let x=0; x<GRID_SIZE; x++){
        for(let y=0; y<GRID_SIZE; y++){
            mapGridData.push({x: x, y: y, type: null});
        }
    }

    // Tool Selection
    document.querySelectorAll('.map-tool-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.map-tool-btn').forEach(b => {
                b.classList.remove('bg-primary/20', 'text-primary', 'border', 'border-primary/50');
                b.classList.add('text-on-surface-variant');
            });
            e.currentTarget.classList.remove('text-on-surface-variant');
            e.currentTarget.classList.add('bg-primary/20', 'text-primary', 'border', 'border-primary/50');
            currentTool = e.currentTarget.dataset.tool;
        });
    });

    // Image Upload
    const uploadInput = document.getElementById('map-bg-upload');
    const previewImg = document.getElementById('map-bg-preview');
    const previewPlaceholder = document.getElementById('map-bg-placeholder');
    if(uploadInput) {
        uploadInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if(file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    bgImage = new Image();
                    bgImage.onload = () => {
                        previewImg.src = event.target.result;
                        previewImg.classList.remove('hidden');
                        previewPlaceholder.classList.add('hidden');
                        drawMap(); // Redraw canvas with bg
                    }
                    bgImage.src = event.target.result;
                }
                reader.readAsDataURL(file);
            }
        });
    }

    // AI Mock Scan
    const btnAiScan = document.getElementById('btn-ai-scan');
    const scanStatus = document.getElementById('ai-scan-status');
    if(btnAiScan) {
        btnAiScan.addEventListener('click', () => {
            scanStatus.classList.remove('hidden');
            let scans = 0;
            const scanInterval = setInterval(() => {
                // Randomly assign types to simulate AI
                mapGridData.forEach(cell => {
                    if(Math.random() > 0.8) {
                        const rand = Math.random();
                        if(rand < 0.5) cell.type = 'storage';
                        else if(rand < 0.7) cell.type = 'road';
                        else if(rand < 0.8) cell.type = 'building';
                    }
                });
                drawMap();
                scans++;
                if(scans > 5) {
                    clearInterval(scanInterval);
                    scanStatus.textContent = "Scan Complete!";
                    scanStatus.classList.remove('animate-pulse');
                    scanStatus.classList.add('text-primary');
                    setTimeout(() => scanStatus.classList.add('hidden'), 2000);
                }
            }, 300);
        });
    }

    // Save to DB
    const btnSaveMap = document.getElementById('btn-save-map');
    if(btnSaveMap) {
        btnSaveMap.addEventListener('click', () => {
            const exportedData = mapGridData.filter(c => c.type !== null);
            console.log("EXPORTED YARD MAP JSON:");
            console.log(JSON.stringify(exportedData, null, 2));
            alert("Đã xuất JSON ra Console log thành công!");
        });
    }

    // Draw Function
    function drawMap() {
        const canvas = document.getElementById('yard-canvas');
        if(!canvas || canvas.offsetParent === null) return;
        const ctx = canvas.getContext('2d');
        const cw = canvas.width = canvas.parentElement.clientWidth;
        const ch = canvas.height = canvas.parentElement.clientHeight;

        ctx.clearRect(0, 0, cw, ch);

        // Draw Background
        if(bgImage) {
            ctx.drawImage(bgImage, 0, 0, cw, ch);
        }

        const cellW = cw / GRID_SIZE;
        const cellH = ch / GRID_SIZE;

        // Layer 1: Edited Cells (Map Builder data)
        mapGridData.forEach(cell => {
            if(!cell.type) return;
            ctx.beginPath();
            if(cell.type === 'storage') ctx.fillStyle = 'rgba(59, 130, 246, 0.5)';
            else if(cell.type === 'building') ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            else if(cell.type === 'road') ctx.fillStyle = 'rgba(156, 163, 175, 0.5)';
            ctx.fillRect(cell.x * cellW, cell.y * cellH, cellW, cellH);
        });

        // Layer 1b: Draw Grid Lines
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        for(let i=0; i<=GRID_SIZE; i++) {
            ctx.beginPath(); ctx.moveTo(i*cellW, 0); ctx.lineTo(i*cellW, ch); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, i*cellH); ctx.lineTo(cw, i*cellH); ctx.stroke();
        }

        // Layer 2: Vehicles
        if(db && db.vehicles) {
            db.vehicles.forEach(v => {
                ctx.beginPath();
                // Map current_x and current_y to the grid (assuming current_x is 1-based, grid is 0-based)
                const vx = (v.current_x - 1) * cellW + cellW * 0.5;
                const vy = (v.current_y - 1) * cellH + cellH * 0.5;
                ctx.arc(vx, vy, Math.min(cellW, cellH)*0.3, 0, Math.PI*2);
                ctx.fillStyle = v.status === 'Idle' ? '#10b981' : '#f59e0b';
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.stroke();
                ctx.fillStyle = '#fff';
                ctx.font = '10px Inter';
                ctx.fillText(v.id, vx - 15, vy - 15);
            });
        }
    }

    // Canvas Interaction (Paint)
    const canvas = document.getElementById('yard-canvas');
    if(canvas) {
        function getGridPos(e) {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const cellW = canvas.width / GRID_SIZE;
            const cellH = canvas.height / GRID_SIZE;
            return {
                gx: Math.floor(x / cellW),
                gy: Math.floor(y / cellH)
            };
        }

        function paintCell(e) {
            if(!isDrawing) return;
            const {gx, gy} = getGridPos(e);
            if(gx >= 0 && gx < GRID_SIZE && gy >= 0 && gy < GRID_SIZE) {
                const cell = mapGridData.find(c => c.x === gx && c.y === gy);
                if(cell) {
                    cell.type = currentTool === 'eraser' ? null : currentTool;
                    requestAnimationFrame(drawMap);
                }
            }
        }

        canvas.addEventListener('mousedown', (e) => { isDrawing = true; paintCell(e); });
        canvas.addEventListener('mousemove', paintCell);
        window.addEventListener('mouseup', () => { isDrawing = false; });
    }

    '''

if match:
    html = html[:match.start()] + new_canvas_js + html[match.end():]
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(html)
    print("Map UI updated!")
else:
    print("Could not find js_start")
