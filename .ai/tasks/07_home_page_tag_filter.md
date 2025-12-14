# Task Plan: Home Page Tag Filter Implementation

**Date**: 2025-12-13  
**Status**: Planning  
**Priority**: Medium

---

## Table of Contents
1. [Overview](#overview)
2. [Visual Analysis](#visual-analysis)
3. [Technical Analysis](#technical-analysis)
4. [Implementation Strategy](#implementation-strategy)
5. [Detailed Implementation Steps](#detailed-implementation-steps)
6. [Files to Modify/Create](#files-to-modifycreate)
7. [Testing Plan](#testing-plan)
8. [Alternative Approaches](#alternative-approaches)
9. [References](#references)

---

## Overview

### Goal
Add a clickable tag filter bar above the blog post list on the home page (index) that allows users to filter posts by category/tag, similar to the implementation in `www.remyjkim.com`.

### User Story
As a reader, I want to click on tags above the post list to filter posts by topic, so I can quickly find content relevant to my interests without scrolling through all posts.

### Success Criteria
1. ✅ Tag filter bar displays above the post list on the home page
2. ✅ Shows "All" link plus all unique tags from blog posts
3. ✅ Clicking a tag filters the post list to show only posts with that tag
4. ✅ Clicking "All" shows all posts (resets filter)
5. ✅ Visual styling matches the Quartz theme and is mobile-responsive
6. ✅ Works with Quartz SPA navigation (client-side routing)
7. ✅ Maintains current sort order (by date, descending)

---

## Visual Analysis

### Reference Implementation (www.remyjkim.com)

**Location**: Hugo site at `/Users/pureicis/dev/www.remyjkim.com/`

**Visual Structure**:
```
┌─────────────────────────────────────────┐
│ About Blog                              │
│ [intro content]                         │
├─────────────────────────────────────────┤
│ Posts                                   │
│ All  thoughts  book-reviews  misc       │ ← Tag Filter Bar
│                                         │
│ Jan 06, 2025  thoughts                  │
│ Human Feedback Reinforcement Learning   │
│                                         │
│ May 01, 2024  thoughts                  │
│ Geopolitics Behind Bitcoin...           │
│ ...                                     │
└─────────────────────────────────────────┘
```

**Implementation Details** (from `layouts/index.html`):

```html
<!-- Lines 23-29 -->
<div class="category-filter">
  <a href="/">All</a>
  {{ range .Site.Taxonomies.categories }}
    <a href="{{ .Page.Permalink }}">{{ .Page.Title }}</a>
  {{ end }}
</div>
```

**CSS Styling** (from `assets/css/custom.css`):

```css
/* Lines 33-47 */
.category-filter {
  margin: 0.25rem 0 3rem 0;
  font-size: 0.9em;
}

.category-filter a {
  margin-right: 1rem;
  color: #add8e6;  /* Light blue */
  text-decoration: none;
}

.category-filter a:hover {
  text-decoration: underline;
}
```

**Key Observations**:
1. Simple horizontal list of links
2. Minimal styling - just spacing and color
3. "All" link goes to home page (`/`)
4. Each category link goes to a taxonomy page (`/categories/{name}`)
5. Server-side filtering (page navigation, not JS)
6. Located directly below "Posts" heading

---

## Technical Analysis

### Current Quartz Home Page Architecture

**Content Structure**:
- Home page: `content/index.md` 
- Layout type: Uses `layout: page` frontmatter
- Component: Renders via `Content.tsx` (standard page content)

**Layout Configuration** (`quartz.layout.ts`):
```typescript
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
  // ...
}
```

**Relevant Existing Components**:

1. **TagList.tsx** (Lines 1-57)
   - Displays tags for a single page
   - Renders horizontal list of tag links
   - Each tag links to `/tags/{tag}`
   - Already has styling for tag badges
   - CSS class: `.tags`

2. **TagContent.tsx** (Lines 1-134)
   - Handles tag index page (`/tags`)
   - Shows all tags and posts under each tag
   - Has access to all tags via `allFiles`
   - Lines 46-54: Generates unique tag list
   ```typescript
   const tags = [
     ...new Set(
       allFiles.flatMap((data) => data.frontmatter?.tags ?? [])
         .flatMap(getAllSegmentPrefixes)
     ),
   ].sort((a, b) => a.localeCompare(b))
   ```

3. **PageList.tsx** (Lines 1-115)
   - Renders list of pages
   - Takes `allFiles` prop which can be filtered
   - Shows date, title, and tags for each post
   - Uses `section-ul` and `section-li` CSS classes

4. **RecentNotes.tsx** (Lines 1-93)
   - Shows recent posts with filtering capability
   - Has `filter` option for custom filtering
   - Shows tags below each post
   - Could be used as reference for filtering logic

### Quartz Component Architecture

**Component Type**: Need to create a custom component

**Component Pattern**:
```typescript
export default ((userOpts?: Partial<Options>) => {
  const ComponentName: QuartzComponent = (props: QuartzComponentProps) => {
    // Component JSX
    return <div>...</div>
  }
  
  ComponentName.css = style
  ComponentName.afterDOMLoaded = script  // For client-side interactivity
  
  return ComponentName
}) satisfies QuartzComponentConstructor
```

**Props Available** (`QuartzComponentProps`):
- `fileData`: Current page metadata (frontmatter, slug, etc.)
- `allFiles`: All pages in the site (array of `QuartzPluginData`)
- `cfg`: Site configuration
- `tree`: HTML AST of page content
- `ctx`: Build context

**Script Handling for Interactivity**:
- Quartz is a static site with SPA navigation
- Need `.inline.ts` script for client-side filtering
- Script must handle `"nav"` event for SPA transitions
- Reference: `search.inline.ts` for filtering patterns

---

## Implementation Strategy

### Approach: Custom Component with Client-Side Filtering

**Why Not Server-Side (Hugo Approach)?**
- Quartz is static - can't navigate to filtered URLs on build
- Tag pages (`/tags/{tag}`) already exist, but we want inline filtering
- Better UX: instant filtering without page reload
- Consistent with Quartz's SPA navigation

**Architecture Decision**: Two-Component Approach

1. **HomePageList Component** (new)
   - Replaces standard `Content` component on home page
   - Renders tag filter bar + paginated post list
   - Similar structure to `TagContent.tsx` but for home page
   - TSX file: `quartz/components/HomePageList.tsx`

2. **TagFilter Script** (new)
   - Client-side JavaScript for filtering
   - Listens to tag clicks
   - Shows/hides posts based on selected tag
   - Inline script: `quartz/components/scripts/tagFilter.inline.ts`

**Alternative Considered**: Modify `Content.tsx` to detect home page
- ❌ Rejected: Too invasive, breaks single responsibility principle
- ❌ Content.tsx should stay generic

---

## Detailed Implementation Steps

### Phase 1: Create HomePageList Component (TSX)

**File**: `quartz/components/HomePageList.tsx`

**Responsibilities**:
1. Check if current page is the home page (`slug === "index"`)
2. If not home page, fall back to standard `Content` component
3. If home page:
   - Render "About Blog" content from `index.md`
   - Render "Posts" heading
   - Render tag filter bar (All + all unique tags)
   - Render paginated list of blog posts

**Implementation Details**:

```typescript
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { ComponentChildren } from "preact"
import { htmlToJsx } from "../util/jsx"
import { FullSlug, resolveRelative, getAllSegmentPrefixes } from "../util/path"
import { PageList } from "./PageList"
import { byDateAndAlphabetical } from "./PageList"
import { concatenateResources } from "../util/resources"
import style from "./styles/homePageList.scss"
// @ts-ignore
import script from "./scripts/tagFilter.inline"

interface HomePageListOptions {
  postsPerPage?: number
  excludeSlugs?: string[]  // Slugs to exclude from post list (e.g., "index", "about_blog")
}

const defaultOptions: HomePageListOptions = {
  postsPerPage: 30,
  excludeSlugs: ["index", "about_blog", "bookshelf", "questions", "about"],
}

export default ((userOpts?: Partial<HomePageListOptions>) => {
  const opts = { ...defaultOptions, ...userOpts }
  
  const HomePageList: QuartzComponent = (props: QuartzComponentProps) => {
    const { fileData, allFiles, cfg, tree } = props
    
    // Only render on home page
    if (fileData.slug !== "index") {
      // Fall back to standard content rendering
      const content = htmlToJsx(fileData.filePath!, tree) as ComponentChildren
      const classes: string[] = fileData.frontmatter?.cssclasses ?? []
      const classString = ["popover-hint", ...classes].join(" ")
      return <article class={classString}>{content}</article>
    }
    
    // Home page specific rendering
    const content = htmlToJsx(fileData.filePath!, tree) as ComponentChildren
    
    // Get all unique tags from all posts
    const allTags = [
      ...new Set(
        allFiles
          .filter(file => !opts.excludeSlugs.includes(file.slug ?? ""))
          .flatMap((data) => data.frontmatter?.tags ?? [])
          .flatMap(getAllSegmentPrefixes)
      ),
    ].sort((a, b) => a.localeCompare(b))
    
    // Filter posts (exclude certain slugs)
    const blogPosts = allFiles
      .filter(file => {
        const slug = file.slug ?? ""
        return !opts.excludeSlugs.includes(slug) && 
               file.dates?.created !== undefined  // Has a date
      })
      .sort(byDateAndAlphabetical(cfg))
    
    return (
      <div class="home-page-list">
        {/* About Blog section */}
        <article class="popover-hint about-blog">
          {content}
        </article>
        
        <hr />
        
        {/* Posts section */}
        <div class="posts-section">
          <h2 class="posts-heading">Posts</h2>
          
          {/* Tag filter bar */}
          <div class="tag-filter-bar" data-tag-filter>
            <a 
              href="#" 
              class="tag-filter-link active" 
              data-tag="all"
              onClick={(e) => {
                e.preventDefault()
              }}
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
                  onClick={(e) => {
                    e.preventDefault()
                  }}
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
  
  HomePageList.css = concatenateResources(style, PageList.css)
  HomePageList.afterDOMLoaded = script
  
  return HomePageList
}) satisfies QuartzComponentConstructor
```

**Key Design Decisions**:
1. **Conditional Rendering**: Only activates on home page (slug === "index")
2. **Tag Collection**: Uses same pattern as `TagContent.tsx` (lines 46-54)
3. **Post Filtering**: Excludes utility pages (about, bookshelf, etc.)
4. **Data Attributes**: Uses `data-*` attributes for script targeting
5. **Fallback**: Returns standard content for non-home pages
6. **Prevent Default**: `onClick` prevents navigation, handled by script

---

### Phase 2: Create TagFilter Script (Client-Side JS)

**File**: `quartz/components/scripts/tagFilter.inline.ts`

**Responsibilities**:
1. Listen for clicks on tag filter links
2. Update active state (visual feedback)
3. Filter post list based on selected tag
4. Handle "All" to show all posts
5. Persist selected tag in URL hash (optional)
6. Re-initialize on SPA navigation

**Implementation Details**:

```typescript
import { registerEscapeHandler } from "./util"

function initTagFilter() {
  const filterBar = document.querySelector('[data-tag-filter]')
  const postList = document.querySelector('[data-post-list]')
  
  if (!filterBar || !postList) {
    return  // Not on home page or elements not found
  }
  
  const filterLinks = filterBar.querySelectorAll('.tag-filter-link')
  const postItems = postList.querySelectorAll('.section-li')
  
  // Create a map of post items to their tags
  const postTagMap = new Map<Element, Set<string>>()
  
  postItems.forEach((item) => {
    const tagElements = item.querySelectorAll('.tag-link')
    const tags = new Set<string>()
    
    tagElements.forEach((tagEl) => {
      const tagText = tagEl.textContent?.trim()
      if (tagText) {
        tags.add(tagText)
      }
    })
    
    postTagMap.set(item, tags)
  })
  
  // Filter function
  function filterPosts(selectedTag: string) {
    if (selectedTag === 'all') {
      // Show all posts
      postItems.forEach((item) => {
        ;(item as HTMLElement).style.display = ''
      })
    } else {
      // Filter by tag
      postItems.forEach((item) => {
        const tags = postTagMap.get(item)
        const shouldShow = tags?.has(selectedTag) ?? false
        ;(item as HTMLElement).style.display = shouldShow ? '' : 'none'
      })
    }
  }
  
  // Update active state
  function updateActiveLink(targetLink: Element) {
    filterLinks.forEach((link) => {
      link.classList.remove('active')
    })
    targetLink.classList.add('active')
  }
  
  // Attach click handlers
  filterLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault()
      const target = e.currentTarget as HTMLElement
      const selectedTag = target.getAttribute('data-tag')
      
      if (!selectedTag) return
      
      updateActiveLink(target)
      filterPosts(selectedTag)
      
      // Optional: Update URL hash for shareable links
      if (selectedTag === 'all') {
        window.history.replaceState(null, '', window.location.pathname)
      } else {
        window.history.replaceState(null, '', `${window.location.pathname}#tag=${selectedTag}`)
      }
    })
  })
  
  // Initialize from URL hash on page load
  const hash = window.location.hash
  if (hash.startsWith('#tag=')) {
    const tagFromHash = hash.substring(5)
    const matchingLink = Array.from(filterLinks).find(
      (link) => link.getAttribute('data-tag') === tagFromHash
    )
    
    if (matchingLink) {
      updateActiveLink(matchingLink)
      filterPosts(tagFromHash)
    }
  }
}

// Initialize on page load
document.addEventListener("nav", () => {
  initTagFilter()
})

// Also run on initial page load (before SPA navigation)
window.addEventListener("load", () => {
  initTagFilter()
})
```

**Key Design Decisions**:
1. **Post-Tag Mapping**: Builds map on init for efficient filtering
2. **Display Toggle**: Uses `display: none` for hiding posts
3. **URL Hash**: Persists filter in URL for sharing (optional)
4. **SPA Navigation**: Re-initializes on `"nav"` event
5. **Graceful Degradation**: If JS fails, all posts shown
6. **Active State**: Visual feedback via `.active` class

---

### Phase 3: Create Styles

**File**: `quartz/components/styles/homePageList.scss`

**Responsibilities**:
1. Style the tag filter bar
2. Ensure mobile responsiveness
3. Match Quartz theme colors
4. Add hover/active states

**Implementation Details**:

```scss
.home-page-list {
  .about-blog {
    margin-bottom: 2rem;
  }
  
  hr {
    margin: 2rem 0;
  }
  
  .posts-section {
    .posts-heading {
      margin-bottom: 0.5rem;
    }
    
    .tag-filter-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin: 0.5rem 0 2rem 0;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--gray);
      
      .tag-filter-link {
        font-size: 0.9rem;
        color: var(--secondary);
        text-decoration: none;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        transition: all 0.2s ease;
        
        &:hover {
          color: var(--tertiary);
          background-color: var(--highlight);
        }
        
        &.active {
          color: var(--dark);
          background-color: var(--secondary);
          font-weight: 600;
        }
      }
    }
    
    .post-list-container {
      // Inherits styles from PageList.css
    }
  }
}

// Mobile responsiveness
@media (max-width: 600px) {
  .home-page-list {
    .tag-filter-bar {
      gap: 0.5rem;
      
      .tag-filter-link {
        font-size: 0.85rem;
        padding: 0.2rem 0.4rem;
      }
    }
  }
}
```

**Key Design Decisions**:
1. **CSS Variables**: Uses Quartz theme variables for consistency
2. **Flexbox Layout**: Wraps tags on smaller screens
3. **Active State**: Clear visual distinction for selected tag
4. **Spacing**: Matches existing Quartz spacing patterns
5. **Mobile**: Slightly smaller font/padding on mobile

---

### Phase 4: Update Layout Configuration

**File**: `quartz.layout.ts`

**Changes Required**:
1. Import new component
2. Replace `Content` with `HomePageList` as `pageBody`

**Before**:
```typescript
import * as Component from "./quartz/components"

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
  // ...
}
```

**After**:
```typescript
import * as Component from "./quartz/components"
import HomePageList from "./quartz/components/HomePageList"

