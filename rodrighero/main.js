(() => {
  const WA = "5511989397543";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const store = { get: (k) => { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) {} } };

  const TREATS = [
    { name: "implantes", tag: "Volte a sorrir e mastigar com mais segurança.", text: "A ausência de um ou mais dentes pode afetar a mastigação, a fala e até a confiança para sorrir. Os implantes dentários são planejados individualmente para recuperar função, conforto e naturalidade." },
    { name: "ortodontia", tag: "Equilíbrio para o sorriso em todas as fases da vida.", text: "Mais do que alinhar os dentes, o tratamento ortodôntico busca melhorar função, saúde bucal e harmonia do sorriso, sempre respeitando as necessidades de cada paciente." },
    { name: "laserterapia", tag: "Tecnologia que também pode significar mais conforto.", text: "A laserterapia é usada em diferentes situações da Odontologia para auxiliar no controle da dor, na recuperação dos tecidos e em procedimentos que exigem precisão e cuidado." },
    { name: "harmonização", tag: "Naturalidade começa por respeitar quem você é.", text: "Procedimentos cuidadosamente planejados podem contribuir para o equilíbrio e a harmonia facial, sem perder aquilo que torna cada pessoa única." },
    { name: "clareamento", tag: "Um sorriso mais luminoso, preservando sua naturalidade.", text: "Com acompanhamento profissional, o clareamento busca uma tonalidade mais clara de forma planejada, considerando as características e a saúde bucal de cada paciente." },
    { name: "prevenção e limpeza", tag: "Cuidar hoje também é preservar o amanhã.", text: "Consultas periódicas, limpeza profissional e acompanhamento ajudam a prevenir problemas e preservar dentes e gengivas ao longo da vida." }
  ];

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

    // abertura
    const loader = $("#loader");
    const ready = () => { loader.classList.add("is-done"); body.classList.add("is-ready"); store.set("ro-intro", "1"); if (hasGsap) setTimeout(() => ScrollTrigger.refresh(), 1000); };
    if (reduce || store.get("ro-intro")) ready(); else setTimeout(ready, 1700);

    // nav, progresso, WhatsApp
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

    // hero em parallax
    if (hasGsap) {
      gsap.to(".hero__word span", { xPercent: -14, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
      gsap.to("#heroMedia", { yPercent: 8, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    }

    // manifesto palavra por palavra
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

    // tratamentos: seletor
    const tabs = $$(".treat__list button"), tImgs = $$(".treat__media img"), tCopy = $(".treat__copy");
    const tTag = $("#treatTag"), tText = $("#treatText"), tCta = $("#treatCta");
    let current = 0;
    const setTreat = (i) => {
      current = i;
      tabs.forEach((b, k) => b.setAttribute("aria-selected", k === i));
      tImgs.forEach((im, k) => im.classList.toggle("on", k === i));
      tTag.textContent = TREATS[i].tag; tText.textContent = TREATS[i].text;
      tCta.firstChild.textContent = `Agendar avaliação de ${TREATS[i].name} `;
      tCopy.classList.remove("swap"); void tCopy.offsetWidth; tCopy.classList.add("swap");
    };
    tabs.forEach((b, k) => b.addEventListener("click", () => setTreat(k)));
    $(".treat__list").addEventListener("keydown", (e) => {
      if (!["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft"].includes(e.key)) return;
      e.preventDefault();
      const n = (current + (e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
      setTreat(n); tabs[n].focus();
    });
    tCta.addEventListener("click", () => { prefill(TREATS[current].name); scrollToEl($("#agendar")); });

    // contadores
    if (!reduce) {
      const cio = new IntersectionObserver((es) => es.forEach((e) => {
        if (!e.isIntersecting) return;
        cio.unobserve(e.target);
        const el = e.target, to = +el.dataset.count, pre = el.dataset.pre || "", t0 = performance.now();
        const step = (t) => { const p = Math.min(1, (t - t0) / 1500), k = 1 - Math.pow(1 - p, 3); el.textContent = pre + Math.round(to * k); if (p < 1) requestAnimationFrame(step); };
        requestAnimationFrame(step);
      }), { threshold: 0.6 });
      $$("[data-count]").forEach((c) => cio.observe(c));
    }

    // espaço: trilho horizontal no desktop
    if (hasGsap) {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 901px)", () => {
        const sec = $(".space"), track = $("#spaceTrack");
        sec.classList.add("is-hscroll");
        const dist = () => Math.max(0, track.scrollWidth - innerWidth);
        const tw = gsap.to(track, { x: () => -dist(), ease: "none", scrollTrigger: { trigger: sec, start: "top top", end: () => "+=" + dist(), pin: ".space__pin", scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1 } });
        return () => { sec.classList.remove("is-hscroll"); tw.scrollTrigger && tw.scrollTrigger.kill(); tw.kill(); gsap.set(track, { clearProps: "transform" }); };
      });
    }

    // revelar
    if (!reduce && "IntersectionObserver" in window) {
      const rv = $$(".treat__head, .treat__panel, .treat__more, .why__big, .why__list, .docs__head, .doc__media, .doc__copy, .mvv__head, .space__head, .reviews__head, .faq__head, .faq details, .book__copy, .form, .contact__copy, .contact__map");
      rv.forEach((el) => el.classList.add("rv"));
      const ro = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); ro.unobserve(e.target); } }), { rootMargin: "0px 0px -10% 0px" });
      rv.forEach((el) => ro.observe(el));
    }

    // agendar: mensagem pronta
    const form = $("#form"), preview = $("#waPreview"), err = $("#formErr");
    const groups = {};
    $$(".pills", form).forEach((p) => {
      const single = p.hasAttribute("data-single"); groups[p.dataset.name] = p;
      $$("button", p).forEach((b) => b.addEventListener("click", () => {
        if (single) $$("button", p).forEach((x) => x.classList.toggle("is-on", x === b));
        else {
          const unsure = b.dataset.v === "uma avaliação geral";
          if (unsure) $$("button", p).forEach((x) => x.classList.toggle("is-on", x === b));
          else { $$("button", p).forEach((x) => { if (x.dataset.v === "uma avaliação geral") x.classList.remove("is-on"); }); b.classList.toggle("is-on"); }
          if (!$$("button.is-on", p).length) $$("button", p).find((x) => x.dataset.v === "uma avaliação geral").classList.add("is-on");
        }
        render();
      }));
    });
    const picked = (n) => $$("button.is-on", groups[n]).map((b) => b.dataset.v);
    const list = (a) => a.length <= 1 ? a.join("") : a.slice(0, -1).join(", ") + " e " + a.slice(-1);
    const msg = () => {
      const nome = form.elements.nome.value.trim(), tr = picked("trat"), tipo = picked("tipo")[0], per = picked("per")[0];
      const geral = tr.length === 1 && tr[0] === "uma avaliação geral";
      return `Olá! ${nome ? `Meu nome é ${nome}. ` : ""}Vim pelo site e gostaria de agendar ${geral ? "uma avaliação" : `uma avaliação de ${list(tr)}`}, atendimento ${tipo}. Prefiro ${per}.`;
    };
    const render = () => { preview.textContent = msg(); };
    function prefill(name) {
      $$("button", groups.trat).forEach((b) => b.classList.toggle("is-on", b.dataset.v === name));
      render(); form.classList.remove("flash"); void form.offsetWidth; form.classList.add("flash");
    }
    form.elements.nome.addEventListener("input", (e) => { e.target.removeAttribute("aria-invalid"); err.hidden = true; render(); });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const n = form.elements.nome;
      if (!n.value.trim()) { n.setAttribute("aria-invalid", "true"); err.hidden = false; n.focus(); return; }
      open(`https://wa.me/${WA}?text=${encodeURIComponent(msg())}`, "_blank", "noopener");
    });
    render();

    // mapa sob demanda
    $("#mapLoad").addEventListener("click", () => {
      const f = document.createElement("iframe");
      f.src = "https://www.google.com/maps?q=Rodrighero+Odontologia+Rua+Cayowa%C3%A1+1071+Perdizes+S%C3%A3o+Paulo&output=embed";
      f.title = "Mapa: Rodrighero Odontologia, Rua Cayowaá, 1071, Perdizes";
      f.loading = "lazy"; f.referrerPolicy = "no-referrer-when-downgrade";
      $("#map").replaceChildren(f);
    });

    $("#year").textContent = new Date().getFullYear();
    if (hasGsap) { addEventListener("load", () => ScrollTrigger.refresh()); if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh()); }
  });
})();
