# BNCC Verifica · comandos do dia a dia (rode "make" para ver a lista)
PY := .venv/bin/python

.PHONY: ajuda instalar testar api pagina dados

ajuda:
	@echo "make instalar   cria o ambiente e instala tudo"
	@echo "make testar     roda os testes"
	@echo "make api        sobe a API em http://127.0.0.1:8000/docs"
	@echo "make pagina     sobe a página em http://127.0.0.1:8080"
	@echo "make dados      reextrai os códigos do PDF do MEC (fontes_mec/)"

instalar:
	python3 -m venv .venv
	$(PY) -m pip install -q -r requirements-dev.txt -e .

testar:
	$(PY) -m pytest -q

api:
	.venv/bin/uvicorn api.main:app --reload

pagina:
	cd docs && python3 -m http.server 8080 --bind 127.0.0.1

dados:
	$(PY) -I scripts/extrair_codigos.py fontes_mec/BNCC_EI_EF_110518_versaofinal_site.pdf
