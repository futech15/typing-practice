const lessons = [
  lesson1,
  lesson2,
  lesson3,
  lesson4
];

const STORAGE_KEY = "typingPracticeResults";

let selectedLesson = null;
let selectedLessonIndex = 0;
let isRunning = false;
let startTime = null;
let timerInterval = null;
let hasStartedTyping = false;

// Page elements
const lessonCards = document.getElementById("lessonCards");
const lessonTitle = document.getElementById("lessonTitle");
const lessonDescription = document.getElementById("lessonDescription");
const lessonText = document.getElementById("lessonText");
const typingInput = document.getElementById("typingInput");
const startButton = document.getElementById("startButton");
const resetButton = document.getElementById("resetButton");
const nextButton = document.getElementById("nextButton");

const timerDisplay = document.getElementById("timer");
const wpmDisplay = document.getElementById("wpm");
const accuracyDisplay = document.getElementById("accuracy");
const errorDisplay = document.getElementById("errors");

const resultsSection = document.getElementById("resultsSection");
const resultWpm = document.getElementById("resultWpm");
const resultAccuracy = document.getElementById("resultAccuracy");
const resultErrors = document.getElementById("resultErrors");
const resultTime = document.getElementById("resultTime");

const overallLessons = document.getElementById("overallLessons");
const overallWpm = document.getElementById("overallWpm");
const overallAccuracy = document.getElementById("overallAccuracy");

let typedCharacters = 0;
let correctCharacters = 0;
let incorrectCharacters = 0;

initializeApp();
function initializeApp() {
  console.log("Application started");

  renderLessonCards();
  loadLesson(0);
  updateOverallStats();
  displayCompletedLessons();

  startButton.onclick = function () {
    startLesson();
  };

  resetButton.onclick = function () {
    resetLesson();
  };

  nextButton.onclick = function () {
    goToNextLesson();
  };

  typingInput.oninput = function () {
    handleTyping();
  };
}

function renderLessonCards() {
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

    card.addEventListener("click", () => {
      loadLesson(index);
    });

    lessonCards.appendChild(card);
  });

  updateSelectedCard();
}

function loadLesson(index) {
  selectedLessonIndex = Number(index);
  selectedLesson = lessons[selectedLessonIndex];

  if (!selectedLesson) {
    console.error("Lesson not found:", index);
    return;
  }

  lessonTitle.textContent = selectedLesson.title;
  lessonDescription.textContent = selectedLesson.description;

  updateSelectedCard();
  resetLesson();
}

function updateSelectedCard() {
  const cards = document.querySelectorAll(".lesson-card");

  cards.forEach((card, index) => {
    card.classList.toggle(
      "selected",
      index === selectedLessonIndex
    );
  });
}

function startLesson() {
  if (isRunning) return;

  isRunning = true;
  hasStartedTyping = false;
  startTime = Date.now();

  startButton.disabled = true;
  typingInput.disabled = false;
  typingInput.focus();

  timerInterval = setInterval(updateTimer, 1000);
}

function resetLesson() {
  clearInterval(timerInterval);

  isRunning = false;
  startTime = null;
  hasStartedTyping = false;

  typedCharacters = 0;
  correctCharacters = 0;
  incorrectCharacters = 0;

  typingInput.value = "";
  typingInput.disabled = true;

  startButton.disabled = false;
  nextButton.style.display = "none";
  resultsSection.style.display = "none";

  timerDisplay.textContent = "0";
  wpmDisplay.textContent = "0";
  accuracyDisplay.textContent = "100%";
  errorDisplay.textContent = "0";

  renderLessonText();
}

function renderLessonText() {
  lessonText.innerHTML = "";

  if (!selectedLesson) return;

  [...selectedLesson.text].forEach((character) => {
    const span = document.createElement("span");
    span.textContent = character === " " ? "\u00A0" : character;
    span.className = "typing-character";
    lessonText.appendChild(span);
  });
}

