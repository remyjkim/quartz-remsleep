# Task Plan: Sidebar Navigation & Two-Layer Content Implementation

**Date**: 2025-01-13  
**Status**: Implementation Ready  
**Priority**: High  
**Reference**: `03_explorer_folder_post_rendering.md` (Analysis Document)

---

## Executive Summary

This task plan implements a **custom sidebar navigation** replacing the default Explorer component with:
1. **Fixed section links** (no collapsible "Explorer" header)
2. **"Posts" button** that navigates to `/posts` page (not a collapsible folder)
3. **Two-layer content structure** (Section Pages + Posts Container)
4. **PostsListWithFilter component** rendered on the `/posts` page

---

## Final Design Specification

### Content Architecture

```
content/
├── index.md                     # Homepage
│
├── 01-about-me/                 # Section Page
│   └── index.md
├── 02-about-blog/               # Section Page
│   └── index.md
├── 03-questions/                # Section Page
│   └── index.md
├── 04-bookshelf/                # Section Page
│   └── index.md
│
└── posts/                       # Posts Container
    ├── index.md                 # Posts listing page (uses PostsListWithFilter)
    ├── 001-belief-agency/       # Blog Post
    │   └── index.md
    ├── 002-commodities/         # Blog Post
    │   └── index.md
    └── 003-hfrl/                # Blog Post
        └── index.md
```

### Sidebar Navigation (Desktop)

```
┌─────────────────────────┐
│                         │
│   About Me      ←link   │
│   About Blog    ←link   │
│   Questions     ←link   │
│   Bookshelf     ←link   │
│                         │
│   ─────────────────     │
│                         │
│   📝 Posts      ←button │
│                         │
└─────────────────────────┘
```

**Key Behaviors**:
- **No "Explorer" header** - links are always visible
- **Section links**: Direct links to section pages (flat, no collapse)
- **Posts button**: Navigates to `/posts` page, styled as a prominent button
- **No collapsible folders** - entire navigation is fixed and flat

### Sidebar Navigation (Mobile)

```
┌──────────────────────────────────────────┐
│  ☰ (menu icon at top-right)              │
└──────────────────────────────────────────┘
                    ↓ (on click)
┌──────────────────────────────────────────┐
│                                          │
│   About Me                               │
│   About Blog                             │
│   Questions                              │
│   Bookshelf                              │
│                                          │
│   ──────────────────────────────         │
│                                          │
│   📝 Posts                               │
│                                          │
└──────────────────────────────────────────┘
```

### Posts Page (`/posts`)

```
┌──────────────────────────────────────────────────────┐
│  Posts                                               │
│                                                      │
│  [All] [philosophy] [agency] [beliefs] [finance]    │  ← Tag filter bar
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │ Belief Agency                                   │ │
│  │ Dec 13, 2025 • #philosophy #agency              │ │
│  └────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────┐ │
│  │ Commodities in 2024                            │ │
│  │ Dec 10, 2025 • #finance #markets               │ │
│  └────────────────────────────────────────────────┘ │
│  ...                                                 │
└──────────────────────────────────────────────────────┘
```

---

## Implementation Approach

### Approach: Custom SidebarNav Component

**Strategy**: Create a new `SidebarNav` component that replaces the Explorer entirely.

**Why not modify Explorer?**
- Explorer is designed for file tree traversal
- We need a fundamentally different UI (flat links + single button)
- Custom component is simpler and more maintainable
- Avoids complex mapFn/filterFn/CSS hacks

**New Component Architecture**:

```
quartz/components/
├── SidebarNav.tsx              # New custom navigation component
├── styles/
│   └── sidebarNav.scss         # Styling for new component
└── scripts/
    └── sidebarNav.inline.ts    # Mobile menu toggle logic (if needed)
```

---

## Phase 1: Content Structure Setup

### 1.1 Create Content Directories

**Commands**:
```bash
cd /Users/pureicis/dev/saam.kim/content

# Create section folders
mkdir -p 01-about-me
mkdir -p 02-about-blog
mkdir -p 03-questions
mkdir -p 04-bookshelf

# Create posts container
mkdir -p posts
```

### 1.2 Migrate Existing Content

**Migration Map**:
| Source | Destination | Action |
|--------|-------------|--------|
| `about_blog.md` | `02-about-blog/index.md` | Move & wrap in folder |
| `01-commodities/` | `posts/002-commodities/` | Move to posts/ |
| `02-hfrl/` | `posts/003-hfrl/` | Move to posts/ |
| `03-belief-agency/` | `posts/001-belief-agency/` | Move to posts/ |
| `index.md` | `index.md` | Keep as-is (homepage) |

