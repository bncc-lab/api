# bncc_verifica: confere se o código da BNCC é o da habilidade pedida (pesquisa: github.com/bncc-lab/bncc-lab)
from .catalogo import Catalogo, Habilidade, carregar, sintaxe_valida
from .verificador import NIVEIS, ancorar, verificar, verificar_lote

__version__ = "0.1.0"
__all__ = ["verificar", "verificar_lote", "ancorar", "carregar", "sintaxe_valida",
           "Catalogo", "Habilidade", "NIVEIS", "__version__"]
