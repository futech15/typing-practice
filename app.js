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
const lessonNumber = document.getElementById("lessonNumber");
const textDisplay = document.getElementById("textDisplay");
const typingInput = document.getElementById("typingInput");

const startButton = document.getElementById("startButton");
const resetButton = document.getElementById("resetButton");
const nextButton = document.getElementById("nextButton");
const clearResultsButton = document.getElementById("clearResultsButton");

const progressBar = document.getElementById("progressBar");

const liveWpm = document.getElementById("liveWpm");
const liveAccuracy = document.getElementById("liveAccuracy");
const liveTime = document.getElementById("liveTime");

const resultWpm = document.getElementById("resultWpm");
const resultAccuracy = document.getElementById("resultAccuracy");
const resultTime = document.getElementById("resultTime");
const resultMessage = document.getElementById("resultMessage");
const lessonResult = document.getElementById("lessonResult");

const overallWpm = document.getElementById("overallWpm");
const overallAccuracy = document.getElementById("overallAccuracy");
const overallTime = document.getElementById("overallTime");

const completedLessons = document.getElementById("completedLessons");

function initializeApp() {
renderLessonCards();
loadLesson(0);
updateOverallStats();
displayCompletedLessons();
}

function renderLessonCards() {
lessonCards.innerHTML = "";

lessons.forEach((lesson, index) => {
const completed = isLessonCompleted(lesson.id);

```
const card = document.createElement("div");
card.className = "lesson-card-option";

if (completed) {
  card.classList.add("completed");
}

if (index === selectedLessonIndex) {
  card.classList.add("selected");
}

card.innerHTML = `
  <div class="lesson-card-top">
    <div>
      <h3>Lesson ${lesson.id}</h3>
      <p>${escapeHtml(
        lesson.title.replace(/^Lesson \\d+: /, "")
      )}</p>
    </div>

    <span class="lesson-status">
      ${completed ? "✓ Completed" : "Not Started"}
    </span>
  </div>

  <p class="lesson-card-description">
    ${escapeHtml(lesson.description)}
  </p>

  <button class="lesson-select-button">
    ${completed ? "Practice Again" : "Start Lesson"}
  </button>
`;

const selectButton = card.querySelector(".lesson-select-button");

selectButton.addEventListener("click", () => {
  loadLesson(index);

  document.querySelector(".lesson-card").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
});

lessonCards.appendChild(card);
```

});
}

function isLessonCompleted(lessonId) {
const results = getStoredResults();

return results.some((result) => result.lessonId === lessonId);
}

function loadLesson(index) {
if (!lessons[index]) {
return;
}

selectedLessonIndex = index;
selectedLesson = lessons[index];

resetLesson();

lessonTitle.textContent = selectedLesson.title;
lessonDescription.textContent = selectedLesson.description;
lessonNumber.textContent = selectedLesson.id;

renderLessonText();
renderLessonCards();
}

function renderLessonText() {
textDisplay.innerHTML = "";

selectedLesson.text.split("").forEach((character) => {
const span = document.createElement("span");
span.textContent = character;
textDisplay.appendChild(span);
});
}

function startLesson() {
if (isRunning) {
return;
}

isRunning = true;
hasStartedTyping = false;
startTime = null;

typingInput.disabled = false;
typingInput.focus();

startButton.disabled = true;
startButton.textContent = "Typing...";

lessonResult.classList.remove("show");
}

function beginTimer() {
if (startTime !== null) {
return;
}

startTime = Date.now();

timerInterval = setInterval(() => {
updateLiveStats();
}, 250);
}

function updateLiveStats() {
if (!isRunning || startTime === null) {
return;
}

const elapsedSeconds = getElapsedSeconds();
const typedText = typingInput.value;
const stats = calculateStats(typedText, elapsedSeconds);

liveWpm.textContent = stats.wpm;
liveAccuracy.textContent = `${stats.accuracy}%`;
liveTime.textContent = `${elapsedSeconds} sec`;
}

function calculateStats(typedText, elapsedSeconds) {
const targetText = selectedLesson.text;

let correctCharacters = 0;

for (let i = 0; i < typedText.length; i++) {
if (typedText[i] === targetText[i]) {
correctCharacters++;
}
}

const totalTypedCharacters = typedText.length;

const accuracy =
totalTypedCharacters === 0
? 100
: Math.round(
(correctCharacters / totalTypedCharacters) * 100
);

const minutes = elapsedSeconds / 60;

const wpm =
minutes > 0
? Math.round((correctCharacters / 5) / minutes)
: 0;

return {
wpm,
accuracy,
correctCharacters
};
}

function getElapsedSeconds() {
if (startTime === null) {
return 0;
}

return Math.max(
1,
Math.floor((Date.now() - startTime) / 1000)
);
}

function updateTextHighlight() {
const typedText = typingInput.value;
const targetText = selectedLesson.text;
const spans = textDisplay.querySelectorAll("span");

spans.forEach((span, index) => {
span.classList.remove("correct", "incorrect", "current");

```
if (index < typedText.length) {
  if (typedText[index] === targetText[index]) {
    span.classList.add("correct");
  } else {
    span.classList.add("incorrect");
  }
} else if (index === typedText.length) {
  span.classList.add("current");
}
```

});

const progress = Math.min(
(typedText.length / targetText.length) * 100,
100
);

progressBar.style.width = `${progress}%`;
}

function handleTyping() {
if (!isRunning) {
return;
}

if (!hasStartedTyping) {
hasStartedTyping = true;
beginTimer();
}

updateTextHighlight();
updateLiveStats();

if (typingInput.value.length >= selectedLesson.text.length) {
finishLesson();
}
}

