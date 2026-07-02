import re

filepath = r'D:\test everything\logistic\stitch_ai_yard_pathfinding_system\index.html'
with open(filepath, 'r', encoding='utf-8') as f:
    html = f.read()

# Standardize Headers
html = html.replace('class="font-display-lg text-display-lg text-inverse-surface mb-2"', 'class="text-3xl font-bold text-on-surface mb-1"')
html = html.replace('class="font-body-md text-body-md text-outline"', 'class="text-sm text-on-surface-variant"')

html = html.replace('class="font-headline-lg text-headline-lg text-on-surface mb-1"', 'class="text-3xl font-bold text-on-surface mb-1"')
html = html.replace('class="font-label-sm text-label-sm text-on-surface-variant"', 'class="text-sm text-on-surface-variant"')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(html)
