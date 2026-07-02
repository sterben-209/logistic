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

spa_script = """
<style>
    .hover-hide-sidebar {
        transform: translateX(calc(-100% + 15px)) !important;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    }
    .hover-hide-sidebar::after {
        content: '';
        position: absolute;
        top: 0;
        right: -50px;
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
                // Ensure topnav has full width since sidebar is hidden
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
        let activeTab = 'containers';

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
                
                const occupiedSlots = currentSlots.filter(s => s.status && s.status !== 'empty');
                if (occupiedSlots.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="8" class="text-center p-4 text-outline-variant">No active containers</td></tr>';
                    return;
                }

                tbody.innerHTML = occupiedSlots.map((slot, index) => {
                    const is20 = slot.status === 'occupied_20';
                    const typeStr = is20 ? "20' Dry" : "40' HC";
                    const weight = is20 ? (Math.random() * 15 + 10).toFixed(1) : (Math.random() * 20 + 15).toFixed(1);
                    const parts = slot.id.split('-');
                    const zoneName = parts.length >= 3 ? parts.slice(0, -2).join('-') : 'UNK';
                    const bay = parts.length >= 3 ? parts[parts.length - 2] : '00';

                    const statuses = [
                        { text: 'ACTIVE', bg: 'bg-secondary/10', textCls: 'text-secondary', border: 'border-secondary/20' },
                        { text: 'TRANSIT', bg: 'bg-primary/10', textCls: 'text-primary', border: 'border-primary/30' },
                        { text: 'HOLD', bg: 'bg-tertiary-container/20', textCls: 'text-tertiary', border: 'border-tertiary/30' },
                        { text: 'STAGED', bg: 'bg-surface-bright', textCls: 'text-on-surface-variant', border: 'border-outline-variant/30' }
                    ];
                    const s = statuses[index % statuses.length];

                    return `
                    <tr class="data-grid-row">
                        <td class="data-grid-cell text-center text-outline-variant">${index + 1}</td>
                        <td class="data-grid-cell font-bold text-on-surface">CONT-${slot.id.substring(slot.id.length - 4)}</td>
                        <td class="data-grid-cell text-on-surface-variant">${typeStr}</td>
                        <td class="data-grid-cell">${weight}</td>
                        <td class="data-grid-cell text-outline-variant">${zoneName.substring(0, 8)}</td>
                        <td class="data-grid-cell text-outline-variant">B-${bay}</td>
                        <td class="data-grid-cell">
                            <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-label-sm ${s.bg} ${s.textCls} border ${s.border}">${s.text}</span>
                        </td>
                        <td class="data-grid-cell text-right">
                            <button class="text-outline hover:text-primary transition-colors"><span class="material-symbols-outlined text-[18px]">edit</span></button>
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
                
                if (currentSlots.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="7" class="text-center p-4 text-outline-variant">No slots found</td></tr>';
                    return;
                }

                tbody.innerHTML = currentSlots.map((slot, index) => {
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

        document.getElementById('tab-btn-containers')?.addEventListener('click', (e) => {
            activeTab = 'containers';
            e.target.className = "px-4 py-1.5 text-sm font-medium rounded-md bg-primary/20 text-primary transition-colors";
            document.getElementById('tab-btn-slots').className = "px-4 py-1.5 text-sm font-medium rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors";
            renderTable();
        });

        document.getElementById('tab-btn-slots')?.addEventListener('click', (e) => {
            activeTab = 'slots';
            e.target.className = "px-4 py-1.5 text-sm font-medium rounded-md bg-primary/20 text-primary transition-colors";
            document.getElementById('tab-btn-containers').className = "px-4 py-1.5 text-sm font-medium rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors";
            renderTable();
        });

        window.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'SYNC_PORT_DATA') {
                const { slots } = event.data.payload;
                if (slots) {
                    currentSlots = slots;
                    renderTable();
                }
            } else if (event.data && event.data.type === 'SYNC_FLEET_DATA') {
                const { fleet } = event.data.payload;
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
</script>
</body>
"""
template_html = template_html.replace('</body>', spa_script)

with open(os.path.join(base_dir, 'index.html'), 'w', encoding='utf-8') as f:
    f.write(template_html)
    
print("SPA built successfully as index.html")
