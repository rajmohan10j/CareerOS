import { render as renderSidebar, mount as mountSidebar } from "./Sidebar.js";
import { render as renderStatusBar, mount as mountStatusBar, unmount as unmountStatusBar } from "./StatusBar.js";
import { getCurrentRoute } from "../routes.js";

function render() {
  const activeRoute = getCurrentRoute();
  return `
    <div class="app-layout">
      ${renderSidebar(activeRoute)}
      <main class="main-content">
        <div class="page-container" id="pageContainer"></div>
      </main>
      ${renderStatusBar()}
    </div>
  `;
}

function mount(container) {
  const sidebarEl = container.querySelector(".sidebar");
  if (sidebarEl) mountSidebar(sidebarEl.parentElement);
  mountStatusBar(container);
}

function unmount() {
  unmountStatusBar();
}

export { render, mount, unmount };
