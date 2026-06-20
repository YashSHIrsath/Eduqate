from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db

app = FastAPI(title="Eduqate API")

@app.get("/")
def read_root():
    return {"message": "Welcome to the Eduqate API"}

@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    try:
        # Execute a simple query to verify database connectivity
        db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database connection failed: {str(e)}"
        )
