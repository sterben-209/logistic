import os
import re

base_dir = r'D:\test everything\logistic\stitch_ai_yard_pathfinding_system'

files = {
    'login': 'nexus_terminal_admin_login/code.html',
    'operations': 'nexus_terminal_operations_command/code.html',
    'inventory': 'nexus_terminal_inventory_1/code.html',
    'analytics': 'nexus_terminal_analytics/code.html',
    'logistics': 'nexus_terminal_logistics/code.html',
    'digitizer': 'nexus_terminal_map_digitizer/code.html'
}

def extract_main_content(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()
    
    match = re.search(r'<main[^>]*>(.*?)</main>', html, re.DOTALL | re.IGNORECASE)
    if not match:
        return ""
    
    content = match.group(1)
    content = re.sub(r'<footer.*?</footer>', '', content, flags=re.DOTALL | re.IGNORECASE)
    return content

with open(os.path.join(base_dir, files['analytics']), 'r', encoding='utf-8') as f:
    template_html = f.read()

template_html = re.sub(r'<main[^>]*>.*?</main>', '<main id="app-container" class="w-full h-screen flex flex-col bg-surface-lowest relative overflow-hidden"></main>', template_html, flags=re.DOTALL | re.IGNORECASE)

views_html = ""
for key, rel_path in files.items():
    filepath = os.path.join(base_dir, rel_path)
    main_content = extract_main_content(filepath)
    views_html += f'<div id="view-{key}" class="spa-view hidden w-full h-full flex flex-col">{main_content}</div>\n'

template_html = template_html.replace('</main>', f'{views_html}</main>')

template_html = re.sub(r'href="\.\./nexus_terminal_operations_command/code\.html"', 'href="#" onclick="switchView(\'operations\'); return false;"', template_html)
template_html = re.sub(r'href="\.\./nexus_terminal_inventory_1/code\.html"', 'href="#" onclick="switchView(\'inventory\'); return false;"', template_html)
template_html = re.sub(r'href="\.\./nexus_terminal_analytics/code\.html"', 'href="#" onclick="switchView(\'analytics\'); return false;"', template_html)
template_html = re.sub(r'href="\.\./nexus_terminal_logistics/code\.html"', 'href="#" onclick="switchView(\'logistics\'); return false;"', template_html)
template_html = re.sub(r'href="\.\./nexus_terminal_map_digitizer/code\.html"', 'href="#" onclick="switchView(\'digitizer\'); return false;"', template_html)
template_html = re.sub(r'href="\.\./nexus_terminal_admin_login/code\.html"', 'href="#" onclick="switchView(\'login\'); return false;"', template_html)
auth_html = '''
<div id="auth-container" class="flex items-center gap-4">
    <button id="supabase-login-btn" class="bg-primary/20 text-primary border border-primary/50 px-4 py-1.5 rounded-lg font-semibold text-sm hover:bg-primary hover:text-on-primary transition-colors flex items-center gap-2">
        <span class="material-symbols-outlined text-[18px]">login</span>
        Connect / Login
    </button>
    <div id="user-profile" class="hidden items-center gap-3">
        <span id="user-email" class="text-sm font-medium text-on-surface"></span>
        <div class="w-8 h-8 rounded-full bg-surface-container-highest overflow-hidden border border-outline-variant/30">
            <img id="user-avatar" alt="User profile" class="w-full h-full object-cover" src=""/>
        </div>
        <button id="supabase-logout-btn" class="text-outline-variant hover:text-error transition-colors" title="Sign out from Google">
            <span class="material-symbols-outlined text-[20px]">logout</span>
        </button>
    </div>
</div>
'''

template_html = re.sub(
    r'<div class="w-8 h-8 rounded-full bg-surface-container-highest overflow-hidden border border-outline-variant/30">.*?</div>(\s*</div>\s*</header>)',
    auth_html + r'\1',
    template_html,
    flags=re.DOTALL
)

spa_script = """
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<style>
    .hover-hide-sidebar {
        transform: translateX(calc(-100% + 5px)) !important;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    }
    .hover-hide-sidebar::after {
        content: '';
        position: absolute;
        top: 0;
        right: -55px;
        width: 50px;
        height: 100%;
    }
    .hover-hide-sidebar:hover {
        transform: translateX(0) !important;
    }

    .hover-hide-topnav {
        transform: translateY(calc(-100% + 15px)) !important;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    }
    .hover-hide-topnav::after {
        content: '';
        position: absolute;
        bottom: -50px;
        left: 0;
        width: 100%;
        height: 50px;
    }
    .hover-hide-topnav:hover {
        transform: translateY(0) !important;
    }
</style>
<script>
    function switchView(viewId) {
        document.querySelectorAll('.spa-view').forEach(el => el.classList.add('hidden'));
        const target = document.getElementById('view-' + viewId);
        if(target) target.classList.remove('hidden');
        
        const sidebar = document.querySelector('aside');
        const topnav = document.querySelector('header.fixed');
        
        if (viewId === 'login') {
            if(sidebar) sidebar.style.display = 'none';
            if(topnav) topnav.style.display = 'none';
        } else {
            if(sidebar) {
                sidebar.style.display = '';
                sidebar.classList.remove('hidden');
                sidebar.classList.add('hover-hide-sidebar');
            }
            if(topnav) {
                topnav.style.display = '';
                topnav.classList.remove('hidden');
                topnav.classList.add('hover-hide-topnav');
                topnav.classList.remove('w-[calc(100%-16rem)]');
                topnav.classList.add('w-full');
            }
            
            document.querySelectorAll('aside nav a').forEach(a => {
                a.classList.remove('bg-primary/10', 'text-primary', 'border-r-2', 'border-primary', 'rounded-l-lg');
                a.classList.add('text-on-surface-variant', 'rounded-lg');
                
                if (a.getAttribute('onclick') && a.getAttribute('onclick').includes(viewId)) {
                    a.classList.add('bg-primary/10', 'text-primary', 'border-r-2', 'border-primary', 'rounded-l-lg');
                    a.classList.remove('text-on-surface-variant', 'rounded-lg');
                }
            });
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        switchView('digitizer');
        
        const loginForm = document.querySelector('#view-login form');
        if(loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const idInput = loginForm.querySelector('input[type="text"]');
                const pwInput = loginForm.querySelector('input[type="password"]');
                const errSpan = document.getElementById('admin-error');
                
                if (idInput && idInput.value.toLowerCase() === 'admin' && pwInput && pwInput.value === '123456') {
                    switchView('analytics');
                } else {
                    if(errSpan) {
                        errSpan.textContent = 'Invalid credentials';
                        errSpan.style.opacity = 1;
                    }
                }
            });
        }
        let currentSlots = [];
        let currentFleet = [];
        let activeTab = 'containers';
        let opsSearchQuery = '';
        let opsFilterValue = 'all';
        let opsSortValue = 'default';

        function exportFleetJSON() {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentFleet));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "fleet_data.json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        }
        window.exportFleetJSON = exportFleetJSON;

        function importFleetJSON(event) {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const importedFleet = JSON.parse(e.target.result);
                    if (Array.isArray(importedFleet)) {
                        currentFleet = importedFleet;
                        dispatchFleetToMap();
                        if (activeTab === 'fleet') renderTable();
                    }
                } catch (err) {
                    alert('Invalid JSON file');
                }
            };
            reader.readAsText(file);
        }
        window.importFleetJSON = importFleetJSON;

        function dispatchFleetToMap() {
            const iframe = document.querySelector('iframe');
            if (iframe && iframe.contentWindow) {
                iframe.contentWindow.postMessage({ type: 'MASTER_SYNC_FLEET', payload: { fleet: currentFleet } }, '*');
            }
        }
        window.dispatchFleetToMap = dispatchFleetToMap;

        const renderTable = () => {
            const tbody = document.getElementById('operations-table-body');
            const thead = document.querySelector('#view-operations thead tr');
            const title = document.getElementById('operations-title');
            if (!tbody || !thead) return;

            if (activeTab === 'containers') {
                title.textContent = 'Container Matrix';
                thead.innerHTML = `
                    <th class="data-grid-header w-12 text-center">#</th>
                    <th class="data-grid-header">Container ID</th>
                    <th class="data-grid-header">Type</th>
                    <th class="data-grid-header">Weight (tons)</th>
                    <th class="data-grid-header">X-Coord</th>
                    <th class="data-grid-header">Y-Coord</th>
                    <th class="data-grid-header">Status</th>
                    <th class="data-grid-header text-right">Actions</th>
                `;
                
                let filteredInventory = [...currentInventory];
                
                // Apply search filter
                if (opsSearchQuery) {
                    const q = opsSearchQuery.toLowerCase();
                    filteredInventory = filteredInventory.filter(c => {
                        const cid = c.containerNo.toLowerCase();
                        const zoneName = c.zoneId.toLowerCase();
                        return cid.includes(q) || zoneName.includes(q);
                    });
                }

                // Apply status filter 
                if (opsFilterValue !== 'all' && opsFilterValue !== 'empty') {
                    const filterSize = opsFilterValue === 'occupied_20' ? 20 : 40;
                    filteredInventory = filteredInventory.filter(c => c.size === filterSize);
                }

                // Apply sorting
                if (opsSortValue === 'id_asc') {
                    filteredInventory.sort((a, b) => a.containerNo.localeCompare(b.containerNo));
                } else if (opsSortValue === 'id_desc') {
                    filteredInventory.sort((a, b) => b.containerNo.localeCompare(a.containerNo));
                } else if (opsSortValue === 'zone_asc') {
                    filteredInventory.sort((a, b) => a.zoneId.localeCompare(b.zoneId));
                }

                if (filteredInventory.length === 0) {
                    // Auto-generate some mock containers based on currentSlots if inventory is empty
                    if (currentSlots && currentSlots.length > 0) {
                        const maxMock = Math.min(10, currentSlots.length);
                        for(let i=0; i<maxMock; i++) {
                            const slot = currentSlots[i];
                            filteredInventory.push({
                                containerNo: `MOCK-${Math.floor(1000 + Math.random()*9000)}`,
                                size: Math.random() > 0.5 ? 40 : 20,
                                bay: slot.bay || '01',
                                row: slot.row || '01',
                                tier: 1,
                                zoneId: slot.zoneId || 'Zone-A'
                            });
                        }
                    } else {
                        tbody.innerHTML = '<tr><td colspan="8" class="text-center p-4 text-outline-variant">No active containers found. Please draw map and add containers.</td></tr>';
                        return;
                    }
                }

                tbody.innerHTML = filteredInventory.map((c, index) => {
                    const typeStr = c.size === 20 ? "20' Dry" : "40' HC";
                    const weight = c.size === 20 ? (Math.random() * 15 + 10).toFixed(1) : (Math.random() * 20 + 15).toFixed(1);
                    const bay = c.bay || '00';
                    const tierStr = `T${c.tier || 1}`;

                    const statuses = [
                        { text: 'ACTIVE', bg: 'bg-secondary/10', textCls: 'text-secondary', border: 'border-secondary/20' },
                        { text: 'TRANSIT', bg: 'bg-primary/10', textCls: 'text-primary', border: 'border-primary/30' },
                        { text: 'HOLD', bg: 'bg-tertiary-container/20', textCls: 'text-tertiary', border: 'border-tertiary/30' }
                    ];
                    const s = statuses[index % statuses.length];

                    return `
                    <tr class="data-grid-row">
                        <td class="data-grid-cell text-center text-outline-variant">${index + 1}</td>
                        <td class="data-grid-cell font-bold text-on-surface">
                            ${c.containerNo}
                            <span class="ml-2 text-[10px] text-outline">(${tierStr})</span>
                        </td>
                        <td class="data-grid-cell text-on-surface-variant">${typeStr}</td>
                        <td class="data-grid-cell">${weight}</td>
                        <td class="data-grid-cell text-outline-variant">${c.zoneId.substring(0, 8)}</td>
                        <td class="data-grid-cell text-outline-variant">B-${bay} / R-${c.row}</td>
                        <td class="data-grid-cell">
                            <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-label-sm ${s.bg} ${s.textCls} border ${s.border}">${s.text}</span>
                        </td>
                        <td class="data-grid-cell text-right">
                            <button class="text-outline hover:text-primary transition-colors"><span class="material-symbols-outlined text-[18px]">edit</span></button>
                        </td>
                    </tr>
                    `;
                }).join('');
            } else if (activeTab === 'fleet') {
                title.innerHTML = `
                    <div class="flex justify-between items-center w-full pr-4">
                        <span>Fleet & Dispatch Management</span>
                        <div class="flex gap-2">
                            <button onclick="exportFleetJSON()" class="px-3 py-1 bg-surface-container hover:bg-surface-container-highest text-on-surface text-sm rounded-md border border-outline-variant/30 transition-colors flex items-center gap-1">
                                <span class="material-symbols-outlined text-[16px]">download</span> Export JSON
                            </button>
                            <button onclick="document.getElementById('import-fleet-input').click()" class="px-3 py-1 bg-primary/20 hover:bg-primary/30 text-primary text-sm rounded-md border border-primary/30 transition-colors flex items-center gap-1">
                                <span class="material-symbols-outlined text-[16px]">upload</span> Import JSON
                            </button>
                            <input type="file" id="import-fleet-input" accept=".json" class="hidden" onchange="importFleetJSON(event)" />
                        </div>
                    </div>
                `;
                thead.innerHTML = `
                    <th class="data-grid-header w-12 text-center">#</th>
                    <th class="data-grid-header">Vehicle ID</th>
                    <th class="data-grid-header">Type</th>
                    <th class="data-grid-header">Origin</th>
                    <th class="data-grid-header">Destination</th>
                    <th class="data-grid-header">Progress</th>
                    <th class="data-grid-header">Status</th>
                    <th class="data-grid-header text-right">Actions</th>
                `;

                let filteredFleet = [...currentFleet];

                if (opsSearchQuery) {
                    const q = opsSearchQuery.toLowerCase();
                    filteredFleet = filteredFleet.filter(v => 
                        v.id.toLowerCase().includes(q) || 
                        v.origin.toLowerCase().includes(q) || 
                        v.destination.toLowerCase().includes(q)
                    );
                }

                if (filteredFleet.length === 0) {
                    // Auto-generate mock fleet vehicles
                    const mockFleetCount = 6;
                    for (let i = 0; i < mockFleetCount; i++) {
                        const isTruck = Math.random() > 0.5;
                        currentFleet.push({
                            id: (isTruck ? 'TRK-' : 'AGV-') + Math.floor(1000 + Math.random() * 9000),
                            type: isTruck ? 'truck' : 'agv',
                            origin: 'Gate-' + Math.floor(1 + Math.random() * 5),
                            destination: 'Zone-' + String.fromCharCode(65 + Math.floor(Math.random() * 6)),
                            progress: 0,
                            status: 'moving'
                        });
                    }
                    filteredFleet = [...currentFleet];
                    if (typeof window.dispatchFleetToMap === 'function') {
                        window.dispatchFleetToMap();
                    }
                }

                tbody.innerHTML = filteredFleet.map((v, index) => {
                    const isTruck = v.type === 'truck';
                    const colorClass = isTruck ? 'primary' : 'secondary';
                    const sBg = isTruck ? 'bg-primary/10' : 'bg-secondary/10';
                    const sText = isTruck ? 'text-primary' : 'text-secondary';
                    const sBorder = isTruck ? 'border-primary/30' : 'border-secondary/30';

                    return `
                    <tr class="data-grid-row">
                        <td class="data-grid-cell text-center text-outline-variant">${index + 1}</td>
                        <td class="data-grid-cell font-bold text-on-surface">${v.id}</td>
                        <td class="data-grid-cell text-outline-variant">${isTruck ? 'External Truck' : 'Internal AGV'}</td>
                        <td class="data-grid-cell text-on-surface-variant">${v.origin}</td>
                        <td class="data-grid-cell text-on-surface-variant">${v.destination}</td>
                        <td class="data-grid-cell">
                            <div class="flex items-center gap-2">
                                <div class="flex-1 bg-surface-container h-1.5 rounded-full overflow-hidden">
                                    <div class="bg-${colorClass} h-full" style="width: ${v.progress}%"></div>
                                </div>
                                <span class="text-[10px] text-outline-variant w-8">${Math.round(v.progress)}%</span>
                            </div>
                        </td>
                        <td class="data-grid-cell">
                            <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-label-sm ${sBg} ${sText} border ${sBorder}">${v.status.toUpperCase()}</span>
                        </td>
                        <td class="data-grid-cell text-right">
                            <button class="text-outline hover:text-primary transition-colors"><span class="material-symbols-outlined text-[18px]">visibility</span></button>
                        </td>
                    </tr>
                    `;
                }).join('');
            } else {
                title.textContent = 'Yard & Slot Management';
                thead.innerHTML = `
                    <th class="data-grid-header w-12 text-center">#</th>
                    <th class="data-grid-header">Slot ID</th>
                    <th class="data-grid-header">Zone</th>
                    <th class="data-grid-header">Bay</th>
                    <th class="data-grid-header">Row</th>
                    <th class="data-grid-header">Status</th>
                    <th class="data-grid-header text-right">Actions</th>
                `;
                
                let filteredSlots = [...currentSlots];
                
                // Apply search
                if (opsSearchQuery) {
                    const q = opsSearchQuery.toLowerCase();
                    filteredSlots = filteredSlots.filter(s => {
                        const parts = s.id.split('-');
                        const zoneName = (parts.length >= 3 ? parts.slice(0, -2).join('-') : 'UNK').toLowerCase();
                        return s.id.toLowerCase().includes(q) || zoneName.includes(q);
                    });
                }

                // Apply filter
                if (opsFilterValue !== 'all') {
                    filteredSlots = filteredSlots.filter(s => {
                        if (opsFilterValue === 'empty') return !s.status || s.status === 'empty';
                        return s.status === opsFilterValue;
                    });
                }

                // Apply sorting
                if (opsSortValue === 'id_asc') {
                    filteredSlots.sort((a, b) => a.id.localeCompare(b.id));
                } else if (opsSortValue === 'id_desc') {
                    filteredSlots.sort((a, b) => b.id.localeCompare(a.id));
                } else if (opsSortValue === 'zone_asc') {
                    filteredSlots.sort((a, b) => {
                        const za = a.id.split('-').slice(0, -2).join('-');
                        const zb = b.id.split('-').slice(0, -2).join('-');
                        return za.localeCompare(zb);
                    });
                }
                
                if (filteredSlots.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="7" class="text-center p-4 text-outline-variant">No slots found matching criteria</td></tr>';
                    return;
                }

                tbody.innerHTML = filteredSlots.map((slot, index) => {
                    const parts = slot.id.split('-');
                    const row = parts.length >= 3 ? parts[parts.length - 1] : '00';
                    const bay = parts.length >= 3 ? parts[parts.length - 2] : '00';
                    const zoneName = parts.length >= 3 ? parts.slice(0, -2).join('-') : 'UNK';

                    let s = { text: 'EMPTY', bg: 'bg-surface-bright', textCls: 'text-outline-variant', border: 'border-outline-variant/30' };
                    if (slot.status === 'occupied_20') {
                        s = { text: 'OCCUPIED (20ft)', bg: 'bg-secondary/10', textCls: 'text-secondary', border: 'border-secondary/20' };
                    } else if (slot.status === 'occupied_40') {
                        s = { text: 'OCCUPIED (40ft)', bg: 'bg-error/10', textCls: 'text-error', border: 'border-error/20' };
                    }

                    return `
                    <tr class="data-grid-row">
                        <td class="data-grid-cell text-center text-outline-variant">${index + 1}</td>
                        <td class="data-grid-cell font-bold text-on-surface">${slot.id}</td>
                        <td class="data-grid-cell text-outline-variant">${zoneName}</td>
                        <td class="data-grid-cell text-primary">B-${bay}</td>
                        <td class="data-grid-cell text-tertiary">R-${row}</td>
                        <td class="data-grid-cell">
                            <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-label-sm ${s.bg} ${s.textCls} border ${s.border}">${s.text}</span>
                        </td>
                        <td class="data-grid-cell text-right">
                            <button class="text-outline hover:text-primary transition-colors"><span class="material-symbols-outlined text-[18px]">settings</span></button>
                        </td>
                    </tr>
                    `;
                }).join('');
            }
        };

        const updateTabStyles = () => {
            const btns = ['containers', 'slots', 'fleet'];
            btns.forEach(id => {
                const btn = document.getElementById(`tab-btn-${id}`);
                if (!btn) return;
                if (activeTab === id) {
                    btn.className = "px-4 py-1.5 text-sm font-medium rounded-md bg-primary/20 text-primary transition-colors";
                } else {
                    btn.className = "px-4 py-1.5 text-sm font-medium rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors";
                }
            });
        };

        document.getElementById('tab-btn-containers')?.addEventListener('click', () => {
            activeTab = 'containers';
            updateTabStyles();
            renderTable();
        });

        document.getElementById('tab-btn-slots')?.addEventListener('click', () => {
            activeTab = 'slots';
            updateTabStyles();
            renderTable();
        });

        document.getElementById('tab-btn-fleet')?.addEventListener('click', () => {
            activeTab = 'fleet';
            updateTabStyles();
            renderTable();
        });

        // Event listeners for Toolbar
        document.getElementById('ops-search')?.addEventListener('input', (e) => {
            opsSearchQuery = e.target.value;
            renderTable();
        });
        document.getElementById('ops-filter')?.addEventListener('change', (e) => {
            opsFilterValue = e.target.value;
            renderTable();
        });
        document.getElementById('ops-sort')?.addEventListener('change', (e) => {
            opsSortValue = e.target.value;
            renderTable();
        });

        let currentInventory = [];

        document.getElementById('btn-sync-operations')?.addEventListener('click', () => {
            if (window.yardGrid && window.yardGrid.length > 0) {
                currentSlots = window.yardGrid.map(slot => ({
                    id: slot.name || `${slot.zoneId}-X${Math.floor(slot.x)}-Y${Math.floor(slot.y)}`,
                    zoneId: slot.zoneId,
                    bay: slot.name ? (slot.name.split('-C')[1]?.split('-R')[0] || '01') : '01',
                    row: slot.name ? (slot.name.split('-R')[1] || '01') : '01'
                }));
                currentInventory = []; 
                renderTable();
            }
        });

        document.querySelectorAll('a[onclick*="switchView(\\\'operations\\\')"]').forEach(el => {
            el.addEventListener('click', () => {
                document.getElementById('btn-sync-operations')?.click();
            });
        });

        window.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'SYNC_PORT_DATA') {
                const { slots, inventory } = event.data.payload;
                if (slots) currentSlots = slots;
                if (inventory) currentInventory = inventory;
                renderTable();
            } else if (event.data && event.data.type === 'SYNC_FLEET_DATA') {
                const { fleet } = event.data.payload;
                if (fleet && fleet.length > 0) {
                    // Update progress and status instead of overwriting
                    fleet.forEach(updatedV => {
                        const existingV = currentFleet.find(v => v.id === updatedV.id);
                        if (existingV) {
                            existingV.progress = updatedV.progress;
                            existingV.status = updatedV.status;
                        }
                    });
                    if (activeTab === 'fleet') renderTable();
                }

                const dispatchList = document.getElementById('active-dispatches-list');
                if (dispatchList && fleet) {
                    if (fleet.length === 0) {
                        dispatchList.innerHTML = '<div class="text-center p-4 text-outline-variant text-sm">No active dispatches</div>';
                        return;
                    }

                    dispatchList.innerHTML = fleet.map(v => {
                        const isTruck = v.type === 'truck';
                        const colorClass = isTruck ? 'primary' : 'secondary';
                        const colorHex = isTruck ? 'bg-primary' : 'bg-secondary';
                        
                        return `
                        <div class="p-3 bg-surface/50 border border-outline-variant/20 rounded-lg hover:border-${colorClass}/50 transition cursor-pointer">
                            <div class="flex justify-between items-center mb-2">
                                <span class="text-xs font-bold text-${colorClass}">${v.id}</span>
                                <span class="text-[10px] px-1.5 py-0.5 rounded bg-${colorClass}/10 text-${colorClass} border border-${colorClass}/20">${v.status.toUpperCase()}</span>
                            </div>
                            <div class="text-xs text-on-surface-variant flex items-center gap-1 mb-1">
                                <span class="material-symbols-outlined text-[12px]">route</span> ${v.origin} &rarr; ${v.destination}
                            </div>
                            <div class="w-full bg-surface-container h-1 rounded-full overflow-hidden mt-2">
                                <div class="${colorHex} h-full" style="width: ${v.progress}%"></div>
                            </div>
                        </div>
                        `;
                    }).join('');
                }
            }
        });
    });

    // --- Supabase Integration ---
    const SUPABASE_URL = 'https://digwvrfrvfcpcslbndrd.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZ3d2cmZydmZjcGNzbGJuZHJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3MTY4NDgsImV4cCI6MjA5ODI5Mjg0OH0.hBNkfpV8R3f0bgBli6SIEBPNYMe8Zb7vLT8iDt1Jyq4';
    
    window.supabaseClient = null;
    window.currentUser = null;
    try {
        window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch(e) {
        console.warn("Supabase load error");
    }

    const loginBtn = document.getElementById('supabase-login-btn');
    const logoutBtn = document.getElementById('supabase-logout-btn');
    const userProfile = document.getElementById('user-profile');
    const userEmail = document.getElementById('user-email');
    const userAvatar = document.getElementById('user-avatar');

    async function handleGoogleLogin() {
        if(!window.supabaseClient) return;
        await window.supabaseClient.auth.signInWithOAuth({ provider: 'google' });
    }

    async function handleLogout() {
        if(window.supabaseClient) await window.supabaseClient.auth.signOut();
    }

    async function fetchVanillaMapData(userId) {
        if (!window.supabaseClient) return;
        try {
            const { data, error } = await window.supabaseClient
                .from('portMaps')
                .select('data')
                .eq('id', userId + '_vanilla')
                .single();
            if (error) {
                if (error.code !== 'PGRST116') console.error(error);
                return;
            }
            if (data && data.data) {
                if (window.mapZones && window.mapZones.length > 0) {
                    if (!confirm("Tìm thấy bản sao lưu trên Supabase! Bạn có muốn tải về và ghi đè lên dữ liệu hiện tại trên màn hình không?")) {
                        return; // User aborted
                    }
                }
                if (data.data.metadata && data.data.metadata.pixelToMeterRatio) {
                    window.pixelToMeterRatio = data.data.metadata.pixelToMeterRatio;
                    localStorage.setItem('stitch_pixelToMeterRatio', window.pixelToMeterRatio);
                }
                if (data.data.mapZones) {
                    window.mapZones = data.data.mapZones;
                    localStorage.setItem('stitch_mapZones', JSON.stringify(window.mapZones));
                }
                if (data.data.yardGrid) {
                    window.yardGrid = data.data.yardGrid;
                    localStorage.setItem('stitch_yardGrid', JSON.stringify(window.yardGrid));
                }
                if (window.reloadDigitizerFromGlobal) {
                    window.reloadDigitizerFromGlobal();
                }
                console.log("Loaded Vanilla map data from Supabase");
            }
        } catch (e) {
            console.error(e);
        }
    }

    function updateAuthUI(user) {
        window.currentUser = user;
        if (user) {
            if(loginBtn) loginBtn.classList.add('hidden');
            if(userProfile) {
                userProfile.classList.remove('hidden');
                userProfile.classList.add('flex');
            }
            if(userEmail) userEmail.textContent = user.email || 'User';
            if(userAvatar) userAvatar.src = user.user_metadata?.avatar_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuA_FcpWwVHoEKYbbPlleo23dlpbwqD7o0TEoVxq61zR9q-VZLhjlZ95aA0FaoGJQfj8zpiIKsDPmjySqJE-s6gmyPZv9Co99s5x4mzp3gzu1vAiYJgWPrkT_lUGHsIsUol9O1u4a3-GzEe1w8LGVozfNRU_CB3MX9oW1gHUJblWjnbNiKvKAu_YJRKCtEvZ5SVqJHINuLmu0SzN-DNCMC0GcYz7WUT4AMwaKVjtj3kvfqNqgSXKcsVn72rCVynZO8qY_YId-Q82HsA';
            
            fetchVanillaMapData(user.id);
        } else {
            if(loginBtn) loginBtn.classList.remove('hidden');
            if(userProfile) {
                userProfile.classList.add('hidden');
                userProfile.classList.remove('flex');
            }
        }
    }

    if(loginBtn) loginBtn.addEventListener('click', handleGoogleLogin);
    if(logoutBtn) logoutBtn.addEventListener('click', handleLogout);

    if (window.supabaseClient) {
        window.supabaseClient.auth.getSession().then(({ data: { session } }) => {
            updateAuthUI(session?.user);
        });
        window.supabaseClient.auth.onAuthStateChange((_event, session) => {
            updateAuthUI(session?.user);
        });
    }
    // --- End Supabase Integration ---
</script>
</body>
"""
template_html = template_html.replace('</body>', spa_script)

with open(os.path.join(base_dir, 'index.html'), 'w', encoding='utf-8') as f:
    f.write(template_html)
    
print("SPA built successfully as index.html")
