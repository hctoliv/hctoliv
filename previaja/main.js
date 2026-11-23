(() => {
  const CFG = window.PREVIAJA || {};
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wa = (msg) => `https://wa.me/${CFG.whatsapp || ""}?text=${encodeURIComponent(msg)}`;

  document.addEventListener("DOMContentLoaded", () => {
    // links de WhatsApp
    $$("[data-wa]").forEach((a) => { a.href = wa(a.dataset.wa); a.target = "_blank"; a.rel = "noopener"; });

    // nav
    const nav = $("#nav");
    const onScroll = () => nav.classList.toggle("is-solid", scrollY > 10);
    onScroll(); addEventListener("scroll", onScroll, { passive: true });

    // demonstração: troca de sites e endereço digitado
    const shots = $$("#screens img"), phone = $("#phoneShot"), slug = $("#urlSlug");
    const names = ["rodrighero", "larisseimoveis", "oficinadeestampas", "drhenrique", "ricardotattoo"];
    const mobile = ["rodrighero", "larisse-imoveis", "impressao45", "henrique-podgurski", "ricardo-tattoo-site"];
    let i = 0;
    const type = (txt) => {
      if (reduce) { slug.textContent = txt; return; }
      let k = 0; slug.textContent = "";
      const t = setInterval(() => { slug.textContent = txt.slice(0, ++k); if (k >= txt.length) clearInterval(t); }, 55);
    };
    const show = () => {
      shots.forEach((im, k) => im.classList.toggle("on", k === i));
      phone.style.opacity = 0;
      setTimeout(() => { phone.src = `img/ex-${mobile[i]}-m.webp`; phone.style.opacity = 1; }, 250);
      type(names[i]);
    };
    if (!reduce) setInterval(() => { i = (i + 1) % shots.length; show(); }, 3800);
    type(names[0]);

    // revelar
    if ("IntersectionObserver" in window && !reduce) {
      const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
      $$(".rv").forEach((el) => io.observe(el));
    } else $$(".rv").forEach((el) => el.classList.add("is-in"));

    // pedido de contato pelo WhatsApp
    const form = $("#form"), err = $("#formErr");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const f = form.elements, emp = f.empresa.value.trim(), nome = f.nome.value.trim();
      [f.empresa, f.nome].forEach((x) => x.toggleAttribute("aria-invalid", !x.value.trim()));
      if (!emp || !nome) { err.hidden = false; return; }
      err.hidden = true;
      let msg = `Olá! Aqui é ${nome}, da ${emp} (${f.ramo.value}). Quero um site para a minha empresa.`;
      if (f.link.value.trim()) msg += `\nInstagram/Google: ${f.link.value.trim()}`;
      const w = open(wa(msg), "_blank");
      if (w) w.opener = null; else location.href = wa(msg);
    });

    $("#year").textContent = new Date().getFullYear();
  });
})();
