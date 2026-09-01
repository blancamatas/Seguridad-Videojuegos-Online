/*const API_BASE = "http://192.168.56.10:3000/api";*/

let safeMode = false;
let sessionToken = null;
let isAuthenticated = false;

const els = {
  statusText: document.getElementById("statusText"),
  modeBadge: document.getElementById("modeBadge"),

  loginPromptCard: document.getElementById("loginPromptCard"),
  homeContent: document.getElementById("homeContent"),

  loginPanel: document.getElementById("loginPanel"),
  profilePanel: document.getElementById("profilePanel"),

  centerLocked: document.getElementById("centerLocked"),
  centerContent: document.getElementById("centerContent"),

  loginBtn: document.getElementById("loginBtn"),
  registerBtn: document.getElementById("registerBtn"),
  logoutBtn: document.getElementById("logoutBtn"),
  
  loginMessage: document.getElementById("loginMessage"),
  usernameInput: document.getElementById("usernameInput"),
  passwordInput: document.getElementById("passwordInput"),

  coinsValue: document.getElementById("coinsValue"),
  creditsValue: document.getElementById("creditsValue"),
  levelValue: document.getElementById("levelValue"),

  homeDisplayName: document.getElementById("homeDisplayName"),
  homeUsername: document.getElementById("homeUsername"),
  homeRegion: document.getElementById("homeRegion"),
  homeRole: document.getElementById("homeRole"),
  homeSystemMessage: document.getElementById("homeSystemMessage"),
  homeRoomName: document.getElementById("homeRoomName"),
  homePublicAddress: document.getElementById("homePublicAddress"),
  homePlayersOnline: document.getElementById("homePlayersOnline"),
  homeNewsNotice: document.getElementById("homeNewsNotice"),

  profileUsername: document.getElementById("profileUsername"),
  profileName: document.getElementById("profileName"),
  profileRole: document.getElementById("profileRole"),
  profileRegion: document.getElementById("profileRegion"),
  profileLevel: document.getElementById("profileLevel"),

  lobbyRoomName: document.getElementById("lobbyRoomName"),
  lobbyAddress: document.getElementById("lobbyAddress"),
  lobbyPlayersOnline: document.getElementById("lobbyPlayersOnline"),

  newsTitle: document.getElementById("newsTitle"),
  newsNotice: document.getElementById("newsNotice")
};



function formatMarkupUnsafe(text) {
  if (!text) return "";

  return String(text).replace(
    /\[color="(.*?)"\]([\s\S]*?)\[\/color\]/gi,
    '<span style="color:$1; font-weight:bold;">$2</span>'
  );
}




function sanitize(text) {
  if (!text) return "";
  let sanitized = text;
  const blacklist = 
  ['<script>', '</script>', 'onload=', 'javascript:'];
  blacklist.forEach(item => {
    const regex = new RegExp(item, 'gi');
    sanitized = sanitized.replace(regex, ''); 
  });
  return sanitized;
}

function renderSecure(element, value) {
  element.textContent = String(value ?? "");
}

const ALLOWED_COLORS = new Set([
  "#35d8ff",
  "#fff425",
  "#ff3250",
  "#bbf7d0",
  "#ffffff",
]);



function isAllowedColor(color) {
  return ALLOWED_COLORS.has(String(color).trim().toLowerCase());
}

function renderSafeMarkup(element, value) {
  const input = String(value ?? "");
  const pattern = /\[color="([^"]{1,30})"\]([\s\S]*?)\[\/color\]/gi;

  element.replaceChildren();

  let lastIndex = 0;

  for (const match of input.matchAll(pattern)) {
    const fullMatch = match[0];
    const color = match[1].trim().toLowerCase();
    const content = match[2];
    const start = match.index;

    if (start > lastIndex) {
      element.appendChild(document.createTextNode(input.slice(lastIndex, start)));
    }

    if (isAllowedColor(color)) {
      const span = document.createElement("span");
      span.style.color = color;
      span.style.fontWeight = "bold";
      span.textContent = content;
      element.appendChild(span);
    } else {
      element.appendChild(document.createTextNode(fullMatch));
    }

    lastIndex = start + fullMatch.length;
  }

  if (lastIndex < input.length) {
    element.appendChild(document.createTextNode(input.slice(lastIndex)));
  }
}


function renderVulnerable(element, value) {
  const parsedValue = String(value ?? "");
  
  if (safeMode){
    renderSafeMarkup(element, parsedValue);
  } else {
    const sanitized = sanitize(parsedValue);
    const formatted = formatMarkupUnsafe(sanitized)
    element.innerHTML = formatted;
  }
}



function updateModeBadge() {
  if (safeMode) {
    els.modeBadge.textContent = "Corregido";
    els.modeBadge.className = "mode-badge safe";
  } else {
    els.modeBadge.textContent = "Vulnerable";
    els.modeBadge.className = "mode-badge vulnerable";
  }
}

function updateAuthUI() {
  if (isAuthenticated) {
    els.loginPromptCard.classList.add("hidden");
    els.homeContent.classList.remove("hidden");

    els.loginPanel.classList.add("hidden");
    els.profilePanel.classList.remove("hidden");

    els.centerLocked.classList.add("hidden");
    els.centerContent.classList.remove("hidden");

    document.querySelectorAll(".top-link").forEach((btn) => {
      btn.classList.remove("locked");
    });

  } else {
    els.loginPromptCard.classList.remove("hidden");
    els.homeContent.classList.add("hidden");

    els.loginPanel.classList.remove("hidden");
    els.profilePanel.classList.add("hidden");

    els.centerLocked.classList.remove("hidden");
    els.centerContent.classList.add("hidden");

    document.querySelectorAll(".top-link").forEach((btn) => {
      btn.classList.remove("locked");
    });

    document.querySelectorAll(".top-link").forEach((btn) => {
      const protectedViews = ["inicio", "inventario", "tienda", "centro"];
      if (protectedViews.includes(btn.dataset.view)) {
        btn.classList.add("locked");
      }
    });
  }
}

