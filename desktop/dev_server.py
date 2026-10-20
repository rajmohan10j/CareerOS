"""
CareerOS Desktop Dev Server
Serves static files with Cache-Control: no-cache to guarantee immediate frontend updates.
"""
import http.server
import socketserver
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 5173


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


if __name__ == "__main__":
    socketserver.TCPServer.allow_reuse_address = True
    try:
        with socketserver.TCPServer(("", PORT), NoCacheHandler) as httpd:
            print(f"CareerOS Desktop Server active on http://localhost:{PORT}")
            httpd.serve_forever()
    except KeyboardInterrupt:
        pass
