const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const { getState, resetState } = require("./state");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "poc-lab-server" });
});

app.post("/api/auth/login", (req, res) => {
  const state = getState();
  const { username, password } = req.body ?? {};

  if (
    username === state.auth.demoUser.username &&
    password === state.auth.demoUser.password
  ) {
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" }))
    .toString("base64url");

    const payload = Buffer.from(JSON.stringify({
      sub: state.me.user.id,
      name: state.me.user.username,
      role: state.me.user.role,
      iat: Math.floor(Date.now() / 1000), 
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) 
    })).toString("base64url");
    
    const secretKey = "claveultrasecrertaparaelpoc";
    const signature = crypto
      .createHmac("sha256", secretKey)
      .update(`${header}.${payload}`)
      .digest("base64url");

    const poc_token = `${header}.${payload}.${signature}`;

    return res.json({
      ok: true,
      token: poc_token,
      user: state.me.user,
    });
  }

  return res.status(401).json({
    ok: false,
    error: "Invalid credentials",
  });
});

app.get("/api/me", (req, res) => {
  const state = getState();
  res.json(state.me);
});

app.get("/api/lobby", (req, res) => {
  const state = getState();
  res.json(state.lobby);
});

app.get("/api/news", (req, res) => {
  const state = getState();
  res.json(state.news);
});

app.post("/api/profile/update", (req, res) => {
  const state = getState();
  const { name } = req.body ?? {};

  if (typeof name === "string") {
    state.me.user.name = name;
  }

  res.json({
    ok: true,
    updated: {
      name: state.me.user.name,
    },
  });
});

app.post("/api/lobby/update", (req, res) => {
  const state = getState();
  const { roomName, systemMessage } = req.body ?? {};

  if (typeof roomName === "string") {
    state.lobby.room.name = roomName;
  }

  if (typeof systemMessage === "string") {
    state.lobby.systemMessage = systemMessage;
  }

  res.json({
    ok: true,
    updated: {
      roomName: state.lobby.room.name,
      systemMessage: state.lobby.systemMessage,
    },
  });
});

app.post("/api/news/update", (req, res) => {
  const state = getState();
  const { title, notice } = req.body ?? {};

  if (typeof title === "string") {
    state.news.title = title;
  }

  if (typeof notice === "string") {
    state.news.notice = notice;
  }

  res.json({
    ok: true,
    updated: {
      title: state.news.title,
      notice: state.news.notice,
    },
  });
});

app.post("/api/internal/reset", (req, res) => {
  resetState();
  res.json({ ok: true, message: "State reset." });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`PoC Lab server listening on http://0.0.0.0:${PORT}`);
});