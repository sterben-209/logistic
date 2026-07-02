import re

filepath = r'D:\test everything\logistic\stitch_ai_yard_pathfinding_system\index.html'
with open(filepath, 'r', encoding='utf-8') as f:
    html = f.read()

# Fix sidebar logout buttons
html = re.sub(
    r'onclick="switchView\(\'login\'\); return false;"',
    r'onclick="if(typeof handleLogout === \'function\') { handleLogout(); } else { switchView(\'login\'); } return false;"',
    html
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(html)
