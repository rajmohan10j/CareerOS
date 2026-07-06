const routes = {
  "dashboard": () => import("./pages/Dashboard.js?v=profile-clickfix-20260703"),
  "profile": () => import("./pages/Profile.js?v=profile-clickfix-20260703"),
  "resumes": () => import("./pages/Resumes.js?v=profile-clickfix-20260703"),
  "jobs": () => import("./pages/Jobs.js?v=profile-clickfix-20260703"),
  "applications": () => import("./pages/Applications.js?v=profile-clickfix-20260703"),
  "documents": () => import("./pages/Documents.js?v=profile-clickfix-20260703"),
  "ai-status": () => import("./pages/AIStatus.js?v=profile-clickfix-20260703"),
  "browser-extension": () => import("./pages/BrowserExtension.js?v=profile-clickfix-20260703"),
  "settings": () => import("./pages/Settings.js?v=profile-clickfix-20260703"),
};

const DEFAULT_ROUTE = "dashboard";

function getCurrentRoute() {
  const hash = window.location.hash.replace("#", "");
  return hash || DEFAULT_ROUTE;
}

function navigate(route) {
  const nextHash = `#${route}`;
  if (window.location.hash !== nextHash) {
    window.location.hash = route;
  }
  window.setTimeout(() => {
    window.dispatchEvent(new CustomEvent("careeros:navigate", { detail: { route } }));
  }, 0);
}

function isRouteCurrent(route, container) {
  return container && container.dataset.route === route && getCurrentRoute() === route;
}

async function renderRoute(container) {
  const route = getCurrentRoute();
  container.dataset.route = route;
  const loader = routes[route];
  if (!loader) {
    container.innerHTML = `<div class="page-placeholder"><h2>404</h2><p>Page not found: ${route}</p></div>`;
    return;
  }
  try {
    const mod = await loader();
    if (!isRouteCurrent(route, container)) return;
    if (mod.default && typeof mod.default.render === "function") {
      const page = mod.default;
      container.innerHTML = page.render();
      if (page.onMount && isRouteCurrent(route, container)) page.onMount(container);
    } else if (typeof mod.render === "function") {
      container.innerHTML = mod.render();
      if (mod.onMount && isRouteCurrent(route, container)) mod.onMount(container);
    } else {
      container.innerHTML = `<div class="page-placeholder"><h2>Error</h2><p>Invalid page module for: ${route}</p></div>`;
    }
  } catch (err) {
    if (isRouteCurrent(route, container)) {
      container.innerHTML = `<div class="page-placeholder"><h2>Error</h2><p>Failed to load page: ${err.message}</p></div>`;
    }
  }
}

export { routes, DEFAULT_ROUTE, getCurrentRoute, navigate, renderRoute };
