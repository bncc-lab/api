// BNCC Verifica · painel da pesquisa (gráficos, CSV, citação e tabela)
// acerto = % das questões com o código pedido; invisível = % dos erros que passam nos filtros
"use strict";
(() => {
  const SERIES = [
    { k: "acerto", nome: "Acertou o código", desc: "% das questões com o código da habilidade pedida" },
    { k: "invisivel", nome: "Erro invisível", desc: "% dos erros que passam nos filtros de formato, existência e domínio" },
  ];
  const ABAS = {
    evolucao: {
      rotulo: "Evolução 2024 a 2026",
      titulo: "O acerto subiu. E quase todo erro que sobrou ficou invisível.",
      fonte: "Modelos da OpenAI, pedindo só a descrição da habilidade. 2.345 a 2.400 questões por modelo.",
      itens: [
        { nome: "GPT-4o-mini", sub: "2024", acerto: 1.9, invisivel: 49.7 },
        { nome: "GPT-4.1-mini", sub: "2025", acerto: 4.2, invisivel: 40.9 },
        { nome: "GPT-5.4-mini", sub: "2026", acerto: 20.5, invisivel: 96.0, destaque: true },
      ],
    },
    todos: {
      rotulo: "Todos os modelos",
      titulo: "Nos modelos mais capazes, o erro que sobra quase sempre passa nos filtros.",
      fonte: "Pedindo só a descrição da habilidade. Os modelos pequenos erram tanto que os filtros pegam quase tudo; isso não é sucesso.",
      itens: [
        { nome: "GPT-4o-mini", sub: "OpenAI", acerto: 1.9, invisivel: 49.7 },
        { nome: "GPT-4.1-mini", sub: "OpenAI", acerto: 4.2, invisivel: 40.9 },
        { nome: "GPT-5.4-mini", sub: "OpenAI", acerto: 20.5, invisivel: 96.0, destaque: true },
        { nome: "Haiku 4.5", sub: "Anthropic", acerto: 11.5, invisivel: 84.7 },
        { nome: "Sonnet 4.6", sub: "Anthropic", acerto: 7.3, invisivel: 92.1 },
        { nome: "Gemma 3 4B", sub: "Google", acerto: 0, invisivel: 7.3 },
        { nome: "Gemma 3 1B", sub: "Google", acerto: 0, invisivel: 0 },
      ],
    },
    estrategias: {
      rotulo: "Jeitos de pedir",
      titulo: "Dar as habilidades à IA faz o acerto saltar de 10% para 88%.",
      fonte: "Claude Haiku 4.5, as mesmas 48 combinações de habilidade, 240 questões por estratégia.",
      itens: [
        { nome: "Só a descrição", sub: "como se costuma pedir", acerto: 10.4, invisivel: 88.4 },
        { nome: "Saída restrita", sub: "só códigos do ano", acerto: 12.5, invisivel: 100 },
        { nome: "Recuperação", sub: "5 habilidades parecidas", acerto: 59.6, invisivel: 37.1 },
        { nome: "Catálogo no pedido", sub: "todas as do ano", acerto: 88.3, invisivel: 100, destaque: true },
      ],
    },
  };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = (v) => v.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "%";
  const calmo = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Dica flutuante
  const dica = document.createElement("div");
  dica.className = "graf-dica"; dica.setAttribute("role", "tooltip"); document.body.appendChild(dica);
  function mostrarDica(el) {
    dica.innerHTML = el.dataset.dica; dica.classList.add("on");
    const r = el.getBoundingClientRect(), d = dica.getBoundingClientRect();
    let x = r.left + r.width / 2 - d.width / 2; x = Math.max(8, Math.min(x, innerWidth - d.width - 8));
    let y = r.top - d.height - 10; if (y < 8) y = r.bottom + 10;
    dica.style.left = x + "px"; dica.style.top = y + "px";
  }
  const esconder = () => dica.classList.remove("on");
  addEventListener("scroll", esconder, { passive: true });

  // Pesquisa: CSV e citação
  const BIB = `@inproceedings{silva2026validbutwrong,
  title     = {Avalia{\c{c}}{\~a}o de verificadores estruturais na atribui{\c{c}}{\~a}o de c{\'o}digos da {BNCC} por modelos de linguagem},
  author    = {Silva, Joyce Beatriz Ferreira da Costa and Barbosa, Jacson Rodrigues and Silva, Fabiane Fernandes da and Mendes, Danylo Bezerra},
  booktitle = {Anais da XIV Escola Regional de Inform{\'a}tica de Goi{\'a}s (ERI-GO)},
  year      = {2026},
  publisher = {Sociedade Brasileira de Computa{\c{c}}{\~a}o}
}`;
  function copiarTexto(txt, msg) {
    const ok = () => { dica.innerHTML = msg; dica.classList.add("on"); dica.style.left = "50%"; dica.style.top = (innerHeight - 70) + "px"; dica.style.transform = "translateX(-50%)";
                       setTimeout(() => { esconder(); dica.style.transform = ""; }, 1800); };
    (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(ok, () => { msg = "Não foi possível copiar. A citação está no README do estudo."; ok(); });
  }
  function baixarCSV() {
    const linhas = [["grupo", "item", "detalhe", "acerto_pct", "erro_invisivel_pct_dos_erros"]];
    for (const [k, a] of Object.entries(ABAS)) if (k !== "evolucao") for (const it of a.itens) linhas.push([a.rotulo, it.nome, it.sub, it.acerto, it.invisivel]);
    const csv = linhas.map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "bncc-verifica-dados.csv"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // Minigráfico de linha (acerto 2024 a 2026)
  function sparkline(vals) {
    const w = 120, h = 40, max = Math.max(...vals), pts = vals.map((v, i) => [6 + i * (w - 12) / (vals.length - 1), h - 6 - (v / max) * (h - 12)]);
    return `<svg class="kpi-spark" viewBox="0 0 ${w} ${h}" aria-hidden="true"><polyline points="${pts.map((p) => p.join(",")).join(" ")}" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>${pts.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="${i === pts.length - 1 ? 4 : 3}" fill="currentColor"/>`).join("")}</svg>`;
  }

  function montar(raiz) {
    let aba = "evolucao", visto = false;
    const est = ABAS.estrategias.itens;
    raiz.innerHTML = `
      <p class="dash-frase">De cada 100 questões do GPT-5.4-mini, <b>76</b> trazem um <mark>erro invisível</mark>: o código parece certo, mas é de outra habilidade.</p>
      <div class="dash-kpis">
        <div class="kpi kpi--alerta">
          <span class="kpi-rot">Erro invisível em 2026</span>
          <strong>96%</strong>
          <span class="kpi-sub">dos erros do GPT-5.4-mini passam nos filtros de formato, existência e domínio</span>
          <span class="kpi-ic">IC 95%: 93,3 a 97,8<br>em 2.345 questões</span>
        </div>
        <div class="kpi">
          <span class="kpi-rot">Acerto, de 2024 a 2026</span>
          <strong class="kpi-faixa">1,9% <span class="kpi-seta">→</span> 20,5%</strong>
          ${sparkline([1.9, 4.2, 20.5])}
          <span class="kpi-sub">melhorou, mas 4 em cada 5 ainda erram</span>
          <span class="kpi-ic">2026, IC 95%: 13,8 a 28,7<br>em 2.345 questões</span>
        </div>
        <div class="kpi kpi--bom">
          <span class="kpi-rot">Com o catálogo no pedido</span>
          <strong>88,3%</strong>
          <span class="kpi-sub">de acerto, contra 10,4% pedindo só a descrição da habilidade</span>
          <span class="kpi-ic">IC 95%: 77,9 a 93,8<br>em 240 questões</span>
        </div>
        <div class="kpi">
          <span class="kpi-rot">Erros invisíveis encontrados</span>
          <strong>5.170</strong>
          <span class="kpi-sub">códigos reais, do ano e componente certos, mas da habilidade errada</span>
          <span class="kpi-ic">em 25.621 questões geradas<br>por 7 modelos de IA</span>
        </div>
      </div>

      <div class="dash-paineis">
        <section class="painel painel--principal" aria-labelledby="pn1">
          <div class="painel-cab">
            <h3 id="pn1">Acerto × erro invisível</h3>
            <div class="sim-abas" role="tablist" aria-label="Escolha o que comparar">${["evolucao", "todos"].map((k) =>
              `<button role="tab" data-aba="${k}" aria-selected="${k === aba}">${ABAS[k].rotulo}</button>`).join("")}</div>
          </div>
          <p class="col-titulo" aria-live="polite"></p>
          <div class="col-leg">${SERIES.map((s) => `<span><i class="sw sw--${s.k}"></i>${s.nome}<small>${s.desc}</small></span>`).join("")}</div>
          <div class="col-rolagem">
            <div class="col-area">
              <div class="col-grade" aria-hidden="true">${[100, 75, 50, 25, 0].map((v) => `<div><span>${v}%</span></div>`).join("")}</div>
              <div class="col-grupos"></div>
            </div>
          </div>
          <p class="sim-fonte"></p>
        </section>

        <section class="painel" aria-labelledby="pn2">
          <div class="painel-cab"><h3 id="pn2">Jeitos de pedir à IA</h3></div>
          <p class="painel-sub">Acerto do código. Claude Haiku 4.5, as mesmas 48 combinações.</p>
          <ul class="hbarras">${est.map((e) => `
            <li class="${e.destaque ? "destaque" : ""}">
              <div class="hb-rot"><b>${esc(e.nome)}</b><small>${esc(e.sub)}</small></div>
              <div class="hb-trilho" tabindex="0" data-dica="<b>${esc(e.nome)}</b><br>Acerto: <b>${fmt(e.acerto)}</b><br><span>Dos erros, ${fmt(e.invisivel)} passaram nos filtros</span>">
                <span class="hb-barra" style="--v:${e.acerto}"></span><span class="hb-val${e.acerto > 70 ? " dentro" : ""}" style="--v:${e.acerto}">${fmt(e.acerto)}</span>
              </div>
            </li>`).join("")}</ul>
          <p class="painel-nota"><b>Restringir a saída não basta:</b> 12,5%, quase igual a não fazer nada. Entregar o catálogo leva a 88,3%.</p>
        </section>
      </div>

      <div class="dash-pesquisa">
        <details class="dash-def">
          <summary>O que é "erro invisível"?</summary>
          <p>É a taxa de <b>falso vínculo plausível</b> (FVP) do artigo: entre os códigos errados, a parcela que passa pelos três filtros estruturais.
          <code>FVP = Pr[ V1 = V2 = V3 = 1 | V4 = 0 ]</code>, em que V1 é formato, V2 existência no catálogo, V3 mesmo componente e ano, e V4 igual ao código pedido.
          Intervalos de 95% por bootstrap BCa, reamostrando as 96 células (4.000 repetições).</p>
        </details>
        <div class="dash-acoes">
          <button type="button" class="btn peq" data-acao="csv">Baixar dados (CSV)</button>
          <button type="button" class="btn peq" data-acao="bib">Copiar citação (BibTeX)</button>
        </div>
        <p class="dash-meta"><b>7</b> modelos de IA · <b>4.220</b> pedidos · <b>25.621</b> questões · <b>96</b> combinações de habilidade</p>
      </div>`;
    const $ = (sel) => raiz.querySelector(sel);
    $('[data-acao="csv"]').addEventListener("click", baixarCSV);
    $('[data-acao="bib"]').addEventListener("click", () => copiarTexto(BIB, "Citação copiada."));
    const ligar = (el) => { el.addEventListener("mouseenter", () => mostrarDica(el)); el.addEventListener("focus", () => mostrarDica(el));
                            el.addEventListener("mouseleave", esconder); el.addEventListener("blur", esconder); };
    raiz.querySelectorAll(".hb-trilho").forEach(ligar);

    function desenhar() {
      const a = ABAS[aba];
      $(".col-titulo").textContent = a.titulo;
      $(".sim-fonte").textContent = a.fonte;
      $(".col-grupos").style.setProperty("--n", a.itens.length);
      $(".col-area").style.minWidth = (a.itens.length * 74) + "px";
      $(".col-grupos").innerHTML = a.itens.map((it) => `
        <div class="col-g${it.destaque ? " col-g--destaque" : ""}">
          <div class="col-barras">${SERIES.map((sr) => `
            <div class="col-b col-b--${sr.k}" style="--v:${it[sr.k]}" tabindex="0"
                 aria-label="${esc(it.nome)}, ${esc(sr.nome)}: ${fmt(it[sr.k])}"
                 data-dica="<b>${esc(it.nome)}</b> <span>${esc(it.sub)}</span><br>${esc(sr.nome)}: <b>${fmt(it[sr.k])}</b><br><span>${esc(sr.desc)}</span>">
              <span class="col-v">${Math.round(it[sr.k])}%</span>
            </div>`).join("")}</div>
          <div class="col-nome">${esc(it.nome)}<small>${esc(it.sub)}</small></div>
        </div>`).join("");
      raiz.querySelectorAll(".col-b").forEach(ligar);
      crescer();
    }
    function crescer() {
      if (!visto || calmo) return;            // sem animação, as barras já estão no tamanho certo
      raiz.classList.remove("animar"); void raiz.offsetWidth;   // reinicia a animação
      raiz.classList.add("animar");
    }
    $(".sim-abas").addEventListener("click", (e) => {
      const b = e.target.closest("[data-aba]"); if (!b || b.dataset.aba === aba) return;
      aba = b.dataset.aba;
      raiz.querySelectorAll(".sim-abas button").forEach((x) => x.setAttribute("aria-selected", String(x === b)));
      desenhar();
    });
    desenhar();
    if (calmo || !("IntersectionObserver" in window)) return;
    const obs = new IntersectionObserver((ents) => {
      if (ents.some((e) => e.isIntersecting)) { obs.disconnect(); visto = true; crescer(); }
    }, { threshold: .25 });
    obs.observe(raiz);
  }

  // Tabela com todos os números (acessibilidade)
  function tabela(alvo) {
    alvo.innerHTML = Object.values(ABAS).filter((a, i) => i > 0).map((a) => `<table class="graf-tabela"><caption>${esc(a.rotulo)}: ${esc(a.fonte)}</caption>
      <thead><tr><th></th>${SERIES.map((s) => `<th>${s.nome} (${s.desc})</th>`).join("")}</tr></thead>
      <tbody>${a.itens.map((it) => `<tr><td>${esc(it.nome)} <span class="muted">(${esc(it.sub)})</span></td>${SERIES.map((s) => `<td>${fmt(it[s.k])}</td>`).join("")}</tr>`).join("")}</tbody></table>`).join("");
  }

  const s = document.getElementById("simulador"), t = document.getElementById("grafTabela");
  if (s) montar(s);
  if (t) tabela(t);
})();
