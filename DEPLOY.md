# Publicação

Tudo cabe em planos gratuitos. Cada opção é independente: escolha uma ou mais.

> [!IMPORTANT]
> Nunca coloque tokens em arquivos do repositório nem os compartilhe. Faça login direto no seu terminal.

## 1. Página no navegador: GitHub Pages (sem servidor)

1. Crie o repositório `bncc-lab/api` e envie este projeto.
2. No GitHub: *Settings > Pages > Build and deployment > Deploy from a branch*, ramo `main`, pasta `/docs`.
3. Em alguns minutos, a página fica em `https://bncc-lab.github.io/api/`.

A página carrega `docs/bncc_codigos.json` e verifica tudo no navegador.

## 2. API: Vercel (Python serverless, API principal)

1. Crie a conta em vercel.com (plano *Hobby*, gratuito; pode entrar com o GitHub).
2. Instale a CLI e faça login: `npm i -g vercel` e `vercel login`.
3. Na pasta do projeto: `vercel` (pré-visualização) e, depois de conferir, `vercel --prod`.
4. Endereço: `https://SEU-PROJETO.vercel.app/docs`.

`vercel.json` redireciona todas as rotas para `api/main.py` (FastAPI). `.vercelignore` deixa de fora testes, PDF e página.
Esta configuração **ainda não foi testada** em uma publicação real: confira a pré-visualização antes do `--prod`.

## 3. API: Hugging Face Spaces (Docker, porta 7860, demonstração)

1. Crie a conta em huggingface.co (gratuita) e, se quiser, uma organização `bncc-lab`.
2. Instale a CLI e faça login: `pip install -U huggingface_hub` e `hf auth login`.
   O token é criado em *Settings > Access Tokens*, com permissão *write*. A CLI antiga `huggingface-cli` foi substituída por `hf`.
3. Crie o Space (SDK **Docker**; o hardware padrão *CPU basic* é gratuito):
   ```bash
   hf repos create SEU_USUARIO/bncc-verifica --type space --sdk docker --public
   ```
4. Envie só o necessário, usando o README com o cabeçalho do Space:
   ```bash
   hf upload SEU_USUARIO/bncc-verifica Dockerfile Dockerfile --repo-type space
   hf upload SEU_USUARIO/bncc-verifica requirements.txt requirements.txt --repo-type space
   hf upload SEU_USUARIO/bncc-verifica bncc_verifica bncc_verifica --repo-type space
   hf upload SEU_USUARIO/bncc-verifica api api --repo-type space
   hf upload SEU_USUARIO/bncc-verifica deploy/huggingface/README.md README.md --repo-type space
   ```
5. Endereço: `https://SEU_USUARIO-bncc-verifica.hf.space/docs`.

No plano gratuito, o Space "dorme" após um período sem uso. A primeira chamada depois disso demora alguns segundos.
O `Dockerfile` foi testado localmente (`docker build` e chamada a `/verificar`).

## Antes de publicar

- [ ] `.venv/bin/python -m pytest -q` passando
- [ ] Nome final definido (repositório, Space, projeto Vercel)
- [ ] Endereço público da API no README (trocar `ENDERECO-DA-API`) e na página (`API_PUBLICA` em `docs/assets/app.js`)
