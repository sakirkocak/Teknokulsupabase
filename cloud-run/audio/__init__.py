"""
Teknokul Audio Modülü
"""

from .music_manager import (
    get_music_type_for_subject,
    download_music,
    add_background_music,
    add_outro_jingle,
    create_full_audio_mix,
    create_silent_audio,
    MUSIC_CONFIG,
    SUBJECT_MUSIC
)

__all__ = [
    "get_music_type_for_subject",
    "download_music", 
    "add_background_music",
    "add_outro_jingle",
    "create_full_audio_mix",
    "create_silent_audio",
    "MUSIC_CONFIG",
    "SUBJECT_MUSIC"
]
