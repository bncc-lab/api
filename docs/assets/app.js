// BNCC Verifica · ferramenta da página (verificação no navegador, explorador e exemplos da API)
"use strict";
const RE_V1 = /^(EF\d{2}[A-Z]{2}\d{2}|EM13(?:[A-Z]{3}\d{3}|LP\d{2})|EI\d{2}[A-Z]{2}\d{2})$/;
const RE_DENTRO = /(EF\d{2}[A-Z]{2}\d{2}|EM13(?:[A-Z]{3}\d{3}|LP\d{2})|EI\d{2}[A-Z]{2}\d{2})/g;
const CAMPOS = ["bncc", "codigo", "codigo_bncc", "code", "habilidade"];
const ROTULO = { correto: "correto", fvp: "erro invisível", fora_do_dominio: "outro ano ou componente",
                 inexistente: "inexistente", malformado: "código mal escrito", aprovado_sem_alvo: "sem habilidade pedida" };
let CAT = null;

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const norm = (c) => String(c ?? "").trim().toUpperCase();

function noDominio(h, a) {
  if (!a) return null;
  if (h.etapa !== a.etapa || h.sigla !== a.sigla) return false;
  if (h.anos && a.anos) return h.anos.some((x) => a.anos.includes(x));
  return true;
}

function verificar(bruto, alvo) {
  const cod = norm(bruto), a = CAT.get(alvo);
  const v1 = RE_V1.test(cod), h = v1 ? CAT.get(cod) : null, v2 = !!h;
  const d = v2 ? noDominio(h, a) : false;
  let nivel;
  if (!v1) nivel = "malformado";
  else if (!v2) nivel = "inexistente";
  else if (d === null) nivel = "aprovado_sem_alvo";
  else if (!d) nivel = "fora_do_dominio";
  else nivel = cod === alvo ? "correto" : "fvp";
  let exp;
  switch (nivel) {
    case "correto": exp = "É o código da habilidade pedida."; break;
    case "fvp": exp = `Erro invisível: existe e é do mesmo ano e componente, mas é outra habilidade, não ${alvo}.`; break;
    case "fora_do_dominio": exp = `Existe, mas é de outro ano ou componente (${h.componente}).`; break;
    case "inexistente": exp = "Parece um código, mas não existe na BNCC: a IA inventou."; break;
    case "malformado": {
      const m = cod.match(RE_DENTRO);
      exp = "Está fora do padrão dos códigos da BNCC." + (m && m.length === 1 ? ` Talvez seja ${m[0]}.` : "");
      break;
    }
    default: exp = "Sem a habilidade pedida, não dá para saber se está certo.";
  }
  return { cod, nivel, exp, h };
}

function lerQuestoes(txt) {
  txt = txt.trim();
  if (!txt) return [];
  let dados;
  try { dados = JSON.parse(txt); }
  catch { return txt.split(/\n+/).map((l, i) => ({ id: String(i + 1), q: "", bncc: l.trim() })); }
  if (dados && Array.isArray(dados.itens)) dados = dados.itens;
  if (Array.isArray(dados)) return dados.map((v, i) => typeof v === "object" ? { id: String(i + 1), ...v } : { id: String(i + 1), bncc: v });
  if (dados && typeof dados === "object") return Object.entries(dados).map(([k, v]) => typeof v === "object" ? { id: k, ...v } : { id: k, bncc: v });
  throw new Error("Formato não reconhecido.");
}

