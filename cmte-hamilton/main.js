(() => {
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
    const scrollToEl = (el) => { if (!el) return; if (lenis) lenis.scrollTo(el, { offset: -70 }); else el.scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); };

    // ---------- abertura ----------
    const loader = $("#loader"), count = $("#loaderCount");
    const ready = () => {
      loader.classList.add("is-done"); body.classList.add("is-ready"); store.set("cmte-intro", "1");
      if (hasGsap) setTimeout(() => ScrollTrigger.refresh(), 900);
    };
    if (reduce || store.get("cmte-intro")) { count.textContent = "100"; ready(); }
    else {
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - t0) / 1500);
        count.textContent = Math.round(p * 100);
        if (p < 1) requestAnimationFrame(tick); else setTimeout(ready, 200);
      };
      requestAnimationFrame(tick);
    }

    // ---------- progresso, nav, WhatsApp ----------
    const nav = $("#nav"), bar = $("#progress"), wa = $("#waFloat");
    const onScroll = () => {
      const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
      nav.classList.toggle("is-solid", y > 40);
      wa.classList.toggle("is-on", y > innerHeight * 0.8);
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

    // ---------- hero: palavra e retrato em parallax ----------
    if (hasGsap) {
      gsap.to(".hero__word span", { xPercent: -16, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
      gsap.to("#heroFig", { yPercent: 10, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    }

    // ---------- manifesto palavra por palavra ----------
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
    if (hasGsap) {
      ScrollTrigger.create({ trigger: man, start: "top 78%", end: "bottom 45%", scrub: true,
        onUpdate: (st) => { const n = Math.round(st.progress * words.length); words.forEach((w, i) => w.classList.toggle("is-on", i < n)); } });
    } else words.forEach((w) => w.classList.add("is-on"));

    // ---------- história: imagem troca com a etapa ----------
    const steps = $$(".step"), imgs = $$(".story__img"), num = $("#storyNum");
    const setStep = (i) => {
      imgs.forEach((im, k) => im.classList.toggle("on", k === i));
      steps.forEach((s, k) => s.classList.toggle("on", k === i));
      num.textContent = String(i + 1).padStart(2, "0");
    };
    setStep(0);
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) setStep(steps.indexOf(e.target)); }), { rootMargin: "-45% 0px -45% 0px" });
    steps.forEach((s) => io.observe(s));

    // ---------- diário de bordo: trilho horizontal no desktop ----------
    if (hasGsap) {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 901px)", () => {
        const sec = $(".log"), track = $("#logTrack");
        sec.classList.add("is-hscroll");
        const dist = () => Math.max(0, track.scrollWidth - innerWidth);
        const tw = gsap.to(track, { x: () => -dist(), ease: "none",
          scrollTrigger: { trigger: sec, start: "top top", end: () => "+=" + dist(), pin: ".log__pin", scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1 } });
        return () => { sec.classList.remove("is-hscroll"); tw.scrollTrigger && tw.scrollTrigger.kill(); tw.kill(); gsap.set(track, { clearProps: "transform" }); };
      });
      // livro gira com a rolagem
      gsap.fromTo(".book__cover", { "--ry": "-22deg" }, { "--ry": "8deg", ease: "none", scrollTrigger: { trigger: ".book", start: "top bottom", end: "bottom top", scrub: true } });
    }

    // ---------- revelar ----------
    if (!reduce && "IntersectionObserver" in window) {
      const rv = $$(".story__head, .tv__copy, .tv__card, .log__head, .book__stage, .book__copy, .crew__head, .social li, .hire__copy, .form");
      rv.forEach((el, i) => { el.classList.add("rv"); if (el.matches(".social li")) el.style.transitionDelay = `${(i % 4) * 0.08}s`; });
      const ro = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); ro.unobserve(e.target); } }), { rootMargin: "0px 0px -10% 0px" });
      rv.forEach((el) => ro.observe(el));
    }

    // ---------- contratar: mensagem pronta ----------
    const form = $("#form"), err = $("#formErr");
    $$(".pills button", form).forEach((b) => b.addEventListener("click", () => $$(".pills button", form).forEach((x) => x.classList.toggle("is-on", x === b))));
    const msg = () => {
      const f = form.elements, on = $(".pills .is-on", form), tipo = on ? on.dataset.v : "um contato";
      const nome = f.nome.value.trim(), emp = f.empresa.value.trim(), cid = f.cidade.value.trim(), dt = f.data.value.trim(), m = f.msg.value.trim();
      let t = `Olá, equipe do Comandante Hamilton! Meu nome é ${nome}${emp ? `, da ${emp}` : ""}. Vim pelo site e gostaria de um orçamento para ${tipo}.`;
      if (cid) t += ` Local: ${cid}.`;
      if (dt) t += ` Data: ${dt}.`;
      if (m) t += `\n\n${m}`;
      return t;
    };
    const valid = () => {
      const n = form.elements.nome;
      if (n.value.trim()) return true;
      n.setAttribute("aria-invalid", "true"); err.hidden = false; n.focus(); return false;
    };
    form.elements.nome.addEventListener("input", (e) => { e.target.removeAttribute("aria-invalid"); err.hidden = true; });
    form.addEventListener("submit", (e) => { e.preventDefault(); if (valid()) open(`https://wa.me/5511989240812?text=${encodeURIComponent(msg())}`, "_blank", "noopener"); });
    $("#viaMail").addEventListener("click", () => { if (valid()) location.href = `mailto:comercialcmte@gmail.com?subject=${encodeURIComponent("Orçamento pelo site")}&body=${encodeURIComponent(msg())}`; });

    $("#year").textContent = new Date().getFullYear();
    if (hasGsap) { addEventListener("load", () => ScrollTrigger.refresh()); if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh()); }
  });
})();
