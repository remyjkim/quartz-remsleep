# Task Plan: Explorer Component for Two-Layer Folder-Based Content

**Date**: 2025-01-13  
**Status**: Analysis & Planning (v2)  
**Priority**: High

---

## Problem Statement (Revised)

### New Content Architecture

After deeper consideration, the content structure will follow a **two-layer pattern**:

```
content/
├── index.md                         (Homepage)
│
├── 01-about-me/                     (Section Page)
│   └── index.md
├── 02-about-blog/                   (Section Page)
│   └── index.md
├── 03-questions/                    (Section Page)
│   └── index.md
├── 04-bookshelf/                    (Section Page)
│   └── index.md
│
└── posts/                           (Posts Container)
    ├── index.md                     (Posts listing page - optional)
    ├── 001-first-post/              (Blog Post)
    │   ├── index.md
    │   └── image.png                (Optional assets)
    ├── 002-second-post/             (Blog Post)
    │   └── index.md
    └── 003-third-post/              (Blog Post)
        └── index.md
```

### Two Content Types

#### 1. Section Pages (Root Level)
- **Location**: `content/01-about-me/index.md`, `content/02-about-blog/index.md`, etc.
- **Purpose**: Static navigation pages (About Me, About Blog, Questions, Bookshelf)
- **Explorer Display**: Flat links (no collapse arrow), shows title from frontmatter
- **Characteristics**:
  - Folder at content root
  - Contains only `index.md` (possibly with assets)
  - Uses numeric prefix for ordering (01-, 02-, etc.)

#### 2. Post Pages (Under /posts/)
- **Location**: `content/posts/001-first-post/index.md`
- **Purpose**: Blog posts, articles, thoughts
- **Explorer Display**: Shown under collapsible "Posts" folder, each post is a flat link
- **Characteristics**:
  - All posts under `posts/` container
  - Each post is a folder with `index.md`
  - Uses numeric prefix for chronological ordering (001-, 002-, etc.)
  - Can contain assets (images, PDFs)

### Desired Explorer Behavior

```
Explorer
├── About Me                   ← Section page (flat link, no ▼)
├── About Blog                 ← Section page (flat link, no ▼)
├── Questions                  ← Section page (flat link, no ▼)
├── Bookshelf                  ← Section page (flat link, no ▼)
└── Posts                      ← Collapsible folder (▼)
    ├── First Post Title       ← Post (flat link, shows frontmatter title)
    ├── Second Post Title      ← Post (flat link)
    └── Third Post Title       ← Post (flat link)
```

---

## Quartz Relationship Features Preservation

**Reference**: `.ai/frameworks/01_quartz_content_relationship.md`

The implementation MUST preserve all Quartz relationship management features:

### ✅ Features to Verify

| Feature | Description | Preservation Strategy |
|---------|-------------|----------------------|
| **Wikilinks** | `[[page]]`, `[[page\|title]]`, `[[page#heading]]` | Works automatically - links use slugs |
| **Backlinks** | Incoming link index per page | Works automatically - based on slug resolution |
| **Tags** | Frontmatter `tags: []` and inline `#tag` | Works automatically - parsed from index.md |
| **Graph View** | Visual knowledge graph | Works automatically - uses link index |
| **Folder Listings** | Auto-generated folder index pages | Works - `posts/` gets listing page |
| **Breadcrumbs** | Folder ancestry navigation | Works - shows `posts > Post Title` |
| **Search** | Full-text search with tag queries | Works - indexes all index.md content |
| **Popover Previews** | Hover link previews | Works - uses slug resolution |
| **TOC** | Table of contents per page | Works - parsed from headings |
| **Aliases** | `aliases: [alt-name]` for linking | Works - stored in frontmatter |
| **Permalinks** | `permalink: /custom-url` | Works - Quartz respects this |

### Link Examples

**Section-to-Post Link**:
```markdown
<!-- In content/01-about-me/index.md -->
Check out my [[posts/001-first-post|first post]] about this topic.
```

**Post-to-Section Link**:
```markdown
<!-- In content/posts/001-first-post/index.md -->
Learn more about me on the [[01-about-me|About Me]] page.
```

**Post-to-Post Link**:
```markdown
<!-- In content/posts/002-second-post/index.md -->
This builds on ideas from [[posts/001-first-post|my previous post]].
```

