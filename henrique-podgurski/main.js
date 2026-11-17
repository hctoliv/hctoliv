(() => {
  const WA = "5511956546924";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.addEventListener("DOMContentLoaded", () => {
    const hasGsap = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined" && !reduce;
    if (hasGsap) gsap.registerPlugin(ScrollTrigger);

    // rolagem suave: o Lenis anda no relógio do GSAP para as cenas presas não tremerem
    let lenis = null;
    if (hasGsap && typeof Lenis !== "undefined" && !location.search.includes("nosmooth")) {
      lenis = new Lenis({ lerp: 0.1 });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }

    // nav
    const nav = $("#nav"), burger = $("#burger"), links = $("#nav-links"), wa = $(".wa-float");
    const onScroll = () => {
      const y = scrollY;
      nav.classList.toggle("is-solid", y > 40);
      wa.classList.toggle("is-on", y > innerHeight * 0.8);
    };
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });

    const setMenu = (open) => {
      burger.setAttribute("aria-expanded", open);
      burger.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
      links.classList.toggle("is-open", open);
      document.body.classList.toggle("is-locked", open);
      if (lenis) open ? lenis.stop() : lenis.start();
    };
    burger.addEventListener("click", () => setMenu(burger.getAttribute("aria-expanded") !== "true"));
    addEventListener("keydown", (e) => { if (e.key === "Escape" && links.classList.contains("is-open")) { setMenu(false); burger.focus(); } });

    $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      const target = id.length > 1 && $(id);
      if (!target) return;
      e.preventDefault();
      if (links.classList.contains("is-open")) setMenu(false);
      if (lenis) lenis.scrollTo(target, { offset: -70 });
      else target.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
      history.replaceState(null, "", id);
    }));

    // hero: luz segue o ponteiro (no máximo uma vez por quadro) e tudo para fora da tela
    const hero = $(".hero");
    let pending = false;
    hero.addEventListener("pointermove", (e) => {
      if (pending || reduce) return;
      pending = true;
      requestAnimationFrame(() => {
        const r = hero.getBoundingClientRect();
        hero.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
        hero.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
        pending = false;
      });
    });
    let heroOn = true;
    new IntersectionObserver(([e]) => { heroOn = e.isIntersecting; hero.classList.toggle("is-off", !heroOn); }).observe(hero);

    // poeira dourada no hero (30 fps, só com o hero visível)
    const canvas = $("#dust");
    if (canvas && !reduce) {
      const ctx = canvas.getContext("2d");
      let w, h, dpr, parts = [], last = 0;
      const size = () => {
        dpr = Math.min(devicePixelRatio || 1, 2);
        w = canvas.clientWidth; h = canvas.clientHeight;
        canvas.width = w * dpr; canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const n = Math.round(Math.min(70, (w * h) / 16000));
        parts = Array.from({ length: n }, () => ({
          x: Math.random() * w, y: Math.random() * h,
          r: Math.random() * 1.6 + 0.4, s: Math.random() * 0.35 + 0.1,
          a: Math.random() * 0.5 + 0.2, d: Math.random() * Math.PI * 2
        }));
      };
      size();
      addEventListener("resize", size);
      const tick = (t) => {
        if (!heroOn) return;
        requestAnimationFrame(tick);
        if (t - last < 33) return;
        last = t;
        ctx.clearRect(0, 0, w, h);
        for (const p of parts) {
          p.y -= p.s; p.d += 0.01; p.x += Math.sin(p.d) * 0.2;
          if (p.y < -5) { p.y = h + 5; p.x = Math.random() * w; }
          ctx.globalAlpha = p.a * (0.6 + 0.4 * Math.sin(p.d * 2));
          ctx.fillStyle = "#f7e2aa";
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
        }
      };
      new IntersectionObserver(([e]) => { if (e.isIntersecting) requestAnimationFrame(tick); }).observe(hero);
    }

    // implante: a peça monta conforme a rolagem
    const implant = $("#implante"), steps = $$(".step"), bar = $("#imp-bar");
    if (hasGsap) {
      implant.classList.add("is-scrub");
      const setStep = (i) => steps.forEach((s, k) => s.classList.toggle("is-on", k === i));
      setStep(0);
      gsap.set(".i-screw", { y: -300, opacity: 0 });
      gsap.set(".i-abut", { y: -320, opacity: 0 });
      gsap.set(".i-crown", { y: -360, opacity: 0 });
      gsap.set(".i-osseo", { opacity: 0 });
      gsap.set(".i-ring", { scale: 0.6 });

      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: {
          trigger: implant, start: "top top", end: "+=320%", pin: ".implant__pin", scrub: 0.6, anticipatePin: 1,
          onUpdate: (st) => {
            setStep(Math.min(3, Math.floor(st.progress * 4 * 0.999)));
            bar.style.transform = `scaleX(${st.progress})`;
          }
        }
      });
      tl.to(".i-guide", { opacity: 0.25, duration: 1 })
        .to(".i-screw", { opacity: 1, duration: 0.2 }, 1)
        .to(".i-screw", { y: 0, duration: 0.8, ease: "power3.in" }, 1)
        .to(".i-guide", { opacity: 0, duration: 0.4 }, 1.6)
        .to(".i-osseo", { opacity: 1, duration: 0.5 }, 2)
        .to(".i-ring", { scale: 1.15, duration: 1, stagger: 0.15, ease: "sine.out" }, 2)
        .to(".i-osseo", { opacity: 0.35, duration: 0.3 }, 2.8)
        .to(".i-abut", { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }, 3)
        .to(".i-crown", { opacity: 1, y: 0, duration: 0.55, ease: "power3.out" }, 3.4)
        .to({}, { duration: 0.1 });
    }

    // manifesto palavra por palavra
    const man = $("[data-words]");
    if (man) {
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
        ScrollTrigger.create({
          trigger: man, start: "top 80%", end: "bottom 45%", scrub: true,
          onUpdate: (st) => { const n = Math.round(st.progress * words.length); words.forEach((w, i) => w.classList.toggle("is-on", i < n)); }
        });
      } else words.forEach((w) => w.classList.add("is-on"));
    }

    // próteses: trilho horizontal preso no desktop; no celular é carrossel nativo com snap
    const proSec = $("#proteses"), track = $("#pro-track");
    if (hasGsap) {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 861px)", () => {
        proSec.classList.add("is-hscroll");
        const dist = () => Math.max(0, track.scrollWidth - innerWidth);
        const tw = gsap.to(track, {
          x: () => -dist(), ease: "none",
          scrollTrigger: { trigger: proSec, start: "top top", end: () => "+=" + dist(), pin: ".proteses__pin", scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1 }
        });
        return () => { proSec.classList.remove("is-hscroll"); tw.scrollTrigger && tw.scrollTrigger.kill(); tw.kill(); gsap.set(track, { clearProps: "transform" }); };
      });
    }

    // revelar ao rolar
    const rvTargets = $$(".sec-head, .tcard, .doc__media, .doc__copy, .faq details, .agendar__copy, .form, .visite__copy, .visite__map, .proteses__intro, .final > *");
    if (!reduce && "IntersectionObserver" in window) {
      rvTargets.forEach((el) => el.classList.add("rv"));
      const io = new IntersectionObserver((es) => es.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      }), { rootMargin: "0px 0px -8% 0px" });
      rvTargets.forEach((el) => io.observe(el));
    }

    // contadores
    const fmt = (v, dec) => v.toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
    const counters = $$("[data-count]");
    if (!reduce) {
      const cio = new IntersectionObserver((es) => es.forEach((e) => {
        if (!e.isIntersecting) return;
        cio.unobserve(e.target);
        const el = e.target, to = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0), t0 = performance.now(), dur = 1600;
        const step = (t) => {
          const p = Math.min(1, (t - t0) / dur), k = 1 - Math.pow(1 - p, 3);
          el.textContent = fmt(to * k, dec);
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }), { threshold: 0.6 });
      counters.forEach((c) => cio.observe(c));
    }

    // formulário vira mensagem no WhatsApp (nada é guardado)
    const form = $("#form"), preview = $("#preview"), err = $("#err");
    const msg = () => {
      const d = new FormData(form);
      const nome = (d.get("nome") || "").trim();
      const obs = (d.get("obs") || "").trim();
      let t = `Olá, Dr. Henrique! ${nome ? `Meu nome é ${nome}. ` : ""}Vim pelo site e quero agendar uma avaliação sobre ${d.get("trat")}. Prefiro ${d.get("per")}.`;
      if (obs) t += `\n\n${obs}`;
      return t;
    };
    const updatePreview = () => { preview.textContent = msg(); };
    form.addEventListener("input", (e) => { updatePreview(); if (e.target.name === "nome") { e.target.removeAttribute("aria-invalid"); err.hidden = true; } });
    form.addEventListener("change", updatePreview);
    updatePreview();
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const nome = form.elements.nome;
      if (!nome.value.trim()) { nome.setAttribute("aria-invalid", "true"); err.hidden = false; nome.focus(); return; }
      open(`https://wa.me/${WA}?text=${encodeURIComponent(msg())}`, "_blank", "noopener");
    });

    // mapa só carrega quando pedem
    $("#map-load").addEventListener("click", () => {
      const f = document.createElement("iframe");
      f.src = "https://www.google.com/maps?q=Rua+Cachoeira+do+Campo+278+Jardim+Paragua%C3%A7u+S%C3%A3o+Paulo&output=embed";
      f.title = "Mapa: Rua Cachoeira do Campo, 278, Jardim Paraguaçu";
      f.loading = "lazy";
      f.referrerPolicy = "no-referrer-when-downgrade";
      $("#map").replaceChildren(f);
    });

    $("#year").textContent = new Date().getFullYear();

    // fontes e imagens mudam alturas: recalcula as cenas presas
    if (hasGsap) {
      addEventListener("load", () => ScrollTrigger.refresh());
      if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
    }
  });
})();
