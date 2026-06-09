import { getAllPosts } from "./backlinks.ts";
// 1. Import the templates as raw strings
import overviewTemplate from '../htmls/overview.html?raw';
import cardTemplate from '../htmls/card.html?raw';

export class Overview {
    private contentEl: HTMLElement;
    constructor(contentEl: HTMLElement) {
        this.contentEl = contentEl;
    }

    async render() {
        this.contentEl.innerHTML = '<div class="loading-placeholder">Loading overview...</div>';

        try {
            const posts = await getAllPosts();

            if (posts.length === 0) {
                this.contentEl.innerHTML = overviewTemplate.replace('${cardsHtml}', '');
                return;
            }

            const cardsHtml = posts.map(post => {
                return cardTemplate
                    .replace('${post.id}', post.id.toString())
                    .replace('${post.title}', post.title)
                    .replace('${post.excerpt}', post.excerpt);
            }).join('');

            this.contentEl.innerHTML = overviewTemplate.replace('${cardsHtml}', cardsHtml);

        } catch (err) {
            this.contentEl.innerHTML = `<p class="katex-error">Failed to load posts.</p>`;
            console.error(err);
        }
    }
}