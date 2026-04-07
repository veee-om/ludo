const PLAYER_CONFIG = {
  red: {
    key: "red",
    label: "Ruby Rockets",
    short: "Red",
    emoji: "🐯",
    token: "R",
    startIndex: 0,
    homeLane: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],
    yard: [[1, 1], [1, 4], [4, 1], [4, 4]],
  },
  green: {
    key: "green",
    label: "Jungle Jumpers",
    short: "Green",
    emoji: "🐸",
    token: "G",
    startIndex: 13,
    homeLane: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],
    yard: [[1, 10], [1, 13], [4, 10], [4, 13]],
  },
  yellow: {
    key: "yellow",
    label: "Sunny Striders",
    short: "Yellow",
    emoji: "🦁",
    token: "Y",
    startIndex: 39,
    homeLane: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]],
    yard: [[10, 1], [10, 4], [13, 1], [13, 4]],
  },
  blue: {
    key: "blue",
    label: "Ocean Orbiters",
    short: "Blue",
    emoji: "🐬",
    token: "B",
    startIndex: 26,
    homeLane: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]],
    yard: [[10, 10], [10, 13], [13, 10], [13, 13]],
  },
};

const PLAYER_SETS = {
  2: ["red", "blue"],
  3: ["red", "green", "yellow"],
  4: ["red", "green", "yellow", "blue"],
};

const TRACK = [
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5], [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6], [0, 7],
  [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8], [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  [7, 14], [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9], [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8], [14, 7],
  [14, 6], [13, 6], [12, 6], [11, 6], [10, 6], [9, 6], [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0], [7, 0], [6, 0],
];

const SAFE_INDICES = new Set([0, 8, 13, 21, 26, 34, 39, 47]);
const FINAL_PROGRESS = 57;
const DICE_EMOJI = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

const setupScreen = document.getElementById("setup-screen");
const gameScreen = document.getElementById("game-screen");
const boardGrid = document.getElementById("board-grid");
const playerCounts = document.getElementById("player-counts");
const nameGrid = document.getElementById("name-grid");
const newGameButton = document.getElementById("new-game-button");
const backButton = document.getElementById("back-button");
const rollButton = document.getElementById("roll-button");
const endTurnButton = document.getElementById("end-turn-button");
const resetButton = document.getElementById("reset-button");
const playersList = document.getElementById("players-list");
const turnBanner = document.getElementById("turn-banner");
const statusMessage = document.getElementById("status-message");
const diceFace = document.getElementById("dice-face");
const handoffModal = document.getElementById("handoff-modal");
const handoffTitle = document.getElementById("handoff-title");
const handoffText = document.getElementById("handoff-text");
const handoffButton = document.getElementById("handoff-button");
const winnerModal = document.getElementById("winner-modal");
const winnerTitle = document.getElementById("winner-title");
const winnerText = document.getElementById("winner-text");
const winnerButton = document.getElementById("winner-button");

let selectedPlayerCount = 4;
let selectedPlayerNames = {};
let currentScreen = "setup";
let state = createGame(selectedPlayerCount);

buildBoardSkeleton();
buildPlayerCountSelector();
buildNameInputs();
bindControls();
render();

function buildPlayerCountSelector() {
  playerCounts.innerHTML = "";
  [2, 3, 4].forEach((count) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `count-button${count === selectedPlayerCount ? " active" : ""}`;
    button.textContent = String(count);
    button.addEventListener("click", () => {
      selectedPlayerCount = count;
      buildPlayerCountSelector();
      buildNameInputs();
    });
    playerCounts.appendChild(button);
  });
}

function buildNameInputs() {
  nameGrid.innerHTML = "";

  PLAYER_SETS[selectedPlayerCount].forEach((key, index) => {
    const config = PLAYER_CONFIG[key];
    const card = document.createElement("div");
    card.className = "name-card";

    const inputId = `player-name-${key}`;
    const defaultName = `${config.short} Player`;
    const value = selectedPlayerNames[key] ?? defaultName;

    card.innerHTML = `
      <label for="${inputId}">
        <span>${config.emoji}</span>
        <span>Player ${index + 1} (${config.short})</span>
      </label>
      <input id="${inputId}" name="${inputId}" type="text" maxlength="18" value="${escapeHtml(value)}" placeholder="${defaultName}">
    `;

    const input = card.querySelector("input");
    input.addEventListener("input", (event) => {
      selectedPlayerNames[key] = event.target.value;
    });

    nameGrid.appendChild(card);
  });
}

