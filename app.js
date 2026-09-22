app.js
// Safely gather lesson definitions
const rawLessons = [
  typeof lesson1 !== "undefined" ? lesson1 : null,
  typeof lesson2 !== "undefined" ? lesson2 : null,
  typeof lesson3 !== "undefined" ? lesson3 : null,
  typeof lesson4 !== "undefined" ? lesson4 : null,
  typeof lesson5 !== "undefined" ? lesson5 : null,
  typeof lesson6 !== "undefined" ? lesson6 : null,
  typeof lesson7 !== "undefined" ? lesson7 : null,
  typeof lesson8 !== "undefined" ? lesson8 : null,
  typeof lesson9 !== "undefined" ? lesson9 : null,
  typeof lesson10 !== "undefined" ? lesson10 : null,
  typeof lesson11 !== "undefined" ? lesson11 : null,
  typeof lesson12 !== "undefined" ? lesson12 : null,
  typeof lesson13 !== "undefined" ? lesson13 : null,
  typeof lesson14 !== "undefined" ? lesson14 : null,
  typeof lesson15 !== "undefined" ? lesson15 : null
];

const lessons = rawLessons.filter(Boolean);
const STORAGE_KEY = "typingPracticeResults";

let selectedLesson = null;
let selectedLessonIndex = 0;
let isRunning = false;
let startTime = null;
let timerInterval = null;

// Universal Key-Hold State
let activeHoldKey = null;
let isHoldKeyPressed = false;

// Case State
let isCapsLock = false;
let isShiftPressed = false;

// Boss Battle State Variables (LESSON 11)
let bossMaxHp = 100;
let bossCurrentHp = 100;
let isBossBattle = false;

// Tracks character positions where a mistype occurred
let mistypedIndices = new Set();

let typedCharacters = 0;
let correctCharacters = 0;
let incorrectCharacters = 0;

// DOM Element References
const lessonCards = document.getElementById("lessonCards");
const lessonTitle = document.getElementById("lessonTitle");
const lessonDescription = document.getElementById("lessonDescription");
const lessonNumber = document.getElementById("lessonNumber");
const lessonText = document.getElementById("lessonText");
const typingInput = document.getElementById("typingInput");
const progressBar = document.getElementById("progressBar");

const startButton = document.getElementById("startButton");
const resetButton = document.getElementById("resetButton");
const nextButton = document.getElementById("nextButton");
const clearResultsButton = document.getElementById("clearResultsButton");

const timerDisplay = document.getElementById("timer");
const wpmDisplay = document.getElementById("wpm");
const accuracyDisplay = document.getElementById("accuracy");
const errorDisplay = document.getElementById("errors");

const resultsSection = document.getElementById("resultsSection");
const resultWpm = document.getElementById("resultWpm");
const resultAccuracy = document.getElementById("resultAccuracy");
const resultErrors = document.getElementById("resultErrors");
const resultTime = document.getElementById("resultTime");
const resultMessage = document.getElementById("resultMessage");

const overallLessons = document.getElementById("overallLessons");
const overallWpm = document.getElementById("overallWpm");
const overallAccuracy = document.getElementById("overallAccuracy");
const overallTime = document.getElementById("overallTime");
const completedLessonsContainer = document.getElementById("completedLessons");

document.addEventListener("DOMContentLoaded", initializeApp);

function initializeApp() {
  if (lessons.length === 0) return;

  renderLessonCards();
  loadLesson(0);
  updateOverallStats();
  renderCompletedLessonsList();

  if (startButton) startButton.onclick = startLesson;
  if (resetButton) resetButton.onclick = resetLesson;
  if (nextButton) nextButton.onclick = goToNextLesson;
  if (clearResultsButton) clearResultsButton.onclick = clearAllResults;
  if (typingInput) typingInput.oninput = handleTyping;

  // Modal close triggers
  const closeBtn = document.getElementById("closeModalBtn");
  const modalOverlay = document.getElementById("typingModal");

  if (closeBtn) closeBtn.onclick = closeLessonModal;

  if (modalOverlay) {
    modalOverlay.onclick = (e) => {
      if (e.target === modalOverlay) closeLessonModal();
    };
  }

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLessonModal();
  });
}

