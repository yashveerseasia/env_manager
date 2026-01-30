"""
Database initialization script
Run this once to create all tables
"""
from app.db.base import Base
from app.db.session import engine

if __name__ == "__main__":
    # IMPORTANT: ensure all models are imported so they're registered on Base.metadata
    # Without this import, create_all() will create zero tables.
    from app.db import models  # noqa: F401

    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

