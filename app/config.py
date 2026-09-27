from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    database_url: str
    secret_key: str
    access_token_expire_minutes: int = 1440
    frontend_origins: str = "http://localhost:5173"
    upload_dir: str = "uploads"
    max_upload_mb: int = 10
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
