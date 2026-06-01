import './style.css';
import {Overview} from "./overview.ts";
import {Post} from "./post.ts";
import {Sidebar} from "./sidebar.ts";

// DOM elements
const postsListEl = document.getElementById('posts-list');
const contentEl = document.getElementById('content');
const themeToggleBtn = document.getElementById('theme-toggle');
const menuToggleBtn = document.getElementById('menu-toggle');
const sidebarEl = document.querySelector('.sidebar');
const navHomeBtn = document.getElementById('nav-home');

const overview = new Overview(contentEl!!);
const post = new Post(contentEl!!);
const sidebar = new Sidebar(postsListEl!!, navHomeBtn!!);

// Theme Management
function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  const theme = savedTheme || (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
}

themeToggleBtn?.addEventListener('click', () => {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
});

// Sidebar Mobile Toggle
menuToggleBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  sidebarEl?.classList.toggle('open');
});

// Close sidebar when clicking outside on mobile
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  if (sidebarEl?.classList.contains('open') && !sidebarEl.contains(target) && target !== menuToggleBtn) {
    sidebarEl.classList.remove('open');
  }
});

// Router
async function router() {
  // Close mobile sidebar on route change
  sidebarEl?.classList.remove('open');

  const hash = window.location.hash;
  
  if (hash.startsWith('#post/')) {
    const postId = hash.replace('#post/', '');
    await post.render(postId);
    sidebar.updateActiveSidebarLink(postId);
  } else {
    await overview.render();
    sidebar.updateActiveSidebarLink('home');
  }
}

// Initialize Application
async function init() {
  initTheme();
  
  // Wait for sidebar list rendering which triggers loading the index
  await sidebar.render();
  
  // Setup router listeners
  window.addEventListener('hashchange', router);
  
  // Run initial route
  await router();
}

// Run app
init();
