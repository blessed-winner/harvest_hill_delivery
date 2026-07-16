"""
Quick test: POST a product with an image to the API and verify the returned image URL is a Cloudinary URL.
"""
import urllib.request
import urllib.parse
import json
import os
import sys

BASE = "http://localhost:8000"

# 1. Login as admin
def login():
    data = json.dumps({"username_or_email": "admin@harvesthill.com", "password": "adminpass123"}).encode()
    req = urllib.request.Request(f"{BASE}/api/accounts/login/", data=data, headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())["access"]

# 2. Check existing products image URLs
def check_products(token):
    req = urllib.request.Request(f"{BASE}/api/products/", headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req) as r:
        prods = json.loads(r.read())
        for p in prods[:3]:
            print(f"  [{p['id']}] {p['name']} — image: {p.get('image')} — image_url: {p.get('image_url')}")

try:
    token = login()
    print("Login OK, token:", token[:20], "...")
    print("\nExisting product images:")
    check_products(token)
except Exception as e:
    print("Error:", e)
    if hasattr(e, 'read'):
        print(e.read().decode())
