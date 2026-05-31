import './style.css';
import { getAllPosts, getPostById, getBacklinks } from './backlinks';

// DOM elements
const postsListEl = document.getElementById('posts-list');
const contentEl = document.getElementById('content');
const themeToggleBtn = document.getElementById('theme-toggle');
const menuToggleBtn = document.getElementById('menu-toggle');
const sidebarEl = document.querySelector('.sidebar');
const navHomeBtn = document.getElementById('nav-home');

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
    await renderPost(postId);
    updateActiveSidebarLink(postId);
  } else {
    await renderOverview();
    updateActiveSidebarLink('home');
  }
}

// Render Overview page (List of all posts)
async function renderOverview() {
  if (!contentEl) return;
  
  contentEl.innerHTML = '<div class="loading-placeholder">Loading overview...</div>';
  
  try {
    const posts = await getAllPosts();
    
    if (posts.length === 0) {
      contentEl.innerHTML = `
        <div class="overview-container">
          <div class="welcome-hero">
            <h1 class="hero-title">Welcome to <span>glog</span></h1>
            <p class="hero-desc">Your personal space for graphics, math, and simulations.</p>
          </div>
          <p class="no-backlinks">No posts created yet. Create markdown files inside <code>/posts/</code> to see them here.</p>
        </div>
      `;
      return;
    }

    const cardsHtml = posts.map(post => `
      <div class="post-card" onclick="window.location.hash = '#post/${post.id}'">
        <h2 class="post-card-title">${post.title}</h2>
        <p class="post-card-desc">${post.excerpt}</p>
        <div class="post-card-meta">
          <span>Read Article →</span>
        </div>
      </div>
    `).join('');

    contentEl.innerHTML = `
      <div class="overview-container">
        <div class="welcome-hero">
          <h1 class="hero-title">Welcome to <span>glog</span></h1>
          <p class="hero-desc">A premium journal exploring computer graphics, mathematics, and physics simulations.</p>
        </div>
        <div class="post-grid">
          ${cardsHtml}
        </div>
      </div>
    `;
  } catch (err) {
    contentEl.innerHTML = `<p class="katex-error">Error loading overview: ${err}</p>`;
  }
}

// Render individual post page
async function renderPost(postId: string) {
  if (!contentEl) return;

  contentEl.innerHTML = '<div class="loading-placeholder">Loading article...</div>';

  try {
    const post = await getPostById(postId);
    if (!post) {
      contentEl.innerHTML = `
        <div class="markdown-body">
          <h1>404 Post Not Found</h1>
          <p>The post "<code>${postId}</code>" could not be found. Return to <a href="#">Overview</a>.</p>
        </div>
      `;
      return;
    }

    // Get backlinks
    const backlinks = await getBacklinks(postId);
    const backlinksCount = backlinks.length;

    let backlinksHtml = '';
    if (backlinksCount > 0) {
      const cards = backlinks.map(bl => `
        <div class="backlink-card" onclick="window.location.hash = '#post/${bl.id}'" style="cursor: pointer;">
          <div class="backlink-card-title">${bl.title}</div>
          <div class="backlink-card-excerpt">${bl.excerpt}</div>
        </div>
      `).join('');

      backlinksHtml = `
        <div class="backlinks-grid">
          ${cards}
        </div>
      `;
    } else {
      backlinksHtml = '<p class="no-backlinks">No references found linking to this concept yet.</p>';
    }

    contentEl.innerHTML = `
      <article class="markdown-body">
        ${post.content}
      </article>
      
      <section class="backlinks-container">
        <h3 class="backlinks-title">
          <span>Backlinks</span>
          <span class="backlinks-count">${backlinksCount}</span>
        </h3>
        ${backlinksHtml}
      </section>
    `;

    // Scroll to top of content
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    contentEl.innerHTML = `<p class="katex-error">Error loading post: ${err}</p>`;
  }
}

// Update Active Link in Sidebar
function updateActiveSidebarLink(activeId: string) {
  // Reset active classes
  navHomeBtn?.classList.remove('active');
  const links = postsListEl?.querySelectorAll('.post-link');
  links?.forEach(link => link.classList.remove('active'));

  if (activeId === 'home') {
    navHomeBtn?.classList.add('active');
  } else {
    const activeLink = postsListEl?.querySelector(`[href="#post/${activeId}"]`);
    activeLink?.classList.add('active');
  }
}

// Render dynamic post list inside Sidebar
async function renderSidebarPosts() {
  if (!postsListEl) return;

  try {
    const posts = await getAllPosts();
    if (posts.length === 0) {
      postsListEl.innerHTML = '<li class="loading-placeholder">No posts found</li>';
      return;
    }

    postsListEl.innerHTML = posts.map(post => `
      <li>
        <a href="#post/${post.id}" class="post-link">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          <span>${post.title}</span>
        </a>
      </li>
    `).join('');

    // Re-highlight active sidebar link based on current hash
    const hash = window.location.hash;
    if (hash.startsWith('#post/')) {
      updateActiveSidebarLink(hash.replace('#post/', ''));
    } else {
      updateActiveSidebarLink('home');
    }
  } catch (err) {
    postsListEl.innerHTML = `<li class="loading-placeholder" style="color:red;">Error: ${err}</li>`;
  }
}

// Initialize Application
async function init() {
  initTheme();
  
  // Wait for sidebar list rendering which triggers loading the index
  await renderSidebarPosts();
  
  // Setup router listeners
  window.addEventListener('hashchange', router);
  
  // Run initial route
  await router();
}

// Run app
init();
