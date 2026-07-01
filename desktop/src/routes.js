const routes = {
  "dashboard": () => import("./pages/Dashboard.js"),
  "profile": () => import("./pages/Profile.js"),
  "resumes": () => import("./pages/Resumes.js"),
  "jobs": () => import("./pages/Jobs.js"),
  "applications": () => import("./pages/Applications.js"),
  "documents": () => import("./pages/Documents.js"),
  "ai-status": () => import("./pages/AIStatus.js"),
  "browser-extension": () => import("./pages/BrowserExtension.js"),
  "settings": () => import("./pages/Settings.js"),
};

const DEFAULT_ROUTE = "dashboard";

function getCurrentRoute() {
  const hash = window.location.hash.replace("#", "");
  return hash || DEFAULT_ROUTE;
}

function navigate(route) {
  window.location.hash = route;
}

async function renderRoute(container) {
  const route = getCurrentRoute();
  const loader = routes[route];
  if (!loader) {
    container.innerHTML = `<div class="page-placeholder"><h2>404</h2><p>Page not found: ${route}</p></div>`;
    return;
  }
  try {
    const mod = await loader();
    if (mod.default && typeof mod.default.render === "function") {
      const page = mod.default;
      container.innerHTML = page.render();
      if (page.onMount) page.onMount(container);
    } else if (typeof mod.render === "function") {
      container.innerHTML = mod.render();
      if (mod.onMount) mod.onMount(container);
    } else {
      container.innerHTML = `<div class="page-placeholder"><h2>Error</h2><p>Invalid page module for: ${route}</p></div>`;
    }
  } catch (err) {
    container.innerHTML = `<div class="page-placeholder"><h2>Error</h2><p>Failed to load page: ${err.message}</p></div>`;
  }
}

export { routes, DEFAULT_ROUTE, getCurrentRoute, navigate, renderRoute };