function finishLesson() {
if (!isRunning) {
return;
}

isRunning = false;

clearInterval(timerInterval);
timerInterval = null;

const elapsedSeconds = getElapsedSeconds();

const stats = calculateStats(
typingInput.value,
elapsedSeconds
);

typingInput.disabled = true;
startButton.disabled = false;
startButton.textContent = "Start Lesson";

liveWpm.textContent = stats.wpm;
liveAccuracy.textContent = `${stats.accuracy}%`;
liveTime.textContent = `${elapsedSeconds} sec`;

resultWpm.textContent = stats.wpm;
resultAccuracy.textContent = `${stats.accuracy}%`;
resultTime.textContent = `${elapsedSeconds} sec`;

resultMessage.textContent = getResultMessage(
stats.accuracy,
stats.wpm
);

lessonResult.classList.add("show");

saveLessonResult({
lessonId: selectedLesson.id,
lessonTitle: selectedLesson.title,
wpm: stats.wpm,
accuracy: stats.accuracy,
time: elapsedSeconds,
date: new Date().toISOString()
});

updateOverallStats();
displayCompletedLessons();
renderLessonCards();

if (selectedLessonIndex < lessons.length - 1) {
nextButton.style.display = "inline-block";
} else {
nextButton.style.display = "none";
}
}

function getResultMessage(accuracy, wpm) {
if (accuracy >= 95 && wpm >= 40) {
return "Excellent work!";
}

if (accuracy >= 90) {
return "Good job. Keep practicing!";
}

return "Practice slowly and focus on accuracy.";
}

function resetLesson() {
isRunning = false;
hasStartedTyping = false;
startTime = null;

clearInterval(timerInterval);
timerInterval = null;

typingInput.value = "";
typingInput.disabled = true;

startButton.disabled = false;
startButton.textContent = "Start Lesson";

liveWpm.textContent = "0";
liveAccuracy.textContent = "100%";
liveTime.textContent = "0 sec";

resultWpm.textContent = "0";
resultAccuracy.textContent = "0%";
resultTime.textContent = "0 sec";
resultMessage.textContent = "";

progressBar.style.width = "0%";
lessonResult.classList.remove("show");
nextButton.style.display = "none";

if (selectedLesson) {
renderLessonText();
}
}

function goToNextLesson() {
if (selectedLessonIndex < lessons.length - 1) {
loadLesson(selectedLessonIndex + 1);

```
document.querySelector(".lesson-card").scrollIntoView({
  behavior: "smooth",
  block: "start"
});
```

}
}

function getStoredResults() {
const storedResults = localStorage.getItem(STORAGE_KEY);

if (!storedResults) {
return [];
}

try {
return JSON.parse(storedResults);
} catch (error) {
return [];
}
}

function saveLessonResult(result) {
const results = getStoredResults();

results.push(result);

localStorage.setItem(
STORAGE_KEY,
JSON.stringify(results)
);
}

function updateOverallStats() {
const results = getStoredResults();

if (results.length === 0) {
overallWpm.textContent = "0";
overallAccuracy.textContent = "0%";
overallTime.textContent = "0 sec";
return;
}

const totalWpm = results.reduce(
(sum, result) => sum + result.wpm,
0
);

const totalAccuracy = results.reduce(
(sum, result) => sum + result.accuracy,
0
);

const totalTime = results.reduce(
(sum, result) => sum + result.time,
0
);

overallWpm.textContent = Math.round(
totalWpm / results.length
);

overallAccuracy.textContent = `${Math.round(
    totalAccuracy / results.length
  )}%`;

overallTime.textContent = `${Math.round(
    totalTime / results.length
  )} sec`;
}

function displayCompletedLessons() {
const results = getStoredResults();

if (results.length === 0) {
completedLessons.innerHTML =
'<p class="empty-message">No lessons completed yet.</p>';
return;
}

completedLessons.innerHTML = "";

results
.slice()
.reverse()
.forEach((result) => {
const lessonElement = document.createElement("div");
lessonElement.className = "completed-lesson";

```
  const date = new Date(result.date);
  const formattedDate = date.toLocaleString();

  lessonElement.innerHTML = `
    <div>
      <div class="completed-lesson-title">
        ${escapeHtml(result.lessonTitle)}
      </div>

      <div class="completed-lesson-date">
        ${formattedDate}
      </div>
    </div>

    <div class="completed-lesson-stats">
      <span>WPM: <strong>${result.wpm}</strong></span>
      <span>Accuracy: <strong>${result.accuracy}%</strong></span>
      <span>Time: <strong>${result.time} sec</strong></span>
    </div>
  `;

  completedLessons.appendChild(lessonElement);
});
```

}

function clearAllResults() {
const confirmed = confirm(
"Are you sure you want to delete all saved results?"
);

if (!confirmed) {
return;
}

localStorage.removeItem(STORAGE_KEY);

updateOverallStats();
displayCompletedLessons();
renderLessonCards();
}

function escapeHtml(value) {
return String(value)
.replaceAll("&", "&")
.replaceAll("<", "<")
.replaceAll(">", ">")
.replaceAll('"', """)
.replaceAll("'", "'");
}

startButton.addEventListener("click", startLesson);
resetButton.addEventListener("click", resetLesson);
nextButton.addEventListener("click", goToNextLesson);
clearResultsButton.addEventListener("click", clearAllResults);
typingInput.addEventListener("input", handleTyping);

initializeApp();