**All these create bidirectional relationships** that appear in:
- Backlinks section
- Graph view
- Search results

---

## Technical Analysis

### FileTrieNode Structure for New Architecture

**Trie after parsing content**:
```
Root (isFolder: true)
├── 01-about-me (isFolder: true, depth: 1)
│   └── index (isFolder: false, depth: 2)
├── 02-about-blog (isFolder: true, depth: 1)
│   └── index (isFolder: false, depth: 2)
├── 03-questions (isFolder: true, depth: 1)
│   └── index (isFolder: false, depth: 2)
└── posts (isFolder: true, depth: 1)
    ├── index (isFolder: false, depth: 2) [optional listing page]
    ├── 001-first-post (isFolder: true, depth: 2)
    │   └── index (isFolder: false, depth: 3)
    ├── 002-second-post (isFolder: true, depth: 2)
    │   └── index (isFolder: false, depth: 3)
    └── 003-third-post (isFolder: true, depth: 2)
        └── index (isFolder: false, depth: 3)
```

### Key Observations

1. **Section pages**: `slugSegments.length === 1` (root level folders)
2. **Posts container**: `slugSegments[0] === "posts"` and `slugSegments.length === 1`
3. **Post folders**: `slugSegments[0] === "posts"` and `slugSegments.length === 2`
4. **Index files to hide**: Any `index.md` child of a folder we want flattened

### Explorer Logic Requirements

```typescript
// Pseudocode for Explorer transformation
for each node in trie:
  if (isSectionPage(node)):
    // Root folder with index.md (not posts/)
    flattenAsLink(node)  // Show as "About Me" link
    
  else if (isPostsContainer(node)):
    // The posts/ folder itself
    keepAsFolder(node)   // Show as collapsible "Posts"
    
  else if (isPostFolder(node)):
    // Folder inside posts/ with index.md
    flattenAsLink(node)  // Show as "First Post" link inside Posts
```

---

## Approach Analysis (Updated)

### Approach 1: Unified mapFn + filterFn (Recommended)

**Strategy**: Single configuration that handles both Section Pages and Post Pages.

**Implementation**:

```typescript
// In quartz.layout.ts
Component.Explorer({
  title: "Navigation",
  folderClickBehavior: "link",
  folderDefaultState: "open",      // Posts folder starts open
  useSavedState: true,
  
  mapFn: (node) => {
    // CASE 1: Section Pages (root folders, not "posts")
    // e.g., 01-about-me, 02-about-blog
    if (node.isFolder && 
        node.slugSegments.length === 1 && 
        node.slugSegment !== "posts") {
      
      // Find index.md child and use its title
      const indexChild = node.children.find(
        c => c.slugSegment === "index" && !c.isFolder
      )
      if (indexChild?.data?.title) {
        node.displayName = indexChild.data.title
      }
    }
    
    // CASE 2: Post Folders (inside posts/)
    // e.g., posts/001-first-post
    if (node.isFolder && 
        node.slugSegments.length === 2 && 
        node.slugSegments[0] === "posts") {
      
      // Find index.md child and use its title  
      const indexChild = node.children.find(
        c => c.slugSegment === "index" && !c.isFolder
      )
      if (indexChild?.data?.title) {
        node.displayName = indexChild.data.title
      }
    }
    
    // CASE 3: Posts Container
    // Optionally rename "posts" to "Blog Posts" or similar
    if (node.isFolder && 
        node.slugSegment === "posts" && 
        node.slugSegments.length === 1) {
      node.displayName = "Posts"  // Or keep as-is
    }
  },
  
  filterFn: (node) => {
    // Filter out tags folder
    if (node.slugSegment === "tags") return false
    
    // Filter out root homepage index
    if (node.slugSegment === "index" && node.slugSegments.length === 1) {
      return false
    }
    
    // Filter out index.md in section folders (depth 2)
    // e.g., hide "index" inside "01-about-me/"
    if (node.slugSegment === "index" && 
        node.slugSegments.length === 2 && 
        node.slugSegments[0] !== "posts") {
      return false
    }
    
    // Filter out index.md in post folders (depth 3)
    // e.g., hide "index" inside "posts/001-first-post/"
    if (node.slugSegment === "index" && 
        node.slugSegments.length === 3 && 
        node.slugSegments[0] === "posts") {
      return false
    }
    
    // Keep posts/ listing page visible (optional)
    // Comment out to hide posts/index.md
    // if (node.slugSegment === "index" && 
    //     node.slugSegments.length === 2 && 
    //     node.slugSegments[0] === "posts") {
    //   return false
    // }
    
    return true
  },
  
  sortFn: (a, b) => {
    // Sort by display name (alphabetical with numeric ordering)
    if ((!a.isFolder && !b.isFolder) || (a.isFolder && b.isFolder)) {
      return a.displayName.localeCompare(b.displayName, undefined, {
        numeric: true,
        sensitivity: "base",
      })
    }
    // Posts folder at end? Or beginning?
    // Folders first (posts at bottom since it's a container)
    return a.isFolder ? -1 : 1
  },
  
  order: ["filter", "map", "sort"],
})
```

