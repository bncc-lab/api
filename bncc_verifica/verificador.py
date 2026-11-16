# Cascata de verificação de um código da BNCC (pesquisa: github.com/bncc-lab/bncc-lab)
# V1 formato · V2 existência · V3 ano e componente · V4 habilidade pedida
# Erro que passa de V1 a V3 e cai em V4 = erro invisível (no artigo, FVP)
from __future__ import annotations

from typing import Any, Dict, Iterable, List, Optional, Set

from .catalogo import (AREA_DO_COMPONENTE_EM, RE_QUALQUER, SIGLA_EF, Catalogo, carregar,
                       normalizar, normalizar_codigo, sintaxe_valida)

CORRETO = "correto"
FVP = "fvp"
FORA_DO_DOMINIO = "fora_do_dominio"
INEXISTENTE = "inexistente"
MALFORMADO = "malformado"
SEM_ALVO = "aprovado_sem_alvo"

NIVEIS = (CORRETO, FVP, FORA_DO_DOMINIO, INEXISTENTE, MALFORMADO, SEM_ALVO)


SO_MEDIO = {"fisica", "quimica", "biologia", "filosofia", "sociologia"}


def _no_dominio(cod: str, cat: Catalogo, alvo: Optional[str], componente: Optional[str],
                ano: Optional[int], serie: Optional[int], dominio: Optional[Set[str]]) -> Optional[bool]:
    """V3. Prioridade: lista explícita > componente com ano/série > derivado do alvo. None se indeterminável."""
    if dominio is not None:
        return cod in dominio
    h = cat.get(cod)
    if h is None:
        return False
    if componente:
        comp = normalizar(componente)
        if serie is not None or comp in SO_MEDIO or comp not in SIGLA_EF:
            if comp not in AREA_DO_COMPONENTE_EM:
                raise ValueError(f"componente desconhecido no Ensino Médio: {componente}")
            areas = {"LP", "LGG"} if AREA_DO_COMPONENTE_EM[comp] == "LP" else {AREA_DO_COMPONENTE_EM[comp]}
            return h.etapa == "Ensino Médio" and h.sigla in areas
        ok = h.etapa == "Ensino Fundamental" and h.sigla == SIGLA_EF[comp]
        return ok and (ano is None or int(ano) in h.anos)
    if alvo:
        a = cat.get(alvo)
        if a is None:
            return None
        if a.etapa != h.etapa or a.sigla != h.sigla:
            return False
        return bool(set(a.anos) & set(h.anos)) if a.anos and h.anos else True
    return None


def _explicar(nivel: str, cod: str, alvo: Optional[str], cat: Catalogo, bruto: str) -> str:
    h = cat.get(cod)
    if nivel == CORRETO:
        return f"{cod} é o código da habilidade pedida."
    if nivel == FVP:
        return (f"{cod} existe e é do mesmo componente e ano, mas NÃO é a habilidade pedida ({alvo}). "
                "É um erro invisível: passa por todos os filtros estruturais, e só a conferência "
                "com a habilidade pedida o detecta.")
    if nivel == FORA_DO_DOMINIO:
        return f"{cod} existe na BNCC, mas é de {h.componente if h else 'outro domínio'}, fora do componente/ano pedido."
    if nivel == INEXISTENTE:
        return f"{cod} tem formato válido, mas não existe na BNCC (código inventado)."
    if nivel == MALFORMADO:
        achados = RE_QUALQUER.findall(normalizar_codigo(bruto))
        dica = f" O texto parece conter {achados[0]}; envie só o código." if len(achados) == 1 else ""
        return f"'{bruto}' não segue a gramática dos códigos da BNCC.{dica}"
    return (f"{cod} passa pelos filtros de formato, existência e domínio, mas sem a habilidade pedida "
            "não é possível saber se está correto. Informe a habilidade pedida para detectar erros invisíveis.")