// Add to sharedPageComponents
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  // ... existing config
}

// No changes needed - HomePageList handles conditional rendering internally
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
  // ...
}
```

**WAIT**: This approach won't work because `pageBody` is in shared config.

**Better Approach**: Create a wrapper component that conditionally renders

**File**: `quartz/components/pages/SmartContent.tsx`

```typescript
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"
import Content from "./Content"
import HomePageList from "../HomePageList"

export default (() => {
  const SmartContent: QuartzComponent = (props: QuartzComponentProps) => {
    const { fileData } = props
    
    // Use HomePageList for home page, Content for everything else
    if (fileData.slug === "index") {
      return <HomePageList {...props} />
    } else {
      return <Content {...props} />
    }
  }
  
  // Combine CSS from both components
  SmartContent.css = Content.css
  
  return SmartContent
}) satisfies QuartzComponentConstructor
```

**Update `quartz/components/index.ts`**:
```typescript
export { default as SmartContent } from "./pages/SmartContent"
```

**Update `quartz.layout.ts`**:
```typescript
import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

// No change to existing exports, but internally we'd need to 
// modify how pageBody is set in renderPage.tsx

// OR: Simpler approach - just export HomePageList from index.ts
// and use it directly
```

**SIMPLEST APPROACH**: Export `HomePageList` from component index and use conditional in layout:

Actually, `pageBody` is set in `sharedPageComponents` at the top level in `quartz.cfg.ts`.

Let me check the actual structure...

**CORRECT APPROACH**: 
- HomePageList should be a standalone component
- Use it in `beforeBody` section with conditional rendering
- Keep default `Content` as `pageBody`
- HomePageList renders its own content + post list

**Revised**: HomePageList should be placed in `beforeBody` on home page only, and suppress default Content.

**BEST APPROACH**: Replace Content entirely using a wrapper.

**Updated Implementation**: Create `SmartContent` wrapper (as shown above).

---

### Phase 5: Export Component

**File**: `quartz/components/index.ts`

**Add**:
```typescript
export { default as HomePageList } from "./HomePageList"
```

**Note**: Need to check existing exports to follow pattern.

---

## Files to Modify/Create

### New Files to Create

1. **`quartz/components/HomePageList.tsx`**
   - Main component for home page
   - ~120 lines
   - Dependencies: PageList, path utils, jsx utils

2. **`quartz/components/scripts/tagFilter.inline.ts`**
   - Client-side filtering script
   - ~100 lines
   - Dependencies: util.ts for helper functions

3. **`quartz/components/styles/homePageList.scss`**
   - Component styles
   - ~60 lines
   - Uses Quartz CSS variables

### Files to Modify

1. **`quartz/components/index.ts`**
   - Add export for HomePageList
   - +1 line

2. **`quartz.layout.ts`**
   - Two options:
     - **Option A**: Use conditional wrapper approach (cleaner)
     - **Option B**: Replace Content in sharedPageComponents (invasive)
   - Recommend: Option A with SmartContent wrapper

### Files NOT Modified (Reference Only)

1. `quartz/components/pages/Content.tsx` - reference for structure
2. `quartz/components/PageList.tsx` - reused as-is
3. `quartz/components/TagList.tsx` - reference for tag styling
4. `quartz/components/TagContent.tsx` - reference for tag collection logic
5. `content/index.md` - content stays same

---

## Testing Plan

### Manual Testing Checklist

#### Functionality
- [ ] Home page displays "About Blog" content
- [ ] "Posts" heading appears below About section
- [ ] Tag filter bar shows "All" + all unique tags
- [ ] Clicking "All" shows all posts
- [ ] Clicking a specific tag filters posts correctly
- [ ] Only posts with selected tag are visible
- [ ] Post count is accurate after filtering
- [ ] Active tag has visual distinction (highlighted)
- [ ] Previously active tag becomes inactive

#### Navigation
- [ ] Tag links don't navigate away from home page
- [ ] Browser back/forward works correctly
- [ ] URL hash updates when selecting tag (if implemented)
- [ ] Clicking a tag link, then refreshing page maintains filter (if hash implemented)
- [ ] SPA navigation to another page, then back to home resets filter

#### Visual/UX
- [ ] Filter bar is visually distinct from post list
- [ ] Hover state shows on tag links
- [ ] Active state is clear and obvious
- [ ] Spacing/margins look balanced
- [ ] Font sizes match Quartz theme
- [ ] Colors match Quartz theme
- [ ] Mobile: filter bar wraps appropriately
- [ ] Mobile: touch targets are large enough
- [ ] Dark mode: colors remain readable

#### Edge Cases
- [ ] Page with no tags doesn't crash filter
- [ ] Tag with special characters renders correctly
- [ ] Tag with very long name doesn't break layout
- [ ] Filtering to tag with 0 posts shows empty list (no crash)
- [ ] Multiple rapid clicks don't cause issues
- [ ] JavaScript disabled: all posts visible, tags link to tag pages

#### Performance
- [ ] Filter feels instant (< 100ms)
- [ ] No visible lag with 50+ posts
- [ ] No memory leaks after multiple filters

### Automated Testing

**Unit Tests** (if Quartz has test infrastructure):
1. Tag collection logic
2. Post filtering logic
3. URL hash parsing

**Visual Regression**:
1. Screenshot of home page with "All" selected
2. Screenshot with specific tag selected
3. Mobile viewport screenshots

---

## Alternative Approaches

### Alternative 1: Server-Side Filtering (Not Recommended)

**Approach**: Generate separate static pages for each tag filter state

**Pros**:
- No JavaScript required
- Works without JS
- Better for SEO (each filter state has a URL)

**Cons**:
- Requires build-time page generation
- Quartz doesn't have built-in support for this
- Would need to modify build pipeline
- More complex implementation
- Slower UX (page reloads)

**Verdict**: ❌ Not suitable for Quartz architecture

---

### Alternative 2: Modify Content.tsx Directly (Not Recommended)

**Approach**: Add home page detection and special rendering inside `Content.tsx`

**Pros**:
- No new component file
- Simpler file structure

**Cons**:
- Violates single responsibility principle
- Makes Content.tsx harder to maintain
- Harder to disable/customize
- Less modular

**Verdict**: ❌ Too invasive, not modular enough

---

### Alternative 3: Use Search Component API (Considered)

**Approach**: Extend search functionality to include tag filtering

**Pros**:
- Leverages existing search infrastructure
- Could enable advanced queries like "tag:thoughts"
- Consistent with existing patterns

**Cons**:
- Search is in header, not above post list
- Would require significant search component modifications
- Doesn't match reference design (discrete tag buttons)
- More complex than needed

**Verdict**: ⚠️ Interesting for future enhancement, but overkill for current requirement

---

### Alternative 4: Pure CSS Filtering (Not Feasible)

**Approach**: Use CSS `:target` or checkbox hacks for filtering

**Pros**:
- No JavaScript
- Interesting technical challenge

**Cons**:
- Very hacky
- Limited UX (no active states, complex URL hashing)
- Not maintainable
- Accessibility concerns

**Verdict**: ❌ Not practical

---

### Alternative 5: URL Query Parameters (Alternative to Hash)

**Approach**: Use `?tag=thoughts` instead of `#tag=thoughts`

