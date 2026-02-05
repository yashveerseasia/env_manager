#!/usr/bin/env python3
"""
Verify ENV_MASTER_KEY is loaded and encryption/decryption works.
Run from backend dir: python check_encryption.py
"""
import os
import sys

# Ensure backend is on path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def main():
    print("Checking ENV_MASTER_KEY and encryption...")
    
    # 1. Check env var is set (from .env)
    from app.core.config import settings
    if not settings.ENV_MASTER_KEY:
        print("FAIL: ENV_MASTER_KEY is not set. Add it to backend/.env")
        return 1
    print("OK: ENV_MASTER_KEY is set")
    
    # 2. Round-trip test
    from app.core.encryption import encryption_service
    test_value = "secret123"
    try:
        encrypted = encryption_service.encrypt(test_value)
        decrypted = encryption_service.decrypt(encrypted)
        if decrypted == test_value:
            print("OK: Encrypt/decrypt round-trip works")
        else:
            print("FAIL: Decrypted value does not match")
            return 1
    except Exception as e:
        print(f"FAIL: {e}")
        return 1
    
    print("\nEncryption is working. Restart backend (uvicorn) and re-create env vars if share still fails.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
