import re
import os

def html_to_jsx(html):
    html = re.sub(r'class=', 'className=', html)
    html = re.sub(r'for=', 'htmlFor=', html)
    html = re.sub(r'<!--(.*?)-->', r'{/*\1*/}', html)
    
    # Handle style attribute
    def style_replacer(m):
        style_str = m.group(1)
        rules = [x for x in style_str.split(';') if x.strip()]
        out = []
        for r in rules:
            if ':' in r:
                k, v = r.split(':', 1)
                # camelCase keys
                k = k.strip()
                k = re.sub(r'-([a-z])', lambda x: x.group(1).upper(), k)
                out.append(f'"{k}": "{v.strip()}"')
        return 'style={{' + ', '.join(out) + '}}'
    
    html = re.sub(r'style="(.*?)"', style_replacer, html)
    
    # self-closing tags
    html = re.sub(r'<(img|input|hr|br)([^>]*?)(?<!/)>', r'<\1\2 />', html)
    return html

os.makedirs('D:/test everything/logistic/port_zoning_map/src/pages', exist_ok=True)

with open('D:/test everything/logistic/stitch_ai_yard_pathfinding_system/nexus_terminal_operations_command/code.html', 'r', encoding='utf-8') as f:
    content = f.read()

main_match = re.search(r'<main[^>]*>(.*?)</main>', content, re.DOTALL)
if main_match:
    main_content = main_match.group(1)
    jsx_content = html_to_jsx(main_content)
    with open('D:/test everything/logistic/port_zoning_map/src/pages/Operations.jsx', 'w', encoding='utf-8') as out:
        out.write('import React from "react";\n\nconst Operations = () => {\n  return (\n    <div className="p-margin-desktop h-[calc(100vh-4rem)] flex flex-col gap-panel-gap bg-grid-pattern relative">\n')
        out.write(jsx_content)
        out.write('\n    </div>\n  );\n};\n\nexport default Operations;\n')
        print('Created Operations.jsx')

with open('D:/test everything/logistic/stitch_ai_yard_pathfinding_system/nexus_terminal_inventory_1/code.html', 'r', encoding='utf-8') as f:
    content = f.read()

main_match = re.search(r'<main[^>]*>(.*?)</main>', content, re.DOTALL)
if main_match:
    main_content = main_match.group(1)
    jsx_content = html_to_jsx(main_content)
    with open('D:/test everything/logistic/port_zoning_map/src/pages/Inventory.jsx', 'w', encoding='utf-8') as out:
        out.write('import React from "react";\n\nconst Inventory = () => {\n  return (\n    <div className="p-margin-desktop min-h-[calc(100vh-4rem)]">\n')
        out.write(jsx_content)
        out.write('\n    </div>\n  );\n};\n\nexport default Inventory;\n')
        print('Created Inventory.jsx')
