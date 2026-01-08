"""
Matematik Video Template'leri
- Cebir: Denklemler, işlemler, ifadeler
- Geometri: Şekiller, açılar, alan/çevre
- Fonksiyon: Grafikler, koordinat sistemi
- İstatistik: Tablolar, grafikler, olasılık
"""

from .cebir import generate_cebir_script
from .geometri import generate_geometri_script
from .fonksiyon import generate_fonksiyon_script
from .istatistik import generate_istatistik_script

__all__ = [
    'generate_cebir_script',
    'generate_geometri_script', 
    'generate_fonksiyon_script',
    'generate_istatistik_script'
]
