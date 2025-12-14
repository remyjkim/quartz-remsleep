# Remsleep Theme for Quartz v4

A beautiful, Hugo Lanyon-inspired theme for [Quartz v4](https://quartz.jzhao.xyz/) that brings a clean, focused reading experience to your digital garden.

![Remsleep Theme](https://img.shields.io/badge/Quartz-v4.5.2-blue) ![License](https://img.shields.io/badge/license-MIT-green)

## Features

### Clean, Focused Layout

- **Fixed right sidebar** with Hugo Lanyon's signature blue (`#234bc2`) styling
- **Narrow content column** (38-42rem) for optimal reading comfort
- **Left-aligned content** with empty space flowing to the right, just like Hugo
- **Enhanced typography** with 16px base font, bolder headings, and generous spacing

### Smart Navigation

- **SidebarNav component** - A sleek navigation panel in the right sidebar with:
  - Home button with theme-aware styling
  - Customizable section links
  - Integrated search
  - Posts link
  - Dark mode toggle
  - Copyright notice

- **Mobile-first header** - On mobile devices, you get a fixed header bar with:
  - Site title
  - Dark mode toggle
  - Search icon
  - Hamburger menu that reveals a slide-down navigation panel with backdrop blur

### Filterable Posts List

The **PostsListWithFilter** component transforms your home and posts pages into a dynamic, filterable blog:

- **Tag filter bar** - Click tags to instantly filter posts (no page reload!)
- **Pagination** - Navigate through posts with Previous/Next buttons
- **Multiple post sources** - Pull posts from multiple folders (e.g., `posts/` and `questions/`)
- **Configurable tags** - Define a curated list of filter tags in your config
- **Optional "About" section** - Show introductory content above your posts list

### Preview Drawer

Click internal links to open a slide-out preview panel instead of navigating away. Perfect for exploring connections in your digital garden without losing your place.

### Responsive Design

- **Desktop**: Three-column layout with TOC on the left, content in center, navigation on right
- **Tablet**: Two-column layout with content and navigation
- **Mobile**: Single-column with fixed header, hidden sidebars, and full-width content

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/remyjkim/remsleep-quartz.git my-garden
cd my-garden
npm install
```

### 2. Configure Your Site

Edit `quartz.config.ts`:

```typescript
const config: QuartzConfig = {
  configuration: {
    pageTitle: "My Digital Garden",
    baseUrl: "yourdomain.com",

    // Optional: Define tags for the filter bar
    filterTags: ["thoughts", "projects", "notes", "learning"],

    // Optional: Show/hide tags on post items
    showPostTags: true,

    // ... other settings
  },
}
```

### 3. Customize Navigation

Edit `quartz.layout.ts` to configure your sidebar sections:

```typescript
Component.SidebarNav({
  sections: [
    { title: "About", slug: "about" },
    { title: "Projects", slug: "projects" },
    { title: "Notes", slug: "notes" },
  ],
  postsLink: { title: "Blog", slug: "posts" },
  showHome: true,
  showDarkmode: true,
  showCopyright: true,
  // Optional: Add GitHub link
  showGithub: true,
  githubUrl: "https://github.com/yourusername",
})
```

### 4. Add Your Content

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

### 5. Build and Preview

```bash
# Development with hot reload
npx quartz build --serve

# Production build
npx quartz build
```

## Configuration Reference

### Global Configuration (`quartz.config.ts`)

| Option | Type | Description |
|--------|------|-------------|
| `filterTags` | `string[]` | Tags to show in the filter bar. If not set, auto-generates from posts. |
| `showPostTags` | `boolean` | Whether to display tags on each post item in lists. Default: `true` |

### PostsListWithFilter Options

Configure in `quartz/plugins/emitters/contentPage.tsx`:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `targetSlugs` | `string[]` | `["index", "posts/index"]` | Pages where the component renders |
| `showAboutSection` | `boolean` | `false` | Show intro content above posts |
| `postsPerPage` | `number` | `10` | Posts per page |
| `showPagination` | `boolean` | `true` | Show pagination controls |
| `postsPrefixes` | `string[]` | `["posts/"]` | Folder prefixes to include as posts |

### SidebarNav Options

| Option | Type | Description |
|--------|------|-------------|
| `sections` | `{title, slug}[]` | Navigation links |
| `postsLink` | `{title, slug}` | Posts section link |
| `showHome` | `boolean` | Show home button |
| `showGithub` | `boolean` | Show GitHub link |
| `githubUrl` | `string` | GitHub profile URL |
| `showCopyright` | `boolean` | Show copyright notice |
| `showDarkmode` | `boolean` | Show theme toggle |
| `showReaderMode` | `boolean` | Show reader mode toggle |
| `homeTitle` | `string` | Custom home button text (defaults to `pageTitle`) |

## Content Structure

### Recommended Folder Organization

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

### Frontmatter

```yaml
---
title: "My Amazing Post"
date: 2025-01-15
tags:
  - thoughts
  - learning
draft: false
---
```

## Customization

### Colors

Edit the theme colors in `quartz.config.ts`:

```typescript
theme: {
  colors: {
    lightMode: {
      light: "#ffffff",
      dark: "#313131",
      secondary: "#268bd2",  // Link color
      // ... see full options in config
    },
    darkMode: {
      // ... dark mode colors
    },
  },
}
```

### Sidebar Color

The signature blue sidebar color is defined in `quartz/styles/custom.scss`:

```scss
.sidebar.right {
  background-color: #234bc2 !important;  // Hugo theme-base-02
}
```

### Typography

```typescript
theme: {
  typography: {
    header: "PT Sans",
    body: "PT Sans",
    code: "IBM Plex Mono",
  },
}
```

## Advanced Usage

### Multiple Post Sources

Include posts from multiple folders:

```typescript
// In contentPage.tsx
pageBody: PostsListWithFilter({
  targetSlugs: ["index", "posts/index"],
  postsPrefixes: ["posts/", "thoughts/", "projects/"],
})
```

### Conditional Component Rendering

Hide components on specific pages using the helper functions in `quartz.layout.ts`:

```typescript
// Hide on posts list pages
Component.ConditionalRender({
  component: Component.ContentMeta(),
  condition: (page) => !["index", "posts/index"].includes(page.fileData.slug ?? ""),
})

// Show only on content pages (not section indexes)
Component.ConditionalRender({
  component: Component.TableOfContents(),
  condition: (page) => {
    const slug = page.fileData.slug ?? ""
    if (slug === "index") return false
    const parts = slug.split("/")
    return !(parts.length === 2 && parts[1] === "index")
  },
})
```

### SPA Navigation Opt-Out

For links that shouldn't use SPA navigation (like tag filters), add `data-router-ignore`:

```html
<a href="#" data-router-ignore data-tag="thoughts">thoughts</a>
```

## Troubleshooting

### Build Errors

Make sure you're using Node.js >= 22:

```bash
node --version  # Should be v22.x or higher
```

### Styles Not Updating

Clear the build cache and rebuild:

```bash
rm -rf public/
npx quartz build
```

### Mobile Menu Not Working

The mobile navigation requires JavaScript. Make sure `enableSPA: true` in your config for proper script loading.

## Credits

- Built on [Quartz v4](https://quartz.jzhao.xyz/) by Jacky Zhao
- Inspired by [Hugo Lanyon](https://themes.gohugo.io/themes/lanyon/) theme
- Typography powered by [PT Sans](https://fonts.google.com/specimen/PT+Sans) and [IBM Plex Mono](https://fonts.google.com/specimen/IBM+Plex+Mono)

## License

MIT License - feel free to use this theme for your own digital garden!

---

> "[One] who works with the door open gets all kinds of interruptions, but [they] also occasionally gets clues as to what the world is and what might be important." — Richard Hamming

Happy gardening! 🌱
