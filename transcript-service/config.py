import os
from pydantic_settings import BaseSettings
from typing import Optional, List

class Settings(BaseSettings):
    """
    Configuración del microservicio de transcripciones
    """
    
    # Configuración de la aplicación
    APP_NAME: str = "YouTube Transcript Service"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Puerto del servidor
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    
    # CORS - Orígenes permitidos
    CORS_ORIGINS: List[str] = [
        "http://localhost:8080",  # Spring Boot backend
        "http://localhost:5173",  # Frontend Vite
        "http://localhost:3000",  # Frontend alternativo
    ]
    
    # Límites de procesamiento
    MAX_VIDEO_DURATION_SECONDS: int = 7200  # 2 horas
    CHUNK_SIZE_WORDS: int = 1500  # Palabras por chunk para videos largos
    
    # Configuración de proxies (opcional)
    USE_PROXY: bool = False
    PROXY_LIST: Optional[List[str]] = None
    
    # Rate limiting
    MAX_REQUESTS_PER_MINUTE: int = 10
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Instancia global de configuración
settings = Settings()
