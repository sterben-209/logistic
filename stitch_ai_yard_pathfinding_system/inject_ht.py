import re

filepath = r'D:\test everything\logistic\stitch_ai_yard_pathfinding_system\index.html'
with open(filepath, 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Add Handsontable CDN
if 'handsontable' not in html:
    html = html.replace('</head>', '''    <script src="https://cdn.jsdelivr.net/npm/handsontable/dist/handsontable.full.min.js"></script>
    <link href="https://cdn.jsdelivr.net/npm/handsontable/dist/handsontable.full.min.css" rel="stylesheet">
    <style>
        .ht_master .wtHolder { background-color: #0b1326; }
        .handsontable td, .handsontable th { background-color: #1e293b; color: #dae2fd; border-color: rgba(255,255,255,0.1); }
        .handsontable th { font-weight: bold; background-color: #222a3d; }
        .handsontable .htDimmed { color: #888; }
        .handsontable .empty-slot { color: #10b981; }
        .handsontable .occupied-slot { color: #ef4444; }
    </style>
</head>''')

# 2. Replace the HTML table with a container div
table_pattern = r'<table class="w-full text-left border-collapse">.*?</table>'
html = re.sub(table_pattern, '<div id="yard-grid" class="w-full h-[500px] overflow-hidden rounded border border-outline-variant/30"></div>', html, flags=re.DOTALL)

# 3. Replace the old JS logic for CRUD
js_start = '// Table Edit Logic for Operations View'
js_end = '</script>\n</body>'
match = re.search(f'{js_start}.*?(?={js_end})', html, re.DOTALL)

new_js = '''// Slot-based Yard Management with Handsontable
    const MAX_X = 5;
    const MAX_Y = 5;
    const MAX_Z = 3;
    let yardData = [];

    function initializeYard(maxX, maxY, maxZ) {
        const data = [];
        let index = 1;
        for (let x = 1; x <= maxX; x++) {
            for (let y = 1; y <= maxY; y++) {
                for (let z = 1; z <= maxZ; z++) {
                    data.push({
                        id: index++,
                        x: x,
                        y: y,
                        z: z,
                        status: 'Empty',
                        containerId: null,
                        type: null,
                        weight: 0
                    });
                }
            }
        }
        return data;
    }

    document.addEventListener('DOMContentLoaded', () => {
        const container = document.getElementById('yard-grid');
        if(!container) return;

        yardData = initializeYard(MAX_X, MAX_Y, MAX_Z);

        // Pre-fill some data to simulate existing yard
        yardData[0].status = 'Occupied'; yardData[0].containerId = 'NX-001'; yardData[0].type = "20' Dry"; yardData[0].weight = 14.5;
        yardData[1].status = 'Occupied'; yardData[1].containerId = 'NX-002'; yardData[1].type = "40' HC"; yardData[1].weight = 28.0;

        const hot = new Handsontable(container, {
            data: yardData,
            rowHeaders: false,
            colHeaders: ['#', 'X-Coord', 'Y-Coord', 'Z-Coord (Tier)', 'Status', 'Container ID', 'Type', 'Weight (tons)'],
            columns: [
                { data: 'id', readOnly: true },
                { data: 'x', readOnly: true },
                { data: 'y', readOnly: true },
                { data: 'z', readOnly: true },
                { data: 'status', readOnly: true, renderer: function(instance, td, row, col, prop, value, cellProperties) {
                    Handsontable.renderers.TextRenderer.apply(this, arguments);
                    if(value === 'Empty') td.className = 'empty-slot font-bold';
                    else if(value === 'Occupied') td.className = 'occupied-slot font-bold';
                }},
                { data: 'containerId' },
                { data: 'type', type: 'dropdown', source: ["20' Dry", "40' Dry", "40' HC", "20' Reefer", "40' Reefer", "Tank"] },
                { data: 'weight', type: 'numeric', numericFormat: { pattern: '0.0' } }
            ],
            licenseKey: 'non-commercial-and-evaluation',
            width: '100%',
            height: '100%',
            stretchH: 'all',
            className: 'htDark',
            beforeChange: function(changes, source) {
                if (source === 'loadData') return;
                let isValid = true;
                
                for (let i = 0; i < changes.length; i++) {
                    const [row, prop, oldValue, newValue] = changes[i];
                    if (prop !== 'containerId') continue;
                    
                    const cellData = this.getSourceDataAtRow(row);
                    const x = cellData.x;
                    const y = cellData.y;
                    const z = cellData.z;

                    if (newValue && !oldValue) {
                        // Adding a container (Inbound)
                        if (z > 1) {
                            // Check if z-1 is occupied
                            const bottomCell = yardData.find(d => d.x === x && d.y === y && d.z === z - 1);
                            if (bottomCell && bottomCell.status === 'Empty') {
                                alert(LỖI VẬT LÝ: Không thể đặt Container tại Z= vì Z= bên dưới đang trống!);
                                changes[i] = null;
                                isValid = false;
                            }
                        }
                        if(isValid && changes[i]) {
                            // Valid add
                            this.setDataAtRowProp(row, 'status', 'Occupied', 'logic');
                        }
                    } else if (!newValue && oldValue) {
                        // Removing a container (Outbound)
                        if (z < MAX_Z) {
                            // Check if z+1 is occupied
                            const topCell = yardData.find(d => d.x === x && d.y === y && d.z === z + 1);
                            if (topCell && topCell.status === 'Occupied') {
                                alert(LỖI VẬT LÝ: Không thể rút Container tại Z= vì Z= bên trên đang bị đè! Cần đảo hàng (Shuffling).);
                                changes[i] = null;
                                isValid = false;
                            }
                        }
                        if(isValid && changes[i]) {
                            // Valid remove
                            this.setDataAtRowProp(row, 'status', 'Empty', 'logic');
                            this.setDataAtRowProp(row, 'type', null, 'logic');
                            this.setDataAtRowProp(row, 'weight', 0, 'logic');
                        }
                    }
                }
            }
        });

        // Hide the "Add Row" button since it's slot-based now
        const addBtn = document.getElementById('add-row-btn');
        if(addBtn) addBtn.style.display = 'none';
    });
'''
if match:
    html = html[:match.start()] + new_js + html[match.end():]
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(html)
    print("Handsontable logic injected.")
else:
    print("Could not find old JS block to replace.")