**Migration Commands**:
```bash
cd /Users/pureicis/dev/saam.kim/content

# Move existing posts to posts/ container
mv 01-commodities posts/002-commodities
mv 02-hfrl posts/003-hfrl  
mv 03-belief-agency posts/001-belief-agency

# Convert about_blog.md to folder structure
mkdir -p 02-about-blog
mv about_blog.md 02-about-blog/index.md
```

### 1.3 Create Section Page Content

**File**: `content/01-about-me/index.md`
```yaml
---
title: "About Me"
aliases:
  - about
  - author
tags:
  - meta
---

# About Me

[Content to be added]
```

**File**: `content/03-questions/index.md`
```yaml
---
title: "Questions"
aliases:
  - faq
tags:
  - meta
---

# Questions

[Content to be added]
```

**File**: `content/04-bookshelf/index.md`
```yaml
---
title: "Bookshelf"
aliases:
  - books
  - reading
tags:
  - meta
  - books
---

# Bookshelf

[Content to be added]
```

### 1.4 Create Posts Listing Page

**File**: `content/posts/index.md`
```yaml
---
title: "Posts"
aliases:
  - blog
  - articles
---
```

This page will render the `PostsListWithFilter` component.

---

## Phase 2: SidebarNav Component

### 2.1 Component Design

**File**: `quartz/components/SidebarNav.tsx`

```typescript
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { resolveRelative, FullSlug } from "../util/path"
import { classNames } from "../util/lang"
import style from "./styles/sidebarNav.scss"

// @ts-ignore
import script from "./scripts/sidebarNav.inline"

interface NavItem {
  title: string
  slug: string
  icon?: string
  isButton?: boolean
}

export interface SidebarNavOptions {
  sections: NavItem[]
  postsLink: NavItem
}

const defaultOptions: SidebarNavOptions = {
  sections: [
    { title: "About Me", slug: "01-about-me" },
    { title: "About Blog", slug: "02-about-blog" },
    { title: "Questions", slug: "03-questions" },
    { title: "Bookshelf", slug: "04-bookshelf" },
  ],
  postsLink: {
    title: "Posts",
    slug: "posts",
    icon: "📝",
    isButton: true,
  },
}

export default ((userOpts?: Partial<SidebarNavOptions>) => {
  const opts: SidebarNavOptions = { ...defaultOptions, ...userOpts }

  const SidebarNav: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
    const currentSlug = fileData.slug ?? ""
    
    // Helper to check if link is active
    const isActive = (slug: string) => {
      const simpleCurrent = currentSlug.split("/")[0]
      return simpleCurrent === slug || currentSlug.startsWith(slug + "/")
    }

    return (
      <nav class={classNames(displayClass, "sidebar-nav")}>
        {/* Mobile menu button */}
        <button
          type="button"
          class="sidebar-nav-toggle mobile-only"
          aria-label="Toggle navigation menu"
          aria-expanded="false"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="menu-icon"
          >
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="6" y2="6" />
            <line x1="4" x2="20" y1="18" y2="18" />
          </svg>
        </button>

        {/* Navigation content */}
        <div class="sidebar-nav-content">
          {/* Section links */}
          <ul class="nav-sections">
            {opts.sections.map((section) => {
              const href = resolveRelative(
                currentSlug as FullSlug,
                (section.slug + "/index") as FullSlug
              )
              return (
                <li class={isActive(section.slug) ? "active" : ""}>
                  <a href={href} data-for={section.slug}>
                    {section.icon && <span class="nav-icon">{section.icon}</span>}
                    {section.title}
                  </a>
                </li>
              )
            })}
          </ul>

          {/* Separator */}
          <hr class="nav-separator" />

          {/* Posts button */}
          <div class="nav-posts">
            <a
              href={resolveRelative(
                currentSlug as FullSlug,
                (opts.postsLink.slug + "/index") as FullSlug
              )}
              class={classNames(
                "posts-button",
                isActive(opts.postsLink.slug) ? "active" : ""
              )}
              data-for={opts.postsLink.slug}
            >
              {opts.postsLink.icon && (
                <span class="nav-icon">{opts.postsLink.icon}</span>
              )}
              {opts.postsLink.title}
            </a>
          </div>
        </div>
      </nav>
    )
  }

  SidebarNav.css = style
  SidebarNav.afterDOMLoaded = script

  return SidebarNav
}) satisfies QuartzComponentConstructor
```