function setActiveView(viewName) {
  const viewMap = {
    inicio: "inicio",
    perfil: "perfil",
    centro: "centro",
    inventario: "inicio",
    tienda: "inicio"
  };

  if (!isAuthenticated) {
    viewName = "perfil";
  }

  const targetView = viewMap[viewName] || "inicio";

  document.querySelectorAll(".view").forEach((view) => {
    view.classList.remove("visible");
    view.classList.add("hidden");
  });

  const target = document.getElementById(`view-${targetView}`);
  if (target) {
    target.classList.remove("hidden");
    target.classList.add("visible");
  }

  document.querySelectorAll(".top-link").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === viewName);
  });
}

async function login() {
  const username = els.usernameInput.value.trim();
  const password = els.passwordInput.value;

  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      els.loginMessage.textContent = data.error || "Credenciales no válidas.";
      return;
    }




    sessionToken = data.token;

    isAuthenticated = true;

    localStorage.setItem("poc_session_token", sessionToken);






    els.loginMessage.textContent = `Sesión iniciada como ${data.user.username}.`;

    updateAuthUI();
    await loadAll();
    setActiveView("inicio");
  } catch (error) {
    els.loginMessage.textContent = `Error de conexión: ${error.message}`;
  }
}

function logout() {
  sessionToken = null;
  isAuthenticated = false;

  localStorage.removeItem("poc_session_token");

  els.loginMessage.textContent = "Sesión cerrada correctamente.";

  updateAuthUI();
  setActiveView("perfil");
}

async function loadAll() {
  if (!isAuthenticated) return;

  try {
    const [meRes, lobbyRes, newsRes] = await Promise.all([
      fetch(`${API_BASE}/me`),
      fetch(`${API_BASE}/lobby`),
      fetch(`${API_BASE}/news`),
    ]);

    const me = await meRes.json();
    const lobby = await lobbyRes.json();
    const news = await newsRes.json();

    renderMe(me);
    renderLobby(lobby);
    renderNews(news);

  } catch (error) {
    console.error("Error al cargar datos:", error);
  }
}

function renderMe(me) {
  els.levelValue.textContent = String(me.user.level);

  renderSecure(els.homeDisplayName, me.user.name);
  els.homeUsername.textContent = me.user.username;
  els.homeRegion.textContent = me.user.region;
  els.homeRole.textContent = me.user.role;

  els.profileUsername.textContent = me.user.username;
  renderSecure(els.profileName, me.user.name);
  els.profileRole.textContent = me.user.role;
  els.profileRegion.textContent = me.user.region;
  els.profileLevel.textContent = String(me.user.level);
}

function renderLobby(lobby) {
  els.homeRoomName.textContent = lobby.room.name;
  els.homePublicAddress.textContent = lobby.room.publicAddress;
  els.homePlayersOnline.textContent = String(lobby.room.playersOnline);

  els.lobbyRoomName.textContent = lobby.room.name;
  els.lobbyAddress.textContent = lobby.room.publicAddress;
  els.lobbyPlayersOnline.textContent = String(lobby.room.playersOnline);
}

function renderNews(news) {
  els.newsTitle.textContent = news.title;
  renderVulnerable(els.newsNotice, news.notice);
  renderVulnerable(els.homeNewsNotice, news.notice);
}

function setupNavigation() {
  document.querySelectorAll(".top-link").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!isAuthenticated && btn.dataset.view !== "perfil" && btn.dataset.view !== "inicio") {
        return;
      }

      if (btn.dataset.view === "centro") {
        setActiveView("centro");
        return;
      }

      if (btn.dataset.view === "perfil") {
        setActiveView("perfil");
        return;
      }

      if (btn.dataset.view === "inventario" || btn.dataset.view === "tienda") {
        setActiveView("inicio");
        return;
      }

      setActiveView("inicio");
    });
  });
}

function setupActions() {
  els.loginBtn.addEventListener("click", login);

  els.registerBtn.addEventListener("click", () => {
    els.loginMessage.textContent = "El registro de nuevas cuentas está deshabilitado en esta demo.";
    els.loginMessage.style.color = "#ffd43b"; 
  });

  els.logoutBtn.addEventListener("click", logout);

  if(document.getElementById("reloadBtn")) {
    document.getElementById("reloadBtn").addEventListener("click", async () => {
      await loadAll();
    });
  }

  document.getElementById("vulnerableBtn").addEventListener("click", async () => {
    safeMode = false;
    updateModeBadge();
    await loadAll();
  });

  document.getElementById("safeBtn").addEventListener("click", async () => {
    safeMode = true;
    updateModeBadge();
    await loadAll();
  });
}

function init() {
  updateModeBadge();
  setupNavigation();
  setupActions();

  const token = localStorage.getItem("poc_session_token");

  if (token) {
    sessionToken = token;
    isAuthenticated = true;
    updateAuthUI();
    loadAll();
    setActiveView("inicio");
  } else {
    isAuthenticated = false;
    updateAuthUI();
    setActiveView("perfil");
  }
}

init();