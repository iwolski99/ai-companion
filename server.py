import os
import json
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import parse_qs, urlparse

class ProgressHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith('/load-progress'):
            parsed_url = urlparse(self.path)
            query_params = parse_qs(parsed_url.query)
            api_key = query_params.get('apiKey', [''])[0]
            
            if api_key:
                progress_file = f'data/{api_key}.json'
                if os.path.exists(progress_file):
                    with open(progress_file, 'r') as f:
                        progress_data = json.load(f)
                        self.send_response(200)
                        self.send_header('Content-type', 'application/json')
                        self.end_headers()
                        self.wfile.write(json.dumps({'progress': progress_data}).encode())
                        return
            
            # Return empty progress if no data found
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'progress': None}).encode())
            return
        
        return super().do_GET()
    
    def do_POST(self):
        if self.path == '/save-progress':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data)
            
            api_key = data.get('apiKey')
            progress = data.get('progress')
            
            if api_key and progress:
                os.makedirs('data', exist_ok=True)
                progress_file = f'data/{api_key}.json'
                with open(progress_file, 'w') as f:
                    json.dump(progress, f)
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'success'}).encode())
                return
            
            self.send_response(400)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'Invalid data'}).encode())
            return
        
        return super().do_POST()
    
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

if __name__ == '__main__':
    os.makedirs('data', exist_ok=True)
    server_address = ('', 3000)
    httpd = HTTPServer(server_address, ProgressHandler)
    print(f'Server running on port {server_address[1]}')
    httpd.serve_forever()