### 2.2 Component Styles

**File**: `quartz/components/styles/sidebarNav.scss`

```scss
@use "../../styles/variables.scss" as *;

// ============================================
// Sidebar Navigation Component
// ============================================

.sidebar-nav {
  display: flex;
  flex-direction: column;
  
  // Mobile toggle button (hidden on desktop)
  .sidebar-nav-toggle {
    display: none;
  }
  
  // Navigation content
  .sidebar-nav-content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  // Section links list
  .nav-sections {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    
    li {
      margin: 0;
      
      a {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.4rem 0.75rem;
        color: var(--darkgray);
        text-decoration: none;
        border-radius: 4px;
        transition: all 0.15s ease;
        font-size: 0.95rem;
        
        &:hover {
          background-color: var(--lightgray);
          color: var(--dark);
        }
      }
      
      &.active a {
        color: var(--secondary);
        font-weight: 600;
        background-color: rgba(var(--secondary-rgb), 0.1);
      }
    }
  }
  
  // Separator line
  .nav-separator {
    margin: 0.75rem 0;
    border: none;
    border-top: 1px solid var(--lightgray);
  }
  
  // Posts button
  .nav-posts {
    .posts-button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.6rem 1rem;
      background-color: var(--secondary);
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 0.95rem;
      transition: all 0.15s ease;
      
      &:hover {
        background-color: var(--tertiary);
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      }
      
      &.active {
        background-color: var(--dark);
      }
    }
  }
  
  // Icon styling
  .nav-icon {
    font-size: 1.1em;
    line-height: 1;
  }
}

// ============================================
// Mobile Styles
// ============================================

@media all and ($mobile) {
  .sidebar-nav {
    position: relative;
    
    // Show mobile toggle button
    .sidebar-nav-toggle {
      display: flex;
      align-items: center;
      justify-content: center;
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 1001;
      background-color: var(--secondary);
      border: none;
      border-radius: 8px;
      padding: 0.5rem 0.75rem;
      cursor: pointer;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      
      .menu-icon {
        stroke: white;
        width: 24px;
        height: 24px;
      }
      
      &:hover {
        background-color: var(--tertiary);
      }
    }
    
    // Navigation content - hidden by default on mobile
    .sidebar-nav-content {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      background-color: var(--secondary);
      padding: 4rem 1.5rem 2rem 1.5rem;
      transform: translateY(-100%);
      transition: transform 300ms ease-in-out;
      border-bottom-left-radius: 12px;
      border-bottom-right-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      max-height: 70vh;
      overflow-y: auto;
    }
    
    // When nav is open
    &.nav-open {
      .sidebar-nav-content {
        transform: translateY(0);
      }
    }
    
    // Mobile link styles
    .nav-sections {
      li a {
        color: rgba(255, 255, 255, 0.9);
        padding: 0.75rem 1rem;
        font-size: 1.1rem;
        
        &:hover {
          background-color: rgba(255, 255, 255, 0.1);
          color: white;
        }
      }
      
      li.active a {
        background-color: rgba(255, 255, 255, 0.2);
        color: white;
      }
    }
    
    .nav-separator {
      border-top-color: rgba(255, 255, 255, 0.3);
    }
    
    .nav-posts {
      .posts-button {
        background-color: white;
        color: var(--secondary);
        font-size: 1.1rem;
        
        &:hover {
          background-color: rgba(255, 255, 255, 0.9);
        }
        
        &.active {
          background-color: var(--light);
        }
      }
    }
  }
  
  // Backdrop when nav is open
  .sidebar-nav.nav-open::before {
    content: "";
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    z-index: 999;
    animation: fadeIn 300ms ease-in-out forwards;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
}

// ============================================
// Desktop Right Sidebar Positioning
// ============================================

@media all and not ($mobile) {
  .sidebar.right .sidebar-nav {
    // Match Hugo sidebar styling
    padding: 0;
    
    .nav-sections li a {
      color: rgba(255, 255, 255, 0.8);
      
      &:hover {
        color: white;
        background-color: rgba(255, 255, 255, 0.1);
      }
    }
    
    .nav-sections li.active a {
      color: white;
      background-color: rgba(255, 255, 255, 0.15);
    }
    
    .nav-separator {
      border-top-color: rgba(255, 255, 255, 0.3);
    }
    
    .nav-posts .posts-button {
      background-color: white;
      color: var(--secondary);
      
      &:hover {
        background-color: rgba(255, 255, 255, 0.9);
      }
    }
  }
}
```

