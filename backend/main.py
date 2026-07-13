from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import ingestion, users, bins, dispatch, analytics, auth, regions, vision, diy
from app.database import engine
from app import models

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SmartBin Backend API",
    description="Backend services for SmartBin from Edge to Action",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://ai-inovation.vercel.app",
        "https://ai-inovation-production-7362.up.railway.app",
        "https://ai-inovation-yn4t-as92dsy72-fadhilabbrs-projects.vercel.app",
        "https://ai-inovation-h78h3lbqv-fadhilabbrs-projects.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",  # Allow all Vercel preview deployments
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(ingestion.router)
app.include_router(users.router)
app.include_router(bins.router)
app.include_router(regions.router)
app.include_router(dispatch.router)
app.include_router(analytics.router)
app.include_router(auth.router)
app.include_router(vision.router)
app.include_router(diy.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to SmartBin API"}