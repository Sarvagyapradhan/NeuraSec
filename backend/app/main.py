from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.auth import router as auth_router
from app.api.admin import router as admin_router
from app.api.google_auth import router as google_router

app = FastAPI(
    title="NeuraSec Auth API",
    description="Authentication API for NeuraSec Cybersecurity Dashboard",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(admin_router, prefix="/api/admin", tags=["Admin"])
app.include_router(google_router, prefix="/api/auth", tags=["Google Authentication"])

@app.get("/")
async def root():
    return {"message": "Welcome to NeuraSec Authentication API"} 