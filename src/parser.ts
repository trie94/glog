import { marked } from 'marked';
import katex from 'katex';

// Configure marked with a custom renderer to add automatic slug IDs to headings
marked.use({
  renderer: {
    heading(text: string, level: number, raw: string): string {
      const slug = raw
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      return `<h${level} id="${slug}">${text}</h${level}>\n`;
    }
  }
});

// Interface for post content
export interface ParsedPost {
  title: string;
  content: string;
  excerpt: string;
  links: string[]; // List of post IDs this post links to
}

/**
 * Parses markdown content and handles KaTeX math blocks and code block escaping
 */
export async function parseMarkdown(markdown: string): Promise<ParsedPost> {
  const mathPlaceholders: { [key: string]: string } = {};
  let placeholderCounter = 0;

  // Temporary storage to protect block and inline code from math parsing
  const codePlaceholders: { [key: string]: string } = {};
  let codeCounter = 0;

  let processedMarkdown = markdown;

  // 1. Protect code blocks (```...```)
  processedMarkdown = processedMarkdown.replace(/(```[\s\S]*?```)/g, (match) => {
    const key = `CodeBlock${codeCounter}`;
    codePlaceholders[key] = match;
    codeCounter++;
    return key;
  });

  // 2. Protect inline code (`...`)
  processedMarkdown = processedMarkdown.replace(/(`[^`\n]+?`)/g, (match) => {
    const key = `CodeInline${codeCounter}`;
    codePlaceholders[key] = match;
    codeCounter++;
    return key;
  });

  // 3. Extract and render Display Math ($$ math $$)
  processedMarkdown = processedMarkdown.replace(/\$\$([\s\S]*?)\$\$/g, (_, mathText) => {
    const key = `MathBlock${placeholderCounter}`;
    try {
      const rendered = katex.renderToString(mathText.trim(), {
        displayMode: true,
        throwOnError: false
      });
      mathPlaceholders[key] = rendered;
    } catch (e) {
      console.error('KaTeX display error:', e);
      mathPlaceholders[key] = `<span class="katex-error">${mathText}</span>`;
    }
    placeholderCounter++;
    return `\n\n${key}\n\n`;
  });

  // 4. Extract and render Inline Math ($ math $)
  // Negative lookahead/lookbehind or strict character bounds to avoid false matches with normal $ symbols
  processedMarkdown = processedMarkdown.replace(/(?<!\$)\$([^\$\n]+?)\$(?!\$)/g, (_, mathText) => {
    const key = `MathInline${placeholderCounter}`;
    try {
      const rendered = katex.renderToString(mathText.trim(), {
        displayMode: false,
        throwOnError: false
      });
      mathPlaceholders[key] = rendered;
    } catch (e) {
      console.error('KaTeX inline error:', e);
      mathPlaceholders[key] = `<span class="katex-error">${mathText}</span>`;
    }
    placeholderCounter++;
    return key;
  });

  // 4.5 Preprocess headings without space (e.g. #Title -> # Title)
  processedMarkdown = processedMarkdown.replace(/^(#{1,6})([^\s#].*)$/gm, '$1 $2');

  // 5. Restore code placeholders before markdown parsing (so marked can format code blocks)
  for (const [key, codeContent] of Object.entries(codePlaceholders)) {
    processedMarkdown = processedMarkdown.replace(key, codeContent);
  }

  // Extract links for backlink mapping (e.g. [Link Text](./post-id) or [Link Text](post-id))
  const links: string[] = [];
  const linkRegex = /\[[^\]]*\]\(([^)]+)\)/g;
  let linkMatch;
  while ((linkMatch = linkRegex.exec(processedMarkdown)) !== null) {
    const href = linkMatch[1];
    // Filter local post links (e.g. start with ./ or match simple post-id format, not http/https/mailto)
    if (!href.startsWith('http') && !href.startsWith('mailto:') && !href.startsWith('#')) {
      // Extract target post ID (clean path parameters or .md extension)
      const postId = href.replace(/^\.\//, '').replace(/\.md$/, '').split('/').pop() || '';
      if (postId && !links.includes(postId)) {
        links.push(postId);
      }
    }
  }

  // 6. Compile Markdown to HTML using marked
  let htmlContent = await marked.parse(processedMarkdown);

  // 7. Restore Math Placeholders in the final HTML
  for (const [key, mathHtml] of Object.entries(mathPlaceholders)) {
    // Math display items are wrapped in paragraphs by marked sometimes; we want to replace them cleanly
    htmlContent = htmlContent.replace(new RegExp(`<p>\\s*${key}\\s*</p>`, 'g'), mathHtml);
    htmlContent = htmlContent.replace(new RegExp(key, 'g'), mathHtml);
  }

  // 8. Extract Metadata: Title (first non-empty line of markdown) and Excerpt (first paragraph)
  let title = 'Untitled Post';
  const markdownLines = markdown.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  if (markdownLines.length > 0) {
    title = markdownLines[0].replace(/^#+\s*/, '');
  }

  let excerpt = 'No description available.';
  if (markdownLines.length > 1) {
    const rawExcerpt = markdownLines[1]
      .replace(/^#+\s*/, '') // strip leading heading hashes if any
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // clean markdown links to just their text
      .replace(/[*_`]/g, ''); // strip basic markdown bold/italic/code markers
    
    const threshold = 160;
    if (rawExcerpt.length > threshold) {
      excerpt = rawExcerpt.substring(0, threshold) + '...';
    } else {
      excerpt = rawExcerpt;
    }
  }

  return {
    title,
    content: htmlContent,
    excerpt,
    links
  };
}
