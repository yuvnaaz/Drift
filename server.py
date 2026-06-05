import http.server
import socketserver
import sys

PORT = 8000

class MeditativeHTTPServer(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Disable caching to make updates instant
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

# Force standard MIME types to override any corrupt Windows Registry keys
MeditativeHTTPServer.extensions_map.update({
    '.js': 'application/javascript',
    '.mjs': 'application/javascript',
    '.css': 'text/css',
    '.html': 'text/html',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
})

handler = MeditativeHTTPServer

# Allow port reuse to prevent "Address already in use" errors during restarts
socketserver.TCPServer.allow_reuse_address = True

try:
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print(f"Drift Meditative Web Server running on http://localhost:{PORT}")
        httpd.serve_forever()
except KeyboardInterrupt:
    print("\nServer stopped.")
    sys.exit(0)
except Exception as e:
    print(f"Error starting server: {e}")
    sys.exit(1)
