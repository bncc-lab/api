from fastapi.testclient import TestClient

from api.main import app

c = TestClient(app)


def test_saude():
    r = c.get("/saude")
    assert r.status_code == 200 and r.json()["codigos"] == 1580


def test_verificar_fvp():
    r = c.post("/verificar", json={"codigo": "EF09MA20", "alvo": "EF09MA21"}).json()
    assert r["nivel"] == "fvp" and r["fvp"] is True


def test_lote():
    q = {"1": {"q": "a", "bncc": "EF09MA21"}, "2": {"q": "b", "bncc": "EF09MA20"}}
    r = c.post("/verificar/lote", json={"alvo": "EF09MA21", "questoes": q}).json()
    assert r["resumo"] == {"correto": 1, "fvp": 1}


def test_habilidade():
    assert c.get("/habilidade/ef09ma21").json()["anos"] == [9]
    assert c.get("/habilidade/EF09MA99").status_code == 404


def test_ancorar():
    assert c.post("/ancorar", json={"entrada": "Identificar frações equivalentes"}).json()["habilidade"]["codigo"] == "EF05MA04"


def test_componente_desconhecido():
    r = c.post("/verificar", json={"codigo": "EM13CNT101", "alvo": "EM13CNT202", "componente": "Astrologia", "serie": 1})
    assert r.status_code == 422


def test_limites_de_tamanho():
    assert c.post("/verificar", json={"codigo": "A" * 41, "alvo": "EF09MA21"}).status_code == 422
    lote = {"alvo": "EF09MA21", "questoes": {str(i): {"q": "x", "bncc": "EF09MA20"} for i in range(1001)}}
    assert c.post("/verificar/lote", json=lote).status_code == 422
    assert c.post("/ancorar", json={"entrada": "x" * 2001}).status_code == 422


def test_cors_para_qualquer_site():
    r = c.options("/verificar/lote", headers={"Origin": "https://exemplo.com.br", "Access-Control-Request-Method": "POST"})
    assert r.status_code == 200 and r.headers["access-control-allow-origin"] == "*"
