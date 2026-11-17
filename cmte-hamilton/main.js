(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const lerp = (a, b, t) => a + (b - a) * t;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const store = { get: (k) => { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) {} } };

  // Cenas do voo: foto + enquadramentos [t, x, y, zoom] (x e y em fração da foto).
  // "exit" é o ponto da foto por onde a câmera atravessa para a próxima cena.
  const SCENES = [
    { sub: [0.55, 0.32], src: "img/voo/01-heliponto.webp", keys: [[0, 0.5, 0.45, 1], [0.5, 0.56, 0.36, 1.22], [0.8, 0.69, 0.32, 1.7]], exit: [0.715, 0.31] },
    { sub: [0.6, 0.38], src: "img/voo/02-cockpit-solo.webp", keys: [[0, 0.33, 0.3, 2.1], [0.3, 0.52, 0.42, 1], [0.6, 0.6, 0.38, 1.12], [0.8, 0.38, 0.3, 1.55]], exit: [0.34, 0.26] },
    { sub: [0.64, 0.5], src: "img/voo/03-por-do-sol.webp", keys: [[0, 0.22, 0.34, 2.2], [0.3, 0.5, 0.5, 1], [0.6, 0.6, 0.5, 1.12], [0.8, 0.3, 0.45, 1.5]], exit: [0.2, 0.42] },
    { sub: [0.74, 0.5], src: "img/voo/04-voando.webp", keys: [[0, 0.14, 0.45, 2.2], [0.3, 0.5, 0.5, 1], [0.6, 0.66, 0.48, 1.12], [0.8, 0.22, 0.4, 1.5]], exit: [0.13, 0.38] },
    { sub: [0.66, 0.45], src: "img/voo/05-tripulacao.webp", keys: [[0, 0.12, 0.32, 2.2], [0.35, 0.5, 0.5, 1], [0.7, 0.62, 0.45, 1.15], [1, 0.62, 0.45, 1.22]], exit: null }
  ];
  const ALT = [0, 40, 1800, 2400, 3100]; // pés, por cena (narrativa)
  const HDG = [352, 4, 288, 310, 335];

  document.addEventListener("DOMContentLoaded", () => {
    const body = document.body;

    // ---------- rolagem suave ----------
    let lenis = null;
    if (!reduce && typeof Lenis !== "undefined") {
      lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9 });
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
    const scrollToEl = (el) => { if (!el) return; if (lenis) lenis.scrollTo(el, { offset: 0, duration: 2.2 }); else el.scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); };

    // ---------- pré-voo (carrega as fotos do voo) ----------
    const pre = $("#preflight"), preBar = $("#preBar"), prePct = $("#prePct"), preGo = $("#preGo"), items = $$("#checklist li");
    const imgs = SCENES.map((s) => { const im = new Image(); im.decoding = "async"; im.src = s.src; return im; });
    let loaded = 0, started = false;
    const t0 = performance.now();
    const takeoff = () => {
      if (started) return; started = true;
      pre.classList.add("is-done"); body.classList.remove("is-loading");
      store.set("cmte-pre", "1");
      if (lenis) lenis.start();
    };
    const onLoad = () => {
      loaded++;
      const pct = Math.round((loaded / imgs.length) * 100);
      preBar.style.width = pct + "%"; prePct.textContent = pct;
      items.forEach((li, i) => { if (i < Math.ceil((loaded / imgs.length) * items.length)) li.classList.add("on"); });
      if (loaded === imgs.length) {
        preGo.disabled = false;
        const wait = store.get("cmte-pre") ? 200 : Math.max(0, 1900 - (performance.now() - t0));
        setTimeout(takeoff, wait);
      }
    };
    imgs.forEach((im) => { if (im.complete && im.naturalWidth) onLoad(); else { im.onload = onLoad; im.onerror = onLoad; } });
    preGo.addEventListener("click", takeoff);
    if (lenis) lenis.stop();
    setTimeout(() => { if (!started) { preGo.disabled = false; takeoff(); } }, 9000);

    // ---------- câmera ----------
    const canvas = $("#cam"), ctx = canvas.getContext("2d", { alpha: false });
    const flash = $("#flash");
    let W = 0, H = 0;
    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      W = canvas.width = Math.round(innerWidth * dpr);
      H = canvas.height = Math.round(innerHeight * dpr);
      ctx.imageSmoothingQuality = "high";
    };
    resize();
    addEventListener("resize", resize);

    // em tela vertical o corte é estreito: com a câmera aberta, o enquadramento segue a pessoa
    const frameFor = (scene, c) => {
      if (W / H >= 1) return c;
      const f = clamp((1.6 - c.s) / 0.6, 0, 1);
      return { x: lerp(c.x, scene.sub[0], f), y: lerp(c.y, scene.sub[1], f), s: c.s };
    };
    const camAt = (scene, t) => frameFor(scene, camRaw(scene, t));
    const camRaw = (scene, t) => {
      const k = scene.keys;
      if (t <= k[0][0]) return { x: k[0][1], y: k[0][2], s: k[0][3] };
      for (let i = 0; i < k.length - 1; i++) {
        if (t <= k[i + 1][0]) {
          const e = smooth(k[i][0], k[i + 1][0], t);
          return { x: lerp(k[i][1], k[i + 1][1], e), y: lerp(k[i][2], k[i + 1][2], e), s: lerp(k[i][3], k[i + 1][3], e) };
        }
      }
      const l = k[k.length - 1];
      return { x: l[1], y: l[2], s: l[3] };
    };
    const draw = (img, cam, alpha, blur) => {
      if (!img.naturalWidth || alpha <= 0.002) return;
      const iw = img.naturalWidth, ih = img.naturalHeight;
      const base = Math.max(W / iw, H / ih);
      const pass = (s, a) => {
        const sc = base * s, vw = W / sc, vh = H / sc;
        const cx = clamp(cam.x * iw, vw / 2, iw - vw / 2), cy = clamp(cam.y * ih, vh / 2, ih - vh / 2);
        ctx.globalAlpha = a;
        ctx.drawImage(img, W / 2 - cx * sc, H / 2 - cy * sc, iw * sc, ih * sc);
      };
      pass(cam.s, alpha);
      if (blur > 0.01 && !reduce) for (let i = 1; i <= 3; i++) pass(cam.s * (1 + blur * 0.045 * i), alpha * 0.2);
      ctx.globalAlpha = 1;
    };

    // ---------- estado da rolagem ----------
    const scenesEl = $$(".scene"), flightEl = $("#flight");
    const hudBars = $$("#hudScenes li").map((li) => { const s = document.createElement("span"); li.append(s); return s; });
    let tops = [], heights = [];
    const measure = () => { tops = scenesEl.map((s) => s.offsetTop); heights = scenesEl.map((s) => s.offsetHeight); };
    measure();
    addEventListener("resize", measure);
    addEventListener("load", measure);

    let shown = 0; // progresso global exibido (cena + t), com inércia
    const progressAt = (y) => {
      for (let i = scenesEl.length - 1; i >= 0; i--) if (y >= tops[i]) return i + clamp((y - tops[i]) / heights[i], 0, 1);
      return 0;
    };

    // ---------- HUD ----------
    const hudAlt = $("#hudAlt"), hudSpd = $("#hudSpd"), hudHdg = $("#hudHdg"), hudTime = $("#hudTime"), hudGeo = $("#hudGeo");
    const recStart = performance.now();
    const pad = (n, l = 2) => String(Math.floor(n)).padStart(l, "0");

    // ---------- som do rotor (WebAudio, só se a pessoa ligar) ----------
    const soundBtn = $("#sound"), soundLbl = $("#soundLbl");
    let audio = null;
    const startAudio = () => {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      const ac = new AC();
      const len = ac.sampleRate * 2, buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
      const noise = ac.createBufferSource(); noise.buffer = buf; noise.loop = true;
      const band = ac.createBiquadFilter(); band.type = "lowpass"; band.frequency.value = 420;
      const amp = ac.createGain(); amp.gain.value = 0.55;
      const lfo = ac.createOscillator(); lfo.type = "sine"; lfo.frequency.value = 6.4;
      const lfoGain = ac.createGain(); lfoGain.gain.value = 0.45;
      lfo.connect(lfoGain).connect(amp.gain);
      const whine = ac.createOscillator(); whine.type = "triangle"; whine.frequency.value = 1650;
      const whineGain = ac.createGain(); whineGain.gain.value = 0.004;
      const master = ac.createGain(); master.gain.value = 0;
      noise.connect(band).connect(amp).connect(master);
      whine.connect(whineGain).connect(master);
      master.connect(ac.destination);
      noise.start(); lfo.start(); whine.start();
      return { ac, master, lfo };
    };
    soundBtn.addEventListener("click", () => {
      const on = soundBtn.getAttribute("aria-pressed") !== "true";
      soundBtn.setAttribute("aria-pressed", on);
      soundLbl.textContent = on ? "Som ligado" : "Som do rotor";
      if (on && !audio) audio = startAudio();
      if (audio) { audio.ac.resume(); audio.master.gain.setTargetAtTime(on ? 0.32 : 0, audio.ac.currentTime, 0.4); }
    });

    // ---------- loop ----------
    const copies = scenesEl.map((s) => s.querySelector(".scene__pin"));
    const hint = $(".scene__hint");
    let lastY = scrollY, vel = 0, ground = false;
    const frame = (now) => {
      requestAnimationFrame(frame);
      const y = lenis ? lenis.scroll : scrollY;
      vel = lerp(vel, Math.abs(y - lastY), 0.1); lastY = y;
      const flightEnd = flightEl.offsetTop + flightEl.offsetHeight;
      const isGround = y > flightEnd - innerHeight * 0.02;
      if (isGround !== ground) { ground = isGround; body.classList.toggle("is-ground", ground); }
      if (audio) audio.master.gain.setTargetAtTime(ground || soundBtn.getAttribute("aria-pressed") !== "true" ? 0 : 0.32, audio.ac.currentTime, 0.5);
      if (ground) return;

      const target = progressAt(y);
      shown = reduce ? target : lerp(shown, target, 0.14);
      const i = clamp(Math.floor(shown), 0, SCENES.length - 1);
      const t = shown - i;

      // textos de cada cena
      scenesEl.forEach((s, k) => {
        const local = k === i ? t : k < i ? 1 : 0;
        const o = k === 0 ? 1 - smooth(0.3, 0.55, local) : smooth(0.06, 0.2, local) * (1 - smooth(0.62, 0.76, local));
        copies[k].style.setProperty("--o", o.toFixed(3));
      });
      if (hint) hint.style.setProperty("--o", (1 - smooth(0, 0.08, shown)).toFixed(3));

      // câmera
      ctx.globalAlpha = 1; ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
      const sc = SCENES[i];
      const cam = camAt(sc, Math.min(t, 0.8));
      let blur = clamp(vel / 40, 0, 0.6), fl = 0;
      if (t > 0.8 && sc.exit && SCENES[i + 1]) {
        const k = smooth(0.8, 1, t);
        const out = { x: lerp(cam.x, sc.exit[0], k), y: lerp(cam.y, sc.exit[1], k), s: cam.s * (1 + 3.4 * k * k) };
        const nx = SCENES[i + 1], inCam = camAt(nx, 0);
        const inc = { x: inCam.x, y: inCam.y, s: inCam.s * (1 + (1 - k) * 0.7) };
        const tb = Math.sin(k * Math.PI);
        draw(imgs[i], out, 1, tb + blur);
        draw(imgs[i + 1], inc, smooth(0.3, 0.85, k), tb * 0.8 + blur);
        fl = Math.max(0, 1 - Math.abs(k - 0.55) / 0.22) * 0.35;
      } else {
        draw(imgs[i], cam, 1, blur);
      }
      flash.style.opacity = reduce ? 0 : fl.toFixed(3);

      // HUD
      const g = shown;
      const ai = clamp(Math.floor(g), 0, ALT.length - 1), an = Math.min(ALT.length - 1, ai + 1);
      const alt = lerp(ALT[ai], ALT[an], smooth(0.7, 1, g - ai)) + Math.sin(now / 900) * (ai > 1 ? 6 : 0);
      hudAlt.textContent = Math.max(0, Math.round(alt)).toLocaleString("pt-BR");
      hudSpd.textContent = pad(clamp(Math.round((ai > 1 ? 88 : 0) + vel * 1.4), 0, 160), 3);
      hudHdg.textContent = pad(lerp(HDG[ai], HDG[an], smooth(0.7, 1, g - ai)) + Math.sin(now / 2600) * 2, 3);
      const el = (now - recStart) / 1000;
      hudTime.textContent = `${pad(el / 3600)}:${pad((el / 60) % 60)}:${pad(el % 60)}`;
      const lat = 23 + (30 + g * 2.2) / 60, lon = 46 + (38 - g * 3.1) / 60;
      hudGeo.textContent = `S ${Math.floor(lat)}°${pad((lat % 1) * 60)}′  W 0${Math.floor(lon)}°${pad((lon % 1) * 60)}′`;
      hudBars.forEach((b, k) => { b.style.transform = `scaleX(${clamp(g - k, 0, 1)})`; });
    };
    requestAnimationFrame(frame);

    // ---------- nav ----------
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

    // ---------- terra firme: janela em arco, livro, revelações ----------
    const archImg = $(".arch__window img"), cover = $(".book__cover img");
    const groundFx = () => {
      const r1 = archImg.parentElement.getBoundingClientRect();
      const p1 = clamp(1 - (r1.top + r1.height / 2) / (innerHeight * 1.2), 0, 1);
      archImg.style.setProperty("--s", (1.3 - p1 * 0.3).toFixed(3));
      const r2 = cover.getBoundingClientRect();
      const p2 = clamp(1 - (r2.top + r2.height / 2) / innerHeight, 0, 1);
      cover.style.setProperty("--ry", `${(-16 + p2 * 22).toFixed(1)}deg`);
    };
    addEventListener("scroll", groundFx, { passive: true });
    groundFx();
    if (!reduce && "IntersectionObserver" in window) {
      const rv = $$(".book__cover, .book__copy, .tv__copy, .tv__card, .crew__copy, .crew__photo, .hire__copy, .form");
      rv.forEach((el) => el.classList.add("rv"));
      const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -10% 0px" });
      rv.forEach((el) => io.observe(el));
    }

    // ---------- contratar: mensagem pronta ----------
    const form = $("#form"), err = $("#formErr");
    $$(".pills button", form).forEach((b) => b.addEventListener("click", () => {
      $$(".pills button", form).forEach((x) => x.classList.toggle("is-on", x === b));
    }));
    const msg = () => {
      const f = form.elements, tipo = ($(".pills .is-on", form) || {}).dataset?.v || "um contato";
      const nome = f.nome.value.trim(), emp = f.empresa.value.trim(), cid = f.cidade.value.trim(), dt = f.data.value.trim(), m = f.msg.value.trim();
      let t = `Olá, equipe do Comandante Hamilton! Meu nome é ${nome}${emp ? `, da ${emp}` : ""}. Vim pelo site e gostaria de um orçamento para ${tipo}.`;
      if (cid || dt) t += ` ${cid ? `Local: ${cid}.` : ""}${dt ? ` Data: ${dt}.` : ""}`;
      if (m) t += `\n\n${m}`;
      return t;
    };
    const valid = () => {
      const n = form.elements.nome;
      if (n.value.trim()) return true;
      n.setAttribute("aria-invalid", "true"); err.hidden = false; n.focus(); return false;
    };
    form.elements.nome.addEventListener("input", (e) => { e.target.removeAttribute("aria-invalid"); err.hidden = true; });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!valid()) return;
      open(`https://wa.me/5511989240812?text=${encodeURIComponent(msg())}`, "_blank", "noopener");
    });
    $("#viaMail").addEventListener("click", () => {
      if (!valid()) return;
      location.href = `mailto:comercialcmte@gmail.com?subject=${encodeURIComponent("Orçamento pelo site")}&body=${encodeURIComponent(msg())}`;
    });

    $("#year").textContent = new Date().getFullYear();
  });
})();
