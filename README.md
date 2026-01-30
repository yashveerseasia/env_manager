# ENV Configuration Manager

A production-ready SaaS application for secure environment variable and secrets management, similar to a simplified Vault or AWS Parameter Store.

## Features

- 🔐 **Secure Secret Management**: All secrets are encrypted at rest using Fernet (AES-256)
- 👥 **Role-Based Access Control**: OWNER, ADMIN, DEVELOPER, and READ_ONLY roles
- 📁 **Project & Environment Management**: Organize variables by project and environment (DEV, QA, PROD)
- 🔍 **Audit Logging**: Track all sensitive actions (view, copy, edit, delete)
- 📥 **Download .env Files**: Export environment variables as .env files
- 🎨 **Modern UI**: Beautiful, responsive interface built with Next.js and Tailwind CSS

## Tech Stack

### Backend
- Python FastAPI
- SQLAlchemy ORM
- PostgreSQL
- JWT Authentication
- Fernet Encryption (AES-256)

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Axios

## Project Structure

```
ENV-Configuration-Manager/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── core/          # Configuration, security, encryption
│   │   ├── db/            # Database models and session
│   │   ├── auth/          # Authentication
│   │   ├── users/         # User management
│   │   ├── projects/      # Project management
│   │   ├── environments/ # Environment management
│   │   ├── env_vars/      # Environment variables
│   │   └── audit/         # Audit logging
│   ├── requirements.txt
│   └── init_db.py
└── frontend/
    ├── app/               # Next.js app router pages
    ├── components/        # React components
    ├── lib/               # API and auth utilities
    └── package.json
```

## Quick Start

### Prerequisites

- Python 3.9+
- Node.js 18+
- PostgreSQL

### Backend Setup

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Create virtual environment:**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

4. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env and configure:
# - DATABASE_URL
# - SECRET_KEY
# - ENV_MASTER_KEY (generate with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())")
```

5. **Initialize database:**
```bash
python init_db.py
```

6. **Run the server:**
```bash
uvicorn app.main:app --reload
```

Backend will be available at `http://localhost:8000`
API docs at `http://localhost:8000/docs`

### Frontend Setup

1. **Navigate to frontend directory:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env and set NEXT_PUBLIC_API_URL=http://localhost:8000
```

4. **Run the development server:**
```bash
npm run dev
```

Frontend will be available at `http://localhost:3000`

## Security Features

- **Encryption at Rest**: All secret values are encrypted using Fernet (AES-256) before storage
- **Password Hashing**: User passwords are hashed using bcrypt
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Permissions**: 
  - OWNER: Full access (view, copy, edit)
  - ADMIN: Masked view, copy, edit
  - DEVELOPER: Masked view only (non-secrets)
  - READ_ONLY: No access
- **Audit Logging**: All sensitive actions are logged

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get JWT token

### Projects
- `POST /projects` - Create project
- `GET /projects` - Get user's projects

### Environments
- `POST /environments` - Create environment
- `GET /environments/{project_id}` - Get environments for project

### Environment Variables
- `POST /env` - Create environment variable
- `GET /env/{environment_id}` - Get variables for environment
- `PUT /env/{id}` - Update environment variable
- `DELETE /env/{id}` - Delete environment variable
- `GET /env/download/{environment_id}` - Download .env file

## Development

### Backend Development
```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development
```bash
cd frontend
npm run dev
```

## Production Deployment

1. Set `ENV_MASTER_KEY` in production environment (critical!)
2. Use strong `SECRET_KEY` for JWT
3. Configure proper CORS origins
4. Use production PostgreSQL database
5. Build frontend: `npm run build`
6. Use production WSGI server (e.g., Gunicorn) for backend

## License

This project is built as a production-ready SaaS application template.

