from cryptography.fernet import Fernet
from app.core.config import settings
import base64
import hashlib


class EncryptionService:
    _instance = None
    _fernet: Fernet = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(EncryptionService, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance
    
    def _initialize(self):
        """Initialize Fernet with master key from environment"""
        if not settings.ENV_MASTER_KEY:
            raise ValueError("ENV_MASTER_KEY must be set in environment variables")
        
        # Generate a key from the master key using SHA256
        key = hashlib.sha256(settings.ENV_MASTER_KEY.encode()).digest()
        # Fernet requires 32-byte key, base64 encoded
        fernet_key = base64.urlsafe_b64encode(key)
        self._fernet = Fernet(fernet_key)
    
    def encrypt(self, plaintext: str) -> str:
        """Encrypt a plaintext string"""
        if not plaintext:
            return ""
        return self._fernet.encrypt(plaintext.encode()).decode()
    
    def decrypt(self, ciphertext: str) -> str:
        """Decrypt a ciphertext string"""
        if not ciphertext:
            return ""
        return self._fernet.decrypt(ciphertext.encode()).decode()


# Singleton instance
encryption_service = EncryptionService()

