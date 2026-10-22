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

  /* ====== Tiempo (Open-Meteo) ====== */
  const weatherIcon = document.getElementById("weatherIcon");
  const weatherTemp = document.getElementById("weatherTemp");
  const weatherDescription = document.getElementById("weatherDescription");
  const weatherMax = document.getElementById("weatherMax");
  const weatherMin = document.getElementById("weatherMin");
  const weatherHour = document.getElementById("weatherHour");

  const weatherCodeMap = {
    0: { label: "Despejado", icon: "☀️" },
    1: { label: "Mayormente despejado", icon: "🌤️" },
    2: { label: "Parcialmente nublado", icon: "⛅" },
    3: { label: "Nublado", icon: "☁️" },
    45: { label: "Neblina", icon: "🌫️" },
    48: { label: "Neblina con escarcha", icon: "🌫️" },
    51: { label: "Llovizna ligera", icon: "🌦️" },
    53: { label: "Llovizna", icon: "🌦️" },
    55: { label: "Llovizna fuerte", icon: "🌧️" },
    56: { label: "Llovizna helada", icon: "🌧️" },
    57: { label: "Llovizna helada fuerte", icon: "🌧️" },
    61: { label: "Lluvia ligera", icon: "🌦️" },
    63: { label: "Lluvia moderada", icon: "🌧️" },
    65: { label: "Lluvia fuerte", icon: "🌧️" },
    66: { label: "Lluvia helada", icon: "🌧️" },
    67: { label: "Lluvia helada fuerte", icon: "🌧️" },
    71: { label: "Nieve ligera", icon: "🌨️" },
    73: { label: "Nieve moderada", icon: "🌨️" },
    75: { label: "Nieve fuerte", icon: "❄️" },
    77: { label: "Granizo", icon: "🌨️" },
    80: { label: "Chubascos", icon: "🌦️" },
    81: { label: "Lluvia abundante", icon: "🌧️" },
    82: { label: "Lluvia muy fuerte", icon: "⛈️" },
    85: { label: "Nieve ligera", icon: "🌨️" },
    86: { label: "Nieve fuerte", icon: "❄️" },
    95: { label: "Tormenta", icon: "⛈️" },
    96: { label: "Tormenta con granizo", icon: "⛈️" },
    99: { label: "Tormenta con granizo fuerte", icon: "⛈️" }
  };

  async function loadWeather() {
    if (!weatherTemp || !weatherDescription || !weatherMax || !weatherMin || !weatherHour || !weatherIcon) {
      return;
    }

    try {
      const geoUrl = "https://geocoding-api.open-meteo.com/v1/search?name=X%C3%A0tiva&count=1&language=es&format=json";
      const geoResponse = await fetch(geoUrl);
      if (!geoResponse.ok) throw new Error("No se pudo localizar Xàtiva");

      const geoData = await geoResponse.json();
      const location = geoData.results && geoData.results[0];
      const latitude = location ? location.latitude : 38.9895;
      const longitude = location ? location.longitude : -0.5211;

      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=1`;
      const weatherResponse = await fetch(weatherUrl);
      if (!weatherResponse.ok) throw new Error("No se pudo consultar el tiempo");

      const weather = await weatherResponse.json();
      const current = weather && weather.current ? weather.current : {};
      const daily = weather && weather.daily ? weather.daily : {};
      const code = Number(current.weather_code || 0);
      const info = weatherCodeMap[code] || { label: "Condición", icon: "🌤️" };
      const temp = Math.round(current.temperature_2m || 0);
      const max = Math.round((daily.temperature_2m_max && daily.temperature_2m_max[0]) || temp);
      const min = Math.round((daily.temperature_2m_min && daily.temperature_2m_min[0]) || temp);
      const now = new Date();

      weatherIcon.textContent = info.icon;
      weatherTemp.textContent = `${temp}°C`;
      weatherDescription.textContent = info.label;
      weatherMax.textContent = `${max}°C`;
      weatherMin.textContent = `${min}°C`;
      weatherHour.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch (error) {
      weatherTemp.textContent = "--°C";
      weatherDescription.textContent = "Sin datos";
      weatherMax.textContent = "--°C";
      weatherMin.textContent = "--°C";
      weatherHour.textContent = "--:--";
      weatherIcon.textContent = "🌤️";
      console.error("Error al cargar el tiempo:", error);
    }
  }

  loadWeather();

  /* ====== Noticias (RSS directo) ====== */
  const newsList = document.getElementById("newsList");
  const newsFeedUrl = "https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada";

  function parseNewsItems(xmlText) {
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlText, "application/xml");
    const parserError = xml.querySelector("parsererror");

    if (parserError) {
      throw new Error("El feed RSS no se pudo interpretar correctamente.");
    }

    return [...xml.querySelectorAll("item")]
      .map((item) => {
        const titleNode = item.querySelector("title");
        const linkNode = item.querySelector("link");
        const pubDateNode = item.querySelector("pubDate");
        const authorNode = item.querySelector("dc\\:creator, creator");

        const title = titleNode && titleNode.textContent ? titleNode.textContent.trim() : "";
        const link = linkNode && linkNode.textContent ? linkNode.textContent.trim() : "";
        const pubDate = pubDateNode && pubDateNode.textContent ? pubDateNode.textContent.trim() : "";
        const author = authorNode && authorNode.textContent ? authorNode.textContent.trim() : "El País";

        if (!title || !link) return null;

        return {
          title,
          link,
          pubDate,
          author,
        };
      })
      .filter(Boolean)
      .slice(0, 4);
  }

  async function loadNews() {
    if (!newsList) return;

    try {
      const response = await fetch(newsFeedUrl);
      if (!response.ok) throw new Error("No se pudieron cargar las noticias");

      const xmlText = await response.text();
      const items = parseNewsItems(xmlText);

      if (!items.length) {
        newsList.innerHTML = '<li class="news-item empty">No hay noticias disponibles ahora mismo.</li>';
        return;
      }

      newsList.innerHTML = items.map((item) => {
        const date = item.pubDate ? new Date(item.pubDate).toLocaleDateString("es-ES", { day: "2-digit", month: "short" }) : "Hoy";
        const domain = (() => {
          try {
            return new URL(item.link).hostname.replace(/^www\./, "");
          } catch {
            return "elpais.com";
          }
        })();

        return `
          <li class="news-item">
            <span class="news-tag">${domain}</span>
            <a href="${item.link}" target="_blank" rel="noopener noreferrer">${item.title}</a>
            <small>${date} · ${item.author}</small>
          </li>
        `;
      }).join("");
    } catch (error) {
      newsList.innerHTML = '<li class="news-item empty">No se han podido cargar las noticias.</li>';
      console.error("Error al cargar noticias:", error);
    }
  }

  loadNews();

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
    window.addEventListener("scroll", () => {
      sy = window.scrollY;
      queue();
    }, { passive: true });

    if (hero) {
      let pointerScheduled = false;
      hero.addEventListener("mousemove", (e) => {
        if (pointerScheduled) return;
        pointerScheduled = true;
        requestAnimationFrame(() => {
          const r = hero.getBoundingClientRect();
          mx = (e.clientX - r.left) / r.width - 0.5;
          my = (e.clientY - r.top) / r.height - 0.5;
          if (spotlight) {
            spotlight.style.setProperty("--mx", ((mx + 0.5) * 100) + "%");
            spotlight.style.setProperty("--my", ((my + 0.5) * 100) + "%");
          }
          queue();
          pointerScheduled = false;
        });
      });
    }
    if ("IntersectionObserver" in window && hero) {
      new IntersectionObserver((es) => { heroVisible = es[0].isIntersecting; }, { threshold: 0 })
        .observe(hero);
    }
  }

  /* ====== Tarjetas inclinadas ====== */
  if (canHover && !reduceMotion) {
    document.querySelectorAll(".card").forEach((card) => {
      card.addEventListener("mouseenter", () => {
        card.style.transform = "translateY(-3px)";
      });
      card.addEventListener("mouseleave", () => { card.style.transform = ""; });
    });
  }

  /* Microinteracción 1: aparición al hacer scroll */
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

  /* Microinteracción 3: contador animado */
  const countEls = Array.prototype.slice.call(document.querySelectorAll(".count-up"));
  if (countEls.length && !reduceMotion) {
    const countObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = Number(el.dataset.target || 0);
        const suffix = el.dataset.suffix || "";
        const duration = 1000;
        const start = performance.now();

        const tick = (time) => {
          const progress = Math.min((time - start) / duration, 1);
          const value = Math.round(target * progress);
          el.textContent = value + suffix;
          if (progress < 1) {
            requestAnimationFrame(tick);
          } else {
            el.textContent = target + suffix;
          }
        };

        requestAnimationFrame(tick);
        countObserver.unobserve(el);
      });
    }, { threshold: 0.3 });

    countEls.forEach((el) => {
      el.textContent = "0" + (el.dataset.suffix || "");
      countObserver.observe(el);
    });
  } else {
    countEls.forEach((el) => {
      const suffix = el.dataset.suffix || "";
      el.textContent = (Number(el.dataset.target || 0)) + suffix;
    });
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

  /* ====== Cursor ====== */
  const cursorDot = document.querySelector('.cursor-dot');
  const cursorRing = document.querySelector('.cursor-ring');
  if (cursorDot && cursorRing) {
    cursorDot.remove();
    cursorRing.remove();
  }

  /* ====== Nieve ====== */
  const canvas = document.getElementById("snow");
  let ctx, flakes = [], W = 0, H = 0;
  function readSnowColor() { snowColor = (getComputedStyle(root).getPropertyValue("--snow") || "").trim() || "rgba(255,255,255,.85)"; }
  function resize() { if (!canvas) return; W = canvas.width = innerWidth; H = canvas.height = innerHeight;
    const n = Math.min(40, Math.floor(W / 24));
    flakes = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 2.1 + 0.5, s: Math.random() * 0.6 + 0.2, d: Math.random() * Math.PI * 2 })); }
  function loop(ts) { if (!ctx) return; ctx.clearRect(0, 0, W, H); ctx.fillStyle = snowColor;
    for (const f of flakes) {
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.283); ctx.fill();
      f.y += f.s; f.d += 0.01; f.x += Math.sin(f.d) * 0.35;
      if (f.y > H + 5) { f.y = -5; f.x = Math.random() * W; }
    }
    requestAnimationFrame(loop);
  }
  if (canvas && !reduceMotion) { ctx = canvas.getContext("2d"); if (ctx) { readSnowColor(); resize(); addEventListener("resize", resize); requestAnimationFrame(loop); } else canvas.style.display = "none"; }

  /* ====== Menú interactivo tipo juego ====== */
  const districtButtons = document.querySelectorAll('.district');
  const missionPanel = document.querySelector('.mission-panel');
  const missionStatus = document.querySelector('.mission-status');
  const missionTargetMap = {
    'sobre-mi': ['Sobre mí', 'Presentar mi historia', 'Zona: Xàtiva'],
    'mi-recorrido': ['Mi recorrido', 'Contar mi camino', 'Zona: Xàtiva'],
    'he-hecho': ['Lo que he hecho', 'Mostrar proyectos', 'Zona: Xàtiva'],
    'contacto': ['Contacto', 'Abrir enlace', 'Zona: Xàtiva']
  };

  function updateMission(targetId) {
    const key = missionTargetMap[targetId];
    if (!key || !missionStatus || !missionPanel) return;

    const [tag, objective, zone] = key;
    missionStatus.textContent = 'Activa';
    const panelText = missionPanel.querySelector('.mission-main');
    if (panelText) {
      panelText.innerHTML = `
        <div>
          <p class="mission-label">Zona</p>
          <strong>${zone.replace('Zona: ', '')}</strong>
        </div>
        <div>
          <p class="mission-label">Objetivo</p>
          <strong>${objective}</strong>
        </div>
        <div>
          <p class="mission-label">Misión</p>
          <strong>${tag}</strong>
        </div>
      `;
    }
  }

  districtButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.dataset.target;
      if (!target) return;

      document.querySelectorAll('.district').forEach((btn) => btn.classList.toggle('active', btn === button));
      updateMission(target);

      const section = document.getElementById(target);
      if (section) {
        section.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      }
    });
  });

  /* ====== Mini juego ====== */
  const gameStartButton = document.getElementById("gameStart");
  const gameTarget = document.getElementById("gameTarget");
  const gameBoard = document.getElementById("gameBoard");
  const gameScore = document.getElementById("gameScore");
  const gameTime = document.getElementById("gameTime");
  const gameBest = document.getElementById("gameBest");
  const gameMessage = document.getElementById("gameMessage");
  const leaderboardList = document.getElementById("leaderboardList");

  let gameRunning = false;
  let gameTimer = null;
  let gameSeconds = 20;
  let score = 0;
  const bestKey = "mi-web-star-game-best";
  const startingRecord = 47;
  let bestScore = Number(localStorage.getItem(bestKey) || 0);
  if (!Number.isFinite(bestScore) || bestScore < 0) {
    bestScore = 0;
  }

  function renderLeaderboard() {
    if (!leaderboardList) return;

    const userBest = Math.max(Number(localStorage.getItem(bestKey) || 0), 0);
    const entries = [
      { name: "David Pino", score: startingRecord },
      { name: "Alex", score: 28 },
      { name: "Marta", score: 21 }
    ];

    if (userBest > 0) {
      entries.push({ name: "Tú", score: userBest });
    }

    const sorted = [...entries].sort((a, b) => b.score - a.score);

    leaderboardList.innerHTML = sorted.map((entry, index) => {
      const isTop = index === 0;
      return `
        <li class="leaderboard-item ${isTop ? "leaderboard-top" : ""}">
          <span class="leaderboard-rank">#${index + 1}</span>
          <span class="leaderboard-name">${entry.name}</span>
          <strong class="leaderboard-score">${entry.score}</strong>
        </li>
      `;
    }).join("");
  }

  function updateGameStats() {
    if (gameScore) gameScore.textContent = String(score);
    if (gameTime) gameTime.textContent = String(gameSeconds);
    if (gameBest) gameBest.textContent = String(Math.max(bestScore, score));
    renderLeaderboard();
  }

  function moveTarget() {
    if (!gameTarget || !gameBoard) return;

    const targetSize = gameTarget.offsetWidth || 56;
    const padding = 16;
    const usableWidth = Math.max(10, gameBoard.clientWidth - targetSize - padding * 2);
    const usableHeight = Math.max(10, gameBoard.clientHeight - targetSize - padding * 2);
    const nextX = padding + Math.random() * usableWidth;
    const nextY = padding + Math.random() * usableHeight;

    gameTarget.style.left = `${nextX + targetSize / 2}px`;
    gameTarget.style.top = `${nextY + targetSize / 2}px`;
    gameTarget.style.transform = "translate(-50%, -50%) scale(1)";
  }

  function finishGame() {
    if (!gameRunning) return;
    gameRunning = false;
    if (gameTimer) clearInterval(gameTimer);
    if (score > bestScore) {
      bestScore = score;
      try { localStorage.setItem(bestKey, String(bestScore)); } catch (e) {}
    }
    updateGameStats();
    if (gameMessage) gameMessage.textContent = score === 0 ? "Se acabó el tiempo. ¡Prueba otra vez!" : `¡Fin del juego! Has marcado ${score} puntos.`;
    if (gameTarget) gameTarget.style.opacity = "0.2";
  }

  function startGame() {
    gameRunning = true;
    score = 0;
    gameSeconds = 20;
    updateGameStats();
    if (gameTarget) {
      gameTarget.style.opacity = "1";
      gameTarget.style.filter = "drop-shadow(0 0 18px rgba(255, 145, 77, 0.85))";
    }
    if (gameMessage) gameMessage.textContent = "¡A por la estrella!";
    moveTarget();

    if (gameTimer) clearInterval(gameTimer);
    gameTimer = setInterval(() => {
      if (!gameRunning) return;
      gameSeconds = Math.max(0, gameSeconds - 1);
      updateGameStats();
      if (gameSeconds <= 0) {
        finishGame();
      }
    }, 1000);
  }

  if (gameStartButton) {
    gameStartButton.addEventListener("click", startGame);
  }

  if (gameTarget) {
    gameTarget.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      if (!gameRunning) return;
      score += 1;
      updateGameStats();
      if (gameMessage) gameMessage.textContent = score >= 10 ? "¡Modo arcade! 🔥" : "¡Perfecto! Sigue así.";
      gameTarget.style.transform = "translate(-50%, -50%) scale(1.15)";
      setTimeout(() => {
        if (gameTarget && gameRunning) {
          gameTarget.style.transform = "translate(-50%, -50%) scale(1)";
        }
      }, 80);
      moveTarget();
    });
  }

  if (gameBoard) {
    window.addEventListener("resize", () => {
      if (gameRunning && gameTarget) {
        moveTarget();
      }
    });
  }

  updateGameStats();
  renderLeaderboard();

  /* ====== Chatbot ====== */
  const chatbot = document.getElementById("chatbot");
  const chatbotToggle = document.getElementById("chatbotToggle");
  const chatbotClose = document.getElementById("chatbotClose");
  const chatbotForm = document.getElementById("chatbotForm");
  const chatbotInput = document.getElementById("chatbotInput");
  const chatbotMessages = document.getElementById("chatbotMessages");

  function appendMessage(text, sender) {
    if (!chatbotMessages) return;
    const div = document.createElement("div");
    div.className = "message " + sender;
    div.textContent = text;
    chatbotMessages.appendChild(div);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
  }

  const feedbackForm = document.getElementById("feedbackForm");
  const feedbackResponse = document.getElementById("feedbackResponse");
  const issueLink = document.getElementById("issueLink");

  function buildIssueUrl(formData) {
    const name = (formData.get("name") || "Usuario").toString().trim() || "Usuario";
    const type = (formData.get("type") || "sugerencia").toString().trim() || "sugerencia";
    const subject = (formData.get("subject") || "Sugerencia").toString().trim() || "Sugerencia";
    const message = (formData.get("message") || "").toString().trim();
    const title = encodeURIComponent(`[${type}] ${subject}`);
    const body = encodeURIComponent(
      `### Datos del remitente\n- Nombre: ${name}\n- Tipo: ${type}\n\n### Mensaje\n${message}`
    );
    return `https://github.com/Davidpino19/mi-web/issues/new?title=${title}&labels=feedback,web&body=${body}`;
  }

  if (feedbackForm) {
    feedbackForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(feedbackForm);
      const name = (formData.get("name") || "").toString().trim();
      const email = (formData.get("email") || "").toString().trim();
      const type = (formData.get("type") || "sugerencia").toString();
      const subject = (formData.get("subject") || "").toString().trim();
      const message = (formData.get("message") || "").toString().trim();

      if (!name || !email || !subject || !message) {
        if (feedbackResponse) {
          feedbackResponse.textContent = "Falta alguno de los campos obligatorios. Revisa el formulario antes de enviar.";
          feedbackResponse.className = "feedback-response warning";
        }
        return;
      }

      const autoResponse = `Gracias, ${name}. He recibido tu ${type} sobre “${subject}”. En breve te responderé por correo a ${email}. También puedes abrir directamente una incidencia para dejar constancia del mensaje.`;

      if (feedbackResponse) {
        feedbackResponse.textContent = autoResponse;
        feedbackResponse.className = "feedback-response success";
      }

      if (issueLink) {
        issueLink.href = buildIssueUrl(formData);
      }

      const mailLink = `mailto:daviidpino19@outlook.es?subject=${encodeURIComponent(`[${type.toUpperCase()}] ${subject}`)}&body=${encodeURIComponent(`Nombre: ${name}\nEmail: ${email}\nTipo: ${type}\n\nMensaje:\n${message}`)}`;
      const mailButton = document.createElement("a");
      mailButton.href = mailLink;
      mailButton.className = "btn btn-ghost";
      mailButton.textContent = "Enviar por correo";
      mailButton.target = "_blank";
      mailButton.rel = "noopener noreferrer";

      const actions = feedbackForm.querySelector(".form-actions");
      if (actions) {
        const existingMailButton = actions.querySelector(".mail-trigger");
        if (existingMailButton) existingMailButton.remove();
        mailButton.classList.add("mail-trigger");
        actions.appendChild(mailButton);
      }

      feedbackForm.reset();
    });
  }

  function cleanText(value) {
    return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  }

  const centerAiConfig = {
    endpoint: "/api/chat",
    model: "simarro/Qwen38-DualSpark-medium",
  };

  async function askCenterAi(userMessage) {
    try {
      const response = await fetch(centerAiConfig.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          model: centerAiConfig.model,
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "La API del centro no respondió correctamente.");
      }

      const data = await response.json();
      const answer = data && data.reply ? data.reply : "";
      if (!answer) {
        throw new Error("La IA no devolvió texto válido.");
      }

      return answer.trim();
    } catch (error) {
      console.error("Error al consultar la IA del centro:", error);
      return null;
    }
  }

  async function getBotReply(message) {
    const query = cleanText(message);
    const aiResponse = await askCenterAi(message);
    if (aiResponse) return aiResponse;

    if (!query) return "Escribe algo para que pueda ayudarte.";
    if (query.includes("hola") || query.includes("buenas") || query.includes("saludos")) return "¡Hola! Soy David, estudiante de DAM en el IES Simarro. ¿Quieres saber algo sobre mi experiencia, formación o contacto?";
    if (query.includes("experiencia") || query.includes("trabajo") || query.includes("hosteleria") || query.includes("hostelería")) return "He trabajado durante años en hostelería, y esa experiencia me ha ayudado a desarrollar atención al cliente, responsabilidad, organización y trabajo en equipo.";
    if (query.includes("formacion") || query.includes("estudia") || query.includes("dam") || query.includes("curso")) return "Estoy estudiando 1º de Desarrollo de Aplicaciones Multiplataforma (DAM) en el IES Simarro.";
    if (query.includes("proyecto") || query.includes("proyectos") || query.includes("que hace") || query.includes("habilidades")) return "Mi perfil combina formación tecnológica con experiencia real en hostelería, además de interés por la tecnología, el deporte, la música y la creación de proyectos digitales.";
    if (query.includes("contacto") || query.includes("email") || query.includes("correo") || query.includes("mensaje")) return "Puedes contactarme por correo en daviidpino19@outlook.es. También puedes ver mi perfil de LinkedIn desde el botón del pie de página.";
    if (query.includes("tecnologia") || query.includes("informatica") || query.includes("software") || query.includes("programacion") || query.includes("programación")) return "Estoy enfocando mi camino hacia la tecnología y el desarrollo, especialmente en el ámbito de DAM y la creación de proyectos digitales.";
    if (query.includes("deporte") || query.includes("futbol") || query.includes("fútbol")) return "El deporte forma parte de mi rutina y de mi energía diaria. El fútbol y el ejercicio son parte importante de mi día a día.";
    if (query.includes("quien es") || query.includes("quien eres") || query.includes("perfil")) return "Soy David Pino, estudiante de DAM, con experiencia en hostelería y gran interés por la tecnología, la programación y el aprendizaje continuo.";
    return "Puedo ayudarte con información sobre mi experiencia, formación, contacto y perfil profesional. Prueba con: experiencia, formación, contacto o proyectos.";
  }

  function toggleChatbot(forceOpen) {
    if (!chatbot) return;
    const shouldOpen = typeof forceOpen === "boolean" ? forceOpen : !chatbot.classList.contains("open");
    chatbot.classList.toggle("open", shouldOpen);
    if (shouldOpen && chatbotInput) {
      setTimeout(() => chatbotInput.focus(), 80);
    }
  }

  if (chatbotToggle) {
    chatbotToggle.addEventListener("click", () => toggleChatbot());
  }

  if (chatbotClose) {
    chatbotClose.addEventListener("click", () => toggleChatbot(false));
  }

  if (chatbotForm) {
    chatbotForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!chatbotInput) return;
      const text = chatbotInput.value.trim();
      if (!text) return;
      appendMessage(text, "user");
      chatbotInput.value = "";

      const reply = await getBotReply(text);
      setTimeout(() => appendMessage(reply, "bot"), 250);
    });
  }

  document.querySelectorAll(".quick-pill").forEach((button) => {
    button.addEventListener("click", async () => {
      const question = button.getAttribute("data-question");
      if (!question) return;
      appendMessage(question, "user");
      const reply = await getBotReply(question);
      setTimeout(() => appendMessage(reply, "bot"), 180);
      toggleChatbot(true);
    });
  });
})();