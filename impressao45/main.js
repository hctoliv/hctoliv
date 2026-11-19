(() => {
  const IG = "https://ig.me/m/impressao45";
  const QTY = [20, 50, 80, 100, 200, 300, 500, 1000];
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const store = { get: (k) => { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) {} } };

  document.addEventListener("DOMContentLoaded", () => {
    const body = document.body;
    const hasGsap = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined" && !reduce;
    if (hasGsap) gsap.registerPlugin(ScrollTrigger);

    let lenis = null;
    if (hasGsap && typeof Lenis !== "undefined") {
      lenis = new Lenis({ lerp: 0.1 });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }
    const scrollToEl = (el) => { if (!el) return; if (lenis) lenis.scrollTo(el, { offset: -60 }); else el.scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); };

    // abertura
    const loader = $("#loader");
    const ready = () => { loader.classList.add("is-done"); body.classList.add("is-ready"); store.set("o45-intro", "1"); if (hasGsap) setTimeout(() => ScrollTrigger.refresh(), 800); };
    if (reduce || store.get("o45-intro")) ready(); else setTimeout(ready, 1700);

    // nav, progresso, Direct
    const nav = $("#nav"), bar = $("#progress"), fl = $("#igFloat");
    const onScroll = () => {
      const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
      nav.classList.toggle("is-solid", y > 40);
      fl.classList.toggle("is-on", y > innerHeight * 0.8);
      bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    };
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });

    const burger = $("#burger"), menu = $("#menu");
    const setMenu = (open) => {
      burger.setAttribute("aria-expanded", open);
      burger.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
      menu.classList.toggle("is-open", open);
      body.classList.toggle("is-locked", open);
      if (lenis) open ? lenis.stop() : lenis.start();
    };
    burger.addEventListener("click", () => setMenu(burger.getAttribute("aria-expanded") !== "true"));
    addEventListener("keydown", (e) => { if (e.key === "Escape" && menu.classList.contains("is-open")) { setMenu(false); burger.focus(); } });
    $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
      const id = a.getAttribute("href"), el = id.length > 1 && $(id);
      if (!el) return;
      e.preventDefault();
      if (menu.classList.contains("is-open")) setMenu(false);
      scrollToEl(el);
    }));

    // hero
    if (hasGsap) {
      gsap.to("#heroBg", { yPercent: 14, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
      gsap.to("#sticker", { yPercent: 60, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    }

    // manifesto
    const man = $("[data-words]");
    const wrap = (node) => [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((w) => {
          if (!w) return;
          if (/^\s+$/.test(w)) frag.append(w);
          else { const s = document.createElement("span"); s.className = "w"; s.textContent = w; frag.append(s); }
        });
        n.replaceWith(frag);
      } else wrap(n);
    });
    wrap(man);
    const words = $$(".w", man);
    if (hasGsap) ScrollTrigger.create({ trigger: man, start: "top 78%", end: "bottom 45%", scrub: true, onUpdate: (st) => { const n = Math.round(st.progress * words.length); words.forEach((w, i) => w.classList.toggle("is-on", i < n)); } });
    else words.forEach((w) => w.classList.add("is-on"));

    // cor por cor: a cena fica presa e cada trecho da rolagem troca a tela
    const lImgs = $$(".layers__frame img"), lSteps = $$("#layerSteps li"), lNum = $("#layerNum");
    let lCur = -1;
    const setLayer = (i) => {
      if (i === lCur) return; lCur = i;
      lImgs.forEach((im, k) => im.classList.toggle("on", k === i));
      lSteps.forEach((li, k) => li.classList.toggle("on", k === i));
      lNum.textContent = String(i + 1).padStart(2, "0");
    };
    setLayer(0);
    if (hasGsap) {
      $(".layers").classList.add("is-pinned");
      ScrollTrigger.create({ trigger: ".layers", start: "top top", end: "+=" + lImgs.length * 55 + "%", pin: ".layers__pin", anticipatePin: 1,
        onUpdate: (st) => setLayer(Math.min(lImgs.length - 1, Math.floor(st.progress * lImgs.length))) });
    } else {
      // sem animação: troca automaticamente
      let k = 0; setInterval(() => setLayer((k = (k + 1) % lImgs.length)), 2200);
    }
    // carrega as telas antes de chegar na seção, para a troca não piscar vazia
    const pre = new IntersectionObserver(([e], o) => { if (e.isIntersecting) { lImgs.forEach((im) => { im.loading = "eager"; }); o.disconnect(); } }, { rootMargin: "800px 0px" });
    pre.observe($(".layers"));

    // trabalhos: trilho horizontal no desktop
    if (hasGsap) {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 901px)", () => {
        const sec = $(".works"), track = $("#worksTrack");
        sec.classList.add("is-hscroll");
        const dist = () => Math.max(0, track.scrollWidth - innerWidth);
        const tw = gsap.to(track, { x: () => -dist(), ease: "none", scrollTrigger: { trigger: sec, start: "top top", end: () => "+=" + dist(), pin: ".works__pin", scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1 } });
        return () => { sec.classList.remove("is-hscroll"); tw.scrollTrigger && tw.scrollTrigger.kill(); tw.kill(); gsap.set(track, { clearProps: "transform" }); };
      });
    }
    const workPre = new IntersectionObserver(([e], o) => { if (e.isIntersecting) { $$(".works__track img").forEach((im) => { im.loading = "eager"; }); o.disconnect(); } }, { rootMargin: "800px 0px" });
    workPre.observe($(".works"));

    // contadores
    if (!reduce) {
      const cio = new IntersectionObserver((es) => es.forEach((e) => {
        if (!e.isIntersecting) return;
        cio.unobserve(e.target);
        const el = e.target, to = +el.dataset.count, from = +(el.dataset.from || 0), t0 = performance.now();
        const step = (t) => { const p = Math.min(1, (t - t0) / 1600), k = 1 - Math.pow(1 - p, 3); const v = Math.round(from + (to - from) * k); el.textContent = to >= 2000 && to !== 1993 ? v.toLocaleString("pt-BR") : String(v); if (p < 1) requestAnimationFrame(step); };
        requestAnimationFrame(step);
      }), { threshold: 0.6 });
      $$("[data-count]").forEach((c) => cio.observe(c));
    }

    // revelar
    if (!reduce && "IntersectionObserver" in window) {
      const rv = $$(".sec-head, .pcard, .works__head, .prods__grid li, .stats__grid div, .quote__copy, .form");
      rv.forEach((el) => el.classList.add("rv"));
      const ro = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); ro.unobserve(e.target); } }), { rootMargin: "0px 0px -10% 0px" });
      rv.forEach((el) => ro.observe(el));
    }

    // orçamento: ordem de serviço
    const form = $("#form"), preview = $("#preview"), err = $("#formErr"), ok = $("#formOk"), qty = $("#qty"), qtyLbl = $("#qtyLbl");
    $("#osNum").textContent = String(Math.floor(1000 + Math.random() * 8999));
    const groups = {};
    $$(".pills", form).forEach((p) => {
      const single = p.hasAttribute("data-single"); groups[p.dataset.name] = p;
      $$("button", p).forEach((b) => b.addEventListener("click", () => {
        if (single) $$("button", p).forEach((x) => x.classList.toggle("is-on", x === b));
        else { b.classList.toggle("is-on"); if (!$$("button.is-on", p).length) b.classList.add("is-on"); }
        render();
      }));
    });
    const picked = (n) => $$("button.is-on", groups[n]).map((b) => b.dataset.v);
    const list = (a) => a.length <= 1 ? a.join("") : a.slice(0, -1).join(", ") + " e " + a.slice(-1);
    const qtyText = () => { const v = QTY[+qty.value]; return v >= 1000 ? "1.000 peças ou mais" : `${v} peças`; };
    const msg = () => {
      const nome = form.elements.nome.value.trim(), prazo = form.elements.prazo.value.trim();
      let t = `Olá, Oficina de Estampas! ${nome ? `Aqui é ${nome}. ` : ""}Vim pelo site e quero um orçamento de silk:\n`;
      t += `\n• Peça: ${list(picked("peca"))}\n• Quantidade: cerca de ${qtyText()}\n• Estampa: ${picked("cores")[0]}\n• Arte: ${picked("arte")[0]}`;
      if (prazo) t += `\n• Prazo: ${prazo}`;
      return t;
    };
    const render = () => { qtyLbl.textContent = qtyText(); preview.textContent = msg(); };
    qty.addEventListener("input", render);
    form.addEventListener("input", (e) => { if (e.target.name === "nome") { e.target.removeAttribute("aria-invalid"); err.hidden = true; } render(); });
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const n = form.elements.nome;
      if (!n.value.trim()) { n.setAttribute("aria-invalid", "true"); err.hidden = false; n.focus(); return; }
      const text = msg();
      try { await navigator.clipboard.writeText(text); ok.textContent = "Pedido copiado. No Direct, é só colar e enviar."; }
      catch (x) { ok.textContent = "Não deu para copiar sozinho: selecione o texto da ordem de serviço e copie antes de enviar."; }
      ok.hidden = false;
      const win = open(IG, "_blank");
      if (win) win.opener = null; else location.href = IG;
    });
    render();

    $("#year").textContent = new Date().getFullYear();
    if (hasGsap) { addEventListener("load", () => ScrollTrigger.refresh()); if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh()); }
  });
})();
