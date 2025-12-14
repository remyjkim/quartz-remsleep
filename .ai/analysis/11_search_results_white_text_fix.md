# Search Results White Text on White Background Fix

## Issue
Search results displayed white text on a white background in light mode, making the text invisible.

## Root Cause Analysis

### The Problem Chain
1. The Search component is placed inside `.sidebar.right` in the DOM hierarchy (via SidebarNav)
2. Custom styling in `custom.scss` applies white text colors to sidebar elements:
   ```scss
   .sidebar.right {
     a { color: #fff; }
     h1, h2, h3, h4, h5, h6, p, span, li { color: rgba(255, 255, 255, 0.9); }
   }
   ```
3. The search modal uses `position: fixed` to overlay the entire viewport, BUT it remains a DOM child of `.sidebar.right`
4. CSS inheritance follows the DOM tree, not visual positioning - so all anchor, heading, and paragraph elements inside the search modal inherit white colors

### Why Initial Fixes Failed

**Attempt 1**: Add `color: var(--dark)` to `.search-container`
- Failed because this only sets inherited color, but `.sidebar.right a` and `.sidebar.right h3` etc. have explicit rules that override inheritance

**Attempt 2**: Add `color: var(--dark)` to `.result-card`
- Partially worked but failed because child elements (`<h3>`, `<p>`) still matched `.sidebar.right h3` and `.sidebar.right p` selectors

**Attempt 3**: Add `color: var(--dark) !important` to `.result-card`
- Still failed for the same reason - the `!important` only applies to the anchor element, not its children

### CSS Specificity Issue
The compiled CSS order also played a role:
- `search.scss` rules compiled to line ~212
- `custom.scss` rules compiled to line ~439
- With similar specificity, later rules win in CSS cascade

## The Fix

In `quartz/components/styles/search.scss`:

### 1. Results Container (left panel)

```scss
& a.result-card {
  // ... other styles ...
  color: var(--dark) !important;  // Override .sidebar.right a

  & > h3 {
    margin: 0;
    color: inherit;  // Inherit from parent instead of .sidebar.right h3
  }

  & > p {
    margin-bottom: 0;
    color: inherit;  // Inherit from parent instead of .sidebar.right p
  }
}
```

### 2. Preview Container (right panel)

The preview container loads actual page content (headings, paragraphs, links, etc.) which also needed the same fix:

```scss
& > .preview-container {
  // ... other styles ...
  color: var(--dark) !important;

  // Reset all text colors to inherit from container
  h1, h2, h3, h4, h5, h6, p, span, li, a {
    color: inherit;
  }
}
```

### Key Insight
Using `color: inherit` on child elements forces them to inherit from their direct parent rather than matching broader selectors like `.sidebar.right h3`. Combined with `!important` on the parent, this ensures the correct color cascades down.

## Files Modified
- `quartz/components/styles/search.scss` (lines 161, 168-170, 194, 214, 244)

## Lessons Learned

1. **Position fixed doesn't break CSS inheritance**: Even though an element is visually positioned outside its parent, CSS inheritance follows the DOM tree

2. **Child elements need explicit reset**: Setting a color on a parent doesn't override explicit rules targeting child element types (like `h3`, `p`)

3. **`color: inherit` is powerful**: It forces an element to inherit from its direct parent, bypassing broader type-based selectors

4. **CSS cascade order matters**: When specificity is equal, the rule that appears later wins. Custom stylesheets loading after component stylesheets can override component styles

5. **Debug by checking child elements**: When text color appears wrong, check if the visible text is in child elements that might have their own color rules
