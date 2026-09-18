// Safely gather lesson definitions (Lessons 1-6)
const rawLessons = [
  typeof lesson1 !== "undefined" ? lesson1 : null,
  typeof lesson2 !== "undefined" ? lesson2 : null,
  typeof lesson3 !== "undefined" ? lesson3 : null,
  typeof lesson4 !== "undefined" ? lesson4 : null,
  typeof lesson5 !== "undefined" ? lesson5 : null,
  typeof lesson6 !== "undefined" ? lesson6 : null
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

// Tracks character positions where a mistype occurred
let mistypedIndices = new Set();

// Universal Keyboard Event Listeners for Held Keys
window.addEventListener("keydown", (event) => {
  if (activeHoldKey && event.key.toLowerCase() === activeHoldKey) {
    event.preventDefault(); // Prevents key repetition
    isHoldKeyPressed = true;
    checkHoldKeyRequirement();
  }
});

window.addEventListener("keyup", (event) => {
  if (activeHoldKey && event.key.toLowerCase() === activeHoldKey) {
    isHoldKeyPressed = false;
    checkHoldKeyRequirement();
  }
});

// Gatekeeper function for required key holds
function checkHoldKeyRequirement() {
  const warningModal = document.getElementById("holdKeyWarningModal");
  const typingInput = document.getElementById("typingInput");

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

let typedCharacters = 0;
let correctCharacters = 0;
let incorrectCharacters = 0;

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

  // ENABLE TYPING INPUT
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
    typingInput.disabled = true;
  }

  if (startButton) startButton.disabled = false;
  if (nextButton) nextButton.style.display = "none";
  if (resultsSection) resultsSection.style.display = "none";
  if (progressBar) progressBar.style.width = "0%";

  if (timerDisplay) timerDisplay.textContent = "0";
  if (wpmDisplay) wpmDisplay.textContent = "0";
  if (accuracyDisplay) accuracyDisplay.textContent = "100%";
  if (errorDisplay) errorDisplay.textContent = "0";

  // CLEAR KEYBOARD HIGHLIGHTS
  document.querySelectorAll(".key").forEach((k) => k.classList.remove("active", "next-key"));

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
  if (!isRunning) return;

  const value = event.target.value;
  const characters = lessonText.querySelectorAll(".typing-character");

  if (progressBar && selectedLesson) {
    const progressPercent = Math.min((value.length / selectedLesson.text.length) * 100, 100);
    progressBar.style.width = `${progressPercent}%`;
  }

  let currentCorrectCount = 0;

  characters.forEach((character, index) => {
    character.classList.remove("correct", "incorrect", "corrected", "current");

    if (index < value.length) {
      if (value[index] === selectedLesson.text[index]) {
        if (mistypedIndices.has(index)) {
          character.classList.add("corrected"); // Yellow
        } else {
          character.classList.add("correct"); // Green
        }
        currentCorrectCount++;
      } else {
        character.classList.add("incorrect"); // Red
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

  const validResults = results.filter(result =>
    lessons.some(lesson => lesson.id === result.lessonId)
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
        <strong>${item.lessonTitle}</strong> — ${item.wpm} WPM | ${item.accuracy}% Accuracy | ${item.time}s
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
}

function closeLessonModal() {
  const modal = document.getElementById("typingModal");
  if (modal) modal.classList.remove("active");
  resetLesson();
}

function highlightNextKey(expectedChar) {
  document.querySelectorAll('.virtual-keyboard .key').forEach(key => {
    key.classList.remove('next-key');
  });

  if (!expectedChar) return;

  let targetKey = expectedChar.toLowerCase();
  let keyElement;

  if (targetKey === ' ' || targetKey === '\u00A0') {
    keyElement = document.querySelector('.virtual-keyboard .key[data-key=" "]') ||
                 document.querySelector('.virtual-keyboard .key[data-key="space"]');
  } else {
    keyElement = document.querySelector(`.virtual-keyboard .key[data-key="${CSS.escape(targetKey)}"]`);
  }

  if (keyElement) {
    keyElement.classList.add('next-key');
  }
}

let isCapsLock = false;
let isShiftPressed = false;

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

window.addEventListener("keydown", (e) => {
  const rawKey = e.key.toLowerCase();

  if (e.key === "CapsLock") {
    isCapsLock = e.getModifierState("CapsLock");
    updateKeyboardCase();
  }

  if (e.key === "Shift") {
    isShiftPressed = true;
    updateKeyboardCase();
  }

  // Clear all key active states first to prevent sticking
  document.querySelectorAll(".key").forEach((k) => k.classList.remove("active"));

  const keyToMatch = rawKey === " " ? " " : rawKey;
  
  // Safe selector lookup
  try {
    const keys = document.querySelectorAll(`.key[data-key="${CSS.escape(keyToMatch)}"]`);
    keys.forEach((keyEl) => keyEl.classList.add("active"));
  } catch (err) {
    // Fallback if key escapes fail
  }
});

window.addEventListener("keyup", (e) => {
  if (e.key === "Shift") {
    isShiftPressed = false;
    updateKeyboardCase();
  }

  // Remove active state across all keys on keyup
  document.querySelectorAll(".key").forEach((keyEl) => {
    keyEl.classList.remove("active");
  });
});