// Unified Window Keydown Listener
window.addEventListener("keydown", (event) => {
  // 1. Held Key Gatekeeper Check
  if (activeHoldKey && event.key.toLowerCase() === activeHoldKey) {
    event.preventDefault();
    isHoldKeyPressed = true;
    checkHoldKeyRequirement();
  }

  // 2. Shift and CapsLock State Sync
  if (event.key === "CapsLock") {
    isCapsLock = event.getModifierState("CapsLock");
    updateKeyboardCase();
  }
  if (event.key === "Shift") {
    isShiftPressed = true;
    updateKeyboardCase();
  }

  // 3. Light Blue Highlight for Physically Pressed Key (.active)
  const keyName = event.key;
  let targetAttr = keyName.toLowerCase();

  if (keyName === " ") targetAttr = " ";
  if (keyName === "Shift") targetAttr = "Shift";
  if (keyName === "Enter") targetAttr = "Enter";

  const keyElements = document.querySelectorAll(
    `.virtual-keyboard .key[data-key="${CSS.escape(targetAttr)}"], .virtual-keyboard .key[data-key="${CSS.escape(keyName)}"]`
  );

  keyElements.forEach((el) => el.classList.add("active"));
});

// Unified Window Keyup Listener
window.addEventListener("keyup", (event) => {
  // 1. Held Key Release Logic
  if (activeHoldKey && event.key.toLowerCase() === activeHoldKey) {
    isHoldKeyPressed = false;
    checkHoldKeyRequirement();
  }

  // 2. Shift State Sync
  if (event.key === "Shift") {
    isShiftPressed = false;
    updateKeyboardCase();
  }

  // 3. Remove Light Blue Highlight (.active)
  const keyName = event.key;
  let targetAttr = keyName.toLowerCase();

  if (keyName === " ") targetAttr = " ";
  if (keyName === "Shift") targetAttr = "Shift";
  if (keyName === "Enter") targetAttr = "Enter";

  const keyElements = document.querySelectorAll(
    `.virtual-keyboard .key[data-key="${CSS.escape(targetAttr)}"], .virtual-keyboard .key[data-key="${CSS.escape(keyName)}"]`
  );

  keyElements.forEach((el) => el.classList.remove("active"));
});

// Gatekeeper function for required key holds
function checkHoldKeyRequirement() {
  const warningModal = document.getElementById("holdKeyWarningModal");

  if (!activeHoldKey) {
    if (warningModal) warningModal.style.display = "none";
    if (typingInput && isRunning) typingInput.disabled = false;
    return;
  }

  if (!isRunning) return;

  if (isHoldKeyPressed) {
    if (warningModal) warningModal.style.display = "none";
    if (typingInput) {
      typingInput.disabled = false;
      if (document.activeElement !== typingInput) {
        typingInput.focus();
      }
    }
  } else {
    if (warningModal) warningModal.style.display = "flex";
    if (typingInput) typingInput.disabled = true;
  }
}

function renderLessonCards() {
  if (!lessonCards) return;
  lessonCards.innerHTML = "";

  lessons.forEach((lesson, index) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "lesson-card";
    card.dataset.index = index;

    card.innerHTML = `
      <div class="lesson-card-number">Lesson ${index + 1}</div>
      <div class="lesson-card-title">${lesson.title}</div>
      <div class="lesson-card-description">${lesson.description}</div>
    `;

    card.addEventListener("click", () => openLessonModal(index));
    lessonCards.appendChild(card);
  });

  updateSelectedCard();
}

