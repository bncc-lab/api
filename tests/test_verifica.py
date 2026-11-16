import json
import os

import pytest

import bncc_verifica as bv

BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
LAB = os.environ.get("BNCC_LAB", os.path.join(BASE, "..", "bncc-lab"))


@pytest.mark.parametrize("codigo,nivel", [
    ("EF09MA21", "correto"),
    ("EF09MA20", "fvp"),
    ("EF07MA02", "fora_do_dominio"),
    ("EF09MA99", "inexistente"),
    ("EF9MA21", "malformado"),
    (" ef09ma21 ", "correto"),
    (None, "malformado"),
])
def test_cascata(codigo, nivel):
    assert bv.verificar(codigo, "EF09MA21")["nivel"] == nivel


def test_catalogo_oficial():
    cat = bv.carregar()
    assert len(cat) == 1580
    assert cat.get("EF09MA21").texto.startswith("Analisar e identificar, em gráficos divulgados pela mídia")
    assert cat.get("EF15AR01").anos == [1, 2, 3, 4, 5]
    assert cat.get("EM13LP01") is not None


def test_dominio_por_componente():
    assert bv.verificar("EF09MA20", componente="Matemática", ano=9)["nivel"] == "aprovado_sem_alvo"
    assert bv.verificar("EF08MA01", "EF09MA21", componente="Matemática", ano=9)["nivel"] == "fora_do_dominio"
    assert bv.verificar("EM13CNT101", "EM13CNT202", componente="Física", serie=3)["nivel"] == "fvp"
    assert bv.verificar("EM13CHS101", "EM13CNT202", componente="Física", serie=3)["nivel"] == "fora_do_dominio"
    assert bv.verificar("EF69LP01", "EF89LP03")["nivel"] == "fvp"          # faixas 6–9 e 8–9 se sobrepõem


def test_lote_formatos():
    q = {"1": {"q": "a", "bncc": "EF09MA21"}, "2": {"q": "b", "bncc": "EF09MA20"}, "3": {"q": "c", "bncc": "XX"}}
    r = bv.verificar_lote(q, "EF09MA21")
    assert r["resumo"] == {"correto": 1, "fvp": 1, "malformado": 1}
    assert r["erros_nao_detectaveis_por_filtros"] == 1
    assert bv.verificar_lote(list(q.values()), "EF09MA21")["total"] == 3
    assert bv.verificar_lote({"itens": list(q.values())}, "EF09MA21")["total"] == 3


def test_ancorar():
    assert bv.ancorar("ef05ma04")["habilidade"]["codigo"] == "EF05MA04"
    assert bv.ancorar("Identificar frações equivalentes.")["habilidade"]["codigo"] == "EF05MA04"
    cand = bv.ancorar("analisar gráficos divulgados pela mídia que podem induzir erros de leitura")["candidatos"]
    assert cand[0]["codigo"] == "EF09MA21"


REG = os.path.join(LAB, "resultados", "e4_mitigacoes.jsonl")
COD = os.path.join(LAB, "dados", "codigos_bncc.json")


@pytest.mark.skipif(not (os.path.exists(REG) and os.path.exists(COD)), reason="bncc-lab não disponível")
def test_regressao_artigo():
    """Com o catálogo e os domínios do artigo, a biblioteca reproduz os vereditos registrados."""
    with open(COD, encoding="utf-8") as f:
        ref = json.load(f)
    glob, cen = set(ref["codigos"]), {k: set(v) for k, v in ref["cenarios"].items()}
    n = divergencias = 0
    with open(REG, encoding="utf-8") as f:
        linhas = [json.loads(l) for l in f]
    for r in linhas:
        for it in r["itens"]:
            v = bv.verificar(it["codigo"], r["alvo_codigo"], dominio=cen[r["cenario"]], catalogo_global=glob)
            # a gramática do artigo não incluía EM13LP##; nesses casos só V1 pode divergir
            got = (v["v1_formato"], v["v2_existe"], v["v3_dominio"], v["fvp"])
            exp = (it["v1_sintaxe"], it["v2_catalogo"], it["v3_dominio"], it["fvp"])
            n += 1
            divergencias += got != exp
    assert n == 1200
    assert divergencias == 0
