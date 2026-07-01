import { render as renderLayout, mount as mountLayout, unmount as unmountLayout } from "./components/Layout.js";
import { renderRoute } from "./routes.js";
import { refresh as refreshBackend } from "./components/BackendStatus.js";

const app = document.getElementById("app");

async function init() {
  app.innerHTML = renderLayout();
  mountLayout(app);

  const pageContainer = document.getElementById("pageContainer");
  if (pageContainer) {
    await renderRoute(pageContainer);
  }

  window.addEventListener("hashchange", async () => {
    const container = document.getElementById("pageContainer");
    if (container) {
      app.innerHTML = renderLayout();
      mountLayout(app);
      const newContainer = document.getElementById("pageContainer");
      if (newContainer) {
        await renderRoute(newContainer);
      }
    }
  });
}

init();
