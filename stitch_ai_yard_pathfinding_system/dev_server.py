import os
import time
import threading
from http.server import SimpleHTTPRequestHandler, HTTPServer
import subprocess

PORT = 8080
LAST_VERSION = int(time.time())
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
MAP_APP_DIR = os.path.join(PROJECT_ROOT, 'port_zoning_map')

WATCH_EXTENSIONS = ('.html', '.py', '.css', '.js', '.jsx', '.json')

def run_build(command, cwd, label, quiet=False):
    kwargs = {
        'cwd': cwd,
        'shell': os.name == 'nt',
    }
    if quiet:
        kwargs['stdout'] = subprocess.DEVNULL
    result = subprocess.run(command, **kwargs)
    if result.returncode != 0:
        print(f"[ERROR] {label} failed with exit code {result.returncode}")
    return result.returncode == 0

def build_map_app():
    print("[Build] Building React map app into /map_app...")
    npm_cmd = 'npm.cmd' if os.name == 'nt' else 'npm'
    return run_build([npm_cmd, 'run', 'build'], MAP_APP_DIR, 'React map build', quiet=False)

def build_logistic_spa():
    print("[Build] Building logistic SPA...")
    return run_build(['python', 'build_spa.py'], BASE_DIR, 'Logistic SPA build')

def build_all():
    return build_map_app() and build_logistic_spa()

def get_latest_mtime():
    mtime = 0
    watch_roots = [
        BASE_DIR,
        os.path.join(MAP_APP_DIR, 'src'),
    ]
    watch_files = [
        os.path.join(MAP_APP_DIR, 'index.html'),
        os.path.join(MAP_APP_DIR, 'package.json'),
        os.path.join(MAP_APP_DIR, 'vite.config.js'),
    ]

    for watch_root in watch_roots:
        if not os.path.exists(watch_root):
            continue
        for root, dirs, files in os.walk(watch_root):
            dirs[:] = [d for d in dirs if d not in {'node_modules', 'dist', 'map_app', '.git'}]
            for f in files:
                if f == 'index.html' and root == BASE_DIR:
                    continue
                if f.endswith(WATCH_EXTENSIONS):
                    t = os.path.getmtime(os.path.join(root, f))
                    if t > mtime:
                        mtime = t

    for file_path in watch_files:
        if os.path.exists(file_path):
            t = os.path.getmtime(file_path)
            if t > mtime:
                mtime = t

    return mtime

def watch_files():
    global LAST_VERSION
    last_mtime = get_latest_mtime()
    while True:
        time.sleep(1)
        current_mtime = get_latest_mtime()
        if current_mtime > last_mtime:
            print(f"\n[Watcher] Detected source changes. Rebuilding map + SPA...")
            build_all()
            last_mtime = get_latest_mtime() # Update to post-build mtime
            LAST_VERSION = int(time.time())
            print("[Watcher] Build finished. Triggering browser reload...")

class LiveReloadHandler(SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        # Suppress standard logging for clean output, except for errors
        pass
        
    def do_GET(self):
        if self.path == '/version':
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
            self.end_headers()
            self.wfile.write(str(LAST_VERSION).encode())
            return
        
        super().do_GET()
        
    def copyfile(self, source, outputfile):
        if self.path == '/' or self.path == '/index.html':
            content = source.read()
            # Inject JS polling for live reload
            inject = b'''
            <script>
                (function() {
                    let lastVersion = null;
                    setInterval(() => {
                        fetch('/version').then(r => r.text()).then(v => {
                            if(lastVersion === null) lastVersion = v;
                            else if(lastVersion !== v) location.reload();
                        }).catch(()=>{});
                    }, 1000);
                })();
            </script>
            '''
            content = content.replace(b'</body>', inject + b'</body>')
            outputfile.write(content)
        else:
            super().copyfile(source, outputfile)

def start_server():
    os.chdir(BASE_DIR)
    server = HTTPServer(('127.0.0.1', PORT), LiveReloadHandler)
    print(f"Dev Server with Live Reload running at: http://127.0.0.1:{PORT}")
    print("Watching logistic + React map sources...")
    print("Press Ctrl+C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
        server.server_close()

if __name__ == '__main__':
    print("Building app initially...")
    build_all()
    
    t1 = threading.Thread(target=watch_files, daemon=True)
    t1.start()
    
    start_server()
