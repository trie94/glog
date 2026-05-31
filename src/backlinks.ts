import { parseMarkdown, type ParsedPost } from './parser';

export interface PostIndexEntry extends ParsedPost {
  id: number;
}

// TODO: replace this with a better hash function.
class IdGenerator {
  getId(path: string): number {
    const cleanPath = path.replace(/^\/posts\//, '').replace(/\.md$/, '').split('/').pop() || '';
    let hash = 0;
    for (let i = 0; i < cleanPath.length; i++) {
      const char = cleanPath.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
}

// Store the parsed posts cache and backlinks map
const idGenerator = new IdGenerator();
let postsCache: Record<number, PostIndexEntry> = {};
let backlinksMap: Record<number, Array<{ id: number; title: string; excerpt: string }>> = {};
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
    const id = idGenerator.getId(path);
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
      const targetNumericId = idGenerator.getId(targetId);
      // If the target post exists in our cache, add this entry as a backlink
      if (postsCache[targetNumericId]) {
        // Prevent duplicate backlinks
        const alreadyExists = backlinksMap[targetNumericId].some(link => link.id === entry.id);
        if (!alreadyExists) {
          backlinksMap[targetNumericId].push({
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
export async function getPostById(id: number | string): Promise<PostIndexEntry | null> {
  await initializePostsIndex();
  const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
  return postsCache[numericId] || null;
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
export async function getBacklinks(id: number | string) {
  await initializePostsIndex();
  const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
  return backlinksMap[numericId] || [];
}
