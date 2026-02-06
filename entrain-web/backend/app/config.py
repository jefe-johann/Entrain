from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://entrain:entrain_dev@localhost:5432/entrain"

    # Redis
    redis_url: str = "redis://localhost:6379"

    # ElevenLabs
    elevenlabs_api_key: str = ""

    # File Storage
    storage_type: str = "local"  # "local" or "r2"
    storage_path: str = "./generated_files"

    # R2 (optional, for production)
    r2_account_id: str = ""
    r2_access_key_id: str = ""
    r2_secret_access_key: str = ""
    r2_bucket_name: str = ""

    # CORS
    frontend_url: str = "http://localhost:3000"

    # Security
    secret_key: str = "change_me_in_production"

    # Storage limits
    user_storage_limit_bytes: int = 250 * 1024 * 1024  # 250 MB
    file_retention_days: int = 7

    # Dev mode
    dev_unlimited_credits: bool = False

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
