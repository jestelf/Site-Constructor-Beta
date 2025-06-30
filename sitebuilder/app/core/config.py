from pydantic import BaseSettings, Field

class Settings(BaseSettings):
    app_name: str = "Site Builder"
    secret_key: str = Field("CHANGE_ME", env="SB_SECRET")
    access_token_expire_minutes: int = 60 * 24
    database_url: str = "sqlite:///./sitebuilder.db"

    class Config:
        env_file = ".env"

settings = Settings()
