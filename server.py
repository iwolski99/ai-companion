import http.server
import socketserver
import json
import os
import hashlib
import secrets
from urllib.parse import urlparse, parse_qs
from cryptography.fernet import Fernet
import base64

PORT = 5000


class APIKeyManager:

    def __init__(self):
        self.key = self._get_or_create_key()
        self.cipher = Fernet(self.key)

    def _get_or_create_key(self):
        key_file = 'data/encryption.key'
        if os.path.exists(key_file):
            with open(key_file, 'rb') as f:
                return f.read()
        else:
            # Ensure data directory exists
            os.makedirs('data', exist_ok=True)
            key = Fernet.generate_key()
            with open(key_file, 'wb') as f:
                f.write(key)
            # Restrict file permissions (Unix/Linux)
            try:
                os.chmod(key_file, 0o600)
            except:
                pass  # Windows doesn't support chmod
            return key

    def encrypt_key(self, api_key):
        if not api_key:
            return None
        return self.cipher.encrypt(api_key.encode()).decode()

    def decrypt_key(self, encrypted_key):
        if not encrypted_key:
            return None
        try:
            return self.cipher.decrypt(encrypted_key.encode()).decode()
        except:
            return None

    def hash_user_id(self, user_data):
        # Create a secure hash for user identification
        return hashlib.sha256(str(user_data).encode()).hexdigest()[:16]


class ProgressHandler(http.server.SimpleHTTPRequestHandler):

    def do_GET(self):
        if self.path.startswith('/load-progress'):
            parsed_url = urlparse(self.path)
            query_params = parse_qs(parsed_url.query)
            api_key = query_params.get('apiKey', [''])[0]

            if api_key:
                # Initialize API key manager
                api_key_manager = APIKeyManager()
                # Decrypt the API key
                decrypted_api_key = api_key_manager.decrypt_key(api_key)

                if decrypted_api_key:
                    progress_file = f'data/{decrypted_api_key}.json'
                    if os.path.exists(progress_file):
                        with open(progress_file, 'r') as f:
                            progress_data = json.load(f)
                            self.send_response(200)
                            self.send_header('Content-type',
                                             'application/json')
                            self.end_headers()
                            self.wfile.write(
                                json.dumps({
                                    'progress': progress_data
                                }).encode())
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
                # Initialize API key manager
                api_key_manager = APIKeyManager()

                # Encrypt the API key before saving
                encrypted_api_key = api_key_manager.encrypt_key(api_key)

                if encrypted_api_key:
                    os.makedirs('data', exist_ok=True)
                    progress_file = f'data/{api_key}.json'  # Save with original key for now
                    with open(progress_file, 'w') as f:
                        json.dump(progress, f)

                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(
                        json.dumps({
                            'status': 'success'
                        }).encode())
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
    server_address = ('', PORT)
    httpd = socketserver.TCPServer(server_address, ProgressHandler)
    print(f'Server running on port {PORT}')
    httpd.serve_forever()
