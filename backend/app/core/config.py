from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "GlobeTrotter API"
    API_V1_STR: str = "/api/v1"
    
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/globetrotter_dev"
    JWT_SECRET: str = "super_secure_random_string_replace_in_production"
    ALGORITHM: str = "HS256"
    JWT_ACCESS_MINUTES: int = 60
    
    class Config:
        env_file = ".env"

settings = Settings()
