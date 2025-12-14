# Task Plan 09: Fix Content Alignment Consistency

## Problem Statement

The content area has inconsistent horizontal alignment between different elements:
- **Page header** (breadcrumbs, title, meta) → **CENTERED**
- **Article body** → **LEFT-ALIGNED** (misaligned)
- **Page footer** (Graph, Backlinks) → **CENTERED**
- **`<hr>` separator** → **FULL WIDTH** (spans entire .center column)

This creates a visually jarring "monstrous alignment" where body content appears offset from the header and footer.

## Root Cause

In `/quartz/styles/custom.scss`, the `article` element was given `max-width: 38rem` to constrain its width, but **`margin-left: auto; margin-right: auto;` was not added to center it**.

### Current CSS State

```scss
// custom.scss - Current (BROKEN)
.page > #quartz-body {
  .center {
    article {
      max-width: 38rem;
      // ❌ MISSING: margin-left: auto; margin-right: auto;
    }
    
    .page-header {
      max-width: 38rem;
      margin-left: auto;
      margin-right: auto;  // ✓ CENTERED
    }
    
    .page-footer {
      max-width: 38rem;
      margin-left: auto;
      margin-right: auto;  // ✓ CENTERED
    }
  }
}
```

### HTML Structure (from renderPage.tsx)

```html
<div class="center">
  <div class="page-header">
    <Header> search bar </Header>
    <div class="popover-hint">
      Breadcrumbs, ArticleTitle, ContentMeta, TagList
    </div>
  </div>
  
  <article> body content </article>   <!-- ❌ LEFT-ALIGNED -->
  
  <hr />                              <!-- ❌ FULL WIDTH -->
  
  <div class="page-footer">
    Graph, Backlinks
  </div>
</div>
```

---

## Approach Analysis

### Approach 1: Add centering to article ✅ RECOMMENDED

**Description:** Add `margin-left: auto; margin-right: auto;` to the `article` selector.

| Metric | Value |
|--------|-------|
| Complexity | Low |
| Risk | Low |
| Lines Changed | ~4 |

**Pros:**
- Minimal change (2 lines of CSS)
- Matches existing pattern for page-header/page-footer
- Preserves centered design intent
- No HTML changes required

**Cons:**
- Need to verify no side effects on other pages

---

### Approach 2: Remove centering from page-header/page-footer ❌

**Description:** Left-align all elements by removing `margin:auto`.

| Metric | Value |
|--------|-------|
| Complexity | Low |
| Risk | Medium |

**Pros:**
- Consistent left alignment
- Simpler mental model