const EXEMPLO = `{
  "1": {"q": "Qual elemento do gráfico pode induzir a erro de leitura?", "bncc": "EF09MA21"},
  "2": {"q": "Dois eventos são independentes quando...", "bncc": "EF09MA20"},
  "3": {"q": "Resolva a equação de 1º grau...", "bncc": "EF07MA18"},
  "4": {"q": "Interprete o gráfico...", "bncc": "EF09MA99"},
  "5": {"q": "Observe a tabela...", "bncc": "EF9MA21"}
}`;
const ORDEM = ["correto", "fvp", "fora_do_dominio", "inexistente", "malformado", "aprovado_sem_alvo"];
let ULTIMO = null;
const semAcento = (t) => String(t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function rotuloAno(h) {
  if (h.etapa === "Educação Infantil") return h.faixa_etaria || "Educação Infantil";
  if (h.etapa === "Ensino Médio") return "Ensino Médio";
  const a = h.anos || [];
  if (!a.length) return "Ensino Fundamental";
  return a.length === 1 ? `${a[0]}º ano` : `${a[0]}º ao ${a[a.length - 1]}º ano`;
}

// Habilidade escolhida
function definirAlvo(cod) {
  $("alvo").value = norm(cod);
  mostrarAlvo();
}
function mostrarAlvo() {
  const cod = norm($("alvo").value), a = CAT && CAT.get(cod), linha = $("alvoTexto"), pill = $("pill");
  $("pillTxt").textContent = cod || "Escolher habilidade";
  pill.classList.toggle("vazio", !cod);
  if (!CAT) return;
  if (a) { linha.className = "alvo-linha"; linha.innerHTML = `<b class="alvo-linha__cab">${esc(a.codigo)} · ${esc(a.componente)}, ${esc(rotuloAno(a))}</b><span class="alvo-linha__txt">${esc(a.texto)}</span>`; }
  else if (cod) { linha.className = "alvo-linha erro"; linha.textContent = "Esse código não existe na BNCC. Clique nele para escolher outra habilidade."; }
  else { linha.className = "alvo-linha"; linha.textContent = "É com ela que cada questão será comparada. Não sabe o código? Busque pelo assunto."; }
}

// Explorador
const EX = { etapa: "", comp: "", ano: "" };
function abrirExplorador() {
  const d = $("explorador");
  if (!d.open) d.showModal();
  $("exBusca").value = ""; listar(); setTimeout(() => $("exBusca").focus(), 50);
}
function preencherComp() {
  const sel = $("exComp"), comps = new Set();
  for (const h of CAT.values()) if (!EX.etapa || h.etapa === EX.etapa) comps.add(h.componente);
  sel.innerHTML = `<option value="">${EX.etapa === "Educação Infantil" ? "Todos os campos de experiência" : EX.etapa === "Ensino Médio" ? "Todas as áreas" : "Todos os componentes"}</option>` +
    [...comps].sort((a, b) => a.localeCompare(b, "pt")).map((c) => `<option ${c === EX.comp ? "selected" : ""}>${esc(c)}</option>`).join("");
  if (EX.comp && !comps.has(EX.comp)) EX.comp = "";
}
function preencherAno() {
  const box = $("exAno");
  let ops = [];
  if (EX.etapa === "Ensino Fundamental") ops = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => [String(n), `${n}º ano`]);
  else if (EX.etapa === "Educação Infantil") {
    const f = new Set(); for (const h of CAT.values()) if (h.etapa === "Educação Infantil" && h.faixa_etaria) f.add(h.faixa_etaria);
    ops = [...f].map((x) => [x, x]);
  }
  if (!ops.some(([v]) => v === EX.ano)) EX.ano = "";
  box.innerHTML = ops.length ? [["", "Todos"], ...ops].map(([v, t]) => `<button data-v="${esc(v)}" aria-pressed="${v === EX.ano}">${esc(t)}</button>`).join("") : "";
}
function listar() {
  if (!CAT) return;
  preencherComp(); preencherAno();
  const termo = semAcento($("exBusca").value).trim();
  if (!termo && !EX.etapa && !EX.comp) {
    const sug = ["frações", "gráficos", "plantas", "leitura", "probabilidade", "Revolução Industrial"];
    $("exCont").textContent = "";
    $("exLista").innerHTML = `<li class="ex-vazio">Experimente buscar por: ${sug.map((x) => `<button type="button" class="ex-sug" data-sug="${esc(x)}">${esc(x)}</button>`).join(" ")}<br>ou escolha uma etapa acima para ver todas as habilidades.</li>`;
    $("exLista").querySelectorAll("[data-sug]").forEach((b) => b.addEventListener("click", (e) => { e.stopPropagation(); $("exBusca").value = b.dataset.sug; listar(); }));
    return;
  }
  const ehCodigo = /^(e[fmi]\d*[a-z]*\d*)$/.test(termo.replace(/\s/g, "")) && /\d/.test(termo);
  const palavras = termo.split(/\s+/).filter((p) => p.length > 2);
  let res = [];
  for (const h of CAT.values()) {
    if (EX.etapa && h.etapa !== EX.etapa) continue;
    if (EX.comp && h.componente !== EX.comp) continue;
    if (EX.ano) {
      if (h.etapa === "Ensino Fundamental" && !(h.anos || []).includes(Number(EX.ano))) continue;
      if (h.etapa === "Educação Infantil" && h.faixa_etaria !== EX.ano) continue;
    }
    let pts = 1;
    if (termo) {
      if (ehCodigo) pts = h.codigo.toLowerCase().startsWith(termo.replace(/\s/g, "")) ? 1 : 0;
      else { const t = semAcento(h.texto + " " + h.componente); pts = palavras.length ? palavras.reduce((s, p) => s + (t.includes(p) ? 1 : 0), 0) : 0; }
    }
    if (pts) res.push([pts, h]);
  }
  res.sort((a, b) => b[0] - a[0] || a[1].codigo.localeCompare(b[1].codigo));
  const N = 80;
  $("exCont").textContent = res.length ? `${res.length.toLocaleString("pt-BR")} habilidade${res.length > 1 ? "s" : ""}${res.length > N ? `. Aqui estão as ${N} primeiras. Refine a busca para achar mais rápido.` : ". Clique em uma para escolher."}` : "";
  $("exLista").innerHTML = res.length ? res.slice(0, N).map(([, h]) =>
    `<li tabindex="0" role="option" data-cod="${esc(h.codigo)}"><div><code>${esc(h.codigo)}</code></div><div><div class="meta">${esc(h.componente)} · ${esc(rotuloAno(h))}</div><div class="txt">${esc(h.texto)}</div></div></li>`).join("")
    : `<li class="ex-vazio">Nenhuma habilidade encontrada. Tente outra palavra ou tire um filtro.</li>`;
}
function escolherDoExplorador(cod) {
  if (!cod) return;
  definirAlvo(cod); $("explorador").close();
  if ($("questoes").value.trim()) { executar(); toast(`Habilidade ${cod} escolhida. Conferi de novo as questões.`); }
  else { toast(`Habilidade ${cod} escolhida.`); $("questoes").focus(); }
}

