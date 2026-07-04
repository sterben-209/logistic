import re

filepath = r'D:\test everything\logistic\stitch_ai_yard_pathfinding_system\index.html'
with open(filepath, 'r', encoding='utf-8') as f:
    html = f.read()

# Add Supabase CDN to head
if 'supabase-js' not in html:
    html = html.replace('</head>', '    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>\n</head>')

# Replace Top Navbar Profile section with Auth Container
auth_html = '''
<div id="auth-container" class="flex items-center gap-4">
    <button id="supabase-login-btn" class="bg-primary/20 text-primary border border-primary/50 px-4 py-1.5 rounded-lg font-semibold text-sm hover:bg-primary hover:text-on-primary transition-colors flex items-center gap-2">
        <span class="material-symbols-outlined text-[18px]">login</span>
        Connect / Login
    </button>
    <div id="user-profile" class="hidden items-center gap-3">
        <span id="user-email" class="text-sm font-medium text-on-surface"></span>
        <div class="w-8 h-8 rounded-full bg-surface-container-highest overflow-hidden border border-outline-variant/30">
            <img id="user-avatar" alt="User profile" class="w-full h-full object-cover" src=""/>
        </div>
        <button id="supabase-logout-btn" class="text-outline-variant hover:text-error transition-colors" title="Sign out from Google">
            <span class="material-symbols-outlined text-[20px]">logout</span>
        </button>
    </div>
</div>
'''

# Find the existing profile avatar block in top nav
old_profile_pattern = r'<div class="w-8 h-8 rounded-full bg-surface-container-highest overflow-hidden border border-outline-variant/30">.*?</div>'
# Replace it, assuming there's only one in the top nav
# Wait, let's just replace it carefully by replacing the whole </div> block at the end of header
# The header ends with </div> </header>
html = re.sub(
    r'<div class="w-8 h-8 rounded-full bg-surface-container-highest overflow-hidden border border-outline-variant/30">.*?</div>(\s*</div>\s*</header>)',
    auth_html + r'\1',
    html,
    flags=re.DOTALL
)

# Add Supabase JS Logic at the end of the script
supabase_js = '''
    // Supabase Authentication Logic
    // PLEASE REPLACE THESE WITH YOUR ACTUAL SUPABASE URL AND ANON KEY
    const SUPABASE_URL = 'https://digwvrfrvfcpcslbndrd.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZ3d2cmZydmZjcGNzbGJuZHJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3MTY4NDgsImV4cCI6MjA5ODI5Mjg0OH0.hBNkfpV8R3f0bgBli6SIEBPNYMe8Zb7vLT8iDt1Jyq4';
    
    let supabaseClient = null;
    try {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch(e) {
        console.warn("Supabase credentials not configured yet.");
    }

    const loginBtn = document.getElementById('supabase-login-btn');
    const logoutBtn = document.getElementById('supabase-logout-btn');
    const userProfile = document.getElementById('user-profile');
    const userEmail = document.getElementById('user-email');
    const userAvatar = document.getElementById('user-avatar');

    async function handleGoogleLogin() {
        if(!supabaseClient) {
            alert("Vui lòng điền SUPABASE_URL và SUPABASE_ANON_KEY vào mã nguồn để sử dụng!");
            return;
        }
        await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
        });
    }

    async function handleLogout() {
        if(supabaseClient) await supabaseClient.auth.signOut();
    }

    function updateAuthUI(user) {
        if (user) {
            if(loginBtn) loginBtn.classList.add('hidden');
            if(userProfile) {
                userProfile.classList.remove('hidden');
                userProfile.classList.add('flex');
            }
            if(userEmail) userEmail.textContent = user.email || 'User';
            if(userAvatar) userAvatar.src = user.user_metadata?.avatar_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuA_FcpWwVHoEKYbbPlleo23dlpbwqD7o0TEoVxq61zR9q-VZLhjlZ95aA0FaoGJQfj8zpiIKsDPmjySqJE-s6gmyPZv9Co99s5x4mzp3gzu1vAiYJgWPrkT_lUGHsIsUol9O1u4a3-GzEe1w8LGVozfNRU_CB3MX9oW1gHUJblWjnbNiKvKAu_YJRKCtEvZ5SVqJHINuLmu0SzN-DNCMC0GcYz7WUT4AMwaKVjtj3kvfqNqgSXKcsVn72rCVynZO8qY_YId-Q82HsA';
        } else {
            if(loginBtn) loginBtn.classList.remove('hidden');
            if(userProfile) {
                userProfile.classList.add('hidden');
                userProfile.classList.remove('flex');
            }
        }
    }

    if(loginBtn) loginBtn.addEventListener('click', handleGoogleLogin);
    if(logoutBtn) logoutBtn.addEventListener('click', handleLogout);

    if (supabaseClient) {
        // Check current session on load
        supabaseClient.auth.getSession().then(({ data: { session } }) => {
            updateAuthUI(session?.user);
        });

        // Listen for auth changes
        supabaseClient.auth.onAuthStateChange((_event, session) => {
            updateAuthUI(session?.user);
        });
    }
'''

if "Supabase Authentication Logic" not in html:
    html = html.replace('// Table Edit Logic for Operations View', supabase_js + '\n\n    // Table Edit Logic for Operations View')
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(html)
    print("Supabase auth injected successfully.")
else:
    print("Supabase auth already exists.")
