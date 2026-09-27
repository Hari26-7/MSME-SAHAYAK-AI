from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from .config import settings

def get_engine():
    if settings.database_url.startswith("sqlite"):
        return create_engine(settings.database_url, connect_args={"check_same_thread": False})
    try:
        eng = create_engine(settings.database_url, pool_pre_ping=True)
        with eng.connect() as conn:
            pass
        return eng
    except Exception as e:
        print(f"Warning: Failed to connect to PostgreSQL ({e}). Falling back to local SQLite database.")
        return create_engine("sqlite:///./msme_sahayak.db", connect_args={"check_same_thread": False})

engine = get_engine()
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
