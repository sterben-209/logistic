import re

filepath = r'D:\test everything\logistic\stitch_ai_yard_pathfinding_system\index.html'
with open(filepath, 'r', encoding='utf-8') as f:
    html = f.read()

# Fix operations padding
html = re.sub(
    r'<div id="view-operations" class="spa-view hidden w-full h-full flex flex-col">',
    '<div id="view-operations" class="spa-view hidden w-full h-full flex flex-col p-6 md:p-8 overflow-auto">',
    html
)

# Fix inventory padding
html = re.sub(
    r'<div id="view-inventory" class="spa-view hidden w-full h-full flex flex-col">',
    '<div id="view-inventory" class="spa-view hidden w-full h-full flex flex-col p-6 md:p-8 overflow-auto">',
    html
)

# Fix analytics padding
html = re.sub(
    r'<div id="view-analytics" class="spa-view hidden w-full h-full flex flex-col">(\s*)<div class="flex-1 overflow-auto p-margin-desktop">',
    '<div id="view-analytics" class="spa-view hidden w-full h-full flex flex-col p-6 md:p-8 overflow-auto">\\1<div class="flex-1">',
    html
)

# Fix logistics padding
html = re.sub(
    r'<div id="view-logistics" class="spa-view hidden w-full h-full flex flex-col">(\s*)<div class="p-6">',
    '<div id="view-logistics" class="spa-view hidden w-full h-full flex flex-col p-6 md:p-8 overflow-auto">\\1<div class="flex-1">',
    html
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(html)