function bindControls() {
  newGameButton.addEventListener("click", () => {
    state = createGame(selectedPlayerCount, collectPlayerNames());
    currentScreen = "game";
    render();
  });

  resetButton.addEventListener("click", () => {
    state = createGame(selectedPlayerCount, collectPlayerNames());
    currentScreen = "game";
    render();
  });

  backButton.addEventListener("click", () => {
    currentScreen = "setup";
    render();
  });

  handoffButton.addEventListener("click", () => {
    if (state.stage !== "handoff") {
      return;
    }

    state.stage = "roll";
    state.message = `${getCurrentPlayer().emoji} ${getCurrentPlayer().name}, roll the dice.`;
    render();
  });

  winnerButton.addEventListener("click", () => {
    currentScreen = "setup";
    state = createGame(selectedPlayerCount, collectPlayerNames());
    render();
  });

  rollButton.addEventListener("click", () => {
    if (state.stage !== "roll") {
      return;
    }
    takeRoll();
  });

  endTurnButton.addEventListener("click", () => {
    if (state.stage !== "await-end") {
      return;
    }
    advanceTurn();
  });
}

function collectPlayerNames() {
  const names = {};

  PLAYER_SETS[selectedPlayerCount].forEach((key) => {
    const input = document.getElementById(`player-name-${key}`);
    const fallback = `${PLAYER_CONFIG[key].short} Player`;
    const value = input ? input.value.trim() : "";
    names[key] = value || fallback;
    selectedPlayerNames[key] = names[key];
  });

  return names;
}

function createGame(playerCount, playerNames = {}) {
  const playerKeys = PLAYER_SETS[playerCount];
  const players = playerKeys.map((key, index) => {
    const config = PLAYER_CONFIG[key];
    const fallbackName = `${config.short} Player`;
    return {
      ...config,
      order: index + 1,
      name: playerNames[key] || selectedPlayerNames[key] || fallbackName,
      tokens: Array.from({ length: 4 }, (_, tokenIndex) => ({
        id: `${key}-${tokenIndex}`,
        progress: -1,
      })),
    };
  });

  return {
    players,
    currentTurnIndex: 0,
    selectedPlayerCount: playerCount,
    diceValue: null,
    stage: "handoff",
    message: `Pass the device to ${players[0].name}.`,
    movableTokenIds: [],
    turnSixCount: 0,
    winner: null,
  };
}

function buildBoardSkeleton() {
  boardGrid.innerHTML = "";

  const zones = [
    { key: "red", row: 1, col: 1, emoji: "🐯" },
    { key: "green", row: 1, col: 10, emoji: "🐸" },
    { key: "yellow", row: 10, col: 1, emoji: "🦁" },
    { key: "blue", row: 10, col: 10, emoji: "🐬" },
  ];

  zones.forEach((zone) => {
    const element = document.createElement("div");
    element.className = `zone zone-${zone.key}`;
    element.dataset.emoji = zone.emoji;
    element.style.gridColumn = `${zone.col} / span 5`;
    element.style.gridRow = `${zone.row} / span 5`;
    boardGrid.appendChild(element);
  });

  TRACK.forEach(([row, col], index) => {
    boardGrid.appendChild(createCell(row, col, `cell track${SAFE_INDICES.has(index) ? " safe" : ""}`));
  });

  Object.values(PLAYER_CONFIG).forEach((player) => {
    player.homeLane.forEach(([row, col]) => {
      boardGrid.appendChild(createCell(row, col, `cell home-lane-${player.key}`));
    });

    player.yard.forEach(([row, col]) => {
      const slot = createCell(row, col, "yard-slot");
      slot.dataset.slotFor = player.key;
      boardGrid.appendChild(slot);
    });
  });

  boardGrid.appendChild(createCell(7, 7, "cell center"));
}

function createCell(row, col, className) {
  const cell = document.createElement("div");
  cell.className = className;
  cell.style.gridRow = String(row + 1);
  cell.style.gridColumn = String(col + 1);
  return cell;
}

