import { navigate } from "../routes.js";

const NAV_ITEMS = [
  { route: "dashboard", label: "Dashboard", icon: "📊" },
  { route: "profile", label: "Profile", icon: "👤" },
  { route: "resumes", label: "Resumes", icon: "📄" },
  { route: "jobs", label: "Jobs", icon: "💼" },
  { route: "applications", label: "Applications", icon: "📋" },
  { route: "documents", label: "Documents", icon: "📁" },
  { route: "ai-status", label: "AI Status", icon: "🤖" },
  { route: "browser-extension", label: "Extension", icon: "🧩" },
  { route: "settings", label: "Settings", icon: "⚙" },
];

function render(activeRoute) {
  const items = NAV_ITEMS
    .map((item) => {
      const active = item.route === activeRoute ? "nav-active" : "";
      return `
        <li class="nav-item ${active}" data-route="${item.route}" tabindex="0" role="button" onclick="window.location.hash='${item.route}'" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();window.location.hash='${item.route}';}">
          <span class="nav-icon">${item.icon}</span>
          <span class="nav-label">${item.label}</span>
        </li>
      `;
    })
    .join("");
  return `<nav class="sidebar"><ul class="nav-list">${items}</ul></nav>`;
}

function mount(container) {
  container.addEventListener("click", (e) => {
    const item = e.target.closest(".nav-item");
    if (item && item.dataset.route) {
      navigate(item.dataset.route);
    }
  });
}

export { render, mount, NAV_ITEMS };
