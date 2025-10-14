"""
ConvexHire Backend - Main application file
Simple FastAPI app for job recruitment platform
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import init_db
from app.api.v1.routes import auth, users, applications, jobs


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan manager - runs when app starts and shuts down
    """
    # Startup: Create database tables
    print("🚀 Starting ConvexHire API...")
    print("📊 Initializing database...")
    init_db()
    print("✅ Database ready!")
    
    yield
    
    # Shutdown
    print("👋 Shutting down ConvexHire API...")


# Create the FastAPI application
app = FastAPI(
    title="ConvexHire API",
    description="Backend API for ConvexHire recruitment platform",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS so frontend can talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(auth.router, prefix="/auth", tags=["authentication"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(applications.router, prefix="/applications", tags=["applications"])
app.include_router(jobs.router, prefix="/jobs", tags=["jobs"])


@app.get("/")
def root():
    """Root endpoint - check if API is running"""
    return {
        "message": "ConvexHire API is running!",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
    }


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
    }
