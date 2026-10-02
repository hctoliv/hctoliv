(function () {
  "use strict";

  var CONTATO = {
    email: "vendas@inovelabor.com.br",
    // WhatsApp oficial da loja (DDI + DDD + número, só dígitos)
    whatsapp: "551127912239"
  };
  var CHAVE = "inovelabor-orcamento";
  var POR_PAGINA = 24;
  var reduzMovimento = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var preco = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };

  function esc(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function normalizar(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  function linkWhats(texto) {
    return "https://wa.me/" + CONTATO.whatsapp + "?text=" + encodeURIComponent(texto || "Olá, InoveLabor! Vim pelo site e gostaria de uma cotação.");
  }

  // ---------- Dados ----------
  // A home usa js/resumo.js (leve). O catálogo completo (js/produtos.js) só carrega quando precisa.
  var RESUMO = window.RESUMO || null;
  var catalogoPromessa = null;
  function carregarCatalogo() {
    if (window.PRODUTOS) return Promise.resolve();
    if (!catalogoPromessa) {
      catalogoPromessa = new Promise(function (ok, erro) {
        var s = document.createElement("script");
        s.src = "js/produtos.js";
        s.onload = ok;
        s.onerror = erro;
        document.head.appendChild(s);
      });
    }
    return catalogoPromessa;
  }
  function categorias() {
    if (RESUMO) return RESUMO.categorias;
    var prods = window.PRODUTOS || [];
    return (window.CATEGORIAS || []).map(function (c) {
      return { id: c.id, nome: c.nome, total: prods.filter(function (p) { return p.categoria === c.id; }).length };
    });
  }
  function nomeCategoria(id) {
    var c = categorias().find(function (x) { return x.id === id; });
    return c ? c.nome : "";
  }
  function acharProduto(sku) {
    var listas = [window.PRODUTOS || [], RESUMO ? RESUMO.destaques : []];
    for (var i = 0; i < listas.length; i++) {
      var p = listas[i].find(function (x) { return x.sku === sku; });
      if (p) return p;
    }
    return null;
  }
  var SIMBOLOS = { vidrarias: "Vd", equipamentos: "Eq", plasticos: "Pl", "inox-ferragens": "Fe", kits: "Kt", consumiveis: "Cs",
    "reagentes-meios": "Rg", "modelos-anatomicos": "Ma", porcelanas: "Po", termometros: "Tm", "papeis-especiais": "Pp" };
  function simbolo(c) {
    if (SIMBOLOS[c.id]) return SIMBOLOS[c.id];
    var n = c.nome.replace(/[^A-Za-zÀ-ú]/g, "");
    return n.charAt(0).toUpperCase() + (n.slice(1).match(/[^aeiouáéíóúãõâêô]/i) || [n.charAt(1)])[0].toLowerCase();
  }

  // ---------- WhatsApp ----------
  $$("[data-whatsapp]").forEach(function (a) { a.href = linkWhats(a.dataset.whatsapp); });

  // ---------- Orçamento ----------
  function lerOrc() { try { return JSON.parse(localStorage.getItem(CHAVE)) || []; } catch (e) { return []; } }
  function salvarOrc(itens) {
    try { localStorage.setItem(CHAVE, JSON.stringify(itens)); } catch (e) { /* armazenamento indisponível */ }
    atualizarContador(itens, true);
  }
  function atualizarContador(itens, animar) {
    var total = itens.reduce(function (s, i) { return s + i.qtd; }, 0);
    $$("[data-orcamento-count]").forEach(function (el) {
      el.textContent = total;
      if (animar) { el.classList.remove("pulsar"); void el.offsetWidth; el.classList.add("pulsar"); }
    });
  }
  function adicionar(sku) {
    var p = acharProduto(sku);
    if (!p) return;
    var itens = lerOrc();
    var item = itens.find(function (i) { return i.sku === sku; });
    if (item) item.qtd += 1;
    else itens.push({ sku: sku, nome: p.nome, qtd: 1, imagem: p.imagem || null });
    salvarOrc(itens);
    renderDrawer();
    toast("Adicionado ao orçamento: " + p.nome);
  }
  function toast(msg) {
    var el = $("#toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast.t);
    toast.t = setTimeout(function () { el.classList.remove("show"); }, 2600);
  }
  var drawer = $("#orcamento");
  function abrirDrawer() { if (drawer) { renderDrawer(); drawer.classList.add("open"); drawer.setAttribute("aria-hidden", "false"); } }
  function fecharDrawer() { if (drawer) { drawer.classList.remove("open"); drawer.setAttribute("aria-hidden", "true"); } }
  function renderDrawer() {
    if (!drawer) return;
    var itens = lerOrc();
    $(".orc-lista", drawer).innerHTML = itens.length ? itens.map(function (i) {
      return '<div class="orc-item" data-sku="' + esc(i.sku) + '">' +
        (i.imagem ? '<img src="' + esc(i.imagem) + '" alt="" loading="lazy">' : "") +
        '<div><strong>' + esc(i.nome) + '</strong><small>Cód. ' + esc(i.sku) + '</small></div>' +
        '<div class="orc-qtd"><button type="button" data-acao="menos" aria-label="Diminuir">−</button><span>' + i.qtd +
        '</span><button type="button" data-acao="mais" aria-label="Aumentar">+</button>' +
        '<button type="button" data-acao="remover" class="orc-remover" aria-label="Remover">✕</button></div></div>';
    }).join("") : '<p class="orc-vazio">Sua lista está vazia. Use "+ Orçamento" nos produtos ou descreva o que precisa em observações.</p>';
  }
  if (drawer) {
    drawer.addEventListener("click", function (e) {
      if (e.target.closest("[data-fechar]")) return fecharDrawer();
      var b = e.target.closest("button[data-acao]");
      if (!b) return;
      var sku = b.closest(".orc-item").dataset.sku;
      var itens = lerOrc();
      var item = itens.find(function (i) { return i.sku === sku; });
      if (b.dataset.acao === "mais") item.qtd += 1;
      if (b.dataset.acao === "menos") item.qtd = Math.max(1, item.qtd - 1);
      if (b.dataset.acao === "remover") itens = itens.filter(function (i) { return i.sku !== sku; });
      salvarOrc(itens);
      renderDrawer();
    });
    $(".form-orc", drawer).addEventListener("submit", function (e) {
      e.preventDefault();
      var f = e.target, itens = lerOrc();
      var texto = "Olá, InoveLabor! Gostaria de um orçamento.\n\nNome: " + f.nome.value +
        (f.empresa.value ? "\nEmpresa/Instituição: " + f.empresa.value : "") +
        "\n\nItens:\n" + (itens.length ? itens.map(function (i) { return "• " + i.qtd + "x " + i.nome + " (cód. " + i.sku + ")"; }).join("\n") : "(sem itens selecionados)") +
        (f.obs.value ? "\n\nObservações: " + f.obs.value : "");
      var viaEmail = e.submitter && e.submitter.value === "email";
      if (viaEmail) location.href = "mailto:" + CONTATO.email + "?subject=" + encodeURIComponent("Orçamento - " + f.nome.value) + "&body=" + encodeURIComponent(texto);
      else window.open(linkWhats(texto), "_blank", "noopener");
    });
  }
  document.addEventListener("click", function (e) {
    var add = e.target.closest("[data-add]");
    if (add) { e.preventDefault(); adicionar(add.dataset.add); return; }
    if (e.target.closest("[data-abrir-orcamento]")) { e.preventDefault(); abrirDrawer(); }
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { fecharDrawer(); fecharMenus(); } });
  atualizarContador(lerOrc(), false);

  // ---------- Topo e menus ----------
  var topo = $(".topo");
  window.addEventListener("scroll", function () { if (topo) topo.classList.toggle("rolou", window.scrollY > 10); }, { passive: true });
  var menu = $(".menu"), toggle = $(".menu-toggle"), drop = $(".menu-drop");
  function fecharMenus() {
    if (drop) { drop.classList.remove("aberto"); $(".menu-link", drop).setAttribute("aria-expanded", "false"); }
    if (menu && toggle) { menu.classList.remove("aberto"); toggle.setAttribute("aria-expanded", "false"); }
  }
  if (toggle) toggle.addEventListener("click", function () {
    var aberto = menu.classList.toggle("aberto");
    toggle.setAttribute("aria-expanded", aberto);
  });
  if (drop) {
    var botaoDrop = $(".menu-link", drop);
    botaoDrop.addEventListener("click", function () {
      var aberto = drop.classList.toggle("aberto");
      botaoDrop.setAttribute("aria-expanded", aberto);
    });
    var desktop = window.matchMedia("(min-width: 861px)");
    drop.addEventListener("mouseenter", function () { if (desktop.matches) drop.classList.add("aberto"); });
    drop.addEventListener("mouseleave", function () { if (desktop.matches) drop.classList.remove("aberto"); });
  }
  if (menu) menu.addEventListener("click", function (e) { if (e.target.closest("a")) fecharMenus(); });

  function preencherMenus() {
    var cats = categorias();
    var mega = $("#menu-categorias");
    if (mega) mega.innerHTML = cats.map(function (c) {
      return '<a href="produtos.html#' + esc(c.id) + '"><span class="mega-simbolo">' + esc(simbolo(c)) + '</span><span>' + esc(c.nome) + '<small>' + c.total + ' itens</small></span></a>';
    }).join("") + '<a href="produtos.html"><span class="mega-simbolo" style="background:var(--ambar);color:var(--tinta)">∑</span><span>Todos os produtos<small>ver catálogo</small></span></a>';
    var rod = $("#rodape-categorias");
    if (rod) rod.innerHTML = cats.slice(0, 7).map(function (c) { return '<li><a href="produtos.html#' + esc(c.id) + '">' + esc(c.nome) + '</a></li>'; }).join("") +
      '<li><a href="produtos.html">Todos os produtos</a></li>';
  }

  // ---------- Card de produto ----------
  function card(p) {
    var cat = nomeCategoria(p.categoria);
    var foto = p.imagem ? '<img src="' + esc(p.imagem) + '" alt="" loading="lazy" decoding="async" width="300" height="300">' : '<span class="icone">🔬</span>';
    var thumb = p.url ? '<a class="produto-thumb" href="' + esc(p.url) + '" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true">' + foto : '<div class="produto-thumb">' + foto;
    thumb += (p.disponivel === false ? '<span class="produto-selo">Sob consulta</span>' : "") + (p.url ? "</a>" : "</div>");
    var valor = typeof p.preco === "number" && p.preco > 0
      ? '<div class="produto-preco">' + (p.precoDe ? "<s>" + preco.format(p.precoDe) + "</s>" : "") + "<strong>" + preco.format(p.preco) + "</strong><small>à vista</small></div>"
      : '<p class="produto-consulta">Preço sob consulta</p>';
    var nome = p.url ? '<a href="' + esc(p.url) + '" target="_blank" rel="noopener">' + esc(p.nome) + "</a>" : esc(p.nome);
    return '<article class="produto">' + thumb +
      '<div class="produto-corpo"><span class="produto-tag">' + esc(cat) + (p.marca ? " · " + esc(p.marca) : "") + "</span>" +
      "<h3>" + nome + "</h3>" + valor +
      '<div class="produto-acoes">' +
      (p.url && p.disponivel !== false ? '<a class="btn btn-escuro btn-mini" href="' + esc(p.url) + '" target="_blank" rel="noopener">Comprar</a>' : "") +
      '<button type="button" class="btn btn-linha btn-mini" data-add="' + esc(p.sku) + '">+ Orçamento</button></div></div></article>';
  }

  // ---------- Home ----------
  function montarHome() {
    if (!RESUMO) return;
    $$("[data-total-produtos]").forEach(function (el) { el.textContent = RESUMO.totalProdutos; });
    $$("[data-total-marcas]").forEach(function (el) { el.textContent = RESUMO.totalMarcas; });

    // Tabela periódica: a maior linha em destaque, as demais em elementos, e um elemento de CTA
    var tabela = $("#tabela");
    if (tabela) {
      var cores = ["var(--verde)", "var(--tinta)", "#13606a", "#1d8f7f"];
      var cats = RESUMO.categorias;
      tabela.innerHTML = cats.map(function (c, i) {
        var grande = i === 0;
        return '<a class="elemento' + (grande ? " elemento-grande" : "") + '" href="produtos.html#' + esc(c.id) + '" style="--i:' + i + ";--cor:" + cores[i % cores.length] + '">' +
          '<span class="elemento-num">' + c.total + "</span>" +
          '<span class="elemento-simbolo">' + esc(simbolo(c)) + "</span>" +
          '<span class="elemento-nome">' + esc(c.nome) + "</span>" +
          (c.imagem ? '<img src="' + esc(c.imagem) + '" alt="" loading="' + (grande ? "eager" : "lazy") + '" decoding="async">' : "") + "</a>";
      }).join("") +
        '<a class="elemento elemento-cta" style="--i:' + cats.length + ';grid-column:span 2;aspect-ratio:auto" data-whatsapp href="' + linkWhats("Olá, InoveLabor! Não encontrei um item no site e gostaria de uma cotação.") + '" target="_blank" rel="noopener">' +
        "<strong>+50 mil</strong><span>itens sob consulta. Cotar no WhatsApp →</span></a>";
    }

    var marcas = $("#marcas");
    if (marcas && RESUMO.marcas.length) {
      var faixa = RESUMO.marcas.map(function (m) { return "<span>" + esc(m) + "</span>"; }).join("");
      marcas.innerHTML = faixa + faixa.replace(/<span>/g, '<span aria-hidden="true">');
    }

    var dest = $("#destaques");
    if (dest) dest.innerHTML = RESUMO.destaques.map(card).join("");
    $$("[data-rolar]").forEach(function (b) {
      b.addEventListener("click", function () { dest.scrollBy({ left: dest.clientWidth * 0.8 * Number(b.dataset.rolar), behavior: "smooth" }); });
    });

    $$(".publico").forEach(function (a) {
      var c = RESUMO.categorias.find(function (x) { return x.id === a.dataset.cat; });
      if (!c) return;
      if (c.imagem) $(".publico-foto", a).innerHTML = '<img src="' + esc(c.imagem) + '" alt="" loading="lazy" decoding="async">';
      var num = $("[data-conta]", a);
      if (num) num.textContent = c.total;
    });
  }

  // ---------- Busca com sugestões ----------
  function buscar(lista, q) {
    var termos = normalizar(q).split(/\s+/).filter(Boolean);
    if (!termos.length) return lista.slice();
    return lista.filter(function (p) {
      var alvo = p._busca || (p._busca = normalizar(p.nome + " " + (p.marca || "") + " " + nomeCategoria(p.categoria) + " " + p.sku + " " + (p.desc || "")));
      return termos.every(function (t) { return alvo.indexOf(t) !== -1; });
    });
  }
  $$("[data-busca]").forEach(function (form) {
    var input = $("input", form), caixa = $(".sugestoes", form), timer;
    function fechar() { if (caixa) caixa.hidden = true; }
    function sugerir() {
      var q = input.value.trim();
      if (q.length < 2) return fechar();
      carregarCatalogo().then(function () {
        var achados = buscar(window.PRODUTOS || [], q);
        caixa.innerHTML = achados.length
          ? achados.slice(0, 6).map(function (p) {
              return '<a href="' + esc(p.url || "produtos.html?q=" + encodeURIComponent(q)) + '"' + (p.url ? ' target="_blank" rel="noopener"' : "") + '>' +
                (p.imagem ? '<img src="' + esc(p.imagem) + '" alt="" loading="lazy">' : "") +
                "<span><strong>" + esc(p.nome) + "</strong><small>" + (p.preco ? preco.format(p.preco) + " à vista" : "Sob consulta") + "</small></span></a>";
            }).join("") + '<a class="ver-todos" href="produtos.html?q=' + encodeURIComponent(q) + '">Ver todos os ' + achados.length + " resultados →</a>"
          : '<p>Nada encontrado para "' + esc(q) + '". <a href="' + linkWhats("Olá! Procuro: " + q) + '" target="_blank" rel="noopener">Pedir cotação no WhatsApp →</a></p>';
        caixa.hidden = false;
      }).catch(fechar);
    }
    if (caixa) {
      input.addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(sugerir, 140); });
      input.addEventListener("focus", function () { carregarCatalogo().catch(function () {}); if (input.value.trim().length >= 2) sugerir(); });
      document.addEventListener("click", function (e) { if (!form.contains(e.target)) fechar(); });
      input.addEventListener("keydown", function (e) { if (e.key === "Escape") fechar(); });
    }
  });

  // ---------- Catálogo ----------
  function montarCatalogo() {
    var grade = $("#catalogo");
    if (!grade) return;
    var filtros = $("#filtros"), busca = $("#busca"), resumo = $("#catalogo-resumo"), ordem = $("#ordem"), soDisp = $("#so-disponiveis"), mais = $("#mais");
    var params = new URLSearchParams(location.search);
    var cats = categorias();
    var ativa = location.hash.slice(1) || params.get("categoria") || "todas";
    if (!cats.some(function (c) { return c.id === ativa; })) ativa = "todas";
    busca.value = params.get("q") || "";
    var mostrar = POR_PAGINA;
    var prods = window.PRODUTOS || [];

    filtros.innerHTML = '<p class="filtros-titulo">Linhas</p>' +
      '<button type="button" class="chip" data-cat="todas">Todas <small>' + prods.length + "</small></button>" +
      cats.map(function (c) { return '<button type="button" class="chip" data-cat="' + esc(c.id) + '">' + esc(c.nome) + " <small>" + c.total + "</small></button>"; }).join("");

    function render() {
      $$(".chip", filtros).forEach(function (b) { b.classList.toggle("ativo", b.dataset.cat === ativa); });
      var lista = buscar(prods, busca.value).filter(function (p) {
        return (ativa === "todas" || p.categoria === ativa) && (!soDisp.checked || p.disponivel !== false);
      });
      var o = ordem.value;
      if (o === "menor") lista.sort(function (a, b) { return (a.preco || 1e12) - (b.preco || 1e12); });
      if (o === "maior") lista.sort(function (a, b) { return (b.preco || 0) - (a.preco || 0); });
      if (o === "az") lista.sort(function (a, b) { return a.nome.localeCompare(b.nome, "pt-BR"); });
      resumo.textContent = lista.length + (lista.length === 1 ? " produto" : " produtos") + (ativa !== "todas" ? " em " + nomeCategoria(ativa) : "");
      grade.innerHTML = lista.length ? lista.slice(0, mostrar).map(card).join("")
        : '<div class="catalogo-vazio">Nada encontrado com esses filtros. Trabalhamos com mais de 50 mil itens: <a href="' +
          linkWhats("Olá! Procuro: " + busca.value) + '" target="_blank" rel="noopener">peça uma cotação no WhatsApp →</a></div>';
      mais.hidden = lista.length <= mostrar;
      mais.textContent = "Mostrar mais (" + Math.max(0, lista.length - mostrar) + " restantes)";
    }
    filtros.addEventListener("click", function (e) {
      var b = e.target.closest(".chip");
      if (!b) return;
      ativa = b.dataset.cat;
      mostrar = POR_PAGINA;
      history.replaceState(null, "", location.pathname + location.search + (ativa === "todas" ? "" : "#" + ativa));
      render();
      grade.scrollIntoView({ behavior: reduzMovimento ? "auto" : "smooth", block: "start" });
    });
    var t;
    busca.addEventListener("input", function () { clearTimeout(t); t = setTimeout(function () { mostrar = POR_PAGINA; render(); }, 120); });
    ordem.addEventListener("change", render);
    soDisp.addEventListener("change", function () { mostrar = POR_PAGINA; render(); });
    mais.addEventListener("click", function () { mostrar += POR_PAGINA; render(); });
    window.addEventListener("hashchange", function () {
      var h = location.hash.slice(1);
      if (cats.some(function (c) { return c.id === h; })) { ativa = h; render(); }
    });
    render();
  }

  // ---------- Revelação ao rolar ----------
  function revelar() {
    var alvos = $$(".revelar");
    if (!("IntersectionObserver" in window) || reduzMovimento) return alvos.forEach(function (el) { el.classList.add("visivel"); });
    var obs = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("visivel"); obs.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    alvos.forEach(function (el) { obs.observe(el); });
  }

  // ---------- FAQ e formulário ----------
  $$(".faq-item").forEach(function (d) {
    d.addEventListener("toggle", function () { if (d.open) $$(".faq-item[open]").forEach(function (o) { if (o !== d) o.open = false; }); });
  });
  var formContato = $("#form-contato");
  if (formContato) formContato.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.target;
    window.open(linkWhats("Olá, InoveLabor! Sou " + f.nome.value + (f.empresa.value ? " (" + f.empresa.value + ")" : "") + ".\n\n" + f.mensagem.value), "_blank", "noopener");
  });
  var ano = $("#ano");
  if (ano) ano.textContent = new Date().getFullYear();

  // ---------- Início ----------
  function iniciar() {
    preencherMenus();
    montarHome();
    montarCatalogo();
    revelar();
  }
  if ($("#catalogo") && !window.PRODUTOS) carregarCatalogo().then(iniciar, iniciar);
  else iniciar();
})();