**Pros**:
- ✅ Single configuration handles both layers
- ✅ Uses frontmatter titles for all display names
- ✅ Posts folder stays collapsible
- ✅ No core changes
- ✅ Full relationship feature support

**Cons**:
- ⚠️ Complex conditional logic
- ⚠️ Still shows collapse arrows for empty folders (needs CSS)

**Complexity**: Medium ⭐⭐⭐  
**Maintenance**: Low ⭐  
**Feature Preservation**: High ⭐⭐⭐⭐

---

### Approach 2: Hybrid mapFn + CSS (Best Visual Result)

**Strategy**: mapFn for display names + CSS to hide collapse arrows.

**Additional CSS**:

```scss
// In custom.scss

// ============================================
// Explorer: Two-Layer Content Styling
// ============================================

.explorer {
  // Hide collapse arrows for folders with empty children
  // (Section pages and individual posts become flat links)
  .folder-outer:empty,
  .folder-outer > ul:empty {
    display: none !important;
  }
  
  // Section pages (root folders) - no collapse icon
  .folder-container:has(+ .folder-outer:empty),
  .folder-container:has(+ .folder-outer > ul:empty) {
    .folder-icon {
      display: none !important;
    }
    
    // Style as flat link
    a.folder-title {
      padding-left: 0;
      
      &:hover {
        color: var(--secondary);
      }
    }
  }
  
  // Posts container - keep collapse icon, style differently
  li:has(> .folder-container[data-folderpath^="posts/"]) {
    // Keep default folder styling
  }
  
  // Individual posts inside posts/ - no collapse icon  
  li li .folder-container:has(+ .folder-outer:empty) {
    .folder-icon {
      display: none !important;
    }
  }
}
```

**Result**:
```
Navigation
├── About Me                 ← No ▼, flat link
├── About Blog               ← No ▼, flat link
├── Questions                ← No ▼, flat link
├── Bookshelf                ← No ▼, flat link
└── Posts ▼                  ← Has ▼, collapsible
    ├── First Post Title     ← No ▼, flat link
    ├── Second Post Title    ← No ▼, flat link
    └── Third Post Title     ← No ▼, flat link
```

**Pros**:
- ✅ Perfect visual appearance
- ✅ Clean hierarchy distinction
- ✅ Full Quartz feature support
- ✅ Configuration-only (no core changes)

**Cons**:
- ⚠️ Requires both JS and CSS
- ⚠️ CSS selectors depend on DOM structure

**Complexity**: Medium ⭐⭐⭐  
**Maintenance**: Low ⭐⭐  
**Feature Preservation**: High ⭐⭐⭐⭐

---

## Detailed Implementation Plan

### Phase 1: Content Structure Setup

**Create folder structure**:
```bash
content/
├── index.md                    # Homepage
├── 01-about-me/
│   └── index.md
├── 02-about-blog/
│   └── index.md
├── 03-questions/
│   └── index.md
└── posts/
    ├── index.md                # Optional: posts listing
    └── 001-belief-agency/      # Move existing post
        └── index.md
```

**Example Section Page** (`content/01-about-me/index.md`):
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

Content here...

See my [[posts/001-belief-agency|thoughts on belief agency]].
```

**Example Post Page** (`content/posts/001-belief-agency/index.md`):
```yaml
---
title: "Belief Agency"
date: 2025-12-13
tags:
  - agency
  - beliefs
  - philosophy