**Pros**:
- More semantic
- Better for analytics
- Can be server-side rendered (future-proof)

**Cons**:
- Requires `window.location.search` parsing
- More complex state management with SPA
- Might trigger page reloads in some browsers

**Verdict**: ⚠️ Consider for v2, use hash for v1 simplicity

---

## Recommended Implementation: Chosen Approach

**Hybrid Approach**: Custom Component with Smart Wrapper

1. Create `HomePageList.tsx` as full-featured home component
2. Create `tagFilter.inline.ts` for client-side interactivity  
3. Create `SmartContent.tsx` wrapper that conditionally renders HomePageList vs Content
4. Update `quartz.layout.ts` to use SmartContent (or add HomePageList to index's beforeBody)

**Rationale**:
- ✅ Modular: Easy to maintain and extend
- ✅ Non-invasive: Doesn't modify core components
- ✅ Performant: Client-side filtering is instant
- ✅ Accessible: Gracefully degrades without JS
- ✅ Themeable: Uses Quartz CSS variables
- ✅ Mobile-friendly: Responsive design

---

## Implementation Complexity Estimate

### Time Estimate
- **Phase 1** (HomePageList.tsx): 2-3 hours
- **Phase 2** (tagFilter.inline.ts): 1-2 hours
- **Phase 3** (homePageList.scss): 1 hour
- **Phase 4** (Layout updates): 30 minutes
- **Phase 5** (Testing & fixes): 2-3 hours

**Total**: 6-9 hours

### Complexity Rating
- **Overall**: Medium
- **Component Logic**: Medium (conditional rendering, tag collection)
- **Script Logic**: Medium (DOM manipulation, event handling)
- **Styling**: Low (simple flexbox layout)
- **Integration**: Low (follows Quartz patterns)

### Risk Areas
1. **SPA Navigation**: Ensuring filter resets correctly on page change
2. **Tag Collection**: Ensuring all tags are found correctly
3. **Z-index Issues**: Filter bar overlapping other elements
4. **Mobile**: Touch targets and wrapping behavior

---

## References

### External References
1. **Reference Site**: `/Users/pureicis/dev/www.remyjkim.com/`
   - `layouts/index.html` (lines 23-29)
   - `assets/css/custom.css` (lines 33-47)

### Internal References (Quartz)
1. **Component Patterns**:
   - `quartz/components/TagContent.tsx` (tag collection logic)
   - `quartz/components/PageList.tsx` (post list rendering)
   - `quartz/components/RecentNotes.tsx` (filtering pattern)
   - `quartz/components/Explorer.tsx` (script integration)

2. **Script Patterns**:
   - `quartz/components/scripts/search.inline.ts` (DOM manipulation)
   - `quartz/components/scripts/explorer.inline.ts` (event handling)
   - `quartz/components/scripts/util.ts` (helper functions)

3. **Documentation**:
   - `.ai/analysis/02_quartz_layouts_and_components.md`
   - `.ai/tasks/01_plan_migration_styling_layout.md`

---

## Success Metrics

### User-Facing Metrics
1. **Usability**: Users can filter posts in < 2 clicks
2. **Performance**: Filter applies in < 100ms
3. **Accessibility**: Keyboard navigation works
4. **Mobile**: Works on screens down to 320px width

### Technical Metrics
1. **Code Quality**: TypeScript strict mode passes
2. **Build**: No errors or warnings
3. **Bundle Size**: Script adds < 5KB to page
4. **Browser Compat**: Works in Chrome, Firefox, Safari, Edge

---

## Next Steps

1. **Review this plan** with stakeholders
2. **Decide on**: 
   - URL hash vs query parameters
   - SmartContent wrapper vs beforeBody conditional
   - Initial tag selection (All vs most recent post's tag)
3. **Create** feature branch: `feature/home-tag-filter`
4. **Implement** Phase 1-5
5. **Test** according to testing plan
6. **Deploy** to staging
7. **Review** UX and gather feedback
8. **Iterate** if needed
9. **Merge** to main

---

## Notes

### Design Decisions to Confirm
- [ ] Should "All" be the default on page load?
- [ ] Should tag filter state persist across sessions (localStorage)?
- [ ] Should we show post counts next to each tag? (e.g., "thoughts (5)")
- [ ] Should we sort tags alphabetically or by post count?
- [ ] Should we have a max number of tags shown (overflow menu)?

### Future Enhancements
- Multi-tag filtering (AND/OR logic)
- Tag search bar (if many tags)
- Tag groups/categories
- Animated filtering transitions
- Persist filter in localStorage
- Show "(X posts)" count next to each tag
- "Recently filtered" tags at top

---

**End of Task Plan**