function takeRoll() {
  const currentPlayer = getCurrentPlayer();
  const roll = Math.floor(Math.random() * 6) + 1;
  state.diceValue = roll;

  if (roll === 6) {
    state.turnSixCount += 1;
  }

  if (state.turnSixCount === 3) {
    state.message = `${currentPlayer.emoji} ${currentPlayer.name} rolled three 6s and loses the turn.`;
    state.stage = "await-end";
    state.movableTokenIds = [];
    render();
    return;
  }

  const movable = getMovableTokens(currentPlayer, roll);
  state.movableTokenIds = movable.map((token) => token.id);

  if (movable.length === 0) {
    state.message = `${currentPlayer.emoji} ${currentPlayer.name} rolled ${roll}, but no token can move.`;
    state.stage = "await-end";
    render();
    return;
  }

  state.stage = "move";
  state.message = `${currentPlayer.emoji} ${currentPlayer.name} rolled ${roll}. Choose a glowing token.`;
  render();
}

function getMovableTokens(player, roll) {
  return player.tokens.filter((token) => {
    if (token.progress === FINAL_PROGRESS) {
      return false;
    }
    if (token.progress === -1) {
      return roll === 6;
    }
    return token.progress + roll <= FINAL_PROGRESS;
  });
}

function handleTokenClick(tokenId) {
  if (state.stage !== "move") {
    return;
  }

  const player = getCurrentPlayer();
  const token = player.tokens.find((piece) => piece.id === tokenId);
  if (!token || !state.movableTokenIds.includes(tokenId)) {
    return;
  }

  const previousProgress = token.progress;
  token.progress = token.progress === -1 ? 0 : token.progress + state.diceValue;

  const captureCount = resolveCaptures(player, token);
  const hasWon = player.tokens.every((piece) => piece.progress === FINAL_PROGRESS);

  if (hasWon) {
    state.winner = player.key;
    state.stage = "game-over";
    state.message = `${player.emoji} ${player.name} wins Vyom Ludo!`;
  } else if (state.diceValue === 6) {
    state.stage = "roll";
    state.message = createMoveMessage(player, token, previousProgress, captureCount, true);
  } else {
    state.stage = "await-end";
    state.message = createMoveMessage(player, token, previousProgress, captureCount, false);
  }

  state.diceValue = null;
  state.movableTokenIds = [];
  render();
}

function createMoveMessage(player, token, previousProgress, captureCount, extraTurn) {
  const parts = [];
  const tokenNumber = Number(token.id.split("-")[1]) + 1;

  if (previousProgress === -1) {
    parts.push(`${player.emoji} ${player.name}'s token ${tokenNumber} enters the board.`);
  } else if (token.progress === FINAL_PROGRESS) {
    parts.push(`${player.emoji} ${player.name}'s token ${tokenNumber} reached home.`);
  } else {
    parts.push(`${player.emoji} ${player.name}'s token ${tokenNumber} moves ahead.`);
  }

  if (captureCount > 0) {
    parts.push(`Sent ${captureCount} rival token${captureCount > 1 ? "s" : ""} back to the yard.`);
  }

  parts.push(extraTurn ? "Roll again." : "Tap End Turn to pass the device.");
  return parts.join(" ");
}

function resolveCaptures(player, movedToken) {
  if (movedToken.progress < 0 || movedToken.progress > 51) {
    return 0;
  }

  const trackIndex = getTrackIndex(player, movedToken.progress);
  if (SAFE_INDICES.has(trackIndex)) {
    return 0;
  }

  let captures = 0;
  state.players.forEach((opponent) => {
    if (opponent.key === player.key) {
      return;
    }

    opponent.tokens.forEach((token) => {
      if (token.progress < 0 || token.progress > 51) {
        return;
      }

      if (getTrackIndex(opponent, token.progress) === trackIndex) {
        token.progress = -1;
        captures += 1;
      }
    });
  });

  return captures;
}

function getTrackIndex(player, progress) {
  return (player.startIndex + progress) % TRACK.length;
}

function advanceTurn() {
  if (state.stage === "game-over") {
    return;
  }

  state.currentTurnIndex = (state.currentTurnIndex + 1) % state.players.length;
  state.stage = "handoff";
  state.diceValue = null;
  state.turnSixCount = 0;
  state.movableTokenIds = [];
  state.message = `Pass the device to ${getCurrentPlayer().name}.`;
  render();
}

function getCurrentPlayer() {
  return state.players[state.currentTurnIndex];
}

function getTokenCoords(player, token) {
  if (token.progress === -1) {
    return player.yard[Number(token.id.split("-")[1])];
  }
  if (token.progress === FINAL_PROGRESS) {
    return [7, 7];
  }
  if (token.progress >= 52) {
    return player.homeLane[token.progress - 52];
  }
  return TRACK[getTrackIndex(player, token.progress)];
}