aliases:
  - belief-agency
---

# Belief Agency

Content here...

Learn more about me on the [[01-about-me|About Me]] page.
```

### Phase 2: Explorer Configuration

**File**: `quartz.layout.ts`

```typescript
import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"
import { Options as ExplorerOptions } from "./quartz/components/Explorer"

// ============================================
// Explorer Functions for Two-Layer Content
// ============================================

/**
 * mapFn: Transform folder display names
 * - Section pages (root folders): Use index.md title
 * - Post folders (inside posts/): Use index.md title
 * - Posts container: Rename to "Posts"
 */
export const explorerMapFn: ExplorerOptions["mapFn"] = (node) => {
  const depth = node.slugSegments.length
  const isPostsFolder = node.slugSegments[0] === "posts"
  
  // CASE 1: Section Pages (root folders except posts/)
  if (node.isFolder && depth === 1 && !isPostsFolder) {
    const indexChild = node.children.find(
      c => c.slugSegment === "index" && !c.isFolder
    )
    if (indexChild?.data?.title) {
      node.displayName = indexChild.data.title
    }
  }
  
  // CASE 2: Posts Container - rename display
  if (node.isFolder && depth === 1 && isPostsFolder) {
    node.displayName = "Posts"
  }
  
  // CASE 3: Post Folders (inside posts/)
  if (node.isFolder && depth === 2 && isPostsFolder) {
    const indexChild = node.children.find(
      c => c.slugSegment === "index" && !c.isFolder
    )
    if (indexChild?.data?.title) {
      node.displayName = indexChild.data.title
    }
  }
}

/**
 * filterFn: Hide index.md files and tags folder
 * - Root index.md: Homepage (keep or hide based on preference)
 * - Section index.md: Hidden (parent folder shows title)
 * - Post index.md: Hidden (parent folder shows title)
 * - posts/index.md: Keep (serves as posts listing page)
 */
export const explorerFilterFn: ExplorerOptions["filterFn"] = (node) => {
  const depth = node.slugSegments.length
  const isIndex = node.slugSegment === "index"
  const isPostsPath = node.slugSegments[0] === "posts"
  
  // Filter out tags folder
  if (node.slugSegment === "tags") return false
  
  // Hide root homepage index (optional - set to true to show)
  if (isIndex && depth === 1) return false
  
  // Hide section page index.md (depth 2, not under posts/)
  if (isIndex && depth === 2 && !isPostsPath) return false
  
  // Hide post folder index.md (depth 3, under posts/)
  if (isIndex && depth === 3 && isPostsPath) return false
  
  // Keep everything else (including posts/index.md listing page)
  return true
}

/**
 * sortFn: Sort by display name with numeric ordering
 * Posts folder goes last, sections sorted alphabetically
 */
export const explorerSortFn: ExplorerOptions["sortFn"] = (a, b) => {
  // Posts folder goes to end
  if (a.slugSegment === "posts" && b.slugSegment !== "posts") return 1
  if (b.slugSegment === "posts" && a.slugSegment !== "posts") return -1
  
  // Sort by display name (alphabetically with numeric awareness)
  if ((!a.isFolder && !b.isFolder) || (a.isFolder && b.isFolder)) {
    return a.displayName.localeCompare(b.displayName, undefined, {
      numeric: true,
      sensitivity: "base",
    })
  }
  
  // Folders before files (within same level)
  return a.isFolder ? -1 : 1
}

// ============================================
// Layout Configuration
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
    Component.Explorer({
      title: "Navigation",
      folderClickBehavior: "link",
      folderDefaultState: "open",
      useSavedState: true,
      mapFn: explorerMapFn,
      filterFn: explorerFilterFn,
      sortFn: explorerSortFn,
      order: ["filter", "map", "sort"],
    }),
  ],
}

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
    Component.Explorer({
      title: "Navigation",
      folderClickBehavior: "link",
      folderDefaultState: "open",
      useSavedState: true,
      mapFn: explorerMapFn,
      filterFn: explorerFilterFn,
      sortFn: explorerSortFn,
      order: ["filter", "map", "sort"],
    }),
  ],
}
```

### Phase 3: Custom CSS

**File**: `quartz/styles/custom.scss`

Add to existing custom.scss:

```scss
// ============================================
// Explorer: Two-Layer Folder Structure Styling
// ============================================

