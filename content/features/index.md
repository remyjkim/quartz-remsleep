---
title: Features
date: 2025-12-14
tags:
  - theme
  - features
categories:
  - documentation
---

## Remsleep Theme Features

Remsleep brings together the best of classic blog design with modern digital garden functionality.

### Fixed Right Sidebar Navigation

A sleek navigation panel styled in Hugo Lanyon's signature blue (`#234bc2`) featuring:

- **Home button** with theme-aware styling
- **Customizable section links** for your site structure
- **Integrated search** functionality
- **Posts link** to your blog archive
- **Dark mode toggle** for comfortable reading
- **Copyright notice** (optional)
- **GitHub link** (optional)

The sidebar remains fixed on desktop, providing consistent navigation as you scroll through long articles.

### Dynamic Posts Filtering

The **PostsListWithFilter** component transforms your blog into an interactive experience:

- **Tag filter bar** - Click tags to instantly filter posts without page reloads
- **Pagination** - Navigate through posts with Previous/Next buttons
- **Multiple post sources** - Pull posts from multiple folders (e.g., `posts/` and `questions/`)
- **Configurable tags** - Define a curated list of filter tags in your config
- **Optional "About" section** - Show introductory content above your posts list
- **Category filtering** - Filter by both tags and categories

### Preview Drawer

Click internal links to open a slide-out preview panel instead of navigating away. This feature is perfect for:

- Exploring connections in your digital garden
- Previewing related content without losing your place
- Quick reference checks while reading
- Building a more interconnected reading experience

### Mobile-First Design

Remsleep is fully responsive with careful attention to the mobile experience:

#### Desktop (>1200px)
- Three-column layout
- TOC in left sidebar
- Content in center column (38-42rem)
- Navigation in fixed right sidebar

#### Tablet (768px - 1200px)
- Two-column layout
- Content column with navigation
- TOC moves to top of content

#### Mobile (<768px)
- Single-column layout
- Fixed header bar with site title, dark mode, search, and hamburger menu
- Slide-down navigation panel with backdrop blur
- Full-width content for comfortable reading
- Hidden sidebars to maximize content space

### Enhanced Typography

- **16px base font size** for comfortable reading
- **PT Sans** for headers and body text
- **IBM Plex Mono** for code blocks
- **Bolder headings** for clear hierarchy
- **Generous spacing** between elements
- **Optimal line length** (38-42rem) based on typography research

### Smart Content Organization

- **Number prefix stripping** - Use `001-post-title/` folders that render as `/post-title/`
- **Section indexes** - Automatic listing pages for folders
- **Tag pages** - Auto-generated tag archives
- **Conditional rendering** - Components show/hide based on page type
- **Flexible layout** - Different layouts for content vs. list pages

### Performance Optimizations

- **SPA navigation** - Fast page transitions without full reloads
- **Component lazy loading** - Only load what's needed
- **Optimized builds** - Efficient static site generation
- **CDN-friendly** - Works great with Cloudflare Pages, Netlify, Vercel