### 2.3 Mobile Toggle Script

**File**: `quartz/components/scripts/sidebarNav.inline.ts`

```typescript
function setupSidebarNav() {
  const nav = document.querySelector(".sidebar-nav") as HTMLElement
  if (!nav) return
  
  const toggleButton = nav.querySelector(".sidebar-nav-toggle") as HTMLButtonElement
  if (!toggleButton) return
  
  function toggleNav(e: Event) {
    e.preventDefault()
    e.stopPropagation()
    
    const isOpen = nav.classList.toggle("nav-open")
    toggleButton.setAttribute("aria-expanded", isOpen.toString())
    
    // Prevent body scroll when nav is open
    if (isOpen) {
      document.documentElement.classList.add("mobile-no-scroll")
    } else {
      document.documentElement.classList.remove("mobile-no-scroll")
    }
  }
  
  // Toggle button click
  toggleButton.addEventListener("click", toggleNav)
  window.addCleanup(() => toggleButton.removeEventListener("click", toggleNav))
  
  // Close nav when clicking on backdrop
  nav.addEventListener("click", (e: Event) => {
    const target = e.target as HTMLElement
    // Only close if clicking on the backdrop (::before pseudo-element area)
    if (target === nav && nav.classList.contains("nav-open")) {
      nav.classList.remove("nav-open")
      toggleButton.setAttribute("aria-expanded", "false")
      document.documentElement.classList.remove("mobile-no-scroll")
    }
  })
  
  // Close nav when clicking a link
  const links = nav.querySelectorAll("a")
  links.forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("nav-open")
      toggleButton.setAttribute("aria-expanded", "false")
      document.documentElement.classList.remove("mobile-no-scroll")
    })
  })
}

document.addEventListener("nav", () => {
  setupSidebarNav()
})
```

### 2.4 Export Component

**File**: `quartz/components/index.ts`

Add export for new component:

```typescript
// Add to existing exports
export { default as SidebarNav } from "./SidebarNav"
```

---

## Phase 3: Update PostsListWithFilter

### 3.1 Modify Component for /posts Page

The current `PostsListWithFilter` only renders on `index` page. We need to modify it to work on `/posts` page.

**File**: `quartz/components/PostsListWithFilter.tsx`

**Changes**:

```typescript
// Change line 31 from:
if (fileData.slug !== "index") {

// To:
if (fileData.slug !== "posts/index") {
```

Or better, make it configurable:

```typescript
interface PostsListWithFilterOptions {
  postsPerPage?: number
  excludeSlugs?: string[]
  showAboutSection?: boolean
  targetSlug?: string // NEW: Which page to render on
}

const defaultOptions: PostsListWithFilterOptions = {
  postsPerPage: 30,
  excludeSlugs: ["index", "about_blog", "bookshelf", "questions", "about"],
  showAboutSection: false, // Changed: Don't show about section on /posts
  targetSlug: "posts/index", // NEW: Render on /posts page
}

// In component render:
if (fileData.slug !== opts.targetSlug) {
  // Fall back to standard content rendering
  ...
}
```

### 3.2 Updated PostsListWithFilter Component

**File**: `quartz/components/PostsListWithFilter.tsx` (Full Updated Version)

