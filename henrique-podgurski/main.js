(() => {
  const WA = "5511956546924";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const store = {
    get: (k) => { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) {} }
  };

  document.addEventListener("DOMContentLoaded", () => {
    const body = document.body;
    const hasGsap = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined" && !reduce;
    if (hasGsap) gsap.registerPlugin(ScrollTrigger);

    // rolagem suave no relógio do GSAP (evita tremor nas cenas presas)
    let lenis = null;
    if (hasGsap && typeof Lenis !== "undefined" && !location.search.includes("nosmooth")) {
      lenis = new Lenis({ lerp: 0.1 });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }
    const scrollToEl = (el) => {
      if (!el) return;
      if (lenis) lenis.scrollTo(el, { offset: -80 });
      else el.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    };

    // ===== abertura: escala de cor =====
    const intro = $("#intro");
    const ready = () => {
      if (body.classList.contains("is-ready")) return;
      intro.classList.add("is-done");
      body.classList.remove("is-loading");
      body.classList.add("is-ready");
      store.set("hp-intro", "1");
      if (hasGsap) setTimeout(() => ScrollTrigger.refresh(), 900);
    };
    if (reduce || store.get("hp-intro") || location.search.includes("nointro")) ready();
    else {
      const teeth = $$("#introGuide i"), shade = $("#introShade");
      const shades = ["A1", "B1", "A2", "B2", "A3", "C1", "A2"];
      let i = 0;
      const tick = setInterval(() => {
        if (i < teeth.length) { teeth[i].classList.add("on"); shade.textContent = shades[i]; i++; }
        else { clearInterval(tick); setTimeout(ready, 380); }
      }, 190);
      $("#introSkip").addEventListener("click", () => { clearInterval(tick); ready(); });
      setTimeout(ready, 4000);
    }

    // ===== progresso, nav, whatsapp flutuante =====
    const nav = $("#nav"), bar = $("#progress"), waFloat = $("#waFloat");
    const onScroll = () => {
      const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
      nav.classList.toggle("is-solid", y > 40);
      waFloat.classList.toggle("is-on", y > innerHeight * 0.7);
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
      const id = a.getAttribute("href"), target = id.length > 1 && $(id);
      if (!target) return;
      e.preventDefault();
      if (menu.classList.contains("is-open")) setMenu(false);
      if (a.dataset.pre === "protese") prefill({ busca: ["dentadura"], obs: "Quero uma prótese com dente importado de várias camadas." });
      scrollToEl(target);
    }));

    // ===== cursor e botões magnéticos (só mouse) =====
    if (fine && !reduce) {
      body.classList.add("has-cursor");
      const cur = $(".cursor"), label = $("#cursorLabel");
      let mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my;
      addEventListener("pointermove", (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });
      const loop = () => { cx += (mx - cx) * 0.2; cy += (my - cy) * 0.2; cur.style.transform = `translate(${cx}px,${cy}px)`; requestAnimationFrame(loop); };
      loop();
      document.addEventListener("pointerover", (e) => {
        const reel = e.target.closest(".reel__phone"), hot = e.target.closest("a,button,.t,summary");
        cur.classList.toggle("is-label", !!reel);
        cur.classList.toggle("is-hover", !reel && !!hot);
        if (reel) label.textContent = reel.closest(".reel").classList.contains("is-playing") ? "pausar" : "assistir";
      });
      $$("[data-magnetic]").forEach((b) => {
        b.addEventListener("pointermove", (e) => {
          const r = b.getBoundingClientRect();
          b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px,${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
        });
        b.addEventListener("pointerleave", () => { b.style.transform = ""; });
      });
    }

    // ===== hero: palavra e retrato com parallax =====
    if (hasGsap) {
      gsap.to(".hero__word span", { xPercent: -18, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
      gsap.to("#heroFig", { yPercent: 12, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    }

    // ===== manifesto palavra por palavra =====
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
        ScrollTrigger.create({ trigger: man, start: "top 78%", end: "bottom 45%", scrub: true,
          onUpdate: (st) => { const n = Math.round(st.progress * words.length); words.forEach((w, i) => w.classList.toggle("is-on", i < n)); } });
      } else words.forEach((w) => w.classList.add("is-on"));
    }

    // ===== comparador: estoque x importado =====
    const cmp = $("#cmp"), legend = $$("#cmpLegend li"), verdict = $("#cmpVerdict");
    const kinds = {
      estoque: { h: "Dente de estoque", p: "“É um negócio chapadão que está ali só pra dizer que é um dente.” Mais barato na hora, mais fraco no dia a dia.", layers: 1 },
      importado: { h: "Dente importado em camadas", p: "Três ou quatro camadas de resina, com translucidez e anatomia. “É um dente lindo, maravilhoso e super resistente.”", layers: 4 }
    };
    let legendTimers = [];
    const setKind = (k) => {
      const d = kinds[k];
      cmp.classList.toggle("is-imp", k === "importado");
      $$(".cmp__switch button", cmp).forEach((b) => b.setAttribute("aria-selected", b.dataset.kind === k));
      verdict.innerHTML = "";
      const h = document.createElement("h3"); h.textContent = d.h;
      const p = document.createElement("p"); p.textContent = d.p;
      verdict.append(h, p);
      legendTimers.forEach(clearTimeout); legendTimers = [];
      legend.forEach((li, i) => {
        li.classList.remove("on");
        if (i < d.layers) legendTimers.push(setTimeout(() => li.classList.add("on"), reduce ? 0 : 140 * i));
      });
    };
    $$(".cmp__switch button", cmp).forEach((b) => b.addEventListener("click", () => setKind(b.dataset.kind)));
    setKind("estoque");
    // vira sozinho para o importado na primeira vez que a pessoa chega na seção
    new IntersectionObserver(([e], io) => {
      if (e.isIntersecting) { io.disconnect(); setTimeout(() => setKind("importado"), 1400); }
    }, { threshold: 0.6 }).observe(cmp);

    // ===== arcada interativa =====
    const NS = "http://www.w3.org/2000/svg";
    const types = [ // do centro para trás: central, lateral, canino, 1º pré, 2º pré, 1º molar, 2º molar
      { n: "incisivo central", w: 23, h: 17 }, { n: "incisivo lateral", w: 19, h: 16 }, { n: "canino", w: 21, h: 20 },
      { n: "1º pré-molar", w: 22, h: 21 }, { n: "2º pré-molar", w: 22, h: 21 }, { n: "1º molar", w: 30, h: 27 }, { n: "2º molar", w: 28, h: 26 }
    ];
    const totalW = types.reduce((s, t) => s + t.w, 0);
    const missing = new Set();
    const order = { up: [], down: [] };
    const build = (g, arch) => {
      const up = arch === "up";
      const cx = 210, cy = up ? 252 : 268, rx = up ? 152 : 142, ry = up ? 192 : 178;
      const span = 80; // graus por lado
      // gengiva: arco grosso por baixo dos dentes
      const a0 = (up ? 270 - span - 3 : 90 + span + 3) * Math.PI / 180, a1 = (up ? 270 + span + 3 : 90 - span - 3) * Math.PI / 180;
      const gum = document.createElementNS(NS, "path");
      gum.setAttribute("d", `M${(cx + rx * Math.cos(a0)).toFixed(1)} ${(cy + ry * Math.sin(a0)).toFixed(1)} A${rx} ${ry} 0 0 ${up ? 1 : 0} ${(cx + rx * Math.cos(a1)).toFixed(1)} ${(cy + ry * Math.sin(a1)).toFixed(1)}`);
      gum.setAttribute("class", "t__gum"); gum.setAttribute("stroke-width", "40");
      g.append(gum);
      [-1, 1].forEach((side) => {
        let acc = 0;
        types.forEach((t, i) => {
          const mid = (acc + t.w / 2) / totalW * span; acc += t.w;
          const deg = up ? 270 + side * mid : 90 - side * mid;
          const rad = deg * Math.PI / 180;
          const x = cx + rx * Math.cos(rad), y = cy + ry * Math.sin(rad);
          const quad = up ? (side < 0 ? 1 : 2) : (side < 0 ? 4 : 3);
          const num = `${quad}${i + 1}`;
          const el = document.createElementNS(NS, "g");
          el.setAttribute("class", "t");
          el.setAttribute("tabindex", "0");
          el.setAttribute("role", "button");
          el.setAttribute("aria-pressed", "false");
          el.setAttribute("aria-label", `Dente ${num}, ${t.n} ${up ? "de cima" : "de baixo"}, ${side < 0 ? "lado direito" : "lado esquerdo"}`);
          el.dataset.num = num; el.dataset.arch = arch;
          el.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(deg + 90).toFixed(1)})`);
          const r = document.createElementNS(NS, "rect");
          const w = t.w * 1.32, h = t.h * 1.35;
          r.setAttribute("x", -w / 2); r.setAttribute("y", -h / 2); r.setAttribute("width", w); r.setAttribute("height", h);
          r.setAttribute("rx", Math.min(w, h) / (i < 3 ? 2.1 : 3)); r.setAttribute("class", "t__body");
          const x1 = document.createElementNS(NS, "path");
          x1.setAttribute("d", `M${-w / 4} ${-h / 4} L${w / 4} ${h / 4} M${w / 4} ${-h / 4} L${-w / 4} ${h / 4}`);
          x1.setAttribute("class", "t__x");
          el.append(r, x1);
          g.append(el);
          order[arch][side < 0 ? 6 - i : 7 + i] = num;
        });
      });
    };
    build($("#archUp"), "up");
    build($("#archDown"), "down");

    const archCount = $("#archCount"), archTitle = $("#archTitle"), archText = $("#archText"), archCta = $("#archCta");
    const groups = (arch) => {
      const gs = []; let cur = 0;
      order[arch].forEach((n) => { if (missing.has(n)) cur++; else if (cur) { gs.push(cur); cur = 0; } });
      if (cur) gs.push(cur);
      return gs;
    };
    let archSummary = "";
    const renderArch = () => {
      $$(".t").forEach((t) => { const m = missing.has(t.dataset.num); t.classList.toggle("is-miss", m); t.setAttribute("aria-pressed", m); });
      const up = order.up.filter((n) => missing.has(n)).length, down = order.down.filter((n) => missing.has(n)).length, n = up + down;
      archCta.disabled = n === 0;
      if (!n) {
        archCount.textContent = "Nenhum dente marcado";
        archTitle.textContent = "Toque nos dentes que faltam";
        archText.textContent = "Marque na arcada os espaços de hoje, ou use os atalhos se falta tudo em cima ou embaixo. Você vê o caminho que costuma entrar na conversa.";
        archSummary = "";
        return;
      }
      const parts = [];
      if (up) parts.push(`${up} em cima`);
      if (down) parts.push(`${down} embaixo`);
      archCount.textContent = `${n} ${n === 1 ? "dente faltando" : "dentes faltando"} · ${parts.join(" · ")}`;
      archSummary = `Marquei no site que falta${n > 1 ? "m" : ""} ${n} dente${n > 1 ? "s" : ""} (${parts.join(", ")}).`;
      const full = (up === 14) || (down === 14), many = (up >= 8) || (down >= 8);
      const gs = [...groups("up"), ...groups("down")], longest = Math.max(...gs);
      let t, p;
      if (full && up === 14 && down === 14) {
        t = "Sem dentes em cima e embaixo";
        p = "O caminho costuma ser protocolo sobre implantes nas duas arcadas, ou dentadura com dente importado. A tomografia mostra se cabe carga imediata ou se o implante cicatriza antes.";
      } else if (full) {
        t = "Uma arcada inteira";
        p = "Protocolo fixo sobre implantes ou prótese total bem feita, com dente de várias camadas. Se carga imediata é segura, quem diz é o osso e o torque dos implantes.";
      } else if (many) {
        t = "Muitos dentes na mesma arcada";
        p = "Entra na conversa protocolo, ponte sobre implantes ou prótese parcial (PPR ou flexível). Também é preciso olhar se os dentes que ficaram têm saúde pra servir de apoio.";
      } else if (n === 1) {
        t = "Um dente";
        p = "Normalmente é implante com coroa: repõe o dente sem desgastar os vizinhos. Antes, tomografia pra ver osso e nervo.";
      } else if (longest >= 2) {
        t = `Um espaço de ${longest} dentes seguidos`;
        p = "Ponte sobre implantes ou implantes unitários costumam resolver, e às vezes uma prótese parcial é o melhor custo-benefício. A avaliação mostra o que faz sentido.";
      } else {
        t = "Dentes em lugares diferentes";
        p = "Implantes unitários onde precisa, ou uma prótese parcial removível bem planejada. Depende do osso e de quanto você quer algo fixo.";
      }
      archTitle.textContent = t;
      archText.textContent = p;
    };
    const toggleTooth = (el) => { const n = el.dataset.num; missing.has(n) ? missing.delete(n) : missing.add(n); renderArch(); };
    $("#archSvg").addEventListener("click", (e) => { const t = e.target.closest(".t"); if (t) toggleTooth(t); });
    $("#archSvg").addEventListener("keydown", (e) => { const t = e.target.closest(".t"); if (t && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); toggleTooth(t); } });
    $$(".arch__quick button").forEach((b) => b.addEventListener("click", () => {
      const a = b.dataset.all;
      if (a === "none") missing.clear();
      else { const all = order[a].every((n) => missing.has(n)); order[a].forEach((n) => all ? missing.delete(n) : missing.add(n)); }
      renderArch();
    }));
    archCta.addEventListener("click", () => {
      const up = order.up.filter((n) => missing.has(n)).length, down = order.down.filter((n) => missing.has(n)).length;
      const busca = (up === 14 || down === 14 || up >= 8 || down >= 8) ? ["protocolo"] : ["implante"];
      prefill({ busca, hoje: "estou com dente faltando", obs: archSummary });
      scrollToEl($("#agendar"));
    });
    renderArch();

    // ===== carga imediata: triagem =====
    const quizState = {}, labels = { fuma: "fumo", diabetes: "tenho diabetes", pressao: "tenho pressão alta", saude: "minha saúde geral não está em dia" };
    const quizOut = $("#quizOut"), quizBar = $("#quizBar"), quizTitle = $("#quizTitle"), quizText = $("#quizText"), quizCta = $("#quizCta");
    $$(".yn").forEach((g) => {
      $$("button", g).forEach((b) => b.addEventListener("click", () => {
        $$("button", g).forEach((x) => x.classList.remove("is-on", "is-bad"));
        b.classList.add("is-on");
        const bad = b.textContent.trim() === g.dataset.bad;
        if (bad) b.classList.add("is-bad");
        quizState[g.dataset.q] = bad;
        renderQuiz();
      }));
    });
    const renderQuiz = () => {
      const keys = Object.keys(quizState), done = keys.length === 4, bads = keys.filter((k) => quizState[k]);
      quizBar.style.width = (keys.length / 4) * 100 + "%";
      quizOut.classList.toggle("is-warn", bads.length > 0);
      quizCta.disabled = !done;
      if (!done) { quizTitle.textContent = `Faltam ${4 - keys.length} ${4 - keys.length === 1 ? "resposta" : "respostas"}`; quizText.textContent = "É uma triagem rápida, só pra você chegar na consulta sabendo o que perguntar."; return; }
      if (!bads.length) {
        quizTitle.textContent = "Bom sinal pra carga imediata.";
        quizText.textContent = "Com esses pré-requisitos, carga imediata pode entrar na conversa. Quem confirma é a tomografia e o torque dos implantes na hora da cirurgia.";
      } else {
        quizTitle.textContent = "Não é um não. É um cuidado a mais.";
        quizText.textContent = `Como você marcou que ${bads.map((k) => labels[k]).join(", ")}, o planejamento precisa ser mais cauteloso. Às vezes o caminho seguro é o implante cicatrizar antes da prótese fixa.`;
      }
    };
    quizCta.addEventListener("click", () => {
      const resp = Object.keys(labels).map((k) => `${{ fuma: "Fuma", diabetes: "Diabetes", pressao: "Pressão alta", saude: "Saúde geral em dia" }[k]}: ${k === "saude" ? (quizState[k] ? "não" : "sim") : (quizState[k] ? "sim" : "não")}`).join(" · ");
      prefill({ busca: ["carga imediata"], obs: `Fiz a triagem de carga imediata no site. ${resp}.` });
      scrollToEl($("#agendar"));
    });

    // ===== processo: imagem troca conforme a etapa =====
    const steps = $$(".step"), imgs = $$(".process__img"), stepNum = $("#stepNum");
    const setStep = (i) => {
      imgs.forEach((im, k) => im.classList.toggle("on", k === i));
      steps.forEach((s, k) => s.classList.toggle("on", k === i));
      stepNum.textContent = String(i + 1).padStart(2, "0");
    };
    setStep(0);
    const stepIo = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) setStep(steps.indexOf(e.target)); }), { rootMargin: "-45% 0px -45% 0px" });
    steps.forEach((s) => stepIo.observe(s));

    // ===== tratamentos: acordeão =====
    const sols = $$(".sol__item");
    sols.forEach((b) => b.addEventListener("click", () => {
      const open = !b.classList.contains("is-open");
      sols.forEach((x) => { x.classList.remove("is-open"); x.setAttribute("aria-expanded", "false"); });
      if (open) { b.classList.add("is-open"); b.setAttribute("aria-expanded", "true"); }
    }));

    // ===== reels: carregam e tocam só quando pedem =====
    const reels = $$(".reel[data-src]");
    reels.forEach((r) => {
      const v = $("video", r), phone = $(".reel__phone", r);
      if (v.dataset.poster) { v.poster = v.dataset.poster; phone.style.backgroundImage = `url(${v.dataset.poster})`; }
      const toggle = () => {
        if (!v.src) v.src = r.dataset.src;
        if (v.paused) {
          reels.forEach((o) => { if (o !== r) { const ov = $("video", o); if (!ov.paused) ov.pause(); } });
          v.play().catch(() => {});
        } else v.pause();
      };
      phone.addEventListener("click", toggle);
      v.addEventListener("play", () => r.classList.add("is-playing"));
      v.addEventListener("pause", () => r.classList.remove("is-playing"));
      v.addEventListener("ended", () => r.classList.remove("is-playing"));
      new IntersectionObserver(([e]) => { if (!e.isIntersecting && !v.paused) v.pause(); }).observe(r);
    });

    // trilho horizontal dos reels no desktop
    if (hasGsap) {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 901px)", () => {
        const sec = $("#tiktok"), track = $("#reelsTrack");
        sec.classList.add("is-hscroll");
        const dist = () => Math.max(0, track.scrollWidth - innerWidth);
        const tw = gsap.to(track, { x: () => -dist(), ease: "none",
          scrollTrigger: { trigger: sec, start: "top top", end: () => "+=" + dist(), pin: ".reels__pin", scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1 } });
        return () => { sec.classList.remove("is-hscroll"); tw.scrollTrigger && tw.scrollTrigger.kill(); tw.kill(); gsap.set(track, { clearProps: "transform" }); };
      });
    }

    // ===== contadores =====
    const fmt = (v, dec) => v.toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
    if (!reduce) {
      const cio = new IntersectionObserver((es) => es.forEach((e) => {
        if (!e.isIntersecting) return;
        cio.unobserve(e.target);
        const el = e.target, to = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0), t0 = performance.now();
        const step = (t) => { const p = Math.min(1, (t - t0) / 1600), k = 1 - Math.pow(1 - p, 3); el.textContent = fmt(to * k, dec); if (p < 1) requestAnimationFrame(step); };
        requestAnimationFrame(step);
      }), { threshold: 0.6 });
      $$("[data-count]").forEach((c) => cio.observe(c));
    }

    // ===== revelar ao rolar =====
    if (!reduce) {
      const rv = $$(".tooth__intro, .cmp, .arch__map, .arch__info, .carga__copy, .quiz, .process__head, .sol__item, .reels__head, .about__media, .about__copy, .faq__head, .faq details, .book__copy, .book__form, .place__copy, .place__map, .final > *");
      rv.forEach((el) => el.classList.add("rv"));
      const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
      rv.forEach((el) => io.observe(el));
    }

    // ===== agendamento: opções viram mensagem no WhatsApp =====
    const form = $("#bookForm"), preview = $("#waPreview"), err = $("#bookErr"), obs = $("#obs");
    const pills = {};
    $$(".pills", form).forEach((p) => {
      const name = p.dataset.name, single = p.hasAttribute("data-single");
      pills[name] = p;
      $$("button", p).forEach((b) => b.addEventListener("click", () => {
        if (single) $$("button", p).forEach((x) => x !== b && x.classList.remove("is-on"));
        b.classList.toggle("is-on", single ? true : !b.classList.contains("is-on"));
        renderMsg();
      }));
    });
    const picked = (name) => $$("button.is-on", pills[name]).map((b) => b.dataset.v);
    const list = (arr) => arr.length <= 1 ? arr.join("") : arr.slice(0, -1).join(", ") + " e " + arr.slice(-1);
    const msg = () => {
      const nome = form.elements.nome.value.trim();
      const busca = picked("busca"), hoje = picked("hoje")[0], per = picked("periodo")[0];
      let t = `Olá, Dr. Henrique! ${nome ? `Aqui é ${nome}. ` : ""}Vim pelo site e quero agendar uma avaliação`;
      t += busca.length ? ` de ${list(busca)}.` : ".";
      if (hoje) t += ` Hoje ${hoje}.`;
      if (per) t += ` Prefiro ${per}.`;
      const o = obs.value.trim();
      if (o) t += `\n\n${o}`;
      return t;
    };
    const renderMsg = () => { preview.textContent = msg(); };
    form.addEventListener("input", (e) => { if (e.target.name === "nome") { e.target.removeAttribute("aria-invalid"); err.hidden = true; } renderMsg(); });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const nome = form.elements.nome;
      if (!nome.value.trim()) { nome.setAttribute("aria-invalid", "true"); err.hidden = false; nome.focus(); return; }
      open(`https://wa.me/${WA}?text=${encodeURIComponent(msg())}`, "_blank", "noopener");
    });
    function prefill({ busca = [], hoje = "", obs: text = "" }) {
      $$("button", pills.busca).forEach((b) => b.classList.toggle("is-on", busca.includes(b.dataset.v)));
      if (hoje) $$("button", pills.hoje).forEach((b) => b.classList.toggle("is-on", b.dataset.v === hoje));
      if (text) obs.value = text;
      renderMsg();
      form.classList.remove("flash"); void form.offsetWidth; form.classList.add("flash");
    }
    renderMsg();

    // ===== mapa só quando pedem =====
    $("#mapLoad").addEventListener("click", () => {
      const f = document.createElement("iframe");
      f.src = "https://www.google.com/maps?q=Rua+Cachoeira+do+Campo+278+Jardim+Paragua%C3%A7u+S%C3%A3o+Paulo&output=embed";
      f.title = "Mapa: Rua Cachoeira do Campo, 278, Jardim Paraguaçu";
      f.loading = "lazy";
      f.referrerPolicy = "no-referrer-when-downgrade";
      $("#map").replaceChildren(f);
    });

    $("#year").textContent = new Date().getFullYear();
    if (hasGsap) {
      addEventListener("load", () => ScrollTrigger.refresh());
      if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
    }
  });
})();