// Verificação e resultado
// Leitura do que foi colado: JSON como o modelo devolveu, ou texto livre com códigos no meio
function lerEntrada(txt) {
  txt = String(txt || "").trim();
  if (!txt) return [];
  try { JSON.parse(txt); return lerQuestoes(txt); } catch { } // não é JSON: segue como texto
  const itens = [];
  txt.split(/\n+/).forEach((linha) => {
    const l = linha.trim();
    if (!l) return;
    const achados = l.toUpperCase().match(RE_DENTRO);
    if (achados) {
      const resto = l.replace(new RegExp(RE_DENTRO.source, "gi"), "").replace(/[(\[]\s*[)\]]/g, "")
        .replace(/\s+([:.,;])/g, "$1").replace(/\s{2,}/g, " ").replace(/^[\s:.,;\-]+|[\s:.,;\-]+$/g, "");
      achados.forEach((c) => itens.push({ id: String(itens.length + 1), q: resto, bncc: c }));
    } else if (!/\s/.test(l) && l.length <= 16) {
      itens.push({ id: String(itens.length + 1), q: "", bncc: l });   // tentativa de código, ex.: EF9MA21
    }
  });
  return itens;
}

function oQueFazer(nivel, alvo) {
  if (!alvo || !CAT.get(alvo)) {
    if (nivel === "inexistente") return "Esse código não existe na BNCC.<small>A IA inventou esse código.</small>";
    if (nivel === "malformado") return "Esse código está escrito errado.<small>Está fora do padrão dos códigos da BNCC.</small>";
    if (nivel !== "aprovado_sem_alvo") return "Escolha a habilidade pedida, logo acima, para saber o que fazer.";
  }
  switch (nivel) {
    case "correto": return "Tudo certo.";
    case "fvp": return `<b>Troque por ${esc(alvo)}</b> e releia a questão.<small>O código existe e é do mesmo ano e componente, mas é de outra habilidade.</small>`;
    case "fora_do_dominio": return `<b>Troque por ${esc(alvo)}</b> e releia a questão.<small>O código é de outro ano ou componente. O conteúdo pode não ser o pedido.</small>`;
    case "inexistente": return `<b>Troque por ${esc(alvo)}</b>.<small>A IA inventou esse código.</small>`;
    case "malformado": return `<b>Troque por ${esc(alvo)}</b>.<small>O código foi escrito errado.</small>`;
    default: return "Escolha a habilidade pedida, logo acima, para saber se está certo.";
  }
}
function pedidoIA() {
  const a = CAT && CAT.get(norm($("alvo").value));
  if (!a) { toast("Primeiro, escolha a habilidade que você quer pedir."); abrirExplorador(); return; }
  const onde = a.etapa === "Ensino Fundamental" ? `para o ${rotuloAno(a)} do Ensino Fundamental` : a.etapa === "Ensino Médio" ? "para o Ensino Médio" : `para a Educação Infantil (${rotuloAno(a)})`;
  const txt = `Gere 5 questões objetivas de ${a.componente} ${onde}.\nTodas as questões devem avaliar a seguinte habilidade da BNCC:\n"${a.texto}"\nIndique em cada questão o código da BNCC correspondente a essa habilidade.\nResponda apenas com um JSON no formato {"1": {"q": "enunciado", "a": ["alternativa 1", "alternativa 2", "alternativa 3", "alternativa 4"], "c": 1, "bncc": "código"}, ...}`;
  copiar(txt, "Pedido copiado. Cole no ChatGPT e traga a resposta para a caixa.");
}
function ajudaVazia() {
  $("res").innerHTML = `<div class="res-card ajuda-vazia"><div class="ver-topo"><img class="humor humor--ilustra" src="assets/ilustracoes/papeis-voando.svg" alt=""><div><p class="veredito atencao">Não há código para conferir.</p><p class="veredito-sub">Cole na caixa a resposta da IA com os códigos da BNCC. Ainda não tem uma? Escolha um caminho:</p></div></div>
    <div class="caminhos">
      <button class="caminho" data-acao="exemplo"><b>Testar com um exemplo</b><span>Veja na hora como a conferência funciona, com 5 questões de Matemática do 9º ano.</span></button>
      <button class="caminho" data-acao="pedido"><b>Pedir questões à IA</b><span>Copiamos um pedido pronto. Cole no ChatGPT, copie a resposta e cole na caixa.</span></button>
    </div></div>`;
  $("res").querySelector('[data-acao="exemplo"]').addEventListener("click", usarExemplo);
  $("res").querySelector('[data-acao="pedido"]').addEventListener("click", pedidoIA);
  $("res").scrollIntoView({ behavior: "smooth", block: "start" });
}
function usarExemplo() { definirAlvo("EF09MA21"); $("questoes").value = EXEMPLO; executar(); }

