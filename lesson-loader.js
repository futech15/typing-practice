// TypeLab Lesson Loader
// Loads all lesson files first, then loads app.js.

const TOTAL_LESSONS = 25;

const lessonLoads = [];

for (let i = 1; i <= TOTAL_LESSONS; i++) {
  lessonLoads.push(
    new Promise((resolve, reject) => {
      const script = document.createElement("script");

      script.src = `lessons/lesson${i}.js`;

      script.onload = resolve;

      script.onerror = () => {
        reject(new Error(`Could not load lesson${i}.js`));
      };

      document.head.appendChild(script);
    })
  );
}

Promise.all(lessonLoads)
  .then(() => {
    const appScript = document.createElement("script");
    appScript.src = "app.js";
    document.head.appendChild(appScript);
  })
  .catch((error) => {
    console.error("TypeLab lesson loading error:", error);
  });