.explorer {
  // --- Empty Folder Detection ---
  // Hide empty folder containers (for folders that only had index.md)
  .folder-outer:empty,
  .folder-outer > ul:empty {
    display: none !important;
    height: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
  }
  
  // --- Section Pages (Root Level Folders) ---
  // Remove collapse arrow and style as flat links
  > .explorer-content > ul > li > .folder-container:has(+ .folder-outer:empty),
  > .explorer-content > ul > li > .folder-container:has(+ .folder-outer > ul:empty) {
    // Hide the collapse arrow
    .folder-icon {
      display: none !important;
    }
    
    // Style folder title as flat link
    a.folder-title,
    button.folder-button span {
      padding-left: 0 !important;
      font-weight: 400;
      color: var(--darkgray);
      
      &:hover {
        color: var(--secondary);
        text-decoration: none;
      }
    }
    
    // Remove indent from section pages
    margin-left: 0;
    padding-left: 0;
  }
  
  // --- Posts Container ---
  // Keep the collapse arrow, but style differently
  > .explorer-content > ul > li:has([data-folderpath="posts/index"]) {
    // Posts folder styling
    > .folder-container {
      .folder-title,
      .folder-button span {
        font-weight: 600;
        color: var(--dark);
      }
    }
  }
  
  // --- Individual Posts (Inside posts/) ---
  // Remove collapse arrow for post folders
  > .explorer-content > ul > li > .folder-outer > ul > li {
    // Post item inside posts/ folder
    > .folder-container:has(+ .folder-outer:empty),
    > .folder-container:has(+ .folder-outer > ul:empty) {
      .folder-icon {
        display: none !important;
      }
      
      a.folder-title,
      button.folder-button span {
        padding-left: 0 !important;
        color: var(--darkgray);
        
        &:hover {
          color: var(--secondary);
        }
      }
    }
  }
  
  // --- Overall Explorer Styling ---
  // Reduce nesting visual noise
  .explorer-ul {
    list-style: none;
    padding-left: 0;
    
    ul {
      padding-left: 1rem;
    }
  }
}
```

### Phase 4: Content Migration

**Current structure**:
```
content/
├── 01-commodities/
├── 02-hfrl/
├── 03-belief-agency/
│   └── index.md
├── about_blog.md
└── index.md
```

**Target structure**:
```
content/
├── index.md                    (Keep - Homepage)
├── 01-about-me/                (New - Section)
│   └── index.md
├── 02-about-blog/              (Migrate from about_blog.md)
│   └── index.md
├── 03-questions/               (New - Section)
│   └── index.md
└── posts/                      (New - Container)
    ├── index.md                (New - Posts listing)
    ├── 001-commodities/        (Migrate from 01-commodities/)
    │   └── index.md
    ├── 002-hfrl/               (Migrate from 02-hfrl/)
    │   └── index.md
    └── 003-belief-agency/      (Migrate from 03-belief-agency/)
        └── index.md
```

**Migration commands**:
```bash
cd /Users/pureicis/dev/saam.kim/content

# Create new sections
mkdir -p 01-about-me
mkdir -p 02-about-blog
mkdir -p 03-questions

# Create posts container
mkdir -p posts

# Migrate existing posts to posts/
mv 01-commodities posts/001-commodities
mv 02-hfrl posts/002-hfrl
mv 03-belief-agency posts/003-belief-agency

# Migrate about_blog.md to folder structure
mv about_blog.md 02-about-blog/index.md

