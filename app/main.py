import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .config import settings
from .database import Base, engine, SessionLocal
from .seed import seed_schemes
from .routers import auth, profile, credit, schemes, applications, documents, notifications, face, roadmap

Base.metadata.create_all(bind=engine)
os.makedirs(settings.upload_dir, exist_ok=True)
with SessionLocal() as db:
    seed_schemes(db)

app = FastAPI(title="MSME Sahayak AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(credit.router)
app.include_router(schemes.router)
app.include_router(applications.router)
app.include_router(documents.router)
app.include_router(notifications.router)
app.include_router(face.router)
app.include_router(roadmap.router)

@app.get("/")
def root():
    return {"message": "MSME Sahayak AI API is running"}

@app.get("/health")
def health():
    return {"status": "ok"}