function toast(msg) {
  const t = $("toast"); t.textContent = msg; t.classList.add("on");
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("on"), 2200);
}
function copiar(texto, msg) {
  (navigator.clipboard ? navigator.clipboard.writeText(texto) : Promise.reject())
    .then(() => toast(msg), () => toast("Não deu para copiar. Selecione o texto e copie com Ctrl+C."));
}
function corrigido(alvo) {
  const txt = $("questoes").value.trim();
  let dados;
  try { dados = JSON.parse(txt); } catch { return ULTIMO.rs.map(() => alvo).join("\n"); }
  const trocar = (o) => {
    if (!o || typeof o !== "object") return alvo;
    const campo = CAMPOS.find((c) => o[c] !== undefined) || "bncc";
    return { ...o, [campo]: alvo };
  };
  if (dados && Array.isArray(dados.itens)) dados = { ...dados, itens: dados.itens.map(trocar) };
  else if (Array.isArray(dados)) dados = dados.map(trocar);
  else dados = Object.fromEntries(Object.entries(dados).map(([k, v]) => [k, trocar(v)]));
  return JSON.stringify(dados, null, 2);
}
function relatorio() {
  const { alvo, rs, cont } = ULTIMO, a = CAT.get(alvo);
  return [`BNCC Verifica · habilidade pedida: ${alvo}${a ? " (" + a.componente + ")" : ""}`,
    ORDEM.filter((k) => cont[k]).map((k) => `${ROTULO[k]}: ${cont[k]}`).join(" · "), "",
    ...rs.map(({ it, r }) => `${it.id}. ${r.cod || "(vazio)"}: ${ROTULO[r.nivel]}. ${r.exp}`)].join("\n");
}
function executar() {
  const saida = $("res");
  if (!CAT) return;
  try {
    const alvo = norm($("alvo").value);
    const itens = lerEntrada($("questoes").value);
    if (!itens.length) {
      if ($("questoes").value.trim()) {
        saida.innerHTML = `<div class="res-card"><p class="erro-msg">Não achei nenhum código da BNCC no que você colou. Confira se a resposta da IA traz os códigos (como EF09MA21) e cole de novo.</p></div>`;
        saida.scrollIntoView({ behavior: "smooth", block: "start" }); return;
      }
      ajudaVazia(); return;
    }
    const rs = itens.map((it) => ({ it, r: verificar(CAMPOS.map((c) => it[c]).find((x) => x !== undefined), alvo) }));
    const cont = {};
    rs.forEach(({ r }) => (cont[r.nivel] = (cont[r.nivel] || 0) + 1));
    ULTIMO = { alvo, rs, cont };
    const total = rs.length, ok = cont.correto || 0, semAlvo = cont.aprovado_sem_alvo || 0;
    const errados = total - ok - semAlvo, nFvp = cont.fvp || 0;
    let ver, cls, sub;
    if (!CAT.get(alvo)) {
      const ruins = (cont.inexistente || 0) + (cont.malformado || 0);
      ver = "Falta escolher a habilidade pedida."; cls = "atencao";
      sub = ruins ? `Já deu para ver ${ruins === 1 ? "1 código que não existe ou está mal escrito" : ruins + " códigos que não existem ou estão mal escritos"}. Para saber se os outros estão certos, clique em Escolher habilidade, logo acima.`
                  : "Sem ela, só dá para ver se os códigos existem. Clique em Escolher habilidade, logo acima.";
    }
    else if (semAlvo === total) { ver = "Falta escolher a habilidade pedida."; cls = "atencao"; sub = "Sem ela, só dá para ver se os códigos existem. Clique em Escolher habilidade, logo acima."; }
    else if (!errados) { ver = total === 1 ? "Tudo certo: a questão está com o código pedido." : `Tudo certo: as ${total} questões estão com o código pedido.`; cls = "ok"; sub = "Código certo não garante questão boa. Vale uma leitura rápida para ver se ela avalia mesmo essa habilidade."; }
    else { ver = `${errados} de ${total} ${total === 1 ? "questão está" : "questões estão"} com o código errado.`; cls = nFvp ? "atencao" : "ruim";
           sub = nFvp ? `${nFvp === 1 ? "Uma delas é um erro invisível" : nFvp + " delas são erros invisíveis"}: o código parece certo, mas é de outra habilidade.` : "Veja abaixo o que fazer em cada uma."; }
    const faceis = (cont.fora_do_dominio || 0) + (cont.inexistente || 0) + (cont.malformado || 0);
    const grupos = [[ok, ok === 1 ? "certa" : "certas", "g-ok"], [nFvp, nFvp === 1 ? "erro invisível" : "erros invisíveis", "g-fvp"],
                    [faceis, faceis === 1 ? "erro fácil de ver" : "erros fáceis de ver", "g-ruim"]];
    if (semAlvo) grupos.push([semAlvo, "sem habilidade para comparar", "g-sem"]);
    const cortar = (t, n) => { t = String(t); if (t.length <= n) return t; const c = t.slice(0, n); return c.slice(0, c.lastIndexOf(" ")).replace(/[,;:.]$/, "") + "…"; };
    saida.innerHTML = `<div class="res-card">` +
      `<div class="ver-topo"><svg class="humor" viewBox="0 0 32 32" aria-hidden="true"><use href="#marca-${cls === "ok" ? "certo" : cls === "atencao" ? "atencao" : "errado"}"/></svg><div><p class="veredito ${cls}">${ver}</p><p class="veredito-sub">${sub}</p></div></div>` +
      `<div class="resumo2">${grupos.map(([n, r, c]) => `<span class="grupo ${c}${n ? "" : " zero"}"><b>${n}</b> ${r}</span>`).join("")}</div>` +
      `<div class="lista">` + rs.map(({ it, r }) => { const q = it.q || it.enunciado;
        return `<div class="item ${r.nivel}">` +
        `<div class="num"><svg class="marca" viewBox="0 0 32 32" aria-hidden="true"><use href="#marca-${r.nivel === "correto" ? "certo" : r.nivel === "fvp" || r.nivel === "aprovado_sem_alvo" ? "atencao" : "errado"}"/></svg>${esc(it.id)}</div>` +
        `<div class="item__corpo">` +
          `<p class="item__q">${q ? esc(cortar(q, 160)) : "Questão sem enunciado"}</p>` +
          `<div class="item__cod"><code>${esc(r.cod || "(vazio)")}</code><span class="badge ${r.nivel}">${ROTULO[r.nivel]}</span></div>` +
          `<div class="fazer">${oQueFazer(r.nivel, alvo)}${r.h && r.nivel !== "correto" ? `<small class="item__h"><b>${esc(r.h.codigo)}</b> fala de: ${esc(cortar(r.h.texto, 150))}</small>` : ""}</div>` +
        `</div></div>`; }).join("") + `</div>` +
      `<div class="pos"><h3>E agora?</h3>` +
      (errados && CAT.get(alvo)
        ? `<p>Troque todos os códigos de uma vez pelo da habilidade pedida. Depois, copie as questões corrigidas.</p>
           <div class="acoes"><button id="btnCorrigir" class="btn pri">Corrigir tudo para ${esc(alvo)} <span class="seta">→</span></button><button id="btnRelatorio" class="btn">Copiar relatório</button></div>
           <div id="corrigido" class="corrigido" hidden><textarea id="txtCorrigido" readonly></textarea>
           <div class="acoes"><button id="btnCopiarCorrigido" class="btn pri">Copiar questões corrigidas</button></div>
           <p class="aviso">A correção troca o código, não o conteúdo. Releia as questões marcadas: elas podem estar avaliando outra habilidade.</p></div>`
        : `<p>${errados ? "Escolha a habilidade pedida, logo acima, para poder corrigir." : "Não há nada para corrigir."}</p><div class="acoes"><button id="btnRelatorio" class="btn">Copiar relatório</button></div>`) +
      `</div></div>`;
    $("btnRelatorio").addEventListener("click", () => copiar(relatorio(), "Relatório copiado."));
    if ($("btnCorrigir")) $("btnCorrigir").addEventListener("click", () => {
      $("txtCorrigido").value = corrigido(alvo); $("corrigido").hidden = false; $("txtCorrigido").focus();
      toast(errados === 1 ? `1 código trocado por ${alvo}.` : `${errados} códigos trocados por ${alvo}.`);
    });
    if ($("btnCopiarCorrigido")) $("btnCopiarCorrigido").addEventListener("click", () => copiar($("txtCorrigido").value, "Questões corrigidas copiadas."));
    saida.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (e) {
    saida.innerHTML = `<div class="res-card"><p class="erro-msg">Não deu para ler o que você colou. Cole a resposta inteira da IA ou só os códigos, um por linha. (${esc(e.message)})</p></div>`;
  }
}

// Integração
const LOCAL = ["127.0.0.1", "localhost"].includes(location.hostname);
const API_PUBLICA = "https://bncc-verifica.vercel.app";   // API publicada na Vercel
const API = LOCAL ? "http://127.0.0.1:8000" : API_PUBLICA;
const API_TXT = API || "https://endereço-da-api";
const CODS = {
  curl: `curl -X POST ${API_TXT}/verificar/lote \\
  -H "Content-Type: application/json" \\
  -d '{
    "alvo": "EF09MA21",
    "questoes": {
      "1": {"q": "Qual elemento do gráfico induz a erro?", "bncc": "EF09MA21"},
      "2": {"q": "Dois eventos são independentes quando...", "bncc": "EF09MA20"}
    }
  }'`,
  python: `import requests

resp = requests.post("${API_TXT}/verificar/lote", json={
    "alvo": "EF09MA21",
    "questoes": questoes_geradas_pela_ia,   # o JSON que o modelo devolveu
})
r = resp.json()
print(r["resumo"])            # {'correto': 1, 'fvp': 1}
for q in r["resultados"]:
    if q["nivel"] != "correto":
        print(q["id"], q["explicacao"])`,
  js: `const resp = await fetch("${API_TXT}/verificar", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ codigo: "EF09MA20", alvo: "EF09MA21" }),
});
const r = await resp.json();
if (r.nivel === "fvp") {
  // parece certo, mas é outra habilidade
  console.warn(r.explicacao);
}`,
  ia: `A API publica a especificação OpenAPI em:
  ${API_TXT}/openapi.json

Cole esse endereço no seu agente (ChatGPT, Claude, Cursor...)
e peça: "antes de entregar as questões, verifique os códigos
da BNCC com a ferramenta /verificar/lote".

Documentação interativa: ${API_TXT}/docs`,
};
let ABA = "curl";
function mostrarAba(a) {
  ABA = a; $("codAba").textContent = CODS[a];
  document.querySelectorAll(".abas [data-aba]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.aba === a)));
}
document.querySelectorAll(".abas [data-aba]").forEach((b) => b.addEventListener("click", () => mostrarAba(b.dataset.aba)));
$("copiarCod").addEventListener("click", () => copiar(CODS[ABA], "Código copiado."));
document.querySelectorAll("[data-api-docs]").forEach((a) => { if (API) a.href = API + "/docs"; });
mostrarAba("curl");
if (!API) {
  $("conExec").disabled = true;
  $("conSaida").textContent = "// A API pública entra no ar em breve.\n// Enquanto isso, ela roda no seu computador: veja o README.";
}
$("conExec").addEventListener("click", async () => {
  const out = $("conSaida");
  out.textContent = "// chamando a API...";
  try {
    const r = await fetch(API + "/verificar", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codigo: $("conCodigo").value, alvo: $("conAlvo").value }) });
    const j = await r.json();
    if (j.habilidade && j.habilidade.texto) j.habilidade.texto = j.habilidade.texto.slice(0, 90) + "…";
    out.textContent = `// HTTP ${r.status}\n` + JSON.stringify(j, null, 2);
  } catch (e) {
    out.textContent = "// Não foi possível falar com a API agora.\n// Ela ainda não foi publicada ou está fora do ar.";
  }
});

