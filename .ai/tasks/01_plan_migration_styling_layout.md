# Component Modification Analysis: Quartz Layout Reorganization

## Target Layout

**Desired Layout:**
- **Right Sidebar**: Explorer (file/folder navigation)
- **Left Sidebar**: TableOfContents (page TOC)
- **Center Body**: Graph view at bottom (in `afterBody`)
- **Top of Page (Header)**: Search bar

**Current Layout:**
- **Left Sidebar**: PageTitle, Search, Darkmode, ReaderMode, Explorer
- **Right Sidebar**: Graph, TableOfContents, Backlinks
- **Header**: Empty

---

## Component Modification Analysis

### 1. Explorer Component

**Current Location**: Left sidebar  
**Target Location**: Right sidebar  
**Component File**: `quartz/components/Explorer.tsx`  
**Style File**: `quartz/components/styles/explorer.scss`

#### ✅ Component Code: NO MODIFICATION NEEDED
- Component is sidebar-agnostic
- Works in any sidebar position
- No hardcoded position references in component code

#### ⚠️ Style File: MODIFICATION REQUIRED

**File**: `quartz/components/styles/explorer.scss`

**Issues Found:**

1. **Mobile Sidebar Selectors** (Lines 6, 9, 15):
   ```scss
   // Current (assumes left sidebar)
   & > :not(.sidebar.left:has(.explorer)) { ... }
   &.lock-scroll > :not(.sidebar.left:has(.explorer)) { ... }
   .sidebar.left:has(.explorer) { ... }
   ```
   
   **Problem**: These selectors assume Explorer is in left sidebar
   **Solution**: Change to `.sidebar.right:has(.explorer)` for right sidebar

2. **Mobile Transform Direction** (Line 10):
   ```scss
   transform: translateX(100dvw);  // Slides right (for left sidebar)
   ```
   
   **Problem**: This slides content right, assuming explorer is on left
   **Solution**: May need to change to `translateX(-100dvw)` for right sidebar, or adjust logic

3. **Mobile Explorer Content Position** (Line 242):
   ```scss
   left: 0;  // Positions from left edge
   ```
   
   **Problem**: Mobile overlay positions from left
   **Solution**: May need to change to `right: 0` for right sidebar, or keep as-is if overlay is full-width

**Required Changes:**

```scss
// In explorer.scss - Update mobile selectors
@media all and ($mobile) {
  .page > #quartz-body {
    // Change from .sidebar.left to .sidebar.right
    & > :not(.sidebar.right:has(.explorer)) {
      transition: transform 300ms ease-in-out;
    }
    &.lock-scroll > :not(.sidebar.right:has(.explorer)) {
      // May need to adjust transform direction
      transform: translateX(-100dvw);  // Changed from 100dvw
      transition: transform 300ms ease-in-out;
    }

    // Change from .sidebar.left to .sidebar.right
    .sidebar.right:has(.explorer) {
      box-sizing: border-box;
      position: sticky;
      background-color: var(--light);
      padding: 1rem 0 1rem 0;
      margin: 0;
    }
  }
}
```

**Alternative Approach**: Override in `custom.scss` instead of modifying component file (recommended to avoid core file changes)

---

### 2. TableOfContents Component

**Current Location**: Right sidebar (desktop only)  
**Target Location**: Left sidebar  
**Component File**: `quartz/components/TableOfContents.tsx`  
**Style File**: `quartz/components/styles/toc.scss`

#### ✅ Component Code: NO MODIFICATION NEEDED
- Component is sidebar-agnostic
- No position-specific logic
- Works in any sidebar

#### ✅ Style File: NO MODIFICATION NEEDED
- Styles are sidebar-agnostic
- No `.sidebar.left` or `.sidebar.right` references
- Will work fine in left sidebar

**Action**: Just move component in layout configuration

---

### 3. Graph Component

**Current Location**: Right sidebar  
**Target Location**: `afterBody` (center column, bottom)  
**Component File**: `quartz/components/Graph.tsx`  
**Style File**: `quartz/components/styles/graph.scss`

#### ✅ Component Code: NO MODIFICATION NEEDED
- Component works anywhere
- No sidebar-specific logic
- Fixed overlay positioning works from any location

#### ✅ Style File: NO MODIFICATION NEEDED
- Styles are location-agnostic
- Fixed overlay (`position: fixed`) works from any container
- Will work fine in center column

**Action**: Just move component to `afterBody` in layout configuration

---

### 4. Search Component