def verificar(codigo: Any, alvo: Optional[str] = None, *, componente: Optional[str] = None,
              ano: Optional[int] = None, serie: Optional[int] = None,
              dominio: Optional[Iterable[str]] = None,
              catalogo_global: Optional[Iterable[str]] = None,
              catalogo: Optional[Catalogo] = None) -> Dict[str, Any]:
    """Classifica um código emitido. alvo = habilidade pedida; dominio/componente/ano/serie = domínio do pedido."""
    cat = catalogo or carregar()
    bruto = "" if codigo is None else str(codigo)
    cod = normalizar_codigo(bruto)
    alvo_n = normalizar_codigo(alvo) if alvo else None
    dom = {normalizar_codigo(c) for c in dominio} if dominio is not None else None
    glob = {normalizar_codigo(c) for c in catalogo_global} if catalogo_global is not None else None

    v1 = sintaxe_valida(cod)
    v2 = v1 and (cod in glob if glob is not None else cod in cat)
    v3_bruto = _no_dominio(cod, cat, alvo_n, componente, ano, serie, dom) if v2 else False
    v3 = bool(v2 and v3_bruto)
    v4 = bool(v3 and alvo_n and cod == alvo_n) if alvo_n else None

    if not v1:
        nivel = MALFORMADO
    elif not v2:
        nivel = INEXISTENTE
    elif v3_bruto is None:
        nivel = SEM_ALVO
    elif not v3:
        nivel = FORA_DO_DOMINIO
    elif alvo_n is None:
        nivel = SEM_ALVO
    else:
        nivel = CORRETO if v4 else FVP

    h = cat.get(cod) if v2 else None
    return {
        "codigo": cod or None,
        "alvo": alvo_n,
        "nivel": nivel,
        "v1_formato": v1,
        "v2_existe": v2,
        "v3_dominio": v3 if v3_bruto is not None else None,
        "v4_alvo": v4,
        "fvp": nivel == FVP,
        "explicacao": _explicar(nivel, cod, alvo_n, cat, bruto),
        "habilidade": h.dict() if h else None,
    }


CAMPOS_CODIGO = ("bncc", "codigo", "codigo_bncc", "code", "habilidade")


def _itens(entrada: Any) -> List[Dict[str, Any]]:
    """Aceita {"1": {...}, "2": {...}}, [{...}, ...] ou {"itens": [...]}, como os modelos costumam devolver."""
    if isinstance(entrada, dict) and "itens" in entrada and isinstance(entrada["itens"], list):
        entrada = entrada["itens"]
    if isinstance(entrada, dict):
        return [dict(v, _id=k) if isinstance(v, dict) else {"_id": k, "bncc": v} for k, v in entrada.items()]
    if isinstance(entrada, list):
        return [dict(v, _id=str(i + 1)) if isinstance(v, dict) else {"_id": str(i + 1), "bncc": v}
                for i, v in enumerate(entrada)]
    raise ValueError("Formato não reconhecido: envie um objeto {\"1\": {...}} ou uma lista de questões.")


def verificar_lote(questoes: Any, alvo: Optional[str] = None, **kw) -> Dict[str, Any]:
    """Verifica um lote de questões geradas. Cada questão deve ter o código em 'bncc' (ou 'codigo')."""
    resultados = []
    for it in _itens(questoes):
        cod = next((it[c] for c in CAMPOS_CODIGO if c in it), None)
        r = verificar(cod, alvo, **kw)
        r["id"] = it["_id"]
        enunciado = it.get("q") or it.get("enunciado")
        if enunciado:
            r["enunciado"] = str(enunciado)[:200]
        resultados.append(r)
    resumo = {n: sum(r["nivel"] == n for r in resultados) for n in NIVEIS}
    erros = [r for r in resultados if r["nivel"] in (FVP, FORA_DO_DOMINIO, INEXISTENTE, MALFORMADO)]
    resumo = {k: v for k, v in resumo.items() if v}
    return {
        "total": len(resultados),
        "resumo": resumo,
        "erros_nao_detectaveis_por_filtros": sum(r["fvp"] for r in resultados),
        "alerta": ("Há erros invisíveis: códigos válidos e do domínio certo que não são a habilidade pedida."
                   if any(r["fvp"] for r in resultados) else None) if erros else None,
        "resultados": resultados,
    }


def ancorar(entrada: str, limite: int = 3) -> Dict[str, Any]:
    """Devolve o código e o texto oficiais a partir de um código ou de um trecho do texto da habilidade."""
    # código vem do catálogo, nunca do modelo; busca exata normalizada e, se faltar, por palavras
    cat = carregar()
    h = cat.get(entrada)
    if h:
        return {"exato": True, "por": "codigo", "habilidade": h.dict(), "candidatos": []}
    h = cat.por_texto_exato(entrada)
    if h:
        return {"exato": True, "por": "texto", "habilidade": h.dict(), "candidatos": []}
    consulta = set(normalizar(entrada).split()) - _VAZIAS
    if not consulta:
        return {"exato": False, "por": "texto", "habilidade": None, "candidatos": []}
    pont = []
    for x in cat.habilidades.values():
        palavras = set(normalizar(x.texto).split()) - _VAZIAS
        if palavras:
            s = len(consulta & palavras) / len(consulta | palavras)
            if s > 0:
                pont.append((s, x))
    pont.sort(key=lambda t: -t[0])
    return {"exato": False, "por": "texto", "habilidade": None,
            "candidatos": [dict(h.dict(), similaridade=round(s, 3)) for s, h in pont[:limite]]}


_VAZIAS = set("a o e de da do das dos em no na nos nas um uma para por com como que se ao aos as os ou "
              "sua seu suas seus entre sobre".split())