// Inicialização
fetch("bncc_codigos.json")
  .then((r) => r.json())
  .then((d) => { CAT = new Map(d.habilidades.map((h) => [h.codigo, h])); mostrarAlvo(); })
  .catch(() => { $("res").innerHTML = '<div class="res-card"><p class="erro-msg">Não foi possível carregar os códigos da BNCC. Recarregue a página.</p></div>'; });

$("pill").addEventListener("click", abrirExplorador);
document.querySelectorAll("[data-abrir-explorador]").forEach((b) => b.addEventListener("click", abrirExplorador));
$("exFechar").addEventListener("click", () => $("explorador").close());
$("explorador").addEventListener("click", (e) => { if (e.target === $("explorador")) $("explorador").close(); });
$("exBusca").addEventListener("input", listar);
$("exBusca").addEventListener("keydown", (e) => { if (e.key === "Enter") { const p = $("exLista").querySelector("li[data-cod]"); if (p) escolherDoExplorador(p.dataset.cod); } });
$("exEtapa").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return;
  EX.etapa = b.dataset.v; EX.comp = ""; EX.ano = "";
  $("exEtapa").querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); listar(); });
$("exComp").addEventListener("change", (e) => { EX.comp = e.target.value; listar(); });
$("exAno").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; EX.ano = b.dataset.v; listar(); });
$("exLista").addEventListener("click", (e) => escolherDoExplorador(e.target.closest("li")?.dataset.cod));
$("exLista").addEventListener("keydown", (e) => { if (e.key === "Enter") escolherDoExplorador(e.target.closest("li")?.dataset.cod); });
$("verificar-btn").addEventListener("click", executar);
$("limpar").addEventListener("click", () => { $("questoes").value = ""; $("res").innerHTML = ""; ULTIMO = null; $("questoes").focus(); });
$("btnExemplo2").addEventListener("click", usarExemplo);
$("btnPedido").addEventListener("click", pedidoIA);

// Menu: marca a seção visível
(() => {
  const links = [...document.querySelectorAll(".menu a[href^='#']")];
  const alvos = links.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);
  if (!("IntersectionObserver" in window) || !alvos.length) return;
  const obs = new IntersectionObserver((ents) => {
    ents.forEach((e) => { if (e.isIntersecting) links.forEach((a) => a.classList.toggle("ativo", a.getAttribute("href") === "#" + e.target.id)); });
  }, { rootMargin: "-45% 0px -50% 0px" });
  alvos.forEach((t) => obs.observe(t));
})();
