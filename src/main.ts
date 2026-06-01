import './style.css';
import {Overview} from "./overview.ts";
import {Post} from "./post.ts";
import {Sidebar} from "./sidebar.ts";
import {Theme} from "./theme.ts";

const postsListEl = document.getElementById('posts-list')!;
const contentEl = document.getElementById('content')!;
const themeToggleBtn = document.getElementById('theme-toggle')!;
const menuToggleBtn = document.getElementById('menu-toggle')!;
const sidebarEl = document.querySelector('.sidebar')!;
const navHomeBtn = document.getElementById('nav-home')!;

new Theme(themeToggleBtn);
const overview = new Overview(contentEl);
const post = new Post(contentEl);
const sidebar = new Sidebar(postsListEl, navHomeBtn, sidebarEl, menuToggleBtn);

async function router() {
  sidebar.closeMobileMenu();

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

async function init() {
  // Wait for sidebar list rendering which triggers loading the index
  await sidebar.render();
  
  // Setup router listeners
  window.addEventListener('hashchange', router);
  
  // Run initial route
  await router();
}

init();
