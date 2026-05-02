"""Main FastAPI application"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from app.api.routes import auth, boats, captains, bookings, users
from app.db.database import Base, engine

# Create tables
Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI(
    title="Boat Tour Management System",
    description="API for managing boat tours, captains, and bookings",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(boats.router)
app.include_router(captains.router)
app.include_router(bookings.router)
app.include_router(users.router)


@app.get("/health")
def health_check():
    """
    Health check endpoint

    Returns:
        Health status
    """
    return {"status": "ok"}


@app.get("/")
def root():
    """
    Root endpoint

    Returns:
        API information
    """
    return {
        "name": "Boat Tour Management System",
        "version": "1.0.0",
        "docs": "/docs",
        "openapi": "/openapi.json",
    }


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
