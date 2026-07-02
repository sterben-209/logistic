import re

filepath = r'D:\test everything\logistic\stitch_ai_yard_pathfinding_system\index.html'
with open(filepath, 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Remove the "Connect / Login" button from the Top Navbar
html = re.sub(
    r'<button id="supabase-login-btn" class="bg-primary/20 text-primary border border-primary/50[^>]*>.*?</button>',
    '',
    html,
    flags=re.DOTALL
)

# 2. Modify the "Sign in with SSO" button in the Login View to be the Supabase Google Login button
sso_btn_pattern = r'<button class="w-full bg-transparent border border-outline-variant text-on-surface-variant font-title-md text-title-md py-3 px-4 rounded-lg hover:bg-surface-variant hover:text-on-surface hover:border-outline active:scale-\[0\.98\] transition-all flex justify-center items-center gap-2" type="button">\s*<span[^>]*>vpn_key</span>\s*<span>Sign in with SSO</span>\s*</button>'
google_btn_html = '''<button id="supabase-login-btn" class="w-full bg-transparent border border-outline-variant text-on-surface-variant font-title-md text-title-md py-3 px-4 rounded-lg hover:bg-surface-variant hover:text-on-surface hover:border-outline active:scale-[0.98] transition-all flex justify-center items-center gap-2" type="button">
<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" class="w-5 h-5" alt="Google">
<span>Sign in with Google</span>
</button>'''
html = re.sub(sso_btn_pattern, google_btn_html, html)

# 3. Modify the updateAuthUI javascript to handle view switching
# Find updateAuthUI function
js_pattern = r'function updateAuthUI\(user\) \{.*?(?=if\(loginBtn\))'
new_js = '''function updateAuthUI(user) {
        if (user) {
            // User is logged in, show profile, switch to analytics if currently on login
            if(userProfile) {
                userProfile.classList.remove('hidden');
                userProfile.classList.add('flex');
            }
            if(userEmail) userEmail.textContent = user.email || 'User';
            if(userAvatar) userAvatar.src = user.user_metadata?.avatar_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuA_FcpWwVHoEKYbbPlleo23dlpbwqD7o0TEoVxq61zR9q-VZLhjlZ95aA0FaoGJQfj8zpiIKsDPmjySqJE-s6gmyPZv9Co99s5x4mzp3gzu1vAiYJgWPrkT_lUGHsIsUol9O1u4a3-GzEe1w8LGVozfNRU_CB3MX9oW1gHUJblWjnbNiKvKAu_YJRKCtEvZ5SVqJHINuLmu0SzN-DNCMC0GcYz7WUT4AMwaKVjtj3kvfqNqgSXKcsVn72rCVynZO8qY_YId-Q82HsA';
            
            // Switch view automatically if they are on the login screen
            const loginView = document.getElementById('view-login');
            if (loginView && !loginView.classList.contains('hidden')) {
                switchView('analytics');
            }
        } else {
            // User is logged out
            if(userProfile) {
                userProfile.classList.add('hidden');
                userProfile.classList.remove('flex');
            }
            switchView('login');
        }
    }

    '''
html = re.sub(js_pattern, new_js, html, flags=re.DOTALL)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(html)
