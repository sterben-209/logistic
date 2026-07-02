import re

with open(r'D:\test everything\logistic\stitch_ai_yard_pathfinding_system\index.html', 'r', encoding='utf-8') as f:
    old_html = f.read()

# Extract tailwind config
tailwind_config_match = re.search(r'<script id="tailwind-config">.*?</script>', old_html, re.DOTALL)
tailwind_config = tailwind_config_match.group(0) if tailwind_config_match else ''

with open(r'D:\test everything\logistic\port_zoning_map\index.html', 'r', encoding='utf-8') as f:
    new_html = f.read()

if 'cdn.tailwindcss.com' not in new_html:
    injection = '<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>\n    ' + tailwind_config
    new_html = new_html.replace('</head>', injection + '\n  </head>')
    with open(r'D:\test everything\logistic\port_zoning_map\index.html', 'w', encoding='utf-8') as f:
        f.write(new_html)

# Extract views
operations = re.search(r'<div id="view-operations".*?(?=<div id="view-inventory")', old_html, re.DOTALL)
inventory = re.search(r'<div id="view-inventory".*?(?=<div id="view-analytics")', old_html, re.DOTALL)
analytics = re.search(r'<div id="view-analytics".*?(?=<div id="view-logistics")', old_html, re.DOTALL)
logistics = re.search(r'<div id="view-logistics".*?(?=<div id="view-login"|</main>)', old_html, re.DOTALL)

def escape_js(text):
    return text.replace('`', '\\`').replace('$', '\\$')

# Write to a JS file
js_content = f"""
export const operationsHtml = `{escape_js(operations.group(0))}`;
export const inventoryHtml = `{escape_js(inventory.group(0))}`;
export const analyticsHtml = `{escape_js(analytics.group(0))}`;
export const logisticsHtml = `{escape_js(logistics.group(0))}`;
"""
with open(r'D:\test everything\logistic\port_zoning_map\src\oldViews.js', 'w', encoding='utf-8') as f:
    f.write(js_content)
print('Done extracting views')
