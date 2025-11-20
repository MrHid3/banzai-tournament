const getElement = (id) => document.getElementById(id);

let pointsA = 0;
let pointsB = 0;
let timeLeft = 180;
let timerRunning = false;
let timerInterval = null;
let competitorsCache = [];
const timerElement = getElement("timer");

// ----------------------
// TIMER
// ----------------------
function startTimer() {
  if (timerRunning) return;
  timerRunning = true;
timerElement.classList.remove('blink2');

  timerInterval = setInterval(() => {
    if(timeLeft > 0){
      timerElement.classList.remove('blink2');
      timeLeft--;
      updateTimerDisplay();
    }else{
      timerElement.classList.add('blink2');
    }
  }, 1000);
}

function stopTimer() {
  timerRunning = false;
  timerElement.classList.remove('blink2');
  clearInterval(timerInterval);
}

function updateTimerDisplay() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  timerElement.textContent = `${minutes}:${String(seconds).padStart(2, "0")}`;

  if (timeLeft <= 10 && timeLeft%2) {
    timerElement.classList.add("blink");
  } else {
    timerElement.classList.remove("blink");
  }
}

function addTime(seconds) {
  // ⛔ Nie uruchamiamy timera po zmianie czasu
  timeLeft = Math.max(0, timeLeft + seconds);
  updateTimerDisplay();
}

// ----------------------
// PUNKTY
// ----------------------
function updatePointsDisplay() {
  getElement("pointsA").textContent = pointsA;
  getElement("pointsB").textContent = pointsB;
}

// ----------------------
// POBIERANIE ZAWODNIKÓW
// ----------------------
async function fetchSingleCompetitor(id) {
  const urlParams = new URLSearchParams(window.location.search);

  try {
    const response = await fetch(`${backendURL}/getCompetitor/${id}?token=${token}`);
    if (!response.ok) throw new Error(`Błąd pobierania zawodnika ${id}: ${response.status}`);
    const data = await response.json();
    return Array.isArray(data) ? data[0] : data;
  } catch (err) {
    console.error("Błąd pobierania zawodnika:", err);
    return null;
  }
}

async function fetchCompetitors() {
  const urlParams = new URLSearchParams(window.location.search);
  const id1 = urlParams.get("id1");
  const id2 = urlParams.get("id2");

  if (id1 && id2) {
    const [competitorA, competitorB] = await Promise.all([
      fetchSingleCompetitor(id1),
      fetchSingleCompetitor(id2),
    ]);
    const competitors = [];
    if (competitorA) competitors.push(competitorA);
    if (competitorB) competitors.push(competitorB);
    getElement("zawodnikA").textContent = competitorA.name + " " + competitorA.surname;
    getElement("zawodnikB").textContent = competitorB.name + " " + competitorB.surname;
    return competitors;
  }

  // if (token) {
  //   try {
  //     const response = await fetch(`${backendURL}/getCompetitor/${id}?token=${token}`);
  //     if (!response.ok) throw new Error(`Błąd pobierania zawodników: ${response.status}`);
  //     const competitors = await response.json();
  //     return Array.isArray(competitors) ? competitors : [];
  //   } catch (error) {
  //     console.error("Błąd pobierania zawodników (token):", error);
  //     return [];
  //   }
  // }

  console.error("Brak tokena ani id1/id2 w adresie URL!");
  return [];
}

// ----------------------
// INICJALIZACJA ZAWODNIKÓW
// ----------------------
async function initCompetitors() {
  const competitors = await fetchCompetitors();
  competitorsCache = competitors;

  const nameAEl = getElement("nameA");
  const nameBEl = getElement("nameB");

  // Czyścimy zawartość
  nameAEl.textContent = "";
  nameBEl.textContent = "";

  if (competitors.length >= 2) {

    // 🔍 Sprawdzenie kategorii
    const categoryA = competitors[0].category_id;
    const categoryB = competitors[1].category_id;

    if (categoryA !== categoryB) {
      alert("⚠️ Zawodnicy nie są w tej samej kategorii! Wybierz inne dane.");
      // Możesz opcjonalnie przerwać dalsze działanie:
      window.location.href="/stolikMaly";
    }

    // Tworzymy elementy imienia i nazwiska
    const firstA = document.createElement("div");
    firstA.classList.add("first-name");
    firstA.textContent = competitors[0].name;

    const lastA = document.createElement("div");
    lastA.classList.add("last-name");
    lastA.textContent = competitors[0].surname;

    nameAEl.appendChild(firstA);
    nameAEl.appendChild(lastA);

    const firstB = document.createElement("div");
    firstB.classList.add("first-name");
    firstB.textContent = competitors[1].name;

    const lastB = document.createElement("div");
    lastB.classList.add("last-name");
    lastB.textContent = competitors[1].surname;

    nameBEl.appendChild(firstB);
    nameBEl.appendChild(lastB);
  }
}


