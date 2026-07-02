import re

filepath = r'D:\test everything\logistic\stitch_ai_yard_pathfinding_system\index.html'
with open(filepath, 'r', encoding='utf-8') as f:
    html = f.read()

# Add bg-grid-pattern to CSS
css_grid = '''
        .bg-grid-pattern {
            background-image: 
                linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px);
            background-size: 40px 40px;
        }
'''
if '.bg-grid-pattern' not in html:
    html = html.replace('</style>', f'{css_grid}</style>')

# Apply bg-grid-pattern to app-container
html = html.replace('class="md:ml-64 pt-16 h-screen flex flex-col bg-surface-lowest relative"', 'class="md:ml-64 pt-16 h-screen flex flex-col bg-surface-lowest relative bg-grid-pattern"')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(html)