**Current Location**: Left sidebar (in Flex container)  
**Target Location**: Header (top of page)  
**Component File**: `quartz/components/Search.tsx`  
**Style File**: `quartz/components/styles/search.scss`

#### ✅ Component Code: NO MODIFICATION NEEDED
- Component works anywhere
- Fixed overlay positioning (`position: fixed`) works from any location
- No sidebar-specific logic

#### ⚠️ Style File: POTENTIAL ADJUSTMENT NEEDED

**File**: `quartz/components/styles/search.scss`

**Current Styles:**
```scss
.search {
  min-width: fit-content;
  max-width: 14rem;  // Constrained width for sidebar
  @media all and ($mobile) {
    flex-grow: 0.3;
  }
}
```

**Considerations:**
- `max-width: 14rem` may be too narrow for header
- Header uses horizontal flex layout (`flex-direction: row`)
- May need wider width or flex-grow for header

**Potential Changes:**

```scss
// Option 1: Override in custom.scss for header context
header .search {
  max-width: none;
  flex: 1 1 auto;  // Allow to grow in header
}

// Option 2: No change needed if current width is acceptable
```

**Recommendation**: Test first, then adjust if needed. The fixed overlay will work fine regardless.

---

## Summary: Required Modifications

### Components Requiring Code Changes: **0**
All components are sidebar/location-agnostic and work anywhere.

### Style Files Requiring Changes: **1**

1. **`quartz/components/styles/explorer.scss`** ⚠️ **REQUIRED**
   - Update mobile selectors from `.sidebar.left` to `.sidebar.right`
   - Adjust transform direction for right sidebar
   - **OR** override in `custom.scss` (recommended)

### Style Files Needing Potential Adjustments: **1**

2. **`quartz/components/styles/search.scss`** ⚠️ **OPTIONAL**
   - May need width adjustment for header layout
   - Can be handled via `custom.scss` override

### Layout Configuration Changes: **Required**

**File**: `quartz.layout.ts`

**Changes Needed:**
- Move `Explorer` from `left` to `right`
- Move `TableOfContents` from `right` to `left`
- Move `Graph` from `right` to `afterBody` (in `sharedPageComponents`)
- Move `Search` from `left` Flex container to `header` array

---

## Recommended Approach

### Option A: Minimal Core Changes (Recommended)

**Strategy**: Override Explorer mobile styles in `custom.scss` instead of modifying component file

**Advantages:**
- No core file modifications
- Easier to maintain
- Follows Quartz customization pattern

**Implementation:**
```scss
// In custom.scss
@media all and ($mobile) {
  // Override Explorer mobile styles for right sidebar
  .page > #quartz-body {
    & > :not(.sidebar.right:has(.explorer)) {
      transition: transform 300ms ease-in-out;
    }
    &.lock-scroll > :not(.sidebar.right:has(.explorer)) {
      transform: translateX(-100dvw);
      transition: transform 300ms ease-in-out;
    }

    .sidebar.right:has(.explorer) {
      box-sizing: border-box;
      position: sticky;
      background-color: var(--light);
      padding: 1rem 0 1rem 0;
      margin: 0;
    }
  }
}

// Adjust Search width for header if needed
header .search {
  max-width: none;
  flex: 1 1 auto;
}
```

### Option B: Modify Component File

**Strategy**: Directly modify `explorer.scss` to support right sidebar

**Disadvantages:**
- Modifies core Quartz file
- May be overwritten on updates
- Not recommended per Quartz best practices

---

## Implementation Checklist

### Phase 1: Layout Configuration
- [ ] Update `quartz.layout.ts`
  - [ ] Move `Explorer` to `right` array
  - [ ] Move `TableOfContents` to `left` array
  - [ ] Move `Graph` to `afterBody` in `sharedPageComponents`
  - [ ] Move `Search` to `header` array
  - [ ] Update both `defaultContentPageLayout` and `defaultListPageLayout`

### Phase 2: Style Overrides
- [ ] Add Explorer mobile style overrides to `custom.scss`
  - [ ] Update `.sidebar.left` to `.sidebar.right` selectors
  - [ ] Adjust transform direction if needed
- [ ] Add Search header width adjustments to `custom.scss` (if needed)

### Phase 3: Testing
- [ ] Test desktop layout
  - [ ] Explorer appears in right sidebar
  - [ ] TOC appears in left sidebar
  - [ ] Graph appears at bottom of content
  - [ ] Search appears in header