function loadLesson(index) {
  selectedLessonIndex = Number(index);
  selectedLesson = lessons[selectedLessonIndex];

  if (!selectedLesson) return;

  // Toggle Boss Battle vs. Virtual Keyboard visibility
  setupBossBattle(selectedLessonIndex);

  activeHoldKey = selectedLesson.requiredHoldKey ? selectedLesson.requiredHoldKey.toLowerCase() : null;
  isHoldKeyPressed = false;

  if (activeHoldKey) {
    const reqName = document.getElementById("requiredKeyName");
    const reqDisplay = document.getElementById("requiredKeyDisplay");
    const reqHand = document.getElementById("requiredHand");

    if (reqName) reqName.textContent = activeHoldKey.toUpperCase();
    if (reqDisplay) reqDisplay.textContent = activeHoldKey.toUpperCase();
    if (reqHand) reqHand.textContent = selectedLesson.requiredHand || "opposite";
  }

  if (lessonTitle) lessonTitle.textContent = selectedLesson.title;
  if (lessonDescription) lessonDescription.textContent = selectedLesson.description;
  if (lessonNumber) lessonNumber.textContent = selectedLessonIndex + 1;

  updateSelectedCard();
  resetLesson();
}

function updateSelectedCard() {
  const cards = document.querySelectorAll("#lessonCards .lesson-card");
  cards.forEach((card, index) => {
    card.classList.toggle("selected", index === selectedLessonIndex);
  });
}

function startLesson() {
  if (isRunning) return;

  isRunning = true;
  startTime = Date.now();
  mistypedIndices.clear();

  typedCharacters = 0;
  correctCharacters = 0;
  incorrectCharacters = 0;

  if (startButton) startButton.disabled = true;

  if (typingInput) {
    typingInput.disabled = false;
    typingInput.focus();
  }

  timerInterval = setInterval(updateTimer, 1000);

  checkHoldKeyRequirement();
  if (selectedLesson && selectedLesson.text) {
    highlightNextKey(selectedLesson.text[0]);
  }
}

function resetLesson() {
  clearInterval(timerInterval);

  isRunning = false;
  startTime = null;
  isHoldKeyPressed = false;
  mistypedIndices.clear();

  typedCharacters = 0;
  correctCharacters = 0;
  incorrectCharacters = 0;

  if (typingInput) {
    typingInput.value = "";
    typingInput.disabled = false;
    setTimeout(() => typingInput.focus(), 50);
  }

  if (startButton) startButton.disabled = false;
  if (nextButton) nextButton.style.display = "none";
  if (resultsSection) resultsSection.style.display = "none";
  if (progressBar) progressBar.style.width = "0%";

  if (timerDisplay) timerDisplay.textContent = "0";
  if (wpmDisplay) wpmDisplay.textContent = "0";
  if (accuracyDisplay) accuracyDisplay.textContent = "100%";
  if (errorDisplay) errorDisplay.textContent = "0";

  // Clear keyboard highlights
  document.querySelectorAll(".virtual-keyboard .key").forEach((k) => k.classList.remove("active", "next-key"));

  checkHoldKeyRequirement();
  renderLessonText();
  highlightNextKey(null);
}

function renderLessonText() {
  if (!lessonText) return;
  lessonText.innerHTML = "";

  if (!selectedLesson) return;

  [...selectedLesson.text].forEach((character, index) => {
    const span = document.createElement("span");
    span.textContent = character === " " ? "\u00A0" : character;
    span.className = "typing-character";
    if (index === 0) span.classList.add("current");
    lessonText.appendChild(span);
  });
}

function handleTyping(event) {
  const value = event.target.value;

  if (!isRunning && value.length > 0) {
    startLesson();
  }

  if (!isRunning) return;

  const characters = lessonText.querySelectorAll(".typing-character");

  if (progressBar && selectedLesson) {
    const progressPercent = Math.min((value.length / selectedLesson.text.length) * 100, 100);
    progressBar.style.width = `${progressPercent}%`;

    if (isBossBattle) {
      handleBossAttack(progressPercent);
    }
  }

  let currentCorrectCount = 0;

  characters.forEach((character, index) => {
    character.classList.remove("correct", "incorrect", "corrected", "current");

    if (index < value.length) {
      if (value[index] === selectedLesson.text[index]) {
        if (mistypedIndices.has(index)) {
          character.classList.add("corrected");
        } else {
          character.classList.add("correct");
        }
        currentCorrectCount++;
      } else {
        character.classList.add("incorrect");
        mistypedIndices.add(index);
      }
    } else if (index === value.length) {
      character.classList.add("current");
    }
  });

  incorrectCharacters = mistypedIndices.size;
  correctCharacters = currentCorrectCount;

  if (value.length < selectedLesson.text.length) {
    highlightNextKey(selectedLesson.text[value.length]);
  } else {
    highlightNextKey(null);
  }

  updateLiveStats();

  if (value.length >= selectedLesson.text.length) {
    finishLesson();
  }
}

