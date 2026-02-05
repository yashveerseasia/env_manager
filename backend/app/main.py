from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.auth.router import router as auth_router
from app.projects.router import router as projects_router
from app.environments.router import router as environments_router
from app.env_vars.router import router as env_vars_router
from app.routers.env_share import router as env_share_router

app = FastAPI(
    title="ENV Configuration Manager",
    description="A secure environment variable and secrets management system",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(projects_router)
app.include_router(environments_router)
app.include_router(env_vars_router)
app.include_router(env_share_router)


@app.get("/")
def root():
    return {"message": "ENV Configuration Manager API", "version": "1.0.0"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}

