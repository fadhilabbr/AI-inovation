from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import ingestion, users, bins, dispatch, analytics

app = FastAPI(
    title="SmartBin Backend API",
    description="Backend services for SmartBin from Edge to Action",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(ingestion.router)
app.include_router(users.router)
app.include_router(bins.router)
app.include_router(dispatch.router)
app.include_router(analytics.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to SmartBin API"}