function updateTimer() {
  if (!startTime) return;
  const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
  if (timerDisplay) timerDisplay.textContent = elapsedSeconds;
  updateLiveStats();
}

function updateLiveStats() {
  if (!startTime) return;

  const elapsedSeconds = Math.max((Date.now() - startTime) / 1000, 1);
  const minutes = elapsedSeconds / 60;

  const currentInputLength = typingInput ? typingInput.value.length : 0;
  const wordsTyped = currentInputLength / 5;
  const wpm = Math.round(wordsTyped / minutes);

  const totalAttempts = currentInputLength + incorrectCharacters;
  const accuracy = totalAttempts > 0
    ? Math.max(0, Math.round(((totalAttempts - incorrectCharacters) / totalAttempts) * 100))
    : 100;

  if (timerDisplay) timerDisplay.textContent = Math.floor(elapsedSeconds);
  if (wpmDisplay) wpmDisplay.textContent = wpm;
  if (accuracyDisplay) accuracyDisplay.textContent = `${accuracy}%`;
  if (errorDisplay) errorDisplay.textContent = incorrectCharacters;
}

function finishLesson() {
  if (!isRunning) return;

  isRunning = false;
  clearInterval(timerInterval);

  if (typingInput) typingInput.disabled = true;
  if (startButton) startButton.disabled = false;

  const elapsedSeconds = Math.max((Date.now() - startTime) / 1000, 1);
  const minutes = elapsedSeconds / 60;

  const currentInputLength = typingInput ? typingInput.value.length : 0;
  const wordsTyped = currentInputLength / 5;
  const wpm = Math.round(wordsTyped / minutes);

  const totalAttempts = currentInputLength + incorrectCharacters;
  const accuracy = totalAttempts > 0
    ? Math.max(0, Math.round(((totalAttempts - incorrectCharacters) / totalAttempts) * 100))
    : 100;

  if (resultWpm) resultWpm.textContent = wpm;
  if (resultAccuracy) resultAccuracy.textContent = `${accuracy}%`;
  if (resultErrors) resultErrors.textContent = incorrectCharacters;
  if (resultTime) resultTime.textContent = `${Math.floor(elapsedSeconds)} sec`;

  if (resultMessage) {
    resultMessage.textContent = accuracy >= 95
      ? "Great job! Excellent accuracy!"
      : "Good effort! Keep practicing to improve accuracy.";
  }

  if (resultsSection) resultsSection.style.display = "block";

  if (nextButton) {
    nextButton.style.display = selectedLessonIndex < lessons.length - 1 ? "inline-block" : "none";
  }

  saveLessonResult({
    lessonId: selectedLesson.id,
    lessonTitle: selectedLesson.title,
    wpm,
    accuracy,
    errors: incorrectCharacters,
    time: Math.floor(elapsedSeconds),
    completedAt: new Date().toLocaleDateString()
  });

  updateOverallStats();
  renderCompletedLessonsList();
  checkHoldKeyRequirement();
}

