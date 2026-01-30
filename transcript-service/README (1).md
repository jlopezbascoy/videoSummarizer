# 🎬 YouTube Transcript Microservice

Microservicio Python para obtener transcripciones de videos de YouTube usando `youtube-transcript-api`.

## 📋 Características

✅ Obtiene transcripciones de videos de YouTube
✅ Soporte multi-idioma
✅ Chunking automático para videos largos
✅ Detección de idioma
✅ Manejo de proxies (opcional)
✅ API REST con FastAPI
✅ CORS configurado para integración con Spring Boot

---

## 🚀 Instalación

### Prerrequisitos

- Python 3.8 o superior
- pip

### Paso 1: Crear entorno virtual

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### Paso 2: Instalar dependencias

```bash
pip install -r requirements.txt
```

### Paso 3: Configurar variables de entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env con tu configuración
```

---

## 🏃 Ejecutar el servicio

### Modo desarrollo

```bash
python app.py
```

El servidor estará disponible en: `http://localhost:8000`

### Modo producción (con uvicorn)

```bash
uvicorn app:app --host 0.0.0.0 --port 8000
```

---

## 📡 Endpoints

### 1. GET `/` - Información del servicio

```bash
curl http://localhost:8000/
```

### 2. GET `/health` - Health check

```bash
curl http://localhost:8000/health
```

### 3. POST `/api/transcript` - Obtener transcripción

**Request:**
```json
{
  "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "languages": ["es", "en"],
  "include_chunks": false,
  "chunk_size": 1500
}
```

**Response:**
```json
{
  "success": true,
  "video_id": "dQw4w9WgXcQ",
  "text": "Transcripción completa del video...",
  "chunks": null,
  "metadata": {
    "language": "es",
    "is_generated": false,
    "total_duration": 213.5,
    "word_count": 450,
    "detected_language": "es",
    "reading_time_minutes": 2,
    "duration_formatted": "3:33"
  }
}
```

### 4. POST `/api/check` - Verificar disponibilidad

**Request:**
```json
{
  "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

**Response:**
```json
{
  "success": true,
  "video_id": "dQw4w9WgXcQ",
  "available": true,
  "languages": [
    {
      "code": "es",
      "name": "Spanish",
      "is_generated": false
    },
    {
      "code": "en",
      "name": "English",
      "is_generated": true
    }
  ]
}
```

---

## 🔗 Integración con Spring Boot

### 1. Llamar desde Spring Boot

En tu `SummaryService.java`:

```java
@Service
public class SummaryService {
    
    private final WebClient webClient;
    
    public SummaryService() {
        this.webClient = WebClient.builder()
                .baseUrl("http://localhost:8000")
                .build();
    }
    
    public String getTranscript(String videoUrl, String language) {
        TranscriptRequest request = new TranscriptRequest(videoUrl, List.of(language));
        
        TranscriptResponse response = webClient.post()
                .uri("/api/transcript")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(TranscriptResponse.class)
                .block();
        
        return response.getText();
    }
}
```

---

## 🐳 Docker (Opcional)

### Crear imagen

```bash
docker build -t transcript-service .
```

### Ejecutar contenedor

```bash
docker run -p 8000:8000 transcript-service
```

---

## 🔧 Configuración avanzada

### Usar proxies (evitar rate limiting)

En `.env`:

```
USE_PROXY=True
PROXY_LIST=["http://proxy1.com:8080", "http://proxy2.com:8080"]
```

### Ajustar límites

En `.env`:

```
MAX_VIDEO_DURATION_SECONDS=7200  # 2 horas
CHUNK_SIZE_WORDS=1500
MAX_REQUESTS_PER_MINUTE=10
```

---

## 📊 Estructura del proyecto

```
transcript-service/
├── app.py                      # API principal
├── config.py                   # Configuración
├── requirements.txt            # Dependencias
├── .env                        # Variables de entorno
├── .gitignore
├── README.md
├── services/
│   └── transcript_service.py   # Lógica de transcripciones
└── utils/
    └── text_utils.py          # Utilidades de texto
```

---

## 🐛 Troubleshooting

### Error: "TranscriptsDisabled"
- El video no tiene transcripciones disponibles
- Solución: Verificar con `/api/check` primero

### Error: "TooManyRequests"
- YouTube está limitando las peticiones
- Solución: Usar proxies o esperar unos minutos

### Error: "NoTranscriptFound"
- No hay transcripción en el idioma solicitado
- Solución: Probar con otros idiomas ['en', 'es']

---

## 📝 Licencia

MIT

---

## 👨‍💻 Autor

Tu nombre
