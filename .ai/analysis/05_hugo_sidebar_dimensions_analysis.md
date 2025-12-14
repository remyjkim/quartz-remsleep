# Hugo Sidebar Dimensions & Positioning Analysis

**Date**: 2025-01-13  
**Purpose**: Document exact Hugo sidebar specifications for Quartz implementation

---

## Executive Summary

The Hugo site uses a **14rem (224px)** fixed-width sidebar positioned on the **right** side of the page. The sidebar is **always visible** on desktop (no toggle), with specific positioning and styling that needs to be replicated in Quartz.

---

## Hugo Sidebar Specifications

### 1. Sidebar Width

**Source**: `custom.css` (Line 10)
```css
.layout-reverse .sidebar {
  width: 14rem !important;
}
```

**Conversion**:
- `14rem` = **224px** (at 16px base font size)
- This is the **fixed width** of the sidebar on desktop

---

### 2. Sidebar Positioning

**Source**: `lanyon.css` + `custom.css`

#### Base Lanyon Positioning (Lines 444-459)
```css
.layout-reverse .sidebar {
  left: auto;
  right: -14rem;  /* Initially off-screen to the right */
}

.layout-reverse #sidebar-checkbox:checked ~ .sidebar {
  transform: translateX(-14rem);  /* Slides in from right */
}
```

#### Custom Override (Lines 5-11)
```css
.layout-reverse .sidebar {
  visibility: visible !important;
  z-index: 10;
  right: 0 !important;         /* Always at right edge */
  left: auto !important;
  width: 14rem !important;
}
```

**Result**: Sidebar is **fixed at right: 0**, always visible, no sliding animation.

---

### 3. Content Margin

**Source**: `custom.css` (Lines 13-16)
```css
.layout-reverse .wrap {
  margin-right: 14rem;
}
```

**Purpose**: Creates a **14rem right margin** on the content wrapper to prevent content from sliding under the fixed sidebar.

**Effect**: Content area has a permanent 14rem gap on the right side where the sidebar lives.

---

### 4. Sidebar Styling

#### Background Color
**Source**: `lanyon.css` (Lines 566-570)
```css
.theme-base-02 .sidebar {
  background-color: #234bc2;  /* Blue background */
}
```

#### Text Color
**Source**: `lanyon.css` (Line 174)
```css
.sidebar {
  color: rgba(255,255,255,.6);  /* Semi-transparent white */
}

.sidebar a {
  color: #fff;  /* Pure white for links */
}
```

#### Font Size
**Source**: `lanyon.css` (Line 173)
```css
.sidebar {
  font-size: .75rem;  /* 12px at 16px base */
}
```

#### Positioning Details
**Source**: `lanyon.css` (Lines 164-178)
```css
.sidebar {
  position: fixed;
  top: 0;
  bottom: 0;
  overflow-y: auto;
  font-family: "PT Sans", Helvetica, Arial, sans-serif;
}
```

---

### 5. Content Width Calculations

#### Container Max-Width
**Source**: `lanyon.css` (Lines 96-108)
```css
.container {
  max-width: 28rem;  /* Base: 448px */
}

@media (min-width: 38em) {  /* 608px */
  .container {
    max-width: 32rem;  /* 512px */
  }
}

@media (min-width: 56em) {  /* 896px */
  .container {
    max-width: 38rem;  /* 608px */
  }
}
```

#### Layout Calculation (at largest breakpoint)
```
Total viewport width: 100%
Sidebar width:        14rem (224px)
Content margin-right: 14rem (224px)
Container max-width:  38rem (608px)

Available content area = Viewport - 14rem
Content is centered within available area, maxing at 38rem
```

---

## Quartz Current Specifications

### Current Quartz Variables

**Source**: `quartz/styles/variables.scss`
```scss
$sidePanelWidth: 320px;  // 20rem at 16px base
```

**Grid Layout**:
```scss
$desktopGrid: (
  templateColumns: "#{$sidePanelWidth} auto #{$sidePanelWidth}",
  // Left: 320px, Center: auto, Right: 320px
)
```

---

## Required Changes for Quartz

### 1. Adjust Right Sidebar Width

**Change**: `320px` → `224px` (14rem)

**File**: `quartz/styles/variables.scss`
```scss
// Current
$sidePanelWidth: 320px;

// Proposed
$sidePanelWidth: 320px;  // Left sidebar (keep as is)
$rightSidePanelWidth: 224px;  // Right sidebar (Hugo's 14rem)
```

