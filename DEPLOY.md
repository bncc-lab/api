# Publicação

Tudo roda em planos gratuitos.

| O quê | Onde | Endereço |
|---|---|---|
| API | Vercel | https://bncc-verifica.vercel.app ([documentação](https://bncc-verifica.vercel.app/docs)) |
| Página (principal) | GitHub Pages | https://bncc-lab.github.io/api/ |
| Página (vitrine) | Hugging Face, Space estático | https://huggingface.co/spaces/Joycebeatriz/bncc-verifica |

> [!IMPORTANT]
> Nunca coloque tokens em arquivos do repositório nem os compartilhe. Faça login direto no seu terminal ou no site.

## 1. Página: GitHub Pages

*Settings > Pages > Deploy from a branch*, ramo `main`, pasta `/docs`. Cada envio ao `main` atualiza a página.
A conferência roda no navegador (`docs/bncc_codigos.json`); o console "teste ao vivo" chama a API pública definida em `API_PUBLICA` (`docs/assets/app.js`).

## 2. API: Vercel

1. Na Vercel, *Add New > Project*, importe `bncc-lab/api` (o app da Vercel precisa estar instalado na organização no GitHub).
2. A Vercel detecta o modo **FastAPI** e usa `api/main.py`. Não é preciso `vercel.json`.
3. Cada envio ao `main` publica de novo, sozinho.

O `.vercelignore` deixa de fora o `pyproject.toml`: assim a Vercel instala as dependências pelo `requirements.txt` (o pacote Python não exige FastAPI).

## 3. Página no Hugging Face (Space estático)

Spaces com **Docker** (que rodam uma API) exigem a assinatura PRO; os **estáticos** são gratuitos. Por isso o Space publica só a página, que usa a API da Vercel.

```bash
pip install -U "huggingface_hub[cli]" && hf auth login
hf repos create SEU_USUARIO/bncc-verifica --type space --space-sdk static
hf upload SEU_USUARIO/bncc-verifica PASTA_COM_O_CONTEUDO_DE_docs . --repo-type space
```

A pasta enviada leva o conteúdo de `docs/` (sem `capturas/`) e um `README.md` com o cabeçalho do Space (`sdk: static`).

## Rodar a API com Docker (opcional)

O `Dockerfile` sobe a API na porta 7860 em qualquer serviço que aceite contêineres:

```bash
docker build -t bncc-verifica . && docker run -p 7860:7860 bncc-verifica
```
