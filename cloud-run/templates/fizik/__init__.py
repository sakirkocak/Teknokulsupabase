"""
Fizik Video Template'leri
- Mekanik: Hareket, kuvvet, hız, ivme
- Elektrik: Devre, akım, gerilim
- Dalga: Ses, ışık, optik
"""

from .mekanik import generate_mekanik_script
from .elektrik import generate_elektrik_script
from .genel import generate_fizik_genel_script

__all__ = [
    'generate_mekanik_script',
    'generate_elektrik_script',
    'generate_fizik_genel_script'
]
