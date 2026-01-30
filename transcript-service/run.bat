@echo off
echo ========================================
echo YouTube Transcript Microservice
echo ========================================
echo.

REM Activar entorno virtual
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
    echo [OK] Entorno virtual activado
) else (
    echo [ERROR] No se encontro el entorno virtual
    echo Ejecuta: python -m venv venv
    pause
    exit /b 1
)

echo.
echo Iniciando servidor...
echo URL: http://localhost:8000
echo Documentacion: http://localhost:8000/docs
echo.

REM Ejecutar servidor
python app.py

pause
