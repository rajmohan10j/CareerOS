import { render as renderLayout, mount as mountLayout, unmount as unmountLayout } from "./components/Layout.js";
import { navigate, renderRoute } from "./routes.js?v=profile-clickfix-20260703";

const app = document.getElementById("app");
let _renderToken = 0;

async function renderAppRoute() {
  const token = ++_renderToken;
  unmountLayout();
  app.innerHTML = renderLayout();
  mountLayout(app);

  const pageContainer = document.getElementById("pageContainer");
  if (pageContainer && token === _renderToken) {
    await renderRoute(pageContainer);
  }
}

async function init() {
  await renderAppRoute();
  window.addEventListener("hashchange", renderAppRoute);
  window.addEventListener("careeros:navigate", renderAppRoute);
  app.addEventListener("click", (e) => {
    const routeEl = e.target.closest("[data-route][role='button']");
    if (routeEl && app.contains(routeEl) && routeEl.dataset.route) {
      navigate(routeEl.dataset.route);
    }
  });
  app.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const routeEl = e.target.closest("[data-route][role='button']");
    if (routeEl && app.contains(routeEl) && routeEl.dataset.route) {
      e.preventDefault();
      navigate(routeEl.dataset.route);
    }
  });
}

init();
