// TypeLab Lesson Loader

const TOTAL_LESSONS = 25;

function loadLesson(number) {
  return new Promise((resolve) => {
    const script = document.createElement("script");

    script.src = `lessons/lesson${number}.js`;

    script.onload = () => {
      console.log(`Loaded lesson${number}.js`);
      resolve();
    };

    script.onerror = () => {
      console.warn(`Could not load lesson${number}.js`);
      resolve();
    };

    document.head.appendChild(script);
  });
}

async function loadAllLessons() {
  // Load lessons one at a time
  for (let i = 1; i <= TOTAL_LESSONS; i++) {
    await loadLesson(i);
  }

  // Load app.js only after all lesson files have been attempted
  const appScript = document.createElement("script");
  appScript.src = "app.js";
  document.head.appendChild(appScript);
}

loadAllLessons();