- [ ] Test tablet layout
- [ ] Test mobile layout
  - [ ] Explorer mobile overlay works correctly
  - [ ] Search works in header
  - [ ] Layout doesn't break

---

## Detailed Layout Configuration

### Updated `quartz.layout.ts`

```typescript
import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [
    // Search bar at top of page
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
        { Component: Component.ReaderMode() },
      ],
    }),
  ],
  afterBody: [
    // Graph view at bottom of content
    Component.Graph(),
  ],
  footer: Component.Footer({
    links: {
      GitHub: "https://github.com/remyjkim",
    },
  }),
}

// components for pages that display a single page (e.g. a single note)
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
    // TableOfContents moved here
    Component.DesktopOnly(Component.TableOfContents()),
  ],
  right: [
    // Explorer moved here
    Component.Explorer(),
    // Backlinks remain in right sidebar
    Component.Backlinks(),
  ],
}

// components for pages that display lists of pages (e.g. tags or folders)
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
    Component.Explorer(),
  ],
}
```

---

## Custom SCSS Overrides

### Required Overrides in `custom.scss`

```scss
@use "./base.scss";

// ============================================
// Explorer: Right Sidebar Mobile Overrides
// ============================================

@media all and ($mobile) {
  .page > #quartz-body {
    // Update selectors for right sidebar
    & > :not(.sidebar.right:has(.explorer)) {
      transition: transform 300ms ease-in-out;
    }
    
    &.lock-scroll > :not(.sidebar.right:has(.explorer)) {
      // Transform direction adjusted for right sidebar
      transform: translateX(-100dvw);
      transition: transform 300ms ease-in-out;
    }

    // Sticky top bar for right sidebar
    .sidebar.right:has(.explorer) {
      box-sizing: border-box;
      position: sticky;
      background-color: var(--light);
      padding: 1rem 0 1rem 0;
      margin: 0;
    }
  }
}

// ============================================
// Search: Header Layout Adjustments
// ============================================

header .search {
  // Allow search to grow in header
  max-width: none;
  flex: 1 1 auto;
  min-width: 200px; // Minimum usable width
}

// Ensure header flex layout works well
header {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1rem;
  width: 100%;
}
```

---

## Component Modification Summary

| Component | Location Change | Code Mod | Style Mod | Notes |
|-----------|----------------|----------|-----------|-------|
| **Explorer** | Left → Right | ❌ None | ⚠️ **Required** | Mobile selectors need update |
| **TableOfContents** | Right → Left | ❌ None | ❌ None | Works as-is |
| **Graph** | Right → afterBody | ❌ None | ❌ None | Works as-is |
| **Search** | Left → Header | ❌ None | ⚠️ Optional | May need width adjustment |

---

## Testing Requirements

### Desktop Testing (>1200px)
- [ ] Explorer visible in right sidebar
- [ ] TOC visible in left sidebar
- [ ] Graph appears at bottom of content (after `<hr />`)
- [ ] Search bar visible in header (top of page)
- [ ] All components functional

### Tablet Testing (800px - 1200px)
- [ ] Layout adapts correctly
- [ ] Components remain accessible
- [ ] No overlap issues

### Mobile Testing (<800px)
- [ ] Explorer mobile overlay works correctly
  - [ ] Toggle button appears
  - [ ] Overlay slides in/out correctly
  - [ ] Page transform works (slides left when explorer opens)
- [ ] Search works in header
- [ ] TOC accessible (if shown on mobile)
- [ ] Graph displays correctly

---

## Risk Assessment

### Low Risk Changes
- ✅ Moving TableOfContents (no modifications needed)
- ✅ Moving Graph (no modifications needed)
- ✅ Moving Search to header (minor style adjustment)

### Medium Risk Changes
- ⚠️ Moving Explorer to right sidebar
  - **Risk**: Mobile overlay behavior may need adjustment
  - **Mitigation**: Test thoroughly on mobile, override styles in `custom.scss`

### Potential Issues
1. **Explorer Mobile Overlay**: Transform direction may need fine-tuning
2. **Search Width**: May be too narrow in header, needs testing
3. **Header Layout**: May need flex adjustments for proper alignment

---

## Conclusion

**Total Components Needing Code Changes**: **0**  
**Total Style Files Needing Changes**: **1** (Explorer - mobile selectors)  
**Total Style Files Needing Optional Adjustments**: **1** (Search - header width)

**Recommended Approach**: Use `custom.scss` overrides for Explorer mobile styles, avoiding core file modifications. This follows Quartz best practices and maintains update compatibility.
