// mi-web/script.js
(function () {
  "use strict";
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = window.matchMedia("(hover: hover)").matches;

  // Declarado arriba para que applyTheme() pueda usarlo sin dar error
  let snowColor = "rgba(255,255,255,.85)";

  /* ====== Tema claro/oscuro ====== */
  const KEY = "mi-web-theme";
  const themeToggle = document.getElementById("themeToggle");
  const themeColor = document.querySelector('meta[name="theme-color"]');
  const store = (t) => { try { localStorage.setItem(KEY, t); } catch (e) {} };
  const getStore = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };

  function applyTheme(t) {
    root.setAttribute("data-theme", t);
    store(t);
    if (themeColor) themeColor.setAttribute("content", t === "dark" ? "#0a1024" : "#f4f6fb");
    if (themeToggle) {
      themeToggle.setAttribute("aria-pressed", String(t === "dark"));
      themeToggle.setAttribute("aria-label", t === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
    }
    readSnowColor();
  }
  applyTheme(getStore() || "dark");
  if (themeToggle) themeToggle.addEventListener("click", () =>
    applyTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark"));

  /* ====== Año ====== */
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  /* ====== Estrellas ====== */
  const starsBox = document.getElementById("stars");
  if (starsBox) {
    const n = window.innerWidth < 600 ? 40 : 80;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < n; i++) {
      const s = document.createElement("span");
      s.className = "star";
      const sz = Math.random() * 2 + 0.6;
      s.style.width = s.style.height = sz + "px";
      s.style.left = Math.random() * 100 + "%";
      s.style.top = Math.random() * 58 + "%";
      s.style.animationDelay = (Math.random() * 3.5).toFixed(2) + "s";
      s.style.animationDuration = (2.5 + Math.random() * 3).toFixed(2) + "s";
      frag.appendChild(s);
    }
    starsBox.appendChild(frag);
  }

  /* ====== Parallax (solo capas sin animación propia) ====== */
  const layers = [
    { el: document.getElementById("sun"),      sf: 0.05, mf: 8 },
    { el: document.getElementById("stars"),    sf: 0.03, mf: 4 },
    { el: document.getElementById("m-far"),    sf: 0.06, mf: 10 },
    { el: document.getElementById("m-mid"),    sf: 0.12, mf: 20 },
    { el: document.getElementById("m-near"),   sf: 0.20, mf: 32 },
    { el: document.getElementById("m-forest"), sf: 0.32, mf: 46 },
  ].filter((l) => l.el);

  const hero = document.getElementById("hero");
  const spotlight = document.getElementById("spotlight");
  let sy = 0, mx = 0, my = 0, heroVisible = true, ticking = false;

  function paint() {
    for (const l of layers) {
      const y = Math.min(sy, window.innerHeight) * l.sf;
      const x = mx * l.mf;
      l.el.style.transform = "translate3d(" + x + "px," + y + "px,0)";
    }
    ticking = false;
  }
  function queue() { if (!ticking && heroVisible) { ticking = true; requestAnimationFrame(paint); } }

  if (!reduceMotion) {
    window.addEventListener("scroll", () => { sy = window.scrollY; queue(); }, { passive: true });
    if (hero) hero.addEventListener("mousemove", (e) => {
      const r = hero.getBoundingClientRect();
      mx = (e.clientX - r.left) / r.width - 0.5;
      my = (e.clientY - r.top) / r.height - 0.5;
      if (spotlight) {
        spotlight.style.setProperty("--mx", ((mx + 0.5) * 100) + "%");
        spotlight.style.setProperty("--my", ((my + 0.5) * 100) + "%");
      }
      queue();
    });
    if ("IntersectionObserver" in window && hero) {
      new IntersectionObserver((es) => { heroVisible = es[0].isIntersecting; }, { threshold: 0 })
        .observe(hero);
    }
  }

  /* ====== Tarjetas inclinadas ====== */
  if (canHover && !reduceMotion) {
    document.querySelectorAll(".card").forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.style.transform = "perspective(800px) rotateX(" + ((0.5 - py) * 10) + "deg) rotateY(" + ((px - 0.5) * 12) + "deg) translateY(-4px)";
        card.style.setProperty("--cx", (px * 100) + "%");
        card.style.setProperty("--cy", (py * 100) + "%");
      });
      card.addEventListener("mouseleave", () => { card.style.transform = ""; });
    });
  }

  /* ====== Reveal (robusto: si falla, todo queda visible) ====== */
  const revealEls = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  if ("IntersectionObserver" in window && !reduceMotion) {
    revealEls.forEach((el) => el.classList.add("js-reveal"));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("visible"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach((el) => io.observe(el));
  }

  /* ====== Scrollspy ====== */
  const links = document.querySelectorAll('.nav-list a[href^="#"]');
  const secs = document.querySelectorAll("main section[id], footer[id]");
  if ("IntersectionObserver" in window) {
    const so = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + en.target.id));
      });
    }, { threshold: 0.25, rootMargin: "-10% 0px -30% 0px" });
    secs.forEach((s) => so.observe(s));
  }

  /* ====== Volver arriba ====== */
  const top = document.getElementById("backToTop");
  window.addEventListener("scroll", () => { if (top) top.classList.toggle("show", window.scrollY > 480); }, { passive: true });
  if (top) top.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }));

  /* ====== Barra de progreso de scroll ====== */
  const bar = document.getElementById("scrollProgress");
  function paintProgress() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? (window.scrollY / max) * 100 : 0;
    if (bar) bar.style.width = p + "%";
  }
  window.addEventListener("scroll", paintProgress, { passive: true });
  window.addEventListener("resize", paintProgress);
  paintProgress();

  /* ====== Nieve ====== */
  const canvas = document.getElementById("snow");
  let ctx, flakes = [], W = 0, H = 0;
  function readSnowColor() { snowColor = (getComputedStyle(root).getPropertyValue("--snow") || "").trim() || "rgba(255,255,255,.85)"; }
  function resize() { if (!canvas) return; W = canvas.width = innerWidth; H = canvas.height = innerHeight;
    const n = Math.min(90, Math.floor(W / 16));
    flakes = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 2.4 + 0.6, s: Math.random() * 0.7 + 0.25, d: Math.random() * Math.PI * 2 })); }
  function loop() { if (!ctx) return; ctx.clearRect(0, 0, W, H); ctx.fillStyle = snowColor;
    for (const f of flakes) { ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.283); ctx.fill();
      f.y += f.s; f.d += 0.01; f.x += Math.sin(f.d) * 0.4; if (f.y > H + 5) { f.y = -5; f.x = Math.random() * W; } }
    requestAnimationFrame(loop); }
  if (canvas && !reduceMotion) { ctx = canvas.getContext("2d"); if (ctx) { readSnowColor(); resize(); addEventListener("resize", resize); loop(); } else canvas.style.display = "none"; }
})();