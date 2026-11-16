# BNCC Verifica · Design system

**Ideia:** corrigir a lição de casa da IA. Folha de caderno, marcas de correção à mão e marca-texto amarelo. Fundo branco, sem degradê, brilho ou emoji.

## Arquivos

| Arquivo | O que tem |
|---|---|
| `docs/assets/ds.css` | fontes, tokens e componentes |
| `docs/assets/site.css` | layout da página, seção por seção (só usa tokens) |
| `docs/assets/graficos.css` | painel da pesquisa |
| `docs/assets/app.js` | ferramenta (mesma lógica do pacote Python) |
| `docs/assets/graficos.js` | gráficos, CSV, citação e tabela |
| `docs/fonts/` | fontes OFL, hospedadas na própria página |
| `docs/assets/ilustracoes/` | Open Doodles (CC0), recoloridas |

**Regra:** componentes usam os papéis `--c-*`, nunca a cor direta.

## Cores

| Papel | Token | Cor |
|---|---|---|
| Texto | `--c-text` | `#14204a` |
| Texto secundário | `--c-text-muted` | `#59638a` |
| Principal (ações, marca) | `--c-primary` | `#0153b3` |
| Destaque (assinatura, erro invisível) | `--c-accent` | `#fecf02` |
| Certo | `--c-success` | `#607829` |
| Erro | `--c-danger` | `#b81817` |
| Superfície areia | `--c-surface-muted` | `#f7f3ec` |
| Fundo de código | `--c-code-bg` | `#14204a` |

## Tipografia

| Uso | Fonte | Token |
|---|---|---|
| Títulos | Bricolage Grotesque | `--font-display` |
| Texto | Instrument Sans | `--font-body` |
| Anotação à mão | Caveat | `--font-hand` |
| Código | monoespaçada do sistema | `--font-mono` |

Tamanhos: `--text-xs` 13 · `sm` 14 · `md` 16 · `lg` 18 · `xl` 22 · `2xl` e `3xl` fluidos.

## Espaço e forma

- Espaçamento base 4: `--s-1` (4) a `--s-24` (96). Seções: 96 no computador, 64 no celular.
- Raios: `--r-sm` 10 · `--r-md` 16 · `--r-lg` 22 · `--r-pill`.
- `--shadow-signature`: sombra amarela de 6px. **Uma por seção**, só no elemento principal.
- `--shadow-soft`: sombra azul clara, para o que vem depois (ex.: resultado).
- `--marca-texto`: faixa amarela na metade de baixo das letras.
- `--hit`: 44px, altura mínima de toque no celular.

## Componentes

| Componente | Classe | Uso |
|---|---|---|
| Botão | `.btn` · `.pri` · `.peq` · `.btn-link` | **um `.pri` por seção** |
| Etiqueta | `.tag` | acima do título da seção |
| Cabeçalho de seção | `.section-head` | etiqueta + título + texto |
| Cartão | `.card` · `--emphasis` · `--muted` · `--inverse` | contorno, ênfase, areia, azul |
| Selo de resultado | `.badge.correto` · `.fvp` · `.fora_do_dominio` · `.inexistente` · `.malformado` | resultado de cada código |
| Lista ✓/✕ | `.checklist` com `.sim` / `.nao` | comparações |
| Campo | `.campo` | texto e busca |
| Painel de código | `.code-panel` | exemplos e console |
| Abas | `.tabs` | trocar exemplo |
| Aviso | `.toast` | "copiado", "escolhida" |
| Marca-texto | `.marca-texto` | 2 ou 3 palavras de um título |

## Peças da página

| Peça | Classe | Ideia |
|---|---|---|
| Folha corrigida | `.folha` | questões com ✓, ! e ✕ e anotação à mão |
| Habilidade pedida | `.pill-cod` | botão amarelo com o código escolhido |
| Resumo do resultado | `.resumo2` | 3 grupos: certas · erro invisível · erros fáceis de ver |
| Questão a questão | `.item` | enunciado → código e selo → o que fazer |
| Explorador | `dialog` + `.ex-*` | busca por assunto, etapa, componente e ano |

## Página

1. **Topo:** "A habilidade certa em cada questão." + folha corrigida
2. **O erro invisível:** catálogo × BNCC Verifica e as 4 checagens
3. **Conferir:** escolher, colar, conferir e corrigir
4. **Pesquisa:** painel com os números e downloads
5. **API:** console ao vivo, exemplos e rotas
6. **Dúvidas** e **fechamento**

## Texto

Português do Brasil, frases curtas, voz de professora. Sem travessão. "Erro invisível" para o público. "FVP" só para pesquisadores.

## Acessibilidade

Pular para o conteúdo, foco visível, contraste AA, `<dialog>` nativo, `prefers-reduced-motion`, tabela com todos os números do gráfico, alvos de 44px no celular.