**Cons:**
- Changes design intent (content won't be centered)
- Left-aligned content is less common for blogs
- May look worse aesthetically

---

### Approach 3: CSS custom property for content alignment ⚠️ OPTIONAL

**Description:** Create CSS variable for consistent content styling.

| Metric | Value |
|--------|-------|
| Complexity | Medium |
| Risk | Low |

**Pros:**
- Single source of truth
- Easy to change alignment site-wide

**Cons:**
- Over-engineering for this simple fix
- Requires more refactoring

---

### Approach 4: Modify HTML structure ❌

**Description:** Wrap all content in a centered container div.

| Metric | Value |
|--------|-------|
| Complexity | High |
| Risk | High |

**Not recommended:** Requires modifying `renderPage.tsx`, may affect other components.

---

### Approach 5: Use flexbox/grid on .center ❌

**Description:** Use `justify-items` or `place-items` on `.center` container.

| Metric | Value |
|--------|-------|
| Complexity | Medium |
| Risk | Medium |

**Not recommended:** May conflict with existing grid layout and sidebar positioning.

---

## Chosen Solution: Approach 1

Add centering margins to `article` and constrain `<hr>` width to match content.

---

## Implementation Tasks

### Task 1: Add centering to article element

**File:** `/quartz/styles/custom.scss`

**Change:**
```scss
// BEFORE
article {
  max-width: 38rem;
  
  @media all and ($desktop) {
    max-width: 42rem;
  }
}

// AFTER
article {
  max-width: 38rem;
  margin-left: auto;
  margin-right: auto;
  
  @media all and ($desktop) {
    max-width: 42rem;
  }
}
```

**Verification:**
- [ ] Article body content is centered
- [ ] Alignment matches page-header (breadcrumbs, title)
- [ ] Alignment matches page-footer (Graph)

---

### Task 2: Constrain `<hr>` separator to content width

The `<hr>` between article and page-footer currently spans full `.center` width.

**File:** `/quartz/styles/custom.scss`

**Add new rule:**
```scss
.page > #quartz-body {
  .center {
    // ... existing rules ...
    
    // Constrain hr separator to match content width
    > hr {
      max-width: 38rem;
      margin-left: auto;
      margin-right: auto;
      
      @media all and ($desktop) {
        max-width: 42rem;
      }
    }
  }
}
```

**Verification:**
- [ ] `<hr>` line width matches article width
- [ ] `<hr>` is centered

---

### Task 3: Verify all content elements are consistent

**Checklist of elements in `.center` column:**

| Element | max-width | margin:auto | Status |
|---------|-----------|-------------|--------|
| `.page-header` | 38rem | ✓ | ✓ OK |
| `article` | 38rem | ❌→✓ | Fix in Task 1 |
| `> hr` | 100% | ❌→✓ | Fix in Task 2 |
| `.page-footer` | 38rem | ✓ | ✓ OK |
| `.posts-list-with-filter` | 38rem | ✓ | ✓ OK |

---

### Task 4: Build and test

**Commands:**
```bash
cd /Users/pureicis/dev/saam.kim
npx quartz build
npx quartz build --serve
```

**Test pages:**
- [ ] Home page (`/`)
- [ ] About Blog page (`/02-about-blog/`)
- [ ] Posts page (`/posts/`)
- [ ] Individual post pages
- [ ] Tag listing pages (`/tags/*`)

**Visual verification:**
- [ ] Breadcrumbs left edge aligns with body content left edge
- [ ] Title left edge aligns with body content left edge
- [ ] `<hr>` separator width matches body content width
- [ ] Graph View width matches body content width
- [ ] Backlinks width matches body content width

---

## Expected Result

All content elements within `.center` column will have:
1. **Consistent max-width:** 38rem (42rem on desktop)
2. **Centered alignment:** `margin-left: auto; margin-right: auto`
3. **Visual harmony:** All left edges align, all right edges align

```
┌────────────────────────────────────────────────────────┐
│                    .center column                       │
│  ┌──────────────────────────────────────────────────┐  │
│  │  .page-header (breadcrumbs, title, meta)         │  │
│  │  ← aligned →                                     │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  article (body content)                          │  │
│  │  ← aligned →                                     │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  ────────────────── hr ──────────────────        │  │
│  │  ← aligned →                                     │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  .page-footer (Graph, Backlinks)                 │  │
│  │  ← aligned →                                     │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

---

## Files to Modify

| File | Change |
|------|--------|
| `quartz/styles/custom.scss` | Add `margin: auto` to `article`, add `> hr` constraint |

---

## Estimated Time

- Implementation: 5 minutes
- Testing: 10 minutes
- **Total: 15 minutes**

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Side effects on other pages | Low | Low | Test multiple page types |
| Breaks mobile layout | Low | Medium | Test on mobile viewport |
| Conflicts with existing CSS | Low | Low | Use specific selectors |

---

## Rollback Plan

If issues arise, simply remove the added CSS rules:
1. Remove `margin-left: auto; margin-right: auto;` from `article`
2. Remove `> hr` rule block

---

## Status

- [x] Task 1: Add centering to article ✅
- [x] Task 2: Constrain `<hr>` separator ✅
- [x] Task 3: Verify all elements ✅
- [x] Task 4: Build and test ✅
- [x] Final verification ✅

## Implementation Complete

**Date:** 2025-01-XX
**Changes Made:**
1. Added `margin-left: auto; margin-right: auto;` to `article` selector in `custom.scss`
2. Added `> hr` rule with `max-width: 38rem` and `margin: auto` for consistent separator width

**Verification:**
- ✅ Article element now centered
- ✅ HR separator constrained to content width
- ✅ All elements have consistent alignment
- ✅ Build successful

**Result:** All content elements in `.center` column now have perfect horizontal alignment.

