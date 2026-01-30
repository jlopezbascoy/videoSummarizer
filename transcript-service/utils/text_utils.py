import re
from typing import List, Dict
from langdetect import detect, LangDetectException

def extract_video_id(url: str) -> str:
    """
    Extrae el video ID de una URL de YouTube
    
    Soporta formatos:
    - https://www.youtube.com/watch?v=VIDEO_ID
    - https://youtu.be/VIDEO_ID
    - https://www.youtube.com/watch?v=VIDEO_ID&t=123s
    """
    patterns = [
        r'(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})',
        r'youtube\.com\/embed\/([a-zA-Z0-9_-]{11})',
        r'youtube\.com\/v\/([a-zA-Z0-9_-]{11})',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    
    # Si no coincide con ningún patrón, asumir que es el ID directamente
    if re.match(r'^[a-zA-Z0-9_-]{11}$', url):
        return url
    
    raise ValueError(f"URL de YouTube inválida: {url}")


def clean_transcript_text(transcript: List[Dict]) -> str:
    """
    Limpia y une el texto de la transcripción
    
    Args:
        transcript: Lista de diccionarios con 'text', 'start', 'duration'
    
    Returns:
        Texto limpio unido
    """
    texts = [entry['text'] for entry in transcript]
    full_text = ' '.join(texts)
    
    # Limpiar texto
    full_text = re.sub(r'\s+', ' ', full_text)  # Múltiples espacios
    full_text = re.sub(r'\[.*?\]', '', full_text)  # Quitar [Música], [Aplausos], etc.
    full_text = re.sub(r'\(.*?\)', '', full_text)  # Quitar (risas), etc.
    full_text = full_text.strip()
    
    return full_text


def chunk_text(text: str, chunk_size: int = 1500) -> List[str]:
    """
    Divide el texto en chunks de tamaño aproximado (por palabras)
    
    Args:
        text: Texto completo
        chunk_size: Número aproximado de palabras por chunk
    
    Returns:
        Lista de chunks de texto
    """
    words = text.split()
    chunks = []
    
    for i in range(0, len(words), chunk_size):
        chunk = ' '.join(words[i:i + chunk_size])
        chunks.append(chunk)
    
    return chunks


def count_words(text: str) -> int:
    """
    Cuenta el número de palabras en un texto
    """
    return len(text.split())


def detect_language(text: str) -> str:
    """
    Detecta el idioma de un texto
    
    Returns:
        Código de idioma (es, en, fr, etc.) o 'unknown'
    """
    try:
        # Tomar una muestra del texto si es muy largo
        sample = text[:1000] if len(text) > 1000 else text
        return detect(sample)
    except LangDetectException:
        return 'unknown'


def calculate_reading_time(text: str, words_per_minute: int = 200) -> int:
    """
    Calcula el tiempo estimado de lectura en minutos
    
    Args:
        text: Texto completo
        words_per_minute: Velocidad de lectura promedio
    
    Returns:
        Minutos estimados de lectura
    """
    word_count = count_words(text)
    return max(1, round(word_count / words_per_minute))


def format_duration(seconds: int) -> str:
    """
    Formatea segundos a formato HH:MM:SS o MM:SS
    
    Args:
        seconds: Duración en segundos
    
    Returns:
        String formateado (ej: "1:23:45" o "5:30")
    """
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    secs = seconds % 60
    
    if hours > 0:
        return f"{hours}:{minutes:02d}:{secs:02d}"
    else:
        return f"{minutes}:{secs:02d}"


def truncate_text(text: str, max_length: int = 100, suffix: str = "...") -> str:
    """
    Trunca un texto a una longitud máxima
    
    Args:
        text: Texto completo
        max_length: Longitud máxima
        suffix: Sufijo a añadir (ej: "...")
    
    Returns:
        Texto truncado
    """
    if len(text) <= max_length:
        return text
    
    return text[:max_length - len(suffix)].rsplit(' ', 1)[0] + suffix
