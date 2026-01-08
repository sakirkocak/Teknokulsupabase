"""
Teknokul Video Factory - Template Sistemi
Her ders için özelleştirilmiş Manim animasyonları
"""

from .base import get_template_for_subject
from .outro import get_outro_code, get_outro_integration_code
from .smart_renderer import generate_smart_script, detect_animations

__all__ = [
    'get_template_for_subject',
    'get_outro_code',
    'get_outro_integration_code',
    'generate_smart_script',
    'detect_animations'
]
