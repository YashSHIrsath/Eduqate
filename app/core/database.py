import logging
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from app.core.config import settings

# Configure logging
logger = logging.getLogger("eduqate.database")
logging.basicConfig(level=logging.INFO)

try:
    # Initialize SQLAlchemy database engine
    # pool_pre_ping=True checks connection liveness on checkout
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10
    )
    logger.info("SQLAlchemy database engine initialized successfully.")
except Exception as e:
    logger.error(f"Failed to initialize database engine: {e}")
    raise e

# Create a session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Declarative base class for models
Base = declarative_base()

# Reusable database session dependency injection
def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that yields a database session.
    Guarantees session closure after the request is finished.
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database session exception encountered: {e}")
        raise
    finally:
        db.close()
