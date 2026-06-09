import {getBacklinks, getPostById} from "./backlinks.ts";
import errorTemplate from '../htmls/post-error.html?raw';
import backlinkTemplate from '../htmls/backlink-card.html?raw';
import postTemplate from '../htmls/post.html?raw';

// generic class for posts...
export class Post {
    protected contentEl: HTMLElement;

    constructor(contentEl: HTMLElement) {
        this.contentEl = contentEl;
    }

    protected onPostRendered() {
        // child classes should override this.
    }

    async render(postId: string) {
        this.contentEl.innerHTML = '<div class="loading-placeholder">Loading article...</div>';

        try {
            const post = await getPostById(postId);
            if (!post) {
                this.contentEl.innerHTML = errorTemplate.replace('${postId}', postId.toString());
                return;
            }

            const backlinks = await getBacklinks(postId);
            const backlinksCount = backlinks.length;

            let backlinksHtml = '';
            if (backlinksCount > 0) {
                // Map backlink records to the individual card layout string
                backlinksHtml = `
                <div class="backlinks-grid">
                  ${backlinks.map(bl => {
                    return backlinkTemplate
                        .replace('${bl.id}', bl.id.toString())
                        .replace('${bl.title}', bl.title)
                        .replace('${bl.excerpt}', bl.excerpt);
                }).join('')}
                </div>`;
            } else {
                backlinksHtml = '<p class="no-backlinks">No references found linking to this concept yet.</p>';
            }

            this.contentEl.innerHTML = postTemplate
                .replace('${post.content}', post.content)
                .replace('${backlinksCount}', backlinksCount.toString())
                .replace('${backlinksHtml}', backlinksHtml);

            this.onPostRendered();

            // Scroll to top of content
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            this.contentEl.innerHTML = `<p class="katex-error">Error loading post: ${err}</p>`;
        }
    }
}