**Alternative** (if we want both sidebars the same):
Keep `$sidePanelWidth: 320px` and override just the right sidebar in `custom.scss`.

---

### 2. Right Sidebar Styling (Desktop)

**Required CSS** (in `custom.scss`):
```scss
@media all and not ($mobile) {
  .sidebar.right {
    // Match Hugo dimensions
    width: 14rem !important;  // 224px
    max-width: 14rem !important;
    min-width: 14rem !important;
    
    // Match Hugo positioning
    position: fixed;
    top: 0;
    bottom: 0;
    right: 0;
    overflow-y: auto;
    
    // Match Hugo blue theme
    background-color: #234bc2;
    
    // Match Hugo typography
    font-family: "PT Sans", Helvetica, Arial, sans-serif;
    font-size: 0.75rem;  // 12px
    color: rgba(255, 255, 255, 0.6);
    
    // Ensure proper z-index
    z-index: 10;
    
    // Padding/spacing
    padding: $topSpacing 1.5rem 2rem 1.5rem;
  }
}
```

---

### 3. Content Margin Adjustment

**Required CSS** (in `custom.scss`):
```scss
@media all and not ($mobile) {
  .page > #quartz-body {
    .center {
      // Add right margin to prevent content sliding under sidebar
      margin-right: 14rem;  // Match Hugo
      
      // Adjust max-width to match Hugo's narrower content
      max-width: 38rem;  // Hugo's largest container width
    }
  }
}
```

---

### 4. Grid Layout Adjustment

**Option A**: Modify grid to use different right sidebar width
```scss
$desktopGrid: (
  templateColumns: "#{$sidePanelWidth} auto 14rem",  // Right sidebar: 14rem
)
```

**Option B**: Keep grid as-is and use CSS overrides in `custom.scss` (recommended)

---

## Mobile Specifications (Hugo)

### Mobile Sidebar Behavior

**Source**: `lanyon.css` (Lines 180-187)
```css
@media (max-width: 40em) {  /* 640px */
  .sidebar {
    left: 0;
    width: 100%;
    font-size: .75rem;
    position: relative;
  }
}
```

**Hugo Mobile Behavior**:
- Sidebar slides in from left (originally)
- Full-width overlay
- Toggle button at top-left

**Quartz Mobile Behavior** (as implemented):
- Drawer slides down from top
- Blue background matching desktop
- Menu button at top-right
- Backdrop overlay

**Decision**: Keep Quartz implementation (top drawer) as it's more modern and UX-friendly.

---

## Comparison Table

| Specification | Hugo | Quartz (Current) | Required Change |
|---------------|------|------------------|-----------------|
| **Desktop Width** | 14rem (224px) | 20rem (320px) | ✅ Change to 14rem |
| **Position** | Fixed, right: 0 | Grid-based | ✅ Add fixed positioning |
| **Background** | #234bc2 (blue) | Variable | ✅ Already set |
| **Font Size** | 0.75rem (12px) | Inherited | ✅ Set to 0.75rem |
| **Text Color** | rgba(255,255,255,0.6) | Variable | ✅ Set white |
| **Overflow** | auto (scrollable) | auto | ✅ Already correct |
| **Content Margin** | 14rem right | None | ✅ Add margin |
| **Z-index** | 10 | Variable | ✅ Set to 10 |

---

## Implementation Priority

### High Priority (Must Match)
1. ✅ **Width**: 14rem (224px) - **CRITICAL**
2. ✅ **Background Color**: #234bc2
3. ✅ **Content Margin**: 14rem right margin
4. ✅ **Font Size**: 0.75rem

### Medium Priority (Should Match)
5. ✅ **Fixed Positioning**: position: fixed, right: 0
6. ✅ **Text Color**: White/semi-transparent white
7. ✅ **Overflow**: Scrollable (overflow-y: auto)

### Low Priority (Nice to Have)
8. ⚠️ **Grid Adjustment**: Modify grid columns (can use CSS override)
9. ⚠️ **Z-index**: Explicit z-index: 10

---

## Pixel-Perfect Measurements

### At 16px Base Font Size

