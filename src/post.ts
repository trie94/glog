import {getBacklinks, getPostById} from "./backlinks.ts";

export class Post {
    private contentEl: HTMLElement;

    constructor(contentEl: HTMLElement) {
        this.contentEl = contentEl;
    }

    async render(postId: string) {
        this.contentEl.innerHTML = '<div class="loading-placeholder">Loading article...</div>';

        try {
            const post = await getPostById(postId);
            if (!post) {
                this.contentEl.innerHTML = `
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

            this.contentEl.innerHTML = `
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
            this.contentEl.innerHTML = `<p class="katex-error">Error loading post: ${err}</p>`;
        }
    }
}