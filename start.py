"""
3D Photo Christmas Tree Launcher

This script performs the following tasks:
1. Scans the current directory for image files.
2. Generates a 'images.js' file containing the list of found images.
3. Starts a local HTTP server to serve the project files.
4. Automatically opens the default web browser to the local server address.
"""

import os
import json
import webbrowser
from http.server import SimpleHTTPRequestHandler, HTTPServer
import threading
import time

# Configuration
PORT = 8000
IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'}

def generate_image_list():
    """Scans the current directory for images and creates images.js"""
    images = []
    print("Scanning for images...")
    for filename in os.listdir('.'):
        if os.path.isfile(filename):
            ext = os.path.splitext(filename)[1].lower()
            if ext in IMAGE_EXTENSIONS:
                images.append(filename)
                print(f"Found image: {filename}")
    
    js_content = f"window.imageList = {json.dumps(images)};"
    
    with open('images.js', 'w', encoding='utf-8') as f:
        f.write(js_content)
    
    print(f"Generated images.js with {len(images)} images.")
    return len(images)

def start_server():
    """Starts a simple HTTP server"""
    server_address = ('', PORT)
    httpd = HTTPServer(server_address, SimpleHTTPRequestHandler)
    print(f"Serving at http://localhost:{PORT}")
    httpd.serve_forever()

def open_browser():
    """Opens the browser after a short delay"""
    time.sleep(1)
    webbrowser.open(f'http://localhost:{PORT}')

if __name__ == "__main__":
    count = generate_image_list()
    if count == 0:
        print("Warning: No images found in the current directory.")
        print("Please add some photos (.jpg, .png) to this folder and restart the script.")
    
    # Start browser in a separate thread
    threading.Thread(target=open_browser).start()
    
    # Start server
    start_server()