| Element | Hugo | Calculation |
|---------|------|-------------|
| Sidebar Width | 14rem | 14 × 16px = **224px** |
| Container (Base) | 28rem | 28 × 16px = **448px** |
| Container (38em+) | 32rem | 32 × 16px = **512px** |
| Container (56em+) | 38rem | 38 × 16px = **608px** |
| Sidebar Font | 0.75rem | 0.75 × 16px = **12px** |

### At 15px Base Font Size (Hugo body)

Hugo uses `15px` base font size in `lanyon.css` (line 41):
```css
html, body {
  font-size: 15px;
}
```

| Element | Calculation |
|---------|-------------|
| Sidebar Width | 14 × 15px = **210px** |
| Container (56em+) | 38 × 15px = **570px** |

**Note**: The `rem` unit is based on root (html) font size. If Hugo's root is 15px, then:
- `14rem` = **210px** (not 224px)

Need to verify Hugo's actual root font size for accurate pixel conversion.

---

## Content Area Calculation

### Hugo Layout (Desktop)
```
┌─────────────────────────────────────────────────────┐
│                                           │         │
│          Content Area                     │ Sidebar │
│          (max-width: 38rem/570px)         │ 14rem   │
│          margin-right: 14rem              │ 210px   │
│                                           │         │
│                                           │ Fixed   │
│                                           │ Blue    │
│                                           │ #234bc2 │
│                                           │         │
└─────────────────────────────────────────────────────┘
```

### Quartz Layout (Current Desktop)
```
┌─────────────────────────────────────────────────────┐
│         │                               │           │
│  Left   │      Content Area             │   Right   │
│ Sidebar │      (auto width)             │  Sidebar  │
│ 320px   │                               │  320px    │
│         │                               │           │
│  TOC    │                               │ Explorer  │
│         │                               │ Backlinks │
│         │                               │           │
└─────────────────────────────────────────────────────┘
```

**Differences**:
1. Quartz has **both** left and right sidebars (Hugo only has right)
2. Quartz right sidebar is **320px** (Hugo is 210-224px)
3. Quartz uses **grid layout** (Hugo uses fixed + margin)

---

## Recommended Implementation Strategy

### Approach: CSS Overrides in `custom.scss`

**Rationale**:
- Don't modify Quartz core variables (maintains upgrade path)
- Use CSS specificity to override only what's needed
- Keep grid layout intact, adjust visually

**Implementation**:
```scss
// In custom.scss
@media all and not ($mobile) {
  // Override right sidebar width
  .sidebar.right {
    width: 14rem !important;
    min-width: 14rem !important;
    max-width: 14rem !important;
    
    // Override grid placement with fixed positioning
    position: fixed !important;
    right: 0 !important;
    top: 0 !important;
    bottom: 0 !important;
    
    // Other Hugo styling...
  }
  
  // Adjust grid to account for fixed sidebar
  .page > #quartz-body {
    grid-template-columns: $sidePanelWidth auto 14rem !important;
  }
  
  // Add content margin
  .center {
    margin-right: 14rem;
  }
}
```

---

## Testing Checklist

### Desktop (>1200px)
- [ ] Right sidebar is exactly **14rem (224px)** wide
- [ ] Sidebar has blue background (#234bc2)
- [ ] Sidebar is fixed at right edge (right: 0)
- [ ] Sidebar is scrollable when content overflows
- [ ] Content has 14rem right margin
- [ ] Content doesn't slide under sidebar
- [ ] Font size is 0.75rem in sidebar
- [ ] Text is white/semi-transparent white
- [ ] Explorer and Backlinks visible and functional

### Mobile (<800px)
- [ ] Drawer slides from top (existing implementation)
- [ ] Drawer has blue background
- [ ] Menu button at top-right
- [ ] Backdrop overlay appears
- [ ] No desktop sidebar visible

### Tablet (800px-1200px)
- [ ] Layout transitions smoothly
- [ ] Sidebar behavior appropriate for tablet
- [ ] No breaking at breakpoints

---

## Conclusion

The Hugo sidebar is **14rem (224px)** wide, fixed to the right edge, with a blue background (#234bc2) and white text. The content area has a 14rem right margin to prevent overlap. 

Quartz currently uses 320px for both sidebars. To match Hugo exactly, we need to:
1. Change right sidebar width to 14rem
2. Add fixed positioning
3. Add content right margin
4. Ensure font sizes and colors match

All changes can be implemented via `custom.scss` overrides without modifying core Quartz files.

