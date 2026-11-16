"""Catálogo oficial da BNCC (códigos, textos, componente e anos), lido de JSON."""
from __future__ import annotations

import json
import os
import re
import unicodedata
from dataclasses import dataclass, field
from functools import lru_cache
from typing import Dict, List, Optional

ARQUIVO_PADRAO = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dados", "bncc_codigos.json")

# V1: gramáticas oficiais dos identificadores
RE_EF = re.compile(r"^EF\d{2}[A-Z]{2}\d{2}$")
RE_EM = re.compile(r"^EM13(?:[A-Z]{3}\d{3}|LP\d{2})$")
RE_EI = re.compile(r"^EI\d{2}[A-Z]{2}\d{2}$")
RE_QUALQUER = re.compile(r"(EF\d{2}[A-Z]{2}\d{2}|EM13(?:[A-Z]{3}\d{3}|LP\d{2})|EI\d{2}[A-Z]{2}\d{2})")

# Componentes do Ensino Médio -> área da BNCC (o código do EM identifica só a área)
AREA_DO_COMPONENTE_EM = {
    "fisica": "CNT", "quimica": "CNT", "biologia": "CNT", "ciencias da natureza": "CNT",
    "historia": "CHS", "geografia": "CHS", "filosofia": "CHS", "sociologia": "CHS",
    "ciencias humanas": "CHS",
    "arte": "LGG", "educacao fisica": "LGG", "lingua inglesa": "LGG", "ingles": "LGG",
    "linguagens": "LGG", "lingua portuguesa": "LP", "portugues": "LP",
    "matematica": "MAT",
}
SIGLA_EF = {
    "lingua portuguesa": "LP", "portugues": "LP", "matematica": "MA", "historia": "HI",
    "geografia": "GE", "ciencias": "CI", "lingua inglesa": "LI", "ingles": "LI",
    "educacao fisica": "EF", "ensino religioso": "ER", "arte": "AR",
}


def normalizar(texto: str) -> str:
    t = unicodedata.normalize("NFKD", texto or "").encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", " ", t).strip()


def normalizar_codigo(codigo) -> str:
    return (str(codigo) if codigo is not None else "").strip().upper()


def sintaxe_valida(codigo: str) -> bool:
    c = normalizar_codigo(codigo)
    return bool(RE_EF.match(c) or RE_EM.match(c) or RE_EI.match(c))


@dataclass
class Habilidade:
    codigo: str
    etapa: str
    componente: str
    sigla: str
    texto: str
    anos: List[int] = field(default_factory=list)
    faixa_etaria: Optional[str] = None
    pagina_pdf: Optional[int] = None

    def dict(self) -> Dict:
        d = {"codigo": self.codigo, "etapa": self.etapa, "componente": self.componente,
             "sigla": self.sigla, "texto": self.texto, "pagina_pdf": self.pagina_pdf}
        if self.anos:
            d["anos"] = self.anos
        if self.faixa_etaria:
            d["faixa_etaria"] = self.faixa_etaria
        return d


class Catalogo:
    def __init__(self, dados: Dict):
        self.fonte = dados.get("fonte", {})
        self.habilidades: Dict[str, Habilidade] = {}
        for h in dados["habilidades"]:
            self.habilidades[h["codigo"]] = Habilidade(
                codigo=h["codigo"], etapa=h["etapa"], componente=h["componente"], sigla=h["sigla"],
                texto=h.get("texto") or "", anos=h.get("anos") or [], faixa_etaria=h.get("faixa_etaria"),
                pagina_pdf=h.get("pagina_pdf"))
        self._por_texto = {normalizar(h.texto): h.codigo for h in self.habilidades.values() if h.texto}

    def __contains__(self, codigo: str) -> bool:
        return normalizar_codigo(codigo) in self.habilidades

    def __len__(self) -> int:
        return len(self.habilidades)

    def get(self, codigo: str) -> Optional[Habilidade]:
        return self.habilidades.get(normalizar_codigo(codigo))

    def por_texto_exato(self, texto: str) -> Optional[Habilidade]:
        cod = self._por_texto.get(normalizar(texto))
        return self.habilidades.get(cod) if cod else None


@lru_cache(maxsize=4)
def carregar(caminho: str = ARQUIVO_PADRAO) -> Catalogo:
    caminho = os.environ.get("BNCC_CODIGOS", caminho)
    with open(caminho, encoding="utf-8") as f:
        return Catalogo(json.load(f))
