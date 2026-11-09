
// TypeLab Lesson Loader

const TOTAL_LESSONS = 50;

function loadScript(src) {
  return new Promise((resolve) => {
    const script = document.createElement("script");

    script.src = src;

    script.onload = () => {
      console.log("Loaded:", src);
      resolve();
    };

    script.onerror = () => {
      console.error("Could not load:", src);
      resolve();
    };

    document.head.appendChild(script);
  });
}

async function loadTypeLab() {
  window.lessons = [];

  // Load existing lessons
  for (let i = 1; i <= TOTAL_LESSONS; i++) {
    await loadScript(`lessons/lesson${i}.js`);
  }

  // Load additional lessons
  await loadScript("lessons/extra-lessons.js");

  // Start the application
  await loadScript("app.js");
}

loadTypeLab();