function render() {
  renderScreens();
  renderBanner();
  renderPlayers();
  renderTokens();
  renderControls();
  renderModal();
  renderWinnerModal();
}

function renderScreens() {
  setupScreen.classList.toggle("hidden", currentScreen !== "setup");
  gameScreen.classList.toggle("hidden", currentScreen !== "game");
}

function renderBanner() {
  const currentPlayer = getCurrentPlayer();
  turnBanner.innerHTML = `
    <div>
      <strong>${currentPlayer.emoji} ${currentPlayer.name}</strong>
      <div>${currentPlayer.short} pieces</div>
    </div>
    <div>Turn ${state.currentTurnIndex + 1}/${state.players.length}</div>
  `;
  statusMessage.textContent = state.message;
  diceFace.textContent = state.diceValue ? DICE_EMOJI[state.diceValue - 1] : "🎲";
}

function renderPlayers() {
  playersList.innerHTML = "";

  state.players.forEach((player, index) => {
    const homeCount = player.tokens.filter((token) => token.progress === FINAL_PROGRESS).length;
    const yardCount = player.tokens.filter((token) => token.progress === -1).length;
    const onBoardCount = 4 - homeCount - yardCount;

    const card = document.createElement("div");
    card.className = `player-summary${index === state.currentTurnIndex ? " active" : ""}`;
    card.innerHTML = `
      <div class="player-badges">
        <div class="player-avatar ${player.key}">${player.emoji}</div>
        <div class="player-meta">
          <strong>${player.name}</strong>
          <span>${player.short} pieces</span>
        </div>
      </div>
      <div class="token-summary">
        <span class="mini-token">🏡 ${homeCount}</span>
        <span class="mini-token">🚀 ${onBoardCount}</span>
        <span class="mini-token">🛖 ${yardCount}</span>
      </div>
    `;
    playersList.appendChild(card);
  });
}

function renderTokens() {
  boardGrid.querySelectorAll(".token-button").forEach((token) => token.remove());

  const placements = new Map();
  state.players.forEach((player) => {
    player.tokens.forEach((token) => {
      const [row, col] = getTokenCoords(player, token);
      const key = `${row},${col}`;
      const stack = placements.get(key) || [];
      stack.push({ player, token });
      placements.set(key, stack);
    });
  });

  placements.forEach((items, key) => {
    items.forEach(({ player, token }, index) => {
      const [row, col] = key.split(",").map(Number);
      const button = document.createElement("button");
      button.type = "button";
      button.className = `token-button ${player.key}${state.movableTokenIds.includes(token.id) ? " movable" : ""}`;
      button.dataset.piece = player.token;
      button.style.gridRow = String(row + 1);
      button.style.gridColumn = String(col + 1);
      button.style.transform = `translate(${(index % 2) * 15 - (items.length > 1 ? 7 : 0)}px, ${Math.floor(index / 2) * 15 - (items.length > 2 ? 7 : 0)}px)`;
      button.disabled = !state.movableTokenIds.includes(token.id);
      button.addEventListener("click", () => handleTokenClick(token.id));
      boardGrid.appendChild(button);
    });
  });
}

function renderControls() {
  rollButton.disabled = state.stage !== "roll";
  endTurnButton.hidden = state.stage !== "await-end";
  endTurnButton.disabled = state.stage !== "await-end";

  if (state.stage === "game-over") {
    rollButton.disabled = true;
    endTurnButton.hidden = true;
  }
}

function renderModal() {
  const currentPlayer = getCurrentPlayer();
  const isVisible = currentScreen === "game" && state.stage === "handoff";
  handoffModal.classList.toggle("hidden", !isVisible);
  handoffTitle.textContent = `${currentPlayer.emoji} ${currentPlayer.name}`;
  handoffText.textContent = "Pass the device to this player, then tap below to start the turn.";
}

function renderWinnerModal() {
  const winner = state.winner ? state.players.find((player) => player.key === state.winner) : null;
  const isVisible = currentScreen === "game" && state.stage === "game-over" && Boolean(winner);
  winnerModal.classList.toggle("hidden", !isVisible);

  if (!winner) {
    return;
  }

  winnerTitle.textContent = `${winner.emoji} ${winner.name} wins!`;
  winnerText.textContent = `All four ${winner.short.toLowerCase()} pieces made it home. Tap below to head back to setup and play again.`;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
