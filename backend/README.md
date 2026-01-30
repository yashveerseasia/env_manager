# ENV Configuration Manager - Backend

FastAPI backend for secure environment variable and secrets management.

## Setup

1. **Install dependencies:**
```bash
pip install -r requirements.txt
```

2. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env and set your values, especially ENV_MASTER_KEY
```

3. **Initialize database:**
```bash
# Make sure PostgreSQL is running
python init_db.py
```

4. **Run the server:**
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: JWT secret key (change in production)
- `ENV_MASTER_KEY`: Master encryption key for Fernet (REQUIRED in production)
- `ACCESS_TOKEN_EXPIRE_MINUTES`: JWT token expiry time
- `CORS_ORIGINS`: Allowed CORS origins

## Security Notes

- All secret values are encrypted at rest using Fernet (AES-256)
- Passwords are hashed using bcrypt
- JWT tokens are used for authentication
- Role-based access control is enforced

