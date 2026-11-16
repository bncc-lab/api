#!/usr/bin/env python3
# Extrai do PDF oficial do MEC os códigos, textos, componente e anos e grava data/bncc_codigos.json (e as cópias)
# Uso: python3 -I scripts/extrair_codigos.py fontes_mec/BNCC_EI_EF_110518_versaofinal_site.pdf
# Padrões: EF00AA00 · EM13AAA000 ou EM13LP00 · EI00AA00
from __future__ import annotations

import hashlib
import json
import os
import re
import sys
from collections import Counter

import pymupdf

URL_FONTE = "http://basenacionalcomum.mec.gov.br/images/BNCC_EI_EF_110518_versaofinal_site.pdf"
BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
DESTINO = os.path.join(BASE, "data", "bncc_codigos.json")
# cópias usadas pelo pacote (pip) e pela página estática (GitHub Pages)
COPIAS = [os.path.join(BASE, "bncc_verifica", "dados", "bncc_codigos.json"),
          os.path.join(BASE, "docs", "bncc_codigos.json")]

RE_COD = re.compile(r"\((EF\d{2}[A-Z]{2}\d{2}|EM13[A-Z]{3}\d{3}|EM13LP\d{2}|EI\d{2}[A-Z]{2}\d{2})\)")

COMPONENTE_EF = {
    "LP": "Língua Portuguesa", "MA": "Matemática", "HI": "História", "GE": "Geografia",
    "CI": "Ciências", "LI": "Língua Inglesa", "EF": "Educação Física", "ER": "Ensino Religioso",
    "AR": "Arte",
}
AREA_EM = {
    "LP": "Língua Portuguesa", "MAT": "Matemática e suas Tecnologias",
    "CHS": "Ciências Humanas e Sociais Aplicadas", "LGG": "Linguagens e suas Tecnologias",
    "CNT": "Ciências da Natureza e suas Tecnologias",
}
CAMPO_EI = {
    "EO": "O eu, o outro e o nós", "CG": "Corpo, gestos e movimentos",
    "TS": "Traços, sons, cores e formas", "EF": "Escuta, fala, pensamento e imaginação",
    "ET": "Espaços, tempos, quantidades, relações e transformações",
}
FAIXA_EI = {"01": "bebês (0 a 1 ano e 6 meses)", "02": "crianças bem pequenas (1 ano e 7 meses a 3 anos e 11 meses)",
            "03": "crianças pequenas (4 anos a 5 anos e 11 meses)"}


def anos_ef(dd: str) -> list[int]:
    """'09' -> [9]; '15' -> [1..5]; '69' -> [6..9]; '12' -> [1,2]."""
    a, b = int(dd[0]), int(dd[1])
    if dd[0] == "0":
        return [b]
    return list(range(a, b + 1))


def metadados(cod: str) -> dict:
    if cod.startswith("EF"):
        sig = cod[4:6]
        return {"etapa": "Ensino Fundamental", "componente": COMPONENTE_EF.get(sig, sig),
                "sigla": sig, "anos": anos_ef(cod[2:4])}
    if cod.startswith("EM13"):
        sig = "LP" if cod.startswith("EM13LP") else cod[4:7]
        return {"etapa": "Ensino Médio", "componente": AREA_EM.get(sig, sig),
                "sigla": sig, "anos": [1, 2, 3]}
    sig = cod[4:6]
    return {"etapa": "Educação Infantil", "componente": CAMPO_EI.get(sig, sig), "sigla": sig,
            "faixa_etaria": FAIXA_EI.get(cod[2:4], cod[2:4])}


# Linhas que não pertencem ao texto da habilidade (cabeçalhos de página, rótulos de tabela).
RE_CORTE = re.compile(
    r"\n\s*(\d{1,3}\s*\n|[A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9 ,–\-/()]{12,}\n|Habilidades\b|HABILIDADES\b|"
    r"Competências\s*\n|Objetos de conhecimento|OBJETOS DE CONHECIMENTO|UNIDADES TEMÁTICAS)")


def limpar(texto: str) -> str:
    m = RE_CORTE.search("\n" + texto)
    if m:
        texto = ("\n" + texto)[: m.start()]
    texto = re.sub(r"-\n(?=[a-zà-ú])", "", texto)          # hifenização de fim de linha
    texto = re.sub(r"\s+", " ", texto).strip()
    return texto


def main(pdf: str) -> None:
    with open(pdf, "rb") as f:
        sha = hashlib.sha256(f.read()).hexdigest()
    doc = pymupdf.open(pdf)
    textos: dict[str, str] = {}
    paginas: dict[str, int] = {}
    vistos: set[str] = set()
    for num, pagina in enumerate(doc, 1):
        for bloco in pagina.get_text("blocks"):
            t = bloco[4]
            achados = list(RE_COD.finditer(t))
            for i, m in enumerate(achados):
                cod = m.group(1)
                vistos.add(cod)
                fim = achados[i + 1].start() if i + 1 < len(achados) else len(t)
                txt = limpar(t[m.end():fim])
                # primeira ocorrência com texto substancial é a definição da habilidade
                if len(txt) >= 25 and cod not in textos:
                    textos[cod] = txt
                    paginas[cod] = num
    # códigos citados apenas em texto corrido (sem parênteses)
    corrido = set()
    for pagina in doc:
        corrido |= set(re.findall(r"\b(EF\d{2}[A-Z]{2}\d{2}|EM13[A-Z]{3}\d{3}|EM13LP\d{2}|EI\d{2}[A-Z]{2}\d{2})\b",
                                  pagina.get_text()))
    todos = vistos | corrido
    habilidades = []
    for cod in sorted(todos):
        h = {"codigo": cod, **metadados(cod), "texto": textos.get(cod), "pagina_pdf": paginas.get(cod)}
        habilidades.append(h)
    saida = {
        "fonte": {"documento": "Base Nacional Comum Curricular (BNCC) — versão final homologada",
                  "editor": "Ministério da Educação (MEC)", "url": URL_FONTE, "sha256_pdf": sha,
                  "observacao": "Texto oficial extraído automaticamente; conferir no PDF em caso de dúvida."},
        "total": len(habilidades),
        "por_etapa": dict(Counter(h["etapa"] for h in habilidades)),
        "sem_texto": [h["codigo"] for h in habilidades if not h["texto"]],
        "habilidades": habilidades,
    }
    os.makedirs(os.path.dirname(DESTINO), exist_ok=True)
    for caminho in [DESTINO] + COPIAS:
        os.makedirs(os.path.dirname(caminho), exist_ok=True)
        with open(caminho, "w", encoding="utf-8") as f:
            json.dump(saida, f, ensure_ascii=False, indent=1)
    print(f"gravado {DESTINO}: {saida['total']} códigos {saida['por_etapa']}; sem texto: {len(saida['sem_texto'])}")


if __name__ == "__main__":
    main(sys.argv[1])
