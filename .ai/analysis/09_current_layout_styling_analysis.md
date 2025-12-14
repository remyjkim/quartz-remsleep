# Comprehensive Layout and Styling Analysis

**Date:** 2025-12-13
**Purpose:** Document the current state of the Quartz project's layout, components, colors, typography, and styling architecture.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Page Layout Architecture](#2-page-layout-architecture)
3. [Color Scheme and Theming](#3-color-scheme-and-theming)
4. [Typography System](#4-typography-system)
5. [Component Inventory](#5-component-inventory)
6. [Custom Components Analysis](#6-custom-components-analysis)
7. [SCSS Architecture](#7-scss-architecture)
8. [Responsive Design System](#8-responsive-design-system)
9. [Interactive Features](#9-interactive-features)
10. [Observations and Notes](#10-observations-and-notes)

---

## 1. Project Overview

### 1.1 Site Configuration (`quartz.config.ts`)

- **Page Title:** "Remy Kim"
- **SPA Mode:** Enabled (`enableSPA: true`)
- **Popovers:** Enabled (`enablePopovers: true`)
- **Analytics:** Plausible
- **Locale:** en-US
- **Date Type:** Modified date

### 1.2 Design Inspiration

The project is styled to match the **Hugo Lanyon theme (theme-base-02)** - a minimalist blog design with:
- Fixed narrow right sidebar with blue background
- Clean, left-aligned content area
- PT Sans typography throughout

---

## 2. Page Layout Architecture

### 2.1 Grid System

Defined in `quartz/styles/variables.scss`:

```scss
$breakpoints: (
  mobile: 800px,
  desktop: 1200px,
);

$sidePanelWidth: 320px;
$topSpacing: 6rem;
```

#### Desktop Grid (≥1200px)
```
|--320px--|-----auto-----|--320px--|
|  Left   |    Center    |  Right  |
| Sidebar |   Content    | Sidebar |
```

**Template:** `"grid-sidebar-left grid-header grid-sidebar-right"` etc.

#### Tablet Grid (800px - 1200px)
```
|--320px--|-----auto-----|
|  Left   | Header/Center|
| Sidebar | + Right below|
```

#### Mobile Grid (≤800px)
```
|--------auto--------|
|  Stacked vertically |
```

### 2.2 Page Structure (from `renderPage.tsx`)

```html
<html>
  <body>
    <div class="page">
      <div id="quartz-body">
        <!-- Left Sidebar -->
        <div class="left sidebar">
          <!-- TableOfContents (desktop only) -->
        </div>

        <!-- Center Content -->
        <div class="center">
          <div class="page-header">
            <header><!-- Search --></header>
            <div class="popover-hint">
              <!-- Breadcrumbs, ArticleTitle, ContentMeta, TagList (conditional) -->
            </div>
          </div>
          <article><!-- Page Content or PostsListWithFilter --></article>
          <hr />
          <div class="page-footer">
            <!-- Backlinks, Graph, PreviewDrawer -->
          </div>
        </div>

        <!-- Right Sidebar -->
        <div class="right sidebar">
          <!-- SidebarNav -->
        </div>

        <footer><!-- Footer --></footer>
      </div>
    </div>
  </body>
</html>
```

### 2.3 Layout Configuration (`quartz.layout.ts`)

#### Shared Components (all pages)
- **header:** `Search`
- **afterBody:** `Backlinks`, `Graph`, `PreviewDrawer`
- **footer:** `Footer` (empty links)

#### Content Page Layout
- **beforeBody:** `Breadcrumbs`, `ArticleTitle`, `ContentMeta`, `TagList` (conditional - hidden on index/posts pages)
- **left:** `Spacer` (mobile), `TableOfContents` (desktop)
- **right:** `SidebarNav`

#### List Page Layout
- **beforeBody:** `Breadcrumbs`, `ArticleTitle`, `ContentMeta`
- **left:** `PageTitle`, `Spacer` (mobile), `TableOfContents` (desktop)
- **right:** `SidebarNav`

### 2.4 Conditional Rendering

The `ConditionalRender` component hides elements on specific pages:

```typescript
const postsListTargetSlugs = ["index", "posts/index"]
const isNotPostsListPage = (page) => !postsListTargetSlugs.includes(page.fileData.slug)
```

On the homepage and `/posts` page:
- No Breadcrumbs
- No ArticleTitle
- No ContentMeta
- No TagList

Instead, `PostsListWithFilter` renders the posts list.

---

## 3. Color Scheme and Theming

### 3.1 Light Mode Colors

| Variable | Value | Usage |
|----------|-------|-------|
| `light` | `#ffffff` | Background |
| `lightgray` | `#e5e5e5` | Borders, subtle backgrounds |
| `gray` | `#9a9a9a` | Metadata, muted text |
| `darkgray` | `#515151` | Main body text |
| `dark` | `#313131` | Headings |
| `secondary` | `#268bd2` | Links, primary accent (Hugo blue) |
| `tertiary` | `#6a7fb5` | Hover states |
| `highlight` | `rgba(38, 139, 210, 0.1)` | Internal link backgrounds |
| `textHighlight` | `#fff23688` | Text selection |

### 3.2 Dark Mode Colors

| Variable | Value | Usage |
|----------|-------|-------|
| `light` | `#1a1a1a` | Background |
| `lightgray` | `#393639` | Borders |
| `gray` | `#646464` | Medium gray |
| `darkgray` | `#d4d4d4` | Body text |
| `dark` | `#ebebec` | Headings |
| `secondary` | `#6a9fb5` | Links (softer blue) |
| `tertiary` | `#84a59d` | Hover states |
| `highlight` | `rgba(106, 159, 181, 0.15)` | Highlights |
| `textHighlight` | `#b3aa0288` | Text selection |

### 3.3 Sidebar Color (Hugo theme-base-02)

The right sidebar uses a **fixed blue color** that doesn't change with theme:

```scss
background-color: #234bc2;  // Hugo theme-base-02 sidebar color
```

Text and links on sidebar:
- Text: `rgba(255, 255, 255, 0.6)`
- Links: `#fff`
- Home button: `var(--light)` background with `#234bc2` text

### 3.4 Theme Switching

- **Default:** Light theme
- **Storage:** `localStorage.getItem("theme")`
- **Attribute:** `document.documentElement.setAttribute("saved-theme", theme)`
- **Toggle:** `.darkmode` button in SidebarNav

The darkmode script:
1. Defaults to light theme
2. Respects saved preference
3. Listens for system preference changes
4. Dispatches `themechange` custom event

---

## 4. Typography System

### 4.1 Font Families

```scss
typography: {
  header: "PT Sans",
  body: "PT Sans",
  code: "IBM Plex Mono",
}
```

Origin: Google Fonts with CDN caching enabled.

### 4.2 Font Sizes

**Base:** `15px` (set on `html` element to match Hugo)

This affects all `rem` calculations - `1rem = 15px`.

#### Headings (custom.scss overrides base.scss)

| Element | Size | Margin Top |
|---------|------|------------|
| h1 | 1.2em (~18px) | — |
| h2 | 1.1em (~16.5px) | 1rem |
| h3 | 1em (~15px) | 1.5rem |
| h6 | 0.7em (~10.5px) | — |

#### Body Text

| Element | Size | Line Height |
|---------|------|-------------|
| body | 15px | 1.6 |
| p | 0.95em | 1.7 |

#### Code

- Inline: `0.9em`
- Pre blocks: `0.85rem`

### 4.3 Font Weights

```scss
$boldWeight: 700;
$semiBoldWeight: 600;
$normalWeight: 400;
```

- Headings: `400` (normal, overridden in custom.scss)
- Strong text: `600` (semibold)
- Links: `600` (semibold)

---

## 5. Component Inventory

### 5.1 Standard Quartz Components

| Component | Location | Description |
|-----------|----------|-------------|
| `ArticleTitle` | beforeBody | Page title |
| `Backlinks` | afterBody | Linked references |
| `Body` | wrapper | Main body wrapper |
| `Breadcrumbs` | beforeBody | Navigation path |
| `ContentMeta` | beforeBody | Date, reading time |
| `Darkmode` | SidebarNav | Theme toggle button |
| `DesktopOnly` | wrapper | Show only on desktop |
| `Explorer` | — | File tree (not used in current layout) |
| `Footer` | footer | Copyright text |
| `Graph` | afterBody | Link graph visualization |
| `Head` | head | HTML head, meta tags |
| `Header` | wrapper | Header container |
| `MobileOnly` | wrapper | Show only on mobile |
| `PageList` | — | List of pages with dates |
| `PageTitle` | left (list pages) | Site title |
| `ReaderMode` | — | Reader mode toggle (disabled) |
| `RecentNotes` | — | Recent posts (not used) |
| `Search` | header | Search modal trigger |
| `Spacer` | left (mobile) | Flex spacer |
| `TableOfContents` | left (desktop) | TOC tree |
| `TagList` | beforeBody | Post tags |

### 5.2 Custom Components

| Component | File | Description |
|-----------|------|-------------|
| `SidebarNav` | SidebarNav.tsx | Custom right sidebar navigation |
| `PreviewDrawer` | PreviewDrawer.tsx | Side panel for link previews |
| `PostsListWithFilter` | PostsListWithFilter.tsx | Posts list with tag filtering |
| `ConditionalRender` | ConditionalRender.tsx | Conditional component rendering |

---

## 6. Custom Components Analysis

### 6.1 SidebarNav

**Purpose:** Replaces the default Explorer with a Hugo Lanyon-style sidebar navigation.

**Structure:**
```html
<nav class="sidebar-nav">
  <!-- Mobile toggle button -->
  <button class="sidebar-nav-toggle mobile-only">...</button>

  <div class="sidebar-nav-content">
    <!-- Home button (theme background, blue text) -->
    <a class="home-button">Remy Kim</a>
    <hr class="nav-separator" />

    <!-- Section links -->
    <ul class="nav-sections">
      <li><a>About Me</a></li>
      <li><a>About Blog</a></li>
      <li><a>Questions</a></li>
      <li><a>Bookshelf</a></li>
      <li><a>Github</a></li>
    </ul>

    <hr class="nav-separator" />

    <!-- Posts link -->
    <div class="nav-posts">
      <a class="posts-button">Posts</a>
    </div>

    <!-- Theme controls -->
    <div class="sidebar-nav-controls">
      <Darkmode />
    </div>

    <!-- Copyright -->
    <div class="sidebar-nav-footer">
      <p>© 2025. All rights reserved.</p>
    </div>
  </div>
</nav>
```

**Options:**
```typescript
{
  sections: [{ title, slug }],
  postsLink: { title, slug },
  showHome: true,
  showGithub: true,
  githubUrl: "https://github.com/remyjkim",
  showCopyright: true,
  showDarkmode: true,
  showReaderMode: false,
}
```

**Mobile Behavior:**
- Toggle button (hamburger) fixed at top-right
- Content slides down from top (transform: translateY)
- Backdrop overlay with blur
- Closes on: link click, outside click, Escape key, resize to desktop

### 6.2 PreviewDrawer

**Purpose:** 70% width side panel for viewing linked content without navigation.

**Structure:**
```html
<div id="drawer-backdrop" class="drawer-backdrop" />
<aside id="preview-drawer" class="preview-drawer">
  <div class="drawer-header">
    <h3 class="drawer-title">Page Path</h3>
    <button class="drawer-close">X</button>
  </div>
  <div class="drawer-body">
    <!-- Cloned content from popover -->
  </div>
</aside>
```

**Features:**
- Opens via "Open in Side" button in popovers
- Content cloned from popover (no re-fetch)
- Scroll to hash fragments
- Focus management for accessibility
- Closes on: backdrop click, Escape key, close button, navigation

**Global API:**
```typescript
window.openDrawer(url: URL, hash: string, content: Node)
```

### 6.3 PostsListWithFilter

**Purpose:** Renders a filterable posts list on the homepage and `/posts` page.

**Structure:**
```html
<div class="posts-list-with-filter">
  <!-- Optional about section -->
  <article class="about-section">...</article>

  <div class="posts-section">
    <h2 class="posts-heading">Posts</h2>

    <!-- Tag filter bar -->
    <div class="tag-filter-bar" data-tag-filter>
      <a class="tag-filter-link active" data-tag="all">All</a>
      <a class="tag-filter-link" data-tag="ai">ai</a>
      <!-- ... more tags -->
    </div>

    <!-- Post list -->
    <div class="post-list-container" data-post-list>
      <PageList />
    </div>
  </div>
</div>
```

**Features:**
- Filters posts from `posts/` folder only
- Requires `dates.created` to be included
- URL hash for shareable tag links (`#tag=ai`)
- Tags sorted alphabetically

---

## 7. SCSS Architecture

### 7.1 File Structure

```
quartz/
├── styles/
│   ├── base.scss           # Core styles, grid, typography
│   ├── variables.scss      # Breakpoints, grid configs, weights
│   ├── callouts.scss       # Callout/admonition styles
│   ├── syntax.scss         # Code highlighting
│   └── custom.scss         # Project customizations
│
└── components/styles/
    ├── backlinks.scss
    ├── breadcrumbs.scss
    ├── clipboard.scss
    ├── contentMeta.scss
    ├── darkmode.scss
    ├── explorer.scss       # (unused in current layout)
    ├── footer.scss
    ├── graph.scss
    ├── legacyToc.scss
    ├── listPage.scss
    ├── mermaid.inline.scss
    ├── popover.scss
    ├── postsListWithFilter.scss
    ├── previewDrawer.scss
    ├── readermode.scss
    ├── recentNotes.scss
    ├── search.scss
    ├── sidebarNav.scss
    └── toc.scss
```

### 7.2 Import Chain

```
custom.scss
  └── @use "./base.scss"
        └── @use "./variables.scss"
        └── @use "./syntax.scss"
        └── @use "./callouts.scss"
  └── @use "./variables.scss" as *
```

### 7.3 Key Customizations (`custom.scss`)

#### HTML/Body Font Size
```scss
html {
  font-size: 15px !important;  // Match Hugo (affects all rem calculations)
}
```

#### Content Width (Left-Aligned)
```scss
.page > #quartz-body .center {
  article {
    max-width: 38rem;           // ~570px
    margin-left: 0;
    margin-right: auto;

    @media all and ($desktop) {
      max-width: 42rem;         // ~630px on desktop
    }
  }
}
```

#### Right Sidebar Override
```scss
@media all and not ($mobile) {
  .sidebar.right {
    width: 100px !important;
    position: fixed !important;
    right: 0 !important;
    top: 0 !important;
    bottom: 0 !important;
    background-color: #234bc2 !important;
    font-size: 0.75rem !important;
    color: rgba(255, 255, 255, 0.6) !important;
    z-index: 10;
    padding: 0 !important;
  }
}
```

#### Grid Adjustment for Fixed Sidebar
```scss
:root[saved-theme="light"],
:root[saved-theme="dark"] {
  .page > #quartz-body {
    grid-template-columns: $sidePanelWidth auto 100px !important;

    .center {
      margin-right: 100px;  // Space for fixed sidebar
    }
  }
}
```

---

## 8. Responsive Design System

### 8.1 Breakpoints

| Name | Query | Width |
|------|-------|-------|
| Mobile | `max-width: 800px` | ≤800px |
| Tablet | `min-width: 800px` and `max-width: 1200px` | 800-1200px |
| Desktop | `min-width: 1200px` | ≥1200px |

### 8.2 Mobile Adaptations

#### Right Sidebar (SidebarNav)
- Toggle button at `position: fixed; top: 1rem; right: 1rem`
- Content slides from top (`transform: translateY(-100%)` → `translateY(0)`)
- Max height: 70vh with overflow scroll
- Backdrop with blur

#### Left Sidebar
- `position: initial` (not sticky)
- Horizontal layout (`flex-direction: row`)
- TableOfContents hidden

#### Content Area
- Full width
- Padding: `0 1rem`

#### PreviewDrawer
- Width: 90vw (vs 70vw on desktop)

#### Search
- Results container: full width, no preview pane

#### Popovers
- Hidden on mobile (`display: none !important`)

### 8.3 Utility Classes

```scss
.desktop-only { display: initial; }
@media ($mobile) { .desktop-only { display: none; } }

.mobile-only { display: none; }
@media ($mobile) { .mobile-only { display: initial; } }
```

---

## 9. Interactive Features

### 9.1 Popovers

**Trigger:** Hover on internal links (`.internal`)

**Content:**
- Fetched HTML rendered in a 30rem × 20rem box
- "Open in Side" button at top
- Images and PDFs handled specially

**Positioning:** Using `@floating-ui/dom` with `flip()` and `shift()` middleware.

**Animation:** Fade in after 200ms delay.

### 9.2 Search Modal

**Trigger:** Click on search button

**Layout:**
- Full-screen backdrop with blur
- 65% width search box (90% on mobile)
- Split view: results (30%) + preview (70%) on desktop
- Preview hidden on mobile

**Features:**
- Fuzzy search
- Tag highlighting
- Keyboard navigation

### 9.3 Graph View

**Location:** Page footer (afterBody)

**Modes:**
- Local graph: 250px height inline
- Global graph: 80vh × 80vw modal

### 9.4 Table of Contents

**Location:** Left sidebar (desktop only)

**Features:**
- Collapsible
- Active heading highlighting
- Scroll spy (opacity changes for in-view)
- Depth indentation (1rem per level)

### 9.5 Tag Filtering

**Location:** Homepage and `/posts`

**Features:**
- Click to filter posts by tag
- "All" shows all posts
- URL hash for sharing (`#tag=ai`)
- Instant filtering (no page reload)

---

## 10. Observations and Notes

### 10.1 Design Decisions

1. **Hugo Lanyon Inspiration:** The entire design is adapted from the Hugo Lanyon theme with theme-base-02 (blue sidebar). This creates visual consistency with the original blog design.

2. **Right Sidebar as Navigation:** Unlike typical Quartz layouts with left navigation, this uses a fixed right sidebar for primary navigation, keeping the left sidebar for TOC.

3. **Left-Aligned Content:** Content is left-aligned (not centered) with empty space flowing to the right, matching the Hugo layout philosophy.

4. **Home Button Design:** The home button uses the inverse color scheme (theme background with sidebar blue text) for visual distinction.

5. **SPA Navigation:** Full SPA mode with smooth transitions; drawer and popovers integrate with the `nav` event lifecycle.

### 10.2 Potential Issues

1. **Fixed Sidebar Z-Index:** The fixed right sidebar (`z-index: 10`) could conflict with modals/overlays. Search and drawer use higher z-indexes (999).

2. **100px Sidebar Width:** Very narrow; works for the current minimal navigation but would be constraining if more items are added.

3. **Important Overrides:** Heavy use of `!important` in custom.scss suggests potential specificity issues with base Quartz styles.

4. **Mobile Toggle Position:** The hamburger button at top-right overlaps with content if the page has right-aligned elements at the top.

5. **Two Footer Years:** Footer says "2026" but SidebarNav footer says `new Date().getFullYear()` (dynamic).

### 10.3 Files Modified from Base Quartz

Based on git status:
- `quartz.config.ts` - Theme colors, typography
- `quartz.layout.ts` - Component placement
- `quartz/components/Footer.tsx` - Static copyright
- `quartz/components/index.ts` - Custom component exports
- `quartz/components/scripts/darkmode.inline.ts` - Light mode default
- `quartz/components/scripts/popover.inline.ts` - Drawer integration
- `quartz/components/styles/popover.scss` - Drawer trigger button
- `quartz/plugins/emitters/contentPage.tsx` - (modifications unknown)
- `quartz/plugins/emitters/folderPage.tsx` - (modifications unknown)
- `quartz/styles/custom.scss` - Major layout customizations

### 10.4 Custom Files Added

- `quartz/components/PostsListWithFilter.tsx`
- `quartz/components/PreviewDrawer.tsx`
- `quartz/components/SidebarNav.tsx`
- `quartz/components/scripts/previewDrawer.inline.ts`
- `quartz/components/scripts/sidebarNav.inline.ts`
- `quartz/components/scripts/tagFilter.inline.ts`
- `quartz/components/styles/postsListWithFilter.scss`
- `quartz/components/styles/previewDrawer.scss`
- `quartz/components/styles/sidebarNav.scss`

---

## Summary

This Quartz site has been significantly customized to replicate the Hugo Lanyon theme aesthetic:

- **Fixed 100px right sidebar** with Hugo's blue color (#234bc2)
- **SidebarNav** as primary navigation with mobile hamburger menu
- **Left-aligned content** (38-42rem max-width)
- **PT Sans typography** at 15px base
- **PreviewDrawer** for enhanced link preview experience
- **PostsListWithFilter** for tag-based post filtering on homepage
- **Dark/Light theme** support with light as default

The architecture cleanly separates custom functionality into new components while leveraging Quartz's existing infrastructure for SPA navigation, search, graph, and popovers.
