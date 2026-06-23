from http.server import SimpleHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse

class RouteHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path.rstrip('/')
z
        if path == '':
            self.path = '/main.html'
        elif path == '/jogoprincipal':
            self.path = '/main.html'
        elif path == '/player1':
            self.path = '/pmain.html'
        elif path == '/player2':
            self.path = '/pmain.html'

        return super().do_GET()

    def log_message(self, format, *args):
        # Keep the console output clean
        print("[HTTP] %s - - %s" % (self.address_string(), format % args))

if __name__ == '__main__':
    server_address = ('0.0.0.0', 8000)
    httpd = HTTPServer(server_address, RouteHandler)
    print('HTTP server listening on http://0.0.0.0:8000')
    print('Rotas: /jogoprincipal, /player1, /player2')
    httpd.serve_forever()