```typescript
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { ComponentChildren } from "preact"
import { htmlToJsx } from "../util/jsx"
import { FullSlug, resolveRelative, getAllSegmentPrefixes } from "../util/path"
import { PageList, byDateAndAlphabetical } from "./PageList"
import { concatenateResources } from "../util/resources"
import style from "./styles/postsListWithFilter.scss"
// @ts-ignore
import script from "./scripts/tagFilter.inline"

interface PostsListWithFilterOptions {
  postsPerPage?: number
  excludeSlugs?: string[]
  showAboutSection?: boolean
  targetSlug?: string
}

const defaultOptions: PostsListWithFilterOptions = {
  postsPerPage: 30,
  excludeSlugs: ["index", "posts/index", "about_blog", "bookshelf", "questions", "about"],
  showAboutSection: false,
  targetSlug: "posts/index",
}

export default ((userOpts?: Partial<PostsListWithFilterOptions>) => {
  const opts = { ...defaultOptions, ...userOpts }

  const PostsListWithFilter: QuartzComponent = (props: QuartzComponentProps) => {
    const { fileData, allFiles, cfg, tree } = props

    // Only render on target page (default: /posts)
    if (fileData.slug !== opts.targetSlug) {
      // Fall back to standard content rendering for other pages
      const content = htmlToJsx(fileData.filePath!, tree) as ComponentChildren
      const classes: string[] = fileData.frontmatter?.cssclasses ?? []
      const classString = ["popover-hint", ...classes].join(" ")
      return <article class={classString}>{content}</article>
    }

    // Posts page specific rendering
    const content = htmlToJsx(fileData.filePath!, tree) as ComponentChildren

    // Filter posts to only include those under posts/ folder
    const postsPrefix = "posts/"
    
    // Get all unique tags from posts
    const allTags = [
      ...new Set(
        allFiles
          .filter((file) => {
            const slug = file.slug ?? ""
            return slug.startsWith(postsPrefix) && 
                   slug !== "posts/index" &&
                   !(opts.excludeSlugs ?? []).includes(slug)
          })
          .flatMap((data) => data.frontmatter?.tags ?? [])
          .flatMap(getAllSegmentPrefixes),
      ),
    ].sort((a, b) => a.localeCompare(b))

    // Filter posts (only posts/ folder, exclude certain slugs, require date)
    const blogPosts = allFiles
      .filter((file) => {
        const slug = file.slug ?? ""
        return (
          slug.startsWith(postsPrefix) &&
          slug !== "posts/index" &&
          !(opts.excludeSlugs ?? []).includes(slug) &&
          file.dates?.created !== undefined
        )
      })
      .sort(byDateAndAlphabetical(cfg))

    return (
      <div class="posts-list-with-filter">
        {/* Optional about section from posts/index.md content */}
        {opts.showAboutSection && content && (
          <>
            <article class="popover-hint about-section">{content}</article>
            <hr />
          </>
        )}

        {/* Posts section */}
        <div class="posts-section">
          {/* Tag filter bar */}
          <div class="tag-filter-bar" data-tag-filter>
            <a
              href="#"
              class="tag-filter-link active"
              data-tag="all"
              onClick={(e: Event) => e.preventDefault()}
            >
              All
            </a>
            {allTags.map((tag) => {
              const tagHref = resolveRelative(fileData.slug!, `tags/${tag}` as FullSlug)
              return (
                <a
                  href={tagHref}
                  class="tag-filter-link"
                  data-tag={tag}
                  onClick={(e: Event) => e.preventDefault()}
                >
                  {tag}
                </a>
              )
            })}
          </div>

          {/* Post list */}
          <div class="post-list-container" data-post-list>
            <PageList {...props} allFiles={blogPosts} />
          </div>
        </div>
      </div>
    )
  }

  PostsListWithFilter.css = concatenateResources(style, PageList.css)
  PostsListWithFilter.afterDOMLoaded = script

  return PostsListWithFilter
}) satisfies QuartzComponentConstructor
```

---

## Phase 4: Layout Configuration

### 4.1 Update quartz.layout.ts

**File**: `quartz.layout.ts`

```typescript
import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

// ============================================
// Shared Components (All Pages)
// ============================================

export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [
    Component.Flex({
      components: [
        { Component: Component.Search(), grow: true },
        { Component: Component.Darkmode() },
        { Component: Component.ReaderMode() },
      ],
    }),
  ],
  afterBody: [
    Component.Backlinks(),
    Component.Graph(),
  ],
  footer: Component.Footer({ links: {} }),
}

// ============================================
// Content Page Layout (Single Pages)
// ============================================

export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.ConditionalRender({
      component: Component.Breadcrumbs(),
      condition: (page) => page.fileData.slug !== "index",
    }),
    Component.ArticleTitle(),
    Component.ContentMeta(),
    Component.TagList(),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.DesktopOnly(Component.TableOfContents()),
  ],
  right: [
    // New SidebarNav component (replaces Explorer)
    Component.SidebarNav({
      sections: [
        { title: "About Me", slug: "01-about-me" },
        { title: "About Blog", slug: "02-about-blog" },
        { title: "Questions", slug: "03-questions" },
        { title: "Bookshelf", slug: "04-bookshelf" },
      ],
      postsLink: {
        title: "Posts",
        slug: "posts",
        icon: "📝",
        isButton: true,
      },
    }),
  ],
}

// ============================================
// List Page Layout (Tags, Folders)
// ============================================

export const defaultListPageLayout: PageLayout = {
  beforeBody: [
    Component.Breadcrumbs(),
    Component.ArticleTitle(),
    Component.ContentMeta(),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.DesktopOnly(Component.TableOfContents()),
  ],
  right: [
    Component.SidebarNav({
      sections: [
        { title: "About Me", slug: "01-about-me" },
        { title: "About Blog", slug: "02-about-blog" },
        { title: "Questions", slug: "03-questions" },
        { title: "Bookshelf", slug: "04-bookshelf" },
      ],
      postsLink: {
        title: "Posts",
        slug: "posts",
        icon: "📝",
        isButton: true,
      },
    }),
  ],
}
```

