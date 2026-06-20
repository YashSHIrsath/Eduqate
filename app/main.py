import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db, SessionLocal
from app.api.v1.router import router as api_router

logger = logging.getLogger("eduqate.startup")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Run bootstrap on startup to apply any pending seed versions."""
    db: Session = SessionLocal()
    try:
        from app.seeders.bootstrap import bootstrap_system
        bootstrap_system(db)
    except Exception as e:
        logger.error(f"Bootstrap failed on startup: {e}")
    finally:
        db.close()
    yield


app = FastAPI(title="Eduqate API", lifespan=lifespan)

# Allow requests from the frontend origin with credentials support
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/")
def read_root():
    return {"message": "Welcome to the Eduqate API"}


@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}")
