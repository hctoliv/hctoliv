(function () {
  "use strict";

  var CONTATO = {
    email: "vendas@inovelabor.com.br",
    telefone: "(11) 2791-2239",
    // Número do WhatsApp com DDI + DDD, só dígitos. Confirme o número oficial antes de publicar.
    whatsapp: "551127912239"
  };
  var reduzMovimento = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var STORAGE_KEY = "inovelabor-orcamento";

  function esc(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  var formatoPreco = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

  // ---------- Orçamento (lista de itens salva no navegador) ----------
  function lerOrcamento() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch (e) { return []; }
  }
  function salvarOrcamento(itens) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(itens)); } catch (e) { /* armazenamento indisponível */ }
    atualizarContador(itens);
  }
  function atualizarContador(itens) {
    var total = itens.reduce(function (s, i) { return s + i.qtd; }, 0);
    document.querySelectorAll("[data-orcamento-count]").forEach(function (el) {
      el.textContent = total;
      el.hidden = total === 0;
    });
  }
  function adicionarItem(sku) {
    var produto = (window.PRODUTOS || []).find(function (p) { return p.sku === sku; });
    if (!produto) return;
    var itens = lerOrcamento();
    var existente = itens.find(function (i) { return i.sku === sku; });
    if (existente) existente.qtd += 1;
    else itens.push({ sku: sku, nome: produto.nome, qtd: 1 });
    salvarOrcamento(itens);
    renderDrawer();
    toast("“" + produto.nome + "” adicionado ao orçamento");
  }

  function toast(msg) {
    var el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.classList.remove("show"); }, 2600);
  }

  // ---------- Drawer do orçamento ----------
  var drawer = document.getElementById("orcamento");
  function abrirDrawer() { if (drawer) { renderDrawer(); drawer.classList.add("open"); drawer.setAttribute("aria-hidden", "false"); } }
  function fecharDrawer() { if (drawer) { drawer.classList.remove("open"); drawer.setAttribute("aria-hidden", "true"); } }

  function renderDrawer() {
    if (!drawer) return;
    var lista = drawer.querySelector(".orc-lista");
    var itens = lerOrcamento();
    if (!itens.length) {
      lista.innerHTML = '<p class="orc-vazio">Sua lista está vazia. Adicione produtos do catálogo para solicitar um orçamento.</p>';
      return;
    }
    lista.innerHTML = itens.map(function (i) {
      return '<div class="orc-item" data-sku="' + esc(i.sku) + '">' +
        '<div><strong>' + esc(i.nome) + '</strong><small>' + esc(i.sku) + '</small></div>' +
        '<div class="orc-qtd">' +
          '<button type="button" data-acao="menos" aria-label="Diminuir">−</button>' +
          '<span>' + i.qtd + '</span>' +
          '<button type="button" data-acao="mais" aria-label="Aumentar">+</button>' +
          '<button type="button" data-acao="remover" class="orc-remover" aria-label="Remover">✕</button>' +
        '</div></div>';
    }).join("");
  }

  if (drawer) {
    drawer.addEventListener("click", function (e) {
      if (e.target.matches("[data-fechar]")) return fecharDrawer();
      var btn = e.target.closest("button[data-acao]");
      if (!btn) return;
      var sku = btn.closest(".orc-item").dataset.sku;
      var itens = lerOrcamento();
      var item = itens.find(function (i) { return i.sku === sku; });
      if (btn.dataset.acao === "mais") item.qtd += 1;
      if (btn.dataset.acao === "menos") item.qtd = Math.max(1, item.qtd - 1);
      if (btn.dataset.acao === "remover") itens = itens.filter(function (i) { return i.sku !== sku; });
      salvarOrcamento(itens);
      renderDrawer();
    });

    drawer.querySelector("form").addEventListener("submit", function (e) {
      e.preventDefault();
      var itens = lerOrcamento();
      var f = e.target;
      var corpo = "Olá, InoveLabor! Gostaria de solicitar um orçamento.\n\n" +
        "Nome: " + f.nome.value + "\n" +
        "Empresa/Instituição: " + f.empresa.value + "\n" +
        "Telefone: " + f.telefone.value + "\n\n" +
        "Itens:\n" + (itens.length
          ? itens.map(function (i) { return "- " + i.qtd + "x " + i.nome + " (" + i.sku + ")"; }).join("\n")
          : "(nenhum item selecionado)") +
        (f.obs.value ? "\n\nObservações: " + f.obs.value : "");
      window.location.href = "mailto:" + CONTATO.email +
        "?subject=" + encodeURIComponent("Solicitação de orçamento - " + f.nome.value) +
        "&body=" + encodeURIComponent(corpo);
    });
  }

  document.addEventListener("click", function (e) {
    var add = e.target.closest("[data-add]");
    if (add) { adicionarItem(add.dataset.add); return; }
    if (e.target.closest("[data-abrir-orcamento]")) { e.preventDefault(); abrirDrawer(); }
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") fecharDrawer(); });

  // ---------- Menu mobile ----------
  var toggle = document.querySelector(".menu-toggle");
  var nav = document.querySelector(".nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var aberto = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", aberto);
    });
    nav.addEventListener("click", function (e) { if (e.target.tagName === "A") nav.classList.remove("open"); });
  }

  // ---------- Cartão de produto ----------
  function cardProduto(p) {
    var cat = (window.CATEGORIAS || []).find(function (c) { return c.id === p.categoria; }) || {};
    var icone = '<span>' + (cat.icone || "🔬") + '</span>';
    var thumb = p.imagem
      ? '<img src="' + esc(p.imagem) + '" alt="" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement(\'span\'),{textContent:\'' + (cat.icone || "🔬") + '\'}))">'
      : icone;
    var preco = "";
    if (typeof p.preco === "number" && p.preco > 0) {
      preco = '<div class="produto-preco">' +
        (p.precoDe ? '<s>' + formatoPreco.format(p.precoDe) + '</s>' : "") +
        '<strong>' + formatoPreco.format(p.preco) + '</strong>' +
        (window.CATALOGO_ORIGEM === "site" ? '<small>à vista</small>' : "") + '</div>';
    }
    var nome = p.url
      ? '<a href="' + esc(p.url) + '" target="_blank" rel="noopener">' + esc(p.nome) + '</a>'
      : esc(p.nome);
    return '<article class="produto">' +
      '<div class="produto-thumb' + (p.imagem ? " com-foto" : "") + '" aria-hidden="true">' + thumb +
      (p.disponivel === false ? '<span class="produto-selo">Sob consulta</span>' : "") + '</div>' +
      '<span class="produto-tag">' + esc(cat.nome || "") + (p.sub && p.sub !== cat.nome ? ' · ' + esc(p.sub) : "") + '</span>' +
      '<h3>' + nome + '</h3>' +
      '<p>' + esc(p.desc) + '</p>' + preco +
      '<div class="produto-rodape"><small>' + esc(p.sku) + '</small>' +
      '<div class="produto-acoes">' +
      (p.url ? '<a class="btn btn-sm btn-linha" href="' + esc(p.url) + '" target="_blank" rel="noopener">Comprar</a>' : "") +
      '<button type="button" class="btn btn-sm" data-add="' + esc(p.sku) + '">+ Orçamento</button></div></div>' +
      '</article>';
  }

  // Destaques na home
  var destaques = document.getElementById("destaques");
  if (destaques && window.PRODUTOS) {
    var escolhidos = window.PRODUTOS.filter(function (p) { return p.destaque; });
    if (!escolhidos.length) {
      escolhidos = ["IL-EQ-001", "IL-EQ-003", "IL-VD-002", "IL-AC-001", "IL-KT-002", "IL-EQ-009", "IL-RG-006", "IL-EQ-006"]
        .map(function (s) { return window.PRODUTOS.find(function (p) { return p.sku === s; }); }).filter(Boolean);
    }
    if (escolhidos.length < 8) {
      escolhidos = escolhidos.concat(window.PRODUTOS.filter(function (p) { return p.imagem && escolhidos.indexOf(p) === -1; }));
    }
    destaques.innerHTML = escolhidos.slice(0, 8).map(cardProduto).join("");
  }

  // Categorias na home
  var cats = document.getElementById("categorias-grid");
  if (cats && window.CATEGORIAS) {
    cats.innerHTML = window.CATEGORIAS.map(function (c) {
      var n = window.PRODUTOS.filter(function (p) { return p.categoria === c.id; }).length;
      return '<a class="categoria" href="produtos.html#' + c.id + '">' +
        '<span class="categoria-icone" aria-hidden="true">' + c.icone + '</span>' +
        '<h3>' + c.nome + '</h3><p>' + c.desc + '</p>' +
        '<span class="categoria-link">' + n + ' produtos →</span></a>';
    }).join("");
  }

  // Catálogo completo
  var catalogo = document.getElementById("catalogo");
  if (catalogo && window.PRODUTOS) {
    var filtros = document.getElementById("filtros");
    var busca = document.getElementById("busca");
    var resumo = document.getElementById("catalogo-resumo");
    var POR_PAGINA = 24, mostrar = POR_PAGINA;
    var maisBtn = document.createElement("button");
    maisBtn.type = "button";
    maisBtn.className = "btn btn-shine catalogo-mais";
    maisBtn.hidden = true;
    catalogo.insertAdjacentElement("afterend", maisBtn);
    var params = new URLSearchParams(location.search);
    var ativa = params.get("categoria") || location.hash.slice(1) || "todas";
    if (ativa !== "todas" && !window.CATEGORIAS.some(function (c) { return c.id === ativa; })) ativa = "todas";
    window.addEventListener("hashchange", function () { var h = location.hash.slice(1); if (window.CATEGORIAS.some(function (c) { return c.id === h; })) { ativa = h; render(); } });
    if (params.get("q")) busca.value = params.get("q");

    filtros.innerHTML = [{ id: "todas", nome: "Todas" }].concat(window.CATEGORIAS).map(function (c) {
      return '<button type="button" class="chip" data-cat="' + esc(c.id) + '">' + esc(c.nome) + '</button>';
    }).join("");

    function normalizar(s) { return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }

    function render() {
      filtros.querySelectorAll(".chip").forEach(function (b) { b.classList.toggle("ativo", b.dataset.cat === ativa); });
      var q = normalizar(busca.value.trim());
      var lista = window.PRODUTOS.filter(function (p) {
        return (ativa === "todas" || p.categoria === ativa) &&
          (!q || normalizar(p.nome + " " + p.desc + " " + p.sub + " " + p.sku).indexOf(q) !== -1);
      });
      resumo.textContent = lista.length + (lista.length === 1 ? " produto encontrado" : " produtos encontrados");
      var visiveis = lista.slice(0, mostrar);
      maisBtn.hidden = lista.length <= mostrar;
      maisBtn.textContent = "Mostrar mais produtos (" + (lista.length - visiveis.length) + " restantes)";
      catalogo.innerHTML = lista.length ? visiveis.map(function (p, i) { return cardProduto(p).replace('<article class="produto">', '<article class="produto" style="--i:' + Math.min(i % POR_PAGINA, 12) + '">'); }).join("")
        : '<p class="catalogo-vazio">Nenhum produto encontrado. Não achou o que procura? <a href="#" data-abrir-orcamento>Peça um orçamento personalizado</a> — trabalhamos com mais de 50 mil itens.</p>';
    }

    filtros.addEventListener("click", function (e) {
      var b = e.target.closest(".chip");
      if (!b) return;
      ativa = b.dataset.cat;
      mostrar = POR_PAGINA;
      render();
    });
    busca.addEventListener("input", function () { mostrar = POR_PAGINA; render(); });
    maisBtn.addEventListener("click", function () { mostrar += POR_PAGINA; render(); });
    render();
  }

  // Busca do cabeçalho
  document.querySelectorAll(".busca-topo").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      if (document.getElementById("catalogo")) {
        e.preventDefault();
        var busca = document.getElementById("busca");
        busca.value = form.q.value;
        busca.dispatchEvent(new Event("input"));
        busca.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  });

  // Formulário de contato (home)
  var contato = document.getElementById("form-contato");
  if (contato) {
    contato.addEventListener("submit", function (e) {
      e.preventDefault();
      var f = e.target;
      var corpo = "Nome: " + f.nome.value + "\nE-mail: " + f.email.value + "\nTelefone: " + f.telefone.value + "\n\n" + f.mensagem.value;
      window.location.href = "mailto:" + CONTATO.email + "?subject=" + encodeURIComponent("Contato pelo site - " + f.assunto.value) +
        "&body=" + encodeURIComponent(corpo);
    });
  }

  // ---------- Seções alimentadas pelo catálogo ----------
  var CATS = window.CATEGORIAS || [];
  var PRODS = window.PRODUTOS || [];
  function contar(id) { return PRODS.filter(function (p) { return p.categoria === id; }).length; }

  // Mega menu de produtos
  var mega = document.getElementById("menu-categorias");
  if (mega && CATS.length) {
    mega.innerHTML = '<a href="produtos.html">Todos os produtos <small>' + PRODS.length + '</small></a>' +
      CATS.map(function (c) {
        return '<a href="produtos.html#' + esc(c.id) + '">' + esc(c.nome) + ' <small>' + contar(c.id) + '</small></a>';
      }).join("");
  }

  // Blocos de categoria: ligam-se à categoria real cujo id contém o trecho indicado
  document.querySelectorAll("[data-cat-match]").forEach(function (a) {
    var cat = CATS.find(function (c) { return c.id.indexOf(a.dataset.catMatch) !== -1; });
    if (!cat) return;
    a.href = "produtos.html#" + cat.id;
    var mais = a.querySelector(".bloco-mais");
    if (mais) mais.textContent = "Ver " + contar(cat.id) + " produtos →";
  });

  // Números
  var marcas = {};
  PRODS.forEach(function (p) { if (p.marca && !/^inovelabor$/i.test(p.marca)) marcas[p.marca] = (marcas[p.marca] || 0) + 1; });
  var listaMarcas = Object.keys(marcas).sort(function (a, b) { return marcas[b] - marcas[a]; });
  var stats = {
    produtos: PRODS.length >= 100 ? "+" + Math.floor(PRODS.length / 10) * 10 : String(PRODS.length),
    categorias: String(CATS.length),
    marcas: listaMarcas.length ? (listaMarcas.length >= 10 ? "+" + Math.floor(listaMarcas.length / 5) * 5 : String(listaMarcas.length)) : null
  };
  document.querySelectorAll("[data-stat]").forEach(function (el) {
    var v = stats[el.dataset.stat];
    if (v) el.textContent = v; else el.closest(".numero").hidden = true;
  });

  // Faixa de losangos de ponta a ponta
  var linhaPontos = document.querySelector(".pontos-linha");
  if (linhaPontos) {
    var colunas = Math.ceil(Math.min(window.innerWidth, 2400) / 40), html = "";
    for (var k = 0; k < colunas * 3; k++) {
      html += '<i' + (Math.random() < 0.15 ? ' class="forte"' : "") + ' style="--dur:' + (2 + Math.random() * 3).toFixed(2) +
        's;--atraso:-' + (Math.random() * 5).toFixed(2) + 's"></i>';
    }
    linhaPontos.innerHTML = html;
  }

  // Fotos flutuantes de "Monte seu laboratório": uma por categoria, das maiores linhas
  var monte = document.getElementById("monte-fotos");
  if (monte) {
    var fotos = [];
    CATS.forEach(function (c) {
      if (fotos.length >= 3) return;
      var p = PRODS.find(function (x) { return x.categoria === c.id && x.imagem; });
      if (p) fotos.push(p);
    });
    monte.innerHTML = fotos.map(function (p) {
      return '<figure><img src="' + esc(p.imagem) + '" alt="" loading="lazy"></figure>';
    }).join("");
    if (!fotos.length) monte.hidden = true;
  }

  // Letreiro de marcas
  var trilhaMarcas = document.getElementById("marcas-trilha");
  if (trilhaMarcas) {
    var top = listaMarcas.slice(0, 16);
    if (top.length < 3) { trilhaMarcas.closest(".marcas").hidden = true; }
    else {
      var item = top.map(function (m) { return "<span>" + esc(m) + "</span>"; }).join("");
      var copia = top.map(function (m) { return '<span aria-hidden="true">' + esc(m) + "</span>"; }).join("");
      trilhaMarcas.innerHTML = item + copia;
    }
  }

  // Carrossel de linhas de produto com arte de ondas
  var linhasSlides = document.getElementById("linhas-slides");
  if (linhasSlides && CATS.length) {
    var arte = document.querySelector(".linhas-arte");
    if (arte) {
      var caminhos = "";
      for (var n = 0; n < 22; n++) {
        var y = 40 + n * 15, amp = 40 + n * 3;
        caminhos += '<path style="animation-delay:-' + (n * 0.3).toFixed(1) + 's" d="M0 ' + y + ' C 150 ' + (y - amp) + ', 300 ' + (y + amp) + ', 450 ' + y + ' S 600 ' + (y - amp / 2) + ', 650 ' + y + '"/>';
      }
      arte.innerHTML = caminhos;
    }
    var seis = CATS.slice(0, 6);
    linhasSlides.innerHTML = seis.map(function (c, i) {
      var n = contar(c.id);
      return '<div class="linha-slide' + (i === 0 ? " ativo" : "") + '">' +
        '<span class="grande">+' + n + " " + esc(c.nome) + '</span>' +
        '<h3>Linha completa</h3><p>' + n + ' itens de ' + esc(c.nome.toLowerCase()) + ' com foto, preço e compra direta na loja.</p>' +
        '<a href="produtos.html#' + esc(c.id) + '">Ver a linha →</a></div>';
    }).join("");
    var pontosLinhas = document.getElementById("linhas-pontos");
    pontosLinhas.innerHTML = seis.map(function (_, i) { return '<button type="button" aria-label="Linha ' + (i + 1) + '"' + (i === 0 ? ' class="ativo"' : "") + "></button>"; }).join("");
    var slidesL = linhasSlides.children, botoesL = pontosLinhas.children, atualL = 0, timerL;
    function mostrarLinha(i) {
      slidesL[atualL].classList.remove("ativo"); botoesL[atualL].classList.remove("ativo");
      atualL = (i + slidesL.length) % slidesL.length;
      slidesL[atualL].classList.add("ativo"); botoesL[atualL].classList.add("ativo");
      clearTimeout(timerL);
      if (!reduzMovimento) timerL = setTimeout(function () { mostrarLinha(atualL + 1); }, 5000);
    }
    Array.prototype.forEach.call(botoesL, function (b, i) { b.addEventListener("click", function () { mostrarLinha(i); }); });
    if (!reduzMovimento) timerL = setTimeout(function () { mostrarLinha(1); }, 5000);
  }

  // FAQ: abre uma pergunta por vez
  document.querySelectorAll(".faq-item").forEach(function (d) {
    d.addEventListener("toggle", function () {
      if (d.open) document.querySelectorAll(".faq-item[open]").forEach(function (o) { if (o !== d) o.open = false; });
    });
  });

  // ---------- WhatsApp ----------
  document.querySelectorAll("[data-whatsapp]").forEach(function (a) {
    a.href = "https://wa.me/" + CONTATO.whatsapp + "?text=" + encodeURIComponent("Olá, InoveLabor! Vim pelo site e gostaria de atendimento.");
  });

  // ---------- Header ao rolar + barra de progresso ----------
  var header = document.querySelector(".header");
  var progresso = document.querySelector(".scroll-progress");
  function aoRolar() {
    var y = window.scrollY;
    if (header) header.classList.toggle("scrolled", y > 40);
    if (progresso) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progresso.style.transform = "scaleX(" + (max > 0 ? y / max : 0) + ")";
    }
  }
  window.addEventListener("scroll", aoRolar, { passive: true });
  aoRolar();

  // ---------- Grade de losangos dos blocos de categoria ----------
  document.querySelectorAll(".pontos").forEach(function (grade) {
    var html = "";
    for (var r = 0; r < 3; r++) {
      for (var c = 0; c < 11; c++) {
        var forte = Math.random() < 0.18 ? ' class="forte"' : "";
        html += '<i' + forte + ' style="--c:' + c + ';--r:' + r +
          ';--dur:' + (2 + Math.random() * 3).toFixed(2) + 's;--atraso:-' + (Math.random() * 5).toFixed(2) + 's"></i>';
      }
    }
    grade.innerHTML = html;
  });

  // ---------- Letreiros (marquee) ----------
  document.querySelectorAll(".marquee-trilha[data-itens]").forEach(function (t) {
    var itens = t.dataset.itens.split("|");
    var bloco = itens.map(function (i) { return "<span>" + i + "</span>"; }).join("");
    var copia = itens.map(function (i) { return '<span aria-hidden="true">' + i + "</span>"; }).join("");
    t.innerHTML = bloco + copia;
  });

  // ---------- Contadores ----------
  function animarContador(el) {
    var alvo = parseInt(el.dataset.count, 10);
    if (reduzMovimento) { el.textContent = alvo; return; }
    var inicio = null, dur = 1800;
    function passo(ts) {
      if (!inicio) inicio = ts;
      var p = Math.min((ts - inicio) / dur, 1);
      var e = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(alvo * e);
      if (p < 1) requestAnimationFrame(passo);
    }
    el.textContent = "0";
    requestAnimationFrame(passo);
  }

  // ---------- Revelação ao rolar ----------
  var alvos = document.querySelectorAll("[data-reveal], .stagger, .faixa");
  function revelar(el) {
    el.classList.add("visivel");
    el.querySelectorAll("[data-count]").forEach(animarContador);
  }
  if ("IntersectionObserver" in window && !reduzMovimento) {
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (en.isIntersecting) { revelar(en.target); obs.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    alvos.forEach(function (el) { obs.observe(el); });
  } else {
    alvos.forEach(revelar);
  }

  // ---------- Slider do hero ----------
  var slides = Array.prototype.slice.call(document.querySelectorAll(".slide"));
  var pontos = document.querySelector(".slides-pontos");
  if (slides.length > 1 && pontos) {
    var atual = 0, timer, TEMPO = 7000;
    pontos.style.setProperty("--tempo", TEMPO / 1000 + "s");
    pontos.innerHTML = slides.map(function (_, i) {
      return '<button type="button" aria-label="Slide ' + (i + 1) + '"' + (i === 0 ? ' class="ativo"' : "") + "></button>";
    }).join("");
    var botoes = pontos.querySelectorAll("button");
    function irPara(n) {
      n = (n + slides.length) % slides.length;
      if (n === atual) return;
      var anterior = slides[atual];
      anterior.classList.remove("ativo");
      anterior.classList.add("saindo");
      setTimeout(function () { anterior.classList.remove("saindo"); }, 600);
      slides[n].classList.add("ativo");
      botoes[atual].classList.remove("ativo");
      void botoes[n].offsetWidth;
      botoes[n].classList.add("ativo");
      atual = n;
      reiniciar();
    }
    function reiniciar() {
      clearTimeout(timer);
      if (!reduzMovimento) timer = setTimeout(function () { irPara(atual + 1); }, TEMPO);
    }
    document.querySelectorAll("[data-slide]").forEach(function (b) {
      b.addEventListener("click", function () { irPara(atual + parseInt(b.dataset.slide, 10)); });
    });
    botoes.forEach(function (b, i) { b.addEventListener("click", function () { irPara(i); }); });
    reiniciar();
  }

  var ano = document.getElementById("ano");
  if (ano) ano.textContent = new Date().getFullYear();

  atualizarContador(lerOrcamento());
})();
