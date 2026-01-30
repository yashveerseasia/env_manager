# ENV Configuration Manager - Frontend

Next.js frontend for secure environment variable and secrets management.

## Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env and set NEXT_PUBLIC_API_URL to your backend URL
```

3. **Run the development server:**
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Build for Production

```bash
npm run build
npm start
```

## Features

- User authentication (login/register)
- Project management
- Environment management (DEV, QA, PROD)
- Secure environment variable management
- Secret masking and reveal
- Download .env files
- Role-based access control

