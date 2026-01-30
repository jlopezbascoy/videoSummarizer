import logging
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from typing import Optional, List
import uvicorn

from config import settings
from services.transcript_service import transcript_service
from utils.text_utils import (
    extract_video_id,
    clean_transcript_text,
    chunk_text,
    count_words,
    detect_language,
    format_duration
)

# Configurar logging
logging.basicConfig(
    level=settings.LOG_LEVEL,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Crear aplicación FastAPI
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Microservicio para obtener transcripciones de videos de YouTube"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# MODELOS DE DATOS (Request/Response)
# ==========================================

class TranscriptRequest(BaseModel):
    """Request para obtener transcripción"""
    video_url: str = Field(..., description="URL del video de YouTube")
    languages: Optional[List[str]] = Field(
        default=['es', 'en'], 
        description="Lista de códigos de idioma preferidos"
    )
    include_chunks: bool = Field(
        default=False, 
        description="Si es True, divide el texto en chunks"
    )
    chunk_size: int = Field(
        default=1500, 
        description="Tamaño de cada chunk en palabras"
    )
    
    @validator('video_url')
    def validate_url(cls, v):
        try:
            extract_video_id(v)
            return v
        except ValueError as e:
            raise ValueError(f"URL de YouTube inválida: {v}")


class TranscriptResponse(BaseModel):
    """Response con la transcripción"""
    success: bool
    video_id: str
    text: str
    chunks: Optional[List[str]] = None
    metadata: dict


class VideoCheckRequest(BaseModel):
    """Request para verificar disponibilidad"""
    video_url: str


class VideoCheckResponse(BaseModel):
    """Response de verificación"""
    success: bool
    video_id: str
    available: bool
    languages: Optional[List[dict]] = None
    error: Optional[str] = None


class ErrorResponse(BaseModel):
    """Response de error"""
    success: bool = False
    error: str
    detail: Optional[str] = None


# ==========================================
# ENDPOINTS
# ==========================================

@app.get("/")
async def root():
    """Endpoint raíz - información del servicio"""
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "endpoints": {
            "get_transcript": "/api/transcript",
            "check_video": "/api/check",
            "health": "/health"
        }
    }


@app.get("/health")
async def health_check():
    """Health check para verificar que el servicio está funcionando"""
    return {
        "status": "healthy",
        "service": settings.APP_NAME
    }


@app.post("/api/transcript", response_model=TranscriptResponse)
async def get_transcript(request: TranscriptRequest):
    """
    Obtiene la transcripción de un video de YouTube
    
    Args:
        request: TranscriptRequest con video_url y configuración
    
    Returns:
        TranscriptResponse con el texto y metadata
    
    Raises:
        HTTPException: Si hay error al obtener la transcripción
    """
    try:
        # Extraer video ID
        video_id = extract_video_id(request.video_url)
        logger.info(f"Procesando transcripción para video: {video_id}")
        
        # Obtener transcripción
        raw_text, metadata = transcript_service.get_transcript(
            video_id,
            languages=request.languages
        )
        
        # Limpiar texto (este es el texto crudo de la API)
        # La transcripción ya viene como string, no necesita clean_transcript_text
        clean_text = raw_text.strip()
        
        # Dividir en chunks si se solicita
        chunks = None
        if request.include_chunks:
            chunks = chunk_text(clean_text, request.chunk_size)
            logger.info(f"Texto dividido en {len(chunks)} chunks")
        
        # Preparar response
        response_data = {
            "success": True,
            "video_id": video_id,
            "text": clean_text,
            "chunks": chunks,
            "metadata": {
                **metadata,
                "detected_language": detect_language(clean_text),
                "reading_time_minutes": round(count_words(clean_text) / 200),
                "duration_formatted": format_duration(int(metadata.get('total_duration', 0)))
            }
        }
        
        logger.info(f"Transcripción obtenida exitosamente: {count_words(clean_text)} palabras")
        return response_data
        
    except ValueError as e:
        logger.error(f"URL inválida: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Error al obtener transcripción: {error_msg}")
        
        # Mapear errores específicos
        if "TranscriptsDisabled" in error_msg or "disabled" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Este video no tiene transcripciones disponibles"
            )
        elif "NoTranscriptFound" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No se encontró transcripción en los idiomas solicitados"
            )
        elif "VideoUnavailable" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="El video no está disponible"
            )
        elif "TooManyRequests" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Demasiadas peticiones, intenta de nuevo en unos minutos"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al obtener transcripción: {error_msg}"
            )


@app.post("/api/check", response_model=VideoCheckResponse)
async def check_video(request: VideoCheckRequest):
    """
    Verifica si un video tiene transcripciones disponibles
    
    Args:
        request: VideoCheckRequest con video_url
    
    Returns:
        VideoCheckResponse con disponibilidad y idiomas
    """
    try:
        video_id = extract_video_id(request.video_url)
        logger.info(f"Verificando disponibilidad para: {video_id}")
        
        availability = transcript_service.check_video_availability(video_id)
        
        return {
            "success": True,
            "video_id": video_id,
            **availability
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error al verificar video: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# ==========================================
# MAIN - Ejecutar servidor
# ==========================================

if __name__ == "__main__":
    logger.info(f"Iniciando {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"Servidor en http://{settings.HOST}:{settings.PORT}")
    
    uvicorn.run(
        "app:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )
