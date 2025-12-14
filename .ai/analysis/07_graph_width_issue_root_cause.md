# Root Cause Analysis: Graph Component Full Width Issue

**Date**: 2025-12-13  
**Issue**: Graph component extends horizontally beyond the content width container  
**Status**: Investigation Complete

---

## Problem Statement

**Observation**:
- Article content is properly constrained to a specific width (`max-width: 38rem`)
- Graph component (rendered in `afterBody`) spans the full horizontal width
- Graph does not respect the content width container

---

## DOM Structure Analysis

### Current HTML Structure (from `renderPage.tsx`)

```html
<div id="quartz-root" class="page">
  <div id="quartz-body">
    <!-- Left Sidebar -->
    <div class="sidebar left">...</div>
    
    <!-- Center Column -->
    <div class="center">
      <!-- Page Header -->
      <div class="page-header">
        <header>...</header>
        <div class="popover-hint">
          <!-- beforeBody components: Breadcrumbs, ArticleTitle, etc. -->
        </div>
      </div>
      
      <!-- Article Content -->
      <article>
        <!-- Main post/page content -->
      </article>
      
      <hr />
      
      <!-- Page Footer -->
      <div class="page-footer">
        <!-- afterBody components: Backlinks, Graph, PreviewDrawer -->
        <div class="backlinks">...</div>
        <div class="graph">...</div>      ← GRAPH IS HERE
        <div class="preview-drawer">...</div>
      </div>
    </div>
    
    <!-- Right Sidebar -->
    <div class="sidebar right">...</div>
    
    <!-- Footer -->
    <footer>...</footer>
  </div>
</div>
```

### Key Structural Points

1. **`.center` is NOT assigned a grid area**
   - Only its child `article` has `grid-area: grid-center`
   
2. **`.page-footer` is inside `.center`**
   - Graph component renders in `.page-footer`
   - `.page-footer` is a sibling of `<article>`, both inside `.center`

3. **Grid hierarchy**:
   ```
   #quartz-body (grid container)
   ├── .sidebar.left (grid-area: grid-sidebar-left)
   ├── .center (NO grid-area! Just a wrapper)
   │   ├── .page-header
   │   ├── article (grid-area: grid-center)
   │   └── .page-footer (NO grid-area!)
   ├── .sidebar.right (grid-area: grid-sidebar-right)
   └── footer (grid-area: grid-footer)
   ```

---

## CSS Analysis

### Base.scss Grid Layout (lines 187-301)

```scss
.page > #quartz-body {
  display: grid;
  grid-template-columns: #{map.get($desktopGrid, templateColumns)};
  grid-template-rows: #{map.get($desktopGrid, templateRows)};
  grid-template-areas: #{map.get($desktopGrid, templateAreas)};
  
  // .center div has NO grid-area assignment!
  
  & .center > article {
    grid-area: grid-center;    // Only article has grid area
  }
  
  & .center,
  & footer {
    max-width: 100%;           // .center spans FULL width
    min-width: 100%;
    margin-left: auto;
    margin-right: auto;
  }
  
  & .page-header,
  & .page-footer {
    margin-top: 1rem;          // page-footer has NO width constraint
  }
}
```

### Custom.scss Overrides (lines 88-97, 177-189)

```scss
.page > #quartz-body {
  .center {
    article {
      max-width: 38rem;        // Article content constrained
      
      @media all and ($desktop) {
        max-width: 42rem;
      }
    }
    // NOTE: .page-footer is NOT targeted here!
  }
}

// Grid column override
.page > #quartz-body {
  grid-template-columns: $sidePanelWidth auto 100px !important;
  
  .center {
    margin-right: 100px;       // Push away from right sidebar
  }
}
```

### Compiled CSS Output

```css
/* From base.scss */
.center, .page>#quartz-body footer {
  min-width: 100%;
  max-width: 100%;
  margin-left: auto;
  margin-right: auto;
}

/* From custom.scss */
.center article {
  max-width: 38rem;
}

.center {
  margin-right: 100px;
}

/* Graph has no width constraints */
.page-footer {
  margin-top: 1rem;
}
```

---

## Root Cause Breakdown

### Issue 1: `.center` Container Semantics

**Problem**: `.center` is used as a wrapper div but has conflicting width constraints:

```scss
.center {
  max-width: 100%;      // Span full grid width
  min-width: 100%;      // Enforce full grid width
  margin-right: 100px;  // But also push away from right sidebar
}
```

**Result**: `.center` tries to be both:
- Full width container (100% min/max)
- Content-constrained container (margin-right: 100px)

This creates an **inconsistent width model**.

### Issue 2: Grid Area Mismatch

