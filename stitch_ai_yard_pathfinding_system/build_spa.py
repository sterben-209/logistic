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
    });
</script>
</body>
"""
template_html = template_html.replace('</body>', spa_script)

with open(os.path.join(base_dir, 'index.html'), 'w', encoding='utf-8') as f:
    f.write(template_html)
    
print("SPA built successfully as index.html")