function handleTyping(event) {
  if (!isRunning) return;

  const value = event.target.value;
  const characters = lessonText.querySelectorAll(".typing-character");

  typedCharacters = value.length;
  correctCharacters = 0;
  incorrectCharacters = 0;

  characters.forEach((character, index) => {
    character.classList.remove("correct", "incorrect", "current");

    if (index < value.length) {
      if (value[index] === selectedLesson.text[index]) {
        character.classList.add("correct");
        correctCharacters++;
      } else {
        character.classList.add("incorrect");
        incorrectCharacters++;
      }
    } else if (index === value.length) {
      character.classList.add("current");
    }
  });

  updateLiveStats();

  if (value.length >= selectedLesson.text.length) {
    finishLesson();
  }
}

function updateTimer() {
  if (!startTime) return;

  const elapsedSeconds = Math.floor(
    (Date.now() - startTime) / 1000
  );

  timerDisplay.textContent = elapsedSeconds;
  updateLiveStats();
}

function updateLiveStats() {
  if (!startTime) return;

  const elapsedSeconds = Math.max(
    (Date.now() - startTime) / 1000,
    1
  );

  const minutes = elapsedSeconds / 60;
  const wordsTyped = typedCharacters / 5;
  const wpm = Math.round(wordsTyped / minutes);

  const accuracy =
    typedCharacters > 0
      ? Math.round((correctCharacters / typedCharacters) * 100)
      : 100;

  timerDisplay.textContent = Math.floor(elapsedSeconds);
  wpmDisplay.textContent = wpm;
  accuracyDisplay.textContent = `${accuracy}%`;
  errorDisplay.textContent = incorrectCharacters;
}

function finishLesson() {
  if (!isRunning) return;

  isRunning = false;
  clearInterval(timerInterval);

  typingInput.disabled = true;
  startButton.disabled = false;

  const elapsedSeconds = Math.max(
    (Date.now() - startTime) / 1000,
    1
  );

  const minutes = elapsedSeconds / 60;
  const wpm = Math.round((typedCharacters / 5) / minutes);

  const accuracy =
    typedCharacters > 0
      ? Math.round((correctCharacters / typedCharacters) * 100)
      : 100;

  resultWpm.textContent = wpm;
  resultAccuracy.textContent = `${accuracy}%`;
  resultErrors.textContent = incorrectCharacters;
  resultTime.textContent = `${Math.floor(elapsedSeconds)} seconds`;

  resultsSection.style.display = "block";

  if (selectedLessonIndex < lessons.length - 1) {
    nextButton.style.display = "inline-block";
  } else {
    nextButton.style.display = "none";
  }

  saveLessonResult({
    lessonId: selectedLesson.id,
    lessonTitle: selectedLesson.title,
    wpm,
    accuracy,
    errors: incorrectCharacters,
    time: Math.floor(elapsedSeconds),
    completedAt: new Date().toISOString()
  });

  updateOverallStats();
  displayCompletedLessons();
}

function goToNextLesson() {
  if (selectedLessonIndex < lessons.length - 1) {
    loadLesson(selectedLessonIndex + 1);

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }
}

function getSavedResults() {
  try {
    return JSON.parse(
      localStorage.getItem(STORAGE_KEY)
    ) || [];
  } catch (error) {
    console.error("Could not read saved results:", error);
    return [];
  }
}

function saveLessonResult(result) {
  const results = getSavedResults();

  const existingIndex = results.findIndex(
    (item) => item.lessonId === result.lessonId
  );

  if (existingIndex >= 0) {
    results[existingIndex] = result;
  } else {
    results.push(result);
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(results)
  );
}

function updateOverallStats() {
  const results = getSavedResults();

  overallLessons.textContent = `${results.length}/${lessons.length}`;

  if (results.length === 0) {
    overallWpm.textContent = "0";
    overallAccuracy.textContent = "0%";
    return;
  }

  const averageWpm = Math.round(
    results.reduce((sum, result) => sum + result.wpm, 0) /
      results.length
  );

  const averageAccuracy = Math.round(
    results.reduce((sum, result) => sum + result.accuracy, 0) /
      results.length
  );

  overallWpm.textContent = averageWpm;
  overallAccuracy.textContent = `${averageAccuracy}%`;
}

function displayCompletedLessons() {
  const results = getSavedResults();
  const completedLessonIds = results.map(
    (result) => result.lessonId
  );

  const cards = document.querySelectorAll(".lesson-card");

  cards.forEach((card, index) => {
    const lesson = lessons[index];

    card.classList.toggle(
      "completed",
      completedLessonIds.includes(lesson.id)
    );
  });
}
