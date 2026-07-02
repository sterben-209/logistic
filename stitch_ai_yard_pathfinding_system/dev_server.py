import os
import time
import threading
from http.server import SimpleHTTPRequestHandler, HTTPServer
import subprocess

PORT = 8080
LAST_VERSION = int(time.time())

def get_latest_mtime():
    mtime = 0
    for root, dirs, files in os.walk('.'):
        for f in files:
            # Watch for html, py, css, js files
            if f.endswith(('.html', '.py', '.css', '.js')) and f != 'index.html':
                t = os.path.getmtime(os.path.join(root, f))
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
            print(f"\n[🔄 Watcher] Detect changes in source files. Rebuilding SPA...")
            subprocess.run(["python", "build_spa.py"], stdout=subprocess.DEVNULL)
            last_mtime = get_latest_mtime() # Update to post-build mtime
            LAST_VERSION = int(time.time())
            print("[✅ Watcher] Build finished. Triggering browser reload...")

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
    server = HTTPServer(('127.0.0.1', PORT), LiveReloadHandler)
    print(f"🚀 Dev Server with Live Reload running at: http://127.0.0.1:{PORT}")
    print("👀 Watching for file changes (will auto-rebuild and auto-reload browser)...")
    print("Press Ctrl+C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
        server.server_close()

if __name__ == '__main__':
    print("Building SPA initially...")
    subprocess.run(["python", "build_spa.py"], stdout=subprocess.DEVNULL)
    
    t1 = threading.Thread(target=watch_files, daemon=True)
    t1.start()
    
    start_server()