# Create section index files (manual content creation needed)
# 01-about-me/index.md
# 03-questions/index.md
# posts/index.md
```

### Phase 5: Testing

**Test Matrix**:

| Test Case | Expected Result | Verifies |
|-----------|-----------------|----------|
| Section page in Explorer | Shows title, no ▼, links to page | mapFn + filterFn + CSS |
| Posts folder in Explorer | Shows "Posts" with ▼, collapsible | mapFn |
| Post in Explorer | Shows title, no ▼, links to post | mapFn + filterFn + CSS |
| Click section link | Navigates to section page | folderClickBehavior |
| Click post link | Navigates to post page | folderClickBehavior |
| Wikilink section→post | `[[posts/001-belief-agency\|link]]` works | Quartz links |
| Wikilink post→section | `[[01-about-me\|About Me]]` works | Quartz links |
| Backlinks on section | Shows posts linking to it | Backlinks component |
| Backlinks on post | Shows sections/posts linking to it | Backlinks component |
| Graph view | Shows all pages connected | Graph component |
| Search for section | Finds section page | Search |
| Search for post | Finds post page | Search |
| Search by tag | `#philosophy` finds tagged posts | Tag search |
| Breadcrumbs on post | Shows `Posts > Post Title` | Breadcrumbs |
| Folder listing `/posts/` | Shows list of all posts | FolderPage |
| Mobile drawer | Shows same navigation hierarchy | Responsive CSS |

---

## Relationship Feature Verification

### Wikilinks

**From Section to Post**:
```markdown
<!-- In content/01-about-me/index.md -->
Read my [[posts/001-belief-agency|thoughts on belief agency]].
```

**From Post to Section**:
```markdown
<!-- In content/posts/001-belief-agency/index.md -->
More about me on [[01-about-me|the About page]].
```

**From Post to Post**:
```markdown
<!-- In content/posts/002-hfrl/index.md -->
Building on [[posts/001-belief-agency|previous ideas]]...
```

✅ All link types work because Quartz resolves by slug, not folder structure.

### Backlinks

When viewing `/01-about-me/`:
```
Backlinks
• posts/001-belief-agency - "More about me on the About page."
```

When viewing `/posts/001-belief-agency/`:
```
Backlinks
• 01-about-me - "Read my thoughts on belief agency."
• posts/002-hfrl - "Building on previous ideas..."
```

✅ Backlinks work because they're computed from the link index.

### Tags

**Post with tags**:
```yaml
---
title: "Belief Agency"
tags:
  - philosophy
  - agency
  - decision-making
---
```

**Tag page at `/tags/philosophy/`**:
- Lists all posts tagged `#philosophy`
- Accessible via Explorer or direct URL

✅ Tags work because they're parsed from frontmatter in index.md.

### Graph View

- All section pages appear as nodes
- All posts appear as nodes
- Edges connect linked pages
- Clicking a node navigates to that page

✅ Graph works because it uses the same link resolution.

### Folder Listings

**URL `/posts/`** (if posts/index.md exists):
- Shows custom content from index.md
- Lists all posts in the folder

