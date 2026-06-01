import {getAllPosts} from "./backlinks.ts";
import sidebarItemTemplate from '../sidebar-item.html?raw';

export class Sidebar {
    private postsListEl: HTMLElement;
    private navHomeBtn: HTMLElement;
    private sidebarEl: Element;
    private readonly menuToggleBtn: HTMLElement;

    constructor(
        postsListEl: HTMLElement, navHomeBtn: HTMLElement,
        sidebarEl: Element, menuToggleBtn: HTMLElement) {
        this.postsListEl = postsListEl;
        this.navHomeBtn = navHomeBtn;
        this.sidebarEl = sidebarEl;
        this.menuToggleBtn = menuToggleBtn;

        this.initMobileListeners();
    }

    async render() {
        try {
            const posts = await getAllPosts();
            if (posts.length === 0) {
                this.postsListEl.innerHTML = '<li class="loading-placeholder">No posts found</li>';
                return;
            }

            this.postsListEl.innerHTML = posts.map(post => {
                return sidebarItemTemplate
                    .replace('${post.id}', post.id.toString())
                    .replace('${post.title}', post.title);
            }).join('');

            // Re-highlight active sidebar link based on current hash
            const hash = window.location.hash;
            if (hash.startsWith('#post/')) {
                this.updateActiveSidebarLink(hash.replace('#post/', ''));
            } else {
                this.updateActiveSidebarLink('home');
            }
        } catch (err) {
            this.postsListEl.innerHTML = `<li class="loading-placeholder" style="color:red;">Error: ${err}</li>`;
        }
    }

    updateActiveSidebarLink(activeId: string) {
        // Reset active classes
        this.navHomeBtn.classList.remove('active');
        const links = this.postsListEl.querySelectorAll('.post-link');
        links?.forEach(link => link.classList.remove('active'));

        if (activeId === 'home') {
            this.navHomeBtn.classList.add('active');
        } else {
            const activeLink = this.postsListEl?.querySelector(`[href="#post/${activeId}"]`);
            activeLink?.classList.add('active');
        }
    }

    closeMobileMenu() {
        this.sidebarEl.classList.remove('open');
    }

    private initMobileListeners() {
        this.menuToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.sidebarEl.classList.toggle('open');
        });

        document.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (this.sidebarEl.classList.contains('open') &&
                !this.sidebarEl.contains(target) &&
                target !== this.menuToggleBtn) {
                this.closeMobileMenu();
            }
        });
    }
}