### 4.2 Posts Page Uses PostsListWithFilter

The `/posts` page will automatically render `PostsListWithFilter` because:

1. `posts/index.md` exists
2. Component checks `fileData.slug === "posts/index"`
3. If match, renders the tag filter + post list

To ensure this works, add PostsListWithFilter to content page layout:

```typescript
// In quartz.layout.ts - update defaultContentPageLayout

export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.ConditionalRender({
      component: Component.Breadcrumbs(),
      condition: (page) => page.fileData.slug !== "index" && page.fileData.slug !== "posts/index",
    }),
    // Only show title on non-posts pages
    Component.ConditionalRender({
      component: Component.ArticleTitle(),
      condition: (page) => page.fileData.slug !== "posts/index",
    }),
    Component.ContentMeta(),
    Component.TagList(),
    // PostsListWithFilter renders instead of Content on /posts page
    Component.PostsListWithFilter({
      targetSlug: "posts/index",
      showAboutSection: false,
    }),
  ],
  // ... rest of layout
}
```

**Alternative Approach**: Create a dedicated posts page layout in `quartz.config.ts`.

---

## Phase 5: Remove/Hide Explorer

### 5.1 Remove Explorer from Layout

Since we're replacing Explorer with SidebarNav, simply remove `Component.Explorer()` from the layout configurations. This is already done in Phase 4.

### 5.2 Clean Up Custom CSS

Remove any Explorer-specific custom CSS from `custom.scss` that's no longer needed.

---

## Phase 6: Quartz Relationship Features Verification

### 6.1 Wikilinks

**Between Section Pages**:
```markdown
<!-- In content/01-about-me/index.md -->
See also [[02-about-blog|my blog overview]].
```

**Between Posts**:
```markdown
<!-- In content/posts/001-belief-agency/index.md -->
This relates to [[posts/002-commodities|my commodities post]].
```

**Section to Post**:
```markdown
<!-- In content/01-about-me/index.md -->
Read [[posts/001-belief-agency|my thoughts on belief agency]].
```

✅ All link types work because Quartz resolves by slug.

### 6.2 Backlinks

- Visit `/01-about-me/` → Shows backlinks from posts that link to it
- Visit `/posts/001-belief-agency/` → Shows backlinks from sections and other posts

✅ Backlinks computed from link index.

### 6.3 Tags

**Posts have tags**:
```yaml
---
title: "Belief Agency"
tags:
  - philosophy
  - agency
---
```

**Tag pages generated at `/tags/philosophy/`** listing all tagged posts.

✅ Tags work from frontmatter parsing.

### 6.4 Graph View

- All section pages appear as nodes
- All posts appear as nodes
- Edges show link relationships

✅ Graph uses same link resolution.

### 6.5 Folder Listings

- `/posts/` shows PostsListWithFilter component
- Auto-generated subfolder listings still work if needed

✅ Folder pages work via FolderPage plugin.

### 6.6 Breadcrumbs

- `/posts/001-belief-agency/` → `Home > Posts > Belief Agency`
- `/01-about-me/` → `Home > About Me`

✅ Breadcrumbs use path structure.

### 6.7 Search

- Full-text search indexes all content
- Tag search works (`#philosophy`)
- Section pages and posts all searchable

✅ Search indexes all markdown content.

---

## Implementation Checklist

### Phase 1: Content Structure
- [ ] Create section folders (`01-about-me`, `02-about-blog`, `03-questions`, `04-bookshelf`)
- [ ] Create `posts/` container
- [ ] Migrate existing posts to `posts/001-*`, `002-*`, etc.
- [ ] Convert `about_blog.md` to folder structure
- [ ] Create section page `index.md` files
- [ ] Create `posts/index.md` for posts listing

