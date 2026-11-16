"""API web de verificação da atribuição de códigos da BNCC (FastAPI)."""
from __future__ import annotations

import os
import sys
from typing import Any, Dict, List, Optional, Union

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

from fastapi import FastAPI, HTTPException  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from fastapi.responses import RedirectResponse  # noqa: E402
from pydantic import BaseModel, Field  # noqa: E402

import bncc_verifica as bv  # noqa: E402

DESCRICAO = """
Verifica se o código da BNCC atribuído a uma questão (por exemplo, por um modelo de linguagem)
é **o da habilidade pedida**, e não apenas um código válido.

Cada código passa pela cascata **V1 formato → V2 existência → V3 domínio → V4 alvo** e recebe um nível:
`correto`, `fvp` (**erro invisível**: válido, do domínio certo, mas da habilidade errada;
nenhum filtro estrutural o detecta), `fora_do_dominio`, `inexistente` ou `malformado`.

Um projeto do [bncc-lab](https://github.com/bncc-lab). Código e dados da pesquisa que deu origem
à ferramenta (ERI-GO 2026, SBC): [github.com/bncc-lab/bncc-lab](https://github.com/bncc-lab/bncc-lab).

Códigos e textos extraídos da BNCC oficial (MEC, 2018). Sem chamadas a modelos de linguagem.
"""

app = FastAPI(title="BNCC Verifica", version=bv.__version__, description=DESCRICAO,
              contact={"name": "bncc-lab", "url": "https://github.com/bncc-lab"},
              license_info={"name": "MIT", "url": "https://opensource.org/licenses/MIT"})
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


class Pedido(BaseModel):
    alvo: Optional[str] = Field(None, max_length=40, description="Código da habilidade pedida, ex. EF09MA21", examples=["EF09MA21"])
    componente: Optional[str] = Field(None, max_length=80, description="Componente pedido, ex. Matemática ou Física")
    ano: Optional[int] = Field(None, ge=1, le=9, description="Ano do Ensino Fundamental (1 a 9)")
    serie: Optional[int] = Field(None, ge=1, le=3, description="Série do Ensino Médio (1 a 3)")
    dominio: Optional[List[str]] = Field(None, max_length=2000, description="Lista explícita de códigos aceitos no domínio")


class PedidoVerificar(Pedido):
    codigo: Optional[str] = Field(..., max_length=40, description="Código emitido", examples=["EF09MA20"])


class PedidoLote(Pedido):
    questoes: Union[Dict[str, Any], List[Any]] = Field(
        ..., max_length=1000, description='Questões como o modelo devolveu: {"1": {"q": "...", "bncc": "EF09MA21"}, ...} ou lista',
        examples=[{"1": {"q": "Qual gráfico induz a erro?", "bncc": "EF09MA21"},
                   "2": {"q": "Calcule a probabilidade...", "bncc": "EF09MA20"}}])


class PedidoAncorar(BaseModel):
    entrada: str = Field(..., max_length=2000, description="Código ou texto (parcial) da habilidade",
                         examples=["Identificar frações equivalentes"])
    limite: int = Field(3, ge=1, le=20)


def _kw(p: Pedido) -> Dict[str, Any]:
    return {"componente": p.componente, "ano": p.ano, "serie": p.serie, "dominio": p.dominio}


@app.get("/", include_in_schema=False)
def raiz():
    return RedirectResponse("/docs")


@app.get("/saude", summary="Estado do serviço")
def saude():
    cat = bv.carregar()
    return {"status": "ok", "versao": bv.__version__, "codigos": len(cat), "fonte": cat.fonte}


@app.post("/verificar", summary="Verifica um código emitido")
def verificar(p: PedidoVerificar):
    try:
        return bv.verificar(p.codigo, p.alvo, **_kw(p))
    except ValueError as e:
        raise HTTPException(422, str(e))


@app.post("/verificar/lote", summary="Verifica um lote de questões geradas")
def verificar_lote(p: PedidoLote):
    try:
        return bv.verificar_lote(p.questoes, p.alvo, **_kw(p))
    except ValueError as e:
        raise HTTPException(422, str(e))


@app.get("/habilidade/{codigo}", summary="Texto oficial de uma habilidade")
def habilidade(codigo: str):
    h = bv.carregar().get(codigo)
    if not h:
        raise HTTPException(404, f"{codigo.upper()} não existe na BNCC")
    return h.dict()


@app.post("/ancorar", summary="Código oficial a partir de um código ou do texto da habilidade")
def ancorar(p: PedidoAncorar):
    return bv.ancorar(p.entrada, p.limite)
