# ToC Mobile Border Rendering Fix

**Date:** 2025-12-13
**Issue:** Table of Contents border box appeared broken/split on mobile view
**Status:** Resolved

---

## Problem Description

When adding a border box around the Table of Contents (ToC) component on mobile, the border appeared fragmented - showing only partial segments (left vertical line at top, two corner fragments at bottom) instead of a complete rectangle.

### Visual Symptom
- Top-left: vertical line segment
- Bottom: two disconnected corner fragments
- Middle content (ToC items) displayed correctly but without surrounding border

---

## Root Cause Analysis

### The Conflict

The issue stemmed from a CSS specificity conflict between two classes applied to the same element:

1. **`.toc`** - The ToC container with `display: flex`
2. **`.mobile-only`** - Wrapper class from `MobileOnly()` component

### How MobileOnly Works

```tsx
// quartz/components/MobileOnly.tsx
const MobileOnly: QuartzComponent = (props: QuartzComponentProps) => {
  return <Component displayClass="mobile-only" {...props} />
}
```

The `displayClass` prop adds `mobile-only` to the component's root element, resulting in:
```html
<div class="toc mobile-only">...</div>
```

### The CSS Conflict

**In `base.scss`:**
```scss
.mobile-only {
  display: none;
  @media all and ($mobile) {
    display: initial;  // <-- Problem: overrides flex!
  }
}
```

**In `toc.scss`:**
```scss
.toc {
  display: flex;
  flex-direction: column;
  // ...
}
```

On mobile, `.mobile-only`'s `display: initial` was overriding `.toc`'s `display: flex`, breaking the flex layout. Without proper flex behavior, the border rendering became corrupted.

### Additional Contributing Factor

In `base.scss`, there's also a rule that affects elements containing `.overflow`:

```scss
div:has(> .overflow) {
  max-height: 100%;
  overflow-y: hidden;
}
```

Since `.toc` contains `ul.toc-content.overflow`, this rule added constraints that further complicated the rendering.

---

## Solution

Override the conflicting properties with `!important` in the mobile media query for `.toc`:

```scss
// toc.scss
.toc {
  display: flex;
  flex-direction: column;
  overflow-y: hidden;
  // ...

  // Mobile: emphasized with border box
  @media all and ($mobile) {
    display: flex !important;        // Override .mobile-only's display: initial
    overflow: visible !important;    // Override div:has(> .overflow) rule
    max-height: none !important;     // Override div:has(> .overflow) rule
    border: 1px solid var(--lightgray);
    padding: 0.75rem 1rem;
    border-radius: 5px;
    margin-top: 1rem;
    margin-bottom: 1rem;
    box-sizing: border-box;
  }
}
```

---

## Key Learnings

### 1. MobileOnly/DesktopOnly Wrapper Behavior
These wrapper components add a `displayClass` that controls visibility via `display: none` / `display: initial`. When wrapping components that rely on specific display types (flex, grid), you must ensure the wrapped component explicitly sets its display mode to override `display: initial`.

### 2. Cascading Specificity with Utility Classes
When a component class (`.toc`) and a utility class (`.mobile-only`) are on the same element, their styles merge. Properties set by both will follow CSS specificity rules, which can lead to unexpected overrides.

### 3. Generic Selectors Can Have Wide Impact
The `div:has(> .overflow)` selector in base.scss is a powerful but broad rule. Any div containing an `.overflow` child gets `overflow-y: hidden` and `max-height: 100%`, which can break layouts that need different overflow behavior.

### 4. Border Rendering Depends on Layout Mode
Border rendering in CSS is tightly coupled to the box model and display mode. When `display: flex` is overridden to `display: initial`, the element loses its flex container behavior, which can cause children to lay out incorrectly and borders to render in unexpected positions.

---

## Related Files

- `quartz/components/styles/toc.scss` - ToC styling (fixed)
- `quartz/components/MobileOnly.tsx` - Wrapper component
- `quartz/styles/base.scss` - Contains `.mobile-only` and `div:has(> .overflow)` rules
- `quartz.layout.ts` - Layout configuration placing ToC in beforeBody for mobile

---

## Prevention

When using `MobileOnly()` or `DesktopOnly()` wrappers on components that use flex/grid layouts:

1. Always explicitly set `display: flex !important` or `display: grid !important` in the component's mobile styles
2. Check for global selectors like `div:has(> .overflow)` that might affect your component
3. Test border/visual elements specifically, as they're often the first to show layout issues
