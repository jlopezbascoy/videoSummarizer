import logging
from typing import Dict, List, Optional, Tuple
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import (
    TranscriptsDisabled,
    NoTranscriptFound,
    VideoUnavailable,
    TooManyRequests,
    YouTubeRequestFailed
)
from youtube_transcript_api.formatters import TextFormatter
import requests

from config import settings

logger = logging.getLogger(__name__)


class TranscriptService:
    """
    Servicio para obtener transcripciones de videos de YouTube
    """
    
    def __init__(self):
        self.formatter = TextFormatter()
        self.proxies = self._setup_proxies()
    
    def _setup_proxies(self) -> Optional[Dict]:
        """
        Configura proxies si están habilitados
        """
        if settings.USE_PROXY and settings.PROXY_LIST:
            # Rotar entre proxies disponibles
            proxy = settings.PROXY_LIST[0]  # Por ahora usamos el primero
            return {
                'http': proxy,
                'https': proxy
            }
        return None
    
    def get_transcript(
        self, 
        video_id: str, 
        languages: Optional[List[str]] = None
    ) -> Tuple[str, Dict]:
        """
        Obtiene la transcripción de un video de YouTube
        
        Args:
            video_id: ID del video de YouTube
            languages: Lista de códigos de idioma preferidos (ej: ['es', 'en'])
        
        Returns:
            Tuple con (texto_transcripcion, metadata)
        
        Raises:
            TranscriptsDisabled: Si las transcripciones están deshabilitadas
            NoTranscriptFound: Si no hay transcripción en los idiomas solicitados
            VideoUnavailable: Si el video no está disponible
        """
        try:
            # Obtener lista de transcripciones disponibles
            transcript_list = YouTubeTranscriptApi.list_transcripts(
                video_id,
                proxies=self.proxies
            )
            
            logger.info(f"Transcripciones disponibles para {video_id}")
            
            # Intentar obtener transcripción en los idiomas solicitados
            transcript = None
            selected_language = None
            is_generated = False
            
            if languages:
                # Intentar primero con transcripciones manuales
                for lang in languages:
                    try:
                        transcript = transcript_list.find_manually_created_transcript([lang])
                        selected_language = lang
                        is_generated = False
                        logger.info(f"Transcripción manual encontrada en {lang}")
                        break
                    except NoTranscriptFound:
                        continue
                
                # Si no hay manuales, intentar con generadas automáticamente
                if not transcript:
                    for lang in languages:
                        try:
                            transcript = transcript_list.find_generated_transcript([lang])
                            selected_language = lang
                            is_generated = True
                            logger.info(f"Transcripción generada encontrada en {lang}")
                            break
                        except NoTranscriptFound:
                            continue
            
            # Si no se encontró en idiomas específicos, usar la primera disponible
            if not transcript:
                try:
                    # Intentar obtener cualquier transcripción manual
                    transcript = transcript_list.find_manually_created_transcript(
                        transcript_list._manually_created_transcripts.keys()
                    )
                    selected_language = transcript.language_code
                    is_generated = False
                    logger.info(f"Usando transcripción manual disponible: {selected_language}")
                except:
                    # Si no hay manual, usar generada
                    transcript = transcript_list.find_generated_transcript(
                        transcript_list._generated_transcripts.keys()
                    )
                    selected_language = transcript.language_code
                    is_generated = True
                    logger.info(f"Usando transcripción generada disponible: {selected_language}")
            
            # Obtener el contenido de la transcripción
            transcript_data = transcript.fetch()
            
            # Formatear la transcripción a texto plano
            text = self.formatter.format_transcript(transcript_data)
            
            # Metadata
            metadata = {
                'video_id': video_id,
                'language': selected_language,
                'is_generated': is_generated,
                'total_duration': self._calculate_duration(transcript_data),
                'word_count': len(text.split()),
                'available_languages': self._get_available_languages(transcript_list)
            }
            
            logger.info(f"Transcripción obtenida: {metadata}")
            
            return text, metadata
            
        except TranscriptsDisabled:
            logger.error(f"Transcripciones deshabilitadas para {video_id}")
            raise
        except NoTranscriptFound:
            logger.error(f"No se encontró transcripción para {video_id}")
            raise
        except VideoUnavailable:
            logger.error(f"Video no disponible: {video_id}")
            raise
        except TooManyRequests:
            logger.error(f"Demasiadas peticiones a YouTube API")
            raise
        except YouTubeRequestFailed as e:
            logger.error(f"Error en petición a YouTube: {e}")
            raise
        except Exception as e:
            logger.error(f"Error inesperado al obtener transcripción: {e}")
            raise
    
    def _calculate_duration(self, transcript_data: List[Dict]) -> float:
        """
        Calcula la duración total del video desde la transcripción
        """
        if not transcript_data:
            return 0.0
        
        last_entry = transcript_data[-1]
        return last_entry['start'] + last_entry['duration']
    
    def _get_available_languages(self, transcript_list) -> List[Dict]:
        """
        Obtiene lista de idiomas disponibles con información
        """
        languages = []
        
        # Transcripciones manuales
        for lang_code, transcript in transcript_list._manually_created_transcripts.items():
            languages.append({
                'code': lang_code,
                'name': transcript.language,
                'is_generated': False
            })
        
        # Transcripciones generadas
        for lang_code, transcript in transcript_list._generated_transcripts.items():
            languages.append({
                'code': lang_code,
                'name': transcript.language,
                'is_generated': True
            })
        
        return languages
    
    def check_video_availability(self, video_id: str) -> Dict:
        """
        Verifica si un video tiene transcripciones disponibles
        
        Args:
            video_id: ID del video de YouTube
        
        Returns:
            Dict con información de disponibilidad
        """
        try:
            transcript_list = YouTubeTranscriptApi.list_transcripts(
                video_id,
                proxies=self.proxies
            )
            
            available_languages = self._get_available_languages(transcript_list)
            
            return {
                'available': True,
                'languages': available_languages,
                'has_manual': len(transcript_list._manually_created_transcripts) > 0,
                'has_generated': len(transcript_list._generated_transcripts) > 0
            }
            
        except TranscriptsDisabled:
            return {
                'available': False,
                'error': 'Transcripciones deshabilitadas'
            }
        except VideoUnavailable:
            return {
                'available': False,
                'error': 'Video no disponible'
            }
        except Exception as e:
            return {
                'available': False,
                'error': str(e)
            }


# Instancia global del servicio
transcript_service = TranscriptService()