### Phase 2: SidebarNav Component
- [ ] Create `quartz/components/SidebarNav.tsx`
- [ ] Create `quartz/components/styles/sidebarNav.scss`
- [ ] Create `quartz/components/scripts/sidebarNav.inline.ts`
- [ ] Export component in `quartz/components/index.ts`
- [ ] Test TypeScript compilation

### Phase 3: PostsListWithFilter Update
- [ ] Update component to render on `/posts` page
- [ ] Filter only posts from `posts/` folder
- [ ] Update exclude list for new structure
- [ ] Remove/adjust about section display

### Phase 4: Layout Configuration
- [ ] Update `quartz.layout.ts` with SidebarNav
- [ ] Remove Explorer from layouts
- [ ] Add PostsListWithFilter to content layout

### Phase 5: CSS Cleanup
- [ ] Remove Explorer-specific custom CSS
- [ ] Add any remaining SidebarNav styles
- [ ] Test mobile drawer functionality
- [ ] Test desktop sidebar styling

### Phase 6: Testing
- [ ] Build site successfully
- [ ] Test section page navigation
- [ ] Test Posts button → /posts page
- [ ] Test tag filtering on /posts
- [ ] Test wikilinks between pages
- [ ] Verify backlinks appear correctly
- [ ] Check graph view shows all pages
- [ ] Test search finds all content
- [ ] Test mobile menu functionality
- [ ] Test breadcrumbs on all pages

### Phase 7: Final Verification
- [ ] All pages accessible
- [ ] Navigation works on desktop and mobile
- [ ] Posts filtering works
- [ ] Relationship features preserved
- [ ] No console errors
- [ ] Clean build output

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Links break after migration** | Medium | High | Update all wikilinks; test thoroughly |
| **SidebarNav mobile issues** | Medium | Medium | Copy patterns from working Explorer mobile |
| **PostsListWithFilter breaks** | Low | High | Keep backup; test incrementally |
| **CSS conflicts** | Medium | Low | Scope styles carefully; remove old CSS |
| **Build fails** | Low | High | Test compilation after each change |

---

## File Summary

### New Files to Create
```
quartz/components/SidebarNav.tsx
quartz/components/styles/sidebarNav.scss
quartz/components/scripts/sidebarNav.inline.ts
content/01-about-me/index.md
content/03-questions/index.md
content/04-bookshelf/index.md
content/posts/index.md
```

### Files to Modify
```
quartz/components/index.ts           (add export)
quartz/components/PostsListWithFilter.tsx
quartz.layout.ts
quartz/styles/custom.scss           (cleanup)
```

### Files to Migrate
```
content/about_blog.md → content/02-about-blog/index.md
content/01-commodities/ → content/posts/002-commodities/
content/02-hfrl/ → content/posts/003-hfrl/
content/03-belief-agency/ → content/posts/001-belief-agency/
```

---

## Success Criteria

1. ✅ Section pages appear as flat links in sidebar (no collapse arrows)
2. ✅ "Posts" button navigates to `/posts` page
3. ✅ `/posts` page shows tag filter bar + post list
4. ✅ Mobile menu works as top-sliding drawer
5. ✅ All Quartz relationship features work (wikilinks, backlinks, tags, graph)
6. ✅ Clean build with no errors
7. ✅ Responsive design works at all breakpoints

---

## Estimated Effort

| Phase | Estimated Time |
|-------|----------------|
| Phase 1: Content Structure | 30 min |
| Phase 2: SidebarNav Component | 1-2 hours |
| Phase 3: PostsListWithFilter | 30 min |
| Phase 4: Layout Configuration | 30 min |
| Phase 5: CSS Cleanup | 30 min |
| Phase 6: Testing | 1 hour |
| **Total** | **4-5 hours** |

---

## Next Steps

1. ✅ Task plan approved
2. ⬜ Implement Phase 1 (Content Structure)
3. ⬜ Implement Phase 2 (SidebarNav Component)
4. ⬜ Implement Phase 3 (PostsListWithFilter)
5. ⬜ Implement Phase 4 (Layout Configuration)
6. ⬜ Implement Phase 5 (CSS Cleanup)
7. ⬜ Execute Phase 6 (Testing)
8. ⬜ Final verification and deployment

