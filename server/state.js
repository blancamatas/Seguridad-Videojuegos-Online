const initialState = () => ({
  auth: {
    demoUser: {
      username: "poc_user",
      password: "poc123",
    },
  },
  me: {
    user: {
      id: "u1001",
      username: "poc_user",
      name: "PoC User",
      role: "User",
      region: "EU",
      canChangeName: false,
      level: 17,
    },
  },
  lobby: {
    room: {
      name: "sala-1",
      publicAddress: "eu-1.poc.lab",
      sessionId: "sess-8f34a2",
      playersOnline: 148,
    },
    systemMessage: "Bienvenido al lobby. ¡Disfruta tu estancia!",
  },
  news: {
    title: "Season update",
    notice: "Reglas actualizadas para la nueva temporada.",
  },
});

let state = initialState();

function resetState() {
  state = initialState();
}

function getState() {
  return state;
}

module.exports = {
  getState,
  resetState,
};