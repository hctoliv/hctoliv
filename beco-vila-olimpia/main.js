(() => {
  const WA = "5511934292964";
  const PEOPLE = [6, 10, 20, 30, 50, 80, 120, 200];
  const DAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  const DAYS_S = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  // horário: [abre, fecha] em horas, por dia da semana (0 = domingo)
  const HOURS = { 1: [12, 15], 2: [12, 23], 3: [12, 23], 4: [12, 23], 5: [12, 23], 6: [12, 23] };
  // agenda publicada pelo Beco no Instagram (novembro/2026)
  const AGENDA = { mes: "Novembro", ano: 2026, m: 11, shows: [
    [3, "Samuel Mousse", "Pop/Rock"], [4, "Kim", "Flashback"], [5, "Samba do Beco", "Samba"], [6, "Kiko Perrone", "Blues"], [7, "Suelly Singer", "Pop/Rock"],
    [10, "Indira Castillo", "Pop/Rock"], [11, "Balada Pocket", "Flashback"], [12, "Samba do Beco", "Samba"], [13, "Manu Perez", "Pop"], [14, "Dudu Nicastro", "Pop/Rock"],
    [17, "Isix", "Flashback"], [18, "Kim", "Flashback"], [19, "Samba do Beco", "Samba"], [20, "Feriado", "", true], [21, "Sem programação musical", "", true],
    [24, "Maskitrio", "Pop/Rock"], [25, "Sabrina Caldana", "Flashback"], [26, "Samba do Beco", "Samba"], [27, "Samuel Mousse", "Pop/Rock"], [28, "Angélica Sansone", "Flashback"]
  ] };

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const store = { get: (k) => { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) {} } };

  // hora de São Paulo, independente do fuso de quem visita
  const spNow = () => {
    try {
      const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", hour12: false, weekday: "short" }).formatToParts(new Date()).map((x) => [x.type, x.value]));
      const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday);
      return { y: +p.year, m: +p.month, d: +p.day, h: (+p.hour % 24) + (+p.minute) / 60, wd };
    } catch (e) { const n = new Date(); return { y: n.getFullYear(), m: n.getMonth() + 1, d: n.getDate(), h: n.getHours() + n.getMinutes() / 60, wd: n.getDay() }; }
  };

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
    const scrollToEl = (el) => { if (!el) return; if (lenis) lenis.scrollTo(el, { offset: -40 }); else el.scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); };

    // letreiro acendendo
    const loader = $("#loader");
    const ready = () => { loader.classList.add("is-done"); body.classList.add("is-ready"); store.set("beco-intro", "1"); if (hasGsap) setTimeout(() => ScrollTrigger.refresh(), 700); };
    if (reduce || store.get("beco-intro")) ready(); else setTimeout(ready, 1600);

    // nav, progresso e WhatsApp flutuante
    const nav = $("#nav"), bar = $("#progress"), fl = $("#waFloat"), formSec = $("#eventos");
    const onScroll = () => {
      const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
      nav.classList.toggle("is-solid", y > 40);
      const fr = formSec.getBoundingClientRect();
      fl.classList.toggle("is-on", y > innerHeight * 0.8 && !(fr.top < innerHeight * 0.6 && fr.bottom > innerHeight * 0.4));
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
    menu.querySelectorAll(".menu__foot a").forEach((a) => a.addEventListener("click", () => setMenu(false)));

    // aberto agora?
    const now = spNow();
    const hrs = HOURS[now.wd];
    const fmt = (h) => (h % 1 ? `${Math.floor(h)}h${String(Math.round((h % 1) * 60)).padStart(2, "0")}` : `${h}h`);
    const nextOpen = () => {
      for (let i = 0; i < 8; i++) {
        const wd = (now.wd + i) % 7, hh = HOURS[wd];
        if (!hh) continue;
        if (i === 0 && now.h >= hh[0]) continue;
        return `${i === 0 ? "hoje" : i === 1 ? "amanhã" : DAYS[wd].toLowerCase()} às ${fmt(hh[0])}`;
      }
      return "";
    };
    const statusEl = $("#nowStatus"), nowBox = $("#now");
    if (hrs && now.h >= hrs[0] && now.h < hrs[1]) { nowBox.classList.add("is-open"); statusEl.textContent = `Aberto agora · até as ${fmt(hrs[1])}`; }
    else statusEl.textContent = `Fechado agora · abre ${nextOpen()}`;
    const row = $(`#hours tr[data-d="${now.wd}"]`); if (row) row.classList.add("is-today");

    // agenda
    const list = $("#agendaList");
    $("#agendaMonth").textContent = AGENDA.mes;
    const isThisMonth = now.y === AGENDA.ano && now.m === AGENDA.m;
    const afterMonth = now.y > AGENDA.ano || (now.y === AGENDA.ano && now.m > AGENDA.m);
    let next = null;
    AGENDA.shows.forEach(([d, a, g, off]) => {
      const wd = new Date(AGENDA.ano, AGENDA.m - 1, d).getDay();
      const li = document.createElement("li");
      li.dataset.g = g || "off";
      const past = afterMonth || (isThisMonth && d < now.d);
      if (past) li.classList.add("is-past");
      if (off) li.classList.add("is-off");
      if (!past && !off && !next) { next = { d, a, g, wd }; li.classList.add("is-next"); }
      li.innerHTML = `<span class="agenda__d">${String(d).padStart(2, "0")}/${String(AGENDA.m).padStart(2, "0")}<small>${DAYS_S[wd]}</small></span><span class="agenda__a"></span>${g ? `<span class="agenda__g">${g}</span>` : ""}`;
      $(".agenda__a", li).textContent = a;
      list.append(li);
    });
    const tk = $("#tonightK"), tn = $("#tonightName"), tm = $("#tonightMeta"), heroStage = $("#nowStage");
    if (next) {
      const today = isThisMonth && next.d === now.d;
      const tomorrow = isThisMonth && next.d === now.d + 1;
      tk.textContent = today ? "Hoje no palco" : "Próximo show";
      tn.textContent = next.a;
      tm.textContent = `${today ? "Hoje" : tomorrow ? "Amanhã" : DAYS[next.wd]}, ${String(next.d).padStart(2, "0")}/${String(AGENDA.m).padStart(2, "0")} · ${next.g}`;
      const gTxt = next.a.toLowerCase().includes(next.g.toLowerCase()) ? "" : ` (${next.g.toLowerCase()})`;
      heroStage.textContent = today ? `Hoje no palco: ${next.a}${gTxt}` : `Próximo show: ${next.a}, ${tomorrow ? "amanhã" : DAYS[next.wd].toLowerCase()}`;
      const nextLi = $(".is-next", list);
      if (nextLi) list.scrollTop = Math.max(0, nextLi.offsetTop - list.offsetTop - 80);
    } else {
      tk.textContent = "Agenda nova chegando";
      tn.textContent = "Siga o Beco";
      tm.textContent = "A curadoria do mês sai primeiro no Instagram";
    }
    $$("#agendaFilters button").forEach((b) => b.addEventListener("click", () => {
      $$("#agendaFilters button").forEach((x) => x.classList.toggle("is-on", x === b));
      const g = b.dataset.g;
      $$("li", list).forEach((li) => { li.hidden = g !== "todos" && li.dataset.g !== g && !(g === "Pop/Rock" && li.dataset.g === "Pop"); });
    }));

    // vídeo do topo: pausa fora da tela
    const vid = $("#heroVideo");
    if (vid) {
      if (reduce) { vid.removeAttribute("autoplay"); vid.pause(); }
      else new IntersectionObserver(([e]) => { if (e.isIntersecting) vid.play().catch(() => {}); else vid.pause(); }).observe(vid);
    }

    // portão: a janela abre até tomar a tela
    const gate = $(".gate"), win = $(".gate__win"), gText = $(".gate__text");
    if (hasGsap) {
      const st = { p: 0 };
      gsap.to(st, {
        p: 1, ease: "none",
        scrollTrigger: { trigger: gate, start: "top top", end: "+=140%", pin: ".gate__pin", scrub: 0.5, anticipatePin: 1 },
        onUpdate: () => {
          const k = Math.min(1, st.p / 0.7), e = 1 - Math.pow(1 - k, 2);
          const w0 = Math.min(innerWidth * (innerWidth > 900 ? 0.42 : 0.64), innerWidth > 900 ? 360 : 9999), h0 = Math.min(innerHeight * (innerWidth > 900 ? 0.62 : 0.52), innerWidth > 900 ? 520 : 9999);
          win.style.width = `${w0 + (innerWidth - w0) * e}px`;
          win.style.height = `${h0 + (innerHeight - h0) * e}px`;
          win.style.borderRadius = `${999 * (1 - e)}px ${999 * (1 - e)}px ${18 * (1 - e)}px ${18 * (1 - e)}px`;
          win.style.setProperty("--shade", Math.max(0, (st.p - 0.45) / 0.35).toFixed(3));
          gText.style.setProperty("--t", Math.max(0, Math.min(1, (st.p - 0.55) / 0.3)).toFixed(3));
        }
      });
    } else {
      win.style.width = "100%"; win.style.height = "100%"; win.style.borderRadius = "0"; win.style.setProperty("--shade", 1); gText.style.setProperty("--t", 1);
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
    if (hasGsap) ScrollTrigger.create({ trigger: man, start: "top 80%", end: "bottom 45%", scrub: true, onUpdate: (st) => { const n = Math.round(st.progress * words.length); words.forEach((w, i) => w.classList.toggle("is-on", i < n)); } });
    else words.forEach((w) => w.classList.add("is-on"));

    // casas: trilho horizontal no desktop
    if (hasGsap) {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 901px)", () => {
        const sec = $(".houses"), track = $("#housesTrack");
        sec.classList.add("is-hscroll");
        const dist = () => Math.max(0, track.scrollWidth - innerWidth);
        const tw = gsap.to(track, { x: () => -dist(), ease: "none", scrollTrigger: { trigger: sec, start: "top top", end: () => "+=" + dist(), pin: ".houses__pin", scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1 } });
        return () => { sec.classList.remove("is-hscroll"); tw.scrollTrigger && tw.scrollTrigger.kill(); tw.kill(); gsap.set(track, { clearProps: "transform" }); };
      });
    }

    // chope: o copo enche com a rolagem
    const beer = $("#glassBeer"), ml = $("#glassMl"), tapNum = $("#tapNum"), tSteps = $$("#tapSteps li");
    const setTap = (p) => {
      const fill = Math.max(0, Math.min(1, (p - 0.08) / 0.8));
      beer.parentElement.style.setProperty("--fill", fill.toFixed(3));
      ml.textContent = `${Math.round(fill * 40) * 10} ml`;
      tapNum.textContent = String(Math.max(1, Math.min(21, Math.round(1 + p * 2.4 * 20))));
      const s = Math.min(tSteps.length - 1, Math.floor(p * tSteps.length));
      tSteps.forEach((li, i) => li.classList.toggle("on", i === s));
    };
    if (hasGsap) {
      $(".tap").classList.add("is-pinned");
      ScrollTrigger.create({ trigger: ".tap", start: "top top", end: "+=180%", pin: ".tap__pin", anticipatePin: 1, onUpdate: (st) => setTap(st.progress) });
      setTap(0);
    } else setTap(1);

    // pratos: as fileiras andam com a rolagem
    $$(".plates__row").forEach((r) => {
      const dir = +r.dataset.dir;
      if (hasGsap) gsap.fromTo(r, { x: dir < 0 ? 0 : -260 }, { x: dir < 0 ? -260 : 0, ease: "none", scrollTrigger: { trigger: ".plates", start: "top bottom", end: "bottom top", scrub: 0.4 } });
    });

    // contadores
    if (!reduce) {
      const cio = new IntersectionObserver((es) => es.forEach((e) => {
        if (!e.isIntersecting) return;
        cio.unobserve(e.target);
        const el = e.target, to = +el.dataset.count, t0 = performance.now();
        const step = (t) => { const p = Math.min(1, (t - t0) / 1400), k = 1 - Math.pow(1 - p, 3); el.textContent = String(Math.round(to * k)); if (p < 1) requestAnimationFrame(step); };
        requestAnimationFrame(step);
      }), { threshold: 0.6 });
      $$("[data-count]").forEach((c) => cio.observe(c));
    }

    // revelar
    if (!reduce && "IntersectionObserver" in window) {
      const rv = $$(".manifesto, .houses__head, .stage__copy, .agenda, .plates__head, .m, .events__copy, .form, .visit__photo, .visit__copy, .foot__big");
      rv.forEach((el) => el.classList.add("rv"));
      const ro = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); ro.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
      rv.forEach((el) => ro.observe(el));
    }

    // eventos: comanda que vira mensagem no WhatsApp
    const form = $("#form"), preview = $("#preview"), err = $("#formErr"), qty = $("#qty"), qtyLbl = $("#qtyLbl"), dataIn = $("#dataIn");
    $("#cmdNum").textContent = String(Math.floor(1000 + Math.random() * 8999));
    const iso = `${now.y}-${String(now.m).padStart(2, "0")}-${String(now.d).padStart(2, "0")}`;
    dataIn.min = iso;
    const groups = {};
    $$(".pills", form).forEach((p) => {
      const single = p.hasAttribute("data-single"); groups[p.dataset.name] = p;
      $$("button", p).forEach((b) => b.addEventListener("click", () => {
        if (single) $$("button", p).forEach((x) => x.classList.toggle("is-on", x === b));
        else b.classList.toggle("is-on");
        render();
      }));
    });
    const picked = (n) => $$("button.is-on", groups[n]).map((b) => b.dataset.v);
    const listTxt = (a) => a.length <= 1 ? a.join("") : a.slice(0, -1).join(", ") + " e " + a.slice(-1);
    const qtyText = () => { const v = PEOPLE[+qty.value]; return v >= 200 ? "200 pessoas ou mais" : `${v} pessoas`; };
    const dateText = () => {
      if (!dataIn.value) return "";
      const [y, m, d] = dataIn.value.split("-").map(Number);
      return `${DAYS[new Date(y, m - 1, d).getDay()].toLowerCase()}, ${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`;
    };
    const msg = () => {
      const nome = form.elements.nome.value.trim(), grupo = form.elements.grupo.value.trim();
      const oc = picked("ocasiao")[0] || "um evento", per = picked("periodo")[0], itens = picked("itens"), dt = dateText();
      let t = `Olá, Beco! ${nome ? `Aqui é ${nome}${grupo ? `, do ${grupo}` : ""}. ` : ""}Quero organizar ${oc} aí:\n`;
      t += `\n• Pessoas: cerca de ${qtyText()}`;
      t += `\n• Quando: ${dt ? dt : "data a combinar"}${per ? `, ${per}` : ""}`;
      if (itens.length) t += `\n• Não pode faltar: ${listTxt(itens)}`;
      t += `\n\nPodem me passar as opções?`;
      return t;
    };
    const render = () => {
      qtyLbl.textContent = qtyText();
      qty.style.setProperty("--p", `${(+qty.value / 7) * 100}%`);
      preview.textContent = msg();
    };
    qty.addEventListener("input", render);
    form.addEventListener("input", (e) => { if (e.target.name === "nome") { e.target.removeAttribute("aria-invalid"); err.hidden = true; } render(); });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const n = form.elements.nome;
      if (!n.value.trim()) { n.setAttribute("aria-invalid", "true"); err.hidden = false; n.focus(); return; }
      const url = `https://wa.me/${WA}?text=${encodeURIComponent(msg())}`;
      const w = open(url, "_blank");
      if (w) w.opener = null; else location.href = url;
    });
    render();

    $("#year").textContent = now.y;
    if (hasGsap) { addEventListener("load", () => ScrollTrigger.refresh()); if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh()); }
  });
})();
