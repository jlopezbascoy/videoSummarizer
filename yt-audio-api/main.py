"""
main.py
Developed by Alperen Sümeroglu - YouTube Audio Converter API
Clean, modular Flask-based backend for downloading and serving YouTube audio tracks.
Utilizes yt-dlp and FFmpeg for conversion and token-based access management.
"""

import secrets
import threading
import os
from flask import Flask, request, jsonify, send_from_directory
from uuid import uuid4
from pathlib import Path
import yt_dlp
import access_manager
from constants import *

# Initialize the Flask application
app = Flask(__name__)


@app.route("/", methods=["GET"])
def handle_audio_request():
    """
    Main endpoint to receive a YouTube video URL, download the audio in MP3 format,
    and return a unique token for accessing the file later.

    Query Parameters:
        - url (str): Full YouTube video URL.

    Returns:
        - JSON: {"token": <download_token>}
    """
    video_url = request.args.get("url")
    if not video_url:
        return jsonify(error="Missing 'url' parameter in request."), BAD_REQUEST

    # Generate unique filename without extension
    base_filename = str(uuid4())
    output_template = str(Path(ABS_DOWNLOADS_PATH) / base_filename)

    # yt-dlp configuration for downloading best audio and converting to mp3
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': output_template + '.%(ext)s',  # Let yt-dlp add extension
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192'
        }],
        'quiet': True,
        'no_warnings': True
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([video_url])
    except Exception as e:
        return jsonify(error="Failed to download or convert audio.", detail=str(e)), INTERNAL_SERVER_ERROR

    # Find the actual filename (yt-dlp might have created base_filename.mp3)
    final_filename = base_filename + '.mp3'
    expected_path = Path(ABS_DOWNLOADS_PATH) / final_filename
    
    # Verify file exists
    if not expected_path.exists():
        # Try to find any file with the base name
        downloads_dir = Path(ABS_DOWNLOADS_PATH)
        matching_files = list(downloads_dir.glob(f"{base_filename}.*"))
        
        if matching_files:
            final_filename = matching_files[0].name
        else:
            return jsonify(error="Audio file was not created successfully."), INTERNAL_SERVER_ERROR

    return _generate_token_response(final_filename)


@app.route("/download", methods=["GET"])
def download_audio():
    """
    Endpoint to serve an audio file associated with a given token.
    If token is valid and not expired, returns the associated MP3 file.

    Query Parameters:
        - token (str): Unique access token

    Returns:
        - MP3 audio file as attachment or error JSON
    """
    token = request.args.get("token")
    if not token:
        return jsonify(error="Missing 'token' parameter in request."), BAD_REQUEST

    if not access_manager.has_access(token):
        return jsonify(error="Token is invalid or unknown."), UNAUTHORIZED

    if not access_manager.is_valid(token):
        return jsonify(error="Token has expired."), REQUEST_TIMEOUT

    try:
        filename = access_manager.get_audio_file(token)
        file_path = Path(ABS_DOWNLOADS_PATH) / filename
        
        # Double check file exists before trying to send
        if not file_path.exists():
            return jsonify(error="Requested file could not be found on the server."), NOT_FOUND
            
        return send_from_directory(ABS_DOWNLOADS_PATH, filename=filename, as_attachment=True)
    except FileNotFoundError:
        return jsonify(error="Requested file could not be found on the server."), NOT_FOUND
    except Exception as e:
        return jsonify(error="Error serving file.", detail=str(e)), INTERNAL_SERVER_ERROR


def _generate_token_response(filename: str):
    """
    Generates a secure download token for a given filename,
    registers it in the access manager, and returns the token as JSON.

    Args:
        filename (str): The name of the downloaded MP3 file

    Returns:
        JSON: {"token": <generated_token>}
    """
    token = secrets.token_urlsafe(TOKEN_LENGTH)
    access_manager.add_token(token, filename)
    return jsonify(token=token)


def main():
    """
    Starts the background thread for automatic token cleanup
    and launches the Flask development server.
    """
    # Ensure downloads directory exists
    Path(ABS_DOWNLOADS_PATH).mkdir(exist_ok=True)
    
    token_cleaner_thread = threading.Thread(
        target=access_manager.manage_tokens,
        daemon=True
    )
    token_cleaner_thread.start()
    app.run(debug=True)


if __name__ == "__main__":
    main()