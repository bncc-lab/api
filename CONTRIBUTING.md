# Como contribuir

Obrigada pelo interesse! O BNCC Verifica é um projeto do [bncc-lab](https://github.com/bncc-lab). Toda participação segue o [Código de Conduta](CODE_OF_CONDUCT.md).

## Relatar um código ou texto da BNCC errado

A extração do PDF oficial é automática e pode errar. Abra uma issue com o modelo **Código ou texto da BNCC errado** e informe:

- o código (por exemplo, `EF09MA21`);
- o que a ferramenta mostra (texto, componente ou anos);
- o que deveria mostrar;
- a página do [documento oficial da BNCC](https://basenacionalcomum.mec.gov.br/) que confirma a correção. O campo `pagina_pdf` de cada habilidade ajuda a achar.

Vale sempre o documento oficial do MEC. Este é um projeto independente, sem vínculo com o MEC.

**Corrija o extrator, não o JSON.** Os arquivos `bncc_codigos.json` são gerados por `scripts/extrair_codigos.py`. Uma correção manual some na próxima extração.

## Sugerir uma melhoria

Abra uma issue com o modelo **Sugerir melhoria**. Explique o problema que a ideia resolve e, se possível, um exemplo de entrada e saída. Para mudanças grandes, converse na issue antes de abrir um pull request.

A página em `docs/` segue o [DESIGN.md](DESIGN.md). A verificação em `docs/assets/app.js` deve dar os mesmos resultados da biblioteca Python.

## Rodar os testes

```bash
python3 -m venv .venv && .venv/bin/pip install -r requirements-dev.txt
.venv/bin/python -m pytest -q
```

Os testes de regressão comparam os vereditos com os registros da pesquisa. Para rodá-los, clone [bncc-lab/bncc-lab](https://github.com/bncc-lab/bncc-lab) ao lado deste repositório ou aponte a variável `BNCC_LAB` para ele. Sem isso, esses testes são pulados.

Para reextrair os códigos, baixe o PDF oficial (URL em `data/bncc_codigos.json`) para `fontes_mec/` e rode:

```bash
.venv/bin/python -I scripts/extrair_codigos.py fontes_mec/BNCC_EI_EF_110518_versaofinal_site.pdf
```

## Estilo

- **Português do Brasil** em textos, comentários, mensagens da API e nomes. O README tem um resumo curto em inglês, e só.
- **Frases curtas** e diretas.
- **Sem travessão nem meia-risca** (os caracteres U+2014 e U+2013). Use dois-pontos, vírgula ou parênteses. Para intervalos, use "a" (1 a 9). Antes de enviar:
  ```bash
  LC_ALL=C grep -rn -e $'\xe2\x80\x93' -e $'\xe2\x80\x94' --include="*.md" --include="*.py" --exclude-dir=.venv .
  ```
- Termo principal: **erro invisível**. O nível `fvp` mantém o nome usado na pesquisa (*falso vínculo plausível*).
- Números no formato brasileiro: vírgula decimal (96,0%) e ponto de milhar (1.580).
- Código Python: siga o estilo dos arquivos existentes. A biblioteca `bncc_verifica` não tem dependências: mantenha assim.

## Pull requests

1. Faça um fork e crie um ramo a partir de `main`.
2. Faça a mudança e rode os testes.
3. Preencha o modelo de pull request.
