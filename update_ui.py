import os

path = r'D:\test everything\logistic\stitch_ai_yard_pathfinding_system\nexus_terminal_map_digitizer\code.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

if '<iframe' not in content:
    content = content.replace('<main>', '<main>\n    <!-- BẢN ĐỒ REACT MỚI -->\n    <iframe src="http://localhost:5173" class="w-full h-full border-0" style="width: 100%; height: 100%; min-height: 100vh;"></iframe>\n    <!-- CODE CŨ (TẠM ẨN BẰNG TEMPLATE ĐỂ NGĂN SCRIPT CHẠY) -->\n    <template id="old-digitizer">\n')
    content = content.replace('</main>', '\n    </template>\n</main>')
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('Updated successfully')
else:
    print('Already updated')