function goToNextLesson() {
  if (selectedLessonIndex < lessons.length - 1) {
    loadLesson(selectedLessonIndex + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function getSavedResults() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (error) {
    return [];
  }
}

function saveLessonResult(result) {
  const results = getSavedResults();
  const existingIndex = results.findIndex((item) => item.lessonId === result.lessonId);

  if (existingIndex >= 0) {
    results[existingIndex] = result;
  } else {
    results.push(result);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
}

function updateOverallStats() {
  const results = getSavedResults();

  const validResults = results.filter((result) =>
    lessons.some((lesson) => lesson.id === result.lessonId)
  );

  if (overallLessons) {
    overallLessons.textContent = `${validResults.length}/${lessons.length}`;
  }

  if (validResults.length === 0) {
    if (overallWpm) overallWpm.textContent = "0";
    if (overallAccuracy) overallAccuracy.textContent = "0%";
    if (overallTime) overallTime.textContent = "0 sec";
    return;
  }

  const averageWpm = Math.round(
    validResults.reduce((sum, res) => sum + Number(res.wpm || 0), 0) / validResults.length
  );

  const averageAccuracy = Math.round(
    validResults.reduce((sum, res) => sum + Number(res.accuracy || 0), 0) / validResults.length
  );

  const totalTime = validResults.reduce(
    (sum, res) => sum + Number(res.time || 0),
    0
  );

  if (overallWpm) overallWpm.textContent = averageWpm;
  if (overallAccuracy) overallAccuracy.textContent = `${averageAccuracy}%`;
  if (overallTime) overallTime.textContent = `${totalTime} sec`;
}

function renderCompletedLessonsList() {
  const results = getSavedResults();
  const completedLessonIds = results.map((result) => result.lessonId);

  const cards = document.querySelectorAll("#lessonCards .lesson-card");
  cards.forEach((card, index) => {
    const lesson = lessons[index];
    if (lesson) {
      card.classList.toggle("completed", completedLessonIds.includes(lesson.id));
    }
  });

  if (!completedLessonsContainer) return;

  if (results.length === 0) {
    completedLessonsContainer.innerHTML = `<p class="empty-message">No lessons completed yet.</p>`;
    return;
  }

  let html = `<ul class="completed-lessons-list">`;
  results.forEach((item) => {
    html += `
      <li class="completed-item">
        <strong>${item.lessonTitle}</strong> —${item.wpm} WPM | ${item.accuracy}\% Accuracy \vert{}${item.time}s
      </li>
    `;
  });
  html += `</ul>`;

  completedLessonsContainer.innerHTML = html;
}

function clearAllResults() {
  localStorage.removeItem(STORAGE_KEY);
  updateOverallStats();
  renderCompletedLessonsList();
}

function openLessonModal(index) {
  loadLesson(index);
  const modal = document.getElementById("typingModal");
  if (modal) modal.classList.add("active");

  if (typingInput) {
    setTimeout(() => typingInput.focus(), 100);
  }
}

function closeLessonModal() {
  const modal = document.getElementById("typingModal");
  if (modal) modal.classList.remove("active");
  resetLesson();
}

// Highlights expected next key in Dark Blue (.next-key)
function highlightNextKey(expectedChar) {
  document.querySelectorAll(".virtual-keyboard .key").forEach((key) => {
    key.classList.remove("next-key");
  });

  if (!expectedChar) return;

  // 1. Line Breaks
  if (expectedChar === "\n" || expectedChar === "\r") {
    const enterKey = document.querySelector('.virtual-keyboard .key[data-key="enter"]');
    if (enterKey) enterKey.classList.add("next-key");
    return;
  }

  // Map shift characters/symbols to physical base key data-key attributes
  const shiftMap = {
    '~': '`', '!': '1', '@': '2', '#': '3', '$': '4',
    '%': '5', '^': '6', '&': '7', '*': '8', '(': '9',
    ')': '0', '_': '-', '+': '=', '{': '[', '}': ']',
    '|': '\\', ':': ';', '"': "'", '<': ',', '>': '.',
    '?': '/'
  };

  const isUppercase = expectedChar >= "A" && expectedChar <= "Z";
  const isShiftSymbol = expectedChar in shiftMap;
  const requiresShift = isUppercase || isShiftSymbol;

  // 2. Highlight Shift Key if required
  if (requiresShift) {
    const shiftKeys = document.querySelectorAll('.virtual-keyboard .key[data-key="shift"]');
    shiftKeys.forEach((key) => key.classList.add("next-key"));
  }

  // 3. Target Character Key
  let keyElement;
  if (expectedChar === " " || expectedChar === "\u00A0") {
    keyElement = document.querySelector('.virtual-keyboard .key[data-key=" "]') ||
                 document.querySelector('.virtual-keyboard .key[data-key="space"]');
  } else {
    let baseKey = expectedChar.toLowerCase();
    if (isShiftSymbol) {
      baseKey = shiftMap[expectedChar];
    }

    keyElement = document.querySelector(`.virtual-keyboard .key[data-key="${CSS.escape(baseKey)}"]`) ||
                 document.querySelector(`.virtual-keyboard .key[data-key="${CSS.escape(expectedChar)}"]`);
  }

  if (keyElement) {
    keyElement.classList.add("next-key");
  }
}

// Dynamically updates physical keyboard letter cases and special characters
function updateKeyboardCase() {
  const isUppercase = (isCapsLock && !isShiftPressed) || (!isCapsLock && isShiftPressed);

  document.querySelectorAll(".virtual-keyboard .key").forEach((keyEl) => {
    const baseKey = keyEl.dataset.key;
    const shiftKey = keyEl.dataset.shift;

    if (!baseKey) return;

    if (baseKey.length === 1 && baseKey.match(/[a-z]/i)) {
      keyEl.textContent = isUppercase ? baseKey.toUpperCase() : baseKey.toLowerCase();
    } else if (shiftKey) {
      keyEl.textContent = isShiftPressed ? shiftKey : baseKey;
    }
  });
}

// Initialize Boss Battle Arena for Lesson 11 (Index 10)
function setupBossBattle(lessonIndex) {
  const arena = document.getElementById("battleArena");
  const keyboard = document.querySelector(".virtual-keyboard");
  const bossHpBar = document.getElementById("bossHpBar");
  const battleMessage = document.getElementById("battleMessage");
  const trollSprite = document.getElementById("trollSprite");

  if (lessonIndex === 10) {
    isBossBattle = true;
    bossCurrentHp = 100;

    if (bossHpBar) bossHpBar.style.width = "100%";
    if (trollSprite) {
      trollSprite.style.transform = "scale(1)";
      trollSprite.textContent = "🧌";
    }
    if (battleMessage) battleMessage.textContent = "Type accurately to cast spells and defeat the troll!";

    if (keyboard) keyboard.style.display = "none";
    if (arena) arena.style.display = "block";
  } else {
    isBossBattle = false;
    if (keyboard) keyboard.style.display = "block";
    if (arena) arena.style.display = "none";
  }
}

// Trigger Spell Cast & Damage Troll during Lesson 11
function handleBossAttack(progressPercent) {
  if (!isBossBattle) return;

  bossCurrentHp = Math.max(0, 100 - progressPercent);
  const bossHpBar = document.getElementById("bossHpBar");
  if (bossHpBar) bossHpBar.style.width = `${bossCurrentHp}%`;

  const wizard = document.getElementById("wizardSprite");
  const spell = document.getElementById("spellEffect");
  const troll = document.getElementById("trollSprite");
  const battleMessage = document.getElementById("battleMessage");

  if (wizard) wizard.style.transform = "scale(1.2) translateX(10px)";

  if (spell) {
    spell.style.opacity = "1";
    spell.style.transform = "translateX(180px)";
  }

  setTimeout(() => {
    if (wizard) wizard.style.transform = "scale(1)";
    if (spell) {
      spell.style.opacity = "0";
      spell.style.transform = "translateX(0px)";
    }

    if (troll && bossCurrentHp > 0) {
      troll.style.transform = "scale(0.9) rotate(-10deg)";
      setTimeout(() => (troll.style.transform = "scale(1)"), 200);
    }
  }, 250);

  if (bossCurrentHp <= 0 && troll) {
    troll.textContent = "💀";
    if (battleMessage) battleMessage.textContent = "VICTORY! You defeated the Troll!";
  }
}
