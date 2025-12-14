---
title: Documentation
date: 2025-12-14
tags:
  - theme
  - documentation
categories:
  - documentation
---

## Remsleep Theme Documentation

Complete guide to using and customizing the Remsleep theme for Quartz v4.

### Quick Start

#### 1. Clone and Install

```bash
git clone https://github.com/remyjkim/remsleep-quartz.git my-garden
cd my-garden
npm install
```

#### 2. Configure Your Site

Edit `quartz.config.ts` to set your site title, domain, and filter tags:

```typescript
const config: QuartzConfig = {
  configuration: {
    pageTitle: "My Digital Garden",
    baseUrl: "yourdomain.com",
    filterTags: ["thoughts", "projects", "notes"],
  },
}
```

#### 3. Customize Navigation

Edit `quartz.layout.ts` to configure your sidebar sections:

```typescript
Component.SidebarNav({
  sections: [
    { title: "About", slug: "about" },
    { title: "Projects", slug: "projects" },
  ],
  postsLink: { title: "Blog", slug: "posts" },
  showHome: true,
  showGithub: true,
  githubUrl: "https://github.com/yourusername",
})
```

#### 4. Add Your Content

Create your content structure:

```
content/
├── index.md              # Home page
├── posts/                # Blog posts
│   ├── index.md         # Posts listing page
│   └── my-first-post/
│       └── index.md
├── about/
│   └── index.md
└── projects/
    └── index.md
```

#### 5. Build and Preview

```bash
# Development with hot reload
npx quartz build --serve

# Production build
npx quartz build
```

### Content Structure

#### Recommended Folder Organization

Use number prefixes for ordering (they're stripped from URLs):

```
content/
├── index.md                    # → /
├── posts/
│   ├── index.md               # → /posts/
│   └── 001-my-post/
│       └── index.md           # → /posts/my-post/
├── 01-about/
│   └── index.md               # → /about/
├── 02-projects/
│   └── index.md               # → /projects/
└── drafts/                     # Ignored (add to ignorePatterns)
```

#### Frontmatter

Essential frontmatter for your posts:

```yaml
---
title: "My Amazing Post"
date: 2025-01-15
tags:
  - thoughts
  - learning
categories:
  - framework
draft: false
---
```

### Advanced Usage

#### Multiple Post Sources

Include posts from multiple folders:

```typescript
// In quartz/plugins/emitters/contentPage.tsx
pageBody: PostsListWithFilter({
  targetSlugs: ["index", "posts/index"],
  postsPrefixes: ["posts/", "thoughts/", "projects/"],
})
```

#### Custom Component Layouts

Different layouts for different page types:

```typescript
// Content pages (posts, articles)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [Component.ArticleTitle(), Component.ContentMeta()],
  left: [Component.TableOfContents()],
  right: [Component.SidebarNav()],
}

// List pages (tags, folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.ArticleTitle()],
  left: [],
  right: [Component.SidebarNav()],
}
```

#### SPA Navigation Opt-Out

For links that shouldn't use SPA navigation (like tag filters), add `data-router-ignore`:

```html
<a href="#" data-router-ignore data-tag="thoughts">thoughts</a>
```

### Deployment

#### Cloudflare Pages

The theme includes a deployment script for Cloudflare Pages:

```bash
./scripts/deploy.sh
```

Or manually:

```bash
npx quartz build
npx wrangler pages deploy public --project-name=your-project
```

#### Other Platforms

The theme works with any static hosting provider:

- **Netlify**: Connect your repo and set build command to `npx quartz build`
- **Vercel**: Same as Netlify
- **GitHub Pages**: Use the Quartz GitHub Action
- **Custom server**: Upload the `public/` folder

### Troubleshooting

#### Build Errors

Make sure you're using Node.js >= 22:

```bash
node --version  # Should be v22.x or higher
```

If you encounter module errors:

```bash
rm -rf node_modules package-lock.json
npm install
```

#### Styles Not Updating

Clear the build cache and rebuild:

```bash
rm -rf public/
npx quartz build
```

#### Mobile Menu Not Working

The mobile navigation requires JavaScript. Make sure `enableSPA: true` in your config for proper script loading.

#### Tags Not Filtering

Check that:
1. Posts have tags in their frontmatter
2. `filterTags` is set in `quartz.config.ts` OR tags exist in your posts
3. JavaScript is enabled in the browser

#### Preview Drawer Not Opening

Ensure:
1. `enablePopovers: true` in config
2. Links are internal (same domain)
3. JavaScript is enabled

### Customization

#### Changing the Sidebar Color

Edit `quartz/styles/custom.scss`:

```scss
.sidebar.right {
  background-color: #234bc2 !important;  // Change this color
}
```

#### Typography

Change fonts in `quartz.config.ts`:

```typescript
theme: {
  typography: {
    header: "Your Header Font",
    body: "Your Body Font",
    code: "Your Code Font",
  },
}
```

#### Link Colors

Adjust link colors in theme configuration:

```typescript
colors: {
  lightMode: {
    secondary: "#268bd2",  // Primary link color
    tertiary: "#6a7fb5",   // Hover/accent color
  },
}
```

### Best Practices

#### Content Organization

- Use descriptive folder names with number prefixes
- Keep related content in the same folder
- Use `index.md` for section landing pages
- Add tags and categories consistently

#### Performance

- Optimize images before adding them
- Use `ignorePatterns` to exclude unnecessary files
- Enable CDN caching in theme config
- Consider lazy loading for images

#### Accessibility

- Write descriptive link text (avoid "click here")
- Add alt text to all images
- Use proper heading hierarchy (h1 → h2 → h3)
- Test with keyboard navigation

### Getting Help

- **GitHub Issues**: [Report bugs or request features](https://github.com/remyjkim/remsleep-quartz/issues)
- **Quartz Docs**: [Official Quartz documentation](https://quartz.jzhao.xyz/)
- **Example Site**: [See it in action at remyjkim.com](https://remyjkim.com)

### Credits

- Built on [Quartz v4](https://quartz.jzhao.xyz/) by Jacky Zhao
- Inspired by [Hugo Lanyon](https://themes.gohugo.io/themes/lanyon/) theme
- Typography powered by [PT Sans](https://fonts.google.com/specimen/PT+Sans) and [IBM Plex Mono](https://fonts.google.com/specimen/IBM+Plex+Mono)

### License

MIT License - feel free to use this theme for your own digital garden!