**Expected Model** (what grid areas suggest):
```
grid-template-areas:
  "grid-sidebar-left grid-center grid-sidebar-right"
  "grid-sidebar-left grid-footer grid-sidebar-right"
```

**Actual DOM** (what's implemented):
```
<div class="center">              ← NO grid area (spans full width)
  <article grid-area="grid-center">...</article>
  <div class="page-footer">...</div>
</div>
```

**The grid area `grid-center` is assigned to `article`, not `.center`!**

This means:
- `article` participates in the grid layout (constrained)
- `.page-footer` does NOT participate in grid (inherits parent width)

### Issue 3: Width Inheritance Chain

**For Article** (Content component):
```
#quartz-body (grid container)
└─> .center (max-width: 100%, margin-right: 100px)
    └─> article (grid-area: grid-center, max-width: 38rem)
        ✓ Constrained to 38rem
```

**For Graph** (afterBody component):
```
#quartz-body (grid container)
└─> .center (max-width: 100%, margin-right: 100px)
    └─> .page-footer (NO grid-area, NO max-width)
        └─> .graph (inherits parent width)
            ✗ Spans full .center width minus 100px right margin
```

### Issue 4: The `max-width: 100%` Trap

From `base.scss:290-301`:
```scss
& .center,
& footer {
  max-width: 100%;
  min-width: 100%;
  margin-left: auto;
  margin-right: auto;
}
```

**Why this exists**: To ensure `.center` fills the available grid space.

**Side effect**: `.page-footer` (inside `.center`) inherits this 100% width and has no constraint.

---

## Visual Diagram

```
Desktop Grid Layout:
┌─────────────────────────────────────────────────────────────┐
│  Left Sidebar (320px)  │  Center (auto)  │  Right (100px)  │
├────────────────────────┼─────────────────┼─────────────────┤
│                        │                 │                 │
│  PageTitle             │  Header         │  SidebarNav     │
│  TOC                   │  Breadcrumbs    │                 │
│                        │  ArticleTitle   │                 │
│                        │                 │                 │
│                        │  ┌─────────┐    │                 │
│                        │  │ Article │    │                 │  ← 38rem max
│                        │  │ Content │    │                 │
│                        │  │ (38rem) │    │                 │
│                        │  └─────────┘    │                 │
│                        │                 │                 │
│                        │  <hr>           │                 │
│                        │                 │                 │
│                        │  ┌─────────────────────────────┐ │
│                        │  │ Backlinks (full width)      │ │
│                        │  └─────────────────────────────┘ │
│                        │  ┌─────────────────────────────┐ │
│                        │  │ Graph (full width) ← ISSUE  │ │  ← Full center width!
│                        │  └─────────────────────────────┘ │
│                        │                 │                 │
└────────────────────────┴─────────────────┴─────────────────┘
```

---

## Why Article is Constrained but Graph is Not

### CSS Specificity Chain

**Article** (Content component):
```scss
// From custom.scss
.page > #quartz-body .center article {
  max-width: 38rem;  // ✓ Directly targets article
}
```

**Graph** (in page-footer):
```scss
// No rule targets .page-footer or components inside it!
// Graph inherits from .center's 100% width
```

---

## Comparison: Where Components Get Width Constraints

| Component | Location | Width Constraint | Source |
|-----------|----------|------------------|--------|
| **Article** | `.center > article` | `max-width: 38rem` | `custom.scss` |
| **Backlinks** | `.page-footer > .backlinks` | None (inherits .center) | - |
| **Graph** | `.page-footer > .graph` | None (inherits .center) | - |
| **Footer** | Direct child of #quartz-body | `max-width: 100%` | `base.scss` |

---

## The Grid Layout Confusion

### Grid Template Definition (from `variables.scss`)

```scss
$desktopGrid: (
  templateRows: "auto auto auto",
  templateColumns: "#{$sidePanelWidth} auto #{$sidePanelWidth}",
  templateAreas:
    '"grid-sidebar-left grid-header grid-sidebar-right"\
      "grid-sidebar-left grid-center grid-sidebar-right"\
      "grid-sidebar-left grid-footer grid-sidebar-right"',
);
```

**Grid areas defined**:
1. `grid-header` - for page header
2. `grid-center` - for main content
3. `grid-footer` - for page footer
4. `grid-sidebar-left` - left sidebar
5. `grid-sidebar-right` - right sidebar

### Grid Area Assignments (from `base.scss`)

```scss
& .page-header {
  grid-area: grid-header;     ✓ Assigned
}

& .center > article {
  grid-area: grid-center;     ✓ Assigned
}

& footer {
  grid-area: grid-footer;     ✓ Assigned (this is the page footer <footer>, not .page-footer!)
}

& .sidebar.left {
  grid-area: grid-sidebar-left;  ✓ Assigned
}

& .sidebar.right {
  grid-area: grid-sidebar-right; ✓ Assigned
}
```

**CRITICAL FINDING**: 
- `grid-footer` is assigned to `<footer>` element (component Footer)
- `.page-footer` div (contains afterBody) has NO grid area!

---

## The Real Layout Structure

### What the Grid Thinks

```
Grid Areas:
┌──────────────┬─────────────┬──────────────┐
│ sidebar-left │ grid-header │ sidebar-right│
├──────────────┼─────────────┼──────────────┤
│ sidebar-left │ grid-center │ sidebar-right│
├──────────────┼─────────────┼──────────────┤
│ sidebar-left │ grid-footer │ sidebar-right│
└──────────────┴─────────────┴──────────────┘
```

### What the DOM Actually Has

```
DOM Children of #quartz-body:
1. .sidebar.left (grid-area: grid-sidebar-left) ✓
2. .center (NO grid-area!)
   ├─ .page-header (grid-area: grid-header) ✓
   ├─ article (grid-area: grid-center) ✓
   ├─ hr
   └─ .page-footer (NO grid-area!) ✗
3. .sidebar.right (grid-area: grid-sidebar-right) ✓
4. footer (grid-area: grid-footer) ✓
```

**KEY INSIGHT**: `.center` is just a **wrapper div** that groups header, article, and page-footer. Only specific children get grid areas.

---

## Why Graph Extends Full Width

### CSS Computation for Graph Component

```
#quartz-body {
  display: grid;
  grid-template-columns: 320px auto 100px;
}

.center {
  /* No grid-area, so it's a normal block element */
  max-width: 100%;
  min-width: 100%;
  margin-right: 100px;   /* From custom.scss override */
  
  /* Calculated width: 100% of parent minus 100px right margin */
  /* This equals: full grid width (320px + auto + 100px) - 100px */
}

.center > .page-footer {
  /* No width constraint */
  /* Inherits parent (.center) width */
  
  width: 100% of .center
       = (320px + auto + 100px) - 100px
       = 320px + auto  (spans left sidebar + center column!)
}

.center > .page-footer > .graph {
  /* No width constraint */
  /* Inherits parent (.page-footer) width */
  
  width: 100% of .page-footer
       = 320px + auto  (TOO WIDE!)
}
```

### Why Article is Different

```
.center > article {
  grid-area: grid-center;    /* Participates in grid */
  max-width: 38rem;          /* Explicit constraint */
  
  /* Grid places it in the center column */
  width: constrained to grid-center area (auto column)
       AND max-width: 38rem
       = min(auto column width, 38rem)
       = 38rem  (CORRECT!)
}
```

---

## The Fundamental Design Issue

### Quartz's Intent

The `.center` wrapper is meant to group related content, but the grid system expects **direct children** to have grid areas:

**Intended**:
```
#quartz-body (grid)
├─ Direct children get grid-area assignments
└─ Grid areas define positioning
```

**Actual**:
```
#quartz-body (grid)
├─ .sidebar.left (grid-area ✓)
├─ .center (no grid-area ✗)
│  ├─ .page-header (grid-area ✓)
│  ├─ article (grid-area ✓)
│  └─ .page-footer (no grid-area ✗)
├─ .sidebar.right (grid-area ✓)
└─ footer (grid-area ✓)
```

**Problem**: `.page-footer` doesn't participate in the grid layout, so it doesn't get constrained to a specific grid area.

---

## Width Calculation Trace

### Desktop Grid Template

```scss
// From variables.scss (after custom.scss override)
grid-template-columns: 320px auto 100px;

grid-template-areas:
  "grid-sidebar-left grid-header grid-sidebar-right"
  "grid-sidebar-left grid-center grid-sidebar-right"
  "grid-sidebar-left grid-footer grid-sidebar-right"
```

### .center Width

```scss
// From base.scss
.center {
  max-width: 100%;    // 100% of what? The grid container!
  min-width: 100%;
}

// From custom.scss override
.center {
  margin-right: 100px;  // Push away from right sidebar
}

// Computed:
.center width = 100% - 100px
              = (320px + auto + 100px) - 100px
              = 320px + auto
              = LEFT SIDEBAR WIDTH + CENTER COLUMN WIDTH
```

### .page-footer Width

```scss
// No specific rules for .page-footer

// Inherited from .center:
.page-footer {
  width: auto (fills parent)
       = 320px + auto  (FULL .center width)
}
```

### Graph Width

```scss
// From graph.scss
.graph {
  // No width constraint
}

.graph > .graph-outer {
  // No width constraint
  height: 250px;
}

// Computed:
.graph width = parent (.page-footer) width
             = 320px + auto
             = MUCH WIDER than article's 38rem!
```

---

## Verification with Actual CSS

### Compiled CSS Analysis

```css
/* .center rules */
.center {
  min-width: 100%;
  max-width: 100%;
  margin-left: auto;
  margin-right: auto;
}

.center {
  margin-right: 100px;  /* Override from custom.scss */
}

/* Article rules */
.center article {
  max-width: 38rem;     /* Article constrained */
}

/* page-footer rules */
.page-footer {
  margin-top: 1rem;     /* NO WIDTH CONSTRAINT! */
}

/* Graph rules */
.graph > .graph-outer {
  border-radius: 5px;
  border: 1px solid var(--lightgray);
  height: 250px;
  margin: 0.5em 0;
  /* NO WIDTH CONSTRAINT! */
}
```

---

## Why This Happens

### Design Pattern Mismatch

**Grid-based layout** expects direct children to have grid areas:
```
#quartz-body (grid)
└─ child (grid-area: grid-center) → constrained to center column
```

**Wrapper-based layout** groups related elements:
```
#quartz-body (grid)
└─ .center (wrapper)
   ├─ .page-header
   ├─ article
   └─ .page-footer
```

**Quartz uses both patterns**, which creates this width inconsistency:
- `article` participates in grid → constrained
- `.page-footer` doesn't participate in grid → inherits wrapper width

---

## Summary of Root Causes

### Primary Root Cause

**`.page-footer` has no grid-area assignment and no max-width constraint.**

1. `.page-footer` is inside `.center` wrapper
2. `.center` has `max-width: 100%` (spans full grid)
3. `.page-footer` inherits this width
4. Graph (inside `.page-footer`) inherits `.page-footer`'s width
5. **Result**: Graph spans the full `.center` width, which includes the left sidebar area

### Secondary Contributing Factors

1. **No width constraint on afterBody components**
   - Backlinks also has this issue
   - Any component in afterBody will be too wide

2. **`.center` serves dual purpose**
   - Wrapper for grouping (semantic)
   - Grid participant (via children)
   - Width model is inconsistent

3. **Custom.scss article constraint only targets `article`**
   - `custom.scss` adds `max-width: 38rem` to `article`
   - But doesn't constrain `.page-footer`, `.page-header`, etc.

---

## Width Comparison

| Element | Expected Width | Actual Width | Reason |
|---------|---------------|--------------|---------|
| **Article** | 38rem (~570px) | 38rem ✓ | Has grid-area + max-width |
| **Graph** | 38rem (~570px) | ~640px ✗ | No grid-area, inherits .center |
| **Backlinks** | 38rem (~570px) | ~640px ✗ | No grid-area, inherits .center |
| **.center** | Auto (center column) | 100% - 100px | No grid-area, wrapper |

**Calculated actual widths** (approximate):
- Left sidebar: 320px
- Center column (auto): ~600px
- Right sidebar: 100px
- **Total grid**: ~1020px

**Graph actual width**: 
- `.center` width = 100% - 100px = 920px
- Graph inherits = ~920px (includes left sidebar space!)

**Article actual width**:
- max-width: 38rem = 38 × 15px = 570px ✓

---

## Solution Strategies (Conceptual)

### Option 1: Constrain .page-footer
```scss
.page-footer {
  max-width: 38rem;
  margin: 0 auto;
}
```

### Option 2: Constrain afterBody components individually
```scss
.page-footer > * {
  max-width: 38rem;
  margin: 0 auto;
}
```

### Option 3: Give .page-footer a grid-area
```scss
.page-footer {
  grid-area: grid-center;  // Same as article
}
```

### Option 4: Move Graph to different location
- Put in right sidebar (not appropriate)
- Put inside article (changes semantic structure)
- Put in dedicated grid area (requires grid restructure)

---

## Recommended Solution

**Option 2: Constrain afterBody components individually**

Why:
- ✅ Minimal CSS change
- ✅ Doesn't affect grid structure
- ✅ Applies to all afterBody components (Backlinks, Graph)
- ✅ Maintains semantic HTML structure
- ✅ Centers components within .center column

---

## Conclusion

**Root Cause**: The Graph component is rendered in `.page-footer`, which:
1. Has no `grid-area` assignment
2. Has no `max-width` constraint
3. Inherits the full width of `.center` wrapper
4. `.center` has `max-width: 100%` causing it to span the entire grid width

**Impact**: Graph (and Backlinks) extend horizontally beyond the article content width, creating visual inconsistency.

**Fix**: Add `max-width: 38rem` constraint to `.page-footer` or its children to match the article width.