// ----------------------
// WYSYŁANIE WYNIKU
// ----------------------
async function sendFightResult() {
  if (!competitorsCache || competitorsCache.length === 0) {
    alert("Brakuje zawodników!");
    return;
  }

  const winner = getElement("winnerSelect").value;
  let reason = getElement("reasonSelect").value.trim();
  if (!winner) {
    alert("Wybierz zwycięzcę!");
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const category_ID = urlParams.get("category");

  if (!category_ID) {
    alert("Brak tokena lub kategorii – nie można wysłać wyniku!");
    return;
  }

  const winnerCompetitor = winner === "A" ? competitorsCache[0] : competitorsCache[1];
  const loserCompetitor = winner === "A" ? competitorsCache[1] : competitorsCache[0];
  let winner_points = winner === "A" ? pointsA : pointsB;
  let loser_points = winner === "A" ? pointsB : pointsA;

  // switch(reason.toLowerCase()) {
  //   case "walkover":
  //   case "decyzja sędziowska":
  //     winner_points += 1;
  //     break;
  //   case "poddanie":
  //     winner_points = 99;
  //     if (winner === "A") pointsA = winner_points;
  //     else pointsB = winner_points;
  //     updatePointsDisplay();
  //     break;
  // }

  const payload = {
    token,
    winner_ID: Number(winnerCompetitor.id),
    loser_ID: loserCompetitor ? Number(loserCompetitor.id) : 0,
    winner_points: Number(winner_points),
    loser_points: Number(loser_points),
    reason: reason || "Brak powodu",
    category_ID: Number(category_ID)
  };

  getElement("sendStatus").textContent = "⏳ Wysyłanie...";

  try {
    const response = await fetch(`${backendURL}/saveFightResults`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      getElement("sendStatus").textContent = "✅ Wynik wysłany!";
      window.location.href="/stolikMaly";
    }
    else if (response.status === 400) getElement("sendStatus").textContent = "❌ Błąd: brak wymaganych danych!";
    else if (response.status === 401) getElement("sendStatus").textContent = "❌ Nieautoryzowany!";
    else if (response.status === 500) getElement("sendStatus").textContent = "❌ Błąd serwera!";
  } catch (error) {
    console.error(error);
    getElement("sendStatus").textContent = "❌ Błąd sieci!";
  }
}

// ----------------------
// INICJALIZACJA
// ----------------------
window.addEventListener("DOMContentLoaded", async () => {
  const timerElement = getElement("timer");
  if (timerElement) {
    timerElement.onclick = () => (timerRunning ? stopTimer() : startTimer());

    document.addEventListener("keydown", (event) => {
      switch(event.code) {
        case "Space":
          event.preventDefault();
          timerRunning ? stopTimer() : startTimer();
          break;

        case "ArrowLeft":
        case "ArrowRight":
        case "ArrowUp":
        case "ArrowDown":
          if (timerRunning) return; // ⛔ Blokada zmiany czasu podczas odliczania
          event.preventDefault();
          if (event.code === "ArrowLeft") addTime(-30);
          if (event.code === "ArrowRight") addTime(30);
          if (event.code === "ArrowUp") addTime(10);
          if (event.code === "ArrowDown") addTime(-10);
          break;
      }
    });
  }

  const pointsAEl = getElement("pointsA");
  const pointsBEl = getElement("pointsB");
  const decAEl = getElement("decA");
  const decBEl = getElement("decB");

  if (pointsAEl) pointsAEl.onclick = () => { pointsA++; updatePointsDisplay(); };
  if (pointsBEl) pointsBEl.onclick = () => { pointsB++; updatePointsDisplay(); };
  if (decAEl) decAEl.onclick = () => { pointsA = Math.max(0, pointsA - 1); updatePointsDisplay(); };
  if (decBEl) decBEl.onclick = () => { pointsB = Math.max(0, pointsB - 1); updatePointsDisplay(); };

  const openMenuButton = getElement("openMenuBtn");
  const resultMenuContainer = getElement("sendMenu");
  const cancelSendButton = getElement("cancelSendBtn");
  const sendResultButton = getElement("sendResultBtn");

  if (openMenuButton && resultMenuContainer) {
    openMenuButton.addEventListener("click", () => {
      resultMenuContainer.style.display = "flex";
    });
  }

  if (cancelSendButton && resultMenuContainer) {
    cancelSendButton.addEventListener("click", () => {
      resultMenuContainer.style.display = "none";
    });
  }

  if (sendResultButton) {
    sendResultButton.addEventListener("click", sendFightResult);
  }

  updateTimerDisplay();
  updatePointsDisplay();
  await initCompetitors();
});
