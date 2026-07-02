import re

filepath = r'D:\test everything\logistic\stitch_ai_yard_pathfinding_system\index.html'
with open(filepath, 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Replace view-operations inner HTML
new_ops_html = '''<div id="view-operations" class="spa-view hidden w-full h-full flex flex-col p-4 md:p-6 overflow-auto">
    <div class="flex flex-col h-full w-full bg-surface-container/50 border border-outline-variant/20 rounded-xl overflow-hidden backdrop-blur-md">
        <!-- Sub-tabs Nav -->
        <div class="flex gap-2 border-b border-outline-variant/30 p-3 bg-surface-container-high/50">
            <button class="op-tab-btn px-4 py-2 bg-primary text-on-primary font-bold rounded-lg shadow-sm transition-colors" data-target="op-tab-map">
                <span class="material-symbols-outlined align-middle mr-1 text-[18px]">map</span> Yard Map
            </button>
            <button class="op-tab-btn px-4 py-2 bg-transparent text-on-surface-variant hover:bg-surface-variant/50 rounded-lg transition-colors font-medium" data-target="op-tab-grid">
                <span class="material-symbols-outlined align-middle mr-1 text-[18px]">grid_on</span> Yard Grid
            </button>
            <button class="op-tab-btn px-4 py-2 bg-transparent text-on-surface-variant hover:bg-surface-variant/50 rounded-lg transition-colors font-medium" data-target="op-tab-master">
                <span class="material-symbols-outlined align-middle mr-1 text-[18px]">database</span> Master Data
            </button>
        </div>

        <!-- Tab Contents -->
        <div class="flex-1 relative overflow-hidden bg-surface-lowest">
            
            <!-- Map Tab -->
            <div id="op-tab-map" class="op-tab-content absolute inset-0 p-4">
                <canvas id="yard-canvas" class="w-full h-full rounded-lg border border-outline-variant/30 bg-[#0b1326]"></canvas>
            </div>

            <!-- Grid Data Tab -->
            <div id="op-tab-grid" class="op-tab-content absolute inset-0 p-4 hidden">
                <div id="yard-grid-hot" class="w-full h-full rounded-lg overflow-hidden border border-outline-variant/30 htDark"></div>
            </div>

            <!-- Master Data Tab -->
            <div id="op-tab-master" class="op-tab-content absolute inset-0 p-4 hidden flex flex-col md:flex-row gap-4 overflow-auto">
                <!-- Containers Table -->
                <div class="flex-[2] flex flex-col gap-2 bg-surface-container/30 p-3 rounded-xl border border-outline-variant/20">
                    <div class="flex justify-between items-center mb-2">
                        <div class="flex items-center gap-2">
                            <span class="material-symbols-outlined text-primary text-[20px]">inventory_2</span>
                            <h3 class="font-bold text-lg text-primary">Containers</h3>
                        </div>
                        <button id="btn-gate-in" class="bg-primary/20 text-primary border border-primary/30 hover:bg-primary hover:text-on-primary px-3 py-1.5 rounded-lg text-sm font-bold transition-colors">
                            Gate In
                        </button>
                    </div>
                    <div id="containers-hot" class="flex-1 rounded border border-outline-variant/30 htDark relative z-0"></div>
                </div>
                <!-- Vehicles Table -->
                <div class="flex-1 flex flex-col gap-2 bg-surface-container/30 p-3 rounded-xl border border-outline-variant/20">
                    <div class="flex justify-between items-center mb-2">
                        <div class="flex items-center gap-2">
                            <span class="material-symbols-outlined text-tertiary text-[20px]">local_shipping</span>
                            <h3 class="font-bold text-lg text-tertiary">Vehicles</h3>
                        </div>
                        <button id="btn-add-vehicle" class="bg-tertiary/20 text-tertiary border border-tertiary/30 hover:bg-tertiary hover:text-on-tertiary px-3 py-1.5 rounded-lg text-sm font-bold transition-colors">
                            Add Vehicle
                        </button>
                    </div>
                    <div id="vehicles-hot" class="flex-1 rounded border border-outline-variant/30 htDark relative z-0"></div>
                </div>
            </div>
            
        </div>
    </div>
</div>'''

# We need to replace the entire <div id="view-operations" ...>...</div> 
# We'll use regex to match from <div id="view-operations" to <div id="view-inventory"
match_ops = re.search(r'<div id="view-operations".*?(?=<div id="view-inventory")', html, re.DOTALL)
if match_ops:
    html = html[:match_ops.start()] + new_ops_html + '\n  ' + html[match_ops.end():]

# 2. Replace the old HT logic with the new complex logic
js_start = r'// Slot-based Yard Management with Handsontable'
js_end = r'</script>\n</body>'
match_js = re.search(f'{js_start}.*?(?={js_end})', html, re.DOTALL)

new_js = '''// Nexus Terminal 3-Tier Architecture Logic
    let db = { containers: [], vehicles: [], yard_grid: [] };
    let hotGrid, hotContainers, hotVehicles;

    // --- MOCK INIT DATA ---
    function initMockData() {
        // Init 5x5x3 Grid
        for(let x=1; x<=5; x++){
            for(let y=1; y<=5; y++){
                for(let z=1; z<=3; z++){
                    db.yard_grid.push({ x_coord: x, y_coord: y, tier_z: z, status: 'Empty', container_id: null });
                }
            }
        }
        db.containers.push({ id: 'NX-1001', type: "20' Dry", weight_tons: 14.5, owner: 'Maersk', status: 'In Yard' });
        db.yard_grid[0].status = 'Occupied'; db.yard_grid[0].container_id = 'NX-1001';
        
        db.vehicles.push({ id: 'AGV-01', vehicle_type: 'AGV', status: 'Idle', current_x: 1, current_y: 1, current_task: null });
        db.vehicles.push({ id: 'TRK-99', vehicle_type: 'Truck', status: 'Idle', current_x: 5, current_y: 5, current_task: null });
    }
    
    // --- SUPABASE SYNC ---
    async function loadDataFromSupabase() {
        if(!supabaseClient) { initMockData(); return; }
        try {
            const {data: cData} = await supabaseClient.from('containers').select('*');
            const {data: vData} = await supabaseClient.from('vehicles').select('*');
            const {data: yData} = await supabaseClient.from('yard_grid').select('*');
            
            if(cData && cData.length > 0) { db.containers = cData; db.vehicles = vData; db.yard_grid = yData; }
            else { initMockData(); } // fallback if empty
        } catch(e) {
            initMockData();
        }
        renderAll();
    }

    // Supabase Realtime Subscriptions
    function setupRealtime() {
        if(!supabaseClient) return;
        supabaseClient.channel('custom-all-channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'containers' }, payload => {
            loadDataFromSupabase(); // For simplicity, reload all on change
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, payload => {
            loadDataFromSupabase();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'yard_grid' }, payload => {
            loadDataFromSupabase();
        })
        .subscribe();
    }

    // --- UI TABS ---
    document.querySelectorAll('.op-tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.op-tab-btn').forEach(b => {
                b.classList.remove('bg-primary', 'text-on-primary', 'font-bold');
                b.classList.add('bg-transparent', 'text-on-surface-variant');
            });
            e.currentTarget.classList.remove('bg-transparent', 'text-on-surface-variant');
            e.currentTarget.classList.add('bg-primary', 'text-on-primary', 'font-bold');
            
            document.querySelectorAll('.op-tab-content').forEach(c => c.classList.add('hidden'));
            document.getElementById(e.currentTarget.dataset.target).classList.remove('hidden');

            if(hotGrid) hotGrid.render();
            if(hotContainers) hotContainers.render();
            if(hotVehicles) hotVehicles.render();
            drawMap();
        });
    });

    // --- HANDSONTABLES ---
    function renderAll() {
        if(!hotGrid) initHT();
        else {
            hotGrid.loadData(db.yard_grid);
            hotContainers.loadData(db.containers);
            hotVehicles.loadData(db.vehicles);
        }
        drawMap();
    }

    function initHT() {
        const gridCont = document.getElementById('yard-grid-hot');
        const contCont = document.getElementById('containers-hot');
        const vehCont = document.getElementById('vehicles-hot');

        hotGrid = new Handsontable(gridCont, {
            data: db.yard_grid,
            colHeaders: ['X', 'Y', 'Z (Tier)', 'Status', 'Container ID'],
            columns: [
                { data: 'x_coord', readOnly: true },
                { data: 'y_coord', readOnly: true },
                { data: 'tier_z', readOnly: true },
                { data: 'status', readOnly: true, renderer: function(i, td, r, c, p, v) {
                    Handsontable.renderers.TextRenderer.apply(this, arguments);
                    if(v==='Empty') td.style.color = '#10b981'; else td.style.color = '#ef4444';
                    td.style.fontWeight = 'bold';
                }},
                { data: 'container_id', type: 'dropdown', source: () => db.containers.map(c => c.id) }
            ],
            licenseKey: 'non-commercial-and-evaluation', width: '100%', height: '100%', stretchH: 'all',
            beforeChange: async function(changes, source) {
                if(source==='loadData') return;
                let valid = true;
                for(let i=0; i<changes.length; i++) {
                    const [row, prop, oldV, newV] = changes[i];
                    if(prop !== 'container_id') continue;
                    const cell = this.getSourceDataAtRow(row);
                    if(newV && !oldV) { // Add
                        if(cell.tier_z > 1) {
                            const bot = db.yard_grid.find(d => d.x_coord==cell.x_coord && d.y_coord==cell.y_coord && d.tier_z==cell.tier_z-1);
                            if(bot && bot.status==='Empty') { alert("Lỗi: Z bên dưới trống!"); changes[i]=null; valid=false; }
                        }
                        if(valid && changes[i]) { this.setDataAtRowProp(row, 'status', 'Occupied', 'logic'); }
                    } else if(!newV && oldV) { // Remove
                        const top = db.yard_grid.find(d => d.x_coord==cell.x_coord && d.y_coord==cell.y_coord && d.tier_z==cell.tier_z+1);
                        if(top && top.status==='Occupied') { alert("Lỗi: Z bên trên bị đè!"); changes[i]=null; valid=false; }
                        if(valid && changes[i]) { this.setDataAtRowProp(row, 'status', 'Empty', 'logic'); }
                    }
                }
            },
            afterChange: async function(changes, source) {
                if(source==='loadData' || source==='logic') return;
                if(supabaseClient) {
                    // Sync back to Supabase
                    for(let c of changes) {
                        const rowData = this.getSourceDataAtRow(c[0]);
                        await supabaseClient.from('yard_grid').update({ container_id: rowData.container_id, status: rowData.status }).match({x_coord: rowData.x_coord, y_coord: rowData.y_coord, tier_z: rowData.tier_z});
                    }
                }
                drawMap();
            }
        });

        hotContainers = new Handsontable(contCont, {
            data: db.containers,
            colHeaders: ['ID', 'Type', 'Weight', 'Owner', 'Status', 'Action'],
            columns: [
                { data: 'id' }, { data: 'type' }, { data: 'weight_tons', type: 'numeric' }, { data: 'owner' }, { data: 'status' },
                { data: 'action', readOnly: true, renderer: function(i, td, r, c, p, v) {
                    td.innerHTML = <button class="dispatch-btn bg-secondary text-on-secondary px-2 py-0.5 rounded text-xs shadow" data-id="">Điều phối</button>;
                }}
            ],
            licenseKey: 'non-commercial-and-evaluation', width: '100%', height: '100%', stretchH: 'all',
            afterChange: async function(changes, source) {
                if(source==='loadData') return;
                if(supabaseClient) {
                    for(let c of changes) {
                        const d = this.getSourceDataAtRow(c[0]);
                        await supabaseClient.from('containers').upsert(d);
                    }
                }
            }
        });

        hotVehicles = new Handsontable(vehCont, {
            data: db.vehicles,
            colHeaders: ['ID', 'Type', 'Status', 'X', 'Y', 'Task'],
            columns: [ { data: 'id' }, { data: 'vehicle_type' }, { data: 'status' }, { data: 'current_x' }, { data: 'current_y' }, { data: 'current_task' } ],
            licenseKey: 'non-commercial-and-evaluation', width: '100%', height: '100%', stretchH: 'all',
            afterChange: async function(changes, source) {
                if(source==='loadData') return;
                if(supabaseClient) {
                    for(let c of changes) {
                        const d = this.getSourceDataAtRow(c[0]);
                        await supabaseClient.from('vehicles').upsert(d);
                    }
                }
            }
        });

        // Gate In
        document.getElementById('btn-gate-in').addEventListener('click', async () => {
            const newId = 'NX-' + Math.floor(Math.random()*10000);
            const newCont = { id: newId, type: "20' Dry", weight_tons: 10, owner: 'Local', status: 'Gate In' };
            db.containers.push(newCont);
            if(supabaseClient) await supabaseClient.from('containers').insert(newCont);
            hotContainers.render();
        });

        // Dispatch Action
        contCont.addEventListener('click', async (e) => {
            if(e.target.classList.contains('dispatch-btn')) {
                const cid = e.target.getAttribute('data-id');
                const idleVeh = db.vehicles.find(v => v.status === 'Idle');
                if(!idleVeh) { alert("Không có xe rảnh!"); return; }
                idleVeh.status = 'Moving';
                idleVeh.current_task = Pickup ;
                
                // Find container pos
                const gridSlot = db.yard_grid.find(g => g.container_id === cid);
                const targetX = gridSlot ? gridSlot.x_coord : Math.floor(Math.random()*5)+1;
                const targetY = gridSlot ? gridSlot.y_coord : Math.floor(Math.random()*5)+1;

                if(supabaseClient) {
                    await supabaseClient.from('vehicles').update({ status: 'Moving', current_task: idleVeh.current_task }).match({id: idleVeh.id});
                }
                hotVehicles.render();

                // Animate vehicle (simple simulation)
                const interval = setInterval(async () => {
                    if(idleVeh.current_x < targetX) idleVeh.current_x++;
                    else if(idleVeh.current_x > targetX) idleVeh.current_x--;
                    else if(idleVeh.current_y < targetY) idleVeh.current_y++;
                    else if(idleVeh.current_y > targetY) idleVeh.current_y--;
                    else {
                        clearInterval(interval);
                        idleVeh.status = 'Idle';
                        idleVeh.current_task = null;
                        if(supabaseClient) {
                            await supabaseClient.from('vehicles').update({ status: 'Idle', current_task: null, current_x: targetX, current_y: targetY }).match({id: idleVeh.id});
                        }
                    }
                    hotVehicles.render();
                    drawMap();
                }, 1000);
            }
        });
    }

    // --- CANVAS MAP ---
    function drawMap() {
        const canvas = document.getElementById('yard-canvas');
        if(!canvas || canvas.offsetParent === null) return; // not visible
        const ctx = canvas.getContext('2d');
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;

        ctx.clearRect(0,0,canvas.width, canvas.height);
        
        const cellW = canvas.width / 6;
        const cellH = canvas.height / 6;

        // Layer 1: Yard Grid (Only draw max z occupied to represent stack)
        for(let x=1; x<=5; x++){
            for(let y=1; y<=5; y++){
                const stack = db.yard_grid.filter(g => g.x_coord==x && g.y_coord==y);
                const occupiedCount = stack.filter(g => g.status==='Occupied').length;
                
                ctx.strokeStyle = 'rgba(255,255,255,0.1)';
                ctx.strokeRect(x*cellW, y*cellH, cellW*0.8, cellH*0.8);
                
                if(occupiedCount > 0) {
                    ctx.fillStyle = gba(59, 130, 246, );
                    ctx.fillRect(x*cellW, y*cellH, cellW*0.8, cellH*0.8);
                    ctx.fillStyle = '#fff';
                    ctx.font = '12px Inter';
                    ctx.fillText(Stack: /3, x*cellW + 10, y*cellH + 20);
                }
            }
        }

        // Layer 2: Vehicles
        db.vehicles.forEach(v => {
            ctx.beginPath();
            ctx.arc(v.current_x*cellW + cellW*0.4, v.current_y*cellH + cellH*0.4, 15, 0, Math.PI*2);
            ctx.fillStyle = v.status === 'Idle' ? '#10b981' : '#f59e0b';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.fillText(v.id, v.current_x*cellW + cellW*0.4 - 15, v.current_y*cellH + cellH*0.4 - 20);
        });
    }

    // Resize observer for canvas
    window.addEventListener('resize', drawMap);

    document.addEventListener('DOMContentLoaded', () => {
        loadDataFromSupabase();
        setupRealtime();
    });
'''

if match_js:
    html = html[:match_js.start()] + new_js + html[match_js.end():]
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(html)
    print("New architecture injected successfully.")
else:
    print("Could not find old JS.")
