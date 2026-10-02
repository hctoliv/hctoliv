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
      return '<div class="orc-item" data-sku="' + i.sku + '">' +
        '<div><strong>' + i.nome + '</strong><small>' + i.sku + '</small></div>' +
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
    return '<article class="produto">' +
      '<div class="produto-thumb" aria-hidden="true"><span>' + (cat.icone || "🔬") + '</span></div>' +
      '<span class="produto-tag">' + (cat.nome || "") + ' · ' + p.sub + '</span>' +
      '<h3>' + p.nome + '</h3>' +
      '<p>' + p.desc + '</p>' +
      '<div class="produto-rodape"><small>' + p.sku + '</small>' +
      '<button type="button" class="btn btn-sm" data-add="' + p.sku + '">+ Orçamento</button></div>' +
      '</article>';
  }

  // Destaques na home
  var destaques = document.getElementById("destaques");
  if (destaques && window.PRODUTOS) {
    var skus = ["IL-EQ-001", "IL-EQ-003", "IL-VD-002", "IL-AC-001", "IL-KT-002", "IL-EQ-009", "IL-RG-006", "IL-EQ-006"];
    destaques.innerHTML = skus.map(function (s) {
      return window.PRODUTOS.find(function (p) { return p.sku === s; });
    }).filter(Boolean).map(cardProduto).join("");
  }

  // Categorias na home
  var cats = document.getElementById("categorias-grid");
  if (cats && window.CATEGORIAS) {
    cats.innerHTML = window.CATEGORIAS.map(function (c) {
      var n = window.PRODUTOS.filter(function (p) { return p.categoria === c.id; }).length;
      return '<a class="categoria" href="produtos.html?categoria=' + c.id + '">' +
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
    var params = new URLSearchParams(location.search);
    var ativa = params.get("categoria") || "todas";
    if (params.get("q")) busca.value = params.get("q");

    filtros.innerHTML = [{ id: "todas", nome: "Todas" }].concat(window.CATEGORIAS).map(function (c) {
      return '<button type="button" class="chip" data-cat="' + c.id + '">' + c.nome + '</button>';
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
      catalogo.innerHTML = lista.length ? lista.map(function (p, i) { return cardProduto(p).replace('<article class="produto">', '<article class="produto" style="--i:' + Math.min(i, 12) + '">'); }).join("")
        : '<p class="catalogo-vazio">Nenhum produto encontrado. Não achou o que procura? <a href="#" data-abrir-orcamento>Peça um orçamento personalizado</a> — trabalhamos com mais de 50 mil itens.</p>';
    }

    filtros.addEventListener("click", function (e) {
      var b = e.target.closest(".chip");
      if (!b) return;
      ativa = b.dataset.cat;
      render();
    });
    busca.addEventListener("input", render);
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