**URL `/posts/`** (if posts/index.md doesn't exist):
- Shows auto-generated "Folder: posts" page
- Lists all posts alphabetically

✅ Folder listings work via FolderPage plugin.

### Breadcrumbs

**On `/posts/001-belief-agency/`**:
```
Home > Posts > Belief Agency
```

**On `/01-about-me/`**:
```
Home > About Me
```

✅ Breadcrumbs work via standard path resolution.

---

## Edge Cases

### Edge Case 1: Post with Assets

**Structure**:
```
content/posts/001-belief-agency/
├── index.md
├── diagram.png
└── data.json
```

**Behavior**:
- `children.length > 1` so folder shows with children
- CSS detects non-empty folder-outer, keeps arrow
- Assets accessible via relative links in markdown

**Solution**: Only hide arrow if folder-outer is truly empty (CSS `:has(+ .folder-outer:empty)`)

### Edge Case 2: Deep Nesting Inside Post

**Structure**:
```
content/posts/001-belief-agency/
├── index.md
└── images/
    ├── fig1.png
    └── fig2.png
```

**Behavior**:
- `images/` subfolder appears in Explorer
- This might be unwanted

**Solution**: Additional filterFn rule to hide non-index subfolders:
```typescript
// Hide asset folders inside posts
if (node.isFolder && 
    node.slugSegments.length > 2 && 
    node.slugSegments[0] === "posts") {
  return false
}
```

### Edge Case 3: Section with Multiple Pages

**Structure**:
```
content/01-about-me/
├── index.md
└── extended-bio.md
```

**Behavior**:
- Folder has multiple children
- Should show as collapsible folder, not flat link

**Solution**: Current CSS handles this (only hides arrow for empty folders)

### Edge Case 4: Posts Listing Page

**Structure**:
```
content/posts/
├── index.md        ← This is the listing page
├── 001-first/
│   └── index.md
└── 002-second/
    └── index.md
```

**Behavior**:
- `posts/index.md` appears in Explorer under Posts folder
- Shows alongside post folders

**Options**:
1. Keep it (user can click "index" to see listing)
2. Hide it via filterFn (folder listing still accessible via URL)
3. Rename to something meaningful ("All Posts")

**Recommended**: Hide in Explorer, let folder auto-generate listing:
```typescript
// Hide posts listing index
if (isIndex && depth === 2 && isPostsPath) return false
```

---

## Implementation Checklist

### Phase 1: Content Structure
- [ ] Create `content/01-about-me/index.md`
- [ ] Create `content/02-about-blog/index.md` (migrate from `about_blog.md`)
- [ ] Create `content/03-questions/index.md`
- [ ] Create `content/posts/` directory
- [ ] Create `content/posts/index.md` (optional listing page)
- [ ] Move existing posts to `content/posts/001-*`, `002-*`, etc.
- [ ] Update any internal links to new paths

### Phase 2: Explorer Configuration
- [ ] Add `explorerMapFn` to `quartz.layout.ts`
- [ ] Add `explorerFilterFn` to `quartz.layout.ts`
- [ ] Add `explorerSortFn` to `quartz.layout.ts`
- [ ] Update `Component.Explorer()` in both layout configs
- [ ] Verify TypeScript compilation

### Phase 3: CSS Styling
- [ ] Add section page CSS (hide arrows)
- [ ] Add posts container CSS (keep arrows)
- [ ] Add post folder CSS (hide arrows)
- [ ] Test at all breakpoints
- [ ] Verify mobile drawer styling

### Phase 4: Feature Verification
- [ ] Test wikilinks between sections and posts
- [ ] Verify backlinks appear correctly
- [ ] Check tags work on posts
- [ ] Verify graph shows all pages
- [ ] Test search finds all content
- [ ] Verify breadcrumbs are correct
- [ ] Test folder listing at `/posts/`

### Phase 5: Edge Cases
- [ ] Test post with assets
- [ ] Test section with multiple files
- [ ] Test deep nesting (if needed)
- [ ] Verify homepage still works

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Links break after migration** | Medium | High | Update all wikilinks before deploying |
| **Explorer shows wrong titles** | Low | Medium | Thorough mapFn testing |
| **CSS selectors too fragile** | Medium | Low | Use robust `:has()` patterns |
| **Backlinks not computed** | Low | High | Verify slug resolution |
| **Graph incomplete** | Low | Medium | Check contentIndex generation |
| **Mobile drawer broken** | Low | Medium | Test responsive CSS |

---

## Summary

### Content Architecture

```
content/
├── index.md                 # Homepage
├── 01-about-me/             # Section Pages (flat in Explorer)
│   └── index.md
├── 02-about-blog/
│   └── index.md
├── 03-questions/
│   └── index.md
└── posts/                   # Posts Container (collapsible)
    ├── 001-first-post/      # Post Pages (flat inside Posts)
    │   └── index.md
    └── 002-second-post/
        └── index.md
```

### Explorer Result

```
Navigation
├── About Me                 (flat link → /01-about-me/)
├── About Blog               (flat link → /02-about-blog/)
├── Questions                (flat link → /03-questions/)
└── Posts ▼                  (collapsible)
    ├── First Post Title     (flat link → /posts/001-first-post/)
    └── Second Post Title    (flat link → /posts/002-second-post/)
```

### Quartz Features Preserved

✅ Wikilinks  
✅ Backlinks  
✅ Tags  
✅ Graph View  
✅ Folder Listings  
✅ Breadcrumbs  
✅ Search  
✅ Popover Previews  
✅ Aliases/Permalinks  

### Implementation Approach

**Recommended**: Approach 2 (Hybrid mapFn + CSS)
- mapFn: Transform display names
- filterFn: Hide index.md files
- CSS: Hide collapse arrows for flat items

---

## Next Steps

1. ✅ Task plan approved
2. ⬜ Implement content structure migration
3. ⬜ Update `quartz.layout.ts` with Explorer config
4. ⬜ Add CSS for Explorer styling
5. ⬜ Test all relationship features
6. ⬜ Verify mobile/desktop views
7. ⬜ Deploy and monitor
