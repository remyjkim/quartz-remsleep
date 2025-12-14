# Modified Quartz Architecture v1.1

> Technical documentation for the customized Quartz v4 static site generator setup.
> Last updated: December 14, 2025 (v1.1)

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Configuration System](#2-configuration-system)
3. [Layout System](#3-layout-system)
4. [Content Structure](#4-content-structure)
5. [Page Generation (Emitters)](#5-page-generation-emitters)
6. [Component System](#6-component-system)
7. [Styling Architecture](#7-styling-architecture)
8. [Custom Components](#8-custom-components)
9. [Client-Side Interactivity](#9-client-side-interactivity)
10. [Build Pipeline](#10-build-pipeline)

---

## 1. Architecture Overview

### High-Level Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BUILD PIPELINE                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  content/*.md  ──►  Transformers  ──►  Filters  ──►  Emitters  ──►  HTML   │
│                                                                             │
│  ┌─────────────┐   ┌─────────────┐   ┌──────────┐   ┌─────────────────────┐│
│  │ Markdown    │   │ FrontMatter │   │ RemoveD- │   │ ContentPage         ││
│  │ Files       │──►│ CreatedDate │──►│ rafts    │──►│ FolderPage          ││
│  │ (index.md)  │   │ Latex       │   │          │   │ TagPage             ││
│  └─────────────┘   │ Links       │   │          │   │ ComponentResources  ││
│                    └─────────────┘   └──────────┘   └─────────────────────┘│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PAGE RENDERING                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  renderPage.tsx assembles the full HTML:                                    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ <html>                                                               │   │
│  │   <head>  ← Head component (meta, styles, scripts)                  │   │
│  │   <body>                                                             │   │
│  │     <div class="page">                                               │   │
│  │       <div class="left sidebar">  ← left[] components               │   │
│  │       <div class="center">                                           │   │
│  │         <div class="page-header">  ← header[] + beforeBody[]        │   │
│  │         <Content />  ← pageBody component                           │   │
│  │         <div class="page-footer">  ← afterBody[] components         │   │
│  │       </div>                                                         │   │
│  │       <div class="right sidebar">  ← right[] components             │   │
│  │       <footer>  ← Footer component                                  │   │
│  │     </div>                                                           │   │
│  │   </body>                                                            │   │
│  │ </html>                                                              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Directories

```
saam.kim/
├── quartz.config.ts        # Global configuration (theme, plugins, etc.)
├── quartz.layout.ts        # Page layout definitions
├── content/                # Markdown content files
│   ├── index.md           # Home page content
│   ├── posts/             # Blog posts
│   │   ├── index.md       # Posts listing page
│   │   └── 001-*/         # Individual posts
│   ├── 01-about/          # About section
│   ├── 02-frameworks-models/   # Frameworks & Models section
│   ├── 03-questions-validations/  # Questions section (supports subfolder posts)
│   │   ├── index.md
│   │   └── 001-what-am-i-capable-of/  # Question post
│   ├── 04-learnings-observations/  # Learnings section
│   ├── 05-tools-creations/    # Tools & Creations section
│   └── drafts/            # Draft posts (ignored in build)
├── quartz/
│   ├── cfg.ts             # Configuration types
│   ├── components/        # UI components
│   │   ├── scripts/       # Client-side TypeScript (.inline.ts)
│   │   └── styles/        # Component-specific SCSS
│   ├── plugins/
│   │   ├── emitters/      # HTML generation
│   │   ├── transformers/  # Content processing
│   │   └── filters/       # Content filtering
│   ├── styles/            # Global styles
│   │   ├── base.scss      # Core layout & typography
│   │   ├── custom.scss    # Custom overrides
│   │   └── variables.scss # SCSS variables & breakpoints
│   └── util/              # Utility functions
└── public/                # Generated output
```

---

## 2. Configuration System

### quartz.config.ts

The main configuration file defines global settings:

```typescript
// Location: /quartz.config.ts

const config: QuartzConfig = {
  configuration: {
    pageTitle: "Remy Kim",           // Site title
    pageTitleSuffix: "",             // Optional suffix
    enableSPA: true,                 // Single-page app navigation
    enablePopovers: true,            // Wikipedia-style link previews
    analytics: { provider: "plausible" },
    locale: "en-US",
    baseUrl: "remyjkim.com",
    ignorePatterns: ["private", "templates", ".obsidian", "drafts"],
    defaultDateType: "modified",     // Date display preference
    filterTags: ["intelligence", "system", "measure", "intentionality", "question"],
    showPostTags: true,              // Show tags on post items in lists
    theme: {
      fontOrigin: "googleFonts",
      typography: {
        header: "PT Sans",
        body: "PT Sans",
        code: "IBM Plex Mono",
      },
      colors: {
        lightMode: { /* color values */ },
        darkMode: { /* color values */ },
      },
    },
  },
  plugins: {
    transformers: [
      // ... other transformers
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest", openLinksInNewTab: true }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [/* page generators */],
  },
}
```

### GlobalConfiguration Type

```typescript
// Location: /quartz/cfg.ts

export interface GlobalConfiguration {
  pageTitle: string
  pageTitleSuffix?: string
  enableSPA: boolean
  enablePopovers: boolean
  analytics: Analytics
  ignorePatterns: string[]
  defaultDateType: ValidDateType
  baseUrl?: string
  theme: Theme
  locale: ValidLocale
  filterTags?: string[]     // Tags to display as selectable filters in posts list
  showPostTags?: boolean    // Whether to show tags on each post item (default: true)
}
```

### filterTags Configuration

The `filterTags` option allows you to define a curated list of tags to display in the PostsListWithFilter component's tag filter bar. If not specified, tags are auto-generated from all posts.

```typescript
// Location: /quartz.config.ts

const config: QuartzConfig = {
  configuration: {
    // ...other settings
    filterTags: ["intelligence", "system", "measure", "intentionality", "question"],
    showPostTags: true,  // Show/hide tags on individual post items
  },
}
```

### Plugin Pipeline

```
┌───────────────────────────────────────────────────────────────┐
│                     PLUGIN EXECUTION ORDER                     │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  1. TRANSFORMERS (process markdown content)                   │
│     ├── FrontMatter()      → Parse YAML frontmatter           │
│     ├── CreatedModifiedDate() → Extract dates                 │
│     ├── SyntaxHighlighting() → Code block styling             │
│     ├── ObsidianFlavoredMarkdown() → Wikilinks, callouts      │
│     ├── GitHubFlavoredMarkdown() → Tables, strikethrough      │
│     ├── TableOfContents() → Generate TOC data                 │
│     ├── CrawlLinks()    → Resolve links, openLinksInNewTab    │
│     ├── Description() → Generate descriptions                 │
│     └── Latex() → Math rendering (KaTeX)                      │
│                                                               │
│  2. FILTERS (decide what to emit)                             │
│     └── RemoveDrafts() → Skip draft: true files               │
│                                                               │
│  3. EMITTERS (generate output files)                          │
│     ├── ContentPage() → Regular content pages                 │
│     ├── FolderPage() → Folder index pages                     │
│     ├── TagPage() → Tag taxonomy pages                        │
│     ├── ContentIndex() → sitemap.xml, RSS                     │
│     ├── ComponentResources() → CSS/JS bundles                 │
│     ├── Assets() → Copy static assets                         │
│     └── Static() → Copy static folder                         │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

## 3. Layout System

### Layout Configuration

```typescript
// Location: /quartz.layout.ts

// Helper function for conditional component rendering
const postsListTargetSlugs = ["index", "posts/index"]
const isNotPostsListPage = (page) =>
  !postsListTargetSlugs.includes(page.fileData.slug ?? "")

// Helper: Hide title/meta only on posts/index (not home page)
const isNotPostsIndexPage = (page) =>
  page.fileData.slug !== "posts/index"

// Shared components (used on ALL pages)
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [],  // Search moved to SidebarNav for consistent placement
  afterBody: [
    // TagList and Breadcrumbs moved here from beforeBody
    Component.ConditionalRender({ component: Component.TagList(), condition: isNotPostsListPage }),
    Component.ConditionalRender({ component: Component.Breadcrumbs(), condition: isNotPostsListPage }),
    Component.Backlinks(),
    Component.Graph(),
    Component.PreviewDrawer(),
  ],
  footer: Component.Footer({ links: {} }),
}

// Content page layout (individual pages)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    // Title shows on all pages except posts/index
    Component.ConditionalRender({
      component: Component.ArticleTitle(),
      condition: isNotPostsIndexPage,
    }),
    // ContentMeta hidden on posts list pages (home and posts/index)
    Component.ConditionalRender({
      component: Component.ContentMeta(),
      condition: isNotPostsListPage,
    }),
    // TOC shown in center column on mobile only
    Component.ConditionalRender({
      component: Component.MobileOnly(Component.TableOfContents()),
      condition: isNotPostsListPage,
    }),
  ],
  left: [
    // TOC shown in left sidebar on desktop only
    Component.DesktopOnly(Component.TableOfContents()),
  ],
  right: [
    // SidebarNav now includes Search component
    Component.SidebarNav({
      sections: [
        { title: "About", slug: "about" },
        { title: "World Models", slug: "frameworks-models" },
        { title: "Questions", slug: "questions-validations" },
        { title: "World Data", slug: "learnings-observations" },
        { title: "Creations", slug: "tools-creations" },
      ],
      postsLink: { title: "Posts", slug: "posts" },
      showHome: true,
      showGithub: true,
      githubUrl: "https://github.com/remyjkim",
      showCopyright: true,
      showDarkmode: true,
      showReaderMode: false,
    }),
  ],
}

// List page layout (folders, tags)
export const defaultListPageLayout: PageLayout = { /* similar structure */ }
```

### Layout Type Definitions

```typescript
// Location: /quartz/cfg.ts

export interface FullPageLayout {
  head: QuartzComponent
  header: QuartzComponent[]
  beforeBody: QuartzComponent[]
  pageBody: QuartzComponent
  afterBody: QuartzComponent[]
  left: QuartzComponent[]
  right: QuartzComponent[]
  footer: QuartzComponent
}

// Partial layouts used in quartz.layout.ts
export type PageLayout = Pick<FullPageLayout, "beforeBody" | "left" | "right">
export type SharedLayout = Pick<FullPageLayout, "head" | "header" | "footer" | "afterBody">
```

### Page Structure (Rendered HTML)

```html
<html>
  <head>
    <!-- Head component: meta, styles, preload scripts -->
  </head>
  <body data-slug="posts/001-belief-agency">
    <div id="quartz-root" class="page">
      <div id="quartz-body">
        <!-- LEFT SIDEBAR -->
        <div class="left sidebar">
          <!-- left[] components: TableOfContents, etc. -->
        </div>

        <!-- CENTER CONTENT -->
        <div class="center">
          <div class="page-header">
            <!-- header[] components: Search -->
            <div class="popover-hint">
              <!-- beforeBody[] components: Breadcrumbs, ArticleTitle, etc. -->
            </div>
          </div>

          <!-- pageBody component: Content or PostsListWithFilter -->
          <article class="popover-hint">
            <!-- Rendered markdown content -->
          </article>

          <hr />

          <div class="page-footer">
            <!-- afterBody[] components: Backlinks, Graph -->
          </div>
        </div>

        <!-- RIGHT SIDEBAR -->
        <div class="right sidebar">
          <!-- right[] components: SidebarNav -->
        </div>

        <footer>
          <!-- Footer component -->
        </footer>
      </div>
    </div>
  </body>
</html>
```

---

## 4. Content Structure

### Directory Organization

```
content/
├── index.md                    # Home page (slug: "index")
│                               # Contains "About Blog" intro
│
├── posts/                      # Blog posts folder
│   ├── index.md               # Posts listing (slug: "posts/index")
│   │                          # Minimal frontmatter, PostsListWithFilter renders
│   │
│   └── 001-belief-agency/     # Individual post
│       └── index.md           # slug: "posts/belief-agency"
│
├── 01-about/                   # About section (numbered for sidebar order)
│   └── index.md               # slug: "about"
│
├── 02-frameworks-models/       # World Models section
│   └── index.md               # slug: "frameworks-models"
│
├── 03-questions-validations/   # Questions section (supports subfolder posts)
│   ├── index.md               # slug: "questions-validations"
│   └── 001-what-am-i-capable-of/  # Question post (included in posts list)
│       └── index.md           # slug: "questions-validations/what-am-i-capable-of"
│
├── 04-learnings-observations/  # World Data section
│   └── index.md               # slug: "learnings-observations"
│
├── 05-tools-creations/         # Creations section
│   └── index.md               # slug: "tools-creations"
│
└── drafts/                     # Draft posts (ignored via ignorePatterns)
    └── *.md
```

### Slug Generation

Quartz strips number prefixes from folder names during slug generation:

| File Path | Generated Slug | URL |
|-----------|----------------|-----|
| `content/index.md` | `index` | `/` |
| `content/posts/index.md` | `posts/index` | `/posts/` |
| `content/posts/001-belief-agency/index.md` | `posts/belief-agency` | `/posts/belief-agency/` |
| `content/01-about/index.md` | `about` | `/about/` |
| `content/03-questions-validations/index.md` | `questions-validations` | `/questions-validations/` |
| `content/03-questions-validations/001-what-am-i-capable-of/index.md` | `questions-validations/what-am-i-capable-of` | `/questions-validations/what-am-i-capable-of/` |

### Frontmatter Format

```yaml
---
title: "Belief Agency"         # Required: Page title
date: 2025-12-13               # Optional: Created date
draft: false                   # Optional: Skip if true
tags:                          # Optional: Array of tags
  - agency
  - beliefs
  - philosophy
aliases:                       # Optional: URL aliases
  - about
  - author
layout: page                   # Optional: Layout hint
cssclasses:                    # Optional: Custom CSS classes
  - wide-content
---
```

### Content Relationships

```
┌────────────────────────────────────────────────────────────────┐
│                    CONTENT RELATIONSHIP FLOW                    │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  allFiles (from build context)                                 │
│     │                                                          │
│     ▼                                                          │
│  ┌──────────────────────────────────────────┐                 │
│  │  Filter by postsPrefixes:                │                 │
│  │  ["posts/", "questions-validations/"]    │                 │
│  │  ├── posts/belief-agency                 │                 │
│  │  ├── posts/another-post                  │                 │
│  │  ├── questions-validations/what-am-i-capable-of │         │
│  │  └── ...                                 │                 │
│  │                                          │                 │
│  │  EXCLUDING section indexes:              │                 │
│  │  - questions-validations                 │                 │
│  │  - questions-validations/index           │                 │
│  └──────────────────────────────────────────┘                 │
│     │                                                          │
│     ▼                                                          │
│  ┌──────────────────────────────────────────┐                 │
│  │  Extract unique tags:                    │                 │
│  │  Set<"agency", "beliefs", ...>           │                 │
│  └──────────────────────────────────────────┘                 │
│     │                                                          │
│     ▼                                                          │
│  ┌──────────────────────────────────────────┐                 │
│  │  Sort by date (descending)               │                 │
│  │  byDateAndAlphabetical(cfg)              │                 │
│  └──────────────────────────────────────────┘                 │
│     │                                                          │
│     ▼                                                          │
│  PostsListWithFilter / PageList renders the list              │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 5. Page Generation (Emitters)

### ContentPage Emitter

The primary emitter for individual content pages:

```typescript
// Location: /quartz/plugins/emitters/contentPage.tsx

export const ContentPage: QuartzEmitterPlugin<Partial<FullPageLayout>> = (userOpts) => {
  const opts: FullPageLayout = {
    ...sharedPageComponents,
    ...defaultContentPageLayout,
    pageBody: PostsListWithFilter({        // Custom: Use PostsListWithFilter
      targetSlugs: ["index", "posts/index"], // Show on home and /posts
      showAboutSection: true,                // Show intro content
      postsPrefixes: ["posts/", "questions-validations/"],  // Multiple post sources
    }),
    ...userOpts,
  }

  return {
    name: "ContentPage",
    getQuartzComponents() {
      return [/* all components used in layout */]
    },
    async *emit(ctx, content, resources) {
      for (const [tree, file] of content) {
        const slug = file.data.slug!

        // Skip tag pages (handled by TagPage emitter)
        if (slug.startsWith("tags/")) continue

        yield processContent(ctx, tree, file.data, allFiles, opts, resources)
      }
    },
  }
}
```

### FolderPage Emitter

Generates index pages for folders without explicit index.md:

```typescript
// Location: /quartz/plugins/emitters/folderPage.tsx

async function* processFolderInfo(...) {
  for (const [folder, folderContent] of Object.entries(folderInfo)) {
    const slug = joinSegments(folder, "index") as FullSlug

    // IMPORTANT: Skip if folder has actual index.md
    // (handled by ContentPage emitter)
    const hasActualIndexMd = allFiles.some((file) => file.slug === slug)
    if (hasActualIndexMd) continue

    // Generate folder page with FolderContent component
    yield renderPage(...)
  }
}
```

### TagPage Emitter

Generates pages for each tag:

```typescript
// Location: /quartz/plugins/emitters/tagPage.tsx

// Computes all unique tags from frontmatter across all files
function computeTagInfo(allFiles, content, locale) {
  const tags: Set<string> = new Set(
    allFiles.flatMap((data) => data.frontmatter?.tags ?? [])
           .flatMap(getAllSegmentPrefixes)
  )
  tags.add("index")  // Tag listing page
  // ...
}
```

### Emitter Decision Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    WHICH EMITTER HANDLES IT?                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Input: file.data.slug                                      │
│                                                             │
│  if slug.startsWith("tags/")                                │
│    └──► TagPage emitter                                     │
│                                                             │
│  else if slug ends with folder path AND no index.md exists  │
│    └──► FolderPage emitter                                  │
│                                                             │
│  else                                                       │
│    └──► ContentPage emitter                                 │
│                                                             │
│  Note: FolderPage skips if index.md exists for that slug    │
│        (ContentPage handles it instead)                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Component System

### Component Types

```typescript
// Location: /quartz/components/types.ts

// Props passed to every component
export type QuartzComponentProps = {
  ctx: BuildCtx                    // Build context
  externalResources: StaticResources // CSS/JS resources
  fileData: QuartzPluginData       // Current file data
  cfg: GlobalConfiguration         // Site config
  children: (QuartzComponent | JSX.Element)[]
  tree: Node                       // HAST tree
  allFiles: QuartzPluginData[]     // All site files
  displayClass?: "mobile-only" | "desktop-only"
}

// A Quartz component with attached resources
export type QuartzComponent = ComponentType<QuartzComponentProps> & {
  css?: StringResource             // Component CSS
  beforeDOMLoaded?: StringResource // Scripts before DOM ready
  afterDOMLoaded?: StringResource  // Scripts after DOM ready
}

// Factory function to create components with options
export type QuartzComponentConstructor<Options = undefined> = (
  opts: Options,
) => QuartzComponent
```

### Component Pattern

```typescript
// Example: /quartz/components/PostsListWithFilter.tsx

import style from "./styles/postsListWithFilter.scss"
// @ts-ignore
import script from "./scripts/tagFilter.inline"

interface PostsListWithFilterOptions {
  postsPerPage?: number
  excludeSlugs?: string[]
  showAboutSection?: boolean
  targetSlugs?: string[]
  postsPrefixes?: string[]  // Folder prefixes to include as posts
}

const defaultOptions: PostsListWithFilterOptions = {
  postsPerPage: 30,
  excludeSlugs: ["about_blog", "bookshelf", "questions", "about"],
  showAboutSection: false,
  targetSlugs: ["index", "posts/index"],
  postsPrefixes: ["posts/"],  // Default: only posts/ folder
}

export default ((userOpts?: Partial<PostsListWithFilterOptions>) => {
  const opts = { ...defaultOptions, ...userOpts }

  const PostsListWithFilter: QuartzComponent = (props: QuartzComponentProps) => {
    const { fileData, allFiles, cfg, tree } = props

    // Conditional rendering based on current page
    const targetSlugs = opts.targetSlugs ?? ["index"]
    if (!targetSlugs.includes(fileData.slug ?? "")) {
      // Fallback to standard content
      const content = htmlToJsx(fileData.filePath!, tree)
      return <article class="popover-hint">{content}</article>
    }

    // Helper to check if slug matches any posts prefix
    // Excludes section index pages (e.g., questions-validations/index)
    const isPostSlug = (slug: string) => {
      return postsPrefixes.some((prefix) => {
        const prefixWithoutSlash = prefix.replace(/\/$/, "")
        const prefixIndex = prefixWithoutSlash + "/index"
        return slug.startsWith(prefix) && slug !== prefixWithoutSlash && slug !== prefixIndex
      })
    }

    // PostsListWithFilter-specific rendering
    return (
      <div class="posts-list-with-filter">
        {/* ... component JSX */}
      </div>
    )
  }

  // Attach CSS and scripts
  PostsListWithFilter.css = concatenateResources(style, PageList.css)
  PostsListWithFilter.afterDOMLoaded = script

  return PostsListWithFilter
}) satisfies QuartzComponentConstructor
```

### PageList Component

```typescript
// Location: /quartz/components/PageList.tsx

type Props = {
  limit?: number
  sort?: SortFn
  showTags?: boolean  // Control tag visibility (default: true)
} & QuartzComponentProps

export const PageList: QuartzComponent = ({ cfg, fileData, allFiles, limit, sort, showTags = true }: Props) => {
  const sorter = sort ?? byDateAndAlphabeticalFolderFirst(cfg)
  let list = allFiles.sort(sorter)
  if (limit) list = list.slice(0, limit)

  return (
    <ul class="section-ul">
      {list.map((page) => (
        <li class="section-li">
          <div class="section">
            <p class="meta">
              <Date date={getDate(cfg, page)!} locale={cfg.locale} />
            </p>
            <div class="desc">
              <h3><a href={resolveRelative(fileData.slug!, page.slug!)}>{title}</a></h3>
            </div>
            {showTags && (
              <ul class="tags">
                {tags.map((tag) => (
                  <li><a class="tag-link" href={`tags/${tag}`}>{tag}</a></li>
                ))}
              </ul>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
```

### ConditionalRender Component

```typescript
// Location: /quartz/components/ConditionalRender.tsx

type ConditionalRenderConfig = {
  component: QuartzComponent
  condition: (props: QuartzComponentProps) => boolean
}

export default ((config: ConditionalRenderConfig) => {
  const ConditionalRender: QuartzComponent = (props) => {
    if (config.condition(props)) {
      return <config.component {...props} />
    }
    return null
  }

  // Inherit resources from wrapped component
  ConditionalRender.afterDOMLoaded = config.component.afterDOMLoaded
  ConditionalRender.beforeDOMLoaded = config.component.beforeDOMLoaded
  ConditionalRender.css = config.component.css

  return ConditionalRender
}) satisfies QuartzComponentConstructor<ConditionalRenderConfig>
```

### Component Registration

```typescript
// Location: /quartz/components/index.ts

import PostsListWithFilter from "./PostsListWithFilter"
import SidebarNav from "./SidebarNav"
import PreviewDrawer from "./PreviewDrawer"
// ... other imports

export {
  PostsListWithFilter,
  SidebarNav,
  PreviewDrawer,
  // ... other exports
}
```

---

## 7. Styling Architecture

### Style File Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                      STYLE LOADING ORDER                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Theme Variables (from quartz.config.ts)                 │
│     └── CSS variables for colors, fonts                     │
│                                                             │
│  2. Google Fonts (if configured)                            │
│     └── @import or local font files                         │
│                                                             │
│  3. Component CSS (collected from all components)           │
│     ├── sidebarNav.scss                                     │
│     ├── postsListWithFilter.scss                            │
│     ├── search.scss                                         │
│     ├── listPage.scss                                       │
│     └── ... other component styles                          │
│                                                             │
│  4. Global Styles                                           │
│     ├── base.scss (core layout, typography)                 │
│     ├── syntax.scss (code highlighting)                     │
│     ├── callouts.scss (callout blocks)                      │
│     └── custom.scss (custom overrides - LAST)               │
│                                                             │
│  Output: /public/index.css (minified)                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### CSS Variables (Theme)

```scss
// Generated from quartz.config.ts theme.colors

:root {
  --light: #ffffff;           // Background
  --lightgray: #e5e5e5;       // Borders
  --gray: #9a9a9a;            // Metadata
  --darkgray: #515151;        // Body text
  --dark: #313131;            // Headings
  --secondary: #268bd2;       // Links (primary blue)
  --tertiary: #6a7fb5;        // Hover states
  --highlight: rgba(38, 139, 210, 0.1);
  --textHighlight: #fff23688;

  // Typography
  --headerFont: "PT Sans", sans-serif;
  --bodyFont: "PT Sans", sans-serif;
  --codeFont: "IBM Plex Mono", monospace;
}

[saved-theme="dark"] {
  --light: #1a1a1a;
  --darkgray: #d4d4d4;
  // ... dark mode overrides
}
```

### Breakpoints (variables.scss)

```scss
// Location: /quartz/styles/variables.scss

$breakpoints: (
  mobile: 800px,
  desktop: 1200px,
);

$mobile: "(max-width: #{map.get($breakpoints, mobile)})";
$tablet: "(min-width: #{map.get($breakpoints, mobile)}) and (max-width: #{map.get($breakpoints, desktop)})";
$desktop: "(min-width: #{map.get($breakpoints, desktop)})";

$sidePanelWidth: 240px;  // Reduced from 320px for more content space
$topSpacing: 6rem;
```

### Mobile Layout Customizations (custom.scss)

```scss
// Location: /quartz/styles/custom.scss

// Left sidebar padding adjustments
.page > #quartz-body {
  .sidebar.left {
    padding-left: 0.8rem;   // 40% of original 2rem
    padding-right: 1rem;    // Doubled from 0.5rem

    // Hide left sidebar on mobile (content-focused layout)
    @media all and ($mobile) {
      display: none !important;
    }
  }
}

// Content width flexible on mobile (removes max-width constraints)
@media all and ($mobile) {
  .page > #quartz-body .center article,
  .page > #quartz-body .center > .page-header,
  .page > #quartz-body .center > .page-footer {
    max-width: none;
  }
}

// Desktop-only max-width constraints (wrapped to exclude mobile)
@media all and not ($mobile) {
  :root[saved-theme] {
    .page > #quartz-body {
      // Grid and max-width settings only apply on desktop
    }
  }
}
```

### Tag Styling (listPage.scss)

```scss
// Location: /quartz/components/styles/listPage.scss

& > .tags {
  grid-column: 1 / 3;
  grid-row: 2 / 3;
  margin-top: 0.5em;

  li {
    display: inline;
    margin-right: 0.5em;
  }

  a.tag-link {
    font-size: 0.85em;
    font-weight: 400;
    color: var(--darkgray);
    opacity: 0.8;

    &:hover {
      opacity: 1;
    }
  }
}
```

### Grid Layout (base.scss)

```scss
// Location: /quartz/styles/base.scss

$desktopGrid: (
  templateRows: "auto auto auto",
  templateColumns: "#{$sidePanelWidth} auto #{$sidePanelWidth}",
  templateAreas:
    '"grid-sidebar-left grid-header grid-sidebar-right"
     "grid-sidebar-left grid-center grid-sidebar-right"
     "grid-sidebar-left grid-footer grid-sidebar-right"',
);

// Desktop: 3-column layout
// Tablet: 2-column (left sidebar + content)
// Mobile: 1-column stacked
```

### Custom Overrides (custom.scss)

```scss
// Location: /quartz/styles/custom.scss

// Hugo-inspired base font size
html {
  font-size: 16px !important;
}

// Fixed right sidebar (Hugo Lanyon style)
@media all and not ($mobile) {
  .sidebar.right {
    width: 100px !important;
    position: fixed !important;
    right: 0 !important;
    top: 0 !important;
    bottom: 0 !important;
    background-color: #234bc2 !important;  // Hugo theme-base-02
  }
}

// Content width constraints (left-aligned like Hugo)
.page > #quartz-body .center article {
  max-width: 38rem;
  margin-left: 0;
  margin-right: auto;
}
```

---

## 8. Custom Components

### PostsListWithFilter

**Purpose**: Display filterable blog posts list on home and /posts pages.

```
┌─────────────────────────────────────────────────────────────┐
│                    PostsListWithFilter                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ About Section (optional)                             │   │
│  │ "Buckle up, we're living in..."                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ───────────────────────────────────────────────────────   │
│                                                             │
│  <h2>Posts</h2>                                             │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Tag Filter Bar                            [data-tag-filter]
│  │ All  intelligence  system  measure  ...            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Post List                                [data-post-list]
│  │ ├── Dec 13, 2025 - Belief Agency                    │   │
│  │ │   agency, beliefs, philosophy                     │   │
│  │ ├── ...                                             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Configuration Options**:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `targetSlugs` | `string[]` | `["index", "posts/index"]` | Pages to render component on |
| `showAboutSection` | `boolean` | `false` | Show intro content above posts |
| `excludeSlugs` | `string[]` | `["about_blog", ...]` | Slugs to exclude from list |
| `postsPerPage` | `number` | `30` | Posts per page |
| `postsPrefixes` | `string[]` | `["posts/"]` | Folder prefixes to include as posts |

**Tag Filtering**:
- Uses `cfg.filterTags` from quartz.config.ts if defined
- Falls back to auto-generating tags from all posts if not configured
- Tags are displayed as clickable filter links in the tag filter bar
- Tag visibility on post items controlled by `cfg.showPostTags`

**Behavior**:
- On non-target pages: Falls back to standard `<article>` rendering
- On target pages: Renders the full filterable posts list
- Excludes section index pages (e.g., `questions-validations/index`) from post list

### SidebarNav

**Purpose**: Right sidebar navigation with Hugo Lanyon styling, integrated Search component.

**Desktop Layout**:
```
┌──────────────────────┐
│ [Home Button]        │  ← Theme-aware (white bg, blue text)
├──────────────────────┤
│ About                │  ← Navigation links
│ World Models         │
│ Questions            │
│ World Data           │
│ Creations            │
│ Github ↗             │
├──────────────────────┤
│ [Search...]          │  ← Search component (moved from header)
├──────────────────────┤
│ Posts                │  ← Posts link
├──────────────────────┤
│ [🌓]                 │  ← Theme toggle (optional)
├──────────────────────┤
│ © 2025. All rights   │  ← Copyright
│ reserved.            │
└──────────────────────┘
```

**Mobile Header** (fixed at top):
```
┌────────────────────────────────────────────────┐
│ Remy Kim                    [🌓] [🔍] [☰]     │
│ (site title)                (controls)         │
└────────────────────────────────────────────────┘
Blue background (#234bc2), white text/icons
```

**Configuration Options**:

| Option | Type | Description |
|--------|------|-------------|
| `sections` | `NavItem[]` | Sidebar navigation links |
| `postsLink` | `NavItem` | Posts section link |
| `showHome` | `boolean` | Show home button |
| `showGithub` | `boolean` | Show GitHub link |
| `githubUrl` | `string` | GitHub profile URL |
| `showCopyright` | `boolean` | Show copyright |
| `showDarkmode` | `boolean` | Show theme toggle |
| `showReaderMode` | `boolean` | Show reader mode toggle |
| `homeTitle` | `string` | Custom home title (defaults to pageTitle from config) |

**Mobile Behavior**:
- Fixed header bar with site title, darkmode toggle, search icon, and hamburger menu
- Hamburger menu opens slide-down navigation panel
- Backdrop blur overlay when menu is open
- Body content has top padding (3.5rem) to account for fixed header

### PageList

**Purpose**: Render a list of pages with dates and tags.

```typescript
// Location: /quartz/components/PageList.tsx

export const PageList: QuartzComponent = ({ cfg, fileData, allFiles, limit, sort, showTags = true }) => {
  const sorter = sort ?? byDateAndAlphabeticalFolderFirst(cfg)
  let list = allFiles.sort(sorter)
  if (limit) list = list.slice(0, limit)

  return (
    <ul class="section-ul">
      {list.map((page) => (
        <li class="section-li">
          <div class="section">
            <p class="meta">
              <Date date={getDate(cfg, page)!} locale={cfg.locale} />
            </p>
            <div class="desc">
              <h3><a href={resolveRelative(fileData.slug!, page.slug!)}>{title}</a></h3>
            </div>
            {showTags && (
              <ul class="tags">
                {tags.map((tag) => (
                  <li><a class="tag-link" href={`tags/${tag}`}>{tag}</a></li>
                ))}
              </ul>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
```

---

## 9. Client-Side Interactivity

### Script Types

| Extension | Purpose | Load Time |
|-----------|---------|-----------|
| `*.inline.ts` | Client-side scripts | afterDOMLoaded |
| Component `.beforeDOMLoaded` | Theme init, etc. | beforeDOMReady |
| Component `.afterDOMLoaded` | Interactive features | afterDOMReady |

### SPA Navigation (spa.inline.ts)

```typescript
// Location: /quartz/components/scripts/spa.inline.ts

// Key mechanism: Intercepts all local link clicks
window.addEventListener("click", async (event) => {
  const { url } = getOpts(event) ?? {}

  // Skip if:
  // - Not a local URL
  // - Ctrl/Meta key held
  // - Has data-router-ignore attribute  ← IMPORTANT for tag filtering
  if (!url || event.ctrlKey || event.metaKey) return
  if ("routerIgnore" in a.dataset) return  // ← Opt-out mechanism

  event.preventDefault()
  navigate(url, false)
})

// Navigation uses micromorph for efficient DOM diffing
async function _navigate(url: URL, isBack: boolean) {
  const contents = await fetch(url).then(res => res.text())
  const html = parser.parseFromString(contents, "text/html")
  micromorph(document.body, html.body)  // Morph existing DOM
  notifyNav(getFullSlug(window))         // Dispatch "nav" event
}
```

### Nav Event Pattern

```typescript
// All client-side scripts should listen for "nav" event for SPA compatibility

function initMyFeature() {
  // Feature initialization logic
}

// Initialize on SPA navigation
document.addEventListener("nav", () => {
  initMyFeature()
})

// Initialize on initial page load
window.addEventListener("load", () => {
  initMyFeature()
})
```

### Tag Filtering (tagFilter.inline.ts)

```typescript
// Location: /quartz/components/scripts/tagFilter.inline.ts

function initTagFilter() {
  const filterBar = document.querySelector("[data-tag-filter]")
  const postList = document.querySelector("[data-post-list]")

  if (!filterBar || !postList) return  // Not on posts list page

  const postItems = postList.querySelectorAll(".section-li")

  // Build tag -> posts mapping
  const postTagMap = new Map<Element, Set<string>>()
  postItems.forEach((item) => {
    const tags = new Set(
      Array.from(item.querySelectorAll(".tag-link"))
           .map(el => el.textContent?.trim())
    )
    postTagMap.set(item, tags)
  })

  // Filter function
  function filterPosts(selectedTag: string) {
    postItems.forEach((item) => {
      if (selectedTag === "all") {
        item.style.display = ""
      } else {
        const tags = postTagMap.get(item)
        item.style.display = tags?.has(selectedTag) ? "" : "none"
      }
    })
  }

  // Attach click handlers (with data-router-ignore for SPA bypass)
  filterLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault()
      const selectedTag = e.currentTarget.getAttribute("data-tag")
      filterPosts(selectedTag)
      // Update URL hash for shareability
      history.replaceState(null, "", `#tag=${selectedTag}`)
    })
  })
}
```

### Sidebar Navigation (sidebarNav.inline.ts)

```typescript
// Location: /quartz/components/scripts/sidebarNav.inline.ts

function initSidebarNav() {
  const nav = document.querySelector(".sidebar-nav")
  const toggle = nav?.querySelector(".sidebar-nav-toggle")

  // Mobile menu toggle
  toggle?.addEventListener("click", toggleMenu)

  // Close on link click (mobile)
  navLinks.forEach((link) => {
    link.addEventListener("click", () => setTimeout(closeMenu, 100))
  })

  // Close on outside click
  document.addEventListener("click", (e) => {
    if (isOpen && !nav.contains(e.target)) closeMenu()
  })

  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen) closeMenu()
  })
}
```

---

## 10. Build Pipeline

### Script Bundling

```typescript
// Location: /quartz/plugins/emitters/componentResources.ts

function getComponentResources(ctx: BuildCtx): ComponentResources {
  const allComponents: Set<QuartzComponent> = new Set()

  // Collect all components from all emitters
  for (const emitter of ctx.cfg.plugins.emitters) {
    const components = emitter.getQuartzComponents?.(ctx) ?? []
    components.forEach(c => allComponents.add(c))
  }

  // Extract CSS and scripts from components
  const componentResources = {
    css: new Set<string>(),
    beforeDOMLoaded: new Set<string>(),
    afterDOMLoaded: new Set<string>(),
  }

  for (const component of allComponents) {
    componentResources.css.add(component.css)
    componentResources.beforeDOMLoaded.add(component.beforeDOMLoaded)
    componentResources.afterDOMLoaded.add(component.afterDOMLoaded)
  }

  return componentResources
}
```

### Output Files

```
public/
├── index.html              # Home page
├── index.css               # Bundled & minified CSS
├── prescript.js            # beforeDOMLoaded scripts
├── postscript.js           # afterDOMLoaded scripts (SPA, etc.)
├── static/
│   └── contentIndex.json   # Search index
├── posts/
│   ├── index.html          # Posts listing
│   └── belief-agency/
│       └── index.html      # Individual post
├── tags/
│   ├── index.html          # Tag listing
│   └── agency/
│       └── index.html      # Posts tagged "agency"
└── sitemap.xml             # Sitemap
```

### Build Commands

```bash
# Development (with hot reload)
npx quartz build --serve

# Production build
npx quartz build

# Build with verbose output
npx quartz build --verbose
```

---

## Appendix: Key Customizations Summary

### 1. Layout Customizations

- **Right sidebar**: Fixed position, Hugo Lanyon theme-base-02 blue (#234bc2), width: 100px
- **Left sidebar**: Width reduced to 240px (from 320px), padding: 0.8rem left / 1rem right, hidden on mobile
- **Content width**: Constrained to 38-42rem on desktop, flexible (no max-width) on mobile
- **Base font size**: 16px (Hugo-compatible)
- **Mobile header**: Fixed header bar with site title, darkmode toggle, search icon, and hamburger menu

### 2. Custom Components

- **PostsListWithFilter**: Replaces standard Content on home/posts pages, supports `cfg.filterTags`, `cfg.showPostTags`, `postsPrefixes`
- **SidebarNav**: Custom navigation with integrated Search, mobile header, and Darkmode toggle
- **PreviewDrawer**: Slide-out preview panel for internal links

### 3. Component Placement

- **Search**: Moved from header to SidebarNav (desktop: sidebar, mobile: header bar)
- **TagList & Breadcrumbs**: Moved from beforeBody to afterBody (below content)
- **TableOfContents**: Desktop in left sidebar, mobile in center column below date

### 4. Conditional Rendering

```typescript
// Components hidden on posts list pages
Component.ConditionalRender({
  component: Component.ArticleTitle(),
  condition: isNotPostsIndexPage,  // Show on home, hide on posts/index
})

Component.ConditionalRender({
  component: Component.ContentMeta(),
  condition: isNotPostsListPage,   // Hide on both home and posts/index
})

// TOC responsive placement
Component.ConditionalRender({
  component: Component.MobileOnly(Component.TableOfContents()),
  condition: isNotPostsListPage,  // beforeBody for mobile
})
Component.DesktopOnly(Component.TableOfContents())  // left sidebar for desktop
```

### 5. Configuration Options

- **filterTags**: Define curated list of tags for PostsListWithFilter tag filter bar
- **showPostTags**: Toggle tag visibility on individual post items in lists
- **openLinksInNewTab**: External links open in new tab (CrawlLinks plugin)
- **postsPrefixes**: Multiple folder sources for posts (e.g., `["posts/", "questions-validations/"]`)

### 6. Client-Side Features

- **Tag filtering**: In-place filtering without page reload
- **SPA navigation**: Seamless page transitions with `data-router-ignore` opt-out
- **Mobile navigation**: Fixed header + slide-down menu with backdrop blur

### 7. Emitter Coordination

- **ContentPage**: Handles all non-tag pages, including folder indexes with index.md
- **FolderPage**: Only handles folders WITHOUT explicit index.md
- **TagPage**: Handles all `/tags/*` routes

### 8. CSS Specificity Notes

- `.mobile-only` class sets `display: initial` which can override component-specific display modes
- Components using flex layout (like TOC) need `display: flex !important` in mobile media queries
- `:root[saved-theme]` rules have high specificity and should be wrapped in desktop-only media queries if they shouldn't apply on mobile

---

## Changelog from v1.0

### v1.1 (December 14, 2025)

**Configuration Changes:**
- Added `showPostTags` option to `GlobalConfiguration` for toggling tag display on post items
- Added `openLinksInNewTab: true` to CrawlLinks plugin configuration
- Updated `filterTags` example values
- Updated base font size from 15px to 16px

**Content Structure Changes:**
- Updated section folder names:
  - `01-about-me` → `01-about`
  - `02-about-blog` → `02-frameworks-models`
  - `03-questions` → `03-questions-validations`
  - `04-bookshelf` → `04-learnings-observations`
  - Added `05-tools-creations`
- Added support for subfolder posts in `questions-validations/`
- Added `drafts/` folder with `ignorePatterns` exclusion

**Component Changes:**
- **PostsListWithFilter**: Added `postsPrefixes` option to support multiple post source folders
- **PostsListWithFilter**: Fixed `isPostSlug` to exclude section index pages (e.g., `questions-validations/index`)
- **PageList**: Added `showTags` prop to control tag visibility
- Updated tag styling: smaller font (0.85em), non-bold (400), dark gray color

**Layout Changes:**
- Added `isNotPostsIndexPage` helper for conditional title rendering
- Updated SidebarNav section titles to match new folder structure
- Adjusted left sidebar padding: 0.8rem left (40% of original), 1rem right (doubled)

**Styling Changes:**
- Tag links styled as non-bold, smaller, dark gray with hover opacity

---

*This document reflects the architecture as of the v1.1 customization. Future modifications should update this document to maintain accurate documentation.*
