import { parseMarkdown, type ParsedPost } from './parser';

export interface PostIndexEntry extends ParsedPost {
  id: string;
}

// Store the parsed posts cache and backlinks map
let postsCache: Record<string, PostIndexEntry> = {};
let backlinksMap: Record<string, Array<{ id: string; title: string; excerpt: string }>> = {};
let isInitialized = false;

/**
 * Initializes the posts index by loading all markdown files under `/posts/*.md`
 * using Vite's glob import feature.
 */
export async function initializePostsIndex() {
  if (isInitialized) return;

  // import.meta.glob returns module objects.
  const postModules = import.meta.glob('/posts/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, any>;
  const parsedEntries: PostIndexEntry[] = [];

  for (const [path, moduleContent] of Object.entries(postModules)) {
    // generate id from the file name.
    const id = path.split('/').pop()?.replace('.md', '') || 'unknown';
    const rawContent = typeof moduleContent === 'string' ? moduleContent : (moduleContent?.default || '');
    
    const parsed = await parseMarkdown(rawContent);
    
    parsedEntries.push({
      id,
      ...parsed
    });
  }

  // Populate cache
  postsCache = {};
  for (const entry of parsedEntries) {
    postsCache[entry.id] = entry;
  }

  // Initialize empty backlinks map for all posts
  backlinksMap = {};
  for (const entry of parsedEntries) {
    backlinksMap[entry.id] = [];
  }

  // Build the backlinks map
  for (const entry of parsedEntries) {
    for (const targetId of entry.links) {
      // If the target post exists in our cache, add this entry as a backlink
      if (postsCache[targetId]) {
        // Prevent duplicate backlinks
        const alreadyExists = backlinksMap[targetId].some(link => link.id === entry.id);
        if (!alreadyExists) {
          backlinksMap[targetId].push({
            id: entry.id,
            title: entry.title,
            excerpt: entry.excerpt
          });
        }
      }
    }
  }

  isInitialized = true;
}

/**
 * Get a specific post by its ID
 */
export async function getPostById(id: string): Promise<PostIndexEntry | null> {
  await initializePostsIndex();
  return postsCache[id] || null;
}

/**
 * Get all available posts sorted alphabetically or by ID
 */
export async function getAllPosts(): Promise<PostIndexEntry[]> {
  await initializePostsIndex();
  return Object.values(postsCache);
}

/**
 * Get all incoming links (backlinks) for a given post ID
 */
export async function getBacklinks(id: string) {
  await initializePostsIndex();
  return backlinksMap[id] || [];
}
