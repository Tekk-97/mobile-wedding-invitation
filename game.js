(() => {
  const config = window.WEDDING_CONFIG || {};
  const configured =
    config.supabaseUrl &&
    config.supabaseAnonKey &&
    !config.supabaseUrl.includes("YOUR_") &&
    !config.supabaseAnonKey.includes("YOUR_");
  const gameClient = configured && window.supabase
    ? window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey)
    : null;

  const openButton = document.querySelector("#spot-game-open");
  const game = document.querySelector("#spot-game");
  const closeButton = document.querySelector("#spot-game-close");
  const intro = document.querySelector("#spot-game-intro");
  const play = document.querySelector("#spot-game-play");
  const startButton = document.querySelector("#spot-game-start");
  const sideInputs = [...document.querySelectorAll('input[name="spot-side"]')];
  const retryButton = document.querySelector("#spot-game-retry");
  const result = document.querySelector("#spot-game-result");
  const resultTime = document.querySelector("#spot-result-time");
  const foundCount = document.querySelector("#spot-found-count");
  const timer = document.querySelector("#spot-timer");
  const mistakesDisplay = document.querySelector("#spot-mistakes");
  const currentTeam = document.querySelector("#spot-current-team");
  const scoreForm = document.querySelector("#spot-score-form");
  const playerName = document.querySelector("#spot-player-name");
  const scoreStatus = document.querySelector("#spot-score-status");
  const rankingList = document.querySelector("#spot-ranking-list");
  const groomPoints = document.querySelector("#spot-groom-points");
  const bridePoints = document.querySelector("#spot-bride-points");
  const groomPlayers = document.querySelector("#spot-groom-players");
  const bridePlayers = document.querySelector("#spot-bride-players");
  const groomBar = document.querySelector("#spot-groom-bar");
  const brideBar = document.querySelector("#spot-bride-bar");
  const teamStatus = document.querySelector("#spot-team-status");
  const boards = [...document.querySelectorAll("[data-spot-board]")];

  if (!openButton || !game || boards.length !== 2) return;

  const spots = [
    { id: "tie", x: 31, y: 32.5, label: "색이 달라진 넥타이" },
    { id: "tulip", x: 28, y: 37, label: "색이 달라진 튤립" },
    { id: "waist-band", x: 49, y: 40.5, label: "색이 달라진 드레스 허리띠" },
    { id: "left-molding", x: 4, y: 62.5, label: "사라진 왼쪽 벽 몰딩" },
    { id: "right-molding", x: 91, y: 48, label: "사라진 오른쪽 벽 몰딩" },
  ];

  let found = new Set();
  let mistakes = 0;
  let startedAt = 0;
  let elapsedMs = 0;
  let timerId = null;
  let playing = false;
  let rankingsLoaded = false;
  let selectedSide = "";

  const escapeHtml = (value) =>
    String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const formatTime = (milliseconds) => {
    const safe = Math.max(0, Number(milliseconds) || 0);
    const minutes = Math.floor(safe / 60000);
    const seconds = Math.floor((safe % 60000) / 1000);
    const tenths = Math.floor((safe % 1000) / 100);
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${tenths}`;
  };

  const getPlayerToken = () => {
    const key = "wedding_spot_game_player_token";
    const stored = localStorage.getItem(key);
    if (stored) return stored;
    const token = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(key, token);
    return token;
  };

  const renderTargets = () => {
    boards.forEach((board) => {
      let layer = board.querySelector(".spot-board__targets");
      if (!layer) {
        layer = document.createElement("div");
        layer.className = "spot-board__targets";
        board.append(layer);
      }

      layer.innerHTML = spots
        .map(
          (spot) => `<button class="spot-target" type="button" data-spot-id="${spot.id}" aria-label="${spot.label}" style="left:${spot.x}%;top:${spot.y}%;--target-size:12%"></button>`,
        )
        .join("");
    });
  };

  const renderFoundMarkers = () => {
    boards.forEach((board) => {
      board.querySelectorAll(".spot-found-marker").forEach((marker) => marker.remove());
      spots.forEach((spot) => {
        if (!found.has(spot.id)) return;
        const marker = document.createElement("i");
        marker.className = "spot-found-marker";
        marker.style.cssText = `left:${spot.x}%;top:${spot.y}%;--marker-size:9%`;
        marker.setAttribute("aria-hidden", "true");
        board.append(marker);
      });
    });
  };

  const updateTimer = () => {
    if (playing) elapsedMs = performance.now() - startedAt;
    timer.textContent = formatTime(elapsedMs);
  };

  const finishGame = () => {
    playing = false;
    elapsedMs = performance.now() - startedAt;
    clearInterval(timerId);
    timerId = null;
    updateTimer();

    const penaltyMs = mistakes * 3000;
    const totalMs = elapsedMs + penaltyMs;
    resultTime.textContent = `${selectedSide}측 · 기록 ${formatTime(elapsedMs)} · 실수 ${mistakes}회${penaltyMs ? ` (+${mistakes * 3}초)` : ""} · 최종 ${formatTime(totalMs)}`;
    result.hidden = false;
    scoreStatus.textContent = "";
    scoreForm.hidden = false;
    scoreForm.querySelector("button").disabled = false;
    playerName.value = localStorage.getItem("wedding_spot_game_player_name") || "";
    requestAnimationFrame(() => result.scrollIntoView({ behavior: "smooth", block: "center" }));
  };

  const findSpot = (spotId) => {
    if (!playing || found.has(spotId)) return;
    found.add(spotId);
    foundCount.textContent = `${found.size} / ${spots.length}`;
    renderFoundMarkers();
    if (found.size === spots.length) finishGame();
  };

  const registerMistake = (board) => {
    if (!playing) return;
    mistakes += 1;
    mistakesDisplay.textContent = String(mistakes);
    board.classList.remove("is-mistake");
    requestAnimationFrame(() => board.classList.add("is-mistake"));
    setTimeout(() => board.classList.remove("is-mistake"), 250);
  };

  const startGame = () => {
    const checkedSide = sideInputs.find((input) => input.checked)?.value;
    if (!checkedSide) return;

    selectedSide = checkedSide;
    clearInterval(timerId);
    found = new Set();
    mistakes = 0;
    elapsedMs = 0;
    playing = true;
    intro.hidden = true;
    play.hidden = false;
    result.hidden = true;
    foundCount.textContent = `0 / ${spots.length}`;
    mistakesDisplay.textContent = "0";
    currentTeam.textContent = `${selectedSide}측 팀`;
    timer.textContent = "00:00.0";
    renderFoundMarkers();
    startedAt = performance.now();
    timerId = setInterval(updateTimer, 100);
    play.scrollIntoView({ block: "start" });
  };

  const showTeamChoice = (shouldScroll = true) => {
    clearInterval(timerId);
    timerId = null;
    playing = false;
    selectedSide = "";
    sideInputs.forEach((input) => { input.checked = false; });
    startButton.disabled = true;
    startButton.textContent = "팀을 선택해 주세요";
    intro.hidden = false;
    play.hidden = true;
    result.hidden = true;
    if (shouldScroll) intro.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const renderTeamBattle = (rows = []) => {
    const teams = {
      신랑: { total_points: 0, player_count: 0 },
      신부: { total_points: 0, player_count: 0 },
    };
    rows.forEach((row) => {
      if (teams[row.side]) teams[row.side] = row;
    });

    const groomTotal = Number(teams.신랑.total_points) || 0;
    const brideTotal = Number(teams.신부.total_points) || 0;
    const combined = groomTotal + brideTotal;
    const groomRatio = combined ? (groomTotal / combined) * 100 : 50;

    groomPoints.textContent = `${groomTotal.toLocaleString("ko-KR")}점`;
    bridePoints.textContent = `${brideTotal.toLocaleString("ko-KR")}점`;
    groomPlayers.textContent = `${Number(teams.신랑.player_count) || 0}명`;
    bridePlayers.textContent = `${Number(teams.신부.player_count) || 0}명`;
    groomBar.style.width = `${groomRatio}%`;
    brideBar.style.width = `${100 - groomRatio}%`;

    if (!combined) teamStatus.textContent = "첫 기록으로 우리 팀을 응원해 주세요.";
    else if (groomTotal === brideTotal) teamStatus.textContent = "현재 양측의 점수가 같아요.";
    else teamStatus.textContent = `${groomTotal > brideTotal ? "신랑측" : "신부측"}이 앞서고 있어요!`;
  };

  const loadRankings = async () => {
    if (!gameClient) {
      rankingList.innerHTML = '<li class="spot-ranking__empty">Supabase 연결 후 랭킹이 표시됩니다.</li>';
      teamStatus.textContent = "Supabase 연결 후 합산 점수가 표시됩니다.";
      return;
    }

    rankingList.innerHTML = '<li class="spot-ranking__empty">랭킹을 불러오는 중입니다.</li>';
    teamStatus.textContent = "양측의 합산 점수를 불러오는 중입니다.";
    const [rankingResult, teamResult] = await Promise.all([
      gameClient.rpc("list_spot_game_scores"),
      gameClient.rpc("get_spot_game_team_scores"),
    ]);
    rankingsLoaded = !rankingResult.error && !teamResult.error;

    if (teamResult.error) {
      renderTeamBattle();
      teamStatus.textContent = "팀 점수 DB를 준비한 뒤 표시됩니다.";
    } else {
      renderTeamBattle(teamResult.data || []);
    }

    if (rankingResult.error) {
      rankingList.innerHTML = '<li class="spot-ranking__empty">랭킹 DB 준비 후 기록이 표시됩니다.</li>';
      return;
    }

    if (!rankingResult.data?.length) {
      rankingList.innerHTML = '<li class="spot-ranking__empty">첫 번째 기록의 주인공이 되어보세요.</li>';
      return;
    }

    rankingList.innerHTML = rankingResult.data
      .map(
        (row) => `<li><b>${Number(row.ranking_position)}</b><em class="spot-ranking__side spot-ranking__side--${row.side === "신부" ? "bride" : "groom"}">${escapeHtml(row.side)}측</em><span>${escapeHtml(row.name)}</span><time>${formatTime(row.total_ms)}</time></li>`,
      )
      .join("");
  };

  const openGame = () => {
    boards.forEach((board) => {
      board.querySelectorAll("img[data-game-src]").forEach((image) => {
        if (!image.src) image.src = image.dataset.gameSrc;
      });
    });
    game.hidden = false;
    document.body.classList.add("is-viewing-game");
    if (!rankingsLoaded) loadRankings();
    requestAnimationFrame(() => closeButton.focus());
  };

  const closeGame = () => {
    game.hidden = true;
    document.body.classList.remove("is-viewing-game");
    clearInterval(timerId);
    timerId = null;
    playing = false;
    showTeamChoice(false);
    openButton.focus();
  };

  renderTargets();

  boards.forEach((board) => {
    board.addEventListener("click", (event) => {
      const target = event.target.closest("[data-spot-id]");
      if (target) {
        findSpot(target.dataset.spotId);
        return;
      }
      registerMistake(board);
    });
  });

  scoreForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = playerName.value.trim();
    if (!name) return;

    localStorage.setItem("wedding_spot_game_player_name", name);
    const submitButton = scoreForm.querySelector("button");
    submitButton.disabled = true;

    if (!gameClient) {
      scoreStatus.textContent = "Supabase 연결 후 랭킹에 기록할 수 있습니다.";
      submitButton.disabled = false;
      return;
    }

    scoreStatus.textContent = "기록을 등록하고 있습니다...";
    const { data, error } = await gameClient.rpc("submit_spot_game_score", {
      p_name: name,
      p_side: selectedSide,
      p_elapsed_ms: Math.round(elapsedMs),
      p_mistakes: mistakes,
      p_player_token: getPlayerToken(),
    });

    if (error) {
      scoreStatus.textContent = "랭킹 DB를 준비한 뒤 다시 등록해 주세요.";
      submitButton.disabled = false;
      return;
    }

    scoreStatus.textContent = data ? "랭킹에 기록을 등록했습니다." : "기존 최고 기록이 더 빨라 유지했습니다.";
    scoreForm.hidden = true;
    rankingsLoaded = false;
    await loadRankings();
  });

  openButton.addEventListener("click", openGame);
  closeButton.addEventListener("click", closeGame);
  startButton.addEventListener("click", startGame);
  retryButton.addEventListener("click", showTeamChoice);
  sideInputs.forEach((input) => {
    input.addEventListener("change", () => {
      startButton.disabled = false;
      startButton.textContent = `${input.value}측으로 게임 시작`;
    });
  });
  game.addEventListener("click", (event) => {
    if (event.target === game) closeGame();
  });
  document.addEventListener("keydown", (event) => {
    if (!game.hidden && event.key === "Escape") closeGame();
  });
})();
